import {
  ChatMessage,
  FileUpload,
  MedicalChartResponse,
  PatientNote,
  SubNote,
} from "../../types";
import { createId } from "../../utils/ids";
import { sendNoteThreadMessage } from "../../services/ai/actions";
import { logDiagnostic } from "../../services/diagnosticLogger";

interface SendThreadInquiryOptions {
  note: PatientNote;
  query: string;
  attachments: FileUpload[];
  highlightedText?: string;
  chartContext?: MedicalChartResponse;
  onOptimisticUpdate: (subNotes: SubNote[], userSubNote: SubNote) => void;
}

export interface ThreadInquiryResult {
  subNotes: SubNote[];
  updatedAt?: string;
}

function formatThreadTimestamp(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export async function sendThreadInquiry({
  note,
  query,
  attachments,
  highlightedText,
  chartContext,
  onOptimisticUpdate,
}: SendThreadInquiryOptions): Promise<ThreadInquiryResult> {
  const createdAt = formatThreadTimestamp(new Date());
  const userSubNote: SubNote = {
    id: createId(),
    content: query,
    createdAt,
    isAssistant: false,
    highlightedText: highlightedText || undefined,
    attachments: attachments.length ? attachments : undefined,
  };
  const updatedSubNotes = [...(note.subNotes || []), userSubNote];
  onOptimisticUpdate(updatedSubNotes, userSubNote);

  const history: ChatMessage[] = (note.subNotes || []).map((subNote) => ({
    role: subNote.isAssistant ? "model" : "user",
    text: subNote.content,
    groundingSources: subNote.groundingSources,
  }));

  try {
    const response = await sendNoteThreadMessage(
      undefined,
      history,
      query,
      note.content,
      note.title || "Untitled Note",
      highlightedText || undefined,
      chartContext,
      undefined,
      attachments,
    );

    return {
      subNotes: [
        ...updatedSubNotes,
        {
          id: createId(),
          content: response.text,
          createdAt,
          isAssistant: true,
          groundingSources: response.groundingSources,
        },
      ],
      updatedAt: createdAt,
    };
  } catch {
    logDiagnostic("error", "Note-thread response generation failed.");
    return {
      subNotes: [
        ...updatedSubNotes,
        {
          id: createId(),
          content:
            "Sorry, I ran into an error trying to process this question. Please try again.",
          createdAt,
          isAssistant: true,
        },
      ],
    };
  }
}
