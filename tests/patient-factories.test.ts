import { describe, expect, it } from "vitest";
import {
  createGeneratedPatient,
  createManualPatient,
} from "../domain/patientFactories";
import { EncounterType, PatientStatus, type ChartEntry } from "../types";
import { structuredPatientCase } from "./fixtures/patient-cases";

const entry: ChartEntry = {
  id: "entry-new",
  encounterId: "encounter-new",
  date: "2026-09-15 09:00",
  title: "Admission Note",
  type: "SOAP",
  entryType: "raw",
  rawText: "Manual note",
};

describe("patient factories", () => {
  it("creates generated charts with the selected encounter and entry", () => {
    const patient = createGeneratedPatient(structuredPatientCase, {
      entry,
      encounterId: "encounter-generated",
      effectiveDate: "2026-09-15 09:00",
      isConsult: true,
      fallbackCourseEvent: {
        date: "2026-09-15",
        event: "Start Consult",
        details: "Registered",
      },
    });

    expect(patient).not.toBe(structuredPatientCase);
    expect(patient.encounters?.[0]).toMatchObject({
      id: "encounter-generated",
      type: EncounterType.CONSULT,
      status: "ACTIVE",
    });
    expect(patient.entries[0]).toBe(entry);
    expect(patient.patientInfo).not.toBe(structuredPatientCase.patientInfo);
  });

  it("creates manual charts with the existing placeholder defaults", () => {
    const patient = createManualPatient({
      id: "patient-manual",
      encounterId: "encounter-manual",
      now: "2026-09-15T09:00:00.000Z",
      today: "2026-09-15",
      isConsult: false,
      entry,
      courseEvent: {
        encounterId: "encounter-manual",
        date: "2026-09-15",
        event: "Admission Note",
        details: "Manual",
      },
    });

    expect(patient.id).toBe("patient-manual");
    expect(patient.patientInfo.status).toBe(PatientStatus.ADMITTED);
    expect(patient.encounters?.[0].type).toBe(EncounterType.ADMISSION);
    expect(patient.entries[0].encounterId).toBe("encounter-manual");
    expect(patient.handoff?.oneLiner).toBe("Manual admission recorded.");
  });
});
