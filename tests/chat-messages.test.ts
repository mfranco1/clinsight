import { describe, expect, it } from "vitest";
import { ChatMessage } from "../src/types";
import {
  createAssistantChatMessage,
  createChatErrorMessage,
  getChatRetryContext,
} from "../src/features/chat/messages";

describe("chat message helpers", () => {
  it("applies the established assistant title fallback and retains grounding sources", () => {
    const sources = [{ title: "Reference", uri: "https://example.test" }];
    expect(
      createAssistantChatMessage({
        text: "Answer",
        title: "",
        groundingSources: sources,
      }),
    ).toEqual({
      role: "model",
      text: "Answer",
      title: "Clinical Conversation",
      groundingSources: sources,
    });
  });

  it("creates the existing retryable error message", () => {
    expect(createChatErrorMessage()).toMatchObject({
      role: "model",
      text: "Sorry, I encountered an error processing your request.",
      isError: true,
    });
  });

  it("retries from the nearest preceding user message with only earlier history", () => {
    const messages: ChatMessage[] = [
      { role: "user", text: "first" },
      { role: "model", text: "first answer" },
      { role: "user", text: "retry this", attachments: [] },
      { role: "model", text: "error", isError: true },
    ];

    expect(getChatRetryContext(messages, 3)).toEqual({
      userMessage: messages[2],
      history: messages.slice(0, 2),
    });
    expect(
      getChatRetryContext([{ role: "model", text: "error" }], 0),
    ).toBeNull();
  });
});
