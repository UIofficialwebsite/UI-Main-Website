-- SECURITY FIX: Remove overly permissive public policies that allow anyone to read all data

-- 1. payments: Remove "Service role manages" (public ALL with true)
-- The "Service Role Full Access" policy for service_role remains, so edge functions still work
-- "Users view own" SELECT policy remains, so users can still see their own payments
DROP POLICY IF EXISTS "Service role manages" ON public.payments;

-- 2. enrollments: Remove "Service role can manage all enrollments" (public ALL with true)
-- enroll_student_with_addons is SECURITY DEFINER so it bypasses RLS
-- Edge functions use service_role key which bypasses RLS
-- User-specific SELECT/INSERT policies remain for client-side access
DROP POLICY IF EXISTS "Service role can manage all enrollments" ON public.enrollments;