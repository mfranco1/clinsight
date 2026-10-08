import { PatientNote } from "../../types";

export interface NoteListFilters {
  searchQuery: string;
  sortOrder: "newest" | "oldest";
  startDate: string;
  endDate: string;
}

export function filterAndSortNotes(
  notes: PatientNote[],
  filters: NoteListFilters,
): PatientNote[] {
  let result = [...notes];

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate
      ? new Date(filters.startDate).getTime()
      : -Infinity;
    const end = filters.endDate
      ? new Date(filters.endDate).getTime()
      : Infinity;
    result = result.filter((note) => {
      const noteDate = new Date(note.createdAt.split(" ")[0]).getTime();
      return noteDate >= start && noteDate <= end;
    });
  }

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    result = result.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query),
    );
  }

  result.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters.sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return result;
}

export function paginateNotes(
  notes: PatientNote[],
  page: number,
  itemsPerPage: number,
): PatientNote[] {
  const start = (page - 1) * itemsPerPage;
  return notes.slice(start, start + itemsPerPage);
}
