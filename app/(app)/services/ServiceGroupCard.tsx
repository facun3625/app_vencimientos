"use client";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Calendar, Plus, CheckCircle2, Clock, Send } from "lucide-react";
import Link from "next/link";
import ServiceRow from "./ServiceRow";
import { toggleGroupPaidAction, togglePaidAction, toggleInvoiceSentAction } from "./actions";

export default function ServiceGroupCard({ group, serviceBases, monthlyCosts = [] }: { group: any; serviceBases: any[]; monthlyCosts?: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allPaid = group.services.every((s: any) => s.isPaid);
  const items = group.services.map((s: any) => ({
    id: s.viewType === "RECURRING" ? s.paymentId : s.id,
    type: s.viewType === "RECURRING" ? ("contract" as const) : ("onetime" as const),
  }));

  return (
    <div className="card !p-0 overflow-hidden border-l-4 border-l-blue-500 shadow-xl transition-all">
      <div className="w-full bg-white/[0.03] p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-white/[0.05] transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(!open)}
          className="flex items-center gap-3 text-left flex-1 min-w-[200px] cursor-pointer"
        >
          {open ? <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" /> : <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />}
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm uppercase shrink-0">
            {group.client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white leading-tight">{group.client.name}</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
              {group.client.company || "Cliente Final"} · {group.services.length} servicio{group.services.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.services.map((s: any) => {
                const svcId = s.viewType === "RECURRING" ? s.paymentId : s.id;
                const svcType = s.viewType === "RECURRING" ? ("contract" as const) : ("onetime" as const);
                return (
                  <div key={s.id} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-white/5 text-white/50">
                      {s.displayFreq}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => togglePaidAction(svcId, svcType, !s.isPaid));
                      }}
                      title={s.isPaid ? "Marcar como pendiente" : "Marcar como cobrado"}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-colors ${
                        s.isPaid ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                      }`}
                    >
                      {s.isPaid ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                      {s.isPaid ? "Cobrado" : "Pendiente"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => toggleInvoiceSentAction(svcId, svcType, !s.invoiceSent));
                      }}
                      title={s.invoiceSent ? "Marcar como sin enviar" : "Marcar como enviada"}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-colors ${
                        s.invoiceSent ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <Send size={9} />
                      {s.invoiceSent ? "Enviada" : "Sin enviar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Vencimiento</p>
            <p className="text-xs font-bold text-amber-500 flex items-center gap-1 justify-end">
              <Calendar size={12} /> {group.displayDateLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Total</p>
            <p className="text-lg font-black text-emerald-400 font-mono">${group.total}</p>
          </div>
          {group.services.length > 1 && (
            <button
              onClick={() => startTransition(() => toggleGroupPaidAction(items, !allPaid))}
              disabled={isPending}
              title={allPaid ? "Marcar todo pendiente" : "Marcar todo cobrado"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-tighter transition-colors ${
                allPaid
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              }`}
            >
              {allPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {allPaid ? "Todo cobrado" : "Marcar todo cobrado"}
            </button>
          )}
        </div>
      </div>

      {open && (
        <>
          <div className="divide-y divide-white/5">
            {group.services.map((s: any) => (
              <ServiceRow key={s.id} service={s} serviceBases={serviceBases} monthlyCosts={monthlyCosts} />
            ))}
          </div>
          <Link
            href={`/services/new?type=RECURRING&clientId=${group.client.id}`}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
          >
            <Plus size={14} /> Agregar servicio a {group.client.name}
          </Link>
        </>
      )}
    </div>
  );
}
