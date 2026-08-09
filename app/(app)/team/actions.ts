"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";
import { assertUserLimit } from "@/lib/plan-limits";

export async function addMember(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const user = session.user as any;
  
  // Only ADMIN can add members
  if (user.role !== "ADMIN") return { error: "Solo administradores pueden agregar miembros" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as any;

  if (!name || !email || !password || !role) return { error: "Todos los campos son obligatorios" };
  if (password.length < 4) return { error: "La contraseña es muy corta (mínimo 4 caracteres)" };

  try {
    await assertUserLimit(user.workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "Este email ya está en uso por otro usuario" };

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newMember = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        workspaceId: user.workspaceId,
      }
    });

    // Log the action for security
    await auditLog({
      action: "CREATE",
      entity: "User",
      entityId: newMember.id,
      newValue: { name, email, role },
      workspaceId: user.workspaceId,
      userId: user.id,
    });

    revalidatePath("/team");
    return { success: true };
  } catch (e) {
    console.error("Error creating member:", e);
    return { error: "Fallo técnico al crear el miembro del equipo" };
  }
}
