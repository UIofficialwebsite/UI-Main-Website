-- Security fix: country_codes and youtube_cache had RLS DISABLED *and* granted
-- the public `anon` role full write access (INSERT/UPDATE/DELETE/TRUNCATE). That
-- meant anyone with the public anon key (shipped in the client bundle) could
-- edit or wipe those tables. No private user data, but a real exposure.
--
-- Lock them to read-only for the public API. Writes still work from the server:
-- youtube_cache is written by the get-youtube-playlist edge function using the
-- service_role key, which bypasses RLS. country_codes is read-only reference
-- data (no app writes at all).

alter table public.country_codes enable row level security;
alter table public.youtube_cache  enable row level security;

revoke insert, update, delete, truncate, references, trigger on public.country_codes from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.youtube_cache  from anon, authenticated;

drop policy if exists "public read country_codes" on public.country_codes;
create policy "public read country_codes" on public.country_codes for select using (true);

drop policy if exists "public read youtube_cache" on public.youtube_cache;
create policy "public read youtube_cache" on public.youtube_cache for select using (true);
