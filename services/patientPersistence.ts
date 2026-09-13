import {
  EncounterType,
  MedicalChartResponse,
  PatientStatus,
} from '../types';
import { createId, normalizePatientAgeSex } from '../utils';

export const PATIENTS_STORAGE_KEY = 'clinsight_patients';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isChartResponse = (value: unknown): value is MedicalChartResponse =>
  isRecord(value) && typeof value.id === 'string' && isRecord(value.patientInfo) && Array.isArray(value.entries);

/** Hydrates persisted data and applies the legacy encounter migration. */
export const migratePersistedPatients = (raw: unknown): MedicalChartResponse[] => {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isChartResponse).map((patient) => {
    const updatedPatient: MedicalChartResponse = {
      ...patient,
      patientInfo: normalizePatientAgeSex(patient.patientInfo),
    };
    let firstEncounterId: string;

    if (!updatedPatient.encounters || updatedPatient.encounters.length === 0) {
      firstEncounterId = createId();
      const type = updatedPatient.patientInfo.status === PatientStatus.OUTPATIENT
        ? EncounterType.CONSULT
        : EncounterType.ADMISSION;
      const status = updatedPatient.patientInfo.status === PatientStatus.DISCHARGED ? 'COMPLETED' : 'ACTIVE';
      const startDate = updatedPatient.patientInfo.admissionDate || patient.entries[patient.entries.length - 1]?.date || new Date().toISOString();
      updatedPatient.encounters = [{ id: firstEncounterId, type, status, startDate }];
    } else {
      firstEncounterId = updatedPatient.encounters[0].id;
    }

    updatedPatient.entries = updatedPatient.entries.map((entry) =>
      entry.encounterId ? entry : { ...entry, encounterId: firstEncounterId }
    );
    updatedPatient.course = (updatedPatient.course || []).map((event) =>
      event.encounterId ? event : { ...event, encounterId: firstEncounterId }
    );
    if (updatedPatient.orders) {
      updatedPatient.orders = updatedPatient.orders.map((order) =>
        order.encounterId ? order : { ...order, encounterId: firstEncounterId }
      );
    }

    return updatedPatient;
  });
};

export const loadPersistedPatients = (rawValue: string | null): MedicalChartResponse[] => {
  if (!rawValue) return [];
  try {
    return migratePersistedPatients(JSON.parse(rawValue) as unknown);
  } catch (error) {
    console.error('Failed to load patients from storage', error);
    return [];
  }
};
