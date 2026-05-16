import React, { useEffect, useState, useMemo } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Search,
  ChevronDown,
  Plus,
  Minus,
  Loader2,
  X,
  Check,
  FilterX,
  Bookmark
} from "lucide-react";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

// --- RESUME DROP CARD ---
const ResumeDropCard = () => {
  const emailTo = "unknowniitians@gmail.com";
  const emailCc = "support@unknowniitians.live";
  const subject = encodeURIComponent("Job Application / Resume Submission");
  const body = encodeURIComponent(`Name: 
Year: 
College: 
Role interested in :
If teaching then subject: 

(Please attach your resume to this email)`);

  const mailtoLink = `mailto:${emailTo}?cc=${emailCc}&subject=${subject}&body=${body}`;

  return (
    // Updated: border-slate-400 for balanced dark grey
    <div className="bg-white w-full p-[30px] rounded-[20px] border border-slate-400 shadow-sm text-left mt-6">
       {/* Illustration Frame */}
       <div className="w-full h-[200px] mb-[25px] flex justify-center items-center overflow-hidden">
           <img 
             src="https://i.ibb.co/L9p6QpL/job-search-placeholder.png" 
             alt="Job Search Illustration" 
             className="max-w-full h-auto object-contain"
           />
       </div>

       {/* Text Section */}
       <h2 className="text-[22px] font-semibold text-[#2c3e50] mb-[12px]">
         Can’t find the right job?
       </h2>
       <p className="text-[16px] leading-[1.5] text-[#5d6d7e] mb-[30px]">
         Drop in your resume and we’ll get back to you when we have suitable openings that match your profile!
       </p>

       {/* Action Button */}
       <a 
         href={mailtoLink}
         className="inline-block px-[28px] py-[12px] border-[1.5px] border-[#2575e6] rounded-[10px] bg-transparent text-[#2575e6] text-[18px] font-semibold no-underline transition-all duration-200 hover:bg-[#f0f7ff] hover:text-[#1a5bb8] hover:border-[#1a5bb8]"
       >
         Apply Here
       </a>
    </div>
  );
};

// --- HERO BANNER COMPONENT ---
const HeroBanner = ({ 
  searchTerm, 
  setSearchTerm 
}: { 
  searchTerm: string; 
  setSearchTerm: (s: string) => void;
}) => {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#f0f4c3] via-[#d1e3ff] to-[#f3e5f5] h-[280px] mb-16">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] bg-white opacity-40 rounded-full blur-3xl -z-10 top-[-50px] right-[-50px]"></div>
        <div className="absolute w-[300px] h-[300px] bg-blue-100 opacity-40 rounded-full blur-3xl -z-10 bottom-[-50px] left-[-50px]"></div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[90%] max-w-[800px] z-20">
        <div className="relative w-full shadow-xl bg-white rounded-full border border-slate-200">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-4 pl-8 pr-16 rounded-full text-[16px] outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all text-slate-700 placeholder:text-slate-400"
            placeholder="Search by role, company or location..."
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searchTerm ? (
              <button 
                onClick={() => setSearchTerm("")} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 bg-blue-600 rounded-full text-white shadow-md">
                <Search className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CareerOpportunities = () => {
  usePageSEO(SEO_TITLES.CAREER_OPENINGS, "/career/openings");
  const { jobs, contentLoading, loadJobs } = useBackend();
  useEffect(() => { loadJobs(); }, [loadJobs]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Filter States
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  const [expandedFilter, setExpandedFilter] = useState<string | null>("job_type"); 

  // Derived Unique Values from Active Jobs
  const activeJobs = useMemo(() => jobs.filter(j => j.is_active), [jobs]);

  const uniqueJobTypes = useMemo(() => {
    const items = new Set<string>();
    activeJobs.forEach(job => { if (job.job_type) items.add(job.job_type); });
    return Array.from(items).sort();
  }, [activeJobs]);

  const uniqueExperienceLevels = useMemo(() => {
    const items = new Set<string>();
    activeJobs.forEach(job => { if (job.experience_level) items.add(job.experience_level); });
    return Array.from(items).sort();
  }, [activeJobs]);

  const uniqueLocations = useMemo(() => {
    const items = new Set<string>();
    activeJobs.forEach(job => { if (job.location) items.add(job.location); });
    return Array.from(items).sort();
  }, [activeJobs]);

  // Filtering Logic
  const openings = useMemo(() => {
    return activeJobs.filter(job => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          job.title?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.company?.toLowerCase().includes(term) ||
          job.job_type?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      
      if (selectedJobTypes.length > 0) {
        if (!job.job_type || !selectedJobTypes.includes(job.job_type)) return false;
      }
      if (selectedExperienceLevels.length > 0) {
        if (!job.experience_level || !selectedExperienceLevels.includes(job.experience_level)) return false;
      }
      if (selectedLocations.length > 0) {
        if (!job.location || !selectedLocations.includes(job.location)) return false;
      }

      return true;
    });
  }, [activeJobs, searchTerm, selectedJobTypes, selectedExperienceLevels, selectedLocations]);

  const toggleFilter = (item: string, currentSelected: string[], setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentSelected.includes(item)) {
      setFn(currentSelected.filter(i => i !== item));
    } else {
      setFn([...currentSelected, item]);
    }
  };

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedExperienceLevels([]);
    setSelectedLocations([]);
    setSearchTerm("");
  };

  const toggleExpanded = (filterName: string) => {
    setExpandedFilter(prev => prev === filterName ? null : filterName);
  };

  const hasActiveFilters = selectedJobTypes.length > 0 || selectedExperienceLevels.length > 0 || selectedLocations.length > 0 || searchTerm !== "";

  const FilterSection = ({ title, items, selectedItems, id, onToggle }: { title: string, items: string[], selectedItems: string[], id: string, onToggle: (item: string) => void }) => (
    // Updated: Slightly darker border for filters to match the theme better
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden mb-3 shrink-0">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => toggleExpanded(id)}
      >
        <span className="text-sm text-slate-800 font-medium flex items-center gap-2">
          {title}
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] bg-blue-100 text-blue-700">
              {selectedItems.length}
            </Badge>
          )}
        </span>
        {expandedFilter === id ? <Minus className="w-4 h-4 text-slate-500" /> : <Plus className="w-4 h-4 text-slate-500" />}
      </div>
      
      <AnimatePresence initial={false}>
        {expandedFilter === id && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-slate-50/50 border-t border-slate-300"
          >
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {items.length > 0 ? items.map((item) => (
                <button
                  key={item}
                  onClick={(e) => { e.stopPropagation(); onToggle(item); }}
                  className={`flex items-center w-full text-left text-sm py-2 px-2 rounded-md transition-colors ${
                    selectedItems.includes(item) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-4 h-4 mr-3 rounded border flex items-center justify-center transition-colors ${
                    selectedItems.includes(item) ? "bg-blue-600 border-blue-600" : "border-slate-400 bg-white"
                  }`}>
                    {selectedItems.includes(item) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {item}
                </button>
              )) : (
                <p className="text-xs text-slate-400 italic">No options available</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="bg-white min-h-screen flex flex-col text-slate-900" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shrink-0 shadow-sm border-b border-slate-100">
        <NavBar />
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* HERO BANNER SECTION (Includes Search) */}
        <HeroBanner searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {/* FULL WIDTH CONTAINER */}
        <div className="w-full px-6 lg:px-10 flex flex-col flex-1 pb-16">
            
            {/* Stats & Sort Controls */}
            <div className="shrink-0 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-medium text-slate-900">
                  {openings.length} {openings.length === 1 ? 'Job Opening' : 'Job Openings'}
                </h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs flex items-center gap-1 text-red-500 font-medium hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded-full border border-red-100">
                    <FilterX className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                Newest First <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Main Grid: Filters + Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
              
              {/* Left Column: Filters - Sticky */}
              <div className="hidden lg:block sticky top-24 z-30 h-fit">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Filter By</p>
                
                <FilterSection 
                  title="Job Type" 
                  id="job_type" 
                  items={uniqueJobTypes} 
                  selectedItems={selectedJobTypes} 
                  onToggle={(item) => toggleFilter(item, selectedJobTypes, setSelectedJobTypes)}
                />

                <FilterSection 
                  title="Experience Level" 
                  id="experience_level" 
                  items={uniqueExperienceLevels} 
                  selectedItems={selectedExperienceLevels} 
                  onToggle={(item) => toggleFilter(item, selectedExperienceLevels, setSelectedExperienceLevels)}
                />

                <FilterSection 
                  title="Location" 
                  id="location" 
                  items={uniqueLocations} 
                  selectedItems={selectedLocations} 
                  onToggle={(item) => toggleFilter(item, selectedLocations, setSelectedLocations)}
                />

                {/* --- RESUME DROP BUTTON --- */}
                <ResumeDropCard />

              </div>

              {/* Right Column: Jobs List */}
              <div className="min-h-[500px]">
                <div className="space-y-5">
                  {contentLoading ? (
                    <div className="flex justify-center items-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : openings.length > 0 ? (
                    openings.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        // Updated: border-slate-400 (balanced dark grey), no hover glow
                        className="bg-white border border-slate-400 rounded-lg p-6"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          {/* Job Details Section */}
                          <div className="flex-1">
                            <h2 className="text-xl font-medium text-slate-900 mb-1">{job.title}</h2>
                            {job.company && (
                              <div className="text-slate-500 text-sm mb-4">
                                {job.company}
                              </div>
                            )}
                            
                            {/* Tags: Rectangular, Greyish BG, Dark Grey Text */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              {job.location && (
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-sm border border-slate-200">
                                  {job.location}
                                </span>
                              )}
                              
                              {job.job_type && (
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-sm border border-slate-200">
                                  {job.job_type}
                                </span>
                              )}
                              
                              {job.experience_level && (
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-sm border border-slate-200">
                                  {job.experience_level}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Section: Bookmark Box + Button in same row */}
                          <div className="shrink-0 mt-4 md:mt-0 flex items-center gap-3">
                             {/* Bookmark - Box Style, matching slate-400 border theme */}
                            <button className="h-10 w-10 flex items-center justify-center border border-slate-400 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors shadow-sm bg-white">
                              <Bookmark className="w-5 h-5" />
                            </button>

                            <Button 
                              onClick={() => navigate(`/career/job/${job.id}`)}
                              className="bg-slate-900 hover:bg-blue-600 text-white font-medium px-6 h-10 rounded-lg transition-all duration-200 shadow-sm"
                            >
                              View Details & Apply
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs found</h3>
                      <p className="text-slate-500 max-w-xs mx-auto mb-6">
                        We couldn't find any positions matching your current filters.
                      </p>
                      <button 
                        onClick={clearFilters} 
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
      
      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default CareerOpportunities;
