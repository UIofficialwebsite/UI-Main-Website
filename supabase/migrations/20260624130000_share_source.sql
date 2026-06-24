-- Share clicks: infer the SOURCE app/site from the click referrer, and surface
-- who shared / who clicked in the admin analytics.
--
-- Reality: WhatsApp & Telegram strip the referrer, so their clicks land as
-- 'direct'. Facebook/Instagram/X/LinkedIn/Google/web referrers are detectable.

begin;

alter table public.share_clicks add column if not exists source text;

-- Classify a referrer string into a coarse source.
create or replace function public.share_source_from_ref(ref text)
returns text language sql immutable as $$
  select case
    when ref is null or ref = ''               then 'direct'
    when ref ~* 'whatsapp|wa\.me'              then 'whatsapp'
    when ref ~* 't\.me|telegram'               then 'telegram'
    when ref ~* 'l\.instagram|instagram'       then 'instagram'
    when ref ~* 'l\.facebook|facebook|fb\.me|fb\.com' then 'facebook'
    when ref ~* 'linkedin|lnkd\.in'            then 'linkedin'
    when ref ~* 't\.co|twitter|x\.com'         then 'x'
    when ref ~* 'youtube|youtu\.be'            then 'youtube'
    when ref ~* 'google\.'                     then 'google'
    when ref ~* 'bing\.'                       then 'bing'
    when ref ~* 'reddit'                       then 'reddit'
    when ref ~* 'unknowniitians'               then 'internal'
    else 'other'
  end;
$$;

-- Backfill existing rows.
update public.share_clicks set source = public.share_source_from_ref(referrer) where source is null;

-- Re-create log_si_click to also stamp the source (+ keep the self-click skip).
create or replace function public.log_si_click(p_token text, p_ref text default null, p_ua text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_share uuid; v_sharer uuid;
begin
  if p_token is null or length(p_token) < 6 then return; end if;
  select id, sharer_user_id into v_share, v_sharer from public.shares where token = p_token;
  if v_share is null then return; end if;
  if v_sharer is not null and v_sharer = auth.uid() then return; end if;
  insert into public.share_clicks (share_id, token, clicked_by_user_id, referrer, user_agent, is_bot, source)
  values (v_share, p_token, auth.uid(), left(p_ref, 400), left(p_ua, 400), false, public.share_source_from_ref(p_ref));
end; $$;
revoke all on function public.log_si_click(text, text, text) from public;
grant execute on function public.log_si_click(text, text, text) to anon, authenticated;

-- Analytics v2: add by_source, the sharer's email per share, and a recent-clicks
-- feed (who clicked + source).
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
    'by_source', (select coalesce(jsonb_object_agg(source, c),'{}'::jsonb)
                  from (select coalesce(source,'direct') source, count(*) c from public.share_clicks where not is_bot group by 1) y),
    'recent', (select coalesce(jsonb_agg(r),'[]'::jsonb) from (
        select jsonb_build_object(
          'id', s.id, 'title', s.title, 'content_type', s.content_type, 'channel', s.channel,
          'created_at', s.created_at,
          'shared_by', (select p.email from public.profiles p where p.id = s.sharer_user_id),
          'clicks', (select count(*) from public.share_clicks c where c.share_id = s.id and not c.is_bot)
        ) r
        from public.shares s order by s.created_at desc limit 50
      ) z),
    'recent_clicks', (select coalesce(jsonb_agg(r),'[]'::jsonb) from (
        select jsonb_build_object(
          'created_at', c.created_at,
          'source', coalesce(c.source,'direct'),
          'clicked_by', (select p.email from public.profiles p where p.id = c.clicked_by_user_id),
          'title', (select s.title from public.shares s where s.id = c.share_id)
        ) r
        from public.share_clicks c where not c.is_bot order by c.created_at desc limit 50
      ) z)
  ) into result;
  return result;
end; $$;
revoke all on function public.get_share_analytics() from public, anon;
grant execute on function public.get_share_analytics() to authenticated;

commit;
