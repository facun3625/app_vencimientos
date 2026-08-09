"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div className="card !p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className={`p-2 rounded-lg shrink-0 ${danger ? "bg-red-500/10 text-red-500" : "bg-purple-500/10 text-purple-400"}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`btn ${danger ? "btn-danger" : "btn-primary"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
