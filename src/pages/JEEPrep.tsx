import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import SubjectBlock from "@/components/SubjectBlock";
import JEEPYQTab from "@/components/JEEPYQTab";
import OptimizedAuthWrapper from "@/components/OptimizedAuthWrapper";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import StudyGroupsTab from "@/components/StudyGroupsTab";
import NewsUpdatesTab from "@/components/NewsUpdatesTab";
import ImportantDatesTab from "@/components/ImportantDatesTab";
import { ChevronDown, X } from "lucide-react";
import { buildExamUrl, getTabFromUrl } from "@/utils/urlHelpers";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

const JEEPrep = () => {
  usePageSEO(SEO_TITLES.JEE_PREP, "/exam-preparation/jee");
  const { notes, pyqs, contentLoading, loadNotes, loadPyqs, loadImportantDates, loadNewsUpdates, loadCommunities } = useBackend();
  useEffect(() => {
    loadNotes("JEE");
    loadPyqs("JEE");
    loadImportantDates("JEE");
    loadNewsUpdates("JEE");
    loadCommunities("JEE");
  }, [loadNotes, loadPyqs, loadImportantDates, loadNewsUpdates, loadCommunities]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const filterRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [filterOffset, setFilterOffset] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<'subject' | 'year' | 'session' | null>(null);

  const [activeTab, setActiveTab] = useState(() => getTabFromUrl(location.pathname));
  const [activeClass, setActiveClass] = useState("class11");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  
  // PYQ filters
  const [pyqSubject, setPyqSubject] = useState<string | null>(null);
  const [pyqYear, setPyqYear] = useState<string | null>(null);
  const [pyqSession, setPyqSession] = useState<string | null>(null);
  const [tempPyqSubject, setTempPyqSubject] = useState<string | null>(null);
  const [tempPyqYear, setTempPyqYear] = useState<string | null>(null);
  const [tempPyqSession, setTempPyqSession] = useState<string | null>(null);
  
  // Sort order for tabs without filters
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');

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

  const availableSubjects = useMemo(() => {
    const jeeNotes = notes.filter(note => note.exam_type === 'JEE');
    const preferredOrder = ["Physics", "Mathematics", "Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"];
    const subjectSet = new Set(jeeNotes.map(note => note.subject).filter(Boolean) as string[]);
    const sorted = preferredOrder.filter(s => subjectSet.has(s));
    Array.from(subjectSet).forEach(s => { if (!sorted.includes(s)) sorted.push(s); });
    return sorted;
  }, [notes]);

  const availablePyqSubjects = useMemo(() => {
    const jeePyqs = pyqs.filter(p => p.exam_type === 'JEE');
    return Array.from(new Set(jeePyqs.map(p => p.subject).filter(Boolean) as string[])).sort();
  }, [pyqs]);

  const availableYears = useMemo(() => {
    const jeePyqs = pyqs.filter(p => p.exam_type === 'JEE');
    return Array.from(new Set(jeePyqs.map(p => p.year).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0)).map(String);
  }, [pyqs]);

  const availableSessions = useMemo(() => {
    const jeePyqs = pyqs.filter(p => p.exam_type === 'JEE');
    return Array.from(new Set(jeePyqs.map(p => p.session).filter(Boolean) as string[])).sort();
  }, [pyqs]);

  useEffect(() => {
    if (!contentLoading && availableSubjects.length > 0 && selectedSubjects.length === 0) {
      setSelectedSubjects([availableSubjects[0]]);
      setTempSubjects([availableSubjects[0]]);
    }
  }, [contentLoading, availableSubjects]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !(e.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setOpenDropdown(null);
    const firstSub = selectedSubjects[0] || availableSubjects[0];
    navigate(buildExamUrl('jee', newTab, { subject: firstSub, class: activeClass }), { replace: true });
  };

  const toggleDropdown = (type: 'subject' | 'year' | 'session') => {
    if (openDropdown === type) {
      setOpenDropdown(null);
    } else {
      setTempSubjects(selectedSubjects);
      setTempPyqSubject(pyqSubject);
      setTempPyqYear(pyqYear);
      setTempPyqSession(pyqSession);
      setOpenDropdown(type);
    }
  };

  const handleApply = () => {
    if (activeTab === 'notes') {
      setSelectedSubjects(tempSubjects);
    } else if (activeTab === 'pyqs') {
      setPyqSubject(tempPyqSubject);
      setPyqYear(tempPyqYear);
      setPyqSession(tempPyqSession);
    }
    setOpenDropdown(null);
  };

  const tabs = [
    { id: "notes", label: "Notes" },
    { id: "pyqs", label: "Previous Year Papers" },
    { id: "study-groups", label: "Study Groups" },
    { id: "news-updates", label: "News & Updates" },
    { id: "important-dates", label: "Important Dates" }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <ExamPrepHeader examName="JEE" examPath="/exam-preparation/jee" currentTab={activeTab} />

        {/* CONSTANT TWO-ROW STICKY FILTER SYSTEM */}
        <div ref={filterRef} className={`w-full transition-shadow duration-300 ${isSticky ? 'fixed top-16 bg-white border-b shadow-none z-[9999]' : 'relative z-[9999]'}`}>
          
          {/* ROW 1: MAIN SECTIONS (Indigo) */}
          <div className="bg-[#f4f2ff]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-8 pt-4 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`pb-2 text-[14px] md:text-[15px] cursor-pointer whitespace-nowrap transition-all font-sans ${
                      activeTab === tab.id ? 'text-[#6366f1] border-b-[3px] border-[#6366f1] font-semibold' : 'text-[#6b7280] font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2: SUB-FILTERS (White) - Separate container for dropdowns */}
          <div className="bg-white border-b border-[#f3f4f6] min-h-[56px] relative z-[100]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-nowrap items-center gap-3 py-3 font-sans overflow-x-auto no-scrollbar">
                {activeTab === 'notes' && (
                  <>
                    <button 
                      onClick={() => toggleDropdown('subject')}
                      className="px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all dropdown-container bg-white border-[#e5e7eb] text-[#374151]"
                    >
                      {selectedSubjects.length > 0 && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">{selectedSubjects.length}</span>}
                      Subjects
                      <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'subject' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                    </button>
                    <button onClick={() => setActiveClass(activeClass === "class11" ? "" : "class11")} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] transition-all whitespace-nowrap flex items-center gap-2 bg-white ${activeClass === "class11" ? 'border-black text-black' : 'border-[#e5e7eb] text-[#374151]'}`}>
                      Class 11
                      {activeClass === "class11" && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                    <button onClick={() => setActiveClass(activeClass === "class12" ? "" : "class12")} className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] transition-all whitespace-nowrap flex items-center gap-2 bg-white ${activeClass === "class12" ? 'border-black text-black' : 'border-[#e5e7eb] text-[#374151]'}`}>
                      Class 12
                      {activeClass === "class12" && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                    
                    {(selectedSubjects.length > 0 || activeClass) && (
                      <button 
                        onClick={() => { setSelectedSubjects([]); setActiveClass(""); }}
                        className="text-[#6366f1] text-[12px] md:text-[13px] font-medium whitespace-nowrap hover:underline"
                      >
                        Reset Filters
                      </button>
                    )}
                  </>
                )}
                {activeTab === 'pyqs' && (
                  <>
                    <button onClick={() => toggleDropdown('subject')} className="px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all dropdown-container bg-white border-[#e5e7eb] text-[#374151]">
                      {pyqSubject && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">1</span>}
                      Subject
                      <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'subject' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                    </button>
                    <button onClick={() => toggleDropdown('year')} className="px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all dropdown-container bg-white border-[#e5e7eb] text-[#374151]">
                      {pyqYear && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">1</span>}
                      Year
                      <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                    </button>
                    <button onClick={() => toggleDropdown('session')} className="px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] flex items-center transition-all dropdown-container bg-white border-[#e5e7eb] text-[#374151]">
                      {pyqSession && <span className="w-5 h-5 bg-[#6366f1] text-white rounded-full text-[10px] flex items-center justify-center mr-2">1</span>}
                      Session
                      <span className={`ml-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] transition-transform ${openDropdown === 'session' ? 'rotate-180' : ''} border-t-[#374151] border-l-transparent border-r-transparent`}></span>
                    </button>
                    
                    {(pyqSubject || pyqYear || pyqSession) && (
                      <button 
                        onClick={() => { setPyqSubject(null); setPyqYear(null); setPyqSession(null); }}
                        className="text-[#6366f1] text-[12px] md:text-[13px] font-medium whitespace-nowrap hover:underline"
                      >
                        Reset Filters
                      </button>
                    )}
                  </>
                )}
                {/* Sort options for tabs without specific filters */}
                {(activeTab === 'study-groups' || activeTab === 'news-updates' || activeTab === 'important-dates') && (
                  <>
                    <button 
                      onClick={() => setSortOrder('recent')}
                      className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] whitespace-nowrap transition-all flex items-center gap-2 bg-white ${sortOrder === 'recent' ? 'border-black text-black' : 'border-[#e5e7eb] text-[#374151]'}`}
                    >
                      Recent First
                      {sortOrder === 'recent' && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                    <button 
                      onClick={() => setSortOrder('oldest')}
                      className={`px-4 py-1.5 border rounded-[30px] text-[12px] md:text-[13px] whitespace-nowrap transition-all flex items-center gap-2 bg-white ${sortOrder === 'oldest' ? 'border-black text-black' : 'border-[#e5e7eb] text-[#374151]'}`}
                    >
                      Oldest First
                      {sortOrder === 'oldest' && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Dropdowns rendered OUTSIDE scrollable area for proper z-index */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {activeTab === 'notes' && openDropdown === 'subject' && (
                <div className="absolute top-0 left-4 right-4 sm:right-auto sm:left-6 lg:left-8 bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] sm:min-w-[200px] max-w-[calc(100vw-2rem)] p-3 dropdown-container">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availableSubjects.map(sub => (
                      <label key={sub} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={tempSubjects.includes(sub)} 
                          onChange={(e) => setTempSubjects(prev => e.target.checked ? [...prev, sub] : prev.filter(i => i !== sub))} 
                          className="accent-[#6366f1]" 
                        /> {sub}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button>
                  </div>
                </div>
              )}
              {activeTab === 'pyqs' && openDropdown === 'subject' && (
                <div className="absolute top-0 left-4 right-4 sm:right-auto sm:left-6 lg:left-8 bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] sm:min-w-[180px] max-w-[calc(100vw-2rem)] p-3 dropdown-container">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availablePyqSubjects.map(sub => (
                      <label key={sub} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs text-gray-700">
                        <input type="radio" name="pyqSubject" checked={tempPyqSubject === sub} onChange={() => setTempPyqSubject(sub)} className="accent-[#6366f1]" /> {sub}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button>
                  </div>
                </div>
              )}
              {activeTab === 'pyqs' && openDropdown === 'year' && (
                <div className="absolute top-0 left-4 right-4 sm:right-auto sm:left-[140px] lg:left-[150px] bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] sm:min-w-[140px] max-w-[calc(100vw-2rem)] p-3 dropdown-container">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availableYears.map(year => (
                      <label key={year} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs text-gray-700">
                        <input type="radio" name="pyqYear" checked={tempPyqYear === year} onChange={() => setTempPyqYear(year)} className="accent-[#6366f1]" /> {year}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button>
                  </div>
                </div>
              )}
              {activeTab === 'pyqs' && openDropdown === 'session' && (
                <div className="absolute top-0 left-4 right-4 sm:right-auto sm:left-[260px] lg:left-[280px] bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[9999] sm:min-w-[140px] max-w-[calc(100vw-2rem)] p-3 dropdown-container">
                  <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1">
                    {availableSessions.map(session => (
                      <label key={session} className="flex items-center gap-2 p-1.5 hover:bg-[#f9fafb] rounded cursor-pointer text-xs text-gray-700">
                        <input type="radio" name="pyqSession" checked={tempPyqSession === session} onChange={() => setTempPyqSession(session)} className="accent-[#6366f1]" /> {session}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={handleApply} className="flex-1 py-1 text-[11px] font-semibold bg-[#6366f1] text-white rounded hover:bg-[#5255e0]">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isSticky && <div className="h-[120px]" />}

        <section className="py-8 bg-white min-h-[600px] relative z-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === "notes" && <SubjectBlock subjects={selectedSubjects} selectedClass={activeClass} examType="JEE" />}
            {activeTab === "pyqs" && <JEEPYQTab subject={pyqSubject} year={pyqYear} session={pyqSession} />}
            {activeTab === "study-groups" && <OptimizedAuthWrapper><StudyGroupsTab examType="JEE" sortOrder={sortOrder} /></OptimizedAuthWrapper>}
            {activeTab === "news-updates" && <NewsUpdatesTab examType="JEE" sortOrder={sortOrder} />}
            {activeTab === "important-dates" && <ImportantDatesTab examType="JEE" sortOrder={sortOrder} />}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default JEEPrep;
