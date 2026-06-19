-- Abandoned-cart recovery (automated).
--
-- A pending enrollment that's still pending a couple of hours after creation is
-- an abandoned checkout (reconcile-payments would have flipped it to success by
-- then if it had actually paid). A pg_cron job pings the
-- recover-abandoned-enrollments edge function every 30 min, which web-pushes +
-- emails those users a comeback nudge with a coupon. The log table below makes
-- it idempotent — each enrollment is nudged at most once.

begin;

-- ---------------- idempotency log ----------------
create table if not exists public.abandoned_cart_recovery (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments(id) on delete cascade,
  user_id       uuid,
  course_id     uuid,
  coupon_code   text,
  push_sent     boolean not null default false,
  email_sent    boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.abandoned_cart_recovery enable row level security;
-- No public policies: only the service role (edge function) touches this table.
drop policy if exists "Admins read cart recovery" on public.abandoned_cart_recovery;
create policy "Admins read cart recovery"
  on public.abandoned_cart_recovery for select
  using ((select public.is_current_user_admin()));

-- ---------------- recovery coupon ----------------
-- Code-based (not auto-applied) so only users who receive the nudge use it.
-- coupons.code has no unique constraint, so guard with NOT EXISTS.
insert into public.coupons (
  code, discount_type, discount_value, max_discount, min_order_amount,
  valid_from, valid_until, max_uses_per_user, current_uses,
  visibility, is_auto_applied, is_active, is_first_purchase_only, stackable,
  display_label, display_priority
)
select
  'COMEBACK10', 'percent', 10, 150, 349,
  now(), now() + interval '365 days', 1, 0,
  'public', false, true, false, false,
  'Comeback offer', 0
where not exists (select 1 from public.coupons where code = 'COMEBACK10');

-- ---------------- candidate finder ----------------
-- Returns abandoned checkouts in the 2h–48h window that haven't been nudged and
-- whose user has no completed enrollment for the same course.
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

-- ---------------- cron: every 30 minutes ----------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'recover-abandoned-carts') then
    perform cron.unschedule('recover-abandoned-carts');
  end if;
end$$;

select cron.schedule(
  'recover-abandoned-carts',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://qzrvctpwefhmcduariuw.supabase.co/functions/v1/recover-abandoned-enrollments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

commit;
