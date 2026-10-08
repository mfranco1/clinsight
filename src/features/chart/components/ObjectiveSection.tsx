import React, { useState, useRef } from "react";
import {
  SoapNote,
  GroundingSource,
  PhotoCategory,
  ClinicalSectionTitle,
} from "../../../types";
import SectionCard from "../../../components/ui/SectionCard";
import EditableSubsection from "./EditableSubsection";
import ClinicalAssistance from "./ClinicalAssistance";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import ClinicalMarkdown from "../../../components/clinical/ClinicalMarkdown";
import { Icons } from "../../../components/ui/Icons";
import { generateClinicalSuggestions } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import {
  keyValueToString,
  stringToKeyValue,
} from "../../../utils/clinicalText";
import {
  arrayToMarkdownBullets,
  markdownBulletsToArray,
} from "../../../utils/markdown";

interface ObjectiveSectionProps {
  data: SoapNote["objective"];
  groundingSources?: GroundingSource[];
  onUpdate?: (data: SoapNote["objective"]) => void;
  onAddressSuggestions?: (
    suggestions: string[],
    sectionTitle: ClinicalSectionTitle,
  ) => void;
  onOpenGallery?: (tab: PhotoCategory) => void;
  headerActions?: React.ReactNode;
  visibleSubsections?: {
    vitals: boolean;
    anthropometrics: boolean;
    physicalExam: boolean;
    labs: boolean;
    imaging: boolean;
  };
}

const ObjectiveSection: React.FC<ObjectiveSectionProps> = ({
  data,
  groundingSources,
  onUpdate,
  onAddressSuggestions,
  onOpenGallery,
  headerActions,
  visibleSubsections = {
    vitals: true,
    anthropometrics: true,
    physicalExam: true,
    labs: true,
    imaging: true,
  },
}) => {
  const [showLabInterp, setShowLabInterp] = useState(true);
  const [showImagingCorrelation, setShowImagingCorrelation] = useState(true);
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [examLines, setExamLines] = useState<string[]>([]);

  const [isEditingLabInterp, setIsEditingLabInterp] = useState(false);
  const [isEditingImagingCorrelation, setIsEditingImagingCorrelation] =
    useState(false);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);

  const updateField =
    <Field extends keyof SoapNote["objective"]>(field: Field) =>
    (newContent: SoapNote["objective"][Field]) => {
      if (onUpdate) {
        onUpdate({ ...data, [field]: newContent });
      }
    };

  const parseExamLines = (content: string) => {
    return content.split("\n").filter((line) => line.trim().length > 0);
  };

  const handleEditExamClick = () => {
    setExamLines(parseExamLines(keyValueToString(data.physicalExam)));
    setIsEditingExam(true);
  };

  const handleAddExamLine = () => {
    setExamLines([...examLines, "System: Normal"]);
  };

  const handleDeleteExamLine = (index: number) => {
    const newLines = [...examLines];
    newLines.splice(index, 1);
    setExamLines(newLines);
  };

  const handleSaveExam = () => {
    if (onUpdate) {
      const kv = stringToKeyValue(examLines.join("\n"));
      onUpdate({ ...data, physicalExam: kv });
    }
    setIsEditingExam(false);
  };

  const handleGenerateMoreAssistance = async () => {
    if (!onUpdate) return;
    const context = `
      Vitals: ${data.vitals || ""}
      Physical Exam: ${keyValueToString(data.physicalExam)}
      Labs: ${data.labs || ""}
      Imaging: ${data.imaging || ""}
    `;
    try {
      const newSuggestions = await generateClinicalSuggestions(
        "Objective",
        context,
      );
      if (newSuggestions && newSuggestions.length > 0) {
        const current = data.clinicalAssistance || [];
        const updated = [...current, ...newSuggestions];
        onUpdate({ ...data, clinicalAssistance: updated });
      }
    } catch (e) {
      logDiagnostic("error", "Objective suggestions request failed.");
      setAssistanceError("Failed to generate additional suggestions.");
    }
  };

  const renderPhysicalExam = (examContent: string) => {
    return (
      <ClinicalMarkdown
        content={examContent}
        groundingSources={groundingSources}
        className="text-sm"
      />
    );
  };

  const handleSuggestionsAddress = (selected: string[]) => {
    onAddressSuggestions?.(selected, "Objective");
  };

  const hasLabInterp = Array.isArray(data.labInterpretation)
    ? data.labInterpretation.length > 0
    : !!data.labInterpretation;
  const hasImagingCorrelation = Array.isArray(data.imagingCorrelation)
    ? data.imagingCorrelation.length > 0
    : !!data.imagingCorrelation;
  return (
    <SectionCard
      title="Objective"
      icon={<Icons.Objective />}
      collapsible
      headerActions={headerActions}
    >
      {assistanceError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700"
        >
          {assistanceError}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setAssistanceError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {(visibleSubsections.vitals || visibleSubsections.anthropometrics) && (
        <div
          className={`grid grid-cols-1 ${visibleSubsections.anthropometrics ? "md:grid-cols-2" : ""} gap-6 mb-6`}
        >
          {visibleSubsections.vitals && (
            <div className="bg-canvas rounded-lg p-4 border border-border-subtle">
              <EditableSubsection
                title="Vital Signs"
                content={data.vitals}
                onSave={onUpdate ? updateField("vitals") : undefined}
                groundingSources={groundingSources}
                className="mb-0"
              />
            </div>
          )}
          {visibleSubsections.anthropometrics && (
            <div className="bg-canvas rounded-lg p-4 border border-border-subtle">
              <EditableSubsection
                title="Anthropometrics"
                content={data.anthropometrics}
                onSave={onUpdate ? updateField("anthropometrics") : undefined}
                groundingSources={groundingSources}
                className="mb-0"
              />
            </div>
          )}
        </div>
      )}

      {visibleSubsections.physicalExam && (
        <div className="mb-6 last:mb-0 mt-6 group">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider">
              Physical Examination
            </h3>
            <div className="flex items-center gap-3">
              {onUpdate && (
                <button
                  onClick={() => onOpenGallery?.("Physical Exam")}
                  className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center bg-surface px-2 py-1 rounded border border-action-border hover:border-action-300 transition-all shadow-sm"
                  title="Upload Physical Exam Photos"
                >
                  <span className="mr-1">
                    <Icons.Upload className="w-3 h-3" />
                  </span>{" "}
                  Upload
                </button>
              )}
              {!isEditingExam && onUpdate && (
                <button
                  onClick={handleEditExamClick}
                  className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Edit Physical Exam"
                >
                  <span className="mr-1">
                    <Icons.Edit />
                  </span>{" "}
                  Edit
                </button>
              )}
            </div>
          </div>

          {isEditingExam ? (
            <div className="space-y-1 animate-fade-in pl-1 group bg-canvas/30 rounded -ml-2 p-2 border border-action-100">
              {/* content unchanged but skip to else render block */}
              {examLines.map((line, idx) => {
                const cleanLine = line.replace(/^[-*•]\s+/, "");
                const colonIndex = cleanLine.indexOf(":");
                const isKeyVal = colonIndex > -1 && colonIndex < 40;
                if (isKeyVal) {
                  const label = cleanLine.substring(0, colonIndex);
                  const value = cleanLine.substring(colonIndex + 1);
                  return (
                    <div
                      key={idx}
                      className="py-2 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 items-start group/row relative"
                    >
                      <div className="flex items-center">
                        <button
                          onClick={() => handleDeleteExamLine(idx)}
                          className="absolute -left-6 text-neutral-300 hover:text-danger-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                          title="Remove line"
                        >
                          <Icons.Trash />
                        </button>
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => {
                            const newLines = [...examLines];
                            newLines[idx] = `${e.target.value}:${value}`;
                            setExamLines(newLines);
                          }}
                          className="font-bold text-content-default uppercase text-xs tracking-wide bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                        />
                      </div>
                      <EditableTextArea
                        value={value}
                        onChange={(val) => {
                          const newLines = [...examLines];
                          newLines[idx] = `${label}:${val}`;
                          setExamLines(newLines);
                        }}
                        className="text-xs text-neutral-800 leading-relaxed bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                        showControls={false}
                        isEditing={true}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="py-2 group/row relative">
                      <button
                        onClick={() => handleDeleteExamLine(idx)}
                        className="absolute -left-6 top-3 text-neutral-300 hover:text-danger-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        title="Remove line"
                      >
                        <Icons.Trash />
                      </button>
                      <EditableTextArea
                        value={line}
                        onChange={(val) => {
                          const newLines = [...examLines];
                          newLines[idx] = val;
                          setExamLines(newLines);
                        }}
                        className="text-xs text-neutral-800 leading-relaxed bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                        showControls={false}
                        isEditing={true}
                      />
                    </div>
                  );
                }
              })}
              <button
                onClick={handleAddExamLine}
                className="mt-2 text-xs font-medium text-action hover:text-action-hover flex items-center"
              >
                <span className="mr-1">
                  <Icons.Plus />
                </span>{" "}
                Add System
              </button>
              <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-border-default/50">
                <button
                  onClick={handleSaveExam}
                  className="px-4 py-1.5 bg-action text-white text-xs font-medium rounded hover:bg-action-hover transition-colors shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingExam(false)}
                  className="px-4 py-1.5 bg-surface text-content-default border border-neutral-300 text-xs font-medium rounded hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="pl-1 group hover:bg-canvas/50 rounded -ml-2 p-2 transition-colors">
              {data.physicalExam ? (
                renderPhysicalExam(keyValueToString(data.physicalExam))
              ) : (
                <span
                  className={`text-content-muted italic text-xs transition-colors ${onUpdate ? "cursor-pointer hover:text-action" : ""}`}
                  onClick={onUpdate ? handleEditExamClick : undefined}
                >
                  {onUpdate
                    ? "No data recorded. Click to edit."
                    : "No data recorded."}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {visibleSubsections.physicalExam &&
        (visibleSubsections.labs || visibleSubsections.imaging) && (
          <div className="my-8 border-t border-border-subtle"></div>
        )}

      {visibleSubsections.labs && (
        <div className="mb-8">
          <div
            className={`grid grid-cols-1 ${hasLabInterp && showLabInterp ? "md:grid-cols-2" : ""} gap-6 transition-all duration-300`}
          >
            <div className="bg-canvas/50 rounded-lg p-5 border border-border-default">
              <EditableSubsection
                title="Laboratory Data"
                content={data.labs}
                onSave={onUpdate ? updateField("labs") : undefined}
                groundingSources={groundingSources}
                className="mb-0 text-xs"
                headerActions={
                  <div className="flex items-center space-x-3">
                    {onUpdate && (
                      <button
                        onClick={() => onOpenGallery?.("Laboratory")}
                        className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center bg-surface px-2 py-1 rounded border border-action-border hover:border-action-300 transition-all shadow-sm"
                        title="Upload Image of Labs"
                      >
                        <span className="mr-1">
                          <Icons.Upload className="w-3 h-3" />
                        </span>{" "}
                        Upload
                      </button>
                    )}
                    {hasLabInterp && !showLabInterp && (
                      <button
                        onClick={() => setShowLabInterp(true)}
                        className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center"
                        title="Show Interpretation"
                      >
                        <span className="mr-1">
                          <Icons.PanelOpen />
                        </span>{" "}
                        Interpretation
                      </button>
                    )}
                  </div>
                }
              />
            </div>
            {hasLabInterp && showLabInterp && (
              <div className="bg-action-subtle/50 rounded-lg p-5 border border-action-border animate-fade-in relative group/panel">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Icons.Assistance className="w-4 h-4 text-action mr-2" />
                    <h3 className="text-xs font-bold text-action-800 uppercase tracking-wider">
                      Lab Interpretation
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingLabInterp && onUpdate && (
                      <button
                        onClick={() => setIsEditingLabInterp(true)}
                        className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/panel:opacity-100 focus:opacity-100"
                        title="Edit Lab Interpretation"
                      >
                        <span className="mr-1">
                          <Icons.Edit />
                        </span>{" "}
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setShowLabInterp(false)}
                      className="text-action-400 hover:text-action transition-colors p-1"
                      title="Hide Interpretation"
                    >
                      <Icons.PanelClose />
                    </button>
                  </div>
                </div>
                <div className="pl-1">
                  <EditableTextArea
                    value={arrayToMarkdownBullets(data.labInterpretation)}
                    onSave={(val) => {
                      updateField("labInterpretation")(
                        markdownBulletsToArray(val),
                      );
                      setIsEditingLabInterp(false);
                    }}
                    onCancel={() => setIsEditingLabInterp(false)}
                    isEditing={isEditingLabInterp}
                    setIsEditing={setIsEditingLabInterp}
                    groundingSources={groundingSources}
                    className="text-sm text-content-primary border-none p-0 bg-transparent"
                    hideEditButton={true}
                    editorMode="document"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {visibleSubsections.imaging && (
        <div className="mb-8">
          <div
            className={`grid grid-cols-1 ${hasImagingCorrelation && showImagingCorrelation ? "md:grid-cols-2" : ""} gap-6 transition-all duration-300`}
          >
            <div className="bg-canvas/50 rounded-lg p-5 border border-border-default">
              <EditableSubsection
                title="Imaging & Diagnostics"
                content={data.imaging}
                onSave={onUpdate ? updateField("imaging") : undefined}
                groundingSources={groundingSources}
                className="text-xs mb-0"
                headerActions={
                  <div className="flex items-center space-x-3">
                    {onUpdate && (
                      <button
                        onClick={() => onOpenGallery?.("Imaging")}
                        className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center bg-surface px-2 py-1 rounded border border-action-border hover:border-action-300 transition-all shadow-sm"
                        title="Upload Imaging/ECG"
                      >
                        <span className="mr-1">
                          <Icons.Upload className="w-3 h-3" />
                        </span>{" "}
                        Upload
                      </button>
                    )}
                    {hasImagingCorrelation && !showImagingCorrelation && (
                      <button
                        onClick={() => setShowImagingCorrelation(true)}
                        className="text-action hover:text-action-hover text-xs font-bold uppercase flex items-center"
                        title="Show Correlation"
                      >
                        <span className="mr-1">
                          <Icons.PanelOpen />
                        </span>{" "}
                        Show Correlation
                      </button>
                    )}
                  </div>
                }
              />
            </div>
            {hasImagingCorrelation && showImagingCorrelation && (
              <div className="bg-action-subtle/50 rounded-lg p-5 border border-action-border animate-fade-in relative group/panel">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Icons.Layout className="w-4 h-4 text-action mr-2" />
                    <h3 className="text-xs font-bold text-action-800 uppercase tracking-wider">
                      Clinical Correlation
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingImagingCorrelation && onUpdate && (
                      <button
                        onClick={() => setIsEditingImagingCorrelation(true)}
                        className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/panel:opacity-100 focus:opacity-100"
                        title="Edit Clinical Correlation"
                      >
                        <span className="mr-1">
                          <Icons.Edit />
                        </span>{" "}
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setShowImagingCorrelation(false)}
                      className="text-action-400 hover:text-action transition-colors p-1"
                      title="Hide Correlation"
                    >
                      <Icons.PanelClose />
                    </button>
                  </div>
                </div>
                <div className="pl-1">
                  <EditableTextArea
                    value={arrayToMarkdownBullets(data.imagingCorrelation)}
                    onSave={(val) => {
                      updateField("imagingCorrelation")(
                        markdownBulletsToArray(val),
                      );
                      setIsEditingImagingCorrelation(false);
                    }}
                    onCancel={() => setIsEditingImagingCorrelation(false)}
                    isEditing={isEditingImagingCorrelation}
                    setIsEditing={setIsEditingImagingCorrelation}
                    groundingSources={groundingSources}
                    className="text-sm text-content-primary border-none p-0 bg-transparent"
                    hideEditButton={true}
                    editorMode="document"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {data.clinicalAssistance !== undefined && (
        <ClinicalAssistance
          content={data.clinicalAssistance}
          sectionTitle="Objective"
          onGenerateMore={onUpdate ? handleGenerateMoreAssistance : undefined}
          onSelectSuggestions={handleSuggestionsAddress}
        />
      )}
    </SectionCard>
  );
};

export default ObjectiveSection;
