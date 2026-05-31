-- Performance remediation: RLS per-row function calls, realtime publication
-- bloat, and an over-frequent cron job were dominating DB time.
-- Tables are tiny (<5k rows) so every cost here is plan/config, not volume.

begin;

-- ============================================================
-- 1. user_recommendations  (~33% of total DB time)
-- auth.uid() / get_my_role() were re-evaluated per row. Wrapping them in
-- a scalar subselect makes Postgres run them ONCE per query (initPlan).
-- Also drop the duplicate SELECT policy.
-- ============================================================
DROP POLICY IF EXISTS "Users can select their own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Allow users to read their own recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Admins can manage all recommendations" ON public.user_recommendations;

CREATE POLICY "Users read own recommendations"
  ON public.user_recommendations FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Admin management restricted to writes; SELECT stays covered by the policy
-- above, so normal reads never evaluate get_my_role().
CREATE POLICY "Admins manage recommendations"
  ON public.user_recommendations FOR ALL
  USING ((select get_my_role()) = ANY (ARRAY['admin','super_admin']))
  WITH CHECK ((select get_my_role()) = ANY (ARRAY['admin','super_admin']));

-- ============================================================
-- 2. courses  (is_current_user_admin() fired per-row on every public read)
-- Collapse 5 duplicate public-read policies into one, and make the admin
-- policy write-only so reads never call the SECURITY DEFINER function.
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to all courses" ON public.courses;
DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
-- keep "Allow public read access" (USING true) as the single SELECT policy

DROP POLICY IF EXISTS "Only admins can manage courses" ON public.courses;
CREATE POLICY "Admins insert courses"
  ON public.courses FOR INSERT
  WITH CHECK ((select is_current_user_admin()));
CREATE POLICY "Admins update courses"
  ON public.courses FOR UPDATE
  USING ((select is_current_user_admin()))
  WITH CHECK ((select is_current_user_admin()));
CREATE POLICY "Admins delete courses"
  ON public.courses FOR DELETE
  USING ((select is_current_user_admin()));

-- ============================================================
-- 3. Realtime publication  (~23% of DB time)
-- Remove tables no client subscribes to. Every write to a published table
-- incurs WAL->realtime processing even with zero subscribers. profiles and
-- employees in realtime are also an exposure surface.
-- Kept: jobs (AnnouncementBar subscribes to job changes).
-- ============================================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.employees;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.pyqs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.iitm_branch_notes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.important_dates;
ALTER PUBLICATION supabase_realtime DROP TABLE public.communities;
ALTER PUBLICATION supabase_realtime DROP TABLE public.news_updates;
ALTER PUBLICATION supabase_realtime DROP TABLE public.batch_schedule;
ALTER PUBLICATION supabase_realtime DROP TABLE public.course_addons;

-- ============================================================
-- 4. Cron + bloat
-- promotional-group-bulk-sync ran every minute; 15 min is plenty.
-- Prune pg_cron run history (24k rows / 25 MB, never auto-pruned).
-- ============================================================
SELECT cron.alter_job(3, schedule => '*/15 * * * *');
DELETE FROM cron.job_run_details WHERE end_time < now() - interval '3 days';

commit;
