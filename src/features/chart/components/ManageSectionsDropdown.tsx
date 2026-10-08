import React, { useState } from "react";
import { Icons } from "../../../components/ui/Icons";

export interface SectionVisibility {
  subjective: {
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
  objective: {
    vitals: boolean;
    anthropometrics: boolean;
    physicalExam: boolean;
    labs: boolean;
    imaging: boolean;
  };
}

interface ManageSectionsDropdownProps {
  visibility: SectionVisibility;
  onChange: (visibility: SectionVisibility) => void;
  onClose: () => void;
}

const sections = {
  subjective: [
    { id: "chiefComplaint", label: "Chief Complaint" },
    { id: "hpi", label: "History of Present Illness" },
    { id: "ros", label: "Review of Systems" },
    { id: "pmh", label: "Past Medical History" },
    { id: "meds", label: "Medications & Allergies" },
    { id: "family", label: "Family Medical History" },
    { id: "social", label: "Personal & Social History" },
    { id: "anamnesis", label: "Anamnesis" },
    { id: "sexualHistory", label: "Sexual History" },
    { id: "birthMaternal", label: "Birth & Maternal History" },
    { id: "immunizations", label: "Immunization History" },
    { id: "nutrition", label: "Nutritional History" },
    { id: "developmental", label: "Developmental History" },
    { id: "headsss", label: "HEEADSSSS Assessment" },
  ] satisfies Array<{
    id: keyof SectionVisibility["subjective"];
    label: string;
  }>,
  objective: [
    { id: "vitals", label: "Vital Signs" },
    { id: "anthropometrics", label: "Anthropometrics" },
    { id: "physicalExam", label: "Physical Examination" },
    { id: "labs", label: "Laboratory Data" },
    { id: "imaging", label: "Imaging & Diagnostics" },
  ] satisfies Array<{
    id: keyof SectionVisibility["objective"];
    label: string;
  }>,
};

const ManageSectionsDropdown: React.FC<ManageSectionsDropdownProps> = ({
  visibility,
  onChange,
  onClose,
}) => {
  const [expanded, setExpanded] = useState({
    subjective: false,
    objective: false,
  });

  const toggleExpanded = (category: "subjective" | "objective") => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleSection = <Category extends keyof SectionVisibility>(
    category: Category,
    section: keyof SectionVisibility[Category],
  ) => {
    const group = visibility[category];
    onChange({
      ...visibility,
      [category]: { ...group, [section]: !group[section] },
    });
  };

  const toggleCategory = (category: "subjective" | "objective") => {
    const group = visibility[category];
    const allOn = Object.values(group).every((v) => v);
    const targetValue = !allOn;

    const updatedGroup = Object.fromEntries(
      Object.keys(group).map((key) => [key, targetValue]),
    );
    onChange({
      ...visibility,
      [category]: updatedGroup as SectionVisibility[typeof category],
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-2xl shadow-xl border border-border-default z-[100] overflow-hidden animate-fade-in origin-top-right">
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Subjective Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group/header">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-transparent p-1 rounded-md transition-colors flex-1"
              onClick={() => toggleExpanded("subjective")}
            >
              <Icons.ChevronDown
                className={`w-3 h-3 text-content-muted transition-transform duration-200 ${expanded.subjective ? "" : "-rotate-90"}`}
              />
              <Icons.Subjective className="w-3.5 h-3.5 text-action" />
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                Subjective
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory("subjective");
              }}
              className="text-[9px] font-bold text-action hover:text-action-hover uppercase tracking-wider opacity-0 group-hover/header:opacity-100 transition-opacity"
            >
              Toggle All
            </button>
          </div>
          {expanded.subjective && (
            <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {sections.subjective.map((section) => (
                <label
                  key={section.id}
                  className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-canvas cursor-pointer transition-colors group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={visibility.subjective[section.id]}
                      onChange={() => toggleSection("subjective", section.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-action focus:ring-focus-ring transition-all cursor-pointer"
                    />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${visibility.subjective[section.id] ? "text-content-primary" : "text-content-muted"}`}
                  >
                    {section.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Objective Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group/header">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-transparent p-1 rounded-md transition-colors flex-1"
              onClick={() => toggleExpanded("objective")}
            >
              <Icons.ChevronDown
                className={`w-3 h-3 text-content-muted transition-transform duration-200 ${expanded.objective ? "" : "-rotate-90"}`}
              />
              <Icons.Objective className="w-3.5 h-3.5 text-action" />
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                Objective
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory("objective");
              }}
              className="text-[9px] font-bold text-action hover:text-action-hover uppercase tracking-wider opacity-0 group-hover/header:opacity-100 transition-opacity"
            >
              Toggle All
            </button>
          </div>
          {expanded.objective && (
            <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {sections.objective.map((section) => (
                <label
                  key={section.id}
                  className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-canvas cursor-pointer transition-colors group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={visibility.objective[section.id]}
                      onChange={() => toggleSection("objective", section.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-action focus:ring-focus-ring transition-all cursor-pointer"
                    />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${visibility.objective[section.id] ? "text-content-primary" : "text-content-muted"}`}
                  >
                    {section.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-canvas border-t border-border-subtle text-[10px] text-content-muted font-medium text-center">
        Hiding sections will not delete their content
      </div>
    </div>
  );
};

export default ManageSectionsDropdown;
