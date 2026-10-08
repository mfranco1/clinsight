import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import { GroundingSource } from "../../types";
import { formatLinks } from "./formatting";
import { Icons } from "../ui/Icons";
import "katex/dist/katex.min.css";

interface ClinicalMarkdownProps {
  content: string;
  className?: string;
  groundingSources?: GroundingSource[];
  showReferences?: boolean;
  searchQuery?: string;
}

const preprocessLaTeX = (content: string) => {
  if (!content) return "";

  // Convert literal \n sequences to actual newline characters
  const normalized = content.replace(/\\n/g, "\n");

  const commands = [
    "textit",
    "textbf",
    "text",
    "frac",
    "lim",
    "mathbb",
    "sum",
    "oint",
    "gamma",
    "pi",
    "alpha",
    "beta",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "iota",
    "kappa",
    "lambda",
    "mu",
    "nu",
    "xi",
    "omicron",
    "rho",
    "sigma",
    "tau",
    "upsilon",
    "phi",
    "chi",
    "psi",
    "omega",
    "Gamma",
    "Delta",
    "Theta",
    "Lambda",
    "Xi",
    "Pi",
    "Sigma",
    "Phi",
    "Psi",
    "Omega",
    "times",
    "cdot",
    "pm",
    "approx",
    "neq",
    "le",
    "ge",
    "leq",
    "geq",
    "rightarrow",
    "Rightarrow",
    "leftarrow",
    "Leftarrow",
    "infty",
    "partial",
    "nabla",
    "degree",
    "perp",
    "parallel",
    "exists",
    "forall",
  ];

  // 1. Identify all existing math blocks using a robust regex
  // This covers $...$, $$...$$, \(...\), and \[...\]
  const mathBlockRegex =
    /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\(.*?\\\)|\\\[.*?\\\])/g;

  // 2. Commands and symbols that should be wrapped in $...$ if found naked in plain text
  const nakedCmdPattern = new RegExp(
    `\\\\(?:${commands.join("|")})(?:\\s*\\{[^{}]*\\}|(?![a-zA-Z]))`,
  );
  // Better subscript pattern: captures the full alphanumeric prefix (e.g., FiO_2, p_{plat}, V_T)
  // to ensure the entire symbol is wrapped in math mode ($FiO_2$) instead of just the subscript parts ($SpO$_2$).
  const subscriptPattern =
    /([a-zA-Z0-9]+(?:[_^](?:\{[^{}]*\}|[a-zA-Z0-9+-]+))+)/;

  // Pattern for "naked" symbols and subscripts
  const combinedNakedPattern = new RegExp(
    `${nakedCmdPattern.source}|${subscriptPattern.source}`,
    "g",
  );

  // 3. Segment the content by math blocks to avoid touching already-formatted math
  const segments = normalized.split(mathBlockRegex);

  const processedSegments = segments.map((segment, i) => {
    if (i % 2 === 1) {
      // This segment is a valid math block (captured by groups in split)
      // Normalize common clinical symbols that might break KaTeX
      return segment.replace(/[—–]/g, "-");
    }

    // This segment is plain text - safely wrap naked symbols
    return segment.replace(combinedNakedPattern, (match) => {
      // If the match is already partially wrapped (unlikely but safe check)
      if (match.startsWith("$") || match.endsWith("$")) return match;

      const cleaned = match.trim().replace(/[—–]/g, "-");
      return `$${cleaned}$`;
    });
  });

  return processedSegments.join("");
};

const ClinicalMarkdown: React.FC<ClinicalMarkdownProps> = ({
  content,
  className = "",
  groundingSources,
  showReferences = false,
  searchQuery,
}) => {
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(false);

  // Custom components for ReactMarkdown to handle citations and styling
  const components = useMemo<Components>(
    () => ({
      p: ({ children }) => (
        <p className="mb-3 last:mb-0 leading-relaxed text-[13px] text-content-default">
          {React.Children.map(children, (child) => {
            if (typeof child === "string") {
              return formatLinks(child, groundingSources, false, searchQuery);
            }
            return child;
          })}
        </p>
      ),
      li: ({ children }) => (
        <li className="mb-1.5 last:mb-0 leading-relaxed text-[13px] text-content-default">
          {React.Children.map(children, (child) => {
            if (typeof child === "string") {
              return formatLinks(child, groundingSources, false, searchQuery);
            }
            return child;
          })}
        </li>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
      ),
      h1: ({ children }) => (
        <h1 className="text-base font-bold text-content-strong mt-6 mb-3 border-b border-border-subtle pb-1.5">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-sm font-bold text-neutral-800 mt-5 mb-2">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-[13px] font-bold text-neutral-800 mt-4 mb-1.5">
          {children}
        </h3>
      ),
      strong: ({ children }) => (
        <strong className="font-bold text-content-strong">{children}</strong>
      ),

      // Table components for better styling
      table: ({ children }) => (
        <div className="my-4 overflow-x-auto rounded-xl border border-border-default">
          <table className="w-full text-[12px] text-left border-collapse">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-canvas border-b border-border-default">
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="px-4 py-3 font-bold text-content-primary uppercase tracking-wider text-[10px]">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-3 text-content-default border-b border-border-subtle last:border-b-0">
          {React.Children.map(children, (child) => {
            if (typeof child === "string") {
              return formatLinks(child, groundingSources, false, searchQuery);
            }
            return child;
          })}
        </td>
      ),
      tr: ({ children }) => (
        <tr className="hover:bg-canvas/50 transition-colors">{children}</tr>
      ),
    }),
    [groundingSources, searchQuery],
  );

  return (
    <div
      className={`prose prose-xs max-w-none prose-neutral prose-headings:text-content-strong prose-p:text-content-default prose-a:text-action prose-strong:text-content-strong ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={components}
      >
        {preprocessLaTeX(content)}
      </ReactMarkdown>

      {showReferences && groundingSources && groundingSources.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border-default">
          <button
            onClick={() => setIsReferencesExpanded(!isReferencesExpanded)}
            className="flex items-center justify-between w-full group/ref-header mb-4"
          >
            <h4 className="text-[10px] font-bold text-content-muted uppercase tracking-[0.2em] group-hover/ref-header:text-action transition-colors">
              References
            </h4>
            <Icons.ChevronDown
              className={`w-4 h-4 text-neutral-300 group-hover/ref-header:text-action-500 transition-all duration-200 ${isReferencesExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {isReferencesExpanded && (
            <div className="grid grid-cols-1 gap-3 animate-fade-in">
              {groundingSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-border-subtle bg-canvas/30 hover:bg-surface hover:border-action-border hover:shadow-md hover:shadow-action-900/5 transition-all group"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-surface border border-border-default flex items-center justify-center text-[11px] font-bold text-content-secondary group-hover:bg-action group-hover:text-white group-hover:border-action-600 transition-all shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-content-primary truncate group-hover:text-action-hover">
                      {source.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-bold text-action uppercase tracking-wider">
                        View Source
                      </span>
                      <div className="w-1 h-1 rounded-full bg-neutral-300" />
                      <span className="text-[9px] text-content-muted truncate max-w-[200px]">
                        {new URL(source.uri).hostname}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-action-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalMarkdown;
