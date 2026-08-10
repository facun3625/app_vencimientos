"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { Trash2, MoreVertical } from "lucide-react";
import { deleteUserAction } from "../actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic afuera.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className="relative inline-flex flex-col items-end gap-1" ref={ref}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        disabled={isPending}
        className="btn btn-secondary !py-1.5 !px-2 text-xs"
        title="Más acciones"
        aria-label="Más acciones"
      >
        <MoreVertical size={14} className={isPending ? "animate-pulse" : ""} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-[var(--border)] bg-[#111827] shadow-xl overflow-hidden">
          <button
            onClick={() => {
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Eliminar usuario
          </button>
        </div>
      )}

      {error && <span className="text-[10px] text-red-400 max-w-[160px] text-right">{error}</span>}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar usuario"
        message={`¿Eliminar la cuenta de "${userName}"? Esto no borra su workspace ni sus datos, solo el usuario. No se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setError("");
          startTransition(async () => {
            const res = await deleteUserAction(userId);
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
