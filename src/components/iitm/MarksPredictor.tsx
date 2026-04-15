import React, { useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ALL_SUBJECTS } from "./data/subjectsData";
import { predictRequiredMarks, PredictionResult } from "./utils/predictorLogic";
import { Level } from "./types/gradeTypes";
import PredictorInputForm from "./components/PredictorInputForm";
import PredictorResult from "./components/PredictorResult";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { logToolUsage } from "@/utils/toolLogger";
import { useCoursesManager } from "@/hooks/useCoursesManager";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface MarksPredictorProps {
  level: string; 
  branch: "data-science" | "electronic-systems" | string;
}

export default function MarksPredictor({ level, branch }: MarksPredictorProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  const navigate = useNavigate();
  
  const plugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

  const { courses, isLoading: coursesLoading } = useCoursesManager();

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, PredictionResult> | null>(null);

  // Exact letter matching for course availability (ignores spaces/cases/hyphens)
  const matchingCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const normalize = (str: string) => (str || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
    const targetBranch = normalize(branch);
    const targetLevel = normalize(level);

    return courses.filter(c => {
      const cBranch = normalize(c.branch || c.category);
      const cLevel = normalize(c.level || c.subcategory);
      return cBranch === targetBranch && cLevel === targetLevel;
    });
  }, [courses, branch, level]);

  const filteredSubjects = useMemo(() => {
    const getSubjectsKey = () => {
      const normalizedLevel = level?.toLowerCase() || "foundation";
      const normalizedBranch = branch?.toLowerCase().replace(/\s+/g, "-") || "data-science";

      if (normalizedBranch === "electronic-systems") {
        if (normalizedLevel === "foundation") return "foundation-electronic-systems";
        if (normalizedLevel === "diploma") return "diploma-electronic-systems";
        if (normalizedLevel === "degree") return "degree-electronic-systems";
      }
      return normalizedLevel;
    };
    return ALL_SUBJECTS[getSubjectsKey()] || [];
  }, [branch, level]);

  const currentSubject = useMemo(() => 
    filteredSubjects.find(s => s.key === initialSubject),
    [filteredSubjects, initialSubject]
  );

  const handleSubjectChange = (val: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (val) newParams.set("subject", val);
      else newParams.delete("subject");
      return newParams;
    });
    setInputValues({});
    setResults(null);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValues(prev => ({ ...prev, [fieldId]: value }));
    }
  };

  const handleCalculate = () => {
    if (!currentSubject) return;

    const numericValues: Record<string, number> = {};
    Object.keys(inputValues).forEach(key => {
      numericValues[key] = parseFloat(inputValues[key]) || 0;
    });

    const safeLevel = (level?.toLowerCase() || "foundation") as Level;
    const grades = ['S', 'A', 'B', 'C', 'D', 'E'];
    const newResults: Record<string, PredictionResult> = {};

    grades.forEach(grade => {
      newResults[grade] = predictRequiredMarks(safeLevel, currentSubject.key, numericValues, grade);
    });

    try {
      const metaKeys = ["id","name","credits","grade","subject","marks","scores","result","target"];
      const scores: Record<string, number> = {};
      Object.entries(inputValues).forEach(([key, val]) => {
        if (!metaKeys.includes(key)) {
          scores[key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")] = parseFloat(val) || 0;
        }
      });
      logToolUsage({
        toolName: "Marks Predictor",
        branch: branch,
        level: level,
        inputDetails: { subject_details: { subject: currentSubject.name, scores } },
        resultDetails: newResults
      });
    } catch (e) { /* silent */ }

    setResults(newResults);
  };

  const handleReset = () => {
    setInputValues({});
    setResults(null);
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-gray-900">
      
      {/* TOP ROW: COURSE TICKER (Shows ONLY if results exist and courses match) */}
      {results && !coursesLoading && matchingCourses.length > 0 && (
        <div className="w-full bg-black text-white py-3 px-6 mb-8 screen-only animate-in fade-in slide-in-from-top-4 duration-500">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{ align: "start", loop: true }}
          >
            <CarouselContent>
              {matchingCourses.map((course) => (
                <CarouselItem key={course.id} className="basis-full">
                  <div className="flex items-center justify-between gap-4 h-9 w-full max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className="hidden md:inline-flex bg-gray-100 text-green-600 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap font-sans">
                        OPEN NOW
                      </span>
                      <span className="text-xs md:text-sm font-semibold truncate font-sans tracking-wide">
                        {course.title} batches are live
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/courses/${course.id}`)}
                      size="sm" 
                      variant="default" 
                      className="shrink-0 h-9 text-sm font-semibold tracking-wide px-6 bg-white text-black hover:bg-gray-200 border-none rounded-sm font-sans uppercase"
                    >
                      Enroll Now
                    </Button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* Adjust top padding if the banner is showing so it doesn't look cramped */}
      <div className={`w-full max-w-[1600px] mx-auto px-6 md:px-10 ${results && matchingCourses.length > 0 ? 'pb-8' : 'py-8'}`}>
        
        {/* 01. Select Course */}
        <div className="mb-10 w-full max-w-3xl relative z-50">
          <Label className="text-xs font-bold uppercase tracking-wide text-gray-600 font-['Inter'] mb-3 block">
            01. Select Course
          </Label>
          
          <Select value={currentSubject?.key || ""} onValueChange={handleSubjectChange}>
            <SelectTrigger className="h-12 w-full text-lg bg-white border-2 border-gray-300 focus:border-black focus:ring-0 rounded-sm font-['Inter'] font-normal relative z-10">
              <SelectValue placeholder="Choose a subject..." />
            </SelectTrigger>
            <SelectContent className="z-[9999] max-h-[300px] bg-white border-2 border-gray-200 shadow-xl font-['Inter']">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <SelectItem key={subject.key} value={subject.key} className="font-['Inter'] cursor-pointer py-3 text-base focus:bg-gray-100 border-b border-gray-100 last:border-0">
                    {subject.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center font-['Inter']">
                  No subjects found for {level} ({branch})
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 02. Enter Scores */}
        <div className="relative z-0">
          {currentSubject && (
            <PredictorInputForm 
              subject={currentSubject}
              inputValues={inputValues}
              onInputChange={handleInputChange}
              onCalculate={handleCalculate}
            />
          )}
        </div>

        {/* Result Table */}
        {results && currentSubject && (
          <div className="w-full relative z-0">
            <PredictorResult 
              results={results}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
