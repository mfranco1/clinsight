import {
  EncounterType,
  PatientStatus,
  type MedicalChartResponse,
} from "../../types";

const patientInfo = {
  patientName: "Test Patient",
  ageSex: "42/M",
  age: 42,
  sex: "M",
  mrn: "TEST-001",
  dob: "1984-01-10",
  admissionDate: "2026-08-26 09:00",
  address: "Not Recorded",
  religion: "Not Recorded",
  handedness: "Not Recorded",
  location: "Ward A",
  status: PatientStatus.ADMITTED,
};

const structuredEntry = {
  id: "entry-structured",
  encounterId: "encounter-admission",
  date: "2026-08-26 09:00",
  title: "Admission Note",
  type: "SOAP",
  entryType: "structured" as const,
  soap: {
    subjective: {
      hpi: "Stable test presentation.",
      ros: { Constitutional: "No fever" },
      pmh: "Not Recorded",
      meds: "Not Recorded",
      social: "Not Recorded",
      family: "Not Recorded",
    },
    objective: {
      vitals: "Stable",
      physicalExam: { General: "Well appearing" },
      labs: "Not Recorded",
      imaging: "Not Recorded",
    },
    assessment: {
      summary: "Stable test patient",
      rationale: [],
    },
    plan: [],
  },
};

export const structuredPatientCase = {
  id: "patient-structured",
  patientInfo,
  encounters: [
    {
      id: "encounter-admission",
      type: EncounterType.ADMISSION,
      status: "ACTIVE" as const,
      startDate: "2026-08-26T09:00:00.000Z",
    },
  ],
  entries: [structuredEntry],
  course: [
    {
      id: "event-admission",
      encounterId: "encounter-admission",
      date: "2026-08-26",
      time: "09:00",
      event: "Admission",
      details: "Fixture admission event",
    },
  ],
  handoff: {
    patientId: "patient-structured",
    oneLiner: "Stable test patient",
    activeIssues: [],
    toDoList: [],
  },
} satisfies MedicalChartResponse;

export const legacyPatientCase = {
  id: "patient-legacy",
  patientInfo: {
    ...patientInfo,
    status: PatientStatus.DISCHARGED,
    dischargeDate: "2026-08-26 16:00",
  },
  entries: [
    {
      id: "entry-legacy",
      date: "2026-08-26 09:00",
      title: "Admission Note",
      type: "SOAP",
      entryType: "raw" as const,
      rawText: "Legacy raw note fixture",
    },
  ],
  course: [],
  handoff: {
    patientId: "patient-legacy",
    oneLiner: "Legacy fixture",
    activeIssues: [],
    toDoList: [],
  },
} satisfies MedicalChartResponse;
