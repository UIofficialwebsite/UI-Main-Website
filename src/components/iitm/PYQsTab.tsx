import React from "react";
import { Download } from "lucide-react";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";

interface PYQsTabProps {
  branch: string;
  level: string;
  years: string[];
  examTypes: string[];
  subjects: string[];
}

const PYQsTab = ({ branch, level, years, examTypes, subjects }: PYQsTabProps) => {
  const { handleDownload, downloadCounts, pyqs, contentLoading } = useBackend();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  
  const branchSlug = branch.toLowerCase().replace(/\s+/g, '-');
  const levelSlug = level.toLowerCase();
  
  const filteredPYQs = pyqs.filter(pyq => {
    // Ensure we are only looking at IITM BS papers
    if (pyq.exam_type !== 'IITM_BS') return false;

    const matchesProgram = pyq.branch === branchSlug && pyq.level === levelSlug;
    
    // Multi-Select Logic
    const matchesYear = years.length === 0 || (pyq.year && years.includes(pyq.year.toString()));
    
    // Check 'session' (Quiz 1, End Term) instead of 'exam_type'
    const matchesType = examTypes.length === 0 || (pyq.session && examTypes.includes(pyq.session));
    
    const matchesSubject = subjects.length === 0 || (pyq.subject && subjects.includes(pyq.subject));
    
    return matchesProgram && matchesYear && matchesType && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentLoading ? (
          <div className="col-span-3 flex justify-center py-20 animate-pulse text-slate-400 font-bold">LOADING PAPERS...</div>
        ) : filteredPYQs.length > 0 ? (
          filteredPYQs.map((pyq) => {
            const dCount = downloadCounts[pyq.id] || pyq.download_count || 0;
            const displayDownloads = dCount >= 1000 ? `${(dCount / 1000).toFixed(1)}k` : dCount;

            return (
              <article 
                key={pyq.id} 
                className="bg-white rounded-lg p-5 flex flex-col justify-between h-full border border-black/[0.08] hover:border-black/20 transition-all shadow-sm group"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {/* Custom Logo Icon Area */}
                    <div className="shrink-0">
                      <img 
                        src="https://i.ibb.co/XkVT3SgT/image.png" 
                        alt="PYQ logo" 
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
                    {pyq.title}
                  </h3>

                  {/* Tags Block */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {pyq.session && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-gray-200 uppercase tracking-wide">
                            {pyq.session}
                        </span>
                    )}
                    {pyq.year && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-gray-200">
                            {pyq.year}
                        </span>
                    )}
                     {pyq.subject && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-gray-200 uppercase">
                            {pyq.subject}
                        </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-6 line-clamp-2">
                    {pyq.description || `Assessment paper for ${pyq.subject}.`}
                  </p>
                </div>

                <div className="mt-auto font-sans">
                  {user ? (
                    <div className="flex space-x-3">
                      <button 
                        className="flex-1 border-[1.5px] border-[#1E3A8A] text-[#1E3A8A] h-[38px] text-[11px] font-bold uppercase rounded-md hover:bg-blue-50 transition-colors"
                        onClick={() => pyq.file_link && window.open(pyq.file_link, '_blank')}
                        disabled={!pyq.file_link}
                      >
                        View
                      </button>
                      <button 
                        className="flex-1 bg-[#1E3A8A] text-white h-[38px] text-[11px] font-bold uppercase rounded-md hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                        onClick={() => handleDownload(pyq.id, 'pyqs', pyq.file_link || undefined)}
                        disabled={!pyq.file_link}
                      >
                         Download
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="w-full bg-[#1E3A8A] text-white h-[38px] text-[11px] font-normal font-['Inter'] uppercase rounded-md hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                      onClick={() => {
                        // Increment count to track intent, but don't open file
                        handleDownload(pyq.id, 'pyqs'); 
                        openLogin();
                      }}
                    >
                       Login to Download
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">No papers found. Try adjusting filters.</div>
        )}
      </div>
    </div>
  );
};

export default PYQsTab;
