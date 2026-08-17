import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCalculatorSubjects, normaliseLevel, normaliseProgramme, PROGRAMMES } from "./data/curriculumConfig";
import { calculateGradeByLevel, getGradeLetter, getGradePoints } from "./utils/gradeCalculations";
import { Level } from "./types/gradeTypes";
import ScoreInputForm from "./components/ScoreInputForm";
import GradeResult from "./components/GradeResult";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { logToolUsage } from "@/utils/toolLogger";

interface GradeCalculatorProps {
  level: string; // Changed to string to safely accept "Foundation" etc.
  branch: string;
}

export default function GradeCalculator({ level, branch }: GradeCalculatorProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; letter: string; points: number } | null>(null);
  const programme = normaliseProgramme(branch);

  const filteredSubjects = useMemo(() => {
    return getCalculatorSubjects(normaliseProgramme(branch), normaliseLevel(level));
  }, [branch, level]);

  const urlSubjectKey = searchParams.get("subject");
  const currentSubject = useMemo(() => 
    filteredSubjects.find(s => s.key === urlSubjectKey),
    [filteredSubjects, urlSubjectKey]
  );

  useEffect(() => {
    if (urlSubjectKey && !currentSubject) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("subject");
        return newParams;
      }, { replace: true });
    }
  }, [urlSubjectKey, currentSubject, setSearchParams]);

  useEffect(() => {
    setInputValues({});
    setResult(null);
  }, [currentSubject?.key]);

  const handleSubjectChange = (val: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (val) {
        newParams.set("subject", val);
      } else {
        newParams.delete("subject");
      }
      return newParams;
    });
  };

  const handleInputChange = (fieldId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValues(prev => ({ ...prev, [fieldId]: value }));
    }
  };

  const calculateGrade = () => {
    if (!currentSubject) return;

    const numericValues: Record<string, number> = {};
    Object.keys(inputValues).forEach(key => {
      numericValues[key] = parseFloat(inputValues[key]) || 0;
    });

    // Pass safe level to calculation function
    const safeLevel = normaliseLevel(level) as Level;
    const score = calculateGradeByLevel(safeLevel, currentSubject.key, numericValues);
    
    const resultData = {
      score: Math.round(score * 100) / 100,
      letter: getGradeLetter(score),
      points: getGradePoints(score)
    };

    // Log tool usage silently
    try {
      const metaKeys = ["id","name","credits","grade","subject","marks","scores","result","target"];
      const scores: Record<string, number> = {};
      Object.entries(inputValues).forEach(([key, val]) => {
        if (!metaKeys.includes(key)) {
          scores[key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")] = parseFloat(val as string) || 0;
        }
      });
      logToolUsage({
        toolName: "Grade Calculator",
        branch: branch,
        level: level,
        inputDetails: { subject_details: { subject: currentSubject.name, scores } },
        resultDetails: resultData
      });
    } catch (e) { /* silent */ }

    setResult(resultData);
  };

  const resetCalculator = () => {
    setInputValues({});
    setResult(null);
  };

  return (
    <div className="w-full bg-white font-sans text-gray-900">
      <div className="w-full py-8">
        <div className="mb-10 w-full max-w-3xl relative z-50">
          <Label className="text-sm font-medium text-black font-sans mb-3 block">
            01. Select Course
          </Label>
          
          <Select 
            value={currentSubject?.key || ""} 
            onValueChange={handleSubjectChange}
          >
            <SelectTrigger className="h-12 w-full text-lg bg-white border-2 border-gray-300 focus:border-black focus:ring-0 rounded-sm font-sans font-normal relative z-10">
              <SelectValue placeholder="Choose a subject..." />
            </SelectTrigger>
            
            <SelectContent className="z-[9999] max-h-[300px] bg-white border-2 border-gray-200 shadow-xl">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <SelectItem 
                    key={subject.key} 
                    value={subject.key} 
                    className="font-sans cursor-pointer py-3 text-base focus:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    {subject.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center font-sans">
                  No published course-level grading formula is available for this programme and level in the current document. The CGPA tool still includes its published course catalogue.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="relative z-0">
          {currentSubject && (
            <ScoreInputForm 
              subject={currentSubject}
              inputValues={inputValues}
              onInputChange={handleInputChange}
              onCalculate={calculateGrade}
            />
          )}
        </div>

        {result && currentSubject && (
          <GradeResult 
            result={result} 
            inputValues={inputValues}
            subjectKey={currentSubject.key}
            onReset={resetCalculator} 
          />
        )}
      </div>
    </div>
  );
}
