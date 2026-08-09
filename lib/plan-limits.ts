import { prisma } from "@/lib/prisma";

export async function assertClientLimit(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return;
  const plan = await prisma.plan.findUnique({ where: { tier: workspace.planTier } });
  if (!plan?.clientLimit) return;

  const count = await prisma.client.count({ where: { workspaceId } });
  if (count >= plan.clientLimit) {
    throw new Error(
      `Llegaste al límite de ${plan.clientLimit} clientes de tu plan ${plan.name}. Mejorá tu plan en "Mi Suscripción" para agregar más.`
    );
  }
}

export async function assertUserLimit(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return;
  const plan = await prisma.plan.findUnique({ where: { tier: workspace.planTier } });
  if (!plan?.userLimit) return;

  const count = await prisma.user.count({ where: { workspaceId } });
  if (count >= plan.userLimit) {
    throw new Error(
      `Llegaste al límite de ${plan.userLimit} usuarios de tu plan ${plan.name}. Mejorá tu plan en "Mi Suscripción" para invitar a más gente.`
    );
  }
}
