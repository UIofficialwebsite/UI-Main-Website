import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cachedRead } from "@/utils/edgeCache";

export interface IITMPYQ {
  id: string;
  title: string;
  description: string;
  year: number;
  downloads: number;
  subject?: string | null;
  branch?: string | null;
  level?: string | null;
  exam_type?: string | null;
  session?: string | null;
  shift?: string | null;
  file_link?: string | null;
  content_url?: string | null;
}

export interface UseIITMBranchPyqsResult {
  pyqs: IITMPYQ[];
  loading: boolean;
  groupedPyqs: Record<string, IITMPYQ[]>;
  getCurrentSubjects: (specialization?: string | null) => string[];
  getAvailableSpecializations: () => string[];
  reloadPyqs: () => void;
}

export function useIITMBranchPyqs(branch: string, level: string, examType?: string): UseIITMBranchPyqsResult {
  const [pyqs, setPyqs] = useState<IITMPYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);
  const reloadPyqs = useCallback(() => setReloadFlag((x) => x + 1), []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        // IITM PYQs come from the shared edge cache (all active IITM_BS PYQs,
        // served ~once per window globally) and are filtered here by branch and
        // level. Previously this was an uncached select('*') on every visit plus
        // a pyqs realtime channel opened for every viewer — both wasteful
        // Supabase egress. Falls back to a slim direct query on a cache miss.
        const rows = await cachedRead<any[]>("iitm_branch_pyqs", async () => {
          const { data } = await supabase
            .from("pyqs")
            .select("id, title, description, year, download_count, subject, branch, level, exam_type, session, shift, file_link, content_url, is_active")
            .eq("is_active", true)
            .eq("exam_type", "IITM_BS")
            .eq("branch", branch)
            .eq("level", level);
          return data ?? [];
        });

        const mappedPyqs: IITMPYQ[] = (rows || [])
          .filter((p: any) => p.is_active !== false && p.branch === branch && p.level === level)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || "",
            year: p.year || new Date().getFullYear(),
            downloads: p.download_count ?? 0,
            subject: p.subject || null,
            branch: p.branch || null,
            level: p.level || null,
            exam_type: p.exam_type || null,
            session: p.session || null,
            shift: p.shift || null,
            file_link: p.file_link || null,
            content_url: p.content_url || null,
          }))
          .sort((a, b) => (b.year || 0) - (a.year || 0));
        setPyqs(mappedPyqs);
      } catch (error) {
        console.error("Error fetching IITM PYQs:", error);
        setPyqs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [branch, level, examType, reloadFlag]);

  const getAvailableSpecializations = () => {
    if (level !== 'diploma') return [];
    const specializations = new Set<string>();
    // For PYQs, we might not have diploma specializations like notes
    // This can be extended based on requirements
    return Array.from(specializations).sort();
  };

  const groupedPyqs = pyqs.reduce((acc: Record<string, IITMPYQ[]>, pyq) => {
    const groupKey = pyq.subject || 'General';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(pyq);
    return acc;
  }, {});

  const getCurrentSubjects = (specialization?: string | null) => {
    const subjects = new Set<string>();
    pyqs.forEach(pyq => {
      if (pyq.subject) {
        subjects.add(pyq.subject);
      }
    });
    return Array.from(subjects).sort();
  };

  return { pyqs, loading, groupedPyqs, getCurrentSubjects, getAvailableSpecializations, reloadPyqs };
}
