// Prerendered SEO HTML for SEARCH bots (Googlebot, bingbot, …).
//
// A React SPA serves an empty shell in its initial HTML — bad for ranking. This
// edge function is reached only for search-bot user-agents (see the rewrite in
// vercel.json); real users always get the normal SPA. For the requested path it
// returns a full HTML document with a real <title>, meta description, canonical,
// visible content and — for course pages — schema.org Course structured data
// (which powers Google's "Courses" rich results). Non-live courses are marked
// noindex, so only live batches stay in Google. Everything is edge-cached, so
// repeat crawls don't re-hit Supabase.

export const config = { runtime: "edge" };

const SITE = "https://www.unknowniitians.com";
const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";
const DEFAULT_OG = `${SITE}/web-uploads/UI_logo.png`;
const BRAND = "Unknown IITians";

// ---- helpers ---------------------------------------------------------------

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Strip markdown/emoji noise into a clean meta description.
function clean(s: string, max = 160): string {
  const t = String(s || "")
    .replace(/[*_#>`~⭐►▶●•]/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
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

// Must match src/utils/urlHelpers.ts slugify.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Reverse the URL branch/level slug back to its DB form (mirrors
// useIITMBranchNotes: "data-science" -> "Data Science", "foundation" -> "Foundation").
function branchToDb(urlBranch: string): string {
  return urlBranch
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function levelToDb(urlLevel: string): string {
  return urlLevel.charAt(0).toUpperCase() + urlLevel.slice(1);
}

interface Doc {
  title: string;
  description: string;
  path: string;
  index?: boolean; // default true
  ogImage?: string;
  bodyHtml?: string;
  jsonLd?: unknown;
}

function render(d: Doc): string {
  const canonical = `${SITE}${d.path}`;
  const robots = d.index === false ? "noindex, follow" : "index, follow";
  const og = d.ogImage || DEFAULT_OG;
  const ld = d.jsonLd
    ? `\n  <script type="application/ld+json">${JSON.stringify(d.jsonLd)}</script>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(d.title)}</title>
  <meta name="description" content="${esc(d.description)}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(d.title)}" />
  <meta property="og:description" content="${esc(d.description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${esc(og)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(d.title)}" />
  <meta name="twitter:description" content="${esc(d.description)}" />
  <meta name="twitter:image" content="${esc(og)}" />${ld}
</head>
<body>${d.bodyHtml || `<h1>${esc(d.title)}</h1><p>${esc(d.description)}</p>`}
  <p><a href="${esc(canonical)}">Open ${esc(BRAND)}</a></p>
</body>
</html>`;
}

// Keyword-optimised metadata for the fixed section pages (IITM BS is the niche
// with the least competition — lead with it).
const PAGES: Record<string, { title: string; description: string }> = {
  "/": {
    title: `${BRAND} — IITM BS, JEE & NEET Live Courses + Free Notes & PYQs`,
    description:
      "Unknown IITians offers IITM BS Qualifier & Foundation live courses, plus free notes, previous year questions (PYQs), and tools for IITM BS, JEE and NEET aspirants.",
  },
  "/courses": {
    title: `All Live Courses — IITM BS, JEE & NEET | ${BRAND}`,
    description:
      "Browse live batches for IITM BS Qualifier, Foundation & Diploma, plus JEE and NEET courses with daily live lectures, tests and doubt-solving.",
  },
  "/courses/category/iitm-bs": {
    title: `IITM BS Live Courses — Qualifier, Foundation & Diploma | ${BRAND}`,
    description:
      "IITM BS Data Science & Electronic Systems live courses: Qualifier and Foundation batches with live lectures, practice papers and mentor guidance.",
  },
  "/courses/category/jee": {
    title: `JEE Live Courses & Batches | ${BRAND}`,
    description: "JEE preparation live courses with lectures, tests and PYQ practice.",
  },
  "/courses/category/neet": {
    title: `NEET Live Courses & Batches | ${BRAND}`,
    description: "NEET preparation live courses with lectures, tests and PYQ practice.",
  },
  "/exam-preparation/iitm-bs/notes": {
    title: `IITM BS Notes — Free Subject-wise PDFs | ${BRAND}`,
    description:
      "Free IITM BS notes for Data Science and Electronic Systems, organised by branch, level and subject — download subject-wise PDF notes.",
  },
  "/exam-preparation/iitm-bs/pyqs": {
    title: `IITM BS Previous Year Questions (PYQs) — Free PDFs | ${BRAND}`,
    description:
      "Free IITM BS previous year question papers (PYQs) with solutions, organised by subject and term — download and practice.",
  },
  "/exam-preparation/iitm-bs/syllabus": {
    title: `IITM BS Syllabus — Data Science & Electronic Systems | ${BRAND}`,
    description: "Complete IITM BS degree syllabus for Data Science and Electronic Systems, level by level.",
  },
  "/exam-preparation/iitm-bs/dates": {
    title: `IITM BS Important Dates — Exams, Quizzes & OPPE | ${BRAND}`,
    description: "Key IITM BS dates: term start, quizzes, OPPE, and end-term exam schedule.",
  },
  "/exam-preparation/iitm-bs/tools": {
    title: `IITM BS Tools — CGPA, Grade & Marks Predictor | ${BRAND}`,
    description: "Free IITM BS calculators: CGPA calculator, grade calculator and marks predictor.",
  },
  "/exam-preparation/jee/notes": {
    title: `JEE Notes — Free Physics, Chemistry & Maths PDFs | ${BRAND}`,
    description: "Free JEE notes for Physics, Chemistry and Mathematics — download subject-wise PDF notes.",
  },
  "/exam-preparation/jee/pyqs": {
    title: `JEE Previous Year Questions (PYQs) — Free PDFs | ${BRAND}`,
    description: "Free JEE previous year question papers with solutions — download and practice.",
  },
  "/exam-preparation/neet/notes": {
    title: `NEET Notes — Free Physics, Chemistry & Biology PDFs | ${BRAND}`,
    description: "Free NEET notes for Physics, Chemistry and Biology — download subject-wise PDF notes.",
  },
  "/exam-preparation/neet/pyqs": {
    title: `NEET Previous Year Questions (PYQs) — Free PDFs | ${BRAND}`,
    description: "Free NEET previous year question papers with solutions — download and practice.",
  },
  "/iitm-tools/cgpa-calculator": {
    title: `IITM BS CGPA Calculator (Free) | ${BRAND}`,
    description: "Free IITM BS CGPA calculator — compute your CGPA across levels and subjects instantly.",
  },
  "/iitm-tools/grade-calculator": {
    title: `IITM BS Grade Calculator (Free) | ${BRAND}`,
    description: "Free IITM BS grade calculator — estimate your subject grade from quiz, assignment and end-term scores.",
  },
  "/iitm-tools/marks-predictor": {
    title: `IITM BS Marks Predictor (Free) | ${BRAND}`,
    description: "Free IITM BS marks predictor — predict the score you need to hit your target grade.",
  },
  "/career": {
    title: `Careers at ${BRAND} — Jobs & Internships`,
    description: "Explore current job openings and internships at Unknown IITians.",
  },
  "/career/openings": {
    title: `Current Openings — Jobs & Internships | ${BRAND}`,
    description: "Latest job and internship openings at Unknown IITians. Apply now.",
  },
  "/about": {
    title: `About ${BRAND} — IITM BS, JEE & NEET Learning Platform`,
    description: "Learn about Unknown IITians, the platform helping IITM BS, JEE and NEET students with courses, notes and tools.",
  },
  "/faq": {
    title: `FAQ | ${BRAND}`,
    description: "Frequently asked questions about Unknown IITians courses, notes, payments and support.",
  },
  "/contact": {
    title: `Contact ${BRAND}`,
    description: "Get in touch with the Unknown IITians team for support and enquiries.",
  },
};

const CATEGORY_MAP: Record<string, string> = {
  "iitm-bs": "IITM BS",
  jee: "JEE",
  neet: "NEET",
};

// ---- route handlers --------------------------------------------------------

async function courseDoc(id: string): Promise<string> {
  const rows = await fetchRows(
    `courses?select=title,description,price,discounted_price,image_url,start_date,is_live,exam_category,subject,language,duration&id=eq.${id}&limit=1`
  );
  const c = rows[0];
  const path = `/courses/${id}`;
  if (!c) {
    return render({
      title: `Course | ${BRAND}`,
      description: "This course is no longer available.",
      path,
      index: false,
    });
  }
  const title = `${c.title} | ${BRAND}`;
  const desc = clean(String(c.description || `${c.title} — live course by ${BRAND}.`));
  const price = (c.discounted_price as number) ?? (c.price as number) ?? undefined;
  const isLive = c.is_live === true;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: desc,
    provider: { "@type": "Organization", name: BRAND, sameAs: SITE },
    ...(c.image_url ? { image: c.image_url } : {}),
    ...(price !== undefined
      ? {
          offers: {
            "@type": "Offer",
            price: String(price),
            priceCurrency: "INR",
            availability: isLive ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            url: `${SITE}${path}`,
          },
        }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      ...(c.start_date ? { startDate: c.start_date } : {}),
      ...(c.language ? { inLanguage: c.language } : {}),
    },
  };

  const body = `
  <h1>${esc(String(c.title))}</h1>
  ${c.exam_category ? `<p><strong>Exam:</strong> ${esc(String(c.exam_category))}</p>` : ""}
  ${c.subject ? `<p><strong>Subjects:</strong> ${esc(String(c.subject))}</p>` : ""}
  ${c.duration ? `<p><strong>Duration:</strong> ${esc(String(c.duration))}</p>` : ""}
  ${price !== undefined ? `<p><strong>Price:</strong> ₹${esc(String(price))}</p>` : ""}
  <p>${esc(desc)}</p>`;

  return render({
    title,
    description: desc,
    path,
    index: isLive,
    ogImage: (c.image_url as string) || DEFAULT_OG,
    bodyHtml: body,
    jsonLd,
  });
}

// Listing pages: include live course titles as links (content + internal links).
async function listingDoc(path: string): Promise<string> {
  const meta = PAGES[path] || {
    title: `Courses | ${BRAND}`,
    description: "Live courses at Unknown IITians.",
  };
  const catSlug = path.split("/courses/category/")[1];
  const exam = catSlug ? CATEGORY_MAP[catSlug] : undefined;
  const query = exam
    ? `courses?select=id,title&is_live=eq.true&exam_category=eq.${encodeURIComponent(exam)}&limit=100`
    : `courses?select=id,title&is_live=eq.true&limit=100`;
  const courses = await fetchRows(query);
  const items = courses
    .filter((c) => c.id && c.title)
    .map((c) => `<li><a href="${SITE}/courses/${c.id}">${esc(String(c.title))}</a></li>`)
    .join("");
  const body = `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p>${
    items ? `<ul>${items}</ul>` : ""
  }`;
  return render({ ...meta, path, bodyHtml: body });
}

// Programmatic IITM BS notes-subject page:
// /exam-preparation/iitm-bs/notes/{branch}/{level}/{subject-slug}
async function notesSubjectDoc(path: string): Promise<string> {
  const parts = path.split("/").filter(Boolean); // [exam-preparation, iitm-bs, notes, branch, level, subject]
  const urlBranch = parts[3];
  const urlLevel = parts[4];
  const subjectSlug = parts[5];
  const dbBranch = branchToDb(urlBranch);
  const dbLevel = levelToDb(urlLevel);

  const subjects = await fetchRows(
    `iitm_bs_subjects?select=id,subject_name&branch=eq.${encodeURIComponent(dbBranch)}&level=eq.${encodeURIComponent(dbLevel)}`
  );
  const subject = subjects.find((s) => slugify(String(s.subject_name)) === subjectSlug);
  if (!subject) {
    return render({
      title: `IITM BS ${dbLevel} Notes | ${BRAND}`,
      description: `Free IITM BS ${dbLevel} notes and study material by ${BRAND}.`,
      path,
      index: false, // unknown subject — don't index a thin page
    });
  }

  const subjectName = String(subject.subject_name);
  const notes = await fetchRows(
    `iitm_branch_notes?select=title,week_number&subject_id=eq.${subject.id}&is_active=eq.true&order=week_number.asc`
  );
  const title = `${subjectName} Notes — IITM BS ${dbLevel} (Free PDF) | ${BRAND}`;
  const desc =
    `Free IITM BS ${dbLevel} notes for ${subjectName} (${dbBranch}) — ` +
    `${notes.length} downloadable PDF study notes covering all weeks, by ${BRAND}.`;
  const items = notes
    .map((n) => `<li>${esc(String(n.title))}</li>`)
    .join("");
  const body = `<h1>${esc(subjectName)} — IITM BS ${esc(dbLevel)} Notes</h1>
  <p>${esc(desc)}</p>
  ${items ? `<h2>Notes in this subject</h2><ul>${items}</ul>` : ""}`;

  return render({ title, description: desc, path, bodyHtml: body });
}

function titleFromPath(path: string): string {
  const last = path.split("/").filter(Boolean).pop() || "";
  const words = last.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return words ? `${words} | ${BRAND}` : BRAND;
}

// Paths that must never be indexed (compliance/internal pages). Matched
// case-insensitively; also reinforced by an X-Robots-Tag header in vercel.json.
const NOINDEX = new Set(["/merchantcontactanantya"]);

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let path = (url.searchParams.get("path") || "/").split("?")[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  let html: string;

  if (NOINDEX.has(path.toLowerCase())) {
    return new Response(
      render({
        title: titleFromPath(path),
        description: `${BRAND}`,
        path,
        index: false,
      }),
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-robots-tag": "noindex, nofollow",
          "cache-control": "public, s-maxage=3600",
        },
      }
    );
  }

  const courseMatch = path.match(/^\/courses\/([0-9a-fA-F-]{36})$/);
  const notesSubjectMatch = /^\/exam-preparation\/iitm-bs\/notes\/[^/]+\/[^/]+\/[^/]+$/.test(path);
  if (courseMatch) {
    html = await courseDoc(courseMatch[1]);
  } else if (notesSubjectMatch) {
    html = await notesSubjectDoc(path);
  } else if (path === "/courses" || path.startsWith("/courses/category/")) {
    html = await listingDoc(path);
  } else if (PAGES[path]) {
    html = render({ ...PAGES[path], path });
  } else {
    // Generic fallback: derive a sensible title from the path.
    html = render({
      title: titleFromPath(path),
      description: `${BRAND} — IITM BS, JEE and NEET courses, free notes, PYQs and tools.`,
      path,
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Edge-cache so repeat crawls of the same URL don't re-hit Supabase.
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
