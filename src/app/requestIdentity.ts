import type { MedicalChartResponse } from "../types";

export interface PatientEntryRequestIdentity {
  patientId: string | null;
  entryId: string | null;
  patient: MedicalChartResponse | null;
}

export function isCurrentPatientEntryRequest(
  request: PatientEntryRequestIdentity,
  current: PatientEntryRequestIdentity,
): boolean {
  return (
    request.patientId === current.patientId &&
    request.entryId === current.entryId &&
    request.patient === current.patient
  );
}

export function isCurrentPatientRequest(
  request: Pick<PatientEntryRequestIdentity, "patientId" | "patient">,
  current: Pick<PatientEntryRequestIdentity, "patientId" | "patient">,
): boolean {
  return (
    request.patientId === current.patientId &&
    request.patient === current.patient
  );
}
