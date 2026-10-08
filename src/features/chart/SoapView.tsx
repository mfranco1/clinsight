import { BRAND } from "../../config/brand";
import React, { useState, useMemo } from "react";
import {
  SoapNote,
  GroundingSource,
  GeneralData,
  ChartEntry,
  PhotoCategory,
  PatientOrder,
  MedicationOrder,
  Encounter,
  PatientStatus,
  EncounterType,
  FileUpload,
  ClinicalSectionTitle,
} from "../../types";
import { Icons } from "../../components/ui/Icons";
import Toast from "../../components/Toast";
import SubjectiveSection from "./components/SubjectiveSection";
import ObjectiveSection from "./components/ObjectiveSection";
import AssessmentSection from "./components/AssessmentSection";
import PlanSection from "./components/PlanSection";
import SectionCard from "../../components/ui/SectionCard";
import Badge from "../../components/ui/Badge";
import GenerateRxModal from "./components/GenerateRxModal";
import PhotoGalleryModal from "../../components/dialogs/PhotoGalleryModal";
import ConfirmationModal from "../../components/dialogs/ConfirmationModal";
import DateRangeFields from "../../components/ui/DateRangeFields";
import SmartAppendOverlay from "./components/SmartAppendOverlay";
import ManageSectionsDropdown, {
  SectionVisibility,
} from "./components/ManageSectionsDropdown";
import EditableTextArea from "../../components/ui/EditableTextArea";
import ClinicalMarkdown from "../../components/clinical/ClinicalMarkdown";
import { keyValueToString } from "../../utils/clinicalText";
import { integrateClinicalData } from "../../services/ai/actions";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { SPECIALIZATIONS } from "../../config/appConfig";
import StickyToolbar from "../../components/ui/StickyToolbar";
import {
  ToolbarButton,
  ToolbarPagination,
  ToolbarSeparator,
} from "../../components/ui/ToolbarSections";
import { useChartHistoryNavigation } from "./useChartHistoryNavigation";
import {
  applyIntegrationResult,
  resolveIntegrationTarget,
} from "./clinicalIntegration";
import { useChartPhotoAnalysis } from "./useChartPhotoAnalysis";
import { parseReferenceList } from "./references";
import { formatChartRecordForClipboard } from "./formatForClipboard";
import { useClinicalNoteResize } from "./useClinicalNoteResize";
import { useEntrySectionVisibility } from "./useEntrySectionVisibility";
import { useChartStatusActions } from "./useChartStatusActions";
import { useChartToolbarState } from "./useChartToolbarState";

const ENTRY_TYPE_FILTERS = ["All", "Admission", "Progress"] as const;

const DEFAULT_VISIBILITY: SectionVisibility = {
  subjective: {
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
  objective: {
    vitals: true,
    anthropometrics: true,
    physicalExam: true,
    labs: true,
    imaging: true,
  },
};

const isPopulated = (val: string | undefined): boolean => {
  if (!val) return false;
  const cleaned = val
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  if (
    cleaned === "" ||
    cleaned === "not mentioned" ||
    cleaned === "not recorded" ||
    cleaned === "na" ||
    cleaned === "none" ||
    cleaned === "not documented" ||
    cleaned === "not available" ||
    cleaned.startsWith("not mentioned") ||
    cleaned.startsWith("not recorded")
  ) {
    return false;
  }
  return true;
};

const computeInitialVisibility = (
  soap: SoapNote | undefined,
): SectionVisibility => {
  if (!soap) return DEFAULT_VISIBILITY;
  return {
    subjective: {
      chiefComplaint: isPopulated(soap.subjective?.chiefComplaint),
      hpi: isPopulated(soap.subjective?.hpi),
      ros: isPopulated(keyValueToString(soap.subjective?.ros)),
      pmh: isPopulated(soap.subjective?.pmh),
      meds: isPopulated(soap.subjective?.meds),
      family: isPopulated(soap.subjective?.family),
      social: isPopulated(soap.subjective?.social),
      anamnesis: isPopulated(soap.subjective?.anamnesis),
      birthMaternal: isPopulated(soap.subjective?.birthMaternal),
      immunizations: isPopulated(soap.subjective?.immunizations),
      nutrition: isPopulated(soap.subjective?.nutrition),
      developmental: isPopulated(soap.subjective?.developmental),
      headsss: isPopulated(keyValueToString(soap.subjective?.headsss)),
      sexualHistory: isPopulated(soap.subjective?.sexualHistory),
    },
    objective: {
      vitals: isPopulated(soap.objective?.vitals),
      anthropometrics: isPopulated(soap.objective?.anthropometrics),
      physicalExam: isPopulated(keyValueToString(soap.objective?.physicalExam)),
      labs: isPopulated(soap.objective?.labs),
      imaging: isPopulated(soap.objective?.imaging),
    },
  };
};

interface SoapViewProps {
  activeEntry: ChartEntry;
  history: ChartEntry[];
  onSelectEntry: (id: string) => void;
  patientInfo: GeneralData;
  encounters?: Encounter[];
  patientStatus?: PatientStatus;
  onUpdatePatientStatus?: (status: PatientStatus) => void;
  groundingSources?: GroundingSource[];
  references?: string[];
  onUpdate?: (updatedSoap: SoapNote) => void;
  onUpdateEntry?: (updatedEntry: ChartEntry) => void;
  onUpdatePatient?: (updatedInfo: GeneralData) => void;
  onExport?: () => void;
  onReassess?: () => void;
  onAssess?: () => void;
  onAddEntry?: () => void;
  onDeleteEntry?: (id: string) => void;
  isReassessing: boolean;
  orders?: PatientOrder[];
  medications?: MedicationOrder[];
  onAddOrder?: (order: PatientOrder) => void;
  onUpdateMedications?: (meds: MedicationOrder[]) => void;
  onReactivateEncounter?: (encounterId: string) => void;
}

interface HistoryPanelProps {
  filteredHistory: ChartEntry[];
  paginatedHistory: ChartEntry[];
  encounters?: Encounter[];
  activeEntryId: string;
  onSelectEntry: (id: string) => void;
  olderEntry: ChartEntry | null;
  newerEntry: ChartEntry | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  activeFilterCount: number;
  setIsMobileHistoryOpen: (val: boolean) => void;
  totalHistoryPages: number;
  historyCurrentPage: number;
  setHistoryCurrentPage: (val: number) => void;
  clearAllFilters: () => void;
  typeFilter: "All" | "Admission" | "Progress";
  setTypeFilter: (val: "All" | "Admission" | "Progress") => void;
  selectedSpecs: string[];
  setSelectedSpecs: (val: string[]) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  setEntryIdToDelete: (id: string) => void;
  collapsedEncounters: Set<string>;
  toggleEncounter: (id: string) => void;
}

const getDisplayEntryTitle = (entry: ChartEntry, encounters?: Encounter[]) => {
  if (entry.title.includes("Consult")) return entry.title;
  const encounter = encounters?.find((e) => e.id === entry.encounterId);
  if (encounter?.type === EncounterType.CONSULT) {
    return entry.title
      .replace("Progress Note", "Consult Note")
      .replace("Admission Note", "Consult Note");
  }
  return entry.title;
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  filteredHistory,
  paginatedHistory,
  encounters,
  activeEntryId,
  onSelectEntry,
  olderEntry,
  newerEntry,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  activeFilterCount,
  setIsMobileHistoryOpen,
  totalHistoryPages,
  historyCurrentPage,
  setHistoryCurrentPage,
  clearAllFilters,
  typeFilter,
  setTypeFilter,
  selectedSpecs,
  setSelectedSpecs,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  setEntryIdToDelete,
  collapsedEncounters,
  toggleEncounter,
}) => {
  // Sort encounter IDs based on the latest entry date in each or encounter start date
  const sortedEncounterIds = useMemo(() => {
    const rawIds = Array.from(
      new Set(paginatedHistory.map((e) => e.encounterId || "unknown")),
    );
    return rawIds.sort((a, b) => {
      const encA = encounters?.find((e) => e.id === a);
      const encB = encounters?.find((e) => e.id === b);
      if (encA && encB)
        return (
          new Date(encB.startDate).getTime() -
          new Date(encA.startDate).getTime()
        );
      return 0;
    });
  }, [paginatedHistory, encounters]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border-subtle bg-canvas/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              Chart History
            </h3>
            <span className="text-[9px] font-medium text-content-muted mt-0.5">
              {filteredHistory.length} total entries
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => newerEntry && onSelectEntry(newerEntry.id)}
              disabled={!newerEntry}
              className="p-1 rounded hover:bg-neutral-200 text-content-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Newer Entry"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => olderEntry && onSelectEntry(olderEntry.id)}
              disabled={!olderEntry}
              className="p-1 rounded hover:bg-neutral-200 text-content-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Older Entry"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-neutral-200 mx-1"></div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded transition-colors relative ${showFilters ? "bg-action-100 text-action" : "text-content-muted hover:bg-neutral-200"}`}
              title="Filter History"
            >
              <Icons.Filter className="w-4 h-4" />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-action-subtle rounded-full border border-white"></span>
              )}
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileHistoryOpen(false)}
              className="lg:hidden p-1 rounded text-content-muted hover:bg-neutral-200 ml-1"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-default rounded-lg text-xs focus:ring-1 focus:ring-focus-ring focus:border-action outline-none transition-all font-medium"
            />
            <Icons.Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-content-muted" />
          </div>

          {totalHistoryPages > 1 && (
            <ToolbarPagination
              currentPage={historyCurrentPage}
              totalPages={totalHistoryPages}
              onPageChange={setHistoryCurrentPage}
              showPageSelector={false}
              className="bg-surface border border-border-default rounded-lg py-1 px-1.5"
            />
          )}
        </div>

        {showFilters && (
          <div className="mt-3 p-3 bg-surface rounded-lg border border-border-default shadow-inner space-y-4 animate-fade-in max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-content-secondary uppercase tracking-widest">
                Active Filters
              </span>
              <button
                onClick={clearAllFilters}
                className="text-[9px] font-bold text-action hover:text-action-hover uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div>
              <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1.5 block">
                Entry Type
              </label>
              <div className="flex gap-1">
                {ENTRY_TYPE_FILTERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${typeFilter === t ? "bg-action-subtle border-action-border text-action-hover" : "bg-canvas border-border-subtle text-content-secondary"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-content-muted uppercase tracking-wider mb-1.5 block">
                Specialization
              </label>
              <div className="relative mb-2">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedSpecs.includes(val)) {
                      setSelectedSpecs([...selectedSpecs, val]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full px-2 py-1.5 bg-surface border border-border-default rounded text-[10px] font-medium text-content-default focus:ring-1 focus:ring-focus-ring outline-none transition-all appearance-none pr-8 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select specialization...
                  </option>
                  {SPECIALIZATIONS.filter(
                    (s) => !selectedSpecs.includes(s),
                  ).map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-content-muted">
                  <Icons.ChevronDown className="w-3 h-3" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSpecs.map((spec) => (
                  <Badge
                    tone="success"
                    size="sm"
                    key={spec}
                    className="rounded border border-action-border shadow-sm animate-fade-in"
                  >
                    {spec}
                    <button
                      onClick={() =>
                        setSelectedSpecs(
                          selectedSpecs.filter((s) => s !== spec),
                        )
                      }
                      className="ml-1.5 text-action-400 hover:text-action transition-colors"
                    >
                      <Icons.Close className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              {selectedSpecs.length > 0 && (
                <button
                  onClick={() => setSelectedSpecs([])}
                  className="mt-2 text-[8px] font-bold text-content-muted hover:text-action uppercase tracking-widest block transition-colors"
                >
                  Reset Specialties
                </button>
              )}
            </div>

            <DateRangeFields
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              variant="inline"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-canvas/30">
        {paginatedHistory.length === 0 ? (
          <div className="text-center py-10 text-content-muted">
            <Icons.FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-medium">No entries found</p>
          </div>
        ) : (
          sortedEncounterIds.map((encounterId) => {
            const encounterEntries = paginatedHistory.filter(
              (e) => (e.encounterId || "unknown") === encounterId,
            );
            const encounter = encounters?.find((e) => e.id === encounterId);
            const isCollapsed = collapsedEncounters.has(encounterId);
            const typeLabel = encounter
              ? encounter.type === "ADMISSION"
                ? "Admission"
                : "Consult"
              : encounterId === "unknown"
                ? "Legacy Encounter"
                : "Unknown Encounter";
            const dateLabel = encounter
              ? new Date(encounter.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";

            return (
              <div key={encounterId} className="space-y-1.5 relative">
                <div
                  className="flex items-center gap-2 px-1 py-1 group cursor-pointer hover:bg-surface-muted/50 rounded-lg transition-colors"
                  onClick={() => toggleEncounter(encounterId)}
                >
                  {encounter && (
                    <div
                      className={`p-1 rounded bg-surface border ${encounter.type === "ADMISSION" ? "text-action border-action-100" : "text-content-default border-border-default"}`}
                    >
                      {encounter.type === "ADMISSION" ? (
                        <Icons.Plus className="w-3 h-3" />
                      ) : (
                        <Icons.ClipboardList className="w-3 h-3" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[10px] font-bold text-content-secondary uppercase tracking-widest truncate">
                        {typeLabel} {dateLabel}
                      </h4>
                      {encounter?.status === "COMPLETED" && (
                        <span className="text-[8px] font-bold bg-surface-muted text-content-muted px-1 py-0.25 rounded-full uppercase border border-border-default">
                          Historical
                        </span>
                      )}
                    </div>
                  </div>
                  <Icons.ChevronDown
                    className={`w-3 h-3 text-neutral-300 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </div>

                {!isCollapsed && (
                  <div className="space-y-2 animate-slide-down-fade">
                    {encounterEntries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          onSelectEntry(entry.id);
                          setIsMobileHistoryOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden cursor-pointer ${activeEntryId === entry.id ? "bg-action-subtle border-action-border shadow-sm ring-1 ring-action-500/10" : "bg-surface border-transparent hover:bg-surface-muted/50 hover:border-border-default"}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-tight ${activeEntryId === entry.id ? "text-action" : "text-content-muted"}`}
                            >
                              {entry.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {entry.specialization &&
                              entry.specialization !== "General Practice" && (
                                <span className="text-[8px] font-bold bg-action-100 text-action-hover px-1 py-0.5 rounded uppercase">
                                  {entry.specialization}
                                </span>
                              )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEntryIdToDelete(entry.id);
                              }}
                              className="p-1 rounded text-neutral-300 hover:text-danger-500 hover:bg-transparent transition-all"
                              title="Delete entry"
                            >
                              <Icons.Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div
                          className={`text-xs font-bold truncate pr-4 ${activeEntryId === entry.id ? "text-action-900" : "text-content-primary"}`}
                        >
                          {getDisplayEntryTitle(entry, encounters)}
                        </div>
                        <ClinicalMarkdown
                          content={
                            entry.entryType === "raw"
                              ? entry.rawText ||
                                (encounters?.find(
                                  (enc) =>
                                    enc.id === (entry.encounterId || "unknown"),
                                )?.type === EncounterType.CONSULT
                                  ? "Manual Consult Note"
                                  : entry.title.includes("Admission")
                                    ? "Manual Admission Note"
                                    : "Manual Progress Note")
                              : entry.soap?.assessment.summary || ""
                          }
                          showSource={false}
                          className="line-clamp-1 text-[11px] font-medium italic text-content-secondary"
                        />

                        {activeEntryId === entry.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-action-subtle"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SoapView: React.FC<SoapViewProps> = ({
  activeEntry,
  history,
  onSelectEntry,
  patientInfo,
  encounters,
  patientStatus,
  onUpdatePatientStatus,
  groundingSources,
  references,
  onUpdate,
  onUpdateEntry,
  onUpdatePatient,
  onExport,
  onReassess,
  onAssess,
  onAddEntry,
  onDeleteEntry,
  isReassessing,
  orders,
  medications,
  onAddOrder,
  onUpdateMedications,
  onReactivateEncounter,
}) => {
  const [copied, setCopied] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotosOpen, setIsPhotosOpen] = useState(false);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<{
    texts: string[];
    sectionTitle: ClinicalSectionTitle;
  } | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [galleryTab, setGalleryTab] = useState<PhotoCategory>("Physical Exam");
  const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
  const [isEditingReferences, setIsEditingReferences] = useState(false);
  const [collapsedEncounters, setCollapsedEncounters] = useState<Set<string>>(
    () => {
      const historical =
        encounters?.filter((e) => e.status !== "ACTIVE").map((e) => e.id) || [];
      const set = new Set(historical);
      // Also collapse legacy encounters by default
      set.add("unknown");
      return set;
    },
  );

  const toggleEncounter = (id: string) => {
    setCollapsedEncounters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const {
    statusConfirm,
    setStatusConfirm,
    successMessage,
    setSuccessMessage,
    updatePatientStatus: handleUpdatePatientStatusAndToast,
  } = useChartStatusActions(onUpdatePatientStatus);

  const {
    isAnalyzingPhotos,
    isAnalyzingLabs,
    isAnalyzingImaging,
    analyzePhotos: handleAnalyzePhotos,
    analyzeLabs: handleAnalyzeLabs,
    analyzeImaging: handleAnalyzeImaging,
  } = useChartPhotoAnalysis({
    activeEntry,
    onUpdate,
    setWorkflowError,
  });

  const data = activeEntry.soap || ({} as SoapNote);
  const { entryVisibilities, setEntryVisibilities, currentVisibility } =
    useEntrySectionVisibility(activeEntry.id, computeInitialVisibility(data));

  const {
    menuRef,
    manageRef,
    isMenuOpen,
    setIsMenuOpen,
    isManageOpen,
    setIsManageOpen,
    isHistoryCollapsed,
    setIsHistoryCollapsed,
    isMobileHistoryOpen,
    setIsMobileHistoryOpen,
  } = useChartToolbarState();

  const { height: noteHeight, startResizing: startResizingNote } =
    useClinicalNoteResize();

  const {
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    typeFilter,
    setTypeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedSpecs,
    setSelectedSpecs,
    historyCurrentPage,
    setHistoryCurrentPage,
    historyItemsPerPage,
    setHistoryItemsPerPage,
    filteredHistory,
    totalHistoryPages,
    paginatedHistory,
  } = useChartHistoryNavigation(history, activeEntry.id);

  // Sequential Navigation
  const activeIndex = history.findIndex((e) => e.id === activeEntry.id);
  const newerEntry = activeIndex > 0 ? history[activeIndex - 1] : null;
  const olderEntry =
    activeIndex < history.length - 1 ? history[activeIndex + 1] : null;
  const totalEntries = history.length;

  const activeEncounter = useMemo(() => {
    return encounters?.find((e) => e.id === activeEntry.encounterId);
  }, [encounters, activeEntry.encounterId]);

  const isHistorical =
    activeEncounter?.status === "COMPLETED" ||
    patientStatus === PatientStatus.DISCHARGED;

  const handleCopy = () => {
    const text = formatChartRecordForClipboard(data, patientInfo, activeEntry);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPhotos = (newPhotos: FileUpload[]) => {
    if (onUpdateEntry) {
      onUpdateEntry({
        ...activeEntry,
        attachments: [...(activeEntry.attachments || []), ...newPhotos],
      });
    }
  };

  const openGallery = (tab: PhotoCategory = "Physical Exam") => {
    setGalleryTab(tab);
    setIsPhotosOpen(true);
  };

  const handleRemovePhoto = (index: number) => {
    if (onUpdateEntry && activeEntry.attachments) {
      const newAttachments = [...activeEntry.attachments];
      newAttachments.splice(index, 1);
      onUpdateEntry({
        ...activeEntry,
        attachments: newAttachments,
      });
    }
  };

  const handleAddressSuggestions = (
    suggestions: string[],
    sectionTitle: ClinicalSectionTitle,
  ) => {
    setActiveSuggestions({ texts: suggestions, sectionTitle });
  };

  const handleIntegrateData = async (userInput: string) => {
    if (!activeSuggestions || !onUpdate) return;

    const { sectionTitle, texts: suggestions } = activeSuggestions;

    const target = resolveIntegrationTarget(data, sectionTitle, suggestions);

    try {
      const revisedContent = await integrateClinicalData(
        target.field.toUpperCase(),
        target.currentContent,
        suggestions,
        userInput,
      );
      onUpdate(
        applyIntegrationResult(data, target, revisedContent, suggestions),
      );

      setActiveSuggestions(null);
    } catch (err) {
      logDiagnostic("error", "Clinical data integration failed.");
      setWorkflowError("Failed to integrate information. Please try again.");
    }
  };

  const handleDeleteConfirm = () => {
    if (entryIdToDelete && onDeleteEntry) {
      onDeleteEntry(entryIdToDelete);
    }
    setEntryIdToDelete(null);
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const clearAllFilters = () => {
    setTypeFilter("All");
    setStartDate("");
    setEndDate("");
    setSelectedSpecs([]);
    setSearchQuery("");
    setHistoryCurrentPage(1);
  };

  const activeFilterCount =
    (typeFilter !== "All" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    selectedSpecs.length;

  const hasReferences =
    (references && references.length > 0) ||
    (groundingSources && groundingSources.length > 0);

  const historyPanelProps: HistoryPanelProps = {
    filteredHistory,
    paginatedHistory,
    encounters,
    activeEntryId: activeEntry.id,
    onSelectEntry,
    olderEntry,
    newerEntry,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    activeFilterCount,
    setIsMobileHistoryOpen,
    totalHistoryPages,
    historyCurrentPage,
    setHistoryCurrentPage,
    clearAllFilters,
    typeFilter,
    setTypeFilter,
    selectedSpecs,
    setSelectedSpecs,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setEntryIdToDelete,
    collapsedEncounters,
    toggleEncounter,
  };

  return (
    <>
      {workflowError && (
        <div
          role="alert"
          className="fixed bottom-24 right-4 z-[120] max-w-md rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700 shadow-lg"
        >
          {workflowError}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setWorkflowError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex h-full relative overflow-hidden">
        {/* Chart History Timeline (Desktop Aside) */}
        <aside
          className={`bg-surface hidden lg:flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative border-r ${isHistoryCollapsed ? "w-0 border-transparent" : "w-80 border-border-default"}`}
        >
          <div className="w-80 h-full">
            <HistoryPanel {...historyPanelProps} />
          </div>

          {/* Ghost Toggle Stripe */}
          <div
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="absolute inset-y-0 -right-1 w-3 group/history-stripe cursor-pointer z-50 hidden lg:block"
            title={isHistoryCollapsed ? "Expand History" : "Collapse History"}
          >
            <div
              className={`absolute inset-y-0 right-1 w-[2px] transition-colors duration-300 ${isHistoryCollapsed ? "bg-neutral-200/50" : "bg-transparent"} group-hover/history-stripe:bg-action-subtle/50`}
            />
            <div
              className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-surface border border-border-default rounded-full p-1 text-content-muted 
            shadow-sm transition-all duration-300 transform
            opacity-0 group-hover/history-stripe:opacity-100 
            ${isHistoryCollapsed ? "rotate-180 scale-110" : "rotate-0 scale-100"}
          `}
            >
              <Icons.ChevronLeft className="w-3 h-3" />
            </div>
          </div>
        </aside>

        {/* Main Chart Workspace Wrapper */}
        <div
          key={activeEntry.id}
          id="soap-view-scroll-container"
          className="flex-1 overflow-y-auto bg-canvas/30 animate-slide-up-fade relative flex flex-col main-scroll-container"
        >
          {isHistoryCollapsed && (
            <button
              onClick={() => setIsHistoryCollapsed(false)}
              className="absolute left-4 top-4 z-40 bg-surface border border-border-default rounded-xl p-2.5 text-action shadow-lg hover:bg-action-subtle transition-all hover:scale-105 group animate-fade-in hidden lg:flex items-center"
              title="Open Chart History"
            >
              <Icons.History className="w-5 h-5 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                History
              </span>
            </button>
          )}

          <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
            {patientStatus === PatientStatus.DISCHARGED && (
              <div className="bg-action-subtle border border-action-border rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-action-100 p-2 rounded-lg shrink-0">
                    <Icons.Alert className="text-action w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-action-900">
                      Patient Discharged
                    </h4>
                    <p className="text-xs text-action-800 mt-0.5">
                      Start a new encounter, or reactivate this one to resume
                      charting
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setStatusConfirm({ action: "CONSULT" })}
                    className="flex-1 sm:flex-none text-xs font-bold bg-action hover:bg-action-hover text-white border border-action-600 px-4 py-2 rounded-lg transition-colors text-center shadow-sm"
                  >
                    New Consult
                  </button>
                  <button
                    onClick={() => setStatusConfirm({ action: "READMIT" })}
                    className="flex-1 sm:flex-none text-xs font-bold bg-surface border border-action-300 hover:bg-action-100 text-action-800 px-4 py-2 rounded-lg transition-colors text-center shadow-sm"
                  >
                    Readmit
                  </button>
                  {activeEncounter?.status === "COMPLETED" &&
                    onReactivateEncounter && (
                      <button
                        onClick={() =>
                          setStatusConfirm({ action: "REACTIVATE" })
                        }
                        className="flex-1 sm:flex-none text-xs font-bold bg-surface border border-action-300 hover:bg-action-100 text-action-800 px-4 py-2 rounded-lg transition-colors text-center shadow-sm"
                      >
                        Reactivate
                      </button>
                    )}
                </div>
              </div>
            )}

            <StickyToolbar
              containerClassName="-mx-4 px-4 -mt-6 pt-6 pb-4 mb-4"
              showOverflow={true}
            >
              <div className="flex items-center justify-between px-2 py-2 min-h-[52px] relative w-full">
                {/* Scrollable Container for buttons without dropdowns */}
                <div className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5 mr-2">
                  {isHistorical && (
                    <div className="flex items-center gap-2 shrink-0">
                      {onReactivateEncounter && activeEncounter && (
                        <button
                          onClick={() =>
                            setStatusConfirm({ action: "REACTIVATE" })
                          }
                          className="flex items-center gap-1 px-3 py-1.5 bg-action-subtle border border-action-border hover:bg-action-100 active:bg-action-200 text-action-hover rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                          title="Reactivate this completed encounter to resume charting"
                        >
                          <Icons.Unlock className="w-3 h-3" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* MOBILE ENTRY STEPPER */}
                  <div className="lg:hidden flex items-center">
                    <ToolbarPagination
                      currentPage={activeIndex + 1}
                      totalPages={totalEntries}
                      onPageChange={(page) => {
                        const targetEntry = history[page - 1];
                        if (targetEntry) onSelectEntry(targetEntry.id);
                      }}
                      onPrev={() => newerEntry && onSelectEntry(newerEntry.id)}
                      onNext={() => olderEntry && onSelectEntry(olderEntry.id)}
                      hasPrev={!!newerEntry}
                      hasNext={!!olderEntry}
                      showPageSelector={false}
                      customLabel={
                        <button
                          onClick={() => setIsMobileHistoryOpen(true)}
                          className="px-2 text-[10px] font-bold text-content-default uppercase tracking-tighter whitespace-nowrap min-w-[50px] text-center hover:bg-surface hover:text-action rounded transition-colors"
                          title="Open Chart History"
                        >
                          {activeIndex + 1} / {totalEntries}
                        </button>
                      }
                    />
                    <ToolbarSeparator className="mx-2" />
                  </div>

                  {patientStatus !== PatientStatus.DISCHARGED && onAddEntry && (
                    <ToolbarButton
                      onClick={onAddEntry}
                      icon={Icons.Plus}
                      label="Add Entry"
                      variant="primary"
                      hideLabelOnMobile={true}
                    />
                  )}

                  <ToolbarButton
                    onClick={() => setIsNoteOpen(!isNoteOpen)}
                    icon={Icons.FileText}
                    label="Original Note"
                    variant={isNoteOpen ? "active" : "secondary"}
                    hideLabelOnMobile={true}
                  />

                  <ToolbarButton
                    onClick={handleCopy}
                    icon={copied ? Icons.Check : Icons.Copy}
                    label={copied ? "Copied" : "Copy Entry"}
                    variant={copied ? "success" : "secondary"}
                    hideLabelOnMobile={true}
                  />

                  {!isHistorical &&
                    onReassess &&
                    activeEntry.entryType !== "raw" && (
                      <ToolbarButton
                        onClick={onReassess}
                        disabled={isReassessing}
                        icon={isReassessing ? Icons.Loader : Icons.Refresh}
                        label={isReassessing ? "Wait..." : "Reassess"}
                        variant={isReassessing ? "active" : "secondary"}
                        hideLabelOnMobile={true}
                      />
                    )}

                  {!isHistorical &&
                    onAssess &&
                    activeEntry.entryType === "raw" && (
                      <ToolbarButton
                        onClick={onAssess}
                        disabled={isReassessing}
                        icon={isReassessing ? Icons.Loader : Icons.Brain}
                        label={isReassessing ? "Assessing..." : "Assess"}
                        variant={isReassessing ? "active" : "secondary"}
                        hideLabelOnMobile={true}
                      />
                    )}
                </div>

                {/* Fixed Right Section for Dropdown trigger to escape overflow clipping */}
                <div className="flex-shrink-0 flex items-center gap-2 relative z-20">
                  {/* Manage Button */}
                  {!isHistorical && (
                    <div className="relative" ref={manageRef}>
                      <ToolbarButton
                        onClick={() => setIsManageOpen(!isManageOpen)}
                        icon={Icons.Filter}
                        label="Manage"
                        variant={isManageOpen ? "active" : "secondary"}
                        hideLabelOnMobile={true}
                      />
                      {isManageOpen && (
                        <ManageSectionsDropdown
                          visibility={currentVisibility}
                          onChange={(newVisibility) => {
                            setEntryVisibilities((prev) => ({
                              ...prev,
                              [activeEntry.id]: newVisibility,
                            }));
                          }}
                          onClose={() => setIsManageOpen(false)}
                        />
                      )}
                    </div>
                  )}

                  <div className="relative" ref={menuRef}>
                    <ToolbarButton
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      icon={Icons.More}
                      variant={isMenuOpen ? "active" : "secondary"}
                      className="w-9 h-9 p-0 flex items-center justify-center"
                    />
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-2xl border border-border-default z-50 py-2 animate-fade-in origin-top-right overflow-hidden">
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-content-default hover:bg-action-subtle hover:text-action-hover transition-colors flex items-center">
                          Clinical Abstract
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-content-default hover:bg-action-subtle hover:text-action-hover transition-colors flex items-center">
                          Discharge Summary
                        </button>
                        <div className="h-px bg-surface-muted my-1"></div>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-content-default hover:bg-action-subtle hover:text-action-hover transition-colors flex items-center">
                          <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center">
                            <Icons.Print />
                          </span>
                          Print View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </StickyToolbar>

            {/* Note Metadata Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-6">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${activeEntry.id === history[0]?.id ? "bg-action text-white" : "bg-neutral-200 text-content-secondary"}`}
                >
                  {activeEntry.id === history[0]?.id
                    ? "Latest Entry"
                    : "Historical Entry"}
                </span>
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                  •
                </span>
                <span className="text-[10px] font-bold text-content-secondary uppercase tracking-widest">
                  {activeEntry.date}
                </span>
                {activeEntry.specialization &&
                  activeEntry.specialization !== "General Practice" && (
                    <>
                      <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                        •
                      </span>
                      <span className="text-[10px] font-bold text-action uppercase tracking-widest">
                        {activeEntry.specialization}
                      </span>
                    </>
                  )}
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-surface border border-border-default rounded-lg overflow-hidden shadow-sm hover:border-action-300 transition-colors group/clinician">
                  <span className="bg-canvas px-2 py-1 text-[9px] font-bold text-content-muted border-r border-border-default group-hover/clinician:bg-action-subtle group-hover/clinician:text-action transition-colors uppercase tracking-widest">
                    Clinician
                  </span>
                  <span className="px-2.5 py-1 text-[10px] text-content-default font-bold">
                    M. Franco, MD
                  </span>
                </div>
                <div className="bg-surface px-2 py-1 rounded-md border border-border-default shadow-sm text-[10px] font-bold text-content-primary uppercase tracking-wider">
                  {getDisplayEntryTitle(activeEntry, encounters)}
                </div>
              </div>
            </div>

            {activeEntry.entryType === "raw" ? (
              <SectionCard
                title="CLINICAL NOTE"
                icon={<Icons.Clipboard className="w-5 h-5" />}
                className="group"
                headerActions={
                  !isEditingRaw &&
                  !isHistorical && (
                    <button
                      onClick={() => setIsEditingRaw(true)}
                      className="p-1.5 text-content-muted hover:text-action hover:bg-action-subtle rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Edit Note"
                    >
                      <Icons.Edit className="w-3.5 h-3.5" />
                    </button>
                  )
                }
              >
                <EditableTextArea
                  value={activeEntry.rawText || activeEntry.originalNote || ""}
                  onSave={(v) => {
                    if (onUpdateEntry) {
                      onUpdateEntry({
                        ...activeEntry,
                        rawText: v,
                        originalNote: v,
                      });
                    }
                    setIsEditingRaw(false);
                  }}
                  onCancel={() => setIsEditingRaw(false)}
                  isEditing={isEditingRaw}
                  setIsEditing={setIsEditingRaw}
                  className="w-full"
                  placeholder="Enter progress note details..."
                  hideEditButton={true}
                  editorMode="document"
                  disabled={isHistorical}
                />
              </SectionCard>
            ) : (
              <>
                <SubjectiveSection
                  data={data.subjective}
                  patientInfo={patientInfo}
                  groundingSources={groundingSources}
                  onUpdate={
                    !isHistorical && onUpdate
                      ? (newData) => onUpdate({ ...data, subjective: newData })
                      : undefined
                  }
                  onAddressSuggestions={handleAddressSuggestions}
                  visibleSubsections={currentVisibility.subjective}
                />

                <ObjectiveSection
                  data={data.objective}
                  groundingSources={groundingSources}
                  onUpdate={
                    !isHistorical && onUpdate
                      ? (newData) => onUpdate({ ...data, objective: newData })
                      : undefined
                  }
                  onAddressSuggestions={handleAddressSuggestions}
                  onOpenGallery={openGallery}
                  visibleSubsections={currentVisibility.objective}
                  headerActions={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGallery("Physical Exam");
                      }}
                      className="text-action hover:text-action-hover text-xs font-bold flex items-center bg-action-subtle px-3 py-1.5 rounded-md border border-action-100 hover:border-action-border transition-colors shadow-sm"
                      title="View Clinical Photos"
                    >
                      Media Gallery
                    </button>
                  }
                />
              </>
            )}

            {(activeEntry.entryType !== "raw" ||
              data.assessment ||
              isReassessing) && (
              <>
                {isReassessing ? (
                  <SectionCard title="Assessment" icon={<Icons.Assessment />}>
                    <div className="animate-pulse space-y-4 py-2">
                      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                      <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                      <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                    </div>
                  </SectionCard>
                ) : (
                  data.assessment && (
                    <AssessmentSection
                      data={data.assessment}
                      groundingSources={groundingSources}
                      onUpdate={
                        !isHistorical && onUpdate
                          ? (newData) =>
                              onUpdate({ ...data, assessment: newData })
                          : undefined
                      }
                    />
                  )
                )}

                {isReassessing ? (
                  <SectionCard title="Plan" icon={<Icons.Plan />}>
                    <div className="animate-pulse space-y-6 py-2">
                      <div className="space-y-3">
                        <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
                        <div className="h-4 bg-neutral-200 rounded w-full"></div>
                        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-5 bg-neutral-200 rounded w-1/4"></div>
                        <div className="h-4 bg-neutral-200 rounded w-full"></div>
                        <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
                      </div>
                    </div>
                  </SectionCard>
                ) : (
                  data.plan && (
                    <PlanSection
                      planData={data.plan}
                      generalData={patientInfo}
                      groundingSources={groundingSources}
                      onUpdate={
                        !isHistorical && onUpdate
                          ? (newPlan) => onUpdate({ ...data, plan: newPlan })
                          : undefined
                      }
                      onUpdateBroaderManagement={
                        !isHistorical && onUpdate
                          ? (newBM) =>
                              onUpdate({ ...data, broaderManagement: newBM })
                          : undefined
                      }
                      fullSoapNote={data}
                      onOpenRx={() => setIsRxOpen(true)}
                      orders={orders}
                      onAddOrder={onAddOrder}
                      readOnly={isHistorical}
                    />
                  )
                )}
              </>
            )}

            {isReassessing ? (
              <SectionCard title="References" icon={<Icons.Book />}>
                <div className="animate-pulse space-y-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 bg-neutral-200 rounded mt-0.5"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-neutral-200 rounded w-full"></div>
                      <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 bg-neutral-200 rounded mt-0.5"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-neutral-200 rounded w-full"></div>
                      <div className="h-3 bg-neutral-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : (
              hasReferences && (
                <SectionCard
                  title="References"
                  collapsible={true}
                  defaultExpanded={false}
                  icon={<Icons.Book className="w-5 h-5" />}
                  headerActions={
                    !isEditingReferences &&
                    onUpdateEntry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingReferences(true);
                        }}
                        className="text-action hover:text-action-hover text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                        title="Edit References"
                      >
                        <span className="mr-1">
                          <Icons.Edit />
                        </span>{" "}
                        Edit
                      </button>
                    )
                  }
                >
                  <EditableTextArea
                    value={
                      references && references.length > 0
                        ? references
                            .map((ref, idx) => `[${idx + 1}] ${ref}`)
                            .join("\n\n")
                        : groundingSources && groundingSources.length > 0
                          ? groundingSources
                              .map(
                                (source, idx) =>
                                  `[${idx + 1}] [${source.title}](${source.uri})`,
                              )
                              .join("\n\n")
                          : ""
                    }
                    onSave={(val) => {
                      if (onUpdateEntry) {
                        const cleanedRefs = parseReferenceList(val);
                        onUpdateEntry({
                          ...activeEntry,
                          references: cleanedRefs,
                        });
                      }
                      setIsEditingReferences(false);
                    }}
                    onCancel={() => setIsEditingReferences(false)}
                    isEditing={isEditingReferences}
                    setIsEditing={setIsEditingReferences}
                    hideEditButton={true}
                    editorMode="source"
                    className="text-xs text-content-primary leading-relaxed border-none p-0 bg-transparent"
                    groundingSources={groundingSources}
                    minHeight="min-h-[100px]"
                  />
                </SectionCard>
              )
            )}

            <div className="text-center text-content-muted text-xs mt-12 pb-8">
              <p>
                {activeEntry.entryType === "raw"
                  ? `This note was recorded manually and has not been processed by ${BRAND.name} Intelligent Charting.`
                  : `Generated by ${BRAND.name} Intelligent Charting. Verify all information clinically.`}
              </p>
            </div>
          </div>

          {/* Clinical Source Note Bottom Panel - Restricted to workspace width */}
          {isNoteOpen && (
            <div
              className="sticky bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-default shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] animate-slide-up-fade"
              style={{ height: noteHeight }}
            >
              {/* Vertical Resize Handle */}
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-action-subtle/50 transition-colors z-50 group"
                onMouseDown={startResizingNote}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-neutral-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="max-w-5xl mx-auto flex flex-col h-full overflow-hidden">
                {/* Header with White Background */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-action uppercase tracking-widest">
                      Original Clinical Note
                    </span>
                  </div>
                  <button
                    onClick={() => setIsNoteOpen(false)}
                    className="text-content-muted hover:text-content-default p-1"
                  >
                    <Icons.Close className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <ClinicalMarkdown
                    content={
                      activeEntry.originalNote ||
                      "No original text available for this entry."
                    }
                    className="text-xs font-mono bg-canvas/30 p-4 rounded-lg border border-border-subtle"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals moved outside transformed container to fix viewport centering */}
        <GenerateRxModal
          isOpen={isRxOpen}
          onClose={() => setIsRxOpen(false)}
          planData={data.plan || []}
          existingMeds={medications || []}
          onUpsertMeds={(newMeds) => {
            if (onUpdateMedications) {
              onUpdateMedications([...newMeds, ...(medications || [])]);
              setSuccessMessage(
                `${newMeds.length} medication${newMeds.length !== 1 ? "s" : ""} synced to orders`,
              );
            }
          }}
        />

        {activeSuggestions && (
          <SmartAppendOverlay
            suggestions={activeSuggestions.texts}
            sectionTitle={activeSuggestions.sectionTitle}
            onCancel={() => setActiveSuggestions(null)}
            onIntegrate={handleIntegrateData}
          />
        )}

        {/* Mobile History Drawer Overlay */}
        {isMobileHistoryOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsMobileHistoryOpen(false)}
            ></div>
            {/* Panel */}
            <div className="relative w-80 max-w-[calc(100%-48px)] bg-surface shadow-2xl h-full flex flex-col animate-slide-right">
              <HistoryPanel {...historyPanelProps} />
            </div>
          </div>
        )}
      </div>

      {/* Entry Deletion Confirmation Modal - Placed outside main container */}
      <ConfirmationModal
        isOpen={!!entryIdToDelete}
        onClose={() => setEntryIdToDelete(null)}
        onConfirm={() => {
          if (entryIdToDelete) onDeleteEntry?.(entryIdToDelete);
        }}
        title="Delete chart entry?"
        message="Are you sure you want to permanently delete this chart entry? This action cannot be undone."
        confirmLabel="Delete Entry"
        variant="danger"
        icon={Icons.Trash}
      />

      <ConfirmationModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => {
          if (statusConfirm) {
            if (statusConfirm.action === "REACTIVATE") {
              if (onReactivateEncounter && activeEncounter) {
                onReactivateEncounter(activeEncounter.id);
                setSuccessMessage(
                  "Encounter reactivated successfully. You can now edit and resume charting.",
                );
              }
              setStatusConfirm(null);
            } else {
              handleUpdatePatientStatusAndToast(
                statusConfirm.action === "READMIT"
                  ? PatientStatus.ADMITTED
                  : PatientStatus.OUTPATIENT,
              );
            }
          }
        }}
        title={
          statusConfirm?.action === "REACTIVATE"
            ? "Reactivate Encounter?"
            : statusConfirm?.action === "READMIT"
              ? "Readmit Patient?"
              : "Start New Consult?"
        }
        message={
          statusConfirm?.action === "REACTIVATE"
            ? "Are you sure you want to reactivate this locked encounter? This will restore the patient's active status and allow you to make edits, add entries, or order medications."
            : statusConfirm?.action === "READMIT"
              ? "Are you sure you want to readmit this patient? This will create a new active admission encounter."
              : "Are you sure you want to start a new outpatient consult for this patient?"
        }
        confirmLabel={
          statusConfirm?.action === "REACTIVATE"
            ? "Reactivate"
            : statusConfirm?.action === "READMIT"
              ? "Readmit"
              : "Start Consult"
        }
        variant="info"
        icon={
          statusConfirm?.action === "REACTIVATE"
            ? Icons.Unlock
            : statusConfirm?.action === "READMIT"
              ? Icons.Plus
              : Icons.ClipboardList
        }
      />

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <PhotoGalleryModal
        isOpen={isPhotosOpen}
        onClose={() => setIsPhotosOpen(false)}
        photos={activeEntry.attachments || []}
        onAddPhotos={handleAddPhotos}
        onRemovePhoto={handleRemovePhoto}
        onAnalyzePhotos={handleAnalyzePhotos}
        isAnalyzing={isAnalyzingPhotos}
        onAnalyzeLabs={handleAnalyzeLabs}
        isAnalyzingLabs={isAnalyzingLabs}
        onAnalyzeImaging={handleAnalyzeImaging}
        isAnalyzingImaging={isAnalyzingImaging}
        initialTab={galleryTab}
      />
    </>
  );
};

export default SoapView;
