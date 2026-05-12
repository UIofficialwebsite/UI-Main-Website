-- ============================================================
-- Lock down tool_usage_logs
-- Anonymous SELECT was returning 13,589 rows of user PII
-- (email, phone, user_id, tool inputs/results) via the anon key.
-- ============================================================

-- 1. Drop every existing policy on tool_usage_logs
--    (table was created via the Supabase dashboard, so we don't
--    know the policy names ahead of time)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tool_usage_logs'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.tool_usage_logs', pol.policyname);
  END LOOP;
END $$;

-- 2. Make sure RLS is on
ALTER TABLE public.tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. INSERT — authenticated users may only log under their own user_id
CREATE POLICY "Users insert own tool usage"
  ON public.tool_usage_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 4. INSERT — anonymous tool usage allowed, but user_id must stay NULL
CREATE POLICY "Anonymous insert tool usage"
  ON public.tool_usage_logs FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- 5. SELECT — authenticated users only see their own rows
CREATE POLICY "Users read own tool usage"
  ON public.tool_usage_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 6. ALL — admins have full access (matches the project's existing pattern)
CREATE POLICY "Admins manage tool usage"
  ON public.tool_usage_logs FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 7. ALL — service role bypass (for edge functions / server-side jobs)
CREATE POLICY "Service role full access on tool usage"
  ON public.tool_usage_logs FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
