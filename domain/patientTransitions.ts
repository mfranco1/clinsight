import { ChartEntry, MedicalChartResponse, SoapNote } from '../types';

export const prependEntry = (patient: MedicalChartResponse, entry: ChartEntry): MedicalChartResponse => ({
  ...patient,
  entries: [entry, ...patient.entries],
});

export const updateEntry = (
  patient: MedicalChartResponse,
  entryId: string,
  entry: ChartEntry
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((current) => current.id === entryId ? entry : current),
});

export const updateEntrySoap = (
  patient: MedicalChartResponse,
  entryId: string,
  soap: SoapNote
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((entry) => entry.id === entryId ? { ...entry, soap } : entry),
});

export const removeEntry = (patient: MedicalChartResponse, entryId: string): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.filter((entry) => entry.id !== entryId),
});
