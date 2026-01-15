"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
  X,
} from "lucide-react";

import { Button } from "../components/ui/Button";
import { Text } from "../components/ui/Text";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string; // IDは文字列に変更（UUID等が推奨されるため）
  type: ToastType;
  message: string;
  duration?: number; // ms, 0 or undefined なら自動では消さない
};

type ToastContextValue = {
  showToast: (input: {
    type: ToastType;
    message: string;
    duration?: number;
  }) => void;
};

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="close"
    size="close"
    onClick={onClick}
    aria-label="通知を閉じる"
  >
    <X className="size-3" />
  </Button>
);

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(toast.duration || 0);
  const startTimeRef = useRef(0);

  const colors: Record<ToastType, string> = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const icons: Record<ToastType, LucideIcon> = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };

  const Icon = icons[toast.type];

  const startTimer = useCallback(() => {
    if (!toast.duration || toast.duration <= 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, timeLeftRef.current);
  }, [toast.duration, toast.id, onRemove]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    if (toast.duration && toast.duration > 0) {
      startTimer();
    }
  };

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-lg border p-2 shadow-lg transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${
        colors[toast.type]
      }`}
      role="alertdialog"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1 pt-0.5">
        <Text variant="sm" color="default" leading="relaxed">
          {toast.message}
        </Text>
      </div>
      <div>
        <CloseButton onClick={() => onRemove(toast.id)} />
      </div>
    </div>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const MAX_TOASTS = 3;
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, duration }: Omit<Toast, "id">) => {
      const defaultDuration = type === "error" ? 0 : 4000;
      const finalDuration = duration ?? defaultDuration;

      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random());

      setToasts((prev) => {
        const newToast: Toast = { id, type, message, duration: finalDuration };
        const current = [...prev, newToast];

        if (current.length > MAX_TOASTS) {
          return current.slice(current.length - MAX_TOASTS);
        }
        return current;
      });
    },
    []
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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
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
