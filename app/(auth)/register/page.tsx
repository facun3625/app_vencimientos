import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import RegisterForm from "./RegisterForm";
import AuthBackground from "@/components/AuthBackground";
import { getPlanForRegister } from "./getPlan";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = await getPlanForRegister(params.plan);
  if (!plan) redirect("/precios");

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="hidden lg:flex flex-col justify-center text-white p-4">
          <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-10 w-auto mb-6" />
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Empezá a gestionar tus vencimientos</h1>
          <p className="text-[var(--text-muted)] text-lg mb-8">
            Unite a los profesionales que ya dejaron de perseguir vencimientos en una planilla.
          </p>

          <div className="space-y-4">
            {(plan.features as string[]).slice(0, 4).map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="text-emerald-500"><CheckCircle2 size={20} /></div>
                <p className="text-sm">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <RegisterForm plan={plan} />
      </div>
    </div>
  );
}
