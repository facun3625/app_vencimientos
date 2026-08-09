import { prisma } from "@/lib/prisma";
import { DEMO_SLUG, DEMO_EMAIL } from "@/lib/demo";
import ResetDemoButton from "./ResetDemoButton";

export default async function AdminDemoPage() {
  const workspace = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });

  const [clientCount, contractCount, onceCount] = workspace
    ? await Promise.all([
        prisma.client.count({ where: { workspaceId: workspace.id } }),
        prisma.serviceContract.count({ where: { client: { workspaceId: workspace.id } } }),
        prisma.oneTimeService.count({ where: { client: { workspaceId: workspace.id } } }),
      ])
    : [0, 0, 0];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Workspace Demo</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Cuenta compartida y pública en <code>/demo</code>, accesible con <code>{DEMO_EMAIL}</code>.
          Se recomienda resetearla manualmente cada tanto (o programar un cron que llame a esta misma acción).
        </p>
      </div>

      <div className="card !p-6 max-w-xl flex flex-col gap-5">
        {workspace ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Clientes</p>
              <p className="text-xl font-bold text-white font-mono">{clientCount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Contratos</p>
              <p className="text-xl font-bold text-white font-mono">{contractCount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Únicos</p>
              <p className="text-xl font-bold text-white font-mono">{onceCount}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-400">Todavía no existe el workspace demo — se crea al resetear por primera vez.</p>
        )}

        <ResetDemoButton hasWorkspace={!!workspace} />
      </div>
    </div>
  );
}
