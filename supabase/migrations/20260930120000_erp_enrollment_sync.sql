-- Hourly safety net for payment -> ERP enrollments.
-- The on_payment_insert trigger posts to the ERP once and never retries, so any
-- payment made while the ERP was unreachable was lost. This job re-posts every
-- eligible successful payment until the ERP confirms it with HTTP 200. The ERP
-- receive-payment-webhook upserts with ignoreDuplicates, so re-posting is harmless.

create table if not exists public.erp_enrollment_sync (
  payment_id      uuid primary key references public.payments(id) on delete cascade,
  request_id      bigint,
  attempts        int not null default 0,
  last_attempt_at timestamptz,
  last_status     int,
  synced_at       timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.erp_enrollment_sync enable row level security;

create or replace function public.run_erp_enrollment_sync()
returns jsonb
language plpgsql
security definer
set search_path = public, net, pg_temp
as $$
declare
  v_confirmed int := 0;
  v_queued    int := 0;
  v_posted    int := 0;
  r record;
  v_req bigint;
begin
  -- 1. Read the ERP's reply to earlier posts.
  update erp_enrollment_sync s
     set last_status = h.status_code,
         synced_at   = case when h.status_code = 200 then now() else null end
    from net._http_response h
   where h.id = s.request_id and s.synced_at is null;
  get diagnostics v_confirmed = row_count;

  -- 2. Queue eligible payments not seen yet (skip the last 10 minutes: the
  --    insert trigger has just fired for those).
  insert into erp_enrollment_sync (payment_id)
  select p.id from payments p
   where p.status = 'success'
     and p.created_at > now() - interval '30 days'
     and p.created_at < now() - interval '10 minutes'
     and p.customer_email is not null and btrim(p.customer_email) <> ''
     and p.batch is not null and p.batch <> 'Unknown Batch'
     and p.courses is not null and p.courses <> 'No subjects'
     and p.order_id not like 'qs\_test\_%'
  on conflict (payment_id) do nothing;
  get diagnostics v_queued = row_count;

  -- 3. Post everything still unconfirmed: never tried, replied with an error, or
  --    no reply after 2 hours (reply purged or ERP down).
  for r in
    select s.payment_id, p.batch, p.courses, p.customer_email, p.status
      from erp_enrollment_sync s
      join payments p on p.id = s.payment_id
     where s.synced_at is null
       and p.created_at > now() - interval '30 days'
       and (s.request_id is null
            or s.last_status is distinct from 200 and s.last_status is not null
            or s.last_attempt_at < now() - interval '2 hours')
  loop
    select net.http_post(
      url     := 'https://lcfzfdjeidinenxcucvj.supabase.co/functions/v1/receive-payment-webhook',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := json_build_object('batch', r.batch, 'courses', r.courses,
                                   'customer_email', r.customer_email, 'status', r.status)::jsonb
    ) into v_req;
    update erp_enrollment_sync
       set request_id = v_req, attempts = attempts + 1,
           last_attempt_at = now(), last_status = null
     where payment_id = r.payment_id;
    v_posted := v_posted + 1;
  end loop;

  return jsonb_build_object('confirmed_or_updated', v_confirmed, 'queued', v_queued, 'posted', v_posted);
end;
$$;

revoke all on function public.run_erp_enrollment_sync() from public, anon, authenticated;

select cron.schedule('erp-enrollment-sync', '7 * * * *', $$select public.run_erp_enrollment_sync()$$);
