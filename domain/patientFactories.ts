import {
  ChartEntry,
  EncounterType,
  MedicalChartResponse,
  PatientStatus,
  CourseEvent,
} from "../types";

interface GeneratedPatientOptions {
  entry: ChartEntry;
  encounterId: string;
  effectiveDate: string;
  isConsult: boolean;
  fallbackCourseEvent: CourseEvent;
}

type GeneratedPatientData = Omit<MedicalChartResponse, "entries">;

export const createGeneratedPatient = (
  data: GeneratedPatientData,
  options: GeneratedPatientOptions,
): MedicalChartResponse => ({
  ...data,
  patientInfo: { ...data.patientInfo },
  encounters: [
    {
      id: options.encounterId,
      type: options.isConsult ? EncounterType.CONSULT : EncounterType.ADMISSION,
      startDate: options.effectiveDate,
      status: "ACTIVE",
    },
  ],
  entries: [options.entry],
  course:
    data.course && data.course.length > 0
      ? data.course
      : [options.fallbackCourseEvent],
});

interface ManualPatientOptions {
  id: string;
  encounterId: string;
  now: string;
  today: string;
  isConsult: boolean;
  entry: ChartEntry;
  courseEvent: CourseEvent;
}

export const createManualPatient = (
  options: ManualPatientOptions,
): MedicalChartResponse => ({
  id: options.id,
  patientInfo: {
    patientName: "Not Recorded",
    ageSex: "Not Recorded",
    mrn: "Not Recorded",
    dob: "Not Recorded",
    admissionDate: options.today,
    status: options.isConsult
      ? PatientStatus.OUTPATIENT
      : PatientStatus.ADMITTED,
    address: "Not Recorded",
    religion: "Not Recorded",
    handedness: "Not Recorded",
    location: "Not Recorded",
    contactNumber: "Not Recorded",
    email: "Not Recorded",
  },
  encounters: [
    {
      id: options.encounterId,
      type: options.isConsult ? EncounterType.CONSULT : EncounterType.ADMISSION,
      startDate: options.now,
      status: "ACTIVE",
    },
  ],
  entries: [{ ...options.entry, encounterId: options.encounterId }],
  course: [options.courseEvent],
  handoff: {
    patientId: "Not Recorded",
    oneLiner: "Manual admission recorded.",
    activeIssues: ["Manual admission"],
    toDoList: ["Review patient history"],
  },
});
