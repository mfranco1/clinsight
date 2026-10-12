import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeStorage } from "../src/utils/storage";

describe("safeStorage", () => {
  let storageValues: Map<string, string>;

  beforeEach(() => {
    storageValues = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storageValues.get(key) ?? null,
        setItem: (key: string, value: string) => storageValues.set(key, value),
        removeItem: (key: string) => storageValues.delete(key),
      } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem">,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports when a value is durably written", () => {
    const key = "safe-storage-test-durable";
    const setItem = vi.spyOn(window.localStorage, "setItem");

    expect(safeStorage.setItem(key, "saved")).toBe(true);
    expect(window.localStorage.getItem(key)).toBe("saved");

    window.localStorage.removeItem(key);
    setItem.mockRestore();
  });

  it("reports memory fallback when browser storage rejects a write", () => {
    const key = "safe-storage-test-fallback";
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(safeStorage.setItem(key, "session only")).toBe(false);
    expect(safeStorage.getItem(key)).toBe("session only");
  });
});
