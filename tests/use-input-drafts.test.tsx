import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInputDrafts } from "../src/features/input/useInputDrafts";

describe("useInputDrafts", () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    const localStorageMock: Storage = {
      get length() {
        return storage.size;
      },
      clear: () => storage.clear(),
      getItem: (key) => storage.get(key) ?? null,
      key: (index) => Array.from(storage.keys())[index] ?? null,
      removeItem: (key) => {
        storage.delete(key);
      },
      setItem: (key, value) => {
        storage.set(key, String(value));
      },
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads draft history and recovers the active session", async () => {
    const savedDraft = {
      id: "saved",
      text: "Existing draft content",
      timestamp: 10,
    };
    window.localStorage.setItem(
      "clinsight_drafts",
      JSON.stringify([savedDraft]),
    );
    window.localStorage.setItem(
      "clinsight_active_session",
      "Recovered clinical note",
    );
    const { result } = renderHook(() => {
      const [text, setText] = useState("");
      return { text, ...useInputDrafts(text, setText) };
    });

    await waitFor(() =>
      expect(result.current.text).toBe("Recovered clinical note"),
    );
    expect(result.current.drafts).toEqual([savedDraft]);
  });

  it("deduplicates saved text, keeps the newest ten drafts, and clears history", async () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("");
      return { text, ...useInputDrafts(text, setText) };
    });

    for (let index = 0; index < 12; index += 1) {
      act(() => result.current.saveToHistory(`Clinical note number ${index}`));
    }
    act(() => result.current.saveToHistory("Clinical note number 11"));

    await waitFor(() => expect(result.current.drafts).toHaveLength(10));
    expect(result.current.drafts[0].text).toBe("Clinical note number 11");
    expect(
      result.current.drafts.some(
        (draft) => draft.text === "Clinical note number 0",
      ),
    ).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem("clinsight_drafts") || "[]"),
    ).toHaveLength(10);

    act(() => result.current.clearHistory());
    expect(result.current.drafts).toEqual([]);
    expect(window.localStorage.getItem("clinsight_drafts")).toBeNull();
  });

  it("debounces active-session persistence and removes it when the editor is cleared", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => {
      const [text, setText] = useState("");
      return { text, setText, ...useInputDrafts(text, setText) };
    });

    act(() => result.current.setText("Draft in progress"));
    act(() => vi.advanceTimersByTime(799));
    expect(window.localStorage.getItem("clinsight_active_session")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(window.localStorage.getItem("clinsight_active_session")).toBe(
      "Draft in progress",
    );

    act(() => result.current.setText(""));
    expect(window.localStorage.getItem("clinsight_active_session")).toBeNull();
  });
});
