import React, { useMemo, useState } from "react";
import type { Components } from "react-markdown";
import { GroundingSource } from "../../types";
import RichContent from "../ui/RichContent";
import type { RichContentFormat } from "../ui/RichContent";
import { Icons } from "../ui/Icons";

interface ClinicalMarkdownProps {
  content: string;
  className?: string;
  groundingSources?: GroundingSource[];
  showReferences?: boolean;
  searchQuery?: string;
  format?: RichContentFormat;
  showSource?: boolean;
}

const isSafeReferenceUri = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ClinicalMarkdown: React.FC<ClinicalMarkdownProps> = ({
  content,
  className = "",
  groundingSources,
  showReferences = false,
  searchQuery,
  format = "markdown",
  showSource = false,
}) => {
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(false);

  const components = useMemo<Components>(() => {
    const decorateText = (
      node: React.ReactNode,
      keyPrefix = "text",
    ): React.ReactNode => {
      if (typeof node === "string") {
        const tokens = node.split(/(https?:\/\/[^\s<>]+|\[[\d.,\s]+\])/g);
        return tokens.map((token, index) => {
          const key = `${keyPrefix}-${index}`;
          let rendered: React.ReactNode = token;
          if (/^https?:\/\//.test(token)) {
            const trailing = token.match(/[),.;!?]+$/)?.[0] ?? "";
            const href = trailing ? token.slice(0, -trailing.length) : token;
            rendered = isSafeReferenceUri(href) ? (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium text-action hover:text-action-hover hover:underline"
              >
                {href}
              </a>
            ) : (
              token
            );
            if (trailing)
              rendered = (
                <React.Fragment key={key}>
                  {rendered}
                  {trailing}
                </React.Fragment>
              );
          } else if (/^\[[\d.,\s]+\]$/.test(token)) {
            const sourceIndex = Number(token.slice(1, -1)) - 1;
            const source = groundingSources?.[sourceIndex];
            rendered =
              source && isSafeReferenceUri(source.uri) ? (
                <a
                  key={key}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.title}
                  className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-action-border bg-action-subtle px-1.5 align-middle text-[10px] font-bold text-action-hover"
                >
                  {token.slice(1, -1)}
                </a>
              ) : (
                token
              );
          }

          if (searchQuery?.trim() && typeof rendered === "string") {
            const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pieces = rendered.split(new RegExp(`(${escaped})`, "gi"));
            if (pieces.length > 1) {
              return pieces.map((piece, pieceIndex) =>
                piece.toLowerCase() === searchQuery.toLowerCase() ? (
                  <mark
                    key={`${key}-${pieceIndex}`}
                    className="rounded-sm bg-action-200 px-0.5 font-medium text-action-900"
                  >
                    {piece}
                  </mark>
                ) : (
                  piece
                ),
              );
            }
          }
          return rendered;
        });
      }
      if (Array.isArray(node))
        return node.map((child, index) =>
          decorateText(child, `${keyPrefix}-${index}`),
        );
      if (
        React.isValidElement<{
          children?: React.ReactNode;
          className?: string;
        }>(node)
      ) {
        const tag =
          typeof node.type === "string"
            ? node.type
            : typeof node.type === "function"
              ? node.type.name.toLowerCase()
              : "";
        const className = node.props.className ?? "";
        if (["a", "code", "pre"].includes(tag) || className.includes("katex"))
          return node;
        return React.cloneElement(node, {
          children: decorateText(node.props.children, `${keyPrefix}-child`),
        });
      }
      return node;
    };

    return {
      p: ({ children }) => (
        <p className="mb-3 last:mb-0 text-[13px] leading-relaxed">
          {decorateText(children)}
        </p>
      ),
      li: ({ children }) => (
        <li className="mb-1.5 text-[13px] leading-relaxed">
          {decorateText(children)}
        </li>
      ),
      ul: ({ children }) => (
        <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
      ),
      ol: ({ children, start }) => (
        <ol start={start} className="mb-3 list-decimal space-y-1 pl-5">
          {children}
        </ol>
      ),
      h1: ({ children }) => (
        <h1 className="mb-3 mt-6 border-b border-border-subtle pb-1.5 text-base font-bold text-content-strong">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-5 text-sm font-bold text-content-strong">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-1.5 mt-4 text-[13px] font-bold text-content-strong">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mb-1 mt-3 text-[13px] font-semibold text-content-strong">
          {children}
        </h4>
      ),
      h5: ({ children }) => (
        <h5 className="mb-1 mt-3 text-xs font-semibold text-content-strong">
          {children}
        </h5>
      ),
      h6: ({ children }) => (
        <h6 className="mb-1 mt-3 text-xs font-medium text-content-secondary">
          {children}
        </h6>
      ),
      strong: ({ children }) => (
        <strong className="font-bold text-content-strong">{children}</strong>
      ),
      table: ({ children }) => (
        <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-border-default">
          <table className="w-full border-collapse text-left text-[12px]">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="border-b border-border-default bg-canvas">
          {children}
        </thead>
      ),
      th: ({ children, align, colSpan, rowSpan, scope }) => (
        <th
          align={align}
          colSpan={colSpan}
          rowSpan={rowSpan}
          scope={scope}
          className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-content-primary"
        >
          {decorateText(children)}
        </th>
      ),
      td: ({ children, align, colSpan, rowSpan }) => (
        <td
          align={align}
          colSpan={colSpan}
          rowSpan={rowSpan}
          className="border-b border-border-subtle px-3 py-2 text-content-default"
        >
          {decorateText(children)}
        </td>
      ),
      tr: ({ children }) => (
        <tr className="transition-colors hover:bg-canvas/50">{children}</tr>
      ),
    };
  }, [groundingSources, searchQuery]);

  return (
    <div className={className}>
      <RichContent
        content={content}
        format={format}
        components={components}
        showSource={showSource}
      />
      {showReferences && groundingSources && groundingSources.length > 0 && (
        <div className="mt-8 border-t border-border-default pt-5">
          <button
            type="button"
            aria-expanded={isReferencesExpanded}
            onClick={() => setIsReferencesExpanded((expanded) => !expanded)}
            className="mb-3 flex w-full items-center justify-between text-left text-[10px] font-bold uppercase tracking-[0.2em] text-content-muted hover:text-action"
          >
            References
            <Icons.ChevronDown
              className={`h-4 w-4 transition-transform ${isReferencesExpanded ? "rotate-180" : ""}`}
            />
          </button>
          {isReferencesExpanded && (
            <ol className="grid grid-cols-1 gap-3">
              {groundingSources.map((source, index) => {
                const safeUri = isSafeReferenceUri(source.uri);
                return (
                  <li
                    key={`${source.uri}-${index}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-canvas/30 p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface text-[11px] font-bold text-content-secondary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {safeUri ? (
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs font-bold text-content-primary hover:text-action"
                        >
                          {source.title || source.uri}
                        </a>
                      ) : (
                        <span className="truncate text-xs font-bold text-content-primary">
                          {source.title || "Reference"}
                        </span>
                      )}
                      <div className="truncate text-[10px] text-content-muted">
                        {safeUri
                          ? new URL(source.uri).hostname
                          : "Invalid source URL"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalMarkdown;
