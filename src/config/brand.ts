export type BrandShape =
  | {
      readonly tag: "path";
      readonly d: string;
      readonly paint: "mint" | "teal";
      readonly cutout?: boolean;
    }
  | {
      readonly tag: "circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
      readonly paint: "teal";
    };

export interface BrandDefinition {
  readonly name: string;
  readonly tagline: string;
  readonly palette: {
    readonly mint: string;
    readonly teal: string;
    readonly tealDark: string;
    readonly wordmark: string;
    readonly wordmarkDark: string;
  };
  readonly mark: {
    readonly viewBox: string;
    readonly cutout: {
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };
    readonly shapes: readonly BrandShape[];
  };
}

export const BRAND = {
  name: "Clinsight",
  tagline: "Intelligent Medical Charting",
  palette: {
    mint: "#5EDBC5",
    teal: "#008F87",
    tealDark: "#26B8AA",
    wordmark: "#0B2030",
    wordmarkDark: "#F4FAF9",
  },
  mark: {
    viewBox: "0 0 224 240",
    cutout: { cx: 112, cy: 148, r: 32 },
    shapes: [
      {
        tag: "path",
        d: "M146 28 H88 A60 60 0 0 0 88 148",
        paint: "mint",
        cutout: true,
      },
      {
        tag: "path",
        d: "M112 88 H136 A60 60 0 0 1 136 208 H80",
        paint: "teal",
      },
      { tag: "circle", cx: 112, cy: 148, r: 20, paint: "teal" },
    ],
  },
} as const satisfies BrandDefinition;

export function escapeBrandHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export function serializeBrandMark(
  brand: BrandDefinition = BRAND,
  options: {
    theme?: "light" | "dark";
    colorMode?: "full" | "mono";
    color?: string;
    idPrefix?: string;
    accessible?: boolean;
  } = {},
): string {
  const {
    theme = "light",
    colorMode = "full",
    color,
    idPrefix = "clinsight",
    accessible = false,
  } = options;
  const maskId = `${idPrefix}-cutout`;
  const colorFor = (paint: BrandShape["paint"]) =>
    colorMode === "mono"
      ? (color ?? "currentColor")
      : paint === "mint"
        ? brand.palette.mint
        : theme === "dark"
          ? brand.palette.tealDark
          : brand.palette.teal;
  const shapes = brand.mark.shapes
    .map((shape) => {
      if (shape.tag === "path")
        return `<path d="${escapeBrandHtml(shape.d)}" stroke="${colorFor(shape.paint)}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"${shape.cutout ? ` mask="url(#${escapeBrandHtml(maskId)})"` : ""}/>`;
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${colorFor(shape.paint)}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="224" height="240" viewBox="${escapeBrandHtml(brand.mark.viewBox)}" fill="none"${accessible ? ` role="img" aria-label="${escapeBrandHtml(brand.name)}"` : ' aria-hidden="true"'}><defs><mask id="${escapeBrandHtml(maskId)}" x="0" y="0" width="224" height="240" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance"><rect width="224" height="240" fill="white"/><circle cx="${brand.mark.cutout.cx}" cy="${brand.mark.cutout.cy}" r="${brand.mark.cutout.r}" fill="black"/></mask></defs>${shapes}</svg>`;
}

export function brandIconDataUrl(
  brand: BrandDefinition = BRAND,
  colorMode: "full" | "mono" = "full",
): string {
  return `data:image/svg+xml,${encodeURIComponent(serializeBrandMark(brand, { colorMode, color: "#008F87", idPrefix: "favicon" }))}`;
}

export const BRAND_ICON_DATA_URL = brandIconDataUrl();
export const BRAND_MONO_ICON_DATA_URL = brandIconDataUrl(BRAND, "mono");
