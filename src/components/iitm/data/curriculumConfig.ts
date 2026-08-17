import { ALL_SUBJECTS } from "./subjectsData";
import { Level, Subject, SubjectField } from "../types/gradeTypes";

/**
 * The single source of truth for calculator programme/course metadata.
 * Keep published course data here; calculator components must not contain
 * programme names, course names, credits, or course-key conditionals.
 */
export type ProgrammeId =
  | "data-science"
  | "management-data-science"
  | "aeronautics-space-technology"
  | "electronic-systems";

export interface CalculatorSubject extends Subject {
  programme: ProgrammeId;
  level: Level;
  credits: number;
  formulaProfile: string;
  source: string;
}

export interface CatalogueCourse {
  key: string;
  name: string;
  credits: number;
  programme: ProgrammeId;
  level: Level;
}

export const PROGRAMMES: Record<ProgrammeId, { label: string; source: string }> = {
  "data-science": {
    label: "Data Science and Applications",
    source: "https://docs.google.com/document/d/e/2PACX-1vT5PBOz4OH663W0IJPVGVjG_nfmYZGfFI7W1j-6wTLcex13O_7BZmf6a96Q6liO0W-mLZB5hOGZeNNl/pub",
  },
  "management-data-science": {
    label: "Management and Data Science",
    source: "https://docs.google.com/document/u/2/d/e/2PACX-1vSn46R_x5cmXfG-L7-uOWPedW35kn-Z2BkWsFQYrLYkT1FSCbu5fwuA37pZKHUn6OutOvVVndUHbi6S/pub",
  },
  "aeronautics-space-technology": {
    label: "Aeronautics and Space Technology",
    source: "https://docs.google.com/document/d/e/2PACX-1vRSYipkX379cSYTc9rKkTHr_EE8WOawbhCQ8ASRWd0_TQ9I4Rx2dfn_mZWW1MEQVMHZS4tqrLIXkhR2/pub",
  },
  "electronic-systems": {
    label: "Electronic Systems",
    source: "https://docs.google.com/document/d/e/2PACX-1vQ3pPCN6fxAelt7xlPtP20KFgm3cMF_OOIY71J1zWV7y2b25ItrhdKhhREUgo1YSLywdcQjse9ZEYv5/pub",
  },
};

const sourceFor = (programme: ProgrammeId) => PROGRAMMES[programme].source;

export function normaliseProgramme(value?: string): ProgrammeId {
  const compact = (value || "").trim().toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  if (compact.includes("management")) return "management-data-science";
  if (compact.includes("aeronautics") || compact.includes("space")) return "aeronautics-space-technology";
  if (compact.includes("electronic")) return "electronic-systems";
  return "data-science";
}

export const normaliseLevel = (value?: string): Level => {
  const normalised = (value || "foundation").toLowerCase();
  if (normalised.startsWith("diploma")) return "diploma";
  if (normalised.startsWith("degree") || normalised.startsWith("bs")) return "degree";
  return "foundation";
};

const field = (id: string, label: string, max = 100): SubjectField => ({ id, label, min: 0, max });
const standardFields = (): SubjectField[] => [
  field("GAA", "Assignment eligibility average (best 5)") ,
  field("Qz1", "Quiz 1"), field("Qz2", "Quiz 2"), field("F", "End Term Exam"),
];
const weightedGaaFields = (): SubjectField[] => [
  field("GAA", "Graded Assignment Average"),
  field("Qz1", "Quiz 1"), field("Qz2", "Quiz 2"), field("F", "End Term Exam"),
];
const cProgrammingFields = (): SubjectField[] => [
  field("GAA", "Assignment eligibility average (best 5)"), field("Qz1", "Quiz 1"),
  field("OPPE1", "OPPE 1"), field("OPPE2", "OPPE 2"), field("F", "End Term Exam"),
];

const newSubject = (
  programme: ProgrammeId, level: Level, key: string, name: string, formulaProfile: string,
  fields: SubjectField[] = standardFields(), credits = 4,
): CalculatorSubject => ({ key, name, fields, credits, programme, level, formulaProfile, source: sourceFor(programme) });

const legacyProgrammeAndLevel = (bucket: string): { programme: ProgrammeId; level: Level } => {
  if (bucket.endsWith("-electronic-systems")) {
    return { programme: "electronic-systems", level: bucket.replace("-electronic-systems", "") as Level };
  }
  return { programme: "data-science", level: bucket as Level };
};

// Profiles are data assignments. Evaluation and eligibility are implemented once in gradingRules.ts.
const profileOverrides: Record<string, string> = {
  statistics1: "foundation-standard-bonus-5", statistics2: "foundation-standard-bonus-5", maths2: "foundation-standard-bonus-6",
  python: "foundation-programming", machinelearning: "diploma-five-gaa-best-quiz", ml_techniques: "diploma-five-gaa-best-quiz",
  appdev1: "diploma-five-gla-best-quiz", appdev2: "diploma-five-gaa-best-quiz", machinelearning_practice: "mlp",
  business_data_management: "bdm", business_analytics: "business-analytics", programming_python: "pdsa", databasems: "dbms",
  java_programming: "java", systemcommands: "system-commands", intro_dl_genai: "dl-genai", tools_data_science: "tds",
  software_engineering: "software-engineering", ai_search: "degree-standard-bonus", strat_prof_growth: "strategies", deep_learning: "deep-learning", deep_learning_cv: "degree-standard-bonus",
  int_bigdata: "big-data", c_prog: "c-programming", deep_learning_practice: "deep-learning-practice", ds_ai_lab: "ds-ai-lab",
  app_dev_lab: "app-dev-lab", algo_thinking_bio: "algo-bio", market_research: "market-research", advanced_algorithms: "managerial-economics",
  speech_technology: "speech", mlops: "mlops", math_foundations_genai: "math-genai",
  es_estc_lab: "lab-experiment-report", es_intro_c: "c-programming-2026", es_intro_c_lab: "lab-timed-campus",
  es_linux: "linux", es_linux_lab: "lab-online-campus", es_electronics_lab: "lab-weekly-demo",
  es_embedded_c: "embedded-c", es_embedded_c_lab: "lab-attendance-viva", es_signals: "signals-dsd",
  es_eec: "foundation-standard",
  es_dsd: "signals-dsd", es_python_diploma: "python-diploma", es_dsp: "dsp", es_analog_lab: "lab-weekly-demo",
  es_sensors_lab: "lab-weekly-demo", es_dsd_lab: "lab-weekly-demo", es_epd: "electronic-product-design",
  es_strategies: "strategies", es_embedded_linux: "embedded-linux", es_testing: "embedded-linux", es_embedded_linux_lab: "lab-attendance-viva",
};

const defaultProfile = (programme: ProgrammeId, level: Level) => {
  if (level === "foundation") return "foundation-standard";
  if (programme === "electronic-systems") return "electronic-standard";
  if (level === "diploma") return "diploma-five-gaa";
  return "degree-standard";
};

const legacyCalculatorSubjects: CalculatorSubject[] = Object.entries(ALL_SUBJECTS).flatMap(([bucket, subjects]) => {
  const { programme, level } = legacyProgrammeAndLevel(bucket);
  return subjects.map((subject) => ({
    ...subject,
    fields: subject.fields.map((item) => (
      level === "foundation" && item.id === "GAA"
        ? { ...item, label: "Assignment eligibility average (best 5)" }
        : subject.key === "maths2" && item.id === "Bonus"
          ? { ...item, label: "Course activity bonus (max 6)", max: 6 }
        : item
    )),
    programme,
    level,
    credits: subject.key.includes("_lab") ? 1 : 4,
    formulaProfile: profileOverrides[subject.key] || defaultProfile(programme, level),
    source: sourceFor(programme),
  }));
});

const managementFoundation = [
  "Mathematics for Data Science I", "English I", "Computational Thinking", "Statistics for Data Science I",
  "Principles of Economics", "Financial Accounting", "Business Statistics", "Management Thought and Practice",
].map((name, index) => newSubject(
  "management-data-science", "foundation", `mds_foundation_${index + 1}`,
  name, name === "Statistics for Data Science I" ? "foundation-standard-bonus-5" : "foundation-standard",
));

const aerospaceFoundation = [
  ["ast_english_1", "English I", "foundation-standard"],
  ["ast_math_1", "Math for Electronics I", "foundation-standard"],
  ["ast_estc", "Electronic Systems Thinking and Circuits", "foundation-standard"],
  ["ast_c_programming", "Introduction to C Programming", "c-programming-2026"],
  ["ast_english_2", "English II", "foundation-standard"],
  ["ast_math_2", "Math for Electronics II", "electronic-standard"],
  ["ast_aerospace", "Introduction to Aerospace Systems", "foundation-standard"],
  ["ast_mechanics", "Engineering Mechanics", "foundation-standard"],
] as const;

const aerospaceCalculatorSubjects = aerospaceFoundation.map(([key, name, profile]) => newSubject(
  "aeronautics-space-technology", "foundation", key, name, profile,
  profile === "foundation-programming" ? cProgrammingFields() : profile === "electronic-standard" ? weightedGaaFields() : standardFields(),
));

// Degree courses that are explicitly listed in the May 2026 DS grading document
// but were absent from the legacy subject list. Each course carries its own
// assessment fields and formula profile; UI components never hard-code them.
const dsPublishedDegreeSubjects: CalculatorSubject[] = [
  newSubject("data-science", "degree", "large_language_models", "Large Language Models", "large-language-models", [field("GAA", "Graded assignment average"), field("Qz1", "Quiz 1"), field("Qz2", "Quiz 2"), field("F", "End Term Exam"), field("Bonus", "Programming-assignment bonus (max 5)", 5)]),
  newSubject("data-science", "degree", "data_visualization_design", "Data Visualization Design", "data-visualization", [field("GA", "Best 3 of 5 graded assignments"), field("Qz1", "Quiz 1"), field("Qz2", "Quiz 2"), field("P", "Group project and presentation"), field("Bonus", "Bonus (max 5)", 5)]),
  newSubject("data-science", "degree", "design_thinking", "Design Thinking for Data-Driven App Development", "design-thinking", [field("GAA", "Graded assignment average"), field("Qz2", "Quiz 2"), field("GP1", "Group project milestone 1"), field("GP2", "Group project milestone 2"), field("GP3", "Group project milestone 3"), field("F", "End Term Exam")]),
  newSubject("data-science", "degree", "algorithms_data_science", "Algorithms for Data Science", "ads", [field("GAA", "Theory assignment average"), field("PAA", "Programming assignment average"), field("Qz2", "Quiz 2"), field("F", "End Term Exam"), field("Bonus", "Bonus (max 4)", 4)]),
  newSubject("data-science", "degree", "managerial_economics", "Managerial Economics", "degree-standard"),
  newSubject("data-science", "degree", "discrete_mathematics", "Discrete Mathematics", "degree-standard"),
  newSubject("data-science", "degree", "compiler_design", "Compiler Design", "degree-standard"),
  newSubject("data-science", "degree", "game_theory_strategy", "Game Theory and Strategy", "degree-standard"),
  newSubject("data-science", "degree", "privacy_security_social_media", "Privacy & Security in Online Social Media", "privacy-security"),
  newSubject("data-science", "degree", "computer_systems_design", "Computer Systems Design", "computer-systems", [field("GAA", "Graded assignment average"), field("Qz1", "Quiz 1"), field("Qz2", "Quiz 2"), field("F", "End Term Exam"), field("CVA", "CircuitVerse assignment")]),
];

// Published course catalogues are also used by the CGPA tool. A course can be added here without touching UI or formula code.
const catalogue = (programme: ProgrammeId, level: Level, rows: Array<[string, number]>): CatalogueCourse[] =>
  rows.map(([name, credits], index) => ({ key: `${programme}-${level}-${index + 1}`, name, credits, programme, level }));

const managementCatalogue: CatalogueCourse[] = [
  ...managementFoundation.map(({ key, name, credits, programme, level }) => ({ key, name, credits, programme, level })),
  ...catalogue("management-data-science", "diploma", [
    ["Python for Data Analytics", 4], ["Data Management", 4], ["Analysis of Economic Data", 4], ["Marketing Analytics", 4],
    ["HR Analytics", 4], ["Financial Analytics", 4], ["Operations Management", 4], ["Supply Chain Analytics", 4],
    ["Business Management Project", 2], ["Business Analytics Project", 2], ["Corporate Finance", 4], ["Organisational Behavior", 4],
    ["Money, Banking and Financial Markets", 4], ["Marketing Management", 4], ["Macroeconomics", 4], ["Managerial Economics", 4],
  ]),
  ...catalogue("management-data-science", "degree", [
    ["Strategies for Professional Growth", 4], ["GenAI for Business", 4], ["Digital Business", 4],
    ["Logistics and Supply Chain Management", 4], ["Applied Time Series Analysis", 4], ["Market Intelligence", 4],
  ]),
];

const aerospaceCatalogue: CatalogueCourse[] = [
  ...aerospaceCalculatorSubjects.map(({ key, name, credits, programme, level }) => ({ key, name, credits, programme, level })),
];

const legacyCatalogue: CatalogueCourse[] = legacyCalculatorSubjects.map(({ key, name, credits, programme, level }) => ({ key, name, credits, programme, level }));
const allCalculatorSubjects = [...legacyCalculatorSubjects, ...managementFoundation, ...aerospaceCalculatorSubjects, ...dsPublishedDegreeSubjects];
const allCatalogueCourses = [...legacyCatalogue, ...managementCatalogue, ...aerospaceCatalogue, ...dsPublishedDegreeSubjects.map(({ key, name, credits, programme, level }) => ({ key, name, credits, programme, level }))];

// The subject selector is intentionally term-specific: only courses present in
// the supplied May 2026 grading document are offered for grade prediction.
// CGPA keeps the broader handbook catalogue because it is not term-bound.
const MAY_2026_GRADED_SUBJECTS: Partial<Record<ProgrammeId, Partial<Record<Level, string[]>>>> = {
  "data-science": {
    foundation: ["maths1", "english1", "computational", "statistics1", "maths2", "english2", "python", "statistics2"],
    diploma: ["machinelearning", "ml_techniques", "machinelearning_practice", "business_data_management", "business_analytics", "tools_data_science", "programming_python", "databasems", "appdev1", "java_programming", "systemcommands", "appdev2", "intro_dl_genai"],
    degree: ["software_testing", "software_engineering", "deep_learning", "ai_search", "strat_prof_growth", "c_prog", "deep_learning_cv", "large_language_models", "deep_learning_practice", "ds_ai_lab", "app_dev_lab", "algo_thinking_bio", "market_research", "managerial_economics", "mlops", "math_foundations_genai", "data_visualization_design", "design_thinking", "privacy_security_social_media", "computer_systems_design", "game_theory_strategy", "algorithms_data_science", "discrete_mathematics", "compiler_design", "theory_computation"],
  },
};

export function getAvailableCalculatorLevels(programmeInput?: string): Level[] {
  const programme = normaliseProgramme(programmeInput);
  const order: Level[] = ["foundation", "diploma", "degree"];
  return order.filter((level) => allCalculatorSubjects.some((subject) => subject.programme === programme && subject.level === level));
}

export function getCalculatorSubjects(programmeInput?: string, levelInput?: string): CalculatorSubject[] {
  const programme = normaliseProgramme(programmeInput);
  const level = normaliseLevel(levelInput);
  const publishedKeys = MAY_2026_GRADED_SUBJECTS[programme]?.[level];
  return allCalculatorSubjects.filter((subject) =>
    subject.programme === programme &&
    subject.level === level &&
    (!publishedKeys || publishedKeys.includes(subject.key)),
  );
}

export function getCatalogueCourses(programmeInput?: string, levelInput?: string): CatalogueCourse[] {
  const programme = normaliseProgramme(programmeInput);
  const level = normaliseLevel(levelInput);
  return allCatalogueCourses.filter((course) => course.programme === programme && course.level === level);
}

export function getCalculatorSubject(key: string): CalculatorSubject | undefined {
  return allCalculatorSubjects.find((subject) => subject.key === key);
}
