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
import { MODELS, DEFAULT_MODEL } from "../../config/appConfig";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import ClinicalMarkdown from "../../components/clinical/ClinicalMarkdown";
import { createFileUploads, openAttachment } from "../../services/fileService";
import { FileDropZone } from "../../components/ui/FileUpload/FileDropZone";
import { FilePreviewBadge } from "../../components/ui/FileUpload/FilePreviewBadge";
import { ClinicalChatInput } from "../../components/clinical/ClinicalChatInput";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useChatConversation } from "./useChatConversation";
import { useChatPanelResize } from "./useChatPanelResize";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: MedicalChartResponse | null;
  onSaveAsNote?: (
    content: string,
    groundingSources?: GroundingSource[],
    title?: string,
  ) => void;
  model: string;
  onModelChange: (model: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  chartData,
  onSaveAsNote,
  model,
  onModelChange,
}) => {
  const [inputValue, setInputValue] = useState("");
  const {
    messages,
    isLoading,
    addMessage,
    sendMessage,
    retryMessage,
    cancel: handleCancelChat,
  } = useChatConversation({ model, chartData, isOpen });
  const [savedMessageIds, setSavedMessageIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Recording State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    enabled: isOpen,
    onAudioReady: async (audioBlob) => {
      setIsTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        if (transcription)
          setInputValue((prev) =>
            prev ? `${prev} ${transcription}` : transcription,
          );
      } catch (error) {
        logDiagnostic("error", "Chat transcription failed.");
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
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-danger-600 bg-danger-50 hover:bg-danger-100 transition-all active:scale-95"
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
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 bg-surface shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-full md:w-auto`}
        style={{ width: isDesktop ? sidebarWidth : "100%" }}
      >
        {/* Resize Handle (Desktop Only) */}
        <div
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-action-subtle/50 hover:w-1.5 transition-all z-50 group"
          onMouseDown={startResizing}
        >
          <div className="absolute inset-y-0 left-0 w-[1px] bg-neutral-200 group-hover:bg-action-400 transition-colors"></div>
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between bg-canvas relative select-none">
          <div className="flex items-center">
            <div className="bg-action-100 p-1.5 rounded-lg mr-3">
              <Icons.Subjective className="w-5 h-5 text-action" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-800">
                Clinical Assistant
              </h2>
              <p className="text-xs text-content-secondary">
                Ask questions about the case
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-default p-1 rounded-full hover:bg-neutral-200 transition-colors"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-4 py-2 border-b border-border-subtle bg-surface space-y-2">
          {/* Model Selector */}
          <div className="flex bg-surface p-1 rounded-lg">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => onModelChange(m.id)}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${model === m.id ? "bg-action-100 text-action-800 shadow-sm" : "text-content-secondary hover:bg-canvas"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas relative">
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
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => addFiles([file])}
      />
    </>
  );
};

export default ChatPanel;
