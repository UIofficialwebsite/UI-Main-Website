import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useIITMBranchNotes } from "@/components/iitm/hooks/useIITMBranchNotes";
import { useDownloadHandler } from "@/hooks/useDownloadHandler";
import NavBar from "@/components/NavBar";
import HeroCarousel from "@/components/HeroCarousel";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Download } from "lucide-react";
import { slugify } from "@/utils/urlHelpers";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";

import { usePageSEO, getIITMNotesTitleSEO } from "@/utils/seoManager";

const IITMBSSubjectNotesPage = () => {
  const { branch, level, subjectSlug } = useParams<{ branch: string; level: string; subjectSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, groupedData } = useIITMBranchNotes(branch || "", level || "");
  const { handleDownload, downloadCounts } = useDownloadHandler();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  
  const requireAuth = (action: () => void) => {
    if (!user) { openLogin(); return; }
    action();
  };
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Dynamic page title and canonical based on subject and level
  usePageSEO(
    selectedSubject ? getIITMNotesTitleSEO(selectedSubject, level || "Foundation") : "IITM BS Notes",
    branch && level && subjectSlug ? `/exam-preparation/iitm-bs/notes/${branch}/${level}/${subjectSlug}` : undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  
  
  const [isSticky, setIsSticky] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(0);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Sync current subject name from URL slug
  useEffect(() => {
    if (groupedData.length > 0 && subjectSlug) {
      const current = groupedData.find(s => slugify(s.subjectName) === subjectSlug);
      if (current) setSelectedSubject(current.subjectName);
    }
  }, [groupedData, subjectSlug]);


  // Handle sticky search bar behavior
  useEffect(() => {
    const updateOffset = () => {
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setStickyOffset(rect.top + scrollTop);
      }
    };

    const timeout = setTimeout(updateOffset, 500);
    window.addEventListener('resize', updateOffset);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateOffset);
    };
  }, [loading]);

  useEffect(() => {
    const handleScroll = () => {
      const navbarHeight = 64; // Height of NavBar (h-16)
      if (searchBarRef.current && stickyOffset > 0) {
        setIsSticky(window.scrollY > (stickyOffset - navbarHeight));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [stickyOffset]);

  const currentData = useMemo(() => 
    groupedData.find(s => s.subjectName === selectedSubject), 
  [groupedData, selectedSubject]);

  const filteredNotes = useMemo(() => {
    if (!currentData) return [];
    if (!searchQuery.trim()) return currentData.notes;
    return currentData.notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentData, searchQuery]);

  const renderNoteCard = (note: any) => {
    const dCount = downloadCounts[note.id] || note.download_count || 0;
    const displayDownloads = dCount >= 1000 ? `${(dCount / 1000).toFixed(1)}k` : dCount;

    return (
      <article 
        key={note.id} 
        className="bg-white rounded-lg p-5 flex flex-col justify-between h-full border border-black/[0.08] hover:border-black/20 transition-all shadow-sm"
        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            {/* Updated Custom Logo Icon Area */}
            <div className="shrink-0">
              <img 
                src="https://i.ibb.co/mr3z2pF7/image.png" 
                alt="Notes logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            {/* Download Count */}
            <div className="flex items-center text-gray-400 text-[11px] font-medium">
              <Download className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
              <span>{displayDownloads}</span>
            </div>
          </div>
          
          <h3 className="font-bold text-gray-900 mb-2 text-sm leading-tight line-clamp-2">
            {note.title}
          </h3>
          <p className="text-xs text-gray-500 mb-6 line-clamp-2">
            {note.description || `Comprehensive study material for ${note.title}.`}
          </p>
        </div>

        <div className="flex space-x-3 mt-auto font-sans">
          <button 
            className="flex-1 border-[1.5px] border-[#1E3A8A] text-[#1E3A8A] h-[38px] text-[11px] font-bold uppercase rounded-md hover:bg-blue-50 transition-colors"
            onClick={() => requireAuth(() => note.file_link && window.open(note.file_link, '_blank'))}
          >
            View
          </button>
          <button 
            className="flex-1 bg-[#1E3A8A] text-white h-[38px] text-[11px] font-bold uppercase rounded-md hover:opacity-90 transition-opacity shadow-sm"
            onClick={() => requireAuth(() => handleDownload(note.id, 'notes', note.file_link))}
          >
            Get PDF
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <NavBar />

      <main className="pt-16">
        {/* PAGE BANNER */}
        <HeroCarousel pagePath={location.pathname} fullWidth />

        {/* EXAM PREP HEADER */}
        <ExamPrepHeader 
          examName="IITM BS" 
          examPath="/exam-preparation/iitm-bs" 
          currentTab="notes"
          pageTitle={selectedSubject ? `${selectedSubject} Resources` : undefined}
        />

        {/* FILTER AND SEARCH (STICKY) */}
        <div 
          ref={searchBarRef}
          className={`w-full bg-white border-b border-slate-200 transition-all z-[50] ${
            isSticky ? "fixed top-16 shadow-md" : "relative"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)} 
                className="h-10 px-2 text-slate-500 shrink-0 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="h-6 w-[1px] bg-slate-200 mx-1 shrink-0" />
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={`Search in ${selectedSubject || 'notes'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#1E3A8A] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {isSticky && <div className="h-16" />}

        {/* CONTENT (NOTES GRID) */}
        <section className="max-w-7xl mx-auto px-4 py-10 bg-white">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
            </div>
          ) : currentData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.length > 0 ? (
                filteredNotes.map(renderNoteCard)
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white border border-dashed rounded-xl">
                  <Search className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No materials match your search.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed rounded-xl">
              <p className="text-slate-500 font-medium">Subject content not found.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default IITMBSSubjectNotesPage;
