import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PlanCards from "./PlanCards";

export default async function PricingPage() {
  const session = await auth();
  const workspaceId = (session?.user as any)?.workspaceId as string | undefined;

  const [plans, workspace] = await Promise.all([
    prisma.plan.findMany({ orderBy: { priceAmount: "asc" } }),
    workspaceId ? prisma.workspace.findUnique({ where: { id: workspaceId } }) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <PublicNav loggedIn={!!session} />
      <PlanCards plans={plans} loggedIn={!!session} currentTier={workspace?.planTier} />
      <PublicFooter />
    </div>
  );
}
