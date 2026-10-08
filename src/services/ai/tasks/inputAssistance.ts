import { Type } from "@google/genai";
import type { GroundingSource, SuggestionsData } from "../../../types";
import { INPUT_SUGGESTIONS_PROMPT, MEDICAL_LOOKUP_PROMPT } from "../prompts";
import { callGemini } from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";
import { logDiagnostic } from "../../diagnosticLogger";

export const generateInputSuggestions = async (
  notes: string,
): Promise<SuggestionsData> => {
  const prompt = `CURRENT DRAFT:\n${notes}\n\n${INPUT_SUGGESTIONS_PROMPT}`;
  const result = await callGemini({
    contents: { parts: [{ text: prompt }] },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ["text", "rationale"],
          },
        },
        tests: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ["text", "rationale"],
          },
        },
      },
      required: ["questions", "tests"],
    },
  });
  return extractAndParseJSON<SuggestionsData>(result.text);
};

export const medicalLookup = async (
  query: string,
  signal?: AbortSignal,
): Promise<{ text: string; groundingSources?: GroundingSource[] }> =>
  callGemini({
    systemInstruction: MEDICAL_LOOKUP_PROMPT,
    contents: { parts: [{ text: query }] },
    useGoogleSearch: true,
    signal,
  });

export const generateResponseTitle = async (
  userMessage: string,
  responseContent: string,
): Promise<string> => {
  try {
    const prompt = `Based on the following practitioner prompt and the assistant response, generate a concise, clinical-record-appropriate title of 2 to 5 words for this interaction. Do not use quotes, asterisks, punctuation, or conversational filler. Keep it strictly focused on the medical or administrative focus (e.g. "Laboratory Results Review", "Hypertension Counseling", "Pediatric Feeding Guide", "Insulin Dose Adjustment").Do not use emdashes.

Practitioner Query:
"${userMessage}"

Assistant Response:
"${responseContent.substring(0, 1000)}"`;
    const result = await callGemini({
      contents: { parts: [{ text: prompt }] },
    });
    return result.text.trim().replace(/^['"*]+|['"*]+$/g, "");
  } catch {
    logDiagnostic("error", "Response-title generation failed.");
    return "Clinical Conversation";
  }
};
