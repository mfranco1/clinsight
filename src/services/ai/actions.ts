import type {
  FileUpload,
  MedicalChartResponse,
  PlanItem,
  SoapNote,
} from "../../types";
import { geminiGateway } from "./geminiGateway";

/** Positional feature actions preserve the existing component API during gateway migration. */
export const transcribeAudio = (audio: Blob) =>
  geminiGateway.transcribeAudio(audio);

export const sendChatMessage = (
  history: Parameters<typeof geminiGateway.sendChatMessage>[0]["history"],
  message: string,
  patient: MedicalChartResponse | null,
  useSearch = false,
  signal?: AbortSignal,
  attachments?: FileUpload[],
) =>
  geminiGateway.sendChatMessage({
    history,
    message,
    patient,
    useSearch,
    signal,
    attachments,
  });

export const sendNoteThreadMessage = (
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
) =>
  geminiGateway.integrateClinicalData(
    section,
    currentContent,
    suggestions,
    userInput,
  );

export const analyzeClinicalPhotos = (
  files: File[],
  currentPhysicalExam = "",
) => geminiGateway.analyzeClinicalPhotos(files, currentPhysicalExam);

export const analyzeLabPhotos = (
  files: File[],
  currentLabs = "",
  currentInterpretation = "",
) => geminiGateway.analyzeLabPhotos(files, currentLabs, currentInterpretation);

export const analyzeImagingPhotos = (
  files: File[],
  currentImaging = "",
  currentCorrelation = "",
) =>
  geminiGateway.analyzeImagingPhotos(files, currentImaging, currentCorrelation);

export const medicalLookup = (query: string, signal?: AbortSignal) =>
  geminiGateway.lookup(query, signal);
export const generateInputSuggestions = (notes: string) =>
  geminiGateway.generateInputSuggestions(notes);
export const parsePrescriptions = (plan: PlanItem[]) =>
  geminiGateway.parsePrescriptions(plan);
