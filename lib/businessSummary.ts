import { prisma } from "@/lib/prisma";
import { addMonths, differenceInCalendarMonths } from "date-fns";

const FREQUENCY_TO_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, BIANNUAL: 6, ANNUAL: 12 };

// Same "Hasta Hoy" logic as the Resumen del Negocio tab in /statistics, fixed to
// the current calendar year: revenue counts only what's actually been billed
// (recurring) or charged (once), and recurring cost is capped at the current
// month so months that haven't happened yet aren't counted.
export async function getCurrentYearNetResult(workspaceId: string) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const realCutoff = addMonths(currentMonthStart, 1);

  const [contracts, payments, onceServices, expenses] = await Promise.all([
    prisma.serviceContract.findMany({
      where: { client: { workspaceId }, status: "ACTIVE" },
      include: { monthlyCosts: true },
    }),
    prisma.contractPayment.findMany({
      where: { contract: { client: { workspaceId } }, dueDate: { gte: yearStart, lt: yearEnd } },
    }),
    prisma.oneTimeService.findMany({
      where: {
        client: { workspaceId },
        OR: [
          { deliveryDate: { gte: yearStart, lt: yearEnd } },
          { deliveryDate: null, createdAt: { gte: yearStart, lt: yearEnd } },
        ],
      },
    }),
    prisma.monthlyExpense.findMany({ where: { workspaceId, month: { gte: yearStart, lt: yearEnd } } }),
  ]);

  const monthsUpToReal = (startDate: Date) => {
    const effectiveStart = startDate > yearStart ? startDate : yearStart;
    if (effectiveStart >= realCutoff) return 0;
    return Math.max(Math.min(differenceInCalendarMonths(realCutoff, effectiveStart), 12), 0);
  };

  // Multi-moneda: ingresos y costo interno del servicio viven en la moneda del
  // servicio; los costos mensuales compartidos y los gastos son SIEMPRE ARS
  // (infraestructura en pesos), así que pesan solo en el neto en pesos.
  const add = (acc: Record<string, number>, cur: string, amount: number) => {
    acc[cur] = (acc[cur] || 0) + amount;
  };

  const costUsers: Record<string, number> = {};
  contracts.forEach(c => c.monthlyCosts.forEach(mc => { costUsers[mc.id] = (costUsers[mc.id] || 0) + 1; }));

  const revenue: Record<string, number> = {};
  const internalCost: Record<string, number> = {};
  let sharedCostTotal = 0; // ARS
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0); // ARS

  payments.forEach(p => add(revenue, p.currency || "ARS", p.amount));
  onceServices.forEach(o => {
    add(revenue, o.currency || "ARS", o.finalPrice);
    add(internalCost, o.currency || "ARS", o.internalCost);
  });
  contracts.forEach(c => {
    const months = FREQUENCY_TO_MONTHS[c.frequency] ?? 1;
    const m = monthsUpToReal(c.startDate);
    add(internalCost, c.currency || "ARS", (c.cost / months) * m);
    const sharedMonthly = c.monthlyCosts.reduce((sum, mc) => sum + mc.amount / costUsers[mc.id], 0);
    sharedCostTotal += sharedMonthly * m;
  });

  const currencies = ["ARS", "USD"];
  const netByCurrency: Record<string, number> = {};
  currencies.forEach(cur => {
    const rev = revenue[cur] || 0;
    let cost = internalCost[cur] || 0;
    if (cur === "ARS") cost += sharedCostTotal + expensesTotal;
    netByCurrency[cur] = rev - cost;
  });

  const monthlyAverageByCurrency: Record<string, number> = {};
  currencies.forEach(cur => { monthlyAverageByCurrency[cur] = netByCurrency[cur] / 12; });

  return { year: now.getFullYear(), netByCurrency, monthlyAverageByCurrency };
}
