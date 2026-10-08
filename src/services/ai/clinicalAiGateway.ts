import type {
  ChartEntry,
  ChatMessage,
  CourseEvent,
  FileUpload,
  GeneralData,
  GroundingSource,
  HandoffSummary,
  MedicalChartResponse,
  PlanItem,
  SoapNote,
  SuggestionsData,
} from "../../types";

interface GenerateChartRequest {
  text: string;
  files: File[];
  specialization?: string;
  useSearch?: boolean;
  history?: ChartEntry[];
  currentPatientInfo?: GeneralData | null;
}

interface GenerateProgressNoteRequest {
  text: string;
  files: File[];
  specialization?: string;
  useSearch?: boolean;
  history?: ChartEntry[];
}

interface ReassessNoteRequest {
  soap: SoapNote;
  history?: ChartEntry[];
  specialization?: string;
  useSearch?: boolean;
}

interface ChatRequest {
  history: ChatMessage[];
  message: string;
  patient: MedicalChartResponse | null;
  useSearch?: boolean;
  signal?: AbortSignal;
  attachments?: FileUpload[];
}

interface NoteThreadRequest {
  history: ChatMessage[];
  message: string;
  noteContent: string;
  noteTitle: string;
  highlightedContext?: string;
  patient?: MedicalChartResponse | null;
  signal?: AbortSignal;
  attachments?: FileUpload[];
}

interface RefreshSummaryRequest {
  currentSummary: HandoffSummary;
  patientInfo: GeneralData;
  recentEntries: ChartEntry[];
  recentCourse: CourseEvent[];
  specialization: string;
}

export interface ClinicalAiGateway {
  generateChart(
    request: GenerateChartRequest,
  ): Promise<Omit<MedicalChartResponse, "entries"> & { soap: SoapNote }>;
  generateProgressNote(request: GenerateProgressNoteRequest): Promise<{
    soap: SoapNote;
    courseEvent: { event: string; details: string };
    inferredDate?: string | null;
    inferredTime?: string | null;
    groundingSources?: GroundingSource[];
    references?: string[];
  }>;
  reassessNote(request: ReassessNoteRequest): Promise<{
    assessment: SoapNote["assessment"];
    plan: PlanItem[];
    groundingSources?: GroundingSource[];
    references?: string[];
  }>;
  sendChatMessage(request: ChatRequest): Promise<{
    text: string;
    title?: string;
    groundingSources?: GroundingSource[];
  }>;
  sendNoteThreadMessage(
    request: NoteThreadRequest,
  ): Promise<{ text: string; groundingSources?: GroundingSource[] }>;
  transcribeAudio(audio: Blob): Promise<string>;
  lookup(
    query: string,
    signal?: AbortSignal,
  ): Promise<{ text: string; groundingSources?: GroundingSource[] }>;
  generateClinicalSuggestions(
    section: "Subjective" | "Objective",
    context: string,
  ): Promise<string[]>;
  integrateClinicalData(
    section: string,
    currentContent: string,
    suggestions: string[],
    userInput: string,
  ): Promise<string>;
  analyzeClinicalPhotos(
    files: File[],
    currentPhysicalExam?: string,
  ): Promise<string>;
  analyzeLabPhotos(
    files: File[],
    currentLabs?: string,
    currentInterpretation?: string,
  ): Promise<{ labs: string; labInterpretation: string[] }>;
  analyzeImagingPhotos(
    files: File[],
    currentImaging?: string,
    currentCorrelation?: string,
  ): Promise<{ imaging: string; imagingCorrelation: string[] }>;
  generateInputSuggestions(notes: string): Promise<SuggestionsData>;
  generateResponseTitle(
    userMessage: string,
    responseContent: string,
  ): Promise<string>;
  refreshSummary(request: RefreshSummaryRequest): Promise<HandoffSummary>;
  parsePrescriptions(plan: PlanItem[]): Promise<
    Array<{
      drug: string;
      dose: string;
      route: string;
      frequency: string;
      duration: string;
      sig: string;
      quantity: string;
    }>
  >;
}
