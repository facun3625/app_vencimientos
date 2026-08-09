"use server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

export async function enterDemoAction() {
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "La demo no está disponible en este momento. Probá de nuevo en un rato." };
    }
    throw error;
  }
}
