-- Homepage promo popup: replaces the floating announcement arrow with a modal
-- that appears on site open. Each row = a poster image (optional), a link, and a
-- custom button label. If no image, the link (a YouTube video) is embedded.
-- Newest first; the popup auto-scrolls through active rows.

create table if not exists public.homepage_popups (
  id          uuid primary key default gen_random_uuid(),
  image_url   text,                                   -- poster (optional)
  link_url    text not null,                          -- button target + video embed source
  button_text text not null default 'Watch Now',      -- custom button label
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.homepage_popups enable row level security;

drop policy if exists "public read active popups" on public.homepage_popups;
create policy "public read active popups" on public.homepage_popups
  for select using (is_active = true);

drop policy if exists "admins manage popups" on public.homepage_popups;
create policy "admins manage popups" on public.homepage_popups
  for all using ((select public.is_current_user_admin())) with check ((select public.is_current_user_admin()));

grant select on public.homepage_popups to anon, authenticated;
grant insert, update, delete on public.homepage_popups to authenticated;
