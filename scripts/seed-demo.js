require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { addDays, subDays } = require("date-fns");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@kailos.app";
const DEMO_PASSWORD = "kailos-demo-2026";
const DEMO_SLUG = "demo-kailos";

async function main() {
  const now = new Date();

  let workspace = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Demo Kailos", slug: DEMO_SLUG, isDemo: true, planTier: "PROFESIONAL", subscriptionStatus: "ACTIVE" },
    });
  } else {
    // Wipe everything under the demo workspace so a reset always starts clean.
    await prisma.contractPayment.deleteMany({ where: { contract: { client: { workspaceId: workspace.id } } } });
    await prisma.serviceContract.deleteMany({ where: { client: { workspaceId: workspace.id } } });
    await prisma.oneTimeService.deleteMany({ where: { client: { workspaceId: workspace.id } } });
    await prisma.monthlyCost.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.monthlyExpense.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.auditLog.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.client.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.serviceBase.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { isDemo: true, planTier: "PROFESIONAL", subscriptionStatus: "ACTIVE" },
    });
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { name: "Cuenta Demo", email: DEMO_EMAIL, password: hashedPassword, role: "ADMIN", workspaceId: workspace.id },
    update: { workspaceId: workspace.id, password: hashedPassword },
  });

  const [hosting, mantenimiento, logo] = await Promise.all([
    prisma.serviceBase.create({ data: { name: "Hosting Web", type: "RECURRING", description: "Servidor y dominio", workspaceId: workspace.id } }),
    prisma.serviceBase.create({ data: { name: "Mantenimiento Mensual", type: "RECURRING", description: "Actualizaciones y soporte", workspaceId: workspace.id } }),
    prisma.serviceBase.create({ data: { name: "Diseño de Logo", type: "ONE_TIME", description: "Identidad visual", workspaceId: workspace.id } }),
  ]);

  const [rivas, espiga, delta] = await Promise.all([
    prisma.client.create({ data: { name: "Estudio Rivas & Asoc.", company: "Estudio Rivas", email: "contacto@rivas.com", workspaceId: workspace.id } }),
    prisma.client.create({ data: { name: "Panadería La Espiga", company: "La Espiga", email: "hola@laespiga.com", workspaceId: workspace.id } }),
    prisma.client.create({ data: { name: "Consultora Delta", company: "Delta Consulting", email: "info@delta.com", workspaceId: workspace.id } }),
  ]);

  const cloudCost = await prisma.monthlyCost.create({
    data: { name: "Servidor Cloud Compartido", amount: 18000, workspaceId: workspace.id },
  });

  const contractRivas = await prisma.serviceContract.create({
    data: {
      clientId: rivas.id, serviceBaseId: hosting.id, frequency: "MONTHLY",
      cost: 4000, price: 15000, startDate: subDays(now, 27), status: "ACTIVE",
      monthlyCosts: { connect: [{ id: cloudCost.id }] },
      payments: { create: { dueDate: addDays(now, 3), amount: 15000, isPaid: false } },
    },
  });

  const contractEspiga = await prisma.serviceContract.create({
    data: {
      clientId: espiga.id, serviceBaseId: mantenimiento.id, frequency: "MONTHLY",
      cost: 6000, price: 22000, startDate: subDays(now, 35), status: "ACTIVE",
      payments: { create: { dueDate: subDays(now, 5), amount: 22000, isPaid: false } },
    },
  });

  const contractDelta = await prisma.serviceContract.create({
    data: {
      clientId: delta.id, serviceBaseId: hosting.id, frequency: "ANNUAL",
      cost: 40000, price: 180000, startDate: subDays(now, 10), status: "ACTIVE",
      monthlyCosts: { connect: [{ id: cloudCost.id }] },
      payments: { create: { dueDate: addDays(now, 20), amount: 180000, isPaid: true, paidAt: subDays(now, 10) } },
    },
  });

  await prisma.oneTimeService.create({
    data: {
      clientId: espiga.id, serviceBaseId: logo.id, finalPrice: 35000, internalCost: 8000,
      deliveryDate: subDays(now, 10), isPaid: true, status: "PAID",
    },
  });

  await prisma.monthlyExpense.create({
    data: { workspaceId: workspace.id, month: new Date(now.getFullYear(), now.getMonth(), 1), description: "Herramientas SaaS", amount: 12000 },
  });

  console.log("Demo sembrada:", { workspaceId: workspace.id, email: DEMO_EMAIL });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
