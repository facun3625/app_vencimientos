"use client";
import { useState, useTransition } from "react";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { updateMonthlyCostAction, deleteMonthlyCostAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function MonthlyCostRow({ cost }: { cost: any }) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const perClient = cost.activeCount > 0 ? cost.amount / cost.activeCount : cost.amount;

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            await updateMonthlyCostAction(cost.id, formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-2 p-3 border-b border-white/5 last:border-0"
      >
        <input name="name" required defaultValue={cost.name} className="form-input" />
        <input name="amount" type="number" step="0.01" required defaultValue={cost.amount} className="form-input" />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">{isPending ? "..." : "Guardar"}</button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" /> : <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />}
          <div>
            <div className="font-semibold text-sm">{cost.name}</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {cost.activeCount} servicio{cost.activeCount === 1 ? "" : "s"} · ${perClient.toFixed(2)} c/u
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="font-bold text-red-400 font-mono text-sm">${cost.amount}/mes</span>
          <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm p-1"><Pencil size={12} /></button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            className="btn btn-danger btn-sm p-1"
          ><Trash2 size={12} /></button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        danger
        title={`Borrar "${cost.name}"`}
        message="Este costo mensual dejará de prorratearse entre los servicios que lo usan. Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            await deleteMonthlyCostAction(cost.id);
          });
        }}
      />

      {open && (
        <div className="pl-8 pb-3">
          {cost.contracts.length === 0 ? (
            <div className="text-xs italic text-[var(--text-muted)] py-2">Ningún servicio activo usa este costo todavía.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {cost.contracts.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-lg bg-white/[0.03]">
                  <div>
                    <span className="font-semibold text-white">{c.client.name}</span>
                    <span className="text-[var(--text-muted)]"> — {c.serviceBase.name}</span>
                  </div>
                  <span className="font-mono text-[var(--text-muted)]">${perClient.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
