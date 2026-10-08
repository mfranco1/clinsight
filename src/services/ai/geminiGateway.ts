import {
  generateMedicalChart,
  generateProgressNote,
  reassessSoapNote,
} from "./tasks/chartGeneration";
import {
  analyzeClinicalPhotos,
  analyzeImagingPhotos,
  analyzeLabPhotos,
  transcribeAudio,
} from "./tasks/mediaAnalysis";
import {
  generateClinicalSuggestions,
  integrateClinicalData,
} from "./tasks/clinicalAssistance";
import { sendChatMessage, sendNoteThreadMessage } from "./tasks/conversation";
import {
  generateInputSuggestions,
  generateResponseTitle,
  medicalLookup,
} from "./tasks/inputAssistance";
import { refreshPatientSummary } from "./tasks/summary";
import {
  generateHomeInstructions,
  parsePrescriptions,
} from "./tasks/discharge";
import type { ClinicalAiGateway } from "./clinicalAiGateway";

/** Adapts the existing direct Gemini service to the feature-facing task contract. */
export const geminiGateway: ClinicalAiGateway = {
  generateChart: ({
    text,
    files,
    model,
    specialization,
    useSearch,
    history,
    currentPatientInfo,
  }) =>
    generateMedicalChart(
      text,
      files,
      model,
      specialization,
      useSearch,
      history,
      currentPatientInfo,
    ),
  generateProgressNote: ({
    text,
    files,
    model,
    specialization,
    useSearch,
    history,
  }) =>
    generateProgressNote(
      text,
      files,
      model,
      specialization,
      useSearch,
      history,
    ),
  reassessNote: ({ soap, history, model, specialization, useSearch }) =>
    reassessSoapNote(soap, history, model, specialization, useSearch),
  sendChatMessage: ({
    model,
    history,
    message,
    patient,
    useSearch,
    signal,
    attachments,
  }) =>
    sendChatMessage(
      model,
      history,
      message,
      patient,
      useSearch,
      signal,
      attachments,
    ),
  sendNoteThreadMessage: ({
    model,
    history,
    message,
    noteContent,
    noteTitle,
    highlightedContext,
    patient,
    signal,
    attachments,
  }) =>
    sendNoteThreadMessage(
      model,
      history,
      message,
      noteContent,
      noteTitle,
      highlightedContext,
      patient,
      signal,
      attachments,
    ),
  transcribeAudio,
  lookup: medicalLookup,
  generateClinicalSuggestions,
  integrateClinicalData,
  analyzeClinicalPhotos,
  analyzeLabPhotos,
  analyzeImagingPhotos,
  generateInputSuggestions,
  generateResponseTitle,
  refreshSummary: ({
    currentSummary,
    patientInfo,
    recentEntries,
    recentCourse,
    model,
    specialization,
  }) =>
    refreshPatientSummary(
      currentSummary,
      patientInfo,
      recentEntries,
      recentCourse,
      model,
      specialization,
    ),
  generateHomeInstructions,
  parsePrescriptions,
};
