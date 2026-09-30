/**
 * The text that sits below the IITM BS pages: an introduction, links and frequently asked
 * questions. ONE copy, imported by both the visitors' pages (src) and the crawler function
 * (api/seo.ts), so search engines are given exactly what visitors read. It imports nothing,
 * because the function it is bundled into may not import from src.
 */
export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

export interface Faq {
  q: string;
  a: string;
}

export interface InfoBlock {
  heading: string;
  intro: string;
  links: Array<[string, string]>;
  faqs: Faq[];
}

export const TOOL_BRANCHES =
  "Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems";

export const NOTES_FAQS: Faq[] = [
  { q: "Are IITM BS notes on Unknown IITians free?", a: "Yes. All IITM BS notes on Unknown IITians are free to download as subject-wise PDFs." },
  {
    q: "Which IITM BS subjects have notes?",
    a: "Notes are available for IITM BS Data Science and Electronic Systems subjects across Qualifier, Foundation, Diploma and Degree levels, organised by branch, level and subject.",
  },
  { q: "Do the notes cover all weeks of a subject?", a: "Yes. Notes are organised week by week for each subject so you can follow the full course." },
];

export const PYQ_FAQS: Faq[] = [
  {
    q: "Where can I find IITM BS previous year question papers?",
    a: "On the Unknown IITians PYQs page, free, organised by branch, level, subject, exam and year. You can also practise the same papers online, question by question with answer keys and timed mock tests, on Quiz Space (quizspace.unknowniitians.com).",
  },
  { q: "Are the IITM BS PYQs free?", a: "Yes. The previous year papers are free to view and download. Quiz Space is free with a Google sign-in." },
  { q: "Which IITM BS exams do the PYQs cover?", a: "Qualifier, Quiz 1, Quiz 2, OPPE and End Term papers, for the Foundation, Diploma and Degree levels." },
  {
    q: "How do I practise IITM BS PYQs online?",
    a: "Open Quiz Space, choose your branch, level and subject, and attempt any paper on a screen that works like the real exam, with the answer key and explanations after each question.",
  },
];

export const HUB_FAQS: Faq[] = [
  {
    q: "What does Unknown IITians offer for the IITM BS degree?",
    a: "Free subject-wise notes, previous year question papers, grade, CGPA and marks calculators, the syllabus and important dates, live Qualifier and Foundation courses, and Quiz Space for practising PYQs online.",
  },
  {
    q: "How do I prepare for the IITM BS Qualifier?",
    a: "Study the subject notes, solve previous year Qualifier papers under timed conditions on Quiz Space, and join a live Qualifier course if you want daily lectures and doubt-solving.",
  },
  {
    q: "Which IITM BS branches and levels are covered?",
    a: "Data Science and Electronic Systems across the Qualifier, Foundation, Diploma and Degree levels, with the calculators also covering Management and Aeronautics.",
  },
];

export const SCORE_CHECK_FAQ: Faq = {
  q: "Can I use this as an IITM BS score checker?",
  a: "Yes. Enter your quiz, assignment and end-term marks and it shows your total score and grade using the course's official grading formula.",
};

export const GRADE_TOOL_FAQS: Faq[] = [
  { q: "Which IITM BS branches does the grade calculator support?", a: `All four IITM BS branches — ${TOOL_BRANCHES} — across the Foundation, Diploma and Degree levels.` },
  {
    q: "How does the IITM BS grade calculator work?",
    a: "Pick your branch, level and course, then enter your assignment eligibility average, quiz and end-term scores. It applies the official published grading formula for that course to estimate your final score and letter grade.",
  },
  { q: "Is the IITM BS grade calculator free?", a: "Yes. The IITM BS grade calculator on Unknown IITians is completely free to use." },
];

export const CGPA_TOOL_FAQS: Faq[] = [
  { q: "Which IITM BS branches does the CGPA calculator cover?", a: `All four IITM BS branches — ${TOOL_BRANCHES}.` },
  {
    q: "How do I calculate my IITM BS CGPA?",
    a: "Enter your current CGPA and completed credits, then add your semester subjects with their expected grades. The calculator weights each course by its credits to give your updated CGPA.",
  },
  { q: "Is the IITM BS CGPA calculator free?", a: "Yes. The IITM BS CGPA calculator is completely free." },
];

export const MARKS_TOOL_FAQS: Faq[] = [
  { q: "Which IITM BS branches does the marks predictor support?", a: `All four IITM BS branches — ${TOOL_BRANCHES}.` },
  {
    q: "What does the IITM BS marks predictor do?",
    a: "Enter the internal scores you already have and your target grade, and it works out the end-term score you need to reach that grade using the course's official grading formula.",
  },
  { q: "Is the IITM BS marks predictor free?", a: "Yes. The IITM BS marks predictor is completely free." },
];

export const quizSpaceLink: [string, string] = [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"];

export const HUB_LINKS: Array<[string, string]> = [
  ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"],
  ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
  ["/exam-preparation/iitm-bs/tools/grade-calculator", "IITM BS grade calculator and score checker"],
  ["/exam-preparation/iitm-bs/tools/cgpa-calculator", "IITM BS CGPA calculator"],
  ["/exam-preparation/iitm-bs/tools/marks-predictor", "IITM BS marks predictor"],
  ["/exam-preparation/iitm-bs/syllabus", "IITM BS syllabus"],
  ["/exam-preparation/iitm-bs/dates", "IITM BS important dates"],
  ["/exam-preparation/iitm-bs/news", "IITM BS news and updates"],
  ["/courses/category/iitm-bs", "IITM BS live courses: Qualifier, Foundation and Diploma"],
  ["/best-iitm-bs-resources", "Best IITM BS study resources: a comparison guide"],
  ["/youtube-channel", "Unknown IITians YouTube channel: free IITM BS lectures"],
  ["/free-iitm-bs-lectures", "Free IITM BS lectures by subject"],
  ["/iitm-bs", "IITM BS subjects: the complete list"],
  ["/iitm-bs-exam-revision-resources", "IITM BS revision: Quiz 1, Quiz 2, End Term and the Qualifier"],
  ["/iitm-bs-courses-guide", "IITM BS courses: how to choose a live batch"],
];

export const TOOL_INFO: Record<string, { heading: string; intro: string; faqs: Faq[] }> = {
  "grade-calculator": {
    heading: "IITM BS Grade Calculator and Score Checker",
    intro:
      "Free IITM BS grade calculator and score checker: enter quiz, assignment and end-term marks to see your total score and letter grade for all four branches.",
    faqs: [...GRADE_TOOL_FAQS, SCORE_CHECK_FAQ],
  },
  "cgpa-calculator": {
    heading: "IITM BS CGPA Calculator",
    intro: "Free IITM BS CGPA calculator: add your subjects, credits and grades to get your CGPA for Foundation, Diploma and Degree, across all four branches.",
    faqs: CGPA_TOOL_FAQS,
  },
  "marks-predictor": {
    heading: "IITM BS Marks Predictor",
    intro:
      "Free IITM BS marks predictor: enter your current scores and target grade to see the end-term marks you need, using each course's official formula.",
    faqs: MARKS_TOOL_FAQS,
  },
};


export const COURSES_FAQS: Faq[] = [
  {
    q: "What live courses does Unknown IITians offer?",
    a: "Live IITM BS batches for the Qualifier, Foundation and Diploma levels, with lectures, practice papers and doubt-solving. The batches open for enrolment are listed on this page.",
  },
  {
    q: "How much do the live batches cost?",
    a: "Prices differ by batch. Some batches have their own price; in others you choose the subjects you want and pay per subject. Each course page shows its price and what it covers.",
  },
  {
    q: "Do you have JEE and NEET courses?",
    a: "Free JEE and NEET notes and previous year questions are on the site. Live JEE and NEET batches appear here when they are open.",
  },
  {
    q: "Where are the free IITM BS resources?",
    a: "Free notes, previous year papers, calculators and Quiz Space are on the IITM BS preparation page.",
  },
];

const COURSES_LINKS: Array<[string, string]> = [
  ["/exam-preparation/iitm-bs", "IITM BS degree preparation: notes, PYQs and tools"],
  ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"],
  ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
  [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"],
];

const JEE_FAQS: Faq[] = [
  { q: "Are JEE notes and PYQs free on Unknown IITians?", a: "Yes. Free JEE notes for Physics, Chemistry and Mathematics, and free JEE previous year question papers, are available to download." },
  { q: "Which JEE subjects have notes?", a: "Physics, Chemistry and Mathematics, as subject-wise PDF notes." },
];

const NEET_FAQS: Faq[] = [
  { q: "Are NEET notes and PYQs free on Unknown IITians?", a: "Yes. Free NEET notes for Physics, Chemistry and Biology, and free NEET previous year question papers, are available to download." },
  { q: "Which NEET subjects have notes?", a: "Physics, Chemistry and Biology, as subject-wise PDF notes." },
];

/** What to show below the page at this address, or null where the page needs nothing more. */
export function infoFor(pathname: string): InfoBlock | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "courses" && (parts.length === 1 || (parts[1] === "category" && parts.length === 3))) {
    return {
      heading: "About IITM BS live courses",
      intro: "Live batches from Unknown IITians, with lectures, practice papers and doubt-solving. Open a course to see its dates, price and what it covers.",
      links: COURSES_LINKS,
      faqs: COURSES_FAQS,
    };
  }
  if (parts[0] === "exam-preparation" && (parts[1] === "jee" || parts[1] === "neet") && parts.length <= 3) {
    const exam = parts[1] === "jee" ? "JEE" : "NEET";
    return {
      heading: `${exam} preparation: free notes and PYQs`,
      intro: `Free ${exam} notes and previous year question papers from Unknown IITians, to download and practise.`,
      links: [[`/exam-preparation/${parts[1]}/notes`, `${exam} notes: free subject-wise PDFs`], [`/exam-preparation/${parts[1]}/pyqs`, `${exam} PYQs: previous year question papers`]],
      faqs: parts[1] === "jee" ? JEE_FAQS : NEET_FAQS,
    };
  }
  if (parts[0] !== "exam-preparation" || parts[1] !== "iitm-bs") return null;

  if (parts.length === 2) {
    return {
      heading: "IITM BS Degree Preparation",
      intro:
        "All you need for the IIT Madras BS degree: free notes, previous year papers, grade & CGPA calculators, syllabus, dates and live Qualifier courses.",
      links: [quizSpaceLink, ...HUB_LINKS],
      faqs: HUB_FAQS,
    };
  }
  const tab = parts[2];
  if (tab === "pyqs" && parts.length === 3) {
    return {
      heading: "IITM BS PYQs: previous year question papers",
      intro:
        "Free IITM BS previous year question papers: Qualifier, Quiz 1, Quiz 2, OPPE and End Term. Download PDFs or practise online with answer keys on Quiz Space.",
      links: [quizSpaceLink, ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"], ["/exam-preparation/iitm-bs/tools/grade-calculator", "IITM BS grade calculator and score checker"]],
      faqs: PYQ_FAQS,
    };
  }
  if (tab === "notes" && parts.length === 3) {
    return {
      heading: "IITM BS Notes",
      intro: "Free IITM BS notes for Data Science and Electronic Systems, organised by branch, level and subject — download subject-wise PDF notes.",
      links: [["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"], quizSpaceLink],
      faqs: NOTES_FAQS,
    };
  }
  if (tab === "tools" && (parts.length === 4 || parts.length === 6)) {
    // /tools/<tool>, or /tools/<branch>/<level>/<tool>
    const info = TOOL_INFO[parts[parts.length - 1]];
    if (info) {
      return { ...info, links: HUB_LINKS.filter(([href]) => href.includes("/tools/") || href.endsWith("/pyqs") || href.endsWith("/notes")) };
    }
  }
  return null;
}
