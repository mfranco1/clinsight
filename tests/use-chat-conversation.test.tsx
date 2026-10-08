import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendChatMessage } from "../services/ai/actions";
import { sendNotification } from "../services/notificationService";
import { useChatConversation } from "../features/chat/useChatConversation";
import { FileUpload } from "../types";

vi.mock("../services/ai/actions", () => ({ sendChatMessage: vi.fn() }));
vi.mock("../services/notificationService", () => ({
  sendNotification: vi.fn(),
}));

describe("useChatConversation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the current user turn with attachments and appends the assistant reply", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      text: "A clinical answer",
      title: "",
      groundingSources: [],
    });
    const { result } = renderHook(() =>
      useChatConversation({ model: "model-1", chartData: null, isOpen: true }),
    );
    const attachment = {
      file: new File(["sample"], "sample.png"),
      base64: "",
      mimeType: "image/png",
    } satisfies FileUpload;

    await act(async () => result.current.sendMessage("Question", [attachment]));

    expect(sendChatMessage).toHaveBeenCalledWith(
      "model-1",
      [],
      "Question",
      null,
      true,
      expect.any(AbortSignal),
      [attachment],
    );
    expect(result.current.messages).toMatchObject([
      { role: "user", text: "Question", attachments: [attachment] },
      {
        role: "model",
        text: "A clinical answer",
        title: "Clinical Conversation",
      },
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it("appends the existing error message on failure and retries the preceding user turn", async () => {
    vi.mocked(sendChatMessage)
      .mockRejectedValueOnce(new Error("provider error"))
      .mockResolvedValueOnce({
        text: "Recovered",
        title: "Retry",
        groundingSources: [],
      });
    const { result } = renderHook(() =>
      useChatConversation({ model: "model-1", chartData: null, isOpen: true }),
    );

    await act(async () => result.current.sendMessage("Retry me", []));
    expect(result.current.messages[1]).toMatchObject({
      isError: true,
      text: "Sorry, I encountered an error processing your request.",
    });

    await act(async () => result.current.retryMessage(1));

    expect(sendChatMessage).toHaveBeenLastCalledWith(
      "model-1",
      [],
      "Retry me",
      null,
      true,
      expect.any(AbortSignal),
      undefined,
    );
    expect(result.current.messages).toMatchObject([
      { role: "user", text: "Retry me" },
      { role: "model", text: "Recovered", title: "Retry" },
    ]);
  });

  it("aborts an active request when cancelled without adding a failure message", async () => {
    let observedSignal: AbortSignal | undefined;
    vi.mocked(sendChatMessage).mockImplementation(
      (_model, _history, _message, _chart, _search, signal) => {
        observedSignal = signal;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      },
    );
    const { result } = renderHook(() =>
      useChatConversation({ model: "model-1", chartData: null, isOpen: true }),
    );
    let pending!: Promise<void>;

    act(() => {
      pending = result.current.sendMessage("Cancel me", []);
    });
    act(() => result.current.cancel());
    await act(async () => pending);

    expect(observedSignal?.aborted).toBe(true);
    expect(result.current.messages).toEqual([
      { role: "user", text: "Cancel me", attachments: undefined },
    ]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("notifies when an assistant response arrives while the panel is closed", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      text: "A response",
      groundingSources: [],
    });
    const { result } = renderHook(() =>
      useChatConversation({ model: "model-1", chartData: null, isOpen: false }),
    );

    await act(async () => result.current.sendMessage("Question", []));

    expect(sendNotification).toHaveBeenCalledWith(
      "New Message from Clinical Assistant",
      {
        body: "A response",
        tag: "chat-response",
      },
    );
  });
});
