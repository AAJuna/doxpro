// Authenticated user calls this with {tier, billing}. We create a Midtrans
// transaction, return snap_token. Frontend opens Snap UI with that token.
// Webhook (separate function) handles status updates.

import { createClient } from "@supabase/supabase-js";
import { snapApiBase, basicAuthHeader } from "../_shared/midtrans.ts";

interface RequestBody {
  tier: "pro_personal" | "pro_team";
  billing: "monthly" | "yearly";
}

const TIER_PRICING: Record<string, Record<string, number>> = {
  pro_personal: { monthly: 39000, yearly: 349000 },
  pro_team: { monthly: 89000, yearly: 890000 },
};

const TIER_NAME: Record<string, string> = {
  pro_personal: "doxpro Pro Personal",
  pro_team: "doxpro Pro Team",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  const isProduction = Deno.env.get("MIDTRANS_PRODUCTION") === "true";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!serverKey) {
    return jsonResponse({ ok: false, error: "MIDTRANS_SERVER_KEY not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const price = TIER_PRICING[body.tier]?.[body.billing];
  if (!price) {
    return jsonResponse({ ok: false, error: "Invalid tier or billing" }, 400);
  }

  const orderId = `${body.tier}-${user.id.slice(0, 8)}-${Date.now()}`;

  const snapBody = {
    transaction_details: { order_id: orderId, gross_amount: price },
    item_details: [
      {
        id: `${body.tier}-${body.billing}`,
        price,
        quantity: 1,
        name: `${TIER_NAME[body.tier]} (${body.billing})`,
      },
    ],
    customer_details: {
      email: user.email,
      first_name: user.user_metadata?.full_name || user.email?.split("@")[0],
    },
    callbacks: {
      finish: `${supabaseUrl.replace(/\/$/, "")}/payment/success?order_id=${orderId}`,
    },
  };

  const snapResp = await fetch(`${snapApiBase(isProduction)}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuthHeader(serverKey),
    },
    body: JSON.stringify(snapBody),
  });

  if (!snapResp.ok) {
    const errText = await snapResp.text();
    return jsonResponse({ ok: false, error: `Midtrans error: ${errText}` }, 502);
  }

  const snapJson = await snapResp.json();

  // Record pending subscription row. Webhook flips status to active on payment.
  await supabase.from("subscriptions").insert({
    user_id: user.id,
    tier: body.tier,
    status: "expired",
    midtrans_subscription_id: orderId,
  });

  return jsonResponse({
    ok: true,
    snapToken: snapJson.token,
    redirectUrl: snapJson.redirect_url,
    orderId,
  });
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
