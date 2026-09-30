/**
 * The channel's playlists (23, with their real links) and which subject each one teaches. ONE copy,
 * imported by the guide pages, the subject pages and their crawler versions. Imports nothing.
 */
export const YT = "https://www.youtube.com/playlist?list=";
export const CHANNEL_URL = "https://www.youtube.com/@UnknownIITians";

export const PL = {
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



/** A playlist's id, from its link. */
export const playlistId = (url: string): string => url.split("list=")[1] ?? "";

/** Playlists that teach each subject, by `${branch}/${level}/${subject}` slugs. */
export const SUBJECT_LECTURES: Record<string, Array<keyof typeof PL>> = {
  "data-science/foundation/mathematics-for-data-science-i": ["maths1", "maths1En"],
  "data-science/qualifier/mathematics-for-data-science-i": ["maths1Qual", "maths1En"],
  "data-science/foundation/mathematics-for-data-science-ii": ["maths2"],
  "data-science/foundation/statistics-for-data-science-i": ["stats1", "stats1En"],
  "data-science/qualifier/statistics-for-data-science-i": ["stats1Qual", "stats1En"],
  "data-science/foundation/statistics-for-data-science-ii": ["stats2"],
  "data-science/foundation/computational-thinking": ["ct", "ctEn"],
  "data-science/qualifier/computational-thinking": ["ctQual", "ctEn"],
  "data-science/foundation/programming-in-python": ["python", "oppe"],
  "data-science/diploma/database-management-systems": ["dbms"],
  "data-science/diploma/programming-data-structures-and-algorithms-using-python": ["pdsa"],
};

/** The playlists for one subject as [link, title], or none. */
export function lecturesFor(branchSlug: string, levelSlug: string, subjectSlug: string): Array<[string, string]> {
  return (SUBJECT_LECTURES[`${branchSlug}/${levelSlug}/${subjectSlug}`] ?? []).map((k): [string, string] => [PL[k][0], PL[k][1]]);
}

/** A playlist's title by its id, for the video player's list. */
export const TITLE_BY_ID: Record<string, string> = Object.fromEntries(Object.values(PL).map(([url, title]) => [playlistId(url), title]));

const ids = (...keys: Array<keyof typeof PL>): string[] => keys.map((k) => playlistId(PL[k][0]));

/** The playlists grouped the way people look for them. */
export const LECTURE_GROUPS = {
  foundation: { heading: "Foundation", ids: ids("maths1", "maths1En", "maths2", "stats1", "stats1En", "stats2", "ct", "ctEn", "python", "oppe") },
  diploma: { heading: "Diploma", ids: ids("dbms", "pdsa") },
  qualifier: { heading: "Qualifier preparation", ids: ids("maths1Qual", "stats1Qual", "ctQual", "qualifier", "qualifierGuide") },
  revision: { heading: "Revision for exam weeks", ids: ids("quiz1", "quiz2", "endTerm", "qualifier", "oppe") },
} as const;
