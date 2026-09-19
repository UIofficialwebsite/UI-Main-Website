/**
 * POST /api/unlock   { catalog_id }
 *
 * Same-origin door to a single lecture or note. It forwards the visitor's
 * Supabase access token to the portal's resolve-content, which verifies that
 * token against THIS project's auth server and then checks whether the account
 * behind it has paid for the batch and subject the item belongs to.
 *
 * The token is the proof of identity, end to end — this route passes it along
 * rather than asserting anything about the caller, so nothing here has to be
 * trusted for the paywall to hold. That is also why no shared secret is
 * required: there is no deployment step to forget, and no long-lived
 * credential sitting in an env var that could leak.
 *
 * CATALOG_BRIDGE_SECRET is honoured if it happens to be set, purely as an
 * extra channel for a future trusted backend. It is not needed and not used
 * in the normal path.
 *
 * A denial comes back as a reason with no URL attached — that is what the UI
 * turns into a login prompt or a buy prompt.
 */

export const config = { runtime: "edge" };

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

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ allowed: false, reason: "method_not_allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as { catalog_id?: string };
    const catalogId = body?.catalog_id?.trim();
    if (!catalogId || !UUID_RE.test(catalogId)) {
      return json({ allowed: false, reason: "bad_request" }, 400);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };

    // Pass the visitor's session through untouched. Absent or expired means the
    // portal answers login_required, which is the correct outcome.
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) headers["Authorization"] = auth;

    const secret = process.env.CATALOG_BRIDGE_SECRET;
    if (secret) headers["x-bridge-secret"] = secret;

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
