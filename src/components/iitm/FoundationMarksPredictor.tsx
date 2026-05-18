import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ALL_SUBJECTS } from "./data/subjectsData";
import { calculateFoundationGrade } from "./utils/gradeCalculations";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";
import { logToolUsage } from "@/utils/toolLogger";

interface FoundationMarksPredictorProps {
  branch: string;
  level: string;
}

const GRADES: [string, number][] = [
  ["Pass", 40],
  ["D", 50],
  ["C", 60],
  ["B", 70],
  ["A", 80],
  ["S", 90],
];

function calcRequiredF(subjectKey: string, inputs: Record<string, number>, targetT: number): number | null {
  const clamp = (x: number, minv = 0, maxv = 100) => Math.max(minv, Math.min(maxv, x));

  for (let F = 0; F <= 100; F++) {
    const score = calculateFoundationGrade(subjectKey, { ...inputs, F });
    if (score >= targetT) return clamp(F);
  }
  return null;
}

function checkEligibility(subjectKey: string, inputs: Record<string, number>): string | null {
  const GAA_val = inputs.GAA ?? 0;
  
  if (GAA_val < 40) {
    return "Eligibility: Assignment average must be at least 40/100 to appear for end term.";
  }

  if (!["intro_linux_programming"].includes(subjectKey)) {
    if ((inputs.Qz1 ?? 0) === 0 && (inputs.Qz2 ?? 0) === 0) {
      return "Eligibility: At least one quiz (Qz1 or Qz2) must be attempted (>0).";
    }
  }

  if (subjectKey === "intro_c_programming") {
    if ((inputs.OPPE1 ?? 0) < 40 && (inputs.OPPE2 ?? 0) < 40) {
      return "Note: To PASS the subject, at least one of OPPE1 or OPPE2 must be ≥ 40.";
    }
  }

  if (subjectKey === "intro_linux_programming") {
    if ((inputs.OPE ?? 0) < 40) {
      return "Note: To PASS the subject, OPE score must be ≥ 40.";
    }
  }

  return null;
}

export default function FoundationMarksPredictor({ branch, level }: FoundationMarksPredictorProps) {
  const getSubjectsKey = () => {
    if (branch === "electronic-systems" && level === "foundation") {
      return "foundation-electronic-systems";
    }
    return "foundation";
  };

  const subjects = ALL_SUBJECTS[getSubjectsKey()] || [];
  const [subjectKey, setSubjectKey] = useState(subjects[0]?.key || "");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [requiredFs, setRequiredFs] = useState<{ grade: string; mark: number | null; already: boolean }[] | null>(null);
  const [eligibility, setEligibility] = useState<string | null>(null);
  const { user } = useAuth();
  const { openLogin } = useLoginModal();

  const subjectObj = subjects.find(s => s.key === subjectKey);

  const parseInputNumber = (val: string, min: number, max: number): number =>
    val === "" ? 0 : Math.max(min, Math.min(max, Number(val)));

  const handleInput = (id: string, val: string) => {
    if (/^(\d{0,3})$/.test(val) || val === "") {
      setInputs(prev => ({ ...prev, [id]: val }));
    }
  };

  const handleSubjectChange = (newSubjectKey: string) => {
    setSubjectKey(newSubjectKey);
    setInputs({});
    setRequiredFs(null);
    setEligibility(null);
  };

  const handleCalculate = () => {
    if (!user) { openLogin(); return; }
    if (!subjectObj) return;

    const numericInputs: Record<string, number> = {};
    subjectObj.fields.forEach(field => {
      if (field.id !== 'F') {
        numericInputs[field.id] = parseInputNumber(inputs[field.id] ?? "", field.min, field.max);
      }
    });

    const eligMsg = checkEligibility(subjectKey, numericInputs);
    setEligibility(eligMsg);

    const GAA_val = numericInputs.GAA ?? 0;

    if (eligMsg && eligMsg.startsWith("Eligibility:")) {
      setRequiredFs(null);
      return;
    }

    const currentScore = calculateFoundationGrade(subjectKey, { ...numericInputs, F: 0 });

    const out: { grade: string; mark: number | null; already: boolean }[] = [];
    for (const [grade, threshold] of GRADES) {
      if (currentScore >= threshold) {
        out.push({ grade, mark: null, already: true });
        continue;
      }
      const val = calcRequiredF(subjectKey, numericInputs, threshold);
      out.push({
        grade,
        mark: val === null || val > 100 ? null : Math.ceil(val * 100) / 100,
        already: false,
      });
    }
    
    // Log tool usage silently
    try {
      const metaKeys = ["id","name","credits","grade","subject","marks","scores","result","target"];
      const scores: Record<string, number> = {};
      Object.entries(numericInputs).forEach(([key, val]) => {
        if (!metaKeys.includes(key)) {
          scores[key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")] = val;
        }
      });
      logToolUsage({
        toolName: "Foundation Marks Predictor",
        branch,
        level,
        inputDetails: { subject_details: { subject: subjectObj.name, scores } },
        resultDetails: out
      });
    } catch (e) { /* silent */ }

    setRequiredFs(out);
  };

  const handleReset = () => {
    setInputs({});
    setRequiredFs(null);
    setEligibility(null);
  };

  if (!subjectObj) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            No subjects available for the selected branch and level combination.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foundation Subject Final Exam Marks Predictor</CardTitle>
        <div className="text-sm text-gray-600">
          {branch === "electronic-systems" ? "BS Electronic Systems" : "BS Data Science"} - Foundation Level
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Subject</Label>
            <Select value={subjectKey} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subj => (
                  <SelectItem key={subj.key} value={subj.key}>{subj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {subjectObj.fields.filter(f => f.id !== 'F').map(f => (
            <div key={f.id}>
              <Label>{f.label}</Label>
              <Input
                type="number"
                min={f.min}
                max={f.max}
                value={inputs[f.id] ?? ""}
                placeholder="0"
                onChange={e => handleInput(f.id, e.target.value)}
                inputMode="numeric"
              />
            </div>
          ))}
        </div>

        {/* Calculate & Reset Buttons */}
        <div className="flex gap-3 mb-4">
          <Button onClick={handleCalculate} className="bg-blue-700 hover:bg-blue-800 text-white">
            Calculate
          </Button>
          {requiredFs && (
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Eligibility info */}
        {eligibility && eligibility.startsWith("Eligibility:") ? (
          <div className="p-3 rounded bg-yellow-100 text-yellow-900 font-medium mb-4">
            {eligibility}
          </div>
        ) : eligibility ? (
          <div className="p-3 rounded bg-blue-100 text-blue-900 font-medium mb-4">
            {eligibility}
          </div>
        ) : requiredFs ? (
          <div className="p-3 rounded bg-green-50 text-green-900 font-medium mb-4">
            Eligible for end term!
          </div>
        ) : null}

        {/* Required End Term Marks Table */}
        {requiredFs && (
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Required Final Exam Marks for Each Grade</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Minimum Total Score</TableHead>
                  <TableHead>Required Final Exam Marks (/100)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requiredFs.map(({ grade, mark, already }) => (
                  <TableRow key={grade}>
                    <TableCell className="font-semibold">{grade}</TableCell>
                    <TableCell>{GRADES.find(([g]) => g === grade)?.[1]}</TableCell>
                    <TableCell>
                      {already ? (
                        <span className="text-green-700 font-semibold">Already scored</span>
                      ) : mark === null ? (
                        <span className="text-red-600 font-semibold">Not attainable</span>
                      ) : (
                        <span className="font-semibold">{mark}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Enter your scores above and click Calculate to see the minimum Final Exam marks needed for each grade.
        </div>
      </CardContent>
    </Card>
  );
}
