"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSuggestionAction } from "../actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteSuggestionButton({ id }: { id: string }) {
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-danger !py-1.5 !px-3 text-xs"
        title="Eliminar sugerencia"
      >
        <Trash2 size={12} className={isPending ? "animate-pulse" : ""} />
      </button>
      {error && <span className="text-[10px] text-red-400 max-w-[160px] text-right">{error}</span>}

      <ConfirmModal
        open={open}
        title="Eliminar sugerencia"
        message="¿Estás seguro de que querés eliminar esta sugerencia? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setError("");
          startTransition(async () => {
            const res = await deleteSuggestionAction(id);
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
