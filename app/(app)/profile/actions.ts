"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Las fotos se guardan como data URL base64 (redimensionadas en el cliente).
// Ponemos un tope de tamaño por las dudas para no inflar la DB.
const MAX_IMAGE_CHARS = 700_000; // ~500 KB de imagen

function validateImage(image: string | null): string | null | { error: string } {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return { error: "Formato de imagen inválido" };
  if (image.length > MAX_IMAGE_CHARS) return { error: "La imagen es demasiado grande, probá con una más chica" };
  return image;
}

export async function updateProfileAction(
  name: string,
  image: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) return { error: "No autorizado" };

  const cleanName = (name || "").trim();
  if (cleanName.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" };

  const img = validateImage(image);
  if (img && typeof img === "object") return img;

  await prisma.user.update({
    where: { id: user.id },
    data: { name: cleanName, image: img as string | null },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateCompanyAction(
  name: string,
  logo: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.workspaceId) return { error: "No autorizado" };

  const cleanName = (name || "").trim();
  if (cleanName.length < 2) return { error: "El nombre de la empresa debe tener al menos 2 caracteres" };

  const img = validateImage(logo);
  if (img && typeof img === "object") return img;

  await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: { name: cleanName, logo: img as string | null },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}
