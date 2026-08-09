import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { startOfDay, differenceInDays, format } from "date-fns";
import { TrendingUp, Users as UsersIcon, Package, Calendar, AlertTriangle, Bell, Info, Wallet } from "lucide-react";
import Link from "next/link";
import { getSevenBusinessDaysRange } from "@/lib/date-utils";
import { ensureCurrentOrders } from "@/lib/billing";
import { getCurrentYearNetResult } from "@/lib/businessSummary";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  const workspaceId = user.workspaceId;

  await ensureCurrentOrders(workspaceId);

  const { start, end } = getSevenBusinessDaysRange();

  const [activeClients, activeContracts, duePayments, upcomingPayments] = await Promise.all([
    prisma.client.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.serviceContract.count({ where: { client: { workspaceId }, status: "ACTIVE" } }),
    prisma.contractPayment.findMany({
      where: { isPaid: false, contract: { client: { workspaceId }, status: "ACTIVE" } },
      include: { contract: { include: { client: true, serviceBase: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.contractPayment.findMany({
      where: {
        isPaid: false,
        contract: { client: { workspaceId }, status: "ACTIVE" },
        dueDate: { gte: start, lte: end },
      },
      include: { contract: { include: { client: true, serviceBase: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const contracts = duePayments.map(p => ({
    id: p.id,
    client: p.contract.client,
    serviceBase: p.contract.serviceBase,
    price: p.contract.price,
    expirationDate: p.dueDate,
  }));
  const upcomingExpirations = upcomingPayments;

  const { year: netYear, netResult, monthlyAverage } = await getCurrentYearNetResult(workspaceId);

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-end gap-2 mb-6">
        <div>
          <p className="text-[var(--primary)] font-semibold text-sm mb-1">Resumen General</p>
          <h1 className="page-title !mb-0">Dashboard</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)] tracking-wider uppercase font-bold">Actualizado</p>
          <p className="text-sm font-black text-white">
            {new Intl.DateTimeFormat("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              dateStyle: "long",
              timeStyle: "medium",
            }).format(new Date())}
          </p>
        </div>
      </div>

      {upcomingExpirations.length > 0 && (
        <div className="mb-8 animate-shake">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                <Bell size={28} className="animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">¡Vencimientos a la vista! 🚀</h2>
                <p className="text-sm text-amber-500/80 font-medium max-w-md">
                   Tenés <strong>{upcomingExpirations.length} servicios</strong> venciendo en los próximos <strong>7 días hábiles</strong>.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/expirations?tab=week" className="btn bg-white text-black hover:bg-white/90 font-bold px-6">
                 Atender ahora
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex justify-between items-start mb-2">
            <span className="stat-label">Promedio Mensual (Neto)</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Wallet size={16} /></div>
          </div>
          <div className={`stat-value ${netResult >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            ${Math.round(monthlyAverage).toLocaleString("es-AR")}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Resultado neto {netYear} / 12</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-2">
            <span className="stat-label">Clientes Activos</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><UsersIcon size={16} /></div>
          </div>
          <div className="stat-value">{activeClients}</div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Base de clientes saludable</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-2">
            <span className="stat-label">Servicios Activos</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><Package size={16} /></div>
          </div>
          <div className="stat-value">{activeContracts}</div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Suscripciones recurrentes</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-2">
            <span className="stat-label">Próximos Vencimientos</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Calendar size={16} /></div>
          </div>
          <div className="stat-value">{contracts.length}</div>
          <p className="text-xs text-amber-500 mt-2">Acción requerida pronto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Vencimientos Recientes</h2>
            <Link href="/expirations" className="text-sm text-[var(--primary)] hover:underline">Ver todos</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Cliente</th><th>Servicio</th><th>Vencimiento</th><th>Precio</th></tr>
              </thead>
              <tbody>
                  {contracts.map(c => {
                    const daysLeft = differenceInDays(new Date(c.expirationDate), startOfDay(new Date()));
                    return (
                      <tr key={c.id} className="group hover:bg-white/[0.02]">
                        <td className="py-4">
                          <div className="font-bold text-white leading-tight">{c.client.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{c.client.company || 'Final'}</div>
                        </td>
                        <td><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-tighter border border-blue-500/20">{c.serviceBase.name}</span></td>
                        <td>
                          <div className="font-bold text-white font-mono text-sm">{format(c.expirationDate, "dd/MM/yyyy")}</div>
                          <div className={`text-[10px] font-black uppercase ${daysLeft <= 3 ? 'text-red-500' : 'text-amber-500 animate-pulse'}`}>
                             {daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? '¡Vencía Hoy!' : `En ${daysLeft} días`}
                          </div>
                        </td>
                        <td className="font-black text-white font-mono text-right pr-4">${c.price}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
          <div className="w-16 h-16 rounded-full bg-gradient-blue flex items-center justify-center mb-4 shadow-xl">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Potenciá tu Negocio</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Analizá tus márgenes de ganancia y optimizá tu rentabilidad con reportes avanzados.</p>
          <Link href="/statistics" className="btn btn-primary w-full justify-center">Ver Estadísticas</Link>
        </div>
      </div>
    </div>
  );
}
