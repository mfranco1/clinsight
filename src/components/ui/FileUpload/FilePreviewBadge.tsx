import React from "react";
import { Icons } from "../Icons";
import { FileUpload } from "../../../types";

interface FilePreviewBadgeProps {
  file: FileUpload;
  onRemove: () => void;
  onOpen?: () => void;
}

export const FilePreviewBadge: React.FC<FilePreviewBadgeProps> = ({
  file,
  onRemove,
  onOpen,
}) => {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="flex items-center gap-2 bg-surface border border-border-default rounded-lg p-1.5 pr-2.5 shadow-sm hover:border-action-300 transition-all group">
      <div
        className="w-8 h-8 rounded bg-surface-muted flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={onOpen}
      >
        {isImage && (file.previewUrl || file.base64) ? (
          <img
            src={
              file.previewUrl || `data:${file.mimeType};base64,${file.base64}`
            }
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <Icons.FileText className="w-4 h-4 text-content-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-content-primary truncate max-w-[100px]">
          {file.file?.name || "Attachment"}
        </p>
        <p className="text-[8px] text-content-muted uppercase font-bold tracking-wider">
          {file.mimeType.split("/")[1]}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-neutral-300 hover:text-danger-500 transition-colors p-0.5"
      >
        <Icons.Close className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
