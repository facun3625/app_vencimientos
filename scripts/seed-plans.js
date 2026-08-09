require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const plans = [
  {
    tier: "STARTER",
    name: "Starter",
    description: "Para arrancar solo, con una cartera chica de clientes.",
    priceAmount: 0,
    currency: "ARS",
    billingInterval: "monthly",
    clientLimit: 15,
    userLimit: 1,
    featured: false,
    features: [
      "1 usuario",
      "Hasta 15 clientes activos",
      "Servicios recurrentes y únicos ilimitados",
      "Vencimientos + calendario",
    ],
  },
  {
    tier: "PROFESIONAL",
    name: "Profesional",
    description: "Para quien ya vive de esto y necesita ver la rentabilidad real.",
    priceAmount: 0,
    currency: "ARS",
    billingInterval: "monthly",
    clientLimit: null,
    userLimit: 3,
    featured: true,
    features: [
      "Hasta 3 usuarios",
      "Clientes ilimitados",
      "Costos mensuales compartidos + Gastos",
      "Centro de inteligencia completo",
      "Modo Real y Proyectado",
    ],
  },
  {
    tier: "AGENCIA",
    name: "Estudio / Agencia",
    description: "Para equipos con varias personas cobrando a la vez.",
    priceAmount: 0,
    currency: "ARS",
    billingInterval: "monthly",
    clientLimit: null,
    userLimit: null,
    featured: false,
    features: [
      "Usuarios ilimitados",
      "Todo lo de Profesional",
      "Soporte prioritario",
      "Onboarding asistido",
    ],
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      create: plan,
      update: {},
    });
  }
  console.log("Planes sembrados:", plans.map((p) => p.tier).join(", "));
}

main().finally(() => prisma.$disconnect());
