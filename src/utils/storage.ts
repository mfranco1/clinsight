const createSafeStorage = () => {
  const mem: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("Storage item read error:", e);
        return mem[key] || null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn("Storage item write error:", e);
        mem[key] = value;
      }
    },
    removeItem(key: string): void {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn("Storage item delete error:", e);
        delete mem[key];
      }
    },
  };
};

export const safeStorage = createSafeStorage();
