# Share Tracking — Build Spec

A YouTube-style personalized share system for Unknown IITians: every share mints
a tracked link, shared links show rich previews, and we record who shared what +
how many clicks each share drove.

**In scope (now):** smart links + tracking, rich link previews, share buttons
(with destination), admin analytics.
**Out of scope (deferred):** Refer & Earn / rewards, embeds, QR codes,
leaderboard.

---

## 0. The lifecycle this implements
`smart link → great preview → easy share → tracked click → (later) conversion`

---

## 1. Data model (Supabase / Postgres)

```sql
-- One row per share LINK minted.
create table public.shares (
  id              uuid primary key default gen_random_uuid(),
  token           text not null unique,          -- short code used in /s/<token>
  sharer_user_id  uuid references auth.users(id),-- who shared (null = anonymous)
  content_type    text not null,                 -- 'note'|'pyq'|'iitm_note'|'course'|'tool'|'page'
  content_id      text,                          -- id/slug of the shared item (nullable for generic pages)
  title           text,                          -- snapshot of the title (for previews + admin)
  target_url      text not null,                 -- absolute URL /s/<token> redirects to
  channel         text,                          -- 'whatsapp'|'telegram'|'copy'|'webshare'|'x' (sharer's chosen app, if known)
  created_at      timestamptz not null default now()
);
create index shares_sharer_idx  on public.shares (sharer_user_id);
create index shares_content_idx on public.shares (content_type, content_id);
create index shares_created_idx on public.shares (created_at desc);

-- One row per OPEN of a /s/<token> link (the real "spread" signal).
create table public.share_clicks (
  id                 uuid primary key default gen_random_uuid(),
  share_id           uuid references public.shares(id) on delete cascade,
  token              text not null,
  clicked_by_user_id uuid,        -- if the visitor is logged in (best-effort)
  referrer           text,
  user_agent         text,
  ip_hash            text,        -- SHA-256 of IP (privacy/DPDP) for de-dupe & abuse only
  is_bot             boolean not null default false, -- preview crawler vs human
  created_at         timestamptz not null default now()
);
create index share_clicks_share_idx   on public.share_clicks (share_id);
create index share_clicks_created_idx on public.share_clicks (created_at desc);
```

### RLS
```sql
alter table public.shares       enable row level security;
alter table public.share_clicks enable row level security;

-- Reads: admins only (powers the admin analytics tab).
create policy "Admins read shares"
  on public.shares for select using ((select public.is_current_user_admin()));
create policy "Admins read share clicks"
  on public.share_clicks for select using ((select public.is_current_user_admin()));

-- Writes happen ONLY through SECURITY DEFINER functions / the service role
-- (the /s redirect). No direct client insert policies.
```

### Token-minting RPC (client-callable, anon + authenticated)
```sql
create or replace function public.create_share(
  p_content_type text,
  p_content_id   text,
  p_title        text,
  p_target_url   text,
  p_channel      text default null
) returns text                       -- returns the token
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  -- 8-char url-safe token; retry on the (astronomically unlikely) collision.
  loop
    v_token := substr(replace(replace(encode(gen_random_bytes(8),'base64'),'/','_'),'+','-'), 1, 10);
    begin
      insert into public.shares (token, sharer_user_id, content_type, content_id, title, target_url, channel)
      values (v_token, auth.uid(), p_content_type, p_content_id, left(p_title, 200), p_target_url, p_channel);
      return v_token;
    exception when unique_violation then
      -- loop and retry
    end;
  end loop;
end; $$;

revoke all on function public.create_share(text,text,text,text,text) from public;
grant execute on function public.create_share(text,text,text,text,text) to anon, authenticated;
```

> Abuse guard: add a lightweight rate check inside `create_share` later if needed
> (e.g., max N tokens/user/hour). Not critical at launch.

---

## 2. The `/s/<token>` redirect (the heart of it)

A **Vercel serverless function** at `api/s/[token].ts` so the public URL stays
clean: `https://unknowniitians.com/s/Xy7Qa2`. (Add a `vercel.json` rewrite
`/s/(.*) -> /api/s/$1` if needed.) It must be fast and work for crawlers.

**Behavior on GET `/s/:token`:**
1. Look up `shares` by token (Supabase REST with the anon key, or a read RPC).
   - Not found → 302 to `/` (or a friendly "link expired" page).
2. Detect **bot vs human** from the User-Agent (`facebookexternalhit`,
   `WhatsApp`, `Telegram(Bot)?`, `Twitterbot`, `LinkedInBot`, `Slackbot`, etc.).
3. **Log the click** → insert `share_clicks` (token, share_id, referrer, UA,
   `ip_hash` = sha256(ip), `is_bot`). Use a service-role write or a definer RPC
   `log_share_click(...)`.
4. **If bot** → return a tiny HTML page with **Open Graph tags** for that content
   (so the preview renders) + a `<meta http-equiv="refresh">` fallback. Do NOT
   redirect bots (they need the HTML).
5. **If human** → set a first-touch cookie `ui_ref=<token>` (for later
   attribution, Phase 3) and **302 redirect** to `target_url` with `?ref=<token>`
   appended.

**Why server-side:** preview crawlers and instant redirect both need real HTML /
HTTP responses — a client-side React redirect can't serve OG tags to bots and is
slower.

---

## 3. Rich link previews (Open Graph)

A shared link only shows a thumbnail/title in WhatsApp/Telegram if the fetched
URL returns OG tags to the (JS-less) crawler.

**3a. Preview for `/s/<token>` links** — handled by step 4 above: the function
returns per-content OG tags:
```html
<meta property="og:title"       content="IITM BS — Maths 1 Foundation Notes (Week-wise PDFs)">
<meta property="og:description" content="Free week-by-week notes from Unknown IITians.">
<meta property="og:image"       content="<auto-generated image URL>">
<meta property="og:url"         content="<target_url>">
<meta name="twitter:card"       content="summary_large_image">
```

**3b. Auto-generated OG image (the "YouTube thumbnail")** — reuse **Cloudinary**
(already in the stack). Overlay the content title onto a branded template image
via Cloudinary URL transformations, e.g.:
```
https://res.cloudinary.com/dkywjijpv/image/upload/
  l_text:Arial_48_bold:<URL-ENCODED TITLE>,co_white,w_900,c_fit/
  fl_layer_apply,g_north_west,x_60,y_60/
  <BRANDED_TEMPLATE_PUBLIC_ID>.png
```
→ every shared link gets a designed preview with **no new infra**.

**3c. (Related) direct content URLs** — when someone shares a raw
`/courses/:id` or notes URL (not via `/s/`), it also needs OG tags. That requires
per-route OG injection (bot-detection function or prerender) — this overlaps with
the SEO/prerender work and can be done in the same pass.

---

## 4. Share button component

`src/components/share/ShareButton.tsx` — drop-in on notes, courses, tools, pages.

**Props:** `{ contentType, contentId, title, path }` (path = the canonical
content URL to redirect to).

**Buttons:** WhatsApp · Telegram · Copy link · (More → Web Share API on mobile).

**On click (per button):**
1. `const token = await supabase.rpc('create_share', { p_content_type, p_content_id, p_title, p_target_url: absUrl(path), p_channel })`
2. Build short URL: `https://unknowniitians.com/s/${token}`.
3. Open the chosen channel with prefilled text:
   - WhatsApp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shortUrl)}`
   - Telegram: `https://t.me/share/url?url=${shortUrl}&text=${text}`
   - Copy: `navigator.clipboard.writeText(shortUrl)` + toast "Link copied".
   - More: `navigator.share({ url: shortUrl, title, text })`; on resolve log `channel:'webshare'`.

**Destination capture:** because these are *our* buttons, we know the channel
(WhatsApp/Telegram/Copy/…) and store it on the share — the "shares by service"
breakdown YouTube shows.

**Prompt at peak moments:** render ShareButton right after a notes download,
after a calculator result, and on course pages — not buried in a menu.

---

## 5. Admin analytics

New read-only tab **Reports → Shares** (mirror `DownloadLogsViewTab`):
- Stat cards: total shares · total clicks · clicks-per-share · top channel.
- Table: most-shared content (joins on `content_type`/`content_id`).
- Breakdown: **shares by channel** (WhatsApp/Telegram/Copy/…).
- Filter by content type + date; CSV export.
- (Phase 3 adds: signups/enrolments attributed to shares.)

Driven by simple `group by` queries over `shares` / `share_clicks`.

---

## 6. Attribution to signup/enrolment — Phase 3 (noted, not built now)

To later credit a share with a *conversion* (without Refer & Earn rewards yet):
1. `/s` redirect already sets first-touch cookie `ui_ref=<token>`.
2. On profile creation (the `handle_new_user` trigger or a post-signup client
   call), read `ui_ref` and write a `share_attributions(share_id, user_id)` row.
3. Enrolments by that user can then be traced back to the originating share in the
   admin analytics.

This is the bridge a future Refer & Earn would reward on — built on the same
tables, so nothing here is throwaway.

---

## 7. Build order
1. **Migration**: `shares` + `share_clicks` + RLS + `create_share` + `log_share_click` RPCs.
2. **`api/s/[token].ts`** Vercel function: lookup → log click → bot-OG vs human-redirect.
3. **Cloudinary OG template** + image-URL helper.
4. **`ShareButton`** component + wire onto notes/courses/tools.
5. **Admin Shares tab**.
6. *(Later)* Phase 3 attribution; then Refer & Earn on top.

## 8. Open decisions (confirm before building)
- **Domain for short links:** `unknowniitians.com/s/<token>` (recommended, no new
  domain) vs a separate short domain.
- **`api/` functions on Vercel:** confirm the project allows adding a Vercel
  serverless function (`/api`) alongside the Vite SPA (it does, but verify the
  deploy setup). Alternative: a Supabase Edge Function with a Vercel rewrite.
- **OG template image:** need one branded background PNG uploaded to Cloudinary to
  overlay titles on.
- **Bot list:** finalize the User-Agent list for preview crawlers.
