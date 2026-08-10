"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changePlanAction } from "@/app/(app)/subscription/actions";

type Tier = "STARTER" | "PROFESIONAL" | "AGENCIA";

// The plan card's call-to-action. Anonymous visitors go through the signup
// flow; a logged-in user triggers an in-app plan change (which redirects to
// Mercado Pago when the target plan is paid).
export default function PlanCta({
  tier,
  name,
  featured,
  loggedIn,
  currentTier,
}: {
  tier: Tier;
  name: string;
  featured: boolean;
  loggedIn: boolean;
  currentTier?: Tier;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const btnClass = `w-full justify-center mt-6 btn ${featured ? "btn-primary" : "btn-secondary"}`;

  if (!loggedIn) {
    return (
      <Link href={`/register?plan=${tier.toLowerCase()}`} className={btnClass}>
        Elegir {name}
      </Link>
    );
  }

  if (currentTier === tier) {
    return (
      <button disabled className={`${btnClass} !opacity-60 !cursor-default`}>
        Plan actual
      </button>
    );
  }

  function change() {
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
    <div className="mt-6">
      <button onClick={change} disabled={pending} className={`${btnClass} !mt-0`}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <>Cambiar a {name}</>}
      </button>
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
}
