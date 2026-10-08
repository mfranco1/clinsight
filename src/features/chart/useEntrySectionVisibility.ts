import { useEffect, useMemo, useState } from "react";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { safeStorage } from "../../utils/storage";
import type { SectionVisibility } from "./components/ManageSectionsDropdown";

const STORAGE_KEY = "clinsight_entry_visibilities";

function loadVisibilities(): Record<string, SectionVisibility> {
  const saved = safeStorage.getItem(STORAGE_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved) as Record<string, SectionVisibility>;
  } catch {
    logDiagnostic("error", "Entry visibility preferences could not be loaded.");
    return {};
  }
}

export function useEntrySectionVisibility(
  entryId: string,
  initialVisibility: SectionVisibility,
) {
  const [entryVisibilities, setEntryVisibilities] = useState(loadVisibilities);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(entryVisibilities));
  }, [entryVisibilities]);

  const currentVisibility = useMemo(() => {
    const saved = entryVisibilities[entryId];
    if (!saved) return initialVisibility;
    return {
      subjective: { ...initialVisibility.subjective, ...saved.subjective },
      objective: { ...initialVisibility.objective, ...saved.objective },
    };
  }, [entryId, entryVisibilities, initialVisibility]);

  return { entryVisibilities, setEntryVisibilities, currentVisibility };
}
