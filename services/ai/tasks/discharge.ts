import { Type } from "@google/genai";
import type { PlanItem, SoapNote } from "../../../types";
import {
  HOME_INSTRUCTIONS_PROMPT,
  PRESCRIPTION_PARSE_PROMPT,
} from "../prompts";
import { callGemini } from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";
import { logDiagnostic } from "../../diagnosticLogger";

export type HomeInstructions = {
  diet: string[];
  lifestyle: string[];
  activity: string[];
  redFlags: string[];
  referrals: string[];
  followUp: string;
};

export type ParsedPrescription = {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  sig: string;
  quantity: string;
};

export const generateHomeInstructions = async (
  soapData: SoapNote,
): Promise<HomeInstructions> => {
  const prompt = HOME_INSTRUCTIONS_PROMPT(soapData);

  try {
    const result = await callGemini({
      contents: { parts: [{ text: prompt }] },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diet: { type: Type.ARRAY, items: { type: Type.STRING } },
          lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
          activity: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          referrals: { type: Type.ARRAY, items: { type: Type.STRING } },
          followUp: { type: Type.STRING },
        },
        required: [
          "diet",
          "lifestyle",
          "activity",
          "redFlags",
          "referrals",
          "followUp",
        ],
      },
    });
    return result.text
      ? extractAndParseJSON<HomeInstructions>(result.text)
      : {
          diet: [],
          lifestyle: [],
          activity: [],
          redFlags: [],
          referrals: [],
          followUp: "",
        };
  } catch {
    logDiagnostic("error", "Home-instructions request failed.");
    throw new Error("Failed home instructions.");
  }
};

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
