-- log_si_click now returns the new click id so the client can attach the user
-- to it after they log in (e.g. after a gated shared link forces login).
drop function if exists public.log_si_click(text, text, text);
create or replace function public.log_si_click(p_token text, p_ref text default null, p_ua text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_share uuid; v_sharer uuid; v_click uuid;
begin
  if p_token is null or length(p_token) < 6 then return null; end if;
  select id, sharer_user_id into v_share, v_sharer from public.shares where token = p_token;
  if v_share is null then return null; end if;
  if v_sharer is not null and v_sharer = auth.uid() then return null; end if; -- sharer's own click
  insert into public.share_clicks (share_id, token, clicked_by_user_id, referrer, user_agent, is_bot, source)
  values (v_share, p_token, auth.uid(), left(p_ref,400), left(p_ua,400), false, public.share_source_from_ref(p_ref))
  returning id into v_click;
  return v_click;
end; $$;
revoke all on function public.log_si_click(text, text, text) from public;
grant execute on function public.log_si_click(text, text, text) to anon, authenticated;

-- Attach the now-logged-in user to a previously anonymous click.
create or replace function public.attach_si_click(p_click uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_sharer uuid;
begin
  if p_click is null or auth.uid() is null then return; end if;
  select s.sharer_user_id into v_sharer
    from public.share_clicks c join public.shares s on s.id = c.share_id
    where c.id = p_click;
  -- Sharer opening their own link then logging in: drop the anonymous row.
  if v_sharer is not null and v_sharer = auth.uid() then
    delete from public.share_clicks where id = p_click and clicked_by_user_id is null;
    return;
  end if;
  update public.share_clicks set clicked_by_user_id = auth.uid()
    where id = p_click and clicked_by_user_id is null;
end; $$;
revoke all on function public.attach_si_click(uuid) from public;
grant execute on function public.attach_si_click(uuid) to authenticated;

notify pgrst, 'reload schema';
