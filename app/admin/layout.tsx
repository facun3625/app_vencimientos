import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Mail, ArrowLeft, ShieldCheck, Tag, CreditCard, FlaskConical, MessageSquare } from "lucide-react";

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

          <div className="flex items-center gap-2">
            <Link href="/admin/users" className="btn btn-secondary !py-2 !px-4 text-sm">
              <Users size={14} /> Usuarios
            </Link>
            <Link href="/admin/plans" className="btn btn-secondary !py-2 !px-4 text-sm">
              <Tag size={14} /> Planes
            </Link>
            <Link href="/admin/mercadopago" className="btn btn-secondary !py-2 !px-4 text-sm">
              <CreditCard size={14} /> Mercado Pago
            </Link>
            <Link href="/admin/demo" className="btn btn-secondary !py-2 !px-4 text-sm">
              <FlaskConical size={14} /> Demo
            </Link>
            <Link href="/admin/smtp" className="btn btn-secondary !py-2 !px-4 text-sm">
              <Mail size={14} /> SMTP
            </Link>
            <Link href="/admin/suggestions" className="btn btn-secondary !py-2 !px-4 text-sm">
              <MessageSquare size={14} /> Sugerencias
            </Link>
            <Link href="/dashboard" className="btn btn-secondary !py-2 !px-4 text-sm">
              <ArrowLeft size={14} /> Volver a la app
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
