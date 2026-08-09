import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function auditLog({ action, entity, entityId, oldValue, newValue }: any) {
  const session = await auth();
  if (!session?.user) return;
  const user = session.user as any;
  await prisma.auditLog.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      action, entity, entityId,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
    },
  });
}
