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
      request.model,
      request.specialization,
      request.useSearch,
      request.history,
      request.currentPatientInfo,
    ),
  generateProgressNote: async (request) =>
    (await import("./tasks/chartGeneration")).generateProgressNote(
      request.text,
      request.files,
      request.model,
      request.specialization,
      request.useSearch,
      request.history,
    ),
  reassessNote: async (request) =>
    (await import("./tasks/chartGeneration")).reassessSoapNote(
      request.soap,
      request.history,
      request.model,
      request.specialization,
      request.useSearch,
    ),
  sendChatMessage: async (request) => {
    throwIfAborted(request.signal);
    const { sendChatMessage } = await import("./tasks/conversation");
    throwIfAborted(request.signal);
    return sendChatMessage(
      request.model,
      request.history,
      request.message,
      request.patient,
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
      request.model,
      request.history,
      request.message,
      request.noteContent,
      request.noteTitle,
      request.highlightedContext,
      request.patient,
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
    model,
  ) =>
    (await import("./tasks/clinicalAssistance")).integrateClinicalData(
      section,
      currentContent,
      suggestions,
      userInput,
      model,
    ),
  analyzeClinicalPhotos: async (files, currentPhysicalExam, model) =>
    (await import("./tasks/mediaAnalysis")).analyzeClinicalPhotos(
      files,
      currentPhysicalExam,
      model,
    ),
  analyzeLabPhotos: async (files, currentLabs, currentInterpretation, model) =>
    (await import("./tasks/mediaAnalysis")).analyzeLabPhotos(
      files,
      currentLabs,
      currentInterpretation,
      model,
    ),
  analyzeImagingPhotos: async (
    files,
    currentImaging,
    currentCorrelation,
    model,
  ) =>
    (await import("./tasks/mediaAnalysis")).analyzeImagingPhotos(
      files,
      currentImaging,
      currentCorrelation,
      model,
    ),
  generateInputSuggestions: async (notes, model) =>
    (await import("./tasks/inputAssistance")).generateInputSuggestions(
      notes,
      model,
    ),
  generateResponseTitle: async (userMessage, responseContent, model) =>
    (await import("./tasks/inputAssistance")).generateResponseTitle(
      userMessage,
      responseContent,
      model,
    ),
  refreshSummary: async (request) =>
    (await import("./tasks/summary")).refreshPatientSummary(
      request.currentSummary,
      request.patientInfo,
      request.recentEntries,
      request.recentCourse,
      request.model,
      request.specialization,
    ),
  generateHomeInstructions: async (soap) =>
    (await import("./tasks/discharge")).generateHomeInstructions(soap),
  parsePrescriptions: async (plan) =>
    (await import("./tasks/discharge")).parsePrescriptions(plan),
};
