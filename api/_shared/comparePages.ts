/**
 * "Alternative" and "best resources" pages for people comparing IITM BS study sites.
 *
 * Written to help someone choose, not to score points: what other sites say about themselves is
 * taken from their own public pages (September 2026) and said in their words, nothing is claimed
 * about what they lack, and each page says the sites are not affiliated. ONE copy, imported by
 * the page visitors see and by the crawler function (api/seo.ts). Imports nothing.
 */
export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

export interface CompareSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ComparePage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: CompareSection[];
  faqs: Array<{ q: string; a: string }>;
  links: Array<[string, string]>;
}

export const COMPARE_DISCLAIMER =
  "Other sites are described from their own public pages as of September 2026 and may have changed since. Unknown IITians is not affiliated with them. Please check any calculator's result against your course's official grading document.";

const OUR_LINKS: Array<[string, string]> = [
  ["/exam-preparation/iitm-bs/tools/grade-calculator", "IITM BS grade calculator and score checker"],
  ["/exam-preparation/iitm-bs/tools/cgpa-calculator", "IITM BS CGPA calculator"],
  ["/exam-preparation/iitm-bs/tools/marks-predictor", "IITM BS marks predictor"],
  ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"],
  ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
  [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"],
  ["/courses/category/iitm-bs", "IITM BS live courses: Qualifier, Foundation and Diploma"],
];

export const COMPARE_PAGES: ComparePage[] = [
  {
    path: "/best-iitm-bs-resources",
    title: "Best IITM BS Resources: PYQs, Notes, Calculators & Courses",
    description: "A student's guide to IITM BS study resources: where to find previous year papers, notes, grade calculators, live courses and communities.",
    h1: "Best IITM BS Study Resources",
    intro:
      "The IIT Madras BS degree has plenty of study resources, but they solve different problems. This guide sorts them by what you need, so you can choose what fits your term.",
    sections: [
      {
        heading: "Previous year question papers (PYQs)",
        paragraphs: [
          "Past papers are the quickest way to learn what an exam expects. Look for papers organised by subject, exam type (Qualifier, Quiz 1, Quiz 2, OPPE, End Term) and year, ideally with an answer key and a timed mode that feels like the real exam.",
        ],
        bullets: [
          "Unknown IITians' PYQs page has free previous year papers by branch, level, subject and term.",
          "Quiz Space lets you practise those papers online, question by question, on an exam-like screen with answer keys. It is free with a Google sign-in.",
        ],
      },
      {
        heading: "Notes",
        paragraphs: [
          "Week-wise notes that follow the course structure save the most time. Unknown IITians offers free week-wise PDF notes for IITM BS Data Science and Electronic Systems subjects, organised by level and subject.",
        ],
      },
      {
        heading: "Grade, score and CGPA calculators",
        paragraphs: [
          "A good calculator applies your course's official grading formula, so you can see where you stand and what you still need. Unknown IITians offers a grade calculator and score checker, a CGPA calculator and a marks predictor for all four IITM BS branches.",
          "AceGrade (acegrade.in) describes itself as an all-in-one platform with tools for IITM BS students. Whichever you use, compare the result with your course's official grading document.",
        ],
      },
      {
        heading: "Live courses and coaching",
        paragraphs: [
          "If you want lectures and doubt-solving on a schedule, look at live batches. Unknown IITians runs live Qualifier and Foundation courses for IITM BS.",
          "The IITM Student Community site (iitmdatascience.com) lists Qualifier coaching, re-exam coaching, graded assignment help, notes and WhatsApp groups, and links to its YouTube channel.",
        ],
      },
      {
        heading: "Communities",
        paragraphs: [
          "Study groups help most when a subject gets hard. Unknown IITians lists IITM BS communities and study groups on its communities page, and there is a Telegram community for IITM BS students.",
        ],
      },
      {
        heading: "How to choose",
        paragraphs: ["Start from the problem you have this week, not from the site."],
        bullets: [
          "Exam coming up: practise previous year papers under time.",
          "Falling behind on a subject: follow the week-wise notes and, if needed, join a live batch.",
          "Unsure of your grade: run the calculator, then check it against the official document.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the best site for IITM BS PYQs?",
        a: "Unknown IITians and Quiz Space offer free previous year papers by subject, exam and year, and Quiz Space lets you practise them online with answer keys and timed mock tests.",
      },
      {
        q: "Which IITM BS grade calculator should I use?",
        a: "One that applies your course's official grading formula. The Unknown IITians grade calculator covers all four IITM BS branches and shows your total score and grade. Check any result against your course's official grading document.",
      },
      { q: "Are there free IITM BS notes?", a: "Yes. Unknown IITians offers free week-wise notes for IITM BS Data Science and Electronic Systems subjects." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/acegrade-alternative",
    title: "AceGrade Alternative for IITM BS: Grade & Score Tools",
    description: "Looking for an AceGrade alternative? Unknown IITians has a free IITM BS grade calculator, score checker, CGPA calculator and marks predictor.",
    h1: "AceGrade alternative for IITM BS students",
    intro:
      "AceGrade describes itself as an all-in-one platform with tools for IITM BS students. If you want another place to check your scores and plan your grades, here is what Unknown IITians offers, free.",
    sections: [
      {
        heading: "Check your score and grade",
        paragraphs: [
          "Pick your branch, level and course in the grade calculator, then enter your assignment, quiz and end-term marks. It applies the course's official formula and shows your total score and letter grade, so it doubles as an IITM BS score checker.",
        ],
      },
      {
        heading: "Plan your CGPA",
        paragraphs: ["Enter your current CGPA and credits, add the subjects you are taking with their expected grades, and see your updated CGPA."],
      },
      {
        heading: "Work out the marks you still need",
        paragraphs: ["The marks predictor takes the internal scores you already have and your target grade, and tells you the end-term marks you need."],
      },
      {
        heading: "Practise, not just calculate",
        paragraphs: [
          "Knowing your grade helps, but marks come from practice. Unknown IITians has free week-wise notes and previous year papers, and Quiz Space lets you practise those papers online with answer keys.",
        ],
      },
      {
        heading: "Which should you use?",
        paragraphs: [
          "A calculator is only as good as its formula. Check any result against your course's official grading document, and feel free to use two tools for a second opinion.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Unknown IITians an alternative to AceGrade?",
        a: "It covers similar ground for grades and scores, with a grade calculator and score checker, a CGPA calculator and a marks predictor for all four IITM BS branches, and adds free notes, previous year papers and live courses. They are separate sites and you can use both.",
      },
      { q: "Is the Unknown IITians grade calculator free?", a: "Yes. The IITM BS grade calculator, CGPA calculator and marks predictor are completely free." },
      { q: "Which IITM BS branches do the calculators cover?", a: "All four: Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/iitmdatascience-alternative",
    title: "iitmdatascience.com Alternative: IITM BS Notes, PYQs & Courses",
    description: "Comparing IITM BS study sites? Unknown IITians offers live Qualifier and Foundation courses, free notes, previous year papers and grade tools.",
    h1: "iitmdatascience.com alternative for IITM BS students",
    intro:
      "The IITM Student Community site (iitmdatascience.com) lists Qualifier coaching, re-exam coaching, graded assignment help, notes and question papers, and WhatsApp groups. If you are comparing options, here is what Unknown IITians offers.",
    sections: [
      {
        heading: "Qualifier preparation",
        paragraphs: [
          "Unknown IITians runs live IITM BS Qualifier courses with lectures, practice and doubt-solving. Alongside them you get free notes for the Qualifier subjects and previous year Qualifier papers you can practise online on Quiz Space.",
        ],
      },
      {
        heading: "Preparing through the term",
        paragraphs: [
          "Week-wise notes follow each subject's structure, previous year papers cover Quiz 1, Quiz 2, OPPE and End Term, and the calculators show where you stand as marks come in.",
        ],
      },
      {
        heading: "Community",
        paragraphs: ["Unknown IITians lists IITM BS communities and study groups, and runs a Telegram community for IITM BS students."],
      },
      {
        heading: "How to compare",
        paragraphs: ["Match each site to what you need right now."],
        bullets: [
          "Do you want live lectures on a schedule, or self-paced notes and practice?",
          "Do you want previous year papers you can attempt online with answers?",
          "Do you want a grade and CGPA calculator that follows your course's formula?",
        ],
      },
    ],
    faqs: [
      {
        q: "Does Unknown IITians offer IITM BS Qualifier coaching?",
        a: "Yes. It offers live IITM BS Qualifier and Foundation courses with lectures, practice and doubt-solving, plus free notes and previous year papers.",
      },
      { q: "Are IITM BS notes and previous year papers free on Unknown IITians?", a: "Yes. Notes and previous year papers are free, and Quiz Space is free with a Google sign-in." },
      { q: "Can I use more than one IITM BS study site?", a: "Yes. The sites are separate, and many students combine a source of notes, a source of practice papers and a calculator." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/genziitian-alternative",
    title: "Gen-Z IITian Alternative: Free IITM BS Resources",
    description: "Comparing IITM BS study sites? See what Unknown IITians offers at each level, Qualifier to Degree: notes, PYQs, calculators and live courses.",
    h1: "Gen-Z IITian alternative for IITM BS students",
    intro:
      "Gen-Z IITian (genziitian.in) is another site for IITM BS students. If you are comparing options, here is a level-by-level path through the degree with the free resources Unknown IITians offers at each step.",
    sections: [
      {
        heading: "Qualifier",
        paragraphs: ["Start with the Qualifier subjects: free notes, previous year Qualifier papers on Quiz Space, and a live Qualifier course if you want lectures and doubt-solving."],
      },
      {
        heading: "Foundation",
        paragraphs: ["Foundation subjects such as Mathematics for Data Science, Statistics for Data Science, Computational Thinking, English and Python each have week-wise notes, papers to practise and calculators for grades."],
      },
      {
        heading: "Diploma",
        paragraphs: ["Diploma subjects have notes and papers too. Use the CGPA calculator to plan which subjects to take together."],
      },
      {
        heading: "Degree",
        paragraphs: ["For Degree-level subjects you can find notes, previous year papers on Quiz Space and the grade tools, so you can keep the same routine through the whole programme."],
      },
    ],
    faqs: [
      {
        q: "Is Unknown IITians an alternative to Gen-Z IITian?",
        a: "Both help IITM BS students. Unknown IITians offers free notes, previous year papers with online practice on Quiz Space, grade, CGPA and marks calculators, and live Qualifier and Foundation courses. They are separate sites, so you can use both.",
      },
      { q: "Which IITM BS levels does Unknown IITians cover?", a: "Qualifier, Foundation, Diploma and Degree, for Data Science and Electronic Systems, with the calculators covering all four branches." },
    ],
    links: OUR_LINKS,
  },
];

export function comparePageFor(path: string): ComparePage | undefined {
  return COMPARE_PAGES.find((p) => p.path === path);
}
