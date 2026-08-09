import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserPlus, Shield, Mail, Calendar, User as UserIcon } from "lucide-react";
import AddMemberButton from "./AddMemberButton";

export default async function TeamPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const workspaceId = (session.user as any).workspaceId;

  const members = await prisma.user.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const ROLE_BADGES: Record<string, string> = {
    ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    MANAGER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    OPERATOR: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    READONLY: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="page-title">Equipo de Trabajo</h1>
          <p className="page-subtitle">Gestioná los colaboradores de tu negocio y sus permisos</p>
        </div>
        <AddMemberButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="card group hover:scale-[1.02] transition-all duration-300 border-white/5 bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-blue flex items-center justify-center text-xl font-black shadow-lg">
                {member.name.substring(0,2).toUpperCase()}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${ROLE_BADGES[member.role] || ROLE_BADGES.OPERATOR}`}>
                {member.role}
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{member.name}</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Mail size={12} />
                {member.email}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] uppercase font-bold">
                <Calendar size={12} />
                Unido el {member.createdAt.toLocaleDateString()}
              </div>
              <button className="text-xs text-white/30 hover:text-red-400 transition-colors font-bold uppercase tracking-widest">
                Editar
              </button>
            </div>
          </div>
        ))}

        {/* Placeholder for inviting more */}
        <div className="border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
              <UserPlus className="text-white/50 group-hover:text-blue-400" size={24} />
           </div>
           <p className="text-sm font-bold text-white/50 group-hover:text-white">Agregar Miembro</p>
        </div>
      </div>
    </div>
  );
}
