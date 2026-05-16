import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import CourseCardSkeleton from "@/components/courses/CourseCardSkeleton";
import CourseCard from "@/components/courses/CourseCard";
import HeroCarousel from "@/components/HeroCarousel";
import { 
  ChevronRight,
  Home,
  X
} from "lucide-react";
import { usePageSEO, getCourseListingTitleSEO } from "@/utils/seoManager";

const CourseListing = () => {
  const { examCategory } = useParams<{ examCategory?: string }>();
  usePageSEO(getCourseListingTitleSEO(examCategory || 'all'), `/courses/listing/${examCategory || 'all'}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { courses, contentLoading, loadCourses } = useBackend();
  useEffect(() => { loadCourses(); }, [loadCourses]);
  
  
  // Applied Filter States
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null); // Restored pricing state
  const [newlyLaunched, setNewlyLaunched] = useState(false);
  const [fastrackOnly, setFastrackOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);

  // Temporary states for Apply/Cancel logic
  const [tempLevels, setTempLevels] = useState<string[]>([]);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [tempPrice, setTempPrice] = useState<string | null>(null); // Restored temporary pricing state

  // Dropdown State
  const [openDropdown, setOpenDropdown] = useState<'level' | 'subject' | 'pricing' | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [filterOffset, setFilterOffset] = useState(0);

  const branchFromUrl = searchParams.get('branch');

  useEffect(() => {
    if (filterRef.current) setFilterOffset(filterRef.current.offsetTop);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const navbarHeight = 64; 
      if (filterRef.current && filterOffset > 0) {
        setIsSticky(window.scrollY > filterOffset - navbarHeight);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filterOffset]);


  const categoryFilteredCourses = useMemo(() => {
    // Check is_live to determine if the course should be displayed
    const liveCourses = courses.filter(course => course.is_live === true);

    if (!examCategory || examCategory === 'all') return liveCourses;
    return liveCourses.filter(course => 
      course.exam_category?.toLowerCase().replace(/[\s_]/g, '-') === examCategory.toLowerCase()
    );
  }, [courses, examCategory]);

  const branchFilteredCourses = useMemo(() => {
    if (!branchFromUrl) return categoryFilteredCourses;
    return categoryFilteredCourses.filter(c => c.branch === branchFromUrl);
  }, [categoryFilteredCourses, branchFromUrl]);

  const availableBranches = useMemo(() => Array.from(new Set(categoryFilteredCourses.map(c => c.branch))).filter(Boolean).sort(), [categoryFilteredCourses]);
  const availableLevels = useMemo(() => Array.from(new Set(branchFilteredCourses.map(c => c.level))).filter(Boolean).sort(), [branchFilteredCourses]);
  const availableSubjects = useMemo(() => Array.from(new Set(branchFilteredCourses.map(c => c.subject))).filter(Boolean).sort(), [branchFilteredCourses]);

  const filteredCourses = useMemo(() => {
    let result = [...branchFilteredCourses];
    if (selectedLevels.length > 0) result = result.filter(c => selectedLevels.includes(c.level || ''));
    if (selectedSubjects.length > 0) result = result.filter(c => selectedSubjects.includes(c.subject || ''));
    
    // Updated Pricing Filter: Logic handles both original price and discounted price
    if (priceRange) {
      result = result.filter(c => {
        const effectivePrice = (c.discounted_price !== null && c.discounted_price !== undefined) 
          ? c.discounted_price 
          : c.price;
        return priceRange === 'free' ? effectivePrice === 0 : effectivePrice > 0;
      });
    }

    if (newlyLaunched) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(c => c.updated_at && new Date(c.updated_at) > thirtyDaysAgo);
    }

    // Fastrack Filter: Synced with the batch_type column in backend
    if (fastrackOnly) {
      result = result.filter(c => c.batch_type?.toLowerCase().includes('fastrack'));
    }

    if (bestSellerOnly) result = result.filter(c => c.bestseller === true);
    return result;
  }, [branchFilteredCourses, selectedLevels, selectedSubjects, priceRange, newlyLaunched, fastrackOnly, bestSellerOnly]);

  const groupedCourses = useMemo(() => {
    const groups: Record<string, typeof filteredCourses> = {};
    filteredCourses.forEach(course => {
      const type = course.course_type || "Available Batches";
      if (!groups[type]) groups[type] = [];
      groups[type].push(course);
    });
    return groups;
  }, [filteredCourses]);

  const toggleDropdown = (type: 'level' | 'subject' | 'pricing') => {
    if (openDropdown === type) {
      setOpenDropdown(null);
    } else {
      setTempLevels(selectedLevels);
      setTempSubjects(selectedSubjects);
      setTempPrice(priceRange);
      setOpenDropdown(type);
    }
  };

  const handleApply = () => {
    setSelectedLevels(tempLevels);
    setSelectedSubjects(tempSubjects);
    setPriceRange(tempPrice);
    setOpenDropdown(null);
  };

  const toggleTempItem = (item: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const currentCategoryName = examCategory?.replace(/-/g, ' ').toUpperCase() || 'COURSES';

  return (
    <div className="min-h-screen font-sans text-foreground w-full overflow-x-hidden bg-[#fcfcfc] relative">
      <NavBar />
      <main className="pt-16">
        <HeroCarousel pagePath={location.pathname} />

        <div className="relative overflow-hidden flex flex-col items-center px-4 py-6 md:py-8 border-b border-border/50">
          <div className="absolute top-0 left-0 w-[45%] h-full bg-gradient-to-br from-[#e6f0ff]/70 to-transparent z-0 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          <div className="absolute bottom-0 right-0 w-[50%] h-full bg-gradient-to-tl from-[#ebf2ff]/80 to-transparent z-0 pointer-events-none" style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />
          <div className="relative z-10 w-full max-w-6xl font-sans">
            <nav className="flex items-center gap-2 text-[#666] text-xs mb-3 font-normal">
              <Link to="/" className="hover:text-primary transition-colors"><Home className="w-3 h-3" /></Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <Link to="/courses" className="hover:text-primary transition-colors uppercase tracking-tight">{currentCategoryName}</Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="font-bold text-[#1E3A8A] uppercase tracking-tight">BATCHES</span>
            </nav>
            <h1 className="text-xl md:text-3xl font-bold text-[#1a1a1a] mb-2 leading-tight uppercase tracking-tight">{currentCategoryName} Online Coaching</h1>
            <p className="text-[#555] text-xs md:text-sm leading-relaxed max-w-4xl mb-2 font-normal">Access curated coaching and live sessions for {currentCategoryName} preparation. Explore lectures, study materials, and mock test series to ensure academic success.</p>
          </div>
        </div>

        {/* STICKY FILTER BAR */}
        <div ref={filterRef} className={`w-full z-[60] transition-shadow duration-300 ${isSticky ? 'fixed top-16 bg-white border-b shadow-none' : 'relative'}`}>
          <div className="bg-[#f4f2ff]">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <div className="flex gap-8 pt-4 overflow-x-auto no-scrollbar">
                <button onClick={() => setSearchParams({})} className={`pb-2 text-[14px] md:text-[15px] cursor-pointer transition-all whitespace-nowrap font-sans ${!branchFromUrl ? 'text-[#6366f1] border-b-[3px] border-[#6366f1] font-semibold' : 'text-[#6b7280] font-medium'}`}>All Batches</button>
                {availableBranches.map((branch) => (
                  <button key={branch} onClick={() => setSearchParams({ branch: branch })} className={`pb-2 text-[14px] md:text-[15px] cursor-pointer transition-all whitespace-nowrap font-sans ${branchFromUrl === branch ? 'text-[#6366f1] border-b-[3px] border-[#6366f1] font-semibold' : 'text-[#6b7280] font-medium'}`}>{branch}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-[#f3f4f6] relative z-[100]">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <div className="flex flex-nowrap items-center gap-3 py-3 font-sans min-w-max overflow-x-auto no-scrollbar">
                {/* Level Dropdown Filter */}
                <div className="relative">
                  <button onClick={() => toggleDropdown('level')} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all ${selectedLevels.length > 0 ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                    {selectedLevels.length > 0 && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">{selectedLevels.length}</span>}
                    Level
                    <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'level' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                  </button>
                </div>

                {/* Subject Dropdown Filter */}
                <div className="relative">
                  <button onClick={() => toggleDropdown('subject')} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all ${selectedSubjects.length > 0 ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                    {selectedSubjects.length > 0 && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">{selectedSubjects.length}</span>}
                    Subject
                    <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'subject' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                  </button>
                </div>

                {/* Pricing Dropdown Filter - Restored */}
                <div className="relative">
                  <button onClick={() => toggleDropdown('pricing')} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all ${priceRange ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                    {priceRange && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">1</span>}
                    Pricing
                    <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'pricing' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                  </button>
                </div>

                {/* Toggle Filters */}
                <button onClick={() => setBestSellerOnly(!bestSellerOnly)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] transition-all whitespace-nowrap flex items-center gap-2 ${bestSellerOnly ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                  Best Seller
                  {bestSellerOnly && <X className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setNewlyLaunched(!newlyLaunched)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] transition-all whitespace-nowrap flex items-center gap-2 ${newlyLaunched ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                  Newly Launched
                  {newlyLaunched && <X className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setFastrackOnly(!fastrackOnly)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] transition-all whitespace-nowrap flex items-center gap-2 ${fastrackOnly ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                  Fastrack Batch
                  {fastrackOnly && <X className="w-3.5 h-3.5" />}
                </button>

                {/* Reset Filters */}
                {(selectedLevels.length > 0 || selectedSubjects.length > 0 || priceRange || bestSellerOnly || newlyLaunched || fastrackOnly) && (
                  <button 
                    onClick={() => {
                      setSelectedLevels([]);
                      setSelectedSubjects([]);
                      setPriceRange(null);
                      setBestSellerOnly(false);
                      setNewlyLaunched(false);
                      setFastrackOnly(false);
                    }}
                    className="text-[#6366f1] text-[12px] md:text-[13px] font-medium whitespace-nowrap hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Dropdowns */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
              {openDropdown === 'level' && (
                <div className="absolute top-0 left-4 md:left-8 bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] min-w-[180px] p-3">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availableLevels.map(lvl => (
                      <label key={lvl} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs font-normal">
                        <input type="checkbox" checked={tempLevels.includes(lvl)} onChange={() => toggleTempItem(lvl, tempLevels, setTempLevels)} className="accent-[#6366f1]" /> {lvl}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t"><button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button><button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button></div>
                </div>
              )}
              {openDropdown === 'subject' && (
                <div className="absolute top-0 left-[100px] md:left-[120px] bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] min-w-[180px] p-3">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availableSubjects.map(sub => (
                      <label key={sub} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs font-normal">
                        <input type="checkbox" checked={tempSubjects.includes(sub)} onChange={() => toggleTempItem(sub, tempSubjects, setTempSubjects)} className="accent-[#6366f1]" /> {sub}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t"><button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button><button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button></div>
                </div>
              )}
              {/* Pricing Dropdown Content - Restored */}
              {openDropdown === 'pricing' && (
                <div className="absolute top-0 left-[200px] md:left-[230px] bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] min-w-[180px] p-3">
                  <div className="space-y-1.5 mb-3">
                    {['free', 'paid'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded text-xs capitalize font-normal">
                        <input type="radio" name="price" checked={tempPrice === opt} onChange={() => setTempPrice(opt)} className="accent-[#6366f1]" /> {opt}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t"><button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button><button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isSticky && <div className="h-[120px]" />}

        <div className="pb-32 bg-white relative z-0">
          <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8 font-sans">
            {contentLoading ? <div className="grid lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)}</div> : (
              Object.entries(groupedCourses).map(([groupName, groupCourses]) => (
                <div key={groupName} className="mb-20">
                  <div className="mb-6">
                    <p className="text-[14px] md:text-[15px] font-normal text-[#1a1a1a] tracking-tight">Showing {groupCourses.length} Batches</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupCourses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseListing;
