"use client";
import { useState, useTransition } from "react";
import { Save, Check } from "lucide-react";
import AvatarUpload from "./AvatarUpload";
import { updateProfileAction, updateCompanyAction } from "./actions";

export default function ProfileClient({
  user,
  workspace,
}: {
  user: { name: string; email: string; image: string | null };
  workspace: { name: string; logo: string | null };
}) {
  // --- Perfil personal ---
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState<string | null>(user.image);
  const [savingProfile, startProfile] = useTransition();
  const [profileMsg, setProfileMsg] = useState<{ ok?: boolean; error?: string }>({});

  // --- Empresa ---
  const [companyName, setCompanyName] = useState(workspace.name);
  const [logo, setLogo] = useState<string | null>(workspace.logo);
  const [savingCompany, startCompany] = useTransition();
  const [companyMsg, setCompanyMsg] = useState<{ ok?: boolean; error?: string }>({});

  function saveProfile() {
    setProfileMsg({});
    startProfile(async () => {
      const res = await updateProfileAction(name, image);
      if (res?.error) setProfileMsg({ error: res.error });
      else setProfileMsg({ ok: true });
    });
  }

  function saveCompany() {
    setCompanyMsg({});
    startCompany(async () => {
      const res = await updateCompanyAction(companyName, logo);
      if (res?.error) setCompanyMsg({ error: res.error });
      else setCompanyMsg({ ok: true });
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Perfil personal */}
      <div className="card !p-6">
        <h2 className="text-lg font-bold mb-1">Perfil personal</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">Tu nombre y foto, cómo te ve tu equipo.</p>

        <div className="form-group">
          <label className="form-label">Foto de perfil</label>
          <AvatarUpload value={image} onChange={setImage} variant="avatar" />
        </div>

        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Email</label>
          <input className="form-input !opacity-60 !cursor-not-allowed" value={user.email} disabled />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary">
            <Save size={15} /> {savingProfile ? "Guardando..." : "Guardar cambios"}
          </button>
          {profileMsg.ok && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check size={15} /> Guardado
            </span>
          )}
          {profileMsg.error && <span className="text-sm text-red-400">{profileMsg.error}</span>}
        </div>
      </div>

      {/* Empresa */}
      <div className="card !p-6">
        <h2 className="text-lg font-bold mb-1">Empresa</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">El nombre y logo de tu workspace.</p>

        <div className="form-group">
          <label className="form-label">Logo de la empresa</label>
          <AvatarUpload value={logo} onChange={setLogo} variant="logo" />
        </div>

        <div className="form-group !mb-0">
          <label className="form-label">Nombre de la empresa</label>
          <input className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={saveCompany} disabled={savingCompany} className="btn btn-primary">
            <Save size={15} /> {savingCompany ? "Guardando..." : "Guardar cambios"}
          </button>
          {companyMsg.ok && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <Check size={15} /> Guardado
            </span>
          )}
          {companyMsg.error && <span className="text-sm text-red-400">{companyMsg.error}</span>}
        </div>
      </div>
    </div>
  );
}
