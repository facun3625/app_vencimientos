import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, addMonths, subMonths, differenceInCalendarMonths } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, DollarSign, Users, ChevronUp, ChevronDown, Clock, Repeat, Zap, Wallet, ChevronLeft, ChevronRight, PieChart } from "lucide-react";
import StatsDashboard from "./StatsDashboard";
import ByServiceStats from "./ByServiceStats";
import InfoTooltip from "@/components/InfoTooltip";

const ACCENTS: Record<string, { bar: string; iconBg: string; iconText: string }> = {
  blue: { bar: "bg-blue-500", iconBg: "bg-blue-500/10", iconText: "text-blue-500" },
  red: { bar: "bg-red-500", iconBg: "bg-red-500/10", iconText: "text-red-500" },
  emerald: { bar: "bg-emerald-500", iconBg: "bg-emerald-500/10", iconText: "text-emerald-500" },
  purple: { bar: "bg-purple-500", iconBg: "bg-purple-500/10", iconText: "text-purple-500" },
  amber: { bar: "bg-amber-500", iconBg: "bg-amber-500/10", iconText: "text-amber-500" },
};

function StatCard({
  label,
  tooltip,
  value,
  icon,
  accent,
  footer,
  valueClass = "text-white",
}: {
  label: string;
  tooltip?: string;
  value: string;
  icon: React.ReactNode;
  accent: keyof typeof ACCENTS;
  footer: React.ReactNode;
  valueClass?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="card group flex !p-0 overflow-hidden items-stretch transition-all hover:bg-white/[0.04] min-w-0">
      <div className={`w-1.5 ${a.bar} shrink-0`} />
      <div className="flex-1 min-w-0" style={{ padding: "20px" }}>
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {label}
            {tooltip && <InfoTooltip text={tooltip} />}
          </span>
          <div className={`p-1.5 ${a.iconBg} ${a.iconText} rounded-lg group-hover:scale-110 transition-transform shrink-0`}>{icon}</div>
        </div>
        <div className={`text-lg font-semibold tracking-tight mb-1 truncate ${valueClass}`} title={value}>{value}</div>
        {footer}
      </div>
    </div>
  );
}

const FREQUENCY_TO_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, BIANNUAL: 6, ANNUAL: 12 };

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; granularity?: string; period?: string; mode?: string; currency?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const params = await searchParams;
  // Los reportes no mezclan monedas: se ve una a la vez (ARS por defecto). Cada
  // total usa la misma lógica de siempre, pero sobre datos de esa sola moneda.
  const currency = params.currency === "USD" ? "USD" : "ARS";
  const sym = currency === "USD" ? "US$" : "$";
  const isARS = currency === "ARS";
  const tab =
    params.tab === "onetime" ? "onetime"
    : params.tab === "summary" ? "summary"
    : params.tab === "byservice" ? "byservice"
    : "recurring";
  const granularity = params.granularity === "year" ? "year" : "month";
  // "real" only counts recurring revenue/cost up to today (no speculation about
  // months that haven't happened). "projected" extends both to the whole period
  // as if every currently active contract keeps billing at its current rate —
  // useful to see where the year is heading. Once services and Gastos have no
  // subscription base to extrapolate from, so they're always "real" regardless.
  // Projecting a single month adds little over "real" (it's already fully past,
  // current, or future) — the toggle only makes sense across a whole year.
  const mode = granularity === "year" && params.mode === "projected" ? "projected" : "real";

  const now = new Date();
  let periodStart: Date, periodEnd: Date, periodLabel: string, prevPeriod: string, nextPeriod: string, currentPeriod: string;
  if (granularity === "year") {
    const year = parseInt(params.period || format(now, "yyyy"), 10);
    periodStart = new Date(year, 0, 1);
    periodEnd = new Date(year + 1, 0, 1);
    periodLabel = `${year}`;
    prevPeriod = `${year - 1}`;
    nextPeriod = `${year + 1}`;
    currentPeriod = format(now, "yyyy");
  } else {
    const period = params.period || format(now, "yyyy-MM");
    const [py, pm] = period.split("-").map(Number);
    periodStart = new Date(py, pm - 1, 1);
    periodEnd = new Date(py, pm, 1);
    periodLabel = format(periodStart, "MMMM yyyy", { locale: es });
    prevPeriod = format(subMonths(periodStart, 1), "yyyy-MM");
    nextPeriod = format(addMonths(periodStart, 1), "yyyy-MM");
    currentPeriod = format(now, "yyyy-MM");
  }
  const period = params.period || currentPeriod;

  const buildHref = (overrides: { tab?: string; granularity?: string; period?: string; mode?: string; currency?: string }) => {
    const q = new URLSearchParams({ tab, granularity, period, mode, currency, ...overrides });
    return `/statistics?${q.toString()}`;
  };

  // Every tab below is scoped to the selected period (month or year), using the
  // real billing records (ContractPayment.dueDate, OneTimeService.deliveryDate,
  // MonthlyExpense.month) so any tab can be sliced by any past or future period.
  const [contracts, periodPayments, periodOnceServices, periodExpenses] = await Promise.all([
    // ACTIVE contracts, used only to know which ones already existed during the
    // period and their (prorated) cost — cost accrues every month regardless of
    // when a given contract happens to bill, unlike revenue.
    prisma.serviceContract.findMany({
      where: { client: { workspaceId }, status: "ACTIVE", currency },
      include: { monthlyCosts: true, serviceBase: true, client: true },
    }),
    prisma.contractPayment.findMany({
      where: { contract: { client: { workspaceId } }, currency, dueDate: { gte: periodStart, lt: periodEnd } },
      include: { contract: { include: { serviceBase: true, client: true } } },
    }),
    prisma.oneTimeService.findMany({
      where: {
        client: { workspaceId },
        currency,
        OR: [
          { deliveryDate: { gte: periodStart, lt: periodEnd } },
          { deliveryDate: null, createdAt: { gte: periodStart, lt: periodEnd } },
        ],
      },
      include: { serviceBase: true, client: true },
    }),
    // Gastos y costos mensuales compartidos son SIEMPRE en pesos: en la vista
    // USD no aplican (quedan en cero), así no se mezclan monedas.
    isARS
      ? prisma.monthlyExpense.findMany({ where: { workspaceId, month: { gte: periodStart, lt: periodEnd } } })
      : Promise.resolve([] as any[]),
  ]);

  // Count how many active contracts share each MonthlyCost, to split it evenly
  const costUsers: Record<string, number> = {};
  contracts.forEach(c => {
    c.monthlyCosts.forEach(mc => {
      costUsers[mc.id] = (costUsers[mc.id] || 0) + 1;
    });
  });
  const monthly = contracts.map(c => {
    const months = FREQUENCY_TO_MONTHS[c.frequency] ?? 1;
    // Los costos mensuales compartidos son en pesos: no se suman en la vista USD.
    const sharedCost = isARS ? c.monthlyCosts.reduce((sum, mc) => sum + mc.amount / costUsers[mc.id], 0) : 0;
    return { ...c, monthlyPrice: c.price / months, monthlyCost: c.cost / months + sharedCost };
  });

  // Recurring cost accrues every month regardless of when a contract happens to
  // bill — a Cloud Server keeps costing money every month even for clients
  // billed annually — so it can't be derived from periodPayments the way revenue
  // is. "real" (up to the current month) is always computed first; "projected"
  // just adds an estimate for the remaining months on top of it, using only
  // contracts that are active right now — so projected can never come out lower
  // than real, even if a contract billed earlier this year and was since paused.
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const realCutoff = periodEnd < addMonths(currentMonthStart, 1) ? periodEnd : addMonths(currentMonthStart, 1);

  const monthsUpToReal = (startDate: Date) => {
    const effectiveStart = startDate > periodStart ? startDate : periodStart;
    if (effectiveStart >= realCutoff) return 0;
    return Math.max(Math.min(differenceInCalendarMonths(realCutoff, effectiveStart), 12), 0);
  };
  const monthsRemaining = (startDate: Date) => {
    const effectiveStart = startDate > realCutoff ? startDate : realCutoff;
    if (effectiveStart >= periodEnd) return 0;
    return Math.max(Math.min(differenceInCalendarMonths(periodEnd, effectiveStart), 12), 0);
  };

  const periodRecurringRevenueReal = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  const periodRecurringCostReal = monthly.reduce((sum, c) => sum + c.monthlyCost * monthsUpToReal(c.startDate), 0);
  const periodRecurringRevenueFuture = monthly.reduce((sum, c) => sum + c.monthlyPrice * monthsRemaining(c.startDate), 0);
  const periodRecurringCostFuture = monthly.reduce((sum, c) => sum + c.monthlyCost * monthsRemaining(c.startDate), 0);

  const periodRecurringRevenue = mode === "real" ? periodRecurringRevenueReal : periodRecurringRevenueReal + periodRecurringRevenueFuture;
  const periodRecurringCost = mode === "real" ? periodRecurringCostReal : periodRecurringCostReal + periodRecurringCostFuture;
  const periodRecurringMargin = periodRecurringRevenue - periodRecurringCost;
  const periodRecurringMarginPct = periodRecurringRevenue > 0 ? (periodRecurringMargin / periodRecurringRevenue) * 100 : 0;
  const periodRecurringServiceCount =
    mode === "real" ? periodPayments.length : periodPayments.length + monthly.filter(c => monthsRemaining(c.startDate) > 0).length;
  const periodRecurringTicket = periodRecurringServiceCount > 0 ? periodRecurringRevenue / periodRecurringServiceCount : 0;

  const recurringDistributionReal = periodPayments.reduce((acc: any, p) => {
    const name = p.contract.serviceBase.name || "Otro";
    acc[name] = (acc[name] || 0) + p.amount;
    return acc;
  }, {});
  const recurringDistribution = { ...recurringDistributionReal };
  if (mode === "projected") {
    monthly.forEach(c => {
      const name = c.serviceBase.name || "Otro";
      const add = c.monthlyPrice * monthsRemaining(c.startDate);
      if (add > 0) recurringDistribution[name] = (recurringDistribution[name] || 0) + add;
    });
  }
  const pieData = Object.entries(recurringDistribution).map(([name, value]) => ({ name, value }));

  const recurringClientRevenueReal = periodPayments.reduce((acc: any, p) => {
    const name = p.contract.client.name;
    acc[name] = (acc[name] || 0) + p.amount;
    return acc;
  }, {});
  const recurringClientRevenue = { ...recurringClientRevenueReal };
  if (mode === "projected") {
    monthly.forEach(c => {
      const name = c.client.name;
      const add = c.monthlyPrice * monthsRemaining(c.startDate);
      if (add > 0) recurringClientRevenue[name] = (recurringClientRevenue[name] || 0) + add;
    });
  }
  const barData = Object.entries(recurringClientRevenue)
    .map(([name, revenue]) => ({ name, revenue: revenue as number }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // One-time: like Recurrentes, "Ingreso" counts everything charged in the period
  // regardless of collection status (if it's in the system, it either already
  // got paid or will). "Pendiente de Cobro" stays as an informational follow-up
  // figure — it's a subset of Ingreso, not something subtracted from it.
  const periodOnceUnpaid = periodOnceServices.filter(o => !o.isPaid);
  const periodOnceRevenue = periodOnceServices.reduce((sum, o) => sum + o.finalPrice, 0);
  const periodOncePending = periodOnceUnpaid.reduce((sum, o) => sum + o.finalPrice, 0);
  const periodOnceCost = periodOnceServices.reduce((sum, o) => sum + o.internalCost, 0);
  const periodOnceMargin = periodOnceRevenue - periodOnceCost;
  const periodOnceMarginPct = periodOnceRevenue > 0 ? (periodOnceMargin / periodOnceRevenue) * 100 : 0;
  const periodOnceTicket = periodOnceServices.length > 0 ? periodOnceRevenue / periodOnceServices.length : 0;

  const onceDistribution = periodOnceServices.reduce((acc: any, o) => {
    const name = o.serviceBase.name || "Otro";
    acc[name] = (acc[name] || 0) + o.finalPrice;
    return acc;
  }, {});
  const oncePieData = Object.entries(onceDistribution).map(([name, value]) => ({ name, value }));

  const onceClientRevenue = periodOnceServices.reduce((acc: any, o) => {
    const name = o.client.name;
    acc[name] = (acc[name] || 0) + o.finalPrice;
    return acc;
  }, {});
  const onceBarData = Object.entries(onceClientRevenue)
    .map(([name, revenue]) => ({ name, revenue: revenue as number }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Gastos Generales: overhead not attributable to any single client (luz,
  // internet, herramientas), so it's netted once against the combined profit
  // instead of prorated per contract.
  const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const periodExpensesCount = periodExpenses.length;

  const periodTotalRevenue = periodRecurringRevenue + periodOnceRevenue;
  const periodTotalServiceCost = periodRecurringCost + periodOnceCost;
  const periodGrossProfit = periodTotalRevenue - periodTotalServiceCost;
  const periodGrossMarginPct = periodTotalRevenue > 0 ? (periodGrossProfit / periodTotalRevenue) * 100 : 0;
  const periodNetResult = periodGrossProfit - periodExpensesTotal;
  const periodNetMarginPct = periodTotalRevenue > 0 ? (periodNetResult / periodTotalRevenue) * 100 : 0;

  // ── Ranking por servicio del catálogo (tab "Por Servicio") ──
  // Reúne, por cada tipo de servicio: contratos recurrentes activos, entregas
  // únicas del período, ingresos del período (pagos recurrentes + precio de
  // únicos) y el desglose por cliente (para el acordeón que muestra quiénes
  // tienen cada servicio).
  type SvcClientLine = { name: string; revenue: number; count: number; kind: "recurring" | "onetime" };
  type SvcAgg = {
    id: string; name: string; type: string;
    recurringActive: number; onceCount: number; revenue: number;
    clients: Record<string, SvcClientLine>;
  };
  const svcMap = new Map<string, SvcAgg>();
  const ensureSvc = (id: string, name: string, type: string) => {
    let e = svcMap.get(id);
    if (!e) { e = { id, name, type, recurringActive: 0, onceCount: 0, revenue: 0, clients: {} }; svcMap.set(id, e); }
    return e;
  };
  const ensureClient = (svc: SvcAgg, clientId: string, name: string, kind: "recurring" | "onetime") => {
    let c = svc.clients[clientId];
    if (!c) { c = { name, revenue: 0, count: 0, kind }; svc.clients[clientId] = c; }
    return c;
  };
  contracts.forEach(c => {
    const svc = ensureSvc(c.serviceBaseId, c.serviceBase.name, c.serviceBase.type);
    svc.recurringActive++;
    ensureClient(svc, c.clientId, c.client.name, "recurring").count++;
  });
  periodPayments.forEach(p => {
    const svc = ensureSvc(p.contract.serviceBaseId, p.contract.serviceBase.name, p.contract.serviceBase.type);
    svc.revenue += p.amount;
    ensureClient(svc, p.contract.clientId, p.contract.client.name, "recurring").revenue += p.amount;
  });
  periodOnceServices.forEach(o => {
    const svc = ensureSvc(o.serviceBaseId, o.serviceBase.name, o.serviceBase.type);
    svc.onceCount++;
    svc.revenue += o.finalPrice;
    const cl = ensureClient(svc, o.clientId, o.client.name, "onetime");
    cl.count++;
    cl.revenue += o.finalPrice;
  });
  const svcList = [...svcMap.values()].map(s => ({
    id: s.id, name: s.name, type: s.type,
    recurringActive: s.recurringActive, onceCount: s.onceCount, revenue: s.revenue,
    clients: Object.values(s.clients).sort((a, b) => b.revenue - a.revenue),
  }));
  const svcByRevenue = [...svcList].sort((a, b) => b.revenue - a.revenue);
  const svcByCount = [...svcList].sort((a, b) => (b.recurringActive + b.onceCount) - (a.recurringActive + a.onceCount));

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <h1 className="page-title">Centro de Inteligencia</h1>
        <p className="page-subtitle">Análisis detallado de rentabilidad y proyecciones de crecimiento</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>a]:shrink-0">
          <Link href={buildHref({ tab: "recurring" })} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'recurring' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <Repeat size={14} /> Recurrentes
            <InfoTooltip text="Contratos con cobro periódico (mensual, trimestral, semestral o anual). Se ve por mes o por año, real o proyectado." />
          </Link>
          <Link href={buildHref({ tab: "onetime" })} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'onetime' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <Zap size={14} /> Únicos
            <InfoTooltip text="Trabajos puntuales, sin ciclo de cobro. Siempre se muestran reales — no aplica el modo Proyectado." />
          </Link>
          <Link href={buildHref({ tab: "summary" })} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'summary' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <Wallet size={14} /> Resumen del Negocio
            <InfoTooltip text="Junta Recurrentes y Únicos, y les resta los Gastos Generales — el resultado final del negocio en el período." />
          </Link>
          <Link href={buildHref({ tab: "byservice" })} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'byservice' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <PieChart size={14} /> Por Servicio
            <InfoTooltip text="Ranking de los servicios del catálogo: cuáles usás más y cuáles te generan más ingresos en el período." />
          </Link>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link href={buildHref({ granularity: "month", period: format(now, "yyyy-MM"), mode: "real" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${granularity === 'month' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            Mes
          </Link>
          <Link href={buildHref({ granularity: "year", period: format(now, "yyyy") })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${granularity === 'year' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            Año
          </Link>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5" title="Los reportes se ven de a una moneda por vez (no se mezclan pesos y dólares)">
          <Link href={buildHref({ currency: "ARS" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${currency === 'ARS' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            $ Pesos
          </Link>
          <Link href={buildHref({ currency: "USD" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${currency === 'USD' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
            US$ Dólares
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
          <Link href={buildHref({ period: prevPeriod })} className="btn btn-secondary !p-2 rounded-full">
            <ChevronLeft size={16} />
          </Link>
          <span className="font-bold text-white capitalize px-2 min-w-[140px] text-center">{periodLabel}</span>
          <Link href={buildHref({ period: nextPeriod })} className="btn btn-secondary !p-2 rounded-full">
            <ChevronRight size={16} />
          </Link>
          {period !== currentPeriod && (
            <Link href={buildHref({ period: currentPeriod })} className="btn btn-secondary !px-3 !text-xs">
              Hoy
            </Link>
          )}
        </div>

        {tab !== 'onetime' && tab !== 'byservice' && granularity === 'year' && (
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5" title="Solo afecta a los servicios recurrentes: los únicos y gastos siempre son reales">
            <Link href={buildHref({ mode: "real" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'real' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
              Hasta Hoy
            </Link>
            <Link href={buildHref({ mode: "projected" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'projected' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>
              Proyectado
            </Link>
          </div>
        )}
      </div>

      {tab !== 'onetime' && tab !== 'byservice' && granularity === 'year' && mode === 'projected' && (
        <div className="card !p-3 mb-6 flex items-center gap-3 border-l-4 border-l-purple-500">
          <TrendingUp size={16} className="text-purple-400 shrink-0" />
          <p className="text-xs text-[var(--text-muted)]">
            Proyección: asume que cada contrato recurrente activo sigue facturando a su tarifa actual durante todo el período. Los servicios únicos y los gastos generales no se proyectan, solo cuentan lo que realmente se cargó.
          </p>
        </div>
      )}

      {tab === 'recurring' && (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${granularity === 'year' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-10`}>
            <StatCard
              label="Ingreso Recurrente"
              tooltip="Suma los pagos de contratos recurrentes cuyo vencimiento cae en este período. En modo Proyectado se le suma lo que falta facturar si el contrato sigue activo."
              value={`${sym}${Math.round(periodRecurringRevenue).toLocaleString("es-AR")}`}
              icon={<TrendingUp size={14} />}
              accent="blue"
              footer={
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded w-fit">
                  <ChevronUp size={10} /> {periodRecurringServiceCount} servicio{periodRecurringServiceCount !== 1 ? "s" : ""} {mode === "real" ? "facturado" : "activo"}{periodRecurringServiceCount !== 1 ? "s" : ""}
                </div>
              }
            />
            <StatCard
              label="Costos Totales"
              tooltip="Costo de cada contrato activo prorrateado a este período, más su parte de los Costos Mensuales compartidos. Se cuenta todos los meses, aunque el contrato no venza justo ahora."
              value={`${sym}${Math.round(periodRecurringCost).toLocaleString("es-AR")}`}
              icon={<DollarSign size={14} />}
              accent="red"
              footer={
                <div className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest bg-red-500/5 px-2 py-0.5 rounded w-fit">
                  Gastos Operativos
                </div>
              }
            />
            <StatCard
              label="Utilidad Neta"
              tooltip="Ingreso Recurrente menos Costos Totales de este período."
              value={`${sym}${Math.round(periodRecurringMargin).toLocaleString("es-AR")}`}
              icon={<ChevronUp size={14} />}
              accent="emerald"
              valueClass="text-emerald-400"
              footer={
                <div className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded w-fit">
                  {periodRecurringMarginPct.toFixed(1)}% Margen
                </div>
              }
            />
            <StatCard
              label="Ticket (Por Servicio)"
              tooltip="Ingreso Recurrente dividido por la cantidad de servicios facturados (o activos, en modo Proyectado)."
              value={`${sym}${Math.round(periodRecurringTicket).toLocaleString("es-AR")}`}
              icon={<Users size={14} />}
              accent="purple"
              footer={
                <div className="text-[9px] font-bold text-purple-400/70 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded w-fit">
                  Por Servicio Facturado
                </div>
              }
            />
            {granularity === 'year' && (
              <StatCard
                label="Promedio Mensual"
                tooltip="Ingreso, costo y utilidad del año, divididos por 12."
                value={`${sym}${Math.round(periodRecurringRevenue / 12).toLocaleString("es-AR")}`}
                icon={<Repeat size={14} />}
                accent="blue"
                footer={
                  <div className="text-[9px] font-bold text-blue-400/70 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded w-fit">
                    Costo ${Math.round(periodRecurringCost / 12).toLocaleString("es-AR")} · Utilidad ${Math.round(periodRecurringMargin / 12).toLocaleString("es-AR")}
                  </div>
                }
              />
            )}
          </div>

          <StatsDashboard
            pieData={pieData}
            barData={barData}
            pieSubtitle={`Volumen facturado en ${periodLabel}, por categoría`}
            pieEmptyText="No hay servicios recurrentes facturados en este período"
            barSubtitle="Clientes con mayor facturación recurrente en el período"
            barEmptyText="Sin facturación recurrente en este período"
          />
        </>
      )}

      {tab === 'onetime' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <StatCard
              label="Ingreso Único"
              tooltip="Suma de todos los servicios únicos cargados en este período, estén cobrados o no."
              value={`${sym}${Math.round(periodOnceRevenue).toLocaleString("es-AR")}`}
              icon={<TrendingUp size={14} />}
              accent="blue"
              footer={
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded w-fit">
                  <ChevronUp size={10} /> {periodOnceServices.length} servicio{periodOnceServices.length !== 1 ? "s" : ""} cargado{periodOnceServices.length !== 1 ? "s" : ""}
                </div>
              }
            />
            <StatCard
              label="Pendiente de Cobro"
              tooltip="Parte del Ingreso Único que todavía no se marcó como cobrado. Ya está incluida en el Ingreso Único de arriba, no se suma aparte."
              value={`${sym}${Math.round(periodOncePending).toLocaleString("es-AR")}`}
              icon={<Clock size={14} />}
              accent={periodOncePending > 0 ? "amber" : "emerald"}
              valueClass={periodOncePending > 0 ? "text-amber-400" : "text-white"}
              footer={
                periodOncePending > 0 ? (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded w-fit">
                    <Clock size={10} /> {periodOnceUnpaid.length} servicio{periodOnceUnpaid.length !== 1 ? "s" : ""} sin cobrar
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded w-fit">
                    <ChevronUp size={10} /> Todo cobrado
                  </div>
                )
              }
            />
            <StatCard
              label="Costos Totales"
              tooltip="Costo de todos los servicios únicos cargados en este período, cobrados o no."
              value={`${sym}${Math.round(periodOnceCost).toLocaleString("es-AR")}`}
              icon={<DollarSign size={14} />}
              accent="red"
              footer={
                <div className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest bg-red-500/5 px-2 py-0.5 rounded w-fit">
                  Gastos Operativos
                </div>
              }
            />
            <StatCard
              label="Utilidad Neta"
              tooltip="Ingreso Único menos Costos Totales de este período."
              value={`${sym}${Math.round(periodOnceMargin).toLocaleString("es-AR")}`}
              icon={<ChevronUp size={14} />}
              accent="emerald"
              valueClass="text-emerald-400"
              footer={
                <div className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded w-fit">
                  {periodOnceMarginPct.toFixed(1)}% Margen
                </div>
              }
            />
            {granularity === 'year' ? (
              <StatCard
                label="Utilidad Promedio"
                tooltip="Utilidad Neta del año dividida por 12."
                value={`${sym}${Math.round(periodOnceMargin / 12).toLocaleString("es-AR")}`}
                icon={<ChevronUp size={14} />}
                accent="purple"
                footer={
                  <div className="text-[9px] font-bold text-purple-400/70 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded w-fit">
                    Por Mes (Utilidad / 12)
                  </div>
                }
              />
            ) : (
              <StatCard
                label="Ticket Promedio"
                tooltip="Ingreso Único dividido por la cantidad de servicios cargados en el período."
                value={`${sym}${Math.round(periodOnceTicket).toLocaleString("es-AR")}`}
                icon={<Users size={14} />}
                accent="purple"
                footer={
                  <div className="text-[9px] font-bold text-purple-400/70 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded w-fit">
                    Por Servicio Único
                  </div>
                }
              />
            )}
          </div>

          <StatsDashboard
            pieData={oncePieData}
            barData={onceBarData}
            pieTitle="Distribución por Servicio"
            pieSubtitle={`Volumen cobrado en ${periodLabel}, por categoría`}
            pieEmptyText="No hay servicios únicos cobrados en este período"
            barTitle="Top 5 Clientes"
            barSubtitle="Clientes con mayor facturación en servicios únicos"
            barEmptyText="Sin servicios únicos cobrados en este período"
          />
        </>
      )}

      {tab === 'summary' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <StatCard
              label="Ingreso del Período"
              tooltip="Ingreso Recurrente más Ingreso Único de este período, sumados."
              value={`${sym}${Math.round(periodTotalRevenue).toLocaleString("es-AR")}`}
              icon={<TrendingUp size={14} />}
              accent="blue"
              footer={
                <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded w-fit">
                  Recurrente ${Math.round(periodRecurringRevenue).toLocaleString("es-AR")} · Único ${Math.round(periodOnceRevenue).toLocaleString("es-AR")}
                </div>
              }
            />
            <StatCard
              label="Costos de Servicios"
              tooltip="Costos Totales de Recurrentes más Costos Totales de Únicos de este período."
              value={`${sym}${Math.round(periodTotalServiceCost).toLocaleString("es-AR")}`}
              icon={<DollarSign size={14} />}
              accent="red"
              footer={
                <div className="text-[9px] font-bold text-red-400/70 uppercase tracking-widest bg-red-500/5 px-2 py-0.5 rounded w-fit">
                  Recurrente ${Math.round(periodRecurringCost).toLocaleString("es-AR")} · Único ${Math.round(periodOnceCost).toLocaleString("es-AR")}
                </div>
              }
            />
            <StatCard
              label="Gastos Generales"
              tooltip="Gastos operativos del negocio (luz, internet, herramientas) que no se le cargan a un cliente puntual — se cargan desde la sección Gastos."
              value={`${sym}${Math.round(periodExpensesTotal).toLocaleString("es-AR")}`}
              icon={<Wallet size={14} />}
              accent="amber"
              valueClass="text-amber-400"
              footer={
                <div className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded w-fit">
                  {periodExpensesCount} gasto{periodExpensesCount !== 1 ? "s" : ""} cargado{periodExpensesCount !== 1 ? "s" : ""}
                </div>
              }
            />
            <StatCard
              label="Utilidad Bruta"
              tooltip="Ingreso del Período menos Costos de Servicios, antes de restar los Gastos Generales."
              value={`${sym}${Math.round(periodGrossProfit).toLocaleString("es-AR")}`}
              icon={<PieChart size={14} />}
              accent={periodGrossProfit >= 0 ? "emerald" : "red"}
              valueClass={periodGrossProfit >= 0 ? "text-emerald-400" : "text-red-400"}
              footer={
                <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-fit ${periodGrossProfit >= 0 ? "text-emerald-500/70 bg-emerald-500/5" : "text-red-400/70 bg-red-500/5"}`}>
                  {periodGrossMarginPct.toFixed(1)}% Margen (antes de gastos)
                </div>
              }
            />
            {granularity === 'year' ? (
              <StatCard
                label="Promedio Mensual"
                tooltip="Resultado Neto del año dividido por 12."
                value={`${sym}${Math.round(periodNetResult / 12).toLocaleString("es-AR")}`}
                icon={periodNetResult >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                accent={periodNetResult >= 0 ? "emerald" : "red"}
                valueClass={periodNetResult >= 0 ? "text-emerald-400" : "text-red-400"}
                footer={
                  <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-fit ${periodNetResult >= 0 ? "text-emerald-500/70 bg-emerald-500/5" : "text-red-400/70 bg-red-500/5"}`}>
                    Resultado Neto / 12
                  </div>
                }
              />
            ) : (
              <StatCard
                label="Resultado Neto"
                tooltip="Utilidad Bruta menos Gastos Generales de este período — lo que realmente queda."
                value={`${sym}${Math.round(periodNetResult).toLocaleString("es-AR")}`}
                icon={periodNetResult >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                accent={periodNetResult >= 0 ? "emerald" : "red"}
                valueClass={periodNetResult >= 0 ? "text-emerald-400" : "text-red-400"}
                footer={
                  <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-fit ${periodNetResult >= 0 ? "text-emerald-500/70 bg-emerald-500/5" : "text-red-400/70 bg-red-500/5"}`}>
                    {periodNetMarginPct.toFixed(1)}% Margen Neto
                  </div>
                }
              />
            )}
          </div>

          {periodOncePending > 0 && (
            <div className="card !p-4 mb-6 flex items-center gap-3 border-l-4 border-l-amber-500">
              <Clock size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm text-[var(--text-muted)]">
De los servicios únicos de este período, <span className="text-amber-400 font-bold">{sym}{Math.round(periodOncePending).toLocaleString("es-AR")}</span> todavía no se cobraron (ya está incluido en el resultado de arriba, es solo para que sepas a quién avisarle que pague).
              </p>
            </div>
          )}

          <div className="card !p-6 bg-white/[0.02] border border-white/5 text-xs text-[var(--text-muted)] leading-relaxed">
            Los Gastos Generales son costos del negocio que no se le cargan a un cliente puntual (luz, internet, herramientas). Por eso se restan una sola vez sobre la utilidad combinada de servicios recurrentes y únicos del período, en vez de prorratearse por contrato.
          </div>
        </>
      )}

      {tab === 'byservice' && (
        <ByServiceStats byRevenue={svcByRevenue} byCount={svcByCount} periodLabel={periodLabel} symbol={sym} />
      )}
    </div>
  );
}
