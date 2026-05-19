-- ============================================================
-- Swap coupons.applicable_user_ids (uuid[]) for applicable_user_emails (text[])
-- ============================================================
-- Admins shouldn't need to look up auth.users UUIDs to target individuals or
-- cohorts. With emails, they can grant discounts even to people who haven't
-- signed up yet — the engine matches the email at validation time.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS applicable_user_emails TEXT[];

-- Best-effort backfill of any existing personal coupons.
UPDATE public.coupons c
   SET applicable_user_emails = sub.emails
  FROM (
    SELECT c2.id, array_agg(lower(u.email)) AS emails
      FROM public.coupons c2
      JOIN auth.users u
        ON u.id = ANY (c2.applicable_user_ids)
     WHERE c2.applicable_user_ids IS NOT NULL
       AND array_length(c2.applicable_user_ids, 1) > 0
     GROUP BY c2.id
  ) sub
 WHERE c.id = sub.id
   AND c.applicable_user_emails IS NULL;

ALTER TABLE public.coupons DROP COLUMN IF EXISTS applicable_user_ids;
