const createSafeStorage = () => {
  const mem: Record<string, string> = {};
  return {
    getItemWithStatus(key: string): {
      value: string | null;
      persisted: boolean;
    } {
      try {
        return {
          value: window.localStorage.getItem(key) ?? mem[key] ?? null,
          persisted: true,
        };
      } catch (e) {
        console.warn("Storage item read error:", e);
        return { value: mem[key] ?? null, persisted: false };
      }
    },
    getItem(key: string): string | null {
      return this.getItemWithStatus(key).value;
    },
    setItem(key: string, value: string): boolean {
      try {
        window.localStorage.setItem(key, value);
        delete mem[key];
        return true;
      } catch (e) {
        console.warn("Storage item write error:", e);
        mem[key] = value;
        return false;
      }
    },
    removeItem(key: string): boolean {
      try {
        window.localStorage.removeItem(key);
        delete mem[key];
        return true;
      } catch (e) {
        console.warn("Storage item delete error:", e);
        delete mem[key];
        return false;
      }
    },
  };
};

export const safeStorage = createSafeStorage();
