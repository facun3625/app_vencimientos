import Link from "next/link";

type Tier = "STARTER" | "PROFESIONAL" | "AGENCIA";

// The plan card's call-to-action. Anonymous visitors go through the signup
// flow; a logged-in user goes to the in-app checkout summary for the chosen
// plan (which then confirms and, for a paid plan, hands off to Mercado Pago).
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

  return (
    <Link href={`/subscription/checkout?plan=${tier.toLowerCase()}`} className={btnClass}>
      Elegir {name}
    </Link>
  );
}
