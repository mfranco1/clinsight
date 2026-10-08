import { describe, expect, it } from "vitest";
import { normalizePatientAgeSex } from "../utils/patient";

describe("patient age and sex normalization module", () => {
  it("preserves patient fields while normalizing demographic data", () => {
    const partialPatient = {
      patientName: "Sample Patient",
      ageSex: "56/Male",
      mrn: "SAMPLE-001",
    };

    expect(normalizePatientAgeSex(partialPatient)).toMatchObject({
      patientName: "Sample Patient",
      ageSex: "56/Male",
      mrn: "SAMPLE-001",
    });
    expect(normalizePatientAgeSex(partialPatient)).toMatchObject({
      patientName: "Sample Patient",
      age: 56,
      sex: "Male",
      ageSex: "56/Male",
      mrn: "SAMPLE-001",
    });
  });
});
