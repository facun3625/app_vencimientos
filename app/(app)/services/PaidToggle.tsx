"use client";
import { useTransition } from "react";
import { togglePaidAction } from "./actions";
import { CheckCircle2, Clock } from "lucide-react";

export default function PaidToggle({
  id,
  type,
  isPaid,
}: {
  id: string;
  type: "contract" | "onetime";
  isPaid: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => togglePaidAction(id, type, !isPaid))}
      disabled={isPending}
      title={isPaid ? "Marcar como pendiente" : "Marcar como cobrado"}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-tighter transition-colors ${
        isPaid
          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      }`}
    >
      {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
      {isPaid ? "Cobrado" : "Pendiente"}
    </button>
  );
}
