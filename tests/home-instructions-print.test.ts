import { describe, expect, it } from "vitest";
import { replaceSourceEditorsWithPrintText } from "../src/features/chart/components/homeInstructionsPrint";

describe("home instruction source editor printing", () => {
  it("prints the full source even when CodeMirror virtualizes off-screen lines", () => {
    const source = document.createElement("section");
    source.innerHTML = `
      <div class="cm-editor" data-print-text="Call the clinic\nif symptoms worsen." style="min-height: 120px">
        <div class="cm-line">Call the clinic</div>
      </div>`;
    const clone = source.cloneNode(true) as HTMLElement;

    replaceSourceEditorsWithPrintText(source, clone);

    expect(clone.querySelector(".cm-editor")).toBeNull();
    expect(clone.querySelector(".print-textarea")?.textContent).toBe(
      "Call the clinic\nif symptoms worsen.",
    );
    expect(clone.querySelector(".print-textarea")).toHaveStyle({
      minHeight: "120px",
    });
  });
});
