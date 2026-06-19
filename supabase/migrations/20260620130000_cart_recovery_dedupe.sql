-- Dedupe recovery by (user, course), not by enrollment row.
--
-- A user can have several pending enrollment rows for the same course (repeated
-- checkout attempts). The first version keyed idempotency on enrollment_id, so
-- one person received one email per stuck row. Fix: collapse to one candidate
-- per (user_id, course_id), and treat a (user_id, course_id) already present in
-- the recovery log as "done" — so each user is nudged at most once per course.

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
  select s.enrollment_id, s.user_id, s.email, s.full_name, s.course_id, s.course_title, s.amount, s.created_at
  from (
    select distinct on (e.user_id, e.course_id)
      e.id as enrollment_id, e.user_id, p.email, p.full_name,
      e.course_id, c.title as course_title, e.amount, e.created_at
    from public.enrollments e
    join public.profiles p on p.id = e.user_id
    join public.courses   c on c.id = e.course_id
    where e.status = 'pending'
      and e.created_at < now() - interval '2 hours'
      and e.created_at > now() - interval '48 hours'
      and p.email is not null and p.email <> ''
      and (c.valid_till is null or c.valid_till >= current_date)   -- batch still open
      and not exists (
        select 1 from public.abandoned_cart_recovery r
        where r.user_id = e.user_id and r.course_id = e.course_id   -- one nudge per user+course
      )
      and not exists (
        select 1 from public.enrollments e2
        where e2.user_id = e.user_id and e2.course_id = e.course_id
          and e2.status in ('active', 'success')
      )
    order by e.user_id, e.course_id, e.created_at desc
  ) s
  order by s.created_at desc
  limit p_limit;
$$;

revoke all on function public.get_recoverable_carts(int) from public, anon, authenticated;
