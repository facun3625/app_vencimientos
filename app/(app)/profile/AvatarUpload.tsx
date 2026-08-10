"use client";
import { useRef, useState } from "react";
import { Camera, Trash2, User, Building2 } from "lucide-react";

// Redimensiona la imagen elegida en el navegador antes de guardarla, así no
// mandamos archivos gigantes a la DB. Los avatares se recortan cuadrados
// (cover, JPEG); los logos se ajustan enteros dentro del cuadro (contain, PNG
// para conservar transparencia).
function resizeImage(file: File, variant: "avatar" | "logo", max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));

      if (variant === "avatar") {
        // Recorte cuadrado centrado (cover).
        canvas.width = max;
        canvas.height = max;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, max, max);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } else {
        // Logo entero dentro del cuadro (contain), conservando proporción.
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

export default function AvatarUpload({
  value,
  onChange,
  variant = "avatar",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  variant?: "avatar" | "logo";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Elegí un archivo de imagen");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, variant);
      onChange(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
    }
  }

  const boxClass = variant === "avatar" ? "rounded-full" : "rounded-2xl";
  const Fallback = variant === "avatar" ? User : Building2;

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-20 h-20 shrink-0 overflow-hidden border border-[var(--border)] bg-white/5 flex items-center justify-center ${boxClass}`}
      >
        {value ? (
          <img
            src={value}
            alt="Vista previa"
            className={variant === "avatar" ? "w-full h-full object-cover" : "w-full h-full object-contain p-1.5"}
          />
        ) : (
          <Fallback size={30} className="text-[var(--text-muted)]" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-secondary !text-xs !py-2"
          >
            <Camera size={14} /> {value ? "Cambiar" : "Subir foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="btn btn-danger !text-xs !py-2"
            >
              <Trash2 size={14} /> Quitar
            </button>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          {variant === "avatar" ? "Recomendado: imagen cuadrada." : "PNG con fondo transparente ideal."} Máx. 5MB.
        </p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
