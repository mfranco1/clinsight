import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useClinicalNoteResize } from "../src/features/chart/useClinicalNoteResize";

describe("useClinicalNoteResize", () => {
  it("preserves the initial height and existing viewport constraints", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1000,
    });
    const { result } = renderHook(() => useClinicalNoteResize());
    expect(result.current.height).toBe(300);

    act(() =>
      result.current.startResizing({ preventDefault: vi.fn() } as never),
    );
    act(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientY: 600 })),
    );
    expect(result.current.height).toBe(400);

    act(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientY: 850 })),
    );
    expect(result.current.height).toBe(400);
    act(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientY: 100 })),
    );
    expect(result.current.height).toBe(400);

    act(() => window.dispatchEvent(new MouseEvent("mouseup")));
    expect(result.current.isResizing).toBe(false);
  });

  it("removes pointer listeners when the hook unmounts during a resize", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(() => useClinicalNoteResize());
    act(() =>
      result.current.startResizing({ preventDefault: vi.fn() } as never),
    );
    unmount();

    expect(removeListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    );
    expect(removeListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function),
    );
  });
});
