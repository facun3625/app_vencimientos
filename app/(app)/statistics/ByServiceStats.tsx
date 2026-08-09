"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DollarSign, PieChart, Users, X } from "lucide-react";

type ClientLine = { name: string; revenue: number; count: number; kind: "recurring" | "onetime" };
type SvcRow = {
  id: string;
  name: string;
  type: string;
  recurringActive: number;
  onceCount: number;
  revenue: number;
  clients: ClientLine[];
};

const money = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

function Ranking({
  title,
  subtitle,
  icon,
  rows,
  metric,
  barClass,
  onSelect,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: SvcRow[];
  metric: (s: SvcRow) => { value: number; label: React.ReactNode };
  barClass: string;
  onSelect: (s: SvcRow) => void;
}) {
  const top = rows.length > 0 ? Math.max(metric(rows[0]).value, 1) : 1;

  return (
    <div className="card !p-6">
      <h2 className="flex items-center gap-2 font-bold text-white mb-1">{icon} {title}</h2>
      <p className="text-xs text-[var(--text-muted)] mb-5 capitalize">{subtitle}</p>
      <div className="flex flex-col gap-2">
        {rows.map((s, i) => {
          const m = metric(s);
          const pct = Math.max((m.value / top) * 100, m.value > 0 ? 4 : 0);
          const clientCount = s.clients.length;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left cursor-pointer group rounded-lg p-2 -mx-2 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex justify-between items-center text-sm mb-1 gap-2">
                <span className="flex items-center gap-2 text-white font-medium min-w-0">
                  <span className="text-[var(--text-muted)] font-mono text-xs w-4 shrink-0">{i + 1}</span>
                  <span className="truncate group-hover:text-[var(--primary)] transition-colors">{s.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${s.type === "RECURRING" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {s.type === "RECURRING" ? "Recurrente" : "Único"}
                  </span>
                </span>
                <span className="font-mono font-bold shrink-0">{m.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)] group-hover:text-white/70 transition-colors">
                <Users size={11} />
                {clientCount} {clientCount === 1 ? "cliente" : "clientes"} · ver detalle
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClientsModal({ svc, onClose }: { svc: SvcRow; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!mounted) return null;

  const total = svc.recurringActive + svc.onceCount;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="card !p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-bold text-white text-lg flex items-center gap-2 min-w-0">
            <span className="truncate">{svc.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${svc.type === "RECURRING" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
              {svc.type === "RECURRING" ? "Recurrente" : "Único"}
            </span>
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/50 hover:text-white cursor-pointer shrink-0">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          {total} {total === 1 ? "asignación" : "asignaciones"} · {money(svc.revenue)} en ingresos
        </p>

        {svc.clients.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic py-4 text-center">Sin clientes en este período.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {svc.clients.map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex items-center justify-between gap-2 text-sm py-2 px-3 rounded-lg bg-white/[0.03]">
                <span className="flex items-center gap-2 min-w-0 text-white">
                  <Users size={13} className="text-[var(--text-muted)] shrink-0" />
                  <span className="truncate">{c.name}</span>
                  {c.count > 1 && <span className="text-[var(--text-muted)] text-xs shrink-0">×{c.count}</span>}
                </span>
                <span className="font-mono text-emerald-400 shrink-0">{money(c.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function ByServiceStats({
  byRevenue,
  byCount,
  periodLabel,
}: {
  byRevenue: SvcRow[];
  byCount: SvcRow[];
  periodLabel: string;
}) {
  const [selected, setSelected] = useState<SvcRow | null>(null);

  if (byRevenue.length === 0) {
    return (
      <div className="card !p-10 text-center text-[var(--text-muted)]">
        No hay servicios con actividad en {periodLabel}.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Ranking
          title="Los que más plata te dan"
          subtitle={`Ingresos por servicio en ${periodLabel}. Tocá para ver los clientes.`}
          icon={<DollarSign size={18} className="text-emerald-400" />}
          rows={byRevenue}
          barClass="bg-emerald-500/60"
          onSelect={setSelected}
          metric={(s) => ({ value: s.revenue, label: <span className="text-emerald-400">{money(s.revenue)}</span> })}
        />
        <Ranking
          title="Los que más usás"
          subtitle={`Contratos activos + entregas únicas en ${periodLabel}. Tocá para ver los clientes.`}
          icon={<PieChart size={18} className="text-blue-400" />}
          rows={byCount}
          barClass="bg-blue-500/60"
          onSelect={setSelected}
          metric={(s) => {
            const total = s.recurringActive + s.onceCount;
            return {
              value: total,
              label: (
                <span className="text-white">
                  {total}
                  <span className="text-[var(--text-muted)] text-xs font-normal"> {total === 1 ? "vez" : "veces"}</span>
                </span>
              ),
            };
          }}
        />
      </div>

      {selected && <ClientsModal svc={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
