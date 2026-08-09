import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus, Repeat, Zap, Trash2, Layers } from "lucide-react";
import CatalogForm from "./CatalogForm";
import CatalogItemRow from "./CatalogItemRow";

export default async function CatalogPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;
  const services = await prisma.serviceBase.findMany({
    where: { workspaceId },
    include: { _count: { select: { contracts: true, oneTime: true } } },
    orderBy: { name: "asc" },
  });
  const recurring = services.filter(s => s.type === "RECURRING");
  const oneTime = services.filter(s => s.type === "ONE_TIME");

  return (
    <div className="page-container">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Layers size={20} /></div>
          <h1 className="page-title !mb-0">Catálogo de Servicios</h1>
        </div>
        <p className="page-subtitle">Definí los tipos de servicios que ofrecés para estandarizar tu facturación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recurrentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold text-white"><Repeat size={18} className="text-blue-500" /> Servicios Recurrentes</h2>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{recurring.length} tipos</span>
          </div>
          
          <div className="mb-4">
            <CatalogForm type="RECURRING" />
          </div>
          <div className="card !p-2 h-fit min-h-[100px]">
            {recurring.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] italic">No hay servicios recurrentes definidos</div>
            ) : (
              recurring.map(s => (
                <CatalogItemRow
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  description={s.description}
                  countLabel={`${s._count.contracts} contratos activos`}
                />
              ))
            )}
          </div>
        </div>

        {/* Únicos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold text-white"><Zap size={18} className="text-amber-500" /> Servicios Únicos</h2>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{oneTime.length} tipos</span>
          </div>
          
          <div className="mb-4">
            <CatalogForm type="ONE_TIME" />
          </div>
          <div className="card !p-2 h-fit min-h-[100px]">
            {oneTime.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] italic">No hay servicios únicos definidos</div>
            ) : (
              oneTime.map(s => (
                <CatalogItemRow
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  description={s.description}
                  countLabel={`${s._count.oneTime} entregas realizadas`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
