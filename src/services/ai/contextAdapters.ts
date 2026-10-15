import type {
  AiPatientContext,
  GeneralData,
  ChartEntry,
  CourseEvent,
  SoapNote,
  PlanItem,
  Encounter,
  DeceasedInfo,
  CauseOfDeath,
  BroaderManagement,
  DifferentialDiagnosisItem,
  GroundingSource,
  HandoffSummary,
  SubNote,
  PatientNote,
  MedicationOrder,
  PatientOrder,
  FileUpload,
} from "./contracts";

type Projection = true | { readonly [key: string]: Projection };
type Fields<T> = { [K in keyof Required<T>]: Projection };
const causeOfDeath = {
  icod: true,
  acod: true,
  ucod: true,
  ccod: true,
} satisfies Fields<CauseOfDeath>;
const deceasedInfo = {
  date: true,
  time: true,
  causeOfDeath,
  notes: true,
} satisfies Fields<DeceasedInfo>;
const patientInfo = {
  patientName: true,
  ageSex: true,
  age: true,
  sex: true,
  mrn: true,
  dob: true,
  admissionDate: true,
  address: true,
  religion: true,
  handedness: true,
  location: true,
  bloodType: true,
  contactNumber: true,
  email: true,
  status: true,
  dischargeDate: true,
  deceasedInfo,
} satisfies Fields<GeneralData>;
const plan = {
  problem: true,
  actions: true,
  diagnostics: true,
  therapeutics: true,
  other: true,
} satisfies Fields<PlanItem>;
const broaderManagement = {
  disposition: true,
  diet: true,
  ivFluids: true,
  o2Support: true,
  monitoring: true,
  wof: true,
  referrals: true,
} satisfies Fields<BroaderManagement>;
const differentialDiagnosis = {
  diagnosis: true,
  evidenceFor: true,
  evidenceAgainst: true,
} satisfies Fields<DifferentialDiagnosisItem>;
const grounding = { title: true, uri: true } satisfies Fields<GroundingSource>;
const attachment = {
  file: true,
  previewUrl: true,
  base64: true,
  mimeType: true,
  category: true,
} satisfies Fields<FileUpload>;
const soap = {
  subjective: {
    chiefComplaint: true,
    hpi: true,
    ros: true,
    pmh: true,
    meds: true,
    social: true,
    anamnesis: true,
    family: true,
    birthMaternal: true,
    immunizations: true,
    nutrition: true,
    developmental: true,
    headsss: true,
    sexualHistory: true,
    clinicalAssistance: true,
  } satisfies Fields<SoapNote["subjective"]>,
  objective: {
    vitals: true,
    anthropometrics: true,
    physicalExam: true,
    labs: true,
    labInterpretation: true,
    imaging: true,
    imagingCorrelation: true,
    clinicalAssistance: true,
  } satisfies Fields<SoapNote["objective"]>,
  assessment: {
    summary: true,
    rationale: true,
    icdCodes: true,
    differentialDiagnosis,
  } satisfies Fields<SoapNote["assessment"]>,
  plan,
  broaderManagement,
} satisfies Fields<SoapNote>;
const entry = {
  id: true,
  encounterId: true,
  date: true,
  title: true,
  type: true,
  entryType: true,
  soap,
  rawText: true,
  originalNote: true,
  specialization: true,
  attachments: attachment,
  references: true,
  groundingSources: grounding,
} satisfies Fields<ChartEntry>;
const course = {
  id: true,
  encounterId: true,
  date: true,
  time: true,
  event: true,
  details: true,
} satisfies Fields<CourseEvent>;
const handoff = {
  patientId: true,
  oneLiner: true,
  activeIssues: true,
  toDoList: true,
  clinicalPearl: true,
} satisfies Fields<HandoffSummary>;
const subNote = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  isAssistant: true,
  groundingSources: grounding,
  highlightedText: true,
  attachments: attachment,
} satisfies Fields<SubNote>;
const note = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  attachments: attachment,
  isAssistant: true,
  groundingSources: grounding,
  subNotes: subNote,
} satisfies Fields<PatientNote>;
const medication = {
  id: true,
  encounterId: true,
  drug: true,
  dose: true,
  route: true,
  frequency: true,
  duration: true,
  status: true,
  prescribedDate: true,
  prescribedBy: true,
  notes: true,
  quantity: true,
} satisfies Fields<MedicationOrder>;
const order = {
  id: true,
  encounterId: true,
  name: true,
  dateOrdered: true,
  targetDate: true,
  status: true,
  notes: true,
  category: true,
  sortOrder: true,
  groupId: true,
  groupName: true,
  sourceText: true,
} satisfies Fields<PatientOrder>;
const encounter = {
  id: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
} satisfies Fields<Encounter>;
const patient = {
  id: true,
  patientInfo,
  encounters: encounter,
  entries: entry,
  course,
  handoff,
  orders: order,
  medications: medication,
  notes: note,
  groundingSources: grounding,
  references: true,
} satisfies Fields<AiPatientContext>;

/** Preserve source key order, optionality, legacy unions and runtime media; only select declared fields.
 * This is a projection of already typed inputs, not external-data validation.
 */
const project = (value: unknown, fields: Projection): unknown => {
  if (fields === true || value == null || typeof value !== "object")
    return value;
  if (Array.isArray(value)) return value.map((item) => project(item, fields));
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => Object.hasOwn(fields, key))
      .map(([key, child]) => [key, project(child, fields[key])]),
  );
};

export const toAiPatientContext = (
  value: AiPatientContext | null | undefined,
): AiPatientContext | null | undefined =>
  project(value, patient) as AiPatientContext | null | undefined;
export const toAiPatientInfo = (
  value: GeneralData | null | undefined,
): GeneralData | null | undefined =>
  project(value, patientInfo) as GeneralData | null | undefined;
export const toAiEntries = (
  value: ChartEntry[] | undefined,
): ChartEntry[] | undefined =>
  project(value, entry) as ChartEntry[] | undefined;
export const toAiCourse = (value: CourseEvent[]): CourseEvent[] =>
  project(value, course) as CourseEvent[];
export const toAiSoap = (value: SoapNote): SoapNote =>
  project(value, soap) as SoapNote;
export const toAiPlan = (value: PlanItem[]): PlanItem[] =>
  project(value, plan) as PlanItem[];
