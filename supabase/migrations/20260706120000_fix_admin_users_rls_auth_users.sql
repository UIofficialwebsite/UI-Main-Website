-- Fix: the admin_users RLS policies compared against
--   (select email from auth.users where id = auth.uid())
-- but the `authenticated` role cannot read auth.users, so evaluating the policy
-- threw "permission denied for table users" on EVERY non-admin login (useAuth's
-- checkAdminStatus queries admin_users). ~1,161 errors/day.
--
-- Use auth.email() (the JWT email claim) instead — no auth.users access needed.
-- is_super_admin / is_current_user_admin are SECURITY DEFINER so reading
-- admin_users inside them is fine.

drop policy if exists "Allow users to read their own admin status" on public.admin_users;
create policy "Allow users to read their own admin status" on public.admin_users
  for select using (lower(email) = lower(coalesce(auth.email(), '')));

drop policy if exists "Super admins can view all admin users" on public.admin_users;
create policy "Super admins can view all admin users" on public.admin_users
  for select using (public.is_super_admin(auth.email()));

drop policy if exists "Super admins can insert admin users" on public.admin_users;
create policy "Super admins can insert admin users" on public.admin_users
  for insert with check (public.is_super_admin(auth.email()));

drop policy if exists "Super admins can update admin users" on public.admin_users;
create policy "Super admins can update admin users" on public.admin_users
  for update using (public.is_super_admin(auth.email())) with check (public.is_super_admin(auth.email()));

drop policy if exists "Super admins can delete admin users" on public.admin_users;
create policy "Super admins can delete admin users" on public.admin_users
  for delete using (public.is_super_admin(auth.email()));
