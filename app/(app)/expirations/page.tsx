import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, addDays, isSameDay, endOfMonth } from "date-fns";
import { Clock, AlertCircle, CheckCircle2, Calendar, Repeat, Zap, Wallet } from "lucide-react";
import CalendarView from "./CalendarView";
import ExpirationGroupCard from "./ExpirationGroupCard";
import { ensureCurrentOrders } from "@/lib/billing";
import { sumByCurrency, formatByCurrency } from "@/lib/money";

export default async function ExpirationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const params = await searchParams;
  const tab = params.tab || "week";
  const typeFilter = params.type === "recurring" || params.type === "onetime" ? params.type : "all";

  await ensureCurrentOrders(workspaceId);

  const now = new Date();
  const weekEnd = addDays(now, 7);
  const monthEnd = endOfMonth(now);

  const buildHref = (overrides: { tab?: string; type?: string }) => {
    const q = new URLSearchParams({ tab, type: typeFilter, ...overrides });
    return `/expirations?${q.toString()}`;
  };

  // Fetch the current billing period for every recurring contract, plus every one-time service
  const [payments, oneTimeServices] = await Promise.all([
    prisma.contractPayment.findMany({
      where: { contract: { client: { workspaceId } } },
      include: { contract: { include: { client: true, serviceBase: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.oneTimeService.findMany({
      where: { client: { workspaceId } },
      include: { client: true, serviceBase: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const recurringItems = payments.map(p => ({
    id: p.id,
    type: "contract" as const,
    viewType: "RECURRING" as const,
    clientId: p.contract.clientId,
    client: p.contract.client,
    serviceBase: p.contract.serviceBase,
    price: p.contract.price,
    currency: p.currency,
    expirationDate: p.dueDate,
    isPaid: p.isPaid,
  }));

  const oneTimeItems = oneTimeServices.map(s => ({
    id: s.id,
    type: "onetime" as const,
    viewType: "ONE_TIME" as const,
    clientId: s.clientId,
    client: s.client,
    serviceBase: s.serviceBase,
    price: s.finalPrice,
    currency: s.currency,
    expirationDate: s.deliveryDate || s.createdAt,
    isPaid: s.isPaid,
  }));

  const allItems = [...recurringItems, ...oneTimeItems];
  const byType = typeFilter === "all" ? allItems : allItems.filter(c => c.type === (typeFilter === "recurring" ? "contract" : "onetime"));

  const items = tab === 'map' ? byType : byType.filter(c => {
    if (c.isPaid) return false;
    const d = new Date(c.expirationDate);
    if (tab === 'today') return isSameDay(d, now);
    if (tab === 'week') return d >= now && d <= weekEnd;
    if (tab === 'month') return d >= now && d <= monthEnd;
    if (tab === 'expired') return d < now;
    return true;
  });

  const pendingItems = items.filter(c => !c.isPaid);
  const pendingRecurring = pendingItems.filter(c => c.type === "contract");
  const pendingOnetime = pendingItems.filter(c => c.type === "onetime");
  const pendingByCurrency = sumByCurrency(pendingItems, c => c.price, c => c.currency);

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Clock size={20} /></div>
          <h1 className="page-title !mb-0">Control de Vencimientos</h1>
        </div>
        <p className="page-subtitle">Seguimiento de contratos recurrentes y servicios únicos que requieren atención</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>*]:shrink-0">
          <a href={buildHref({ tab: "today" })} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'today' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Hoy</a>
          <a href={buildHref({ tab: "week" })} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'week' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Esta Semana</a>
          <a href={buildHref({ tab: "month" })} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'month' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Este Mes</a>
          <a href={buildHref({ tab: "expired" })} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'expired' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Ya Vencidos</a>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>*]:shrink-0">
          <a href={buildHref({ type: "all" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Todos</a>
          <a href={buildHref({ type: "recurring" })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'recurring' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><Repeat size={12} /> Recurrentes</a>
          <a href={buildHref({ type: "onetime" })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'onetime' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><Zap size={12} /> Únicos</a>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>*]:shrink-0">
          <a href={buildHref({ tab: tab === 'map' ? 'week' : tab })} className={`p-2 rounded-lg transition-all ${tab !== 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)]'}`} title="Vista de Lista">
             <AlertCircle size={18} />
          </a>
          <a href={buildHref({ tab: "map" })} className={`p-2 rounded-lg transition-all ${tab === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-muted)]'}`} title="Vista de Mapa (Calendario)">
             <Calendar size={18} />
          </a>
        </div>
      </div>

      {tab !== 'map' && (
        <div className="card !p-4 mb-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Repeat size={14} className="text-blue-400" />
            <span className="text-white font-bold">{pendingRecurring.length}</span>
            <span className="text-[var(--text-muted)]">recurrente{pendingRecurring.length !== 1 ? "s" : ""} pendiente{pendingRecurring.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap size={14} className="text-amber-400" />
            <span className="text-white font-bold">{pendingOnetime.length}</span>
            <span className="text-[var(--text-muted)]">único{pendingOnetime.length !== 1 ? "s" : ""} pendiente{pendingOnetime.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <Wallet size={14} className="text-emerald-400" />
            <span className="text-[var(--text-muted)]">Por cobrar en este período:</span>
            <span className="text-emerald-400 font-black font-mono">{formatByCurrency(pendingByCurrency)}</span>
          </div>
        </div>
      )}

      {tab === 'map' ? (
        <CalendarView contracts={items} />
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {(() => {
            const grouped: any[] = [];
            items.forEach(c => {
              const dStr = format(new Date(c.expirationDate), "yyyy-MM-dd");
              const key = `${c.clientId}-${dStr}`;
              let group = grouped.find(g => g.key === key);
              if (!group) {
                group = { key, client: c.client, date: c.expirationDate, dateLabel: format(new Date(c.expirationDate), "dd/MM/yyyy"), items: [], totalsByCurrency: {} as Record<string, number> };
                grouped.push(group);
              }
              group.items.push(c);
              group.totalsByCurrency[c.currency] = (group.totalsByCurrency[c.currency] || 0) + Number(c.price);
            });

            if (grouped.length === 0) {
              return (
                <div className="card !p-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                    <CheckCircle2 size={40} className="text-emerald-500/50" />
                    <p>¡Todo al día! No hay vencimientos pendientes en este período.</p>
                  </div>
                </div>
              );
            }

            return grouped.map(group => {
              const isPast = new Date(group.date) < now;
              return <ExpirationGroupCard key={group.key} group={group} isPast={isPast} />;
            })
          })()}
        </div>
      )}
    </div>
  );
}
