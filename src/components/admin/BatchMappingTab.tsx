import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Batch Mapping — shows, for every course, whether its Explore section is
 * actually finding content in the SSP portal, and lets an admin fix the ones
 * that are not.
 *
 * A course finds its content by name: whatever create-cashfree-order writes
 * onto the payment (the course title) is the same string the portal stores on
 * every lecture. When a title drifts from the batch name, this screen is where
 * you point it at the right one — no code change, no deploy.
 */

interface CourseRow {
  id: string;
  title: string;
  is_live: boolean | null;
}

interface MapRow {
  course_id: string;
  erp_batch_name: string;
}

interface Probe {
  batch: string | null;
  items: number;
  subjects: number;
  loading: boolean;
}

const BatchMappingTab: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [probes, setProbes] = useState<Record<string, Probe>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: courseData }, { data: mapData }] = await Promise.all([
      supabase.from('courses').select('id, title, is_live').order('title'),
      supabase.from('course_batch_map').select('course_id, erp_batch_name'),
    ]);

    const list = (courseData ?? []) as CourseRow[];
    const map: Record<string, string> = {};
    ((mapData ?? []) as MapRow[]).forEach((m) => { map[m.course_id] = m.erp_batch_name; });

    setCourses(list);
    setOverrides(map);
    setDrafts(map);
    setLoading(false);

    // Ask the live catalog what each course actually resolves to. This is the
    // honest check — it is the same call the course page makes.
    list.forEach(async (c) => {
      setProbes((p) => ({ ...p, [c.id]: { batch: null, items: 0, subjects: 0, loading: true } }));
      try {
        const res = await fetch(`/api/catalog?course_id=${c.id}`);
        const d = await res.json();
        const t = d?.totals ?? { video: 0, note: 0, dpp: 0 };
        setProbes((p) => ({
          ...p,
          [c.id]: {
            batch: d?.batch ?? null,
            items: (t.video ?? 0) + (t.note ?? 0) + (t.dpp ?? 0),
            subjects: (d?.subjects ?? []).length,
            loading: false,
          },
        }));
      } catch {
        setProbes((p) => ({ ...p, [c.id]: { batch: null, items: 0, subjects: 0, loading: false } }));
      }
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const save = async (courseId: string) => {
    const value = (drafts[courseId] ?? '').trim();
    setSaving(courseId);
    try {
      if (!value) {
        // Clearing the override falls back to the course title again.
        const { error } = await supabase.from('course_batch_map').delete().eq('course_id', courseId);
        if (error) throw error;
        setOverrides((o) => { const n = { ...o }; delete n[courseId]; return n; });
      } else {
        const { error } = await supabase
          .from('course_batch_map')
          .upsert({ course_id: courseId, erp_batch_name: value }, { onConflict: 'course_id' });
        if (error) throw error;
        setOverrides((o) => ({ ...o, [courseId]: value }));
      }
      toast({ title: 'Saved', description: 'The course page will pick this up within ten minutes.' });
    } catch (e) {
      toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const brokenCount = useMemo(
    () => courses.filter((c) => probes[c.id] && !probes[c.id].loading && probes[c.id].items === 0).length,
    [courses, probes],
  );

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3">
          Batch Mapping
          <Badge variant={brokenCount ? 'destructive' : 'secondary'}>
            {brokenCount ? `${brokenCount} showing nothing` : 'all courses mapped'}
          </Badge>
          <Button size="sm" variant="outline" onClick={load} className="ml-auto">
            <RefreshCw className="mr-2 h-4 w-4" /> Re-check
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Each row shows what the course's Explore section is finding right now. Leave the box empty
          to use the course title, which is what almost every course already does.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {courses.map((c) => {
          const probe = probes[c.id];
          const found = probe && !probe.loading && probe.items > 0;
          const dirty = (drafts[c.id] ?? '') !== (overrides[c.id] ?? '');
          return (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {probe?.loading ? (
                    <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : found ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <p className="truncate font-medium">{c.title}</p>
                </div>
                <p className="ml-6 truncate text-xs text-muted-foreground">
                  {probe?.loading
                    ? 'checking…'
                    : found
                      ? `${probe.items} items across ${probe.subjects} subject${probe.subjects > 1 ? 's' : ''} — resolving to "${probe.batch}"`
                      : `nothing found for "${probe?.batch ?? c.title}"`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Input
                  className="w-full md:w-72"
                  placeholder={c.title}
                  value={drafts[c.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={!dirty || saving === c.id}
                  onClick={() => save(c.id)}
                >
                  {saving === c.id ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BatchMappingTab;
