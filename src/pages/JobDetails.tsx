import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import { 
  Loader2,
  MapPin,
  Clock,
  Briefcase
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePageSEO, getJobTitleSEO } from "@/utils/seoManager";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://unknowniitians.com";

const JobDetails = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, contentLoading, loadJobs } = useBackend();
  useEffect(() => { loadJobs(); }, [loadJobs]);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState("");

  // Find the specific job from the backend list
  const rawJob = jobs.find(j => j.id === jobId);

  // Normalize data structures
  const job = rawJob ? {
    ...rawJob,
    requirements: Array.isArray(rawJob.requirements) 
      ? rawJob.requirements 
      : typeof rawJob.requirements === 'string' 
        ? [rawJob.requirements] 
        : [],
    skills: Array.isArray(rawJob.skills) 
      ? rawJob.skills 
      : typeof rawJob.skills === 'string' 
        ? [rawJob.skills] 
        : []
  } : null;

  // Dynamic page title and canonical based on job data
  usePageSEO(job ? getJobTitleSEO(job.title) : "Job Details", jobId ? `/career/job/${jobId}` : undefined);

  // Inject Manrope font dynamically and set URL
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    setCurrentUrl(window.location.href);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Mint a tracked link: the REAL job URL + ?si=<token> (records the share too).
  const buildTrackedLink = (channel: string): string => {
    const raw =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const token = raw.replace(/[^a-z0-9]/gi, "").slice(0, 16);
    const path = `/career/job/${job?.id ?? jobId}`;
    supabase
      .rpc("record_share", {
        p_token: token,
        p_content_type: "page",
        p_content_id: job?.id ?? jobId ?? "",
        p_title: job?.title ?? "Job",
        p_target_url: path,
        p_channel: channel,
      })
      .then(() => {}, () => {});
    return `${SITE}${path}?si=${token}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(buildTrackedLink("copy"));
    toast({ title: "Link Copied", description: "Job link copied to clipboard!", duration: 3000 });
  };

  const openSocialShare = (e: React.MouseEvent, channel: string) => {
    e.preventDefault();
    const link = encodeURIComponent(buildTrackedLink(channel));
    const text = encodeURIComponent(`Check out this ${job?.title ?? "job"} opportunity!`);
    const map: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      email: `mailto:?subject=${text}&body=${link}`,
      whatsapp: `https://wa.me/?text=${text}%20${link}`,
    };
    if (channel === "email") window.location.href = map.email;
    else window.open(map[channel], "_blank");
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-['Manrope']">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-['Manrope']">
        <h2 className="text-2xl font-bold text-[#0f172a] mb-4">Job not found</h2>
        <button 
          onClick={() => navigate('/career/openings')}
          className="bg-[#2563eb] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1d4ed8] transition-colors"
        >
          Back to Openings
        </button>
      </div>
    );
  }

  // Format Date
  const updatedDate = job.updated_at || job.created_at 
    ? new Date(job.updated_at || job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const jobReference = `GB-${job.id.slice(0, 4).toUpperCase()}`;

  return (
    <div className="bg-[#f8fafc] min-h-screen font-['Manrope'] text-[#475569] leading-[1.6]">
      <NavBar />

      {/* HERO HEADER */}
      <header className="relative pt-[100px] pb-[140px] border-b border-[#e2e8f0] bg-white">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000')" }}
        ></div>
        <div 
          className="absolute inset-0 z-0"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.98) 10%, rgba(255,255,255,0.6) 100%)" }}
        ></div>

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <nav className="text-[13px] font-[600] text-[#2563eb] mb-6 tracking-[0.01em]">
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/career/openings')}>Open Jobs</span>
            <span className="text-[#94a3b8] mx-2 font-[400]">/</span>
            <span>{job.job_type || 'General'}</span>
            <span className="text-[#94a3b8] mx-2 font-[400]">/</span>
            <span className="text-[#64748b]">{job.title}</span>
          </nav>

          <h1 className="text-[34px] font-[800] text-[#0f172a] mb-3 tracking-[-0.02em] leading-tight">
            {job.title}
          </h1>
          
          <div className="flex flex-wrap gap-6 mb-7 font-[600] text-[14px] text-[#475569]">
            <div className="flex items-center gap-2">
              <MapPin className="w-[18px] h-[18px]" strokeWidth={2} />
              {job.location}
            </div>
            {job.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-[18px] h-[18px]" strokeWidth={2} />
                {job.duration}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="w-[18px] h-[18px]" strokeWidth={2} />
              {job.job_type}
            </div>
          </div>

          <div className="flex gap-3">
            <a 
              href={job.application_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-7 py-3 rounded-lg font-[700] transition-all shadow-[0_4px_6px_-1px_rgba(37,99,235,0.2)] hover:-translate-y-px inline-block text-center no-underline"
            >
              Apply Now
            </a>
            
            {/* Header Share Icon (Functional Copy Link) */}
            <button 
              onClick={handleCopyLink}
              className="bg-white border border-[#e2e8f0] px-3.5 py-2.5 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] transition-all text-[#475569]"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT LAYOUT */}
      <main className="max-w-[1140px] mx-auto px-6 relative z-10 -mt-[80px] pb-[100px] grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        
        {/* Main Job Info Card */}
        <section className="bg-white border border-[#e2e8f0] rounded-xl p-8 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04)]">
          <h2 className="text-[18px] font-[700] text-[#0f172a] mb-6">Job Description</h2>
          
          <div className="text-[16px] text-[#475569] leading-[1.8] space-y-6">
            <p className="whitespace-pre-line">
              {job.description}
            </p>

            {job.requirements && job.requirements.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[16px] font-[700] text-[#0f172a] mb-3">Requirements</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {job.requirements.map((req: any, i: number) => (
                    <li key={i}>{typeof req === 'string' ? req : JSON.stringify(req)}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[16px] font-[700] text-[#0f172a] mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: any, i: number) => (
                    <span key={i} className="bg-[#f1f5f9] text-[#475569] px-3 py-1 rounded-md text-sm font-medium">
                      {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Details */}
        <aside>
          {/* Job Snapshot Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04)] mb-6">
            <h2 className="text-[16px] font-[700] text-[#0f172a] mb-5">Job Snapshot</h2>
            
            <div className="mb-6">
              <p className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-[0.05em] mb-1">Updated Date</p>
              <p className="text-[15px] font-[600] text-[#0f172a]">{updatedDate}</p>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-[0.05em] mb-1">Job Reference</p>
              <p className="text-[15px] font-[600] text-[#0f172a] font-mono">{jobReference}</p>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-[0.05em] mb-1">Stipend / Salary</p>
              <p className="text-[15px] font-[600] text-[#0f172a]">{job.stipend || 'Competitive'}</p>
            </div>

            <div>
              <p className="text-[11px] font-[700] text-[#94a3b8] uppercase tracking-[0.05em] mb-1">Employee Type</p>
              <p className="text-[15px] font-[600] text-[#0f172a]">
                {job.job_type === 'Remote' ? 'Remote' : 'FTE (Full-time)'}
              </p>
            </div>
          </div>

          {/* SHARE THIS OPPORTUNITY CARD */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] w-full">
            <h2 className="text-[16px] font-[700] text-[#0f172a] mb-5">Share the opportunity</h2>
            
            <div className="flex gap-3 flex-wrap">
              {/* LinkedIn */}
              <a
                href="#"
                onClick={(e) => openSocialShare(e, 'linkedin')}
                title="Share on LinkedIn"
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#0a66c2] hover:text-white hover:-translate-y-[2px]"
              >
                <span className="text-[14px] font-[800] leading-none">in</span>
              </a>

              {/* X (Twitter) */}
              <a
                href="#"
                onClick={(e) => openSocialShare(e, 'x')}
                title="Share on X"
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#000000] hover:text-white hover:-translate-y-[2px]"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="#"
                onClick={(e) => openSocialShare(e, 'facebook')}
                title="Share on Facebook"
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1877f2] hover:text-white hover:-translate-y-[2px]"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                </svg>
              </a>

              {/* Email */}
              <a
                href="#"
                onClick={(e) => openSocialShare(e, 'email')}
                title="Share via Email"
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#ea4335] hover:text-white hover:-translate-y-[2px]"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="#"
                onClick={(e) => openSocialShare(e, 'whatsapp')}
                title="Share on WhatsApp"
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#25d366] hover:text-white hover:-translate-y-[2px]"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>

              {/* Copy Link */}
              <button 
                title="Copy Link"
                onClick={handleCopyLink}
                className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#334155] hover:text-white hover:-translate-y-[2px]"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </button>
            </div>
          </div>
        </aside>

      </main>
      
      <Footer />
    </div>
  );
};

// Helper Components
const Share2Icon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default JobDetails;
