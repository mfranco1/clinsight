import {
  EncounterType,
  PatientStatus,
  type MedicalChartResponse,
} from "../../src/types";

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

/** Compatibility fixture: synthetic source text, legacy unions and all attachment owners. */
export const contractPatientCase: MedicalChartResponse = {
  ...structuredPatientCase,
  id: "legacy-17",
  entries: [
    {
      ...structuredEntry,
      originalNote: "  Source: 5 mg/L\n\n<2 mmol/L; α  ",
      references: ["Synthetic guideline [1]"],
      groundingSources: [{ title: "Fixture", uri: "https://example.test/ref" }],
      attachments: [],
    },
    {
      ...structuredEntry,
      id: "entry-string-sections",
      soap: {
        ...structuredEntry.soap,
        subjective: {
          ...structuredEntry.soap.subjective,
          ros: "No fever\nNo cough",
        },
        objective: {
          ...structuredEntry.soap.objective,
          physicalExam: "Warm\nAlert",
        },
      },
    },
    {
      ...legacyPatientCase.entries[0],
      id: "old-entry-9",
      rawText: "  Raw 5 mg\n\n[1]  ",
    },
  ],
  handoff: {
    ...structuredPatientCase.handoff,
    patientId: "legacy-17",
    clinicalPearl: "Legacy source",
  },
  notes: [
    {
      id: "note-1",
      content: "  Note\n\n",
      createdAt: "2026-08-26",
      updatedAt: "2026-08-26",
      attachments: [],
      subNotes: [
        {
          id: "subnote-1",
          content: "Source reply",
          createdAt: "2026-08-26",
          attachments: [],
        },
      ],
    },
  ],
};

/** Files are created on demand so importing fixtures does not allocate browser resources. */
export const createContractAttachment = () => ({
  file: new File([Uint8Array.from([0, 1, 127, 128, 255])], "synthetic.png", {
    type: "image/png",
    lastModified: 123,
  }),
  base64: "AAF/gP8=",
  mimeType: "image/png",
  category: "Imaging" as const,
  previewUrl: "blob:synthetic-source",
});

export const createAttachmentPatientCase = (): MedicalChartResponse => {
  const patient = structuredClone(contractPatientCase);
  patient.entries[0].attachments = [createContractAttachment()];
  patient.notes![0].attachments = [createContractAttachment()];
  patient.notes![0].subNotes![0].attachments = [createContractAttachment()];
  return patient;
};
