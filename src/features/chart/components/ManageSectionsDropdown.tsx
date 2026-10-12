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

interface SectionCategoryGroupProps {
  category: keyof SectionVisibility;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ReadonlyArray<{ id: string; label: string }>;
  visibility: Record<string, boolean>;
  isExpanded: boolean;
  isAllEnabled: boolean;
  onToggleExpanded: () => void;
  onToggleAll: () => void;
  onToggleItem: (id: string) => void;
}

const SectionCategoryGroup: React.FC<SectionCategoryGroupProps> = ({
  category,
  title,
  icon: Icon,
  items,
  visibility,
  isExpanded,
  isAllEnabled,
  onToggleExpanded,
  onToggleAll,
  onToggleItem,
}) => {
  const contentId = `manage-sections-${category}`;
  const titleId = `${contentId}-title`;

  return (
    <section className="space-y-2" aria-labelledby={titleId}>
      <div className="group/header flex items-center justify-between">
        <button
          id={titleId}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={onToggleExpanded}
          className="flex flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Icons.ChevronDown
            aria-hidden="true"
            className={`h-3 w-3 text-content-muted transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
          />
          <Icon aria-hidden="true" className="h-3.5 w-3.5 text-action" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-content-muted">
            {title}
          </span>
        </button>
        <button
          type="button"
          aria-label={`${isAllEnabled ? "Hide" : "Show"} all ${title.toLowerCase()} sections`}
          onClick={onToggleAll}
          className="rounded px-1 text-[9px] font-bold uppercase tracking-wider text-action opacity-0 transition-opacity hover:text-action-hover focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring group-hover/header:opacity-100"
        >
          {isAllEnabled ? "Hide all" : "Show all"}
        </button>
      </div>
      <div
        id={contentId}
        role="region"
        aria-labelledby={titleId}
        hidden={!isExpanded}
        className="space-y-1 pl-1"
      >
        {items.map((item) => (
          <label
            key={item.id}
            className="group flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-canvas"
          >
            <input
              type="checkbox"
              checked={visibility[item.id]}
              onChange={() => onToggleItem(item.id)}
              className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-action transition-all focus:ring-focus-ring"
            />
            <span
              className={`text-xs font-medium transition-colors ${visibility[item.id] ? "text-content-primary" : "text-content-muted"}`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
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
      <div className="max-h-[400px] space-y-6 overflow-y-auto p-4 custom-scrollbar">
        <SectionCategoryGroup
          category="subjective"
          title="Subjective"
          icon={Icons.Subjective}
          items={sections.subjective}
          visibility={visibility.subjective}
          isExpanded={expanded.subjective}
          isAllEnabled={Object.values(visibility.subjective).every(Boolean)}
          onToggleExpanded={() => toggleExpanded("subjective")}
          onToggleAll={() => toggleCategory("subjective")}
          onToggleItem={(id) =>
            toggleSection(
              "subjective",
              id as keyof SectionVisibility["subjective"],
            )
          }
        />
        <SectionCategoryGroup
          category="objective"
          title="Objective"
          icon={Icons.Objective}
          items={sections.objective}
          visibility={visibility.objective}
          isExpanded={expanded.objective}
          isAllEnabled={Object.values(visibility.objective).every(Boolean)}
          onToggleExpanded={() => toggleExpanded("objective")}
          onToggleAll={() => toggleCategory("objective")}
          onToggleItem={(id) =>
            toggleSection(
              "objective",
              id as keyof SectionVisibility["objective"],
            )
          }
        />
      </div>

      <div className="p-3 bg-canvas border-t border-border-subtle text-[10px] text-content-muted font-medium text-center">
        Hiding sections will not delete their content
      </div>
    </div>
  );
};

export default ManageSectionsDropdown;
