"use client";

import { useState, useTransition } from "react";
import { updateWorkspaceSubscriptionAction } from "../actions";
import { Loader2, Check } from "lucide-react";

interface SubscriptionControlProps {
  workspaceId: string;
  initialPlanTier: string;
  initialStatus: string;
}

export default function SubscriptionControl({
  workspaceId,
  initialPlanTier,
  initialStatus,
}: SubscriptionControlProps) {
  const [planTier, setPlanTier] = useState(initialPlanTier);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (newPlan: string, newStatus: string) => {
    setError("");
    startTransition(async () => {
      const res = await updateWorkspaceSubscriptionAction(workspaceId, newPlan, newStatus);
      if (res?.error) {
        setError(res.error);
        // revert state
        setPlanTier(planTier);
        setStatus(status);
      } else {
        setPlanTier(newPlan);
        setStatus(newStatus);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[240px]">
      <div className="flex gap-2 items-center">
        {/* Plan Selector */}
        <select
          value={planTier}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value, status)}
          className={`form-input !py-1 !px-2 !text-xs !bg-white/[0.03] border-white/10 rounded-md text-white transition-all duration-300 ${
            showSuccess
              ? "border-emerald-500/50 focus:border-emerald-500 bg-emerald-500/5"
              : error
              ? "border-red-500/50 focus:border-red-500"
              : "hover:border-white/20 focus:border-purple-500"
          }`}
        >
          <option value="STARTER" className="bg-[#111827] text-white">Starter</option>
          <option value="PROFESIONAL" className="bg-[#111827] text-white">Profesional</option>
          <option value="AGENCIA" className="bg-[#111827] text-white">Agencia</option>
        </select>

        {/* Status Selector */}
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleChange(planTier, e.target.value)}
          className={`form-input !py-1 !px-2 !text-xs !bg-white/[0.03] border-white/10 rounded-md text-white transition-all duration-300 ${
            showSuccess
              ? "border-emerald-500/50 focus:border-emerald-500 bg-emerald-500/5"
              : error
              ? "border-red-500/50 focus:border-red-500"
              : "hover:border-white/20 focus:border-purple-500"
          }`}
        >
          <option value="NONE" className="bg-[#111827] text-white">Sin plan</option>
          <option value="TRIALING" className="bg-[#111827] text-white">Pendiente</option>
          <option value="ACTIVE" className="bg-[#111827] text-white">Activo</option>
          <option value="PAST_DUE" className="bg-[#111827] text-white">Pago atrasado</option>
          <option value="CANCELED" className="bg-[#111827] text-white">Cancelado</option>
        </select>

        {/* Status indicator */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {isPending && <Loader2 size={12} className="animate-spin text-purple-400" />}
          {!isPending && showSuccess && <Check size={12} className="text-emerald-400" />}
        </div>
      </div>
      
      {error && <p className="text-[10px] text-red-400 leading-none">{error}</p>}
    </div>
  );
}
