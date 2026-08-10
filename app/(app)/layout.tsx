import AppClientLayout from "./AppClientLayout";
import SessionProvider from "@/components/SessionProvider";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;

  // Traemos nombre/imagen/logo frescos de la DB (no del JWT) para que los
  // cambios del perfil se reflejen al instante tras revalidar.
  const [dbUser, workspace] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, image: true } }),
    user.workspaceId
      ? prisma.workspace.findUnique({ where: { id: user.workspaceId }, select: { name: true, isDemo: true } })
      : Promise.resolve(null),
  ]);

  return (
    <SessionProvider session={session}>
      <AppClientLayout
        workspaceName={workspace?.name ?? user.workspaceName}
        userName={dbUser?.name ?? user.name}
        userImage={dbUser?.image ?? null}
        impersonating={!!user.impersonating}
        impersonatedEmail={user.impersonatedEmail}
        isSuperAdmin={!!user.isSuperAdmin}
        isDemo={!!workspace?.isDemo}
        modal={modal}
      >
        {children}
      </AppClientLayout>
    </SessionProvider>
  );
}
