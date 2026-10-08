import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import NoteContentArea from "../src/features/notes/components/NoteContentArea";

const rangeLayoutDescriptors = {
  getClientRects: Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getClientRects",
  ),
  getBoundingClientRect: Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getBoundingClientRect",
  ),
};

beforeAll(() => {
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => [],
  });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
});

afterAll(() => {
  for (const [property, descriptor] of Object.entries(rangeLayoutDescriptors)) {
    if (descriptor)
      Object.defineProperty(Range.prototype, property, descriptor);
    else Reflect.deleteProperty(Range.prototype, property);
  }
});

describe("NoteContentArea", () => {
  it("preserves an untouched supported Markdown note during visual-editor setup", async () => {
    const source = "## Assessment\n\nFindings are **stable**.";
    const handleSave = vi.fn();

    render(
      <NoteContentArea
        content={source}
        isEditing={true}
        setIsEditing={vi.fn()}
        handleSave={handleSave}
        handleCancel={vi.fn()}
        onUpload={vi.fn()}
        fileInputRef={{ current: null }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: /visual/i }, { timeout: 5000 }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await screen.findByRole("button", { name: "Bold" }, { timeout: 5000 }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(handleSave).toHaveBeenCalledWith(source);
  });

  it("keeps math-containing notes in source mode with a clear fallback explanation", async () => {
    render(
      <NoteContentArea
        content="Math: $a^2+b^2=c^2$"
        isEditing={true}
        setIsEditing={vi.fn()}
        handleSave={vi.fn()}
        handleCancel={vi.fn()}
        onUpload={vi.fn()}
        fileInputRef={{ current: null }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: /visual/i }, { timeout: 5000 }),
    ).toBeDisabled();
    expect(
      screen.getByText(/LaTeX remains in source mode/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /source/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses the source editor for note edits and keeps the note save action", () => {
    const handleSave = vi.fn();

    render(
      <NoteContentArea
        content={String.raw`Note with literal \n text`}
        isEditing={true}
        setIsEditing={vi.fn()}
        handleSave={handleSave}
        handleCancel={vi.fn()}
        onUpload={vi.fn()}
        fileInputRef={{ current: null }}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "Start typing your note here... (Supports Markdown and LaTeX)",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(handleSave).toHaveBeenCalledWith(
      String.raw`Note with literal \n text`,
    );
  });

  it("keeps the edit attachment control and forwards selected files", () => {
    const onUpload = vi.fn();
    const file = new File(["image"], "clinical.png", { type: "image/png" });

    const { container } = render(
      <NoteContentArea
        content="Clinical note"
        isEditing={true}
        setIsEditing={vi.fn()}
        handleSave={vi.fn()}
        handleCancel={vi.fn()}
        onUpload={onUpload}
        fileInputRef={{ current: null }}
      />,
    );

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput!, {
      target: { files: [file] },
    });

    expect(screen.getByRole("button", { name: /attach/i })).toBeInTheDocument();
    expect(onUpload).toHaveBeenCalledWith(
      expect.objectContaining({ length: 1 }),
    );
  });
});
