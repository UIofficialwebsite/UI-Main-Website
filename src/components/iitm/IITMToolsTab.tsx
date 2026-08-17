import React from "react";
import CGPACalculator from "./CGPACalculator";
import GradeCalculator from "./GradeCalculator";
import MarksPredictor from "./MarksPredictor";
import { Level } from "./types/gradeTypes";
import { normaliseLevel, normaliseProgramme } from "./data/curriculumConfig";

interface IITMToolsTabProps {
  selectedTool?: string;
  branch?: string;
  level?: string;
}

const IITMToolsTab = ({ 
  selectedTool = "cgpa-calculator",
  branch = "Data Science",
  level = "Foundation"
}: IITMToolsTabProps) => {

  // Convert branch format for calculator components
  const branchForCalc = normaliseProgramme(branch);
  const levelForCalc = normaliseLevel(level) as Level;

  // Render the selected tool directly
  const renderTool = () => {
    switch (selectedTool) {
      case "cgpa-calculator":
        return <CGPACalculator branch={branchForCalc} level={levelForCalc} />;
      case "grade-calculator":
        return <GradeCalculator level={levelForCalc} branch={branchForCalc} />;
      case "marks-predictor":
        return <MarksPredictor branch={branchForCalc} level={levelForCalc} />;
      default:
        return <CGPACalculator branch={branchForCalc} level={levelForCalc} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderTool()}
    </div>
  );
};

export default IITMToolsTab;
