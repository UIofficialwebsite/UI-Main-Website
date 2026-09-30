/**
 * The subject lists: /iitm-bs (every subject) and /iitm-bs/<branch>/<level> (one level of one branch),
 * each linking to the subject hubs. ONE builder for the visitor's page and the crawler function.
 * Imports only the hub module's helpers.
 */
import { hubPath, slugify } from "./subjectHub";
import { displayName } from "./subjectAliases";

export interface IndexSubject {
  branch: string;
  level: string;
  name: string;
}

export interface IndexContent {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  groups: Array<{ heading: string; path: string | null; links: Array<[string, string]> }>;
  faqs: Array<{ q: string; a: string }>;
  crumbs: Array<[string, string]>;
}

const LEVEL_ORDER = ["Qualifier", "Foundation", "Diploma", "Degree"];

export function levelIndexPath(branch: string, level: string): string {
  return `/iitm-bs/${slugify(branch)}/${slugify(level)}`;
}

export function indexContent(branch: string | null, level: string | null, all: IndexSubject[]): IndexContent {
  const scoped = all.filter((s) => (!branch || s.branch === branch) && (!level || s.level === level));
  const keyOf = (s: IndexSubject) => `${s.branch}||${s.level}`;
  const keys = [...new Set(scoped.map(keyOf))].sort((a, b) => {
    const [ba, la] = a.split("||");
    const [bb, lb] = b.split("||");
    return ba === bb ? LEVEL_ORDER.indexOf(la) - LEVEL_ORDER.indexOf(lb) : ba.localeCompare(bb);
  });
  const groups = keys.map((k) => {
    const [b, l] = k.split("||");
    return {
      heading: `${b} ${l}`,
      path: levelIndexPath(b, l),
      links: scoped.filter((s) => keyOf(s) === k).map((s): [string, string] => {
        const short = displayName(slugify(s.name), s.name);
        return [hubPath(b, l, s.name), short === s.name ? s.name : `${short} (${s.name})`];
      }),
    };
  });

  const path = branch && level ? levelIndexPath(branch, level) : "/iitm-bs";
  const names = scoped.map((s) => displayName(slugify(s.name), s.name));
  const n = names.length;
  const title = branch && level ? `IITM BS ${branch} ${level} Subjects: Complete List` : "IITM BS Subjects: Complete List for Every Level and Branch";
  const listed = names.length <= 8 ? names.join(", ") : `${names.slice(0, 7).join(", ")} and more`;
  const description =
    branch && level
      ? `All ${n} IITM BS ${branch} ${level} subjects: ${listed}. Free notes, PYQs and lectures for each.`
      : "Every IITM BS subject by branch and level: Maths 1, Maths 2, Stats 1, Stats 2, CT, English, Python, DBMS, PDSA, MAD, ML and more, with free notes, PYQs and lectures.";
  const h1 = branch && level ? `IITM BS ${branch} ${level} subjects` : "IITM BS subjects: every level and branch";
  const intro =
    branch && level
      ? `The IITM BS ${branch} ${level} level has ${n} subjects: ${names.join(", ")}. Open any subject for its free notes, previous year papers, lectures, calculators and live batches.`
      : "Every IITM BS subject on Unknown IITians, by branch and level. Open a subject for its free notes, previous year papers, lectures, calculators and live batches.";

  const faqs =
    branch && level
      ? [
          { q: `Which subjects are in IITM BS ${branch} ${level}?`, a: `${names.join(", ")}.` },
          { q: `Where can I find notes for IITM BS ${level} subjects?`, a: `Open a subject above: each has free week-wise notes, previous year papers and grade calculators.` },
        ]
      : [
          { q: "Which IITM BS subjects does Unknown IITians cover?", a: "Subjects across the Qualifier, Foundation, Diploma and Degree levels for Data Science and Electronic Systems, each with free notes and previous year papers." },
          { q: "Where do I find free IITM BS lectures?", a: "Free lectures for the Foundation and Diploma subjects are on the Unknown IITians YouTube channel; the free lectures page lists them by subject." },
        ];

  const crumbs: Array<[string, string]> = [["Home", "/"], ["IITM BS", "/exam-preparation/iitm-bs"], ["Subjects", "/iitm-bs"]];
  if (branch && level) crumbs.push([`${branch} ${level}`, path]);
  return { path, title, description, h1, intro, groups, faqs, crumbs };
}
