"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function getWorkspaceId() {
  const session = await auth();
  if (!session) return null;
  return (session.user as any).workspaceId;
}

const catalogSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["RECURRING", "ONE_TIME"]),
  description: z.string().optional(),
});

export async function createServiceBaseAction(formData: FormData) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return { error: "No autorizado" };
  const raw = Object.fromEntries(formData);
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const item = await prisma.serviceBase.create({ data: { ...parsed.data, workspaceId } });
  await auditLog({ action: "CREATE", entity: "ServiceBase", entityId: item.id, newValue: item });
  revalidatePath("/catalog");
  return { success: true, item };
}

const updateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function updateServiceBaseAction(id: string, formData: FormData) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return { error: "No autorizado" };
  const old = await prisma.serviceBase.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "No encontrado" };

  const raw = Object.fromEntries(formData);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const updated = await prisma.serviceBase.update({ where: { id }, data: parsed.data });
  await auditLog({ action: "UPDATE", entity: "ServiceBase", entityId: id, oldValue: old, newValue: updated });
  revalidatePath("/catalog");
}

export async function deleteServiceBaseAction(id: string) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return { error: "No autorizado" };
  const old = await prisma.serviceBase.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "No encontrado" };
  await prisma.serviceBase.delete({ where: { id } });
  await auditLog({ action: "DELETE", entity: "ServiceBase", entityId: id, oldValue: old });
  revalidatePath("/catalog");
}
