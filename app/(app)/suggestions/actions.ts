"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const suggestionSchema = z.object({
  content: z.string().min(5, "La sugerencia debe tener al menos 5 caracteres").max(2000, "La sugerencia no puede superar los 2000 caracteres"),
});

export async function createSuggestionAction(content: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "No autorizado. Por favor iniciá sesión." };
  }

  const parsed = suggestionSchema.safeParse({ content });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = session.user as any;
  if (!user.workspaceId) {
    return { error: "El usuario no pertenece a ningún workspace activo." };
  }

  try {
    await prisma.suggestion.create({
      data: {
        userId: user.id,
        workspaceId: user.workspaceId,
        content: parsed.data.content,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al enviar la sugerencia. Intentá de nuevo." };
  }
}
