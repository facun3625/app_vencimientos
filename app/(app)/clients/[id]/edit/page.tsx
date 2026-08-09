import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import ClientForm from "../../ClientForm";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const { id } = await params;
  const client = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!client) notFound();

  return (
    <div className="page-container">
      <h1 className="page-title mb-6">Editar Cliente: {client.name}</h1>
      <ClientForm client={client} />
    </div>
  );
}
