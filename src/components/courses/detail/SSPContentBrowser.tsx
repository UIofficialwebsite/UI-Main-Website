import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoginModal } from '@/context/LoginModalContext';
import { useCourseCatalog, unlockItem, type CatalogItem } from '@/hooks/useCourseCatalog';
import SecureVideoPlayer from '@/components/courses/detail/SecureVideoPlayer';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Atom, BookOpen, Calculator, Code, Dna, GraduationCap, Loader2, Lock,
  Megaphone, Microscope, Music, Globe, Palette, TestTube,
} from 'lucide-react';

/**
 * A walk-through of the Student Service Portal, rendered inside the course
 * page so someone deciding whether to buy can see exactly how the portal is
 * laid out and what is in this batch.
 *
 * It mirrors the portal's own three screens, using the same structure and the
 * same visual tokens as src/components/student/StudentSubjectCard.tsx and
 * StudentSubjectBlocks.tsx in the ERP repo:
 *
 *   1. Subjects            — "Select your subjects & start learning"
 *   2. Subject hub         — the eight blocks, with real counts
 *   3. A block's contents  — the actual lecture / note / DPP titles
 *
 * Every number and title is live from the portal. The blocks that only make
 * sense for an enrolled student (live class, community, connect, announcements)
 * are shown so the layout is honest, but they prompt to enrol rather than
 * pretending to work.
 */

type Kind = 'video' | 'note' | 'dpp' | 'uikp';

/** Same mapping the portal uses to pick a subject icon, in lucide. */
function subjectIcon(subject: string) {
  const n = subject.toLowerCase();
  if (n.includes('math')) return Calculator;
  if (n.includes('physics')) return Atom;
  if (n.includes('chemistry')) return TestTube;
  if (n.includes('biology') || n.includes('botany') || n.includes('zoology')) return Dna;
  if (n.includes('statistic') || n.includes('science')) return Microscope;
  if (n.includes('history') || n.includes('geography')) return Globe;
  if (n.includes('english') || n.includes('hindi')) return BookOpen;
  if (n.includes('music')) return Music;
  if (n.includes('art')) return Palette;
  if (n.includes('python') || n.includes('computer') || n.includes('code') || n.includes('programming')) return Code;
  if (n.includes('notice') || n.includes('announce')) return Megaphone;
  return GraduationCap;
}

interface Props {
  courseId: string;
  courseTitle: string;
  onBuyClick?: () => void;
}

const SSPContentBrowser: React.FC<Props> = ({ courseId, courseTitle, onBuyClick }) => {
  const { data, isLoading } = useCourseCatalog(courseId);
  const { openLogin } = useLoginModal();
  const { toast } = useToast();

  const [subject, setSubject] = useState<string | null>(null);
  const [block, setBlock] = useState<{ kind: Kind; label: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; videoId?: string; url?: string } | null>(null);
  const [paywall, setPaywall] = useState<{ what: string } | null>(null);

  const current = useMemo(
    () => data?.subjects.find((s) => s.subject === subject) ?? null,
    [data, subject],
  );

  const items = useMemo(
    () => (block && current ? current.items.filter((i) => i.type === block.kind) : []),
    [block, current],
  );

  const handleOpen = async (item: CatalogItem) => {
    setPendingId(item.id);
    try {
      const result = await unlockItem(item.id);

      if (result.allowed && (result.video_id || result.url)) {
        if (result.type === 'video') {
          setViewer({ title: result.title ?? item.title, videoId: result.video_id, url: result.url });
        } else if (result.url) {
          window.open(result.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      if (result.reason === 'login_required') { openLogin(); return; }
      if (result.reason === 'not_purchased') { setPaywall({ what: subject ?? courseTitle }); return; }

      toast({ title: 'Could not open this', description: 'Please try again in a moment.', variant: 'destructive' });
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3 border-t border-black/5 pt-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  if (!data?.preview_enabled || !data.subjects.length) return null;

  /*
   * Shared by all three levels. Both dialogs set their own padding and radius
   * on purpose: the shared DialogContent is p-0, gap-4 and sm:rounded-[32px],
   * so anything assuming default padding sits flush against the edge and any
   * child with a smaller radius shows square corners through the rounded frame.
   */
  const dialogs = (
    <>
      <Dialog open={!!viewer} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-[24px]">
          <DialogHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="pr-10 text-left text-[14px] font-semibold leading-snug sm:text-[15px]">
              {viewer?.title}
            </DialogTitle>
          </DialogHeader>
          {viewer && (
            <SecureVideoPlayer videoId={viewer.videoId} url={viewer.url} title={viewer.title} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paywall} onOpenChange={(open) => !open && setPaywall(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[420px] gap-0 p-6 sm:rounded-[24px]">
          <DialogHeader className="space-y-0">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/5">
              <Lock className="h-5 w-5 text-black/70" />
            </div>
            <DialogTitle className="pr-10 text-left text-[17px] font-semibold tracking-tight">
              Enrol to unlock this
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-[13px] leading-relaxed text-black/60">
            <span className="font-medium text-black/80">{paywall?.what}</span> is part of{' '}
            <span className="font-medium text-black/80">{courseTitle}</span>. Enrol to open the full
            Student Service Portal for this batch.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1 rounded-lg" onClick={() => { setPaywall(null); onBuyClick?.(); }}>
              See enrolment options
            </Button>
            <Button variant="outline" className="rounded-lg" onClick={() => setPaywall(null)}>
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );


  /* ---------------------------------------------------------------- level 3 */
  if (subject && block && current) {
    return (
      <div className="mt-6 border-t border-black/5 pt-6 md:mt-8 md:pt-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setBlock(null)} aria-label="Back" className="shrink-0 text-[#1e293b] transition-opacity hover:opacity-70">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <h3 className="text-xl font-bold leading-tight tracking-tight text-[#1e293b] md:text-2xl">
            {block.label}
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#71717a]">Nothing here yet for {subject}.</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {items.map((item) => {
              const busy = pendingId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleOpen(item)}
                    className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-[#1e293b]">{item.title}</span>
                      {item.date && <span className="block text-[12px] text-[#71717a]">{item.date}</span>}
                    </span>
                    {busy ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : item.free ? (
                      <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Free
                      </span>
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {dialogs}
      </div>
    );
  }

  /* ---------------------------------------------------------------- level 2 */
  if (subject && current) {
    const c = current.counts;
    const blocks: {
      id: string; label: string; stats: string[]; kind?: Kind; live?: boolean;
    }[] = [
      { id: 'live',    label: 'Join Live Class', stats: ['Ongoing Classes', 'Upcoming Schedule'], live: true },
      { id: 'lect',    label: 'Lectures',        stats: [`${c.video} Videos`, 'Past Classes'], kind: 'video' },
      { id: 'notes',   label: 'Notes & PDFs',    stats: [`${c.note} Notes`, 'Assignments'],    kind: 'note' },
      { id: 'dpps',    label: 'DPPs',            stats: [`${c.dpp} DPPs`, 'Daily Practice'],   kind: 'dpp' },
      { id: 'uikp',    label: 'UI Ki Padhai',    stats: [`${c.uikp ?? 0} Premium Content`, 'Exclusive Series'], kind: 'uikp' },
      { id: 'announce',label: 'Announcements',   stats: ['Latest Updates', 'Batch News'] },
      { id: 'comm',    label: 'Community',       stats: ['Discussions', 'Peer Support'] },
      { id: 'connect', label: 'Connect',         stats: ['Chat with Teachers', 'Mentorship'] },
    ];

    return (
      <div className="mt-6 border-t border-black/5 pt-6 md:mt-8 md:pt-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setSubject(null)} aria-label="Back" className="shrink-0 text-[#1e293b] transition-opacity hover:opacity-70">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <h3 className="text-xl font-bold leading-tight tracking-tight text-[#1e293b] md:text-2xl">
            {subject}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {blocks.map((b) => {
            const openable = !!b.kind;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  openable ? setBlock({ kind: b.kind!, label: b.label }) : setPaywall({ what: b.label })
                }
                className={cn(
                  'group relative flex w-full items-stretch gap-4 rounded-[4px] border border-slate-200 bg-white p-6 text-left',
                  'transition-colors hover:bg-slate-50/60',
                )}
              >
                <div className={cn('w-1 shrink-0 rounded-full', openable ? 'bg-[#3b82f6]' : 'bg-slate-300')} />
                <div className="flex flex-1 flex-col justify-center">
                  <h4 className="mb-2 text-[17px] font-semibold text-[#1e293b]">{b.label}</h4>
                  <div className="flex items-center text-[13px] font-normal text-[#71717a]">
                    {b.stats.map((stat, i) => (
                      <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-3 text-[#d4d4d8]">|</span>}
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
                {b.live && (
                  <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
                {!openable && <Lock className="absolute right-4 top-4 h-3.5 w-3.5 text-slate-300" />}
              </button>
            );
          })}
        </div>
        {dialogs}
      </div>
    );
  }

  /* ---------------------------------------------------------------- level 1 */
  return (
    <div className="mt-6 border-t border-black/5 pt-6 md:mt-8 md:pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[#1e293b] md:text-2xl">Subjects</h3>
          <p className="mt-1 text-[13px] text-[#71717a]">Select your subjects &amp; start learning</p>
        </div>
        {data.totals.free > 0 && (
          <span className="text-[12px] font-medium text-emerald-700">
            {data.totals.free} items free to preview
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {data.subjects.map((s) => {
          const Icon = subjectIcon(s.subject);
          return (
            <button
              key={s.subject}
              type="button"
              onClick={() => { setSubject(s.subject); setBlock(null); }}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl border-[1.5px] border-[#f3f4f6] bg-white p-4 text-left sm:gap-5 sm:p-6',
                'shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 ease-in-out',
                'hover:-translate-y-[1px] hover:border-black hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
              )}
            >
              <span className="shrink-0 text-[#3b82f6]">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[15px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[18px]">
                  {s.subject}
                </span>
                <span className="mt-1 block text-[12px] text-[#71717a]">
                  {s.counts.video} lectures · {s.counts.note} notes
                  {s.counts.free > 0 && <span className="text-emerald-700"> · {s.counts.free} free</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {dialogs}
    </div>
  );
};

export default SSPContentBrowser;
