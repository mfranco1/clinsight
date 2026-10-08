import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClinicalChatInput } from "../src/components/clinical/ClinicalChatInput";

describe("ClinicalChatInput", () => {
  it("does not submit while an IME composition is being committed", () => {
    const onSubmit = vi.fn();

    render(
      <ClinicalChatInput
        value="clinical question"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        selectedFiles={[]}
        onFilesChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByPlaceholderText("Type your query..."), {
      key: "Enter",
      isComposing: true,
      keyCode: 229,
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits on Enter when the key is not part of a composition", () => {
    const onSubmit = vi.fn();

    render(
      <ClinicalChatInput
        value="clinical question"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        selectedFiles={[]}
        onFilesChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByPlaceholderText("Type your query..."), {
      key: "Enter",
      isComposing: false,
      keyCode: 13,
    });

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
