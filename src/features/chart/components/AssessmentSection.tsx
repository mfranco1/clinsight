import React, { useState } from "react";
import { SoapNote, GroundingSource } from "../../../types";
import SectionCard from "../../../components/ui/SectionCard";
import EditableSubsection from "./EditableSubsection";
import DifferentialDiagnosis from "./DifferentialDiagnosis";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import { Icons } from "../../../components/ui/Icons";
import {
  arrayToMarkdownBullets,
  markdownBulletsToArray,
} from "../../../utils/markdown";

interface AssessmentSectionProps {
  data: SoapNote["assessment"];
  groundingSources?: GroundingSource[];
  onUpdate?: (data: SoapNote["assessment"]) => void;
}

const AssessmentSection: React.FC<AssessmentSectionProps> = ({
  data,
  groundingSources,
  onUpdate,
}) => {
  const [showRationale, setShowRationale] = useState(true);

  const [isEditingRationale, setIsEditingRationale] = useState(false);

  const updateField =
    (field: keyof SoapNote["assessment"]) => (newContent: string) => {
      if (onUpdate) {
        onUpdate({ ...data, [field]: newContent });
      }
    };

  const hasRationale =
    !!data.rationale &&
    (Array.isArray(data.rationale)
      ? data.rationale.length > 0
      : !!data.rationale);
  const hasIcdCodes = data.icdCodes && data.icdCodes.length > 0;

  return (
    <SectionCard title="Assessment" icon={<Icons.Assessment />} collapsible>
      <div
        className={`grid grid-cols-1 ${hasRationale && showRationale ? "md:grid-cols-2" : ""} gap-6 transition-all duration-300`}
      >
        <div className="flex flex-col">
          <EditableSubsection
            title="Complete Diagnosis"
            content={data.summary}
            onSave={onUpdate ? updateField("summary") : undefined}
            groundingSources={groundingSources}
            className="text-xs mb-4"
            headerActions={
              hasRationale &&
              !showRationale && (
                <button
                  onClick={() => setShowRationale(true)}
                  className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center mr-2"
                  title="Show Rationale"
                >
                  <span className="mr-1">
                    <Icons.PanelOpen />
                  </span>{" "}
                  Show Rationale
                </button>
              )
            }
          />

          {/* ICD-10 Codes Tags */}
          {hasIcdCodes && (
            <div className="mt-2 animate-fade-in">
              <h4 className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-2 ml-1">
                ICD-10 CODES
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.icdCodes!.map((codeStr, idx) => {
                  const parts = codeStr.split(":");
                  const code = parts[0].trim();
                  const desc =
                    parts.length > 1 ? parts.slice(1).join(":").trim() : "";

                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center bg-surface border border-border-default rounded-lg overflow-hidden shadow-sm hover:border-action-300 transition-colors group/icd"
                    >
                      <span className="bg-surface-muted px-2 py-1.5 text-xs font-bold text-content-primary border-r border-border-default group-hover/icd:bg-action-subtle group-hover/icd:text-action-hover transition-colors">
                        {code}
                      </span>
                      {desc && (
                        <span
                          className="px-3 py-1.5 text-xs text-content-default font-medium max-w-[200px] truncate"
                          title={desc}
                        >
                          {desc}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {hasRationale && showRationale && (
          <div className="bg-action-subtle/50 rounded-lg p-4 border border-action-100 animate-fade-in relative group/panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-action-hover uppercase tracking-wider flex items-center">
                <Icons.Rationale className="w-3 h-3 mr-1" />
                Rationale
              </h3>
              <div className="flex items-center gap-2">
                {!isEditingRationale && onUpdate && (
                  <button
                    onClick={() => setIsEditingRationale(true)}
                    className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/panel:opacity-100 focus:opacity-100"
                    title="Edit Rationale"
                  >
                    <span className="mr-1">
                      <Icons.Edit />
                    </span>{" "}
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setShowRationale(false)}
                  className="text-action-400 hover:text-action transition-colors p-1"
                  title="Hide Rationale"
                >
                  <Icons.PanelClose />
                </button>
              </div>
            </div>
            <div className="pl-1">
              <EditableTextArea
                value={arrayToMarkdownBullets(data.rationale)}
                onSave={(val) => {
                  if (onUpdate) {
                    onUpdate({
                      ...data,
                      rationale: markdownBulletsToArray(val),
                    });
                  }
                  setIsEditingRationale(false);
                }}
                onCancel={() => setIsEditingRationale(false)}
                isEditing={isEditingRationale}
                setIsEditing={setIsEditingRationale}
                groundingSources={groundingSources}
                className="text-sm text-content-primary border-none p-0 bg-transparent"
                hideEditButton={true}
                editorMode="document"
              />
            </div>
          </div>
        )}
      </div>

      <DifferentialDiagnosis content={data.differentialDiagnosis} />
    </SectionCard>
  );
};

export default AssessmentSection;
