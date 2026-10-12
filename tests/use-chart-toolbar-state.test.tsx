import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChartToolbarState } from "../src/features/chart/useChartToolbarState";

describe("useChartToolbarState", () => {
  it("closes its inline action menu on outside clicks and cleans up the listener", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { result, unmount } = renderHook(() => useChartToolbarState());
    result.current.menuRef.current = document.createElement("div");

    act(() => {
      result.current.setIsMenuOpen(true);
      result.current.setIsManageOpen(true);
      result.current.setIsHistoryCollapsed(true);
      result.current.setIsMobileHistoryOpen(true);
    });
    expect(result.current.isHistoryCollapsed).toBe(true);
    expect(result.current.isMobileHistoryOpen).toBe(true);

    act(() => document.dispatchEvent(new MouseEvent("mousedown")));
    expect(result.current.isMenuOpen).toBe(false);
    expect(result.current.isManageOpen).toBe(true);

    unmount();
    expect(removeListener).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
  });
});
