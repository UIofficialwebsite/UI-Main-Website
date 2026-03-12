-- Create a security definer function for public employee verification lookup
CREATE OR REPLACE FUNCTION public.verify_employee(p_employee_code text)
RETURNS TABLE (
  employee_code text,
  full_name text,
  "position" text,
  department text,
  employee_type text,
  status text,
  start_date date,
  end_date date,
  is_active boolean,
  verification_certificate_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.employee_code,
    e.full_name,
    e."position",
    e.department,
    e.employee_type,
    e.status,
    e.start_date,
    e.end_date,
    e.is_active,
    e.verification_certificate_url
  FROM public.employees e
  WHERE e.employee_code = p_employee_code
  LIMIT 1;
$$;

-- Remove overly permissive public SELECT policy
DROP POLICY IF EXISTS "Allow select for all users" ON public.employees;

-- Add policy: only admins can SELECT directly from employees table
CREATE POLICY "Only admins can select employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.email()
    )
  );