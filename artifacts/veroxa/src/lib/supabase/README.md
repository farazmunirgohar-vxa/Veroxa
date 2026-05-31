# Veroxa — Supabase Data Access Layer

## Status

Read-only, anon key only. Wired into the Client Portal (via `useClientPortalData`) with static demo fallback. Team, Operator, and Owner portals are routed but remain on static demo data — no Supabase wiring for them yet.

---

## What this is

A minimal, read-only Supabase browser client for the Veroxa Client Portal. It provides typed query functions against the Supabase dev database using the public anon key only.

---

## What this is not

- **Not actively authenticated.** Real Supabase Auth wiring (`getSession`, `onAuthStateChange`, `user_profiles` lookup, gated `signInWithPassword` on `/login`) now **exists in code** but is **inactive by default**. It only runs when `AUTH_MODE` in `src/lib/auth/authMode.ts` is flipped from `"placeholder"` to `"real"` (manual decision, not yet taken). While `AUTH_MODE === "placeholder"`, all queries continue to run as the anon Supabase role and no Supabase Auth calls ever fire.
- **Wired to the Client Portal only, read-only.** The Client Portal uses `useClientPortalData` to read from Supabase when available, and falls back to static demo data otherwise. No other portal calls Supabase.
- **Not write-capable.** No insert, update, delete, or upsert operations are present. All query functions are SELECT only. The real-auth path is also strictly read-only — it only `select`s from `user_profiles`; it never creates users, never writes profiles, never stores tokens manually.
- **Not using the service role key.** The service role key must never be used in frontend code. Use only `VITE_SUPABASE_ANON_KEY`.

---

## Initialisation

The client reads two environment variables at runtime:

| Variable | Required |
|---|---|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Yes |

If either variable is missing, `getSupabaseClient()` returns `null` and logs a warning. The app will not crash — it will continue to use static demo data until credentials are provided.

Copy `.env.example` to `.env.local` and fill in your Supabase dev project values to activate the client. Do not commit `.env.local` or any file containing real credentials.

---

## Files

| File | Purpose |
|---|---|
| `env.ts` | Safe env var readers with missing-var detection |
| `client.ts` | Lazy singleton Supabase browser client |
| `clientPortalQueries.ts` | Read-only query functions for Client Portal |
| `index.ts` | Barrel export |

---

## Column names

Query functions map directly to the verified Supabase SQL schema columns. If a query returns an error or unexpected results, check the column names against `docs/database/migrations-draft/002_create_tables.sql` before debugging elsewhere.

---

## RLS note

If queries return empty results or permission errors, that is expected behaviour until Supabase Row Level Security read policies are configured. RLS policies are tracked in `docs/database/RLS_PLAN.md` and will be applied in a later phase.

---

## Portal wiring status

| Portal | Data source | Notes |
|---|---|---|
| **Client Portal** | Supabase with static fallback | Uses `useClientPortalData` hook — reads client, platforms, media assets, posts, post slots, weekly reports, monthly reports, and draft variants from Supabase; scheduled posts list is built from live post + draft_variant rows (caption_text joined via draft_variant_id); weekly update title and summary items are derived from the most recent `weekly_reports` row; monthly report preview title, status, and post counts come from the most recent `monthly_reports` row; static fallback remains active for all fields if Supabase is unavailable |
| Team Portal | Static demo data only | Not yet wired |
| Operator Portal | Static demo data only | Not yet wired |
| Owner Portal | Static demo data only | Not yet wired |

**Note:** Client Portal is now split into individual routed pages (`/demo/client/dashboard`, `/calendar`, `/google`, `/reports`, `/updates`) and uses the `useClientPortalData` hook with read-only Supabase access and static demo fallback. The public demo is limited to `/demo/client/dashboard` only. Deprecated/legacy Team Demo routes (`/demo/team/*`) have been removed. The real team workspace lives under guarded `/team/*` routes and still uses local review data only — no Supabase wiring has been added for it yet.

All connections are read-only and unauthenticated (anon key only).

**Login shell note:** `/login` exists as a polished access page with two sections — demo role cards routing to `/demo/*`, and a "Future Sign In" form gated by `AUTH_MODE` (`src/lib/auth/authMode.ts`). In placeholder mode (current setting) the form **does not authenticate**: submit calls `preventDefault()`, inputs are held in local component state only, and nothing is sent to Supabase Auth or any other service — no sessions, cookies, `localStorage` tokens, or JWT are created. In real mode (manual flip only) the form calls `supabase.auth.signInWithPassword` and shows a "Signed in" notice without redirecting — it never creates users, writes to `user_profiles`, or stores tokens manually. Real auth architecture is documented in [`../../../docs/AUTH_ARCHITECTURE_PLAN.md`](../../../docs/AUTH_ARCHITECTURE_PLAN.md).

**Auth draft SQL note:** A draft real-auth data model (`user_profiles` + `veroxa_user_role` enum), production SELECT-only RLS direction, and the V1 team assignment schema (`team_client_assignments`, see `docs/database/auth-draft/003_team_assignment_schema_draft.sql`) live under [`../../../docs/database/auth-draft/`](../../../docs/database/auth-draft/). **These files are not applied** to any Supabase project. Team / Operator / Owner portals remain static demo-only. The current frontend Supabase access remains anon read-only for the Client Portal demo. **No service role key, ever.** Real Supabase Auth is wired but inactive while `AUTH_MODE === "placeholder"` (see the Real Auth V1 session-layer note below).

**Auth shell note:** A frontend auth shell exists — `src/lib/auth/` (auth contract, placeholder hook, real hook, `useAuth` wrapper, `AUTH_MODE` toggle), `src/components/auth/RequireRole.tsx` (preview guard, reads `useAuth`), a gated Future Sign In form on `/login`, the `/auth-status` developer diagnostics page, and placeholder pages at `/client/dashboard`, `/team/tasks`, `/operator/overview`, `/owner/dashboard`. **Supabase Auth calls (`signInWithPassword`, `getSession`, `onAuthStateChange`) are wired but inactive** — they only fire when `AUTH_MODE === "real"`, which is **not** the current setting. While `AUTH_MODE === "placeholder"`, Supabase here remains anon read-only for the Client Portal demo only.

**Write draft note:** Planning for the first write surfaces now lives under [`../../../docs/database/write-draft/`](../../../docs/database/write-draft/) and [`../../../docs/FIRST_WRITE_SURFACE_PLAN.md`](../../../docs/FIRST_WRITE_SURFACE_PLAN.md). **No SQL has been applied.** The current frontend Supabase access remains anon read-only for the Client Portal demo. **No `INSERT` / `UPDATE` / `DELETE` / `UPSERT` functions exist anywhere in the app today.** Future writes require real auth, production RLS, and the `audit_logs` table to be in place first — see the plan doc for the full prerequisite list.

**Client Onboarding demo note:** A polished Client Onboarding demo exists at `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`). The form uses **local component state only** — no Supabase reads or writes, no API calls, no real upload handling (the menu upload area is a visual placeholder), no `localStorage`, no cookies. Submit shows "Demo only — onboarding is not saved yet." Supabase frontend access remains read-only.

**Media Library demo note:** A polished Media Library demo exists at `/demo/client/media` (`src/pages/client-media.tsx`). The drag-and-drop / file picker reads only file *names*, sizes, and MIME types into **local component state** — **no `fetch`, no `FormData`, no Supabase Storage, no API call, no database mutation, no `localStorage`, no cookies.** The "Choose Files — Coming Soon" button does not initiate a real upload. Supabase frontend access remains anon read-only for the Client Portal demo only.

**Onboarding & media draft docs:** Planning for the future onboarding write surface and the future media storage + metadata surface lives under [`../../../docs/database/onboarding-draft/`](../../../docs/database/onboarding-draft/) and [`../../../docs/database/media-draft/`](../../../docs/database/media-draft/). **No SQL applied. No Supabase Storage bucket has been created. No upload, mutation, or storage SDK code exists in the frontend.** The Supabase frontend client remains anon read-only for the Client Portal demo only.

**Docs index:** The full set of architecture, safety, and launch docs is indexed in [`../../../docs/README.md`](../../../docs/README.md). Frontend Supabase access is **read-only** for the Client Portal demo, no mutation functions exist, no Supabase Storage is used, and the real-auth code paths added in the Real Auth V1 session-layer pass remain **inactive** while `AUTH_MODE === "placeholder"`.

**Real Auth Manual Prep Pack note:** Five manual-prep docs now live under [`../../../docs/`](../../../docs/) and must be completed by hand in the Supabase dashboard before `AUTH_MODE` is flipped to `"real"`: [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](../../../docs/MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md), [`AUTH_TEST_USER_MATRIX.md`](../../../docs/AUTH_TEST_USER_MATRIX.md), [`AUTH_QA_CHECKLIST.md`](../../../docs/AUTH_QA_CHECKLIST.md), [`AUTH_ROLLBACK_PLAN.md`](../../../docs/AUTH_ROLLBACK_PLAN.md), [`AUTH_MODE_SWITCH_PLAN.md`](../../../docs/AUTH_MODE_SWITCH_PLAN.md). **Real auth remains inactive** until `AUTH_MODE` is changed. The frontend uses **only the Supabase anon key** — **no service role key, ever** — and **no writes** are ever issued.

**Real Auth V1 session-layer note:** `../auth/useRealAuth.ts` exists and uses this shared Supabase client to call `auth.getSession()` / `auth.onAuthStateChange` and read `user_profiles`. **It is inactive** unless `../auth/authMode.ts` is changed from `"placeholder"` to `"real"`. The frontend uses **only the Supabase anon key** (`VITE_SUPABASE_ANON_KEY`) — **no service role key, ever.** **No writes** of any kind. Sign-in on `/login` is gated behind `AUTH_MODE === "real"` and would only ever call `signInWithPassword`; it never creates users, writes to `user_profiles`, or stores tokens manually.

**Pre-auth readiness note:** Pre-auth readiness files (`../auth/authContract.ts`, `../realRoutes.ts`, `../demoRoutes.ts`, and the updated `../auth/usePlaceholderAuth.ts` + `../../components/auth/RequireRole.tsx`) exist to shape the codebase for future real auth. **They do not use Supabase Auth.** Supabase remains **anon read-only** for the Client Portal demo only. Internal demo protection (Team / Operator / Owner) is **planned but not implemented** — see [`../../../docs/INTERNAL_DEMO_PROTECTION_PLAN.md`](../../../docs/INTERNAL_DEMO_PROTECTION_PLAN.md) and [`../../../docs/ROUTE_VISIBILITY_STRATEGY.md`](../../../docs/ROUTE_VISIBILITY_STRATEGY.md).

**Restaurant Media Guidance Engine note:** The new media guidance system in [`../mediaGuidance.ts`](../mediaGuidance.ts) is **static / rule-based** and does **not** use Supabase. No guidance data is saved, no per-client profile is persisted, and the restaurant-type selector on `/demo/client/media` lives entirely in local React state. Future persistence is planned in [`../../../docs/database/media-draft/003_media_guidance_profile_draft.md`](../../../docs/database/media-draft/003_media_guidance_profile_draft.md) but no SQL has been applied.

---

## Next steps

1. Configure RLS read policies in the Supabase dev project
2. Wire `getClientById` and related queries into the Client Portal components, replacing static demo-data imports one by one
3. Add auth before expanding to Team, Operator, or Owner portals
