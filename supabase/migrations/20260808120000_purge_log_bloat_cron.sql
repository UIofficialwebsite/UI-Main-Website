-- 1) Immediate: clear stale cron run history (pure logs, 100% safe).
delete from cron.job_run_details where end_time < now() - interval '14 days';

-- 2) Daily retention cron (03:00) so these log tables never grow unbounded.
--    payment_processor_log kept 120 days (payment audit); adjust if you want longer.
select cron.unschedule(jobid) from cron.job where jobname = 'purge-log-bloat';
select cron.schedule('purge-log-bloat', '0 3 * * *', $purge$
  delete from cron.job_run_details where end_time < now() - interval '14 days';
  delete from public.tool_usage_logs where created_at < now() - interval '180 days';
  delete from public.payment_processor_log where created_at < now() - interval '120 days';
$purge$);
