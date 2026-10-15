import { Type } from "@google/genai";
import type { PlanItem, ParsedPrescription } from "../contracts";
import { PRESCRIPTION_PARSE_PROMPT } from "../prompts";
import { callGemini } from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";
import { logDiagnostic } from "../../diagnosticLogger";

export const parsePrescriptions = async (
  plan: PlanItem[],
): Promise<ParsedPrescription[]> => {
  const prompt = PRESCRIPTION_PARSE_PROMPT(plan);

  try {
    const result = await callGemini({
      contents: { parts: [{ text: prompt }] },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            drug: { type: Type.STRING },
            dose: { type: Type.STRING },
            route: { type: Type.STRING },
            frequency: { type: Type.STRING },
            duration: { type: Type.STRING },
            sig: { type: Type.STRING },
            quantity: { type: Type.STRING },
          },
          required: [
            "drug",
            "dose",
            "route",
            "frequency",
            "duration",
            "sig",
            "quantity",
          ],
        },
      },
    });
    return result.text
      ? extractAndParseJSON<ParsedPrescription[]>(result.text)
      : [];
  } catch {
    logDiagnostic("error", "Prescription parsing request failed.");
    return [];
  }
};
