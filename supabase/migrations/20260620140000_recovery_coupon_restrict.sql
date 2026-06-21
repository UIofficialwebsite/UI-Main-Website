-- Lock the recovery coupon to people we actually emailed.
--
-- COMEBACK10 was a public code, so anyone could type it at checkout — a revenue
-- leak. The coupon engine enforces applicable_user_emails ONLY when that list is
-- non-empty (case-insensitive match against the logged-in user's email). So we:
--   1) make it private (hidden from public offer lists), and
--   2) seed the allowlist with the people already emailed.
-- The recovery edge function then appends each new recipient's email via
-- allow_recovery_coupon_email() as it sends, so the code only ever works for
-- users who genuinely received the nudge.

begin;

update public.coupons
set visibility = 'private',
    is_active  = true,
    applicable_user_emails = (
      select array(
        select distinct lower(trim(e))
        from unnest(
          coalesce(applicable_user_emails, '{}'::text[])
          || array['karansinghania802@gmail.com', 'enchandra@gmail.com']
        ) as e
        where e is not null and trim(e) <> ''
      )
    )
where code = 'COMEBACK10';

-- Append one email to COMEBACK10's allowlist (normalized, de-duplicated).
create or replace function public.allow_recovery_coupon_email(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons
  set applicable_user_emails = (
    select array(
      select distinct lower(trim(e))
      from unnest(coalesce(applicable_user_emails, '{}'::text[]) || array[p_email]) as e
      where e is not null and trim(e) <> ''
    )
  )
  where code = 'COMEBACK10';
$$;

revoke all on function public.allow_recovery_coupon_email(text) from public, anon, authenticated;

commit;
