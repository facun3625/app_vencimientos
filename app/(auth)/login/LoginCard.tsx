"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, loginWithGoogleAction } from "./actions";
import Link from "next/link";
import { Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "1") return null;
  return (
    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center flex items-center justify-center gap-2 mb-5">
      <CheckCircle2 size={16} /> Contraseña actualizada. Ya podés ingresar.
    </div>
  );
}

function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <div className="card !p-8 border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)]">
      <Suspense fallback={null}>
        <ResetSuccessBanner />
      </Suspense>

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

        <div className="form-group">
          <div className="flex justify-between items-end mb-2">
            <label className="form-label !mb-0">Contraseña</label>
            <Link href="/forgot-password" className="text-[10px] text-[var(--primary)] hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              name="password"
              type="password"
              required
              className="form-input !pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center h-12 text-base mt-2">
          {pending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>Ingresar <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[var(--text-muted)]">o continuá con</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form action={loginWithGoogleAction}>
        <button
          type="submit"
          className="btn w-full justify-center h-12 text-base gap-3 bg-white text-black hover:bg-zinc-200"
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

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          ¿No tenés una cuenta?{" "}
          <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginCard() {
  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-8">
        <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-16 w-auto mx-auto mb-4 drop-shadow-2xl" />
        <p className="text-[var(--text-muted)] mt-2">Bienvenido de nuevo, ingresá a tu cuenta</p>
      </div>

      <LoginForm />
    </div>
  );
}
