/**
 * Buyer's guides for IITM BS students choosing study resources: what to look for in past papers,
 * notes, calculators and courses, and where Unknown IITians' own resources fit.
 *
 * These pages NEVER name or point at any other site or brand — a deliberate rule, so nothing
 * here can be read as a claim about, or a use of the name of, anyone else. ONE copy, imported by
 * the page visitors see and by the crawler function (api/seo.ts). Imports nothing.
 */
export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

import type { ComparePage } from "./pageTypes";
import { GUIDE_PAGES } from "./guidePages";

export type { ComparePage, CompareSection } from "./pageTypes";

export const COMPARE_DISCLAIMER =
  "Unknown IITians is an independent study-resources site and is not affiliated with or endorsed by IIT Madras. Please check official sources for admissions, fees, dates and grading rules, and check any calculator's result against your course's official grading document.";

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
    description: "A student's guide to IITM BS study resources: what to look for in previous year papers, notes, grade calculators, live courses and communities.",
    h1: "Best IITM BS Study Resources",
    intro:
      "The IIT Madras BS degree has plenty of study resources, but they solve different problems. This guide sorts them by what you need and what to look for, so you can choose what fits your term.",
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
          "A good calculator applies your course's official grading formula, covers your branch and level, and shows both your total score and your grade. Unknown IITians offers a grade calculator and score checker, a CGPA calculator and a marks predictor for all four IITM BS branches.",
        ],
      },
      {
        heading: "Live courses and coaching",
        paragraphs: [
          "If you want lectures and doubt-solving on a schedule, look at live batches: check what level they cover, how long they run, and whether recordings and practice papers are included. Unknown IITians runs live Qualifier and Foundation courses for IITM BS.",
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
        paragraphs: ["Start from the problem you have this week."],
        bullets: [
          "Exam coming up: practise previous year papers under time.",
          "Falling behind on a subject: follow the week-wise notes and, if needed, join a live batch.",
          "Unsure of your grade: run the calculator, then check it against the official document.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where can I find IITM BS PYQs?",
        a: "Unknown IITians and Quiz Space offer free previous year papers by subject, exam and year, and Quiz Space lets you practise them online with answer keys and timed mock tests.",
      },
      {
        q: "What should an IITM BS grade calculator do?",
        a: "It should apply your course's official grading formula and cover your branch and level. The Unknown IITians grade calculator covers all four IITM BS branches and shows your total score and grade. Check any result against your course's official grading document.",
      },
      { q: "Are there free IITM BS notes?", a: "Yes. Unknown IITians offers free week-wise notes for IITM BS Data Science and Electronic Systems subjects." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/iitm-bs-grade-and-score-tools",
    title: "IITM BS Grade & Score Tools: How to Check Your Score",
    description: "How to check your IITM BS score and grade: what a good calculator does, how to use one step by step, and free tools for every branch.",
    h1: "IITM BS grade and score tools: how to check your score",
    intro:
      "Checking your score and grade early tells you where to spend your effort. Here is what a good IITM BS grade calculator does, how to use one, and the free tools Unknown IITians offers for every branch.",
    sections: [
      {
        heading: "What a good calculator does",
        paragraphs: [
          "It should follow the official grading formula of your course, cover your branch and level, take your assignment, quiz and end-term marks, and show both your total score and your letter grade.",
        ],
        bullets: [
          "Covers your branch: Data Science, Management, Aeronautics or Electronic Systems.",
          "Uses the course's published formula, not a rough guess.",
          "Shows what you still need, not just what you have.",
        ],
      },
      {
        heading: "Check your score and grade",
        paragraphs: [
          "In the Unknown IITians grade calculator, pick your branch, level and course, then enter your assignment, quiz and end-term marks. It shows your total score and letter grade, so it works as an IITM BS score checker.",
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
        heading: "Then practise",
        paragraphs: ["Knowing your grade helps, but marks come from practice: free week-wise notes, and previous year papers you can attempt online on Quiz Space with answer keys."],
      },
    ],
    faqs: [
      { q: "Is there a free IITM BS score checker?", a: "Yes. The Unknown IITians grade calculator shows your total score and letter grade from your assignment, quiz and end-term marks, and it is completely free." },
      { q: "Which IITM BS branches do the calculators cover?", a: "All four: Data Science and Applications, Management and Data Science, Aeronautics and Space Technology, and Electronic Systems." },
      { q: "How accurate is an IITM BS grade calculator?", a: "It is as accurate as the formula it uses. Compare the result with your course's official grading document, and re-check it when the course's marking scheme changes." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/iitm-bs-qualifier-preparation-resources",
    title: "IITM BS Qualifier Preparation: Notes, PYQs & Live Courses",
    description: "Preparing for the IITM BS Qualifier? What to study, how to practise with previous year papers, and the free notes and live courses available.",
    h1: "IITM BS Qualifier preparation resources",
    intro:
      "The Qualifier is where most students first meet the IITM BS routine. Here is a simple way to prepare with notes, previous year papers and, if you want lectures, a live course.",
    sections: [
      {
        heading: "Learn the subjects week by week",
        paragraphs: ["Follow the week-wise notes for each Qualifier subject in order, and finish each week's practice before moving on. Unknown IITians has free notes for the Qualifier subjects."],
      },
      {
        heading: "Practise previous year papers",
        paragraphs: [
          "Attempt previous year Qualifier papers under time, then review every mistake. Quiz Space lets you attempt them online on an exam-like screen with answer keys, free with a Google sign-in.",
        ],
      },
      {
        heading: "If you want lectures and doubt-solving",
        paragraphs: ["Unknown IITians runs live IITM BS Qualifier courses with lectures, practice and doubt-solving. Compare batch dates, what is covered and what practice is included before you join."],
      },
      {
        heading: "Join a community",
        paragraphs: ["Study groups make hard weeks easier. See the IITM BS communities page and the Telegram community for IITM BS students."],
      },
    ],
    faqs: [
      { q: "How do I prepare for the IITM BS Qualifier?", a: "Study the subject notes week by week, solve previous year Qualifier papers under timed conditions on Quiz Space, and join a live Qualifier course if you want lectures and doubt-solving." },
      { q: "Does Unknown IITians offer IITM BS Qualifier coaching?", a: "Yes. It offers live IITM BS Qualifier and Foundation courses, plus free notes and previous year papers." },
      { q: "Are Qualifier notes and papers free?", a: "Yes. The notes and previous year papers are free, and Quiz Space is free with a Google sign-in." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/iitm-bs-study-path-by-level",
    title: "IITM BS Study Path: Resources for Every Level",
    description: "A level-by-level path through the IITM BS degree, Qualifier to Degree, with the free notes, PYQs, calculators and courses for each step.",
    h1: "IITM BS study path: resources for every level",
    intro:
      "A simple path through the IIT Madras BS degree, with the free resources Unknown IITians offers at each step, so you can keep one routine from the Qualifier to the Degree.",
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
      { q: "Which IITM BS levels does Unknown IITians cover?", a: "Qualifier, Foundation, Diploma and Degree, for Data Science and Electronic Systems, with the calculators covering all four branches." },
      { q: "Where do I start with IITM BS resources?", a: "Pick your level, follow the week-wise notes for your subjects, and practise previous year papers on Quiz Space. Each subject also has its own page tying its notes, papers and calculators together." },
    ],
    links: OUR_LINKS,
  },
  {
    path: "/iitm-bs-official-website-guide",
    title: "IITM BS Official Website, Portal & Login: An Unofficial Guide",
    description: "Looking for the official IITM BS website? An unofficial student guide to what is published officially, and the free notes, PYQs and calculators we add.",
    h1: "IITM BS official website and portal: an unofficial guide",
    intro:
      "Unknown IITians is an independent study-resources site. It is not IIT Madras, and it is not affiliated with or endorsed by IIT Madras. If you are looking for the official IITM BS website, this guide explains what the official sources are for and what an independent site like ours adds.",
    sections: [
      {
        heading: "Is this the official IITM BS website?",
        paragraphs: [
          "No. Unknown IITians is run by students and educators, independent of IIT Madras. Anything that must be exact, such as admissions, fees, eligibility, official dates, course registration and results, is published by IIT Madras, so check the official IITM BS website and your student portal for it.",
        ],
      },
      {
        heading: "What the official sources are for",
        paragraphs: ["Use the official website and student login for the things only the institute can confirm."],
        bullets: [
          "Admissions, eligibility and the qualifier process.",
          "Fees and payments.",
          "The academic calendar, exam schedules and notices.",
          "Course registration, grades and results in your student login.",
          "The official course lectures and assignments.",
        ],
      },
      {
        heading: "What Unknown IITians adds",
        paragraphs: ["Independent study help that goes alongside the official material:"],
        bullets: [
          "Free week-wise notes for Data Science and Electronic Systems subjects.",
          "Previous year question papers, and Quiz Space to practise them online with answer keys.",
          "Grade, score, CGPA and marks calculators for all four IITM BS branches.",
          "Live Qualifier and Foundation courses, and study communities.",
        ],
      },
      {
        heading: "Using both",
        paragraphs: [
          "Use the official portal for anything that has to be exact, and independent resources to study and practise. If an independent site and the official source ever differ, the official source is right.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is Unknown IITians the official IITM BS website?",
        a: "No. Unknown IITians is an independent study-resources site and is not affiliated with or endorsed by IIT Madras. For admissions, fees, official dates and results, use the official IITM BS website and your student portal.",
      },
      {
        q: "Where do I find the official IITM BS website?",
        a: "Look for the IIT Madras BS degree programme's own website (study.iitm.ac.in) and use its student login for registration, grades and results.",
      },
      {
        q: "Are Unknown IITians' notes and papers official?",
        a: "No. They are independent study resources. Check the official announcements for exam rules, syllabus changes and anything else that must be exact.",
      },
      { q: "Does Unknown IITians offer free IITM BS notes and papers?", a: "Yes. The notes and previous year papers are free, and Quiz Space is free with a Google sign-in." },
    ],
    links: [["https://study.iitm.ac.in", "The official IIT Madras BS degree website (opens in a new tab)"], ...OUR_LINKS],
  },
];

/** Every guide page: the study-resources guides and the channel and course guides. */
export const ALL_GUIDES: ComparePage[] = [...COMPARE_PAGES, ...GUIDE_PAGES];

export function comparePageFor(path: string): ComparePage | undefined {
  return ALL_GUIDES.find((p) => p.path === path);
}
