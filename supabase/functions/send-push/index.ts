// send-push
// Admin-only. Broadcasts a Web Push notification to stored subscriptions.
//
// Body: { title: string, body: string, url?: string, target?: "all" | "authenticated" }
// Auth: caller's JWT must belong to an admin (admin_users table or the
//       hardcoded super admin). Runs as service role to read subscriptions and
//       prune dead endpoints.
//
// Required edge-function secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@x.com)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HARDCODED_ADMIN = "uiwebsite638@gmail.com";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@unknowniitians.com";

    if (!vapidPublic || !vapidPrivate) {
      return json({ error: "VAPID keys are not configured on the server." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ---- Verify caller is an admin ----
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated." }, 401);

    const { data: userData } = await admin.auth.getUser(token);
    const email = userData.user?.email?.toLowerCase() ?? null;
    if (!email) return json({ error: "Not authenticated." }, 401);

    let isAdmin = email === HARDCODED_ADMIN;
    if (!isAdmin) {
      const { data: adminRow } = await admin
        .from("admin_users")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      isAdmin = !!adminRow;
    }
    if (!isAdmin) return json({ error: "Admin access required." }, 403);

    // ---- Global kill switch ----
    // Sending is OFF until the PUSH_ENABLED secret is explicitly set to "true".
    // This guarantees no notification can go out before it's activated, even if
    // the function and subscriptions are already live.
    const enabled = (Deno.env.get("PUSH_ENABLED") ?? "").toLowerCase() === "true";
    if (!enabled) {
      return json({ disabled: true, sent: 0, failed: 0, removed: 0, total: 0 });
    }

    // ---- Parse + validate payload ----
    const { title, body, url, target } = await req.json();
    if (!title || typeof title !== "string") {
      return json({ error: "A notification title is required." }, 400);
    }

    const payload = JSON.stringify({
      title: String(title).slice(0, 120),
      body: typeof body === "string" ? body.slice(0, 400) : "",
      url: typeof url === "string" && url ? url : "/",
      icon: "/favicon.ico",
    });

    // ---- Load target subscriptions ----
    let query = admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");
    if (target === "authenticated") query = query.not("user_id", "is", null);

    const { data: subs, error: subsError } = await query;
    if (subsError) return json({ error: subsError.message }, 500);
    if (!subs || subs.length === 0) {
      return json({ sent: 0, failed: 0, removed: 0, total: 0 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    let sent = 0;
    let failed = 0;
    const deadIds: string[] = [];

    // Send concurrently in capped batches so a large audience doesn't stall.
    const BATCH = 100;
    for (let i = 0; i < subs.length; i += BATCH) {
      const slice = subs.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload
            );
            sent++;
          } catch (err) {
            failed++;
            // 404/410 => subscription is gone; prune it.
            const code = (err as { statusCode?: number })?.statusCode;
            if (code === 404 || code === 410) deadIds.push(s.id);
          }
        })
      );
    }

    if (deadIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", deadIds);
    }

    return json({ sent, failed, removed: deadIds.length, total: subs.length });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});
