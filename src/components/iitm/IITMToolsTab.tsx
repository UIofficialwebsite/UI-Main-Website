import React, { useRef } from "react";
import CGPACalculator from "./CGPACalculator";
import GradeCalculator from "./GradeCalculator";
import FoundationMarksPredictor from "./FoundationMarksPredictor";
import { Level } from "./types/gradeTypes";

import { useCoursesManager } from "@/hooks/useCoursesManager";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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

  // Autoplay plugin for the courses banner
  const plugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

  const { courses, isLoading: coursesLoading } = useCoursesManager();

  // Filter for Paid courses that match the current Tab's branch & level
  const filteredCourses = courses?.filter((course: any) => {
    // Check if it's a paid course (adjust based on your exact schema)
    const isPaid = course.price > 0 || course.is_paid === true; 
    
    // Check if the course branch/level matches the current view
    const matchesBranch = !course.branch || course.branch?.toLowerCase() === branch.toLowerCase();
    const matchesLevel = !course.level || course.level?.toLowerCase() === level.toLowerCase();
    
    return isPaid && matchesBranch && matchesLevel;
  }) || [];

  // Render the selected tool directly
  const renderTool = () => {
    switch (selectedTool) {
      case "cgpa-calculator":
        return <CGPACalculator branch={branch} level={level} />;
      case "grade-calculator":
        return <GradeCalculator level={levelForCalc} branch={branchForCalc} />;
      case "marks-predictor":
        return <FoundationMarksPredictor branch={branchForCalc} level={levelForCalc} />;
      default:
        return <CGPACalculator branch={branch} level={level} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* COURSES TICKER BANNER - Only shows for marks predictor */}
      {selectedTool === "marks-predictor" && !coursesLoading && filteredCourses.length > 0 && (
        <div className="w-full bg-black text-white py-3 px-6 mb-2 rounded-sm shadow-sm screen-only font-sans">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {filteredCourses.map((course: any) => (
                <CarouselItem key={course.id} className="basis-full">
                  <div className="flex items-center justify-between gap-4 h-9 w-full max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className="hidden md:inline-flex bg-gray-100 text-blue-600 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        PREMIUM
                      </span>
                      <span className="text-xs md:text-sm font-semibold truncate tracking-wide">
                        {course.title || course.name} - Master {level} for {branch}
                      </span>
                    </div>
                    
                    <a 
                      href={`/course/${course.id}`}
                      className="shrink-0"
                    >
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-9 text-sm font-semibold tracking-wide px-6 bg-white text-black hover:bg-gray-200 border-none rounded-sm font-sans"
                      >
                        Enroll Now
                      </Button>
                    </a>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* TOOL CONTENT */}
      {renderTool()}
      
    </div>
  );
};

export default IITMToolsTab;
