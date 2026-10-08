import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DocumentTextEditor } from "../src/components/ui/editor/DocumentTextEditor";
import EditableTextArea from "../src/components/ui/EditableTextArea";

const layoutDescriptors = {
  elementRects: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "getClientRects",
  ),
  elementBounds: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "getBoundingClientRect",
  ),
  rangeRects: Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getClientRects",
  ),
  rangeBounds: Object.getOwnPropertyDescriptor(
    Range.prototype,
    "getBoundingClientRect",
  ),
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "getClientRects", {
    configurable: true,
    value: () => [] as unknown as DOMRectList,
  });
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => [] as unknown as DOMRectList,
  });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
});

afterAll(() => {
  const restore = (
    prototype: object,
    property: string,
    descriptor: PropertyDescriptor | undefined,
  ) => {
    if (descriptor) Object.defineProperty(prototype, property, descriptor);
    else Reflect.deleteProperty(prototype, property);
  };
  restore(
    HTMLElement.prototype,
    "getClientRects",
    layoutDescriptors.elementRects,
  );
  restore(
    HTMLElement.prototype,
    "getBoundingClientRect",
    layoutDescriptors.elementBounds,
  );
  restore(Range.prototype, "getClientRects", layoutDescriptors.rangeRects);
  restore(
    Range.prototype,
    "getBoundingClientRect",
    layoutDescriptors.rangeBounds,
  );
});

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

  it("exposes labelled editor modes and formatting controls", async () => {
    render(
      <DocumentTextEditor
        value="Clinical note"
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    expect(
      screen.getByRole("group", { name: "Editor view mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("toolbar", { name: "Formatting" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("textbox", { name: "Clinical note" }),
    ).toHaveAttribute("aria-multiline", "true");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(
      screen.getByRole("button", { name: "Add row below" }),
    ).toBeDisabled();
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

  it("keeps an inserted table editable and serializes row operations", async () => {
    render(
      <DocumentTextEditor
        value="A clinical note."
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Insert 2 by 2 table" }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Insert 2 by 2 table" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add row below" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add row below" }));
    expect(screen.getByRole("button", { name: "visual" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "source" }));
    const sourceEditor = await screen.findByTestId("source-text-editor");
    expect(sourceEditor).toHaveTextContent("A clinical note.");
    const serialized = sourceEditor
      .closest(".cm-editor")
      ?.getAttribute("data-print-text");
    expect(
      serialized
        ?.split("\n")
        .filter((line) => line.trimStart().startsWith("|")),
    ).toHaveLength(4);
  });

  it("supports save and cancel shortcuts without acting during IME composition", async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(
      <DocumentTextEditor
        value="Clinical note"
        onChange={vi.fn()}
        onSave={onSave}
        onCancel={onCancel}
        ariaLabel="Clinical note"
      />,
    );

    const editor = await screen.findByRole("textbox", {
      name: "Clinical note",
    });
    fireEvent.keyDown(editor, {
      key: "Enter",
      ctrlKey: true,
      isComposing: true,
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
    expect(onSave).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(editor, { key: "Escape", isComposing: true });
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("applies the HTML paste sanitizer inside the visual editor", async () => {
    render(
      <DocumentTextEditor
        value=""
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        ariaLabel="Clinical note"
      />,
    );

    const editor = await screen.findByRole("textbox", {
      name: "Clinical note",
    });
    editor.focus();
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        types: ["text/html", "text/plain"],
        getData: (type: string) => {
          if (type === "text/html") {
            return '<p><strong>Safe value</strong><img src="https://example.test/pixel" alt="image note"><script>unsafe()</script></p>';
          }
          return type === "text/plain" ? "Safe value image note" : "";
        },
      },
    });
    fireEvent(editor, pasteEvent);

    await waitFor(() =>
      expect(editor.querySelector("strong")).toHaveTextContent("Safe value"),
    );
    expect(editor.querySelector("script, img")).toBeNull();
    expect(editor).toHaveTextContent("image note");
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
      ).toHaveTextContent("$x$"),
    );
    expect(
      screen.queryByRole("button", { name: "Bold" }),
    ).not.toBeInTheDocument();
  });
});
