import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoginModal } from '@/context/LoginModalContext';
import { useCourseCatalog, unlockItem, type CatalogItem, type CatalogSubject } from '@/hooks/useCourseCatalog';
import { cn } from '@/lib/utils';
import { ChevronDown, FileText, Lock, Notebook, PlayCircle, Loader2 } from 'lucide-react';

/**
 * The live contents of the batch, segregated the same way the Student Service
 * Portal itself is: lectures, study material and practice are separate, and
 * each is broken down by subject.
 *
 * This renders INSIDE the Student Service Portal card — it is not its own
 * section and carries no heading or panel of its own.
 *
 * Titles are visible to everyone. Nothing here holds a link: opening an item
 * asks the server, which decides based on what the viewer has paid for.
 */

type Kind = 'video' | 'note' | 'dpp';

const KINDS: { key: Kind; label: string; icon: typeof PlayCircle }[] = [
  { key: 'video', label: 'Lectures',  icon: PlayCircle },
  { key: 'note',  label: 'Notes',     icon: Notebook },
  { key: 'dpp',   label: 'Practice',  icon: FileText },
];

interface Props {
  courseId: string;
  courseTitle: string;
  onBuyClick?: () => void;
}

const SSPContentBrowser: React.FC<Props> = ({ courseId, courseTitle, onBuyClick }) => {
  const { data, isLoading } = useCourseCatalog(courseId);
  const { openLogin } = useLoginModal();
  const { toast } = useToast();

  const [kind, setKind] = useState<Kind>('video');
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; url: string } | null>(null);
  const [paywall, setPaywall] = useState<{ subject: string } | null>(null);

  /** Only offer a tab for a kind the batch actually has. */
  const available = useMemo(
    () => KINDS.filter((k) => (data?.totals?.[k.key] ?? 0) > 0),
    [data],
  );

  // Land on the first kind that has content rather than an empty Lectures tab.
  useEffect(() => {
    if (available.length && !available.some((k) => k.key === kind)) setKind(available[0].key);
  }, [available, kind]);

  /** Subjects that have at least one item of the selected kind. */
  const subjects = useMemo(() => {
    const out: { subject: CatalogSubject; items: CatalogItem[]; free: number }[] = [];
    for (const s of data?.subjects ?? []) {
      const items = s.items.filter((i) => i.type === kind);
      if (items.length) out.push({ subject: s, items, free: items.filter((i) => i.free).length });
    }
    return out;
  }, [data, kind]);

  const handleOpen = async (item: CatalogItem, subject: string) => {
    setPendingId(item.id);
    try {
      const result = await unlockItem(item.id);

      if (result.allowed && result.url) {
        if (result.type === 'video') setViewer({ title: result.title ?? item.title, url: result.url });
        else window.open(result.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (result.reason === 'login_required') { openLogin(); return; }
      if (result.reason === 'not_purchased') { setPaywall({ subject }); return; }

      toast({
        title: 'Could not open this',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-2 border-t border-black/5 pt-6">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (!data?.preview_enabled || !available.length) return null;

  return (
    <div className="mt-6 border-t border-black/5 pt-6 md:mt-8 md:pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-black md:text-[17px]">
          What you get inside
        </h3>
        {data.totals.free > 0 && (
          <span className="text-[12px] font-medium text-emerald-700">
            {data.totals.free} free to watch now
          </span>
        )}
      </div>

      {/* Segregated by kind, exactly like the portal itself */}
      <div className="mb-4 flex flex-wrap gap-2">
        {available.map((k) => {
          const Icon = k.icon;
          const active = k.key === kind;
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => { setKind(k.key); setOpenSubject(null); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border-[1.2px] px-3 py-2 text-[12px] font-semibold transition-all md:text-[13px]',
                active
                  ? 'border-black bg-black text-white'
                  : 'border-black/10 bg-white text-black/70 hover:border-black/30',
              )}
            >
              <Icon className="h-4 w-4" />
              {k.label}
              <span className={cn('text-[11px] font-medium', active ? 'text-white/70' : 'text-black/40')}>
                {data.totals[k.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {subjects.map(({ subject, items, free }) => {
          const expanded = openSubject === subject.subject;
          return (
            <div key={subject.subject} className="overflow-hidden rounded-lg border-[1.2px] border-black/10">
              <button
                type="button"
                onClick={() => setOpenSubject(expanded ? null : subject.subject)}
                className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-black md:text-[14px]">
                    {subject.subject}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-black/50 md:text-[12px]">
                    {items.length} {kind === 'video' ? 'lecture' : kind === 'note' ? 'note' : 'sheet'}
                    {items.length > 1 ? 's' : ''}
                    {free > 0 && <span className="text-emerald-700"> · {free} free</span>}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-black/40 transition-transform duration-200',
                    expanded && 'rotate-180',
                  )}
                />
              </button>

              {expanded && (
                <ul className="divide-y divide-black/5 border-t border-black/5 bg-[#fafafa]">
                  {items.map((item) => {
                    const busy = pendingId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleOpen(item, subject.subject)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white disabled:opacity-60"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] text-black/80 md:text-[13px]">
                              {item.title}
                            </span>
                            {item.date && (
                              <span className="block text-[10px] text-black/40 md:text-[11px]">{item.date}</span>
                            )}
                          </span>
                          {busy ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-black/30" />
                          ) : item.free ? (
                            <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Free
                            </span>
                          ) : (
                            <Lock className="h-3.5 w-3.5 shrink-0 text-black/30" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/*
        Both dialogs set their own padding and radius on purpose: the shared
        DialogContent is p-0, gap-4 and sm:rounded-[32px], so anything that
        assumes default padding sits flush against the edge, and any child with
        a smaller radius shows its square corners through the rounded frame.
      */}
      <Dialog open={!!viewer} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-[24px]">
          <DialogHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="pr-10 text-left text-[14px] font-semibold leading-snug sm:text-[15px]">
              {viewer?.title}
            </DialogTitle>
          </DialogHeader>
          {viewer && (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={viewer.url}
                title={viewer.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
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
            <span className="font-medium text-black/80">{paywall?.subject}</span> is part of{' '}
            <span className="font-medium text-black/80">{courseTitle}</span>. Enrol to open every
            lecture, note and practice sheet in it.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-lg"
              onClick={() => { setPaywall(null); onBuyClick?.(); }}
            >
              See enrolment options
            </Button>
            <Button variant="outline" className="rounded-lg" onClick={() => setPaywall(null)}>
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SSPContentBrowser;
