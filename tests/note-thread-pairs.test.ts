import { describe, expect, it } from "vitest";
import { SubNote } from "../src/types";
import { pairThreadSubNotes } from "../src/features/notes/threadPairs";

const subNote = (id: string, isAssistant: boolean): SubNote => ({
  id,
  content: id,
  createdAt: "",
  isAssistant,
});

describe("note thread pairing", () => {
  it("pairs adjacent user and assistant entries while preserving unanswered entries", () => {
    const firstUser = subNote("question-1", false);
    const firstAssistant = subNote("answer-1", true);
    const unanswered = subNote("question-2", false);

    expect(pairThreadSubNotes([firstUser, firstAssistant, unanswered])).toEqual(
      [
        { userSub: firstUser, assistantSub: firstAssistant },
        { userSub: unanswered },
      ],
    );
  });

  it("keeps orphan assistant entries visible and does not mutate the source list", () => {
    const entries = [
      subNote("orphan", true),
      subNote("question", false),
      subNote("answer", true),
    ];

    expect(pairThreadSubNotes(entries)).toEqual([
      { assistantSub: entries[0] },
      { userSub: entries[1], assistantSub: entries[2] },
    ]);
    expect(entries).toHaveLength(3);
  });
});
