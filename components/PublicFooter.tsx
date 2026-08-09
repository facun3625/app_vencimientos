import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo_fondo_oscuro.png" alt="Kairos" className="h-6 w-auto object-contain" />
          <span className="text-sm text-[var(--text-muted)]">&copy; 2026 Kairos. Todos los derechos reservados.</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
          <Link href="/#planes" className="hover:text-white transition-colors">Planes</Link>
          <Link href="/#demo" className="hover:text-white transition-colors">Demo</Link>
          <Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
          <a
            href="https://kubbo.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <span className="text-xs">Hecho por</span>
            <img src="/kubbo.png" alt="Kubbo" className="h-4 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </footer>
  );
}
