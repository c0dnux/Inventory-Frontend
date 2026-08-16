import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  const [input, setInput] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            disabled={danger && input.toLowerCase() !== "delete"}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/15">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm text-slate-600 dark:text-gray-300">{message}</p>
      </div>
      {danger && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-300">
            Type <span className="font-bold text-error-500">delete</span> to confirm
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field"
            placeholder="delete"
          />
        </div>
      )}
    </Modal>
  );
}
