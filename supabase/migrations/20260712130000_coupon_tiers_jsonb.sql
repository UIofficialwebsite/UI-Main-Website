-- Unlimited discount tiers: [{"above": 399, "value": 10}, {"above": 999, "value": 15}]
-- discount_value stays the base rate (below the first threshold).
alter table public.coupons add column if not exists tiers jsonb not null default '[]'::jsonb;

comment on column public.coupons.tiers is
  'Optional extra discount tiers, e.g. [{"above":399,"value":10},{"above":999,"value":15}]. The highest threshold the cart total exceeds wins; below all thresholds discount_value applies.';

-- Migrate the existing single second tier into the new array.
update public.coupons
set tiers = jsonb_build_array(jsonb_build_object('above', tier2_above_amount, 'value', tier2_discount_value))
where tier2_above_amount is not null and tier2_discount_value is not null
  and coalesce(jsonb_array_length(tiers), 0) = 0;
