-- Allow coupons to be deleted without orphaning the enrollment payment record.
-- coupon_code + discount_amount are denormalized on enrollments, so dropping
-- the FK link still preserves the historical "which coupon was used" record.
-- coupon_redemptions still uses ON DELETE RESTRICT, so admins can't delete a
-- coupon that has actually been redeemed.

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_coupon_id_fkey;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_coupon_id_fkey
  FOREIGN KEY (coupon_id)
  REFERENCES public.coupons(id)
  ON DELETE SET NULL;
