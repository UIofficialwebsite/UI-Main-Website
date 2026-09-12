
export interface SubjectField {
  id: string;
  label: string;
  min: number;
  max: number;
  /**
   * Marks this field as a yes/no toggle recording whether the student was
   * ELIGIBLE to sit the exam named here (e.g. an OPPE). Eligibility and score
   * are different things: a student can be eligible and still score 0. When the
   * answer is "no" the exam was never written, so the grading document's
   * "0, if not attempted" applies to that component. Stored as 1 / 0; an unset
   * toggle is treated as eligible so existing behaviour is unchanged.
   */
  controls?: string;
}

export interface Subject {
  key: string;
  name: string;
  fields: SubjectField[];
}

export interface GradeResult {
  score: number;
  letter: string;
  points: number;
}

export type Level = "foundation" | "diploma" | "degree";
