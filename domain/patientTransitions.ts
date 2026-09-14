import {
  ChartEntry,
  CourseEvent,
  GeneralData,
  HandoffSummary,
  MedicalChartResponse,
  MedicationOrder,
  PatientNote,
  PatientOrder,
  SoapNote,
} from '../types';

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

export const updatePatientInfo = (patient: MedicalChartResponse, patientInfo: GeneralData): MedicalChartResponse => ({
  ...patient,
  patientInfo,
});

export const updateCourse = (patient: MedicalChartResponse, course: CourseEvent[]): MedicalChartResponse => ({
  ...patient,
  course,
});

export const appendCourseEvent = (patient: MedicalChartResponse, event: CourseEvent): MedicalChartResponse => ({
  ...patient,
  course: [...(patient.course || []), event],
});

export const updateHandoff = (patient: MedicalChartResponse, handoff: HandoffSummary): MedicalChartResponse => ({
  ...patient,
  handoff,
});

export const updateOrders = (patient: MedicalChartResponse, orders: PatientOrder[]): MedicalChartResponse => ({
  ...patient,
  orders,
});

export const updateOrder = (patient: MedicalChartResponse, order: PatientOrder): MedicalChartResponse => ({
  ...patient,
  orders: (patient.orders || []).map((current) => current.id === order.id ? order : current),
});

export const updateMedications = (patient: MedicalChartResponse, medications: MedicationOrder[]): MedicalChartResponse => ({
  ...patient,
  medications,
});

export const updateNotes = (patient: MedicalChartResponse, notes: PatientNote[]): MedicalChartResponse => ({
  ...patient,
  notes,
});

export const prependNote = (patient: MedicalChartResponse, note: PatientNote): MedicalChartResponse => ({
  ...patient,
  notes: [note, ...(patient.notes || [])],
});
