// Links to Quiz Space (quizspace.unknowniitians.com), Unknown IITians' site for
// practising IITM BS previous year papers question by question, with answer
// keys and timed mock tests.
//
// Every link here points at a page that exists on Quiz Space. A paper links
// to its exam's page for that year where Quiz Space has one, and to the
// exam's page otherwise, so a link is never broken. Plain URLs, no tracking
// parameters: they would only create duplicate addresses for search engines.
//
// The same links appear in the crawler HTML (api/seo.ts), so search engines
// see what visitors see.

export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

export interface QuizSpaceLink {
  href: string;
  label: string;
}

// This site's exam names (the `session` of a paper) → Quiz Space's exam pages.
// OPPE has no Quiz Space page, so those papers get no link.
const EXAMS: Record<string, { slug: string; name: string }> = {
  "Qualifier / Quiz 1": { slug: "qualifier", name: "Qualifier" },
  "Qualifier": { slug: "qualifier", name: "Qualifier" },
  "Quiz 1": { slug: "quiz-1", name: "Quiz 1" },
  "Quiz 2": { slug: "quiz-2", name: "Quiz 2" },
  "End Term": { slug: "end-term", name: "End Term" },
};

// The years Quiz Space has a page for, per exam (/exam/<exam>/<year>),
// as of September 2026. A year missing here links to the exam's own page.
const EXAM_YEARS: Record<string, number[]> = {
  qualifier: [2022, 2023, 2024, 2025],
  "quiz-1": [2021, 2022, 2023, 2024, 2025, 2026],
  "quiz-2": [2021, 2022, 2023, 2024, 2025, 2026],
  "end-term": [2021, 2022, 2023, 2024, 2025, 2026],
};

/** The Quiz Space page for one of this site's PYQ papers, or null (OPPE). */
export function quizSpacePaperLink(session: string | null | undefined, year: number | null | undefined): QuizSpaceLink | null {
  const exam = session ? EXAMS[session.trim()] : undefined;
  if (!exam) return null;
  if (year && EXAM_YEARS[exam.slug]?.includes(year)) {
    return { href: `${QUIZ_SPACE}/exam/${exam.slug}/${year}`, label: `Practise ${exam.name} ${year} PYQs with solutions` };
  }
  return { href: `${QUIZ_SPACE}/exam/${exam.slug}`, label: `Practise ${exam.name} PYQs with solutions` };
}

/** The Quiz Space page for a branch and level of the PYQs tab. */
export function quizSpaceLevelLink(branch: string, level: string): QuizSpaceLink {
  const programme = branch === "electronic-systems" ? "electronic-systems" : "data-science";
  const branchName = programme === "electronic-systems" ? "Electronic Systems" : "Data Science";
  switch (level) {
    case "foundation":
      return { href: `${QUIZ_SPACE}/program/${programme}/foundation`, label: `IITM BS ${branchName} Foundation PYQs with solutions` };
    case "diploma":
      return programme === "electronic-systems"
        ? { href: `${QUIZ_SPACE}/program/electronic-systems/diploma`, label: "IITM BS Electronic Systems Diploma PYQs with solutions" }
        : { href: `${QUIZ_SPACE}/program/data-science`, label: "IITM BS Data Science Diploma PYQs with solutions" };
    case "degree":
      return { href: `${QUIZ_SPACE}/program/${programme}/bs`, label: `IITM BS ${branchName} Degree PYQs with solutions` };
    default:
      return { href: `${QUIZ_SPACE}/program/${programme}`, label: `IITM BS ${branchName} PYQs with solutions` };
  }
}

/** The links every page carries in its footer (and its crawler HTML). */
export const QUIZ_SPACE_FOOTER_LINKS: QuizSpaceLink[] = [
  { href: QUIZ_SPACE, label: "Practise IITM BS PYQs online — Quiz Space" },
  { href: `${QUIZ_SPACE}/exam/qualifier`, label: "IITM BS Qualifier PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/quiz-1`, label: "IITM BS Quiz 1 PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/quiz-2`, label: "IITM BS Quiz 2 PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/end-term`, label: "IITM BS End Term PYQs with solutions" },
];
