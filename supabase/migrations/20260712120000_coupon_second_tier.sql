alter table public.coupons
  add column if not exists tier2_above_amount   numeric,
  add column if not exists tier2_discount_value numeric;

comment on column public.coupons.tier2_above_amount is
  'When the cart total is strictly ABOVE this amount, tier2_discount_value is used instead of discount_value.';
