import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorErrorBoundary } from "../src/components/ui/editor/EditorErrorBoundary";

describe("EditorErrorBoundary", () => {
  it("keeps the owning workflow alive when an editor fails to render", () => {
    const error = new Error("Editor chunk unavailable");
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
            <div role="status">
              Plain editor fallback: {caughtError.message}
            </div>
          )}
        >
          <BrokenEditor />
        </EditorErrorBoundary>,
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        "Plain editor fallback: Editor chunk unavailable",
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
