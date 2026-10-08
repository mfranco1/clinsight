import React from "react";
import type { FileUpload, GroundingSource } from "../../../types";
import { Icons } from "../../../components/ui/Icons";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import { openAttachment } from "../../../services/fileService";

interface NoteContentAreaProps {
  content: string;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  groundingSources?: GroundingSource[];
  searchQuery?: string;
  handleSave: (value: string) => void;
  handleCancel: () => void;
  attachments?: FileUpload[];
  onUpload: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const NoteContentArea = React.memo<NoteContentAreaProps>(
  ({
    content,
    isEditing,
    setIsEditing,
    groundingSources,
    searchQuery,
    handleSave,
    handleCancel,
    attachments,
    onUpload,
    fileInputRef,
  }) => (
    <>
      <EditableTextArea
        value={content}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        groundingSources={groundingSources}
        showReferences={true}
        placeholder="Start typing your note here... (Supports Markdown and LaTeX)"
        className="border-none p-0 bg-transparent"
        hideEditButton={true}
        searchQuery={searchQuery}
      />

      {isEditing && (
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mr-auto flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
          >
            <Icons.Paperclip className="w-4 h-4" />
            Attach
          </button>
        </div>
      )}

      {isEditing && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*,application/pdf"
          onChange={(event) => onUpload(event.target.files)}
        />
      )}

      {!isEditing && attachments && attachments.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-50">
          <div className="flex flex-wrap gap-3">
            {attachments.map((attachment, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openAttachment(attachment)}
                className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                {attachment.mimeType.startsWith("image/") ? (
                  <img
                    src={
                      attachment.file && attachment.previewUrl
                        ? attachment.previewUrl
                        : `data:${attachment.mimeType};base64,${attachment.base64}`
                    }
                    alt="attachment"
                    className="w-8 h-8 object-cover rounded-lg border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg">
                    <Icons.FileText className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">
                    {attachment.file?.name ||
                      (attachment.mimeType.startsWith("image/")
                        ? "Image Attachment"
                        : "PDF Document")}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {attachment.mimeType.startsWith("image/") ? "Image" : "PDF"}{" "}
                    • View
                  </p>
                </div>
                <Icons.ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-teal-600 transition-colors ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  ),
  (previous, next) =>
    previous.content === next.content &&
    previous.isEditing === next.isEditing &&
    previous.searchQuery === next.searchQuery &&
    previous.groundingSources === next.groundingSources &&
    previous.attachments === next.attachments,
);

export default NoteContentArea;
