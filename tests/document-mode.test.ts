import { describe, expect, it } from "vitest";
import {
  checkDocumentModeEligibility,
  parseDocumentMarkdown,
  serializeDocumentMarkdown,
} from "../src/components/ui/editor/documentMode";

describe("document mode fidelity gate", () => {
  it("permits an exact round trip for the verified Markdown subset", () => {
    const source =
      "## Visit\n\nVitals **stable** with `SpO2 96%`.\n\n- Item A\n- Item B";

    expect(checkDocumentModeEligibility(source)).toEqual({ supported: true });
    expect(serializeDocumentMarkdown(parseDocumentMarkdown(source))).toBe(
      source,
    );
  });

  it.each([
    ["math", "Assessment: $a^2+b^2=c^2$"],
    ["raw HTML", "Assessment: <u>reviewed</u>"],
  ])(
    "keeps %s in source mode when conversion is not exact",
    (_name, source) => {
      expect(checkDocumentModeEligibility(source).supported).toBe(false);
    },
  );

  it("does not progressively rewrite an eligible document after repeated mode switches", () => {
    const source = "# Plan\n\nContinue **routine** observation.";
    const firstRoundTrip = serializeDocumentMarkdown(
      parseDocumentMarkdown(source),
    );
    const secondRoundTrip = serializeDocumentMarkdown(
      parseDocumentMarkdown(firstRoundTrip),
    );

    expect(firstRoundTrip).toBe(source);
    expect(secondRoundTrip).toBe(source);
  });

  it("supports exact round trips for checked and unchecked task lists", () => {
    const source = "- [ ] Verify allergies\n- [x] Review medications";

    expect(checkDocumentModeEligibility(source)).toEqual({ supported: true });
    expect(serializeDocumentMarkdown(parseDocumentMarkdown(source))).toBe(
      source,
    );
  });

  it("allows stable table editing while preserving table cell content", () => {
    const source =
      "Intro.\n\n| Field | Value |\n| --- | --- |\n| SpO2 | 96% |\n\nFollow up.";
    const document = parseDocumentMarkdown(source);
    const serialized = serializeDocumentMarkdown(document);

    expect(checkDocumentModeEligibility(source)).toEqual({ supported: true });
    expect(serializeDocumentMarkdown(parseDocumentMarkdown(serialized))).toBe(
      serialized,
    );
    expect(serialized).toContain("SpO2");
    expect(serialized).toContain("96%");
    expect(serialized).toContain("Intro.");
    expect(serialized).toContain("Follow up.");
  });

  it("creates a valid empty document for visual editing without changing its source", () => {
    const emptyDocument = parseDocumentMarkdown("");

    expect(emptyDocument.content).toEqual([{ type: "paragraph" }]);
    expect(serializeDocumentMarkdown(emptyDocument)).toBe("");
  });
});
