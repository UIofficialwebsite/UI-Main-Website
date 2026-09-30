/** The shape of a guide page: shared by the visitor's page and the crawler function. Imports nothing. */
export interface CompareSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Links under the section: [href, label]; http(s) ones open in a new tab. */
  links?: Array<[string, string]>;
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
  /** "tools": the working calculators, shown right under the introduction, before anything else. */
  embed?: "tools";
}
