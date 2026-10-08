import React, { useRef } from "react";
import { Icons } from "../Icons";
import { useFileDrop } from "../../../hooks/useFileDrop";

interface FileDropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onCameraClick?: () => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  label?: string;
  subLabel?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  onCameraClick,
  accept = "image/*,application/pdf",
  multiple = true,
  className = "",
  label = "Click to upload or drag and drop",
  subLabel = "Images or PDFs (Max 10MB)",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, onDragOver, onDragLeave, onDrop } = useFileDrop({
    onFilesDrop: onFilesSelected,
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
        isDragging
          ? "border-action-500 bg-action-subtle/50 scale-[1.01]"
          : "border-border-default hover:border-action-400 hover:bg-canvas/50"
      } ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInputChange}
      />

      <div className="flex flex-col items-center justify-center text-center cursor-pointer">
        <div
          className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? "bg-action-100 text-action" : "bg-surface-muted text-content-muted"}`}
        >
          <Icons.Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-content-primary mb-1">{label}</p>
        <p className="text-xs text-content-secondary">{subLabel}</p>

        {onCameraClick && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-px w-8 bg-neutral-200" />
            <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              or
            </span>
            <div className="h-px w-8 bg-neutral-200" />
          </div>
        )}

        {onCameraClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick();
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface border border-border-default rounded-lg text-xs font-bold text-content-default hover:bg-canvas hover:border-action-300 transition-all active:scale-95"
          >
            <Icons.Camera className="w-4 h-4 text-action" />
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
};
