/**
 * POST /api/unlock   { catalog_id }
 *
 * The one door between a visitor and a real lecture or note.
 *
 * Why this route exists at all: the content lives in the portal's Supabase
 * project, but a visitor browsing courses is either signed out or signed in
 * HERE, on the website project. They have no identity in the portal, so the
 * portal's row-level security cannot judge them. This route is the thing that
 * vouches for who they are:
 *
 *   1. Take the Supabase access token off the Authorization header.
 *   2. Hand it to this project's own /auth/v1/user, which verifies the
 *      signature and expiry and hands back the real account. A forged or
 *      expired token dies here.
 *   3. Take the email from THAT response — never from the request body.
 *   4. Ask the portal's resolve-content whether this email has paid for the
 *      batch and subject the item belongs to.
 *
 * The browser never learns anything it has not paid for: a denial returns a
 * reason and a price prompt, not a URL. The bridge secret lives only on the
 * server, so a browser cannot skip this route and call the portal itself.
 */

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";

const ERP_FUNCTIONS_URL =
  process.env.ERP_FUNCTIONS_URL ?? "https://lcfzfdjeidinenxcucvj.supabase.co/functions/v1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Never cacheable. A per-person, per-item answer must not sit on a CDN. */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}

/** Returns the verified email, or null. The token is checked by Supabase, not by us. */
async function verifiedEmail(req: Request): Promise<string | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const user = (await res.json()) as { email?: string | null };
  return user?.email?.trim() || null;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ allowed: false, reason: "method_not_allowed" }, 405);

  const secret = process.env.CATALOG_BRIDGE_SECRET;
  if (!secret) {
    console.error("CATALOG_BRIDGE_SECRET is not set on this deployment");
    return json({ allowed: false, reason: "unavailable" }, 500);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { catalog_id?: string };
    const catalogId = body?.catalog_id?.trim();
    if (!catalogId || !UUID_RE.test(catalogId)) {
      return json({ allowed: false, reason: "bad_request" }, 400);
    }

    const email = await verifiedEmail(req);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-bridge-secret": secret,
    };
    // Only ever set from a token Supabase just validated. A signed-out caller
    // sends no email and the portal answers login_required.
    if (email) headers["x-viewer-email"] = email;

    const res = await fetch(`${ERP_FUNCTIONS_URL}/resolve-content`, {
      method: "POST",
      headers,
      body: JSON.stringify({ catalog_id: catalogId }),
    });

    const payload = await res.json().catch(() => ({ allowed: false, reason: "unavailable" }));

    // Pass the portal's verdict straight through, status and all, so the UI can
    // tell "log in" apart from "buy this batch".
    return json(payload, res.status);
  } catch (err) {
    console.error("unlock route error", err);
    return json({ allowed: false, reason: "unavailable" }, 500);
  }
}
