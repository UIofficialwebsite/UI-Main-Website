// Dynamic sitemap.xml — served at /sitemap.xml via a rewrite in vercel.json.
//
// Unlike a hand-written static file, this always reflects the CURRENT catalogue:
// every LIVE course, ACTIVE job and published news item is pulled from Supabase
// at request time (edge-cached), alongside the fixed section pages. Only
// live/active content is listed, so Google keeps expired courses out — the
// "only live courses show" behaviour.

export const config = { runtime: "edge" };

const SITE = "https://www.unknowniitians.com";
const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";

// Fixed, always-present pages (path, changefreq, priority).
const STATIC: Array<[string, string, string]> = [
  ["/", "daily", "1.0"],
  ["/courses", "daily", "0.9"],
  ["/courses/category/jee", "weekly", "0.9"],
  ["/courses/category/neet", "weekly", "0.9"],
  ["/courses/category/iitm-bs", "weekly", "0.9"],
  ["/exam-preparation/jee/notes", "weekly", "0.8"],
  ["/exam-preparation/jee/pyqs", "weekly", "0.8"],
  ["/exam-preparation/neet/notes", "weekly", "0.8"],
  ["/exam-preparation/neet/pyqs", "weekly", "0.8"],
  ["/exam-preparation/iitm-bs/notes", "weekly", "0.8"],
  ["/exam-preparation/iitm-bs/pyqs", "weekly", "0.8"],
  ["/exam-preparation/iitm-bs/syllabus", "monthly", "0.7"],
  ["/exam-preparation/iitm-bs/tools", "monthly", "0.7"],
  ["/exam-preparation/iitm-bs/courses", "weekly", "0.7"],
  ["/exam-preparation/iitm-bs/news", "daily", "0.7"],
  ["/exam-preparation/iitm-bs/dates", "weekly", "0.7"],
  ["/exam-preparation/iitm-bs/communities", "weekly", "0.6"],
  ["/iitm-tools/cgpa-calculator", "monthly", "0.7"],
  ["/iitm-tools/grade-calculator", "monthly", "0.7"],
  ["/iitm-tools/marks-predictor", "monthly", "0.7"],
  ["/career", "weekly", "0.6"],
  ["/career/openings", "weekly", "0.6"],
  ["/about", "monthly", "0.8"],
  ["/contact", "monthly", "0.5"],
  ["/faq", "monthly", "0.5"],
  ["/privacy-policy", "yearly", "0.3"],
  ["/terms-of-service", "yearly", "0.3"],
];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Must match src/utils/urlHelpers.ts slugify (URL branch/level/subject slugs).
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function urlTag(path: string, changefreq: string, priority: string, lastmod?: string): string {
  const lm = lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : "";
  return `  <url>\n    <loc>${SITE}${esc(path)}</loc>${lm}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function fetchRows(query: string): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

async function fetchRpc(name: string): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? (j as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

export default async function handler(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);

  // Pull live/active dynamic content in parallel. Any failing query just yields
  // an empty list — the sitemap still renders with everything else.
  const [courses, jobs, news, subjects] = await Promise.all([
    fetchRows("courses?select=id,updated_at&is_live=eq.true"),
    fetchRows("jobs?select=id,updated_at&is_active=eq.true"),
    fetchRows("news_updates?select=id,updated_at"),
    fetchRpc("get_indexable_iitm_subjects"),
  ]);

  const parts: string[] = [];
  for (const [path, cf, pr] of STATIC) parts.push(urlTag(path, cf, pr, today));

  for (const c of courses) {
    if (!c.id) continue;
    parts.push(urlTag(`/courses/${c.id}`, "weekly", "0.9", (c.updated_at as string) || today));
  }
  for (const j of jobs) {
    if (!j.id) continue;
    parts.push(urlTag(`/career/job/${j.id}`, "weekly", "0.6", (j.updated_at as string) || today));
  }
  for (const n of news) {
    if (!n.id) continue;
    parts.push(urlTag(`/news/${n.id}`, "monthly", "0.5", (n.updated_at as string) || today));
  }
  // Per-branch calculator pages: one indexable URL per (tool × branch) so each
  // branch ranks separately, e.g. /iitm-tools/grade-calculator/aeronautics-space-technology.
  const TOOL_SLUGS = ["grade-calculator", "cgpa-calculator", "marks-predictor"];
  const BRANCH_SLUGS = [
    "data-science",
    "management-data-science",
    "aeronautics-space-technology",
    "electronic-systems",
  ];
  for (const t of TOOL_SLUGS) {
    for (const b of BRANCH_SLUGS) {
      parts.push(urlTag(`/iitm-tools/${t}/${b}`, "monthly", "0.6", today));
    }
  }

  // Programmatic IITM BS notes-subject pages (one per subject that has notes).
  for (const s of subjects) {
    const branch = s.branch as string;
    const level = s.level as string;
    const subject = s.subject_name as string;
    if (!branch || !level || !subject) continue;
    const path = `/exam-preparation/iitm-bs/notes/${slugify(branch)}/${slugify(level)}/${slugify(subject)}`;
    parts.push(urlTag(path, "monthly", "0.7", today));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Refresh hourly at the edge; new courses appear without a redeploy.
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
