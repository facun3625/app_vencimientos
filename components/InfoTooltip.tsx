"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

// StatCard (and other containers this gets used in) has overflow-hidden to
// clip its rounded corners, which would otherwise crop this tooltip — so it's
// portaled to document.body with a fixed position computed from the icon's
// own bounding rect, same fix as ClientCombobox's dropdown.
export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  function show() {
    const rect = iconRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    setOpen(true);
  }

  return (
    <span
      ref={iconRef}
      className="relative inline-flex normal-case"
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
    >
      <HelpCircle size={13} className="text-[var(--text-muted)] hover:text-white cursor-help transition-colors shrink-0" />
      {open && coords &&
        createPortal(
          <span
            className="fixed z-[999] w-56 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-white/90 shadow-xl pointer-events-none"
            style={{ top: coords.top, left: coords.left }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}
