import { prisma } from "@/lib/prisma";
import MercadoPagoForm from "./MercadoPagoForm";

export default async function AdminMercadoPagoPage() {
  const settings = await prisma.mercadoPagoSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Mercado Pago</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Credenciales de tu cuenta de Mercado Pago, usadas para cobrar las suscripciones de todos los workspaces.
          Las sacás desde{" "}
          <span className="text-white">tu cuenta de Mercado Pago → Tus integraciones → Credenciales</span>.
        </p>
      </div>

      <div className="card !p-6 max-w-xl">
        <MercadoPagoForm settings={settings} />
      </div>
    </div>
  );
}
