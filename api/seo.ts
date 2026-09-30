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

import {
  CGPA_TOOL_FAQS, GRADE_TOOL_FAQS, HUB_FAQS, HUB_LINKS, MARKS_TOOL_FAQS, NOTES_FAQS, PYQ_FAQS, SCORE_CHECK_FAQ,
} from "./_shared/seoContent";
import { hubContent, hubPath } from "./_shared/subjectHub";
import { indexContent } from "./_shared/subjectsIndex";
import { COMPARE_DISCLAIMER, comparePageFor, type ComparePage } from "./_shared/comparePages";
import { infoFor } from "./_shared/seoContent";

export const config = { runtime: "edge" };

const SITE = "https://www.unknowniitians.com";
const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";
const DEFAULT_OG = `${SITE}/web-uploads/UI_logo.png`;
const BRAND = "Unknown IITians";

// Quiz Space — Unknown IITians' site for practising IITM BS PYQs online. The
// same links the site shows visitors in its footer and PYQs tab
// (src/lib/quizspace.ts), so crawlers see what visitors see. This function
// imports nothing, so they are repeated here: change both together.
const QUIZ_SPACE = "https://quizspace.unknowniitians.com";
const QUIZ_SPACE_FOOTER: Array<[string, string]> = [
  [QUIZ_SPACE, "Practise IITM BS PYQs online — Quiz Space"],
  [`${QUIZ_SPACE}/exam/qualifier`, "IITM BS Qualifier PYQs with solutions"],
  [`${QUIZ_SPACE}/exam/quiz-1`, "IITM BS Quiz 1 PYQs with solutions"],
  [`${QUIZ_SPACE}/exam/quiz-2`, "IITM BS Quiz 2 PYQs with solutions"],
  [`${QUIZ_SPACE}/exam/end-term`, "IITM BS End Term PYQs with solutions"],
];
const QUIZ_SPACE_LEVELS: Array<[string, string]> = [
  [`${QUIZ_SPACE}/program/data-science/foundation`, "IITM BS Data Science Foundation PYQs with solutions"],
  [`${QUIZ_SPACE}/program/data-science`, "IITM BS Data Science Diploma PYQs with solutions"],
  [`${QUIZ_SPACE}/program/data-science/bs`, "IITM BS Data Science Degree PYQs with solutions"],
  [`${QUIZ_SPACE}/program/electronic-systems/foundation`, "IITM BS Electronic Systems Foundation PYQs with solutions"],
  [`${QUIZ_SPACE}/program/electronic-systems/diploma`, "IITM BS Electronic Systems Diploma PYQs with solutions"],
  [`${QUIZ_SPACE}/program/electronic-systems/bs`, "IITM BS Electronic Systems Degree PYQs with solutions"],
];

function linkList(links: Array<[string, string]>): string {
  return `<ul>${links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("")}</ul>`;
}

/** The footer's Quiz Space links, on every page as in the site's own footer. */
function quizSpaceFooter(): string {
  return `<nav aria-label="IITM BS PYQ practice"><h2>IITM BS PYQs</h2>${linkList(QUIZ_SPACE_FOOTER)}</nav>`;
}

/** The PYQs tab's banner: the same papers to practise online, level by level. */
function quizSpacePractice(): string {
  return (
    `<section><h2>Practise IITM BS PYQs online on Quiz Space</h2>` +
    `<p>Every IITM BS paper question by question, with the answer key and timed mock tests on the real exam screen. Free.</p>` +
    `${linkList(QUIZ_SPACE_LEVELS)}</section>`
  );
}

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
  /** The address search engines should treat as the page, when this one is a twin of it. */
  canonicalPath?: string;
}

function render(d: Doc): string {
  const canonical = `${SITE}${d.canonicalPath ?? d.path}`;
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
  ${quizSpaceFooter()}
  <p><a href="${esc(canonical)}">Open ${esc(BRAND)}</a></p>
</body>
</html>`;
}

// Keyword-optimised metadata for the fixed section pages (IITM BS is the niche
// with the least competition — lead with it).
const PAGES: Record<string, { title: string; description: string }> = {
  "/exam-preparation/iitm-bs": {
    title: "IITM BS Degree Preparation: Notes, PYQs, Tools & Courses",
    description:
      "All you need for the IIT Madras BS degree: free notes, previous year papers, grade & CGPA calculators, syllabus, dates and live Qualifier courses.",
  },
  "/exam-preparation/jee": {
    title: "JEE Preparation: Free Notes & PYQs for Physics, Chemistry & Maths",
    description: "Free JEE notes for Physics, Chemistry and Mathematics and JEE Main previous year question papers, to download and practise, from Unknown IITians.",
  },
  "/exam-preparation/neet": {
    title: "NEET Preparation: Free Notes & PYQs for Physics, Chemistry & Biology",
    description: "Free NEET notes for Physics, Chemistry and Biology and NEET previous year question papers, to download and practise, from Unknown IITians.",
  },
  "/exam-preparation/iitm-bs/courses": {
    title: "IITM BS Courses: Live Qualifier & Foundation Batches | Unknown IITians",
    description:
      "Live IITM BS courses for the Qualifier and Foundation levels: daily live lectures, practice papers, doubt-solving and mentor guidance from Unknown IITians.",
  },
  "/exam-preparation/iitm-bs/news": {
    title: "IITM BS News & Updates: Exams, Results, Notices | Unknown IITians",
    description: "The latest IIT Madras BS degree news: exam schedules, results, portal notices and important announcements, kept up to date.",
  },
  "/exam-preparation/iitm-bs/communities": {
    title: "IITM BS Communities: Study Groups & Discussions | Unknown IITians",
    description: "Join IITM BS study groups and communities to discuss subjects, share notes and get help from other students.",
  },
  "/exam-preparation/iitm-bs/tools/grade-calculator": {
    title: "IITM BS Grade Calculator: Check Your Score & Grade (Free)",
    description:
      "Free IITM BS grade calculator and score checker: enter quiz, assignment and end-term marks to see your total score and letter grade for all four branches.",
  },
  "/exam-preparation/iitm-bs/tools/cgpa-calculator": {
    title: "IITM BS CGPA Calculator: Calculate Your CGPA (Free)",
    description:
      "Free IITM BS CGPA calculator: add your subjects, credits and grades to get your CGPA for Foundation, Diploma and Degree, across all four branches.",
  },
  "/exam-preparation/iitm-bs/tools/marks-predictor": {
    title: "IITM BS Marks Predictor: Marks Needed for Your Target Grade",
    description:
      "Free IITM BS marks predictor: enter your current scores and target grade to see the end-term marks you need, using each course's official formula.",
  },
  "/": {
    title: `${BRAND}: IITM BS Courses, Notes, PYQs & Free Tools`,
    description:
      "Live IITM BS Qualifier & Foundation courses, free notes, previous year papers, grade & CGPA calculators, and Quiz Space for online PYQ practice.",
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
    title: "IITM BS PYQs: Previous Year Question Papers with Solutions",
    description:
      "Free IITM BS previous year question papers: Qualifier, Quiz 1, Quiz 2, OPPE and End Term. Download PDFs or practise online with answer keys on Quiz Space.",
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
  alternateName: ["UnknownIITians", "Unknown IITian", "Unknown IITians Quiz Space"],
  sameAs: [
    "https://www.youtube.com/@UnknownIITians",
    "https://www.instagram.com/unknown_iitians",
    "https://www.linkedin.com/company/unknown-iitians/",
    "https://t.me/bsdatascience_iitm",
    "https://quizspace.unknowniitians.com",
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









const HOME_EXTRA_FAQS: FAQ[] = [
  {
    q: "What is Quiz Space?",
    a: "Quiz Space is Unknown IITians' site for practising IITM BS previous year papers online, with answer keys, explanations and timed mock tests, at quizspace.unknowniitians.com.",
  },
];

const TOOL_NAMES: Record<string, string> = {
  "grade-calculator": "Grade Calculator",
  "cgpa-calculator": "CGPA Calculator",
  "marks-predictor": "Marks Predictor",
};

const CRUMB_NAMES: Record<string, string> = {
  pyqs: "PYQs", notes: "Notes", tools: "Tools", courses: "Courses", news: "News",
  communities: "Communities", syllabus: "Syllabus", dates: "Important dates", ...TOOL_NAMES,
};

function breadcrumbSchema(items: Array<[string, string]>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE}${path}`,
    })),
  };
}

/** Home > IITM BS > … for the IITM BS section's own pages. */
function crumbsFor(path: string): Array<[string, string]> | null {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "exam-preparation" || parts[1] !== "iitm-bs") return null;
  const out: Array<[string, string]> = [["Home", "/"], ["IITM BS", "/exam-preparation/iitm-bs"]];
  let acc = "/exam-preparation/iitm-bs";
  for (const seg of parts.slice(2)) {
    acc += `/${seg}`;
    out.push([CRUMB_NAMES[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), acc]);
  }
  return out;
}

function toolApp(name: string, path: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: `${SITE}${path}`,
    description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: BRAND, url: SITE },
  };
}


/** Page-by-page extra content: heading, structured data, FAQs and links. */
// Pages that get extra structured data + visible FAQ content.
const jeeInfo = infoFor("/exam-preparation/jee")!;
const neetInfo = infoFor("/exam-preparation/neet")!;

const PAGE_EXTRAS: Record<string, { schema: unknown; faqs?: FAQ[]; h1?: string; links?: Array<[string, string]> }> = {
  "/exam-preparation/jee": { h1: jeeInfo.heading, schema: [faqSchema(jeeInfo.faqs)], faqs: jeeInfo.faqs, links: jeeInfo.links },
  "/exam-preparation/neet": { h1: neetInfo.heading, schema: [faqSchema(neetInfo.faqs)], faqs: neetInfo.faqs, links: neetInfo.links },
  "/": {
    h1: `${BRAND}: IITM BS courses, notes, PYQs and free tools`,
    schema: [EDU_ORG, WEBSITE_SCHEMA, faqSchema([...HOME_FAQS, ...HOME_EXTRA_FAQS])],
    faqs: [...HOME_FAQS, ...HOME_EXTRA_FAQS],
    links: [...HUB_LINKS, ["/courses", "All live courses"], ["/exam-preparation/jee", "JEE preparation"], ["/exam-preparation/neet", "NEET preparation"]],
  },
  "/exam-preparation/iitm-bs": {
    h1: "IITM BS Degree Preparation",
    schema: [breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs")!), faqSchema(HUB_FAQS)],
    faqs: HUB_FAQS,
    links: [[QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"], ...HUB_LINKS],
  },
  "/exam-preparation/iitm-bs/pyqs": {
    h1: "IITM BS PYQs: previous year question papers",
    schema: [breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs/pyqs")!), faqSchema(PYQ_FAQS)],
    faqs: PYQ_FAQS,
    links: [
      [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"],
      ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"],
      ["/exam-preparation/iitm-bs/tools/grade-calculator", "IITM BS grade calculator and score checker"],
    ],
  },
  "/exam-preparation/iitm-bs/notes": {
    h1: "IITM BS Notes",
    schema: [breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs/notes")!), faqSchema(NOTES_FAQS)],
    faqs: NOTES_FAQS,
    links: [
      ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
      [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"],
    ],
  },
  "/exam-preparation/iitm-bs/tools/grade-calculator": {
    h1: "IITM BS Grade Calculator and Score Checker",
    schema: [
      breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs/tools/grade-calculator")!),
      toolApp("IITM BS Grade Calculator", "/exam-preparation/iitm-bs/tools/grade-calculator", "Estimate your IITM BS subject score and grade from quiz, assignment and end-term marks."),
      faqSchema([...GRADE_TOOL_FAQS, SCORE_CHECK_FAQ]),
    ],
    faqs: [...GRADE_TOOL_FAQS, SCORE_CHECK_FAQ],
  },
  "/exam-preparation/iitm-bs/tools/cgpa-calculator": {
    h1: "IITM BS CGPA Calculator",
    schema: [
      breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs/tools/cgpa-calculator")!),
      toolApp("IITM BS CGPA Calculator", "/exam-preparation/iitm-bs/tools/cgpa-calculator", "Calculate your IITM BS CGPA from subjects, credits and grades."),
      faqSchema(CGPA_TOOL_FAQS),
    ],
    faqs: CGPA_TOOL_FAQS,
  },
  "/exam-preparation/iitm-bs/tools/marks-predictor": {
    h1: "IITM BS Marks Predictor",
    schema: [
      breadcrumbSchema(crumbsFor("/exam-preparation/iitm-bs/tools/marks-predictor")!),
      toolApp("IITM BS Marks Predictor", "/exam-preparation/iitm-bs/tools/marks-predictor", "Find the IITM BS end-term marks you need for your target grade."),
      faqSchema(MARKS_TOOL_FAQS),
    ],
    faqs: MARKS_TOOL_FAQS,
  },
};


// ---- route handlers --------------------------------------------------------

async function courseDoc(id: string): Promise<string> {
  const [rows, faqRows, addonRows] = await Promise.all([
    fetchRows(
      `courses?select=title,description,price,discounted_price,image_url,start_date,is_live,exam_category,subject,language,duration,level,branch&id=eq.${id}&limit=1`
    ),
    fetchRows(`course_faqs?select=question,answer&course_id=eq.${id}&order=created_at.asc`),
    fetchRows(`course_addons?select=subject_name,price&course_id=eq.${id}&price=gt.0&order=price.asc`),
  ]);
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
  const isBs = c.exam_category === "IITM BS";
  const level = c.level ? String(c.level) : "";
  const title = isBs ? `${c.title}: Live IITM BS Course` : `${c.title} | ${BRAND}`;
  const addons = addonRows.map((a) => Number(a.price));
  const cost = batchPrice(c.price, c.discounted_price, addons);
  const price = cost.price;
  const facts = [
    isBs && level ? `Live IITM BS ${level} course` : "Live course",
    c.start_date ? `starts ${shortDate(c.start_date)}` : "",
    priceText(cost),
  ].filter(Boolean);
  const fallback = `${c.title}: ${facts.join(", ")}. Lectures, practice and doubt-solving by ${BRAND}.`;
  // The search snippet is the clean composed line; the page's own text is the course's full description.
  const desc = clean(fallback, 155);
  const fullText = clean(String(c.description || fallback), 700);
  const isLive = c.is_live === true;
  const faqs: FAQ[] = faqRows
    .filter((f) => f.question && f.answer)
    .map((f) => ({ q: String(f.question), a: clean(String(f.answer), 400) }));

  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: clean(fullText, 300),
    provider: { "@type": "Organization", name: BRAND, sameAs: SITE },
    ...(c.image_url ? { image: c.image_url } : {}),
    offers: cost.from
      ? {
          "@type": "AggregateOffer",
          lowPrice: String(Math.min(...addons.filter((x) => x > 0))),
          highPrice: String(Math.max(...addons.filter((x) => x > 0))),
          offerCount: addons.filter((x) => x > 0).length,
          priceCurrency: "INR",
          availability: isLive ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          url: `${SITE}${path}`,
        }
      : {
          "@type": "Offer",
          price: String(price),
          priceCurrency: "INR",
          availability: isLive ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          url: `${SITE}${path}`,
        },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      ...(c.start_date ? { startDate: c.start_date } : {}),
      ...(c.language ? { inLanguage: c.language } : {}),
    },
  };

  const body = `
  <h1>${esc(String(c.title))}</h1>
  ${c.exam_category ? `<p><strong>Exam:</strong> ${esc(String(c.exam_category))}${level ? ` — ${esc(level)}` : ""}</p>` : ""}
  ${c.subject ? `<p><strong>Subjects:</strong> ${esc(String(c.subject))}</p>` : ""}
  ${c.start_date ? `<p><strong>Starts:</strong> ${esc(shortDate(c.start_date))}</p>` : ""}
  ${c.duration ? `<p><strong>Duration:</strong> ${esc(String(c.duration))}</p>` : ""}
  <p><strong>Price:</strong> ${esc(priceText(cost))}${cost.from ? " (choose your subjects)" : ""}</p>
  <p>${esc(fullText)}</p>
  <p><a href="${SITE}/courses">All live courses</a></p>${faqs.length ? `\n  ${faqBody(faqs)}` : ""}`;

  return render({
    title,
    description: desc,
    path,
    index: isLive,
    ogImage: (c.image_url as string) || DEFAULT_OG,
    bodyHtml: body,
    jsonLd: [course, breadcrumbSchema([["Home", "/"], ["Courses", "/courses"], [String(c.title), path]]), ...(faqs.length ? [faqSchema(faqs)] : [])],
  });
}

/** The questions and links shown under the courses pages, for visitors and crawlers alike. */
function infoForCourses(path: string) {
  return infoFor(path);
}

function inr(n: number): string {
  return n === 0 ? "free" : `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * What a batch costs, the way the course card on the site shows it: its own price when it has
 * one; when the base is free and subjects are sold as add-ons, "from" the cheapest add-on;
 * only a batch with neither is free.
 */
function batchPrice(base: unknown, discounted: unknown, addons: number[]): { price: number; from: boolean } {
  const own = Number((discounted as number | null) ?? (base as number | null) ?? 0);
  const b = Number((base as number | null) ?? 0);
  if (b > 0 || own > 0) return { price: own, from: false };
  const paid = addons.filter((x) => x > 0);
  return paid.length ? { price: Math.min(...paid), from: true } : { price: 0, from: false };
}

function priceText(p: { price: number; from: boolean }): string {
  return p.from ? `from ${inr(p.price)}` : inr(p.price);
}


function shortDate(value: unknown): string {
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// Listing pages: the live courses, described from the data (what is open, from when, at what price).
async function listingDoc(path: string): Promise<string> {
  const catSlug = path.split("/courses/category/")[1];
  const exam = catSlug ? CATEGORY_MAP[catSlug] : undefined;
  const [all, addonRows] = await Promise.all([
    fetchRows("courses?select=id,title,price,discounted_price,start_date,level,exam_category,is_live&is_live=eq.true&order=start_date.asc&limit=100"),
    fetchRows("course_addons?select=course_id,price&price=gt.0&limit=1000"),
  ]);
  const addonsOf = (id: unknown) => addonRows.filter((a) => a.course_id === id).map((a) => Number(a.price));
  const live = all.filter((c) => c.id && c.title);
  const shown = exam ? live.filter((c) => c.exam_category === exam) : live;
  const cats = [...new Set(live.map((c) => String(c.exam_category || "")).filter(Boolean))];
  const label = exam ?? (cats.length === 1 ? cats[0] : "IITM BS, JEE & NEET");

  // A category with nothing open is not listed as if it were selling something.
  if (exam && shown.length === 0) {
    return render({
      title: `${exam} Live Courses | ${BRAND}`,
      description: `${BRAND} has no ${exam} live batch open right now. Free ${exam} notes and previous year questions are available.`,
      path,
      index: false,
      bodyHtml: `<h1>${esc(exam)} live courses</h1><p>No ${esc(exam)} live batch is open right now.</p>`,
    });
  }

  const costs = shown.map((c) => batchPrice(c.price, c.discounted_price, addonsOf(c.id)));
  const paidCosts = costs.filter((x) => x.price > 0).map((x) => x.price);
  const cheapest = paidCosts.length ? Math.min(...paidCosts) : 0;
  const anyFree = costs.some((x) => x.price === 0);
  const first = shown.map((c) => shortDate(c.start_date)).find(Boolean);
  const title = `${label} Live Courses & Batches: Enrol Now | ${BRAND}`;
  const description =
    `${shown.length} live ${label} ${shown.length === 1 ? "batch is" : "batches are"} open now` +
    `${first ? `, starting ${first}` : ""}${cheapest > 0 ? `, from ${inr(cheapest)}` : ""}${anyFree ? ", including free ones" : ""}: ` +
    `with lectures, practice papers and doubt-solving from ${BRAND}.`;

  const items = shown
    .map((c) => {
      const price = batchPrice(c.price, c.discounted_price, addonsOf(c.id));
      const bits = [c.level ? String(c.level) : "", c.start_date ? `starts ${shortDate(c.start_date)}` : "", priceText(price)].filter(Boolean);
      return `<li><a href="${SITE}/courses/${c.id}">${esc(String(c.title))}</a> (${esc(bits.join(", "))})</li>`;
    })
    .join("");
  const info = infoForCourses(path);
  const body =
    `<h1>${esc(label)} live courses and batches</h1>\n  <p>${esc(description)}</p>` +
    (items ? `\n  <h2>Open now</h2><ul>${items}</ul>` : "") +
    (info ? `\n  <h2>Explore</h2>${linkList(info.links)}\n  ${faqBody(info.faqs)}` : "");

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: shown.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/courses/${c.id}`,
      item: {
        "@type": "Course",
        name: String(c.title),
        description: `${String(c.title)}: a live ${String(c.exam_category || "")} course by ${BRAND}.`,
        provider: { "@type": "Organization", name: BRAND, sameAs: SITE },
        url: `${SITE}/courses/${c.id}`,
      },
    })),
  };
  return render({
    title,
    description,
    path,
    canonicalPath: exam && cats.length === 1 ? "/courses" : undefined,
    bodyHtml: body,
    jsonLd: [breadcrumbSchema([["Home", "/"], ["Courses", "/courses"]]), listSchema, ...(info ? [faqSchema(info.faqs)] : [])],
  });
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
  ${items ? `<h2>Notes in this subject</h2><ul>${items}</ul>` : ""}
  <h2>More for ${esc(subjectName)}</h2>
  <p>Previous year papers to practise online, grade and CGPA calculators, and live batches, all for ${esc(subjectName)}.</p>
  <p><a href="${esc(hubPath(dbBranch, dbLevel, subjectName))}">IITM BS ${esc(subjectName)}: notes, PYQs &amp; tools</a></p>`;

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

const LEVEL_LABELS: Record<string, string> = {
  foundation: "Foundation", diploma: "Diploma", degree: "Degree", qualifier: "Qualifier", bs: "BS Degree", bsc: "BSc Degree",
};

/** A calculator for one branch and level: /exam-preparation/iitm-bs/tools/<branch>/<level>/<tool>, or its /iitm-tools twin. */
const TOOL_BRANCH_SHORT: Record<string, string> = {
  "data-science": "Data Science",
  "management-data-science": "Management",
  "aeronautics-space-technology": "Aeronautics",
  "electronic-systems": "Electronic Systems",
};

function toolLevelDoc(branch: string, level: string, tool: string, twin: boolean): string | null {
  const name = TOOL_NAMES[tool];
  const branchLabel = TOOL_BRANCH_LABELS[branch];
  const levelLabel = LEVEL_LABELS[level];
  if (!name || !branchLabel || !levelLabel) return null;
  const canonical = `/exam-preparation/iitm-bs/tools/${branch}/${level}/${tool}`;
  const path = twin ? `/iitm-tools/${tool}/${branch}/${level}` : canonical;
  const short = TOOL_BRANCH_SHORT[branch] ?? branchLabel;
  const title = `IITM BS ${name}: ${short} ${levelLabel} (Free)`;
  const desc = `Free IITM BS ${name} for ${short} ${levelLabel}, using the official grading formula of each ${levelLabel} course. Works on phone and desktop.`;
  const faqs: FAQ[] = [
    {
      q: `Does this ${name} cover IITM BS ${branchLabel} ${levelLabel}?`,
      a: `Yes. It applies the official grading formula of each ${branchLabel} ${levelLabel} course.`,
    },
    {
      q: `Is the IITM BS ${short} ${name} free?`,
      a: `Yes. It is completely free to use on ${BRAND}.`,
    },
    ...(tool === "grade-calculator" ? [SCORE_CHECK_FAQ] : []),
  ];
  const links = HUB_LINKS.filter(([href]) => href.includes("/tools/") || href.endsWith("/pyqs") || href.endsWith("/notes"));
  const body = `<h1>IITM BS ${esc(name)}: ${esc(branchLabel)} ${esc(levelLabel)}</h1>\n  <p>${esc(desc)}</p>\n  <h2>More for IITM BS students</h2>${linkList(links)}\n  ${faqBody(faqs)}`;
  return render({
    title, description: desc, path, canonicalPath: canonical,
    jsonLd: [
      breadcrumbSchema([["Home", "/"], ["IITM BS", "/exam-preparation/iitm-bs"], ["Tools", "/exam-preparation/iitm-bs/tools"], [`${name}: ${branchLabel} ${levelLabel}`, canonical]]),
      toolApp(`IITM BS ${name}: ${branchLabel} ${levelLabel}`, canonical, desc),
      faqSchema(faqs),
    ],
    bodyHtml: body,
  });
}

/** The subjects of one branch and level, with a link to each one's notes. */
async function notesLevelDoc(path: string): Promise<string> {
  const [, , , , branchSlug, levelSlug] = path.split("/");
  const dbBranch = branchToDb(branchSlug);
  const dbLevel = levelToDb(levelSlug);
  const subjects = await fetchRows(
    `iitm_bs_subjects?select=id,subject_name&branch=eq.${encodeURIComponent(dbBranch)}&level=eq.${encodeURIComponent(dbLevel)}&order=subject_name.asc`
  );
  if (subjects.length === 0) {
    return render({ title: `IITM BS ${dbLevel} Notes | ${BRAND}`, description: `Free IITM BS ${dbLevel} notes by ${BRAND}.`, path, index: false });
  }
  const title = `IITM BS ${dbLevel} Notes: ${dbBranch} (Free PDFs) | ${BRAND}`;
  const desc = `Free IITM BS ${dbLevel} notes for ${dbBranch}: subject-wise, week-wise PDF notes for ${subjects.length} subjects, including ${subjects.slice(0, 3).map((x) => String(x.subject_name)).join(", ")}.`;
  const list = subjects
    .map((x) => `<li><a href="${esc(`${path}/${slugify(String(x.subject_name))}`)}">${esc(String(x.subject_name))} notes</a> — <a href="${esc(hubPath(dbBranch, dbLevel, String(x.subject_name)))}">${esc(String(x.subject_name))}: notes, PYQs &amp; tools</a></li>`)
    .join("");
  const body = `<h1>IITM BS ${esc(dbLevel)} Notes: ${esc(dbBranch)}</h1>\n  <p>${esc(desc)}</p>\n  <h2>Subjects</h2><ul>${list}</ul>`;
  return render({
    title, description: desc, path, bodyHtml: body,
    jsonLd: breadcrumbSchema([["Home", "/"], ["IITM BS", "/exam-preparation/iitm-bs"], ["Notes", "/exam-preparation/iitm-bs/notes"], [`${dbBranch} ${dbLevel}`, path]]),
  });
}

/** The subject lists: /iitm-bs and /iitm-bs/<branch>/<level>. */
async function subjectsIndexDoc(path: string): Promise<string> {
  const parts = path.split("/").filter(Boolean); // [iitm-bs] or [iitm-bs, branch, level]
  const dbBranch = parts[1] ? branchToDb(parts[1]) : null;
  const dbLevel = parts[2] ? levelToDb(parts[2]) : null;
  const rows = await fetchRows("iitm_bs_subjects?select=subject_name,branch,level&order=display_order.asc&limit=500");
  const all = rows.map((r) => ({ branch: String(r.branch), level: String(r.level), name: String(r.subject_name) }));
  const ix = indexContent(dbBranch, dbLevel, all);
  if (ix.groups.length === 0) {
    return render({ title: `IITM BS subjects | ${BRAND}`, description: `${BRAND} — IITM BS study resources.`, path, index: false });
  }
  const list = ix.groups
    .map((g) => `<h2>${g.path ? `<a href="${esc(g.path)}">${esc(g.heading)}</a>` : esc(g.heading)}</h2><ul>${g.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("")}</ul>`)
    .join("\n  ");
  const body = `<h1>${esc(ix.h1)}</h1>\n  <p>${esc(ix.intro)}</p>\n  ${list}\n  ${faqBody(ix.faqs)}`;
  return render({ title: ix.title, description: ix.description, path, bodyHtml: body, jsonLd: [breadcrumbSchema(ix.crumbs), faqSchema(ix.faqs)] });
}

/** A subject hub: /iitm-bs/<branch>/<level>/<subject>. Built by the same code the visitor's page uses. */
async function subjectHubDoc(path: string): Promise<string> {
  const [, , branchSlug, levelSlug, subjectSlug] = path.split("/");
  const dbBranch = branchToDb(branchSlug);
  const dbLevel = levelToDb(levelSlug);
  const subjects = await fetchRows(
    `iitm_bs_subjects?select=id,subject_name&branch=eq.${encodeURIComponent(dbBranch)}&level=eq.${encodeURIComponent(dbLevel)}&order=display_order.asc`
  );
  const subject = subjects.find((x) => slugify(String(x.subject_name)) === subjectSlug);
  if (!subject) {
    return render({ title: `IITM BS ${dbLevel} | ${BRAND}`, description: `${BRAND} — IITM BS study resources.`, path, index: false });
  }
  const [notes, batches] = await Promise.all([
    fetchRows(`iitm_branch_notes?select=title,week_number&subject_id=eq.${subject.id}&is_active=eq.true&order=week_number.asc`),
    fetchRows(`courses?select=id,title,price&is_live=eq.true&exam_category=eq.IITM%20BS&branch=eq.${encodeURIComponent(dbBranch)}&level=eq.${encodeURIComponent(dbLevel)}&order=title.asc`),
  ]);
  const hub = hubContent({
    branch: dbBranch,
    level: dbLevel,
    subject: String(subject.subject_name),
    notes: notes.map((x) => ({ title: String(x.title), week: (x.week_number as number | null) ?? null })),
    batches: batches.map((x) => ({ id: String(x.id), title: String(x.title), price: x.price == null ? null : Number(x.price) })),
    siblings: subjects.map((x) => String(x.subject_name)),
  });
  const anchor = ([href, label]: [string, string]) =>
    href.startsWith("http")
      ? `<li><a href="${esc(href)}">${esc(label)}</a></li>`
      : `<li><a href="${esc(href)}">${esc(label)}</a></li>`;
  const list = (items: Array<[string, string]>) => `<ul>${items.map(anchor).join("")}</ul>`;
  const body =
    `<h1>${esc(hub.h1)}</h1>\n  <p>${esc(hub.intro)}</p>` +
    `\n  <h2>Where to go</h2>${list(hub.links)}` +
    (hub.noteTitles.length ? `\n  <h2>Notes in this subject</h2><ul>${hub.noteTitles.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "") +
    (hub.batches.length ? `\n  <h2>Live batches for ${esc(dbLevel)}</h2>${list(hub.batches)}` : "") +
    (hub.siblingLinks.length ? `\n  <h2>Other ${esc(dbLevel)} subjects</h2>${list(hub.siblingLinks)}` : "") +
    `\n  ${faqBody(hub.faqs)}`;
  return render({
    title: hub.title,
    description: hub.description,
    path,
    bodyHtml: body,
    jsonLd: [breadcrumbSchema(hub.crumbs), faqSchema(hub.faqs)],
  });
}

/** The buyer's guides: /best-iitm-bs-resources and the guides beside it. */
function compareDoc(page: ComparePage): string {
  const links = page.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("");
  const sections = page.sections
    .map(
      (sec) =>
        `<h2>${esc(sec.heading)}</h2>` +
        sec.paragraphs.map((t) => `<p>${esc(t)}</p>`).join("") +
        (sec.bullets ? `<ul>${sec.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : "") +
        (sec.links ? `<ul>${sec.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("")}</ul>` : "")
    )
    .join("\n  ");
  const body =
    `<h1>${esc(page.h1)}</h1>\n  <p>${esc(page.intro)}</p>\n  ${sections}` +
    `\n  <h2>Where to go</h2><ul>${links}</ul>\n  ${faqBody(page.faqs)}\n  <p><small>${esc(COMPARE_DISCLAIMER)}</small></p>`;
  return render({
    title: page.title,
    description: page.description,
    path: page.path,
    bodyHtml: body,
    jsonLd: [breadcrumbSchema([["Home", "/"], [page.h1, page.path]]), faqSchema(page.faqs)],
  });
}

function titleFromPath(path: string): string {
  const last = path.split("/").filter(Boolean).pop() || "";
  const words = last.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return words ? `${words} | ${BRAND}` : BRAND;
}

// Paths that must never be indexed (compliance/internal pages). Matched
// case-insensitively; also reinforced by an X-Robots-Tag header in vercel.json.
const NOINDEX = new Set(["/merchantcontactanantya"]);

// Pages that were published and then withdrawn. They answer 410 Gone (not a soft "not found"),
// so search engines drop them at once and nothing under those addresses is ever listed.
const RETIRED = new Set(["/acegrade-alternative", "/iitmdatascience-alternative", "/genziitian-alternative"]);

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let path = (url.searchParams.get("path") || "/").split("?")[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  let html: string;

  if (RETIRED.has(path.toLowerCase())) {
    return new Response("Gone", {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, nofollow", "cache-control": "public, s-maxage=3600" },
    });
  }

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
  const notesLevelMatch = /^\/exam-preparation\/iitm-bs\/notes\/[^/]+\/[^/]+$/.test(path);
  const toolBranchMatch = /^\/iitm-tools\/[^/]+\/[^/]+$/.test(path);
  const hubMatch = /^\/iitm-bs\/[^/]+\/[^/]+\/[^/]+$/.test(path);
  const indexMatch = /^\/iitm-bs(\/[^/]+\/[^/]+)?$/.test(path);
  const toolTwinLevel = path.match(/^\/iitm-tools\/([^/]+)\/([^/]+)\/([^/]+)$/);
  const toolLevel = path.match(/^\/exam-preparation\/iitm-bs\/tools\/([^/]+)\/([^/]+)\/([^/]+)$/);
  // The old /iitm-tools/<tool> addresses are twins of the tool pages under /exam-preparation:
  // same page, one canonical, so their rankings add up instead of competing.
  const twinOf = path.match(/^\/iitm-tools\/(grade-calculator|cgpa-calculator|marks-predictor)$/);
  let levelDoc: string | null = null;
  if (toolTwinLevel) levelDoc = toolLevelDoc(toolTwinLevel[2], toolTwinLevel[3], toolTwinLevel[1], true);
  else if (toolLevel) levelDoc = toolLevelDoc(toolLevel[1], toolLevel[2], toolLevel[3], false);

  const compare = comparePageFor(path);
  if (compare) {
    html = compareDoc(compare);
  } else if (courseMatch) {
    html = await courseDoc(courseMatch[1]);
  } else if (notesSubjectMatch) {
    html = await notesSubjectDoc(path);
  } else if (hubMatch) {
    html = await subjectHubDoc(path);
  } else if (indexMatch) {
    html = await subjectsIndexDoc(path);
  } else if (notesLevelMatch) {
    html = await notesLevelDoc(path);
  } else if (levelDoc) {
    html = levelDoc;
  } else if (toolBranchMatch) {
    html = toolBranchDoc(path);
  } else if (path === "/courses" || path.startsWith("/courses/category/")) {
    html = await listingDoc(path);
  } else if (PAGES[twinOf ? `/exam-preparation/iitm-bs/tools/${twinOf[1]}` : path]) {
    const key = twinOf ? `/exam-preparation/iitm-bs/tools/${twinOf[1]}` : path;
    const meta = PAGES[key];
    const extra = PAGE_EXTRAS[key];
    const practice = key === "/exam-preparation/iitm-bs/pyqs" ? `\n  ${quizSpacePractice()}` : "";
    const links = extra?.links ? `\n  <h2>Explore</h2>${linkList(extra.links)}` : "";
    const bodyHtml =
      extra || practice
        ? `<h1>${esc(extra?.h1 ?? meta.title)}</h1>\n  <p>${esc(meta.description)}</p>${practice}${links}${extra?.faqs ? `\n  ${faqBody(extra.faqs)}` : ""}`
        : undefined;
    const crumbs = crumbsFor(key);
    const jsonLd = extra?.schema ?? (crumbs ? breadcrumbSchema(crumbs) : undefined);
    html = render({ ...meta, path, canonicalPath: twinOf ? key : undefined, jsonLd, bodyHtml });
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
