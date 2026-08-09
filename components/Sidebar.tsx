"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3,
  Users, 
  Layers, 
  Briefcase, 
  Clock, 
  ShieldAlert,
  UserPlus,
  LogOut,
  ChevronRight,
  Wallet,
  Server,
  ShieldCheck,
  CreditCard,
  MessageSquarePlus,
  X
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const MENU_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Estadísticas", icon: BarChart3, href: "/statistics" },
  { label: "Clientes", icon: Users, href: "/clients" },
  { label: "Catálogo", icon: Layers, href: "/catalog" },
  { label: "Servicios", icon: Briefcase, href: "/services" },
  { label: "Vencimientos", icon: Clock, href: "/expirations" },
  { label: "Gastos", icon: Wallet, href: "/expenses" },
  { label: "Costos Mensuales", icon: Server, href: "/monthly-costs" },
  { label: "Logs", icon: ShieldAlert, href: "/audit" },
  { label: "Equipo", icon: UserPlus, href: "/team" },
  { label: "Mi Suscripción", icon: CreditCard, href: "/subscription" },
  { label: "Sugerir Mejoras", icon: MessageSquarePlus, href: "/suggestions" },
];

export default function Sidebar({
  workspaceName,
  userName,
  isOpen,
  onClose,
  isSuperAdmin,
  bannerOffset,
}: {
  workspaceName: string,
  userName: string,
  isOpen: boolean,
  onClose: () => void,
  isSuperAdmin?: boolean,
  bannerOffset?: boolean,
}) {
  const pathname = usePathname();

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''} lg:hidden`}
        onClick={onClose}
      />

      <aside
        suppressHydrationWarning
        className={`w-64 border-r border-[var(--border)] flex flex-col fixed left-0 bg-[#030712] z-50 transition-transform duration-300 ease-in-out
          ${bannerOffset ? 'top-10 h-[calc(100vh-2.5rem)]' : 'top-0 h-screen'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-start justify-between mb-5">
            <div className="min-w-0">
              <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-8 w-auto object-contain mb-2" />
              <p className="text-[11px] text-[var(--text-muted)] truncate">{workspaceName}</p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="lg:hidden p-2 -mt-1 -mr-1 text-[var(--text-muted)] hover:text-white shrink-0"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5">
            {MENU_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={12} className="ml-auto opacity-50" />}
                </Link>
              );
            })}
          </nav>

          {isSuperAdmin && (
            <Link
              href="/admin/users"
              onClick={handleLinkClick}
              className="nav-link mt-2 !text-purple-400 border border-purple-500/20 bg-purple-500/5"
            >
              <ShieldCheck size={16} />
              <span>Panel Superadmin</span>
            </Link>
          )}
        </div>

        <div className="shrink-0 p-4 border-t border-[var(--border)] bg-black/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
              {userName.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{userName}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn btn-secondary w-full justify-center !text-xs !py-2"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>

          <a
            href="https://kubbo.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Hecho por
            <img src="/kubbo.png" alt="Kubbo" className="h-3 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </aside>
    </>
  );
}
