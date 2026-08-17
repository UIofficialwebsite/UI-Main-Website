-- A coupon may be redeemed once per student per batch/course. The course is
-- recorded on the redemption itself so both validation and payment settlement
-- can enforce this atomically without relying on a mutable enrollment join.

ALTER TABLE public.coupon_redemptions
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id);

UPDATE public.coupon_redemptions redemption
SET course_id = enrollment.course_id
FROM public.enrollments enrollment
WHERE enrollment.id = redemption.enrollment_id
  AND redemption.course_id IS NULL;

ALTER TABLE public.coupon_redemptions
  ALTER COLUMN course_id SET NOT NULL;

DROP INDEX IF EXISTS public.coupon_redemptions_user_coupon_idx;

CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_user_coupon_course_idx
  ON public.coupon_redemptions (coupon_id, user_id, course_id);

CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_coupon_id      UUID,
  p_user_id        UUID,
  p_course_id      UUID,
  p_enrollment_id  UUID,
  p_order_id       TEXT,
  p_discount       NUMERIC,
  p_final          NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated INTEGER;
BEGIN
  UPDATE public.coupons
     SET current_uses = current_uses + 1,
         updated_at   = now()
   WHERE id = p_coupon_id
     AND (max_total_uses IS NULL OR current_uses < max_total_uses)
     AND is_active = TRUE;

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RETURN FALSE;
  END IF;

  BEGIN
    INSERT INTO public.coupon_redemptions
      (coupon_id, user_id, course_id, enrollment_id, order_id, discount_amount, final_amount)
    VALUES
      (p_coupon_id, p_user_id, p_course_id, p_enrollment_id, p_order_id, p_discount, p_final);
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.coupons
       SET current_uses = GREATEST(current_uses - 1, 0)
     WHERE id = p_coupon_id;
    RETURN FALSE;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(UUID, UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC) TO service_role;
