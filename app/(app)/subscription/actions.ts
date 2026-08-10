"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription, createSubscriptionCheckout } from "@/lib/mercadopago";
import { revalidatePath } from "next/cache";

type Tier = "STARTER" | "PROFESIONAL" | "AGENCIA";

// In-app plan change for a logged-in workspace.
//  - Free target: applies immediately (and cancels any paid MP subscription).
//  - Paid target: opens a Mercado Pago checkout and stores the target as
//    pendingPlanTier; the webhook promotes it to planTier once MP authorizes
//    the payment. Returns { initPoint } for the client to redirect to.
export async function changePlanAction(tier: Tier) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.workspaceId) return { error: "No autorizado" };

  const [workspace, plan] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: user.workspaceId } }),
    prisma.plan.findUnique({ where: { tier } }),
  ]);
  if (!workspace) return { error: "Workspace no encontrado" };
  if (!plan) return { error: "El plan elegido no existe" };

  if (workspace.planTier === tier && workspace.subscriptionStatus === "ACTIVE") {
    return { error: "Ya estás en ese plan" };
  }

  // Free plan: apply now and drop any existing paid subscription.
  if (plan.priceAmount <= 0) {
    if (workspace.mpSubscriptionId) {
      try {
        await cancelSubscription(workspace.mpSubscriptionId);
      } catch (err) {
        console.error("No se pudo cancelar la suscripción previa en MP:", err);
      }
    }
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        planTier: tier,
        pendingPlanTier: null,
        subscriptionStatus: "ACTIVE",
        mpSubscriptionId: null,
        currentPeriodEnd: null,
      },
    });
    revalidatePath("/subscription");
    return { success: true };
  }

  // Paid plan: kick off Mercado Pago checkout; planTier stays as-is until paid.
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";
  try {
    const checkout = await createSubscriptionCheckout({
      planName: plan.name,
      price: plan.priceAmount,
      currency: plan.currency,
      frequency: plan.billingInterval === "yearly" ? "yearly" : "monthly",
      payerEmail: user.email || workspace.mpPayerEmail || "",
      externalReference: workspace.id,
      backUrl: `${baseUrl}/subscription`,
    });
    // Only stash the target plan. We deliberately don't touch planTier,
    // subscriptionStatus or mpSubscriptionId here: if the user abandons the
    // Mercado Pago checkout they keep their current plan untouched. The webhook
    // sets mpSubscriptionId and promotes pendingPlanTier once the payment is
    // authorized. (Note: a paid->paid upgrade leaves the previous MP
    // subscription live; with only one paid tier today that path isn't hit.)
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { pendingPlanTier: tier },
    });
    return { initPoint: checkout.initPoint };
  } catch (err: any) {
    console.error("Error creando checkout de Mercado Pago (cambio de plan):", err);
    return { error: err.message || "No se pudo iniciar el pago en Mercado Pago" };
  }
}

export async function cancelSubscriptionAction() {
  const session = await auth();
  const user = session?.user as any;
  if (!user) return { error: "No autorizado" };

  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
  if (!workspace?.mpSubscriptionId) return { error: "No hay una suscripción activa para cancelar" };

  try {
    await cancelSubscription(workspace.mpSubscriptionId);
  } catch (err: any) {
    return { error: err.message || "No se pudo cancelar en Mercado Pago" };
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { subscriptionStatus: "CANCELED" },
  });

  revalidatePath("/subscription");
  return { success: true };
}
