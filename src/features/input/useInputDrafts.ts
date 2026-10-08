import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { logDiagnostic } from "../../services/diagnosticLogger";
import { safeStorage } from "../../utils/storage";

export interface Draft {
  id: string;
  text: string;
  timestamp: number;
}

const MAX_DRAFTS = 10;
const DRAFTS_KEY = "clinsight_drafts";
const ACTIVE_SESSION_KEY = "clinsight_active_session";

export const useInputDrafts = (
  textInput: string,
  setTextInput: Dispatch<SetStateAction<string>>,
) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const savedDrafts = safeStorage.getItem(DRAFTS_KEY);
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch {
        logDiagnostic("error", "Input drafts could not be loaded.");
      }
    }

    const activeSession = safeStorage.getItem(ACTIVE_SESSION_KEY);
    if (activeSession && !textInput) setTextInput(activeSession);
  }, []);

  useEffect(() => {
    if (textInput) {
      const timer = setTimeout(
        () => safeStorage.setItem(ACTIVE_SESSION_KEY, textInput),
        800,
      );
      return () => clearTimeout(timer);
    }
    safeStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [textInput]);

  const saveToHistory = useCallback(
    (text: string) => {
      if (!text || text.trim().length < 5) return;
      const newDraft: Draft = {
        id: Date.now().toString(),
        text,
        timestamp: Date.now(),
      };
      const updatedDrafts = [
        newDraft,
        ...drafts.filter((draft) => draft.text !== text),
      ].slice(0, MAX_DRAFTS);
      setDrafts(updatedDrafts);
      safeStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    },
    [drafts],
  );

  const clearHistory = useCallback(() => {
    setDrafts([]);
    safeStorage.removeItem(DRAFTS_KEY);
  }, []);

  const clearActiveSession = useCallback(() => {
    safeStorage.removeItem(ACTIVE_SESSION_KEY);
  }, []);

  return { drafts, saveToHistory, clearHistory, clearActiveSession };
};
