"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/mercadopago";
import { revalidatePath } from "next/cache";

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
