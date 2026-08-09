"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "../actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-danger !py-1.5 !px-3 text-xs"
        title="Eliminar usuario"
      >
        <Trash2 size={12} className={isPending ? "animate-pulse" : ""} />
      </button>
      {error && <span className="text-[10px] text-red-400 max-w-[160px] text-right">{error}</span>}

      <ConfirmModal
        open={open}
        title="Eliminar usuario"
        message={`¿Eliminar la cuenta de "${userName}"? Esto no borra su workspace ni sus datos, solo el usuario. No se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
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
