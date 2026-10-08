import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DocumentTextEditor } from "../src/components/ui/editor/DocumentTextEditor";
import EditableTextArea from "../src/components/ui/EditableTextArea";

describe("DocumentTextEditor", () => {
  it("loads the visual editor for a new empty note", async () => {
    render(
      <StrictMode>
        <EditableTextArea
          value=""
          onSave={vi.fn()}
          isEditing
          editorMode="document"
          placeholder="New note"
        />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument(),
    );
  });

  it("keeps toolbar-created task lists in visual mode", async () => {
    const onChange = vi.fn();
    render(
      <DocumentTextEditor
        value="Review plan."
        onChange={onChange}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Task list" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Task list" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "visual" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("moves to source mode when a mounted editor receives unsupported content", async () => {
    const { rerender } = render(
      <DocumentTextEditor
        value="Supported note"
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "visual" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    rerender(
      <DocumentTextEditor
        value="$x$"
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "source" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "source" }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Clinical note" }),
      ).toHaveValue("$x$"),
    );
    expect(
      screen.queryByRole("button", { name: "Bold" }),
    ).not.toBeInTheDocument();
  });
});
