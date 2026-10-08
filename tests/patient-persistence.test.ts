import { describe, expect, it } from "vitest";
import {
  loadPersistedPatients,
  migratePersistedPatients,
} from "../src/services/patientPersistence";
import {
  legacyPatientCase,
  structuredPatientCase,
} from "./fixtures/patient-cases";

describe("patient persistence boundary", () => {
  it("hydrates legacy records and assigns encounter IDs", () => {
    const [patient] = migratePersistedPatients([legacyPatientCase]);
    expect(patient.encounters).toHaveLength(1);
    expect(patient.entries[0].encounterId).toBe(patient.encounters?.[0].id);
  });

  it("preserves structured records and rejects malformed payloads", () => {
    expect(
      loadPersistedPatients(JSON.stringify([structuredPatientCase])),
    ).toHaveLength(1);
    expect(loadPersistedPatients(JSON.stringify({ patients: [] }))).toEqual([]);
    expect(loadPersistedPatients("not-json")).toEqual([]);
  });

  it("round-trips legacy clinical pearls", () => {
    const legacyPatient = {
      ...structuredPatientCase,
      handoff: {
        ...structuredPatientCase.handoff,
        clinicalPearl: "Legacy note",
      },
    };
    const [hydrated] = loadPersistedPatients(JSON.stringify([legacyPatient]));
    expect(hydrated.handoff.clinicalPearl).toBe("Legacy note");
    expect(JSON.parse(JSON.stringify(hydrated)).handoff.clinicalPearl).toBe(
      "Legacy note",
    );
  });
});
