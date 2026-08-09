import { prisma } from "@/lib/prisma";
import { addMonths, addYears } from "date-fns";

const FREQUENCY_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, BIANNUAL: 6 };

export function computeNextDueDate(from: Date, frequency: string) {
  if (frequency === "ANNUAL") return addYears(from, 1);
  return addMonths(from, FREQUENCY_MONTHS[frequency]);
}

/**
 * All due dates from `start` (inclusive) through the end of `start`'s calendar
 * year, at the contract's frequency. A monthly contract started in August
 * yields Aug…Dec; an annual one yields a single due date. Used when creating a
 * contract so the whole year's schedule exists up front — unpaid ones simply
 * show as overdue, they're never rolled up or hidden.
 */
export function duesThroughYearEnd(start: Date, frequency: string): Date[] {
  const limit = new Date(start.getFullYear() + 1, 0, 1); // Jan 1 of next year
  const dues: Date[] = [];
  let d = new Date(start);
  while (d < limit) {
    dues.push(new Date(d));
    d = computeNextDueDate(d, frequency);
  }
  return dues;
}

/**
 * On app load: make sure each active contract has every due date generated
 * through the end of the current calendar year (so the annual stats always
 * show what's still to be collected). Fills in any missing cycles from the
 * latest existing due date onward; never deletes or touches paid orders, and
 * never creates more than one per cycle.
 */
export async function ensureCurrentOrders(workspaceId: string) {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const contracts = await prisma.serviceContract.findMany({
    where: { client: { workspaceId }, status: "ACTIVE" },
    include: { payments: { orderBy: { dueDate: "desc" } } },
  });

  for (const c of contracts) {
    if (c.payments.length === 0) continue;
    let next = computeNextDueDate(c.payments[0].dueDate, c.frequency);
    while (next < yearEnd) {
      await prisma.contractPayment.create({
        data: { contractId: c.id, dueDate: next, amount: c.price },
      });
      next = computeNextDueDate(next, c.frequency);
    }
  }
}
