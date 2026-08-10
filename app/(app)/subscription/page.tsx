import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, ArrowUpRight, CreditCard } from "lucide-react";
import CancelSubscriptionButton from "./CancelSubscriptionButton";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  NONE: { label: "Sin plan", cls: "badge-muted" },
  TRIALING: { label: "Pendiente de pago", cls: "badge-warning" },
  ACTIVE: { label: "Activa", cls: "badge-success" },
  PAST_DUE: { label: "Pago atrasado", cls: "badge-warning" },
  CANCELED: { label: "Cancelada", cls: "badge-muted" },
};

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  const workspaceId = user.workspaceId as string;

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) redirect("/dashboard");

  const [plan, clientCount, userCount] = await Promise.all([
    prisma.plan.findUnique({ where: { tier: workspace.planTier } }),
    prisma.client.count({ where: { workspaceId } }),
    prisma.user.count({ where: { workspaceId } }),
  ]);

  const st = STATUS_LABELS[workspace.subscriptionStatus] || STATUS_LABELS.NONE;

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><CreditCard size={20} /></div>
          <h1 className="page-title !mb-0">Mi Suscripción</h1>
        </div>
        <p className="page-subtitle">Plan actual, uso y facturación</p>
      </div>

      <div className="card !p-6 max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Plan</p>
            <h2 className="text-xl font-bold text-white">{plan?.name ?? "Sin plan asignado"}</h2>
          </div>
          <span className={`badge ${st.cls}`}>{st.label}</span>
        </div>

        {plan && (
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {plan.priceAmount > 0
              ? `${plan.currency} ${plan.priceAmount.toLocaleString("es-AR")} / ${plan.billingInterval === "monthly" ? "mes" : "año"}`
              : "Plan gratuito"}
            {workspace.currentPeriodEnd && (
              <> · próximo cobro {new Date(workspace.currentPeriodEnd).toLocaleDateString("es-AR")}</>
            )}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold mb-1">
              <Users size={12} /> Usuarios
            </div>
            <p className="text-lg font-bold text-white font-mono">
              {userCount}
              {plan?.userLimit ? ` / ${plan.userLimit}` : " · ilimitado"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold mb-1">
              <Briefcase size={12} /> Clientes
            </div>
            <p className="text-lg font-bold text-white font-mono">
              {clientCount}
              {plan?.clientLimit ? ` / ${plan.clientLimit}` : " · ilimitado"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/subscription/plans" className="btn btn-primary">
            <ArrowUpRight size={14} /> Cambiar de plan
          </Link>
          {workspace.mpSubscriptionId && workspace.subscriptionStatus === "ACTIVE" && (
            <CancelSubscriptionButton />
          )}
        </div>
      </div>
    </div>
  );
}
