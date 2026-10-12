import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SmartAppendOverlay from "../src/features/chart/components/SmartAppendOverlay";
import { transcribeAudio } from "../src/services/ai/actions";

const recorderActions = vi.hoisted(() => ({
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  onAudioReady: null as null | ((audio: Blob) => Promise<void>),
}));

vi.mock("../src/hooks/useAudioRecorder", () => ({
  useAudioRecorder: (options: {
    onAudioReady: (audio: Blob) => Promise<void>;
  }) => {
    recorderActions.onAudioReady = options.onAudioReady;
    return {
      isRecording: false,
      startRecording: recorderActions.startRecording,
      stopRecording: recorderActions.stopRecording,
    };
  },
}));

vi.mock("../src/services/ai/actions", () => ({
  transcribeAudio: vi.fn(),
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
  it("keeps the draft and shows safe recovery feedback when integration fails", async () => {
    const onIntegrate = vi
      .fn()
      .mockRejectedValue(new Error("provider details"));
    render(
      <SmartAppendOverlay
        suggestions={["Add a follow-up plan"]}
        sectionTitle="Plan"
        onCancel={vi.fn()}
        onIntegrate={onIntegrate}
      />,
    );
    const draft = screen.getByRole("textbox", { name: "Append text" });
    fireEvent.change(draft, { target: { value: "Keep the original draft." } });
    fireEvent.click(screen.getByRole("button", { name: "Merge into Chart" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not merge this information",
    );
    expect(draft).toHaveValue("Keep the original draft.");
    expect(screen.queryByText("provider details")).not.toBeInTheDocument();
  });

  it("shows safe feedback when dictation fails", async () => {
    vi.mocked(transcribeAudio).mockRejectedValueOnce(
      new Error("provider details"),
    );
    render(
      <SmartAppendOverlay
        suggestions={["Add a follow-up plan"]}
        sectionTitle="Plan"
        onCancel={vi.fn()}
        onIntegrate={vi.fn()}
      />,
    );

    await act(async () => {
      await recorderActions.onAudioReady?.(new Blob(["synthetic audio"]));
    });

    expect(
      await screen.findByText(/Could not transcribe audio/),
    ).toBeInTheDocument();
    expect(screen.queryByText("provider details")).not.toBeInTheDocument();
  });

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
