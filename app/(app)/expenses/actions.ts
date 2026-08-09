"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const expenseSchema = z.object({
  month: z.string(),
  description: z.string().min(1),
  amount: z.coerce.number().min(0),
});

export async function createExpenseAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const month = new Date(`${parsed.data.month}-01`);
  const expense = await prisma.monthlyExpense.create({
    data: { workspaceId, month, description: parsed.data.description, amount: parsed.data.amount },
  });

  await auditLog({ action: "CREATE", entity: "MonthlyExpense", entityId: expense.id, newValue: expense });
  revalidatePath("/expenses");
}

export async function updateExpenseAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.monthlyExpense.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "No encontrado" };

  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const month = new Date(`${parsed.data.month}-01`);
  const updated = await prisma.monthlyExpense.update({
    where: { id },
    data: { month, description: parsed.data.description, amount: parsed.data.amount },
  });

  await auditLog({ action: "UPDATE", entity: "MonthlyExpense", entityId: id, oldValue: old, newValue: updated });
  revalidatePath("/expenses");
}

export async function deleteExpenseAction(id: string) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.monthlyExpense.findFirst({ where: { id, workspaceId } });
  if (!old) return { error: "No encontrado" };

  await prisma.monthlyExpense.delete({ where: { id } });
  await auditLog({ action: "DELETE", entity: "MonthlyExpense", entityId: id, oldValue: old });
  revalidatePath("/expenses");
}
