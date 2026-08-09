"use client";
import { useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { toggleGroupPaidAction } from "../services/actions";

export default function GroupPaidButton({ items, allPaid }: { items: { id: string; type: "contract" | "onetime" }[]; allPaid: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
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
  );
}
