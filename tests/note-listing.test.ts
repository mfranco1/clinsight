import { describe, expect, it } from "vitest";
import { PatientNote } from "../src/types";
import {
  filterAndSortNotes,
  paginateNotes,
} from "../src/features/notes/listing";

const notes: PatientNote[] = [
  {
    id: "older",
    title: "Follow-up",
    content: "Stable symptoms",
    createdAt: "2026-01-01 09:00",
    updatedAt: "",
  },
  {
    id: "newer",
    content: "New concern",
    createdAt: "2026-02-10 12:00",
    updatedAt: "",
  },
  {
    id: "middle",
    title: "Lab review",
    content: "Results reviewed",
    createdAt: "2026-01-20 08:00",
    updatedAt: "",
  },
];

describe("note listing", () => {
  it("searches title and content, then sorts newest first by default input", () => {
    expect(
      filterAndSortNotes(notes, {
        searchQuery: "review",
        sortOrder: "newest",
        startDate: "",
        endDate: "",
      }).map((note) => note.id),
    ).toEqual(["middle"]);
  });

  it("applies inclusive date boundaries and supports oldest-first ordering", () => {
    expect(
      filterAndSortNotes(notes, {
        searchQuery: "",
        sortOrder: "oldest",
        startDate: "2026-01-01",
        endDate: "2026-01-20",
      }).map((note) => note.id),
    ).toEqual(["older", "middle"]);
  });

  it("paginates without mutating the filtered list", () => {
    const ordered = [...notes];
    expect(paginateNotes(ordered, 2, 2).map((note) => note.id)).toEqual([
      "middle",
    ]);
    expect(ordered.map((note) => note.id)).toEqual([
      "older",
      "newer",
      "middle",
    ]);
  });
});
