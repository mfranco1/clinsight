import React, { useState } from "react";
import {
  SoapNote,
  GroundingSource,
  GeneralData,
  ClinicalSectionTitle,
} from "../../../types";
import SectionCard from "../../../components/ui/SectionCard";
import EditableSubsection from "./EditableSubsection";
import ClinicalAssistance from "./ClinicalAssistance";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import { Icons } from "../../../components/ui/Icons";
import { formatLinks } from "../../../components/clinical/formatting";
import { generateClinicalSuggestions } from "../../../services/ai/actions";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import {
  keyValueToString,
  stringToKeyValue,
} from "../../../utils/clinicalText";

interface SubjectiveSectionProps {
  data: SoapNote["subjective"];
  patientInfo?: GeneralData;
  groundingSources?: GroundingSource[];
  onUpdate?: (data: SoapNote["subjective"]) => void;
  onAddressSuggestions?: (
    suggestions: string[],
    sectionTitle: ClinicalSectionTitle,
  ) => void;
  visibleSubsections?: {
    chiefComplaint: boolean;
    hpi: boolean;
    ros: boolean;
    pmh: boolean;
    meds: boolean;
    family: boolean;
    social: boolean;
    anamnesis: boolean;
    birthMaternal: boolean;
    immunizations: boolean;
    nutrition: boolean;
    developmental: boolean;
    headsss: boolean;
    sexualHistory: boolean;
  };
}

const SubjectiveSection: React.FC<SubjectiveSectionProps> = ({
  data,
  patientInfo,
  groundingSources,
  onUpdate,
  onAddressSuggestions,
  visibleSubsections = {
    chiefComplaint: true,
    hpi: true,
    ros: true,
    pmh: true,
    meds: true,
    family: true,
    social: true,
    anamnesis: true,
    birthMaternal: true,
    immunizations: true,
    nutrition: true,
    developmental: true,
    headsss: true,
    sexualHistory: true,
  },
}) => {
  const [isEditingRos, setIsEditingRos] = useState(false);
  const [rosLines, setRosLines] = useState<string[]>([]);

  const [isEditingHeaadssss, setIsEditingHeaadssss] = useState(false);
  const [heaadssssLines, setHeaadssssLines] = useState<string[]>([]);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);

  const updateField =
    (field: keyof SoapNote["subjective"]) => (newContent: string) => {
      if (onUpdate) {
        onUpdate({ ...data, [field]: newContent });
      }
    };

  const parseLines = (content: string) => {
    return content.split("\n").filter((line) => line.trim().length > 0);
  };

  const normalizeHeadsss = (text: string | undefined) => {
    if (!text) return "";
    const keywords = [
      "Home",
      "Education",
      "Employment",
      "Education/Employment",
      "Eating",
      "Diet",
      "Nutrition",
      "Activities",
      "Peers",
      "Social",
      "Drugs",
      "Drugs/Drinking",
      "Alcohol",
      "Substance Use",
      "Sexuality",
      "Sexual History",
      "Suicide",
      "Depression",
      "Suicide/Depression",
      "Mood",
      "Mental Health",
      "Safety",
      "Violence",
    ];
    let processed = text;
    keywords.forEach((kw) => {
      const escapedKw = kw.replace("/", "\\/");
      const regex = new RegExp(`(\\s|^)(${escapedKw}\\s*:)`, "gi");
      processed = processed.replace(regex, "\n$2");
    });
    return processed;
  };

  const handleEditRosClick = () => {
    setRosLines(parseLines(keyValueToString(data.ros)));
    setIsEditingRos(true);
  };

  const handleEditHeaadssssClick = () => {
    setHeaadssssLines(parseLines(keyValueToString(data.headsss)));
    setIsEditingHeaadssss(true);
  };

  const handleSaveRos = () => {
    if (onUpdate) {
      const kv = stringToKeyValue(rosLines.join("\n"));
      onUpdate({ ...data, ros: kv });
    }
    setIsEditingRos(false);
  };

  const handleSaveHeaadssss = () => {
    if (onUpdate) {
      const kv = stringToKeyValue(heaadssssLines.join("\n"));
      onUpdate({ ...data, headsss: kv });
    }
    setIsEditingHeaadssss(false);
  };

  const handleGenerateMoreAssistance = async () => {
    if (!onUpdate) return;
    const context = `
      Chief Complaint: ${data.chiefComplaint || ""}
      HPI: ${data.hpi || ""}
      ROS: ${keyValueToString(data.ros)}
      PMH: ${data.pmh || ""}
      Current Meds: ${data.meds || ""}
      Social: ${data.social || ""}
    `;
    try {
      const newSuggestions = await generateClinicalSuggestions(
        "Subjective",
        context,
      );
      if (newSuggestions && newSuggestions.length > 0) {
        const current = data.clinicalAssistance || [];
        const updated = [...current, ...newSuggestions];
        onUpdate({ ...data, clinicalAssistance: updated });
      }
    } catch (e) {
      logDiagnostic("error", "Subjective suggestions request failed.");
      setAssistanceError("Failed to generate additional suggestions.");
    }
  };

  const renderStructuredGrid = (content: string) => {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    return (
      <div className="text-sm text-neutral-800 divide-y divide-neutral-100">
        {lines.map((line, i) => {
          const cleanLine = line.replace(/^[-*•]\s+/, "");
          const colonIndex = cleanLine.indexOf(":");
          if (colonIndex > -1 && colonIndex < 40) {
            const label = cleanLine.substring(0, colonIndex);
            const value = cleanLine.substring(colonIndex + 1);
            return (
              <div
                key={i}
                className="py-2 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4"
              >
                <span className="font-bold text-content-default uppercase text-xs tracking-wide self-start mt-0.5">
                  {label}
                </span>
                <span className="leading-relaxed text-neutral-800">
                  {formatLinks(value, groundingSources)}
                </span>
              </div>
            );
          }
          return (
            <div key={i} className="py-2 first:pt-0 last:pb-0">
              {formatLinks(cleanLine, groundingSources)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderGridEditor = (
    lines: string[],
    setLines: (l: string[]) => void,
    onSave: () => void,
    onCancel: () => void,
    placeholder: string = "Category: Findings",
  ) => (
    <div className="space-y-1 animate-fade-in pl-1 group bg-canvas/30 rounded -ml-2 p-2 border border-action-100">
      {lines.map((line, idx) => {
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
                  onClick={() => {
                    const nl = [...lines];
                    nl.splice(idx, 1);
                    setLines(nl);
                  }}
                  className="absolute -left-6 text-neutral-300 hover:text-danger-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  title="Remove line"
                >
                  <Icons.Trash />
                </button>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => {
                    const nl = [...lines];
                    nl[idx] = `${e.target.value}:${value}`;
                    setLines(nl);
                  }}
                  className="font-bold text-content-default uppercase text-xs tracking-wide bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                />
              </div>
              <EditableTextArea
                value={value}
                onChange={(val) => {
                  const nl = [...lines];
                  nl[idx] = `${label}:${val}`;
                  setLines(nl);
                }}
                className="text-sm text-neutral-800 leading-relaxed bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                showControls={false}
                isEditing={true}
              />
            </div>
          );
        } else {
          return (
            <div key={idx} className="py-2 group/row relative">
              <button
                onClick={() => {
                  const nl = [...lines];
                  nl.splice(idx, 1);
                  setLines(nl);
                }}
                className="absolute -left-6 top-3 text-neutral-300 hover:text-danger-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                title="Remove line"
              >
                <Icons.Trash />
              </button>
              <EditableTextArea
                value={line}
                onChange={(val) => {
                  const nl = [...lines];
                  nl[idx] = val;
                  setLines(nl);
                }}
                className="text-sm text-neutral-800 leading-relaxed bg-transparent border-b border-dashed border-neutral-300 focus:border-action focus:ring-0 outline-none w-full"
                showControls={false}
                isEditing={true}
              />
            </div>
          );
        }
      })}

      <button
        onClick={() => setLines([...lines, placeholder])}
        className="mt-2 text-xs font-medium text-action hover:text-action-hover flex items-center"
      >
        <span className="mr-1">
          <Icons.Plus />
        </span>{" "}
        Add Item
      </button>
      <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-border-default/50">
        <button
          onClick={onSave}
          className="px-4 py-1.5 bg-action text-white text-xs font-medium rounded hover:bg-action-hover transition-colors shadow-sm"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 bg-surface text-content-default border border-neutral-300 text-xs font-medium rounded hover:bg-canvas transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const handleSuggestionsAddress = (selected: string[]) => {
    onAddressSuggestions?.(selected, "Subjective");
  };

  return (
    <SectionCard title="Subjective" icon={<Icons.Subjective />} collapsible>
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
      {visibleSubsections.chiefComplaint && (
        <EditableSubsection
          title="Chief Complaint"
          content={data.chiefComplaint}
          onSave={onUpdate ? updateField("chiefComplaint") : undefined}
          groundingSources={groundingSources}
        />
      )}
      {visibleSubsections.hpi && (
        <EditableSubsection
          title="History of Present Illness"
          content={data.hpi}
          onSave={onUpdate ? updateField("hpi") : undefined}
          groundingSources={groundingSources}
        />
      )}

      {visibleSubsections.ros && (
        <div className="mb-6 last:mb-0 mt-6 group">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider">
              Review of Systems
            </h3>
            {!isEditingRos && onUpdate && (
              <button
                onClick={handleEditRosClick}
                className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Edit ROS"
              >
                <span className="mr-1">
                  <Icons.Edit />
                </span>{" "}
                Edit
              </button>
            )}
          </div>

          {isEditingRos ? (
            renderGridEditor(
              rosLines,
              setRosLines,
              handleSaveRos,
              () => setIsEditingRos(false),
              "System: Finding",
            )
          ) : (
            <div className="text-xs pl-1 group hover:bg-canvas/50 rounded -ml-2 p-2 transition-colors">
              {data.ros ? (
                renderStructuredGrid(keyValueToString(data.ros))
              ) : (
                <span
                  className={`text-content-muted italic transition-colors ${onUpdate ? "cursor-pointer hover:text-action" : ""}`}
                  onClick={onUpdate ? handleEditRosClick : undefined}
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

      {(visibleSubsections.chiefComplaint ||
        visibleSubsections.hpi ||
        visibleSubsections.ros) && (
        <div className="my-8 border-t border-border-subtle"></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
        <div>
          {visibleSubsections.pmh && (
            <EditableSubsection
              title="Past Medical & Surgical History"
              content={data.pmh}
              onSave={onUpdate ? updateField("pmh") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.meds && (
            <EditableSubsection
              title="Medications & Allergies"
              content={data.meds}
              onSave={onUpdate ? updateField("meds") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.family && (
            <EditableSubsection
              title="Family Medical History"
              content={data.family}
              onSave={onUpdate ? updateField("family") : undefined}
              groundingSources={groundingSources}
            />
          )}
        </div>
        <div>
          {visibleSubsections.birthMaternal && (
            <EditableSubsection
              title="Birth & Maternal History"
              content={data.birthMaternal}
              onSave={onUpdate ? updateField("birthMaternal") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.immunizations && (
            <EditableSubsection
              title="Immunization History"
              content={data.immunizations}
              onSave={onUpdate ? updateField("immunizations") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.nutrition && (
            <EditableSubsection
              title="Nutritional History"
              content={data.nutrition}
              onSave={onUpdate ? updateField("nutrition") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.developmental && (
            <EditableSubsection
              title="Developmental History"
              content={data.developmental}
              onSave={onUpdate ? updateField("developmental") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.social && (
            <EditableSubsection
              title="Personal & Social History"
              content={data.social}
              onSave={onUpdate ? updateField("social") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.anamnesis && (
            <EditableSubsection
              title="Anamnesis"
              content={data.anamnesis}
              onSave={onUpdate ? updateField("anamnesis") : undefined}
              groundingSources={groundingSources}
            />
          )}
          {visibleSubsections.sexualHistory && (
            <EditableSubsection
              title={
                patientInfo && patientInfo.ageSex.toLowerCase().includes("f")
                  ? "Sexual & OBGYN History"
                  : "Sexual History"
              }
              content={data.sexualHistory}
              onSave={onUpdate ? updateField("sexualHistory") : undefined}
              groundingSources={groundingSources}
            />
          )}

          {visibleSubsections.headsss && (
            <div className="mb-6 last:mb-0 group">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-content-muted uppercase tracking-wider">
                  HEEADSSSS Assessment
                </h3>
                {!isEditingHeaadssss && onUpdate && (
                  <button
                    onClick={handleEditHeaadssssClick}
                    className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Edit HEEADSSSS"
                  >
                    <span className="mr-1">
                      <Icons.Edit />
                    </span>{" "}
                    Edit
                  </button>
                )}
              </div>

              {isEditingHeaadssss ? (
                renderGridEditor(
                  heaadssssLines,
                  setHeaadssssLines,
                  handleSaveHeaadssss,
                  () => setIsEditingHeaadssss(false),
                  "Category: Findings",
                )
              ) : (
                <div className="text-xs pl-1 group hover:bg-canvas/50 rounded -ml-2 p-2 transition-colors">
                  {data.headsss ? (
                    renderStructuredGrid(keyValueToString(data.headsss))
                  ) : (
                    <span
                      className="text-content-muted italic cursor-pointer hover:text-action transition-colors"
                      onClick={handleEditHeaadssssClick}
                    >
                      No data recorded. Click to edit.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {data.clinicalAssistance !== undefined && (
        <>
          <div className="my-6 border-t border-border-subtle"></div>
          <ClinicalAssistance
            content={data.clinicalAssistance}
            sectionTitle="Subjective"
            onGenerateMore={onUpdate ? handleGenerateMoreAssistance : undefined}
            onSelectSuggestions={handleSuggestionsAddress}
          />
        </>
      )}
    </SectionCard>
  );
};

export default SubjectiveSection;
