import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck } from "lucide-react";
import ImpersonateButton from "./ImpersonateButton";
import DeleteUserButton from "./DeleteUserButton";
import SubscriptionControl from "./SubscriptionControl";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  OPERATOR: "Operador",
  READONLY: "Solo lectura",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Usuarios Registrados</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {users.length} usuario{users.length !== 1 ? "s" : ""} en toda la plataforma
        </p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Workspace</th>
                <th>Rol</th>
                <th>Suscripción</th>
                <th>Registrado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-bold text-white flex items-center gap-2">
                      {u.name}
                      {u.isSuperAdmin && (
                        <span title="Superadmin" className="text-purple-400"><ShieldCheck size={14} /></span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                  </td>
                  <td className="text-sm">{u.workspace?.name || "—"}</td>
                  <td>
                    <span className="badge badge-muted">{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td>
                    {u.workspace ? (
                      <SubscriptionControl
                        workspaceId={u.workspace.id}
                        initialPlanTier={u.workspace.planTier}
                        initialStatus={u.workspace.subscriptionStatus}
                      />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="text-xs text-[var(--text-muted)]">
                    {format(u.createdAt, "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <ImpersonateButton userId={u.id} userName={u.name} isSuperAdmin={u.isSuperAdmin} />
                      {!u.isSuperAdmin && <DeleteUserButton userId={u.id} userName={u.name} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
