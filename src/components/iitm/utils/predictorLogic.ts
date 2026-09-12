import { Level } from "../types/gradeTypes";
import { calculateGradeByLevel } from "./gradeCalculations";
import { GRADE_BANDS, getEligibilityIssue } from "./gradingRules";

export interface PredictionResult {
  possible: boolean;
  requiredScore?: number;
  message?: string;
  /**
   * Advisory that does NOT make the target unreachable - currently an OPPE
   * shortfall, which makes the term result I_OP (incomplete, re-attempt the
   * exam alone) rather than a fail. The required end-term score still applies.
   */
  note?: string;
}

export function checkEligibilityIssues(subjectKey: string, values: Record<string, number>): string | null {
  return getEligibilityIssue(subjectKey, values)?.message || null;
}

export function predictRequiredMarks(
  level: Level,
  subjectKey: string,
  currentValues: Record<string, number>,
  targetGrade: string,
): PredictionResult {
  const targetScore = GRADE_BANDS.find((band) => band.letter === targetGrade)?.minimum;
  if (!targetScore) return { possible: false, message: "Invalid target grade." };

  // The predictor varies only the end-term score. Pre-existing eligibility
  // requirements are intentionally checked before searching possible scores.
  // Only a blocking issue rules the grade out. An OPPE shortfall still lets the
  // student sit and pass the end term; it just withholds the grade as I_OP.
  const issue = getEligibilityIssue(subjectKey, currentValues);
  if (issue?.severity === "blocking") return { possible: false, message: issue.message };
  const note = issue?.message;

  for (let endTermScore = 0; endTermScore <= 100; endTermScore += 1) {
    if (calculateGradeByLevel(level, subjectKey, { ...currentValues, F: endTermScore }) >= targetScore) {
      return { possible: true, requiredScore: endTermScore, note };
    }
  }

  return { possible: false, message: "Even a perfect End Term score cannot reach this grade.", note };
}
