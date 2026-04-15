import { Level } from "../types/gradeTypes";
import { ALL_SUBJECTS } from "../data/subjectsData";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateESStandardTheory(values: Record<string, number>): number {
  const { GAA = 0, Qz1 = 0, Qz2 = 0, F = 0 } = values;
  const opt1 = 0.6 * F + 0.2 * Math.max(Qz1, Qz2);
  const opt2 = 0.4 * F + 0.2 * Qz1 + 0.3 * Qz2;
  return 0.1 * GAA + Math.max(opt1, opt2);
}

function calculateDSFoundationStandard(values: Record<string, number>): number {
  const { Qz1 = 0, Qz2 = 0, F = 0 } = values;
  const opt1 = 0.6 * F + 0.3 * Math.max(Qz1, Qz2);
  const opt2 = 0.45 * F + 0.25 * Qz1 + 0.3 * Qz2;
  return Math.max(opt1, opt2);
}

function calculateDSDiplomaStandard(values: Record<string, number>): number {
  const { GAA = 0, Qz1 = 0, Qz2 = 0, F = 0 } = values;
  return 0.1 * GAA + 0.4 * F + 0.25 * Qz1 + 0.25 * Qz2;
}

function calculateESStandardLab(values: Record<string, number>): number {
  const { WE = 0, ID = 0 } = values;
  return 0.4 * WE + 0.6 * ID;
}

// ==========================================
// FORMULA TEXT RETRIEVAL
// ==========================================

export function getGradeFormula(subjectKey: string): string {
  if (subjectKey.startsWith("es_")) {
    switch (subjectKey) {
      case "es_estc_lab": return "0.5 * Experiment + 0.5 * Report";
      case "es_intro_c": return "0.15*Qz1 + 0.4*F + 0.25*max(OPPE) + 0.2*min(OPPE)";
      case "es_intro_c_lab": return "0.5 * Timed Lab + 0.5 * In-Campus Lab";
      case "es_linux": return "0.1*GAA + 0.05*NPPE + 0.2*Qz1 + 0.25*OPE + 0.3*F + 0.05*BPTA + 0.05*VMT";
      case "es_linux_lab": return "0.5 * Online Lab + 0.5 * In-Campus Lab";
      case "es_embedded_c": return "0.1*GAA + 0.1*GRPA + max(0.5F+0.2max(Qz), 0.4F+0.2Qz1+0.2Qz2)";
      case "es_embedded_c_lab": case "es_embedded_linux_lab": return "20 (Attendance) + 0.8 * Viva";
      case "es_signals": case "es_dsd": return "0.1*GAA + 0.1*GrPA + max(0.5F+0.2max(Qz), 0.4F+0.2Qz1+0.2Qz2)";
      case "es_python_diploma": return "0.1*GAA1 + 0.1*GAA2 + 0.1*Qz1 + 0.4*F + 0.25*max(PE) + 0.15*min(PE)";
      case "es_dsp": return "0.1*GAA + 0.1*LE + 0.05*LV + max(0.55F+0.1max(Qz), 0.45F+0.15Qz1+0.15Qz2)";
      case "es_epd": return "3*GAA + 0.5*(Qz1+Qz2) + 0.3*F";
      case "es_strategies": return "0.15*GAA + 0.25*GP + 0.25*Qz2 + 0.35*F";
      case "es_embedded_linux": case "es_testing": return "0.2*GAA + max(0.5F+0.2max(Qz), 0.4F+0.2Qz1+0.2Qz2)";
      case "es_electronics_lab": case "es_analog_lab": case "es_sensors_lab": case "es_dsd_lab": return "0.4 * Weekly Exp + 0.6 * In-Person Demo";
      default: return "0.1*GAA + max(0.6F + 0.2max(Qz), 0.4F + 0.2Qz1 + 0.3Qz2)";
    }
  }

  switch (subjectKey) {
    case "maths1": case "english1": case "computational": case "english2":
      return "max(0.6F + 0.3max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2)";
    case "statistics1": case "statistics2":
      return "max(0.6F + 0.3max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2) + Bonus";
    case "maths2":
      return "min(100, max(0.6F + 0.3max(Q1,Q2), 0.45F + 0.25Q1 + 0.3Q2) + Bonus)";
    case "python":
      return "0.15*Qz1 + 0.4*F + 0.25*max(OPPE) + 0.2*min(OPPE) (Req: OPPE >= 40)";
    case "mlf": case "mlt": case "ml_techniques":
      return "0.05*GAA + max(0.6F+0.25max(Qz), 0.4F+0.25Qz1+0.3Qz2) + Bonus";
    case "mlp": case "machinelearning_practice":
      return "0.1*GAA + 0.3*F + 0.2*OPPE1 + 0.2*OPPE2 + 0.2*KA (Req: OPPE >= 40)";
    case "bdm": case "business_data_management":
      return "GA + Qz1 + Qz2 + F";
    case "ba": case "business_analytics":
      return "2*(0.7max(Qz)+0.3min(Qz)) + A + F + Bonus (Req: F >= 10/40)";
    case "programming_python": case "pdsa":
      return "0.05*GAA + 0.2*OP + 0.45*F + max(0.2max(Qz), 0.1Qz1+0.2Qz2) (Req: OPPE >= 40)";
    case "databasems": case "dbms":
      return "0.03*GAA2 + 0.02*GAA3 + 0.2*OP + 0.45*F + max(0.2max(Qz), 0.1Qz1+0.2Qz2) (Req: OP >= 35)";
    case "appdev1": case "appdev2":
      return "0.05*GAA + max(0.6F+0.25max(Qz), 0.4F+0.25Qz1+0.3Qz2)";
    case "java": case "java_programming":
      return "0.05*GAA + 0.2*max(PE) + 0.45*F + max(0.2max(Qz), 0.1Qz1+0.2Qz2) + 0.1*min(PE) (Req: PE >= 30)";
    case "systemcommands": case "system-commands":
      return "0.05*GAA + 0.25*Qz1 + 0.3*OPPE + 0.3*F + 0.1*BPTA (Req: OPPE >= 40)";
    case "tools_data_science": case "tds":
      return "0.2*GAA + 0.2*ROE + 0.2*P1 + 0.2*P2 + 0.2*F";
    case "software_engineering":
      return "0.05*GAA + 0.2*Qz2 + 0.4*F + 0.1*GP1 + 0.1*GP2 + 0.1*PP + 0.05*CP";
    case "dl-genai": case "intro_dl_genai":
      return "0.1*GAA + 0.2*Qz1 + 0.2*Qz2 + 0.25*F + 0.1*NPPE1 + 0.15*NPPE2";
    case "int_bigdata": case "big-data":
      return "0.1*GAA + 0.3*F + 0.2*OPPE1 + 0.4*OPPE2 + Bonus (Req: OPPE >= 40)";
    case "mlops":
      return "0.2*GAA + 0.3*F + 0.25*OPPE1 + 0.25*OPPE2 + Bonus";
    case "c_prog": case "c-programming":
      return "0.1*GAA + 0.2*Qz1 + 0.2*OPPE1 + 0.2*OPPE2 + 0.3*F (Req: OPPE >= 40)";
    case "deep-learning": case "deep_learning": case "dl-cv": case "deep_learning_cv":
      return "0.05*GAA + 0.25*Qz1 + 0.25*Qz2 + 0.45*F + Bonus";
    case "llms": case "math_foundations_genai":
      return "0.05*GAA + 0.35*F + 0.2*Qz1 + 0.2*Qz2 + 0.2*NPPE + Bonus";
    case "managerial-economics":
      return "0.15*GAA + max(0.2*Qz1 + 0.2*Qz2 + 0.45*F, 0.5*F + 0.25*max(Qz))";
    case "speech_technology":
      return "0.15*GAA + 0.15*V + 0.3*F + 0.2*Qz1 + 0.2*Qz2";
    case "ds_ai_lab":
      return "0.15*GAA + 0.2*Qz2 + 0.5*P + 0.15*V + Bonus (Req: Viva >= 55)";
    case "app_dev_lab":
      return "0.2*Qz2 + 0.3*GA + 0.5*V (Req: Viva >= 50)";
    case "algo_thinking_bio":
      return "0.075*GAA + 0.025*GRPa + 0.25*Qz1 + 0.25*Qz2 + 0.4*F";
    case "market_research":
      return "0.1*GAA + 0.2*Qz1 + 0.2*Qz2 + 0.25*P + 0.25*F";
    default:
      return "0.1*GAA + 0.4*F + 0.25*Qz1 + 0.25*Qz2";
  }
}

// ==========================================
// CALCULATIONS
// ==========================================

export function calculateFoundationGrade(subjectKey: string, values: Record<string, number>): number {
  const { Qz1 = 0, Qz2 = 0, F = 0, OPPE1 = 0, OPPE2 = 0, Bonus = 0, 
          GAA = 0, NPPE = 0, OPE = 0, BPTA = 0, VMT = 0, 
          GRPA = 0, EXP = 0, RPT = 0, TLA = 0, IL = 0, OL = 0, Viva = 0 } = values;

  if (subjectKey.startsWith("es_")) {
    switch (subjectKey) {
      case "es_english1": case "es_math1": case "es_estc": case "es_english2":
      case "es_digital": case "es_eec":
        return calculateESStandardTheory(values) + (subjectKey === "es_eec" ? Bonus : 0);
      case "es_estc_lab": return 0.5 * EXP + 0.5 * RPT;
      case "es_intro_c": return 0.15 * Qz1 + 0.4 * F + 0.25 * Math.max(OPPE1, OPPE2) + 0.2 * Math.min(OPPE1, OPPE2);
      case "es_intro_c_lab": return 0.5 * TLA + 0.5 * IL;
      case "es_linux": return 0.1 * GAA + 0.05 * NPPE + 0.2 * Qz1 + 0.25 * OPE + 0.3 * F + 0.05 * BPTA + 0.05 * VMT;
      case "es_linux_lab": return 0.5 * OL + 0.5 * IL;
      case "es_electronics_lab": return calculateESStandardLab(values);
      case "es_embedded_c":
        const termEnd = Math.max(0.5 * F + 0.2 * Math.max(Qz1, Qz2), 0.4 * F + 0.2 * Qz1 + 0.2 * Qz2);
        return 0.1 * GAA + 0.1 * GRPA + termEnd;
      case "es_embedded_c_lab": return 20 + 0.8 * Viva;
      default: return calculateESStandardTheory(values);
    }
  }

  switch (subjectKey) {
    case "python":
      return 0.15 * Qz1 + 0.4 * F + 0.25 * Math.max(OPPE1, OPPE2) + 0.2 * Math.min(OPPE1, OPPE2);
    case "statistics1": case "statistics2": case "maths2":
      return calculateDSFoundationStandard(values) + Bonus;
    case "maths2_clamped":
      return Math.min(100, calculateDSFoundationStandard(values) + Bonus);
    default:
      return calculateDSFoundationStandard(values);
  }
}

export function calculateDiplomaGrade(subjectKey: string, values: Record<string, number>): number {
  const { GAA = 0, GA = 0, Qz1 = 0, Qz2 = 0, F = 0, OPPE1 = 0, OPPE2 = 0, KA = 0, 
          A = 0, Bonus = 0, PE1 = 0, PE2 = 0, OP = 0,
          GrPA = 0, GAA1 = 0, GAA2 = 0, LE = 0, LV = 0, ROE = 0, P1 = 0, P2 = 0,
          NPPE1 = 0, NPPE2 = 0 } = values;

  if (subjectKey.startsWith("es_")) {
    switch (subjectKey) {
      case "es_math2": case "es_analog": case "es_sensors": case "es_control":
        return calculateESStandardTheory(values);
      case "es_signals": case "es_dsd":
        return 0.1 * GAA + 0.1 * GrPA + Math.max(0.5 * F + 0.2 * Math.max(Qz1, Qz2), 0.4 * F + 0.2 * Qz1 + 0.2 * Qz2);
      case "es_python_diploma":
        return 0.1 * GAA1 + 0.1 * GAA2 + 0.1 * Qz1 + 0.4 * F + 0.25 * Math.max(PE1, PE2) + 0.15 * Math.min(PE1, PE2);
      case "es_dsp":
        return 0.1 * GAA + 0.1 * LE + 0.05 * LV + Math.max(0.55 * F + 0.1 * Math.max(Qz1, Qz2), 0.45 * F + 0.15 * Qz1 + 0.15 * Qz2);
      case "es_analog_lab": case "es_sensors_lab": case "es_dsd_lab":
        return calculateESStandardLab(values);
      default: return calculateESStandardTheory(values);
    }
  }

  switch (subjectKey) {
    case "mlf": case "mlt": case "ml_techniques": case "machinelearning":
    case "appdev1": case "appdev2":
      const opt1 = 0.6 * F + 0.25 * Math.max(Qz1, Qz2);
      const opt2 = 0.4 * F + 0.25 * Qz1 + 0.3 * Qz2;
      return 0.05 * GAA + Math.max(opt1, opt2) + Bonus;
    case "mlp": case "machinelearning_practice":
      return 0.1 * GAA + 0.3 * F + 0.2 * OPPE1 + 0.2 * OPPE2 + 0.2 * KA;
    case "bdm": case "business_data_management":
      return GA + Qz1 + Qz2 + F;
    case "ba": case "business_analytics":
      const qzComp = 2 * (0.7 * Math.max(Qz1, Qz2) + 0.3 * Math.min(Qz1, Qz2));
      return qzComp + A + F + Bonus; 
    case "pdsa": case "programming_python": 
      const optPDSA1 = 0.2 * Math.max(Qz1, Qz2);
      const optPDSA2 = 0.1 * Qz1 + 0.2 * Qz2;
      return 0.05 * GAA + 0.2 * OP + 0.45 * F + Math.max(optPDSA1, optPDSA2);
    case "dbms": case "databasems":
      const gaaDBMS = 0.03 * (values.GAA2 || 0) + 0.02 * (values.GAA3 || 0);
      const optDBMS1 = 0.2 * Math.max(Qz1, Qz2);
      const optDBMS2 = 0.1 * Qz1 + 0.2 * Qz2;
      return gaaDBMS + 0.2 * OP + 0.45 * F + Math.max(optDBMS1, optDBMS2);
    case "java": case "java_programming":
      const optJ1 = 0.2 * Math.max(Qz1, Qz2);
      const optJ2 = 0.1 * Qz1 + 0.2 * Qz2;
      return 0.05 * GAA + 0.2 * Math.max(PE1, PE2) + 0.45 * F + Math.max(optJ1, optJ2) + 0.1 * Math.min(PE1, PE2);
    case "systemcommands": case "system-commands":
      return 0.05 * GAA + 0.25 * Qz1 + 0.3 * (values.OPPE || 0) + 0.3 * F + 0.1 * (values.BPTA || 0);
    case "intro_dl_genai": case "dl-genai":
      return 0.1 * GAA + 0.2 * Qz1 + 0.2 * Qz2 + 0.25 * F + 0.1 * NPPE1 + 0.15 * NPPE2;
    case "tools_data_science": case "tds":
      return 0.2 * GAA + 0.2 * ROE + 0.2 * P1 + 0.2 * P2 + 0.2 * F;
    default: return calculateDSDiplomaStandard(values);
  }
}

export function calculateDegreeGrade(subjectKey: string, values: Record<string, number>): number {
  const { GAA = 0, GA = 0, Qz1 = 0, Qz2 = 0, Qz3 = 0, F = 0, Bonus = 0, 
          GP1 = 0, GP2 = 0, PP = 0, CP = 0, GP = 0, 
          OPPE1 = 0, OPPE2 = 0, NPPE = 0, 
          NPPE1 = 0, NPPE2 = 0, NPPE3 = 0, P = 0, V = 0, GRPa = 0, Viva = 0 } = values;

  if (subjectKey.startsWith("es_")) {
    switch (subjectKey) {
      case "es_comp_org": case "es_em_fields":
        return calculateESStandardTheory(values);
      case "es_epd": return (GAA * 3) + 0.5 * (Qz1 + Qz2) + 0.3 * F;
      case "es_strategies": return 0.15 * GAA + 0.25 * GP + 0.25 * Qz2 + 0.35 * F;
      case "es_embedded_linux": case "es_testing":
        return 0.2 * GAA + Math.max(0.5 * F + 0.2 * Math.max(Qz1, Qz2), 0.4 * F + 0.2 * Qz1 + 0.2 * Qz2);
      case "es_embedded_linux_lab": return 20 + 0.8 * Viva;
      default: return calculateESStandardTheory(values);
    }
  }

  switch (subjectKey) {
    case "software_engineering":
      return 0.05 * GAA + 0.2 * Qz2 + 0.4 * F + 0.1 * GP1 + 0.1 * GP2 + 0.1 * PP + 0.05 * CP;
    case "strat_prof_growth":
      return 0.15 * GAA + 0.25 * GP + 0.25 * Qz2 + 0.35 * F;
    case "deep-learning": case "deep_learning": case "dl-cv": case "deep_learning_cv":
      return 0.05 * GAA + 0.25 * Qz1 + 0.25 * Qz2 + 0.45 * F + Bonus;
    case "llms": case "math_foundations_genai":
      return 0.05 * GAA + 0.35 * F + 0.2 * Qz1 + 0.2 * Qz2 + 0.2 * NPPE + Bonus;
    case "int_bigdata": case "big_data":
      return 0.1 * GAA + 0.3 * F + 0.2 * OPPE1 + 0.4 * OPPE2 + Bonus;
    case "mlops":
      return Math.min(100, 0.2 * GAA + 0.3 * F + 0.25 * OPPE1 + 0.25 * OPPE2 + Bonus);
    case "c_prog": case "c-programming":
      return 0.10 * GAA + 0.20 * Qz1 + 0.20 * OPPE1 + 0.20 * OPPE2 + 0.30 * F;
    case "deep_learning_practice":
      const nppeAvg = (NPPE1 + NPPE2 + NPPE3) / 3;
      return 0.05 * GA + 0.15 * Qz1 + 0.15 * Qz2 + 0.15 * Qz3 + 0.25 * nppeAvg + 0.25 * Viva;
    case "managerial-economics": case "advanced_algorithms":
      const optDeg1 = 0.2 * Qz1 + 0.2 * Qz2 + 0.45 * F;
      const optDeg2 = 0.5 * F + 0.25 * Math.max(Qz1, Qz2);
      return 0.15 * GAA + Math.max(optDeg1, optDeg2);
    case "speech_technology":
      return 0.15 * GAA + 0.15 * V + 0.3 * F + 0.2 * Qz1 + 0.2 * Qz2;
    case "ds_ai_lab":
      return 0.15 * GAA + 0.2 * Qz2 + 0.5 * P + 0.15 * V + Bonus;
    case "app_dev_lab":
      return 0.2 * Qz2 + 0.3 * GA + 0.5 * V;
    case "algo_thinking_bio":
      return 0.075 * GAA + 0.025 * GRPa + 0.25 * Qz1 + 0.25 * Qz2 + 0.4 * F;
    case "market_research":
      return 0.1 * GAA + 0.2 * Qz1 + 0.2 * Qz2 + 0.25 * P + 0.25 * F;
    default: return 0.1 * GAA + 0.4 * F + 0.25 * Qz1 + 0.25 * Qz2;
  }
}

// ==========================================
// FINAL OUTPUT UTILITIES
// ==========================================

export function getGradeLetter(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  if (score >= 40) return "E";
  return "U";
}

export function getGradePoints(score: number): number {
  if (score >= 90) return 10;
  if (score >= 80) return 9;
  if (score >= 70) return 8;
  if (score >= 60) return 7;
  if (score >= 50) return 6;
  if (score >= 40) return 4;
  return 0;
}

// ==========================================
// MASTER WRAPPER (INCLUDES ELIGIBILITY)
// ==========================================

export function calculateGradeByLevel(level: Level, subjectKey: string, values: Record<string, number>): number {
  let rawScore = 0;
  switch (level) {
    case "foundation": rawScore = calculateFoundationGrade(subjectKey, values); break;
    case "diploma": rawScore = calculateDiplomaGrade(subjectKey, values); break;
    case "degree": rawScore = calculateDegreeGrade(subjectKey, values); break;
    default: return 0;
  }

  let isEligible = true;

  // 1. STRICT FOUNDATION SAFETY NET
  const foundationSubjects = [
    "maths1", "english1", "computational", "statistics1", "maths2", "english2", "python", "statistics2",
    "es_english1", "es_math1", "es_estc", "es_intro_c", "es_english2", "es_linux", "es_digital", "es_eec", "es_embedded_c"
  ];
  if (foundationSubjects.includes(subjectKey)) {
    if (values.GAA === undefined || Number(values.GAA) < 40) isEligible = false;
  }

  // 2. FETCH BLUEPRINT
  let subjectDetails;
  for (const lvl in ALL_SUBJECTS) {
    const found = ALL_SUBJECTS[lvl].find(s => s.key === subjectKey);
    if (found) { subjectDetails = found; break; }
  }

  if (subjectDetails) {
    // 3. BLUEPRINT GAA/GA CHECKS
    const hasGAA = subjectDetails.fields.some(f => f.id === "GAA");
    const hasGA = subjectDetails.fields.some(f => f.id === "GA");

    if (hasGAA && !foundationSubjects.includes(subjectKey)) {
      if (values.GAA === undefined || Number(values.GAA) < 40) isEligible = false;
    }
    
    if (hasGA) {
      if (subjectKey === "business_data_management" || subjectKey === "bdm") {
        if (values.GA === undefined || Number(values.GA) < 4) isEligible = false;
      } else {
        if (values.GA === undefined || Number(values.GA) < 40) isEligible = false;
      }
    }

    // 4. QUIZ ATTENDANCE CHECKS
    const quizFields = subjectDetails.fields.filter(f => f.id.startsWith("Qz") || f.id.startsWith("Q1") || f.id.startsWith("Q2"));
    if (quizFields.length > 0) {
      const attendedQuiz = quizFields.some(f => values[f.id] !== undefined);
      if (!attendedQuiz) isEligible = false;
    }
  }

  // 5. SUBJECT-SPECIFIC EXAMS
  const oppeSubjects = [
    "python", "mlp", "machinelearning_practice", "pdsa", "programming_python", 
    "systemcommands", "system-commands", "int_bigdata", "big-data", "c_prog", "c-programming"
  ];
  if (oppeSubjects.includes(subjectKey)) {
    const maxOppe = Math.max(Number(values.OPPE1 || 0), Number(values.OPPE2 || 0), Number(values.OPPE || 0), Number(values.OP || 0));
    if (maxOppe < 40) isEligible = false;
  }

  if (subjectKey === "java" || subjectKey === "java_programming") {
    const maxPe = Math.max(Number(values.PE1 || 0), Number(values.PE2 || 0));
    if (maxPe < 30) isEligible = false;
  }

  if (subjectKey === "dbms" || subjectKey === "databasems") {
    if (Number(values.OP || 0) < 35) isEligible = false;
  }

  if (subjectKey === "ba" || subjectKey === "business_analytics") {
    if (Number(values.F || 0) < 10) isEligible = false;
  }

  if (subjectKey === "ds_ai_lab" && Number(values.V || 0) < 55) isEligible = false;
  if (subjectKey === "app_dev_lab" && Number(values.V || 0) < 50) isEligible = false;
  if (subjectKey === "deep_learning_practice" && Number(values.Viva || 0) < 50) isEligible = false;

  // 6. FORCE CAP TO 39 IF INELIGIBLE
  return isEligible ? rawScore : Math.min(rawScore, 39);
}
