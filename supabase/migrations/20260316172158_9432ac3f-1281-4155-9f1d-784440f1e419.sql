
-- ============================================================
-- SECURITY FIX: Remove overly permissive write policies
-- ============================================================

-- 1. FIX course_addons: "Admins write access" allows ANY authenticated user
DROP POLICY IF EXISTS "Admins write access" ON public.course_addons;
CREATE POLICY "Only admins can manage course_addons"
  ON public.course_addons
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 2. FIX courses: "Admins can manage courses" relies on profiles.role which users can self-edit
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Only admins can manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- 3. FIX batch_schedule: admin policies check jwt 'role' which is supabase role, not app role
DROP POLICY IF EXISTS "Allow insert for admins" ON public.batch_schedule;
DROP POLICY IF EXISTS "Allow update for admins" ON public.batch_schedule;
DROP POLICY IF EXISTS "Allow delete for admins" ON public.batch_schedule;

CREATE POLICY "Only admins can insert batch_schedule"
  ON public.batch_schedule FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Only admins can update batch_schedule"
  ON public.batch_schedule FOR UPDATE TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Only admins can delete batch_schedule"
  ON public.batch_schedule FOR DELETE TO authenticated
  USING (is_current_user_admin());

-- 4. FIX profiles: Prevent users from changing their own 'role' column
-- Create a trigger that blocks role changes by non-admins
CREATE OR REPLACE FUNCTION public.protect_profile_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- If the role is being changed and the user is not an admin, block it
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT is_current_user_admin() THEN
      NEW.role := OLD.role; -- Silently revert the role change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
