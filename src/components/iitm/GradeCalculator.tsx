import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCalculatorSubjects, normaliseLevel, normaliseProgramme, PROGRAMMES } from "./data/curriculumConfig";
import { calculateGradeByLevel, getGradeLetter, getGradePoints } from "./utils/gradeCalculations";
import { Level } from "./types/gradeTypes";
import ScoreInputForm from "./components/ScoreInputForm";
import GradeResult from "./components/GradeResult";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { logToolUsage } from "@/utils/toolLogger";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cachedRead } from "@/utils/edgeCache";
import { supabase } from "@/integrations/supabase/client";
import { Job } from "@/types/job";

interface GradeCalculatorProps {
  level: string; // Changed to string to safely accept "Foundation" etc.
  branch: string;
  /**
   * A subject's own page: the calculator opens on this course (its key) with no course picker, and a
   * button below leads to the full calculator for every other subject. Pass "" for a subject whose grading
   * formula is not published, and it says so and shows the same button.
   */
  lockedKey?: string;
  /** The subject's name, shown in place of the picker. */
  lockedName?: string;
}

export default function GradeCalculator({ level, branch, lockedKey, lockedName }: GradeCalculatorProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";

  // Same hiring ticker the CGPA calculator shows. It reads the ACTIVE jobs
  // through the shared edge cache, so adding it here costs no extra Supabase
  // egress - the response is already warm from the other tools.
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const tickerPlugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await cachedRead<Job[]>("jobs", async () => {
        const { data } = await supabase
          .from("jobs")
          .select("id, title, application_url, description, is_active")
          .eq("is_active", true);
        return (data || []) as unknown as Job[];
      });
      if (active) {
        setJobs(rows || []);
        setJobsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; letter: string; points: number } | null>(null);
  const programme = normaliseProgramme(branch);

  const filteredSubjects = useMemo(() => {
    return getCalculatorSubjects(normaliseProgramme(branch), normaliseLevel(level));
  }, [branch, level]);

  const locked = lockedKey !== undefined;
  const urlSubjectKey = locked ? null : searchParams.get("subject");
  const currentSubject = useMemo(() => 
    locked ? filteredSubjects.find(s => s.key === lockedKey) : filteredSubjects.find(s => s.key === urlSubjectKey),
    [filteredSubjects, urlSubjectKey, locked, lockedKey]
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

      {/* Hiring ticker (screen only), matching the CGPA calculator. */}
      {!jobsLoading && jobs.length > 0 && (
        <div className="w-full bg-black text-white py-3 px-6 mb-8 screen-only">
          <Carousel
            plugins={[tickerPlugin.current as any]}
            className="w-full"
            onMouseEnter={tickerPlugin.current.stop}
            onMouseLeave={tickerPlugin.current.reset}
            opts={{ align: "start", loop: true }}
          >
            <CarouselContent>
              {jobs.map((job) => (
                <CarouselItem key={job.id} className="basis-full">
                  <div className="flex items-center justify-between gap-4 h-9 w-full max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className="hidden md:inline-flex bg-gray-100 text-green-600 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap font-sans">
                        OPEN NOW
                      </span>
                      <span className="text-xs md:text-sm font-semibold truncate font-sans tracking-wide">
                        {job.title} applications are live
                      </span>
                    </div>
                    <a href={job.application_url || "#"} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-9 text-sm font-semibold tracking-wide px-6 bg-white text-black hover:bg-gray-200 border-none rounded-sm font-sans"
                      >
                        Apply Now
                      </Button>
                    </a>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      <div className="w-full py-8">
        {locked ? (
          <div className="mb-8 w-full max-w-3xl">
            <p className="text-sm font-medium text-black font-sans mb-2">Course</p>
            <p className="text-xl font-semibold text-[#1f2937] font-sans">{currentSubject?.name ?? lockedName}</p>
            {!currentSubject && (
              <p className="mt-2 text-sm text-gray-600 font-sans">
                A published grading formula for this course is not available in the calculator yet. You can still check the other subjects below.
              </p>
            )}
          </div>
        ) : (
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
        )}

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

        {locked && (
          <div className="mt-10 max-w-3xl">
            <Link
              to={`/exam-preparation/iitm-bs/tools/${programme}/${normaliseLevel(level)}/grade-calculator`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1E3A8A] px-6 py-4 text-[16px] font-semibold text-white shadow-md transition-colors hover:bg-[#1e40af] sm:w-auto"
            >
              Calculate for other subjects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
