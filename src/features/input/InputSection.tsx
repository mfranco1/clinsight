import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import {
  FileUpload,
  MedicalChartResponse,
  GeneralData,
  EncounterType,
} from "../../types";
import { transcribeAudio } from "../../services/ai/actions";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { SPECIALIZATIONS } from "../../config/appConfig";
import { CLINICAL_TEMPLATES } from "./templates";
import { Icons } from "../../components/ui/Icons";
import LookupModal from "./components/LookupModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import ConfirmationModal from "../../components/dialogs/ConfirmationModal";
import StickyToolbar from "../../components/ui/StickyToolbar";
import { ErrorState } from "../../components/ui/LoadingFeedback";
import {
  ToolbarButton,
  ToolbarSeparator,
} from "../../components/ui/ToolbarSections";
import { FileDropZone } from "../../components/ui/FileUpload/FileDropZone";
import { FilePreviewBadge } from "../../components/ui/FileUpload/FilePreviewBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/Popover";
import { openAttachment } from "../../services/fileService";
import SuggestionsDrawer from "./components/SuggestionsDrawer";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useInputDrafts } from "./useInputDrafts";
import {
  getPatientCaseImportErrorMessage,
  parsePatientCaseFiles,
} from "./importCases";

import EditableTextArea from "../../components/ui/EditableTextArea";

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
  selectedSpecialization: string;
  onSpecializationSelect: (specialty: string) => void;
  hasExistingData?: boolean;
  isAppendMode?: boolean;
  activePatient?: MedicalChartResponse | null;
  onCancelAppend?: () => void;
  onSaveRaw?: (isConsult: boolean) => void;
  isFirstEntryInEncounter?: boolean;
}

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
  selectedSpecialization,
  onSpecializationSelect,
  hasExistingData = false,
  isAppendMode = false,
  activePatient = null,
  onCancelAppend,
  onSaveRaw,
  isFirstEntryInEncounter = true,
}) => {
  const {
    drafts,
    saveToHistory,
    clearHistory,
    clearActiveSession,
    persistenceError,
  } = useInputDrafts(textInput, setTextInput);
  const [isConsult, setIsConsult] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioReady: (audioBlob) => handleTranscribe(audioBlob),
    onError: () => {
      logDiagnostic("error", "Input microphone access failed.");
      setError("Could not access microphone.");
    },
  });

  // UI State
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  // Sync isConsult with active encounter's type in append mode
  useEffect(() => {
    if (isAppendMode && activePatient) {
      const activeEnc = activePatient.encounters?.find(
        (e) => e.status === "ACTIVE",
      );
      setIsConsult(activeEnc?.type === EncounterType.CONSULT);
    }
  }, [isAppendMode, activePatient]);

  const handleManualSave = () => {
    if (!textInput || textInput.trim().length < 5) return;
    saveToHistory(textInput);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const handleResetConfirm = () => {
    saveToHistory(textInput);
    setIsResetModalOpen(false);
    clearActiveSession();
    onReset();
  };

  const handleClearHistoryConfirm = () => {
    clearHistory();
    setIsClearHistoryModalOpen(false);
    setShowDrafts(false);
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const transcription = await transcribeAudio(audioBlob);
      setTextInput((prev) =>
        prev
          ? `${prev}\n\n[TRANSCRIPTION]:\n${transcription}`
          : `[TRANSCRIPTION]:\n${transcription}`,
      );
    } catch (error) {
      logDiagnostic("error", "Input transcription failed.");
      setError("Could not transcribe audio. Please try recording again.");
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

    parsePatientCaseFiles(filesList)
      .then((parsedCases) => {
        if (parsedCases.length === 1) {
          onImport(parsedCases[0]);
        } else {
          onImport(parsedCases);
        }
      })
      .catch((err) => {
        logDiagnostic("error", "Batch case import failed.");
        setError(getPatientCaseImportErrorMessage(err));
      });

    e.target.value = "";
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
        {error && (
          <ErrorState
            variant="inline"
            message={error}
            inlineAction={
              <button
                type="button"
                className="underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            }
            className="mb-4 font-medium"
          />
        )}
        {persistenceError && (
          <ErrorState
            variant="inline"
            message={persistenceError}
            className="mb-4 font-medium"
          />
        )}

        {/* Workspace Context Header for Append Mode */}
        {isAppendMode && activePatient && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-action-subtle border border-action-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-action text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {activePatient.patientInfo.patientName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-[10px] font-bold text-action uppercase tracking-widest mb-0.5">
                    Appending to Record
                  </h2>
                  <div className="text-lg font-bold text-content-strong leading-tight">
                    {activePatient.patientInfo.patientName}
                  </div>
                  <div className="text-xs text-content-secondary font-medium mt-1">
                    MRN: {activePatient.patientInfo.mrn} •{" "}
                    {activePatient.patientInfo.ageSex}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancelAppend}
                  className="px-4 py-2 bg-surface border border-action-border text-action-hover text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-action-100 transition-colors shadow-sm"
                >
                  Back to Chart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Workspace Toolbar Wrapper */}
        <StickyToolbar
          containerClassName="-mx-4 px-4 -mt-6 pt-6 pb-4 mb-2"
          showOverflow={true}
        >
          <div className="flex items-center justify-between px-2 py-2 min-h-[52px] relative w-full">
            {/* Left Fixed Area - Keep trigger outside scroll for visible overflow */}
            <div className="relative z-20 flex-shrink-0">
              <Popover open={showDrafts} onOpenChange={setShowDrafts}>
                <PopoverTrigger asChild>
                  <ToolbarButton
                    icon={Icons.History}
                    label="Drafts"
                    variant={showDrafts ? "active" : "secondary"}
                    showIndicator={drafts.length > 0}
                    hideLabelOnMobile={true}
                  />
                </PopoverTrigger>
                <PopoverContent
                  aria-label="Input drafts"
                  align="start"
                  className="w-72 rounded-xl py-2 animate-fade-in origin-top-left"
                >
                  <div className="px-4 py-2 border-b border-neutral-50 mb-1 flex justify-between items-center bg-canvas/50">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                      Session History
                    </span>
                    <span className="text-[9px] font-medium text-content-muted italic">
                      Autosaved
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {drafts.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <Icons.History className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                        <div className="text-xs text-content-muted font-medium">
                          No history found
                        </div>
                      </div>
                    ) : (
                      drafts.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => restoreDraft(d.text)}
                          className="w-full text-left px-4 py-3 hover:bg-action-subtle group transition-all border-b border-neutral-50 last:border-none"
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-action uppercase bg-action-subtle px-1.5 py-0.5 rounded border border-action-100 group-hover:bg-action group-hover:text-white transition-colors">
                              {formatDate(d.timestamp)}
                            </span>
                            <span className="text-[9px] text-neutral-300 font-medium">
                              {d.text.length} characters
                            </span>
                          </div>
                          <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed font-medium group-hover:text-content-primary italic">
                            "{d.text.substring(0, 100)}..."
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  {drafts.length > 0 && (
                    <div className="mt-2 border-t border-neutral-50 px-4 pt-2">
                      <button
                        onClick={() => setIsClearHistoryModalOpen(true)}
                        className="w-full text-center py-1.5 text-[10px] font-bold text-content-muted hover:text-danger-500 uppercase tracking-widest transition-colors"
                      >
                        Clear History
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Scrollable Middle/Right Section - Hidden scrollbar logic or basic auto */}
            <div className="flex-1 flex items-center justify-between overflow-x-auto custom-scrollbar ml-1 py-1">
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <ToolbarButton
                  onClick={handleManualSave}
                  disabled={
                    isGenerating || !textInput || textInput.trim().length < 5
                  }
                  icon={isSaving ? Icons.Check : Icons.Save}
                  label={isSaving ? "Saved" : "Save Draft"}
                  variant={isSaving ? "active" : "secondary"}
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

        <div className="bg-surface rounded-xl shadow-sm border border-border-default overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-3 mb-4 sm:mb-2">
              <label
                htmlFor="clinical-notes"
                className="block text-sm font-semibold text-content-primary"
              >
                {isAppendMode
                  ? isFirstEntryInEncounter
                    ? isConsult
                      ? "Consult Notes"
                      : "Admission Notes"
                    : "Progress Notes"
                  : isConsult
                    ? "Consult Notes"
                    : "Admission Notes"}
              </label>

              <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible no-scrollbar">
                <button
                  type="button"
                  onClick={() => setIsSuggestionsOpen(true)}
                  className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${isSuggestionsOpen ? "bg-action-100 text-action-hover border-action-border" : "bg-surface-muted text-content-default hover:bg-action-subtle hover:text-action-hover border border-transparent hover:border-action-border"} border`}
                >
                  <Icons.Assistance className="w-3.5 h-3.5 mr-1.5" />
                  Suggestions
                </button>

                {/* Templates Dropdown Container */}
                <Popover open={showTemplates} onOpenChange={setShowTemplates}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${showTemplates ? "bg-action-100 text-action-hover border-action-border" : "bg-surface-muted text-content-default hover:bg-action-subtle hover:text-action-hover border border-transparent hover:border-action-border"} border`}
                    >
                      <Icons.LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                      Templates
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    aria-label="Input templates"
                    align="end"
                    className="w-48 rounded-lg p-0 py-1 animate-fade-in-up"
                  >
                    {CLINICAL_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.content)}
                        className="w-full border-b border-neutral-50 px-4 py-3 text-left text-xs font-medium text-content-primary transition-colors last:border-none hover:bg-action-subtle hover:text-action-hover active:bg-action-100 sm:py-2.5"
                      >
                        {t.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isGenerating}
                  className={`
                    flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap
                    ${
                      isRecording
                        ? "bg-danger-100 text-danger-700 animate-pulse border border-danger-200"
                        : "bg-surface-muted text-content-default hover:bg-action-subtle hover:text-action-hover border border-transparent hover:border-action-border"
                    }
                    ${isTranscribing || isGenerating ? "opacity-50 cursor-not-allowed" : ""}
                `}
                >
                  {isRecording ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-danger-600 mr-2"></span>
                      Stop
                    </>
                  ) : isTranscribing ? (
                    <>
                      <Icons.Loader className="mr-2 h-3 w-3 text-content-secondary" />
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
              key={`${activePatient?.id ?? "new-patient"}:${isAppendMode}`}
              value={textInput}
              onSave={setTextInput}
              onChange={setTextInput}
              placeholder={
                isAppendMode
                  ? "Document today's assessment, updated labs, or new symptoms..."
                  : "Patient is a 56-year-old male presenting with... (Use 'Templates' above for structured input or click 'Dictate' to record)"
              }
              className="border-neutral-300"
              showControls={false}
              isEditing={true}
              autoFocus={false}
              editorMode="source"
              minHeight="min-h-[400px]"
            />
          </div>

          <div className="p-6 bg-surface border-b border-border-subtle">
            <label className="block text-sm font-semibold text-content-primary mb-2">
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
          <div className="px-6 py-6 bg-canvas border-t border-border-subtle">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-y-6 lg:gap-6">
              {/* Configuration Group */}
              <div className="flex flex-col md:flex-row flex-wrap items-start md:items-end gap-4 sm:gap-x-8 sm:gap-y-4 w-full lg:flex-1">
                {/* Specialization Select */}
                <div className="w-full sm:w-48">
                  <label className="block text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1.5 ml-1">
                    Specialty
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => onSpecializationSelect(e.target.value)}
                      disabled={isGenerating}
                      className="bg-surface border border-border-default text-content-primary text-sm font-medium rounded-lg focus:ring-2 focus:ring-focus-ring focus:border-action block w-full py-[7px] px-3 shadow-sm outline-none transition-all hover:border-neutral-300 disabled:opacity-50 appearance-none pr-10"
                    >
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-content-muted">
                      <Icons.ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Type Toggle */}
                {!isAppendMode && (
                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1.5 ml-1">
                      Type
                    </label>
                    <div className="flex items-center bg-surface rounded-lg p-1 border border-border-default shadow-sm w-fit">
                      <button
                        type="button"
                        onClick={() => setIsConsult(false)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          !isConsult
                            ? "bg-action-100 text-action-800 shadow-sm"
                            : "text-content-secondary hover:bg-canvas"
                        }`}
                      >
                        Admission
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConsult(true)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          isConsult
                            ? "bg-action-100 text-action-800 shadow-sm"
                            : "text-content-secondary hover:bg-canvas"
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
                    className="w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-center px-5 py-2.5 border border-action-border text-sm font-bold rounded-xl shadow-sm text-action-hover bg-surface hover:bg-action-subtle focus:outline-none focus:ring-4 focus:ring-action-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAppendMode
                      ? isFirstEntryInEncounter
                        ? isConsult
                          ? "Save Consult"
                          : "Save Admission"
                        : "Append Entry"
                      : isConsult
                        ? "Save Consult"
                        : "Save Admission"}
                  </button>
                )}
                <button
                  onClick={() => onGenerate(isConsult)}
                  disabled={
                    isGenerating ||
                    isTranscribing ||
                    (!textInput && files.length === 0)
                  }
                  className={`
                  w-full sm:w-auto sm:min-w-[180px] inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white 
                  ${
                    isGenerating ||
                    isTranscribing ||
                    (!textInput && files.length === 0)
                      ? "bg-action-400 cursor-not-allowed opacity-70"
                      : "bg-action hover:bg-action-hover focus:outline-none focus:ring-4 focus:ring-action-200 active:scale-[0.98]"
                  }
                  transition-all duration-200
                  `}
                >
                  {isGenerating ? (
                    <>
                      <Icons.Loader className="mr-2 h-4 w-4 text-white" />
                      {isAppendMode ? "Analyzing Entry" : "Analyzing"}
                    </>
                  ) : (
                    <>
                      {isAppendMode
                        ? isFirstEntryInEncounter
                          ? isConsult
                            ? "Generate Consult"
                            : "Generate Admission"
                          : "Generate Entry"
                        : isConsult
                          ? "Generate Consult"
                          : "Generate Admission"}
                    </>
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

      <LookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => onAddFiles([file])}
      />

      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Clear current data?"
        message={
          <>
            This will clear the editor. A copy of your notes will be saved to{" "}
            <strong>Drafts</strong> for recovery if needed.
          </>
        }
        confirmLabel="Confirm Reset"
        icon={Icons.Alert}
        closeOnInteractOutside={false}
        closeOnEscape={false}
      />

      <ConfirmationModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        onConfirm={handleClearHistoryConfirm}
        title="Clear history?"
        message="This will permanently delete all saved drafts from your local history. This action cannot be undone."
        confirmLabel="Clear All"
        icon={Icons.Trash}
        closeOnInteractOutside={false}
        closeOnEscape={false}
      />
    </>
  );
};

export default InputSection;
