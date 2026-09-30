// The daily IndexNow ping (run by Vercel Cron, vercel.json): the pages whose content changed in
// the last two days go to the IndexNow engines — Bing, and through it Copilot and DuckDuckGo,
// plus Yandex, Seznam and Naver — so a new course or new notes are crawled in hours, not weeks.
// Two days, not one, so a missed run costs nothing. Google does not take part; it reads the
// sitemap. The key is the file public/<key>.txt, which proves the site is ours (public by design).
// With CRON_SECRET set, only Vercel's cron may call it.

export const config = { runtime: "edge" };

const SITE = "https://www.unknowniitians.com";
const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";
const KEY = "1c1b6361de5e0095b2942bf14f9cb13d";
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

// Must match src/utils/urlHelpers.ts slugify.
function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function rows(query: string): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, { headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` } });
    return res.ok ? ((await res.json()) as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && !sameText(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Not allowed." }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const [courses, jobs, news, notes] = await Promise.all([
    rows(`courses?select=id&is_live=eq.true&updated_at=gte.${since}`),
    rows(`jobs?select=id&is_active=eq.true&updated_at=gte.${since}`),
    rows(`news_updates?select=id&updated_at=gte.${since}`),
    rows(`iitm_branch_notes?select=branch,level,subject&is_active=eq.true&updated_at=gte.${since}`),
  ]);

  const urls = new Set<string>();
  if (courses.length) urls.add(`${SITE}/courses`);
  for (const c of courses) urls.add(`${SITE}/courses/${c.id}`);
  for (const j of jobs) urls.add(`${SITE}/career/job/${j.id}`);
  for (const n of news) urls.add(`${SITE}/news/${n.id}`);
  for (const n of notes) {
    if (!n.branch || !n.level || !n.subject) continue;
    const at = `${slugify(String(n.branch))}/${slugify(String(n.level))}/${slugify(String(n.subject))}`;
    urls.add(`${SITE}/exam-preparation/iitm-bs/notes/${at}`);
    urls.add(`${SITE}/iitm-bs/${at}`);
  }
  if (urls.size === 0) return Response.json({ ok: true, submitted: 0 }, { headers: { "cache-control": "no-store" } });

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: [...urls].slice(0, 10000) }),
  });
  // 200 and 202 both mean accepted.
  return Response.json(
    { ok: response.status === 200 || response.status === 202, submitted: urls.size, status: response.status },
    { headers: { "cache-control": "no-store" } }
  );
}
