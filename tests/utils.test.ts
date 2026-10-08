import { describe, expect, it } from "vitest";
import { normalizeDateInput } from "../src/utils/date";
import { stringToKeyValue } from "../src/utils/clinicalText";
import {
  arrayToMarkdownBullets,
  markdownBulletsToArray,
} from "../src/utils/markdown";
import { normalizePatientAgeSex } from "../src/utils/patient";
import {
  legacyPatientCase,
  structuredPatientCase,
} from "./fixtures/patient-cases";

describe("clinical text utilities", () => {
  it("round-trips markdown bullet content", () => {
    const source = ["Review CBC", "Repeat imaging"];

    expect(markdownBulletsToArray(arrayToMarkdownBullets(source))).toEqual(
      source,
    );
  });

  it("parses labeled and unlabeled structured content", () => {
    expect(stringToKeyValue("Skin: Warm\nNormal gait")).toEqual({
      Skin: "Warm",
      "Item 1": "Normal gait",
    });
  });

  it("normalizes a date to the local calendar format", () => {
    expect(normalizeDateInput("2026-08-26T12:00:00.000Z")).toMatch(
      /^2026-08-2[5-6]$/,
    );
  });

  it("normalizes legacy age/sex data without changing unrelated fields", () => {
    expect(
      normalizePatientAgeSex({
        patientName: "Test Patient",
        ageSex: "56/Male",
        mrn: "TEST-001",
        dob: "Not Recorded",
        admissionDate: "2026-08-26",
        address: "",
        religion: "",
        handedness: "",
      }),
    ).toMatchObject({
      patientName: "Test Patient",
      age: 56,
      sex: "Male",
      ageSex: "56/Male",
    });
  });

  it("keeps structured and legacy patient fixtures valid for migration tests", () => {
    expect(structuredPatientCase.encounters).toHaveLength(1);
    expect("encounters" in legacyPatientCase).toBe(false);
    expect(legacyPatientCase.entries[0].entryType).toBe("raw");
  });
});
