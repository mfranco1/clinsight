import { beforeEach, describe, expect, it, vi } from "vitest";
import { PatientNote } from "../src/types";
import { sendNoteThreadMessage } from "../src/services/ai/actions";
import { sendThreadInquiry } from "../src/features/notes/sendThreadInquiry";

vi.mock("../src/services/ai/actions", () => ({
  sendNoteThreadMessage: vi.fn(),
}));

const note: PatientNote = {
  id: "note-1",
  title: "Clinical note",
  content: "Assessment content",
  createdAt: "2026-01-01 08:00",
  updatedAt: "2026-01-01 08:00",
  subNotes: [
    {
      id: "prior",
      content: "Earlier question",
      createdAt: "2026-01-01 08:01",
      isAssistant: false,
    },
  ],
};

describe("sendThreadInquiry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("optimistically appends the user query and includes highlighted context in the shared request", async () => {
    vi.mocked(sendNoteThreadMessage).mockResolvedValue({
      text: "Grounded answer",
      groundingSources: [],
    });
    const onOptimisticUpdate = vi.fn();
    const attachment = { id: "file-1", name: "photo.jpg" } as never;

    const result = await sendThreadInquiry({
      note,
      query: "Explain this section",
      attachments: [attachment],
      highlightedText: "selected clinical text",
      onOptimisticUpdate,
    });

    expect(onOptimisticUpdate).toHaveBeenCalledOnce();
    const [optimisticSubNotes, userSubNote] = onOptimisticUpdate.mock.calls[0];
    expect(optimisticSubNotes).toHaveLength(2);
    expect(userSubNote).toMatchObject({
      content: "Explain this section",
      highlightedText: "selected clinical text",
      attachments: [attachment],
    });
    expect(sendNoteThreadMessage).toHaveBeenCalledWith(
      undefined,
      [{ role: "user", text: "Earlier question", groundingSources: undefined }],
      "Explain this section",
      note.content,
      note.title,
      "selected clinical text",
      undefined,
      undefined,
      [attachment],
    );
    expect(result.subNotes.at(-1)).toMatchObject({
      content: "Grounded answer",
      isAssistant: true,
    });
    expect(result.updatedAt).toBeTruthy();
  });

  it("preserves the established fallback assistant reply when the AI request fails", async () => {
    vi.mocked(sendNoteThreadMessage).mockRejectedValue(
      new Error("provider failure"),
    );

    const result = await sendThreadInquiry({
      note,
      query: "Question",
      attachments: [],
      onOptimisticUpdate: vi.fn(),
    });

    expect(result.subNotes.at(-1)).toMatchObject({
      content:
        "Sorry, I ran into an error trying to process this question. Please try again.",
      isAssistant: true,
    });
    expect(result.updatedAt).toBeUndefined();
  });
});
