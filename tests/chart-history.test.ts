import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartEntry } from "../types";
import {
  filterChartHistory,
  paginateChartHistory,
} from "../features/chart/history";
import { useChartHistoryNavigation } from "../features/chart/useChartHistoryNavigation";

const entries: ChartEntry[] = [
  {
    id: "raw",
    date: "2026-01-01",
    title: "Admission - pediatrics",
    type: "Admission",
    entryType: "raw",
    rawText: "fever and cough",
    specialization: "Pediatrics",
  },
  {
    id: "soap",
    date: "2026-02-01",
    title: "Progress - review",
    type: "Progress",
    entryType: "structured",
    soap: { assessment: { summary: "improving cough" } } as ChartEntry["soap"],
    specialization: "Family Medicine",
  },
  {
    id: "other",
    date: "2026-03-01",
    title: "Progress - follow-up",
    type: "Progress",
    entryType: "raw",
    rawText: "stable",
    specialization: "Pediatrics",
  },
];

describe("chart history selectors", () => {
  it("filters search, type, inclusive dates, and specialization together", () => {
    expect(
      filterChartHistory(entries, {
        searchQuery: "cough",
        typeFilter: "Admission",
        startDate: "2026-01-01",
        endDate: "2026-01-01",
        selectedSpecializations: ["Pediatrics"],
      }).map((entry) => entry.id),
    ).toEqual(["raw"]);
  });

  it("paginates without changing source order", () => {
    expect(
      paginateChartHistory(entries, 2, 2).map((entry) => entry.id),
    ).toEqual(["other"]);
    expect(entries.map((entry) => entry.id)).toEqual(["raw", "soap", "other"]);
  });
});

describe("useChartHistoryNavigation", () => {
  it("keeps active-entry pagination and filter changes in sync", () => {
    const longHistory = Array.from({ length: 12 }, (_, index) => ({
      ...entries[0],
      id: `entry-${index}`,
      title: `Admission ${index}`,
    }));
    const { result } = renderHook(() =>
      useChartHistoryNavigation(longHistory, "entry-10"),
    );

    expect(result.current.historyCurrentPage).toBe(2);
    expect(result.current.paginatedHistory.map((entry) => entry.id)).toEqual([
      "entry-10",
      "entry-11",
    ]);

    act(() => result.current.setSearchQuery("Admission 0"));
    expect(result.current.filteredHistory.map((entry) => entry.id)).toEqual([
      "entry-0",
    ]);
    expect(result.current.historyCurrentPage).toBe(1);
  });
});
