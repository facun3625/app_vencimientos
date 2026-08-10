"use client";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Menu, UserCog, FlaskConical } from "lucide-react";
import { stopImpersonationAction } from "@/app/admin/actions";

export default function AppClientLayout({
  children,
  modal,
  workspaceName,
  userName,
  userImage,
  impersonating,
  impersonatedEmail,
  isSuperAdmin,
  isDemo,
}: {
  children: React.ReactNode,
  modal?: React.ReactNode,
  workspaceName: string,
  userName: string,
  userImage?: string | null,
  impersonating?: boolean,
  impersonatedEmail?: string,
  isSuperAdmin?: boolean,
  isDemo?: boolean,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const showBanner = impersonating || isDemo;

  return (
    <div className="app-shell">
      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-10 bg-purple-600 text-white text-xs sm:text-sm px-3 flex items-center justify-center gap-2 shadow-lg overflow-hidden">
          <UserCog size={14} className="shrink-0" />
          <span className="truncate">Viendo como <strong>{impersonatedEmail}</strong></span>
          <button
            onClick={() => startTransition(() => stopImpersonationAction())}
            disabled={isPending}
            className="underline font-semibold hover:opacity-80 shrink-0 whitespace-nowrap"
          >
            Salir
          </button>
        </div>
      )}

      {!impersonating && isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-10 bg-amber-500 text-black text-xs sm:text-sm px-3 flex items-center justify-center gap-2 shadow-lg overflow-hidden">
          <FlaskConical size={14} className="shrink-0" />
          <span className="truncate">
            Estás en el <strong>modo demo</strong>
            <span className="hidden sm:inline"> — los datos se reinician todas las noches.</span>
          </span>
          <Link href="/precios" className="underline font-semibold hover:opacity-80 shrink-0 whitespace-nowrap">
            Crear cuenta real
          </Link>
        </div>
      )}

      <Sidebar
        workspaceName={workspaceName}
        userName={userName}
        userImage={userImage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isSuperAdmin={isSuperAdmin && !impersonating}
        bannerOffset={showBanner}
      />

      {/* .main-content's own padding shorthand is defined after Tailwind's utilities
          in globals.css, so a pt-10 utility class here would get silently overridden
          by it (same specificity, later in cascade) — an inline style always wins. */}
      <main className="main-content" style={showBanner ? { paddingTop: "4.5rem" } : undefined}>
        {/* Mobile Header (sits below the fixed banner when one is showing) */}
        <div
          className={`lg:hidden flex items-center gap-3 p-4 bg-[#030712]/95 backdrop-blur-lg border-b border-[var(--border)] sticky z-30 mb-4 -mx-4 -mt-6 ${
            showBanner ? "top-10" : "top-0"
          }`}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-white shrink-0"
          >
            <Menu size={22} />
          </button>
          <div className="flex flex-col min-w-0">
            <img src="/logo_fondo_oscuro.png" alt="Kairos" className="app-logo h-9 w-auto object-contain self-start" />
            <span className="font-medium text-xs text-[var(--text-muted)] truncate mt-0.5">{workspaceName}</span>
          </div>
        </div>

        {children}
      </main>

      {modal}
    </div>
  );
}
