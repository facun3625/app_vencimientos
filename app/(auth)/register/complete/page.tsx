import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createSubscriptionCheckout } from "@/lib/mercadopago";

// Landing spot for registerWithGoogleAction's redirectTo — bridges the OAuth
// round-trip back into the same "paid plan -> Mercado Pago checkout" step
// registerAction does inline for credentials signups.
export default async function RegisterCompletePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (!user.workspaceId) redirect("/dashboard");

  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
  if (!workspace || workspace.subscriptionStatus !== "TRIALING" || workspace.mpSubscriptionId) {
    redirect("/dashboard");
  }

  const plan = await prisma.plan.findUnique({ where: { tier: workspace.planTier } });
  if (!plan || plan.priceAmount <= 0) redirect("/dashboard");

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";

  let initPoint: string;
  try {
    const checkout = await createSubscriptionCheckout({
      planName: plan.name,
      price: plan.priceAmount,
      currency: plan.currency,
      frequency: plan.billingInterval === "yearly" ? "yearly" : "monthly",
      payerEmail: user.email,
      externalReference: workspace.id,
      backUrl: `${baseUrl}/dashboard`,
    });
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { mpSubscriptionId: checkout.preapprovalId },
    });
    initPoint = checkout.initPoint;
  } catch (err) {
    console.error("Error creando checkout de Mercado Pago tras registro con Google:", err);
    redirect("/dashboard?payment_pending=1");
  }

  redirect(initPoint);
}
