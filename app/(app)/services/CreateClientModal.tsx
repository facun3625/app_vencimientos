"use client";
import { useState, useTransition } from "react";
import { createClientAction } from "../clients/actions";
import { X, User, Mail, Phone, Building, Save } from "lucide-react";

export default function CreateClientModal({
  initialName,
  onClose,
  onCreated,
}: {
  initialName?: string;
  onClose: () => void;
  onCreated: (client: { id: string; name: string }) => void;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = (await createClientAction(formData)) as any;
      if (result?.error) setError(result.error);
      else if (result?.client) onCreated({ id: result.client.id, name: result.client.name });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card !p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nuevo Cliente</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm p-1"><X size={16} /></button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Nombre del Cliente</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input name="name" defaultValue={initialName} required autoFocus className="form-input !pl-10" placeholder="Ej: Juan Pérez" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input name="email" type="email" className="form-input !pl-10" placeholder="cliente@email.com (opcional)" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input name="phone" className="form-input !pl-10" placeholder="Opcional" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Empresa</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input name="company" className="form-input !pl-10" placeholder="Opcional" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn btn-primary flex-1 justify-center">
              <Save size={16} /> {isPending ? "Creando..." : "Crear y Seleccionar"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
