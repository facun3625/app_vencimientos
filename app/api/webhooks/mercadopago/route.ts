import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/mercadopago";

const STATUS_MAP: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING"> = {
  authorized: "ACTIVE",
  paused: "PAST_DUE",
  cancelled: "CANCELED",
  pending: "TRIALING",
};

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    // Some Mercado Pago pings have no body — nothing to process, just ack.
  }

  const preapprovalId: string | null =
    body?.data?.id || req.nextUrl.searchParams.get("id") || null;
  const type: string | null = body?.type || req.nextUrl.searchParams.get("type");

  if (!preapprovalId || (type && type !== "subscription_preapproval" && type !== "preapproval")) {
    return NextResponse.json({ ok: true });
  }

  try {
    const subscription = await getSubscription(preapprovalId);
    const workspaceId: string | undefined = subscription.external_reference;
    if (!workspaceId) return NextResponse.json({ ok: true });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return NextResponse.json({ ok: true });

    const newStatus = STATUS_MAP[subscription.status] || "TRIALING";

    const data: any = {
      subscriptionStatus: newStatus,
      mpSubscriptionId: preapprovalId,
      mpPayerEmail: subscription.payer_email,
      currentPeriodEnd: subscription.next_payment_date ? new Date(subscription.next_payment_date) : undefined,
    };

    // Payment authorized: promote the plan the user actually paid for. Covers
    // both in-app upgrades (pendingPlanTier set) and, harmlessly, signups where
    // planTier was already the chosen one and pendingPlanTier is null.
    if (newStatus === "ACTIVE" && workspace.pendingPlanTier) {
      data.planTier = workspace.pendingPlanTier;
      data.pendingPlanTier = null;
    }

    await prisma.workspace.update({ where: { id: workspaceId }, data });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago:", err);
    // Still ack with 200 so Mercado Pago doesn't hammer retries for an error
    // on our side while we investigate — the next webhook ping will retry the state.
  }

  return NextResponse.json({ ok: true });
}

// Mercado Pago pings the webhook URL with GET while you're configuring it,
// to confirm it resolves before saving.
export async function GET() {
  return NextResponse.json({ ok: true });
}
