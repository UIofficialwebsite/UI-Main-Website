-- ============================================================
-- SECURITY FIX: promotional_group_members data leak
-- ============================================================
-- The existing policy "Service role full access on promotional_group_members"
-- was misconfigured with roles = {public} instead of {service_role}, making
-- all 5,366 student email rows readable by anyone holding the anon key.
--
-- This drops the broken policy and recreates it correctly scoped to
-- service_role only. Frontend never reads this table directly — it's
-- written by the claim_promotional_group_slot RPC and consumed by the
-- google-group-sync background jobs (both service-role contexts).

drop policy if exists "Service role full access on promotional_group_members"
  on public.promotional_group_members;

create policy "Service role full access on promotional_group_members"
  on public.promotional_group_members
  for all
  to service_role
  using (true)
  with check (true);
