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

  const workspace = user.workspaceId
    ? await prisma.workspace.findUnique({ where: { id: user.workspaceId }, select: { isDemo: true } })
    : null;

  return (
    <SessionProvider session={session}>
      <AppClientLayout
        workspaceName={user.workspaceName}
        userName={user.name}
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
