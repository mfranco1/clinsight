import { Type } from "@google/genai";
import type { Part } from "@google/genai";
import type {
  ChartEntry,
  CourseEvent,
  GeneralData,
  GroundingSource,
  HandoffSummary,
  MedicalChartResponse,
  PlanItem,
  SoapNote,
} from "../../../types";
import { formatChartHistory } from "../../../utils/clinicalText";
import { getCurrentTime24, getTodayDate } from "../../../utils/date";
import { createId } from "../../../utils/ids";
import {
  GET_CHART_SYSTEM_INSTRUCTION,
  PROGRESS_NOTE_SYSTEM_INSTRUCTION,
  REASSESS_SOAP_PROMPT,
} from "../prompts";
import { SCHEMA_DESCRIPTIONS } from "../schemaDescriptions";
import { callGemini, convertFilesToParts } from "../geminiTransport";
import { extractAndParseJSON, postProcessSoapNote } from "../responseParsing";
import {
  ASSESSMENT_SCHEMA,
  BROADER_MANAGEMENT_SCHEMA,
  PLAN_SCHEMA,
  SOAP_SCHEMA,
} from "../schemas/soap";

interface GeneratedMedicalChart {
  patientInfo: GeneralData;
  soap: SoapNote;
  course: CourseEvent[];
  handoff: HandoffSummary;
  references?: string[];
}

interface GeneratedProgressNote {
  soap: SoapNote;
  courseEvent: { event: string; details: string };
  inferredDate?: string | null;
  inferredTime?: string | null;
  references?: string[];
}

interface ReassessedNote extends Pick<
  SoapNote,
  "assessment" | "plan" | "broaderManagement"
> {
  references?: string[];
  groundingSources?: GroundingSource[];
}

export const generateMedicalChart = async (
  textInput: string,
  files: File[],
  specialization: string = "General Practice",
  useGoogleSearch = false,
  history: ChartEntry[] = [],
  currentPatientInfo: GeneralData | null = null,
): Promise<Omit<MedicalChartResponse, "entries"> & { soap: SoapNote }> => {
  const parts: Part[] = [];

  if (currentPatientInfo) {
    parts.push({
      text: `EXISTING PATIENT FACE SHEET (Already recorded):\n${JSON.stringify(currentPatientInfo)}\n\n`,
    });
  }

  if (history.length > 0) {
    const historyContext = history
      .slice(0, 5)
      .map((entry) => {
        let summary = "No summary available";
        if (entry.entryType === "raw")
          summary = entry.rawText || "Manual Progress Note";
        else if (entry.soap) summary = entry.soap.assessment.summary;
        return `[${entry.date} - ${entry.title}]: ${summary}`;
      })
      .join("\n");
    parts.push({
      text: `CLINICAL HISTORY (Story So Far):\n${historyContext}\n\nINSTRUCTION: Reconcile new findings with this history to ensure continuity and track trends.\n\n`,
    });
  }

  if (specialization !== "General Practice") {
    parts.push({
      text: `USER SPECIALIZATION: ${specialization}\nPlease focus the documentation standards and priorities based on this specialty.\n\n`,
    });
  }
  if (textInput)
    parts.push({
      text: `NEW PATIENT DATA / PROGRESS UPDATE:\n${textInput}\n\n`,
    });
  if (files?.length) parts.push(...(await convertFilesToParts(files)));

  const result = await callGemini({
    systemInstruction: GET_CHART_SYSTEM_INSTRUCTION(
      specialization,
      useGoogleSearch,
    ),
    contents: { parts },
    useGoogleSearch,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        patientInfo: {
          type: Type.OBJECT,
          description: SCHEMA_DESCRIPTIONS.patientInfo_overall,
          properties: {
            patientName: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.patientName,
            },
            ageSex: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.ageSex,
            },
            mrn: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.mrn },
            dob: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.dob },
            admissionDate: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.admissionDate,
            },
            address: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.address,
            },
            religion: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.religion,
            },
            handedness: {
              type: Type.STRING,
              description: SCHEMA_DESCRIPTIONS.handedness,
            },
            location: {
              type: Type.STRING,
              nullable: true,
              description: SCHEMA_DESCRIPTIONS.location,
            },
            bloodType: {
              type: Type.STRING,
              nullable: true,
              description: SCHEMA_DESCRIPTIONS.bloodType,
            },
            contactNumber: {
              type: Type.STRING,
              nullable: true,
              description: SCHEMA_DESCRIPTIONS.contactNumber,
            },
            email: {
              type: Type.STRING,
              nullable: true,
              description: SCHEMA_DESCRIPTIONS.email,
            },
          },
          required: [
            "patientName",
            "ageSex",
            "mrn",
            "dob",
            "admissionDate",
            "address",
            "religion",
            "handedness",
          ],
        },
        soap: SOAP_SCHEMA,
        course: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.course_overall,
          items: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.course_date,
              },
              time: {
                type: Type.STRING,
                nullable: true,
                description: SCHEMA_DESCRIPTIONS.course_time,
              },
              event: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.course_event,
              },
              details: {
                type: Type.STRING,
                description: SCHEMA_DESCRIPTIONS.course_details,
              },
            },
            required: ["date", "event", "details"],
          },
        },
        handoff: {
          type: Type.OBJECT,
          description: SCHEMA_DESCRIPTIONS.handoff_overall,
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
          },
          required: ["patientId", "oneLiner", "activeIssues", "toDoList"],
        },
        references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.references,
        },
      },
      required: ["patientInfo", "soap", "course", "handoff"],
    },
  });

  const rawData = extractAndParseJSON<GeneratedMedicalChart>(result.text);
  return {
    id: createId(),
    patientInfo: rawData.patientInfo,
    course: rawData.course,
    handoff: rawData.handoff,
    groundingSources: result.groundingSources || [],
    references: rawData.references || [],
    soap: postProcessSoapNote(rawData.soap),
  };
};

export const generateProgressNote = async (
  textInput: string,
  files: File[],
  specialization: string = "General Practice",
  useGoogleSearch = false,
  history: ChartEntry[] = [],
): Promise<{
  soap: SoapNote;
  courseEvent: { event: string; details: string };
  inferredDate?: string | null;
  inferredTime?: string | null;
  groundingSources?: GroundingSource[];
  references?: string[];
}> => {
  const parts: Part[] = [];
  const nowRef = `${getTodayDate()} ${getCurrentTime24()}`;
  parts.push({
    text: `CURRENT REFERENCE DATE AND TIME: ${nowRef}\nUse this as the baseline to compute or resolve any relative dates or times mentioned in the input data (e.g. 'yesterday', 'two days ago', 'this morning').\n\n`,
  });

  if (history.length > 0) {
    const historyContext = formatChartHistory(history.slice(0, 3).reverse());
    parts.push({
      text: `RECENT CLINICAL HISTORY (Baseline for comparison):\n${historyContext}\n\nINSTRUCTION: Compare the new update against this baseline. Highlight trends, improvements, or deteriorations. Be specific about changes in findings or state.\n\n`,
    });
  }
  if (textInput)
    parts.push({
      text: `NEW PATIENT DATA / PROGRESS UPDATE:\n${textInput}\n\n`,
    });
  if (files?.length) parts.push(...(await convertFilesToParts(files)));
  parts.push({
    text: `INSTRUCTION FOR DATE/TIME EXTRACTION:\nIf the new patient data / progress update or any of the uploaded files explicitly mention or imply the date and/or time of this update/encounter/interaction (e.g. 'May 20', 'yesterday at 3pm', 'last night'), extract/infer that date (format: YYYY-MM-DD) and time (format: HH:MM in 24-hour style) and return them in 'inferredDate' and 'inferredTime' respectively. If a relative date like 'yesterday' is used, calculate it relative to the CURRENT REFERENCE DATE AND TIME above. If no specific date or time is specified and cannot be inferred, return null for those fields.\n\n`,
  });

  const result = await callGemini({
    systemInstruction: PROGRESS_NOTE_SYSTEM_INSTRUCTION(
      specialization,
      useGoogleSearch,
    ),
    contents: { parts },
    useGoogleSearch,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        soap: SOAP_SCHEMA,
        courseEvent: {
          type: Type.OBJECT,
          properties: {
            event: {
              type: Type.STRING,
              description:
                "Short title for the timeline event (e.g., 'Day 2 Progress', 'Cardiology Follow-up')",
            },
            details: {
              type: Type.STRING,
              description:
                "1-2 sentence summary of the progress and key changes.",
            },
          },
          required: ["event", "details"],
        },
        inferredDate: {
          type: Type.STRING,
          nullable: true,
          description:
            "An extracted or inferred date of the encounter in YYYY-MM-DD format based on the input text/files, or null if not stated of cannot be inferred.",
        },
        inferredTime: {
          type: Type.STRING,
          nullable: true,
          description:
            "An extracted or inferred time of the encounter in HH:MM format (24-hour style), or null if not stated or cannot be inferred.",
        },
        references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.references,
        },
      },
      required: ["soap", "courseEvent"],
    },
  });

  const rawData = extractAndParseJSON<GeneratedProgressNote>(result.text);
  return {
    soap: postProcessSoapNote(rawData.soap),
    courseEvent: rawData.courseEvent,
    inferredDate: rawData.inferredDate,
    inferredTime: rawData.inferredTime,
    groundingSources: result.groundingSources || [],
    references: rawData.references || [],
  };
};

export const reassessSoapNote = async (
  currentSoap: SoapNote,
  history: ChartEntry[] = [],
  specialization: string = "General Practice",
  useGoogleSearch = false,
): Promise<{
  assessment: SoapNote["assessment"];
  plan: PlanItem[];
  groundingSources?: GroundingSource[];
  references?: string[];
}> => {
  const prompt = REASSESS_SOAP_PROMPT(
    currentSoap,
    history,
    specialization,
    useGoogleSearch,
  );
  const result = await callGemini({
    contents: { parts: [{ text: prompt }] },
    useGoogleSearch,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        assessment: ASSESSMENT_SCHEMA,
        plan: PLAN_SCHEMA,
        broaderManagement: BROADER_MANAGEMENT_SCHEMA,
        references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.references,
        },
      },
      required: ["assessment", "plan"],
    },
  });

  const data = extractAndParseJSON<ReassessedNote>(result.text);
  if (result.groundingSources) data.groundingSources = result.groundingSources;
  return data;
};
