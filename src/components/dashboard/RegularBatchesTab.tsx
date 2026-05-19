import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, BookOpen, ArrowLeft } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { FreeBatchSection } from './FreeBatchSection';
import { useIsMobile } from "@/hooks/use-mobile";
import SlidersIcon from "@/components/ui/SliderIcon";
import RefineBatchesModal from "./RefineBatchesModal"; 
import { useNavigate } from "react-router-dom";

interface RegularBatchesTabProps {
  focusArea: string;
  onSelectCourse: (id: string) => void;
}

const CourseCard: React.FC<{ 
  course: Tables<'courses'>, 
  onSelect: (id: string) => void 
}> = ({ course, onSelect }) => {
  const navigate = useNavigate();
  const [minAddonPrice, setMinAddonPrice] = useState<number | null>(null);
  const [hasAddons, setHasAddons] = useState(false);

  const discount = course.discounted_price 
    ? Math.round(((course.price - course.discounted_price) / course.price) * 100) 
    : 0;

  // Check for Paid Add-ons
  useEffect(() => {
    const checkAddons = async () => {
      const { data } = await supabase
        .from('course_addons')
        .select('price')
        .eq('course_id', course.id);
      
      if (data && data.length > 0) {
        setHasAddons(true);
        if (course.price === 0 || course.price === null) {
          const paidAddons = data.filter(addon => addon.price > 0);
          if (paidAddons.length > 0) {
            setMinAddonPrice(Math.min(...paidAddons.map(p => p.price)));
          }
        }
      } else {
        setHasAddons(false);
      }
    };
    checkAddons();
  }, [course.id, course.price]);

  const renderEnrollAction = () => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/courses/${course.id}/configure`);
        }}
        className="bg-black text-white py-2 px-5 rounded-lg font-bold text-[13px] hover:bg-black/90 transition-colors"
      >
        Enroll
      </button>
    );
  };

  return (
    <div className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-[#e0e0e0] flex flex-col transition-all duration-300 h-full">
      {/* --- UPDATED BANNER LOGIC --- */}
      <div 
        className="w-full aspect-video overflow-hidden cursor-pointer" 
        onClick={() => onSelect(course.id)}
      >
        {course.image_url ? (
          <img 
            src={course.image_url} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#fce07c] to-[#f9c83d] flex flex-col justify-center items-center p-4">
            <div className="text-white/90 text-[20px] md:text-[24px] font-[800] text-center uppercase leading-tight drop-shadow-sm">
              {course.title}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-[10px]">
          <span className="text-[#f97316] font-bold text-xs uppercase tracking-tight">{course.level || 'Academic'}</span>
          <span className="border border-[#ccc] px-2 py-0.5 rounded-[4px] text-[10px] font-semibold text-[#555] uppercase">{course.language || 'Hinglish'}</span>
        </div>
        
        <h2 
          onClick={() => onSelect(course.id)}
          className="text-[18px] font-bold text-[#1f2937] mb-[12px] line-clamp-2 leading-tight h-[44px] cursor-pointer hover:text-blue-800 transition-colors"
        >
          {course.title}
        </h2>
        
        <div className="min-h-[50px] space-y-2 mb-4">
          <div className="flex items-center gap-2.5 text-[#4b5563] text-[14px]">
            <BookOpen className="w-[18px] h-[18px] text-[#666]" />
            {course.subject || 'Foundation'}
          </div>
          <div className="flex items-center gap-2.5 text-[#4b5563] text-[14px]">
            <span className="w-2 h-2 bg-[#dc2626] rounded-full"></span>
            <span className="font-bold">Ongoing</span> 
            <span className="text-[#d1d5db] mx-1">|</span> 
            Starts: {course.start_date ? new Date(course.start_date).toLocaleDateString('en-GB') : "TBD"}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-[15px] border-t border-gray-100">
          <div>
            {minAddonPrice !== null ? (
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Starts at</span>
                <span className="text-[20px] font-extrabold text-black">₹{minAddonPrice.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[20px] font-extrabold text-black">₹{course.discounted_price || course.price}</span>
                  {course.discounted_price && <span className="text-[13px] text-[#9ca3af] line-through">₹{course.price}</span>}
                </div>
                {discount > 0 && <span className="text-[#166534] font-bold text-[13px]">{discount}% OFF</span>}
              </>
            )}
          </div>
          <div className="flex gap-2">
            
            {renderEnrollAction()}

            <button onClick={() => onSelect(course.id)} className="bg-white border border-[#e5e7eb] w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-[#1f2937]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegularBatchesTab: React.FC<RegularBatchesTabProps> = ({ focusArea, onSelectCourse }) => {
  const isMobile = useIsMobile();
  const [batches, setBatches] = useState<Tables<'courses'>[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isViewingAllFree, setIsViewingAllFree] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");
  
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data } = await supabase.from('courses')
        .select('*')
        .ilike('exam_category', focusArea)
        .eq('batch_type', 'regular')
        .eq('is_live', true);
      if (data) setBatches(data);
      setLoading(false);
    };
    fetchCourses();
  }, [focusArea]);

  const searchKeywords = useMemo(() => {
    const levels = Array.from(new Set(batches.filter(b => b.level).map(b => b.level as string)));
    const subjects = Array.from(new Set(batches.filter(b => b.subject).map(b => b.subject as string)));
    const titles = batches.slice(0, 5).map(b => b.title.split(' ')[0]);
    const categories = focusArea ? [focusArea] : [];

    const result: string[] = [];
    const maxLen = Math.max(levels.length, subjects.length, titles.length, categories.length);

    for (let i = 0; i < maxLen; i++) {
      if (levels[i]) result.push(levels[i]);
      if (subjects[i]) result.push(subjects[i]);
      if (titles[i]) result.push(titles[i]);
      if (categories[i]) result.push(categories[i]);
    }

    return result.length > 0 ? result : ["Physics", "Chemistry", "Foundation", "JEE", "NEET"];
  }, [batches, focusArea]);

  useEffect(() => {
    if (searchKeywords.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchKeywords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [searchKeywords]);

  const availableLevels = Array.from(new Set(batches.filter(b => b.level).map(b => b.level)));

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  const filtered = batches.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      b.title.toLowerCase().includes(searchLower) ||
      (b.level?.toLowerCase().includes(searchLower) || false) ||
      (b.subject?.toLowerCase().includes(searchLower) || false) ||
      (b.exam_category?.toLowerCase().includes(searchLower) || false);

    const matchesQuickFilter = activeQuickFilter === "All" || b.level === activeQuickFilter;
    
    const matchesLevel = !appliedFilters.level?.length || 
      appliedFilters.level.includes(b.level || "") || 
      appliedFilters.level.includes(b.branch || "");

    const matchesSubject = !appliedFilters.subject?.length || 
      appliedFilters.subject.includes(b.subject || "");
    
    const matchesLanguage = !appliedFilters.language?.length || 
      appliedFilters.language.includes(b.language || "");

    const matchesExamCategory = !appliedFilters.exam_category?.length ||
      appliedFilters.exam_category.includes(b.exam_category || "");

    return matchesSearch && matchesQuickFilter && matchesLevel && matchesSubject && matchesLanguage && matchesExamCategory;
  });

  const paidBatches = filtered.filter(b => b.payment_type === 'paid');
  const freeBatches = filtered.filter(b => b.payment_type === 'free');

  return (
    <div className="flex flex-col h-full bg-white"> 
      <div className={`sticky top-0 z-30 bg-white transition-all duration-300 px-4 md:px-6 lg:px-8 shrink-0 flex flex-col ${isScrolled ? 'border-b border-[#e0e0e0] shadow-sm' : 'border-b-transparent shadow-none'}`}>
        <div className="h-[73px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isViewingAllFree && (
              <button onClick={() => setIsViewingAllFree(false)} className="mr-1 p-1 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className={`${isMobile ? 'text-[18px]' : 'text-[22px]'} font-bold tracking-tight text-[#1a1a1a]`}>
              {isViewingAllFree ? "Free Batches" : "Batches"}
            </h1>
          </div>
          <div className="relative flex-1 max-w-[250px] md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <Input 
              placeholder={`Search ${searchKeywords[placeholderIndex]}`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-800 text-sm shadow-none placeholder:transition-all placeholder:duration-500" 
            />
          </div>
        </div>

        {!isViewingAllFree && (
          <div className="flex gap-2.5 pb-4 overflow-x-auto no-scrollbar items-center">
            <div 
              onClick={() => setIsRefineModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-[12px] font-bold text-gray-500 whitespace-nowrap bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Filter <SlidersIcon className="w-4 h-4" />
            </div>
            
            <button
              onClick={() => setActiveQuickFilter("All")}
              className={`px-4 py-2 border rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${activeQuickFilter === "All" ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              All
            </button>
            {availableLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveQuickFilter(lvl!)}
                className={`px-4 py-2 border rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${activeQuickFilter === lvl ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 no-scrollbar">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {!isViewingAllFree && paidBatches.length > 0 && (
                <div className="mb-14">
                  <h2 className="text-[24px] font-semibold tracking-tight text-[#111] uppercase mb-8 hidden md:block">
                    Popular Batches
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {paidBatches.map(batch => (
                      <CourseCard key={batch.id} course={batch} onSelect={onSelectCourse} />
                    ))}
                  </div>
                </div>
              )}

              {freeBatches.length > 0 && (
                isViewingAllFree ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 w-full">
                    {freeBatches.map(batch => (
                      <CourseCard key={batch.id} course={batch} onSelect={onSelectCourse} />
                    ))}
                  </div>
                ) : (
                  <FreeBatchSection batches={freeBatches} onSelect={onSelectCourse} onViewAll={() => setIsViewingAllFree(true)} />
                )
              )}

              {filtered.length === 0 && (
                <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200 w-full">
                  <p className="text-gray-400 text-lg font-medium">No results found matching your search.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RefineBatchesModal 
        isOpen={isRefineModalOpen} 
        onClose={() => setIsRefineModalOpen(false)} 
        onApply={(filters) => setAppliedFilters(filters)} 
        focusArea={focusArea}
      />
    </div>
  );
};

export default RegularBatchesTab;
