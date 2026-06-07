# Web Push — Setup & Deployment

Browser push notifications. Visitors opt in from the profile menu
("Enable notifications"); admins broadcast from **Admin → Outreach → Push
Notifications**.

## Moving parts

| Piece | Location |
| --- | --- |
| Service worker push/click handlers | `public/sw.js` |
| Client subscribe/unsubscribe | `src/utils/webPush.ts`, `src/hooks/usePushNotifications.tsx` |
| Opt-in UI | `src/components/PushNotificationToggle.tsx` (in the navbar profile menu) |
| Storage + RPCs | `supabase/migrations/20260608120000_web_push.sql` |
| Send endpoint | `supabase/functions/send-push/index.ts` |
| Admin composer | `src/components/admin/PushNotificationsManagerTab.tsx` |

## VAPID keys

Web Push authenticates with a VAPID keypair (not any platform token). The
**public** key is shipped to browsers (safe to expose); the **private** key
signs each push and must live only as an edge-function secret.

The public key is baked into `src/utils/webPush.ts` (override with the
`VITE_VAPID_PUBLIC_KEY` env var if you rotate it).

## Deploy steps

1. **Apply the migration** (creates `push_subscriptions` + the two RPCs):

   ```bash
   supabase db push
   # or run supabase/migrations/20260608120000_web_push.sql via the SQL editor
   ```

2. **Set the edge-function secrets** (the private key is NOT in the repo):

   ```bash
   supabase secrets set \
     VAPID_PUBLIC_KEY="BHuMovIYXDCzRpdK17ZyvVPHA9PD0DSmEVgS5mKgN_VXgxAppSU3Q510_FnOp7p8sYGTS2ssDwDssv1jNwZO4uQ" \
     VAPID_PRIVATE_KEY="<paste the private key — see below>" \
     VAPID_SUBJECT="mailto:you@unknowniitians.com"
   ```

   The private key was generated alongside the public one. If you've lost it,
   regenerate the pair with `npx web-push generate-vapid-keys` and update both
   the secret and `VITE_VAPID_PUBLIC_KEY` / the fallback in `webPush.ts`.

3. **Deploy the function:**

   ```bash
   supabase functions deploy send-push
   ```

4. **Frontend** deploys with the normal Vercel build. The service worker only
   registers in production (`import.meta.env.PROD`), so test push on a deployed
   build (or `npm run build && npm run preview`), not the dev server.

## Activation (kill switch)

Sending is **off by default**. The `send-push` function refuses to send unless
the `PUSH_ENABLED` secret is exactly `"true"`. Subscriptions are still collected
while it's off — only the actual sending is blocked. To go live:

```bash
supabase secrets set PUSH_ENABLED=true
```

To pause sending again, set it to `false` (or unset it).

## Notes

- Subscriptions support both signed-in (`user_id` set) and anonymous visitors.
- Dead endpoints (HTTP 404/410) are pruned automatically on the next send.
- iOS only delivers Web Push to home-screen-installed PWAs (iOS 16.4+).
