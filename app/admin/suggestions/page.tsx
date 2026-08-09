import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Calendar, User, Briefcase } from "lucide-react";
import DeleteSuggestionButton from "./DeleteSuggestionButton";

export default async function AdminSuggestionsPage() {
  const suggestions = await prisma.suggestion.findMany({
    include: {
      user: true,
      workspace: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Sugerencias de Mejoras</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {suggestions.length} sugerencia{suggestions.length !== 1 ? "s" : ""} recibida{suggestions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="card !p-12 text-center flex flex-col items-center gap-4 border-dashed border-white/10 bg-transparent">
          <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-[var(--text-muted)]">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No hay sugerencias</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Las sugerencias y comentarios que envíen los usuarios aparecerán listados acá.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="card !p-5 relative border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <User size={12} className="text-purple-400" />
                    <span>{s.user.name}</span>
                    <span className="text-[var(--text-muted)] font-normal">({s.user.email})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={12} />
                    <span>{s.workspace.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>
                      {format(s.createdAt, "d 'de' MMMM yyyy, HH:mm 'hs'", { locale: es })}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 z-10">
                  <DeleteSuggestionButton id={s.id} />
                </div>
              </div>

              <div className="text-sm text-slate-100 bg-white/[0.02] border border-white/5 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
                {s.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
