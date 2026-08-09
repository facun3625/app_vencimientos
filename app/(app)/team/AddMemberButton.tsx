"use client";
import React, { useState } from "react";
import { UserPlus, X, Loader2, Shield, Mail, Key } from "lucide-react";
import { addMember } from "./actions";

export default function AddMemberButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await addMember(formData);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
      // We use revalidatePath in action but a reload here ensures State is fresh if needed
      window.location.reload();
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary shadow-lg shadow-blue-500/20">
        <UserPlus size={18} /> Agregar Colaborador
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="card w-full max-w-md shadow-2xl border-white/10 relative overflow-hidden bg-[#0a0f1d]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-blue" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
                 <UserPlus className="text-blue-400" size={24} /> Nuevo Miembro
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 block">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"><UserPlus size={16} /></div>
                  <input name="name" required className="form-input !pl-10 !bg-white/[0.03] border-white/10 focus:border-blue-500/50" placeholder="Ej: Juan Pérez" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 block">Email</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"><Mail size={16} /></div>
                  <input name="email" type="email" required className="form-input !pl-10 !bg-white/[0.03] border-white/10 focus:border-blue-500/50" placeholder="ejemplo@negocio.com" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 block">Contraseña Inicial</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"><Key size={16} /></div>
                  <input name="password" type="password" required className="form-input !pl-10 !bg-white/[0.03] border-white/10 focus:border-blue-500/50" placeholder="Minimum 4 characters" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 block">Rol / Permisos</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"><Shield size={16} /></div>
                   <select name="role" required className="form-input !pl-10 !bg-white/[0.03] border-white/10">
                     <option value="OPERATOR">Operador (Edición)</option>
                     <option value="MANAGER">Manager (Gestión Total)</option>
                     <option value="READONLY">Solo Lectura</option>
                     <option value="ADMIN">Administrador</option>
                   </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs font-bold flex items-center gap-2">
                  <X size={14} /> {error}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="btn bg-white/5 text-white hover:bg-white/10 flex-1 justify-center border-white/5">Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center shadow-lg shadow-blue-500/20">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
