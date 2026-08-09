"use client";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateExpenseAction, deleteExpenseAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function ExpenseRow({ expense, month }: { expense: any; month: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.set("month", month);
          startTransition(async () => {
            await updateExpenseAction(expense.id, formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-2 p-3 border-b border-white/5 last:border-0"
      >
        <input name="description" required defaultValue={expense.description} className="form-input" />
        <input name="amount" type="number" step="0.01" required defaultValue={expense.amount} className="form-input" />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">{isPending ? "..." : "Guardar"}</button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
      <div className="font-semibold text-sm">{expense.description}</div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-red-400 font-mono text-sm">${expense.amount}</span>
        <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm p-1"><Pencil size={12} /></button>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="btn btn-danger btn-sm p-1"
        ><Trash2 size={12} /></button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        danger
        title={`Borrar "${expense.description}"`}
        message="Se eliminará este gasto del mes. Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            await deleteExpenseAction(expense.id);
          });
        }}
      />
    </div>
  );
}
