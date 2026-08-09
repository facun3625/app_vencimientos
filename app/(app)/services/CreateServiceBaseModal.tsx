"use client";
import { useState, useTransition } from "react";
import { createServiceBaseAction } from "../catalog/actions";
import { X, Briefcase, FileText, Save } from "lucide-react";

export default function CreateServiceBaseModal({
  initialName,
  type,
  onClose,
  onCreated,
}: {
  initialName?: string;
  type: "RECURRING" | "ONE_TIME";
  onClose: () => void;
  onCreated: (item: { id: string; name: string; description: string | null }) => void;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      const result = (await createServiceBaseAction(formData)) as any;
      if (result?.error) setError(result.error);
      else if (result?.item) onCreated(result.item);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card !p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nuevo Servicio del Catálogo</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm p-1">
            <X size={16} />
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Nombre del Servicio</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                name="name"
                defaultValue={initialName}
                required
                autoFocus
                className="form-input !pl-10"
                placeholder="Ej: Hosting Web"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input name="description" className="form-input !pl-10" placeholder="Opcional" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn btn-primary flex-1 justify-center">
              <Save size={16} /> {isPending ? "Creando..." : "Crear y Seleccionar"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
