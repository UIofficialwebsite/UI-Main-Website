import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { Share, AlertCircle } from "lucide-react";
import { getGradeFormula } from "../utils/gradeCalculations";
import { checkEligibilityIssues } from "../utils/predictorLogic";
import { ALL_SUBJECTS } from "../data/subjectsData";
import { Subject } from '../types/gradeTypes';

interface GradeResultProps {
  result: {
    score: number;
    letter: string;
    points: number;
  };
  inputValues: Record<string, string>;
  subjectKey: string;
  onReset: () => void;
}

export default function GradeResult({ result, inputValues, subjectKey, onReset }: GradeResultProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  const formula = getGradeFormula(subjectKey);

  const getSubjectDetails = (): Subject | undefined => {
    for (const level in ALL_SUBJECTS) {
      const found = ALL_SUBJECTS[level].find((s) => s.key === subjectKey);
      if (found) return found;
    }
    return undefined;
  };

  const subjectDetails = getSubjectDetails();

  // Run the eligibility check on the provided inputs to see if the 'U' grade is due to eligibility failure
  // We cast inputValues as any because predictorLogic naturally handles the string/number conversions and blank checks
  const eligibilityWarning = checkEligibilityIssues(subjectKey, inputValues as any);

  const getLabelForKey = (key: string) => {
    const field = subjectDetails?.fields.find((f) => f.id === key);
    return field ? field.label : key;
  };

  const getFormulaLegend = (formula: string) => {
    const legendItems = [];
    if (formula.includes("F")) legendItems.push("F = End Term Exam");
    if (formula.includes("Qz")) legendItems.push("Qz = Quiz");
    if (formula.includes("GAA")) legendItems.push("GAA = Graded Assignment Avg");
    if (formula.includes("OP") || formula.includes("OPPE")) legendItems.push("OPPE = Online Programming Exam");
    if (formula.includes("PE")) legendItems.push("PE = Programming Exam");
    if (formula.includes("Bonus")) legendItems.push("Bonus = Extra Marks");
    
    return legendItems.length > 0 ? legendItems.join(", ") : "Standard Grading Components";
  };

  const handleShareImage = async () => {
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imageBlob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/png")
      );

      if (!imageBlob) throw new Error("Failed to generate image");

      const file = new File([imageBlob], "grade-result.png", { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Expected Grade",
          text: `I calculated my expected grade for ${subjectDetails?.name || 'Course'}!`,
        });
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `Grade_Result_${subjectDetails?.name || "Report"}.png`;
        link.click();
        alert("Result image downloaded!");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Could not generate image. Please try taking a screenshot.");
    }
  };

  const gradeColor = result.letter === 'U' ? '#d32f2f' : '#16a34a';

  return (
    <div className="w-full mt-12 font-['Inter'] text-[#000000] animate-in fade-in slide-in-from-bottom-4">
      
      {/* CAPTURE AREA START */}
      <div ref={resultRef} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative w-full pb-16">
        
        {/* ELIGIBILITY WARNING BANNER */}
        {eligibilityWarning && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-100 mb-8">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-900 text-base mb-1">Eligibility Requirements Not Met</h4>
              <p className="text-red-800 text-sm font-medium">
                <span className="font-bold text-red-700 mr-2">Reason:</span> 
                {eligibilityWarning}
              </p>
              <p className="text-xs text-red-700 opacity-90 mt-2 bg-red-100/50 p-2 rounded">
                Because mandatory criteria were not met, your final score is automatically capped, resulting in a 'U' grade.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: OVERVIEW */}
        <div className="mb-10 w-full">
          <span className="block text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-200 pb-2">
            Result Overview
          </span>
          <table className="w-full border-collapse border border-slate-300 table-fixed bg-slate-50/30">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-5 text-center w-1/3">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Grade</span>
                  <span className="text-[42px] font-black" style={{ color: gradeColor }}>
                    {result.letter}
                  </span>
                </td>
                <td className="border border-slate-300 p-5 text-center w-1/3">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Marks</span>
                  <span className="text-[28px] font-extrabold text-slate-900">
                    {result.score}
                    {eligibilityWarning && <span className="text-red-500 text-lg ml-1">*</span>}
                  </span>
                </td>
                <td className="border border-slate-300 p-5 text-center w-1/3">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Grade Point</span>
                  <span className="text-[28px] font-extrabold text-slate-900">{result.points}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: SCORE BREAKDOWN */}
        <div className="mb-10 w-full">
          <span className="block text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-200 pb-2">
            Score Breakdown
          </span>
          <table className="w-full border-collapse border border-slate-300 text-[14px]">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 font-bold text-[12px] text-slate-600 uppercase tracking-wide p-4 text-left w-2/3">
                  Component Name
                </th>
                <th className="border border-slate-300 bg-slate-100 font-bold text-[12px] text-slate-600 uppercase tracking-wide p-4 text-right w-1/3">
                  Input Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inputValues).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-300 p-4 text-left font-medium text-slate-700">
                    {getLabelForKey(key)}
                  </td>
                  <td className="border border-slate-300 p-4 text-right font-bold text-slate-900">
                    {value || "0 (Absent/Blank)"}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-4 text-left font-bold text-slate-900">Final Calculated Score</td>
                <td className="border border-slate-300 p-4 text-right font-bold text-blue-700">{result.score}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3: CALCULATION LOGIC */}
        <div className="mb-6 w-full">
          <span className="block text-[14px] font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-200 pb-2">
            Calculation Logic
          </span>
          <table className="w-full border-collapse border border-slate-300 text-[14px]">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 font-bold text-[12px] text-slate-600 uppercase tracking-wide p-4 text-left">
                  Applied Grading Formula
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-4 bg-white">
                  <div className="font-mono text-[13px] leading-relaxed text-slate-800 mb-3 bg-slate-50 p-3 rounded border border-slate-100">
                    {formula}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-700">Ref: </span>
                    {getFormulaLegend(formula)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Branding Watermark (Bottom Right) */}
        <div className="absolute bottom-5 right-8 text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
          predicted by Unknown IITians
        </div>

      </div>
      {/* CAPTURE AREA END */}

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center mt-6 px-2">
        <button 
          onClick={onReset}
          className="text-[13px] text-slate-500 underline font-medium hover:text-slate-900 transition-colors"
        >
          Clear everything
        </button>
        
        <button 
          onClick={handleShareImage}
          className="bg-slate-900 text-white px-6 py-3 text-[13px] font-bold uppercase tracking-wide hover:bg-slate-800 transition-colors flex items-center gap-2 rounded-md shadow-sm"
        >
          <Share className="w-4 h-4" />
          Download / Share Result
        </button>
      </div>

    </div>
  );
}
