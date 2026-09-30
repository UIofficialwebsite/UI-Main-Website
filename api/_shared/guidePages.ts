/**
 * The channel page and the guides around it: free lectures, revision, courses, and the
 * "is IITM BS right for me" questions people search before they choose.
 *
 * What is stated as fact here is on record: the playlists are the channel's own (23, with their
 * real links), the subjects are the site's, and the figures about reach are the owner's own
 * statements about their channel and students. Guidance is framed as guidance, not as claims about
 * anyone else. ONE copy, imported by the visitor's page and by the crawler function. Imports only types.
 */
import type { ComparePage } from "./pageTypes";

const YT = "https://www.youtube.com/playlist?list=";
export const CHANNEL_URL = "https://www.youtube.com/@UnknownIITians";
const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

/** The channel's playlists, by what they are for. */
const PL = {
  maths1: [YT + "PLK6azu2-_Udwbim79g_a7mos4i6Jk192d", "Mathematics 1: complete course series"],
  maths1Qual: [YT + "PLK6azu2-_UdwwRxraUbawULoTV1Pd1JeJ", "Mathematics 1: Qualifier preparation series"],
  maths1En: [YT + "PLK6azu2-_UdxW1v4ibcPMO7MEahgkKo6l", "Mathematics 1: English medium"],
  maths2: [YT + "PLK6azu2-_Udxej27gJux4F4AqtSAbXa8g", "Mathematics 2: complete course series"],
  stats1: [YT + "PLKPuDldjQeLs", "Statistics 1: complete course series"],
  stats1Qual: [YT + "PLK6azu2-_UdyS6crAP5obnwplVJiJjxbn", "Statistics 1: Qualifier preparation series"],
  stats1En: [YT + "PLK6azu2-_Udw6tGcznuPUEOBRNddqNO7I", "Statistics 1: English medium"],
  stats2: [YT + "PLK6azu2-_Udw2IRznvzoNs32GF203FdJT", "Statistics 2: complete course series"],
  ct: [YT + "PLK6azu2-_UdyfI6Z9y7fde6YKk-_ZLkq2", "Computational Thinking: complete detailed series"],
  ctQual: [YT + "PLK6azu2-_Udx-q2HIfFwpKdbNh6_br6cL", "Computational Thinking: Qualifier preparation series"],
  ctEn: [YT + "PLK6azu2-_UdwBVDl1GU2LED40zkNWegrG", "Computational Thinking: English medium"],
  python: [YT + "PLK6azu2-_Udznim2WVGXf5nVdIAI6D68T", "Programming in Python: complete detailed series"],
  oppe: [YT + "PLK6azu2-_UdycS9DiuNzXbQ8k8fRuuVVf", "Programming in Python: OPPE-focused series"],
  dbms: [YT + "PLK6azu2-_Udwj33fXqyFIrCUZEtguozYI", "Database Management Systems: complete course series"],
  pdsa: [YT + "PLS76msjGP8fs", "Programming, Data Structures and Algorithms using Python: complete course series"],
  quiz1: [YT + "PLK6azu2-_UdwYyTHqWlJFxxgtQRFk-0Kh", "Fastrack revision series: Foundation Quiz 1"],
  quiz2: [YT + "PLK6azu2-_UdxLOm51uDSkj7xrl2YCShjY", "Fastrack revision series: Foundation Quiz 2"],
  endTerm: [YT + "PLK6azu2-_UdzGlFtVjEh6wUDAxlnLiJhe", "Fastrack revision series: Foundation End Semester"],
  qualifier: [YT + "PLK6azu2-_UdyRoGm2kzEfm_fRcRuemz0z", "Fastrack one-shot revision series: Qualifier"],
  qualifierGuide: [YT + "PLK6azu2-_UdzPxRazpNze1HvCjeGmiwNG", "Know all about the IIT Madras Qualifier"],
} as const;

const L = (...keys: Array<keyof typeof PL>): Array<[string, string]> => keys.map((k) => [PL[k][0], PL[k][1]]);

const FOUNDATION_LECTURES = L("maths1", "maths1En", "maths2", "stats1", "stats1En", "stats2", "ct", "ctEn", "python", "oppe");
const DIPLOMA_LECTURES = L("dbms", "pdsa");
const QUALIFIER_LECTURES = L("maths1Qual", "stats1Qual", "ctQual", "qualifierGuide");
const REVISION = L("quiz1", "quiz2", "endTerm", "qualifier", "oppe");

const WHERE_TO_GO: Array<[string, string]> = [
  [CHANNEL_URL, "Unknown IITians on YouTube"],
  ["/free-iitm-bs-lectures", "Free IITM BS lectures by subject"],
  ["/iitm-bs-exam-revision-resources", "Revision for Quiz 1, Quiz 2, End Term and the Qualifier"],
  ["/exam-preparation/iitm-bs/notes", "IITM BS notes: free subject-wise PDFs"],
  ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"],
  [QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"],
  ["/courses", "IITM BS live courses and batches"],
];

const h = (subject: string, level: "foundation" | "diploma") => `/iitm-bs/data-science/${level}/${subject}`;

export const GUIDE_PAGES: ComparePage[] = [
  {
    path: "/youtube-channel",
    title: "Unknown IITians YouTube Channel: Free IITM BS Lectures",
    description: "The Unknown IITians YouTube channel: 300+ free IITM BS lectures for Foundation and Diploma subjects, Fastrack revision and Qualifier prep. 15 lakh+ views.",
    h1: "Unknown IITians YouTube channel: free IITM BS lectures",
    intro:
      "Unknown IITians started on YouTube in September 2024 with one aim: to make IITM BS study material free and clear. The channel now has over 300 videos, more than 15 lakh views till date and over 9,800 subscribers, and over 1 lakh students have learned from Unknown IITians.",
    sections: [
      {
        heading: "What you can watch for free",
        paragraphs: ["Every playlist below is free to watch. Each subject series follows the course week by week, with previous year questions and the most important questions alongside the concepts."],
        bullets: [
          "Foundation: Mathematics 1 and 2, Statistics 1 and 2, Computational Thinking and Programming in Python.",
          "Diploma: Database Management Systems, and Programming, Data Structures and Algorithms using Python.",
          "Qualifier: preparation series for Mathematics 1, Statistics 1 and Computational Thinking, and a guide to the Qualifier.",
          "Revision: Fastrack series for Foundation Quiz 1, Quiz 2 and End Semester, and a one-shot Qualifier revision.",
          "Programming in Python has a series focused on the OPPE.",
        ],
      },
      { heading: "Foundation lectures", paragraphs: ["Watch these free playlists, including English-medium series for Mathematics 1, Statistics 1 and Computational Thinking."], links: FOUNDATION_LECTURES },
      { heading: "Diploma lectures", paragraphs: ["Free courses for two Diploma subjects."], links: DIPLOMA_LECTURES },
      { heading: "Qualifier preparation", paragraphs: ["Start here if you are preparing for the Qualifier."], links: QUALIFIER_LECTURES },
      {
        heading: "Revision for exam weeks",
        paragraphs: ["Short, exam-focused series to revise the night before: Quiz 1, Quiz 2, End Semester, the Qualifier and the Python OPPE."],
        links: REVISION,
      },
      {
        heading: "Beyond YouTube",
        paragraphs: [
          "Every subject also has a page on this website with free week-wise notes, previous year papers and grade calculators, and Quiz Space lets you practise those papers online with answer keys. If you want live lectures and doubt-solving on a schedule, see the live batches.",
        ],
        links: WHERE_TO_GO.slice(1),
      },
      {
        heading: "Teach with us",
        paragraphs: ["Unknown IITians is always looking for educators who can teach IITM BS subjects clearly. See how to apply on the educators page."],
        links: [["/iitm-bs-educators", "Teach IITM BS subjects with Unknown IITians"]],
      },
    ],
    faqs: [
      { q: "Is the Unknown IITians YouTube channel free?", a: "Yes. All the lecture playlists are free to watch on YouTube." },
      {
        q: "Which subjects have free lectures?",
        a: "Foundation: Mathematics 1 and 2, Statistics 1 and 2, Computational Thinking and Programming in Python. Diploma: Database Management Systems, and Programming, Data Structures and Algorithms using Python. There are also Qualifier preparation and Fastrack revision series.",
      },
      { q: "Are there revision videos before Quiz and End Term exams?", a: "Yes. There are Fastrack revision series for Foundation Quiz 1, Quiz 2 and End Semester, a one-shot Qualifier revision, and a Python OPPE-focused series." },
      { q: "How many students has Unknown IITians helped?", a: "Over 1 lakh students have learned from Unknown IITians through the YouTube channel, this website and Quiz Space." },
      { q: "Are there English-medium lectures?", a: "Yes. There are English-medium series for Mathematics 1, Statistics 1 and Computational Thinking." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/free-iitm-bs-lectures",
    title: "Free IITM BS Lectures: Foundation & Diploma Subjects",
    description: "Free IITM BS video lectures by subject: Maths 1 and 2, Stats 1 and 2, Computational Thinking, Python, DBMS and PDSA, with notes and PYQs for each.",
    h1: "Free IITM BS lectures by subject",
    intro:
      "Every lecture on this page is free on the Unknown IITians YouTube channel. Pick your subject: each one links to its full playlist, and to its page here with free notes, previous year papers and grade calculators.",
    sections: [
      { heading: "Mathematics for Data Science I (Maths 1)", paragraphs: ["Complete course, a Qualifier preparation series and an English-medium series."], links: [...L("maths1", "maths1Qual", "maths1En"), [h("mathematics-for-data-science-i", "foundation"), "Maths 1: notes, PYQs and tools"]] },
      { heading: "Mathematics for Data Science II (Maths 2)", paragraphs: ["Complete course series with previous year questions."], links: [...L("maths2"), [h("mathematics-for-data-science-ii", "foundation"), "Maths 2: notes, PYQs and tools"]] },
      { heading: "Statistics for Data Science I (Stats 1)", paragraphs: ["Complete course, a Qualifier preparation series and an English-medium series."], links: [...L("stats1", "stats1Qual", "stats1En"), [h("statistics-for-data-science-i", "foundation"), "Stats 1: notes, PYQs and tools"]] },
      { heading: "Statistics for Data Science II (Stats 2)", paragraphs: ["Complete course series."], links: [...L("stats2"), [h("statistics-for-data-science-ii", "foundation"), "Stats 2: notes, PYQs and tools"]] },
      { heading: "Computational Thinking (CT)", paragraphs: ["Complete series, a Qualifier preparation series and an English-medium series."], links: [...L("ct", "ctQual", "ctEn"), [h("computational-thinking", "foundation"), "Computational Thinking: notes, PYQs and tools"]] },
      { heading: "Programming in Python", paragraphs: ["Complete series, and a series focused on the OPPE."], links: [...L("python", "oppe"), [h("programming-in-python", "foundation"), "Python: notes, PYQs and tools"]] },
      { heading: "Database Management Systems (DBMS)", paragraphs: ["A Diploma subject: complete course series."], links: [...L("dbms"), [h("database-management-systems", "diploma"), "DBMS: notes, PYQs and tools"]] },
      { heading: "Programming, Data Structures and Algorithms using Python (PDSA)", paragraphs: ["A Diploma subject: complete course series."], links: [...L("pdsa"), [h("programming-data-structures-and-algorithms-using-python", "diploma"), "PDSA: notes, PYQs and tools"]] },
      { heading: "Revision series", paragraphs: ["Fastrack series for the week before an exam."], links: REVISION },
    ],
    faqs: [
      { q: "Where can I watch free IITM BS lectures?", a: "On the Unknown IITians YouTube channel. This page links to the playlist for each subject." },
      { q: "Which Foundation subjects have free lectures?", a: "Mathematics 1 and 2, Statistics 1 and 2, Computational Thinking and Programming in Python." },
      { q: "Do the lectures come with notes and previous year papers?", a: "Each subject has a page on this site with free week-wise notes and previous year papers, and Quiz Space lets you practise the papers online." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/iitm-bs-exam-revision-resources",
    title: "IITM BS Revision: Quiz 1, Quiz 2, End Term & Qualifier",
    description: "Revise for IITM BS Quiz 1, Quiz 2, End Term, the Qualifier and the Python OPPE: free Fastrack series, previous year papers to practise, and grade tools.",
    h1: "IITM BS revision: Quiz 1, Quiz 2, End Term and the Qualifier",
    intro:
      "Exam week needs a short, focused plan. Here are the free Fastrack revision series for each exam, the previous year papers to practise under time, and the tools to check where you stand.",
    sections: [
      { heading: "Fastrack revision series (free on YouTube)", paragraphs: ["Exam-focused series for the days before each exam."], links: REVISION },
      {
        heading: "A simple revision plan",
        paragraphs: ["Use the days you have, not the days you wish you had."],
        bullets: [
          "Two days before: watch the Fastrack series for your exam at normal speed and note the topics you cannot explain.",
          "The day before: attempt a previous year paper under time on Quiz Space, then review every mistake.",
          "The morning of: revise your notes and formulas; do not start new topics.",
        ],
      },
      { heading: "Practise previous year papers", paragraphs: ["Quiz Space has previous year papers question by question, with the answer key, on a screen that works like the real exam. It is free with a Google sign-in."], links: [[QUIZ_SPACE, "Practise IITM BS PYQs online on Quiz Space"], ["/exam-preparation/iitm-bs/pyqs", "IITM BS PYQs: previous year question papers"]] },
      { heading: "Know where you stand", paragraphs: ["Use the grade calculator and marks predictor to see what score you still need."], links: [["/exam-preparation/iitm-bs/tools/grade-calculator", "IITM BS grade calculator and score checker"], ["/exam-preparation/iitm-bs/tools/marks-predictor", "IITM BS marks predictor"]] },
    ],
    faqs: [
      { q: "Are there IITM BS Quiz 1 and Quiz 2 revision videos?", a: "Yes. There are free Fastrack revision series for Foundation Quiz 1 and Quiz 2 on the Unknown IITians YouTube channel." },
      { q: "Is there an End Term revision series?", a: "Yes. There is a Fastrack revision series for the Foundation End Semester." },
      { q: "Is there a one-shot revision for the Qualifier?", a: "Yes. There is a Fastrack one-shot revision series for the IITM BS Qualifier." },
      { q: "How do I prepare for the Python OPPE?", a: "Watch the OPPE-focused Programming in Python series and practise previous year papers under time." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/iitm-bs-courses-guide",
    title: "IITM BS Courses: Live Batches for Qualifier, Foundation & Diploma",
    description: "How to choose an IITM BS course: live Qualifier, Foundation and Diploma batches, how batch pricing works, and the free lectures, notes and papers to start with.",
    h1: "IITM BS courses: how to choose a live batch",
    intro:
      "If you want lectures and doubt-solving on a schedule, a live batch can help. Here is how Unknown IITians' batches work, how the pricing works, and how to choose, with plenty of free material to try first.",
    sections: [
      {
        heading: "What the batches are",
        paragraphs: ["Unknown IITians runs live IITM BS batches around each exam window: a Qualifier batch, Foundation quiz batches, and Diploma batches such as project preparation. Each has its own dates, so check the start date on the course page."],
        links: [["/courses", "All IITM BS live courses and batches"]],
      },
      {
        heading: "How pricing works",
        paragraphs: ["Prices are affordable and differ by batch. Some batches have one price for the full batch; in others you pick only the subjects you need and pay per subject, so you never pay for what you will not use. The price and what it covers are on every course page."],
      },
      {
        heading: "How to choose",
        bullets: [
          "Choose the level you are sitting: Qualifier, Foundation or Diploma.",
          "Choose the subjects that worry you most, not all of them.",
          "Check the dates: a batch is most useful when it starts before your exam window.",
        ],
        paragraphs: ["Start from the problem you have this term."],
      },
      { heading: "Try the free material first", paragraphs: ["Free lectures, notes and papers cover a lot. Use them, then add a live batch where you need the extra push."], links: WHERE_TO_GO.slice(1) },
    ],
    faqs: [
      { q: "What live courses does Unknown IITians offer for IITM BS?", a: "Live batches for the Qualifier, Foundation and Diploma levels, with lectures, practice papers and doubt-solving. The batches open now are on the courses page." },
      { q: "How much do the batches cost?", a: "Prices differ by batch: some have one price for the full batch, and in others you pay per subject. Each course page shows its price." },
      { q: "Are there free IITM BS lectures too?", a: "Yes. Free lectures for the Foundation and Diploma subjects are on the Unknown IITians YouTube channel." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/iitm-bs-vs-jee-neet-alternative",
    title: "IITM BS as an Alternative to the JEE and NEET Route",
    description: "Is the IITM BS degree an alternative to the JEE or NEET route? How admission works, who it suits, who it does not, and how to start preparing.",
    h1: "IITM BS: an alternative to the JEE and NEET route?",
    intro:
      "Many students who miss a JEE or NEET target, or want a different route, ask whether the IIT Madras BS degree is an option. Here is an honest way to think about it.",
    sections: [
      {
        heading: "How admission works",
        paragraphs: ["IITM BS admission is through IIT Madras's own qualifier process, not through JEE. Eligibility, dates and fees are published by IIT Madras, so read them on the official IITM BS website before you decide."],
      },
      {
        heading: "Who it can suit",
        bullets: [
          "Students interested in data science, programming or electronic systems.",
          "Students who can study on their own schedule and stay consistent.",
          "Students who want a degree in these fields from IIT Madras without giving the JEE.",
        ],
        paragraphs: ["It is a good fit when the subject interests you, not only when a rank fell short."],
      },
      {
        heading: "Who should think twice",
        bullets: [
          "NEET aspirants aiming for medicine: IITM BS is a science degree in Data Science or Electronic Systems and does not lead to a medical degree.",
          "Students who need a fixed classroom routine: the course is online and self-driven.",
        ],
        paragraphs: ["Be honest about the goal you want the degree to serve."],
      },
      {
        heading: "How to start",
        paragraphs: ["The Qualifier is the first step. Free lectures, notes and previous year papers help you prepare for it."],
        links: [
          ["/iitm-bs-qualifier-preparation-resources", "IITM BS Qualifier preparation resources"],
          ["/free-iitm-bs-lectures", "Free IITM BS lectures by subject"],
          ["/iitm-bs-official-website-guide", "IITM BS official website: an unofficial guide"],
        ],
      },
    ],
    faqs: [
      { q: "Is IITM BS an alternative to JEE?", a: "It is a different route into an IIT Madras degree: admission is through IIT Madras's qualifier process rather than JEE. Check the official IITM BS website for current eligibility and dates." },
      { q: "Can NEET aspirants join IITM BS?", a: "The degree is in Data Science or Electronic Systems, so it does not lead to a medical degree. It suits students who want to study those fields." },
      { q: "How do I prepare for the IITM BS Qualifier?", a: "Use the free Qualifier preparation lectures, the subject notes and previous year Qualifier papers, and join a live batch if you want lectures on a schedule." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/iitm-bs-vs-regular-engineering-college",
    title: "IITM BS vs a Regular Engineering College: How to Decide",
    description: "Comparing the IITM BS degree with a regular engineering college? A simple way to decide: format, pace, cost, labs, campus life and goals, and what to check.",
    h1: "IITM BS vs a regular engineering college: how to decide",
    intro:
      "Choosing between the IIT Madras BS degree and a regular engineering college is a personal decision. Here are the questions worth asking, and where to check the answers.",
    sections: [
      {
        heading: "Format and pace",
        paragraphs: ["IITM BS is online and self-paced within each term, with structured levels. A regular college gives daily classes and a fixed timetable. Which one you keep up with matters more than which one sounds better."],
      },
      {
        heading: "What you will study",
        paragraphs: ["IITM BS offers Data Science and Applications, Electronic Systems, Management and Data Science, and Aeronautics and Space Technology. A regular engineering college offers its own branches. Compare the subjects, not the names."],
      },
      {
        heading: "Cost, labs and campus life",
        bullets: [
          "Cost: check the fee structure on the official IITM BS website and on the college's own.",
          "Labs and hands-on work: ask how each programme teaches them.",
          "Campus life and networking: online study offers less of these, so plan how you will find peers, for example through study groups and communities.",
        ],
        paragraphs: ["Ask for the real numbers and rules from each institution."],
      },
      {
        heading: "Your goals",
        paragraphs: ["Write down what you want in three years: a job, a startup, higher studies. Then ask each programme how it helps with that, and talk to students who are already there."],
        links: [["/best-iitm-bs-resources", "Best IITM BS study resources: a guide"], ["/iitm-bs-official-website-guide", "IITM BS official website: an unofficial guide"]],
      },
    ],
    faqs: [
      { q: "Is IITM BS better than a regular engineering college?", a: "It depends on your goal and how you learn. IITM BS is online and self-paced with a degree from IIT Madras; a regular college is classroom-based. Compare subjects, costs and how each helps with your goal." },
      { q: "Where do I check IITM BS fees and eligibility?", a: "On the official IITM BS website, which is where IIT Madras publishes them." },
      { q: "Can I get help with IITM BS studies?", a: "Yes. Unknown IITians offers free lectures, notes, previous year papers, calculators and live batches for IITM BS." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/online-degrees-in-india-iitm-bs",
    title: "Online Degrees in India: How the IITM BS Degree Works",
    description: "How the IIT Madras BS online degree works: the Qualifier, Foundation, Diploma and Degree levels, the branches, and how students prepare.",
    h1: "Online degrees in India: how the IITM BS degree works",
    intro:
      "The IIT Madras BS degree is one of the best-known online degrees in India. Here is how it is structured and how students prepare, in plain words.",
    sections: [
      { heading: "The levels", paragraphs: ["Students start with the Qualifier, then move through the Foundation, Diploma and Degree levels. Details of each level and its exit options are on the official IITM BS website."] },
      { heading: "The branches", paragraphs: ["Data Science and Applications, Electronic Systems, Management and Data Science, and Aeronautics and Space Technology."] },
      { heading: "How students prepare", paragraphs: ["Students use the official lectures and assignments, then add practice: free lectures, week-wise notes, previous year papers and grade calculators."], links: [["/free-iitm-bs-lectures", "Free IITM BS lectures by subject"], ["/exam-preparation/iitm-bs", "IITM BS degree preparation"], ["/iitm-bs/data-science/foundation", "IITM BS Data Science Foundation subjects"]] },
    ],
    faqs: [
      { q: "What is the IITM BS degree?", a: "It is an online BS degree from IIT Madras with the Qualifier, Foundation, Diploma and Degree levels, in fields including Data Science and Electronic Systems." },
      { q: "Where do I find the official details?", a: "On the official IITM BS website, which publishes eligibility, fees, dates and rules." },
    ],
    links: WHERE_TO_GO,
  },
  {
    path: "/iitm-bs-educators",
    title: "Teach IITM BS Subjects with Unknown IITians",
    description: "Educators who can teach IITM BS subjects clearly: what Unknown IITians looks for, the subjects, and how to apply.",
    h1: "Teach IITM BS subjects with Unknown IITians",
    intro:
      "Unknown IITians helps over 1 lakh IITM BS students with free lectures, notes and live batches, and we are always looking for educators who can teach a subject clearly. We want educators to be able to do their best work.",
    sections: [
      { heading: "What we look for", bullets: ["A subject you know well and can explain simply.", "Consistency: regular, well-prepared lectures.", "Care for students who are starting out and stuck."], paragraphs: ["Clear teaching matters more than a long list of titles."] },
      { heading: "Subjects", paragraphs: ["IITM BS Foundation, Diploma and Degree subjects across Data Science and Electronic Systems. See the subject list for what students study."], links: [["/iitm-bs/data-science/foundation", "IITM BS Data Science Foundation subjects"], ["/iitm-bs/data-science/diploma", "IITM BS Data Science Diploma subjects"]] },
      { heading: "How to apply", paragraphs: ["Open positions and educator applications are on the openings page."], links: [["/career/openings", "Current openings"], ["/career", "Careers at Unknown IITians"]] },
    ],
    faqs: [
      { q: "How do I apply to teach IITM BS subjects?", a: "See the current openings page for open positions and how to apply." },
      { q: "Which subjects can I teach?", a: "Foundation, Diploma and Degree subjects across IITM BS Data Science and Electronic Systems." },
    ],
    links: WHERE_TO_GO,
  },
];
