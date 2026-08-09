import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

async function getTransporter() {
  const settings = await prisma.smtpSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    throw new Error("SMTP no está configurado todavía (Panel de Superadmin → SMTP)");
  }
  return {
    transporter: nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      auth: { user: settings.user, pass: settings.password },
    }),
    from: settings.from,
  };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { transporter, from } = await getTransporter();

  await transporter.sendMail({
    from: `Kairos <${from}>`,
    to,
    subject: "Restablecer tu contraseña — Kairos",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Restablecer tu contraseña</h2>
        <p style="color: #333;">Pediste restablecer tu contraseña en Kairos. Hacé clic en el siguiente botón para elegir una nueva. Este link vence en 1 hora.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Restablecer contraseña</a>
        </p>
        <p style="color: #888; font-size: 12px;">Si no pediste esto, podés ignorar este email.</p>
      </div>
    `,
  });
}
