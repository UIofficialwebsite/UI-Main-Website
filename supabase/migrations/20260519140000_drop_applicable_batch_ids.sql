-- ============================================================
-- Drop coupons.applicable_batch_ids
-- ============================================================
-- The original plan distinguished "courses" from "batches", but in this
-- codebase the `courses` table holds what's called "batches" in marketing
-- copy — there is no separate batches table. The coupon engine only ever
-- reads `applicable_course_ids`, so this column was dead weight.
ALTER TABLE public.coupons DROP COLUMN IF EXISTS applicable_batch_ids;
