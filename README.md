

arketing and enrollment site for Unknown IITians — JEE, NEET and IITM BS prep. Users browse courses, enrol through Cashfree, and access materials in the connected student portal.

Production: https://www.unknowniitians.com
Student portal: https://ssp.unknowniitians.com

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS, shadcn/ui components
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Cashfree (INR payments), Resend (transactional email)
- React Router, TanStack Query

## Local setup

Requires Node 18+ and npm (bun works too — the lockfile is just convention).

```sh
git clone <repo-url>
cd UI-Main-Website
npm install
cp .env.example .env       # fill in the values below
npm run dev
```

The dev server runs on http://localhost:8080.

### Environment

Only three keys are needed in `.env`. They are read by Vite at build time, so prefix them with `VITE_`.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_*`, `RESEND_API_KEY`, etc.) live on the Supabase edge functions, not in this repo.

## Scripts

```sh
npm run dev         # vite dev server with HMR
npm run build       # production build
npm run build:dev   # build with development mode (sourcemaps, no minify)
npm run preview     # serve the production build locally
npm run lint        # eslint
```

## Layout

```
src/
  pages/            route components
  components/
    courses/        course detail, listing, configure flow
    coupons/        coupon engine UI (apply, sheet, offers list)
    dashboard/      student dashboard (post-login)
    admin/          /admin/dashboard tabs (CRUD + reports)
    ui/             shadcn primitives
  hooks/            useAuth, useEnrollmentStatus, etc.
  integrations/
    supabase/       generated types + client
  utils/            seoManager, format helpers
supabase/
  functions/        edge functions (see below)
  migrations/       SQL migrations
```

## Edge functions

Payment-critical work lives in Supabase edge functions, not the browser. The webhook is the source of truth — never trust amount/status from the client.

- `create-cashfree-order` — creates a Cashfree order, recomputes amount + coupon discount server-side
- `cashfree-webhook` — primary payment status path; idempotent via `processPaymentEvent`
- `verify-cashfree-payment` — polled fallback for the redirect flow
- `validate-coupon`, `list-eligible-coupons` — coupon engine; see `_shared/coupon-engine.ts`
- `add-to-google-group`, `bulk-sync-google-group` — post-enrolment access provisioning
- `reconcile-payments` — sweeps stuck orders against Cashfree
- `get-youtube-playlist` — pulls free-lecture metadata

## Admin

`/admin/dashboard` is gated by the `admin_users` table. Add an email row to grant access. Super-admins (set `is_super_admin = true`) get the Employees and Admin Management tabs in addition to everything else.

Admins manage: courses, page banners, course FAQs, batch schedule, coupons, notes, PYQs, study groups, communities, news, important dates, jobs. Read-only views cover users, enrollments, payments, and coupon redemptions, all CSV-exportable.

All admin actions happen inside the dashboard — the public site has no inline edit UI.

## Payments

The site uses Cashfree for ₹ payments. The webhook (`cashfree-webhook`) is the only thing that flips an enrolment to a paid state; the redirect-page polling exists for UX, not correctness. `processPaymentEvent` in `supabase/functions/_shared/` is idempotent and the single place where enrolments, coupon redemptions, and email triggers fire.

If a payment looks stuck, check `payment_processor_log` and `cashfree_webhook_events` for the order ID before re-running `reconcile-payments`.

## Deployment

Frontend is a static Vite build. Push to `main` triggers the host's auto-deploy.

Database migrations live under `supabase/migrations/`. Apply via the Supabase CLI or the Management API. Edge functions are deployed independently from `supabase/functions/`.

## Contributing

Commits attributed to a personal handle (see git log for convention). Type-check (`npx tsc --noEmit`) and lint before pushing. There is no formal PR template — keep commits scoped and write descriptive messages.
