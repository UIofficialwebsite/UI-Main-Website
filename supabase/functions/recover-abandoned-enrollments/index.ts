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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Professional, minimal dual-tone (royal blue + slate) transactional email.
// Table-based with inline styles for broad email-client support; slightly
// rounded surfaces; no decorative imagery or emoji.
function emailHtml(name: string, course: string, url: string): string {
  const hi = name ? esc(name.split(" ")[0]) : "there";
  const c = esc(course);
  const serif = "Georgia,'Times New Roman',Times,serif";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
        <tr><td style="padding:40px 40px 0 40px;font-family:${serif};">
          <h1 style="margin:0 0 18px;font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:-0.2px;">Complete your enrolment</h1>
          <div style="border-top:1px solid #ececec;"></div>
          <p style="margin:20px 0 0;font-size:15px;line-height:1.75;color:#3f3f46;">
            Hi ${hi},
          </p>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.75;color:#3f3f46;">
            You recently began enrolling in <strong style="color:#1a1a1a;">${c}</strong> but did not complete checkout. Your place is still available, and you can finish your enrolment whenever you are ready.
          </p>
        </td></tr>

        <tr><td style="padding:26px 40px 0 40px;font-family:${serif};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;">
            <tr><td style="padding:18px 22px;">
              <p style="margin:0 0 6px;font-size:13px;color:#71717a;">Apply this code at checkout for 10% off</p>
              <p style="margin:0;font-size:19px;font-weight:700;letter-spacing:3px;color:#1e3a8a;">${COUPON}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 40px 4px 40px;font-family:${serif};">
          <a href="${url}" style="display:inline-block;background:#1e3a8a;color:#ffffff;font-family:${serif};font-size:15px;font-weight:600;text-decoration:none;padding:13px 30px;border-radius:6px;">Complete enrolment</a>
        </td></tr>

        <tr><td style="padding:28px 40px 0 40px;">
          <div style="border-top:1px solid #ececec;"></div>
        </td></tr>

        <tr><td style="padding:18px 40px 36px 40px;font-family:${serif};">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#9ca3af;">
            If you have already completed your enrolment, please disregard this message.<br>
            Unknown IITians &middot; unknowniitians.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
        title: "Complete your enrolment",
        body: `Your enrolment for ${c.course_title} is incomplete. Use ${COUPON} for 10% off.`,
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
          subject: `Complete your enrolment for ${c.course_title}`,
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
