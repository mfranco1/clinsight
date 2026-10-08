import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SectionVisibility } from "../src/features/chart/components/ManageSectionsDropdown";
import { useEntrySectionVisibility } from "../src/features/chart/useEntrySectionVisibility";

const initial: SectionVisibility = {
  subjective: {
    chiefComplaint: true,
    hpi: true,
    ros: true,
    pmh: true,
    meds: true,
    family: true,
    social: true,
    anamnesis: true,
    birthMaternal: true,
    immunizations: true,
    nutrition: true,
    developmental: true,
    headsss: true,
    sexualHistory: true,
  },
  objective: {
    vitals: true,
    anthropometrics: true,
    physicalExam: true,
    labs: true,
    imaging: true,
  },
};

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
});

afterEach(() => storage.clear());

describe("useEntrySectionVisibility", () => {
  it("merges saved entry choices over calculated defaults and persists changes", async () => {
    window.localStorage.setItem(
      "clinsight_entry_visibilities",
      JSON.stringify({ entry: { subjective: { hpi: false } } }),
    );
    const { result } = renderHook(() =>
      useEntrySectionVisibility("entry", initial),
    );

    expect(result.current.currentVisibility).toEqual({
      subjective: { ...initial.subjective, hpi: false },
      objective: initial.objective,
    });

    act(() => {
      result.current.setEntryVisibilities((previous) => ({
        ...previous,
        entry: {
          subjective: { ...initial.subjective, hpi: true },
          objective: initial.objective,
        },
      }));
    });

    await waitFor(() => {
      expect(
        JSON.parse(
          window.localStorage.getItem("clinsight_entry_visibilities") || "{}",
        ).entry.subjective.hpi,
      ).toBe(true);
    });
  });
});
