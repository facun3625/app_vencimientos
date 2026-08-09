"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function resetPasswordAction(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { token, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record || record.expires < new Date()) {
    return { error: "Este link es inválido o ya venció. Pedí uno nuevo." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { password: hashedPassword } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  redirect("/login?reset=1");
}
