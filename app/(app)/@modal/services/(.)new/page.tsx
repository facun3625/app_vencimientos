import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Repeat, Zap } from "lucide-react";
import Modal from "@/components/Modal";
import ServiceForm from "@/app/(app)/services/ServiceForm";

export default async function NewServiceModal({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; clientId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const params = await searchParams;
  const type = params.type === "ONE_TIME" ? "ONE_TIME" : "RECURRING";
  const clientIdSuffix = params.clientId ? `&clientId=${params.clientId}` : "";

  const [clients, serviceBases, monthlyCosts] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.serviceBase.findMany({ where: { workspaceId, type }, orderBy: { name: "asc" } }),
    prisma.monthlyCost.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <Modal maxWidthClassName="max-w-5xl">
      <div className="modal-compact card !p-6">
        <h1 className="text-lg font-bold mb-4">Nuevo {type === "RECURRING" ? "Recurrente" : "Único"}</h1>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 w-fit mb-8">
          <Link
            href={`/services/new?type=RECURRING${clientIdSuffix}`}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${type === "RECURRING" ? "bg-white/10 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            <Repeat size={14} /> Recurrente
          </Link>
          <Link
            href={`/services/new?type=ONE_TIME${clientIdSuffix}`}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${type === "ONE_TIME" ? "bg-white/10 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            <Zap size={14} /> Único
          </Link>
        </div>

        <ServiceForm key={type} type={type} clients={clients} serviceBases={serviceBases} monthlyCosts={monthlyCosts} defaultClientId={params.clientId} />
      </div>
    </Modal>
  );
}
