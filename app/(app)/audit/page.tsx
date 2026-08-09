import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Shield, User, Activity, Database, Search, Filter, X, Info } from "lucide-react";
import Link from "next/link";

const ACTION_COLORS: any = {
  CREATE: "text-emerald-400 bg-emerald-400/10",
  UPDATE: "text-blue-400 bg-blue-400/10",
  DELETE: "text-red-400 bg-red-400/10",
};


export default async function AuditPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; action?: string; entity?: string }> 
}) {
  const session = await auth();
  if (!session) redirect("/login");
  
  const params = await searchParams;
  const q = params.q || "";
  const actionFilter = params.action || "";
  const entityFilter = params.entity || "";
  
  const workspaceId = (session.user as any).workspaceId;
  
  const logs = await prisma.auditLog.findMany({
    where: { 
      workspaceId,
      ...(q ? {
        OR: [
          { entityId: { contains: q, mode: 'insensitive' } },
          { entity: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } }
        ]
      } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(entityFilter ? { entity: entityFilter } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Shield size={20} /></div>
          <h1 className="page-title !mb-0">Logs</h1>
        </div>
        <p className="page-subtitle">Registro histórico de todas las acciones realizadas en el workspace</p>
      </div>

      <div className="card mb-8 p-4 bg-white/[0.02] border-white/5 animate-fade-in shadow-xl">
        <form className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-full sm:min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              name="q" 
              type="text" 
              defaultValue={q} 
              placeholder="Buscar por entidad, ID o usuario..." 
              className="form-input !pl-10 !bg-black/20 border-white/10 focus:border-blue-500/50" 
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-[var(--text-muted)] hidden sm:block" />
            <select name="action" defaultValue={actionFilter} className="form-input !py-2 flex-1 min-w-[140px] sm:flex-none sm:w-40 !bg-black/20 border-white/10">
              <option value="">Todas las Acciones</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Edición</option>
              <option value="DELETE">Eliminación</option>
            </select>
            <select name="entity" defaultValue={entityFilter} className="form-input !py-2 flex-1 min-w-[140px] sm:flex-none sm:w-48 !bg-black/20 border-white/10">
              <option value="">Todas las Entidades</option>
              <option value="Client">Clientes</option>
              <option value="ServiceContract">Suscripciones</option>
              <option value="OneTimeService">Cobros Únicos</option>
              <option value="ServiceBase">Catálogo</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary !py-2 px-6 shadow-lg shadow-blue-500/20">Filtrar</button>
          {(q || actionFilter || entityFilter) && (
            <Link href="/audit" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400" title="Limpiar filtros">
              <X size={20} />
            </Link>
          )}
        </form>
      </div>

      <div className="card !p-0 overflow-hidden shadow-2xl animate-fade-in border-t-4 border-blue-500/20">
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="!pl-8">Fecha y Hora</th>
                <th>Acción</th>
                <th>Entidad Afectada</th>
                <th className="!pr-8">Ejecutado por</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 italic text-[var(--text-muted)]">No hay registros de actividad aún</td>
                </tr>
              ) : (
                logs.map(log => {
                  const hasDetails = log.oldValue || log.newValue;
                  return (
                    <tr key={log.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="!pl-8 py-4">
                        <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
                          <Activity size={12} className="text-blue-500/30" />
                          {format(log.createdAt, "dd MMM, HH:mm:ss")}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase ${ACTION_COLORS[log.action] || 'bg-white/10 text-white'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Database size={12} className="text-[var(--text-muted)]" />
                          <span className="font-semibold text-white/80">{log.entity}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">({log.entityId.slice(-6)})</span>
                        </div>
                        
                        {hasDetails && (
                          <details className="mt-2 text-[10px] text-[var(--text-muted)] group/details">
                            <summary className="cursor-pointer hover:text-white transition-colors py-1 flex items-center gap-1 font-bold uppercase tracking-widest">
                              <Info size={10} />
                              Ver cambios detallados
                            </summary>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/40 rounded-xl mt-2 border border-white/5 shadow-inner">
                              {/* Versión Anterior */}
                              <div className="space-y-2">
                                <p className="text-[9px] text-red-400/50 font-black tracking-[0.2em] uppercase border-b border-red-500/10 pb-1 mb-3">Estado Anterior</p>
                                {log.oldValue ? Object.entries(log.oldValue as object)
                                  .filter(([key]) => !['id', 'workspaceId', 'createdAt', 'updatedAt', 'clientId', 'serviceBaseId'].includes(key))
                                  .map(([key, val]) => (
                                    <div key={key} className="flex justify-between border-b border-white/5 pb-1">
                                      <span className="capitalize font-medium opacity-60">{key}:</span>
                                      <span className="text-white/80 truncate max-w-[150px]">{String(val)}</span>
                                    </div>
                                  )) : <p className="italic opacity-30">Sin datos (Creación)</p>}
                              </div>
                              {/* Versión Nueva */}
                              <div className="space-y-2">
                                <p className="text-[9px] text-emerald-400/50 font-black tracking-[0.2em] uppercase border-b border-emerald-500/10 pb-1 mb-3">Estado Nuevo</p>
                                {log.newValue ? Object.entries(log.newValue as object)
                                  .filter(([key]) => !['id', 'workspaceId', 'createdAt', 'updatedAt', 'clientId', 'serviceBaseId'].includes(key))
                                  .map(([key, val]) => (
                                    <div key={key} className="flex justify-between border-b border-white/5 pb-1">
                                      <span className="capitalize font-medium opacity-60">{key}:</span>
                                      <span className="text-white/80 font-bold truncate max-w-[150px]">{String(val)}</span>
                                    </div>
                                  )) : <p className="italic opacity-30">Sin datos (Eliminación)</p>}
                              </div>
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="!pr-8">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm font-medium text-white/90">{log.user?.name || "Sistema"}</span>
                          <User size={14} className="text-white/20" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
