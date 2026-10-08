import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { MarkdownManager } from "@tiptap/markdown";

const documentExtensions = [StarterKit, TableKit, TaskList, TaskItem];
const markdownManager = new MarkdownManager({ extensions: documentExtensions });

export type DocumentModeEligibility =
  { supported: true } | { supported: false; reason: string };

/**
 * Tiptap's schema is intentionally strict. Only enable visual editing when the
 * current Markdown subset round-trips exactly; all other content stays in
 * source mode so opening the editor cannot silently drop or rewrite it.
 */
export function checkDocumentModeEligibility(
  source: string,
): DocumentModeEligibility {
  if (containsMath(source)) {
    return {
      supported: false,
      reason: "LaTeX remains in source mode until math nodes are configured.",
    };
  }

  try {
    const document = markdownManager.parse(source);
    if (markdownManager.serialize(document) !== source) {
      return {
        supported: false,
        reason:
          "This content contains formatting outside the verified visual-editing subset.",
      };
    }
    return { supported: true };
  } catch {
    return {
      supported: false,
      reason: "This content could not be safely opened in visual mode.",
    };
  }
}

export function parseDocumentMarkdown(source: string): JSONContent {
  if (source === "") {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return markdownManager.parse(source);
}

export function serializeDocumentMarkdown(document: JSONContent) {
  return markdownManager.serialize(document);
}

function containsMath(source: string) {
  return (
    /(^|[^\\])\$\$?[\s\S]*?\$\$?/.test(source) ||
    /\\(?:\[[\s\S]*?\\\]|\([\s\S]*?\\\))/.test(source)
  );
}
