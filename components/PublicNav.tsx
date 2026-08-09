"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function PublicNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-lg relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" onClick={close} className="flex items-center shrink-0">
          <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-9 md:h-12 w-auto object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-[var(--text-muted)] font-medium">
          <Link href="/#funciones" className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">Funciones</Link>
          <span className="w-px h-4 bg-white/10" />
          <Link href="/#planes" className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">Planes</Link>
          <span className="w-px h-4 bg-white/10" />
          <Link href="/#demo" className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">Probar demo</Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary !py-2 !px-5 text-sm">Ir a mi cuenta</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary !py-2 !px-4 text-sm">Iniciar sesión</Link>
              <Link href="/register" className="btn btn-primary !py-2 !px-5 text-sm">Crear cuenta</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="md:hidden p-2 -mr-2 text-white shrink-0"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#030712]/98 backdrop-blur-lg">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link href="/#funciones" onClick={close} className="px-3 py-3 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors">Funciones</Link>
            <Link href="/#planes" onClick={close} className="px-3 py-3 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors">Planes</Link>
            <Link href="/#demo" onClick={close} className="px-3 py-3 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors">Probar demo</Link>
            <div className="h-px bg-white/10 my-2" />
            {loggedIn ? (
              <Link href="/dashboard" onClick={close} className="btn btn-primary w-full justify-center">Ir a mi cuenta</Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={close} className="btn btn-secondary w-full justify-center">Iniciar sesión</Link>
                <Link href="/register" onClick={close} className="btn btn-primary w-full justify-center">Crear cuenta</Link>
              </div>
            )}
          </nav>
        </div>
      )}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
    </header>
  );
}
