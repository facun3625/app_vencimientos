"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { createSubscriptionCheckout } from "@/lib/mercadopago";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Google sign-up can't carry the chosen plan through the OAuth round-trip as
// form data, so it's stashed in a short-lived cookie; lib/auth.ts's
// `createUser` event reads it when the workspace gets created for a brand
// new Google account, and /register/complete picks up the Mercado Pago
// checkout afterwards for paid plans.
export async function registerWithGoogleAction(formData: FormData) {
  const plan = ((formData.get("plan") as string) || "STARTER").toUpperCase();
  const cookieStore = await cookies();
  cookieStore.set("pending_plan_tier", plan, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });
  await signIn("google", { redirectTo: "/register/complete" });
}

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  workspaceName: z.string().min(2, "El nombre del workspace debe tener al menos 2 caracteres"),
  plan: z.enum(["STARTER", "PROFESIONAL", "AGENCIA"]).default("STARTER"),
});

export async function registerAction(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    workspaceName: formData.get("workspaceName") as string,
    plan: ((formData.get("plan") as string) || "STARTER").toUpperCase(),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    return { error: messages };
  }

  const { name, password, workspaceName, plan: planTier } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const plan = await prisma.plan.findUnique({ where: { tier: planTier } });
  if (!plan) return { error: "El plan elegido no existe. Volvé a /precios y elegí de nuevo." };

  const hashedPassword = await bcrypt.hash(password, 12);

  let slug = slugify(workspaceName);
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) slug = `${slug}-${Date.now()}`;

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
        planTier,
        // A free plan (price 0) activates immediately; a paid plan stays
        // pending until Mercado Pago confirms the first payment via webhook.
        subscriptionStatus: plan.priceAmount > 0 ? "TRIALING" : "ACTIVE",
      },
    });
    await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        workspaceId: ws.id,
      },
    });
    return ws;
  });

  if (plan.priceAmount <= 0) {
    redirect("/login?registered=1");
  }

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";
  let initPoint: string;
  try {
    const checkout = await createSubscriptionCheckout({
      planName: plan.name,
      price: plan.priceAmount,
      currency: plan.currency,
      frequency: plan.billingInterval === "yearly" ? "yearly" : "monthly",
      payerEmail: email,
      externalReference: workspace.id,
      backUrl: `${baseUrl}/login?registered=1`,
    });
    initPoint = checkout.initPoint;
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { mpSubscriptionId: checkout.preapprovalId },
    });
  } catch (err: any) {
    console.error("Error creando checkout de Mercado Pago:", err);
    // The account already exists — let them in and sort out payment from
    // "Mi Suscripción" instead of losing the signup entirely.
    redirect("/login?registered=1&payment_pending=1");
  }

  redirect(initPoint);
}
