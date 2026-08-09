import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Server } from "lucide-react";
import MonthlyCostForm from "./MonthlyCostForm";
import MonthlyCostRow from "./MonthlyCostRow";

export default async function MonthlyCostsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;

  const costs = await prisma.monthlyCost.findMany({
    where: { workspaceId },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        include: { client: true, serviceBase: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const items = costs.map(c => ({ ...c, activeCount: c.contracts.length }));
  const totalMonthly = items.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><Server size={20} /></div>
          <h1 className="page-title !mb-0">Costos Mensuales</h1>
        </div>
        <p className="page-subtitle">
          Costos que se pagan mes a mes y se reparten entre los clientes que los usan (ej: un servidor cloud de $500/mes dividido entre 5 clientes = $100 c/u)
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="card !p-4 mb-6 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">Total Mensual</span>
          <span className="text-xl font-black text-red-400 font-mono">${totalMonthly.toLocaleString("es-AR")}/mes</span>
        </div>

        <div className="mb-4">
          <MonthlyCostForm />
        </div>

        <div className="card !p-2 h-fit min-h-[100px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] italic">No hay costos mensuales definidos</div>
          ) : (
            items.map(c => <MonthlyCostRow key={c.id} cost={c} />)
          )}
        </div>
      </div>
    </div>
  );
}
