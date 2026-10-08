import { Type } from "@google/genai";
import {
  CLINICAL_PHOTO_PROMPT,
  IMAGING_PHOTO_PROMPT,
  LAB_PHOTO_PROMPT,
  TRANSCRIBE_PROMPT,
} from "../prompts";
import {
  blobToBase64,
  callGemini,
  convertFilesToParts,
} from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await blobToBase64(audioBlob);
  const result = await callGemini({
    contents: {
      parts: [
        { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
        { text: TRANSCRIBE_PROMPT },
      ],
    },
  });
  return result.text;
};

export const analyzeClinicalPhotos = async (
  files: File[],
  currentPhysicalExam = "",
): Promise<string> => {
  const parts = await convertFilesToParts(files);
  parts.push({ text: CLINICAL_PHOTO_PROMPT(currentPhysicalExam) });
  const result = await callGemini({ contents: { parts } });
  return result.text || currentPhysicalExam;
};

export const analyzeLabPhotos = async (
  files: File[],
  currentLabs = "",
  currentInterpretation = "",
): Promise<{ labs: string; labInterpretation: string[] }> => {
  const parts = await convertFilesToParts(files);
  parts.push({ text: LAB_PHOTO_PROMPT(currentLabs, currentInterpretation) });
  const result = await callGemini({
    contents: { parts },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        labs: { type: Type.STRING },
        labInterpretation: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["labs", "labInterpretation"],
    },
  });
  return extractAndParseJSON(result.text);
};

export const analyzeImagingPhotos = async (
  files: File[],
  currentImaging = "",
  currentCorrelation = "",
): Promise<{ imaging: string; imagingCorrelation: string[] }> => {
  const parts = await convertFilesToParts(files);
  parts.push({
    text: IMAGING_PHOTO_PROMPT(currentImaging, currentCorrelation),
  });
  const result = await callGemini({
    contents: { parts },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        imaging: { type: Type.STRING },
        imagingCorrelation: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["imaging", "imagingCorrelation"],
    },
  });
  return extractAndParseJSON(result.text);
};
