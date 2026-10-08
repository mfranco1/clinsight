import { describe, expect, it } from "vitest";
import { sanitizeDocumentPasteHtml } from "../src/components/ui/editor/sanitizeDocumentPaste";

describe("sanitizeDocumentPasteHtml", () => {
  it("keeps supported formatting and safe links but strips active attributes", () => {
    const sanitized = sanitizeDocumentPasteHtml(
      '<p onclick="run()"><strong>Clinical text</strong> <a href="https://clinic.example" style="color:red">reference</a></p>',
    );
    const parsed = new DOMParser().parseFromString(sanitized, "text/html");

    expect(parsed.body.innerHTML).toBe(
      '<p><strong>Clinical text</strong> <a href="https://clinic.example">reference</a></p>',
    );
    expect(parsed.body.querySelector("[onclick], [style]")).toBeNull();
  });

  it("drops active content, unsafe links, and remote images while retaining useful text", () => {
    const sanitized = sanitizeDocumentPasteHtml(
      '<div>Keep <a href="javascript:alert(1)">this text</a><img src="https://tracker.example/pixel" alt="image description"><script>ignore()</script><custom-tag>clinical value</custom-tag></div>',
    );
    const parsed = new DOMParser().parseFromString(sanitized, "text/html");

    expect(parsed.body.textContent).toBe(
      "Keep this textimage descriptionclinical value",
    );
    expect(parsed.body.querySelector("img, script, a[href]")).toBeNull();
    expect(parsed.body.innerHTML).toContain("clinical value");
  });

  it("retains basic table structure and bounded cell spans", () => {
    const sanitized = sanitizeDocumentPasteHtml(
      '<table><tbody><tr><td rowspan="2" colspan="99">Value</td><th colspan="2">Header</th></tr></tbody></table>',
    );
    const parsed = new DOMParser().parseFromString(sanitized, "text/html");

    expect(parsed.body.querySelector("td")?.getAttribute("rowspan")).toBe("2");
    expect(parsed.body.querySelector("td")?.getAttribute("colspan")).toBeNull();
    expect(parsed.body.querySelector("th")?.getAttribute("colspan")).toBe("2");
  });
});
