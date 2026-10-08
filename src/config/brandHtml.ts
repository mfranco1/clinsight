import {
  BRAND,
  brandIconDataUrl,
  escapeBrandHtml,
  serializeBrandMark,
  type BrandDefinition,
} from "./brand";

// Used by Vite in both development and production, before React is available.
export function transformBrandHtml(
  html: string,
  brand: BrandDefinition = BRAND,
): string {
  const replacements: Record<string, string> = {
    "%BRAND_NAME%": escapeBrandHtml(brand.name),
    "%BRAND_ICON%": escapeBrandHtml(brandIconDataUrl(brand)),
    "%BRAND_BOOTSTRAP_MARK%": serializeBrandMark(brand).replace(
      "<svg ",
      '<svg class="app-bootstrap__logo" ',
    ),
    "%BRAND_LOADING%": escapeBrandHtml(`Loading ${brand.name}…`),
  };
  return html.replace(/%BRAND_[A-Z_]+%/g, (placeholder) => {
    if (!(placeholder in replacements))
      throw new Error(`Unknown brand placeholder: ${placeholder}`);
    return replacements[placeholder];
  });
}
