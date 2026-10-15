import type {
  GenerateChartRequest,
  GenerateProgressNoteRequest,
  ReassessNoteRequest,
  ChatRequest,
  NoteThreadRequest,
  RefreshSummaryRequest,
  GenerateChartResult,
  PlanItem,
  SuggestionsData,
  HandoffSummary,
  GenerateProgressNoteResult,
  ReassessNoteResult,
  TextResult,
  ChatResult,
  LabAnalysisResult,
  ImagingAnalysisResult,
  ParsedPrescription,
} from "./contracts";

export interface ClinicalAiGateway {
  generateChart(request: GenerateChartRequest): Promise<GenerateChartResult>;
  generateProgressNote(
    request: GenerateProgressNoteRequest,
  ): Promise<GenerateProgressNoteResult>;
  reassessNote(request: ReassessNoteRequest): Promise<ReassessNoteResult>;
  sendChatMessage(request: ChatRequest): Promise<ChatResult>;
  sendNoteThreadMessage(request: NoteThreadRequest): Promise<TextResult>;
  transcribeAudio(audio: Blob): Promise<string>;
  lookup(query: string, signal?: AbortSignal): Promise<TextResult>;
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
  ): Promise<LabAnalysisResult>;
  analyzeImagingPhotos(
    files: File[],
    currentImaging?: string,
    currentCorrelation?: string,
  ): Promise<ImagingAnalysisResult>;
  generateInputSuggestions(notes: string): Promise<SuggestionsData>;
  generateResponseTitle(
    userMessage: string,
    responseContent: string,
  ): Promise<string>;
  refreshSummary(request: RefreshSummaryRequest): Promise<HandoffSummary>;
  parsePrescriptions(plan: PlanItem[]): Promise<ParsedPrescription[]>;
}
