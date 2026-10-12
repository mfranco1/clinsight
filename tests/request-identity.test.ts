import { describe, expect, it } from "vitest";
import {
  isCurrentPatientEntryRequest,
  isCurrentPatientRequest,
} from "../src/app/requestIdentity";
import { structuredPatientCase } from "./fixtures/patient-cases";

const patient = structuredPatientCase;

describe("async request identity", () => {
  it("accepts results only for the same active patient, entry, and patient snapshot", () => {
    const request = {
      patientId: "patient-a",
      entryId: "entry-a",
      patient,
    };

    expect(isCurrentPatientEntryRequest(request, request)).toBe(true);
    expect(
      isCurrentPatientEntryRequest(request, {
        ...request,
        patientId: "patient-b",
      }),
    ).toBe(false);
    expect(
      isCurrentPatientEntryRequest(request, {
        ...request,
        entryId: "entry-b",
      }),
    ).toBe(false);
    expect(
      isCurrentPatientEntryRequest(request, {
        ...request,
        patient: { ...patient },
      }),
    ).toBe(false);
  });

  it("scopes summary refreshes to the unchanged patient snapshot", () => {
    const request = { patientId: "patient-a", patient };

    expect(isCurrentPatientRequest(request, request)).toBe(true);
    expect(
      isCurrentPatientRequest(request, {
        patientId: "patient-b",
        patient,
      }),
    ).toBe(false);
    expect(
      isCurrentPatientRequest(request, {
        patientId: "patient-a",
        patient: { ...patient },
      }),
    ).toBe(false);
  });
});
