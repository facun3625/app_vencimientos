"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const monthlyCostSchema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number().min(0),
});

export async function createMonthlyCostAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const raw = Object.fromEntries(formData);
  const parsed = monthlyCostSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const cost = await prisma.monthlyCost.create({ data: { ...parsed.data, workspaceId } });
  await auditLog({ action: "CREATE", entity: "MonthlyCost", entityId: cost.id, newValue: cost });
  revalidatePath("/monthly-costs");
  revalidatePath("/services");
  revalidatePath("/statistics");
}

export async function updateMonthlyCostAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.monthlyCost.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "No encontrado" };

  const raw = Object.fromEntries(formData);
  const parsed = monthlyCostSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const updated = await prisma.monthlyCost.update({ where: { id }, data: parsed.data });
  await auditLog({ action: "UPDATE", entity: "MonthlyCost", entityId: id, oldValue: old, newValue: updated });
  revalidatePath("/monthly-costs");
  revalidatePath("/services");
  revalidatePath("/statistics");
}

export async function deleteMonthlyCostAction(id: string) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.monthlyCost.findFirst({ where: { id, workspaceId }, include: { _count: { select: { contracts: true } } } });
  if (!old) return { error: "No encontrado" };
  if (old._count.contracts > 0) return { error: "No se puede borrar: hay servicios usando este costo. Desvinculalos primero." };

  await prisma.monthlyCost.delete({ where: { id } });
  await auditLog({ action: "DELETE", entity: "MonthlyCost", entityId: id, oldValue: old });
  revalidatePath("/monthly-costs");
  revalidatePath("/services");
  revalidatePath("/statistics");
}
