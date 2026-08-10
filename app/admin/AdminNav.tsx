"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Mail, ArrowLeft, Tag, CreditCard, FlaskConical, MessageSquare } from "lucide-react";

const ITEMS = [
  { label: "Usuarios", icon: Users, href: "/admin/users" },
  { label: "Planes", icon: Tag, href: "/admin/plans" },
  { label: "Mercado Pago", icon: CreditCard, href: "/admin/mercadopago" },
  { label: "Demo", icon: FlaskConical, href: "/admin/demo" },
  { label: "SMTP", icon: Mail, href: "/admin/smtp" },
  { label: "Sugerencias", icon: MessageSquare, href: "/admin/suggestions" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-all ${
              active
                ? "bg-purple-500/15 border-purple-500/40 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.15)]"
                : "bg-white/[0.03] border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20 hover:bg-white/[0.06]"
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        );
      })}

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-white/10 bg-white/[0.03] text-[var(--text-muted)] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all"
      >
        <ArrowLeft size={14} /> Volver a la app
      </Link>
    </div>
  );
}
