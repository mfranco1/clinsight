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
    const serialized = markdownManager.serialize(document);
    if (
      serialized !== source &&
      !hasStableTableRoundTrip(source, document, serialized)
    ) {
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

function hasStableTableRoundTrip(
  source: string,
  document: JSONContent,
  serialized: string,
) {
  if (!containsTable(document)) return false;

  const reparsed = markdownManager.parse(serialized);
  return (
    JSON.stringify(reparsed) === JSON.stringify(document) &&
    maskMarkdownTables(source) === maskMarkdownTables(serialized)
  );
}

function containsTable(node: JSONContent): boolean {
  return node.type === "table" || (node.content ?? []).some(containsTable);
}

function maskMarkdownTables(markdown: string) {
  const lines = markdown.split("\n");
  const masked: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index];
    const separator = lines[index + 1] ?? "";
    if (header.includes("|") && isTableSeparator(separator)) {
      masked.push("<table>");
      index += 2;
      while (index < lines.length && lines[index].includes("|")) index += 1;
      index -= 1;
      continue;
    }
    masked.push(header);
  }
  return masked
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isTableSeparator(line: string) {
  const cells = line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
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
