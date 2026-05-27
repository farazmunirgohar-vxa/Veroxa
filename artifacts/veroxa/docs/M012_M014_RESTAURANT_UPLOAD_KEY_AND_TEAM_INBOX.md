# M012–M014 — Restaurant Upload Key, App-Style Upload Flow, Team Upload Inbox

> Status: local/demo only. No real uploads, no Supabase writes, no
> storage calls, no AI, no publishing, no payments, no migrations.
> `AUTH_MODE=placeholder`, `DATA_MODE=fixture` (default).

## Purpose

Veroxa is not just a website/portal — it is also an app-style content
intake system. For our first 1–3 real restaurants, the single biggest
operational risk is that restaurant staff stop sending us photos and
videos. Anything that requires individual accounts, password resets,
or technical setup will collapse daily content flow.

The Restaurant Upload Key is the answer:

- One restaurant = one Upload Key.
- Any approved restaurant employee with that key can use the upload
  flow at `/upload`.
- No email, no password, no Supabase auth, no account creation for
  daily contributors.
- The Team Portal receives uploads in a clear Upload Inbox where they
  are triaged before moving to Media Review.

## Why restaurant upload keys exist

- Restaurant staff change frequently — individual accounts churn.
- Owners want to delegate, not manage logins.
- We need content flow today, not after onboarding everyone.
- We can still keep a single revocable key per restaurant.

## What the upload key allows

- Open the `/upload` flow for **one** restaurant.
- See restaurant name + a simple "access granted" confirmation.
- Pick a category, attach files, add an optional note + priority hint,
  and submit a local demo confirmation.

## What the upload key does NOT allow

- No access to Team, Operator, or Owner portals.
- No access to pricing, internal notes, financials, or analytics.
- No access to any other restaurant's data.
- No access to client account settings.
- No read access to past uploads or post performance.

## App-style upload flow (M013)

Mobile-first, five steps:

1. Choose content type (food photo, kitchen/prep, atmosphere, menu
   special, short video, other).
2. Select files (`image/*`, `video/*`, multiple allowed). Local
   preview only — file name, size, kind.
3. Add an optional context note.
4. Choose an optional priority/request (use anytime, use next, save
   for weekend, Google post, Reel idea).
5. Review and submit.

Submission generates a local demo ID (`UP-DEMO-xxx`) and a clear
confirmation that no real upload occurred.

## Team Upload Inbox (M014)

Route: `/demo/team/upload-inbox` (Team role, `InternalDemoGuard`).

- Groups submissions by restaurant.
- Shows category, priority/request hint, optional note, file label,
  submitted time, status.
- Local-only actions: Mark In Review, Accept for Content, Needs
  Better Photo, Save for Later.
- Cross-linked to Media Review — uploads enter the inbox first, then
  move to the existing Media Review surface.

## Files added

```
src/data/uploadKeys/demoRestaurantUploadKeys.ts   — demo keys + fixture
src/data/uploadKeys/demoUploadSubmissions.ts      — sample inbox items
src/lib/uploadKeys/uploadKeyAccess.ts             — pure utilities
src/components/upload/RestaurantUploadFlow.tsx    — 5-step app flow
src/pages/restaurant-upload-access.tsx            — /upload entry page
src/pages/team-upload-inbox.tsx                   — Team Upload Inbox
docs/M012_M014_RESTAURANT_UPLOAD_KEY_AND_TEAM_INBOX.md
```

## Files updated

```
src/App.tsx                  — route /upload (public) + /demo/team/upload-inbox (Team)
src/lib/teamPortalNav.ts     — "Upload Inbox" nav item
src/pages/demo-hub.tsx       — small Restaurant Upload card
src/pages/client-media.tsx   — "Open Restaurant Upload" callout
src/pages/team-media-review.tsx — cross-link note to Upload Inbox
docs/SERVICE_DEFINITION_SOURCE_OF_TRUTH.md — upload-key access note
docs/BUILD_STATUS.md         — M012–M014 entry
```

## Local/demo-only behaviour

- No `fetch`, no `FormData` submit, no Supabase Storage upload.
- No `supabase.from(...).insert/update/delete/upsert`.
- No AI APIs (OpenAI / Anthropic / Gemini) called.
- No publishing, no payments.
- File select reads only `name`, `size`, `type` for in-page preview.
- Submissions live in component state and reset on reload.
- Team inbox state lives in component state and resets on reload.

## Future real implementation plan

When we are ready to back this with real infrastructure:

- Database
  - `restaurant_upload_keys` — `key_hash`, `client_id`,
    `restaurant_id`, `status`, `created_at`, `revoked_at`,
    `rotated_at`, `created_by`.
  - `upload_sessions` / `upload_submissions` — `client_id`,
    `restaurant_id`, `category`, `priority`, `note`, `status`,
    `submitted_at`, `submitted_via_key_id`.
- Storage
  - Supabase Storage bucket, restaurant-scoped path,
    Edge-Function-issued signed upload URLs (never expose the service
    role key to the browser).
- API surface
  - `POST /upload-keys/resolve` — verify a key (hashed compare,
    rate-limited).
  - `POST /upload-sessions` — create a session, return a short-lived
    signed upload target.
  - On upload success, insert into `media_assets` and create a
    workflow item that lands in the Team Upload Inbox.
- Team workflow
  - Inbox actions write back to `upload_submissions.status` and emit
    audit log entries.
- Operational
  - Rate limit by `restaurant_id` + IP.
  - Key rotation/revocation in Owner/Operator portal.
  - Audit log for every key resolve, upload, and status change.

## Security notes

- Upload key resolves to a single `restaurant_id`. It must never grant
  access to private client data, financials, or other restaurants.
- Team/Operator/Owner roles must never log in via a restaurant key.
- Keys must be revocable and rotatable from Owner/Operator surfaces
  (not yet built).
- Uploaded media must be scoped to one restaurant and never visible
  cross-tenant.
- The Supabase **service role key** must never appear in frontend
  code. All privileged writes belong behind an Edge Function or
  server route.

## What is NOT connected yet

- No real Supabase Storage upload.
- No `media_assets` insert.
- No `restaurant_upload_keys` table or migration.
- No `upload_sessions` table or migration.
- No AI scoring of uploads.
- No publishing pipeline.
- No payments.
- No SMS/email notifications to staff or team.

## Invariants confirmed in this pass

- `AUTH_MODE` unchanged (`placeholder`).
- `DATA_MODE` default unchanged (`fixture`).
- `InternalDemoGuard` not bypassed; Team Upload Inbox sits behind
  `role="team"`.
- Pricing untouched.
- No files added under `supabase/migrations`.
- No `.insert/.update/.delete/.upsert/.upload` calls added.
- No service-role key referenced.
- No AI / publishing / payment integration added.
- Owner and Operator portals not expanded.
- `attached_assets/Pasted-*.txt` not committed.
