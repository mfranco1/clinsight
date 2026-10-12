import React, { useState, useRef, useEffect } from "react";
import { FileUpload } from "../../types";
import { Icons } from "../ui/Icons";
import CameraCaptureModal from "../CameraCaptureModal";
import { FilePreviewBadge } from "../ui/FileUpload/FilePreviewBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import {
  createFileUploads,
  revokeUrl,
  openAttachment,
} from "../../services/fileService";

interface ClinicalChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  selectedFiles: FileUpload[];
  onFilesChange: (files: FileUpload[]) => void;

  // Optional Voice Dictate parameters
  isRecording?: boolean;
  isTranscribing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  showVoiceOption?: boolean;

  // Visual/sizing profiles
  size?: "sm" | "md";
  textareaClassName?: string;
}

export const ClinicalChatInput: React.FC<ClinicalChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Type your query...",
  selectedFiles,
  onFilesChange,
  isRecording = false,
  isTranscribing = false,
  onStartRecording,
  onStopRecording,
  showVoiceOption = false,
  size = "md",
  textareaClassName = "",
}) => {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleAddFiles = async (filesToAdd: File[]) => {
    const processed = await createFileUploads(filesToAdd);
    onFilesChange([...selectedFiles, ...processed]);
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove.previewUrl) {
      revokeUrl(fileToRemove.previewUrl);
    }
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="w-full">
      {/* Attachment previews */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
          {selectedFiles.map((file, idx) => (
            <FilePreviewBadge
              key={idx}
              file={file}
              onRemove={() => handleRemoveFile(idx)}
              onOpen={() => openAttachment(file)}
            />
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className={`relative flex items-end ${size === "sm" ? "gap-1.5" : "gap-2"}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleAddFiles(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          multiple
          accept="image/*,.pdf,text/plain"
          className="hidden"
        />

        {/* Attachment Options section */}
        <DropdownMenu
          open={showAttachmentMenu}
          onOpenChange={setShowAttachmentMenu}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isLoading || isTranscribing || disabled}
              className={`flex items-center justify-center transition-all border ${
                size === "sm"
                  ? `w-7 h-7 rounded-xl ${
                      showAttachmentMenu
                        ? "bg-action-subtle text-action border-action-border shadow-inner"
                        : "bg-canvas text-content-muted border-border-default hover:text-action hover:bg-action-subtle hover:border-action-border"
                    }`
                  : `w-11 h-11 rounded-xl ${
                      showAttachmentMenu
                        ? "bg-action-subtle text-action border-action-border shadow-inner"
                        : "bg-canvas text-content-muted border-border-default hover:text-action hover:bg-action-subtle hover:border-action-border"
                    }`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Attachments"
            >
              <Icons.Plus className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-42 py-2">
            <DropdownMenuItem
              onSelect={() => fileInputRef.current?.click()}
              className="gap-3"
            >
              <Icons.Paperclip className="w-4 h-4" />
              Upload
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setIsCameraOpen(true)}
              className="gap-3"
            >
              <Icons.Camera className="w-4 h-4" />
              Camera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTranscribing ? "Transcribing voice..." : placeholder}
            disabled={disabled || isLoading || isTranscribing}
            className={`w-full px-4 py-2.5 bg-canvas border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto ${
              size === "sm"
                ? "text-xs rounded-xl py-1.5 pl-3 pr-3 border border-border-default"
                : ""
            } ${textareaClassName}`}
            style={{
              minHeight: size === "sm" ? "32px" : "44px",
              maxHeight: "120px",
            }}
          />
        </div>

        {/* Action Button: Send or Dictate */}
        {value.trim() ||
        !showVoiceOption ||
        !onStartRecording ||
        !onStopRecording ? (
          <button
            type="submit"
            disabled={isLoading || disabled || isTranscribing || !value.trim()}
            className={`flex-shrink-0 flex items-center justify-center transition-all border ${
              size === "sm"
                ? `w-7 h-7 rounded-xl ${
                    !value.trim() || isLoading
                      ? "text-neutral-300 bg-canvas border border-border-default cursor-not-allowed"
                      : "bg-action text-white border-action-600 hover:bg-action-hover hover:border-action-700 shadow-sm"
                  }`
                : `w-11 h-11 rounded-xl ${
                    isLoading || disabled || isTranscribing
                      ? "bg-canvas text-neutral-300 border-border-default cursor-not-allowed opacity-50"
                      : "bg-action text-white border-action-600 hover:bg-action-hover hover:border-action-700 shadow-sm shadow-action-100"
                  }`
            }`}
            title="Send inquiry"
          >
            {isLoading ? (
              <Icons.Loader
                className={`${size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"} animate-spin`}
              />
            ) : (
              <Icons.Send
                className={size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"}
              />
            )}
          </button>
        ) : (
          /* Symmetrical Dictate button for space integration details */
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading || isTranscribing || disabled}
            className={`flex-shrink-0 flex items-center justify-center transition-all border ${
              size === "sm"
                ? `w-7 h-7 rounded-xl ${
                    isRecording
                      ? "bg-danger-50 text-danger-600 border-danger-200 animate-pulse"
                      : "bg-canvas text-content-muted border-border-default hover:text-action hover:bg-action-subtle hover:border-action-border"
                  }`
                : `w-11 h-11 rounded-xl ${
                    isRecording
                      ? "bg-danger-50 text-danger-600 border-danger-200 animate-pulse"
                      : "bg-canvas text-content-muted border-border-default hover:text-action hover:bg-action-subtle hover:border-action-border"
                  }`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? "Stop recording" : "Use voice input"}
          >
            {isTranscribing ? (
              <Icons.Loader
                className={`${size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"} animate-spin`}
              />
            ) : (
              <Icons.Microphone
                className={size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"}
              />
            )}
          </button>
        )}
      </form>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => handleAddFiles([file])}
      />
    </div>
  );
};
