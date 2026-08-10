import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as any;
  if (!session) redirect("/login");
  if (!user?.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Panel de Superadmin</h1>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Kairos Platform</p>
            </div>
          </div>

          <AdminNav />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
