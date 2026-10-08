/** Converts edited reference text into the same unnumbered list stored on chart entries. */
export const parseReferenceList = (value: string): string[] =>
  value
    .split("\n")
    .map((reference) => reference.trim())
    .filter((reference) => reference !== "")
    .map((reference) => reference.replace(/^(\[\d+\]|\d+\.|\*|-)\s*/, ""));
