/**
 * The subject hubs: one page per IITM BS subject that ties together its notes, its previous
 * year papers on Quiz Space, the calculators and the live batches for its level.
 *
 * ONE builder, imported by the page visitors see (src/pages/IITMSubjectHub.tsx) and by the
 * crawler function (api/seo.ts), so search engines read what visitors read. Imports nothing.
 * The subject → Quiz Space map below is generated from the two sites' subject lists; subjects
 * with no Quiz Space counterpart (mostly labs) link to their level's page there instead.
 */
export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";
export const YOUTUBE_CHANNEL = "https://www.youtube.com/@UnknownIITians";

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** `${branch}/${level}/${subject}` slugs → the subject's slug on Quiz Space. */
const QUIZ_SPACE_SUBJECT: Record<string, string> = {
  "data-science/degree/ai-search-methods-for-problem-solving": "ai-search",
  "data-science/degree/algorithmic-thinking-in-bioinformatics": "algorithmic-thinking-bio",
  "data-science/degree/big-data-and-biological-networks": "bbn",
  "data-science/degree/data-visualization-design": "dvd",
  "data-science/degree/deep-learning": "deep-learning",
  "data-science/degree/software-engineering": "software-engineering",
  "data-science/degree/software-testing": "software-testing",
  "data-science/degree/strategies-for-professional-growth": "spg",
  "data-science/diploma/business-analytics-option-1": "business-analytics",
  "data-science/diploma/business-data-management": "bdm",
  "data-science/diploma/database-management-systems": "dbms",
  "data-science/diploma/introduction-to-deep-learning-and-generative-ai-option-2": "dl-genai",
  "data-science/diploma/machine-learning-foundations": "mlf",
  "data-science/diploma/machine-learning-practice": "mlp",
  "data-science/diploma/machine-learning-techniques": "mlt",
  "data-science/diploma/modern-application-development-i": "mad-1",
  "data-science/diploma/modern-application-development-ii": "mad-2",
  "data-science/diploma/programming-concepts-using-java": "java",
  "data-science/diploma/programming-data-structures-and-algorithms-using-python": "pdsa",
  "data-science/diploma/system-commands": "system-commands",
  "data-science/diploma/tools-in-data-science": "tds",
  "data-science/foundation/computational-thinking": "computational-thinking",
  "data-science/foundation/english-i": "english-1",
  "data-science/foundation/english-ii": "english-2",
  "data-science/foundation/mathematics-for-data-science-i": "maths-1",
  "data-science/foundation/mathematics-for-data-science-ii": "maths-2",
  "data-science/foundation/programming-in-python": "python",
  "data-science/foundation/statistics-for-data-science-i": "statistics-1",
  "data-science/foundation/statistics-for-data-science-ii": "statistics-2",
  "data-science/qualifier/computational-thinking": "computational-thinking",
  "data-science/qualifier/english-i": "english-1",
  "data-science/qualifier/mathematics-for-data-science-i": "maths-1",
  "data-science/qualifier/statistics-for-data-science-i": "statistics-1",
  "electronic-systems/degree/control-engineering": "control-engineering",
  "electronic-systems/degree/electromagnetic-fields-and-transmission-lines": "eftl",
  "electronic-systems/degree/electronic-product-design": "epd",
  "electronic-systems/degree/math-for-electronics-ii": "es-math-2",
  "electronic-systems/diploma/analog-electronic-systems": "aes",
  "electronic-systems/diploma/computer-organisation": "computer-organization",
  "electronic-systems/diploma/digital-signal-processing": "dsp",
  "electronic-systems/diploma/digital-system-design": "dsd",
  "electronic-systems/diploma/python-programming": "es-python",
  "electronic-systems/diploma/sensors-and-applications": "sensors",
  "electronic-systems/diploma/signals-and-systems": "signals-systems",
  "electronic-systems/foundation/digital-systems": "digital-systems",
  "electronic-systems/foundation/electrical-and-electronic-circuits": "eec",
  "electronic-systems/foundation/electronic-systems-thinking-and-circuits": "estc",
  "electronic-systems/foundation/embedded-c-programming": "embedded-c",
  "electronic-systems/foundation/english-i": "es-english-1",
  "electronic-systems/foundation/introduction-to-c-programming": "es-c-programming",
  "electronic-systems/foundation/introduction-to-linux-and-programming": "es-linux",
  "electronic-systems/foundation/math-for-electronics-i": "es-math-1",
  "electronic-systems/qualifier/electronic-systems-thinking-and-circuits": "estc",
  "electronic-systems/qualifier/english-i": "es-english-1",
  "electronic-systems/qualifier/introduction-to-c-programming": "es-c-programming",
  "electronic-systems/qualifier/math-for-electronics-i": "es-math-1"
};

export interface HubInput {
  branch: string; // "Data Science"
  level: string; // "Foundation"
  subject: string; // "Mathematics for Data Science I"
  notes: Array<{ title: string; week: number | null }>;
  batches: Array<{ id: string; title: string; price: number | null }>;
  siblings: string[]; // the other subjects of this branch and level
}

export interface HubContent {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Where to go for each thing, as [href, label]; external ones start with http. */
  links: Array<[string, string]>;
  noteTitles: string[];
  batches: Array<[string, string]>;
  siblingLinks: Array<[string, string]>;
  faqs: Array<{ q: string; a: string }>;
  crumbs: Array<[string, string]>;
}

export function hubPath(branch: string, level: string, subject: string): string {
  return `/iitm-bs/${slugify(branch)}/${slugify(level)}/${slugify(subject)}`;
}

const QUIZ_LEVEL: Record<string, string> = { Qualifier: "foundation", Foundation: "foundation", Diploma: "diploma", Degree: "bs" };

export function quizSpaceLink(branch: string, level: string, subject: string): { href: string; exact: boolean } {
  const mapped = QUIZ_SPACE_SUBJECT[`${slugify(branch)}/${slugify(level)}/${slugify(subject)}`];
  if (mapped) return { href: `${QUIZ_SPACE}/pyq/${mapped}`, exact: true };
  return { href: `${QUIZ_SPACE}/program/${slugify(branch)}/${QUIZ_LEVEL[level] ?? "foundation"}`, exact: false };
}

export function hubContent(i: HubInput): HubContent {
  const { branch, level, subject } = i;
  const path = hubPath(branch, level, subject);
  const notesPath = `/exam-preparation/iitm-bs/notes/${slugify(branch)}/${slugify(level)}/${slugify(subject)}`;
  const tools = `/exam-preparation/iitm-bs/tools/${slugify(branch)}/${slugify(level)}`;
  const quiz = quizSpaceLink(branch, level, subject);
  const n = i.notes.length;

  const title = `IITM BS ${subject}: Notes, PYQs & Tools`;
  const description =
    `IITM BS ${subject} (${level}): ${n > 0 ? `${n} free week-wise notes, ` : "free notes, "}PYQs to practise online, and grade, CGPA and marks calculators.`;
  const intro =
    `${subject} is a ${level}-level subject of the IIT Madras BS degree in ${branch}. ` +
    `Here are the free week-wise notes, previous year question papers you can practise online, and the grade, CGPA and marks calculators for it.`;

  const links: Array<[string, string]> = [
    [notesPath, `${subject} notes: free week-wise PDFs`],
    [quiz.href, quiz.exact ? `Practise ${subject} PYQs online on Quiz Space` : `Practise ${level} PYQs online on Quiz Space`],
    ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
    [`${tools}/grade-calculator`, `${level} grade calculator and score checker`],
    [`${tools}/marks-predictor`, `${level} marks predictor`],
    [`${tools}/cgpa-calculator`, `${level} CGPA calculator`],
    [`${YOUTUBE_CHANNEL}/search?query=${encodeURIComponent(`IITM BS ${subject}`)}`, `Watch IITM BS ${subject} videos on YouTube`],
  ];

  const batches = i.batches.map((b): [string, string] => [`/courses/${b.id}`, b.price ? `${b.title} (₹${Math.round(b.price)})` : `${b.title} (free)`]);

  const faqs = [
    {
      q: `Where can I get IITM BS ${subject} notes?`,
      a: `Unknown IITians has free week-wise ${subject} notes for IITM BS ${branch} ${level}${n > 0 ? `, ${n} in all` : ""}. Open the notes page for this subject and download the PDFs.`,
    },
    {
      q: `Where can I practise IITM BS ${subject} previous year questions?`,
      a: quiz.exact
        ? `On Quiz Space, question by question with the answer key, on a screen that works like the real exam. It is free with a Google sign-in.`
        : `On Quiz Space, which has previous year papers for the ${level} level with answer keys and timed mock tests. It is free with a Google sign-in.`,
    },
    {
      q: `How do I calculate my ${subject} grade?`,
      a: `Use the ${level} grade calculator: pick ${subject}, enter your quiz, assignment and end-term marks, and it shows your total score and letter grade with the course's official formula.`,
    },
    {
      q: `Is there a live batch for IITM BS ${level}?`,
      a: i.batches.length > 0
        ? `Yes. Current live batches include ${i.batches.map((b) => b.title).join("; ")}. See the IITM BS courses page for all batches.`
        : `Unknown IITians runs live IITM BS batches for the Qualifier and Foundation levels. See the IITM BS courses page for what is open now.`,
    },
  ];

  return {
    path,
    title,
    description,
    h1: `IITM BS ${subject}`,
    intro,
    links,
    noteTitles: i.notes.map((x) => x.title),
    batches,
    siblingLinks: i.siblings.filter((s) => s !== subject).map((s): [string, string] => [hubPath(branch, level, s), `${s}`]),
    faqs,
    crumbs: [
      ["Home", "/"],
      ["IITM BS", "/exam-preparation/iitm-bs"],
      [`${branch} ${level}`, `/exam-preparation/iitm-bs/notes/${slugify(branch)}/${slugify(level)}`],
      [subject, path],
    ],
  };
}
