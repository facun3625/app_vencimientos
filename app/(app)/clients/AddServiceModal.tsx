"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Repeat, Zap } from "lucide-react";
import ServiceForm from "@/app/(app)/services/ServiceForm";

// Local modal to add a service to a specific client straight from the Clients
// view. Uses ServiceForm directly (not the intercepting-route modal, which is
// unreliable when navigating in from another section). On save, ServiceForm's
// server action redirects to /services, which also dismisses this.
export default function AddServiceModal({
  client,
  clients,
  serviceBases,
  monthlyCosts,
  onClose,
}: {
  client: { id: string; name: string };
  clients: any[];
  serviceBases: any[];
  monthlyCosts: any[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<"RECURRING" | "ONE_TIME">("RECURRING");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!mounted) return null;

  const filteredBases = serviceBases.filter((b) => b.type === type);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center p-4 py-10 bg-black/60 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div className="modal-compact card !p-6 w-full max-w-5xl relative my-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 text-white/50 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </button>

        <h1 className="text-lg font-bold mb-1">Agregar servicio</h1>
        <p className="text-xs text-[var(--text-muted)] mb-5">Para {client.name}</p>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 w-fit mb-6">
          <button
            type="button"
            onClick={() => setType("RECURRING")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${type === "RECURRING" ? "bg-white/10 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            <Repeat size={14} /> Recurrente
          </button>
          <button
            type="button"
            onClick={() => setType("ONE_TIME")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${type === "ONE_TIME" ? "bg-white/10 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            <Zap size={14} /> Único
          </button>
        </div>

        <ServiceForm
          key={type}
          type={type}
          clients={clients}
          serviceBases={filteredBases}
          monthlyCosts={monthlyCosts}
          defaultClientId={client.id}
        />
      </div>
    </div>,
    document.body
  );
}
