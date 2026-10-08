import { Type } from "@google/genai";
import type {
  ChartEntry,
  CourseEvent,
  GeneralData,
  HandoffSummary,
} from "../../../types";
import { REFRESH_SUMMARY_SYSTEM_INSTRUCTION } from "../prompts";
import { SCHEMA_DESCRIPTIONS } from "../schemaDescriptions";
import { callGemini } from "../geminiTransport";
import { extractAndParseJSON } from "../responseParsing";

export const refreshPatientSummary = async (
  currentSummary: HandoffSummary,
  patientInfo: GeneralData,
  recentEntries: ChartEntry[],
  recentCourse: CourseEvent[],
  model: string,
  specialization: string,
): Promise<HandoffSummary> => {
  const prompt = `
Please update the patient summary based on the recent clinical developments.

PATIENT INFO:
${JSON.stringify(patientInfo, null, 2)}

CURRENT SUMMARY:
${JSON.stringify(currentSummary, null, 2)}

RECENT CHART ENTRIES (Newest first):
${JSON.stringify(
  recentEntries.map((entry) => ({
    date: entry.date,
    type: entry.type,
    soap: entry.soap,
    rawText: entry.rawText,
  })),
  null,
  2,
)}

RECENT COURSE EVENTS:
${JSON.stringify(recentCourse, null, 2)}

Specialization Context: ${specialization}
`;
  const result = await callGemini({
    model,
    contents: { parts: [{ text: prompt }] },
    systemInstruction: REFRESH_SUMMARY_SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        patientId: {
          type: Type.STRING,
          description: SCHEMA_DESCRIPTIONS.handoff_patientId,
        },
        oneLiner: {
          type: Type.STRING,
          description: SCHEMA_DESCRIPTIONS.handoff_oneLiner,
        },
        activeIssues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: SCHEMA_DESCRIPTIONS.handoff_activeIssues,
        },
        toDoList: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: SCHEMA_DESCRIPTIONS.handoff_toDoList,
        },
        clinicalPearl: {
          type: Type.STRING,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.handoff_clinicalPearl,
        },
      },
      required: ["patientId", "oneLiner", "activeIssues", "toDoList"],
    },
  });
  return extractAndParseJSON<HandoffSummary>(result.text);
};
