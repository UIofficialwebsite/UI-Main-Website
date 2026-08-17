import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { Share } from "lucide-react";
import { getGradeFormula } from "../utils/gradeCalculations";
import { checkEligibilityIssues } from "../utils/predictorLogic";
import { getCalculatorSubject } from "../data/curriculumConfig";

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

  const subjectDetails = getCalculatorSubject(subjectKey);
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
    <div className="w-full mt-12 font-['Inter'] text-[#000000]">
      
      {/* CAPTURE AREA START */}
      <div ref={resultRef} className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm relative w-full pb-16">
        
        {/* ELIGIBILITY WARNING */}
        {eligibilityWarning && (
          <div className="mb-8 w-full p-4 border border-[#d32f2f] bg-[#fffbfb]">
            <span className="block text-[14px] font-bold text-[#d32f2f] mb-1">Eligibility Requirements Not Met</span>
            <span className="text-[13px] text-[#333333]">
              <strong className="text-[#d32f2f]">Reason:</strong> {eligibilityWarning}
            </span>
          </div>
        )}

        {/* SECTION 1: OVERVIEW */}
        <div className="mb-10 w-full">
          <span className="block text-[14px] font-semibold text-[#1a1a1a] mb-3 border-b pb-2">Overview</span>
          <table className="w-full border-collapse border border-black table-fixed">
            <tbody>
              <tr>
                <td className="border border-black p-5 text-center w-1/3">
                  <span className="block text-[11px] font-semibold text-[#666666] uppercase mb-2">Expected Grade</span>
                  <span className="text-[40px] font-extrabold" style={{ color: gradeColor }}>
                    {result.letter}
                  </span>
                </td>
                <td className="border border-black p-5 text-center w-1/3">
                  <span className="block text-[11px] font-semibold text-[#666666] uppercase mb-2">Total Marks</span>
                  <span className="text-[26px] font-extrabold text-black">
                    {result.score}
                    {eligibilityWarning && <span className="text-[#d32f2f] ml-1">*</span>}
                  </span>
                </td>
                <td className="border border-black p-5 text-center w-1/3">
                  <span className="block text-[11px] font-semibold text-[#666666] uppercase mb-2">Grade Point</span>
                  <span className="text-[26px] font-extrabold text-black">{result.points}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: SCORE BREAKDOWN */}
        <div className="mb-10 w-full">
          <span className="block text-[14px] font-semibold text-[#1a1a1a] mb-3 border-b pb-2">Score Breakdown</span>
          <table className="w-full border-collapse border border-black text-[14px]">
            <thead>
              <tr>
                <th className="border border-black bg-[#f8f9fa] font-bold text-[12px] uppercase tracking-wide p-4 text-left w-2/3">
                  Component Name
                </th>
                <th className="border border-black bg-[#f8f9fa] font-bold text-[12px] uppercase tracking-wide p-4 text-right w-1/3">
                  Input Value
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inputValues).map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-black p-4 text-left font-medium text-gray-800">
                    {getLabelForKey(key)}
                  </td>
                  <td className="border border-black p-4 text-right font-bold text-black">
                    {value || "0"}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#fafafa]">
                <td className="border border-black p-4 text-left font-bold text-black">Final Calculated Score</td>
                <td className="border border-black p-4 text-right font-bold text-blue-700">{result.score}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3: CALCULATION LOGIC */}
        <div className="mb-6 w-full">
          <span className="block text-[14px] font-semibold text-[#1a1a1a] mb-3 border-b pb-2">Calculation Logic</span>
          <table className="w-full border-collapse border border-black text-[14px]">
            <thead>
              <tr>
                <th className="border border-black bg-[#f8f9fa] font-bold text-[12px] uppercase tracking-wide p-4 text-left">
                  Applied Formula
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-4 bg-white">
                  <div className="font-mono text-[13px] leading-relaxed text-[#333333] mb-3">
                    {formula}
                  </div>
                  <div className="text-[11px] text-gray-500 border-t pt-2 mt-1">
                    <span className="font-bold">Ref: </span>
                    {getFormulaLegend(formula)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Branding Watermark (Bottom Right) */}
        <div className="absolute bottom-4 right-6 text-[10px] font-sans font-semibold text-black uppercase tracking-widest pointer-events-none opacity-90">
          predicted by Unknown IITians
        </div>

      </div>
      {/* CAPTURE AREA END */}

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center mt-8 px-2">
        <button 
          onClick={onReset}
          className="text-[13px] text-[#999999] underline font-medium hover:text-black transition-colors"
        >
          Clear everything
        </button>
        
        <button 
          onClick={handleShareImage}
          className="bg-black text-white px-6 py-3 text-[13px] font-semibold uppercase hover:bg-[#333333] transition-colors flex items-center gap-2 rounded-sm"
        >
          <Share className="w-4 h-4" />
          Share Results
        </button>
      </div>

    </div>
  );
}
