import type { Content, Part } from "@google/genai";
import { DEFAULT_MODEL } from "../../../config/appConfig";
import type {
  ChatMessage,
  FileUpload,
  GroundingSource,
  MedicalChartResponse,
} from "../../../types";
import { safeStorage } from "../../../utils/storage";
import {
  CHAT_SYSTEM_INSTRUCTION,
  NOTE_THREAD_SYSTEM_INSTRUCTION,
} from "../prompts";
import { callGemini, convertFilesToParts } from "../geminiTransport";

export const sendChatMessage = async (
  model: string = DEFAULT_MODEL,
  history: ChatMessage[],
  newMessage: string,
  chartContext: MedicalChartResponse | null,
  useGoogleSearch = false,
  signal?: AbortSignal,
  attachments?: FileUpload[],
): Promise<{
  text: string;
  title?: string;
  groundingSources?: GroundingSource[];
}> => {
  const historyContent: Content[] = history.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.text }],
  }));
  const systemInstruction = CHAT_SYSTEM_INSTRUCTION(
    chartContext,
    useGoogleSearch,
  );
  const messageParts: Part[] = [{ text: newMessage }];
  if (attachments?.length)
    messageParts.push(
      ...(await convertFilesToParts(
        attachments.map((attachment) => attachment.file),
      )),
    );

  const result = await callGemini({
    model,
    systemInstruction,
    contents: [...historyContent, { role: "user", parts: messageParts }],
    useGoogleSearch,
    signal,
  });
  let text = result.text || "";
  let title = "Clinical Conversation";
  const titleMatch = text.match(/<note_title>([\s\S]*?)<\/note_title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
    text = text.replace(/<note_title>[\s\S]*?<\/note_title>/gi, "").trim();
  }
  return { text, title, groundingSources: result.groundingSources };
};

export const sendNoteThreadMessage = async (
  model: string = safeStorage.getItem("clinsight_default_model") ||
    DEFAULT_MODEL,
  history: ChatMessage[],
  newMessage: string,
  originalNoteContent: string,
  originalNoteTitle: string,
  highlightedContext?: string,
  chartContext?: MedicalChartResponse | null,
  signal?: AbortSignal,
  attachments?: FileUpload[],
): Promise<{ text: string; groundingSources?: GroundingSource[] }> => {
  const historyContent: Content[] = history.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.text }],
  }));
  const systemInstruction = NOTE_THREAD_SYSTEM_INSTRUCTION(
    chartContext ?? null,
    originalNoteContent,
    originalNoteTitle,
    highlightedContext,
  );
  const messageParts: Part[] = [{ text: newMessage }];
  if (attachments?.length)
    messageParts.push(
      ...(await convertFilesToParts(
        attachments.map((attachment) => attachment.file),
      )),
    );
  const resolvedModel =
    model && model !== "undefined"
      ? model
      : safeStorage.getItem("clinsight_default_model") || DEFAULT_MODEL;
  const result = await callGemini({
    model: resolvedModel,
    systemInstruction,
    contents: [...historyContent, { role: "user", parts: messageParts }],
    useGoogleSearch: true,
    signal,
  });
  return { text: result.text || "", groundingSources: result.groundingSources };
};
