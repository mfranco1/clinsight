/** Replace source-editor chrome with the exact visible text before cloning a print view. */
export function replaceSourceEditorsWithPrintText(
  source: HTMLElement,
  clone: HTMLElement,
) {
  const sourceEditors = source.querySelectorAll<HTMLElement>(".cm-editor");
  const clonedEditors = clone.querySelectorAll<HTMLElement>(".cm-editor");

  sourceEditors.forEach((sourceEditor, index) => {
    const clonedEditor = clonedEditors[index];
    if (!clonedEditor) return;

    const printedText = document.createElement("div");
    printedText.className = "print-textarea";
    printedText.textContent = Array.from(
      sourceEditor.querySelectorAll(".cm-line"),
      (line) => line.textContent ?? "",
    ).join("\n");
    printedText.style.minHeight = sourceEditor.style.minHeight;
    clonedEditor.replaceWith(printedText);
  });
}
