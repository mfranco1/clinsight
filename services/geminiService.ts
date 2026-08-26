
import { GoogleGenAI, Type, Content, GenerateContentParameters } from "@google/genai";
import { MedicalChartResponse, ChatMessage, SubNote, PlanItem, GroundingSource, SoapNote, ChartEntry, GeneralData, FileUpload, HandoffSummary, CourseEvent, SuggestionsData } from "../types";
import { formatChartHistory, createId, getTodayDate, getCurrentTime24, markdownBulletsToArray, safeStorage } from "../utils";
import { 
  SYSTEM_INSTRUCTION, 
  DEFAULT_MODEL, 
  DEFAULT_STRUCTURED_MODEL,
  MODELS,
  GROUNDING_INSTRUCTION,
  DIAGNOSIS_RULES,
  TRANSCRIBE_PROMPT,
  CLINICAL_PHOTO_PROMPT,
  LAB_PHOTO_PROMPT,
  IMAGING_PHOTO_PROMPT,
  SUBJECTIVE_SUGGESTIONS_PROMPT,
  OBJECTIVE_SUGGESTIONS_PROMPT,
  INTEGRATE_DATA_PROMPT,
  MEDICAL_LOOKUP_PROMPT,
  HOME_INSTRUCTIONS_PROMPT,
  INPUT_SUGGESTIONS_PROMPT,
  PRESCRIPTION_PARSE_PROMPT,
  REASSESS_SOAP_PROMPT,
  GET_CHART_SYSTEM_INSTRUCTION,
  CHAT_SYSTEM_INSTRUCTION,
  NOTE_THREAD_SYSTEM_INSTRUCTION,
  PROGRESS_NOTE_SYSTEM_INSTRUCTION,
  REFRESH_SUMMARY_SYSTEM_INSTRUCTION,
  SCHEMA_DESCRIPTIONS
} from "../constants";

// Helper to get AI instance
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to sanitize any potential leaking raw model thoughts (such as <thought> or <reasoning> tags or text).
export function sanitizeModelOutput(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // 1. Remove XML/HTML-like tags: <thought>...</thought> or <reasoning>...</reasoning>
  cleaned = cleaned.replace(/<thought>([\s\S]*?)<\/thought>/gi, "");
  cleaned = cleaned.replace(/<reasoning>([\s\S]*?)<\/reasoning>/gi, "");
  
  // 2. Remove markdown sections with thought headers
  cleaned = cleaned.replace(/^#+\s*Thought[s]?\s*\n[\s\S]*?(?=(^#+|$))/gim, "");
  cleaned = cleaned.replace(/^#+\s*Reasoning\s*\n[\s\S]*?(?=(^#+|$))/gim, "");
  
  // 3. Remove thinking process block delimiters if any
  cleaned = cleaned.replace(/\[thought\]([\s\S]*?)\[\/thought\]/gi, "");
  cleaned = cleaned.replace(/\[reasoning\]([\s\S]*?)\[\/reasoning\]/gi, "");

  return cleaned.trim();
}

// Helper to extract and parse JSON from model output safely, stripping any markdown wrappers or loose thoughts
export function extractAndParseJSON<T>(text: string): T {
  if (!text) {
    throw new Error("Empty model response.");
  }

  // Pre-clean using thought sanitization
  const cleaned = sanitizeModelOutput(text);

  // Try parsing the cleaned text directly
  try {
    return JSON.parse(cleaned) as T;
  } catch (directError) {
    console.warn("Direct JSON parsing failed, attempting to extract JSON block:", directError);
    
    // Attempt to extract the first balanced JSON object { ... } or array [ ... ]
    const jsonStart = cleaned.indexOf('{');
    const jsonArrayStart = cleaned.indexOf('[');
    
    let startIndex = -1;
    let endIndex = -1;
    
    if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
      startIndex = jsonStart;
      let bracketCount = 0;
      for (let i = startIndex; i < cleaned.length; i++) {
        if (cleaned[i] === '{') bracketCount++;
        else if (cleaned[i] === '}') {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
    } else if (jsonArrayStart !== -1) {
      startIndex = jsonArrayStart;
      let bracketCount = 0;
      for (let i = startIndex; i < cleaned.length; i++) {
        if (cleaned[i] === '[') bracketCount++;
        else if (cleaned[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (startIndex !== -1 && endIndex !== -1) {
      const extractedStr = cleaned.substring(startIndex, endIndex + 1);
      try {
        return JSON.parse(extractedStr) as T;
      } catch (extractError) {
        console.error("Failed to parse extracted JSON block:", extractError);
        throw new Error("Invalid structured JSON format returned by the model.");
      }
    }

    // Last resort block using regex
    const match = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch (regexError) {
        console.error("Last-resort regex JSON parsing failed:", regexError);
      }
    }

    throw new Error("Could not find or parse a valid JSON block in the model response.");
  }
}

/**
 * Post-processes the generated SoapNote object to search for unmapped 'otherFindings' 
 * fields populated dynamically by Gemini, or dynamic structured arrays, and merges/flattens 
 * them directly into the parent object/Record to maintain a perfectly structured schema 
 * with infinite dynamic capture and zero hallucinations.
 */
export function postProcessSoapNote(soap: any): any {
  if (!soap) return soap;
  
  const flattenDynamicSection = (section: any, keyField: string, valueField: string) => {
    if (!section) return section;
    
    // If it's already an array, convert to flat object
    if (Array.isArray(section)) {
      const flatObj: Record<string, string> = {};
      section.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const key = String(item[keyField] || '').trim();
          const val = String(item[valueField] || '').trim();
          if (key && val) {
            flatObj[key] = val;
          }
        }
      });
      return flatObj;
    }
    
    // If it's already an object (for backward compatibility or fallback)
    if (typeof section === 'object') {
      if (Array.isArray(section.otherFindings)) {
        section.otherFindings.forEach((item: any) => {
          if (item && typeof item === 'object') {
            const key = String(item.category || item.system || item.systemOrRegion || '').trim();
            const val = String(item.finding || '').trim();
            if (key && val) {
              section[key] = val;
            }
          }
        });
        delete section.otherFindings;
      }
      return section;
    }
    
    return section;
  };
  
  if (soap.subjective) {
    soap.subjective.ros = flattenDynamicSection(soap.subjective.ros, 'system', 'finding');
    soap.subjective.headsss = flattenDynamicSection(soap.subjective.headsss, 'category', 'finding');
  }
  
  if (soap.objective) {
    soap.objective.physicalExam = flattenDynamicSection(soap.objective.physicalExam, 'system', 'finding');
  }
  
  return soap;
}

// Generic wrapper for Gemini calls
async function callGemini(params: {
  model?: string;
  systemInstruction?: string;
  contents: any;
  useGoogleSearch?: boolean;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: any;
  signal?: AbortSignal;
}): Promise<{ text: string; groundingSources?: GroundingSource[] }> {
  const ai = getAI();
  let { 
    model = DEFAULT_MODEL, 
    systemInstruction, 
    contents, 
    useGoogleSearch = false, 
    responseMimeType = "text/plain",
    responseSchema,
    signal 
  } = params;

  if (responseSchema) {
    const selectedModelConfig = MODELS.find(m => m.id === model);
    if (selectedModelConfig && !selectedModelConfig.supportsStructuredOutput) {
      console.log(`Model ${model} does not support structured output. Falling back to ${DEFAULT_STRUCTURED_MODEL}.`);
      model = DEFAULT_STRUCTURED_MODEL;
    }
  }

  const config: any = {
    systemInstruction,
    responseMimeType,
    responseSchema,
    tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
  };

  // Turn off thoughts within thinkingConfig if using a model that supports it to prevent thoughts in response stream
  if (model === "gemini-3.5-flash" || model.includes("gemini-3.5")) {
    config.thinkingConfig = {
      includeThoughts: false,
    };
  }

  try {
    console.log(`[Gemini Request] Model: ${model}`);
    if (config.systemInstruction) {
      console.log(`[Gemini Request] System Instruction:`, config.systemInstruction);
    }
    const contentsStr = JSON.stringify(contents);
    console.log(`[Gemini Request] Contents:`, contentsStr.length > 1000 ? contentsStr.substring(0, 1000) + "..." : contentsStr);

    const generatePromise = ai.models.generateContent({
      model,
      contents,
      config,
    });

    let response: any;
    if (signal) {
      response = await Promise.race([
        generatePromise,
        new Promise<never>((_, reject) => {
          if (signal.aborted) {
            const err = new Error('AbortError');
            err.name = 'AbortError';
            reject(err);
          }
          signal.addEventListener('abort', () => {
            const err = new Error('AbortError');
            err.name = 'AbortError';
            reject(err);
          });
        })
      ]);
    } else {
      response = await generatePromise;
    }

    const rawText = response.text || "";
    const sanitizedText = sanitizeModelOutput(rawText);
    const groundingSources = cleanGroundingSources(response);

    console.log(`[Gemini Response] Raw Text:`, rawText);
    if (rawText !== sanitizedText) {
      console.log(`[Gemini Response] Sanitized Text:`, sanitizedText);
    }
    if (groundingSources && groundingSources.length > 0) {
      console.log(`[Gemini Response] Grounding sources:`, JSON.stringify(groundingSources, null, 2));
    }

    return {
      text: sanitizedText,
      groundingSources
    };
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error("Gemini API error:", error);
    throw new Error(error.message || "Failed to communicate with Gemini.");
  }
}

// Helper to convert File to Base64 for Gemini
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to convert multiple files to generative parts
export const convertFilesToParts = async (files: File[]): Promise<any[]> => {
  const parts: any[] = [];
  for (const file of files) {
    const part = await fileToGenerativePart(file);
    parts.push(part);
  }
  return parts;
};

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to clean up grounding sources and extract original URLs from Vertex links
export const cleanGroundingSources = (result: any): GroundingSource[] => {
  const sources: GroundingSource[] = [];
  if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    result.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        let uri = chunk.web.uri;
        
        // Try to extract original URL from Vertex links
        if (uri.includes('vertexaisearch.cloud.google.com') && uri.includes('url=')) {
          try {
            const urlObj = new URL(uri);
            const originalUrl = urlObj.searchParams.get('url');
            if (originalUrl) {
              uri = decodeURIComponent(originalUrl);
            }
          } catch (e) {
            console.error("Failed to parse Vertex URL:", e);
          }
        }

        sources.push({
          title: chunk.web.title || "Reference",
          uri: uri
        });
      }
    });
  }
  return sources;
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await blobToBase64(audioBlob);

  const result = await callGemini({
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio
          }
        },
        {
          text: TRANSCRIBE_PROMPT
        }
      ]
    }
  });

  return result.text;
};

export const analyzeClinicalPhotos = async (files: File[], currentPhysicalExam: string = "", modelName: string = DEFAULT_MODEL): Promise<string> => {
  const parts = await convertFilesToParts(files);
  const prompt = CLINICAL_PHOTO_PROMPT(currentPhysicalExam);
  parts.push({ text: prompt });

  const result = await callGemini({
    model: modelName,
    contents: { parts }
  });

  return result.text || currentPhysicalExam;
};

export const analyzeLabPhotos = async (files: File[], currentLabs: string = "", currentInterpretation: string = "", modelName: string = DEFAULT_MODEL): Promise<{ labs: string, labInterpretation: string[] }> => {
  const parts = await convertFilesToParts(files);
  const prompt = LAB_PHOTO_PROMPT(currentLabs, currentInterpretation);
  parts.push({ text: prompt });

  const result = await callGemini({
    model: modelName,
    contents: { parts },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        labs: { type: Type.STRING },
        labInterpretation: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["labs", "labInterpretation"]
    }
  });

  return extractAndParseJSON<{ labs: string, labInterpretation: string[] }>(result.text);
};

export const analyzeImagingPhotos = async (files: File[], currentImaging: string = "", currentCorrelation: string = "", modelName: string = DEFAULT_MODEL): Promise<{ imaging: string, imagingCorrelation: string[] }> => {
  const parts = await convertFilesToParts(files);
  const prompt = IMAGING_PHOTO_PROMPT(currentImaging, currentCorrelation);
  parts.push({ text: prompt });

  const result = await callGemini({
    model: modelName,
    contents: { parts },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        imaging: { type: Type.STRING },
        imagingCorrelation: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["imaging", "imagingCorrelation"]
    }
  });

  return extractAndParseJSON<{ imaging: string, imagingCorrelation: string[] }>(result.text);
};

export const generateClinicalSuggestions = async (
  section: 'Subjective' | 'Objective',
  contextData: string
): Promise<string[]> => {
  let prompt = "";
  let desc = "";
  if (section === 'Subjective') {
      prompt = SUBJECTIVE_SUGGESTIONS_PROMPT(contextData);
      desc = SCHEMA_DESCRIPTIONS.subjective_clinicalAssistance;
  } else {
      prompt = OBJECTIVE_SUGGESTIONS_PROMPT(contextData);
      desc = SCHEMA_DESCRIPTIONS.objective_clinicalAssistance;
  }

  const result = await callGemini({
    contents: { parts: [{ text: prompt }] },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: desc
    }
  });

  try {
    return extractAndParseJSON<string[]>(result.text);
  } catch (error) {
    console.error("Failed to parse schema suggestions JSON:", error);
    return markdownBulletsToArray(result.text);
  }
};

export const integrateClinicalData = async (
  sectionTitle: string,
  currentContent: string,
  suggestions: string[],
  userInput: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> => {
  const prompt = INTEGRATE_DATA_PROMPT(sectionTitle, currentContent, suggestions, userInput);

  const result = await callGemini({
    model: modelName,
    contents: { parts: [{ text: prompt }] }
  });

  return result.text || currentContent;
};

export const sendChatMessage = async (
  model: string = DEFAULT_MODEL,
  history: ChatMessage[],
  newMessage: string,
  chartContext: MedicalChartResponse | null,
  useGoogleSearch: boolean = false,
  signal?: AbortSignal,
  attachments?: FileUpload[]
): Promise<{ text: string; title?: string; groundingSources?: GroundingSource[] }> => {
  const historyContent: Content[] = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const systemInstruction = CHAT_SYSTEM_INSTRUCTION(chartContext, useGoogleSearch);

  const messageParts: any[] = [{ text: newMessage }];
  
  if (attachments && attachments.length > 0) {
    const attachmentParts = await convertFilesToParts(attachments.map(a => a.file));
    messageParts.push(...attachmentParts);
  }

  const result = await callGemini({
    model,
    systemInstruction,
    contents: [...historyContent, { role: 'user', parts: messageParts }],
    useGoogleSearch,
    signal
  });

  let text = result.text || "";
  let title = "Clinical Conversation";

  const titleMatch = text.match(/<note_title>([\s\S]*?)<\/note_title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
    text = text.replace(/<note_title>[\s\S]*?<\/note_title>/gi, '').trim();
  }

  return {
    text,
    title,
    groundingSources: result.groundingSources
  };
};

export const sendNoteThreadMessage = async (
  model: string = safeStorage.getItem('clinsight_default_model') || DEFAULT_MODEL,
  history: ChatMessage[],
  newMessage: string,
  originalNoteContent: string,
  originalNoteTitle: string,
  highlightedContext?: string,
  chartContext?: MedicalChartResponse | null,
  signal?: AbortSignal,
  attachments?: FileUpload[]
): Promise<{ text: string; groundingSources?: GroundingSource[] }> => {
  const historyContent: Content[] = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const systemInstruction = NOTE_THREAD_SYSTEM_INSTRUCTION(
    chartContext,
    originalNoteContent,
    originalNoteTitle,
    highlightedContext
  );

  const messageParts: any[] = [{ text: newMessage }];
  
  if (attachments && attachments.length > 0) {
    const attachmentParts = await convertFilesToParts(attachments.map(a => a.file));
    messageParts.push(...attachmentParts);
  }

  const resolvedModel = (model && model !== 'undefined') ? model : (safeStorage.getItem('clinsight_default_model') || DEFAULT_MODEL);

  const result = await callGemini({
    model: resolvedModel,
    systemInstruction,
    contents: [...historyContent, { role: 'user', parts: messageParts }],
    useGoogleSearch: true,
    signal
  });

  return {
    text: result.text || "",
    groundingSources: result.groundingSources
  };
};

export const generateResponseTitle = async (
  userMessage: string,
  responseContent: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> => {
  try {
    const prompt = `Based on the following practitioner prompt and the assistant response, generate a concise, clinical-record-appropriate title of 2 to 5 words for this interaction. Do not use quotes, asterisks, punctuation, or conversational filler. Keep it strictly focused on the medical or administrative focus (e.g. "Laboratory Results Review", "Hypertension Counseling", "Pediatric Feeding Guide", "Insulin Dose Adjustment").Do not use emdashes.

Practitioner Query:
"${userMessage}"

Assistant Response:
"${responseContent.substring(0, 1000)}"`;

    const result = await callGemini({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
    });

    return result.text.trim().replace(/^["'*]+|["'*]+$/g, '');
  } catch (error) {
    console.error("Failed to generate response title:", error);
    return "Clinical Conversation";
  }
};

export const generateInputSuggestions = async (
  notes: string,
  modelName: string = DEFAULT_MODEL
): Promise<SuggestionsData> => {
  const prompt = `CURRENT DRAFT:\n${notes}\n\n${INPUT_SUGGESTIONS_PROMPT}`;

  const result = await callGemini({
    model: modelName,
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
              rationale: { type: Type.STRING }
            },
            required: ["text", "rationale"]
          }
        },
        tests: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ["text", "rationale"]
          }
        }
      },
      required: ["questions", "tests"]
    }
  });

  return extractAndParseJSON<SuggestionsData>(result.text);
};

export const medicalLookup = async (query: string, signal?: AbortSignal): Promise<{ text: string; groundingSources?: GroundingSource[] }> => {
  return await callGemini({
    systemInstruction: MEDICAL_LOOKUP_PROMPT,
    contents: { parts: [{ text: query }] },
    useGoogleSearch: true,
    signal
  });
};

// Reusable SOAP schemas
export const ASSESSMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.assessment_summary },
    rationale: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: SCHEMA_DESCRIPTIONS.assessment_rationale 
    },
    icdCodes: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.assessment_icdCodes },
    differentialDiagnosis: { 
      type: Type.ARRAY, 
      description: SCHEMA_DESCRIPTIONS.assessment_differentialDiagnosis,
      items: {
          type: Type.OBJECT,
          properties: {
              diagnosis: { type: Type.STRING },
              evidenceFor: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidenceAgainst: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["diagnosis", "evidenceFor", "evidenceAgainst"]
      }
    }
  },
  required: ["summary", "rationale", "icdCodes", "differentialDiagnosis"]
};

export const PLAN_SCHEMA = { 
  type: Type.ARRAY,
  description: SCHEMA_DESCRIPTIONS.plan_overall,
  items: {
    type: Type.OBJECT,
    properties: {
      problem: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.plan_problem },
      actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.plan_actions },
      diagnostics: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.plan_diagnostics },
      therapeutics: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.plan_therapeutics },
      other: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.plan_other }
    },
    required: ["problem"]
  }
};

export const BROADER_MANAGEMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    disposition: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_disposition },
    diet: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_diet },
    ivFluids: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_ivFluids },
    o2Support: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_o2Support },
    monitoring: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_monitoring },
    wof: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.broaderManagement_wof },
    referrals: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.broaderManagement_referrals }
  }
};

// Reusable SOAP Schema with detailed descriptions for better Flash model performance
const SOAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subjective: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.chiefComplaint },
        hpi: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.hpi },
        ros: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.ros,
          items: {
            type: Type.OBJECT,
            properties: {
              system: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.ros_system },
              finding: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.ros_finding }
            },
            required: ["system", "finding"]
          }
        },
        pmh: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.pmh },
        meds: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.meds },
        social: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.social },
        anamnesis: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.anamnesis },
        family: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.family },
        birthMaternal: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.birthMaternal },
        immunizations: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.immunizations },
        nutrition: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.nutrition },
        developmental: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.developmental },
        headsss: {
          type: Type.ARRAY,
          nullable: true,
          description: SCHEMA_DESCRIPTIONS.headsss,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.headsss_category },
              finding: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.headsss_finding }
            },
            required: ["category", "finding"]
          }
        },
        sexualHistory: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.sexualHistory },
        clinicalAssistance: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          nullable: true, 
          description: SCHEMA_DESCRIPTIONS.subjective_clinicalAssistance 
        }
      },
      required: ["hpi", "ros", "pmh", "meds", "social", "family"]
    },
    objective: {
      type: Type.OBJECT,
      properties: {
        vitals: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.vitals },
        anthropometrics: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.anthropometrics },
        physicalExam: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.physicalExam,
          items: {
            type: Type.OBJECT,
            properties: {
              system: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.physicalExam_system },
              finding: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.physicalExam_finding }
            },
            required: ["system", "finding"]
          }
        },
        labs: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.labs },
        labInterpretation: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: SCHEMA_DESCRIPTIONS.labInterpretation },
        imaging: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.imaging },
        imagingCorrelation: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: SCHEMA_DESCRIPTIONS.imagingCorrelation },
        clinicalAssistance: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          nullable: true, 
          description: SCHEMA_DESCRIPTIONS.objective_clinicalAssistance 
        }
      },
      required: ["vitals", "physicalExam", "labs", "imaging"]
    },
    assessment: ASSESSMENT_SCHEMA,
    plan: PLAN_SCHEMA,
    broaderManagement: BROADER_MANAGEMENT_SCHEMA
  },
  required: ["subjective", "objective", "assessment", "plan"]
};

export const refreshPatientSummary = async (
  currentSummary: HandoffSummary,
  patientInfo: GeneralData,
  recentEntries: ChartEntry[],
  recentCourse: CourseEvent[],
  model: string,
  specialization: string
): Promise<HandoffSummary> => {
  const parts: any[] = [];
  
  const prompt = `
Please update the patient summary based on the recent clinical developments.

PATIENT INFO:
${JSON.stringify(patientInfo, null, 2)}

CURRENT SUMMARY:
${JSON.stringify(currentSummary, null, 2)}

RECENT CHART ENTRIES (Newest first):
${JSON.stringify(recentEntries.map(e => ({ date: e.date, type: e.type, soap: e.soap, rawText: e.rawText })), null, 2)}

RECENT COURSE EVENTS:
${JSON.stringify(recentCourse, null, 2)}

Specialization Context: ${specialization}
`;

  parts.push({ text: prompt });

  const result = await callGemini({
    model,
    contents: { parts },
    systemInstruction: REFRESH_SUMMARY_SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        patientId: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.handoff_patientId },
        oneLiner: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.handoff_oneLiner },
        activeIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.handoff_activeIssues },
        toDoList: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.handoff_toDoList },
        clinicalPearl: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.handoff_clinicalPearl }
      },
      required: ["patientId", "oneLiner", "activeIssues", "toDoList"]
    }
  });

  return extractAndParseJSON<HandoffSummary>(result.text);
};

export const generateMedicalChart = async (
  textInput: string,
  files: File[],
  modelName: string = DEFAULT_MODEL,
  specialization: string = 'General Practice',
  useGoogleSearch: boolean = false,
  history: ChartEntry[] = [],
  currentPatientInfo: GeneralData | null = null
): Promise<Omit<MedicalChartResponse, 'entries'> & { soap: SoapNote }> => {
  const parts: any[] = [];

  // Continuity Block: Inject Existing Patient Info if available
  if (currentPatientInfo) {
      parts.push({ text: `EXISTING PATIENT FACE SHEET (Already recorded):\n${JSON.stringify(currentPatientInfo)}\n\n` });
  }

  // Continuity Block: Inject Historical Summary
  if (history.length > 0) {
      const historyContext = history.slice(0, 5).map(e => {
        let summary = 'No summary available';
        if (e.entryType === 'raw') {
          summary = e.rawText || 'Manual Progress Note';
        } else if (e.soap) {
          summary = e.soap.assessment.summary;
        }
        return `[${e.date} - ${e.title}]: ${summary}`;
      }).join('\n');
      parts.push({ text: `CLINICAL HISTORY (Story So Far):\n${historyContext}\n\nINSTRUCTION: Reconcile new findings with this history to ensure continuity and track trends.\n\n` });
  }

  if (specialization !== 'General Practice') {
    parts.push({ text: `USER SPECIALIZATION: ${specialization}\nPlease focus the documentation standards and priorities based on this specialty.\n\n` });
  }

  if (textInput) {
    parts.push({ text: `NEW PATIENT DATA / PROGRESS UPDATE:\n${textInput}\n\n` });
  }

  if (files && files.length > 0) {
    const fileParts = await convertFilesToParts(files);
    parts.push(...fileParts);
  }

  const systemInstruction = GET_CHART_SYSTEM_INSTRUCTION(specialization, useGoogleSearch);

  const result = await callGemini({
    model: modelName,
    systemInstruction,
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
            patientName: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.patientName },
            ageSex: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.ageSex },
            mrn: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.mrn },
            dob: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.dob },
            admissionDate: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.admissionDate },
            address: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.address },
            religion: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.religion },
            handedness: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.handedness },
            location: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.location },
            bloodType: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.bloodType },
            contactNumber: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.contactNumber },
            email: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.email }
          },
          required: ["patientName", "ageSex", "mrn", "dob", "admissionDate", "address", "religion", "handedness"]
        },
        soap: SOAP_SCHEMA,
        course: {
          type: Type.ARRAY,
          description: SCHEMA_DESCRIPTIONS.course_overall,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.course_date },
              time: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.course_time },
              event: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.course_event },
              details: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.course_details },
            },
            required: ["date", "event", "details"]
          }
        },
        handoff: {
          type: Type.OBJECT,
          description: SCHEMA_DESCRIPTIONS.handoff_overall,
          properties: {
            patientId: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.handoff_patientId },
            oneLiner: { type: Type.STRING, description: SCHEMA_DESCRIPTIONS.handoff_oneLiner },
            activeIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.handoff_activeIssues },
            toDoList: { type: Type.ARRAY, items: { type: Type.STRING }, description: SCHEMA_DESCRIPTIONS.handoff_toDoList },
            clinicalPearl: { type: Type.STRING, nullable: true, description: SCHEMA_DESCRIPTIONS.handoff_clinicalPearl },
          },
          required: ["patientId", "oneLiner", "activeIssues", "toDoList"]
        },
        references: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: SCHEMA_DESCRIPTIONS.references }
      },
      required: ["patientInfo", "soap", "course", "handoff"]
    }
  });

  const rawData = extractAndParseJSON<any>(result.text);
  const data: Omit<MedicalChartResponse, 'entries'> & { soap: SoapNote } = {
      id: createId(),
      patientInfo: rawData.patientInfo,
      course: rawData.course,
      handoff: rawData.handoff,
      groundingSources: result.groundingSources || [],
      references: rawData.references || [],
      soap: postProcessSoapNote(rawData.soap)
  };
  
  return data;
};

export const generateProgressNote = async (
  textInput: string,
  files: File[],
  modelName: string = DEFAULT_MODEL,
  specialization: string = 'General Practice',
  useGoogleSearch: boolean = false,
  history: ChartEntry[] = []
): Promise<{ 
  soap: SoapNote, 
  courseEvent: { event: string, details: string }, 
  inferredDate?: string | null, 
  inferredTime?: string | null, 
  groundingSources?: GroundingSource[], 
  references?: string[] 
}> => {
  const parts: any[] = [];

  // Pass current system date & time for reference to resolve relative dates like "yesterday", "today morning", "last night" etc.
  const nowRef = `${getTodayDate()} ${getCurrentTime24()}`;
  parts.push({ text: `CURRENT REFERENCE DATE AND TIME: ${nowRef}\nUse this as the baseline to compute or resolve any relative dates or times mentioned in the input data (e.g. 'yesterday', 'two days ago', 'this morning').\n\n` });

  // Continuity Block: Inject Historical Summary (more recent and more detailed)
  if (history.length > 0) {
      // Get the 3 most recent entries. 
      // Note: history is sorted newest first in the app state.
      const recentHistory = history.slice(0, 3).reverse(); 
      const historyContext = formatChartHistory(recentHistory);
      
      parts.push({ text: `RECENT CLINICAL HISTORY (Baseline for comparison):\n${historyContext}\n\nINSTRUCTION: Compare the new update against this baseline. Highlight trends, improvements, or deteriorations. Be specific about changes in findings or state.\n\n` });
  }

  if (textInput) {
    parts.push({ text: `NEW PATIENT DATA / PROGRESS UPDATE:\n${textInput}\n\n` });
  }

  if (files && files.length > 0) {
    const fileParts = await convertFilesToParts(files);
    parts.push(...fileParts);
  }

  // Instruction to extract/infer entry date and time
  parts.push({ text: `INSTRUCTION FOR DATE/TIME EXTRACTION:\nIf the new patient data / progress update or any of the uploaded files explicitly mention or imply the date and/or time of this update/encounter/interaction (e.g. 'May 20', 'yesterday at 3pm', 'last night'), extract/infer that date (format: YYYY-MM-DD) and time (format: HH:MM in 24-hour style) and return them in 'inferredDate' and 'inferredTime' respectively. If a relative date like 'yesterday' is used, calculate it relative to the CURRENT REFERENCE DATE AND TIME above. If no specific date or time is specified and cannot be inferred, return null for those fields.\n\n` });

  const systemInstruction = PROGRESS_NOTE_SYSTEM_INSTRUCTION(specialization, useGoogleSearch);

  const result = await callGemini({
    model: modelName,
    systemInstruction,
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
            event: { type: Type.STRING, description: "Short title for the timeline event (e.g., 'Day 2 Progress', 'Cardiology Follow-up')" },
            details: { type: Type.STRING, description: "1-2 sentence summary of the progress and key changes." }
          },
          required: ["event", "details"]
        },
        inferredDate: { 
          type: Type.STRING, 
          nullable: true, 
          description: "An extracted or inferred date of the encounter in YYYY-MM-DD format based on the input text/files, or null if not stated of cannot be inferred." 
        },
        inferredTime: { 
          type: Type.STRING, 
          nullable: true, 
          description: "An extracted or inferred time of the encounter in HH:MM format (24-hour style), or null if not stated or cannot be inferred." 
        },
        references: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: SCHEMA_DESCRIPTIONS.references }
      },
      required: ["soap", "courseEvent"]
    }
  });

  const rawData = extractAndParseJSON<any>(result.text);
  return {
    soap: postProcessSoapNote(rawData.soap),
    courseEvent: rawData.courseEvent,
    inferredDate: rawData.inferredDate,
    inferredTime: rawData.inferredTime,
    groundingSources: result.groundingSources || [],
    references: rawData.references || []
  };
};

export const reassessSoapNote = async (
  currentSoap: SoapNote,
  history: ChartEntry[] = [],
  modelName: string = DEFAULT_MODEL,
  specialization: string = 'General Practice',
  useGoogleSearch: boolean = false
): Promise<{ assessment: SoapNote['assessment'], plan: PlanItem[], groundingSources?: GroundingSource[], references?: string[] }> => {
  const prompt = REASSESS_SOAP_PROMPT(currentSoap, history, specialization, useGoogleSearch);

  const result = await callGemini({
    model: modelName,
    contents: { parts: [{ text: prompt }] },
    useGoogleSearch,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        assessment: ASSESSMENT_SCHEMA,
        plan: PLAN_SCHEMA,
        broaderManagement: BROADER_MANAGEMENT_SCHEMA,
        references: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: SCHEMA_DESCRIPTIONS.references }
      },
      required: ["assessment", "plan"]
    }
  });

  const data = extractAndParseJSON<any>(result.text);
  if (result.groundingSources) {
    data.groundingSources = result.groundingSources;
  }
  return data;
};

export const generateHomeInstructions = async (soapData: SoapNote): Promise<{ diet: string[]; lifestyle: string[]; activity: string[]; redFlags: string[]; referrals: string[]; followUp: string; }> => {
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
        required: ["diet", "lifestyle", "activity", "redFlags", "referrals", "followUp"]
      }
    });
    return result.text ? extractAndParseJSON<{ diet: string[]; lifestyle: string[]; activity: string[]; redFlags: string[]; referrals: string[]; followUp: string; }>(result.text) : { diet: [], lifestyle: [], activity: [], redFlags: [], referrals: [], followUp: "" };
  } catch (error) {
    console.error("Error instructions:", error);
    throw new Error("Failed home instructions.");
  }
};

export const parsePrescriptions = async (plan: PlanItem[]): Promise<{ drug: string; dose: string; route: string; frequency: string; duration: string; sig: string; quantity: string; }[]> => {
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
            quantity: { type: Type.STRING }
          },
          required: ["drug", "dose", "route", "frequency", "duration", "sig", "quantity"]
        }
      }
    });
    return result.text ? extractAndParseJSON<{ drug: string; dose: string; route: string; frequency: string; duration: string; sig: string; quantity: string; }[]>(result.text) : [];
  } catch (error) { 
    console.error("Error parsing prescriptions:", error);
    return []; 
  }
};
