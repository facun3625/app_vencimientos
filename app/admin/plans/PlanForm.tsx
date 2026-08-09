"use client";
import { useState, useTransition } from "react";
import { updatePlanAction } from "../actions";
import { Save, CheckCircle2, Star } from "lucide-react";

export default function PlanForm({ plan }: { plan: any }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [featured, setFeatured] = useState(plan.featured);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePlanAction(plan.tier, formData);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`card !p-5 flex flex-col gap-3 ${featured ? "border-blue-500/40" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{plan.tier}</span>
        {featured && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase">
            <Star size={11} /> Destacado
          </span>
        )}
      </div>

      {error && <div className="alert alert-error !text-xs">{error}</div>}
      {saved && (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <CheckCircle2 size={13} /> Guardado
        </div>
      )}

      <div className="form-group">
        <label className="form-label text-[10px]">Nombre</label>
        <input name="name" defaultValue={plan.name} required className="form-input !py-2 !text-sm" />
      </div>

      <div className="form-group">
        <label className="form-label text-[10px]">Descripción</label>
        <input name="description" defaultValue={plan.description} required className="form-input !py-2 !text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="form-group">
          <label className="form-label text-[10px]">Precio</label>
          <input name="priceAmount" type="number" step="0.01" defaultValue={plan.priceAmount} required className="form-input !py-2 !text-sm" />
        </div>
        <div className="form-group">
          <label className="form-label text-[10px]">Moneda</label>
          <select name="currency" defaultValue={plan.currency} className="form-input !py-2 !text-sm">
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label text-[10px]">Frecuencia</label>
        <select name="billingInterval" defaultValue={plan.billingInterval} className="form-input !py-2 !text-sm">
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="form-group">
          <label className="form-label text-[10px]">Límite clientes</label>
          <input name="clientLimit" type="number" min="1" defaultValue={plan.clientLimit ?? ""} placeholder="Ilimitado" className="form-input !py-2 !text-sm" />
        </div>
        <div className="form-group">
          <label className="form-label text-[10px]">Límite usuarios</label>
          <input name="userLimit" type="number" min="1" defaultValue={plan.userLimit ?? ""} placeholder="Ilimitado" className="form-input !py-2 !text-sm" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label text-[10px]">Funciones (una por línea)</label>
        <textarea
          name="features"
          defaultValue={(plan.features as string[]).join("\n")}
          required
          rows={5}
          className="form-input !py-2 !text-sm font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          name="featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="w-3.5 h-3.5 accent-blue-500"
        />
        Marcar como plan recomendado
      </label>

      <button type="submit" disabled={isPending} className="btn btn-primary !py-2 !text-sm justify-center mt-1">
        <Save size={14} /> {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
