import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotesFilterPair {
  branch: string; // normalized slug, e.g. "data-science"
  level: string; // normalized slug, e.g. "diploma"
}

const norm = (s: string | null | undefined) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, "-");

/**
 * Returns the distinct (branch, level) combinations that ACTUALLY have active
 * IITM branch notes with a download link. The notes filter bar should be built
 * from this — not from the courses table — so levels like Diploma/Degree that
 * have notes but no matching course still show up. Values are normalized to
 * slugs so dirty rows (e.g. "Data Science"/"Qualifier") merge with the slug
 * versions ("data-science"/"qualifier").
 */
export const useIITMNotesFilters = () => {
  const [pairs, setPairs] = useState<NotesFilterPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("iitm_branch_notes")
        .select("branch, level, file_link")
        .eq("is_active", true);

      if (!active) return;
      if (error || !data) {
        setPairs([]);
        setLoading(false);
        return;
      }

      const seen = new Set<string>();
      const out: NotesFilterPair[] = [];
      for (const row of data as {
        branch: string | null;
        level: string | null;
        file_link: string | null;
      }[]) {
        if (!row.file_link || !row.file_link.trim()) continue; // only rows with a real link
        const branch = norm(row.branch);
        const level = norm(row.level);
        if (!branch || !level) continue;
        const key = `${branch}|${level}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ branch, level });
      }

      setPairs(out);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { pairs, loading };
};
