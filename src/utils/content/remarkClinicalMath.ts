interface TextNode {
  type: string;
  value?: string;
  children?: TextNode[];
  [key: string]: unknown;
}

const slash = String.fromCharCode(92);
const displayOpen = `${slash}[`;
const displayClose = `${slash}]`;
const inlineOpen = `${slash}(`;
const inlineClose = `${slash})`;
const nakedMathToken =
  /\\(?:textit|textbf|text|frac|lim|mathbb|sum|oint|gamma|pi|alpha|beta|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|times|cdot|pm|approx|neq|le|ge|leq|geq|rightarrow|Rightarrow|leftarrow|Leftarrow|infty|partial|nabla|degree|perp|parallel|exists|forall)(?:\s*\{[^{}]*\})?|[A-Za-z0-9]+(?:[_^](?:\{[^{}]*\}|[A-Za-z0-9+-]+))+/g;

export const normalizeLatexDelimiters = (source: string) => {
  const lines = source.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  let fence: { marker: string; length: number } | null = null;
  let inDisplayMath = false;
  let inlineCodeTicks = 0;
  return lines
    .map((line) => {
      const fenceLine = line.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (
          fenceLine?.[1][0] === fence.marker &&
          fenceLine[1].length >= fence.length
        )
          fence = null;
        return line;
      }
      if (fenceLine) {
        fence = { marker: fenceLine[1][0], length: fenceLine[1].length };
        return line;
      }
      if (inDisplayMath) {
        const end = line.indexOf(displayClose);
        if (end < 0) return line;
        inDisplayMath = false;
        return `${line.slice(0, end)}$$${line.slice(end + displayClose.length)}`;
      }

      let output = "";
      let index = 0;
      if (inlineCodeTicks > 0) {
        const marker = "`".repeat(inlineCodeTicks);
        const close = line.indexOf(marker);
        if (close < 0) return line;
        output = line.slice(0, close + inlineCodeTicks);
        index = close + inlineCodeTicks;
        inlineCodeTicks = 0;
      }
      while (index < line.length) {
        if (inDisplayMath) {
          const close = line.indexOf(displayClose, index);
          if (close < 0) {
            output += line.slice(index);
            index = line.length;
            continue;
          }
          output += `${line.slice(index, close)}$$`;
          index = close + displayClose.length;
          inDisplayMath = false;
          continue;
        }
        if (line[index] === "`") {
          let ticks = 1;
          while (line[index + ticks] === "`") ticks += 1;
          const marker = "`".repeat(ticks);
          const close = line.indexOf(marker, index + ticks);
          if (close >= 0) {
            output += line.slice(index, close + ticks);
            index = close + ticks;
            continue;
          }
          inlineCodeTicks = ticks;
          output += line.slice(index);
          index = line.length;
          continue;
        }
        if (line[index] === "<") {
          let cursor = index + 1;
          let quote = "";
          while (cursor < line.length) {
            const character = line[cursor];
            if (quote) {
              if (character === quote) quote = "";
            } else if (character === '"' || character === "'") {
              quote = character;
            } else if (character === ">") {
              cursor += 1;
              break;
            }
            cursor += 1;
          }
          if (cursor <= line.length && line[cursor - 1] === ">") {
            output += line.slice(index, cursor);
            index = cursor;
            continue;
          }
        }
        if (line.startsWith(displayOpen, index)) {
          output += "$$";
          index += displayOpen.length;
          inDisplayMath = true;
          continue;
        }
        if (line.startsWith(inlineOpen, index)) {
          const close = line.indexOf(inlineClose, index + inlineOpen.length);
          if (close >= 0) {
            output += `$${line.slice(index + inlineOpen.length, close)}$`;
            index = close + inlineClose.length;
            continue;
          }
        }
        output += line[index];
        index += 1;
      }
      return output;
    })
    .join("");
};

/** Adds the LaTeX `\(...\)` and `\[...\]` delimiters used in clinical text. */
const remarkClinicalMath = () => (tree: TextNode) => {
  const transform = (node: TextNode) => {
    if (!node.children) return;
    const children: TextNode[] = [];
    for (const child of node.children) {
      if (child.type !== "text" || typeof child.value !== "string") {
        transform(child);
        children.push(child);
        continue;
      }

      const value = child.value;
      let cursor = 0;
      const appendPlain = (text: string) => {
        let plainCursor = 0;
        for (const match of text.matchAll(nakedMathToken)) {
          const index = match.index ?? 0;
          if (index > plainCursor)
            children.push({
              type: "text",
              value: text.slice(plainCursor, index),
            });
          children.push({ type: "inlineMath", value: match[0] });
          plainCursor = index + match[0].length;
        }
        if (plainCursor < text.length)
          children.push({ type: "text", value: text.slice(plainCursor) });
      };
      while (cursor < value.length) {
        const displayIndex = value.indexOf(displayOpen, cursor);
        const inlineIndex = value.indexOf(inlineOpen, cursor);
        const useDisplay =
          displayIndex >= 0 && (inlineIndex < 0 || displayIndex < inlineIndex);
        const openIndex = useDisplay ? displayIndex : inlineIndex;
        if (openIndex < 0) {
          appendPlain(value.slice(cursor));
          cursor = value.length;
          break;
        }
        const open = useDisplay ? displayOpen : inlineOpen;
        const close = useDisplay ? displayClose : inlineClose;
        const closeIndex = value.indexOf(close, openIndex + open.length);
        if (
          closeIndex < 0 ||
          (!useDisplay && value.slice(openIndex, closeIndex).includes("\n"))
        ) {
          appendPlain(value.slice(cursor));
          cursor = value.length;
          break;
        }
        if (openIndex > cursor) appendPlain(value.slice(cursor, openIndex));
        children.push({
          type: useDisplay ? "math" : "inlineMath",
          value: value.slice(openIndex + open.length, closeIndex),
        });
        cursor = closeIndex + close.length;
      }
      if (cursor === 0) children.push(child);
    }
    node.children = children;
  };

  transform(tree);
};

export default remarkClinicalMath;
