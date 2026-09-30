/**
 * The names students actually type. Nobody searches "Mathematics for Data Science II": they search
 * "maths 2", "stats 2", "ct", "python", "dbms", "mad 1", "pdsa", "mlf". This map gives each subject the
 * short name people search (from Search Console queries and YouTube/Google suggestions, September 2026)
 * and the other spellings they use, and is used in every title, heading, description, question and link.
 * ONE copy for the visitor's pages and the crawler function. Imports nothing.
 */
export interface Alias {
  /** The short name students search, used first. */
  short: string;
  /** Other spellings people type, worked into the text. */
  also: string[];
}

const a = (short: string, ...also: string[]): Alias => ({ short, also });

/** By subject slug; the same subject at the Qualifier and Foundation levels shares its names. */
const BY_SUBJECT: Record<string, Alias> = {
  // Data Science: Foundation and Qualifier
  "mathematics-for-data-science-i": a("Maths 1", "Math 1", "Mathematics 1", "Maths I"),
  "mathematics-for-data-science-ii": a("Maths 2", "Math 2", "Mathematics 2", "Maths II"),
  "statistics-for-data-science-i": a("Stats 1", "Statistics 1", "Stat 1", "Stats I"),
  "statistics-for-data-science-ii": a("Stats 2", "Statistics 2", "Stat 2", "Stats II"),
  "computational-thinking": a("CT", "Computational Thinking"),
  "english-i": a("English 1", "English I"),
  "english-ii": a("English 2", "English II"),
  "programming-in-python": a("Python", "Programming in Python", "Python programming"),
  // Data Science: Diploma
  "database-management-systems": a("DBMS", "Database Management Systems"),
  "programming-data-structures-and-algorithms-using-python": a("PDSA", "DSA using Python", "Programming, Data Structures and Algorithms using Python"),
  "modern-application-development-i": a("MAD 1", "MAD1", "Modern Application Development 1", "App Dev 1"),
  "modern-application-development-ii": a("MAD 2", "MAD2", "Modern Application Development 2", "App Dev 2"),
  "programming-concepts-using-java": a("Java", "Java programming", "Programming Concepts using Java"),
  "system-commands": a("System Commands", "SC"),
  "machine-learning-foundations": a("MLF", "ML Foundations", "Machine Learning Foundations"),
  "machine-learning-techniques": a("MLT", "ML Techniques", "Machine Learning Techniques"),
  "machine-learning-practice": a("MLP", "ML Practice", "Machine Learning Practice"),
  "business-data-management": a("BDM", "Business Data Management"),
  "business-analytics-option-1": a("Business Analytics", "BA"),
  "tools-in-data-science": a("TDS", "Tools in Data Science"),
  "introduction-to-deep-learning-and-generative-ai-option-2": a("DL GenAI", "DL and Gen AI", "Deep Learning and Generative AI"),
  // Data Science: Degree
  "software-engineering": a("Software Engineering", "SE"),
  "software-testing": a("Software Testing", "ST"),
  "deep-learning": a("Deep Learning", "DL"),
  "ai-search-methods-for-problem-solving": a("AI Search", "AI: Search Methods", "AI Search Methods"),
  // Electronic Systems
  "electronic-systems-thinking-and-circuits": a("ESTC", "Electronic Systems Thinking and Circuits"),
  "math-for-electronics-i": a("Math for Electronics 1", "Maths for Electronics 1", "Math for Electronics I"),
  "math-for-electronics-ii": a("Math for Electronics 2", "Maths for Electronics 2", "Math for Electronics II"),
  "introduction-to-c-programming": a("C Programming", "Intro to C Programming"),
  "signals-and-systems": a("Signals and Systems"),
  "digital-signal-processing": a("DSP", "Digital Signal Processing"),
  "control-engineering": a("Control Engineering"),
};

export function aliasForSubject(subjectSlug: string): Alias | undefined {
  return BY_SUBJECT[subjectSlug];
}

/** What to call a subject in text: its short name if students have one, else its own name. */
export function displayName(subjectSlug: string, fullName: string): string {
  return BY_SUBJECT[subjectSlug]?.short ?? fullName;
}
