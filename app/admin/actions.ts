"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addDays, subDays } from "date-fns";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SLUG } from "@/lib/demo";

async function requireSuperAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.isSuperAdmin) redirect("/dashboard");
  return user;
}

export async function startImpersonationAction(userId: string) {
  const admin = await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado" };

  const cookieStore = await cookies();
  cookieStore.set("impersonate_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: admin.workspaceId,
      userId: admin.id,
      action: "IMPERSONATE_START",
      entity: "User",
      entityId: userId,
      newValue: { impersonatedEmail: target.email },
    },
  });

  redirect("/dashboard");
}

export async function stopImpersonationAction() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonate_user_id");
  redirect("/admin/users");
}

export async function deleteUserAction(userId: string) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) return { error: "No podés eliminar tu propia cuenta desde acá." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Usuario no encontrado" };
  if (target.isSuperAdmin) return { error: "No se puede eliminar a otro superadmin desde acá." };

  // AuditLog rows referencing this user don't cascade-delete, so clear those first.
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await prisma.auditLog.create({
    data: {
      workspaceId: admin.workspaceId,
      userId: admin.id,
      action: "DELETE",
      entity: "User",
      entityId: userId,
      oldValue: { email: target.email, name: target.name },
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

const smtpSchema = z.object({
  host: z.string().min(1, "El host es requerido"),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().min(1, "El usuario es requerido"),
  password: z.string().optional(),
  from: z.string().email("El remitente debe ser un email válido"),
});

export async function updateSmtpSettingsAction(formData: FormData) {
  await requireSuperAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = smtpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.smtpSettings.findUnique({ where: { id: "singleton" } });
  const { password, ...rest } = parsed.data;
  if (!password && !existing) return { error: "La contraseña es requerida" };

  await prisma.smtpSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...rest, password: password! },
    update: { ...rest, ...(password ? { password } : {}) },
  });

  return { success: true };
}

const planSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  priceAmount: z.coerce.number().min(0),
  currency: z.string().min(1),
  billingInterval: z.enum(["monthly", "yearly"]),
  clientLimit: z.string().optional(),
  userLimit: z.string().optional(),
  featured: z.coerce.boolean(),
  features: z.string().min(1, "Agregá al menos una función, una por línea"),
});

export async function updatePlanAction(tier: string, formData: FormData) {
  await requireSuperAdmin();

  const raw = { ...Object.fromEntries(formData), featured: formData.get("featured") === "on" };
  const parsed = planSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { clientLimit, userLimit, features, ...rest } = parsed.data;

  await prisma.plan.update({
    where: { tier: tier as any },
    data: {
      ...rest,
      clientLimit: clientLimit ? parseInt(clientLimit, 10) : null,
      userLimit: userLimit ? parseInt(userLimit, 10) : null,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath("/precios");
  revalidatePath("/");
  return { success: true };
}

const mpSchema = z.object({
  accessToken: z.string().optional(),
  publicKey: z.string().min(1, "La Public Key es requerida"),
});

export async function updateMercadoPagoSettingsAction(formData: FormData) {
  await requireSuperAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = mpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.mercadoPagoSettings.findUnique({ where: { id: "singleton" } });
  const { accessToken, ...rest } = parsed.data;
  if (!accessToken && !existing) return { error: "El Access Token es requerido" };

  await prisma.mercadoPagoSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...rest, accessToken: accessToken! },
    update: { ...rest, ...(accessToken ? { accessToken } : {}) },
  });

  return { success: true };
}

export async function resetDemoAction(): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();
  try {
    const now = new Date();

  let workspace = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Demo Kairos", slug: DEMO_SLUG, isDemo: true, planTier: "PROFESIONAL", subscriptionStatus: "ACTIVE" },
    });
  } else {
    await prisma.contractPayment.deleteMany({ where: { contract: { client: { workspaceId: workspace.id } } } });
    await prisma.serviceContract.deleteMany({ where: { client: { workspaceId: workspace.id } } });
    await prisma.oneTimeService.deleteMany({ where: { client: { workspaceId: workspace.id } } });
    await prisma.monthlyCost.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.monthlyExpense.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.auditLog.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.client.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.serviceBase.deleteMany({ where: { workspaceId: workspace.id } });
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { name: "Cuenta Demo", email: DEMO_EMAIL, password: hashedPassword, role: "ADMIN", workspaceId: workspace.id },
    update: { workspaceId: workspace.id, password: hashedPassword },
  });

  const [hosting, mantenimiento, logo] = await Promise.all([
    prisma.serviceBase.create({ data: { name: "Hosting Web", type: "RECURRING", description: "Servidor y dominio", workspaceId: workspace.id } }),
    prisma.serviceBase.create({ data: { name: "Mantenimiento Mensual", type: "RECURRING", description: "Actualizaciones y soporte", workspaceId: workspace.id } }),
    prisma.serviceBase.create({ data: { name: "Diseño de Logo", type: "ONE_TIME", description: "Identidad visual", workspaceId: workspace.id } }),
  ]);

  const [rivas, espiga, delta] = await Promise.all([
    prisma.client.create({ data: { name: "Estudio Rivas & Asoc.", company: "Estudio Rivas", email: "contacto@rivas.com", workspaceId: workspace.id } }),
    prisma.client.create({ data: { name: "Panadería La Espiga", company: "La Espiga", email: "hola@laespiga.com", workspaceId: workspace.id } }),
    prisma.client.create({ data: { name: "Consultora Delta", company: "Delta Consulting", email: "info@delta.com", workspaceId: workspace.id } }),
  ]);

  const cloudCost = await prisma.monthlyCost.create({
    data: { name: "Servidor Cloud Compartido", amount: 18000, workspaceId: workspace.id },
  });

  await prisma.serviceContract.create({
    data: {
      clientId: rivas.id, serviceBaseId: hosting.id, frequency: "MONTHLY",
      cost: 4000, price: 15000, startDate: subDays(now, 27), status: "ACTIVE",
      monthlyCosts: { connect: [{ id: cloudCost.id }] },
      payments: { create: { dueDate: addDays(now, 3), amount: 15000, isPaid: false } },
    },
  });

  await prisma.serviceContract.create({
    data: {
      clientId: espiga.id, serviceBaseId: mantenimiento.id, frequency: "MONTHLY",
      cost: 6000, price: 22000, startDate: subDays(now, 35), status: "ACTIVE",
      payments: { create: { dueDate: subDays(now, 5), amount: 22000, isPaid: false } },
    },
  });

  await prisma.serviceContract.create({
    data: {
      clientId: delta.id, serviceBaseId: hosting.id, frequency: "ANNUAL",
      cost: 40000, price: 180000, startDate: subDays(now, 10), status: "ACTIVE",
      monthlyCosts: { connect: [{ id: cloudCost.id }] },
      payments: { create: { dueDate: addDays(now, 20), amount: 180000, isPaid: true, paidAt: subDays(now, 10) } },
    },
  });

  await prisma.oneTimeService.create({
    data: {
      clientId: espiga.id, serviceBaseId: logo.id, finalPrice: 35000, internalCost: 8000,
      deliveryDate: subDays(now, 10), isPaid: true, status: "PAID",
    },
  });

  await prisma.monthlyExpense.create({
    data: { workspaceId: workspace.id, month: new Date(now.getFullYear(), now.getMonth(), 1), description: "Herramientas SaaS", amount: 12000 },
  });

    revalidatePath("/admin/demo");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al resetear demo" };
  }
}

const subscriptionUpdateSchema = z.object({
  workspaceId: z.string().min(1),
  planTier: z.enum(["STARTER", "PROFESIONAL", "AGENCIA"]),
  subscriptionStatus: z.enum(["NONE", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]),
});

export async function updateWorkspaceSubscriptionAction(workspaceId: string, planTier: string, subscriptionStatus: string) {
  const admin = await requireSuperAdmin();

  const parsed = subscriptionUpdateSchema.safeParse({ workspaceId, planTier, subscriptionStatus });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const existing = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!existing) return { error: "Workspace no encontrado" };

    const oldTier = existing.planTier;
    const oldStatus = existing.subscriptionStatus;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        planTier: parsed.data.planTier,
        subscriptionStatus: parsed.data.subscriptionStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: admin.workspaceId ?? "admin-workspace",
        userId: admin.id,
        action: "UPDATE_SUBSCRIPTION",
        entity: "Workspace",
        entityId: workspaceId,
        oldValue: { planTier: oldTier, subscriptionStatus: oldStatus },
        newValue: { planTier: parsed.data.planTier, subscriptionStatus: parsed.data.subscriptionStatus },
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al actualizar la suscripción" };
  }
}

export async function deleteSuggestionAction(id: string) {
  await requireSuperAdmin();

  try {
    const existing = await prisma.suggestion.findUnique({ where: { id } });
    if (!existing) return { error: "Sugerencia no encontrada" };

    await prisma.suggestion.delete({ where: { id } });

    revalidatePath("/admin/suggestions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al eliminar la sugerencia" };
  }
}


