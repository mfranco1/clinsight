import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CameraCaptureModal from "../src/components/CameraCaptureModal";

const cameraState = vi.hoisted(() => ({
  current: {
    stream: null as MediaStream | null,
    error: null as string | null,
    devices: [] as MediaDeviceInfo[],
    selectedDeviceId: "",
    setSelectedDeviceId: vi.fn(),
    startCamera: vi.fn(),
  },
}));

vi.mock("../src/hooks/useCameraCapture", () => ({
  useCameraCapture: () => cameraState.current,
}));

describe("CameraCaptureModal", () => {
  beforeEach(() => {
    cameraState.current = {
      stream: { getTracks: () => [] } as unknown as MediaStream,
      error: null,
      devices: [
        { deviceId: "rear", kind: "videoinput" },
        { deviceId: "front", kind: "videoinput" },
      ] as MediaDeviceInfo[],
      selectedDeviceId: "rear",
      setSelectedDeviceId: vi.fn(),
      startCamera: vi.fn(),
    };
  });

  it("uses the shared dialog while preserving camera controls and close policy", () => {
    const onClose = vi.fn();

    render(<CameraCaptureModal isOpen onClose={onClose} onCapture={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Capture Attachment" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Camera device" })).toHaveValue(
      "rear",
    );
    expect(screen.getByRole("button", { name: "Capture Photo" })).toBeEnabled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
