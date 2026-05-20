import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/components/admin/courses/types';
import { Button } from '@/components/ui/button';

interface ActiveBatchesSectionProps {
  currentCourse: Course;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ActiveBatchesSection: React.FC<ActiveBatchesSectionProps> = ({ currentCourse }) => {
  const [batches, setBatches] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!currentCourse.branch || !currentCourse.level) {
        setLoading(false);
        return;
      }
      const todayIso = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_live', true)
        .eq('branch', currentCourse.branch)
        .eq('level', currentCourse.level)
        .neq('id', currentCourse.id)
        .or(`valid_till.gte.${todayIso},valid_till.is.null`)
        .order('start_date', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('ActiveBatches fetch error', error);
        setBatches([]);
      } else {
        setBatches((data ?? []) as unknown as Course[]);
      }
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [currentCourse.id, currentCourse.branch, currentCourse.level]);

  if (loading || batches.length === 0) return null;

  return (
    <section className="scroll-mt-24">
      <div className="bg-white border border-[#e3e8ee] rounded-xl p-6 md:p-10 w-full shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1f36]">
          Active &amp; Upcoming Batches
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          This batch's enrollment window has closed. Here are the live and
          upcoming batches you can still join
          {currentCourse.branch ? ` in ${currentCourse.branch}` : ''}
          {currentCourse.level ? ` · ${currentCourse.level}` : ''}.
        </p>

        <div className="-mx-2 px-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          <div className="flex gap-4">
            {batches.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                onExplore={() => navigate(`/courses/${b.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface BatchCardProps {
  batch: Course;
  onExplore: () => void;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch, onExplore }) => (
  <div className="snap-start flex-none w-[260px] sm:w-[280px] bg-white border border-[#e3e8ee] rounded-lg overflow-hidden flex flex-col hover:border-[#1a1f36] transition-colors">
    <img
      src={batch.image_url || '/placeholder.svg'}
      alt={batch.title}
      className="w-full aspect-video object-cover bg-slate-50"
      loading="lazy"
    />
    <div className="p-4 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-[#1a1f36] line-clamp-2 min-h-[2.5rem]">
        {batch.title}
      </h3>
      <div className="flex items-start gap-2 mt-3 text-xs text-slate-600">
        <CalendarRange
          className="w-4 h-4 text-royal-dark mt-0.5 shrink-0"
          strokeWidth={1.75}
        />
        <div className="flex flex-col leading-tight">
          <span>Starts: {formatDate(batch.start_date)}</span>
          <span className="text-slate-400">Ends: {formatDate(batch.end_date)}</span>
        </div>
      </div>
      <Button
        onClick={onExplore}
        className="mt-4 w-full bg-royal-dark hover:bg-royal text-white h-9 text-sm rounded-lg"
      >
        Explore <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);

export default ActiveBatchesSection;
