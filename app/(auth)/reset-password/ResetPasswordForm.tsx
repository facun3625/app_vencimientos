"use client";
import { useState } from "react";
import { resetPasswordAction } from "./actions";
import { Lock, ArrowRight } from "lucide-react";

export default function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setPending(false);
      return;
    }
    const res = await resetPasswordAction(formData);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Nueva Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input name="password" type="password" required minLength={6} className="form-input !pl-10" placeholder="Mínimo 6 caracteres" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Confirmar Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input name="confirmPassword" type="password" required minLength={6} className="form-input !pl-10" placeholder="Repetí la contraseña" />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center h-12 text-base mt-2">
        {pending ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>Restablecer contraseña <ArrowRight size={18} /></>
        )}
      </button>
    </form>
  );
}
