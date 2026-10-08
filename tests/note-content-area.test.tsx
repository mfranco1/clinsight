import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NoteContentArea from "../features/notes/components/NoteContentArea";

describe("NoteContentArea", () => {
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
