import { Level } from "../types/gradeTypes";
import { calculateConfiguredGrade, GRADE_BANDS, getFormula, getEligibilityIssue } from "./gradingRules";

export const getGradeFormula = getFormula;

export function getGradeLetter(score: number): string {
  return GRADE_BANDS.find((band) => score >= band.minimum)?.letter || "U";
}

export function getGradePoints(score: number): number {
  return GRADE_BANDS.find((band) => score >= band.minimum)?.points || 0;
}

/**
 * `level` is retained in the public API for existing callers. The selected
 * course owns its rule/profile, preventing a level or course switch statement
 * from drifting away from the published policy.
 */
export function calculateGradeByLevel(_level: Level, subjectKey: string, values: Record<string, number>): number {
  const score = calculateConfiguredGrade(subjectKey, values);
  return getEligibilityIssue(subjectKey, values) ? Math.min(score, 39) : score;
}
