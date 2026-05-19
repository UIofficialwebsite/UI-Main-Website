// ============================================================
// Cashfree webhook receiver — primary trigger for payment state changes
// ============================================================
// Cashfree posts here for every PAYMENT_SUCCESS / PAYMENT_FAILED /
// PAYMENT_USER_DROPPED event. We:
//   1. Verify HMAC signature (reject 401 if invalid)
//   2. Log every delivery to cashfree_webhook_events (forensics)
//   3. Hand off to processPaymentEvent (idempotent)
//   4. Return 2xx fast so Cashfree doesn't retry; 5xx if we want a retry.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyCashfreeSignature } from "../_shared/verifyCashfreeSignature.ts";
import { getCashfreeWebhookSecret } from "../_shared/cashfreeClient.ts";
import { processPaymentEvent } from "../_shared/processPaymentEvent.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";

  let sigValid = false;
  try {
    const secret = getCashfreeWebhookSecret();
    sigValid = await verifyCashfreeSignature(rawBody, timestamp, signature, secret);
  } catch (err: any) {
    console.error("[webhook] signature setup error:", err.message);
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    /* leave null, logged below */
  }

  const orderId: string | null = payload?.data?.order?.order_id ?? null;
  const cfPaymentId: string | null =
    payload?.data?.payment?.cf_payment_id?.toString() ?? null;
  const eventType: string = payload?.type ?? "unknown";

  // Log every delivery (valid or not) for forensics + replay.
  const { data: logRow } = await supabase
    .from("cashfree_webhook_events")
    .insert({
      event_type: eventType,
      order_id: orderId,
      cf_payment_id: cfPaymentId,
      signature_valid: sigValid,
      raw_payload: payload ?? { rawBody },
    })
    .select("id")
    .single();

  // Reject unsigned/forged after logging.
  if (!sigValid) {
    console.warn(`[webhook] invalid signature, event=${eventType}, order=${orderId}`);
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  // No order_id — nothing to do (could be a refund or unrelated event we don't handle yet).
  if (!orderId) {
    return new Response("ok (no order_id)", { status: 200, headers: corsHeaders });
  }

  try {
    const result = await processPaymentEvent(orderId, "webhook");

    if (logRow?.id) {
      await supabase
        .from("cashfree_webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", logRow.id);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`[webhook] processing error for ${orderId}:`, err.message);
    if (logRow?.id) {
      await supabase
        .from("cashfree_webhook_events")
        .update({ processing_error: err.message })
        .eq("id", logRow.id);
    }
    // Return 5xx so Cashfree retries this webhook (transient errors recover automatically).
    return new Response(err.message, { status: 500, headers: corsHeaders });
  }
});
