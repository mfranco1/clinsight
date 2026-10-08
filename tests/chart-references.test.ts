import { describe, expect, it } from "vitest";
import { parseReferenceList } from "../features/chart/references";

describe("parseReferenceList", () => {
  it("trims blank lines and removes existing numeric or bullet prefixes", () => {
    expect(
      parseReferenceList(
        " [1] First source \n\n2. Second source\n- Third source\n* Fourth source ",
      ),
    ).toEqual([
      "First source",
      "Second source",
      "Third source",
      "Fourth source",
    ]);
  });

  it("preserves reference text that has no list marker", () => {
    expect(parseReferenceList("Consensus guideline; 2025 update")).toEqual([
      "Consensus guideline; 2025 update",
    ]);
  });
});
