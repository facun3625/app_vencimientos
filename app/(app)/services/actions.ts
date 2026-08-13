"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { duesThroughYearEnd } from "@/lib/billing";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const bulkContractSchema = z.object({
  clientId: z.string().min(1),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]),
  currency: z.enum(["ARS", "USD"]).default("ARS"),
  startDate: z.string().transform(v => new Date(v)),
  isPaid: z.coerce.boolean(),
  invoiced: z.coerce.boolean(),
  invoiceSent: z.coerce.boolean(),
  services: z.array(z.object({
    serviceBaseId: z.string().min(1),
    cost: z.coerce.number().min(0).default(0),
    price: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    monthlyCostIds: z.array(z.string()).optional().default([]),
  })).min(1),
});

const bulkOneTimeSchema = z.object({
  clientId: z.string().min(1),
  currency: z.enum(["ARS", "USD"]).default("ARS"),
  deliveryDate: z.string().optional().transform(v => v ? new Date(v) : null),
  isPaid: z.coerce.boolean(),
  invoiced: z.coerce.boolean(),
  invoiceSent: z.coerce.boolean(),
  // The form sends every row with `cost`/`price` (same shape for recurring and
  // one-time). The OneTimeService model columns are internalCost/finalPrice, so
  // we accept cost/price here and map them when creating — otherwise finalPrice
  // never matched the payload and silently defaulted to 0.
  services: z.array(z.object({
    serviceBaseId: z.string().min(1),
    cost: z.coerce.number().min(0).default(0),
    price: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
  })).min(1),
});

export async function createContractAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };

  const raw = {
    clientId: formData.get("clientId"),
    frequency: formData.get("frequency"),
    currency: formData.get("currency") || "ARS",
    startDate: formData.get("startDate"),
    isPaid: formData.get("isPaid") === "on",
    invoiced: formData.get("invoiced") === "on",
    invoiceSent: formData.get("invoiceSent") === "on",
    services: JSON.parse(formData.get("servicesJson") as string),
  };

  const parsed = bulkContractSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { services, isPaid, invoiced, invoiceSent, ...common } = parsed.data;
  const dueDate = common.startDate;
  // Generate the whole year's schedule up front (monthly → this month…Dec,
  // annual → one). The first cycle carries the paid/invoiced state marked on
  // creation; the rest start pending so they show as upcoming/overdue.
  const dues = duesThroughYearEnd(dueDate, common.frequency);

  await prisma.$transaction(
    services.map((s) => {
      const { monthlyCostIds, ...serviceData } = s;
      return prisma.serviceContract.create({
        data: {
          ...common,
          ...serviceData,
          monthlyCosts: { connect: monthlyCostIds.map((id) => ({ id })) },
          payments: {
            create: dues.map((d, i) => ({
              dueDate: d,
              amount: s.price,
              currency: common.currency,
              isPaid: i === 0 ? isPaid : false,
              paidAt: i === 0 && isPaid ? new Date() : null,
              invoiced: i === 0 ? invoiced : false,
              invoiceSent: i === 0 ? invoiceSent : false,
            })),
          },
        },
      });
    })
  );

  revalidatePath("/services");
  revalidatePath("/expirations");
  redirect("/services");
}

export async function createOneTimeAction(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };

  const raw = {
    clientId: formData.get("clientId"),
    currency: formData.get("currency") || "ARS",
    deliveryDate: formData.get("deliveryDate"),
    isPaid: formData.get("isPaid") === "on",
    invoiced: formData.get("invoiced") === "on",
    invoiceSent: formData.get("invoiceSent") === "on",
    services: JSON.parse(formData.get("servicesJson") as string),
  };

  const parsed = bulkOneTimeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { services, ...common } = parsed.data;

  await prisma.$transaction(
    services.map((s) =>
      prisma.oneTimeService.create({
        data: {
          ...common,
          serviceBaseId: s.serviceBaseId,
          internalCost: s.cost,
          finalPrice: s.price,
          notes: s.notes,
        },
      })
    )
  );

  revalidatePath("/services");
  redirect("/services?tab=onetime");
}

const updateContractSchema = z.object({
  serviceBaseId: z.string().min(1),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]),
  currency: z.enum(["ARS", "USD"]).optional(),
  startDate: z.string().transform(v => new Date(v)),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function updateContractAction(id: string, paymentId: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.serviceContract.findFirst({
    where: { id, client: { workspaceId } },
    include: { payments: { where: { id: paymentId } } },
  });
  if (!old || old.payments.length === 0) return { error: "No encontrado" };

  const raw = Object.fromEntries(formData);
  const isPaid = formData.get("isPaid") === "on";
  const invoiced = formData.get("invoiced") === "on";
  const invoiceSent = formData.get("invoiceSent") === "on";
  const monthlyCostIds = formData.getAll("monthlyCostIds") as string[];
  const parsed = updateContractSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dueDate = parsed.data.startDate;
  const currency = parsed.data.currency ?? old.currency;
  const updated = await prisma.serviceContract.update({
    where: { id },
    data: { ...parsed.data, monthlyCosts: { set: monthlyCostIds.map((mcId) => ({ id: mcId })) } },
  });

  const currentPayment = old.payments[0];
  await prisma.contractPayment.update({
    where: { id: currentPayment.id },
    data: { dueDate, amount: parsed.data.price, currency, isPaid, paidAt: isPaid ? (currentPayment.paidAt ?? new Date()) : null, invoiced, invoiceSent },
  });

  // Changing frequency/date invalidates the rest of the year's schedule, so
  // rebuild it: drop the other UNPAID orders (paid ones are always kept) and
  // regenerate the cycles after the edited one through year-end at the new
  // cadence — skipping any date that already has a (paid) order.
  await prisma.contractPayment.deleteMany({
    where: { contractId: id, isPaid: false, id: { not: currentPayment.id } },
  });
  const remaining = await prisma.contractPayment.findMany({ where: { contractId: id }, select: { dueDate: true } });
  const existingDates = new Set(remaining.map((p) => p.dueDate.getTime()));
  const futureDues = duesThroughYearEnd(dueDate, parsed.data.frequency).filter(
    (d) => d.getTime() !== dueDate.getTime() && !existingDates.has(d.getTime())
  );
  if (futureDues.length > 0) {
    await prisma.contractPayment.createMany({
      data: futureDues.map((d) => ({ contractId: id, dueDate: d, amount: parsed.data.price, currency })),
    });
  }
  // Mantener la moneda consistente en todas las cuotas del contrato.
  await prisma.contractPayment.updateMany({ where: { contractId: id }, data: { currency } });

  await auditLog({ action: "UPDATE", entity: "ServiceContract", entityId: id, oldValue: old, newValue: updated });
  revalidatePath("/services");
  revalidatePath("/expirations");
  revalidatePath("/dashboard");
}

const updateOneTimeSchema = z.object({
  serviceBaseId: z.string().min(1),
  name: z.string().optional(),
  currency: z.enum(["ARS", "USD"]).optional(),
  internalCost: z.coerce.number().min(0).default(0),
  finalPrice: z.coerce.number().min(0).default(0),
  deliveryDate: z.string().optional().transform(v => v ? new Date(v) : null),
  isPaid: z.coerce.boolean(),
  invoiced: z.coerce.boolean(),
  invoiceSent: z.coerce.boolean(),
  notes: z.string().optional(),
});

export async function updateOneTimeAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  const workspaceId = (session.user as any).workspaceId;

  const old = await prisma.oneTimeService.findFirst({ where: { id, client: { workspaceId } } });
  if (!old) return { error: "No encontrado" };

  const raw = {
    ...Object.fromEntries(formData),
    isPaid: formData.get("isPaid") === "on",
    invoiced: formData.get("invoiced") === "on",
    invoiceSent: formData.get("invoiceSent") === "on",
  };
  const parsed = updateOneTimeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const updated = await prisma.oneTimeService.update({ where: { id }, data: parsed.data });

  await auditLog({ action: "UPDATE", entity: "OneTimeService", entityId: id, oldValue: old, newValue: updated });
  revalidatePath("/services");
}

export async function toggleInvoiceSentAction(id: string, type: "contract" | "onetime", invoiceSent: boolean) {
  if (type === "contract") {
    await prisma.contractPayment.update({ where: { id }, data: { invoiceSent } });
    await auditLog({ action: "UPDATE", entity: "ContractPayment", entityId: id, newValue: { invoiceSent } });
  } else {
    await prisma.oneTimeService.update({ where: { id }, data: { invoiceSent } });
    await auditLog({ action: "UPDATE", entity: "OneTimeService", entityId: id, newValue: { invoiceSent } });
  }
  revalidatePath("/services");
}

export async function togglePaidAction(id: string, type: "contract" | "onetime", isPaid: boolean) {
  if (type === "contract") {
    await prisma.contractPayment.update({
      where: { id },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    });
    await auditLog({ action: "UPDATE", entity: "ContractPayment", entityId: id, newValue: { isPaid } });
  } else {
    await prisma.oneTimeService.update({ where: { id }, data: { isPaid } });
    await auditLog({ action: "UPDATE", entity: "OneTimeService", entityId: id, newValue: { isPaid } });
  }
  revalidatePath("/services");
  revalidatePath("/expirations");
  revalidatePath("/dashboard");
}

export async function toggleGroupPaidAction(items: { id: string; type: "contract" | "onetime" }[], isPaid: boolean) {
  await Promise.all(
    items.map(async (item) => {
      if (item.type === "contract") {
        await prisma.contractPayment.update({
          where: { id: item.id },
          data: { isPaid, paidAt: isPaid ? new Date() : null },
        });
        await auditLog({ action: "UPDATE", entity: "ContractPayment", entityId: item.id, newValue: { isPaid } });
      } else {
        await prisma.oneTimeService.update({ where: { id: item.id }, data: { isPaid } });
        await auditLog({ action: "UPDATE", entity: "OneTimeService", entityId: item.id, newValue: { isPaid } });
      }
    })
  );
  revalidatePath("/services");
  revalidatePath("/expirations");
  revalidatePath("/dashboard");
}

export async function deleteServiceAction(id: string, type: "contract" | "onetime") {
  if (type === "contract") {
    const old = await prisma.serviceContract.delete({ where: { id } });
    await auditLog({ action: "DELETE", entity: "ServiceContract", entityId: id, oldValue: old });
  } else {
    const old = await prisma.oneTimeService.delete({ where: { id } });
    await auditLog({ action: "DELETE", entity: "OneTimeService", entityId: id, oldValue: old });
  }
  revalidatePath("/services");
  revalidatePath("/expirations");
}
