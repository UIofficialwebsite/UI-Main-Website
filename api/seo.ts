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
    title: `IITM BS CGPA Calculator — All Branches (Free) | ${BRAND}`,
    description: "Free IITM BS CGPA calculator for all four branches — Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems — across Foundation, Diploma and Degree levels.",
  },
  "/iitm-tools/grade-calculator": {
    title: `IITM BS Grade Calculator — All Branches (Free) | ${BRAND}`,
    description: "Free IITM BS grade calculator for all four branches (Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, Electronic Systems) — estimate your subject grade from quiz, assignment and end-term scores using the official grading formula.",
  },
  "/iitm-tools/marks-predictor": {
    title: `IITM BS Marks Predictor — All Branches (Free) | ${BRAND}`,
    description: "Free IITM BS marks predictor for all four branches — Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems — find the end-term score you need to reach your target grade.",
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

// ---- E-E-A-T / LLMO structured data ---------------------------------------

// A clear, credible entity is the core of E-E-A-T and helps AI models describe
// who "Unknown IITians" is and what it's an authority on.
const EDU_ORG = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: BRAND,
  url: SITE,
  logo: DEFAULT_OG,
  description:
    "Unknown IITians is an online education platform specialising in IIT Madras BS (IITM BS) Degree preparation — free notes, previous year questions, tools and live courses — alongside JEE and NEET study material.",
  knowsAbout: [
    "IIT Madras BS Degree",
    "IITM BS Qualifier",
    "IITM BS Data Science",
    "IITM BS Electronic Systems",
    "JEE",
    "NEET",
  ],
  areaServed: "IN",
  sameAs: [
    "https://www.youtube.com/@UnknownIITians",
    "https://www.instagram.com/unknown_iitians",
  ],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND,
  url: SITE,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE}/courses?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

type FAQ = { q: string; a: string };

// FAQPage schema — extracted by Google (rich results) AND by LLMs (direct answers).
function faqSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function faqBody(faqs: FAQ[]): string {
  return (
    `<h2>Frequently asked questions</h2>` +
    faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")
  );
}

const HOME_FAQS: FAQ[] = [
  {
    q: "Is Unknown IITians free?",
    a: "Yes. Unknown IITians provides free IITM BS, JEE and NEET notes, previous year questions (PYQs) and tools. Live courses for the IITM BS Qualifier and Foundation are paid.",
  },
  {
    q: "What is the IIT Madras BS (IITM BS) degree?",
    a: "The IIT Madras BS is an online 4-year Bachelor of Science degree from IIT Madras in Data Science & Applications and in Electronic Systems, with Qualifier, Foundation, Diploma and Degree levels. Anyone who has passed Class 12 can join through the Qualifier.",
  },
  {
    q: "Does Unknown IITians cover both IITM BS branches?",
    a: "Yes. It covers IITM BS Data Science and Electronic Systems across all levels — Qualifier, Foundation, Diploma and Degree — with subject-wise notes and PYQs.",
  },
  {
    q: "Does Unknown IITians offer IITM BS Qualifier preparation?",
    a: "Yes. Unknown IITians offers live IITM BS Qualifier and Foundation courses with lectures, practice and doubt-solving, plus free notes and PYQs.",
  },
  {
    q: "Are there free IITM BS tools?",
    a: "Yes. Unknown IITians offers a free IITM BS CGPA calculator, grade calculator and marks predictor.",
  },
];

const NOTES_FAQS: FAQ[] = [
  {
    q: "Are IITM BS notes on Unknown IITians free?",
    a: "Yes. All IITM BS notes on Unknown IITians are free to download as subject-wise PDFs.",
  },
  {
    q: "Which IITM BS subjects have notes?",
    a: "Notes are available for IITM BS Data Science and Electronic Systems subjects across Qualifier, Foundation, Diploma and Degree levels, organised by branch, level and subject.",
  },
  {
    q: "Do the notes cover all weeks of a subject?",
    a: "Yes. Notes are organised week by week for each subject so you can follow the full course.",
  },
];

// The four IITM BS branches the calculators now support. Kept in one place so
// every tool FAQ names the same set (Management and Aeronautics are the newer
// additions alongside the original Data Science and Electronic Systems).
const TOOL_BRANCHES =
  "Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems";

const GRADE_TOOL_FAQS: FAQ[] = [
  {
    q: "Which IITM BS branches does the grade calculator support?",
    a: `All four IITM BS branches — ${TOOL_BRANCHES} — across the Foundation, Diploma and Degree levels.`,
  },
  {
    q: "How does the IITM BS grade calculator work?",
    a: "Pick your branch, level and course, then enter your assignment eligibility average, quiz and end-term scores. It applies the official published grading formula for that course to estimate your final score and letter grade.",
  },
  {
    q: "Is the IITM BS grade calculator free?",
    a: "Yes. The IITM BS grade calculator on Unknown IITians is completely free to use.",
  },
];

const CGPA_TOOL_FAQS: FAQ[] = [
  {
    q: "Which IITM BS branches does the CGPA calculator cover?",
    a: `All four IITM BS branches — ${TOOL_BRANCHES}.`,
  },
  {
    q: "How do I calculate my IITM BS CGPA?",
    a: "Enter your current CGPA and completed credits, then add your semester subjects with their expected grades. The calculator weights each course by its credits to give your updated CGPA.",
  },
  {
    q: "Is the IITM BS CGPA calculator free?",
    a: "Yes. The IITM BS CGPA calculator is completely free.",
  },
];

const MARKS_TOOL_FAQS: FAQ[] = [
  {
    q: "Which IITM BS branches does the marks predictor support?",
    a: `All four IITM BS branches — ${TOOL_BRANCHES}.`,
  },
  {
    q: "What does the IITM BS marks predictor do?",
    a: "Enter the internal scores you already have and your target grade, and it works out the end-term score you need to reach that grade using the course's official grading formula.",
  },
  {
    q: "Is the IITM BS marks predictor free?",
    a: "Yes. The IITM BS marks predictor is completely free.",
  },
];

// Pages that get extra structured data + visible FAQ content.
const PAGE_EXTRAS: Record<string, { schema: unknown; faqs?: FAQ[] }> = {
  "/": { schema: [EDU_ORG, WEBSITE_SCHEMA, faqSchema(HOME_FAQS)], faqs: HOME_FAQS },
  "/exam-preparation/iitm-bs/notes": { schema: [faqSchema(NOTES_FAQS)], faqs: NOTES_FAQS },
  "/iitm-tools/grade-calculator": { schema: [faqSchema(GRADE_TOOL_FAQS)], faqs: GRADE_TOOL_FAQS },
  "/iitm-tools/cgpa-calculator": { schema: [faqSchema(CGPA_TOOL_FAQS)], faqs: CGPA_TOOL_FAQS },
  "/iitm-tools/marks-predictor": { schema: [faqSchema(MARKS_TOOL_FAQS)], faqs: MARKS_TOOL_FAQS },
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

// Per-branch calculator pages: /iitm-tools/<tool>/<branch>. One indexable page
// per (tool × branch) so each ranks for its own query, e.g. "IITM BS grade
// calculator aeronautics". Branch slugs match the ProgrammeId slugs used by the
// tools tab so the human redirect preselects the right branch.
const TOOL_META: Record<string, { name: string; verb: string }> = {
  "grade-calculator": { name: "Grade Calculator", verb: "estimate your subject grade from quiz, assignment and end-term scores" },
  "cgpa-calculator": { name: "CGPA Calculator", verb: "compute your CGPA across levels and subjects" },
  "marks-predictor": { name: "Marks Predictor", verb: "find the end-term score you need to reach your target grade" },
};

const TOOL_BRANCH_LABELS: Record<string, string> = {
  "data-science": "Data Science and Applications",
  "management-data-science": "Management and Data Science",
  "aeronautics-space-technology": "Aeronautics and Space Technology",
  "electronic-systems": "Electronic Systems",
};

function toolBranchDoc(path: string): string {
  const parts = path.split("/").filter(Boolean); // [iitm-tools, <tool>, <branch>]
  const tool = TOOL_META[parts[1]];
  const branchLabel = TOOL_BRANCH_LABELS[parts[2]];
  if (!tool || !branchLabel) {
    // Unknown tool/branch — render a thin, non-indexed fallback.
    return render({ title: titleFromPath(path), description: BRAND, path, index: false });
  }
  const toolLower = tool.name.toLowerCase();
  const title = `IITM BS ${tool.name} — ${branchLabel} (Free) | ${BRAND}`;
  const desc = `Free IITM BS ${toolLower} for the ${branchLabel} branch — ${tool.verb}, using the official published grading formula for each ${branchLabel} course.`;
  const faqs: FAQ[] = [
    {
      q: `Does the ${toolLower} support IITM BS ${branchLabel}?`,
      a: `Yes. This ${toolLower} covers the IITM BS ${branchLabel} branch and applies its official course grading formulas across the Foundation, Diploma and Degree levels.`,
    },
    {
      q: `Is the IITM BS ${branchLabel} ${toolLower} free?`,
      a: `Yes. The IITM BS ${toolLower} for ${branchLabel} is completely free to use on Unknown IITians.`,
    },
  ];
  const body = `<h1>IITM BS ${esc(tool.name)} — ${esc(branchLabel)}</h1>\n  <p>${esc(desc)}</p>\n  ${faqBody(faqs)}`;
  return render({ title, description: desc, path, jsonLd: faqSchema(faqs), bodyHtml: body });
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
  const toolBranchMatch = /^\/iitm-tools\/[^/]+\/[^/]+$/.test(path);
  if (courseMatch) {
    html = await courseDoc(courseMatch[1]);
  } else if (notesSubjectMatch) {
    html = await notesSubjectDoc(path);
  } else if (toolBranchMatch) {
    html = toolBranchDoc(path);
  } else if (path === "/courses" || path.startsWith("/courses/category/")) {
    html = await listingDoc(path);
  } else if (PAGES[path]) {
    const meta = PAGES[path];
    const extra = PAGE_EXTRAS[path];
    const bodyHtml = extra?.faqs
      ? `<h1>${esc(meta.title)}</h1>\n  <p>${esc(meta.description)}</p>\n  ${faqBody(extra.faqs)}`
      : undefined;
    html = render({ ...meta, path, jsonLd: extra?.schema, bodyHtml });
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
