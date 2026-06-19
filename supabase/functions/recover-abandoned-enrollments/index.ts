// recover-abandoned-enrollments
// Cron-only. Finds abandoned checkouts (pending enrollments 2–48h old) and sends
// each user a comeback nudge via Web Push + email with the COMEBACK10 coupon.
// Idempotent: the abandoned_cart_recovery log ensures one nudge per enrollment.
//
// Invoked by the `recover-abandoned-carts` pg_cron job with the service-role key.
// Gated by the CART_RECOVERY_ENABLED secret ("true" to run).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { Resend } from "npm:resend@3.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://unknowniitians.com";
const COUPON = "COMEBACK10";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Cart {
  enrollment_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  course_id: string;
  course_title: string;
  amount: number | null;
  created_at: string;
}

function emailHtml(name: string, course: string, url: string): string {
  const hi = name ? name.split(" ")[0] : "there";
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
    <h2 style="font-size:20px;margin:0 0 12px">You're one step away, ${hi} 🎓</h2>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 16px">
      You started enrolling in <b>${course}</b> but didn't finish. Your seat is
      still available — and here's <b>10% off</b> to help you get started.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 20px">
      Use code <b style="color:#1a56db">${COUPON}</b> at checkout.
    </p>
    <a href="${url}" style="background:#1a56db;color:#fff;padding:12px 24px;
      text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-size:14px">
      Complete my enrolment
    </a>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0">
      Unknown IITians · If you've already enrolled, ignore this email.
    </p>
  </div>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

  // Cron-only: require the service-role key as the bearer.
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${serviceKey}`) return json({ error: "Forbidden." }, 403);

  if ((Deno.env.get("CART_RECOVERY_ENABLED") ?? "").toLowerCase() !== "true") {
    return json({ disabled: true, scanned: 0, recovered: 0 });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:desk@unknowniitians.com";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  }
  const resend = resendKey ? new Resend(resendKey) : null;

  const { data: carts, error } = await admin.rpc("get_recoverable_carts", { p_limit: 50 });
  if (error) return json({ error: error.message }, 500);

  const list = (carts ?? []) as Cart[];
  let recovered = 0;
  let pushed = 0;
  let emailed = 0;

  for (const c of list) {
    // Claim this enrollment first (idempotency). If another run already claimed
    // it, the insert conflicts and we skip — no double nudge.
    const { data: claim, error: claimErr } = await admin
      .from("abandoned_cart_recovery")
      .insert({
        enrollment_id: c.enrollment_id,
        user_id: c.user_id,
        course_id: c.course_id,
        coupon_code: COUPON,
      })
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) continue; // conflict / already handled

    recovered++;
    const url = `${SITE}/courses/${c.course_id}?coupon=${COUPON}`;

    // --- Web Push (to every device this user has) ---
    let didPush = false;
    if (vapidPublic && vapidPrivate) {
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", c.user_id);
      const payload = JSON.stringify({
        title: "Complete your enrolment 🎓",
        body: `${c.course_title} is waiting — use ${COUPON} for 10% off.`,
        url,
        icon: "/favicon.ico",
      });
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          didPush = true;
        } catch (err) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }
    }
    if (didPush) pushed++;

    // --- Email ---
    let didEmail = false;
    if (resend) {
      try {
        const { error: mailErr } = await resend.emails.send({
          from: "Unknown IITians <desk@unknowniitians.com>",
          to: [c.email],
          subject: `Finish enrolling in ${c.course_title} — 10% off inside`,
          html: emailHtml(c.full_name ?? "", c.course_title, url),
        });
        didEmail = !mailErr;
      } catch (_e) {
        didEmail = false;
      }
    }
    if (didEmail) emailed++;

    await admin
      .from("abandoned_cart_recovery")
      .update({ push_sent: didPush, email_sent: didEmail })
      .eq("enrollment_id", c.enrollment_id);
  }

  return json({ scanned: list.length, recovered, pushed, emailed });
});
