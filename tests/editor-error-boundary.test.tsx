import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorErrorBoundary } from "../src/components/ui/editor/EditorErrorBoundary";

describe("EditorErrorBoundary", () => {
  it("keeps the owning workflow alive when an editor fails to render", () => {
    const error = new Error("Editor chunk unavailable");
    const source = String.raw`Dose: 5 mg\nTake with food.`;
    const onChange = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function BrokenEditor(): never {
      throw error;
    }

    try {
      render(
        <EditorErrorBoundary
          fallback={(caughtError) => (
            <div>
              <p role="status">The enhanced editor could not load.</p>
              <textarea
                aria-label="Clinical note"
                value={source}
                onChange={(event) => onChange(event.currentTarget.value)}
              />
              <span>{caughtError.message}</span>
            </div>
          )}
        >
          <BrokenEditor />
        </EditorErrorBoundary>,
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        "The enhanced editor could not load.",
      );
      const plainEditor = screen.getByRole("textbox", {
        name: "Clinical note",
      });
      expect(plainEditor).toHaveValue(source);
      fireEvent.change(plainEditor, {
        target: { value: `${source} Further review required.` },
      });
      expect(onChange).toHaveBeenCalledWith(
        `${source} Further review required.`,
      );
      expect(screen.getByText("Editor chunk unavailable")).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
