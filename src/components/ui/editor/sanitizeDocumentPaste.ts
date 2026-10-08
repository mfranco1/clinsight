const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DEL",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "I",
  "LI",
  "OL",
  "P",
  "S",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "U",
  "UL",
]);

const discardedTags = new Set([
  "EMBED",
  "IFRAME",
  "OBJECT",
  "SCRIPT",
  "STYLE",
  "SVG",
  "TEMPLATE",
]);

/** Keep supported formatting, strip active attributes/content, and never paste images. */
export function sanitizeDocumentPasteHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const output = document.createElement("div");

  for (const node of Array.from(parsed.body.childNodes)) {
    const sanitized = sanitizeNode(node, parsed);
    if (sanitized) output.append(sanitized);
  }

  return output.innerHTML;
}

function sanitizeNode(node: Node, owner: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return owner.createTextNode(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const element = node as Element;
  const tagName = element.tagName;
  if (discardedTags.has(tagName)) return null;
  if (tagName === "INPUT") {
    if (element.getAttribute("type")?.toLowerCase() !== "checkbox") return null;
    const checkbox = owner.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    if (element.hasAttribute("checked")) checkbox.setAttribute("checked", "");
    return checkbox;
  }
  if (tagName === "IMG") {
    return owner.createTextNode(element.getAttribute("alt") ?? "");
  }

  const children = Array.from(element.childNodes)
    .map((child) => sanitizeNode(child, owner))
    .filter((child): child is Node => child !== null);

  if (!allowedTags.has(tagName)) {
    const unwrapped = owner.createDocumentFragment();
    unwrapped.append(...children);
    return unwrapped;
  }

  const safeElement = owner.createElement(tagName.toLowerCase());
  if (tagName === "A") {
    const href = safeHref(element.getAttribute("href"));
    if (href) safeElement.setAttribute("href", href);
  }
  if (tagName === "TD" || tagName === "TH") {
    for (const attribute of ["colspan", "rowspan"] as const) {
      const value = element.getAttribute(attribute);
      const span = value ? Number(value) : 1;
      if (Number.isInteger(span) && span >= 1 && span <= 20 && value) {
        safeElement.setAttribute(attribute, String(span));
      }
    }
  }
  safeElement.append(...children);
  return safeElement;
}

function safeHref(href: string | null) {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("//")) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^(\/|\.\/|\.\.\/|#)/.test(trimmed)) return trimmed;
  return null;
}
