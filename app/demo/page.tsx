import { auth } from "@/lib/auth";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { CheckCircle2 } from "lucide-react";
import DemoEnterButton from "./DemoEnterButton";

export default async function DemoPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      <PublicNav loggedIn={!!session} />

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center relative">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[70%] h-[70%] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-4">Modo demo</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Probá Kairos con datos ya cargados
          </h1>
          <p className="text-[var(--text-muted)] mb-10">
            Sin email, sin contraseña, sin tarjeta. Entrás directo a un workspace de ejemplo con
            clientes, vencimientos y costos reales para que veas cómo se usa de verdad.
          </p>

          <DemoEnterButton />

          <div className="flex flex-col gap-3 mt-12 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Podés editar y probar todo libremente</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Los datos se reinician todas las noches</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Es una cuenta compartida — no cargues datos reales acá</span>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
