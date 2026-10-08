import { describe, expect, it } from "vitest";
import { structuredPatientCase } from "./fixtures/patient-cases";
import {
  parsePatientCaseFile,
  parsePatientCaseFiles,
} from "../features/input/importCases";

describe("Input case import parsing", () => {
  it("parses a valid patient case and preserves file order in batches", async () => {
    const first = new File(
      [JSON.stringify(structuredPatientCase)],
      "first.json",
      { type: "application/json" },
    );
    const secondCase = { ...structuredPatientCase, id: "patient-second" };
    const second = new File([JSON.stringify(secondCase)], "second.json", {
      type: "application/json",
    });

    await expect(parsePatientCaseFile(first)).resolves.toMatchObject({
      id: "patient-structured",
    });
    await expect(parsePatientCaseFiles([first, second])).resolves.toMatchObject(
      [{ id: "patient-structured" }, { id: "patient-second" }],
    );
  });

  it("retains separate errors for malformed JSON and invalid case structure", async () => {
    const malformed = new File(["{"], "broken.json", {
      type: "application/json",
    });
    const invalid = new File(
      [JSON.stringify({ entries: [] })],
      "invalid.json",
      { type: "application/json" },
    );

    await expect(parsePatientCaseFile(malformed)).rejects.toThrow(
      "Failed to parse JSON inside file: broken.json",
    );
    await expect(parsePatientCaseFile(invalid)).rejects.toThrow(
      "Invalid case format inside file: invalid.json",
    );
  });
});
