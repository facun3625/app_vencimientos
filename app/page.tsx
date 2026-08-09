import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import DemoEnterButton from "@/app/demo/DemoEnterButton";
import PlansAccordion from "@/components/PlansAccordion";
import {
  ArrowRight,
  Users,
  Clock,
  Wallet,
  BarChart3,
  UserPlus,
  KeyRound,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Clientes y servicios",
    text: "Ficha de cliente con notas y contacto, catálogo de servicios recurrentes y únicos, buscador predictivo.",
  },
  {
    icon: Clock,
    title: "Vencimientos y cobros",
    text: "Vista por Hoy, Semana, Mes y Vencidos, más calendario mensual. Marcá cobrado, facturado y enviado por separado.",
  },
  {
    icon: Wallet,
    title: "Costos y rentabilidad",
    text: "Costos compartidos prorrateados entre los clientes que los usan, más gastos operativos del mes.",
  },
  {
    icon: BarChart3,
    title: "Centro de inteligencia",
    text: "Ingreso recurrente, únicos, utilidad neta y resultado del negocio por mes o por año. Real o proyectado.",
  },
  {
    icon: UserPlus,
    title: "Equipo",
    text: "Más de una persona puede trabajar sobre el mismo workspace, con roles distintos.",
  },
  {
    icon: KeyRound,
    title: "Acceso",
    text: "Ingreso con Google o con email y contraseña, con recuperación de acceso por mail.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const plans = await prisma.plan.findMany({ orderBy: { priceAmount: "asc" } });

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <PublicNav loggedIn={!!session} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-emerald-600/10 blur-[120px] rounded-full" />

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-4">
            Para profesionales y agencias que facturan servicios recurrentes
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Dejá de perseguir vencimientos en una planilla.
          </h1>
          <p className="text-lg text-[var(--text-muted)] mt-6 max-w-xl">
            Kairos junta clientes, servicios, vencimientos y rentabilidad en un solo lugar. Sabés qué
            vence esta semana, qué está cobrado, qué falta facturar y cuánto te queda de ganancia real.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="btn btn-primary h-12 px-6 text-base shadow-lg shadow-blue-500/20">
              Crear cuenta gratis <ArrowRight size={18} />
            </Link>
            <Link href="/#demo" className="btn btn-secondary h-12 px-6 text-base">
              <FlaskConical size={16} /> Probar sin registrarte
            </Link>
          </div>

          <div className="flex flex-wrap gap-10 mt-14">
            <div>
              <p className="text-2xl font-black font-mono">&lt;5 min</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">para cargar tu primer cliente</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono">100%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">vencimientos reales, no proyectados a ciegas</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono">1 lugar</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">para cobros, costos y rentabilidad</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-6">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-2">Funciones</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Todo lo que hoy hacés en cinco planillas distintas</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card !p-6">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <f.icon size={18} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans teaser */}
      <section id="planes" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-6">
        <PlansAccordion plans={plans} />
      </section>

      {/* Demo CTA */}
      <section id="demo" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24">
        <div className="card !p-10 md:!p-14 relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border-blue-500/20 text-center">
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[60%] h-[80%] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-4">Modo demo</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 max-w-xl mx-auto">
            Probá Kairos con datos ya cargados
          </h2>
          <p className="text-[var(--text-muted)] mb-10 max-w-lg mx-auto">
            Sin email, sin contraseña, sin tarjeta. Entrás directo a un workspace de ejemplo con
            clientes, vencimientos y costos reales para que veas cómo se usa de verdad.
          </p>

          <DemoEnterButton />

          <div className="flex flex-col gap-3 mt-12 text-left max-w-lg mx-auto">
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
      </section>

      <PublicFooter />
    </div>
  );
}
