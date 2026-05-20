import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import CourseCard from "@/components/courses/CourseCard";
import HeroCarousel from "@/components/HeroCarousel";
import { 
  FileText, 
  ChevronRight,
  Home,
  LayoutList,
  Newspaper,
  CalendarDays,
} from "lucide-react";
import { usePageSEO, SEO_TITLES, useCanonicalUrl } from "@/utils/seoManager";

const Courses = () => {
  const { examCategory } = useParams<{ examCategory?: string }>();
  
  // Dynamic title based on category
  const categoryTitles: Record<string, string> = {
    'jee': SEO_TITLES.JEE_COURSES,
    'neet': SEO_TITLES.NEET_COURSES,
    'iitm-bs': SEO_TITLES.IITM_COURSES,
  };
  usePageSEO(
    examCategory ? categoryTitles[examCategory] || SEO_TITLES.ALL_COURSES : SEO_TITLES.ALL_COURSES,
    examCategory ? `/courses/category/${examCategory}` : "/courses"
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, contentLoading, loadCourses } = useBackend();
  useEffect(() => { loadCourses(); }, [loadCourses]);

  const currentCategoryData = useMemo(() => {
    if (!examCategory) return { name: "All Courses" };
    const match = courses.find(c => c.exam_category?.toLowerCase().replace(/[\s_]/g, '-') === examCategory.toLowerCase());
    return match ? { name: match.exam_category } : { name: examCategory.replace(/-/g, ' ') };
  }, [courses, examCategory]);

  const categoryCourses = useMemo(() => {
    // Filter for live courses first
    const liveCourses = courses.filter(c => c.is_live === true);

    if (!examCategory || examCategory === 'all') return liveCourses;
    return liveCourses.filter(c => c.exam_category?.toLowerCase().replace(/[\s_]/g, '-') === examCategory.toLowerCase());
  }, [courses, examCategory]);

  const availableBranches = useMemo(() => {
    return Array.from(new Set(categoryCourses.map(c => c.branch))).filter(Boolean) as string[];
  }, [categoryCourses]);

  return (
    <div className="min-h-screen font-sans text-foreground w-full overflow-x-hidden bg-[#fcfdff] relative">
      <NavBar />
      
      <main className="pt-16">
        <HeroCarousel pagePath={location.pathname} fullWidth />

        {/* Hero Area */}
        <div className="relative overflow-hidden flex flex-col items-center px-4 py-6 md:py-8">
          <div className="absolute top-0 left-0 w-[45%] h-full bg-gradient-to-br from-[#e6f0ff]/70 to-transparent z-0 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          <div className="absolute bottom-0 right-0 w-[50%] h-full bg-gradient-to-tl from-[#ebf2ff]/80 to-transparent z-0 pointer-events-none" style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />

          <div className="relative z-10 w-full max-w-6xl">
            <nav className="flex items-center gap-2 text-[#666] text-xs mb-3 font-normal font-['Inter',sans-serif]">
              <Home className="w-3 h-3" />
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="uppercase tracking-tight">{currentCategoryData?.name}</span>
            </nav>

            <h1 className="text-xl md:text-3xl font-bold text-[#1a1a1a] mb-2 leading-tight font-['Inter',sans-serif]">
              {currentCategoryData?.name} 2026: Resources & Exam Hub
            </h1>
            <p className="text-[#555] text-xs md:text-sm leading-relaxed max-w-4xl mb-6 font-normal font-['Inter',sans-serif]">
              Access curated study materials and latest updates for {currentCategoryData?.name} preparation.
            </p>

            {/* Quick Links */}
            {examCategory && (
              <section className="mt-4 bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-black/5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-2">
                  <QuickLinkCard title="PDF Bank" desc="Access PDF Bank" icon={FileText} cardColor="bg-[#feeceb]" iconColor="text-[#f43f5e]" onClick={() => navigate('/digital-library')} />
                  <QuickLinkCard title="News" desc="Stay Updated" icon={Newspaper} cardColor="bg-[#e8f0fe]" iconColor="text-[#4a6cf7]" onClick={() => navigate('/digital-library')} />
                  <QuickLinkCard title="Dates" desc="Exam Schedule" icon={CalendarDays} cardColor="bg-[#e1f7e7]" iconColor="text-[#4a6cf7]" onClick={() => navigate('/digital-library')} />
                  <QuickLinkCard title="Syllabus" desc="Course Roadmap" icon={LayoutList} cardColor="bg-[#e0f0ff]" iconColor="text-[#f43f5e]" onClick={() => navigate('/digital-library')} />
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Filter Bar - Responsive scroll */}
        <div className="w-full bg-white border-y border-border sticky top-16 z-30 overflow-x-auto no-scrollbar">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-x-4 text-[#1E40AF] font-['Inter',sans-serif]">
            <button onClick={() => navigate(`/courses/listing/${examCategory || 'all'}`)} className="relative text-[13px] font-normal whitespace-nowrap group pb-1.5 flex-shrink-0">
              All Batches
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#1E40AF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>
            {availableBranches.length > 0 && <span className="text-gray-300 font-light px-1 flex-shrink-0">|</span>}
            {availableBranches.map((branch, index) => (
              <React.Fragment key={branch}>
                <button onClick={() => navigate(`/courses/listing/${examCategory || 'all'}?branch=${branch}`)} className="relative text-[13px] font-normal whitespace-nowrap group pb-1.5 flex-shrink-0">
                  {branch}
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#1E40AF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </button>
                {index < availableBranches.length - 1 && <span className="text-gray-300 font-light px-1 flex-shrink-0">|</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="pb-24 bg-white">
          <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-10">
            {!contentLoading && availableBranches.map((branch) => {
              const branchCourses = categoryCourses.filter(c => c.branch === branch).slice(0, 3);
              if (branchCourses.length === 0) return null;
              return (
                <div key={branch} className="mb-14 md:mb-16">
                  <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-[#1a1a1a] font-['Inter',sans-serif]">
                      {currentCategoryData?.name} - {branch} Courses
                    </h3>
                    <div className="h-0.5 w-10 bg-[#1E3A8A] mt-1.5 rounded-full" />
                  </div>
                  
                  {/* Responsive Horizontal Scroll Grid */}
                  <div className="flex overflow-x-auto lg:overflow-x-visible lg:grid lg:grid-cols-3 gap-5 lg:gap-6 no-scrollbar pb-4 lg:pb-0 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
                    {branchCourses.map((course, index) => (
                      <div key={course.id} className="w-[85vw] max-w-[320px] sm:w-[45vw] sm:max-w-[340px] lg:w-auto lg:max-w-none flex-shrink-0 snap-start">
                        <CourseCard course={course} index={index} />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6">
                    <button 
                      className="bg-[#EFF6FF] text-[#1E3A8A] font-normal font-['Inter',sans-serif] py-2.5 px-8 rounded-md transition-all hover:bg-[#DBEAFE] flex items-center gap-2 text-[13px] md:text-sm border border-blue-100 shadow-sm"
                      onClick={() => navigate(`/courses/listing/${examCategory || 'all'}?branch=${branch}`)}
                    >
                      View all batches {">"}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const QuickLinkCard = ({ title, desc, icon: Icon, cardColor, iconColor, onClick }: {
  title: string; desc: string; icon: React.ElementType; cardColor: string; iconColor: string; onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    className={`group relative h-[100px] md:h-[120px] w-full rounded-xl px-4 flex flex-col justify-center border-2 border-transparent transition-all hover:border-black text-left font-['Inter',sans-serif] ${cardColor}`}
  >
    <div className="lg:absolute lg:-top-5 lg:left-5 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md z-10 border border-black/5 mb-2 lg:mb-0">
      <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
    </div>
    <div className="mt-0 lg:mt-2">
      <h3 className="text-[13px] md:text-sm font-bold text-[#1a1a1a] mb-0.5 leading-tight">{title}</h3>
      <p className="text-[10px] md:text-[11px] text-[#5f6368] font-normal line-clamp-1">{desc}</p>
    </div>
    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a1a] opacity-30" />
  </button>
);

export default Courses;
