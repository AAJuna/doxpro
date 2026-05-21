// Midtrans sends POST here for each transaction status change. We verify the
// signature, parse status, and update the subscriptions table accordingly.

import { createClient } from "@supabase/supabase-js";
import { verifyMidtransSignature } from "../_shared/midtrans.ts";

interface MidtransNotification {
  transaction_status: string;
  fraud_status?: string;
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  if (!serverKey) {
    return new Response("Server not configured", { status: 500 });
  }

  let body: MidtransNotification;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // CRITICAL: verify signature before trusting any field
  const validSig = await verifyMidtransSignature(body, serverKey);
  if (!validSig) {
    console.warn(`[midtrans-webhook] Invalid signature for order ${body.order_id}`);
    return new Response("Invalid signature", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ts = body.transaction_status;
  const fs = body.fraud_status;
  let nextStatus: "active" | "past_due" | "cancelled" | "expired" = "expired";

  if (ts === "settlement" || (ts === "capture" && fs === "accept")) {
    nextStatus = "active";
  } else if (ts === "deny" || ts === "expire" || ts === "failure") {
    nextStatus = "expired";
  } else if (ts === "cancel") {
    nextStatus = "cancelled";
  } else if (ts === "pending") {
    nextStatus = "past_due";
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, tier, user_id, org_id")
    .eq("midtrans_subscription_id", body.order_id)
    .maybeSingle();

  if (!existing) {
    console.warn(`[midtrans-webhook] No subscription row for order ${body.order_id}`);
    return new Response("Order not found", { status: 404 });
  }

  const grossAmount = parseFloat(body.gross_amount);
  // Yearly threshold: monthly tiers are ≤ 89000, yearly tiers start at 349000.
  // Anything > 100000 is yearly. Crude but matches our pricing.
  const isYearly = grossAmount > 100000;
  const periodMs = (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000;
  const periodEnd = nextStatus === "active"
    ? new Date(Date.now() + periodMs).toISOString()
    : null;

  await supabase
    .from("subscriptions")
    .update({
      status: nextStatus,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  // Deactivate any older active subs for the same user — one active sub at a time
  if (nextStatus === "active" && existing.user_id) {
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", existing.user_id)
      .neq("id", existing.id)
      .eq("status", "active");
  }

  return new Response("OK", { status: 200 });
});
