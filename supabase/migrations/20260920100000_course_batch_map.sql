-- Maps a course on this website to the batch name used inside the ERP portal.
--
-- Today the two are joined by string equality: create-cashfree-order sets
-- payments.batch = courses.title, and the portal stores that same string in
-- user_enrollments.batch_name and on every content row. 29 of 32 live courses
-- already line up that way.
--
-- That works until someone renames a course. This table is the escape hatch:
-- when a row exists it wins, otherwise we fall back to courses.title, so
-- nothing has to be filled in for the current catalogue to keep working. It is
-- an override, not a requirement — and it is data an admin edits, never a
-- constant in the code.

create table if not exists public.course_batch_map (
  course_id       uuid primary key references public.courses (id) on delete cascade,
  erp_batch_name  text not null check (length(trim(erp_batch_name)) > 0),
  note            text,
  updated_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now()
);

comment on table public.course_batch_map is
  'Optional override for the course -> ERP batch name join. Absent row means use courses.title.';

alter table public.course_batch_map enable row level security;

-- The mapping is just a pair of names, both of which are already public (a
-- course title is on the course page). Reading it has to be open because the
-- Explore section resolves the batch name before calling the catalog.
drop policy if exists "Anyone can read the course batch map" on public.course_batch_map;
create policy "Anyone can read the course batch map"
  on public.course_batch_map
  for select
  using (true);

drop policy if exists "Admins manage the course batch map" on public.course_batch_map;
create policy "Admins manage the course batch map"
  on public.course_batch_map
  for all
  using      (exists (select 1 from public.admin_users au where au.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admin_users au where au.email = (auth.jwt() ->> 'email')));

-- Convenience: the batch name a given course should ask the catalog for.
create or replace function public.course_erp_batch(p_course_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select m.erp_batch_name from public.course_batch_map m where m.course_id = p_course_id),
    (select c.title          from public.courses         c where c.id        = p_course_id)
  );
$$;

grant execute on function public.course_erp_batch(uuid) to anon, authenticated, service_role;
