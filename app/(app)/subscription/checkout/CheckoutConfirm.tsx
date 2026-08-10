"use client";
import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { changePlanAction } from "../actions";

type Tier = "STARTER" | "PROFESIONAL" | "AGENCIA";

// The confirm step of the checkout: fires the plan change and, for a paid
// plan, redirects to Mercado Pago's hosted checkout (init_point).
export default function CheckoutConfirm({ tier, isPaid }: { tier: Tier; isPaid: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function confirm() {
    setError("");
    startTransition(async () => {
      const res = await changePlanAction(tier);
      if (res?.error) {
        setError(res.error);
      } else if (res?.initPoint) {
        window.location.href = res.initPoint;
      } else if (res?.success) {
        window.location.href = "/subscription";
      }
    });
  }

  return (
    <div>
      <button
        onClick={confirm}
        disabled={pending}
        className="btn btn-primary w-full justify-center h-12 text-base"
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isPaid ? (
          <>Ir a pagar con Mercado Pago <ArrowRight size={18} /></>
        ) : (
          <>Confirmar cambio de plan <ArrowRight size={18} /></>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
      )}

      {isPaid && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mt-4">
          <ShieldCheck size={13} /> Pago seguro procesado por Mercado Pago
        </p>
      )}
    </div>
  );
}
