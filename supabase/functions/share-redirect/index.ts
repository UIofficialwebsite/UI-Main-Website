// share-redirect
// Public. Resolves a /s/<token> share link: logs the click, serves an Open Graph
// preview to social crawlers, and 302-redirects humans to the content.
// Deployed with --no-verify-jwt. Reached via a Vercel rewrite:
//   /s/:token  ->  /functions/v1/share-redirect?token=:token

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://unknowniitians.com";

// OG image = a live screenshot of the actual page. WordPress mShots is free, has
// no watermark and no API key, and is purpose-built for link-preview screenshots
// (it generates on first request, then caches). For guaranteed first-hit quality
// at scale, swap for a keyed API (ApiFlash/ScreenshotOne) via a secret.
function pagePreview(pageUrl: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(pageUrl)}?w=1200&h=630`;
}

// Social/preview crawlers that need OG HTML instead of a redirect.
const BOT_RE =
  /facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|pinterest|redditbot|embedly|quora link preview|bitlybot|skypeuripreview|googlebot|bingbot|applebot|vkshare|tumblr|preview|opengraph/i;

function esc(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ogHtml(title: string, url: string): string {
  const t = esc(title || "Unknown IITians");
  const desc = "Free IITM BS notes, PYQs, tools & live batches — Unknown IITians.";
  const img = esc(pagePreview(url)); // screenshot preview of the page itself
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<title>${t}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Unknown IITians">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<meta http-equiv="refresh" content="0; url=${esc(url)}">
</head><body>Redirecting to <a href="${esc(url)}">${t}</a>…</body></html>`;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Crawler-preview mode: a social bot fetched a real content URL (?si=… link)
  // and Vercel routed it here with ?path=. Serve OG tags (title + page
  // screenshot). The OG HTML's meta-refresh bounces any human misfire to the
  // page, so this never breaks a real visitor.
  const ogPath = url.searchParams.get("path");
  if (ogPath) {
    const safe = ogPath.startsWith("/") ? ogPath : `/${ogPath}`;
    const targetUrl = `${SITE}${safe}`;
    try { fetch(pagePreview(targetUrl)).catch(() => {}); } catch (_e) { /* ignore */ }
    return new Response(ogHtml("Unknown IITians", targetUrl), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  const token = (url.searchParams.get("token") || url.pathname.split("/").filter(Boolean).pop() || "").trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirect = (to: string, extraHeaders: Record<string, string> = {}) =>
    new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store", ...extraHeaders } });

  if (!token) return redirect(SITE);

  // Resolve the token.
  const { data: share } = await admin
    .from("shares")
    .select("id, token, title, target_url")
    .eq("token", token)
    .maybeSingle();

  if (!share) return redirect(SITE); // unknown/expired link

  // Open-redirect guard: only ever go to a same-site relative path.
  const path = typeof share.target_url === "string" && share.target_url.startsWith("/")
    ? share.target_url
    : "/";
  const targetUrl = `${SITE}${path}`;

  const ua = req.headers.get("user-agent") ?? "";
  const isBot = BOT_RE.test(ua);

  // Log the click (best-effort; never block the redirect on it).
  try {
    const ipRaw = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const ip_hash = ipRaw ? await sha256(ipRaw) : null;
    await admin.from("share_clicks").insert({
      share_id: share.id,
      token: share.token,
      referrer: req.headers.get("referer"),
      user_agent: ua.slice(0, 400),
      ip_hash,
      is_bot: isBot,
    });
  } catch (_e) { /* ignore logging errors */ }

  if (isBot) {
    // Kick off the screenshot generation so it's cached by the time the crawler
    // fetches og:image (fire-and-forget).
    try { fetch(pagePreview(targetUrl)).catch(() => {}); } catch (_e) { /* ignore */ }
    return new Response(ogHtml(share.title ?? "", targetUrl), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  // Human: set a first-touch attribution cookie (Phase 3) and redirect.
  const cookie = `ui_ref=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax`;
  return redirect(`${targetUrl}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(token)}`, {
    "Set-Cookie": cookie,
  });
});
