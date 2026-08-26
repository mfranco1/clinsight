import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SoapNote, GroundingSource, GeneralData, ChartEntry, PhotoCategory, PatientOrder, MedicationOrder, Encounter, PatientStatus, EncounterType } from '../types';
import { Icons } from './ui/Icons';
import Toast from './Toast';
import SubjectiveSection from './soap/SubjectiveSection';
import ObjectiveSection from './soap/ObjectiveSection';
import AssessmentSection from './soap/AssessmentSection';
import PlanSection from './soap/PlanSection';
import SectionCard from './soap/SectionCard';
import GenerateRxModal from './ui/modals/GenerateRxModal';
import HomeInstructionsModal from './ui/modals/HomeInstructionsModal';
import PhotoGalleryModal from './ui/modals/PhotoGalleryModal';
import ConfirmationModal from './ui/modals/ConfirmationModal';
import DateRangeFields from './ui/DateRangeFields';
import SmartAppendOverlay from './soap/SmartAppendOverlay';
import ManageSectionsDropdown, { SectionVisibility } from './soap/ManageSectionsDropdown';
import EditableTextArea from './ui/EditableTextArea';
import { formatLinks } from './soap/utils';
import { safeStorage, arrayToMarkdownBullets, keyValueToString, stringToKeyValue } from '../utils';
import { integrateClinicalData, analyzeClinicalPhotos, analyzeLabPhotos, analyzeImagingPhotos } from '../services/geminiService';
import { SPECIALIZATIONS } from '../config/appConfig';
import StickyToolbar from './ui/StickyToolbar';
import { ToolbarButton, ToolbarPagination, ToolbarSeparator } from './ui/ToolbarSections';

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
  }
};

const isPopulated = (val: string | undefined): boolean => {
  if (!val) return false;
  const cleaned = val.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
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

const computeInitialVisibility = (soap: SoapNote | undefined): SectionVisibility => {
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
    }
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
  selectedModel?: string;
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
  typeFilter: 'All' | 'Admission' | 'Progress';
  setTypeFilter: (val: 'All' | 'Admission' | 'Progress') => void;
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
  const encounter = encounters?.find(e => e.id === entry.encounterId);
  if (encounter?.type === EncounterType.CONSULT) {
     return entry.title.replace("Progress Note", "Consult Note").replace("Admission Note", "Consult Note");
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
    const rawIds = Array.from(new Set(paginatedHistory.map(e => e.encounterId || 'unknown')));
    return rawIds.sort((a, b) => {
      const encA = encounters?.find(e => e.id === a);
      const encB = encounters?.find(e => e.id === b);
      if (encA && encB) return new Date(encB.startDate).getTime() - new Date(encA.startDate).getTime();
      return 0;
    });
  }, [paginatedHistory, encounters]);

  return (
  <div className="w-full h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
         <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chart History</h3>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">{filteredHistory.length} total entries</span>
            </div>
            <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => newerEntry && onSelectEntry(newerEntry.id)}
                  disabled={!newerEntry}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Newer Entry"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => olderEntry && onSelectEntry(olderEntry.id)}
                  disabled={!olderEntry}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Older Entry"
                >
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 rounded transition-colors relative ${showFilters ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:bg-slate-200'}`}
                  title="Filter History"
                >
                  <Icons.Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && !showFilters && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full border border-white"></span>
                  )}
                </button>
                {/* Mobile Close Button */}
                <button 
                  onClick={() => setIsMobileHistoryOpen(false)}
                  className="lg:hidden p-1 rounded text-slate-400 hover:bg-slate-200 ml-1"
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
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-medium"
              />
              <Icons.Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
            
            {totalHistoryPages > 1 && (
              <ToolbarPagination 
                currentPage={historyCurrentPage}
                totalPages={totalHistoryPages}
                onPageChange={setHistoryCurrentPage}
                showPageSelector={false}
                className="bg-white border border-slate-200 rounded-lg py-1 px-1.5"
              />
            )}
         </div>

         {showFilters && (
           <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-inner space-y-4 animate-fade-in max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Filters</span>
                 <button 
                   onClick={clearAllFilters}
                   className="text-[9px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider"
                 >
                   Clear All
                 </button>
              </div>

              <div>
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Entry Type</label>
                 <div className="flex gap-1">
                    {['All', 'Admission', 'Progress'].map(t => (
                      <button 
                        key={t} 
                        onClick={() => setTypeFilter(t as any)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${typeFilter === t ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
              </div>

              <div>
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Specialization</label>
                 <div className="relative mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !selectedSpecs.includes(val)) {
                          setSelectedSpecs([...selectedSpecs, val]);
                        }
                        e.target.value = ""; 
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 focus:ring-1 focus:ring-teal-500 outline-none transition-all appearance-none pr-8 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Select specialization...</option>
                      {SPECIALIZATIONS.filter(s => !selectedSpecs.includes(s)).map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                      <Icons.ChevronDown className="w-3 h-3" />
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-1">
                    {selectedSpecs.map(spec => (
                      <span
                        key={spec}
                        className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold rounded bg-teal-50 border border-teal-200 text-teal-700 shadow-sm animate-fade-in"
                      >
                        {spec}
                        <button 
                          onClick={() => setSelectedSpecs(selectedSpecs.filter(s => s !== spec))}
                          className="ml-1.5 text-teal-400 hover:text-teal-600 transition-colors"
                        >
                          <Icons.Close className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                 </div>
                 {selectedSpecs.length > 0 && (
                   <button 
                      onClick={() => setSelectedSpecs([])}
                      className="mt-2 text-[8px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest block transition-colors"
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

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-slate-50/30">
         {paginatedHistory.length === 0 ? (
           <div className="text-center py-10 text-slate-400">
              <Icons.FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">No entries found</p>
           </div>
         ) : (
           sortedEncounterIds.map(encounterId => {
             const encounterEntries = paginatedHistory.filter(e => (e.encounterId || 'unknown') === encounterId);
             const encounter = encounters?.find(e => e.id === encounterId);
             const isCollapsed = collapsedEncounters.has(encounterId);
             const typeLabel = encounter 
               ? (encounter.type === 'ADMISSION' ? 'Admission' : 'Consult') 
               : (encounterId === 'unknown' ? 'Legacy Encounter' : 'Unknown Encounter');
             const dateLabel = encounter 
               ? new Date(encounter.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
               : '';
             
             return (
               <div key={encounterId} className="space-y-1.5 relative">
                 <div 
                    className="flex items-center gap-2 px-1 py-1 group cursor-pointer hover:bg-slate-100/50 rounded-lg transition-colors"
                    onClick={() => toggleEncounter(encounterId)}
                 >
                   {encounter && (
                     <div className={`p-1 rounded bg-white border ${encounter.type === 'ADMISSION' ? 'text-teal-600 border-teal-100' : 'text-slate-600 border-slate-200'}`}>
                       {encounter.type === 'ADMISSION' ? <Icons.Plus className="w-3 h-3" /> : <Icons.ClipboardList className="w-3 h-3" />}
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{typeLabel} {dateLabel}</h4>
                        {encounter?.status === 'COMPLETED' && (
                          <span className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1 py-0.25 rounded-full uppercase border border-slate-200">Historical</span>
                        )}
                      </div>
                   </div>
                   <Icons.ChevronDown className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                 </div>
                 
                 {!isCollapsed && (
                   <div className="space-y-2 animate-slide-down-fade">
                     {encounterEntries.map((entry) => (
                       <div 
                        key={entry.id}
                        onClick={() => { onSelectEntry(entry.id); setIsMobileHistoryOpen(false); }}
                        className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden cursor-pointer ${activeEntryId === entry.id ? 'bg-teal-50 border-teal-200 shadow-sm ring-1 ring-teal-500/10' : 'bg-white border-transparent hover:bg-slate-100/50 hover:border-slate-200'}`}
                       >
                          <div className="flex items-center justify-between mb-1.5">
                             <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-bold uppercase tracking-tight ${activeEntryId === entry.id ? 'text-teal-600' : 'text-slate-400'}`}>{entry.date}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                {entry.specialization && entry.specialization !== 'General Practice' && (
                                    <span className="text-[8px] font-bold bg-teal-100 text-teal-700 px-1 py-0.5 rounded uppercase">{entry.specialization}</span>
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEntryIdToDelete(entry.id); }}
                                    className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-transparent transition-all"
                                    title="Delete entry"
                                >
                                    <Icons.Trash className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                          <div className={`text-xs font-bold truncate pr-4 ${activeEntryId === entry.id ? 'text-teal-900' : 'text-slate-700'}`}>
                            {getDisplayEntryTitle(entry, encounters)}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium italic">
                            {entry.entryType === 'raw' ? (entry.rawText || (encounters?.find(enc => enc.id === (entry.encounterId || 'unknown'))?.type === EncounterType.CONSULT ? 'Manual Consult Note' : (entry.title.includes('Admission') ? 'Manual Admission Note' : 'Manual Progress Note'))) : entry.soap?.assessment.summary}
                          </p>
                          
                          {activeEntryId === entry.id && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
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
  selectedModel,
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
  onReactivateEncounter
}) => {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotosOpen, setIsPhotosOpen] = useState(false);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<{ texts: string[], sectionTitle: string } | null>(null);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [isAnalyzingLabs, setIsAnalyzingLabs] = useState(false);
  const [isAnalyzingImaging, setIsAnalyzingImaging] = useState(false);
  const [galleryTab, setGalleryTab] = useState<PhotoCategory>('Physical Exam');
  const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{action: 'READMIT' | 'CONSULT' | 'REACTIVATE'} | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingReferences, setIsEditingReferences] = useState(false);
  const [collapsedEncounters, setCollapsedEncounters] = useState<Set<string>>(() => {
    const historical = encounters?.filter(e => e.status !== 'ACTIVE').map(e => e.id) || [];
    const set = new Set(historical);
    // Also collapse legacy encounters by default
    set.add('unknown');
    return set;
  });

  const toggleEncounter = (id: string) => {
    setCollapsedEncounters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdatePatientStatusAndToast = (status: PatientStatus) => {
    if (onUpdatePatientStatus) {
      onUpdatePatientStatus(status);
      const message = status === PatientStatus.ADMITTED ? 'Patient readmitted successfully' : 'New consult started successfully';
      setSuccessMessage(message);
    }
    setStatusConfirm(null);
  };
  
  const [entryVisibilities, setEntryVisibilities] = useState<Record<string, SectionVisibility>>(() => {
    const saved = safeStorage.getItem('clinsight_entry_visibilities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load entry visibilities", e);
      }
    }
    return {};
  });

  const data = activeEntry.soap || {} as SoapNote;
  
  const currentVisibility = (() => {
    const saved = entryVisibilities[activeEntry.id];
    const initial = computeInitialVisibility(data);
    if (!saved) return initial;
    
    // Merge: prioritize saved user choices, but fall back to calculated defaults for missing keys
    return {
      subjective: { ...initial.subjective, ...saved.subjective },
      objective: { ...initial.objective, ...saved.objective }
    };
  })();

  const menuRef = useRef<HTMLDivElement>(null);
  const manageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    safeStorage.setItem('clinsight_entry_visibilities', JSON.stringify(entryVisibilities));
  }, [entryVisibilities]);

  // Note Panel Resizing State
  const [noteHeight, setNoteHeight] = useState(300);
  const [isResizingNote, setIsResizingNote] = useState(false);

  // History Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Admission' | 'Progress'>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  
  // Pagination State for History
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  
  // Resizing Logic for Clinical Note
  const startResizingNote = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingNote(true);
  }, []);

  const stopResizingNote = useCallback(() => {
    setIsResizingNote(false);
  }, []);

  const resizeNote = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizingNote) {
      const newHeight = window.innerHeight - mouseMoveEvent.clientY;
      // Constraints: Min 150px, Max 80% of window
      if (newHeight > 150 && newHeight < window.innerHeight * 0.8) {
        setNoteHeight(newHeight);
      }
    }
  }, [isResizingNote]);

  useEffect(() => {
    if (isResizingNote) {
      window.addEventListener("mousemove", resizeNote);
      window.addEventListener("mouseup", stopResizingNote);
    } else {
      window.removeEventListener("mousemove", resizeNote);
      window.removeEventListener("mouseup", stopResizingNote);
    }
    return () => {
      window.removeEventListener("mousemove", resizeNote);
      window.removeEventListener("mouseup", stopResizingNote);
    };
  }, [isResizingNote, resizeNote, stopResizingNote]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (manageRef.current && !manageRef.current.contains(event.target as Node)) {
        setIsManageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      // Search
      const matchesSearch = !searchQuery || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.entryType === 'raw' ? (entry.rawText || '') : (entry.soap?.assessment.summary || '')).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type
      const matchesType = typeFilter === 'All' || 
        (typeFilter === 'Admission' && entry.title.includes('Admission')) ||
        (typeFilter === 'Progress' && entry.title.includes('Progress'));

      // Date Range (Inclusive)
      let matchesDate = true;
      if (startDate || endDate) {
        const entryTime = new Date(entry.date).setHours(0, 0, 0, 0);
        if (startDate) {
          const startTime = new Date(startDate).setHours(0, 0, 0, 0);
          if (entryTime < startTime) matchesDate = false;
        }
        if (endDate) {
          const endTime = new Date(endDate).setHours(0, 0, 0, 0);
          if (entryTime > endTime) matchesDate = false;
        }
      }

      // Specialization
      const matchesSpec = selectedSpecs.length === 0 || 
        (entry.specialization && selectedSpecs.includes(entry.specialization));

      return matchesSearch && matchesType && matchesDate && matchesSpec;
    });
  }, [history, searchQuery, typeFilter, startDate, endDate, selectedSpecs]);

  // Paginated History
  const totalHistoryPages = Math.ceil(filteredHistory.length / historyItemsPerPage);
  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(
      (historyCurrentPage - 1) * historyItemsPerPage,
      historyCurrentPage * historyItemsPerPage
    );
  }, [filteredHistory, historyCurrentPage, historyItemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [searchQuery, typeFilter, startDate, endDate, selectedSpecs]);

  // Jump to the correct page when the active entry changes
  useEffect(() => {
    const index = filteredHistory.findIndex(e => e.id === activeEntry.id);
    if (index !== -1) {
      const page = Math.floor(index / historyItemsPerPage) + 1;
      setHistoryCurrentPage(page);
    }
  }, [activeEntry.id, filteredHistory, historyItemsPerPage]);

  // Sequential Navigation
  const activeIndex = history.findIndex(e => e.id === activeEntry.id);
  const newerEntry = activeIndex > 0 ? history[activeIndex - 1] : null;
  const olderEntry = activeIndex < history.length - 1 ? history[activeIndex + 1] : null;
  const totalEntries = history.length;

  const activeEncounter = useMemo(() => {
    return encounters?.find(e => e.id === activeEntry.encounterId);
  }, [encounters, activeEntry.encounterId]);

  const isHistorical = activeEncounter?.status === 'COMPLETED' || patientStatus === PatientStatus.DISCHARGED;

  const formatForClipboard = (note: SoapNote, info: GeneralData, entry: ChartEntry) => {
    let text = `PATIENT CHART RECORD\n`;
    text += `Entry: ${entry.title} (${entry.date})\n\n`;
    
    text += `GENERAL DATA\n`;
    text += `Name: ${info.patientName}\n`;
    text += `Age/Sex: ${info.ageSex}\n`;
    text += `Case No: ${info.mrn}\n`;
    text += `DOB: ${info.dob}\n`;
    text += `Admission: ${info.admissionDate}\n`;
    text += `Address: ${info.address}\n`;
    text += `Religion: ${info.religion}\n`;
    text += `Handedness: ${info.handedness}\n\n`;
    
    if (entry.entryType === 'raw') {
      text += `MANUAL PROGRESS NOTE\n`;
      text += `${entry.rawText || entry.originalNote || 'No content available.'}\n\n`;
      
      if (!entry.soap?.assessment) {
        return text.replace(/\*\*/g, '');
      }
    } else {
      text += `CLINICAL NOTE (SOAP)\n`;
      if (note.subjective.chiefComplaint) text += `Chief Complaint:\n${note.subjective.chiefComplaint}\n\n`;
      text += `History of Present Illness:\n${note.subjective.hpi}\n\n`;
      text += `Review of Systems:\n${keyValueToString(note.subjective.ros)}\n\n`;
      text += `Past Medical & Surgical History:\n${note.subjective.pmh}\n\n`;
      text += `Medications & Allergies:\n${note.subjective.meds}\n\n`;
      text += `Family Medical History:\n${note.subjective.family}\n\n`;
      if (note.subjective.birthMaternal) text += `Birth & Maternal History:\n${note.subjective.birthMaternal}\n\n`;
      if (note.subjective.immunizations) text += `Immunization History:\n${note.subjective.immunizations}\n\n`;
      if (note.subjective.nutrition) text += `Nutritional History:\n${note.subjective.nutrition}\n\n`;
      if (note.subjective.developmental) text += `Developmental History:\n${note.subjective.developmental}\n\n`;
      text += `Personal & Social History:\n${note.subjective.social}\n\n`;
      if (note.subjective.sexualHistory) {
        const isFemale = info.ageSex.toLowerCase().includes('f');
        text += `${isFemale ? 'Sexual & OBGYN History' : 'Sexual History'}:\n${note.subjective.sexualHistory}\n\n`;
      }
      if (note.subjective.anamnesis) text += `Anamnesis:\n${note.subjective.anamnesis}\n\n`;
      if (note.subjective.headsss) text += `HEADSSS Assessment:\n${keyValueToString(note.subjective.headsss)}\n\n`;

      text += `OBJECTIVE\n`;
      text += `Vitals:\n${note.objective.vitals}\n\n`;
      if (note.objective.anthropometrics) text += `Anthropometrics:\n${note.objective.anthropometrics}\n\n`;
      text += `Physical Examination:\n${keyValueToString(note.objective.physicalExam)}\n\n`;
      text += `Labs:\n${note.objective.labs}\n\n`;
      text += `Imaging:\n${note.objective.imaging}\n\n`;
    }

    if (note.assessment) {
      text += `ASSESSMENT\n`;
      text += `${note.assessment.summary}\n\n`;
    }

    if (note.plan) {
      text += `PLAN\n`;
      note.plan.forEach(item => {
        text += `${item.problem}\n`;
        item.actions.forEach(action => text += `- ${action}\n`);
        text += `\n`;
      });
    }

    return text.replace(/\*\*/g, '');
  };

  const handleCopy = () => {
    const text = formatForClipboard(data, patientInfo, activeEntry);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPhotos = (newPhotos: any[]) => {
    if (onUpdateEntry) {
      onUpdateEntry({
        ...activeEntry,
        attachments: [...(activeEntry.attachments || []), ...newPhotos]
      });
    }
  };

  const openGallery = (tab: PhotoCategory = 'Physical Exam') => {
    setGalleryTab(tab);
    setIsPhotosOpen(true);
  };

  const handleRemovePhoto = (index: number) => {
    if (onUpdateEntry && activeEntry.attachments) {
      const newAttachments = [...activeEntry.attachments];
      newAttachments.splice(index, 1);
      onUpdateEntry({
        ...activeEntry,
        attachments: newAttachments
      });
    }
  };

  const handleAnalyzePhotos = async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0) return;
    
    setIsAnalyzingPhotos(true);
    try {
      const files = activeEntry.attachments.map(a => a.file);
      const currentPE = keyValueToString(activeEntry.soap?.objective.physicalExam);
      const updatedPE = await analyzeClinicalPhotos(files, currentPE, selectedModel);
      
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: {
            ...activeEntry.soap.objective,
            physicalExam: stringToKeyValue(updatedPE)
          }
        });
      }
    } catch (error) {
      console.error("Failed to analyze photos:", error);
      alert("Failed to analyze clinical photos. Please try again.");
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  const handleAnalyzeLabs = async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0) return;
    
    // Filter only laboratory photos
    const labPhotos = activeEntry.attachments.filter(a => a.category === 'Laboratory');
    if (labPhotos.length === 0) {
      alert("No laboratory photos found to analyze.");
      return;
    }

    setIsAnalyzingLabs(true);
    try {
      const files = labPhotos.map(a => a.file);
      const currentLabs = activeEntry.soap?.objective.labs || "";
      const currentInterpretation = arrayToMarkdownBullets(activeEntry.soap?.objective.labInterpretation);
      
      const { labs, labInterpretation } = await analyzeLabPhotos(files, currentLabs, currentInterpretation, selectedModel);
      
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: {
            ...activeEntry.soap.objective,
            labs: labs,
            labInterpretation: labInterpretation
          }
        });
      }
    } catch (error) {
      console.error("Failed to analyze labs:", error);
      alert("Failed to analyze laboratory photos. Please try again.");
    } finally {
      setIsAnalyzingLabs(false);
    }
  };

  const handleAnalyzeImaging = async () => {
    if (!activeEntry.attachments || activeEntry.attachments.length === 0) return;
    
    // Filter only imaging photos
    const imagingPhotos = activeEntry.attachments.filter(a => a.category === 'Imaging');
    if (imagingPhotos.length === 0) {
      alert("No imaging photos found to analyze.");
      return;
    }

    setIsAnalyzingImaging(true);
    try {
      const files = imagingPhotos.map(a => a.file);
      const currentImaging = activeEntry.soap?.objective.imaging || "";
      const currentCorrelation = arrayToMarkdownBullets(activeEntry.soap?.objective.imagingCorrelation);
      
      const { imaging, imagingCorrelation } = await analyzeImagingPhotos(files, currentImaging, currentCorrelation, selectedModel);
      
      if (onUpdate && activeEntry.soap) {
        onUpdate({
          ...activeEntry.soap,
          objective: {
            ...activeEntry.soap.objective,
            imaging: imaging,
            imagingCorrelation: imagingCorrelation
          }
        });
      }
    } catch (error) {
      console.error("Failed to analyze imaging:", error);
      alert("Failed to analyze imaging photos. Please try again.");
    } finally {
      setIsAnalyzingImaging(false);
    }
  };

  const handleAddressSuggestions = (suggestions: string[], sectionTitle: string) => {
    setActiveSuggestions({ texts: suggestions, sectionTitle });
  };

  const handleIntegrateData = async (userInput: string) => {
    if (!activeSuggestions || !onUpdate) return;
    
    const { sectionTitle, texts: suggestions } = activeSuggestions;
    
    let fieldToUpdate: string = sectionTitle === 'Subjective' ? 'hpi' : 'physicalExam';
    
    if (suggestions.length === 1) {
        const lowerSugg = suggestions[0].toLowerCase();
        if (sectionTitle === 'Subjective') {
            if (lowerSugg.includes('medication') || lowerSugg.includes('allergic')) fieldToUpdate = 'meds';
            else if (lowerSugg.includes('family')) fieldToUpdate = 'family';
            else if (lowerSugg.includes('social') || lowerSugg.includes('smoke') || lowerSugg.includes('alcohol')) fieldToUpdate = 'social';
            else if (lowerSugg.includes('past medical') || lowerSugg.includes('history of')) fieldToUpdate = 'pmh';
        } else {
            if (lowerSugg.includes('lab') || lowerSugg.includes('test')) fieldToUpdate = 'labs';
            else if (lowerSugg.includes('imaging') || lowerSugg.includes('x-ray') || lowerSugg.includes('ct')) fieldToUpdate = 'imaging';
        }
    }

    const currentContent = (data as any)[sectionTitle.toLowerCase()][fieldToUpdate] || "";

    try {
        const revisedContent = await integrateClinicalData(fieldToUpdate.toUpperCase(), currentContent, suggestions, userInput, selectedModel);
        
        const currentAssistance = data[sectionTitle.toLowerCase() as 'subjective' | 'objective'].clinicalAssistance || [];
        const revisedAssistance = (Array.isArray(currentAssistance) ? currentAssistance : [])
            .filter(item => !suggestions.some(s => item.includes(s) || s.includes(item)));

        const updatedSection = {
            ...data[sectionTitle.toLowerCase() as 'subjective' | 'objective'],
            [fieldToUpdate]: revisedContent,
            clinicalAssistance: revisedAssistance
        };

        onUpdate({
            ...data,
            [sectionTitle.toLowerCase()]: updatedSection
        });
        
        setActiveSuggestions(null);
    } catch (err) {
        console.error(err);
        alert("Failed to integrate information. Please try again.");
    }
  };

  const handleDeleteConfirm = () => {
    if (entryIdToDelete && onDeleteEntry) {
      onDeleteEntry(entryIdToDelete);
    }
    setEntryIdToDelete(null);
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const clearAllFilters = () => {
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setSelectedSpecs([]);
    setSearchQuery('');
    setHistoryCurrentPage(1);
  };

  const activeFilterCount = (typeFilter !== 'All' ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0) + selectedSpecs.length;

  const hasReferences = (references && references.length > 0) || (groundingSources && groundingSources.length > 0);

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
      <div className="flex h-full relative overflow-hidden">
      
      {/* Chart History Timeline (Desktop Aside) */}
      <aside 
        className={`bg-white hidden lg:flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative border-r ${isHistoryCollapsed ? 'w-0 border-transparent' : 'w-80 border-slate-200'}`}
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
          <div className={`absolute inset-y-0 right-1 w-[2px] transition-colors duration-300 ${isHistoryCollapsed ? 'bg-slate-200/50' : 'bg-transparent'} group-hover/history-stripe:bg-teal-500/50`} />
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-white border border-slate-200 rounded-full p-1 text-slate-400 
            shadow-sm transition-all duration-300 transform
            opacity-0 group-hover/history-stripe:opacity-100 
            ${isHistoryCollapsed ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}
          `}>
            <Icons.ChevronLeft className="w-3 h-3" />
          </div>
        </div>
      </aside>

      {/* Main Chart Workspace Wrapper */}
      <div 
        key={activeEntry.id} 
        id="soap-view-scroll-container"
        className="flex-1 overflow-y-auto bg-slate-50/30 animate-slide-up-fade relative flex flex-col main-scroll-container"
      >
        {isHistoryCollapsed && (
            <button 
                onClick={() => setIsHistoryCollapsed(false)}
                className="absolute left-4 top-4 z-40 bg-white border border-slate-200 rounded-xl p-2.5 text-teal-600 shadow-lg hover:bg-teal-50 transition-all hover:scale-105 group animate-fade-in hidden lg:flex items-center"
                title="Open Chart History"
            >
                <Icons.History className="w-5 h-5 mr-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
            </button>
        )}

        <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
          {patientStatus === PatientStatus.DISCHARGED && (
             <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                   <div className="bg-teal-100 p-2 rounded-lg shrink-0">
                     <Icons.Alert className="text-teal-600 w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-teal-900">Patient Discharged</h4>
                     <p className="text-xs text-teal-800 mt-0.5">Start a new encounter, or reactivate this one to resume charting</p>
                   </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                   <button onClick={() => setStatusConfirm({ action: 'CONSULT' })} className="flex-1 sm:flex-none text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white border border-teal-600 px-4 py-2 rounded-lg transition-colors text-center shadow-sm">New Consult</button>
                   <button onClick={() => setStatusConfirm({ action: 'READMIT' })} className="flex-1 sm:flex-none text-xs font-bold bg-white border border-teal-300 hover:bg-teal-100 text-teal-800 px-4 py-2 rounded-lg transition-colors text-center shadow-sm">Readmit</button>
                   {activeEncounter?.status === 'COMPLETED' && onReactivateEncounter && (
                     <button 
                       onClick={() => setStatusConfirm({ action: 'REACTIVATE' })} 
                       className="flex-1 sm:flex-none text-xs font-bold bg-white border border-teal-300 hover:bg-teal-100 text-teal-800 px-4 py-2 rounded-lg transition-colors text-center shadow-sm"
                     >
                       Reactivate
                     </button>
                   )}
                </div>
             </div>
          )}

          <StickyToolbar containerClassName="-mx-4 px-4 -mt-6 pt-6 pb-4 mb-4" showOverflow={true}>
            <div className="flex items-center justify-between px-2 py-2 min-h-[52px] relative w-full">
              
              {/* Scrollable Container for buttons without dropdowns */}
              <div className="flex-1 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5 mr-2">
                  
                  {isHistorical && (
                    <div className="flex items-center gap-2 shrink-0">
                      {onReactivateEncounter && activeEncounter && (
                        <button 
                          onClick={() => setStatusConfirm({ action: 'REACTIVATE' })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 active:bg-teal-200 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
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
                          className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter whitespace-nowrap min-w-[50px] text-center hover:bg-white hover:text-teal-600 rounded transition-colors"
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
                    variant={isNoteOpen ? 'active' : 'secondary'}
                    hideLabelOnMobile={true}
                  />

                  <ToolbarButton 
                    onClick={handleCopy}
                    icon={copied ? Icons.Check : Icons.Copy}
                    label={copied ? 'Copied' : 'Copy Entry'}
                    variant={copied ? 'success' : 'secondary'}
                    hideLabelOnMobile={true}
                  />

                  {!isHistorical && onReassess && activeEntry.entryType !== 'raw' && (
                    <ToolbarButton 
                      onClick={onReassess}
                      disabled={isReassessing}
                      icon={isReassessing ? Icons.Loader : Icons.Refresh}
                      label={isReassessing ? 'Wait...' : 'Reassess'}
                      variant={isReassessing ? 'active' : 'secondary'}
                      hideLabelOnMobile={true}
                    />
                  )}

                  {!isHistorical && onAssess && activeEntry.entryType === 'raw' && (
                    <ToolbarButton 
                      onClick={onAssess}
                      disabled={isReassessing}
                      icon={isReassessing ? Icons.Loader : Icons.Brain}
                      label={isReassessing ? 'Assessing...' : 'Assess'}
                      variant={isReassessing ? 'active' : 'secondary'}
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
                        variant={isManageOpen ? 'active' : 'secondary'}
                        hideLabelOnMobile={true}
                      />
                      {isManageOpen && (
                        <ManageSectionsDropdown 
                          visibility={currentVisibility}
                          onChange={(newVisibility) => {
                            setEntryVisibilities(prev => ({
                              ...prev,
                              [activeEntry.id]: newVisibility
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
                        variant={isMenuOpen ? 'active' : 'secondary'}
                        className="w-9 h-9 p-0 flex items-center justify-center"
                      />
                      {isMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-2 animate-fade-in origin-top-right overflow-hidden">
                              <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center">
                                  Clinical Abstract
                              </button>
                              <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center">
                                  Discharge Summary
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center">
                                  <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center"><Icons.Print /></span>
                                  Print View
                              </button>
                          </div>
                      )}
                  </div>
              </div>
            </div>
          </StickyToolbar>

          {/* Note Metadata Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
             <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${activeEntry.id === history[0]?.id ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                   {activeEntry.id === history[0]?.id ? 'Latest Entry' : 'Historical Entry'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   {activeEntry.date}
                </span>
                {activeEntry.specialization && activeEntry.specialization !== 'General Practice' && (
                  <>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                       {activeEntry.specialization}
                    </span>
                  </>
                )}
             </div>
             
             <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:border-teal-300 transition-colors group/clinician">
                  <span className="bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-400 border-r border-slate-200 group-hover/clinician:bg-teal-50 group-hover/clinician:text-teal-600 transition-colors uppercase tracking-widest">
                    Clinician
                  </span>
                  <span className="px-2.5 py-1 text-[10px] text-slate-600 font-bold">
                    M. Franco, MD
                  </span>
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {getDisplayEntryTitle(activeEntry, encounters)}
                </div>
             </div>
          </div>

          {activeEntry.entryType === 'raw' ? (
            <SectionCard 
              title="CLINICAL NOTE" 
              icon={<Icons.Clipboard className="w-5 h-5" />}
              className="group"
              headerActions={
                !isEditingRaw && !isHistorical && (
                  <button 
                    onClick={() => setIsEditingRaw(true)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                      originalNote: v
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
                disabled={isHistorical}
              />
            </SectionCard>
          ) : (
            <>
              <SubjectiveSection 
                data={data.subjective} 
                patientInfo={patientInfo}
                groundingSources={groundingSources}
                onUpdate={!isHistorical && onUpdate ? (newData) => onUpdate({ ...data, subjective: newData }) : undefined} 
                onAddressSuggestions={handleAddressSuggestions}
                visibleSubsections={currentVisibility.subjective}
              />

              <ObjectiveSection 
                data={data.objective} 
                groundingSources={groundingSources}
                onUpdate={!isHistorical && onUpdate ? (newData) => onUpdate({ ...data, objective: newData }) : undefined} 
                onAddressSuggestions={handleAddressSuggestions}
                onOpenGallery={openGallery}
                visibleSubsections={currentVisibility.objective}
                headerActions={
                  <button 
                    onClick={(e) => { e.stopPropagation(); openGallery('Physical Exam'); }}
                    className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center bg-teal-50 px-3 py-1.5 rounded-md border border-teal-100 hover:border-teal-200 transition-colors shadow-sm"
                    title="View Clinical Photos"
                  >
                    Media Gallery
                  </button>
                }
              />
            </>
          )}

          {(activeEntry.entryType !== 'raw' || data.assessment || isReassessing) && (
            <>
              {isReassessing ? (
                <SectionCard title="Assessment" icon={<Icons.Assessment />}>
                  <div className="animate-pulse space-y-4 py-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </SectionCard>
              ) : data.assessment && (
                <AssessmentSection 
                  data={data.assessment} 
                  groundingSources={groundingSources}
                  onUpdate={!isHistorical && onUpdate ? (newData) => onUpdate({ ...data, assessment: newData }) : undefined} 
                />
              )}

              {isReassessing ? (
                <SectionCard title="Plan" icon={<Icons.Plan />}>
                  <div className="animate-pulse space-y-6 py-2">
                    <div className="space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </SectionCard>
              ) : data.plan && (
                <PlanSection 
                  planData={data.plan} 
                  generalData={patientInfo}
                  groundingSources={groundingSources}
                  onUpdate={!isHistorical && onUpdate ? (newPlan) => onUpdate({ ...data, plan: newPlan }) : undefined}
                  onUpdateBroaderManagement={!isHistorical && onUpdate ? (newBM) => onUpdate({ ...data, broaderManagement: newBM }) : undefined}
                  fullSoapNote={data} 
                  onOpenRx={() => setIsRxOpen(true)}
                  onOpenInstructions={() => setIsInstructionsOpen(true)}
                  orders={orders}
                  onAddOrder={onAddOrder}
                  readOnly={isHistorical}
                />
              )}
            </>
          )}

          {isReassessing ? (
            <SectionCard 
              title="References" 
              icon={<Icons.Book />}
            >
              <div className="animate-pulse space-y-4 py-2">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 bg-slate-200 rounded mt-0.5"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 bg-slate-200 rounded mt-0.5"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : hasReferences && (
            <SectionCard 
              title="References" 
              collapsible={true} 
              defaultExpanded={false}
              icon={<Icons.Book className="w-5 h-5" />}
              headerActions={
                !isEditingReferences && onUpdateEntry && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditingReferences(true); }} 
                    className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center transition-opacity opacity-0 group-hover/card:opacity-100 focus:opacity-100" 
                    title="Edit References"
                  >
                    <span className="mr-1"><Icons.Edit /></span> Edit
                  </button>
                )
              }
            >
              <EditableTextArea 
                value={
                  references && references.length > 0 
                    ? references.map((ref, idx) => `[${idx + 1}] ${ref}`).join('\n\n')
                    : (groundingSources && groundingSources.length > 0
                        ? groundingSources.map((source, idx) => `[${idx + 1}] [${source.title}](${source.uri})`).join('\n\n')
                        : '')
                }
                onSave={(val) => {
                  if (onUpdateEntry) {
                    const cleanedRefs = val.split('\n')
                      .map(r => r.trim())
                      .filter(r => r !== '')
                      .map(r => {
                        return r.replace(/^(\[\d+\]|\d+\.|\*|-)\s*/, '');
                      });
                    onUpdateEntry({
                      ...activeEntry,
                      references: cleanedRefs
                    });
                  }
                  setIsEditingReferences(false);
                }}
                onCancel={() => setIsEditingReferences(false)}
                isEditing={isEditingReferences}
                setIsEditing={setIsEditingReferences}
                hideEditButton={true}
                className="text-xs text-slate-700 leading-relaxed border-none p-0 bg-transparent"
                groundingSources={groundingSources}
                minHeight="min-h-[100px]"
              />
            </SectionCard>
          )}

          <div className="text-center text-slate-400 text-xs mt-12 pb-8">
            <p>
              {activeEntry.entryType === 'raw' 
                ? "This note was recorded manually and has not been processed by Clinsight Intelligent Charting."
                : "Generated by Clinsight Intelligent Charting. Verify all information clinically."}
            </p>
          </div>
        </div>

        {/* Clinical Source Note Bottom Panel - Restricted to workspace width */}
        {isNoteOpen && (
          <div 
            className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] animate-slide-up-fade"
            style={{ height: noteHeight }}
          >
            {/* Vertical Resize Handle */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-teal-500/50 transition-colors z-50 group"
              onMouseDown={startResizingNote}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            <div className="max-w-5xl mx-auto flex flex-col h-full overflow-hidden">
              {/* Header with White Background */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Original Clinical Note</span>
                </div>
                <button onClick={() => setIsNoteOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <Icons.Close className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50/30 p-4 rounded-lg border border-slate-100">
                  {activeEntry.originalNote || "No original text available for this entry."}
                </div>
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
            setSuccessMessage(`${newMeds.length} medication${newMeds.length !== 1 ? 's' : ''} synced to orders`);
          }
        }}
      />

      <HomeInstructionsModal 
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        soapData={data}
        patientInfo={patientInfo}
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileHistoryOpen(false)}
          ></div>
          {/* Panel */}
          <div className="relative w-80 max-w-[calc(100%-48px)] bg-white shadow-2xl h-full flex flex-col animate-slide-right">
            <HistoryPanel {...historyPanelProps} />
          </div>
        </div>
      )}

      </div>

      {/* Entry Deletion Confirmation Modal - Placed outside main container */}
      <ConfirmationModal
        isOpen={!!entryIdToDelete}
        onClose={() => setEntryIdToDelete(null)}
        onConfirm={() => onDeleteEntry(entryIdToDelete!)}
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
            if (statusConfirm.action === 'REACTIVATE') {
              if (onReactivateEncounter && activeEncounter) {
                onReactivateEncounter(activeEncounter.id);
                setSuccessMessage('Encounter reactivated successfully. You can now edit and resume charting.');
              }
              setStatusConfirm(null);
            } else {
              handleUpdatePatientStatusAndToast(
                statusConfirm.action === 'READMIT' ? PatientStatus.ADMITTED : PatientStatus.OUTPATIENT
              );
            }
          }
        }}
        title={
          statusConfirm?.action === 'REACTIVATE'
            ? 'Reactivate Encounter?'
            : statusConfirm?.action === 'READMIT'
              ? 'Readmit Patient?'
              : 'Start New Consult?'
        }
        message={
          statusConfirm?.action === 'REACTIVATE'
            ? 'Are you sure you want to reactivate this locked encounter? This will restore the patient\'s active status and allow you to make edits, add entries, or order medications.'
            : statusConfirm?.action === 'READMIT' 
              ? 'Are you sure you want to readmit this patient? This will create a new active admission encounter.'
              : 'Are you sure you want to start a new outpatient consult for this patient?'
        }
        confirmLabel={
          statusConfirm?.action === 'REACTIVATE'
            ? 'Reactivate'
            : statusConfirm?.action === 'READMIT'
              ? 'Readmit'
              : 'Start Consult'
        }
        variant="info"
        icon={
          statusConfirm?.action === 'REACTIVATE'
            ? Icons.Unlock
            : statusConfirm?.action === 'READMIT'
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
