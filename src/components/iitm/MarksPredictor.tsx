import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCalculatorSubjects, normaliseLevel, normaliseProgramme } from "./data/curriculumConfig";
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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight } from "lucide-react";
import { Course } from "@/components/admin/courses/types";

interface MarksPredictorProps {
  level: string; 
  branch: string;
}

const normaliseMatchValue = (value: string | null | undefined) =>
  (value || "").replace(/[^a-zA-Z]/g, "").toLowerCase();

const isLiveAndAvailable = (course: Course) => {
  if (course.is_live !== true) return false;

  // `valid_till` is the enrollment deadline. Older records may only have an
  // end date, so use that as the fallback instead of ever promoting a closed batch.
  const cutoff = course.valid_till || course.end_date;
  if (!cutoff) return true;

  const cutoffDate = new Date(cutoff);
  if (Number.isNaN(cutoffDate.getTime())) return false;

  return cutoffDate.getTime() >= new Date().setHours(0, 0, 0, 0);
};

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
  const [showBatchPrompt, setShowBatchPrompt] = useState(false);
  const [dismissedBatchPrompt, setDismissedBatchPrompt] = useState(false);

  // Promote only a live, purchasable batch for the exact programme and level.
  // This prevents a Foundation prediction from showing a Diploma batch, or any old batch.
  const matchingCourses = useMemo<Course[]>(() => {
    if (!courses || courses.length === 0) return [];
    const targetBranch = normaliseMatchValue(branch);
    const targetLevel = normaliseMatchValue(level);

    return courses
      .filter((course) => (
        normaliseMatchValue(course.branch) === targetBranch &&
        normaliseMatchValue(course.level) === targetLevel &&
        isLiveAndAvailable(course)
      ))
      .sort((first, second) => {
        const firstStart = first.start_date ? new Date(first.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        const secondStart = second.start_date ? new Date(second.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        return firstStart - secondStart;
      });
  }, [courses, branch, level]);

  const featuredBatch = matchingCourses[0];

  useEffect(() => {
    if (!results || !featuredBatch || dismissedBatchPrompt) return;
    setShowBatchPrompt(true);
  }, [results, featuredBatch, dismissedBatchPrompt]);

  const filteredSubjects = useMemo(() => {
    return getCalculatorSubjects(normaliseProgramme(branch), normaliseLevel(level));
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
    setShowBatchPrompt(false);
    setDismissedBatchPrompt(false);
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

    const safeLevel = normaliseLevel(level) as Level;
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

    setDismissedBatchPrompt(false);
    setResults(newResults);
  };

  const handleReset = () => {
    setInputValues({});
    setResults(null);
    setShowBatchPrompt(false);
    setDismissedBatchPrompt(false);
  };

  const dismissBatchPrompt = () => {
    setShowBatchPrompt(false);
    setDismissedBatchPrompt(true);
  };

  const exploreFeaturedBatch = () => {
    if (!featuredBatch) return;
    setShowBatchPrompt(false);
    setDismissedBatchPrompt(true);
    navigate(`/courses/${featuredBatch.id}`);
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-gray-900">
      
      {/* Moving reminder stays available after the student dismisses the purchase prompt. */}
      {results && !coursesLoading && matchingCourses.length > 0 && (
        <div className="w-full bg-black text-white py-3 px-6 mb-8 screen-only animate-in fade-in slide-in-from-top-4 duration-500">
          <Carousel
            plugins={[plugin.current as any]}
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
                        {course.title} is live for {level}
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
      <div className={`w-full ${results && matchingCourses.length > 0 ? 'pb-8' : 'py-8'}`}>

        {/* 01. Select Course */}
        <div className="mb-10 w-full max-w-3xl relative z-50">
          <Label className="text-sm font-medium text-black font-['Inter'] mb-3 block">
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

      {featuredBatch && (
        <Dialog
          open={showBatchPrompt}
          onOpenChange={(open) => {
            if (!open) dismissBatchPrompt();
          }}
        >
          <DialogContent className="!w-[calc(100%-1.5rem)] max-w-[560px] !rounded-2xl border-0 bg-white p-0 shadow-2xl [&>button]:hidden">
            <div className="bg-white p-4 sm:p-5">
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-950 shadow-sm">
                {featuredBatch.image_url ? (
                  <img
                    src={featuredBatch.image_url}
                    alt={`${featuredBatch.title} batch banner`}
                    className="block aspect-[16/8] w-full object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${featuredBatch.title} batch banner`}
                    className="aspect-[16/8] w-full bg-[radial-gradient(circle_at_top_right,_#93c5fd,_transparent_35%),linear-gradient(135deg,_#0b215e,_#0f2f85_58%,_#1d4ed8)]"
                  />
                )}
              </div>

              <div className="px-1 pb-1 pt-5 sm:px-2">
                <DialogTitle className="font-['Inter'] text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {featuredBatch.title}
                </DialogTitle>
                <DialogDescription className="mt-2 font-['Inter'] text-sm leading-6 text-slate-600">
                  Continue your preparation with the live batch matched to this Marks Predictor result.
                </DialogDescription>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={dismissBatchPrompt}
                    className="h-11 rounded-md border border-black bg-white px-4 font-['Inter'] text-sm font-normal text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:outline-none"
                  >
                    Check Later
                  </button>
                  <Button
                    type="button"
                    onClick={exploreFeaturedBatch}
                    className="h-11 bg-[#1d4ed8] px-5 font-['Inter'] text-sm font-medium text-white hover:bg-[#1e40af]"
                  >
                    Explore Batch <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
