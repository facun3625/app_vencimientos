"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// Chrome for the intercepted-route auth modals (@modal slot) — a dim + blurred
// backdrop with the real page still visible (and blurred) behind it, per the
// Parallel + Intercepting Routes modal pattern.
//
// Opening eases out (decelerates in, with a bit of snap) and closing eases in
// (accelerates away) — different curves for each direction, which is what
// makes the motion read as intentional rather than a plain fade. The actual
// navigation (router.back(), which unmounts this) is delayed by CLOSE_MS so
// the close animation gets to finish before the route actually changes.
const OPEN_MS = 320;
const CLOSE_MS = 240;
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";

export default function Modal({
  children,
  maxWidthClassName = "max-w-md",
}: {
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"entering" | "open" | "closing">("entering");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(raf);
  }, []);

  function close() {
    setPhase("closing");
    setTimeout(() => router.back(), CLOSE_MS);
  }

  const visible = phase === "open";
  const duration = phase === "closing" ? CLOSE_MS : OPEN_MS;
  const easing = phase === "closing" ? EASE_IN : EASE_OUT_EXPO;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={close}
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(14px)" : "blur(0px)",
        WebkitBackdropFilter: visible ? "blur(14px)" : "blur(0px)",
        transition: `background-color ${duration}ms ${easing}, backdrop-filter ${duration}ms ${easing}`,
      }}
    >
      <div
        className={`relative w-full ${maxWidthClassName}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.85) translateY(12px)",
          opacity: visible ? 1 : 0,
          transition: `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`,
        }}
      >
        <button
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-2 right-2 sm:-top-3 sm:-right-3 z-10 w-8 h-8 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 cursor-pointer transition-colors shadow-lg"
        >
          <X size={16} />
        </button>
        <div className="max-h-[85vh] overflow-y-auto overscroll-contain rounded-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
