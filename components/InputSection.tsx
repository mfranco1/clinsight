
import React, { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { FileUpload, MedicalChartResponse, GeneralData, EncounterType } from '../types';
import { transcribeAudio } from '../services/geminiService';
import { SPECIALIZATIONS, MODELS } from '../config/appConfig';
import { CLINICAL_TEMPLATES } from '../config/clinicalTemplates';
import { Icons } from './ui/Icons';
import LookupModal from './LookupModal';
import CameraCaptureModal from './CameraCaptureModal';
import StickyToolbar from './ui/StickyToolbar';
import { ToolbarButton, ToolbarSeparator } from './ui/ToolbarSections';
import { FileDropZone } from './ui/FileUpload/FileDropZone';
import { FilePreviewBadge } from './ui/FileUpload/FilePreviewBadge';
import { openAttachment } from '../services/fileService';
import SuggestionsDrawer from './ui/SuggestionsDrawer';
import { safeStorage } from '../utils';

import EditableTextArea from './ui/EditableTextArea';

interface Draft {
  id: string;
  text: string;
  timestamp: number;
}

interface InputSectionProps {
  textInput: string;
  setTextInput: Dispatch<SetStateAction<string>>;
  files: FileUpload[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  onGenerate: (isConsult: boolean) => void;
  isGenerating: boolean;
  onReset: () => void;
  onImport: (data: MedicalChartResponse | MedicalChartResponse[]) => void;
  selectedModel: string;
  onModelSelect: (model: string) => void;
  selectedSpecialization: string;
  onSpecializationSelect: (specialty: string) => void;
  hasExistingData?: boolean;
  isAppendMode?: boolean;
  activePatient?: MedicalChartResponse | null;
  onCancelAppend?: () => void;
  onSaveRaw?: (isConsult: boolean) => void;
  isFirstEntryInEncounter?: boolean;
}

const MAX_DRAFTS = 10;
const DRAFTS_KEY = 'clinsight_drafts';
const ACTIVE_SESSION_KEY = 'clinsight_active_session';

const InputSection: React.FC<InputSectionProps> = ({
  textInput,
  setTextInput,
  files,
  onAddFiles,
  onRemoveFile,
  onGenerate,
  isGenerating,
  onReset,
  onImport,
  selectedModel,
  onModelSelect,
  selectedSpecialization,
  onSpecializationSelect,
  hasExistingData = false,
  isAppendMode = false,
  activePatient = null,
  onCancelAppend,
  onSaveRaw,
  isFirstEntryInEncounter = true
}) => {
  const [isConsult, setIsConsult] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // UI State
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const templatesDropdownRef = useRef<HTMLDivElement>(null);
  const templatesButtonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const updateDropdownPos = useCallback(() => {
    if (templatesButtonRef.current && showTemplates) {
      const rect = templatesButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [showTemplates]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (showTemplates && isMobile) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos, true);
      window.addEventListener('resize', updateDropdownPos);
      return () => {
        window.removeEventListener('scroll', updateDropdownPos, true);
        window.removeEventListener('resize', updateDropdownPos);
      };
    }
  }, [showTemplates, updateDropdownPos, isMobile]);

  // Sync isConsult with active encounter's type in append mode
  useEffect(() => {
    if (isAppendMode && activePatient) {
      const activeEnc = activePatient.encounters?.find(e => e.status === 'ACTIVE');
      setIsConsult(activeEnc?.type === EncounterType.CONSULT);
    }
  }, [isAppendMode, activePatient]);

  // Persistence: Initial Load & Auto-Recovery
  useEffect(() => {
    // 1. Load History
    const savedDrafts = safeStorage.getItem(DRAFTS_KEY);
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to load drafts", e);
      }
    }

    // 2. Auto-Recover Active Session if current state is empty
    const activeSession = safeStorage.getItem(ACTIVE_SESSION_KEY);
    if (activeSession && !textInput) {
      setTextInput(activeSession);
    }

    // Close dropdowns on outside click or scroll
    const handleScroll = () => {
      if (showTemplates) setShowTemplates(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Handle Drafts Dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDrafts(false);
      }
      
      // Handle Templates Dropdown - Aware of Portal
      const isInsideTrigger = templatesDropdownRef.current && templatesDropdownRef.current.contains(target);
      const isInsidePortal = portalRef.current && portalRef.current.contains(target);
      
      if (showTemplates && !isInsideTrigger && !isInsidePortal) {
        setShowTemplates(false);
      }
    };

    if (showTemplates) {
      window.addEventListener('scroll', handleScroll, true);
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTemplates, showDrafts, isMobile]);

  // Persistence: Autosave active session as the user types
  useEffect(() => {
    if (textInput) {
      const timer = setTimeout(() => {
        safeStorage.setItem(ACTIVE_SESSION_KEY, textInput);
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    } else {
      safeStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [textInput]);

  const saveToHistory = (text: string) => {
    if (!text || text.trim().length < 5) return;
    
    const newDraft: Draft = {
      id: Date.now().toString(),
      text: text,
      timestamp: Date.now()
    };
    
    const updatedDrafts = [newDraft, ...drafts.filter(d => d.text !== text)].slice(0, MAX_DRAFTS);
    setDrafts(updatedDrafts);
    safeStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  };

  const handleManualSave = () => {
    if (!textInput || textInput.trim().length < 5) return;
    saveToHistory(textInput);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };
  
  const handleResetConfirm = () => {
    saveToHistory(textInput);
    setIsResetModalOpen(false);
    safeStorage.removeItem(ACTIVE_SESSION_KEY);
    onReset();
  };

  const handleClearHistoryConfirm = () => {
    setDrafts([]);
    safeStorage.removeItem(DRAFTS_KEY);
    setIsClearHistoryModalOpen(false);
    setShowDrafts(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const transcription = await transcribeAudio(audioBlob);
      setTextInput((prev) => (prev ? `${prev}\n\n[TRANSCRIPTION]:\n${transcription}` : `[TRANSCRIPTION]:\n${transcription}`));
    } catch (error) {
      console.error("Transcription failed:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const applyTemplate = (content: string) => {
    if (textInput && textInput.trim().length > 5) {
      saveToHistory(textInput);
    }
    setTextInput(content);
    setShowTemplates(false);
  };

  const restoreDraft = (text: string) => {
    if (textInput && textInput.trim().length > 5 && textInput !== text) {
      saveToHistory(textInput);
    }
    setTextInput(text);
    setShowDrafts(false);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    const readAndParseFile = (file: File): Promise<MedicalChartResponse> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            if (json.entries && json.course && json.handoff) {
              resolve(json as MedicalChartResponse);
            } else {
              reject(new Error(`Invalid case format inside file: ${file.name}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse JSON inside file: ${file.name}`));
          }
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsText(file);
      });
    };

    const promises = Array.from(filesList).map(file => readAndParseFile(file));

    Promise.all(promises)
      .then((parsedCases) => {
        if (parsedCases.length === 1) {
          onImport(parsedCases[0]);
        } else {
          onImport(parsedCases);
        }
      })
      .catch((err) => {
        console.error("Error batch importing files:", err);
        alert(err.message || "An error occurred while batch uploading cases. Please ensure all uploaded files are valid patient JSON cases.");
      });

    e.target.value = '';
  };

  const getModelDisplayName = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    return model ? model.label : 'Model';
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
      
      {/* Workspace Context Header for Append Mode */}
      {isAppendMode && activePatient && (
        <div className="mb-8 animate-fade-in">
           <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {activePatient.patientInfo.patientName.charAt(0)}
                  </div>
                  <div>
                      <h2 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">Appending to Record</h2>
                      <div className="text-lg font-bold text-slate-900 leading-tight">
                        {activePatient.patientInfo.patientName}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        MRN: {activePatient.patientInfo.mrn} • {activePatient.patientInfo.ageSex}
                      </div>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={onCancelAppend}
                    className="px-4 py-2 bg-white border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-teal-100 transition-colors shadow-sm"
                  >
                    Back to Chart
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Sticky Workspace Toolbar Wrapper */}
      <StickyToolbar containerClassName="-mx-4 px-4 -mt-6 pt-6 pb-4 mb-2" showOverflow={true}>
        <div className="flex items-center justify-between px-2 py-2 min-h-[52px] relative w-full" ref={dropdownRef}>
          
          {/* Left Fixed Area - Keep trigger outside scroll for visible overflow */}
          <div className="relative z-20 flex-shrink-0">
            <ToolbarButton 
              onClick={() => setShowDrafts(!showDrafts)}
              icon={Icons.History}
              label="Drafts"
              variant={showDrafts ? 'active' : 'secondary'}
              showIndicator={drafts.length > 0}
              hideLabelOnMobile={true}
            />

            {showDrafts && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-2 animate-fade-in origin-top-left overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-50 mb-1 flex justify-between items-center bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session History</span>
                  <span className="text-[9px] font-medium text-slate-400 italic">Autosaved</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {drafts.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                          <Icons.History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <div className="text-xs text-slate-400 font-medium">No history found</div>
                      </div>
                  ) : (
                      drafts.map((d) => (
                      <button
                          key={d.id}
                          onClick={() => restoreDraft(d.text)}
                          className="w-full text-left px-4 py-3 hover:bg-teal-50 group transition-all border-b border-slate-50 last:border-none"
                      >
                          <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">{formatDate(d.timestamp)}</span>
                          <span className="text-[9px] text-slate-300 font-medium">{d.text.length} characters</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium group-hover:text-slate-700 italic">"{d.text.substring(0, 100)}..."</p>
                      </button>
                      ))
                  )}
                </div>
                {drafts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-50 px-4">
                    <button 
                      onClick={() => setIsClearHistoryModalOpen(true)}
                      className="w-full text-center py-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Middle/Right Section - Hidden scrollbar logic or basic auto */}
          <div className="flex-1 flex items-center justify-between overflow-x-auto custom-scrollbar ml-1 py-1">
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <ToolbarButton 
                  onClick={handleManualSave}
                  disabled={isGenerating || !textInput || textInput.trim().length < 5}
                  icon={isSaving ? Icons.Check : Icons.Save}
                  label={isSaving ? 'Saved' : 'Save Draft'}
                  variant={isSaving ? 'active' : 'secondary'}
                  hideLabelOnMobile={true}
                />

                <ToolbarButton 
                  onClick={() => setIsLookupOpen(true)}
                  icon={Icons.Search}
                  label="Lookup"
                  variant="secondary"
                  hideLabelOnMobile={true}
                />
                
                <ToolbarSeparator className="mx-1" />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {!isAppendMode && (
                  <>
                    <input 
                      ref={importInputRef}
                      type="file"
                      accept=".json"
                      multiple
                      className="hidden"
                      onChange={handleImportFileChange}
                    />
                    <ToolbarButton 
                      onClick={handleImportClick}
                      disabled={isGenerating}
                      icon={Icons.Upload}
                      label="Import Case"
                      variant="secondary"
                      hideLabelOnMobile={true}
                    />
                    
                    <ToolbarSeparator className="mx-1" />
                  </>
                )}

                <ToolbarButton 
                  onClick={() => setIsResetModalOpen(true)}
                  disabled={isGenerating}
                  icon={Icons.Refresh}
                  label="Reset Form"
                  variant="secondary"
                  hideLabelOnMobile={true}
                />
            </div>
          </div>
        </div>
      </StickyToolbar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-3 mb-4 sm:mb-2">
            <label htmlFor="clinical-notes" className="block text-sm font-semibold text-slate-700">
              {isAppendMode ? (isFirstEntryInEncounter ? (isConsult ? 'Consult Notes' : 'Admission Notes') : 'Progress Notes') : (isConsult ? 'Consult Notes' : 'Admission Notes')}
            </label>
            
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible no-scrollbar">
                <button
                    type="button"
                    onClick={() => setIsSuggestionsOpen(true)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${isSuggestionsOpen ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200'} border`}
                >
                    <Icons.Assistance className="w-3.5 h-3.5 mr-1.5" />
                    Suggestions
                </button>

                {/* Templates Dropdown Container */}
                <div className="relative" ref={templatesDropdownRef}>
                    <button
                        ref={templatesButtonRef}
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${showTemplates ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200'} border`}
                    >
                        <Icons.LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                        Templates
                    </button>
                    {showTemplates && (
                      isMobile ? createPortal(
                        <div 
                          ref={portalRef}
                          className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] py-1 animate-fade-in-up overflow-hidden max-h-[50vh] overflow-y-auto"
                          style={{
                            top: `${dropdownPos.top + 8}px`,
                            left: `${Math.max(16, Math.min(window.innerWidth - 208, dropdownPos.left))}px`,
                            width: '192px'
                          }}
                        >
                          {CLINICAL_TEMPLATES.map(t => (
                              <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => applyTemplate(t.content)}
                                  className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors border-b last:border-none border-slate-50 active:bg-teal-100"
                              >
                                  {t.label}
                              </button>
                          ))}
                        </div>,
                        document.body
                      ) : (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 animate-fade-in-up overflow-hidden">
                            {CLINICAL_TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => applyTemplate(t.content)}
                                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors border-b last:border-none border-slate-50"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                      )
                    )}
                </div>

                <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing || isGenerating}
                className={`
                    flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap
                    ${isRecording 
                    ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200'}
                    ${(isTranscribing || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                >
                {isRecording ? (
                    <>
                    <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                    Stop
                    </>
                ) : isTranscribing ? (
                    <>
                    <Icons.Loader className="mr-2 h-3 w-3 text-slate-500" />
                    Wait...
                    </>
                ) : (
                    <>
                    <Icons.Microphone className="w-4 h-4 mr-1.5" />
                    Dictate
                    </>
                )}
                </button>
            </div>
          </div>
          
          <EditableTextArea
            value={textInput}
            onSave={setTextInput}
            onChange={setTextInput}
            placeholder={isAppendMode ? "Document today's assessment, updated labs, or new symptoms..." : "Patient is a 56-year-old male presenting with... (Use 'Templates' above for structured input or click 'Dictate' to record)"}
            className="border-slate-300"
            showControls={false}
            isEditing={true}
            autoFocus={false}
            minHeight="min-h-[400px]"
          />
        </div>

        <div className="p-6 bg-white border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Attachments
          </label>
          
          <FileDropZone 
            onFilesSelected={onAddFiles}
            onCameraClick={() => setIsCameraOpen(true)}
            accept="image/*,.pdf,text/plain"
            className="mb-6"
          />

          {files.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {files.map((file, idx) => (
                <FilePreviewBadge 
                  key={idx}
                  file={file}
                  onRemove={() => onRemoveFile(idx)}
                  onOpen={() => openAttachment(file)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="px-6 py-6 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-y-6 lg:gap-6">
            
            {/* Configuration Group */}
            <div className="flex flex-col md:flex-row flex-wrap items-start md:items-end gap-4 sm:gap-x-8 sm:gap-y-4 w-full lg:flex-1">
              {/* Specialization Select */}
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Specialty</label>
                <div className="relative">
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => onSpecializationSelect(e.target.value)}
                    disabled={isGenerating}
                    className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-full py-[7px] px-3 shadow-sm outline-none transition-all hover:border-slate-300 disabled:opacity-50 appearance-none pr-10"
                  >
                    {SPECIALIZATIONS.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                    <Icons.ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Model Toggle */}
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Model</label>
                <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-fit">
                    {MODELS.map(m => (
                      <button
                          key={m.id}
                          type="button"
                          onClick={() => onModelSelect(m.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              selectedModel === m.id
                              ? 'bg-teal-100 text-teal-800 shadow-sm'
                              : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                          {m.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Type Toggle */}
              {!isAppendMode && (
                <div className="w-full sm:w-auto">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Type</label>
                  <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm w-fit">
                    <button
                        type="button"
                        onClick={() => setIsConsult(false)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            !isConsult
                            ? 'bg-teal-100 text-teal-800 shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Admission
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsConsult(true)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            isConsult
                            ? 'bg-teal-100 text-teal-800 shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Consult
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 lg:shrink-0">
              {onSaveRaw && (
                <button
                  onClick={() => onSaveRaw(isConsult)}
                  disabled={isGenerating || isTranscribing || !textInput}
                  className="w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-center px-5 py-2.5 border border-teal-200 text-sm font-bold rounded-xl shadow-sm text-teal-700 bg-white hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAppendMode ? (isFirstEntryInEncounter ? (isConsult ? 'Save Consult' : 'Save Admission') : 'Append Entry') : (isConsult ? 'Save Consult' : 'Save Admission')}
                </button>
              )}
              <button
                  onClick={() => onGenerate(isConsult)}
                  disabled={isGenerating || isTranscribing || (!textInput && files.length === 0)}
                  className={`
                  w-full sm:w-auto sm:min-w-[180px] inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white 
                  ${(isGenerating || isTranscribing || (!textInput && files.length === 0)) 
                    ? 'bg-teal-400 cursor-not-allowed opacity-70' 
                    : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 active:scale-[0.98]'}
                  transition-all duration-200
                  `}
              >
                  {isGenerating ? (
                  <>
                      <Icons.Loader className="mr-2 h-4 w-4 text-white" />
                      {isAppendMode ? 'Analyzing Entry' : `Analyzing (${getModelDisplayName(selectedModel)})`}
                  </>
                  ) : (
                  <>{isAppendMode ? (isFirstEntryInEncounter ? (isConsult ? 'Generate Consult' : 'Generate Admission') : 'Generate Entry') : (isConsult ? 'Generate Consult' : 'Generate Admission')}</>
                  )}
              </button>
            </div>

          </div>
        </div>
      </div>

      </div>

      <SuggestionsDrawer 
        isOpen={isSuggestionsOpen} 
        onClose={() => setIsSuggestionsOpen(false)} 
        notesData={textInput} 
      />

      <LookupModal isOpen={isLookupOpen} onClose={() => setIsLookupOpen(false)} />
      
      <CameraCaptureModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(file) => onAddFiles([file])} 
      />

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 transform scale-100 transition-all">
            <div className="flex items-center mb-4 text-red-600">
               <Icons.Alert className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">Clear current data?</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              This will clear the editor. A copy of your notes will be saved to <strong>Drafts</strong> for recovery if needed.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsResetModalOpen(false)} 
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleResetConfirm} 
                className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 shadow-sm transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Clear History Confirmation Modal */}
      {isClearHistoryModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 transform scale-100 transition-all">
            <div className="flex items-center mb-4 text-red-600">
               <Icons.Trash className="w-6 h-6 mr-2" />
               <h3 className="text-lg font-bold">Clear history?</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              This will permanently delete all saved drafts from your local history. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsClearHistoryModalOpen(false)} 
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearHistoryConfirm} 
                className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 shadow-sm transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InputSection;
