import { ChartEntry } from "../../types";

export interface ChartHistoryFilters {
  searchQuery: string;
  typeFilter: "All" | "Admission" | "Progress";
  startDate: string;
  endDate: string;
  selectedSpecializations: string[];
}

export function filterChartHistory(
  entries: ChartEntry[],
  filters: ChartHistoryFilters,
): ChartEntry[] {
  return entries.filter((entry) => {
    const query = filters.searchQuery.toLowerCase();
    const matchesSearch =
      !filters.searchQuery ||
      entry.title.toLowerCase().includes(query) ||
      (entry.entryType === "raw"
        ? entry.rawText || ""
        : entry.soap?.assessment.summary || ""
      )
        .toLowerCase()
        .includes(query);

    const matchesType =
      filters.typeFilter === "All" ||
      (filters.typeFilter === "Admission" &&
        entry.title.includes("Admission")) ||
      (filters.typeFilter === "Progress" && entry.title.includes("Progress"));

    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const entryTime = new Date(entry.date).setHours(0, 0, 0, 0);
      if (filters.startDate) {
        const startTime = new Date(filters.startDate).setHours(0, 0, 0, 0);
        if (entryTime < startTime) matchesDate = false;
      }
      if (filters.endDate) {
        const endTime = new Date(filters.endDate).setHours(0, 0, 0, 0);
        if (entryTime > endTime) matchesDate = false;
      }
    }

    const matchesSpecialization =
      filters.selectedSpecializations.length === 0 ||
      (entry.specialization &&
        filters.selectedSpecializations.includes(entry.specialization));

    return matchesSearch && matchesType && matchesDate && matchesSpecialization;
  });
}

export function paginateChartHistory(
  entries: ChartEntry[],
  page: number,
  pageSize: number,
): ChartEntry[] {
  return entries.slice((page - 1) * pageSize, page * pageSize);
}
