type ToastType = "success" | "error" | "info";

type ToastFn = (type: ToastType, message: string) => void;

let toastFn: ToastFn | null = null;

/**
 * Module-level toast bridge so non-React code (axios interceptors) can show
 * toasts. `ToastProvider` registers its `toast` on mount via `registerToast`.
 */
export function registerToast(fn: ToastFn | null): void {
  toastFn = fn;
}

export function emitToast(type: ToastType, message: string): void {
  toastFn?.(type, message);
}

export type { ToastType };
