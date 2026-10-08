import { DEFAULT_MODEL } from "../../config/appConfig";
import type {
  FileUpload,
  MedicalChartResponse,
  PlanItem,
  SoapNote,
} from "../../types";
import { safeStorage } from "../../utils/storage";
import { geminiGateway } from "./geminiGateway";

/** Positional feature actions preserve the existing component API during gateway migration. */
export const transcribeAudio = (audio: Blob) =>
  geminiGateway.transcribeAudio(audio);

export const sendChatMessage = (
  model: string = DEFAULT_MODEL,
  history: Parameters<typeof geminiGateway.sendChatMessage>[0]["history"],
  message: string,
  patient: MedicalChartResponse | null,
  useSearch = false,
  signal?: AbortSignal,
  attachments?: FileUpload[],
) =>
  geminiGateway.sendChatMessage({
    model,
    history,
    message,
    patient,
    useSearch,
    signal,
    attachments,
  });

export const sendNoteThreadMessage = (
  model: string = safeStorage.getItem("clinsight_default_model") ||
    DEFAULT_MODEL,
  history: Parameters<typeof geminiGateway.sendNoteThreadMessage>[0]["history"],
  message: string,
  noteContent: string,
  noteTitle: string,
  highlightedContext?: string,
  patient?: MedicalChartResponse | null,
  signal?: AbortSignal,
  attachments?: FileUpload[],
) =>
  geminiGateway.sendNoteThreadMessage({
    model,
    history,
    message,
    noteContent,
    noteTitle,
    highlightedContext,
    patient,
    signal,
    attachments,
  });

export const generateClinicalSuggestions = (
  section: "Subjective" | "Objective",
  context: string,
) => geminiGateway.generateClinicalSuggestions(section, context);

export const integrateClinicalData = (
  section: string,
  currentContent: string,
  suggestions: string[],
  userInput: string,
  model = DEFAULT_MODEL,
) =>
  geminiGateway.integrateClinicalData(
    section,
    currentContent,
    suggestions,
    userInput,
    model,
  );

export const analyzeClinicalPhotos = (
  files: File[],
  currentPhysicalExam = "",
  model = DEFAULT_MODEL,
) => geminiGateway.analyzeClinicalPhotos(files, currentPhysicalExam, model);

export const analyzeLabPhotos = (
  files: File[],
  currentLabs = "",
  currentInterpretation = "",
  model = DEFAULT_MODEL,
) =>
  geminiGateway.analyzeLabPhotos(
    files,
    currentLabs,
    currentInterpretation,
    model,
  );

export const analyzeImagingPhotos = (
  files: File[],
  currentImaging = "",
  currentCorrelation = "",
  model = DEFAULT_MODEL,
) =>
  geminiGateway.analyzeImagingPhotos(
    files,
    currentImaging,
    currentCorrelation,
    model,
  );

export const medicalLookup = (query: string, signal?: AbortSignal) =>
  geminiGateway.lookup(query, signal);
export const generateInputSuggestions = (
  notes: string,
  model = DEFAULT_MODEL,
) => geminiGateway.generateInputSuggestions(notes, model);
export const parsePrescriptions = (plan: PlanItem[]) =>
  geminiGateway.parsePrescriptions(plan);
