/** Frozen AI task DTOs. Extend deliberately; do not derive these from patient aggregates. */
import type {
  EncounterType,
  MedicationStatus,
  OrderStatus,
  PatientStatus,
} from "../../types";

export interface Encounter {
  id: string;
  type: EncounterType;
  status: "ACTIVE" | "COMPLETED";
  startDate: string; // ISO string Date/Time
  endDate?: string; // ISO string Date/Time
}

export interface CauseOfDeath {
  icod: string; // immediate cause of death
  acod?: string; // antecedent cause of death (optional)
  ucod: string; // underlying cause of death
  ccod?: string; // contributing cause of death (optional)
}

export interface DeceasedInfo {
  date: string;
  time: string;
  causeOfDeath: CauseOfDeath;
  notes?: string;
}

export interface GeneralData {
  patientName: string;
  ageSex: string;
  age?: number;
  sex?: string;
  mrn: string;
  dob: string;
  admissionDate: string;
  address: string;
  religion: string;
  handedness: string;
  location?: string;
  bloodType?: string;
  contactNumber?: string;
  email?: string;
  status?: PatientStatus;
  dischargeDate?: string;
  deceasedInfo?: DeceasedInfo;
}

export interface PlanItem {
  problem: string;
  actions?: string[];
  diagnostics?: string[];
  therapeutics?: string[];
  other?: string[];
}

export interface BroaderManagement {
  disposition?: string;
  diet?: string;
  ivFluids?: string;
  o2Support?: string;
  monitoring?: string;
  wof?: string;
  referrals?: string[];
}

export interface DifferentialDiagnosisItem {
  diagnosis: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SoapNote {
  subjective: {
    chiefComplaint?: string;
    hpi: string;
    ros: Record<string, string> | string;
    pmh: string;
    meds: string;
    social: string;
    anamnesis?: string;
    family: string;
    birthMaternal?: string;
    immunizations?: string;
    nutrition?: string;
    developmental?: string;
    headsss?: Record<string, string>;
    sexualHistory?: string;
    clinicalAssistance?: string[];
  };
  objective: {
    vitals: string;
    anthropometrics?: string;
    physicalExam: Record<string, string> | string;
    labs: string;
    labInterpretation?: string[];
    imaging: string;
    imagingCorrelation?: string[];
    clinicalAssistance?: string[];
  };
  assessment: {
    summary: string;
    rationale: string[];
    icdCodes?: string[];
    differentialDiagnosis?: DifferentialDiagnosisItem[];
  };
  plan: PlanItem[];
  broaderManagement?: BroaderManagement;
}

type EntryType = "structured" | "raw";

export interface ChartEntry {
  id: string;
  encounterId?: string;
  date: string;
  title: string;
  type: string;
  entryType?: EntryType;
  soap?: SoapNote;
  rawText?: string;
  originalNote?: string;
  specialization?: string;
  attachments?: FileUpload[];
  references?: string[];
  groundingSources?: GroundingSource[];
}

export interface CourseEvent {
  id?: string;
  encounterId?: string;
  date: string;
  time?: string;
  event: string;
  details: string;
}

export interface HandoffSummary {
  patientId: string;
  oneLiner: string;
  activeIssues: string[];
  toDoList: string[];
  /** Legacy saved field retained for backward-compatible import/export. */
  clinicalPearl?: string;
}

export interface SubNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isAssistant?: boolean;
  groundingSources?: GroundingSource[];
  highlightedText?: string;
  attachments?: FileUpload[];
}

export interface PatientNote {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments?: FileUpload[];
  isAssistant?: boolean;
  groundingSources?: GroundingSource[];
  subNotes?: SubNote[];
}

export interface MedicationOrder {
  id: string;
  encounterId?: string;
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  status: MedicationStatus;
  prescribedDate: string;
  prescribedBy: string;
  notes?: string;
  quantity?: string;
}

export interface AiPatientContext {
  id: string; // Unique identifier for the patient chart
  patientInfo: GeneralData; // Persistent Face Sheet data
  encounters?: Encounter[];
  entries: ChartEntry[]; // Longitudinal history
  course: CourseEvent[];
  handoff: HandoffSummary;
  orders?: PatientOrder[];
  medications?: MedicationOrder[];
  notes?: PatientNote[];
  groundingSources?: GroundingSource[];
  references?: string[];
}

export type PhotoCategory = "Physical Exam" | "Laboratory" | "Imaging";

export interface FileUpload {
  file: File;
  previewUrl?: string;
  base64: string;
  mimeType: string;
  category?: PhotoCategory;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  isError?: boolean;
  groundingSources?: GroundingSource[];
  attachments?: FileUpload[];
  title?: string;
}

interface SuggestionItem {
  text: string;
  rationale: string;
}

export interface SuggestionsData {
  questions: SuggestionItem[];
  tests: SuggestionItem[];
}

export type OrderCategory =
  "Lab" | "Imaging" | "Medication" | "Procedure" | "Blood" | "Papers" | "Other";
export interface PatientOrder {
  id: string;
  encounterId?: string;
  name: string;
  dateOrdered: string;
  targetDate: string;
  status: OrderStatus;
  notes: string;
  category?: OrderCategory;
  sortOrder?: number;
  groupId?: string;
  groupName?: string;
  sourceText?: string;
}

export interface ChartHistoryEntry {
  date: string;
  title: string;
  entryType?: "structured" | "raw";
  soap?: SoapNote;
  rawText?: string;
}

export interface GenerateChartResult {
  id: string;
  patientInfo: GeneralData;
  encounters?: Encounter[];
  soap: SoapNote;
  course: CourseEvent[];
  handoff: HandoffSummary;
  orders?: PatientOrder[];
  medications?: MedicationOrder[];
  notes?: PatientNote[];
  groundingSources?: GroundingSource[];
  references?: string[];
}

export interface GenerateChartRequest {
  text: string;
  files: File[];
  specialization?: string;
  useSearch?: boolean;
  history?: ChartEntry[];
  currentPatientInfo?: GeneralData | null;
}

export interface GenerateProgressNoteRequest {
  text: string;
  files: File[];
  specialization?: string;
  useSearch?: boolean;
  history?: ChartEntry[];
}

export interface ReassessNoteRequest {
  soap: SoapNote;
  history?: ChartEntry[];
  specialization?: string;
  useSearch?: boolean;
}

export interface ChatRequest {
  history: ChatMessage[];
  message: string;
  patient: AiPatientContext | null;
  useSearch?: boolean;
  signal?: AbortSignal;
  attachments?: FileUpload[];
}

export interface NoteThreadRequest {
  history: ChatMessage[];
  message: string;
  noteContent: string;
  noteTitle: string;
  highlightedContext?: string;
  patient?: AiPatientContext | null;
  signal?: AbortSignal;
  attachments?: FileUpload[];
}

export interface RefreshSummaryRequest {
  currentSummary: HandoffSummary;
  patientInfo: GeneralData;
  recentEntries: ChartEntry[];
  recentCourse: CourseEvent[];
  specialization: string;
}

export interface GenerateProgressNoteResult {
  soap: SoapNote;
  courseEvent: { event: string; details: string };
  inferredDate?: string | null;
  inferredTime?: string | null;
  groundingSources?: GroundingSource[];
  references?: string[];
}

export interface ReassessNoteResult {
  assessment: SoapNote["assessment"];
  plan: PlanItem[];
  groundingSources?: GroundingSource[];
  references?: string[];
}

export interface TextResult {
  text: string;
  groundingSources?: GroundingSource[];
}

export interface ChatResult extends TextResult {
  title?: string;
}

export interface LabAnalysisResult {
  labs: string;
  labInterpretation: string[];
}

export interface ImagingAnalysisResult {
  imaging: string;
  imagingCorrelation: string[];
}

export interface ParsedPrescription {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  sig: string;
  quantity: string;
}
