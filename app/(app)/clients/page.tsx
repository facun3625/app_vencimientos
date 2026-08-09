import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ClientsTable from "./ClientsTable";

const FREQ: Record<string, string> = { MONTHLY: "Mensual", QUARTERLY: "Trimestral", BIANNUAL: "Semestral", ANNUAL: "Anual" };

export default async function ClientsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;

  const [clients, contracts, oneTimeServices, serviceBases, monthlyCosts] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId },
      include: { _count: { select: { contracts: true, oneTime: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.serviceContract.findMany({
      where: { client: { workspaceId } },
      include: { serviceBase: true, payments: { orderBy: { dueDate: "desc" }, take: 1 }, monthlyCosts: true },
    }),
    prisma.oneTimeService.findMany({
      where: { client: { workspaceId } },
      include: { serviceBase: true },
    }),
    prisma.serviceBase.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.monthlyCost.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  const servicesByClient: Record<string, any[]> = {};
  contracts.forEach((c) => {
    const latest = c.payments[0];
    const dueDate = latest?.dueDate ?? c.startDate;
    (servicesByClient[c.clientId] ||= []).push({
      id: latest?.id ?? c.id,
      viewType: "RECURRING" as const,
      contractId: c.id,
      paymentId: latest?.id,
      serviceBaseId: c.serviceBaseId,
      serviceBase: c.serviceBase,
      frequency: c.frequency,
      displayFreq: FREQ[c.frequency] || c.frequency,
      expirationDate: dueDate,
      dueDateLabel: format(new Date(dueDate), "dd MMM yyyy", { locale: es }),
      dueDateValue: new Date(dueDate).getTime(),
      cost: c.cost,
      price: latest?.amount ?? c.price,
      notes: c.notes,
      monthlyCosts: c.monthlyCosts,
      isPaid: latest?.isPaid ?? false,
      invoiced: latest?.invoiced ?? false,
      invoiceSent: latest?.invoiceSent ?? false,
    });
  });
  oneTimeServices.forEach((s) => {
    const dueDate = s.deliveryDate || s.createdAt;
    (servicesByClient[s.clientId] ||= []).push({
      id: s.id,
      viewType: "ONE_TIME" as const,
      serviceBaseId: s.serviceBaseId,
      serviceBase: s.serviceBase,
      displayFreq: "Único",
      deliveryDate: s.deliveryDate,
      dueDateLabel: format(new Date(dueDate), "dd MMM yyyy", { locale: es }),
      dueDateValue: new Date(dueDate).getTime(),
      internalCost: s.internalCost,
      finalPrice: s.finalPrice,
      price: s.finalPrice,
      notes: s.notes,
      isPaid: s.isPaid,
      invoiced: s.invoiced,
      invoiceSent: s.invoiceSent,
      frequency: "ONE_TIME" as const,
    });
  });
  Object.values(servicesByClient).forEach((list) => list.sort((a, b) => b.dueDateValue - a.dueDateValue));

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gestioná tu cartera de {clients.length} clientes</p>
        </div>
        <Link href="/clients/new" className="btn btn-primary">
          <Plus size={18} /> Nuevo Cliente
        </Link>
      </div>

      <ClientsTable
        clients={clients}
        servicesByClient={servicesByClient}
        serviceBases={serviceBases}
        monthlyCosts={monthlyCosts}
      />
    </div>
  );
}
