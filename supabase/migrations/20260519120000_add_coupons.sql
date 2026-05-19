-- ============================================================
-- Coupon engine: coupons + coupon_redemptions
-- See coupon-implementation-plan for full rationale.
-- One flexible schema covers public, personalised, batch-specific,
-- cohort, prev-enrolled and time-windowed coupons.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                        TEXT NOT NULL,
  discount_type               TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value              NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount                NUMERIC(10, 2),
  min_order_amount            NUMERIC(10, 2) NOT NULL DEFAULT 0,

  valid_from                  TIMESTAMPTZ,
  valid_until                 TIMESTAMPTZ,

  max_total_uses              INTEGER,
  max_uses_per_user           INTEGER NOT NULL DEFAULT 1,
  current_uses                INTEGER NOT NULL DEFAULT 0,

  applicable_course_ids       UUID[],
  applicable_batch_ids        UUID[],
  applicable_user_ids         UUID[],
  user_segment                TEXT CHECK (user_segment IN ('new', 'returning', 'prev_enrolled')),
  min_prev_enrollments        INTEGER,
  prev_enrolled_within_days   INTEGER,

  visibility                  TEXT NOT NULL DEFAULT 'private'
                              CHECK (visibility IN ('public', 'private', 'auto_suggest')),
  is_auto_applied             BOOLEAN NOT NULL DEFAULT FALSE,
  display_label               TEXT,
  display_priority            INTEGER NOT NULL DEFAULT 0,

  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  is_first_purchase_only      BOOLEAN NOT NULL DEFAULT FALSE,
  stackable                   BOOLEAN NOT NULL DEFAULT FALSE,

  created_by                  UUID,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_lower_idx
  ON public.coupons (lower(code));

CREATE INDEX IF NOT EXISTS coupons_active_visible_idx
  ON public.coupons (is_active, visibility) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id         UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  user_id           UUID NOT NULL,
  enrollment_id     UUID,
  order_id          TEXT,
  discount_amount   NUMERIC(10, 2) NOT NULL,
  final_amount      NUMERIC(10, 2) NOT NULL,
  redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One redemption per user per coupon
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_user_coupon_idx
  ON public.coupon_redemptions (coupon_id, user_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_user_idx
  ON public.coupon_redemptions (user_id);

-- ============================================================
-- Atomic redemption helper.
-- Returns the row count on success (1) or 0 if the coupon is
-- exhausted / already redeemed by this user. Edge functions call
-- this from verify-cashfree-payment so the counter increment and
-- the duplicate-redemption guard happen in one statement.
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  p_coupon_id      UUID,
  p_user_id        UUID,
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
  -- Atomic: only succeeds when room remains under max_total_uses
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

  -- UNIQUE(coupon_id, user_id) prevents double-redeem races
  BEGIN
    INSERT INTO public.coupon_redemptions
      (coupon_id, user_id, enrollment_id, order_id, discount_amount, final_amount)
    VALUES
      (p_coupon_id, p_user_id, p_enrollment_id, p_order_id, p_discount, p_final);
  EXCEPTION WHEN unique_violation THEN
    -- Roll back the counter increment if redemption row collides
    UPDATE public.coupons
       SET current_uses = GREATEST(current_uses - 1, 0)
     WHERE id = p_coupon_id;
    RETURN FALSE;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC) TO service_role;

-- ============================================================
-- RLS — admins fully manage, users read only public/auto_suggest,
-- redemptions visible to the redeeming user, edge functions
-- bypass via service_role.
-- ============================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Service role manages coupons" ON public.coupons;
CREATE POLICY "Service role manages coupons"
  ON public.coupons FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anonymous + authenticated may read non-private, active coupons only.
-- This is intentional: it lets the frontend cheaply hint "Available Offers"
-- without an edge-function round-trip for the display list. Eligibility
-- is still computed server-side in list-eligible-coupons / validate-coupon.
DROP POLICY IF EXISTS "Public reads visible coupons" ON public.coupons;
CREATE POLICY "Public reads visible coupons"
  ON public.coupons FOR SELECT TO anon, authenticated
  USING (is_active = TRUE AND visibility IN ('public', 'auto_suggest'));

DROP POLICY IF EXISTS "Users read own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users read own redemptions"
  ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins read all redemptions"
  ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Service role manages redemptions" ON public.coupon_redemptions;
CREATE POLICY "Service role manages redemptions"
  ON public.coupon_redemptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- Enrollment tracking columns for coupons.
-- ============================================================
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS coupon_id        UUID REFERENCES public.coupons(id),
  ADD COLUMN IF NOT EXISTS coupon_code      TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10, 2);
