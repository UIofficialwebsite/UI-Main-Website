import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cachedRead } from "@/utils/edgeCache";
import { useToast } from "@/hooks/use-toast";

export interface Note {
  id: string;
  title: string;
  description?: string;
  file_link: string | null;
  download_count: number;
  subject: string;
  subject_id: number | null;
  week_number: number;
  diploma_specialization?: string | null;
}

export interface GroupedData {
  subjectName: string;
  subjectId: number; // Added field
  specialization: string | null;
  notes: Note[];
}

const formatBranchName = (branch: string) => {
  return branch.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatLevelName = (level: string) => {
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const useIITMBranchNotes = (branch: string, level: string) => {
  const [loading, setLoading] = useState(false);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const { toast } = useToast();

  const reloadNotes = useCallback(async () => {
    if (!branch || !level) return;

    setLoading(true);
    const dbBranchName = formatBranchName(branch);
    const dbLevelName = formatLevelName(level);

    try {
      // 1. Fetch Subjects (The Scaffolding)
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('iitm_bs_subjects')
        .select('*')
        .eq('branch', dbBranchName)
        .eq('level', dbLevelName)
        .order('display_order', { ascending: true });

      if (subjectsError) throw subjectsError;
      if (!subjectsData || subjectsData.length === 0) {
        setGroupedData([]);
        setLoading(false);
        return;
      }

      // 2. Notes come from the shared edge cache (all active IITM branch notes,
      // served ~once per window globally at the CDN) and are filtered here by
      // subject ID. This used to be an uncached select('*') on iitm_branch_notes
      // on every visit — the single biggest Supabase egress source, since it's
      // by far the largest table. Falls back to a slim direct query on a miss.
      const subjectIds = subjectsData.map(s => s.id);
      const subjectIdSet = new Set(subjectIds);
      const allNotes = await cachedRead<any[]>('iitm_branch_notes', async () => {
        const { data } = await supabase
          .from('iitm_branch_notes')
          .select('id, title, description, file_link, download_count, subject, subject_id, week_number, diploma_specialization, is_active')
          .in('subject_id', subjectIds)
          .eq('is_active', true)
          .order('week_number', { ascending: true });
        return data ?? [];
      });
      const notesData = (allNotes || [])
        .filter((n: any) => n.is_active !== false && subjectIdSet.has(n.subject_id))
        .sort((a: any, b: any) => (a.week_number ?? 0) - (b.week_number ?? 0));

      // 3. Group Notes into Subjects
      const finalGroupedData: GroupedData[] = subjectsData.map((subject) => ({
        subjectName: subject.subject_name,
        subjectId: subject.id,
        specialization: subject.specialization || null,
        notes: (notesData || []).map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          file_link: n.file_link,
          download_count: n.download_count,
          subject: n.subject,
          subject_id: n.subject_id,
          week_number: n.week_number,
          diploma_specialization: n.diploma_specialization
        } as Note)).filter(n => n.subject_id === subject.id),
      }));

      // 4. Update state
      const specializations = Array.from(new Set(subjectsData.map(s => s.specialization).filter(Boolean)));
      setGroupedData(finalGroupedData);
      setAvailableSpecializations(specializations as string[]);
      
    } catch (error: any) {
      toast({
        title: "Error fetching notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branch, level, toast]);

  useEffect(() => {
    reloadNotes();
  }, [reloadNotes]);

  return { loading, groupedData, availableSpecializations, reloadNotes };
};
