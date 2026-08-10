import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const sessionUser = session.user as any;

  const [user, workspace] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { name: true, email: true, image: true },
    }),
    sessionUser.workspaceId
      ? prisma.workspace.findUnique({
          where: { id: sessionUser.workspaceId },
          select: { name: true, logo: true },
        })
      : Promise.resolve(null),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UserCircle size={20} /></div>
          <h1 className="page-title !mb-0">Mi Perfil</h1>
        </div>
        <p className="page-subtitle">Editá tu información personal y la de tu empresa</p>
      </div>

      <ProfileClient
        user={{ name: user.name, email: user.email, image: user.image }}
        workspace={{ name: workspace?.name ?? "", logo: workspace?.logo ?? null }}
      />
    </div>
  );
}
