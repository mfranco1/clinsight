import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChartToolbarState } from "../src/features/chart/useChartToolbarState";

describe("useChartToolbarState", () => {
  it("keeps independent toolbar and history state in the hook", () => {
    const { result } = renderHook(() => useChartToolbarState());

    act(() => {
      result.current.setIsMenuOpen(true);
      result.current.setIsManageOpen(true);
      result.current.setIsHistoryCollapsed(true);
      result.current.setIsMobileHistoryOpen(true);
    });
    expect(result.current.isHistoryCollapsed).toBe(true);
    expect(result.current.isMobileHistoryOpen).toBe(true);

    expect(result.current.isMenuOpen).toBe(true);
    expect(result.current.isManageOpen).toBe(true);
  });
});
