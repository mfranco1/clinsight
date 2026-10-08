import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatPanelResize } from "../src/features/chat/useChatPanelResize";

describe("useChatPanelResize", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  it("tracks the existing desktop breakpoint and resets resize listeners and body styles on cleanup", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 640,
    });
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(() => useChatPanelResize());

    expect(result.current.isDesktop).toBe(false);
    act(() => window.dispatchEvent(new Event("resize")));
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current.isDesktop).toBe(true);

    act(() =>
      result.current.startResizing({ preventDefault: vi.fn() } as never),
    );
    expect(document.body.style.cursor).toBe("ew-resize");
    unmount();

    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    );
    expect(removeListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function),
    );
    expect(document.body.style.cursor).toBe("");
    expect(document.body.style.userSelect).toBe("");
  });

  it("resizes within the existing minimum and maximum constraints", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1440,
    });
    const { result } = renderHook(() => useChatPanelResize());
    expect(result.current.sidebarWidth).toBe(400);

    act(() =>
      result.current.startResizing({ preventDefault: vi.fn() } as never),
    );
    act(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 900 })),
    );
    expect(result.current.sidebarWidth).toBe(540);

    act(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300 })),
    );
    expect(result.current.sidebarWidth).toBe(540);
    act(() => window.dispatchEvent(new MouseEvent("mouseup")));
  });
});
