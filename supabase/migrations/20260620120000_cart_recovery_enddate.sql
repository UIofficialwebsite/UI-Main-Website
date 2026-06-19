-- Only send recovery for batches that are still open.
--
-- The app treats a course as expired/closed when valid_till has passed
-- (CourseDetail.isCourseExpired; ActiveBatchesSection filters valid_till >= today
-- or null). Mirror that here so we never email people to rejoin a batch that has
-- already ended. valid_till is timestamptz; compare to current_date so a batch
-- valid through today still counts as open.

create or replace function public.get_recoverable_carts(p_limit int default 50)
returns table (
  enrollment_id uuid,
  user_id       uuid,
  email         text,
  full_name     text,
  course_id     uuid,
  course_title  text,
  amount        numeric,
  created_at    timestamptz
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.user_id, p.email, p.full_name, e.course_id, c.title, e.amount, e.created_at
  from public.enrollments e
  join public.profiles p on p.id = e.user_id
  join public.courses   c on c.id = e.course_id
  where e.status = 'pending'
    and e.created_at < now() - interval '2 hours'
    and e.created_at > now() - interval '48 hours'
    and p.email is not null and p.email <> ''
    and (c.valid_till is null or c.valid_till >= current_date)   -- batch still open
    and not exists (
      select 1 from public.abandoned_cart_recovery r where r.enrollment_id = e.id
    )
    and not exists (
      select 1 from public.enrollments e2
      where e2.user_id = e.user_id and e2.course_id = e.course_id
        and e2.status in ('active', 'success')
    )
  order by e.created_at desc
  limit p_limit;
$$;

revoke all on function public.get_recoverable_carts(int) from public, anon, authenticated;
