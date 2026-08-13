import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft, ChevronLeft, ChevronRight, Repeat, Zap, Wallet, CheckCircle2, Clock, Send, Filter } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ServiceGroupCard from "./ServiceGroupCard";
import { ensureCurrentOrders } from "@/lib/billing";
import { sumByCurrency, formatByCurrency } from "@/lib/money";

const FREQ: Record<string, string> = { MONTHLY: "Mensual", QUARTERLY: "Trimestral", BIANNUAL: "Semestral", ANNUAL: "Anual" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ month?: string; type?: string; freq?: string; paid?: string; sent?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;

  await ensureCurrentOrders(workspaceId);

  const params = await searchParams;
  const monthParam = params.month || format(new Date(), "yyyy-MM");
  const typeFilter = params.type === "recurring" || params.type === "onetime" ? params.type : "all";
  const freqFilter = ["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"].includes(params.freq || "") ? params.freq! : "";
  const paidFilter = params.paid === "paid" || params.paid === "pending" ? params.paid : "all";
  const sentFilter = params.sent === "sent" || params.sent === "unsent" ? params.sent : "all";
  const [y, m] = monthParam.split("-").map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const prevMonthStr = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonthStr = format(addMonths(monthDate, 1), "yyyy-MM");
  const currentMonthStr = format(new Date(), "yyyy-MM");

  const buildHref = (overrides: { month?: string; type?: string; freq?: string; paid?: string; sent?: string }) => {
    const q = new URLSearchParams({ month: monthParam, type: typeFilter, freq: freqFilter, paid: paidFilter, sent: sentFilter, ...overrides });
    return `/services?${q.toString()}`;
  };

  const [contracts, oneTime, serviceBases, monthlyCosts] = await Promise.all([
    prisma.serviceContract.findMany({
      where: { client: { workspaceId } },
      include: { client: true, serviceBase: true, payments: true, monthlyCosts: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oneTimeService.findMany({ where: { client: { workspaceId } }, include: { client: true, serviceBase: true }, orderBy: { createdAt: "desc" } }),
    prisma.serviceBase.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.monthlyCost.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  // Merge services for a unified view — one entry per billing period, not just the current one,
  // so past/future months show the actual record for that period.
  const allServices = [
    ...contracts.flatMap(c =>
      c.payments.map(p => ({
        ...c,
        id: p.id,
        contractId: c.id,
        paymentId: p.id,
        viewType: "RECURRING" as const,
        price: p.amount,
        expirationDate: p.dueDate,
        isPaid: p.isPaid,
        invoiced: p.invoiced,
        invoiceSent: p.invoiceSent,
        displayDate: p.dueDate,
        displayFreq: FREQ[c.frequency],
        displayStatus: c.status,
      }))
    ),
    ...oneTime.map(s => ({
      ...s,
      viewType: "ONE_TIME" as const,
      displayDate: s.deliveryDate || s.createdAt,
      displayFreq: "Pago Único",
      displayStatus: s.isPaid ? "COBRADO" : "PENDIENTE",
      price: s.finalPrice
    }))
  ].filter(s => format(new Date(s.displayDate), "yyyy-MM") === monthParam)
   .filter(s => typeFilter === "all" || (typeFilter === "recurring" ? s.viewType === "RECURRING" : s.viewType === "ONE_TIME"))
   .filter(s => !freqFilter || (s as any).frequency === freqFilter)
   .filter(s => paidFilter === "all" || (paidFilter === "paid" ? s.isPaid : !s.isPaid))
   .filter(s => sentFilter === "all" || (sentFilter === "sent" ? s.invoiceSent : !s.invoiceSent))
   .sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  const monthByCurrency = sumByCurrency(allServices, s => Number(s.price), s => (s as any).currency);
  const paidByCurrency = sumByCurrency(allServices.filter(s => s.isPaid), s => Number(s.price), s => (s as any).currency);
  const pendingByCurrency = sumByCurrency(allServices.filter(s => !s.isPaid), s => Number(s.price), s => (s as any).currency);
  const recurringCount = allServices.filter(s => s.viewType === "RECURRING").length;
  const onetimeCount = allServices.filter(s => s.viewType === "ONE_TIME").length;

  // Group services by client (already restricted to a single month above)
  const groupedServices: any[] = [];
  allServices.forEach(s => {
    const key = s.clientId;
    let group = groupedServices.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        client: s.client,
        displayDate: s.displayDate,
        displayDateLabel: format(new Date(s.displayDate), "dd MMM"),
        services: [],
        total: 0
      };
      groupedServices.push(group);
    }
    if (new Date(s.displayDate) < new Date(group.displayDate)) {
      group.displayDate = s.displayDate;
      group.displayDateLabel = format(new Date(s.displayDate), "dd MMM");
    }
    group.services.push(s);
    group.totalsByCurrency = group.totalsByCurrency || {};
    group.totalsByCurrency[(s as any).currency || "ARS"] = (group.totalsByCurrency[(s as any).currency || "ARS"] || 0) + Number(s.price);
  });

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-secondary !p-2 rounded-full overflow-hidden" title="Volver al Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title !mb-0 text-3xl">Gestión de Servicios</h1>
            <p className="page-subtitle text-xs">Vista unificada y agrupada de tus asignaciones</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/services/new?type=RECURRING" className="btn btn-primary shadow-lg shadow-blue-500/20">
            <Plus size={16} /> Recurrente
          </Link>
          <Link href="/services/new?type=ONE_TIME" className="btn btn-secondary">
            <Plus size={16} /> Único
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
          <Link href={buildHref({ month: prevMonthStr })} className="btn btn-secondary !p-2 rounded-full">
            <ChevronLeft size={16} />
          </Link>
          <span className="font-bold text-white capitalize px-2 min-w-[160px] text-center">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </span>
          <Link href={buildHref({ month: nextMonthStr })} className="btn btn-secondary !p-2 rounded-full">
            <ChevronRight size={16} />
          </Link>
          {monthParam !== currentMonthStr && (
            <Link href={buildHref({ month: currentMonthStr })} className="btn btn-secondary !px-3 !text-xs">
              Hoy
            </Link>
          )}
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>a]:shrink-0">
          <Link href={buildHref({ type: "all" })} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}>Todos</Link>
          <Link href={buildHref({ type: "recurring" })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'recurring' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><Repeat size={12} /> Recurrentes</Link>
          <Link href={buildHref({ type: "onetime" })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === 'onetime' ? 'bg-white/10 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><Zap size={12} /> Únicos</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mr-1">
          <Filter size={12} /> Filtrar:
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>a]:shrink-0">
          <Link href={buildHref({ freq: "" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${!freqFilter ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Todas</Link>
          <Link href={buildHref({ freq: "MONTHLY" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${freqFilter === 'MONTHLY' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Mensual</Link>
          <Link href={buildHref({ freq: "QUARTERLY" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${freqFilter === 'QUARTERLY' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Trimestral</Link>
          <Link href={buildHref({ freq: "BIANNUAL" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${freqFilter === 'BIANNUAL' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Semestral</Link>
          <Link href={buildHref({ freq: "ANNUAL" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${freqFilter === 'ANNUAL' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Anual</Link>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>a]:shrink-0">
          <Link href={buildHref({ paid: "all" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${paidFilter === 'all' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Todos</Link>
          <Link href={buildHref({ paid: "paid" })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${paidFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[var(--text-muted)] hover:text-white'}`}><CheckCircle2 size={11} /> Cobrado</Link>
          <Link href={buildHref({ paid: "pending" })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${paidFilter === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-[var(--text-muted)] hover:text-white'}`}><Clock size={11} /> Pendiente</Link>
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 max-w-full overflow-x-auto [&>a]:shrink-0">
          <Link href={buildHref({ sent: "all" })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${sentFilter === 'all' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Todos</Link>
          <Link href={buildHref({ sent: "sent" })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${sentFilter === 'sent' ? 'bg-cyan-500/20 text-cyan-400' : 'text-[var(--text-muted)] hover:text-white'}`}><Send size={11} /> Enviada</Link>
          <Link href={buildHref({ sent: "unsent" })} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${sentFilter === 'unsent' ? 'bg-white/20 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>Sin enviar</Link>
        </div>

        {(freqFilter || paidFilter !== "all" || sentFilter !== "all") && (
          <Link href={buildHref({ freq: "", paid: "all", sent: "all" })} className="text-[11px] text-[var(--text-muted)] hover:text-white underline">
            Limpiar filtros
          </Link>
        )}
      </div>

      <div className="card !p-4 mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Repeat size={14} className="text-blue-400" />
          <span className="text-white font-bold">{recurringCount}</span>
          <span className="text-[var(--text-muted)]">recurrente{recurringCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap size={14} className="text-amber-400" />
          <span className="text-white font-bold">{onetimeCount}</span>
          <span className="text-[var(--text-muted)]">único{onetimeCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-amber-500" />
          <span className="text-[var(--text-muted)]">Pendiente:</span>
          <span className="text-amber-500 font-black font-mono">{formatByCurrency(pendingByCurrency)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-[var(--text-muted)]">Cobrado:</span>
          <span className="text-emerald-400 font-black font-mono">{formatByCurrency(paidByCurrency)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm ml-auto">
          <Wallet size={14} className="text-white" />
          <span className="text-[var(--text-muted)]">Total del mes a cobrar:</span>
          <span className="text-white font-black font-mono text-base">{formatByCurrency(monthByCurrency)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 animate-fade-in">
        {groupedServices.length === 0 ? (
          <div className="card !p-20 text-center italic text-[var(--text-muted)]">
            No hay servicios registrados en {format(monthDate, "MMMM yyyy", { locale: es })}
          </div>
        ) : (
          groupedServices.map(group => (
            <ServiceGroupCard key={group.key} group={group} serviceBases={serviceBases} monthlyCosts={monthlyCosts} />
          ))
        )}
      </div>
    </div>
  );
}
