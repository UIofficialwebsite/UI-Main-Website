import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  type: 'course' | 'job';
  title: string;
  description?: string;
  link: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
}

interface JobData {
  id: string;
  title: string;
  company: string;
  description: string | null;
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      // Fetch live premium courses (using bestseller for premium)
      const coursesResponse: any = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('bestseller', true)
        .eq('is_live', true)
        .order('created_at', { ascending: false });

      const courses = coursesResponse.data as CourseData[] | null;

      // Fetch active jobs
      const jobsResponse: any = await supabase
        .from('jobs')
        .select('id, title, company, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const jobs = jobsResponse.data as JobData[] | null;

      const courseAnnouncements: Announcement[] = (courses || []).map((course) => ({
        id: course.id,
        type: 'course' as const,
        title: `${course.title} - Live Batch Now Open!`,
        description: course.description,
        link: `/course/${course.id}`,
      }));

      const jobAnnouncements: Announcement[] = (jobs || []).map((job) => ({
        id: job.id,
        type: 'job' as const,
        title: `${job.title} at ${job.company}`,
        description: job.description || undefined,
        link: `/career#${job.id}`,
      }));

      // Courses first, then jobs
      setAnnouncements([...courseAnnouncements, ...jobAnnouncements]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    // Realtime on courses only. Jobs change rarely, so streaming their WAL to
    // every visitor was wasteful egress — dropped; jobs refresh on next load.
    const coursesChannel = supabase
      .channel('courses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchAnnouncements)
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
    };
  }, []);

  return { announcements, loading };
};
