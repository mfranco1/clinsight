
export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT',
  APPEND_ENTRY = 'APPEND_ENTRY',
  PROFILE = 'PROFILE',
  CHART = 'CHART',
  COURSE = 'COURSE',
  HANDOFF = 'HANDOFF',
  ORDERS = 'ORDERS',
  NOTES = 'NOTES',
  SETTINGS = 'SETTINGS',
  ABOUT = 'ABOUT',
  LOGIN = 'LOGIN',
}

/** Branded aliases make cross-module identifiers self-documenting without changing runtime values. */
export type PatientId = string;
export type EncounterId = string;
export type OrderId = string;

export enum PatientStatus {
  ADMITTED = 'ADMITTED',
  OUTPATIENT = 'OUTPATIENT',
  DISCHARGED = 'DISCHARGED',
  DECEASED = 'DECEASED',
}

export enum EncounterType {
  ADMISSION = 'ADMISSION',
  CONSULT = 'CONSULT'
}

export interface Encounter {
  id: string;
  type: EncounterType;
  status: 'ACTIVE' | 'COMPLETED';
  startDate: string; // ISO string Date/Time
  endDate?: string;  // ISO string Date/Time
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
    ros: Record<string, string> | string; // We can keep both or allow string/Record during transitions, but let's make it Record<string, string> and handle string in a robust utility
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
    physicalExam: Record<string, string> | string; // Allow transition/robust types
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

export type EntryType = 'structured' | 'raw';

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

/** Minimal shape accepted by chart-history rendering, including legacy/raw records. */
export type ChartHistoryEntry = Pick<ChartEntry, 'date' | 'title'> &
  Partial<Pick<ChartEntry, 'entryType' | 'soap' | 'rawText'>>;

export interface CourseEvent {
  id?: string; // Adding id for easier deletion/updates if needed
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

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  HOLD = 'HOLD',
  DISCONTINUED = 'DISCONTINUED',
  COMPLETED = 'COMPLETED',
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
  quantity?: string; // For Rx generation
}

export interface MedicalChartResponse {
  id: string; // Unique identifier for the patient chart
  patientInfo: GeneralData; // Persistent Face Sheet data
  encounters?: Encounter[];
  entries: ChartEntry[];    // Longitudinal history
  course: CourseEvent[];
  handoff: HandoffSummary;
  orders?: PatientOrder[];
  medications?: MedicationOrder[];
  notes?: PatientNote[];
  groundingSources?: GroundingSource[];
  references?: string[];
}

export type PhotoCategory = 'Physical Exam' | 'Laboratory' | 'Imaging';

export interface FileUpload {
  file: File;
  previewUrl?: string;
  base64: string;
  mimeType: string;
  category?: PhotoCategory;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  groundingSources?: GroundingSource[];
  attachments?: FileUpload[];
  title?: string;
}

export interface ParsedMed {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  sig: string;
  quantity: string;
}

export interface SuggestionItem {
  text: string;
  rationale: string;
}

export interface SuggestionsData {
  questions: SuggestionItem[];
  tests: SuggestionItem[];
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  DONE = 'DONE',
  DEFERRED = 'DEFERRED',
  FAILED = 'FAILED',
  WAITING = 'WAITING',
  PAUSED = 'PAUSED'
}

export type OrderCategory = 'Lab' | 'Imaging' | 'Medication' | 'Procedure' | 'Blood' | 'Papers' | 'Other';
export type OrderStatusFilter = OrderStatus | 'ALL';

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
