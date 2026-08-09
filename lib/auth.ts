import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { slugify } from "@/lib/slugify";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { workspace: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.workspaceId = dbUser.workspaceId;
          token.workspaceName = dbUser.workspace?.name;
          token.isSuperAdmin = dbUser.isSuperAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).workspaceId = token.workspaceId;
        (session.user as any).workspaceName = token.workspaceName;
        (session.user as any).isSuperAdmin = !!token.isSuperAdmin;
        (session.user as any).impersonating = false;

        // A superadmin can browse the app "as" another registered user, to see
        // their profile/data exactly as they'd see it — without knowing their
        // password. This overlays the identity fields from a cookie only the
        // superadmin panel can set; isSuperAdmin above stays tied to the real
        // logged-in account so the exit-impersonation banner keeps working.
        if (token.isSuperAdmin) {
          const cookieStore = await cookies();
          const impersonateId = cookieStore.get("impersonate_user_id")?.value;
          if (impersonateId && impersonateId !== token.id) {
            const target = await prisma.user.findUnique({
              where: { id: impersonateId },
              include: { workspace: true },
            });
            if (target) {
              session.user.id = target.id;
              session.user.name = target.name;
              session.user.email = target.email;
              (session.user as any).role = target.role;
              (session.user as any).workspaceId = target.workspaceId;
              (session.user as any).workspaceName = target.workspace?.name;
              (session.user as any).impersonating = true;
              (session.user as any).impersonatedEmail = target.email;
            }
          }
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const workspaceName = user.name ? `Workspace de ${user.name}` : "Mi Workspace";
      let slug = slugify(workspaceName);
      const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
      if (existingSlug) slug = `${slug}-${Date.now()}`;

      // A plan chosen before a Google sign-up (see registerWithGoogleAction)
      // travels here via a short-lived cookie, since OAuth's own redirect
      // chain can't carry form data.
      const cookieStore = await cookies();
      const pendingTier = cookieStore.get("pending_plan_tier")?.value;
      const tier = pendingTier && ["STARTER", "PROFESIONAL", "AGENCIA"].includes(pendingTier)
        ? (pendingTier as "STARTER" | "PROFESIONAL" | "AGENCIA")
        : "STARTER";
      const plan = await prisma.plan.findUnique({ where: { tier } });

      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
          slug,
          planTier: tier,
          subscriptionStatus: plan && plan.priceAmount > 0 ? "TRIALING" : "ACTIVE",
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: workspace.id, role: "ADMIN" },
      });
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const email = (credentials.email as string).toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: { workspace: true },
        });
        if (!user || !user.password || !await bcrypt.compare(credentials.password as string, user.password)) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId, workspaceName: user.workspace?.name };
      },
    }),
  ],
});
