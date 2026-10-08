import { useEffect, useMemo, useState } from "react";
import type { ChartEntry } from "../../types";
import { filterChartHistory, paginateChartHistory } from "./history";

export type ChartHistoryTypeFilter = "All" | "Admission" | "Progress";

export function useChartHistoryNavigation(
  history: ChartEntry[],
  activeEntryId: string,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ChartHistoryTypeFilter>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  const filteredHistory = useMemo(
    () =>
      filterChartHistory(history, {
        searchQuery,
        typeFilter,
        startDate,
        endDate,
        selectedSpecializations: selectedSpecs,
      }),
    [history, searchQuery, typeFilter, startDate, endDate, selectedSpecs],
  );

  const totalHistoryPages = Math.ceil(
    filteredHistory.length / historyItemsPerPage,
  );
  const paginatedHistory = useMemo(
    () =>
      paginateChartHistory(
        filteredHistory,
        historyCurrentPage,
        historyItemsPerPage,
      ),
    [filteredHistory, historyCurrentPage, historyItemsPerPage],
  );

  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [searchQuery, typeFilter, startDate, endDate, selectedSpecs]);

  useEffect(() => {
    const index = filteredHistory.findIndex(
      (entry) => entry.id === activeEntryId,
    );
    if (index !== -1) {
      setHistoryCurrentPage(Math.floor(index / historyItemsPerPage) + 1);
    }
  }, [activeEntryId, filteredHistory, historyItemsPerPage]);

  return {
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    typeFilter,
    setTypeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedSpecs,
    setSelectedSpecs,
    historyCurrentPage,
    setHistoryCurrentPage,
    historyItemsPerPage,
    setHistoryItemsPerPage,
    filteredHistory,
    totalHistoryPages,
    paginatedHistory,
  };
}
