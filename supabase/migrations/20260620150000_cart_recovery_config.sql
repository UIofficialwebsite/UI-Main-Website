-- Admin-editable cart-recovery config.
--
-- A single-row table the admin dashboard edits and the recover-abandoned-
-- enrollments function reads. `enabled` is the on/off switch (replaces the
-- CART_RECOVERY_ENABLED env flag); `min_coupon_amount` is the threshold: carts
-- at/above it get the coupon, carts below it get a plain incomplete-enrolment
-- reminder with no discount.

begin;

create table if not exists public.cart_recovery_config (
  id                smallint primary key default 1,
  enabled           boolean not null default false,
  min_coupon_amount numeric not null default 349,
  coupon_code       text not null default 'COMEBACK10',
  updated_at        timestamptz not null default now(),
  constraint cart_recovery_config_singleton check (id = 1)
);

insert into public.cart_recovery_config (id) values (1) on conflict (id) do nothing;

alter table public.cart_recovery_config enable row level security;

drop policy if exists "Admins manage cart recovery config" on public.cart_recovery_config;
create policy "Admins manage cart recovery config"
  on public.cart_recovery_config for all
  using ((select public.is_current_user_admin()))
  with check ((select public.is_current_user_admin()));

-- The threshold now gates whether the coupon is sent at all, so the coupon
-- itself needs no minimum (it's only ever issued to carts above the threshold).
update public.coupons set min_order_amount = 0 where code = 'COMEBACK10';

commit;
