const createSafeStorage = () => {
  const mem: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      try {
        return window.localStorage.getItem(key) ?? mem[key] ?? null;
      } catch (e) {
        console.warn("Storage item read error:", e);
        return mem[key] || null;
      }
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
