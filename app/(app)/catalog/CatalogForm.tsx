"use client";
import { useTransition, useState } from "react";
import { createServiceBaseAction } from "./actions";
import { Plus } from "lucide-react";

export default function CatalogForm({ type }: { type: "RECURRING" | "ONE_TIME" }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      await createServiceBaseAction(formData);
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-secondary w-full"><Plus size={14} /> Nuevo {type === "RECURRING" ? "Recurrente" : "Único"}</button>;

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3">
      <input name="name" required placeholder="Nombre (ej: Hosting)" className="form-input" />
      <input name="description" placeholder="Descripción" className="form-input" />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">{isPending ? "..." : "Guardar"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancelar</button>
      </div>
    </form>
  );
}
