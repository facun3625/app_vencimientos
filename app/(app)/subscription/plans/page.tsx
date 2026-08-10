import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import PlanCards from "@/app/precios/PlanCards";

// In-app plan picker — same cards as the public /precios page, but rendered
// inside the app shell (sidebar) so a logged-in user never gets bounced out to
// the public marketing page just to change their plan.
export default async function SubscriptionPlansPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId as string;

  const [plans, workspace] = await Promise.all([
    prisma.plan.findMany({ orderBy: { priceAmount: "asc" } }),
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
  ]);

  return (
    <div className="page-container">
      <Link
        href="/subscription"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a Mi Suscripción
      </Link>

      <div className="page-header mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Layers size={20} /></div>
          <h1 className="page-title !mb-0">Cambiar de plan</h1>
        </div>
        <p className="page-subtitle">Elegí el plan según el tamaño de tu operación. Sin permanencia.</p>
      </div>

      <PlanCards
        plans={plans}
        compact
        hideHeader
        loggedIn
        currentTier={workspace?.planTier}
      />
    </div>
  );
}
