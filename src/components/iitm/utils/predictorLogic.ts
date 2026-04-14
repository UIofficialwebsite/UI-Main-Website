import { Level } from "../types/gradeTypes";
import { calculateGradeByLevel, getGradeFormula } from "./gradeCalculations";

export interface PredictionResult {
  possible: boolean;
  requiredScore?: number;
  message?: string;
}

const isBlank = (val: any) => val === undefined || val === null || val.toString().trim() === '';

// ==========================================
// ELIGIBILITY PRE-CHECKER
// ==========================================
export function checkEligibilityIssues(subjectKey: string, values: Record<string, number>): string | null {
  const formulaText = getGradeFormula(subjectKey);

  // 1. Global GAA Check
  if (formulaText.includes("GAA")) {
    if (isBlank(values.GAA) || Number(values.GAA) < 40) {
      return "GAA must be >= 40% (Cannot be left blank)";
    }
  }
  
  if (subjectKey === "business_data_management" || subjectKey === "bdm") {
    if (isBlank(values.GA) || Number(values.GA) < 4) {
      return "GA must be >= 4/10 (Cannot be left blank)";
    }
  }

  // 2. Global Quiz Check (Must attend at least 1)
  const hasQuizzes = /Qz|Q1|Q2|Quiz/i.test(formulaText);
  if (hasQuizzes) {
    const expectedQuizKeys = ["Qz1", "Qz2", "Qz3", "Qz"];
    const attendedAtLeastOneQuiz = expectedQuizKeys.some(key => !isBlank(values[key]));
    if (!attendedAtLeastOneQuiz) {
      return "Must attend at least one Quiz (Enter '0' if you attended but scored zero)";
    }
  }

  // 3. Subject-Specific OPPE Checks
  const oppeSubjects = [
    "python", "mlp", "machinelearning_practice", "pdsa", "programming_python", 
    "systemcommands", "system-commands", "int_bigdata", "big-data", "c_prog", "c-programming"
  ];
  if (oppeSubjects.includes(subjectKey)) {
    const maxOppe = Math.max(Number(values.OPPE1 || 0), Number(values.OPPE2 || 0), Number(values.OPPE || 0), Number(values.OP || 0));
    if (maxOppe < 40) return "OPPE score must be >= 40";
  }

  // 4. Other Specific Exams
  if (subjectKey === "java" || subjectKey === "java_programming") {
    const maxPe = Math.max(Number(values.PE1 || 0), Number(values.PE2 || 0));
    if (maxPe < 30) return "Programming Exam must be >= 30";
  }

  if (subjectKey === "dbms" || subjectKey === "databasems") {
    if (Number(values.OP || 0) < 35) return "OPPE must be >= 35";
  }

  // 5. Viva Checks
  if (subjectKey === "ds_ai_lab" && Number(values.V || 0) < 55) return "Viva must be >= 55";
  if (subjectKey === "app_dev_lab" && Number(values.V || 0) < 50) return "Viva must be >= 50";
  if (subjectKey === "deep_learning_practice" && Number(values.Viva || 0) < 50) return "Viva must be >= 50";

  return null; // All eligibility passed
}

// ==========================================
// PREDICTOR FUNCTION
// ==========================================
export function predictRequiredMarks(
  level: Level,
  subjectKey: string,
  currentValues: Record<string, number>,
  targetGrade: string
): PredictionResult {
  
  // Step 1: Pre-check for strict eligibility failures
  const eligibilityIssue = checkEligibilityIssues(subjectKey, currentValues);
  if (eligibilityIssue) {
    return { possible: false, message: eligibilityIssue };
  }

  // Step 2: Map target grade to minimum score
  const gradeMap: Record<string, number> = {
    S: 90, A: 80, B: 70, C: 60, D: 50, E: 40,
  };
  
  const targetScore = gradeMap[targetGrade];
  if (!targetScore) return { possible: false, message: "Invalid target grade" };

  // Step 3: Loop to find minimum F (End Term score)
  for (let f = 0; f <= 100; f++) {
    // Special check for Business Analytics End Term minimum requirement
    if ((subjectKey === "ba" || subjectKey === "business_analytics") && f < 10) {
       continue; // F must be >= 10 to pass BA
    }

    const testValues = { ...currentValues, F: f };
    const calculatedScore = calculateGradeByLevel(level, subjectKey, testValues);
    
    if (calculatedScore >= targetScore) {
      return { possible: true, requiredScore: f };
    }
  }

  // Step 4: If loop finishes without returning, it's impossible even with 100
  return { 
    possible: false, 
    message: "Even with a perfect 100 in the End Term, this grade is mathematically unreachable." 
  };
}
