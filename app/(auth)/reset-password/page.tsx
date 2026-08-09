import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token || "";
  const email = params.email || "";
  const valid = Boolean(token && email);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="/favicon.png" alt="Kairos" className="w-16 h-16 mx-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Nueva contraseña</h1>
          <p className="text-[var(--text-muted)] mt-2">Elegí una contraseña nueva para tu cuenta</p>
        </div>

        <div className="card !p-8 border-white/10 shadow-2xl">
          {valid ? (
            <ResetPasswordForm token={token} email={email} />
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <p className="text-white font-semibold">Link inválido</p>
              <p className="text-sm text-[var(--text-muted)]">
                Este link de recuperación no es válido. Pedí uno nuevo desde la pantalla de recuperar contraseña.
              </p>
              <Link href="/forgot-password" className="btn btn-primary mt-2">
                Pedir un nuevo link
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-[var(--primary)] font-semibold hover:underline">
              <ArrowLeft size={14} /> Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
