import {
  ChartEntry,
  CourseEvent,
  DeceasedInfo,
  EncounterType,
  GeneralData,
  HandoffSummary,
  MedicalChartResponse,
  MedicationOrder,
  PatientNote,
  PatientOrder,
  PatientStatus,
  PlanItem,
  SoapNote,
} from "../types";

export const prependEntry = (
  patient: MedicalChartResponse,
  entry: ChartEntry,
): MedicalChartResponse => ({
  ...patient,
  entries: [entry, ...patient.entries],
});

const newestCourseFirst = (events: CourseEvent[]): CourseEvent[] =>
  events.sort(
    (a, b) =>
      new Date(`${b.date} ${b.time || "00:00"}`).getTime() -
      new Date(`${a.date} ${a.time || "00:00"}`).getTime(),
  );

export const prependEntryWithCourseEvent = (
  patient: MedicalChartResponse,
  entry: ChartEntry,
  event: CourseEvent,
  sortCourse = true,
): MedicalChartResponse => ({
  ...patient,
  entries: [entry, ...patient.entries],
  course: sortCourse
    ? newestCourseFirst([...(patient.course || []), event])
    : [...(patient.course || []), event],
});

export const appendAssessedEntry = (
  patient: MedicalChartResponse,
  entryId: string,
  soap: SoapNote,
  event: CourseEvent,
  references?: string[],
  groundingSources?: ChartEntry["groundingSources"],
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          entryType: "structured",
          soap,
          references,
          groundingSources,
        }
      : entry,
  ),
  course: newestCourseFirst([...(patient.course || []), event]),
});

export interface ReassessmentUpdate {
  assessment: SoapNote["assessment"];
  plan: PlanItem[];
  references?: string[];
  groundingSources?: ChartEntry["groundingSources"];
}

export const applyEntryReassessment = (
  patient: MedicalChartResponse,
  entryId: string,
  update: ReassessmentUpdate,
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          soap: entry.soap
            ? {
                ...entry.soap,
                assessment: update.assessment,
                plan: update.plan,
              }
            : entry.soap,
          references: update.references || entry.references,
          groundingSources: update.groundingSources || entry.groundingSources,
        }
      : entry,
  ),
});

export const updateEntry = (
  patient: MedicalChartResponse,
  entryId: string,
  entry: ChartEntry,
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((current) =>
    current.id === entryId ? entry : current,
  ),
});

export const updateEntrySoap = (
  patient: MedicalChartResponse,
  entryId: string,
  soap: SoapNote,
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.map((entry) =>
    entry.id === entryId ? { ...entry, soap } : entry,
  ),
});

export const removeEntry = (
  patient: MedicalChartResponse,
  entryId: string,
): MedicalChartResponse => ({
  ...patient,
  entries: patient.entries.filter((entry) => entry.id !== entryId),
});

export const updatePatientInfo = (
  patient: MedicalChartResponse,
  patientInfo: GeneralData,
): MedicalChartResponse => ({
  ...patient,
  patientInfo,
});

export const updateCourse = (
  patient: MedicalChartResponse,
  course: CourseEvent[],
): MedicalChartResponse => ({
  ...patient,
  course,
});

export const appendCourseEvent = (
  patient: MedicalChartResponse,
  event: CourseEvent,
): MedicalChartResponse => ({
  ...patient,
  course: [...(patient.course || []), event],
});

export const updateHandoff = (
  patient: MedicalChartResponse,
  handoff: HandoffSummary,
): MedicalChartResponse => ({
  ...patient,
  handoff,
});

export const updateOrders = (
  patient: MedicalChartResponse,
  orders: PatientOrder[],
): MedicalChartResponse => ({
  ...patient,
  orders,
});

export const updateOrder = (
  patient: MedicalChartResponse,
  order: PatientOrder,
): MedicalChartResponse => ({
  ...patient,
  orders: (patient.orders || []).map((current) =>
    current.id === order.id ? order : current,
  ),
});

export const updateMedications = (
  patient: MedicalChartResponse,
  medications: MedicationOrder[],
): MedicalChartResponse => ({
  ...patient,
  medications,
});

export const updateNotes = (
  patient: MedicalChartResponse,
  notes: PatientNote[],
): MedicalChartResponse => ({
  ...patient,
  notes,
});

export const prependNote = (
  patient: MedicalChartResponse,
  note: PatientNote,
): MedicalChartResponse => ({
  ...patient,
  notes: [note, ...(patient.notes || [])],
});

export interface PatientStatusTransitionOptions {
  now: string;
  dischargeDateTime?: string;
  deceasedInfo?: DeceasedInfo;
  nextEncounterId?: string;
  admissionDateTime?: string;
}

export const updatePatientStatus = (
  patient: MedicalChartResponse,
  status: PatientStatus,
  options: PatientStatusTransitionOptions,
): MedicalChartResponse => {
  const updatedEncounters = (patient.encounters || []).map((encounter) =>
    encounter.status === "ACTIVE"
      ? {
          ...encounter,
          status: "COMPLETED" as const,
          endDate:
            status === PatientStatus.DISCHARGED && options.dischargeDateTime
              ? new Date(
                  options.dischargeDateTime.replace(" ", "T"),
                ).toISOString()
              : status === PatientStatus.DECEASED && options.deceasedInfo
                ? new Date(
                    `${options.deceasedInfo.date}T${options.deceasedInfo.time}`,
                  ).toISOString()
                : options.now,
        }
      : encounter,
  );
  const patientInfo = { ...patient.patientInfo, status };

  if (
    status === PatientStatus.ADMITTED ||
    status === PatientStatus.OUTPATIENT
  ) {
    updatedEncounters.push({
      id: options.nextEncounterId || options.now,
      type:
        status === PatientStatus.ADMITTED
          ? EncounterType.ADMISSION
          : EncounterType.CONSULT,
      status: "ACTIVE",
      startDate: options.now,
    });
    patientInfo.admissionDate =
      options.admissionDateTime || patientInfo.admissionDate;
    patientInfo.dischargeDate = undefined;
    patientInfo.deceasedInfo = undefined;
  } else if (status === PatientStatus.DISCHARGED) {
    patientInfo.dischargeDate = options.dischargeDateTime;
  } else if (status === PatientStatus.DECEASED) {
    patientInfo.deceasedInfo = options.deceasedInfo;
  }

  return { ...patient, patientInfo, encounters: updatedEncounters };
};

export const reactivateEncounter = (
  patient: MedicalChartResponse,
  encounterId: string,
): MedicalChartResponse => {
  const targetEncounter = (patient.encounters || []).find(
    (encounter) => encounter.id === encounterId,
  );
  if (!targetEncounter) return patient;
  const status =
    targetEncounter.type === EncounterType.ADMISSION
      ? PatientStatus.ADMITTED
      : PatientStatus.OUTPATIENT;
  return {
    ...patient,
    patientInfo: { ...patient.patientInfo, status },
    encounters: (patient.encounters || []).map((encounter) =>
      encounter.id === encounterId
        ? { ...encounter, status: "ACTIVE" as const, endDate: undefined }
        : encounter,
    ),
  };
};

export const withPatientId = (
  patient: MedicalChartResponse,
  id: string,
): MedicalChartResponse => ({
  ...patient,
  id,
});
