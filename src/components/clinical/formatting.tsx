import React from "react";
import { GroundingSource } from "../../types";
import ClinicalMarkdown from "./ClinicalMarkdown";

/** Retained for feature code that needs search highlighting on plain text. */
export const highlightQuery = (text: string, query?: string) => {
  if (!query?.trim() || !text) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={index}
        className="rounded-sm bg-action-200 px-0.5 font-medium text-action-900"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

export const formatText = (
  text: string,
  isUser = false,
  searchQuery?: string,
) => (
  <ClinicalMarkdown
    content={text}
    searchQuery={searchQuery}
    showSource={false}
    className={
      isUser
        ? "[&_p]:!text-white [&_strong]:!text-white [&_a]:!text-action-100"
        : ""
    }
  />
);

export const formatLinks = (
  text: string,
  groundingSources?: GroundingSource[],
  isUser = false,
  searchQuery?: string,
) => (
  <ClinicalMarkdown
    content={text}
    groundingSources={groundingSources}
    searchQuery={searchQuery}
    showSource={false}
    className={
      isUser
        ? "[&_p]:!text-white [&_strong]:!text-white [&_a]:!text-action-100"
        : ""
    }
  />
);

/** Render a clinical narrative through the same Markdown/math/HTML pipeline. */
export const renderBulletedContent = (
  content: string,
  textColorClass = "text-neutral-800",
  groundingSources?: GroundingSource[],
  searchQuery?: string,
) => (
  <ClinicalMarkdown
    content={content}
    groundingSources={groundingSources}
    searchQuery={searchQuery}
    className={textColorClass}
  />
);
