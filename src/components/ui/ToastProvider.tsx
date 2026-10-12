import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Toast from "../Toast";

type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  id?: string;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = options.id ?? `toast-${++nextId.current}`;
      const item: ToastItem = {
        id,
        message,
        type: options.type ?? "error",
        duration: options.duration ?? 5000,
      };
      setItems((current) => {
        const withoutSameId = current.filter((existing) => existing.id !== id);
        return [...withoutSameId, item];
      });
      return id;
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {items.length > 0 &&
        createPortal(
          <div
            aria-label="Notifications"
            className="pointer-events-none fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[100] flex flex-col-reverse items-end gap-3 sm:inset-x-auto sm:right-4 sm:w-full"
          >
            {items.slice(0, 4).map((item) => (
              <Toast
                key={item.id}
                message={item.message}
                type={item.type}
                duration={item.duration}
                onClose={() => dismissToast(item.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};
