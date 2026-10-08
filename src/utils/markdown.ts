export const arrayToMarkdownBullets = (
  val: string[] | string | undefined | null,
): string => {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .map((item) =>
        item.startsWith("-") || item.startsWith("*") ? item : `- ${item}`,
      )
      .join("\n");
  }
  return val;
};

/**
 * Parses/splits a markdown bulleted list string into an array of clean string items.
 */
export const markdownBulletsToArray = (
  text: string | null | undefined,
): string[] => {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      // Clean off bullet prefixes like "- ", "* ", "1. ", etc.
      return line.replace(/^([-\*\+]\s+|\d+\.\s*)/, "").trim();
    })
    .filter((line) => line !== "");
};
