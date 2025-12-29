"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Text } from "../components/ui/Text";

// --- Types ---

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

// --- Components (Inline for portability) ---

// 簡易的なButtonコンポーネント（既存のButtonコンポーネントがあれば置き換えてください）
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

// --- Context ---

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// --- Toast Item Component ---
// タイマー処理とホバー制御を個別に行うためにコンポーネントを分離
const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(toast.duration || 0);
  const startTimeRef = useRef(Date.now());

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

  // タイマー設定関数
  const startTimer = useCallback(() => {
    // durationが0以下の場合は自動消去しない
    if (!toast.duration || toast.duration <= 0) return;

    // 既にタイマーが動いていればクリア
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, timeLeftRef.current);
  }, [toast.duration, toast.id, onRemove]);

  // マウント時にタイマー開始
  useEffect(() => {
    startTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      // 残り時間を計算して保持
      const elapsed = Date.now() - startTimeRef.current;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    // 0ms以下になっていても、UXとして少しだけ猶予を持たせる（例えば最低1秒など）ことも可能ですが、
    // ここでは単純に残りを再開、もしくは残り時間が少なすぎれば即座に消えるのを防ぐためにリセットするのも手です。
    // 今回は「残り時間を再開」する挙動にします。
    if (toast.duration && toast.duration > 0) {
      startTimer();
    }
  };

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border p-2 shadow-lg transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${
        colors[toast.type]
      }`}
      role="status"
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

// --- Provider ---

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const MAX_TOASTS = 3;
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, duration }: Omit<Toast, "id">) => {
      // エラーの場合はデフォルトで自動消去しない (duration = 0)
      // それ以外は4000ms
      const defaultDuration = type === "error" ? 0 : 4000;
      const finalDuration = duration ?? defaultDuration;

      // ランダムID生成 (Date.now()だけだと重複の可能性があるため)
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random());

      setToasts((prev) => {
        // 古いものを削除して個数制限を守る (FIFO)
        const newToast: Toast = { id, type, message, duration: finalDuration };
        const current = [...prev, newToast];

        if (current.length > MAX_TOASTS) {
          // 先頭（古いもの）を削除
          return current.slice(current.length - MAX_TOASTS);
        }
        return current;
      });

      // Note: タイマー処理は ToastItem 側へ委譲しました
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
      {/* 画面上部に重ねて表示するトースト領域 
        z-indexはModalより高く設定 (z-[60]など)
      */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {/* PCでは右上 (items-end)、スマホでは上部中央 (items-center) に配置するレスポンシブ対応例 
          現在の要望に合わせて "top-2 flex justify-center" のままでもOKですが、
          ここではよりモダンな配置例としてレスポンシブクラスを当てています。
          元の「上部中央」がいい場合は `sm:items-end` を削除し `items-center` のみにしてください。
        */}
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// --- Hook ---

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
