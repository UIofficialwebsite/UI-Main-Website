import React from "react";
import CGPACalculator from "./CGPACalculator";
import GradeCalculator from "./GradeCalculator";
import FoundationMarksPredictor from "./FoundationMarksPredictor";
import { Level } from "./types/gradeTypes";

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
  const branchForCalc = branch === "Data Science" ? "data-science" : "electronic-systems";
  const levelForCalc = level.toLowerCase() as Level;

  // Render the selected tool directly
  const renderTool = () => {
    switch (selectedTool) {
      case "cgpa-calculator":
        return <CGPACalculator />;
      case "grade-calculator":
        return <GradeCalculator level={levelForCalc} branch={branchForCalc} />;
      case "marks-predictor":
        return <FoundationMarksPredictor branch={branchForCalc} level={levelForCalc} />;
      default:
        return <CGPACalculator />;
    }
  };

  return (
    <div className="space-y-6">
      {renderTool()}
    </div>
  );
};

export default IITMToolsTab;
