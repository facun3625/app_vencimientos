"use client";
import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { cancelSubscriptionAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function CancelSubscriptionButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button onClick={() => setOpen(true)} disabled={isPending} className="btn btn-danger">
        <XCircle size={14} /> Cancelar suscripción
      </button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <ConfirmModal
        open={open}
        title="Cancelar suscripción"
        message="Vas a perder el acceso a las funciones de tu plan pago cuando termine el período ya pagado. ¿Confirmás?"
        confirmLabel="Sí, cancelar"
        danger
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setError("");
          startTransition(async () => {
            const res = await cancelSubscriptionAction();
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
