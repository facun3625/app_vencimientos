"use client";
import { useState, useTransition } from "react";
import { deleteClientAction } from "./actions";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="btn btn-danger btn-sm"
      >
        <Trash2 size={13} />
      </button>

      <ConfirmModal
        open={open}
        danger
        title={`Borrar a ${name}`}
        message="Se eliminarán también todos sus servicios y vencimientos asociados. Esta acción no se puede deshacer."
        confirmLabel="Borrar cliente"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          startTransition(async () => {
            await deleteClientAction(id);
          });
        }}
      />
    </>
  );
}
