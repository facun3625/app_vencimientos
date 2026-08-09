"use client";
import { useTransition, useState } from "react";
import { createMonthlyCostAction } from "./actions";
import { Plus } from "lucide-react";

export default function MonthlyCostForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createMonthlyCostAction(formData);
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary w-full">
        <Plus size={14} /> Nuevo Costo Mensual
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3">
      <input name="name" required placeholder="Nombre (ej: Servidor Cloud AWS)" className="form-input" />
      <input name="amount" type="number" step="0.01" required placeholder="Costo total mensual" className="form-input" />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">{isPending ? "..." : "Guardar"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancelar</button>
      </div>
    </form>
  );
}
