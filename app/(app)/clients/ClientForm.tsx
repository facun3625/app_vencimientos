"use client";
import { useTransition, useState } from "react";
import Link from "next/link";
import { createClientAction, updateClientAction } from "./actions";
import { Save, X, User, Mail, Phone, Building, Globe, ShieldQuestion, Hash, StickyNote } from "lucide-react";

export default function ClientForm({ client }: { client?: any }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!client;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = (isEdit ? await updateClientAction(client.id, formData) : await createClientAction(formData)) as any;
      if (result?.error) setError(result.error);
      else if (result?.success) window.location.href = "/clients";
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4" style={{ maxWidth: 800 }}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        <div className="form-group !mb-0">
          <label className="form-label">Nombre del Cliente</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="name" defaultValue={client?.name} required className="form-input !pl-10" placeholder="Ej: Juan Pérez" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="email" type="email" defaultValue={client?.email} className="form-input !pl-10" placeholder="cliente@email.com" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="phone" defaultValue={client?.phone} className="form-input !pl-10" placeholder="Ej: +54 9 11 1234-5678" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Empresa / Razón Social</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="company" defaultValue={client?.company} className="form-input !pl-10" placeholder="Ej: Acme Corp" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">CUIT / Identificación (Opcional)</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="cuit" defaultValue={client?.cuit} className="form-input !pl-10" placeholder="Ej: 20-12345678-9" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">País / Región</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="country" defaultValue={client?.country} className="form-input !pl-10" placeholder="Ej: Argentina" />
          </div>
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Estado de la Cuenta</label>
          <div className="relative">
            <ShieldQuestion className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <select name="status" defaultValue={client?.status || "ACTIVE"} className="form-input !pl-10 !py-[0.7rem]">
              <option value="ACTIVE">Activo (Facturación abierta)</option>
              <option value="PAUSED">Pausado (Sin vencimientos activos)</option>
              <option value="INACTIVE">Inactivo (Histórico)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group !mb-0">
        <label className="form-label">Notas (Opcional)</label>
        <div className="relative">
          <StickyNote className="absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
          <textarea
            name="notes"
            defaultValue={client?.notes ?? ""}
            rows={3}
            className="form-input !pl-10 !pt-2.5 resize-none"
            placeholder="Ej: contactar a Juan (asistente) al 11-2345-6789 para coordinar el pago"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/5">
        <button type="submit" disabled={isPending} className="btn btn-primary flex-1 justify-center">
          <Save size={18} />
          {isPending ? "Procesando..." : isEdit ? "Guardar Cambios" : "Crear Cliente"}
        </button>
        <Link href="/clients" className="btn btn-secondary px-8">
          <X size={18} /> Cancelar
        </Link>
      </div>
    </form>
  );
}
