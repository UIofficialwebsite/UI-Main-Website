import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { Share } from "lucide-react";
import { PredictionResult } from "../utils/predictorLogic";

interface PredictorResultProps {
  results: Record<string, PredictionResult>;
  onReset: () => void;
}

export default function PredictorResult({ results, onReset }: PredictorResultProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  const handleShareImage = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!imageBlob) throw new Error("Failed to generate image");
      const file = new File([imageBlob], "grade-prediction.png", { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Grade Prediction", text: `Here are my required marks for each grade!` });
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "Grade_Prediction.png";
        link.click();
      }
    } catch (err) { 
      console.error(err); 
      alert("Share failed."); 
    }
  };

  const grades = ['S', 'A', 'B', 'C', 'D', 'E'];

  // Check if the lowest grade (E) failed due to a hard eligibility rule
  const lowestGradeResult = results["E"];
  const isEligibilityFail = 
    !lowestGradeResult?.possible && 
    lowestGradeResult?.message && 
    !lowestGradeResult.message.includes("mathematically unreachable");

  return (
    <div className="w-full mt-12 font-['Inter'] text-[#000000] animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* CAPTURE AREA - Full Width */}
      <div 
        ref={resultRef} 
        className="bg-white p-4 sm:p-8 w-full border border-gray-200 rounded-sm shadow-sm relative pb-16"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        
        {/* SECTION HEADING */}
        <h2 className="text-[15px] font-semibold text-black uppercase tracking-[0.03em] mb-[15px]">
          Required End Term Scores
        </h2>

        {/* STRICT, SHARP-EDGED, ICONLESS PROFESSIONAL WARNING */}
        {isEligibilityFail && (
          <div className="mb-[25px] border border-[#c62828] bg-[#ffebee] p-[15px]">
            <h3 className="text-[14px] font-bold text-[#c62828] uppercase tracking-[0.05em] mb-[8px] m-0">
              Not Possible
            </h3>
            <p className="text-[13px] text-[#b71c1c] m-0 mb-[12px] leading-[1.5]">
              "Not Possible" means that even if you score a perfect 100/100 in the final exam, you cannot reach this grade based on your current marks.
            </p>
            <div className="bg-white border border-[#ef9a9a] p-[12px]">
              <p className="text-[13px] text-[#333] m-0">
                <strong className="text-[#c62828]">Reason:</strong> {lowestGradeResult.message}
              </p>
            </div>
          </div>
        )}
        
        {/* TABLE */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-black mb-[25px]">
            <thead>
              <tr>
                <th className="bg-[#e6f7f7] text-[#2c4a4a] border border-black px-5 py-4 text-left font-bold text-[11px] uppercase tracking-[0.05em] w-[20%]">
                  Target Grade
                </th>
                <th className="bg-[#e6f7f7] text-[#2c4a4a] border border-black px-5 py-4 text-left font-bold text-[11px] uppercase tracking-[0.05em] w-[50%]">
                  Score Needed
                </th>
                <th className="bg-[#e6f7f7] text-[#2c4a4a] border border-black px-5 py-4 text-center font-bold text-[11px] uppercase tracking-[0.05em] w-[30%]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {grades.map(grade => {
                const data = results[grade];
                if (!data) return null;
                const isPossible = data.possible && data.requiredScore !== undefined;
                
                return (
                  <tr key={grade}>
                    {/* Grade Column */}
                    <td className="border border-black px-5 py-4 text-left text-[14px]">
                      <span className="inline-flex items-center justify-center w-[30px] h-[30px] border border-black rounded-full font-bold bg-white text-black">
                        {grade}
                      </span>
                    </td>

                    {/* Score Needed Column */}
                    <td className="border border-black px-5 py-4 text-left text-[14px]">
                      {isPossible ? (
                        <div>
                          <span className="font-bold text-[18px] text-black">{data.requiredScore}</span>
                          <span className="block text-[10px] text-[#777] font-normal mt-[3px] uppercase">OUT OF 100</span>
                        </div>
                      ) : (
                        <span className="text-[#bbb] text-lg">—</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="border border-black px-5 py-4 text-center text-[14px]">
                      {isPossible ? (
                        <span className="font-bold text-[11px] uppercase px-[10px] py-[5px] inline-block border border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]">
                          Possible
                        </span>
                      ) : (
                        <span className="font-bold text-[11px] uppercase px-[10px] py-[5px] inline-block border border-[#c62828] bg-[#ffebee] text-[#c62828]">
                          Not Possible
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-[13px] text-[#444] leading-[1.5] p-[15px] bg-[#fafafa] border border-[#ddd]">
           <strong>* Not Possible</strong> means that even if you score a perfect 100/100 in the final exam, you cannot reach this grade based on your current marks.
        </div>

        {/* BRAND WATERMARK */}
        <div className="absolute bottom-4 right-6 text-[10px] font-bold text-[#bbb] uppercase tracking-wider pointer-events-none">
          predicted by Unknown IITians
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between items-center mt-8 px-2 w-full font-['Inter']">
        <button onClick={onReset} className="text-[13px] text-gray-500 underline font-medium hover:text-black transition-colors">
          Start Over
        </button>
        <button onClick={handleShareImage} className="bg-black text-white px-6 py-3 text-[13px] font-semibold uppercase hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-sm shadow-sm">
          <Share className="w-4 h-4" />
          Share Results
        </button>
      </div>

    </div>
  );
}
