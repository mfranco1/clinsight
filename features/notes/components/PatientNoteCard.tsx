import React, { useState, useEffect, useRef } from "react";
import {
  PatientNote,
  FileUpload,
  SubNote,
  MedicalChartResponse,
  GroundingSource,
} from "../../../types";
import { Icons } from "../../../components/ui/Icons";
import EditableTextArea from "../../../components/ui/EditableTextArea";
import ClinicalMarkdown from "../../../components/ui/ClinicalMarkdown";
import {
  createFileUploads,
  openAttachment,
} from "../../../services/fileService";
import { FilePreviewBadge } from "../../../components/ui/FileUpload/FilePreviewBadge";
import { transcribeAudio } from "../../../services/ai/actions";
import { useAudioRecorder } from "../../../hooks/useAudioRecorder";
import { useFileDrop } from "../../../hooks/useFileDrop";
import { logDiagnostic } from "../../../services/diagnosticLogger";
import { createId } from "../../../utils/ids";
import { ClinicalChatInput } from "../../../components/ui/ClinicalChatInput";
import ConfirmationModal from "../../../components/ui/modals/ConfirmationModal";
import "katex/dist/katex.min.css";

import { highlightQuery } from "../../../components/soap/utils";
import { pairThreadSubNotes } from "../threadPairs";
import { sendThreadInquiry } from "../sendThreadInquiry";
import NoteContentArea from "./NoteContentArea";

interface ThreadPairCardProps {
  userSub: SubNote | undefined;
  assistantSub: SubNote | undefined;
  combinedId: string;
  isCollapsed: boolean;
  onToggleCollapse: (combinedId: string) => void;
  onDeleteSubNotePair: (userSubId?: string, assistantSubId?: string) => void;
  onDeleteSubNoteAttachment: (subNoteId: string, fileIdx: number) => void;
  openAttachment: (file: FileUpload) => void;
  editingSubNoteId: string | null;
  setEditingSubNoteId: (id: string | null) => void;
  handleUpdateSubNoteContent: (subNoteId: string, newContent: string) => void;
  handleCopySubNote: (content: string, subNoteId: string) => void;
  copiedSubNoteId: string | null;
  isThreadLoading: boolean;
  idx: number;
  totalLength: number;
  formatDisplayDate: (dateStr: string) => string;
}

const ThreadPairCard = React.memo<ThreadPairCardProps>(
  ({
    userSub,
    assistantSub,
    combinedId,
    isCollapsed,
    onToggleCollapse,
    onDeleteSubNotePair,
    onDeleteSubNoteAttachment,
    openAttachment,
    editingSubNoteId,
    setEditingSubNoteId,
    handleUpdateSubNoteContent,
    handleCopySubNote,
    copiedSubNoteId,
    isThreadLoading,
    idx,
    totalLength,
    formatDisplayDate,
  }) => {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all overflow-hidden flex flex-col">
        {/* Clinician Inquiry Segment */}
        {userSub && (
          <div className="bg-slate-50/20 border-b border-dashed border-slate-100 flex flex-col">
            {/* Clinician Inquiry Header (Clickable for Collapse/Expand) */}
            <div
              onClick={() => onToggleCollapse(combinedId)}
              className="p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/30 transition-colors select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icons.ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${!isCollapsed ? "rotate-90" : ""}`}
                />
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-[9px] uppercase tracking-wider shrink-0">
                  <Icons.General className="w-2.5 h-2.5 text-slate-500" />
                  Clinician Inquiry
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase shrink-0">
                  {formatDisplayDate(userSub.createdAt)}
                </span>
                {isCollapsed && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[250px] md:max-w-[350px] font-normal italic ml-1">
                    — {userSub.content}
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() =>
                    onDeleteSubNotePair(userSub.id, assistantSub?.id)
                  }
                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-transparent rounded-lg transition-all"
                  title="Delete query thread"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clinician Inquiry Content (Shown only if Expanded) */}
            {!isCollapsed && (
              <div className="px-4 pb-4 flex flex-col">
                {userSub.highlightedText && (
                  <div className="mb-2.5 p-2 bg-slate-50 border-l-2 border-teal-500 rounded-r-lg text-xs text-slate-500 italic max-w-full">
                    Discussing excerpt: "{userSub.highlightedText}"
                  </div>
                )}

                {userSub.attachments && userSub.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {userSub.attachments.map((file, fIdx) => (
                      <FilePreviewBadge
                        key={fIdx}
                        file={file}
                        onRemove={() =>
                          onDeleteSubNoteAttachment(userSub.id, fIdx)
                        }
                        onOpen={() => openAttachment(file)}
                      />
                    ))}
                  </div>
                )}

                <div className="prose max-w-none text-slate-700 text-xs">
                  <ClinicalMarkdown
                    content={userSub.content}
                    groundingSources={userSub.groundingSources}
                    showReferences={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clinical Assistant Segment */}
        {(!isCollapsed || !userSub) && (
          <div className="bg-gradient-to-br from-white to-teal-50/10 flex flex-col">
            {assistantSub ? (
              <>
                {/* If userSub is present, we show the response header inside the expanded content */}
                {userSub ? (
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 font-bold rounded-lg text-[9px] uppercase tracking-wider">
                        <Icons.Brain className="w-2.5 h-2.5 text-teal-600" />
                        Clinical Assistant
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                        {formatDisplayDate(assistantSub.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubNoteId(
                            editingSubNoteId === assistantSub.id
                              ? null
                              : assistantSub.id,
                          );
                        }}
                        className={`p-1 rounded-lg transition-all ${
                          editingSubNoteId === assistantSub.id
                            ? "text-teal-600"
                            : "text-slate-300 hover:text-teal-600 hover:bg-transparent"
                        }`}
                        title="Edit clinical assistant response"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySubNote(
                            assistantSub.content,
                            assistantSub.id,
                          )
                        }
                        className="p-1 text-slate-300 hover:text-teal-600 hover:bg-transparent rounded-lg transition-all"
                        title="Copy clinical assistant response"
                      >
                        {copiedSubNoteId === assistantSub.id ? (
                          <Icons.Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Icons.Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* If userSub does NOT exist, then this Assistant response is the root collapsible. We render the Collapsible Header */
                  <div
                    onClick={() => onToggleCollapse(combinedId)}
                    className="p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/30 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icons.ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${!isCollapsed ? "rotate-90" : ""}`}
                      />
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 font-bold rounded-lg text-[9px] uppercase tracking-wider shrink-0">
                        <Icons.Brain className="w-2.5 h-2.5 text-teal-600" />
                        Clinical Assistant
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase shrink-0">
                        {formatDisplayDate(assistantSub.createdAt)}
                      </span>
                      {isCollapsed && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[250px] md:max-w-[350px] font-normal italic ml-1">
                          — {assistantSub.content}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubNoteId(
                            editingSubNoteId === assistantSub.id
                              ? null
                              : assistantSub.id,
                          );
                          if (
                            editingSubNoteId !== assistantSub.id &&
                            isCollapsed
                          ) {
                            onToggleCollapse(combinedId);
                          }
                        }}
                        className={`p-1 rounded-lg transition-all ${
                          editingSubNoteId === assistantSub.id
                            ? "text-teal-600"
                            : "text-slate-300 hover:text-teal-600 hover:bg-transparent"
                        }`}
                        title="Edit clinical assistant response"
                      >
                        <Icons.Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySubNote(
                            assistantSub.content,
                            assistantSub.id,
                          )
                        }
                        className="p-1 text-slate-300 hover:text-teal-600 hover:bg-transparent rounded-lg transition-all"
                        title="Copy clinical assistant response"
                      >
                        {copiedSubNoteId === assistantSub.id ? (
                          <Icons.Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Icons.Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteSubNotePair(undefined, assistantSub.id)
                        }
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-transparent rounded-lg transition-all"
                        title="Delete model response"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Response Content (Shown only if Expanded) */}
                {!isCollapsed && (
                  <div className="px-4 pb-4">
                    <EditableTextArea
                      value={assistantSub.content}
                      onSave={(newValue) =>
                        handleUpdateSubNoteContent(assistantSub.id, newValue)
                      }
                      isEditing={editingSubNoteId === assistantSub.id}
                      setIsEditing={(editing) => {
                        setEditingSubNoteId(editing ? assistantSub.id : null);
                        if (editing && isCollapsed) {
                          onToggleCollapse(combinedId);
                        }
                      }}
                      groundingSources={assistantSub.groundingSources}
                      showReferences={true}
                      hideEditButton={true}
                      className="text-xs text-slate-700"
                    />
                  </div>
                )}
              </>
            ) : isThreadLoading && idx === totalLength - 1 ? (
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-50/60 text-slate-400 font-bold rounded-lg text-[9px] uppercase tracking-wider animate-pulse">
                    <Icons.Brain className="w-2.5 h-2.5 text-teal-500 animate-spin" />
                    Consulting patient logs...
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="h-2 bg-slate-100 rounded animate-pulse w-3/4"></div>
                  <div className="h-2 bg-slate-100 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  },
);

interface PatientNoteCardProps {
  note: PatientNote;
  onUpdate: (updatedNote: PatientNote) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
  searchQuery?: string;
  chartContext?: MedicalChartResponse | null;
}

const PatientNoteCard: React.FC<PatientNoteCardProps> = ({
  note,
  onUpdate,
  onDelete,
  isNew = false,
  searchQuery,
  chartContext,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [isCollapsed, setIsCollapsed] = useState(
    !isNew && note.content.length > 300,
  );
  const [editTitle, setEditTitle] = useState(note.title || "");
  const [editAttachments, setEditAttachments] = useState<FileUpload[]>(
    note.attachments || [],
  );

  // Custom thread state
  const [threadInput, setThreadInput] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [floatingInput, setFloatingInput] = useState("");
  const [threadFiles, setThreadFiles] = useState<FileUpload[]>([]);
  const [floatingFiles, setFloatingFiles] = useState<FileUpload[]>([]);
  const [isThreadExpanded, setIsThreadExpanded] = useState(true);
  const [isConfirmingDeleteSubNote, setIsConfirmingDeleteSubNote] =
    useState(false);
  const [subNoteDeleteIds, setSubNoteDeleteIds] = useState<{
    userSubId?: string;
    assistantSubId?: string;
  } | null>(null);
  const [copiedSubNoteId, setCopiedSubNoteId] = useState<string | null>(null);
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<
    Record<string, boolean>
  >({});
  const [editingSubNoteId, setEditingSubNoteId] = useState<string | null>(null);

  // Voice states for clinical question threads
  const [isThreadTranscribing, setIsThreadTranscribing] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const threadRecorder = useAudioRecorder({
    enabled: !isEditing,
    onAudioReady: async (audioBlob) => {
      setIsThreadTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        if (transcription)
          setThreadInput((prev) =>
            prev ? `${prev} ${transcription}` : transcription,
          );
      } catch (error) {
        logDiagnostic("error", "Note transcription failed.");
      } finally {
        setIsThreadTranscribing(false);
      }
    },
    onError: () => {
      logDiagnostic("error", "Note microphone access failed.");
      setMicrophoneError("Could not access microphone.");
    },
  });

  // Voice states for deep-dive active highlights
  const [isFloatingTranscribing, setIsFloatingTranscribing] = useState(false);
  const floatingRecorder = useAudioRecorder({
    enabled: Boolean(floatingPosition && selectedText),
    onAudioReady: async (audioBlob) => {
      setIsFloatingTranscribing(true);
      try {
        const transcription = await transcribeAudio(audioBlob);
        if (transcription)
          setFloatingInput((prev) =>
            prev ? `${prev} ${transcription}` : transcription,
          );
      } catch (error) {
        logDiagnostic("error", "Note transcription failed.");
      } finally {
        setIsFloatingTranscribing(false);
      }
    },
    onError: () => {
      logDiagnostic("error", "Note microphone access failed.");
      setMicrophoneError("Could not access microphone.");
    },
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const floatingPopoverRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadScrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToThreadBottom = () => {
    setIsThreadExpanded(true);
    setTimeout(() => {
      threadEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const handleThreadScroll = () => {
    if (
      selectedText &&
      savedRangeRef.current &&
      cardRef.current &&
      threadScrollContainerRef.current
    ) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const rangeRect = savedRangeRef.current.getBoundingClientRect();
      const threadRect =
        threadScrollContainerRef.current.getBoundingClientRect();

      // If the highlighted text is scrolled out of the thread viewport, close the popover
      const isAbove = rangeRect.bottom < threadRect.top;
      const isBelow = rangeRect.top > threadRect.bottom;
      if (isAbove || isBelow) {
        handleClearSelection();
        return;
      }

      let leftCoord = rangeRect.left - cardRect.left;
      const topCoord = rangeRect.bottom - cardRect.top + 8;

      if (leftCoord + 340 > cardRect.width) {
        leftCoord = Math.max(16, cardRect.width - 356);
      }
      if (leftCoord < 16) {
        leftCoord = 16;
      }

      setFloatingPosition({ top: topCoord, left: leftCoord });
    }
  };

  // Restore highlighted selection range if component re-renders
  useEffect(() => {
    if (savedRangeRef.current && !isEditing) {
      try {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedRangeRef.current);
        }
      } catch (e) {
        console.warn("Could not restore selection range:", e);
      }
    }
  }, [selectedText, isEditing]);

  // Close the deep dive highlight popup when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingRecorder.isRecording || isFloatingTranscribing) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.closest(".fixed") || target.closest('[role="dialog"]')) {
        return;
      }

      if (
        floatingPosition &&
        floatingPopoverRef.current &&
        !floatingPopoverRef.current.contains(target)
      ) {
        handleClearSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [floatingPosition, floatingRecorder.isRecording, isFloatingTranscribing]);

  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return;

    const filesArray = Array.from(files);
    const newAttachments = await createFileUploads(filesArray);

    setEditAttachments((prev) => [...prev, ...newAttachments]);
  };

  const { isDragging, onDragOver, onDragLeave, onDrop } = useFileDrop({
    enabled: isEditing,
    onFilesDrop: (files) => {
      void handleFileUpload(files);
    },
  });

  const handleSave = (newContent: string) => {
    if (!newContent.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    onUpdate({
      ...note,
      title: editTitle.trim() || undefined,
      content: newContent,
      updatedAt: formattedDate,
      attachments: editAttachments,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNew) {
      onDelete(note.id);
    } else {
      setEditTitle(note.title || "");
      setEditAttachments(note.attachments || []);
      setIsEditing(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateStr)) return dateStr;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleClearSelection = () => {
    setSelectedText("");
    setFloatingPosition(null);
    setFloatingInput("");
    setFloatingFiles([]);
    savedRangeRef.current = null;
    try {
      window.getSelection()?.removeAllRanges();
    } catch (_) {}
  };

  // Text selection tracker within the notebook conversation
  const handleTextSelection = (e: React.MouseEvent) => {
    if (isEditing) return;

    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("button") ||
      target.closest("form") ||
      target.closest(".no-highlight-selection")
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const ancestorElement =
        commonAncestor.nodeType === Node.ELEMENT_NODE
          ? (commonAncestor as HTMLElement)
          : commonAncestor.parentElement;

      if (ancestorElement) {
        if (
          ancestorElement.closest("input") ||
          ancestorElement.closest("textarea") ||
          ancestorElement.closest("button") ||
          ancestorElement.closest("form") ||
          ancestorElement.closest(".no-highlight-selection")
        ) {
          return;
        }
      }

      const text = selection.toString().trim();
      if (text.length > 0) {
        if (text !== selectedText) {
          savedRangeRef.current = range.cloneRange();
          setSelectedText(text);
          setFloatingFiles([]);

          if (cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            const rangeRect = range.getBoundingClientRect();

            // Position relative to relative card container parent
            let leftCoord = rangeRect.left - cardRect.left;
            const topCoord = rangeRect.bottom - cardRect.top + 8; // 8px below selection

            // Constrain popover width
            if (leftCoord + 340 > cardRect.width) {
              leftCoord = Math.max(16, cardRect.width - 356);
            }
            if (leftCoord < 16) {
              leftCoord = 16;
            }

            setFloatingPosition({ top: topCoord, left: leftCoord });
          }
        }
      }
    }
  };

  // Send a detailed, grounded subnote inquiry (Bottom Input / General Clinical Question)
  const handleSendThreadMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!threadInput.trim() || isThreadLoading) return;

    const queryText = threadInput;
    const currentFiles = [...threadFiles];

    setThreadInput("");
    setThreadFiles([]);
    setIsThreadLoading(true);

    try {
      const result = await sendThreadInquiry({
        note,
        query: queryText,
        attachments: currentFiles,
        chartContext: chartContext ?? undefined,
        onOptimisticUpdate: (subNotes, userSubNote) => {
          setCollapsedThreadIds((prev) => ({
            ...prev,
            [userSubNote.id]: false,
          }));
          onUpdate({ ...note, subNotes });
          scrollToThreadBottom();
        },
      });
      onUpdate({ ...note, ...result });
      scrollToThreadBottom();
    } finally {
      setIsThreadLoading(false);
    }
  };

  // Send a detailed, grounded subnote inquiry (Floating Popover / Specific Highlight Question)
  const handleSendFloatingMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!floatingInput.trim() || isThreadLoading) return;

    const queryText = floatingInput;
    const queryHighlight = selectedText;
    const currentFiles = [...floatingFiles];

    // Reset input states and close popup immediately
    setFloatingInput("");
    setFloatingFiles([]);
    setFloatingPosition(null);
    savedRangeRef.current = null;
    try {
      window.getSelection()?.removeAllRanges();
    } catch (_) {}
    setIsThreadLoading(true);

    try {
      const result = await sendThreadInquiry({
        note,
        query: queryText,
        attachments: currentFiles,
        highlightedText: queryHighlight,
        chartContext: chartContext ?? undefined,
        onOptimisticUpdate: (subNotes, userSubNote) => {
          setCollapsedThreadIds((prev) => ({
            ...prev,
            [userSubNote.id]: false,
          }));
          onUpdate({ ...note, subNotes });
          scrollToThreadBottom();
        },
      });
      onUpdate({ ...note, ...result });
      scrollToThreadBottom();
    } finally {
      setIsThreadLoading(false);
      setSelectedText("");
    }
  };

  const handleDeleteSubNotePair = (
    userSubId?: string,
    assistantSubId?: string,
  ) => {
    setSubNoteDeleteIds({ userSubId, assistantSubId });
    setIsConfirmingDeleteSubNote(true);
  };

  const confirmDeleteSubNotePair = () => {
    if (!subNoteDeleteIds) return;
    const { userSubId, assistantSubId } = subNoteDeleteIds;
    const updatedSubNotes = (note.subNotes || []).filter((sub) => {
      if (userSubId && sub.id === userSubId) return false;
      if (assistantSubId && sub.id === assistantSubId) return false;
      return true;
    });
    onUpdate({
      ...note,
      subNotes: updatedSubNotes,
    });
    setSubNoteDeleteIds(null);
    setIsConfirmingDeleteSubNote(false);
  };

  const handleCopySubNote = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSubNoteId(id);
    setTimeout(() => {
      setCopiedSubNoteId(null);
    }, 2000);
  };

  const handleUpdateSubNoteContent = (
    subNoteId: string,
    newContent: string,
  ) => {
    const updatedSubNotes = (note.subNotes || []).map((sub) => {
      if (sub.id === subNoteId) {
        return {
          ...sub,
          content: newContent,
        };
      }
      return sub;
    });
    onUpdate({
      ...note,
      subNotes: updatedSubNotes,
    });
  };

  const handleDeleteSubNoteAttachment = (
    subNoteId: string,
    fileIdx: number,
  ) => {
    const updatedSubNotes = (note.subNotes || []).map((sub) => {
      if (sub.id === subNoteId) {
        return {
          ...sub,
          attachments: (sub.attachments || []).filter((_, i) => i !== fileIdx),
        };
      }
      return sub;
    });
    onUpdate({
      ...note,
      subNotes: updatedSubNotes,
    });
  };

  const threadPairs = pairThreadSubNotes(note.subNotes || []);

  return (
    <div
      ref={cardRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white rounded-2xl border transition-all duration-200 relative ${isEditing ? "border-teal-200 ring-1 ring-teal-100 shadow-md" : "border-slate-200 hover:border-slate-300 shadow-sm"} ${isDragging && isEditing ? "ring-2 ring-teal-500 bg-teal-50/30" : ""}`}
    >
      {isDragging && isEditing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-teal-50/50 backdrop-blur-[1px] rounded-2xl pointer-events-none">
          <div className="flex flex-col items-center text-teal-600 animate-bounce">
            <Icons.CloudUpload className="w-12 h-12 mb-2" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Drop to attach clinical media
            </span>
          </div>
        </div>
      )}
      {/* Header */}
      <div
        onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
        className={`px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 rounded-t-2xl ${!isEditing ? "cursor-pointer hover:bg-slate-100/50" : ""} transition-colors`}
      >
        {microphoneError && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          >
            {microphoneError}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setMicrophoneError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Icons.ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`}
              />
            )}
            <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
              {note.isAssistant ? (
                <Icons.Brain className="w-4 h-4 text-teal-600" />
              ) : (
                <Icons.Edit3 className="w-4 h-4 text-teal-600" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note Title (Optional)"
                className="text-sm font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300"
              />
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {searchQuery
                    ? highlightQuery(note.title || "Untitled Note", searchQuery)
                    : note.title || "Untitled Note"}
                </h3>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Created: {formatDisplayDate(note.createdAt)}
              </span>
              {note.updatedAt !== note.createdAt && (
                <>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                    Updated: {formatDisplayDate(note.updatedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-transparent rounded-xl transition-all"
                title="Edit Note"
              >
                <Icons.Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-transparent rounded-xl transition-all"
                title="Delete Note"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {(!isCollapsed || isEditing) && (
        <div className="p-4" onMouseUp={handleTextSelection}>
          <NoteContentArea
            content={note.content}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            groundingSources={note.groundingSources}
            searchQuery={searchQuery}
            handleSave={handleSave}
            handleCancel={handleCancel}
            attachments={note.attachments}
            onUpload={handleFileUpload}
            fileInputRef={fileInputRef}
          />

          {/* Thread of Sub-notes (Conversations for Threaded Deep Dives) */}
          {!isEditing && note.subNotes && note.subNotes.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <button
                type="button"
                onClick={() => setIsThreadExpanded(!isThreadExpanded)}
                className="flex items-center justify-between w-full text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icons.Subjective className="w-3.5 h-3.5 text-teal-600" />
                  <span>Thread ({threadPairs.length})</span>
                </div>
                <div className="flex items-center">
                  {isThreadExpanded ? (
                    <Icons.ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isThreadExpanded && (
                <div
                  ref={threadScrollContainerRef}
                  onScroll={handleThreadScroll}
                  className="space-y-4 max-h-[450px] overflow-y-auto pr-1"
                >
                  {threadPairs.map((pair, idx) => {
                    const { userSub, assistantSub } = pair;
                    const combinedId =
                      userSub?.id || assistantSub?.id || `pair-${idx}`;
                    const isCollapsed =
                      collapsedThreadIds[combinedId] === undefined
                        ? true
                        : collapsedThreadIds[combinedId];

                    return (
                      <ThreadPairCard
                        key={combinedId}
                        userSub={userSub}
                        assistantSub={assistantSub}
                        combinedId={combinedId}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={(id) => {
                          setCollapsedThreadIds((prev) => ({
                            ...prev,
                            [id]: prev[id] === undefined ? false : !prev[id],
                          }));
                        }}
                        onDeleteSubNotePair={handleDeleteSubNotePair}
                        onDeleteSubNoteAttachment={
                          handleDeleteSubNoteAttachment
                        }
                        openAttachment={openAttachment}
                        editingSubNoteId={editingSubNoteId}
                        setEditingSubNoteId={setEditingSubNoteId}
                        handleUpdateSubNoteContent={handleUpdateSubNoteContent}
                        handleCopySubNote={handleCopySubNote}
                        copiedSubNoteId={copiedSubNoteId}
                        isThreadLoading={isThreadLoading}
                        idx={idx}
                        totalLength={threadPairs.length}
                        formatDisplayDate={formatDisplayDate}
                      />
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>
              )}
            </div>
          )}

          {/* Interactive follow-up input thread panel */}
          {!isEditing && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <ClinicalChatInput
                value={threadInput}
                onChange={setThreadInput}
                onSubmit={handleSendThreadMessage}
                isLoading={isThreadLoading}
                placeholder={
                  isThreadLoading
                    ? "Consulting medical records..."
                    : "Ask follow-up, or highlight any text above to discuss..."
                }
                selectedFiles={threadFiles}
                onFilesChange={setThreadFiles}
                isRecording={threadRecorder.isRecording}
                isTranscribing={isThreadTranscribing}
                onStartRecording={threadRecorder.startRecording}
                onStopRecording={threadRecorder.stopRecording}
                showVoiceOption={true}
                size="md"
              />
            </div>
          )}
        </div>
      )}

      {/* Attachment Strip (Edit Mode) */}
      {isEditing && editAttachments.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            {editAttachments.map((att, idx) => (
              <FilePreviewBadge
                key={idx}
                file={att}
                onRemove={() =>
                  setEditAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                onOpen={() => openAttachment(att)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Popover for Text Highlighting Deep-Dives */}
      {floatingPosition && selectedText && (
        <div
          ref={floatingPopoverRef}
          style={{
            position: "absolute",
            top: `${floatingPosition.top}px`,
            left: `${floatingPosition.left}px`,
            width: "320px",
            zIndex: 50,
          }}
          className="bg-white rounded-xl border border-teal-100 shadow-xl p-3 text-xs animate-fade-in"
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-1 border-b border-slate-50 pb-2 mb-2 font-semibold text-slate-700">
            <span className="truncate text-[11px] text-teal-850 font-bold flex items-center gap-1">
              <Icons.Brain className="w-3.5 h-3.5 text-teal-600 animate-pulse shrink-0" />
              <span className="truncate">Deep-dive: "{selectedText}"</span>
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5 hover:bg-slate-50 rounded transition-all"
              title="Close and clean selection"
            >
              <Icons.Close className="w-3.5 h-3.5" />
            </button>
          </div>
          <ClinicalChatInput
            value={floatingInput}
            onChange={setFloatingInput}
            onSubmit={handleSendFloatingMessage}
            isLoading={isThreadLoading}
            placeholder="Ask a question..."
            selectedFiles={floatingFiles}
            onFilesChange={setFloatingFiles}
            isRecording={floatingRecorder.isRecording}
            isTranscribing={isFloatingTranscribing}
            onStartRecording={floatingRecorder.startRecording}
            onStopRecording={floatingRecorder.stopRecording}
            showVoiceOption={true}
            size="sm"
          />
        </div>
      )}

      {/* Confirmation Modal for Deleting Sub-note Thread Entries */}
      <ConfirmationModal
        isOpen={isConfirmingDeleteSubNote}
        onClose={() => {
          setIsConfirmingDeleteSubNote(false);
          setSubNoteDeleteIds(null);
        }}
        onConfirm={confirmDeleteSubNotePair}
        title="Delete Thread Entry"
        message="Are you sure you want to delete this thread entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default PatientNoteCard;
