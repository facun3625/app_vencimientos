"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Briefcase, ChevronDown, Search, Plus } from "lucide-react";
import CreateServiceBaseModal from "./CreateServiceBaseModal";

export default function ServiceBaseCombobox({
  serviceBases,
  value,
  onSelect,
  onCreated,
  type,
}: {
  serviceBases: { id: string; name: string; description?: string | null }[];
  value: string;
  onSelect: (id: string) => void;
  onCreated: (item: { id: string; name: string; description: string | null }) => void;
  type: "RECURRING" | "ONE_TIME";
}) {
  const selected = serviceBases.find((b) => b.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Keep the visible text lined up if the parent resets/changes the selected id externally.
  useEffect(() => {
    const current = serviceBases.find((b) => b.id === value);
    setQuery(current?.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function updateRect() {
      const r = inputWrapRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom, left: r.left, width: r.width });
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const filtered = serviceBases.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  const dropdown = open && rect && (
    <div
      ref={dropdownRef}
      style={{ position: "fixed", top: rect.top + 4, left: rect.left, width: rect.width }}
      className="z-[999] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220] shadow-2xl"
    >
      {filtered.length === 0 && (
        <div className="p-3 text-xs text-[var(--text-muted)] italic">Sin resultados</div>
      )}
      {filtered.map((b) => (
        <button
          type="button"
          key={b.id}
          onClick={() => {
            onSelect(b.id);
            setQuery(b.name);
            setOpen(false);
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
            b.id === value ? "bg-blue-500/10 text-blue-400" : "text-white"
          }`}
        >
          {b.name}
          {b.description && (
            <span className="block text-[10px] text-[var(--text-muted)] italic">{b.description}</span>
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          setShowModal(true);
          setOpen(false);
        }}
        className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors border-t border-white/10"
      >
        <Plus size={14} /> Crear servicio nuevo{query ? `: "${query}"` : ""}
      </button>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative" ref={inputWrapRef}>
        {value ? (
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
        )}
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect("");
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) {
                onSelect(filtered[0].id);
                setQuery(filtered[0].name);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!value && filtered.length === 1) {
                onSelect(filtered[0].id);
                setQuery(filtered[0].name);
              }
            }, 150);
          }}
          placeholder="Buscar servicio del catálogo..."
          className="form-input !pl-10 !pr-9"
          autoComplete="off"
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          size={14}
        />
      </div>

      {mounted && dropdown && createPortal(dropdown, document.body)}

      {mounted &&
        showModal &&
        createPortal(
          <CreateServiceBaseModal
            initialName={query}
            type={type}
            onClose={() => setShowModal(false)}
            onCreated={(item) => {
              onCreated(item);
              onSelect(item.id);
              setQuery(item.name);
              setShowModal(false);
            }}
          />,
          document.body
        )}
    </div>
  );
}
