import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PlanCards from "./PlanCards";

export default async function PricingPage() {
  const session = await auth();
  const plans = await prisma.plan.findMany({ orderBy: { priceAmount: "asc" } });

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <PublicNav loggedIn={!!session} />
      <PlanCards plans={plans} />
      <PublicFooter />
    </div>
  );
}
