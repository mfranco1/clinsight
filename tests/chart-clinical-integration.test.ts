import { describe, expect, it } from "vitest";
import { structuredPatientCase } from "./fixtures/patient-cases";
import {
  applyIntegrationResult,
  resolveIntegrationTarget,
} from "../features/chart/clinicalIntegration";
import { SoapNote } from "../types";

const baseSoap = structuredPatientCase.entries[0].soap as SoapNote;

describe("chart clinical data integration", () => {
  it("routes single suggestions using the existing keyword rules and defaults", () => {
    expect(
      resolveIntegrationTarget(baseSoap, "Subjective", ["Medication review"]),
    ).toMatchObject({
      sectionTitle: "Subjective",
      field: "meds",
      currentContent: "Not Recorded",
    });
    expect(
      resolveIntegrationTarget(baseSoap, "Subjective", ["History of asthma"]),
    ).toMatchObject({ field: "pmh" });
    expect(
      resolveIntegrationTarget(baseSoap, "Subjective", ["One", "Two"]),
    ).toMatchObject({ field: "hpi" });
    expect(
      resolveIntegrationTarget(baseSoap, "Objective", ["Imaging result"]),
    ).toMatchObject({
      sectionTitle: "Objective",
      field: "imaging",
      currentContent: "Not Recorded",
    });
  });

  it("preserves structured physical-exam text as a string-compatible request context", () => {
    expect(resolveIntegrationTarget(baseSoap, "Objective", [])).toMatchObject({
      field: "physicalExam",
      currentContent: "[object Object]",
    });
  });

  it("immutably updates only the selected section and removes addressed assistance", () => {
    const soap: SoapNote = {
      ...baseSoap,
      subjective: {
        ...baseSoap.subjective,
        clinicalAssistance: ["Medication review", "Review hydration"],
      },
    };
    const target = resolveIntegrationTarget(soap, "Subjective", [
      "Medication review",
    ]);
    const updated = applyIntegrationResult(
      soap,
      target,
      "Updated medication plan",
      ["Medication review"],
    );

    expect(updated).not.toBe(soap);
    expect(updated.subjective).not.toBe(soap.subjective);
    expect(updated.subjective.meds).toBe("Updated medication plan");
    expect(updated.subjective.clinicalAssistance).toEqual(["Review hydration"]);
    expect(updated.objective).toBe(soap.objective);
    expect(soap.subjective.meds).toBe("Not Recorded");
  });
});
