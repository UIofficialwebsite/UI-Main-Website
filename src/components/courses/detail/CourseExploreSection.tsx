import React, { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoginModal } from '@/context/LoginModalContext';
import { useCourseCatalog, unlockItem, type CatalogItem } from '@/hooks/useCourseCatalog';
import { cn } from '@/lib/utils';
import { FileText, Lock, Notebook, PlayCircle, Sparkles, Loader2 } from 'lucide-react';

/**
 * "Explore this batch" — the real contents of the course, before you buy.
 *
 * Every subject, lecture and note title is visible to anyone, including
 * signed-out visitors, which is what makes the value obvious and the page
 * worth indexing. What is NOT here is any way to reach the content: the
 * catalog this renders contains no links at all.
 *
 * Clicking an item asks the server to open it. The server decides:
 *   signed out            -> the login modal
 *   signed in, not bought -> the buy prompt
 *   free preview / bought -> it opens
 */

interface Props {
  courseId: string;
  courseTitle: string;
  onBuyClick?: () => void;
}

const TYPE_META = {
  video: { icon: PlayCircle, label: 'Lecture' },
  note:  { icon: Notebook,   label: 'Note' },
  dpp:   { icon: FileText,   label: 'Practice' },
} as const;

/** Count line like "41 lectures · 18 notes · 8 practice", skipping empties. */
function describe(counts: { video: number; note: number; dpp: number }) {
  return [
    counts.video ? `${counts.video} lecture${counts.video > 1 ? 's' : ''}` : null,
    counts.note ? `${counts.note} note${counts.note > 1 ? 's' : ''}` : null,
    counts.dpp ? `${counts.dpp} practice` : null,
  ].filter(Boolean).join(' · ');
}

const CourseExploreSection: React.FC<Props> = ({ courseId, courseTitle, onBuyClick }) => {
  const { data, isLoading } = useCourseCatalog(courseId);
  const { openLogin } = useLoginModal();
  const { toast } = useToast();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; url: string } | null>(null);
  const [paywall, setPaywall] = useState<{ subject: string } | null>(null);

  const totalItems = useMemo(
    () => (data?.subjects ?? []).reduce((n, s) => n + s.items.length, 0),
    [data],
  );

  const handleOpen = async (item: CatalogItem, subject: string) => {
    setPendingId(item.id);
    try {
      const result = await unlockItem(item.id);

      if (result.allowed) {
        // Notes and practice sheets are documents — a new tab is the natural
        // place for them. Lectures play inline.
        if (result.type === 'video') setViewer({ title: result.title, url: result.url });
        else window.open(result.url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (result.reason === 'login_required') {
        openLogin();
        return;
      }
      if (result.reason === 'not_purchased') {
        setPaywall({ subject });
        return;
      }
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
      <div className="w-full font-['Inter',sans-serif]">
        <div className="mx-auto max-w-[850px] space-y-3 rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] md:p-12">
          <Skeleton className="h-8 w-56" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  // Nothing to show: batch switched off by an admin, or no content yet.
  if (!data?.preview_enabled || totalItems === 0) return null;

  return (
    <div className="w-full font-['Inter',sans-serif]">
      <div className="mx-auto max-w-[850px] rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] md:p-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">What's inside this batch</h2>
          <p className="mt-2 text-sm text-gray-600">
            {describe(data.totals)} across {data.subjects.length} subject
            {data.subjects.length > 1 ? 's' : ''}
            {data.totals.free > 0 && <> · <span className="font-semibold text-emerald-700">{data.totals.free} free to watch</span></>}
          </p>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {data.subjects.map((s) => (
            <AccordionItem
              key={s.subject}
              value={s.subject}
              className="overflow-hidden rounded-2xl border border-black/5 bg-[#fafafa] px-0"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline md:px-5">
                <div className="flex-1 pr-3 text-left">
                  <p className="font-semibold text-gray-900">{s.subject}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{describe(s.counts)}</p>
                </div>
                {s.counts.free > 0 && (
                  <Badge className="mr-2 shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {s.counts.free} free
                  </Badge>
                )}
              </AccordionTrigger>

              <AccordionContent className="px-2 pb-3 md:px-3">
                <ul className="divide-y divide-black/5 rounded-xl bg-white">
                  {s.items.map((item) => {
                    const meta = TYPE_META[item.type];
                    const Icon = meta.icon;
                    const busy = pendingId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleOpen(item, s.subject)}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                            'hover:bg-gray-50 disabled:opacity-60 md:px-4',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              item.free ? 'text-emerald-600' : 'text-gray-400',
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-gray-900">{item.title}</span>
                            <span className="block text-xs text-gray-500">
                              {meta.label}
                              {item.date ? ` · ${item.date}` : ''}
                            </span>
                          </span>
                          {busy ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
                          ) : item.free ? (
                            <Badge className="shrink-0 bg-emerald-600 hover:bg-emerald-600">
                              <Sparkles className="mr-1 h-3 w-3" /> Free
                            </Badge>
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Free preview / owned content player */}
      <Dialog open={!!viewer} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="pr-6 text-base">{viewer?.title}</DialogTitle>
          </DialogHeader>
          {viewer && (
            <div className="aspect-video w-full overflow-hidden rounded-b-lg bg-black">
              <iframe
                src={viewer.url}
                title={viewer.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Paywall */}
      <Dialog open={!!paywall} onOpenChange={(open) => !open && setPaywall(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Buy this batch to watch
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {paywall?.subject} in <span className="font-medium">{courseTitle}</span> is part of the
            paid batch. Enrol to unlock every lecture, note and practice sheet in it.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setPaywall(null);
                onBuyClick?.();
              }}
            >
              See enrolment options
            </Button>
            <Button variant="outline" onClick={() => setPaywall(null)}>
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseExploreSection;
