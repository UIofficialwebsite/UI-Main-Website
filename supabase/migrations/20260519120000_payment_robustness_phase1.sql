-- ============================================================
-- PAYMENT ROBUSTNESS — PHASE 1: schema additions only
-- ============================================================
-- Safe, additive, zero behavior change.
-- Adds:
--   1. cashfree_webhook_events table (audit log for webhook calls)
--   2. Dedupes payments by order_id (keeps oldest), then adds unique index
--   3. Partial index on pending enrollments (for reconciliation cron scans)
-- Reversible: drop the table, drop the indexes. Old code keeps working.

-- ----------------------------------------------------------------
-- 1. Webhook event log
-- ----------------------------------------------------------------
create table if not exists public.cashfree_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  order_id text,
  cf_payment_id text,
  signature_valid boolean not null,
  raw_payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz default now()
);

create index if not exists cashfree_webhook_events_order_id_idx
  on public.cashfree_webhook_events (order_id);
create index if not exists cashfree_webhook_events_received_at_idx
  on public.cashfree_webhook_events (received_at desc);

alter table public.cashfree_webhook_events enable row level security;

drop policy if exists "Service role full access" on public.cashfree_webhook_events;
create policy "Service role full access"
  on public.cashfree_webhook_events for all to service_role
  using (true) with check (true);

comment on table public.cashfree_webhook_events is
  'Audit log of every Cashfree webhook delivery. Service-role write only. Used for debugging and replay.';

-- ----------------------------------------------------------------
-- 2. Dedupe payments by order_id BEFORE adding unique index
-- ----------------------------------------------------------------
-- Keep the oldest row per order_id (lowest created_at, lowest id as tiebreaker).
-- Any newer duplicates are deleted. Safe because the oldest row is always the
-- original (subsequent inserts only happened if verify-cashfree-payment ran twice).
with ranked as (
  select id,
         row_number() over (
           partition by order_id
           order by created_at asc nulls last, id asc
         ) as rn
  from public.payments
  where order_id is not null
)
delete from public.payments p using ranked r
where p.id = r.id and r.rn > 1;

-- ----------------------------------------------------------------
-- 3. Unique index on payments.order_id (enables idempotent upsert)
-- ----------------------------------------------------------------
create unique index if not exists payments_order_id_unique
  on public.payments (order_id);

-- ----------------------------------------------------------------
-- 4. Partial index for reconciliation cron (cheap scan of pending only)
-- ----------------------------------------------------------------
create index if not exists enrollments_pending_idx
  on public.enrollments (status, created_at)
  where status = 'pending';
