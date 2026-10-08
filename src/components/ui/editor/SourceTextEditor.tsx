import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { search, searchKeymap } from "@codemirror/search";
import {
  Annotation,
  Compartment,
  EditorSelection,
  EditorState,
} from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

const externalValueSync = Annotation.define<boolean>();

export interface SourceTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  disabled?: boolean;
  minHeight?: number;
  className?: string;
  autoFocus?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

/** A controlled Markdown/source editor whose instance and history survive React updates. */
export function SourceTextEditor({
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled = false,
  minHeight = 160,
  className = "",
  autoFocus = false,
  onSave,
  onCancel,
}: SourceTextEditorProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);
  const editableCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    onCancelRef.current = onCancel;
  }, [onChange, onSave, onCancel]);

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          markdown(),
          history(),
          search(),
          EditorView.lineWrapping,
          keymap.of([
            {
              key: "Mod-b",
              run: (editor) => wrapSelection(editor, "**", "**"),
            },
            { key: "Mod-i", run: (editor) => wrapSelection(editor, "*", "*") },
            {
              key: "Mod-u",
              run: (editor) => wrapSelection(editor, "<u>", "</u>"),
            },
            {
              key: "Mod-Shift-x",
              run: (editor) => wrapSelection(editor, "~~", "~~"),
            },
            {
              key: "Mod-k",
              run: (editor) => wrapSelection(editor, "[", "](https://)"),
            },
            {
              key: "Mod-Enter",
              run: () => {
                onSaveRef.current?.();
                return Boolean(onSaveRef.current);
              },
            },
            {
              key: "Escape",
              run: () => {
                onCancelRef.current?.();
                return Boolean(onCancelRef.current);
              },
            },
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
          ]),
          editableCompartmentRef.current.of(EditorView.editable.of(!disabled)),
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            "aria-multiline": "true",
            "data-testid": "source-text-editor",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const nextValue = update.state.doc.toString();
              update.view.dom.dataset.printText = nextValue;
              if (
                !update.transactions.some((transaction) =>
                  transaction.annotation(externalValueSync),
                )
              ) {
                onChangeRef.current(nextValue);
              }
            }
          }),
          EditorView.theme({
            "&": {
              minHeight: `${minHeight}px`,
              fontSize: "13px",
              color: "var(--color-content-primary)",
              backgroundColor: "var(--color-surface)",
            },
            ".cm-scroller": {
              minHeight: `${minHeight}px`,
              overflow: "auto",
              fontFamily: "inherit",
            },
            ".cm-content": {
              padding: "16px",
              caretColor: "currentColor",
            },
            ".cm-focused": { outline: "none" },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
              backgroundColor: "var(--color-action-subtle) !important",
            },
          }),
        ],
      }),
      parent,
    });
    view.dom.dataset.printText = value;
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The view is intentionally created once; changing its document is handled
    // through transactions below so ordinary controlled updates keep history.
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: externalValueSync.of(true),
      });
    }
  }, [value]);

  useEffect(() => {
    const content = mountRef.current?.querySelector<HTMLElement>(".cm-content");
    if (content) content.setAttribute("aria-label", ariaLabel);
    viewRef.current?.dispatch({
      effects: editableCompartmentRef.current.reconfigure(
        EditorView.editable.of(!disabled),
      ),
    });
  }, [ariaLabel, disabled]);

  useEffect(() => {
    if (autoFocus) viewRef.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border-default focus-within:ring-2 focus-within:ring-focus-ring ${className}`}
      style={{ minHeight }}
      ref={mountRef}
    />
  );
}

function wrapSelection(editor: EditorView, prefix: string, suffix: string) {
  const { from, to } = editor.state.selection.main;
  const selectedText = editor.state.sliceDoc(from, to);
  editor.dispatch({
    changes: { from, to, insert: `${prefix}${selectedText}${suffix}` },
    selection: EditorSelection.range(
      from + prefix.length,
      from + prefix.length + selectedText.length,
    ),
    scrollIntoView: true,
  });
  editor.focus();
  return true;
}
