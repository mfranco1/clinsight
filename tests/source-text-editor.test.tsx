import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SourceTextEditor } from "../src/components/ui/editor/SourceTextEditor";

describe("SourceTextEditor", () => {
  it("mounts the exact source as an accessible multiline editor", () => {
    const source = String.raw`Clinical \n value with $\frac{1}{2}$`;
    const { container } = render(
      <SourceTextEditor
        value={source}
        onChange={vi.fn()}
        aria-label="Clinical note"
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Clinical note" }),
    ).toHaveAttribute("aria-multiline", "true");
    expect(container.querySelector(".cm-content")?.textContent).toBe(source);
  });

  it("can render in a read-only state", () => {
    const { container } = render(
      <SourceTextEditor
        value="Review only"
        onChange={vi.fn()}
        aria-label="Review text"
        disabled
      />,
    );

    expect(container.querySelector(".cm-content")).toHaveAttribute(
      "contenteditable",
      "false",
    );
  });
});
