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

  it("drops a controlled late completion after the active entry changes", async () => {
    const request = { patientId: "patient-a", entryId: "entry-a", patient };
    let current = request;
    let resolveResult: (value: string) => void = () => {};
    const pendingResult = new Promise<string>((resolve) => {
      resolveResult = resolve;
    });
    let appliedResult: string | null = null;

    const applyingResult = pendingResult.then((result) => {
      if (isCurrentPatientEntryRequest(request, current))
        appliedResult = result;
    });
    current = { ...request, entryId: "entry-b" };
    resolveResult("late assessment");
    await applyingResult;

    expect(appliedResult).toBeNull();
  });
});
