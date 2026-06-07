-- Web Push notifications.
--
-- Stores one row per browser push subscription (a unique endpoint URL plus the
-- p256dh / auth keys the browser hands us). A subscription may belong to a
-- logged-in user (user_id set) or an anonymous visitor (user_id null). The
-- send path runs as the service role and bypasses RLS; clients never read or
-- write this table directly — they go through the two SECURITY DEFINER RPCs
-- below so anonymous visitors can subscribe without any table-level grants.

begin;

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Admins can read subscriptions (powers the admin "Notifications" tab count).
-- Wrapped in (select ...) so the SECURITY DEFINER fn runs once per query, not
-- per row — see project-supabase-perf.
drop policy if exists "Admins read push subscriptions" on public.push_subscriptions;
create policy "Admins read push subscriptions"
  on public.push_subscriptions for select
  using ((select public.is_current_user_admin()));

-- ------------------------------------------------------------------
-- save_push_subscription: upsert by endpoint, attach to current user.
-- Granted to anon + authenticated so signed-out visitors can subscribe.
-- ------------------------------------------------------------------
create or replace function public.save_push_subscription(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, last_seen)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, p_user_agent, now())
  on conflict (endpoint) do update
    set user_id    = auth.uid(),
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        user_agent = excluded.user_agent,
        last_seen  = now();
end;
$$;

-- ------------------------------------------------------------------
-- delete_push_subscription: remove a subscription by endpoint.
-- ------------------------------------------------------------------
create or replace function public.delete_push_subscription(
  p_endpoint text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text) from public;
revoke all on function public.delete_push_subscription(text) from public;
grant execute on function public.save_push_subscription(text, text, text, text) to anon, authenticated;
grant execute on function public.delete_push_subscription(text) to anon, authenticated;

commit;
