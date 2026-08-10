import Link from "next/link";
import { Check, Minus, Star } from "lucide-react";
import type { Plan, PlanTier } from "@prisma/client";
import PlanCta from "./PlanCta";

// Shared between the standalone /precios page and its @modal intercept, so
// "Ver todos los planes" / "Ver detalle" from the landing page can open this
// same comparison inline instead of navigating away.
export default function PlanCards({
  plans,
  compact,
  loggedIn = false,
  currentTier,
  hideHeader = false,
}: {
  plans: Plan[];
  compact?: boolean;
  loggedIn?: boolean;
  currentTier?: PlanTier;
  hideHeader?: boolean;
}) {
  return (
    <div className={compact ? "" : "max-w-6xl mx-auto px-6 py-16"}>
      {!hideHeader && (
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-3">Planes</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Elegí el plan según el tamaño de tu operación</h1>
          <p className="text-[var(--text-muted)] mt-4">
            Cambiás de plan cuando quieras desde tu cuenta. Sin permanencia.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const features = plan.features as string[];
          return (
            <div
              key={plan.tier}
              className={`card !p-8 flex flex-col relative ${
                plan.featured ? "border-blue-500/50 shadow-xl shadow-blue-500/10" : ""
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                  <Star size={10} /> Recomendado
                </span>
              )}

              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-2 min-h-[42px]">{plan.description}</p>

              <div className="flex items-baseline gap-1.5 font-mono mt-6">
                <span className="text-3xl font-black">
                  {plan.priceAmount > 0 ? `${plan.currency} ${plan.priceAmount.toLocaleString("es-AR")}` : "Gratis"}
                </span>
                {plan.priceAmount > 0 && (
                  <span className="text-sm text-[var(--text-muted)]">
                    / {plan.billingInterval === "monthly" ? "mes" : "año"}
                  </span>
                )}
              </div>

              <PlanCta
                tier={plan.tier}
                name={plan.name}
                featured={plan.featured}
                loggedIn={loggedIn}
                currentTier={currentTier}
              />

              <hr className="border-white/5 my-7" />

              <ul className="flex flex-col gap-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-white/90">{f}</span>
                  </li>
                ))}
                {!plan.clientLimit && (
                  <li className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-white/90">Clientes ilimitados</span>
                  </li>
                )}
                {plan.clientLimit && (
                  <li className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                    <Minus size={15} className="shrink-0 mt-0.5" />
                    <span>Hasta {plan.clientLimit} clientes activos</span>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-14">
        <p className="text-sm text-[var(--text-muted)]">
          ¿Querés probarlo antes?{" "}
          <Link href="/#demo" className="text-[var(--primary)] font-semibold hover:underline">
            Entrá a la demo sin registrarte
          </Link>
        </p>
      </div>
    </div>
  );
}
