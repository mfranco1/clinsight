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
          ? "border-teal-500 bg-teal-50/50 scale-[1.01]"
          : "border-slate-200 hover:border-teal-400 hover:bg-slate-50/50"
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
          className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"}`}
        >
          <Icons.Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-xs text-slate-500">{subLabel}</p>

        {onCameraClick && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-px w-8 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              or
            </span>
            <div className="h-px w-8 bg-slate-200" />
          </div>
        )}

        {onCameraClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick();
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-teal-300 transition-all active:scale-95"
          >
            <Icons.Camera className="w-4 h-4 text-teal-600" />
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
};
