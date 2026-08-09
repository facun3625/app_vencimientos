import { prisma } from "@/lib/prisma";

export async function getPlanForRegister(planParam?: string) {
  const tier = ["starter", "profesional", "agencia"].includes((planParam || "").toLowerCase())
    ? planParam!.toUpperCase()
    : "STARTER";
  return prisma.plan.findUnique({ where: { tier: tier as any } });
}
