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

// Allowlist: resource -> { query, exam, page, ttl }.
//   query — the fixed PostgREST query string (table + filters).
//   exam  — whether an optional &exam_type=eq.<exam> filter may be appended.
//   page  — whether a &page_path=eq.<page> filter may be appended (banners).
//   ttl   — edge revalidation window in seconds (default 600). Big, rarely-
//           changing content (notes/pyqs) gets a long window so Supabase is
//           read only ~48x/day instead of ~288x; time-sensitive lists
//           (courses/jobs/news) stay shorter. A deploy purges the cache, so
//           admin edits still show promptly after a redeploy either way.
// Nothing outside this map is reachable.
const RESOURCES: Record<string, { query: string; exam?: boolean; page?: boolean; ttl?: number; order?: string }> = {
  courses: { query: "courses?select=*&is_live=eq.true", ttl: 600 },
  notes: { query: "notes?select=*&is_active=eq.true", exam: true, ttl: 1800 },
  pyqs: { query: "pyqs?select=*&is_active=eq.true", exam: true, ttl: 1800 },
  important_dates: { query: "important_dates?select=*", exam: true, ttl: 1800 },
  news_updates: { query: "news_updates?select=*", exam: true, ttl: 600 },
  communities: { query: "communities?select=*", exam: true, ttl: 1800 },
  jobs: { query: "jobs?select=*&is_active=eq.true", ttl: 600 },
  iitm_branch_notes: { query: "iitm_branch_notes?select=*&is_active=eq.true", ttl: 1800 },
  iitm_branch_pyqs: {
    query: "pyqs?select=*&is_active=eq.true&or=(exam_type.eq.IITM_BS,exam_type.eq.IITM%20BS)",
    ttl: 1800,
  },
  page_banners: { query: "page_banners?select=image_url", page: true, ttl: 600, order: "created_at.desc,id.asc" },
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

  // Stable ordering is REQUIRED for limit/offset paging. Postgres makes no
  // promise that two separate queries return rows in the same order, and
  // increment_download_count rewrites a note row on every download, moving it in
  // scan order. A row shifting between page fetches would be duplicated or
  // skipped - and then cached. Every table here has a primary-key `id`, so sort
  // by it (as a tie-breaker where a display order matters).
  const order = def.order ?? "id.asc";
  const ttl = def.ttl ?? 600;
  // Cache at the edge for this resource's window; serve stale (and revalidate in
  // the background) for up to a day after that so a Supabase blip never breaks
  // reads. Admin edits propagate within the window (or instantly on the next
  // deploy, which purges the cache).
  const cacheHeader = `public, s-maxage=${ttl}, stale-while-revalidate=86400`;

  // PostgREST caps a single response at 1000 rows, so a table larger than that
  // (iitm_branch_notes has ~1.4k) would silently lose everything past the cap,
  // making those notes invisible on the site. Page through and concatenate so
  // the cached payload is always the complete set.
  const PAGE_SIZE = 1000;
  const MAX_ROWS = 20000; // safety ceiling

  const fetchPage = async (offset: number): Promise<Response> => {
    const url = `${SUPABASE_URL}/rest/v1/${query}&order=${order}&limit=${PAGE_SIZE}&offset=${offset}`;
    const headers = { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` };
    const res = await fetch(url, { headers });
    // One retry: a single transient page failure would otherwise fail the whole
    // response and push every client onto the direct-Supabase fallback.
    return res.ok ? res : fetch(url, { headers });
  };

  try {
    const rows: unknown[] = [];
    let offset = 0;
    for (;;) {
      const upstream = await fetchPage(offset);
      if (!upstream.ok) {
        return json({ error: "upstream", status: upstream.status }, 502, "no-store");
      }
      const chunk = await upstream.json();
      if (!Array.isArray(chunk)) {
        // Only a valid whole-response shape on the first page; midway it means
        // the result set is inconsistent, so never cache a partial list.
        if (offset === 0) return json(chunk, 200, cacheHeader);
        return json({ error: "non-array page", offset }, 502, "no-store");
      }
      rows.push(...chunk);
      if (chunk.length === 0) break; // reached the end
      // Advance by what the server actually returned, not by what we asked for:
      // if it ever caps pages below PAGE_SIZE, a short page is not the last one.
      offset += chunk.length;
      if (offset >= MAX_ROWS) {
        // Refuse rather than cache a silently truncated list - exactly the
        // failure this route exists to prevent.
        return json({ error: "row ceiling exceeded", max: MAX_ROWS }, 502, "no-store");
      }
    }
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": cacheHeader,
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
