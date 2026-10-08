import { describe, expect, it } from "vitest";
import { formatChartRecordForClipboard } from "../features/chart/formatForClipboard";
import { structuredPatientCase } from "./fixtures/patient-cases";

describe("formatChartRecordForClipboard", () => {
  it("formats the existing structured chart sections and patient context", () => {
    const patient = structuredPatientCase;
    const entry = patient.entries[0];
    const output = formatChartRecordForClipboard(
      entry.soap!,
      patient.patientInfo,
      entry,
    );

    expect(output).toContain(
      "PATIENT CHART RECORD\nEntry: Admission Note (2026-08-26 09:00)",
    );
    expect(output).toContain(
      "Name: Test Patient\nAge/Sex: 42/M\nCase No: TEST-001",
    );
    expect(output).toContain("Review of Systems:\nConstitutional: No fever");
    expect(output).toContain("Physical Examination:\nGeneral: Well appearing");
    expect(output).toContain("ASSESSMENT\nStable test patient");
  });

  it("preserves the raw-note early return and markdown-marker cleanup", () => {
    const patient = structuredPatientCase;
    const entry = {
      ...patient.entries[0],
      entryType: "raw" as const,
      rawText: "**Manual** note",
      soap: undefined,
    };
    const output = formatChartRecordForClipboard(
      patient.entries[0].soap!,
      patient.patientInfo,
      entry,
    );

    expect(output).toContain("MANUAL PROGRESS NOTE\nManual note");
    expect(output).not.toContain("CLINICAL NOTE (SOAP)");
    expect(output).not.toContain("**");
  });
});
