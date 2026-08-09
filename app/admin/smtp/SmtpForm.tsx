"use client";
import { useState, useTransition } from "react";
import { updateSmtpSettingsAction } from "../actions";
import { Server, Hash, User, Lock, Mail, Save, CheckCircle2 } from "lucide-react";

export default function SmtpForm({ settings }: { settings: any }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSmtpSettingsAction(formData);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="alert alert-error">{error}</div>}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 size={16} /> Configuración guardada.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group md:col-span-2">
          <label className="form-label">Host</label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="host" defaultValue={settings?.host ?? ""} required className="form-input !pl-10" placeholder="smtp.gmail.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Puerto</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input name="port" type="number" defaultValue={settings?.port ?? 587} required className="form-input !pl-10" placeholder="587" />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Usuario</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input name="user" defaultValue={settings?.user ?? ""} required className="form-input !pl-10" placeholder="usuario@dominio.com" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            name="password"
            type="password"
            required={!settings}
            className="form-input !pl-10"
            placeholder={settings ? "••••••••" : "Contraseña o token de aplicación"}
          />
        </div>
        {settings && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Ya hay una contraseña guardada. Escribí una nueva solo si querés reemplazarla.
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Remitente (From)</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input name="from" type="email" defaultValue={settings?.from ?? ""} required className="form-input !pl-10" placeholder="no-reply@kailos.com" />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-fit">
        <Save size={16} /> {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
