import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SmartAppendOverlay from "../src/features/chart/components/SmartAppendOverlay";

const recorderActions = vi.hoisted(() => ({
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
}));

vi.mock("../src/hooks/useAudioRecorder", () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    startRecording: recorderActions.startRecording,
    stopRecording: recorderActions.stopRecording,
  }),
}));

vi.mock("../src/components/ui/EditableTextArea", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <textarea
      aria-label="Append text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe("SmartAppendOverlay", () => {
  it("uses a responsive shared dialog and keeps workflow actions feature-owned", async () => {
    const onCancel = vi.fn();
    const onIntegrate = vi.fn().mockResolvedValue(undefined);

    render(
      <SmartAppendOverlay
        suggestions={["Add a follow-up plan"]}
        sectionTitle="Plan"
        onCancel={onCancel}
        onIntegrate={onIntegrate}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Adding to Plan" })).toHaveClass(
      "bottom-0",
      "pb-[env(safe-area-inset-bottom)]",
    );
    expect(screen.getByText("Add a follow-up plan")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Merge into Chart" }),
    ).toBeDisabled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: "Append text" }), {
      target: { value: "Start physical therapy next week." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Merge into Chart" }));

    expect(onIntegrate).toHaveBeenCalledWith(
      "Start physical therapy next week.",
    );
  });
});
