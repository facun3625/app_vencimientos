"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always report success even if the email isn't registered, so this form
  // can't be used to check which emails have an account.
  if (!user || !user.password) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err: any) {
    console.error("Error enviando email de reset:", err);
    return { error: "No pudimos enviar el email. Intentá de nuevo en unos minutos." };
  }

  return { success: true };
}
