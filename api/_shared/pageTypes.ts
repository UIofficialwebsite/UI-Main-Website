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
  /**
   * The real thing the visitor came for, shown on the page before the text:
   * "tools" the calculators (the tools page itself), "lectures" a video player for the playlists in
   * `lectureGroups`, "courses" the live course cards.
   */
  embed?: "tools" | "lectures" | "courses";
  lectureGroups?: Array<{ heading: string; ids: string[] }>;
  /** One clear button at the top, for pages whose visitor wants to go and do something. */
  cta?: [string, string];
  /** The short, direct answer, shown first. */
  answer?: string;
}
