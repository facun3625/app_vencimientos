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

  const costUsers: Record<string, number> = {};
  contracts.forEach(c => c.monthlyCosts.forEach(mc => { costUsers[mc.id] = (costUsers[mc.id] || 0) + 1; }));
  const monthly = contracts.map(c => {
    const months = FREQUENCY_TO_MONTHS[c.frequency] ?? 1;
    const sharedCost = c.monthlyCosts.reduce((sum, mc) => sum + mc.amount / costUsers[mc.id], 0);
    return { startDate: c.startDate, monthlyCost: c.cost / months + sharedCost };
  });

  const monthsUpToReal = (startDate: Date) => {
    const effectiveStart = startDate > yearStart ? startDate : yearStart;
    if (effectiveStart >= realCutoff) return 0;
    return Math.max(Math.min(differenceInCalendarMonths(realCutoff, effectiveStart), 12), 0);
  };

  const recurringRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const recurringCost = monthly.reduce((sum, c) => sum + c.monthlyCost * monthsUpToReal(c.startDate), 0);
  const onceRevenue = onceServices.reduce((sum, o) => sum + o.finalPrice, 0);
  const onceCost = onceServices.reduce((sum, o) => sum + o.internalCost, 0);
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const netResult = recurringRevenue + onceRevenue - (recurringCost + onceCost) - expensesTotal;
  return { year: now.getFullYear(), netResult, monthlyAverage: netResult / 12 };
}
