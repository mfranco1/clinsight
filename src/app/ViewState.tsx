import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface ViewStateCache {
  values: Map<string, unknown>;
  clear: () => void;
  clearPrefix: (prefix: string) => void;
}

const ViewStateContext = createContext<ViewStateCache | null>(null);

export function ViewStateProvider({ children }: { children: ReactNode }) {
  const values = useRef(new Map<string, unknown>());
  const clear = useCallback(() => values.current.clear(), []);
  const clearPrefix = useCallback((prefix: string) => {
    values.current.forEach((_, key) => {
      if (key.startsWith(prefix)) values.current.delete(key);
    });
  }, []);
  const cache = useRef<ViewStateCache>({
    values: values.current,
    clear,
    clearPrefix,
  });

  return (
    <ViewStateContext.Provider value={cache.current}>
      {children}
    </ViewStateContext.Provider>
  );
}

export function useViewStateCache() {
  const cache = useContext(ViewStateContext);
  if (!cache) {
    throw new Error("useViewStateCache must be used inside ViewStateProvider");
  }
  return cache;
}

export function useRetainedState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const cache = useViewStateCache();
  const [stored, setStored] = useState(() => {
    if (cache.values.has(key)) {
      return { key, value: cache.values.get(key) as T };
    }
    return { key, value: initialValue };
  });
  const value =
    stored.key === key
      ? stored.value
      : cache.values.has(key)
        ? (cache.values.get(key) as T)
        : initialValue;
  const valueRef = useRef({ key, value });
  valueRef.current = { key, value };

  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      const previous =
        valueRef.current.key === key
          ? valueRef.current.value
          : cache.values.has(key)
            ? (cache.values.get(key) as T)
            : initialValue;
      const next =
        typeof nextValue === "function"
          ? (nextValue as (previous: T) => T)(previous)
          : nextValue;
      valueRef.current = { key, value: next };
      cache.values.set(key, next);
      setStored({ key, value: next });
    },
    [cache, initialValue, key],
  );

  return [value, update];
}
