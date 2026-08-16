import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/format";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4">
      <div
        className="fixed inset-0 animate-fade-in bg-gray-400/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full animate-scale-in rounded-3xl bg-white shadow-theme-xl dark:bg-gray-900",
          sizes[size],
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white/90">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 sm:px-8">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 rounded-b-3xl border-t border-gray-100 px-6 py-4 dark:border-gray-800 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
