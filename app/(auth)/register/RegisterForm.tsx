"use client";
import { useState } from "react";
import { registerAction, registerWithGoogleAction } from "./actions";
import Link from "next/link";
import { User, Mail, Lock, Building, ArrowRight } from "lucide-react";

export default function RegisterForm({ plan }: { plan: { tier: string; name: string; priceAmount: number; currency: string; billingInterval: string } }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <div className="card !p-6 border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Crear Cuenta</h2>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Plan elegido</p>
          <p className="text-sm font-bold text-[var(--primary)]">
            {plan.name}
            {plan.priceAmount > 0 && (
              <span className="text-[var(--text-muted)] font-normal">
                {" "}
                — {plan.currency} {plan.priceAmount.toLocaleString("es-AR")}/{plan.billingInterval === "monthly" ? "mes" : "año"}
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="plan" value={plan.tier} />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group !mb-0">
            <label className="form-label">Empresa / Workspace</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input name="workspaceName" required className="form-input !pl-10" placeholder="Mi Consultora" />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Tu Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input name="name" required className="form-input !pl-10" placeholder="Juan Pérez" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group !mb-0">
            <label className="form-label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input name="email" type="email" required className="form-input !pl-10" placeholder="juan@empresa.com" />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input name="password" type="password" required className="form-input !pl-10" placeholder="Mín. 6 caracteres" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center h-11 text-base mt-1">
          {pending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : plan.priceAmount > 0 ? (
            <>Continuar al pago <ArrowRight size={18} /></>
          ) : (
            <>Comenzar Ahora <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[var(--text-muted)]">o continuá con</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={registerWithGoogleAction}>
        <input type="hidden" name="plan" value={plan.tier} />
        <button
          type="submit"
          className="btn w-full justify-center h-11 text-base gap-3 bg-white text-black hover:bg-zinc-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.88c2.27-2.09 3.54-5.17 3.54-8.82z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09C3.26 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.31 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.01-3.09z"/>
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.59l4.01 3.09C6.25 6.85 8.89 4.75 12 4.75z"/>
          </svg>
          Continuar con Google
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
