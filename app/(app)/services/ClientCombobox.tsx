"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, ChevronDown, Search, Plus } from "lucide-react";
import CreateClientModal from "./CreateClientModal";

export default function ClientCombobox({
  clients,
  name,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  name: string;
  defaultClientId?: string;
}) {
  const [clientList, setClientList] = useState(clients);
  const defaultClient = clientList.find((c) => c.id === defaultClientId);
  const [query, setQuery] = useState(defaultClient?.name ?? "");
  const [selectedId, setSelectedId] = useState(defaultClientId ?? "");
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
        setOpen(false);
      }
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

  const filtered = clientList.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const dropdown = open && rect && (
    <div
      ref={dropdownRef}
      style={{ position: "fixed", top: rect.top + 4, left: rect.left, width: rect.width }}
      className="z-[999] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220] shadow-2xl"
    >
      {filtered.length === 0 && (
        <div className="p-3 text-xs text-[var(--text-muted)] italic">Sin resultados</div>
      )}
      {filtered.map((c) => (
        <button
          type="button"
          key={c.id}
          onClick={() => {
            setSelectedId(c.id);
            setQuery(c.name);
            setOpen(false);
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
            c.id === selectedId ? "bg-blue-500/10 text-blue-400" : "text-white"
          }`}
        >
          {c.name}
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
        <Plus size={14} /> Crear cliente nuevo{query ? `: "${query}"` : ""}
      </button>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedId} required />
      <div className="relative" ref={inputWrapRef}>
        {selectedId ? (
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
        )}
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) {
                setSelectedId(filtered[0].id);
                setQuery(filtered[0].name);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => {
            // If the user typed something but never picked a suggestion,
            // fall back to the first match instead of silently submitting empty.
            setTimeout(() => {
              setSelectedId((current) => {
                if (current) return current;
                if (filtered.length === 1) {
                  setQuery(filtered[0].name);
                  return filtered[0].id;
                }
                return current;
              });
            }, 150);
          }}
          placeholder="Buscar cliente..."
          className="form-input !pl-10 !pr-9 !py-[0.8rem]"
          autoComplete="off"
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          size={14}
        />
      </div>

      {mounted && dropdown && createPortal(dropdown, document.body)}

      {mounted && showModal && createPortal(
        <CreateClientModal
          initialName={query}
          onClose={() => setShowModal(false)}
          onCreated={(client) => {
            setClientList((prev) => [...prev, client]);
            setSelectedId(client.id);
            setQuery(client.name);
            setShowModal(false);
          }}
        />,
        document.body
      )}
    </div>
  );
}
