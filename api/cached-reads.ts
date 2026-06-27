// Edge-cached public reads — the SPA's "ISR" equivalent.
//
// The frontend hits this instead of querying Supabase directly for its PUBLIC,
// read-only, slowly-changing datasets (the course / notes / pyq / jobs / news /
// community / IITM lists). Vercel's CDN caches the JSON per-URL (s-maxage), so
// Supabase is read ~once per revalidation window GLOBALLY rather than once per
// visitor — that's the egress saving. Clients are served from Vercel's edge
// (included bandwidth), not Supabase egress.
//
// Data is identical to what the client would get: we call the same PostgREST
// endpoint with the public anon key, so RLS applies exactly as before. The anon
// key is already shipped in the client bundle — it is NOT a secret.
//
// If this route is ever unavailable, the client falls back to a direct Supabase
// query (see src/utils/edgeCache.ts), so there is no hard dependency on it.

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";

// Allowlist: resource -> { query, exam, page }.
//   query — the fixed PostgREST query string (table + filters).
//   exam  — whether an optional &exam_type=eq.<exam> filter may be appended.
//   page  — whether a &page_path=eq.<page> filter may be appended (banners).
// Nothing outside this map is reachable.
const RESOURCES: Record<string, { query: string; exam?: boolean; page?: boolean }> = {
  courses: { query: "courses?select=*&is_live=eq.true" },
  notes: { query: "notes?select=*&is_active=eq.true", exam: true },
  pyqs: { query: "pyqs?select=*&is_active=eq.true", exam: true },
  important_dates: { query: "important_dates?select=*", exam: true },
  news_updates: { query: "news_updates?select=*", exam: true },
  communities: { query: "communities?select=*", exam: true },
  jobs: { query: "jobs?select=*&is_active=eq.true" },
  iitm_branch_notes: { query: "iitm_branch_notes?select=*&is_active=eq.true" },
  iitm_branch_pyqs: {
    query: "pyqs?select=*&is_active=eq.true&or=(exam_type.eq.IITM_BS,exam_type.eq.IITM%20BS)",
  },
  page_banners: { query: "page_banners?select=image_url&order=created_at.desc", page: true },
};

const EXAM_RE = /^[a-z0-9_ -]{1,32}$/i; // guard the optional exam_type filter
const PAGE_RE = /^[a-z0-9/_-]{1,64}$/i; // guard the optional page_path filter

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("r") ?? "";
  const exam = searchParams.get("exam");
  const page = searchParams.get("page");

  const def = RESOURCES[resource];
  if (!def) return json({ error: "unknown resource" }, 400, "no-store");

  let query = def.query;
  if (exam) {
    if (!def.exam || !EXAM_RE.test(exam)) return json({ error: "bad exam" }, 400, "no-store");
    query += `&exam_type=eq.${encodeURIComponent(exam)}`;
  }
  if (page) {
    if (!def.page || !PAGE_RE.test(page)) return json({ error: "bad page" }, 400, "no-store");
    query += `&page_path=eq.${encodeURIComponent(page)}`;
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
    });
    if (!upstream.ok) {
      return json({ error: "upstream", status: upstream.status }, 502, "no-store");
    }
    const body = await upstream.text();
    // Cache at the edge for 5 min; serve stale (and revalidate in the background)
    // for up to an hour after that. Admin edits propagate within ~5 min.
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return json({ error: "fetch failed" }, 502, "no-store");
  }
}

function json(obj: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}
