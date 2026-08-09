"use client";
import { useState, useTransition } from "react";
import { updateServiceBaseAction, deleteServiceBaseAction } from "./actions";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function CatalogItemRow({
  id,
  name,
  description,
  countLabel,
}: {
  id: string;
  name: string;
  description: string | null;
  countLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            await updateServiceBaseAction(id, formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-2 p-3 border-b border-white/5 last:border-0"
      >
        <input name="name" required defaultValue={name} className="form-input" />
        <input name="description" defaultValue={description ?? ""} placeholder="Descripción" className="form-input" />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">{isPending ? "..." : "Guardar"}</button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
      <div>
        <div className="font-semibold text-sm">{name}</div>
        {description && <div className="text-xs text-[var(--text-muted)] italic">{description}</div>}
        <div className="text-[10px] text-[var(--text-muted)]">{countLabel}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm p-1"><Pencil size={12} /></button>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="btn btn-danger btn-sm p-1"
        ><Trash2 size={12} /></button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        danger
        title={`Borrar ${name}`}
        message="Se eliminará este tipo de servicio del catálogo. Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            await deleteServiceBaseAction(id);
          });
        }}
      />
    </div>
  );
}
