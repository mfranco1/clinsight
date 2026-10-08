import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCameraCapture } from "../hooks/useCameraCapture";

describe("useCameraCapture", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts the default camera and releases its tracks when closed", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(navigator), {
        mediaDevices: {
          getUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
      }),
    );
    const { result, rerender } = renderHook(
      ({ isOpen }) => useCameraCapture(isOpen),
      {
        initialProps: { isOpen: true },
      },
    );

    await waitFor(() => expect(result.current.stream).toBe(stream));
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
    act(() => rerender({ isOpen: false }));

    await waitFor(() => expect(result.current.stream).toBeNull());
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it("stops a stream that resolves after the modal closes", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    let resolveStream: ((value: MediaStream) => void) | undefined;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    );
    vi.stubGlobal(
      "navigator",
      Object.assign(Object.create(navigator), {
        mediaDevices: {
          getUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
      }),
    );
    const { result, rerender } = renderHook(
      ({ isOpen }) => useCameraCapture(isOpen),
      {
        initialProps: { isOpen: true },
      },
    );

    act(() => rerender({ isOpen: false }));
    await act(async () => resolveStream?.(stream));

    expect(result.current.stream).toBeNull();
    expect(stopTrack).toHaveBeenCalledOnce();
  });
});
