-- Share tracking: personalized share links + click logging.
--
-- A share button mints a token (create_share) → /s/<token>. The share-redirect
-- edge function resolves the token, logs a click, serves an OG preview to social
-- crawlers, and redirects humans to the content. See SHARE_TRACKING_SPEC.md.
--
-- target_url is stored as a RELATIVE PATH ("/courses/123"); the edge function
-- prepends the site origin. This makes open-redirect abuse impossible.

begin;

create table if not exists public.shares (
  id             uuid primary key default gen_random_uuid(),
  token          text not null unique,
  sharer_user_id uuid references auth.users(id),
  content_type   text not null,                 -- 'note'|'pyq'|'iitm_note'|'course'|'tool'|'page'
  content_id     text,
  title          text,
  target_url     text not null,                 -- relative path, must start with '/'
  channel        text,                          -- 'whatsapp'|'telegram'|'copy'|'webshare'|'x'
  created_at     timestamptz not null default now()
);
create index if not exists shares_sharer_idx  on public.shares (sharer_user_id);
create index if not exists shares_content_idx on public.shares (content_type, content_id);
create index if not exists shares_created_idx on public.shares (created_at desc);

create table if not exists public.share_clicks (
  id                 uuid primary key default gen_random_uuid(),
  share_id           uuid references public.shares(id) on delete cascade,
  token              text not null,
  clicked_by_user_id uuid,
  referrer           text,
  user_agent         text,
  ip_hash            text,
  is_bot             boolean not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists share_clicks_share_idx   on public.share_clicks (share_id);
create index if not exists share_clicks_created_idx on public.share_clicks (created_at desc);

alter table public.shares       enable row level security;
alter table public.share_clicks enable row level security;

drop policy if exists "Admins read shares" on public.shares;
create policy "Admins read shares"
  on public.shares for select using ((select public.is_current_user_admin()));

drop policy if exists "Admins read share clicks" on public.share_clicks;
create policy "Admins read share clicks"
  on public.share_clicks for select using ((select public.is_current_user_admin()));

-- Mint a share token. Granted to anon + authenticated. Rejects non-relative
-- target paths so the redirect can never point off-site.
create or replace function public.create_share(
  p_content_type text,
  p_content_id   text,
  p_title        text,
  p_target_url   text,
  p_channel      text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if p_target_url is null or left(p_target_url, 1) <> '/' then
    raise exception 'target_url must be a relative path starting with /';
  end if;

  loop
    -- 10 hex chars from a random uuid (built-in; avoids the pgcrypto dependency).
    v_token := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    begin
      insert into public.shares (token, sharer_user_id, content_type, content_id, title, target_url, channel)
      values (v_token, auth.uid(), p_content_type, nullif(p_content_id, ''), left(p_title, 200), p_target_url, p_channel);
      return v_token;
    exception when unique_violation then
      -- collision (astronomically rare) — retry
    end;
  end loop;
end;
$$;

revoke all on function public.create_share(text, text, text, text, text) from public;
grant execute on function public.create_share(text, text, text, text, text) to anon, authenticated;

-- Admin analytics aggregate (gated inside; powers the admin Shares tab).
create or replace function public.get_share_analytics()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_current_user_admin() then
    return jsonb_build_object('error','forbidden');
  end if;
  select jsonb_build_object(
    'total_shares', (select count(*) from public.shares),
    'total_clicks', (select count(*) from public.share_clicks),
    'human_clicks', (select count(*) from public.share_clicks where not is_bot),
    'by_channel', (select coalesce(jsonb_object_agg(channel, c),'{}'::jsonb)
                   from (select coalesce(channel,'unknown') channel, count(*) c from public.shares group by 1) x),
    'recent', (select coalesce(jsonb_agg(r),'[]'::jsonb) from (
        select jsonb_build_object(
          'id', s.id, 'title', s.title, 'content_type', s.content_type, 'channel', s.channel,
          'created_at', s.created_at,
          'clicks', (select count(*) from public.share_clicks c where c.share_id = s.id and not c.is_bot)
        ) r
        from public.shares s order by s.created_at desc limit 50
      ) z)
  ) into result;
  return result;
end; $$;
revoke all on function public.get_share_analytics() from public, anon;
grant execute on function public.get_share_analytics() to authenticated;

commit;
