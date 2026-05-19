-- ============================================================
-- PAYMENT ROBUSTNESS — PHASE 4: reconciliation cron
-- ============================================================
-- Schedules a pg_cron job to invoke reconcile-payments every 15 minutes.
-- pg_cron + pg_net are already enabled (see bulk-google-group-sync migration).
-- Uses the same app.settings.service_role_key GUC pattern.

-- Unschedule first (idempotent — safe to re-run).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'reconcile-pending-payments') then
    perform cron.unschedule('reconcile-pending-payments');
  end if;
end$$;

select cron.schedule(
  'reconcile-pending-payments',
  '*/15 * * * *',
  $$
  select
    net.http_post(
      url := 'https://qzrvctpwefhmcduariuw.supabase.co/functions/v1/reconcile-payments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
