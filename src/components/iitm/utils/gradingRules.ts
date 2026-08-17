import { getCalculatorSubject } from "../data/curriculumConfig";

export interface EligibilityIssue { message: string }

type Values = Record<string, number | undefined>;
type Requirement =
  | { type: "minimum"; field: string; minimum: number; label: string }
  | { type: "one-present"; fields: string[]; label: string };

interface FormulaProfile {
  formula: string;
  calculate: (values: Values) => number;
  requirements?: Requirement[];
  capAt100?: boolean;
}

const n = (values: Values, field: string) => Number(values[field] ?? 0);
const bonusAfterPassing = (base: number, values: Values, field = "Bonus") =>
  base >= 40 ? base + n(values, field) : base;
const maxQuiz = (v: Values) => Math.max(n(v, "Qz1"), n(v, "Qz2"));
const foundationScore = (v: Values) => Math.max(
  0.6 * n(v, "F") + 0.3 * maxQuiz(v),
  0.45 * n(v, "F") + 0.25 * n(v, "Qz1") + 0.3 * n(v, "Qz2"),
);
const electronicScore = (v: Values) => 0.1 * n(v, "GAA") + Math.max(
  0.6 * n(v, "F") + 0.2 * maxQuiz(v),
  0.4 * n(v, "F") + 0.2 * n(v, "Qz1") + 0.3 * n(v, "Qz2"),
);
const standardRequirements: Requirement[] = [
  { type: "minimum", field: "GAA", minimum: 40, label: "Assignment eligibility average" },
  { type: "one-present", fields: ["Qz1", "Qz2"], label: "at least one quiz" },
];

/** Formula and eligibility profiles. Courses select a profile through curriculumConfig.ts. */
export const FORMULA_PROFILES: Record<string, FormulaProfile> = {
  "foundation-standard": { formula: "max(0.6F + 0.3max(Qz1,Qz2), 0.45F + 0.25Qz1 + 0.3Qz2)", calculate: foundationScore, requirements: standardRequirements },
  "foundation-standard-bonus-5": { formula: "max(0.6F + 0.3max(Qz1,Qz2), 0.45F + 0.25Qz1 + 0.3Qz2) + Bonus (after passing)", calculate: v => bonusAfterPassing(foundationScore(v), v), requirements: standardRequirements, capAt100: true },
  "foundation-standard-bonus-6": { formula: "min(100, max(0.6F + 0.3max(Qz1,Qz2), 0.45F + 0.25Qz1 + 0.3Qz2) + Bonus after passing)", calculate: v => bonusAfterPassing(foundationScore(v), v), requirements: standardRequirements, capAt100: true },
  "foundation-programming": {
    formula: "0.15Qz1 + 0.4F + 0.25max(OPPE1,OPPE2) + 0.2min(OPPE1,OPPE2)",
    calculate: v => 0.15 * n(v, "Qz1") + 0.4 * n(v, "F") + 0.25 * Math.max(n(v, "OPPE1"), n(v, "OPPE2")) + 0.2 * Math.min(n(v, "OPPE1"), n(v, "OPPE2")),
    requirements: [{ type: "minimum", field: "GAA", minimum: 40, label: "Assignment eligibility average" }, { type: "one-present", fields: ["Qz1"], label: "Quiz 1" }, { type: "minimum", field: "OPPE1", minimum: 40, label: "at least one OPPE" }],
  },
  "c-programming-2026": {
    formula: "0.25Qz1 + 0.45F + max(0.15OPPE1 + 0.15OPPE2, 0.2max(OPPE1,OPPE2))",
    calculate: v => 0.25*n(v,"Qz1") + 0.45*n(v,"F") + Math.max(0.15*n(v,"OPPE1") + 0.15*n(v,"OPPE2"), 0.2*Math.max(n(v,"OPPE1"),n(v,"OPPE2"))),
    requirements: [{ type:"one-present", fields:["Qz1"], label:"Quiz 1" }, { type:"minimum", field:"OPPE1", minimum:40, label:"at least one OPPE" }],
  },
  "diploma-five-gaa": { formula: "0.05GAA + 0.4F + 0.25Qz1 + 0.25Qz2", calculate: v => 0.05 * n(v, "GAA") + 0.4 * n(v, "F") + 0.25 * n(v, "Qz1") + 0.25 * n(v, "Qz2"), requirements: standardRequirements },
  "diploma-five-gaa-best-quiz": { formula: "0.05GAA + max(0.6F + 0.25max(Qz1,Qz2), 0.4F + 0.25Qz1 + 0.3Qz2) + Bonus", calculate: v => 0.05 * n(v, "GAA") + Math.max(0.6 * n(v, "F") + 0.25 * maxQuiz(v), 0.4 * n(v, "F") + 0.25 * n(v, "Qz1") + 0.3 * n(v, "Qz2")) + n(v, "Bonus"), requirements: standardRequirements, capAt100: true },
  "diploma-five-gla-best-quiz": { formula: "0.05GLA + max(0.6F + 0.25max(Qz1,Qz2), 0.4F + 0.25Qz1 + 0.3Qz2)", calculate: v => 0.05 * n(v, "GLA") + Math.max(0.6 * n(v, "F") + 0.25 * maxQuiz(v), 0.4 * n(v, "F") + 0.25 * n(v, "Qz1") + 0.3 * n(v, "Qz2")), requirements: standardRequirements },
  "electronic-standard": { formula: "0.1GAA + max(0.6F + 0.2max(Qz1,Qz2), 0.4F + 0.2Qz1 + 0.3Qz2)", calculate: electronicScore, requirements: standardRequirements },
  "electronic-standard-bonus": { formula: "0.1GAA + max(0.6F + 0.2max(Qz1,Qz2), 0.4F + 0.2Qz1 + 0.3Qz2) + Bonus", calculate: v => electronicScore(v) + n(v, "Bonus"), requirements: standardRequirements, capAt100: true },
  "mlp": { formula: "0.1GAA + 0.3F + 0.2OPPE1 + 0.2OPPE2 + 0.2KA", calculate: v => 0.1*n(v,"GAA") + 0.3*n(v,"F") + 0.2*n(v,"OPPE1") + 0.2*n(v,"OPPE2") + 0.2*n(v,"KA"), requirements: [...standardRequirements, { type: "minimum", field: "OPPE1", minimum: 40, label: "at least one OPPE" }] },
  "bdm": { formula: "GA + Qz1 + Qz2 + F", calculate: v => n(v,"GA") + n(v,"Qz1") + n(v,"Qz2") + n(v,"F"), requirements: [{ type: "minimum", field: "GA", minimum: 4, label: "Graded assignments (out of 10)" }, { type: "one-present", fields:["Qz1","Qz2"], label:"at least one quiz" }] },
  "business-analytics": { formula: "2(0.7max(Qz1,Qz2) + 0.3min(Qz1,Qz2)) + A + F + Bonus", calculate: v => 2*(0.7*Math.max(n(v,"Qz1"),n(v,"Qz2"))+0.3*Math.min(n(v,"Qz1"),n(v,"Qz2"))) + n(v,"A") + n(v,"F") + n(v,"Bonus"), requirements: [{ type:"minimum", field:"F", minimum:10, label:"End term (out of 40)" }, { type:"one-present", fields:["Qz1","Qz2"], label:"at least one quiz" }], capAt100:true },
  "pdsa": { formula: "0.05GAA + 0.2OP + 0.45F + max(0.2max(Qz1,Qz2), 0.1Qz1 + 0.2Qz2)", calculate: v => 0.05*n(v,"GAA")+0.2*n(v,"OP")+0.45*n(v,"F")+Math.max(0.2*maxQuiz(v),0.1*n(v,"Qz1")+0.2*n(v,"Qz2")), requirements:[...standardRequirements,{type:"minimum",field:"OP",minimum:40,label:"OPPE"}] },
  "dbms": { formula: "0.03GAA2 + 0.02GAA3 + 0.2OP + 0.45F + max(0.2max(Qz1,Qz2), 0.1Qz1 + 0.2Qz2)", calculate: v => 0.03*n(v,"GAA2")+0.02*n(v,"GAA3")+0.2*n(v,"OP")+0.45*n(v,"F")+Math.max(0.2*maxQuiz(v),0.1*n(v,"Qz1")+0.2*n(v,"Qz2")), requirements:[{type:"one-present",fields:["Qz1","Qz2"],label:"at least one quiz"},{type:"minimum",field:"OP",minimum:35,label:"OPPE"}] },
  "java": { formula: "0.05GAA + 0.2max(PE1,PE2) + 0.45F + max(0.2max(Qz1,Qz2), 0.1Qz1 + 0.2Qz2) + 0.1min(PE1,PE2)", calculate:v=>0.05*n(v,"GAA")+0.2*Math.max(n(v,"PE1"),n(v,"PE2"))+0.45*n(v,"F")+Math.max(0.2*maxQuiz(v),0.1*n(v,"Qz1")+0.2*n(v,"Qz2"))+0.1*Math.min(n(v,"PE1"),n(v,"PE2")), requirements:[...standardRequirements,{type:"minimum",field:"PE1",minimum:30,label:"at least one programming exam"}] },
  "system-commands": { formula:"0.05GAA + 0.25Qz1 + 0.3OPPE + 0.3F + 0.1BPTA", calculate:v=>0.05*n(v,"GAA")+0.25*n(v,"Qz1")+0.3*n(v,"OPPE")+0.3*n(v,"F")+0.1*n(v,"BPTA"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"one-present",fields:["Qz1"],label:"Quiz 1"},{type:"minimum",field:"OPPE",minimum:40,label:"OPPE"}] },
  "dl-genai": { formula:"0.1GAA + 0.2Qz1 + 0.2Qz2 + 0.25F + 0.1NPPE1 + 0.15NPPE2", calculate:v=>0.1*n(v,"GAA")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2")+0.25*n(v,"F")+0.1*n(v,"NPPE1")+0.15*n(v,"NPPE2"), requirements:standardRequirements },
  "tds": { formula:"0.2GAA + 0.2ROE + 0.2P1 + 0.2P2 + 0.2F", calculate:v=>0.2*n(v,"GAA")+0.2*n(v,"ROE")+0.2*n(v,"P1")+0.2*n(v,"P2")+0.2*n(v,"F"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"}] },
  "degree-standard": { formula:"0.1GAA + 0.4F + 0.25Qz1 + 0.25Qz2", calculate:v=>0.1*n(v,"GAA")+0.4*n(v,"F")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2"), requirements:standardRequirements },
  "software-engineering": { formula:"0.05GAA + 0.2Qz2 + 0.4F + 0.1GP1 + 0.1GP2 + 0.1PP + 0.05CP", calculate:v=>0.05*n(v,"GAA")+0.2*n(v,"Qz2")+0.4*n(v,"F")+0.1*n(v,"GP1")+0.1*n(v,"GP2")+0.1*n(v,"PP")+0.05*n(v,"CP"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"one-present",fields:["Qz2"],label:"Quiz 2"}] },
  "strategies": { formula:"0.15GAA + 0.25GP + 0.25Qz2 + 0.35F", calculate:v=>0.15*n(v,"GAA")+0.25*n(v,"GP")+0.25*n(v,"Qz2")+0.35*n(v,"F"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"one-present",fields:["Qz2"],label:"Quiz 2"}] },
  "deep-learning": { formula:"0.05GAA + 0.25Qz1 + 0.25Qz2 + 0.45F + Bonus after passing", calculate:v=>bonusAfterPassing(0.05*n(v,"GAA")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2")+0.45*n(v,"F"),v), requirements:standardRequirements,capAt100:true },
  "degree-standard-bonus": { formula:"0.1GAA + 0.4F + 0.25Qz1 + 0.25Qz2 + Bonus after passing", calculate:v=>bonusAfterPassing(0.1*n(v,"GAA")+0.4*n(v,"F")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2"),v), requirements:standardRequirements,capAt100:true },
  "large-language-models": { formula:"0.05GAA + 0.35F + 0.3Qz1 + 0.3Qz2 + Bonus after passing", calculate:v=>bonusAfterPassing(0.05*n(v,"GAA")+0.35*n(v,"F")+0.3*n(v,"Qz1")+0.3*n(v,"Qz2"),v), requirements:standardRequirements,capAt100:true },
  "ads": { formula:"0.1GAA + 0.1PAA + 0.35Qz2 + 0.45F + Bonus", calculate:v=>0.1*n(v,"GAA")+0.1*n(v,"PAA")+0.35*n(v,"Qz2")+0.45*n(v,"F")+n(v,"Bonus"), requirements:[{ type:"minimum", field:"GAA", minimum:40, label:"best 2 of the first 3 theory assignments" }, { type:"one-present", fields:["Qz2"], label:"Quiz 2" }],capAt100:true },
  "data-visualization": { formula:"0.3GA + max(0.2Qz1 + 0.2Qz2, 0.3max(Qz1,Qz2)) + 0.3P + Bonus", calculate:v=>0.3*n(v,"GA")+Math.max(0.2*n(v,"Qz1")+0.2*n(v,"Qz2"),0.3*maxQuiz(v))+0.3*n(v,"P")+n(v,"Bonus"), requirements:[{ type:"minimum",field:"GA",minimum:40,label:"best 3 of 5 graded assignments" },{type:"one-present",fields:["Qz1","Qz2"],label:"at least one quiz"},{type:"minimum",field:"P",minimum:50,label:"group project"}],capAt100:true },
  "design-thinking": { formula:"0.1GAA + 0.1GP1 + 0.1GP2 + 0.2GP3 + 0.2Qz2 + 0.3F", calculate:v=>0.1*n(v,"GAA")+0.1*n(v,"GP1")+0.1*n(v,"GP2")+0.2*n(v,"GP3")+0.2*n(v,"Qz2")+0.3*n(v,"F"), requirements:[{ type:"minimum",field:"GAA",minimum:40,label:"assignment eligibility average" },{type:"minimum",field:"GP3",minimum:60,label:"final project"}] },
  "privacy-security": { formula:"0.2GAA + 0.3F + 0.25Qz1 + 0.25Qz2", calculate:v=>0.2*n(v,"GAA")+0.3*n(v,"F")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2"), requirements:standardRequirements },
  "computer-systems": { formula:"0.1GAA + 0.4F + 0.2Qz1 + 0.25Qz2 + 0.05CircuitVerse assignment", calculate:v=>0.1*n(v,"GAA")+0.4*n(v,"F")+0.2*n(v,"Qz1")+0.25*n(v,"Qz2")+0.05*n(v,"CVA"), requirements:standardRequirements },
  "big-data": { formula:"0.1GAA + 0.3F + 0.2OPPE1 + 0.4OPPE2 + Bonus", calculate:v=>0.1*n(v,"GAA")+0.3*n(v,"F")+0.2*n(v,"OPPE1")+0.4*n(v,"OPPE2")+n(v,"Bonus"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"minimum",field:"OPPE1",minimum:40,label:"at least one OPPE"}] },
  "c-programming": { formula:"0.1GAA + 0.2Qz1 + 0.2OPPE1 + 0.2OPPE2 + 0.3F", calculate:v=>0.1*n(v,"GAA")+0.2*n(v,"Qz1")+0.2*n(v,"OPPE1")+0.2*n(v,"OPPE2")+0.3*n(v,"F"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"one-present",fields:["Qz1"],label:"Quiz 1"},{type:"minimum",field:"OPPE1",minimum:40,label:"at least one OPPE"}] },
  "deep-learning-practice": { formula:"0.05GA + 0.15Qz1 + 0.15Qz2 + 0.15Qz3 + 0.25avg(NPPE1,NPPE2,NPPE3) + 0.25Viva", calculate:v=>0.05*n(v,"GA")+0.15*n(v,"Qz1")+0.15*n(v,"Qz2")+0.15*n(v,"Qz3")+0.25*(n(v,"NPPE1")+n(v,"NPPE2")+n(v,"NPPE3"))/3+0.25*n(v,"Viva"), requirements:[{type:"minimum",field:"GA",minimum:40,label:"Assignment eligibility average"},{type:"minimum",field:"Viva",minimum:50,label:"Viva"}] },
  "math-genai": { formula:"0.05GAA + 0.35F + 0.2Qz1 + 0.2Qz2 + 0.2NPPE + Bonus", calculate:v=>0.05*n(v,"GAA")+0.35*n(v,"F")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2")+0.2*n(v,"NPPE")+n(v,"Bonus"), requirements:standardRequirements,capAt100:true },
  "mlops": { formula:"0.2GAA + 0.3F + 0.25OPPE1 + 0.25OPPE2 + Bonus", calculate:v=>0.2*n(v,"GAA")+0.3*n(v,"F")+0.25*n(v,"OPPE1")+0.25*n(v,"OPPE2")+n(v,"Bonus"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"}],capAt100:true },
  "managerial-economics": { formula:"0.15GAA + max(0.2Qz1 + 0.2Qz2 + 0.45F, 0.5F + 0.25max(Qz1,Qz2))", calculate:v=>0.15*n(v,"GAA")+Math.max(0.2*n(v,"Qz1")+0.2*n(v,"Qz2")+0.45*n(v,"F"),0.5*n(v,"F")+0.25*maxQuiz(v)), requirements:standardRequirements },
  "speech": { formula:"0.15GAA + 0.15V + 0.3F + 0.2Qz1 + 0.2Qz2", calculate:v=>0.15*n(v,"GAA")+0.15*n(v,"V")+0.3*n(v,"F")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2"), requirements:standardRequirements },
  "ds-ai-lab": { formula:"0.15GAA + 0.2Qz2 + 0.5P + 0.15V + Bonus", calculate:v=>0.15*n(v,"GAA")+0.2*n(v,"Qz2")+0.5*n(v,"P")+0.15*n(v,"V")+n(v,"Bonus"), requirements:[{type:"minimum",field:"GAA",minimum:40,label:"Assignment eligibility average"},{type:"minimum",field:"V",minimum:55,label:"Viva"}],capAt100:true },
  "app-dev-lab": { formula:"0.2Qz2 + 0.3GA + 0.5V", calculate:v=>0.2*n(v,"Qz2")+0.3*n(v,"GA")+0.5*n(v,"V"), requirements:[{type:"minimum",field:"GA",minimum:40,label:"Weekly assignments"},{type:"minimum",field:"V",minimum:50,label:"Project viva"}] },
  "algo-bio": { formula:"0.075GAA + 0.025GRPa + 0.25Qz1 + 0.25Qz2 + 0.4F", calculate:v=>0.075*n(v,"GAA")+0.025*n(v,"GRPa")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2")+0.4*n(v,"F"), requirements:standardRequirements },
  "market-research": { formula:"0.1GAA + 0.2Qz1 + 0.2Qz2 + 0.25P + 0.25F", calculate:v=>0.1*n(v,"GAA")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2")+0.25*n(v,"P")+0.25*n(v,"F"), requirements:standardRequirements },
  "lab-experiment-report": { formula:"0.5Experiment + 0.5Report", calculate:v=>0.5*n(v,"EXP")+0.5*n(v,"RPT") },
  "lab-timed-campus": { formula:"0.5Timed Lab + 0.5In-Campus Lab", calculate:v=>0.5*n(v,"TLA")+0.5*n(v,"IL") },
  "lab-online-campus": { formula:"0.5Online Lab + 0.5In-Campus Lab", calculate:v=>0.5*n(v,"OL")+0.5*n(v,"IL") },
  "lab-weekly-demo": { formula:"0.4Weekly Experiments + 0.6In-Person Demonstration", calculate:v=>0.4*n(v,"WE")+0.6*n(v,"ID"),requirements:[{type:"minimum",field:"WE",minimum:40,label:"Weekly experiments"}] },
  "lab-attendance-viva": { formula:"20 (attendance) + 0.8Viva", calculate:v=>20+0.8*n(v,"Viva") },
  "linux": { formula:"0.25Qz1 + 0.25OPE + 0.35F + 0.1BPTA + 0.05VMT", calculate:v=>0.25*n(v,"Qz1")+0.25*n(v,"OPE")+0.35*n(v,"F")+0.1*n(v,"BPTA")+0.05*n(v,"VMT"), requirements:[{type:"one-present",fields:["Qz1"],label:"Quiz 1"}] },
  "embedded-c": { formula:"0.1GRPA + max(0.5F + 0.3max(Qz1,Qz2), 0.4F + 0.25Qz1 + 0.25Qz2)", calculate:v=>0.1*n(v,"GRPA")+Math.max(0.5*n(v,"F")+0.3*maxQuiz(v),0.4*n(v,"F")+0.25*n(v,"Qz1")+0.25*n(v,"Qz2")), requirements:standardRequirements },
  "signals-dsd": { formula:"0.1GAA + 0.1GrPA + max(0.5F+0.2max(Qz1,Qz2), 0.4F+0.2Qz1+0.2Qz2)", calculate:v=>0.1*n(v,"GAA")+0.1*n(v,"GrPA")+Math.max(0.5*n(v,"F")+0.2*maxQuiz(v),0.4*n(v,"F")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2")), requirements:standardRequirements },
  "python-diploma": { formula:"0.1GAA1 + 0.1GAA2 + 0.1Qz1 + 0.4F + 0.25max(PE1,PE2) + 0.15min(PE1,PE2)", calculate:v=>0.1*n(v,"GAA1")+0.1*n(v,"GAA2")+0.1*n(v,"Qz1")+0.4*n(v,"F")+0.25*Math.max(n(v,"PE1"),n(v,"PE2"))+0.15*Math.min(n(v,"PE1"),n(v,"PE2")), requirements:[{type:"one-present",fields:["Qz1"],label:"Quiz 1"}] },
  "dsp": { formula:"0.1GAA + 0.1LE + 0.05LV + max(0.55F+0.1max(Qz1,Qz2), 0.45F+0.15Qz1+0.15Qz2)", calculate:v=>0.1*n(v,"GAA")+0.1*n(v,"LE")+0.05*n(v,"LV")+Math.max(0.55*n(v,"F")+0.1*maxQuiz(v),0.45*n(v,"F")+0.15*n(v,"Qz1")+0.15*n(v,"Qz2")), requirements:standardRequirements },
  "electronic-product-design": { formula:"3GAA + 0.5(Qz1+Qz2) + 0.3F", calculate:v=>3*n(v,"GAA")+0.5*(n(v,"Qz1")+n(v,"Qz2"))+0.3*n(v,"F"), requirements:standardRequirements },
  "embedded-linux": { formula:"0.2GAA + max(0.5F+0.2max(Qz1,Qz2), 0.4F+0.2Qz1+0.2Qz2)", calculate:v=>0.2*n(v,"GAA")+Math.max(0.5*n(v,"F")+0.2*maxQuiz(v),0.4*n(v,"F")+0.2*n(v,"Qz1")+0.2*n(v,"Qz2")), requirements:standardRequirements },
};

export function getFormula(subjectKey: string): string {
  const profile = getCalculatorSubject(subjectKey)?.formulaProfile;
  return (profile && FORMULA_PROFILES[profile]?.formula) || "Formula not configured";
}

export function calculateConfiguredGrade(subjectKey: string, values: Values): number {
  const profileName = getCalculatorSubject(subjectKey)?.formulaProfile;
  const profile = profileName && FORMULA_PROFILES[profileName];
  if (!profile) return 0;
  const score = profile.calculate(values);
  return profile.capAt100 ? Math.min(100, score) : score;
}

export function getEligibilityIssue(subjectKey: string, values: Values): EligibilityIssue | null {
  const profileName = getCalculatorSubject(subjectKey)?.formulaProfile;
  const profile = profileName && FORMULA_PROFILES[profileName];
  if (!profile) return { message: "This course has no published grading formula configured yet." };
  for (const requirement of profile.requirements || []) {
    if (requirement.type === "minimum") {
      if (n(values, requirement.field) < requirement.minimum) return { message: `${requirement.label} must be at least ${requirement.minimum}.` };
    } else if (!requirement.fields.some((field) => values[field] !== undefined)) {
      return { message: `You must enter ${requirement.label}; enter 0 if you attended and scored zero.` };
    }
  }
  return null;
}

export const GRADE_BANDS = [
  { letter: "S", minimum: 90, points: 10 }, { letter: "A", minimum: 80, points: 9 },
  { letter: "B", minimum: 70, points: 8 }, { letter: "C", minimum: 60, points: 7 },
  { letter: "D", minimum: 50, points: 6 }, { letter: "E", minimum: 40, points: 4 },
] as const;
