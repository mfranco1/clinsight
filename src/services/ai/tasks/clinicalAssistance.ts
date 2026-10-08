import { Type } from "@google/genai";
import { markdownBulletsToArray } from "../../../utils/markdown";
import { SCHEMA_DESCRIPTIONS } from "../schemaDescriptions";
import {
  INTEGRATE_DATA_PROMPT,
  OBJECTIVE_SUGGESTIONS_PROMPT,
  SUBJECTIVE_SUGGESTIONS_PROMPT,
} from "../prompts";
import { callGemini } from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";
import { logDiagnostic } from "../../diagnosticLogger";

export const generateClinicalSuggestions = async (
  section: "Subjective" | "Objective",
  contextData: string,
): Promise<string[]> => {
  const isSubjective = section === "Subjective";
  const prompt = isSubjective
    ? SUBJECTIVE_SUGGESTIONS_PROMPT(contextData)
    : OBJECTIVE_SUGGESTIONS_PROMPT(contextData);
  const description = isSubjective
    ? SCHEMA_DESCRIPTIONS.subjective_clinicalAssistance
    : SCHEMA_DESCRIPTIONS.objective_clinicalAssistance;

  const result = await callGemini({
    contents: { parts: [{ text: prompt }] },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description,
    },
  });
  try {
    return extractAndParseJSON<string[]>(result.text);
  } catch {
    logDiagnostic(
      "error",
      "Clinical suggestions response could not be parsed as JSON.",
    );
    return markdownBulletsToArray(result.text);
  }
};

export const integrateClinicalData = async (
  sectionTitle: string,
  currentContent: string,
  suggestions: string[],
  userInput: string,
): Promise<string> => {
  const prompt = INTEGRATE_DATA_PROMPT(
    sectionTitle,
    currentContent,
    suggestions,
    userInput,
  );
  const result = await callGemini({
    contents: { parts: [{ text: prompt }] },
  });
  return result.text || currentContent;
};
