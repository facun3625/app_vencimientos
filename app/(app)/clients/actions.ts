"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { assertClientLimit } from "@/lib/plan-limits";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  cuit: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).default("ACTIVE"),
});

async function getWorkspaceId() {
  const session = await auth();
  if (!session) redirect("/login");
  return (session.user as any).workspaceId as string;
}

export async function createClientAction(formData: FormData) {
  const workspaceId = await getWorkspaceId();
  const raw = Object.fromEntries(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await assertClientLimit(workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  try {
    console.log("Creating client with data:", { ...parsed.data, workspaceId });
    const client = await prisma.client.create({
      data: { ...parsed.data, workspaceId, email: parsed.data.email || null },
    });
    await auditLog({ action: "CREATE", entity: "Client", entityId: client.id, newValue: client });
    revalidatePath("/clients");
    return { success: true, client };
  } catch (err: any) {
    console.error("Prisma Create Client Error:", err);
    return { error: "Error de base de datos: " + (err.message || "Error desconocido") };
  }
}

export async function updateClientAction(id: string, formData: FormData) {
  const workspaceId = await getWorkspaceId();
  const raw = Object.fromEntries(formData);
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const old = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "Cliente no encontrado" };
  const client = await prisma.client.update({
    where: { id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });
  await auditLog({ action: "UPDATE", entity: "Client", entityId: id, oldValue: old, newValue: client });
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const workspaceId = await getWorkspaceId();
  const old = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "Cliente no encontrado" };
  await prisma.client.delete({ where: { id } });
  await auditLog({ action: "DELETE", entity: "Client", entityId: id, oldValue: old });
  revalidatePath("/clients");
}
