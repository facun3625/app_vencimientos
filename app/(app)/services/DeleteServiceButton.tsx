"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteServiceAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteServiceButton({ id, type }: { id: string, type: "contract" | "onetime" }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-ghost !p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        title="Eliminar servicio"
      >
        <Trash2 size={16} className={isPending ? "animate-pulse" : ""} />
      </button>

      <ConfirmModal
        open={open}
        danger
        title="Eliminar servicio"
        message="Se eliminará este servicio asignado y sus vencimientos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(async () => {
            await deleteServiceAction(id, type);
          });
        }}
      />
    </>
  );
}
