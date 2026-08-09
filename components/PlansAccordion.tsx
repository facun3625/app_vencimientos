"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Minus, ChevronDown, Star } from "lucide-react";
import type { Plan } from "@prisma/client";

// The landing page's plans teaser — expands in place per card ("Ver detalle")
// instead of navigating away or opening a modal, per explicit feedback that
// plan details should stay an inline accordion on the same page.
export default function PlansAccordion({ plans }: { plans: Plan[] }) {
  const [openTiers, setOpenTiers] = useState<Set<string>>(new Set());
  const allOpen = openTiers.size === plans.length;

  function toggle(tier: string) {
    setOpenTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  function toggleAll() {
    setOpenTiers(allOpen ? new Set() : new Set(plans.map((p) => p.tier)));
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-2">Planes</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Elegí según el tamaño de tu operación</h2>
        </div>
        <button
          onClick={toggleAll}
          className="text-sm font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
        >
          {allOpen ? "Contraer todo" : "Ver todos los detalles"}
          <ChevronDown size={14} className={`transition-transform duration-200 ${allOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {plans.map((plan) => {
          const isOpen = openTiers.has(plan.tier);
          const features = (plan.features as string[]) || [];
          return (
            <div
              key={plan.tier}
              className={`card !p-6 flex flex-col relative ${plan.featured ? "border-blue-500/40 shadow-lg shadow-blue-500/10" : ""}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-6 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                  <Star size={10} /> Recomendado
                </span>
              )}

              <h3 className="font-bold text-white text-lg">{plan.name}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-black">
                  {plan.priceAmount > 0 ? `${plan.currency} ${plan.priceAmount.toLocaleString("es-AR")}` : "Gratis"}
                </span>
                {plan.priceAmount > 0 && (
                  <span className="text-xs text-[var(--text-muted)]">/ {plan.billingInterval === "monthly" ? "mes" : "año"}</span>
                )}
              </div>

              <button
                onClick={() => toggle(plan.tier)}
                className="btn btn-secondary w-full justify-center mt-5 !text-sm cursor-pointer"
              >
                {isOpen ? "Ocultar detalle" : "Ver detalle"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <ul className="flex flex-col gap-2.5 pt-5 mt-5 border-t border-white/5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/80">{f}</span>
                      </li>
                    ))}
                    {!plan.clientLimit && (
                      <li className="flex items-start gap-2 text-xs">
                        <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/80">Clientes ilimitados</span>
                      </li>
                    )}
                    {plan.clientLimit && (
                      <li className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                        <Minus size={13} className="shrink-0 mt-0.5" />
                        <span>Hasta {plan.clientLimit} clientes activos</span>
                      </li>
                    )}
                  </ul>
                  <Link
                    href={`/register?plan=${plan.tier.toLowerCase()}`}
                    className={`w-full justify-center mt-4 btn !text-sm ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  >
                    Elegir {plan.name}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
