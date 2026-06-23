import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotesFilterRow {
  branch: string; // normalized slug, e.g. "data-science"
  level: string; // normalized slug, e.g. "diploma"
  specialization: string | null; // e.g. "Programming", or null
}

const norm = (s: string | null | undefined) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, "-");

/**
 * Returns the distinct (branch, level, specialization) combinations that
 * ACTUALLY have active IITM branch notes with a download link. The notes filter
 * bar is built from this — not from the courses table — so levels like
 * Diploma/Degree (and any sub-filter like a Diploma specialization) show up only
 * when real content exists. branch/level are normalized to slugs so dirty rows
 * (e.g. "Data Science"/"Qualifier") merge with their slug versions;
 * specialization is kept as stored (it's the user-facing label and the value
 * notes are filtered by).
 */
export const useIITMNotesFilters = () => {
  const [rows, setRows] = useState<NotesFilterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("iitm_branch_notes")
        .select("branch, level, file_link, diploma_specialization")
        .eq("is_active", true);

      if (!active) return;
      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }

      const seen = new Set<string>();
      const out: NotesFilterRow[] = [];
      for (const row of data as {
        branch: string | null;
        level: string | null;
        file_link: string | null;
        diploma_specialization: string | null;
      }[]) {
        if (!row.file_link || !row.file_link.trim()) continue; // only rows with a real link
        const branch = norm(row.branch);
        const level = norm(row.level);
        if (!branch || !level) continue;
        const specialization =
          row.diploma_specialization && row.diploma_specialization.trim()
            ? row.diploma_specialization.trim()
            : null;
        const key = `${branch}|${level}|${specialization ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ branch, level, specialization });
      }

      setRows(out);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { rows, loading };
};
