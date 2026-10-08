import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import EditableTextArea from "../src/components/ui/EditableTextArea";

describe("EditableTextArea", () => {
  it("preserves literal escape sequences when saving an untouched value", () => {
    const source = String.raw`First line\nSecond line`;
    const onSave = vi.fn();

    render(<EditableTextArea value={source} onSave={onSave} />);

    fireEvent.click(screen.getByTitle("Edit"));
    expect(screen.getByRole("textbox")).toHaveValue(source);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(source);
  });

  it("preserves real line breaks and labels the editing field", () => {
    const source = "First line\nSecond line";

    render(<EditableTextArea value={source} onSave={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Edit"));
    expect(screen.getByRole("textbox", { name: "Enter text..." })).toHaveValue(
      source,
    );
  });

  it("keeps compact fields plain and ignores save shortcuts during composition", () => {
    const onSave = vi.fn();
    render(<EditableTextArea value="Dose 5 mg" onSave={onSave} />);
    fireEvent.click(screen.getByTitle("Edit"));
    const field = screen.getByRole("textbox", { name: "Enter text..." });

    fireEvent.keyDown(field, { key: "b", ctrlKey: true });
    expect(field).toHaveValue("Dose 5 mg");
    fireEvent.keyDown(field, {
      key: "Enter",
      ctrlKey: true,
      isComposing: true,
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith("Dose 5 mg");
  });

  it("keeps a dirty edit when the source changes and offers an explicit resolution", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <EditableTextArea value="Original" onSave={onSave} />,
    );

    fireEvent.click(screen.getByTitle("Edit"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "My draft" },
    });
    rerender(<EditableTextArea value="Updated elsewhere" onSave={onSave} />);

    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This text changed elsewhere while you were editing.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Load updated text" }));
    expect(screen.getByRole("textbox")).toHaveValue("Updated elsewhere");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("accepts explicit resets from immediate-change consumers", () => {
    function ImmediateEditor() {
      const [value, setValue] = useState("");
      return (
        <>
          <EditableTextArea value={value} onChange={setValue} />
          <button onClick={() => setValue("")}>Reset</button>
        </>
      );
    }

    render(<ImmediateEditor />);
    fireEvent.click(screen.getByTitle("Edit"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "A live draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
