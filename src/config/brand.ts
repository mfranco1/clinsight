type BrandShape =
  | { readonly tag: "path"; readonly d: string }
  | {
      readonly tag: "circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };

export interface BrandDefinition {
  readonly name: string;
  readonly tagline: string;
  readonly iconColor: string;
  readonly mark: {
    readonly viewBox: string;
    readonly strokeWidth: number;
    readonly shapes: readonly BrandShape[];
  };
}

export const BRAND = {
  name: "ClinSight",
  tagline: "Intelligent Medical Charting",
  // Browser icons cannot inherit CSS tokens. Matches --clinical-action.
  iconColor: "#0d9488",
  mark: {
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    shapes: [
      {
        tag: "path",
        d: "M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3",
      },
      { tag: "path", d: "M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" },
      { tag: "circle", cx: 20, cy: 10, r: 2 },
    ],
  },
} as const satisfies BrandDefinition;

export function escapeBrandHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function serializeBrandMark(
  brand: BrandDefinition = BRAND,
  color = "currentColor",
): string {
  const shapes = brand.mark.shapes
    .map((shape) =>
      shape.tag === "path"
        ? `<path d="${escapeBrandHtml(shape.d)}"/>`
        : `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${escapeBrandHtml(brand.mark.viewBox)}" fill="none" stroke="${escapeBrandHtml(color)}" stroke-width="${brand.mark.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes}</svg>`;
}

export function brandIconDataUrl(brand: BrandDefinition = BRAND): string {
  return `data:image/svg+xml,${encodeURIComponent(serializeBrandMark(brand, brand.iconColor))}`;
}

export const BRAND_ICON_DATA_URL = brandIconDataUrl();
