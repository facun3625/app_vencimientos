"use client";

import { useState, useTransition } from "react";
import { createSuggestionAction } from "./actions";
import { MessageSquarePlus, Send, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuggestionsPage() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      setError("La sugerencia debe tener al menos 5 caracteres.");
      return;
    }
    setError("");

    startTransition(async () => {
      const res = await createSuggestionAction(content);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsSuccess(true);
        setContent("");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="page-container max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card !p-8 text-center flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] border-emerald-500/20 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={40} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Muchas gracias!</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Tu sugerencia fue registrada correctamente. Leemos cada comentario para seguir construyendo la mejor plataforma para vos.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setIsSuccess(false)}
              className="btn btn-primary w-full justify-center"
            >
              Enviar otra sugerencia
            </button>
            <Link
              href="/dashboard"
              className="btn btn-secondary w-full justify-center"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-xl mx-auto">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <MessageSquarePlus size={20} />
          </div>
          <h1 className="page-title !mb-0 text-2xl">Dejanos tu sugerencia</h1>
        </div>
        <p className="page-subtitle leading-relaxed">
          ¿Hay algo que podamos mejorar o alguna función que te gustaría ver? Contanos tu idea. Las leemos todas.
        </p>
      </div>

      <div className="card !p-6 shadow-xl border-white/5 bg-white/[0.01]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tu sugerencia de mejora
            </label>
            <textarea
              value={content}
              disabled={isPending}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError("");
              }}
              placeholder="Describí qué te gustaría que agreguemos, modifiquemos o mejoremos en la plataforma..."
              className="form-input min-h-[160px] !pl-3 !py-3 resize-none !bg-white/[0.02] border-white/10 rounded-xl focus:border-purple-500 placeholder-white/20 text-sm leading-relaxed transition-all duration-300"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-red-400 font-medium">
                {error}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {content.length} / 2000
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
            <Link
              href="/dashboard"
              className="btn btn-secondary !py-2.5"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending || content.trim().length < 5}
              className="btn btn-primary !py-2.5 px-6 gap-2 justify-center shadow-lg shadow-purple-500/15"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Enviar sugerencia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
