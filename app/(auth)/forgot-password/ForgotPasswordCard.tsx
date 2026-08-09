"use client";
import { useState } from "react";
import { requestPasswordResetAction } from "./actions";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordCard() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await requestPasswordResetAction(formData);
    setPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-8">
        <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-16 w-auto mx-auto mb-4 drop-shadow-2xl" />
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Recuperar contraseña</h1>
        <p className="text-[var(--text-muted)] mt-2">Te mandamos un link para elegir una nueva</p>
      </div>

      <div className="card !p-8 border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)]">
        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-white font-semibold">Revisá tu email</p>
            <p className="text-sm text-[var(--text-muted)]">
              Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Vence en 1 hora.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  className="form-input !pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center h-12 text-base mt-2">
              {pending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Enviar link <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-[var(--primary)] font-semibold hover:underline">
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
