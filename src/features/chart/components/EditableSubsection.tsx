import React, { useState } from "react";
import { formatLinks } from "../../../components/clinical/formatting";
import { Icons } from "../../../components/ui/Icons";
import { GroundingSource } from "../../../types";

import EditableTextArea from "../../../components/ui/EditableTextArea";

const EditableSubsection: React.FC<{
  title: string;
  content: string | undefined;
  groundingSources?: GroundingSource[];
  showReferences?: boolean;
  onSave?: (newContent: string) => void;
  className?: string;
  headerActions?: React.ReactNode;
}> = ({
  title,
  content,
  groundingSources,
  showReferences = false,
  onSave,
  className = "",
  headerActions,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (newContent: string) => {
    if (onSave) onSave(newContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className={`mb-6 last:mb-0 group ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          {headerActions}
          {!isEditing && onSave && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
              title={`Edit ${title}`}
            >
              <span className="mr-1">
                <Icons.Edit />
              </span>
              Edit
            </button>
          )}
        </div>
      </div>

      <EditableTextArea
        value={content || ""}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        groundingSources={groundingSources}
        showReferences={showReferences}
        placeholder={`Enter ${title.toLowerCase()}...`}
        className="border-none p-0 bg-transparent"
        hideEditButton={true}
        editorMode="document"
        disabled={!onSave}
      />
    </div>
  );
};

export default EditableSubsection;
