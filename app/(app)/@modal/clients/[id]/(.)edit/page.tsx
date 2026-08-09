import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Modal from "@/components/Modal";
import ClientForm from "@/app/(app)/clients/ClientForm";

export default async function EditClientModal({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const { id } = await params;
  const client = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!client) notFound();

  return (
    <Modal maxWidthClassName="max-w-3xl">
      <div className="modal-compact">
        <h1 className="text-lg font-bold mb-3 text-white">Editar Cliente: {client.name}</h1>
        <ClientForm client={client} />
      </div>
    </Modal>
  );
}
