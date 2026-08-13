"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, CheckCircle2, Clock, Repeat, Zap } from "lucide-react";
import PaidToggle from "../services/PaidToggle";
import GroupPaidButton from "./GroupPaidButton";
import { formatMoney, formatByCurrency } from "@/lib/money";

export default function ExpirationGroupCard({ group, isPast }: { group: any; isPast: boolean }) {
  const [open, setOpen] = useState(false);
  const allPaid = group.items.every((c: any) => c.isPaid);

  return (
    <div className={`card !p-0 overflow-hidden border-l-4 shadow-xl transition-all ${isPast ? "border-l-red-500" : "border-l-amber-500"}`}>
      <div className="bg-white/[0.03] p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-white/[0.05] transition-colors">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left flex-1 min-w-[200px]">
          {open ? <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" /> : <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />}
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm uppercase shrink-0">
            {group.client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white leading-tight">{group.client.name}</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
              {group.client.company || "Cliente Final"} · {group.items.length} servicio{group.items.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((c: any) => (
                <div key={c.id} className="flex items-center gap-1">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight bg-white/5 text-white/50">
                    {c.viewType === "ONE_TIME" ? <Zap size={9} /> : <Repeat size={9} />}
                    {c.serviceBase.name}
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                      c.isPaid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {c.isPaid ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                    {c.isPaid ? "Cobrado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Fecha Límite</p>
            <p className={`text-xs font-bold flex items-center gap-1 justify-end ${isPast ? "text-red-500" : "text-amber-500"}`}>
              <Calendar size={12} /> {group.dateLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Total</p>
            <p className="text-lg font-black text-white font-mono">{formatByCurrency(group.totalsByCurrency)}</p>
          </div>
          {group.items.length > 1 && (
            <GroupPaidButton
              items={group.items.map((c: any) => ({ id: c.id, type: c.type }))}
              allPaid={allPaid}
            />
          )}
        </div>
      </div>

      {open && (
        <div className="divide-y divide-white/5">
          {group.items.map((c: any) => (
            <div key={c.id} className="p-4 pl-6 md:pl-20 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full ${c.viewType === "ONE_TIME" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`}></div>
                <span className="font-semibold text-white/90">{c.serviceBase.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{c.viewType === "ONE_TIME" ? "Único" : "Recurrente"}</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="font-bold text-white/70 font-mono text-sm">{formatMoney(c.price, c.currency)}</span>
                <PaidToggle id={c.id} type={c.type} isPaid={c.isPaid} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
