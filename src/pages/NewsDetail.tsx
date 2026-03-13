import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Loader2, Printer } from "lucide-react";
import { usePageSEO, getNewsTitleSEO } from "@/utils/seoManager";

const NewsDetail = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { newsUpdates, contentLoading } = useBackend();

  const newsItem = useMemo(() => 
    newsUpdates.find(item => item.id === newsId),
    [newsUpdates, newsId]
  );

  // Dynamic page title and canonical based on news data
  usePageSEO(newsItem ? getNewsTitleSEO(newsItem.title) : "News & Updates", newsId ? `/news/${newsId}` : undefined);

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Inter']">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-['Inter']">
        <h1 className="text-2xl font-bold mb-4">Announcement Not Found</h1>
        <button 
          onClick={() => navigate(-1)}
          className="bg-black text-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.05em]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-[#1a1a1a]">
      {/* Hide Navbar on Print */}
      <div className="print:hidden">
        <NavBar />
      </div>
      
      {/* Main Container */}
      <main className="w-full max-w-[1200px] mx-auto pt-[100px] pb-[60px] px-6 lg:px-10 print:p-0 print:max-w-none print:mx-0 print:pt-0">
        
        {/* --- PRINT ONLY HEADER (Logo Only) --- */}
        <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b border-black">
          <div className="flex items-center">
            <img 
              src="/web-uploads/logo_ui_new.png" 
              alt="IITM Logo" 
              className="h-24 w-auto object-contain" 
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              Generated Report
            </p>
            <p className="text-xs font-bold text-black mt-1">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="w-full">
          
          {/* Breadcrumb - Hide on Print */}
          <nav className="flex gap-2 mb-8 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#888] print:hidden">
            <Link to="/exam-preparation/iitm-bs" className="text-black no-underline hover:underline">
              Announcements
            </Link>
            <span>/</span>
            <span className="text-[#666]">{newsItem.tag || "General"}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-[32px] md:text-[42px] font-[800] leading-[1.1] text-black mb-6 tracking-[-0.02em]">
              {newsItem.title}
              {newsItem.is_important && (
                <span className="inline-block align-middle ml-3 text-[11px] font-bold px-3 py-1 border border-[#991b1b] bg-[#fee2e2] text-[#991b1b] uppercase tracking-wide print:hidden">
                  Urgent
                </span>
              )}
            </h1>
          </header>

          {/* Meta Data Strip - Blue Part (Preserved in Print) */}
          <div className="flex flex-wrap border-y border-black mb-10 bg-[#e6f7f7] print:bg-[#e6f7f7] [print-color-adjust:exact] print:border-black print:mb-8">
            
            {/* Publication Date */}
            <div className="flex-1 py-4 px-6 min-w-[200px] border-r border-black/10 print:border-black/20">
              <span className="block text-[11px] uppercase font-bold text-[#2c4a4a] tracking-[0.05em] mb-1">
                Date
              </span>
              <span className="block text-[14px] font-medium text-black">
                {new Date(newsItem.date_time || newsItem.created_at).toLocaleDateString("en-US", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {/* Document Level */}
            <div className="flex-1 py-4 px-6 min-w-[200px]">
              <span className="block text-[11px] uppercase font-bold text-[#2c4a4a] tracking-[0.05em] mb-1">
                Level / Branch
              </span>
              <span className="block text-[14px] font-medium text-black">
                {[newsItem.level, newsItem.branch].filter(Boolean).join(" & ") || "General"}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <article className="max-w-none text-[16px] leading-[1.8] text-[#334155] print:text-black print:text-[12pt] mb-12 print:leading-[1.6]">
            <div className="whitespace-pre-wrap font-['Inter'] text-justify">
              {newsItem.content || newsItem.description}
            </div>
          </article>

          {/* Footer Actions - Hide on Print */}
          <div className="print:hidden mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-white text-black border border-black px-6 py-3 text-[12px] font-bold uppercase tracking-[0.05em] hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Circular
              </button>
              
              {newsItem.button_url && newsItem.button_text && (
                <a 
                  href={newsItem.button_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-black text-white px-8 py-3 text-[12px] font-bold uppercase tracking-[0.05em] hover:bg-[#333] transition-colors inline-flex items-center gap-2"
                >
                  {newsItem.button_text} ↗
                </a>
              )}
            </div>
          </div>

          {/* Print Only Footer - Professional & Minimal */}
          <div className="hidden print:block mt-auto pt-8 border-t border-black w-full">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  IITM Pathways Unlocked
                </p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] text-gray-400">Page 1 of 1</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default NewsDetail;
