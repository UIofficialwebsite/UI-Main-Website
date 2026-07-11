import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Search, Youtube, PlayCircle, Loader2, ChevronRight, Play, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from '@/integrations/supabase/client';
import { useStudyMaterials } from "@/hooks/useStudyMaterials";
import VideoPlayer from "../VideoPlayer";
import { ShareButton } from "@/components/ShareButton";

const contentCategories = [
    'PYQs (Previous Year Questions)',
    'Short Notes and Mindmaps',
    'Free Lectures',
    'Free Question Bank',
    'UI ki Padhai',
];

// Google Drive/Docs "/view"/"/edit" links refuse to be embedded in an iframe;
// their "/preview" form is embeddable. Convert so the in-app viewer works.
const toEmbeddableUrl = (raw?: string | null): string => {
    if (!raw) return '';
    const url = raw.trim();
    let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = url.match(/drive\.google\.com\/(?:open|uc)\?[^]*?id=([^&]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    return url;
};

interface ContentItem {
  id: string | number;
  title: string;
  subject?: string;
  url?: string | null;
  category: string;
  year?: number | null;
  session?: string | null;
  shift?: string | null;
  week_number?: number | null;
  level?: string | null;
  source?: string; // source table, for building the shareable deep link
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

interface YouTubePlaylist {
  title: string;
  videos: YouTubeVideo[];
}

const PlaylistRow: React.FC<{ 
  playlist: YouTubePlaylist; 
  onVideoSelect: (video: ContentItem) => void;
  isActive?: boolean;
}> = ({ playlist, onVideoSelect, isActive }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollStep = 300; 
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollStep : scrollStep,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn(
      "bg-white border rounded-xl p-4 mb-6 w-full shadow-sm transition-all duration-300",
      isActive ? "border-blue-400 ring-1 ring-blue-100 bg-blue-50/10" : "border-slate-200"
    )}>
      <div className="flex items-center mb-4">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0",
          isActive ? "bg-blue-600" : "bg-slate-700"
        )}>
          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight m-0">
          {playlist.title} 
          {isActive && (
            <span className="ml-2 text-[10px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Active
            </span>
          )}
        </h2>
      </div>

      <div className="relative flex items-center group">
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-3 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700" />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-1 scroll-smooth w-full"
        >
          {playlist.videos.map((video) => (
            <div 
              key={video.id}
              className="min-w-[260px] max-w-[260px] bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer flex-shrink-0"
              onClick={() => onVideoSelect({ id: video.id, title: video.title, category: 'Free Lectures' })}
            >
              <div className="relative aspect-video bg-slate-100 flex items-center justify-center border-b-[2px] border-slate-400">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                  <div className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-[1px]">
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-slate-900 leading-snug mb-1 line-clamp-2 h-[40px]">
                  {video.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal truncate">{playlist.title}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute -right-3 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
};

const SOURCE_TO_CONTENT_TYPE: Record<string, 'note' | 'pyq' | 'iitm_note'> = {
    pyqs: 'pyq',
    notes: 'note',
    iitm_branch_notes: 'iitm_note',
    study_materials: 'note',
};

const ContentCard: React.FC<{ item: ContentItem; handleOpen: (item: ContentItem) => void; isIITM: boolean }> = ({ item, handleOpen, isIITM }) => {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.url) window.open(item.url, '_blank');
    };

    return (
        <Card className="group bg-white border-slate-200 rounded-lg p-4 flex gap-4 transition-all hover:shadow-md min-h-[160px] h-full cursor-default overflow-hidden">
            {/* Thumbnail: brand logo centered on a deep grey background */}
            <div className="w-[80px] sm:w-[95px] aspect-[2/3] bg-slate-400 rounded flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                <img src="/web-uploads/UI_logo.png" alt="" className="w-2/5 h-auto object-contain opacity-90" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <div className="mb-2">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{item.title}</h3>
                    {(item.year || item.session || item.shift) && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                            {item.year || ''} {item.session || ''} {item.shift || ''}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3 mt-auto">
                    <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">PDF</span>
                    <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-full">
                        {isIITM && item.week_number ? `Week ${item.week_number}` : (item.subject || 'Gen')}
                    </span>
                </div>
                <div className="flex gap-2 w-full mt-auto">
                    <Button variant="outline" onClick={() => handleOpen(item)} className="flex-1 h-8 text-xs font-normal text-slate-700 border-slate-200 hover:bg-slate-50 rounded-md">View</Button>
                    <ShareButton
                        url={`/dashboard/library?open=${item.id}&t=${item.source ?? ''}`}
                        title={item.title}
                        contentType={SOURCE_TO_CONTENT_TYPE[item.source ?? ''] ?? 'note'}
                        contentId={String(item.id)}
                        className="!h-8 !w-8 !px-0 border-slate-200 shrink-0"
                    />
                    <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 w-8 h-8 rounded-md flex items-center justify-center shrink-0">
                        <Download className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

interface LibrarySectionProps {
  profile: Tables<'profiles'> | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  persistedVideo: ContentItem | null;
  onVideoChange: (item: ContentItem | null) => void;
}

const LibrarySection: React.FC<LibrarySectionProps> = ({ profile, activeTab, onTabChange, persistedVideo, onVideoChange }) => {
  const navigate = useNavigate();
  const { materials: studyMaterials, loading: studyLoading } = useStudyMaterials();
  const [dbMaterials, setDbMaterials] = useState<ContentItem[]>([]);
  const [ytPlaylists, setYtPlaylists] = useState<YouTubePlaylist[]>([]);
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  const viewingItem = persistedVideo;
  const setViewingItem = (item: ContentItem | null) => onVideoChange(item);

  // Shared deep link: /dashboard/library?open=<id>&t=<table> opens that file.
  // Works regardless of the viewer's focus area (fetches the item directly).
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    const open = searchParams.get('open');
    const t = searchParams.get('t');
    const ALLOWED = ['pyqs', 'notes', 'iitm_branch_notes', 'study_materials'];
    if (!open || !t || !ALLOWED.includes(t) || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    (async () => {
      try {
        const { data } = await (supabase as any).from(t).select('*').eq('id', open).maybeSingle();
        if (data) {
          const url = data.file_link || data.content_url || data.file_url || null;
          setViewingItem({ id: data.id, title: data.title || 'Shared file', url, category: 'Shared', subject: data.subject });
        }
      } catch (e) {
        console.error('Failed to open shared file:', e);
      }
      // Tidy the URL (drop the deep-link params; the ?si click tracker already ran).
      const next = new URLSearchParams(searchParams);
      next.delete('open');
      next.delete('t');
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("none");
  const [selectedSubject, setSelectedSubject] = useState<string>("none");
  const [selectedWeekOrYear, setSelectedWeekOrYear] = useState<string>("none");
  const [isTabVisible, setIsTabVisible] = useState(true);

  const focusArea = (profile?.program_type as any) || 'General';
  const isIITM = focusArea === 'IITM_BS';

  const handleTabChange = (category: string) => {
    if (category === activeTab) return;
    setIsTabVisible(false);
    setTimeout(() => {
      onTabChange(category);
      setShowAll(false);
      setSelectedLevel("none");
      setSelectedSubject("none");
      setSelectedWeekOrYear("none");
      setSearchQuery("");
      setYtSearchQuery("");
      setTimeout(() => setIsTabVisible(true), 50);
    }, 150);
  };

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const { data: pyqData } = await supabase.from('pyqs').select('*').eq('exam_type', focusArea).eq('is_active', true);
        const { data: notesData } = await supabase.from('notes').select('*').eq('exam_type', focusArea).eq('is_active', true);
        const { data: iitmData } = isIITM ? await supabase.from('iitm_branch_notes').select('*').eq('is_active', true) : { data: [] };

        const combined: ContentItem[] = [
          ...(pyqData || []).map(p => ({
            id: p.id, title: p.title, subject: p.subject, url: p.file_link || p.content_url,
            category: 'PYQs (Previous Year Questions)', year: p.year, level: p.level || p.class_level,
            session: p.session, shift: p.shift, source: 'pyqs'
          })),
          ...(notesData || []).map(n => ({ id: n.id, title: n.title, subject: n.subject, url: n.file_link || n.content_url, category: 'Short Notes and Mindmaps', level: n.class_level, source: 'notes' })),
          ...(iitmData || []).map(i => ({ id: i.id, title: i.title, subject: i.subject, url: i.file_link, category: 'Short Notes and Mindmaps', week_number: i.week_number, level: i.level, source: 'iitm_branch_notes' }))
        ];
        setDbMaterials(combined);
      } catch (err) { console.error("Library sync error:", err); } finally { setLoading(false); }
    };
    fetchTables();
  }, [focusArea, isIITM]);

  useEffect(() => {
    if (activeTab === 'Free Lectures' && isIITM) {
      const fetchYT = async () => {
        setLoading(true);
        try {
          const { data } = await supabase.functions.invoke('get-youtube-playlist');
          if (data?.playlists) setYtPlaylists(data.playlists);
        } catch (err) { console.error("YT Fetch Error:", err); } finally { setLoading(false); }
      };
      fetchYT();
    }
  }, [activeTab, isIITM]);

  const allContent = useMemo(() => {
    const studyMapped = (studyMaterials || [])
        .filter(m => !m.exam_category || m.exam_category === focusArea || m.exam_category === 'General')
        .filter(m => m.material_type !== 'pyq')
        .map(m => {
            let cat = 'Other';
            const materialType = (m as any).material_type;
            const titleLower = m.title.toLowerCase();
            if (materialType === 'ui_ki_padhai' || titleLower.includes('ui ki padhai')) cat = 'UI ki Padhai';
            else if (materialType === 'note' || materialType === 'mindmap') cat = 'Short Notes and Mindmaps';
            else if (materialType === 'question_bank') cat = 'Free Question Bank';
            else if (titleLower.includes('lecture')) cat = 'Free Lectures';
            return { id: m.id, title: m.title, subject: m.subject || 'General', url: m.file_url, category: cat, level: m.level || m.class_level, year: m.year, week_number: m.week_number, source: 'study_materials' };
        });
    return [...dbMaterials, ...studyMapped];
  }, [dbMaterials, studyMaterials, focusArea]);

  const catFiltered = useMemo(() => allContent.filter(m => m.category === activeTab), [allContent, activeTab]);
  const searchFiltered = useMemo(() => searchQuery ? catFiltered.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())) : catFiltered, [catFiltered, searchQuery]);
  const levelFiltered = useMemo(() => selectedLevel === "none" ? searchFiltered : searchFiltered.filter(m => m.level === selectedLevel), [searchFiltered, selectedLevel]);
  const subjectFiltered = useMemo(() => selectedSubject === "none" ? levelFiltered : levelFiltered.filter(m => m.subject === selectedSubject), [levelFiltered, selectedSubject]);
  
  const finalContent = useMemo(() => {
      if (selectedWeekOrYear === "none") return subjectFiltered;
      const field = activeTab.includes('PYQs') ? 'year' : 'week_number';
      return subjectFiltered.filter(m => m[field as keyof ContentItem]?.toString() === selectedWeekOrYear);
  }, [subjectFiltered, selectedWeekOrYear, activeTab]);

  const displayedContent = showAll ? finalContent : finalContent.slice(0, 6);
  const levelsAvailable = useMemo(() => Array.from(new Set(catFiltered.map(m => m.level))).filter(Boolean), [catFiltered]);
  const subjectsAvailable = useMemo(() => Array.from(new Set(levelFiltered.map(m => m.subject))).filter(Boolean), [levelFiltered]);
  const specificsAvailable = useMemo(() => {
      const field = activeTab.includes('PYQs') ? 'year' : 'week_number';
      return Array.from(new Set(subjectFiltered.map(m => m[field as keyof ContentItem]))).filter(Boolean).map(String);
  }, [subjectFiltered, activeTab]);

  const sortedAndFilteredPlaylists = useMemo(() => {
    let list = [...ytPlaylists];
    
    if (viewingItem && viewingItem.category === 'Free Lectures') {
        const activePlaylistIndex = list.findIndex(pl => 
            pl.videos.some(v => String(v.id) === String(viewingItem.id))
        );
        
        if (activePlaylistIndex !== -1) {
            const activePlaylist = list[activePlaylistIndex];
            list.splice(activePlaylistIndex, 1);
            list.unshift(activePlaylist);
        }
    }

    if (!ytSearchQuery) return list;
    
    return list.map(playlist => ({
      ...playlist,
      videos: playlist.videos.filter(v => v.title.toLowerCase().includes(ytSearchQuery.toLowerCase()))
    })).filter(playlist => playlist.videos.length > 0);
  }, [ytPlaylists, ytSearchQuery, viewingItem]);

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
      <div className="bg-white border-b flex-none z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-5 mb-4">
              <div className="flex items-center gap-4">
                   <Button variant="ghost" size="icon" className="-ml-2 h-10 w-10 rounded-full" onClick={() => viewingItem ? setViewingItem(null) : navigate(-1)}>
                      <ArrowLeft className="h-6 w-6" />
                   </Button>
                   <h1 className="text-xl font-semibold tracking-tight line-clamp-1">{viewingItem ? viewingItem.title : 'Library'}</h1>
              </div>
          </div>
          {!viewingItem && (
              <div className="px-4 md:px-8 overflow-x-auto scrollbar-hide">
                   <div className="flex space-x-6">
                        {contentCategories.map((category) => (
                          <button 
                            key={category} 
                            onClick={() => handleTabChange(category)} 
                            className={cn("pb-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 px-1", activeTab === category ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}
                          >
                            {category}
                          </button>
                        ))}
                   </div>
              </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-8 py-8 w-full scrollbar-hide">
        {viewingItem && (
            <div className="w-full mb-10 transition-opacity duration-200" style={{ opacity: isTabVisible ? 1 : 0 }}>
                {viewingItem.category === 'Free Lectures' ? (
                   <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border bg-black">
                     <VideoPlayer videoId={String(viewingItem.id)} title={viewingItem.title} onClose={() => setViewingItem(null)} />
                   </div>
                ) : (
                   <div className="w-full bg-slate-50 rounded-lg border h-[80vh] overflow-hidden shadow-sm">
                        <iframe src={toEmbeddableUrl(viewingItem.url)} className="w-full h-full border-0" title="Viewer" allow="autoplay" />
                   </div>
                )}
            </div>
        )}

        <div className={cn("space-y-8 transition-all duration-200 ease-out", isTabVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
            {activeTab === 'Free Lectures' && isIITM ? (
                <div className="space-y-10 mb-20">
                    <div className="relative max-w-md mx-auto mb-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input placeholder="Search lectures..." value={ytSearchQuery} onChange={(e) => setYtSearchQuery(e.target.value)} className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
                    ) : sortedAndFilteredPlaylists.map((playlist, idx) => {
                        const isCurrentActive = viewingItem && playlist.videos.some(v => String(v.id) === String(viewingItem.id));
                        return (
                          <PlaylistRow 
                            key={idx} 
                            playlist={playlist} 
                            onVideoSelect={setViewingItem} 
                            isActive={isCurrentActive} 
                          />
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 sm:p-6 md:p-8 mb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                          <img 
                            src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769162220/4706330_ptdftj.png" 
                            alt="File Icon" 
                            className="h-5 w-5 object-contain shrink-0"
                          />
                          <span className="truncate">{activeTab}</span>
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-white border-slate-200 text-sm" />
                            </div>
                            {catFiltered.length > 6 && (
                                <button className="text-sm font-medium text-blue-600 hover:underline shrink-0" onClick={() => setShowAll(!showAll)}>{showAll ? 'Less' : 'All →'}</button>
                            )}
                        </div>
                    </div>

                    {showAll && (
                        <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in">
                            {levelsAvailable.length > 0 && (
                                <Select value={selectedLevel} onValueChange={(val) => { setSelectedLevel(val); setSelectedSubject("none"); setSelectedWeekOrYear("none"); }}>
                                    <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white border-slate-200 text-sm">
                                        <SelectValue placeholder="Academic Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">All Levels</SelectItem>
                                        {levelsAvailable.map(l => <SelectItem key={l} value={l!}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedLevel !== "none" && subjectsAvailable.length > 0 && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <ChevronRight className="h-4 w-4 text-slate-400 hidden sm:block" />
                                    <Select value={selectedSubject} onValueChange={(val) => { setSelectedSubject(val); setSelectedWeekOrYear("none"); }}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white border-slate-200 text-sm">
                                            <SelectValue placeholder="Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">All Subjects</SelectItem>
                                            {subjectsAvailable.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {selectedSubject !== "none" && specificsAvailable.length > 0 && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <ChevronRight className="h-4 w-4 text-slate-400 hidden sm:block" />
                                    <Select value={selectedWeekOrYear} onValueChange={setSelectedWeekOrYear}>
                                        <SelectTrigger className="w-full sm:w-[140px] h-9 bg-white border-slate-200 text-sm">
                                            <SelectValue placeholder={activeTab.includes('PYQs') ? "Year" : "Week"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{activeTab.includes('PYQs') ? "All Years" : "All Weeks"}</SelectItem>
                                            {specificsAvailable.map(v => <SelectItem key={v} value={v!}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {(loading || studyLoading) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="h-[180px] bg-slate-100 rounded-lg border" />)}
                        </div>
                    ) : displayedContent.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                            {displayedContent.map((item) => <ContentCard key={item.id} item={item} handleOpen={setViewingItem} isIITM={isIITM} />)}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400">No resources available.</div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LibrarySection;
