import { prisma } from "@/lib/prisma";

async function getMpSettings() {
  const settings = await prisma.mercadoPagoSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    throw new Error("Mercado Pago no está configurado todavía (Panel de Superadmin → Mercado Pago)");
  }
  return settings;
}

// Uses Mercado Pago's Preapproval API directly (suscripciones recurrentes),
// not Checkout Pro — Checkout Pro is for one-off payments and would need to
// be re-triggered every billing period, which doesn't fit a SaaS subscription.
export async function createSubscriptionCheckout({
  planName,
  price,
  currency,
  frequency,
  payerEmail,
  externalReference,
  backUrl,
}: {
  planName: string;
  price: number;
  currency: string;
  frequency: "monthly" | "yearly";
  payerEmail: string;
  externalReference: string;
  backUrl: string;
}) {
  const settings = await getMpSettings();

  // Mercado Pago's Preapproval API only accepts "days" or "months" as
  // frequency_type — there is no "years". A yearly plan is therefore expressed
  // as every 12 months.
  const autoRecurring =
    frequency === "yearly"
      ? { frequency: 12, frequency_type: "months" }
      : { frequency: 1, frequency_type: "months" };

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Kairos — ${planName}`,
      external_reference: externalReference,
      payer_email: payerEmail,
      back_url: backUrl,
      auto_recurring: {
        ...autoRecurring,
        transaction_amount: price,
        currency_id: currency,
      },
      status: "pending",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago rechazó la solicitud: ${body}`);
  }

  const data = await res.json();
  return { initPoint: data.init_point as string, preapprovalId: data.id as string };
}

export async function getSubscription(preapprovalId: string) {
  const settings = await getMpSettings();
  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${settings.accessToken}` },
  });
  if (!res.ok) throw new Error(`No se pudo consultar la suscripción ${preapprovalId}`);
  return res.json();
}

export async function cancelSubscription(preapprovalId: string) {
  const settings = await getMpSettings();
  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!res.ok) throw new Error(`No se pudo cancelar la suscripción ${preapprovalId}`);
  return res.json();
}
