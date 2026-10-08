import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import ClinicalMarkdown from "../../clinical/ClinicalMarkdown";
import {
  checkDocumentModeEligibility,
  parseDocumentMarkdown,
} from "./documentMode";
import { sanitizeDocumentPasteHtml } from "./sanitizeDocumentPaste";

const LazySourceTextEditor = React.lazy(() =>
  import("./SourceTextEditor").then(({ SourceTextEditor }) => ({
    default: SourceTextEditor,
  })),
);

type EditorMode = "visual" | "source" | "preview";

interface DocumentTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  ariaLabel: string;
  disabled?: boolean;
  autoFocus?: boolean;
  minHeightClass?: string;
}

const extensions = [StarterKit, TableKit, TaskList, TaskItem, Markdown];

export function DocumentTextEditor({
  value,
  onChange,
  onSave,
  onCancel,
  ariaLabel,
  disabled = false,
  autoFocus = false,
  minHeightClass = "min-h-[160px]",
}: DocumentTextEditorProps) {
  const [draft, setDraft] = useState(value);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [, setToolbarRevision] = useState(0);
  const [mode, setMode] = useState<EditorMode>(() =>
    checkDocumentModeEligibility(value).supported ? "visual" : "source",
  );
  const eligibility = useMemo(
    () => checkDocumentModeEligibility(draft),
    [draft],
  );
  // A document can change identity while this editor stays mounted. If the new
  // source is outside the visual subset, never keep showing the prior ProseMirror
  // document while waiting for an effect to switch modes.
  const activeMode =
    mode === "visual" && !eligibility.supported ? "source" : mode;
  const modeRef = useRef(mode);
  const eligibilityRef = useRef(eligibility.supported);
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);
  modeRef.current = mode;
  eligibilityRef.current = eligibility.supported;
  onSaveRef.current = onSave;
  onCancelRef.current = onCancel;
  const editor = useEditor({
    extensions,
    content: eligibility.supported ? parseDocumentMarkdown(value) : "",
    contentType: "markdown",
    editable: !disabled,
    shouldRerenderOnTransaction: false,
    editorProps: {
      transformPastedHTML: sanitizeDocumentPasteHtml,
      handleKeyDown: (_view, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key === "Enter" &&
          !event.isComposing
        ) {
          event.preventDefault();
          onSaveRef.current();
          return true;
        }
        if (event.key === "Escape" && !event.isComposing) {
          event.preventDefault();
          onCancelRef.current();
          return true;
        }
        return false;
      },
      attributes: {
        "aria-label": ariaLabel,
        "aria-multiline": "true",
        class: `${minHeightClass} px-4 py-3 text-[13px] text-content-primary outline-none focus:outline-none`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (modeRef.current !== "visual" || !eligibilityRef.current) return;
      const next = currentEditor.getMarkdown();
      setDraft(next);
      onChange(next);
    },
    onSelectionUpdate: () => setToolbarRevision((revision) => revision + 1),
  });
  // EditorContent remounts Tiptap's underlying view when it takes ownership of
  // the DOM. Wait for the view itself; `isInitialized` can stay false after
  // this React mount cycle even though the view is available.
  const readyEditor = hasMountedView(editor) ? editor : null;

  useEffect(() => {
    setDraft(value);
    if (!readyEditor || !checkDocumentModeEligibility(value).supported) return;
    if (value === "") {
      readyEditor.commands.clearContent(false);
      return;
    }
    if (readyEditor.getMarkdown() !== value) {
      readyEditor.commands.setContent(parseDocumentMarkdown(value), {
        emitUpdate: false,
        contentType: "json",
      });
    }
  }, [value, readyEditor]);

  useEffect(() => {
    readyEditor?.setEditable(!disabled);
  }, [disabled, readyEditor]);

  useEffect(() => {
    if (!autoFocus || mode !== "visual" || !readyEditor) return;
    const frame = window.requestAnimationFrame(() => {
      const view = readyEditor.view;
      if (view && !view.isDestroyed) view.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, readyEditor, mode]);

  const switchMode = (next: EditorMode) => {
    if (next === "visual" && !eligibility.supported) return;
    setMode(next);
    if (
      next === "visual" &&
      readyEditor &&
      readyEditor.getMarkdown() !== draft
    ) {
      readyEditor.commands.setContent(parseDocumentMarkdown(draft), {
        emitUpdate: false,
        contentType: "json",
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-canvas px-2 py-2">
        <div
          role="group"
          className="flex items-center gap-1"
          aria-label="Editor view mode"
        >
          {(["visual", "source", "preview"] as const).map((viewMode) => (
            <button
              key={viewMode}
              type="button"
              aria-pressed={activeMode === viewMode}
              disabled={viewMode === "visual" && !eligibility.supported}
              onClick={() => switchMode(viewMode)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize text-content-secondary hover:bg-surface-muted aria-pressed:bg-action-subtle aria-pressed:text-action disabled:cursor-not-allowed disabled:opacity-40"
              title={
                viewMode === "visual" && !eligibility.supported
                  ? eligibility.reason
                  : undefined
              }
            >
              {viewMode}
            </button>
          ))}
        </div>
        {activeMode === "visual" && readyEditor && (
          <div
            role="toolbar"
            aria-orientation="horizontal"
            className="flex w-full max-w-full flex-nowrap items-center gap-1 overflow-x-auto py-1 sm:w-auto sm:flex-wrap sm:overflow-visible"
            aria-label="Formatting"
          >
            <ToolbarButton
              label="Bold"
              active={readyEditor.isActive("bold")}
              disabled={disabled}
              onClick={() => readyEditor.chain().focus().toggleBold().run()}
            >
              B
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              active={readyEditor.isActive("italic")}
              disabled={disabled}
              onClick={() => readyEditor.chain().focus().toggleItalic().run()}
            >
              I
            </ToolbarButton>
            <ToolbarButton
              label="Strikethrough"
              active={readyEditor.isActive("strike")}
              disabled={disabled}
              onClick={() => readyEditor.chain().focus().toggleStrike().run()}
            >
              S
            </ToolbarButton>
            <ToolbarButton
              label="Underline"
              active={readyEditor.isActive("underline")}
              disabled={disabled}
              onClick={() =>
                readyEditor.chain().focus().toggleUnderline().run()
              }
            >
              U
            </ToolbarButton>
            <ToolbarButton
              label="Add link"
              active={readyEditor.isActive("link")}
              disabled={disabled}
              onClick={() => {
                setLinkUrl(readyEditor.getAttributes("link").href ?? "");
                setShowLinkInput((visible) => !visible);
              }}
            >
              Link
            </ToolbarButton>
            <ToolbarButton
              label="Bullet list"
              active={readyEditor.isActive("bulletList")}
              disabled={disabled}
              onClick={() =>
                readyEditor.chain().focus().toggleBulletList().run()
              }
            >
              • List
            </ToolbarButton>
            <ToolbarButton
              label="Numbered list"
              active={readyEditor.isActive("orderedList")}
              disabled={disabled}
              onClick={() =>
                readyEditor.chain().focus().toggleOrderedList().run()
              }
            >
              1. List
            </ToolbarButton>
            <ToolbarButton
              label="Task list"
              active={readyEditor.isActive("taskList")}
              disabled={disabled}
              onClick={() => readyEditor.chain().focus().toggleTaskList().run()}
            >
              Checklist
            </ToolbarButton>
            <ToolbarButton
              label="Heading level 2"
              active={readyEditor.isActive("heading", { level: 2 })}
              disabled={disabled}
              onClick={() =>
                readyEditor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              label="Block quote"
              active={readyEditor.isActive("blockquote")}
              disabled={disabled}
              onClick={() =>
                readyEditor.chain().focus().toggleBlockquote().run()
              }
            >
              Quote
            </ToolbarButton>
            <ToolbarButton
              label="Insert 2 by 2 table"
              disabled={disabled}
              onClick={() =>
                readyEditor
                  .chain()
                  .focus()
                  .insertTable({
                    rows: 2,
                    cols: 2,
                    withHeaderRow: true,
                  })
                  .run()
              }
            >
              Table
            </ToolbarButton>
            <ToolbarButton
              label="Add row below"
              disabled={disabled || !readyEditor.isActive("table")}
              onClick={() => readyEditor.chain().focus().addRowAfter().run()}
            >
              + Row
            </ToolbarButton>
            <ToolbarButton
              label="Remove current row"
              disabled={disabled || !readyEditor.isActive("table")}
              onClick={() => readyEditor.chain().focus().deleteRow().run()}
            >
              − Row
            </ToolbarButton>
            <ToolbarButton
              label="Add column after"
              disabled={disabled || !readyEditor.isActive("table")}
              onClick={() => readyEditor.chain().focus().addColumnAfter().run()}
            >
              + Column
            </ToolbarButton>
            <ToolbarButton
              label="Remove current column"
              disabled={disabled || !readyEditor.isActive("table")}
              onClick={() => readyEditor.chain().focus().deleteColumn().run()}
            >
              − Column
            </ToolbarButton>
            <ToolbarButton
              label="Undo"
              disabled={disabled || !canRunCommand(readyEditor, "undo")}
              onClick={() => readyEditor.chain().focus().undo().run()}
            >
              Undo
            </ToolbarButton>
            <ToolbarButton
              label="Redo"
              disabled={disabled || !canRunCommand(readyEditor, "redo")}
              onClick={() => readyEditor.chain().focus().redo().run()}
            >
              Redo
            </ToolbarButton>
          </div>
        )}
      </div>

      {activeMode === "visual" && showLinkInput && (
        <form
          className="flex items-center gap-2 border-b border-border-subtle bg-canvas px-3 py-2 print:hidden"
          onSubmit={(event) => {
            event.preventDefault();
            if (!linkUrl.trim()) return;
            readyEditor
              ?.chain()
              .focus()
              .setLink({ href: linkUrl.trim() })
              .run();
            setShowLinkInput(false);
          }}
        >
          <label className="sr-only" htmlFor="document-editor-link-url">
            Link URL
          </label>
          <input
            id="document-editor-link-url"
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            disabled={disabled}
            className="min-w-0 flex-1 rounded-md border border-border-default bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus-ring"
          />
          <button
            type="submit"
            disabled={disabled || !linkUrl.trim()}
            className="min-h-10 rounded-md bg-action px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Apply link
          </button>
        </form>
      )}

      {eligibility.supported ? null : (
        <p className="border-b border-warning-200 bg-warning-50 px-3 py-2 text-xs text-content-primary">
          Visual editing is unavailable for this content. {eligibility.reason}
        </p>
      )}

      {activeMode === "visual" ? (
        <div className="relative">
          <EditorContent
            editor={editor}
            className="clinical-document-editor max-h-[60vh] overflow-auto"
          />
          {!readyEditor && (
            <div
              className="absolute inset-0 min-h-40 bg-surface/80 px-4 py-3 text-sm text-content-secondary"
              role="status"
            >
              Preparing visual editor…
            </div>
          )}
        </div>
      ) : activeMode === "source" ? (
        <React.Suspense
          fallback={
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                onChange(event.target.value);
              }}
              aria-label={ariaLabel}
              aria-multiline="true"
              disabled={disabled}
              autoFocus={autoFocus}
              className={`${minHeightClass} w-full resize-y bg-surface px-4 py-3 text-[13px] text-content-primary outline-none`}
            />
          }
        >
          <LazySourceTextEditor
            value={draft}
            onChange={(next) => {
              setDraft(next);
              onChange(next);
            }}
            aria-label={ariaLabel}
            disabled={disabled}
            autoFocus={autoFocus}
            minHeight={parseMinHeight(minHeightClass)}
            onSave={onSave}
            onCancel={onCancel}
          />
        </React.Suspense>
      ) : (
        <div className="max-h-[60vh] overflow-auto px-4 py-3">
          <ClinicalMarkdown content={draft} />
        </div>
      )}
    </div>
  );
}

function parseMinHeight(minHeightClass: string) {
  const pixelValue = minHeightClass.match(/min-h-\[(\d+)px\]/)?.[1];
  return pixelValue ? Number(pixelValue) : 160;
}

function hasMountedView(editor: ReturnType<typeof useEditor>) {
  return Boolean(editor?.view);
}

function canRunCommand(
  editor: ReturnType<typeof useEditor>,
  command: "undo" | "redo",
) {
  if (!editor?.view) return false;
  try {
    return command === "undo" ? editor.can().undo() : editor.can().redo();
  } catch {
    return false;
  }
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="min-h-10 shrink-0 rounded-md px-2.5 text-xs font-semibold text-content-secondary hover:bg-surface-muted aria-pressed:bg-action-subtle aria-pressed:text-action disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
