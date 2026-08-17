import { Level } from "../types/gradeTypes";
import { calculateGradeByLevel } from "./gradeCalculations";
import { GRADE_BANDS, getEligibilityIssue } from "./gradingRules";

export interface PredictionResult {
  possible: boolean;
  requiredScore?: number;
  message?: string;
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
  const issue = checkEligibilityIssues(subjectKey, currentValues);
  if (issue) return { possible: false, message: issue };

  for (let endTermScore = 0; endTermScore <= 100; endTermScore += 1) {
    if (calculateGradeByLevel(level, subjectKey, { ...currentValues, F: endTermScore }) >= targetScore) {
      return { possible: true, requiredScore: endTermScore };
    }
  }

  return { possible: false, message: "Even a perfect End Term score cannot reach this grade." };
}
