import { Level } from "../types/gradeTypes";
import { calculateGradeByLevel } from "./gradeCalculations";
import { ALL_SUBJECTS } from "../data/subjectsData";

export interface PredictionResult {
  possible: boolean;
  requiredScore?: number;
  message?: string;
}

// ==========================================
// ELIGIBILITY PRE-CHECKER
// ==========================================
export function checkEligibilityIssues(subjectKey: string, values: Record<string, number>): string | null {
  
  // 1. STRICT FOUNDATION SAFETY NET
  // Forcefully checks GAA for all Foundation subjects regardless of blueprint
  const foundationSubjects = [
    "maths1", "english1", "computational", "statistics1", "maths2", "english2", "python", "statistics2",
    "es_english1", "es_math1", "es_estc", "es_intro_c", "es_english2", "es_linux", "es_digital", "es_eec", "es_embedded_c"
  ];
  
  if (foundationSubjects.includes(subjectKey)) {
    if (values.GAA === undefined || Number(values.GAA) < 40) {
      return "GAA must be >= 40% (Cannot be left blank)";
    }
  }

  // 2. FETCH SUBJECT BLUEPRINT
  let subjectDetails;
  for (const level in ALL_SUBJECTS) {
    const found = ALL_SUBJECTS[level].find(s => s.key === subjectKey);
    if (found) { subjectDetails = found; break; }
  }

  if (!subjectDetails) return null;

  // 3. BLUEPRINT GAA/GA CHECKS (For Diploma/Degree)
  const hasGAA = subjectDetails.fields.some(f => f.id === "GAA");
  const hasGA = subjectDetails.fields.some(f => f.id === "GA");

  if (hasGAA && !foundationSubjects.includes(subjectKey)) {
    if (values.GAA === undefined || Number(values.GAA) < 40) {
      return "GAA must be >= 40% (Cannot be left blank)";
    }
  }

  if (hasGA) {
    if (subjectKey === "business_data_management" || subjectKey === "bdm") {
      if (values.GA === undefined || Number(values.GA) < 4) {
        return "GA must be >= 4/10 (Cannot be left blank)";
      }
    } else {
      if (values.GA === undefined || Number(values.GA) < 40) {
        return "GA must be >= 40% (Cannot be left blank)";
      }
    }
  }

  // 4. GLOBAL QUIZ CHECK (Must attend at least 1 Quiz)
  const quizFields = subjectDetails.fields.filter(f => f.id.startsWith("Qz") || f.id.startsWith("Q1") || f.id.startsWith("Q2"));
  if (quizFields.length > 0) {
    const attendedAtLeastOneQuiz = quizFields.some(f => values[f.id] !== undefined);
    if (!attendedAtLeastOneQuiz) {
      return "Must attend at least one Quiz (Enter '0' if you attended but scored zero)";
    }
  }

  // 5. SUBJECT-SPECIFIC OPPE CHECKS
  const oppeSubjects = [
    "python", "mlp", "machinelearning_practice", "pdsa", "programming_python", 
    "systemcommands", "system-commands", "int_bigdata", "big-data", "c_prog", "c-programming"
  ];
  if (oppeSubjects.includes(subjectKey)) {
    const maxOppe = Math.max(Number(values.OPPE1 || 0), Number(values.OPPE2 || 0), Number(values.OPPE || 0), Number(values.OP || 0));
    if (maxOppe < 40) return "OPPE score must be >= 40";
  }

  // 6. OTHER SPECIFIC EXAMS
  if (subjectKey === "java" || subjectKey === "java_programming") {
    const maxPe = Math.max(Number(values.PE1 || 0), Number(values.PE2 || 0));
    if (maxPe < 30) return "Programming Exam must be >= 30";
  }

  if (subjectKey === "dbms" || subjectKey === "databasems") {
    if (Number(values.OP || 0) < 35) return "OPPE must be >= 35";
  }

  // 7. VIVA CHECKS
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
  
  const eligibilityIssue = checkEligibilityIssues(subjectKey, currentValues);
  if (eligibilityIssue) {
    return { possible: false, message: eligibilityIssue };
  }

  const gradeMap: Record<string, number> = {
    S: 90, A: 80, B: 70, C: 60, D: 50, E: 40,
  };
  
  const targetScore = gradeMap[targetGrade];
  if (!targetScore) return { possible: false, message: "Invalid target grade" };

  for (let f = 0; f <= 100; f++) {
    if ((subjectKey === "ba" || subjectKey === "business_analytics") && f < 10) continue;

    const testValues = { ...currentValues, F: f };
    const calculatedScore = calculateGradeByLevel(level, subjectKey, testValues);
    
    if (calculatedScore >= targetScore) {
      return { possible: true, requiredScore: f };
    }
  }

  return { 
    possible: false, 
    message: "Even with a perfect 100 in the End Term, this grade is mathematically unreachable." 
  };
}
