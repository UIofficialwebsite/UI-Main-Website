-- SEO step 6: programmatic IITM BS notes-subject pages.
--
-- Returns every (branch, level, subject) that has at least one ACTIVE note, so
-- the sitemap and the search-bot prerender (api/sitemap.ts, api/seo.ts) can list
-- and render one indexable page per subject — without generating thin/empty
-- pages for subjects that have no notes yet. Distinct + HAVING done server-side
-- to avoid PostgREST row-limit issues on the ~1.3k-row notes table.

create or replace function public.get_indexable_iitm_subjects()
returns table(branch text, level text, subject_name text, note_count bigint)
language sql stable security definer set search_path = public as $$
  select s.branch, s.level, s.subject_name,
         count(n.id) filter (where n.is_active) as note_count
  from public.iitm_bs_subjects s
  join public.iitm_branch_notes n on n.subject_id = s.id
  group by s.branch, s.level, s.subject_name
  having count(n.id) filter (where n.is_active) > 0
  order by s.branch, s.level, s.subject_name;
$$;

revoke all on function public.get_indexable_iitm_subjects() from public;
grant execute on function public.get_indexable_iitm_subjects() to anon, authenticated;
