import { prisma } from "@/lib/prisma";
import SmtpForm from "./SmtpForm";

export default async function AdminSmtpPage() {
  const settings = await prisma.smtpSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Configuración SMTP</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Se usa para todos los emails de la plataforma (por ejemplo, recuperar contraseña), compartido entre todos los workspaces.
        </p>
      </div>

      <div className="card !p-6 max-w-xl">
        <SmtpForm settings={settings} />
      </div>
    </div>
  );
}
