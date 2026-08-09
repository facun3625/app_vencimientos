"use client";
import { useState, useTransition } from "react";
import { RotateCcw, CheckCircle2 } from "lucide-react";
import { resetDemoAction } from "../actions";
import ConfirmModal from "@/components/ConfirmModal";

export default function ResetDemoButton({ hasWorkspace }: { hasWorkspace: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button onClick={() => setOpen(true)} disabled={isPending} className="btn btn-secondary w-fit">
        <RotateCcw size={14} className={isPending ? "animate-spin" : ""} />
        {hasWorkspace ? "Resetear datos de demo" : "Crear datos de demo"}
      </button>
      {done && (
        <p className="flex items-center gap-1.5 text-emerald-400 text-xs mt-2">
          <CheckCircle2 size={13} /> Listo, datos de demo actualizados.
        </p>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <ConfirmModal
        open={open}
        title={hasWorkspace ? "Resetear datos de demo" : "Crear datos de demo"}
        message="Borra todo lo que haya en el workspace demo (clientes, servicios, vencimientos) y lo vuelve a cargar con los datos de ejemplo originales."
        confirmLabel={hasWorkspace ? "Resetear" : "Crear"}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setError("");
          setDone(false);
          startTransition(async () => {
            const res = await resetDemoAction();
            if (res?.error) setError(res.error);
            else setDone(true);
          });
        }}
      />
    </div>
  );
}
