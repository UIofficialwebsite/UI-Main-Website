-- Performance remediation, round 2: same per-row RLS pattern as courses,
-- now on notes / pyqs / iitm_branch_notes.
--
-- notes & pyqs each had a redundant `FOR ALL` admin policy that ran an
-- admin_users EXISTS subquery PER ROW on every public read, plus a stack of
-- duplicate public-read policies. Explicit INSERT/UPDATE/DELETE admin
-- policies already exist (verified to carry WITH CHECK), so the FOR ALL
-- policies are pure read-time overhead and safe to drop. Collapse the
-- duplicate SELECT policies to a single `USING (true)` each — this preserves
-- current behavior (reads were already effectively public via OR'd policies).

begin;

-- ---------------- notes ----------------
DROP POLICY IF EXISTS "Admins can manage notes" ON public.notes;              -- FOR ALL: subquery per read row
DROP POLICY IF EXISTS "Anyone can view active notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.notes;
DROP POLICY IF EXISTS "Everyone can view notes" ON public.notes;
DROP POLICY IF EXISTS "Public can read notes" ON public.notes;
-- keep "Allow public read access" (USING true)

-- ---------------- pyqs ----------------
DROP POLICY IF EXISTS "Admins can manage pyqs" ON public.pyqs;                -- FOR ALL: subquery per read row
DROP POLICY IF EXISTS "Anyone can view active pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Authenticated users can view pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Everyone can view pyqs" ON public.pyqs;
-- keep "Public can read pyqs" (USING true)

-- ---------------- iitm_branch_notes ----------------
-- No per-row admin function on reads here; just dedupe the 4 SELECT policies.
DROP POLICY IF EXISTS "Anyone can view active notes" ON public.iitm_branch_notes;
DROP POLICY IF EXISTS "Enable public read access for all notes" ON public.iitm_branch_notes;
DROP POLICY IF EXISTS "Everyone can view active iitm notes" ON public.iitm_branch_notes;
-- keep "Allow public read branch notes" (USING true)

commit;
