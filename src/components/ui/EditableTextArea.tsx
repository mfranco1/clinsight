import React, { useState, useEffect, useRef } from "react";
import { Icons } from "./Icons";
import ClinicalMarkdown from "../clinical/ClinicalMarkdown";
import { GroundingSource } from "../../types";
import { EditorErrorBoundary } from "./editor/EditorErrorBoundary";

const LazySourceTextEditor = React.lazy(() =>
  import("./editor/SourceTextEditor").then(({ SourceTextEditor }) => ({
    default: SourceTextEditor,
  })),
);
const LazyDocumentTextEditor = React.lazy(() =>
  import("./editor/DocumentTextEditor").then(({ DocumentTextEditor }) => ({
    default: DocumentTextEditor,
  })),
);

interface EditableTextAreaProps {
  value: string;
  onSave?: (newValue: string) => void;
  onChange?: (newValue: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
  groundingSources?: GroundingSource[];
  showReferences?: boolean;
  className?: string;
  showControls?: boolean;
  autoFocus?: boolean;
  hideEditButton?: boolean;
  minHeight?: string;
  searchQuery?: string;
  disabled?: boolean;
  editorMode?: "native" | "source" | "document";
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onSave,
  onChange,
  onCancel,
  placeholder = "Enter text...",
  isEditing: externalIsEditing,
  setIsEditing: externalSetIsEditing,
  groundingSources,
  showReferences = false,
  className = "",
  showControls = true,
  autoFocus = true,
  hideEditButton = false,
  minHeight = "min-h-[120px]",
  searchQuery,
  disabled = false,
  editorMode = "native",
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing =
    externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing =
    externalSetIsEditing !== undefined
      ? externalSetIsEditing
      : setInternalIsEditing;

  // Persisted clinical text is source data. In particular, a literal backslash
  // followed by `n` must not be rewritten when entering or leaving edit mode.
  const [editValue, setEditValue] = useState(value);
  const editSessionValueRef = useRef(value);
  const wasEditingRef = useRef(isEditing);
  const [hasExternalConflict, setHasExternalConflict] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isManualResized, setIsManualResized] = useState(false);

  useEffect(() => {
    if (isEditing && !wasEditingRef.current) {
      editSessionValueRef.current = value;
      setEditValue(value);
      setHasExternalConflict(false);
    } else if (!isEditing) {
      editSessionValueRef.current = value;
      setEditValue(value);
      setHasExternalConflict(false);
    } else if (value === editValue) {
      // A controlled parent's echo of our own keystroke is not a conflict.
      setHasExternalConflict(false);
    } else if (onChange) {
      // Immediate-change consumers own the live draft, so their explicit reset
      // or replacement is authoritative even after local typing.
      editSessionValueRef.current = value;
      setEditValue(value);
      setHasExternalConflict(false);
    } else if (editValue === editSessionValueRef.current) {
      // The user has not changed this session yet, so accept the clean update.
      editSessionValueRef.current = value;
      setEditValue(value);
      setHasExternalConflict(false);
    } else {
      // Keep the user's draft visible and require an explicit resolution.
      setHasExternalConflict(true);
    }
    wasEditingRef.current = isEditing;
  }, [value, isEditing, onChange]);

  useEffect(() => {
    if (isEditing && textareaRef.current && autoFocus) {
      textareaRef.current.focus();
      if (!isManualResized) {
        adjustHeight();
      }
    }
  }, [isEditing, autoFocus]);

  const adjustHeight = () => {
    if (textareaRef.current && !isManualResized) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);

    const textToInsert = prefix + selectedText + suffix;

    // Try to use execCommand to preserve native undo stack
    textarea.focus();
    try {
      // This is deprecated but widely used for textarea formatting to preserve undo history
      const success = document.execCommand("insertText", false, textToInsert);

      if (!success) {
        throw new Error("execCommand failed");
      }

      // Sync React state with updated textarea value
      const newValue = textarea.value;
      setEditValue(newValue);
      if (onChange) onChange(newValue);

      // Restore selection around the original text
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    } catch (err) {
      // Fallback to manual state update if execCommand fails
      const newValue =
        editValue.substring(0, start) + textToInsert + editValue.substring(end);

      setEditValue(newValue);
      if (onChange) onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          applyFormatting("**", "**");
          break;
        case "i":
          e.preventDefault();
          applyFormatting("*", "*");
          break;
        case "u":
          e.preventDefault();
          applyFormatting("<u>", "</u>");
          break;
        case "k":
          e.preventDefault();
          applyFormatting("[", "](https://)");
          break;
        case "x":
          if (e.shiftKey) {
            e.preventDefault();
            applyFormatting("~~", "~~");
          }
          break;
        case "enter":
          e.preventDefault();
          handleSave();
          break;
      }
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleFallbackKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleSave();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  const handleSave = () => {
    if (onSave) onSave(editValue);
    setIsEditing(false);
    setIsManualResized(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    editSessionValueRef.current = value;
    setHasExternalConflict(false);
    setIsEditing(false);
    setIsManualResized(false);
    if (onCancel) onCancel();
  };

  const handleMouseDown = () => {
    // Detect manual resize start
    const handleMouseUp = () => {
      setIsManualResized(true);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (isEditing) {
    const renderPlainTextFallback = () => (
      <div className="space-y-2">
        <p
          className="rounded-md bg-warning-50 px-3 py-2 text-xs text-content-primary"
          role="status"
        >
          The enhanced editor could not load. Your text is available in the
          plain editor below.
        </p>
        <textarea
          value={editValue}
          onChange={(event) => {
            setEditValue(event.target.value);
            onChange?.(event.target.value);
          }}
          onKeyDown={handleFallbackKeyDown}
          aria-label={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full text-[13px] text-content-primary bg-surface border border-border-default rounded-xl p-4 ${minHeight} resize-y`}
        />
      </div>
    );

    return (
      <div className={`space-y-3 ${className}`}>
        {editorMode !== "native" ? (
          <EditorErrorBoundary fallback={renderPlainTextFallback}>
            <React.Suspense
              fallback={
                <textarea
                  value={editValue}
                  onChange={(event) => {
                    setEditValue(event.target.value);
                    onChange?.(event.target.value);
                  }}
                  onKeyDown={handleFallbackKeyDown}
                  aria-label={placeholder}
                  disabled={disabled}
                  autoFocus={autoFocus}
                  className={`w-full text-[13px] text-content-primary bg-surface border border-border-default rounded-xl p-4 ${minHeight} resize-y`}
                />
              }
            >
              {editorMode === "document" ? (
                <LazyDocumentTextEditor
                  value={editValue}
                  onChange={(newValue) => {
                    setEditValue(newValue);
                    onChange?.(newValue);
                  }}
                  ariaLabel={placeholder}
                  disabled={disabled}
                  autoFocus={autoFocus}
                  minHeightClass={minHeight}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <LazySourceTextEditor
                  value={editValue}
                  onChange={(newValue) => {
                    setEditValue(newValue);
                    onChange?.(newValue);
                  }}
                  aria-label={placeholder}
                  disabled={disabled}
                  autoFocus={autoFocus}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
            </React.Suspense>
          </EditorErrorBoundary>
        ) : (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              adjustHeight();
              if (onChange) onChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            placeholder={placeholder}
            aria-label={placeholder}
            className={`w-full text-[13px] text-content-primary bg-surface border border-border-default rounded-xl focus:ring-2 focus:ring-focus-ring focus:border-action p-4 ${minHeight} transition-all resize-y`}
          />
        )}
        {hasExternalConflict && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-content-primary"
            role="alert"
          >
            <span>This text changed elsewhere while you were editing.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  editSessionValueRef.current = value;
                  setEditValue(value);
                  setHasExternalConflict(false);
                }}
                className="font-semibold text-action hover:underline"
              >
                Load updated text
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="font-semibold text-action hover:underline"
              >
                Save my version
              </button>
            </div>
          </div>
        )}
        {showControls && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-bold text-content-secondary hover:text-content-primary hover:bg-surface-muted rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-bold text-white bg-action hover:bg-action-hover rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Save
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl hover:bg-canvas/50 transition-all p-1 -m-1 ${className}`}
    >
      {!hideEditButton && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-2 text-content-muted hover:text-action hover:bg-action-subtle bg-surface rounded-xl border border-border-default shadow-sm z-10"
          title="Edit"
        >
          <Icons.Edit className="w-4 h-4" />
        </button>
      )}
      {value ? (
        <ClinicalMarkdown
          content={value}
          groundingSources={groundingSources}
          showReferences={showReferences}
          searchQuery={searchQuery}
        />
      ) : (
        <div
          onClick={() => {
            if (!disabled) setIsEditing(true);
          }}
          className={`py-1 ${!disabled ? "cursor-pointer hover:text-action transition-colors" : ""}`}
        >
          <span className="text-content-muted italic text-[13px]">
            {disabled
              ? "No data recorded."
              : placeholder || "No data recorded. Click to edit."}
          </span>
        </div>
      )}
    </div>
  );
};

export default EditableTextArea;
