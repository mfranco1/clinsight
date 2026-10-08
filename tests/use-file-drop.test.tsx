import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DragEvent } from "react";
import { useFileDrop } from "../hooks/useFileDrop";

const createDropEvent = (files: File[]) =>
  ({
    preventDefault: vi.fn(),
    dataTransfer: { files },
  }) as unknown as DragEvent<HTMLElement>;

describe("useFileDrop", () => {
  it("tracks drag state and forwards dropped files", () => {
    const onFilesDrop = vi.fn();
    const file = new File(["image"], "scan.png", { type: "image/png" });
    const { result } = renderHook(() => useFileDrop({ onFilesDrop }));
    const overEvent = createDropEvent([]);

    act(() => result.current.onDragOver(overEvent));
    expect(overEvent.preventDefault).toHaveBeenCalledOnce();
    expect(result.current.isDragging).toBe(true);

    const dropEvent = createDropEvent([file]);
    act(() => result.current.onDrop(dropEvent));
    expect(dropEvent.preventDefault).toHaveBeenCalledOnce();
    expect(onFilesDrop).toHaveBeenCalledWith([file]);
    expect(result.current.isDragging).toBe(false);
  });

  it("prevents page navigation but ignores files when the drop target is disabled", () => {
    const onFilesDrop = vi.fn();
    const file = new File(["image"], "scan.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useFileDrop({ enabled: false, onFilesDrop }),
    );
    const overEvent = createDropEvent([]);
    const dropEvent = createDropEvent([file]);

    act(() => result.current.onDragOver(overEvent));
    act(() => result.current.onDrop(dropEvent));

    expect(overEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dropEvent.preventDefault).toHaveBeenCalledOnce();
    expect(result.current.isDragging).toBe(false);
    expect(onFilesDrop).not.toHaveBeenCalled();
  });
});
