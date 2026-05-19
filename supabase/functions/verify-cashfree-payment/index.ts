// ============================================================
// verify-cashfree-payment — UX-only redirector
// ============================================================
// As of the payment-robustness refactor, this function is the BROWSER
// RETURN URL handler. It is NOT the source of truth — the Cashfree webhook
// is. This function simply asks processPaymentEvent (idempotent) what the
// authoritative state is and redirects the user accordingly:
//   - success  → /redirect-to-portal
//   - failed   → /dashboard?payment=failed
//   - still in flight → /payment-processing?order_id=...
//
// If the user closes the tab, this function never runs — but the webhook
// and the 15-min reconcile cron will independently confirm the payment.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { processPaymentEvent } from "../_shared/processPaymentEvent.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  const passedRedirect = url.searchParams.get("redirect_url");
  const frontend = passedRedirect
    ? decodeURIComponent(passedRedirect)
    : "https://www.unknowniitians.com";

  if (!orderId) {
    return redirect(`${frontend}/dashboard?payment=error`);
  }

  try {
    const result = await processPaymentEvent(orderId, "return_url");

    // Determine final destination from result.
    if (result.result === "processed" || result.result === "already_processed") {
      if (result.finalStatus === "success") {
        return redirect(`${frontend}/redirect-to-portal`);
      }
      return redirect(`${frontend}/dashboard?payment=failed`);
    }

    if (result.result === "still_pending") {
      return redirect(
        `${frontend}/payment-processing?order_id=${encodeURIComponent(orderId)}`,
      );
    }

    // skipped (e.g. free_*) — should not happen via this endpoint, but be safe.
    return redirect(`${frontend}/dashboard`);
  } catch (err: any) {
    console.error(`[verify-cashfree-payment] error for ${orderId}:`, err.message);
    // On Cashfree fetch failure, send user to the processing page —
    // the webhook/cron will eventually update DB and that page polls for state.
    return redirect(
      `${frontend}/payment-processing?order_id=${encodeURIComponent(orderId)}`,
    );
  }
});

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}
