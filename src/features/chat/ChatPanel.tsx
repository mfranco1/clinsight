import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  MedicalChartResponse,
  FileUpload,
  PatientNote,
  GroundingSource,
} from "../../types";
import { transcribeAudio } from "../../services/ai/actions";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { Icons } from "../../components/ui/Icons";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import ClinicalMarkdown from "../../components/clinical/ClinicalMarkdown";
import { createFileUploads, openAttachment } from "../../services/fileService";
import { FileDropZone } from "../../components/ui/FileUpload/FileDropZone";
import { FilePreviewBadge } from "../../components/ui/FileUpload/FilePreviewBadge";
import { ClinicalChatInput } from "../../components/clinical/ClinicalChatInput";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useChatConversation } from "./useChatConversation";
import { useChatPanelResize } from "./useChatPanelResize";
import SidePanelShell from "../../components/ui/SidePanelShell";
import { ErrorState } from "../../components/ui/LoadingFeedback";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: MedicalChartResponse | null;
  onSaveAsNote?: (
    content: string,
    groundingSources?: GroundingSource[],
    title?: string,
  ) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  chartData,
  onSaveAsNote,
}) => {
  const [inputValue, setInputValue] = useState("");
  const {
    messages,
    isLoading,
    addMessage,
    sendMessage,
    retryMessage,
    cancel: handleCancelChat,
  } = useChatConversation({ chartData, isOpen });
  const [savedMessageIds, setSavedMessageIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Recording State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    enabled: isOpen,
    onAudioReady: async (audioBlob) => {
      setIsTranscribing(true);
      setTranscriptionError(null);
      try {
        const transcription = await transcribeAudio(audioBlob);
        if (transcription)
          setInputValue((prev) =>
            prev ? `${prev} ${transcription}` : transcription,
          );
      } catch (error) {
        logDiagnostic("error", "Chat transcription failed.");
        setTranscriptionError(
          "Could not transcribe audio. Please try recording again.",
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    onError: () => {
      logDiagnostic("error", "Chat microphone access failed.");
      addMessage({
        role: "model",
        text: "Could not access microphone.",
        isError: true,
      });
    },
  });

  const { sidebarWidth, isDesktop, startResizing } = useChatPanelResize();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;
    const currentFiles = [...selectedFiles];
    const message = inputValue;
    setInputValue("");
    setSelectedFiles([]);
    void sendMessage(message, currentFiles);
  };

  const addFiles = async (newFiles: File[]) => {
    const processedFiles = await createFileUploads(newFiles);
    setSelectedFiles((prev) => [...prev, ...processedFiles]);
  };

  const handleSaveAsNote = (msg: ChatMessage, idx: number) => {
    if (onSaveAsNote) {
      onSaveAsNote(msg.text, msg.groundingSources, msg.title);
      setSavedMessageIds((prev) => new Set(prev).add(idx));
    }
  };

  const handleRetryMessage = retryMessage;

  const renderMessageContent = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === "user";

    if (!isUser) {
      return (
        <div className="relative group/msg">
          <ClinicalMarkdown
            content={msg.text}
            groundingSources={msg.groundingSources}
            className="prose-neutral"
            showReferences={true}
          />

          {onSaveAsNote && !msg.isError && (
            <div className="mt-3 pt-3 border-t border-border-subtle flex justify-end">
              <button
                onClick={() => handleSaveAsNote(msg, idx)}
                disabled={savedMessageIds.has(idx)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  savedMessageIds.has(idx)
                    ? "text-action bg-action-subtle"
                    : "text-content-muted hover:text-action hover:bg-action-subtle"
                }`}
              >
                {savedMessageIds.has(idx) ? (
                  <>
                    <Icons.Check className="w-3 h-3" />
                    Saved to Notes
                  </>
                ) : (
                  <>
                    <Icons.Plus className="w-3 h-3" />
                    Save to Notes
                  </>
                )}
              </button>
            </div>
          )}

          {msg.isError && (
            <div className="mt-3 pt-3 border-t border-danger-100 flex justify-end">
              <button
                onClick={() => handleRetryMessage(idx)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-danger-600 bg-danger-50 hover:bg-danger-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icons.Refresh className="w-3 h-3 text-danger-500" />
                Retry
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <ClinicalMarkdown
        content={msg.text}
        groundingSources={msg.groundingSources}
        className="text-sm [&_p]:!text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_strong]:!text-white [&_a]:!text-action-100"
      />
    );
  };

  return (
    <>
      <SidePanelShell
        isOpen={isOpen}
        onClose={onClose}
        title="Clinical Assistant"
        icon={Icons.Subjective}
        headerDescription="Ask questions about the case"
        keepMounted
        bodyScrollable={false}
        bodyClassName="flex flex-col"
        className="bg-surface ease-in-out"
        backdropClassName="fixed inset-0 z-40 bg-black/25 md:hidden"
        style={{ width: isDesktop ? sidebarWidth : "100%" }}
        beforeHeader={
          <div
            aria-hidden="true"
            className="group absolute bottom-0 left-0 top-0 z-50 hidden w-1 cursor-ew-resize transition-all hover:w-1.5 hover:bg-action-subtle/50 md:block"
            onMouseDown={startResizing}
          >
            <div className="absolute inset-y-0 left-0 w-px bg-neutral-200 transition-colors group-hover:bg-action-400" />
          </div>
        }
      >
        {/* Messages Area */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4 relative space-y-4">
          <FileDropZone
            onFilesSelected={(files) => addFiles(Array.from(files))}
            onCameraClick={() => setIsCameraOpen(true)}
            className="absolute inset-0 z-10 opacity-0 hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          />
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-content-muted p-6">
              <Icons.Info className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">
                {chartData
                  ? "Ask me anything about the patient's history, labs, or care plan."
                  : "Please generate a patient chart first to ask specific questions."}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-action text-white rounded-br-none"
                    : msg.isError
                      ? "bg-danger-50/50 text-danger-800 border border-danger-200 rounded-bl-none"
                      : "bg-surface text-neutral-800 border border-border-default rounded-bl-none"
                }`}
              >
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((file, fIdx) => (
                      <FilePreviewBadge
                        key={fIdx}
                        file={file}
                        onRemove={() => {}} // No removal for sent messages
                        onOpen={() => openAttachment(file)}
                      />
                    ))}
                  </div>
                )}
                {renderMessageContent(msg, idx)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start space-y-2">
              <div className="bg-surface text-content-secondary border border-border-default rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1">
                <div
                  className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
              <button
                onClick={handleCancelChat}
                className="text-[10px] font-bold text-content-muted hover:text-content-default uppercase tracking-widest pl-2 transition-colors flex items-center"
              >
                <Icons.Close className="w-3 h-3 mr-1" />
                Cancel Request
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface border-t border-border-default">
          {transcriptionError && (
            <ErrorState
              variant="inline"
              message={transcriptionError}
              inlineAction={
                <button
                  type="button"
                  className="underline"
                  onClick={() => setTranscriptionError(null)}
                >
                  Dismiss
                </button>
              }
              className="mb-3"
            />
          )}
          <ClinicalChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            disabled={!chartData}
            placeholder={
              isTranscribing
                ? "Transcribing voice..."
                : chartData
                  ? "Type your question..."
                  : "Generate chart to start..."
            }
            selectedFiles={selectedFiles}
            onFilesChange={setSelectedFiles}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            showVoiceOption={true}
            size="md"
          />
        </div>
      </SidePanelShell>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => addFiles([file])}
      />
    </>
  );
};

export default ChatPanel;
