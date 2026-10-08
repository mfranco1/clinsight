import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

class TestMediaRecorder {
  static latest: TestMediaRecorder | null = null;
  state: RecordingState = "inactive";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(private readonly stream: MediaStream) {
    TestMediaRecorder.latest = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"]) } as BlobEvent);
    this.onstop?.();
  }
}

describe("useAudioRecorder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hands recorded webm audio to the caller and releases the microphone stream", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    vi.stubGlobal("MediaRecorder", TestMediaRecorder);
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(navigator), {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      }),
    );
    const onAudioReady = vi.fn();
    const { result } = renderHook(() =>
      useAudioRecorder({ onAudioReady, onError: vi.fn() }),
    );

    await act(async () => result.current.startRecording());
    expect(result.current.isRecording).toBe(true);
    act(() => result.current.stopRecording());

    await waitFor(() => expect(onAudioReady).toHaveBeenCalledOnce());
    expect(onAudioReady.mock.calls[0][0]).toMatchObject({
      type: "audio/webm",
      size: 5,
    });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(result.current.isRecording).toBe(false);
  });

  it("releases an active stream when its owner unmounts", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    vi.stubGlobal("MediaRecorder", TestMediaRecorder);
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(navigator), {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      }),
    );
    const onAudioReady = vi.fn();
    const { result, unmount } = renderHook(() =>
      useAudioRecorder({ onAudioReady, onError: vi.fn() }),
    );

    await act(async () => result.current.startRecording());
    unmount();

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(onAudioReady).not.toHaveBeenCalled();
  });

  it("stops recording without transcribing when the owning panel closes", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    vi.stubGlobal("MediaRecorder", TestMediaRecorder);
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(navigator), {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      }),
    );
    const onAudioReady = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useAudioRecorder({ enabled, onAudioReady, onError: vi.fn() }),
      { initialProps: { enabled: true } },
    );

    await act(async () => result.current.startRecording());
    rerender({ enabled: false });

    expect(result.current.isRecording).toBe(false);
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(onAudioReady).not.toHaveBeenCalled();
  });
});
