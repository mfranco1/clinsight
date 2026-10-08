import React from "react";
import { GroundingSource } from "../../types";

// Helper to replace LaTeX-style medical symbols with proper Unicode
const replaceMedicalSymbols = (text: string) => {
  if (!text) return text;

  const replacements: [RegExp, string][] = [
    [/\\geq/g, "≥"],
    [/\\ge/g, "≥"],
    [/\\leq/g, "≤"],
    [/\\le/g, "≤"],
    [/\\times/g, "×"],
    [/\\pm/g, "±"],
    [/\\approx/g, "≈"],
    [/\\neq/g, "≠"],
    [/\\ne/g, "≠"],
    [/\\mu/g, "µ"],
    [/\\delta/g, "δ"],
    [/\\Delta/g, "Δ"],
    [/\\gt/g, ">"],
    [/\\lt/g, "<"],
  ];

  let result = text;

  // Handle bracketed or delimited LaTeX $...$
  result = result.replace(/\$(.*?)\$/g, (_, p1) => {
    let inner = p1;
    replacements.forEach(([regex, sym]) => {
      inner = inner.replace(regex, sym);
    });
    return inner;
  });

  // Handle raw backslash commands that might not be in $...$
  replacements.forEach(([regex, sym]) => {
    result = result.replace(regex, sym);
  });

  // Final cleanup of any remaining LaTeX delimiters
  result = result.replace(/\$/g, "");

  return result;
};

export const highlightQuery = (text: string, query?: string) => {
  if (!query || !query.trim() || !text) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={i}
          className="bg-action-200 text-action-900 rounded-sm px-0.5 font-medium"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
};

// Helper to parse markdown-style bolding (**text**)
export const formatText = (
  text: string,
  isUser: boolean = false,
  searchQuery?: string,
) => {
  if (!text) return null;

  // Apply symbol replacement before bolding/link parsing
  const cleanText = replaceMedicalSymbols(text);

  // Split by <br> tags first
  const brParts = cleanText.split(/<br\s*\/?>/gi);

  return brParts.map((brPart, brIndex) => {
    const parts = brPart.split(/(\*\*.*?\*\*)/g);
    const formattedPart = parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const innerText = part.slice(2, -2);
        return (
          <strong
            key={index}
            className={`font-bold ${isUser ? "text-white" : "text-content-strong"}`}
          >
            {searchQuery ? highlightQuery(innerText, searchQuery) : innerText}
          </strong>
        );
      }
      return searchQuery ? highlightQuery(part, searchQuery) : part;
    });

    return (
      <React.Fragment key={brIndex}>
        {formattedPart}
        {brIndex < brParts.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

// Helper to detect and format URLs and [number] patterns
export const formatLinks = (
  text: string,
  groundingSources?: GroundingSource[],
  isUser: boolean = false,
  searchQuery?: string,
) => {
  if (!text) return null;

  // Regex to find URLs or [number] patterns, including complex ones like [1.10] or [1, 2]
  const combinedRegex = /(https?:\/\/[^\s]+|\[[\d\.,\s]+\])/g;
  const parts = text.split(combinedRegex);

  return parts.map((part, index) => {
    // Check for URL
    if (part.match(/^https?:\/\/[^\s]+$/)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`${isUser ? "text-action-100 hover:text-white underline" : "text-action hover:text-action-hover hover:underline"} break-all font-medium transition-colors`}
        >
          {part}
        </a>
      );
    }

    // Check for Citation Pattern [1], [1.2], [1, 2]
    if (part.match(/^\[[\d\.,\s]+\]$/)) {
      const content = part.slice(1, -1);

      // If it's a simple integer index and we have a grounding source, make it a link
      if (groundingSources && content.match(/^\d+$/)) {
        const citeIndex = parseInt(content, 10) - 1;
        const source = groundingSources[citeIndex];
        if (source && source.uri) {
          return (
            <a
              key={index}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-1.5 text-[10px] font-bold ${
                isUser
                  ? "text-action-900 bg-surface border border-white"
                  : "text-action-hover bg-action-subtle border border-action-border"
              } rounded-full hover:opacity-90 transition-colors mx-0.5 align-middle transform -translate-y-px no-underline`}
              title={source.title}
            >
              {content}
            </a>
          );
        }
      }

      // Fallback for complex citations (e.g. [1.10]) or missing sources: Render as a styled text badge
      return (
        <span
          key={index}
          className={`inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-bold ${
            isUser
              ? "text-action-100 bg-action-800/40 border border-action-400/30"
              : "text-content-secondary bg-surface-muted border border-border-default"
          } rounded-md align-middle cursor-default`}
        >
          {content}
        </span>
      );
    }

    // Default to bolding check
    return (
      <React.Fragment key={index}>
        {formatText(part, isUser, searchQuery)}
      </React.Fragment>
    );
  });
};

export const renderBulletedContent = (
  content: string,
  textColorClass: string = "text-neutral-800",
  groundingSources?: GroundingSource[],
  searchQuery?: string,
) => {
  if (!content) return null;

  // First attempt: Split by newlines
  let lines = content.split("\n").filter((line) => line.trim().length > 0);

  // Fallback: If there's only one line but it's quite long and has sentences,
  // try to split by sentence endings followed by a space and a capital letter or bullet
  if (lines.length === 1 && lines[0].length > 60) {
    const sentenceSplitRegex = /(?<=[.!?])\s+(?=[A-Z0-9-*•])/g;
    const splitLines = lines[0].split(sentenceSplitRegex);
    if (splitLines.length > 1) {
      lines = splitLines;
    }
  }

  return (
    <ul className={`list-disc pl-4 space-y-2 text-sm ${textColorClass}`}>
      {lines.map((line, i) => {
        // Remove existing markdown bullets if present to avoid double bullets
        const cleanLine = line
          .replace(/^[-*•]\s+/, "")
          .replace(/^\d+\.\s+/, "");
        return (
          <li key={i} className="pl-1 leading-relaxed">
            {formatLinks(cleanLine, groundingSources, false, searchQuery)}
          </li>
        );
      })}
    </ul>
  );
};
