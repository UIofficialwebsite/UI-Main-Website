// ============================================================
// reconcile-payments — safety-net cron
// ============================================================
// Runs every 15 minutes via pg_cron. Scans enrollments stuck in 'pending'
// for >5 min and <7 days, asks Cashfree what really happened, and routes
// each through the same idempotent processor.
//
// Bounds (safety):
//   - Only Cashfree orders (skips 'free_*')
//   - Only orders 5+ min old (avoid racing with in-progress checkouts)
//   - Only orders < 7 days old (Cashfree data window)
//   - Hard cap 50 orders per run (avoid runaway)
//   - Each order processed in its own try/catch so one failure doesn't kill the batch

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { processPaymentEvent } from "../_shared/processPaymentEvent.ts";

const SCAN_BATCH_LIMIT = 200;
const PROCESS_LIMIT = 50;
const MIN_AGE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const now = Date.now();
  const minCreated = new Date(now - MAX_AGE_MS).toISOString();
  const maxCreated = new Date(now - MIN_AGE_MS).toISOString();

  const { data: pending, error: scanErr } = await supabase
    .from("enrollments")
    .select("order_id")
    .eq("status", "pending")
    .lt("created_at", maxCreated)
    .gt("created_at", minCreated)
    .not("order_id", "is", null)
    .limit(SCAN_BATCH_LIMIT);

  if (scanErr) {
    console.error("[reconcile] scan error:", scanErr.message);
    return new Response(JSON.stringify({ error: scanErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uniqueOrderIds = [
    ...new Set((pending ?? []).map((r) => r.order_id).filter(Boolean)),
  ]
    .filter((id): id is string => typeof id === "string" && !id.startsWith("free_"))
    .slice(0, PROCESS_LIMIT);

  const results: Array<{ orderId: string; status: string; error?: string }> = [];

  for (const orderId of uniqueOrderIds) {
    try {
      const r = await processPaymentEvent(orderId, "cron");
      results.push({ orderId, status: r.result });
    } catch (err: any) {
      results.push({ orderId, status: "error", error: err.message });
      console.error(`[reconcile] order ${orderId} failed:`, err.message);
    }
  }

  const summary = {
    scanned: uniqueOrderIds.length,
    processed: results.filter((r) => r.status === "processed").length,
    already_processed: results.filter((r) => r.status === "already_processed").length,
    still_pending: results.filter((r) => r.status === "still_pending").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    timestamp: new Date().toISOString(),
  };

  console.log("[reconcile]", JSON.stringify(summary));

  return new Response(JSON.stringify({ summary, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
