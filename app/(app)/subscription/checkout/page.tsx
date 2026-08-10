import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Star, ArrowLeft, RefreshCw } from "lucide-react";
import CheckoutConfirm from "./CheckoutConfirm";

const TIERS = ["STARTER", "PROFESIONAL", "AGENCIA"] as const;
type Tier = (typeof TIERS)[number];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;

  const params = await searchParams;
  const tier = (params.plan || "").toUpperCase();
  if (!TIERS.includes(tier as Tier)) redirect("/subscription/plans");

  const [plan, workspace] = await Promise.all([
    prisma.plan.findUnique({ where: { tier: tier as Tier } }),
    prisma.workspace.findUnique({ where: { id: user.workspaceId } }),
  ]);
  if (!plan || !workspace) redirect("/subscription/plans");

  // Already on this exact plan — nothing to check out.
  if (workspace.planTier === plan.tier && workspace.subscriptionStatus === "ACTIVE") {
    redirect("/subscription");
  }

  const currentPlan =
    workspace.planTier !== plan.tier
      ? await prisma.plan.findUnique({ where: { tier: workspace.planTier } })
      : null;

  const isPaid = plan.priceAmount > 0;
  const features = plan.features as string[];
  const priceLabel = isPaid
    ? `${plan.currency} ${plan.priceAmount.toLocaleString("es-AR")}`
    : "Gratis";
  const intervalLabel = plan.billingInterval === "monthly" ? "por mes" : "por año";

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto">
        <Link
          href="/subscription/plans"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Volver a los planes
        </Link>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-1">
            Confirmar suscripción
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Estás por cambiar tu plan
          </h1>
        </div>

        <div className="card !p-0 overflow-hidden">
          {/* Plan header */}
          <div className={`p-6 ${plan.featured ? "bg-blue-500/5" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  {plan.featured && (
                    <span className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      <Star size={9} /> Recomendado
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)]">{plan.description}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 font-mono mt-4">
              <span className="text-3xl font-black text-white">{priceLabel}</span>
              {isPaid && <span className="text-sm text-[var(--text-muted)]">{intervalLabel}</span>}
            </div>

            {currentPlan && (
              <div className="flex items-center gap-2 mt-4 text-sm text-[var(--text-muted)]">
                <span className="badge badge-muted">{currentPlan.name}</span>
                <RefreshCw size={13} />
                <span className={`badge ${plan.featured ? "badge-success" : "badge-muted"}`}>{plan.name}</span>
              </div>
            )}
          </div>

          {/* Included features */}
          <div className="px-6 pb-6 pt-1 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-3 mt-4">
              Incluye
            </p>
            <ul className="flex flex-col gap-2.5">
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
            </ul>
          </div>

          {/* Confirm */}
          <div className="px-6 pb-6">
            {isPaid && (
              <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                Se creará una suscripción recurrente en Mercado Pago de{" "}
                <span className="text-white font-semibold">
                  {priceLabel} {intervalLabel}
                </span>
                . Podés cancelarla cuando quieras desde “Mi Suscripción”. Sin permanencia.
              </p>
            )}
            <CheckoutConfirm tier={plan.tier} isPaid={isPaid} />
          </div>
        </div>
      </div>
    </div>
  );
}
