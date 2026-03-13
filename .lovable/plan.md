

## Plan: Post-Enrollment Redirect to SSP Portal

### Problem
After enrollment (free or paid), users stay on the current site. The user wants an automatic redirect to `ssp.unknowniitians.com` with a transitional "Redirecting to Study Portal" screen showing a loading dots animation.

### Approach

**1. Create a new `/redirect-to-portal` page** (`src/pages/RedirectToPortal.tsx`)
- Full-screen centered layout with the UI logo, "Redirecting to Study Portal..." text, and the existing dot-pulse loading animation
- Auto-redirects to `https://ssp.unknowniitians.com` after ~2.5 seconds via `window.location.href`
- Clean, minimal design matching existing modal styles

**2. Update free enrollment in `EnrollButton.tsx`**
- After successful free enrollment (toast + event dispatch), navigate to `/redirect-to-portal` instead of staying on the page

**3. Update free enrollment in `BatchConfiguration.tsx`**
- After `handleFreeEnroll` succeeds, navigate to `/redirect-to-portal` instead of `/courses/${courseId}`

**4. Update paid enrollment redirect in `verify-cashfree-payment` edge function**
- On successful payment (`finalStatus === "success"`), redirect to `/redirect-to-portal` instead of `/dashboard?payment=success`
- Keep error/failed redirects going to `/dashboard?payment=error` or `/dashboard?payment=failed`

**5. Register the route in `App.tsx`**
- Add the `/redirect-to-portal` route

### Redirect Page Design
- White background, centered content
- UI logo at top
- "Redirecting to Study Portal..." text (Inter font, bold)
- Three-dot pulse animation (reusing existing CSS pattern from modals)
- Subtle fade-in entrance animation
- 2.5s delay before `window.location.href = "https://ssp.unknowniitians.com"`

### Files Changed
| File | Change |
|------|--------|
| `src/pages/RedirectToPortal.tsx` | New page component |
| `src/App.tsx` | Add route |
| `src/components/EnrollButton.tsx` | Navigate to `/redirect-to-portal` after free enroll |
| `src/pages/BatchConfiguration.tsx` | Navigate to `/redirect-to-portal` after free enroll |
| `supabase/functions/verify-cashfree-payment/index.ts` | Redirect success to `/redirect-to-portal` |

### What stays unchanged
- Phone verification flow
- Payment processing flow
- Enrollment status hooks
- Dashboard functionality
- Error handling paths

