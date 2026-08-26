import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from '../../types';
import { Icons } from './Icons';
import CameraCaptureModal from '../CameraCaptureModal';
import { FilePreviewBadge } from './FileUpload/FilePreviewBadge';
import { createFileUpload, revokeUrl, openAttachment } from '../../services/fileService';

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
  size?: 'sm' | 'md';
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
  size = 'md',
  textareaClassName = ""
}) => {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Click outside listener for attachment dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleAddFiles = async (filesToAdd: File[]) => {
    const processed = await Promise.all(
      filesToAdd.map(file => createFileUpload(file))
    );
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
        onSubmit={(e) => { e.preventDefault(); onSubmit(e); }} 
        className={`relative flex items-end ${size === 'sm' ? 'gap-1.5' : 'gap-2'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleAddFiles(Array.from(e.target.files));
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          multiple
          accept="image/*,.pdf,text/plain"
          className="hidden"
        />

        {/* Attachment Options section */}
        <div className="relative" ref={attachmentMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            disabled={isLoading || isTranscribing || disabled}
            className={`flex items-center justify-center transition-all border ${
              size === 'sm'
                ? `w-7 h-7 rounded-xl ${
                    showAttachmentMenu
                      ? 'bg-teal-50 text-teal-600 border-teal-200 shadow-inner'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200'
                  }`
                : `w-11 h-11 rounded-xl ${
                    showAttachmentMenu
                      ? 'bg-teal-50 text-teal-600 border-teal-200 shadow-inner'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200'
                  }`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Attachments"
          >
            <Icons.Plus className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>

          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-42 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 animate-fade-in origin-bottom-left">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 flex items-center gap-3 transition-colors"
              >
                <Icons.Paperclip className="w-4 h-4" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCameraOpen(true);
                  setShowAttachmentMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 flex items-center gap-3 transition-colors"
              >
                <Icons.Camera className="w-4 h-4" />
                Camera
              </button>
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTranscribing ? "Transcribing voice..." : placeholder}
            disabled={disabled || isLoading || isTranscribing}
            className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto ${
              size === 'sm' ? 'text-xs rounded-xl py-1.5 pl-3 pr-3 border border-slate-200' : ''
            } ${textareaClassName}`}
            style={{
              minHeight: size === 'sm' ? '32px' : '44px',
              maxHeight: '120px'
            }}
          />
        </div>

        {/* Action Button: Send or Dictate */}
        {value.trim() || !showVoiceOption || !onStartRecording || !onStopRecording ? (
          <button
            type="submit"
            disabled={isLoading || disabled || isTranscribing || !value.trim()}
            className={`flex-shrink-0 flex items-center justify-center transition-all border ${
              size === 'sm'
                ? `w-7 h-7 rounded-xl ${
                    !value.trim() || isLoading
                      ? 'text-slate-300 bg-slate-50 border border-slate-200 cursor-not-allowed'
                      : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700 shadow-sm'
                  }`
                : `w-11 h-11 rounded-xl ${
                    isLoading || disabled || isTranscribing
                      ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                      : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700 shadow-sm shadow-teal-100'
                  }`
            }`}
            title="Send inquiry"
          >
            {isLoading ? (
              <Icons.Loader className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} animate-spin`} />
            ) : (
              <Icons.Send className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
            )}
          </button>
        ) : (
          /* Symmetrical Dictate button for space integration details */
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isLoading || isTranscribing || disabled}
            className={`flex-shrink-0 flex items-center justify-center transition-all border ${
              size === 'sm'
                ? `w-7 h-7 rounded-xl ${
                    isRecording
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200'
                  }`
                : `w-11 h-11 rounded-xl ${
                    isRecording
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200'
                  }`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? "Stop recording" : "Use voice input"}
          >
            {isTranscribing ? (
              <Icons.Loader className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} animate-spin`} />
            ) : (
              <Icons.Microphone className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
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
