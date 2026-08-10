"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "kairos-theme";

// Day/night toggle. The choice is persisted in localStorage and applied by
// stamping data-theme="light" on <html> (dark is the default = no attribute).
// A small inline script in app/layout.tsx applies the stored choice before the
// first paint so there's no flash of the wrong theme.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage puede fallar en modo privado; no es crítico */
    }
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Cambiar a modo noche" : "Cambiar a modo día"}
      className="btn btn-secondary w-full justify-center !text-xs !py-2"
      suppressHydrationWarning
    >
      {/* Antes de montar mostramos el ícono del default (noche) para no parpadear */}
      {mounted && theme === "light" ? (
        <>
          <Moon size={14} /> Modo noche
        </>
      ) : (
        <>
          <Sun size={14} /> Modo día
        </>
      )}
    </button>
  );
}
