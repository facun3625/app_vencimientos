"use client";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Edit2, ChevronDown, ChevronRight, Users, Briefcase } from "lucide-react";
import DeleteButton from "./DeleteButton";
import ClientServiceRow from "./ClientServiceRow";
import AddServiceModal from "./AddServiceModal";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Activo", cls: "badge-success" },
  PAUSED: { label: "Pausado", cls: "badge-warning" },
  INACTIVE: { label: "Inactivo", cls: "badge-muted" },
};

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  BIANNUAL: "Semestral",
  ANNUAL: "Anual",
  ONE_TIME: "Único",
};

export default function ClientsTable({
  clients,
  servicesByClient,
  serviceBases,
  monthlyCosts,
}: {
  clients: any[];
  servicesByClient: Record<string, any[]>;
  serviceBases: any[];
  monthlyCosts: any[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [serviceCountFilter, setServiceCountFilter] = useState("");
  const [freqFilter, setFreqFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addServiceClient, setAddServiceClient] = useState<{ id: string; name: string } | null>(null);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === "ACTIVE").length;
    const paused = clients.filter((c) => c.status === "PAUSED").length;
    const inactive = clients.filter((c) => c.status === "INACTIVE").length;
    return { total, active, paused, inactive };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const services = servicesByClient[c.id] || [];
      const serviceCount = services.length;

      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
      const matchesStatus = !status || c.status === status;

      const matchesServiceCount =
        !serviceCountFilter ||
        (serviceCountFilter === "0" && serviceCount === 0) ||
        (serviceCountFilter === "1" && serviceCount === 1) ||
        (serviceCountFilter === "2+" && serviceCount >= 2);

      const matchesFreq =
        !freqFilter || services.some((s: any) => s.frequency === freqFilter);

      return matchesQuery && matchesStatus && matchesServiceCount && matchesFreq;
    });
  }, [clients, servicesByClient, query, status, serviceCountFilter, freqFilter]);

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="card !p-4 flex items-center gap-3 flex-1 min-w-[140px]">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Users size={18} /></div>
          <div>
            <p className="text-lg font-black text-white leading-none">{stats.total}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Total Clientes</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3 flex-1 min-w-[140px]">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Users size={18} /></div>
          <div>
            <p className="text-lg font-black text-white leading-none">{stats.active}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Activos</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3 flex-1 min-w-[140px]">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Users size={18} /></div>
          <div>
            <p className="text-lg font-black text-white leading-none">{stats.paused}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Pausados</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3 flex-1 min-w-[140px]">
          <div className="p-2 rounded-lg bg-white/10 text-white/50"><Users size={18} /></div>
          <div>
            <p className="text-lg font-black text-white leading-none">{stats.inactive}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Inactivos</p>
          </div>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Buscar por nombre o empresa..."
              className="form-input !pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--text-muted)]" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input !py-2 w-40"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="PAUSED">Pausados</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-[var(--text-muted)]" />
            <select
              value={serviceCountFilter}
              onChange={(e) => setServiceCountFilter(e.target.value)}
              className="form-input !py-2 w-44"
            >
              <option value="">Cualquier cant. servicios</option>
              <option value="0">Sin servicios</option>
              <option value="1">1 servicio</option>
              <option value="2+">2 o más servicios</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={freqFilter}
              onChange={(e) => setFreqFilter(e.target.value)}
              className="form-input !py-2 w-44"
            >
              <option value="">Cualquier frecuencia</option>
              <option value="MONTHLY">Mensual</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="BIANNUAL">Semestral</option>
              <option value="ANNUAL">Anual</option>
              <option value="ONE_TIME">Único</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Mostrando {filtered.length} de {clients.length} clientes
        </p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-8" />
                <th>Nombre / Empresa</th>
                <th>Contacto</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-[var(--text-muted)]">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const st = STATUS_LABELS[c.status] || STATUS_LABELS.ACTIVE;
                  const isOpen = expandedId === c.id;
                  const services = servicesByClient[c.id] || [];
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => setExpandedId(isOpen ? null : c.id)}
                        className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="!pr-0">
                          {isOpen ? (
                            <ChevronDown size={14} className="text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight size={14} className="text-[var(--text-muted)]" />
                          )}
                        </td>
                        <td className="w-1/3">
                          <div className="font-bold text-white mb-0.5">{c.name}</div>
                          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                            {c.company || "Persona Física"}
                            {c.cuit && (
                              <>
                                <span className="opacity-30">•</span>
                                <span className="font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                                  {c.cuit}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">{c.email || "—"}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{c.phone || ""}</div>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1">
                            <span>{services.length} servicio{services.length !== 1 ? "s" : ""}</span>
                            {Array.from(new Set(services.map((s: any) => s.frequency))).map((f: any) => (
                              <span key={f} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/5 text-white/50">
                                {FREQ_LABELS[f] || f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Link href={`/clients/${c.id}/edit`} className="btn btn-secondary !p-2" title="Editar">
                              <Edit2 size={14} />
                            </Link>
                            <DeleteButton id={c.id} name={c.name} />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="!p-0 bg-white/[0.02]">
                            {services.length === 0 ? (
                              <div className="px-6 py-4 text-xs italic text-[var(--text-muted)]">
                                Sin servicios asignados.
                              </div>
                            ) : (
                              <div className="divide-y divide-white/5">
                                {services.map((s) => (
                                  <ClientServiceRow
                                    key={s.id}
                                    service={s}
                                    serviceBases={serviceBases}
                                    monthlyCosts={monthlyCosts}
                                  />
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAddServiceClient({ id: c.id, name: c.name }); }}
                              className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 cursor-pointer"
                            >
                              Agregar servicio a {c.name}
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addServiceClient && (
        <AddServiceModal
          client={addServiceClient}
          clients={clients}
          serviceBases={serviceBases}
          monthlyCosts={monthlyCosts}
          onClose={() => setAddServiceClient(null)}
        />
      )}
    </>
  );
}
