import {
  toAiPatientContext,
  toAiPatientInfo,
  toAiEntries,
  toAiCourse,
  toAiSoap,
  toAiPlan,
} from "./contextAdapters";
import type { ClinicalAiGateway } from "./clinicalAiGateway";

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    const error = new Error("AbortError");
    error.name = "AbortError";
    throw error;
  }
};

/** Loads each provider task only when its typed gateway operation is requested. */
export const geminiGateway: ClinicalAiGateway = {
  generateChart: async (request) =>
    (await import("./tasks/chartGeneration")).generateMedicalChart(
      request.text,
      request.files,
      request.specialization,
      request.useSearch,
      toAiEntries(request.history),
      toAiPatientInfo(request.currentPatientInfo),
    ),
  generateProgressNote: async (request) =>
    (await import("./tasks/chartGeneration")).generateProgressNote(
      request.text,
      request.files,
      request.specialization,
      request.useSearch,
      toAiEntries(request.history),
    ),
  reassessNote: async (request) =>
    (await import("./tasks/chartGeneration")).reassessSoapNote(
      toAiSoap(request.soap),
      toAiEntries(request.history),
      request.specialization,
      request.useSearch,
    ),
  sendChatMessage: async (request) => {
    throwIfAborted(request.signal);
    const { sendChatMessage } = await import("./tasks/conversation");
    throwIfAborted(request.signal);
    return sendChatMessage(
      request.history,
      request.message,
      toAiPatientContext(request.patient) ?? null,
      request.useSearch,
      request.signal,
      request.attachments,
    );
  },
  sendNoteThreadMessage: async (request) => {
    throwIfAborted(request.signal);
    const { sendNoteThreadMessage } = await import("./tasks/conversation");
    throwIfAborted(request.signal);
    return sendNoteThreadMessage(
      request.history,
      request.message,
      request.noteContent,
      request.noteTitle,
      request.highlightedContext,
      toAiPatientContext(request.patient) ?? null,
      request.signal,
      request.attachments,
    );
  },
  transcribeAudio: async (audio) =>
    (await import("./tasks/mediaAnalysis")).transcribeAudio(audio),
  lookup: async (query, signal) => {
    throwIfAborted(signal);
    return (await import("./tasks/inputAssistance")).medicalLookup(
      query,
      signal,
    );
  },
  generateClinicalSuggestions: async (section, context) =>
    (await import("./tasks/clinicalAssistance")).generateClinicalSuggestions(
      section,
      context,
    ),
  integrateClinicalData: async (
    section,
    currentContent,
    suggestions,
    userInput,
  ) =>
    (await import("./tasks/clinicalAssistance")).integrateClinicalData(
      section,
      currentContent,
      suggestions,
      userInput,
    ),
  analyzeClinicalPhotos: async (files, currentPhysicalExam) =>
    (await import("./tasks/mediaAnalysis")).analyzeClinicalPhotos(
      files,
      currentPhysicalExam,
    ),
  analyzeLabPhotos: async (files, currentLabs, currentInterpretation) =>
    (await import("./tasks/mediaAnalysis")).analyzeLabPhotos(
      files,
      currentLabs,
      currentInterpretation,
    ),
  analyzeImagingPhotos: async (files, currentImaging, currentCorrelation) =>
    (await import("./tasks/mediaAnalysis")).analyzeImagingPhotos(
      files,
      currentImaging,
      currentCorrelation,
    ),
  generateInputSuggestions: async (notes) =>
    (await import("./tasks/inputAssistance")).generateInputSuggestions(notes),
  generateResponseTitle: async (userMessage, responseContent) =>
    (await import("./tasks/inputAssistance")).generateResponseTitle(
      userMessage,
      responseContent,
    ),
  refreshSummary: async (request) =>
    (await import("./tasks/summary")).refreshPatientSummary(
      request.currentSummary,
      toAiPatientInfo(request.patientInfo)!,
      toAiEntries(request.recentEntries)!,
      toAiCourse(request.recentCourse),
      request.specialization,
    ),
  parsePrescriptions: async (plan) =>
    (await import("./tasks/discharge")).parsePrescriptions(toAiPlan(plan)),
};
