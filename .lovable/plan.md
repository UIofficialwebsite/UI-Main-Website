

## Problem

The `handleFreeEnroll` function in `src/pages/CourseDetail.tsx` (line 172) only inserts a row into the `enrollments` table. It does **not** insert into the `payments` table. This is why free enrollments stopped appearing in payments.

The other two enrollment paths (`EnrollButton.tsx` and `BatchConfiguration.tsx`) correctly insert into both `enrollments` and `payments`.

## Root Cause

Line 212 in `CourseDetail.tsx`: when a course has no optional items and price is 0, it calls the local `handleFreeEnroll` which skips the payments insert entirely.

## Fix

Update `handleFreeEnroll` in `src/pages/CourseDetail.tsx` to also insert a record into the `payments` table, matching the pattern used in `EnrollButton.tsx`:

- Generate an `order_id` (e.g., `free_<timestamp>_<userId>`)
- Insert into `payments` with `amount: 0`, `net_amount: 0`, `status: 'success'`, `payment_mode: 'free'`, `customer_email`, `batch` (course title), and `courses` (subjects)
- Also collect phone number from profile for `customer_phone`

### File: `src/pages/CourseDetail.tsx`
- Expand the `handleFreeEnroll` function to:
  1. Fetch user profile for phone/email
  2. Insert into `enrollments` (existing)
  3. Insert into `payments` table with free enrollment data (new)

No database changes needed -- the `payments` table already supports this data shape.

