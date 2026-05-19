-- ============================================================
-- PAYMENT PROCESSOR LOG — per-call observability
-- ============================================================
-- One row per processPaymentEvent invocation. Lets us answer:
--   * Which trigger (webhook / return_url / cron) handled each order?
--   * How long did processing take?
--   * What was the Cashfree-reported status?
--   * Did the email send?
--   * Was there an error?
--
-- Service role only. Frontend never reads this. Safe to truncate later.

create table if not exists public.payment_processor_log (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  source text not null check (source in ('webhook', 'return_url', 'cron')),
  result text,
  final_status text,
  cashfree_order_status text,
  cf_payment_id text,
  amount numeric,
  payment_mode text,
  email_sent boolean,
  error_message text,
  duration_ms integer,
  created_at timestamptz default now()
);

create index if not exists payment_processor_log_order_id_idx
  on public.payment_processor_log (order_id);
create index if not exists payment_processor_log_source_created_idx
  on public.payment_processor_log (source, created_at desc);
create index if not exists payment_processor_log_created_idx
  on public.payment_processor_log (created_at desc);

alter table public.payment_processor_log enable row level security;

drop policy if exists "Service role full access" on public.payment_processor_log;
create policy "Service role full access"
  on public.payment_processor_log for all to service_role
  using (true) with check (true);

comment on table public.payment_processor_log is
  'Per-call audit log of processPaymentEvent. Records which trigger (webhook/return_url/cron) handled each order, the Cashfree status seen, the result, timing, and any error. Used for observability of payment flow health.';
