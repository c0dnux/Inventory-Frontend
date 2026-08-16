import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../../lib/format";
import { registerToast } from "../../lib/toast";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  useEffect(() => {
    registerToast(toast);
    return () => registerToast(null);
  }, [toast]);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-success-500" />,
    error: <XCircle className="h-5 w-5 text-error-500" />,
    info: <Info className="h-5 w-5 text-blue-light-500" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[99999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={cn(
                "pointer-events-auto flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-theme-lg animate-slide-in-right dark:bg-gray-900",
                t.type === "success" && "border-success-200 dark:border-success-800",
                t.type === "error" && "border-error-200 dark:border-error-800",
                t.type === "info" && "border-blue-light-200 dark:border-blue-light-800",
              )}
            >
              <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{t.message}</p>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
