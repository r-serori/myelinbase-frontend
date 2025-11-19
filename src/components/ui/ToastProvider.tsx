"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 or undefined なら自動では消さない
};

type ToastContextValue = {
  showToast: (input: { type: ToastType; message: string; duration?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, duration = 4000 }: { type: ToastType; message: string; duration?: number }) => {
      const id = Date.now() + Math.random();
      const toast: Toast = { id, type, message, duration };
      setToasts((prev) => [...prev, toast]);
      if (duration && duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* 画面上部に重ねて表示するトースト領域 */}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-[60] flex justify-center">
        <div className="flex w-full max-w-md flex-col gap-2 px-2">
          {toasts.map((toast) => {
            const colorClass =
              toast.type === "success"
                ? "border-green-300 bg-green-50"
                : toast.type === "error"
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white";
            const textColor =
              toast.type === "success"
                ? "text-green-800"
                : toast.type === "error"
                ? "text-red-800"
                : "text-gray-800";
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-2 rounded border px-3 py-2 text-xs shadow-sm ${colorClass} ${textColor}`}
                role="status"
                aria-live="polite"
              >
                <div className="mt-0.5 text-base leading-none">
                  {toast.type === "success"
                    ? "✓"
                    : toast.type === "error"
                    ? "!"
                    : "i"}
                </div>
                <div className="flex-1 break-words">{toast.message}</div>
                <button
                  type="button"
                  className="ml-2 text-xs text-gray-500 hover:text-gray-800"
                  onClick={() => removeToast(toast.id)}
                  aria-label="通知を閉じる"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}


