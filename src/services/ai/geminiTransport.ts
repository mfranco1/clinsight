import { GoogleGenAI } from "@google/genai";
import type {
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
  Part,
} from "@google/genai";
import type { GroundingSource } from "../../types";
import {
  DEFAULT_MODEL,
  DEFAULT_STRUCTURED_MODEL,
  MODELS,
} from "../../config/appConfig";
import { logDiagnostic } from "../diagnosticLogger";

declare const __CLINSIGHT_TEST_MODE__: boolean;

export interface GeminiRequest {
  model?: string;
  systemInstruction?: string;
  contents: GenerateContentParameters["contents"];
  useGoogleSearch?: boolean;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: GenerateContentConfig["responseSchema"];
  signal?: AbortSignal;
}

export interface GeminiResult {
  text: string;
  groundingSources?: GroundingSource[];
}

const getAI = (): GoogleGenAI => {
  if (!process.env.API_KEY) throw new Error("API Key not found.");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sanitizeModelOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/<thought>([\s\S]*?)<\/thought>/gi, "")
    .replace(/<reasoning>([\s\S]*?)<\/reasoning>/gi, "")
    .replace(/^#+\s*Thought[s]?\s*\n[\s\S]*?(?=(^#+|$))/gim, "")
    .replace(/^#+\s*Reasoning\s*\n[\s\S]*?(?=(^#+|$))/gim, "")
    .replace(/\[thought\]([\s\S]*?)\[\/thought\]/gi, "")
    .replace(/\[reasoning\]([\s\S]*?)\[\/reasoning\]/gi, "")
    .trim();
};

export const cleanGroundingSources = (
  result: Pick<GenerateContentResponse, "candidates">,
): GroundingSource[] => {
  const chunks =
    result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks.flatMap((chunk) => {
    if (!chunk.web?.uri) return [];
    let uri = chunk.web.uri;
    if (
      uri.includes("vertexaisearch.cloud.google.com") &&
      uri.includes("url=")
    ) {
      try {
        const originalUrl = new URL(uri).searchParams.get("url");
        if (originalUrl) uri = decodeURIComponent(originalUrl);
      } catch {
        logDiagnostic(
          "warn",
          "Grounding reference URL could not be normalized.",
        );
      }
    }
    return [{ title: chunk.web.title || "Reference", uri }];
  });
};

const abortError = (): Error => {
  const error = new Error("AbortError");
  error.name = "AbortError";
  return error;
};

export const awaitWithAbort = <T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
};

export const callGemini = async (
  params: GeminiRequest,
): Promise<GeminiResult> => {
  if (__CLINSIGHT_TEST_MODE__) {
    throw new Error("AI provider calls are disabled in test mode.");
  }

  const ai = getAI();
  let {
    model = DEFAULT_MODEL,
    systemInstruction,
    contents,
    useGoogleSearch = false,
    responseMimeType = "text/plain",
    responseSchema,
    signal,
  } = params;

  if (responseSchema) {
    const selectedModel = MODELS.find((item) => item.id === model);
    if (selectedModel && !selectedModel.supportsStructuredOutput) {
      logDiagnostic(
        "warn",
        "Selected model does not support structured output; using the structured-output fallback.",
      );
      model = DEFAULT_STRUCTURED_MODEL;
    }
  }

  const config: GenerateContentConfig = {
    systemInstruction,
    responseMimeType,
    responseSchema,
    tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
  };
  if (model === "gemini-3.5-flash" || model.includes("gemini-3.5")) {
    config.thinkingConfig = { includeThoughts: false };
  }

  try {
    const response = await awaitWithAbort(
      ai.models.generateContent({
        model,
        contents,
        config,
      }),
      signal,
    );

    const text = sanitizeModelOutput(response.text || "");
    const groundingSources = cleanGroundingSources(response);
    return { text, groundingSources };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    logDiagnostic("error", "Gemini request failed.");
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to communicate with Gemini.",
    );
  }
};

export const fileToGenerativePart = async (
  file: File,
): Promise<{ inlineData: { data: string; mimeType: string } }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({
        inlineData: {
          data: result.includes(",") ? result.split(",")[1] : result,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const convertFilesToParts = async (files: File[]): Promise<Part[]> => {
  const parts = [];
  for (const file of files) parts.push(await fileToGenerativePart(file));
  return parts;
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
