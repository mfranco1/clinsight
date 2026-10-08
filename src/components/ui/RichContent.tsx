import React, { useId } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "katex/dist/katex.min.css";
import {
  default as remarkClinicalMath,
  normalizeLatexDelimiters,
} from "../../utils/content/remarkClinicalMath";

export type RichContentFormat = "plain" | "markdown" | "html";

interface RichContentProps {
  content: string;
  format?: RichContentFormat;
  className?: string;
  components?: Components;
  showSource?: boolean;
}

const clinicalSanitizeSchema: NonNullable<
  Parameters<typeof rehypeSanitize>[0]
> = {
  ...defaultSchema,
  tagNames: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "del",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "input",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  attributes: {
    ...defaultSchema.attributes,
    ol: [...(defaultSchema.attributes?.ol ?? []), "start"],
    li: [...(defaultSchema.attributes?.li ?? []), "value"],
    td: [
      ...(defaultSchema.attributes?.td ?? []),
      "align",
      "colSpan",
      "rowSpan",
    ],
    th: [
      ...(defaultSchema.attributes?.th ?? []),
      "align",
      "colSpan",
      "rowSpan",
      "scope",
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", /^math-(?:inline|display)$/],
    ],
    input: [...(defaultSchema.attributes?.input ?? []), ["checked", true]],
  },
  clobberPrefix: "clinical-content-",
  strip: [
    ...(defaultSchema.strip ?? []),
    "script",
    "style",
    "iframe",
    "object",
    "embed",
  ],
};

const remarkHtmlFragment =
  (source: string) => () => (tree: { children?: unknown[] }) => {
    tree.children = [{ type: "html", value: source }];
  };

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const rehypeInlineHtmlMath = () => (tree: { children?: HastNode[] }) => {
  const mathPattern =
    /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|(?<!\\)\$(?!\$)[^\n$]+(?<!\\)\$)/g;
  const visit = (node: HastNode, inCode = false): HastNode[] => {
    if (node.type === "element") {
      const classes = node.properties?.className;
      const isMathNode =
        Array.isArray(classes) &&
        classes.some((className) =>
          ["math-inline", "math-display"].includes(String(className)),
        );
      inCode =
        inCode ||
        isMathNode ||
        ["code", "pre", "script", "style"].includes(node.tagName ?? "");
    }
    if (!inCode && node.type === "text" && typeof node.value === "string") {
      const children: HastNode[] = [];
      let cursor = 0;
      for (const match of node.value.matchAll(mathPattern)) {
        const index = match.index ?? 0;
        if (index > cursor)
          children.push({
            type: "text",
            value: node.value.slice(cursor, index),
          });
        const token = match[0];
        const display = token.startsWith("$$") || token.startsWith("\\[");
        const delimiterLength =
          token.startsWith("\\") || display || token.startsWith("$$") ? 2 : 1;
        children.push({
          type: "element",
          tagName: "span",
          properties: { className: [display ? "math-display" : "math-inline"] },
          children: [
            {
              type: "text",
              value: token.slice(delimiterLength, -delimiterLength),
            },
          ],
        });
        cursor = index + token.length;
      }
      if (cursor > 0) {
        if (cursor < node.value.length)
          children.push({ type: "text", value: node.value.slice(cursor) });
        return children;
      }
    }
    if (node.children) {
      node.children = node.children.flatMap((child) => visit(child, inCode));
    }
    return [node];
  };
  if (tree.children)
    tree.children = tree.children.flatMap((node) => visit(node));
};

const isSafeLink = (href?: string): href is string => {
  if (!href) return false;
  const value = href.trim();
  if (!value || value.startsWith("//")) return false;
  if (/^(?:#|\/|\.\/|\.\.\/)/.test(value)) return true;
  try {
    const parsed = new URL(value, "https://clinsight.invalid");
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const defaultComponents: Components = {
  a: ({ href, title, target, children }) =>
    isSafeLink(href) ? (
      <a href={href} title={title} target={target} rel="noreferrer noopener">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: ({ alt }) => (
    <span className="text-content-secondary">{alt || "[Image omitted]"}</span>
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
      {children}
    </th>
  ),
  td: ({ children, align, colSpan, rowSpan }) => (
    <td
      align={align}
      colSpan={colSpan}
      rowSpan={rowSpan}
      className="border-b border-border-subtle px-3 py-2 align-top text-content-default"
    >
      {children}
    </td>
  ),
  pre: ({ children }) => (
    <pre className="my-3 max-w-full overflow-x-auto rounded-lg bg-canvas p-3 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={`${className ?? ""} rounded bg-canvas px-1 py-0.5 font-mono text-[0.92em]`}
    >
      {children}
    </code>
  ),
  input: ({ checked }) => (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      disabled
      readOnly
      aria-label={checked ? "Completed task" : "Incomplete task"}
      className="mr-1 align-middle accent-action"
    />
  ),
};

const RichContent: React.FC<RichContentProps> = ({
  content,
  format = "markdown",
  className = "",
  components,
  showSource = false,
}) => {
  const contentId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (format === "plain") {
    return (
      <div className={`whitespace-pre-wrap break-words ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`prose prose-sm max-w-none break-words text-content-default prose-headings:text-content-strong prose-a:text-action prose-strong:text-content-strong ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={
          format === "html"
            ? [remarkHtmlFragment(content)]
            : [remarkGfm, remarkBreaks, remarkMath, remarkClinicalMath]
        }
        rehypePlugins={[
          rehypeRaw,
          rehypeInlineHtmlMath,
          [
            rehypeSanitize,
            {
              ...clinicalSanitizeSchema,
              clobberPrefix: `clinical-${contentId}-`,
            },
          ],
          [
            rehypeKatex,
            {
              strict: false,
              throwOnError: false,
              trust: false,
              maxExpand: 1000,
            },
          ],
        ]}
        components={{ ...defaultComponents, ...components }}
      >
        {format === "markdown" ? normalizeLatexDelimiters(content) : content}
      </ReactMarkdown>
      {showSource && (
        <details className="mt-2 text-xs text-content-muted">
          <summary className="w-fit cursor-pointer hover:text-content-primary">
            View source
          </summary>
          <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border-subtle bg-canvas p-3 font-mono text-[11px] text-content-secondary">
            {content}
          </pre>
        </details>
      )}
    </div>
  );
};

export default RichContent;
