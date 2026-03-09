

## Plan: Require Phone Number for Free Enrollment in CourseDetail

### Problem
The `handleFreeEnroll` in `CourseDetail.tsx` directly enrolls users without asking for their phone number, unlike the paid flow which uses `EnrollButton`'s phone verification dialog.

### Solution
Instead of duplicating the phone dialog UI in `CourseDetail.tsx`, the fix is simpler: for free courses without addons, use the `EnrollButton` component's existing flow which already handles phone verification for both free and paid courses.

### Changes

#### `src/pages/CourseDetail.tsx`
- Remove the local `handleFreeEnroll` function entirely
- Remove the `enrolling` state variable
- Stop setting `customEnrollHandler` for free courses (let the default `EnrollButton` handle it)
- The `EnrollButton` inside `EnrollmentCard` already knows how to handle free courses with phone verification

#### `src/components/courses/detail/EnrollmentCard.tsx`
- Check current code to confirm `EnrollButton` is used and receives `coursePrice` correctly so it can distinguish free vs paid
- Remove `enrolling` prop if no longer needed

#### `src/components/courses/detail/MobileEnrollmentBar.tsx`
- Same: confirm `EnrollButton` usage, remove `enrolling` prop if unused

### How it works after the change
- Free course with no addons → no `customEnrollHandler` set → `EnrollmentCard` renders its default `EnrollButton` → `EnrollButton` checks phone → shows dialog if missing → enrolls with phone number → inserts into both `enrollments` and `payments`

