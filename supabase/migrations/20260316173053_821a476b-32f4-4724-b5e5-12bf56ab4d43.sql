
-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================================

-- ===================== 1. study_materials =====================
DROP POLICY IF EXISTS "Admins manage content" ON public.study_materials;
CREATE POLICY "Admins manage content"
  ON public.study_materials FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ===================== 2. communities =====================
DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;

-- ===================== 3. app_routes =====================
DROP POLICY IF EXISTS "Admins can manage routes" ON public.app_routes;
CREATE POLICY "Admins can manage routes"
  ON public.app_routes FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ===================== 4. iitm_branch_notes =====================
DROP POLICY IF EXISTS "Authenticated users can modify notes" ON public.iitm_branch_notes;

-- ===================== 5. admin_users =====================
DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON public.admin_users;

-- ===================== 6. admin_audit_log =====================
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_log FOR INSERT TO service_role
  WITH CHECK (true);

-- ===================== 7. notes - remove open insert/update/delete =====================
DROP POLICY IF EXISTS "Authenticated users can insert notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated can insert notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Creator or admin can update notes" ON public.notes;

-- ===================== 8. pyqs - remove open insert/update/delete =====================
DROP POLICY IF EXISTS "Authenticated users can insert pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Authenticated can insert pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Users can update their own pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Users can delete their own pyqs" ON public.pyqs;
DROP POLICY IF EXISTS "Creator or admin can update pyqs" ON public.pyqs;

-- ===================== 9. google_group_sync_queue =====================
ALTER TABLE public.google_group_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access"
  ON public.google_group_sync_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ===================== 10. Secure functions with search_path =====================
CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  my_role TEXT;
BEGIN
  SELECT role INTO my_role FROM public.profiles WHERE id = auth.uid();
  RETURN my_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_email text)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT user_email = 'uiwebsite638@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.increment_download_count(table_name text, content_id uuid, user_email text DEFAULT NULL::text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF table_name = 'notes' THEN
    UPDATE public.notes SET download_count = download_count + 1 WHERE id = content_id AND is_active = true;
  ELSIF table_name = 'pyqs' THEN
    UPDATE public.pyqs SET download_count = download_count + 1 WHERE id = content_id AND is_active = true;
  ELSIF table_name = 'iitm_branch_notes' THEN
    UPDATE public.iitm_branch_notes SET download_count = download_count + 1 WHERE id = content_id AND is_active = true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_all_recommendations()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_recommendations WHERE source = 'content_based';
  DELETE FROM public.user_recommendations WHERE source = 'collaborative';

  INSERT INTO public.user_recommendations (user_id, course_id, score, source)
  SELECT p.id, c.id, 0.75, 'content_based'
  FROM public.profiles AS p CROSS JOIN public.courses AS c
  WHERE p.interests && c.tags
    AND NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = p.id AND e.course_id = c.id)
  ON CONFLICT (user_id, course_id, source) DO NOTHING;

  INSERT INTO public.user_recommendations (user_id, course_id, score, source)
  SELECT e1.user_id, e3.course_id, 0.90, 'collaborative'
  FROM public.enrollments AS e1
  JOIN public.enrollments AS e2 ON e1.course_id = e2.course_id AND e1.user_id != e2.user_id
  JOIN public.enrollments AS e3 ON e2.user_id = e3.user_id AND e1.course_id != e3.course_id
  WHERE NOT EXISTS (SELECT 1 FROM public.enrollments e4 WHERE e4.user_id = e1.user_id AND e4.course_id = e3.course_id)
  GROUP BY e1.user_id, e3.course_id
  ON CONFLICT (user_id, course_id, source) DO NOTHING;

  RETURN 'Recommendation generation complete.';
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_add_to_google_group()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qzrvctpwefhmcduariuw.supabase.co/functions/v1/add-to-google-group',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'record', jsonb_build_object('id', NEW.id, 'email', NEW.email, 'full_name', NEW.full_name)
    )
  );
  RETURN NEW;
END;
$$;
