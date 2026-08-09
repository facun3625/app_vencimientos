"use client";
import { useState, useTransition } from "react";
import { updateMercadoPagoSettingsAction } from "../actions";
import { Key, KeyRound, Save, CheckCircle2 } from "lucide-react";

export default function MercadoPagoForm({ settings }: { settings: any }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateMercadoPagoSettingsAction(formData);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="alert alert-error">{error}</div>}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 size={16} /> Credenciales guardadas.
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Access Token</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            name="accessToken"
            type="password"
            required={!settings}
            className="form-input !pl-10"
            placeholder={settings ? "••••••••••••••••" : "APP_USR-..."}
          />
        </div>
        {settings && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Ya hay un Access Token guardado. Escribí uno nuevo solo si querés reemplazarlo.
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Public Key</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            name="publicKey"
            defaultValue={settings?.publicKey ?? ""}
            required
            className="form-input !pl-10"
            placeholder="APP_USR-..."
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-fit">
        <Save size={16} /> {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
