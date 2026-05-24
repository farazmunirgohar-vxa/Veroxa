# Veroxa — Supabase Data Access Layer

## Status

Read-only, anon key only. Wired into the Client Portal (via `useClientPortalData`) with static demo fallback. Team, Operator, and Owner portals are routed but remain on static demo data — no Supabase wiring for them yet.

---

## What this is

A minimal, read-only Supabase browser client for the Veroxa Client Portal. It provides typed query functions against the Supabase dev database using the public anon key only.

---

## What this is not

- **Not authenticated.** No auth has been implemented yet. All queries run as the anon Supabase role.
- **Not wired to the UI.** The Client Portal still uses static demo-data imports. This layer is a foundation for a future swap.
- **Not write-capable.** No insert, update, delete, or upsert operations are present. All query functions are SELECT only.
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

**Note:** Client Portal is now split into individual routed pages (`/demo/client/dashboard`, `/calendar`, `/google`, `/reports`, `/updates`) and uses the `useClientPortalData` hook with read-only Supabase access and static demo fallback. Team, Operator, and Owner portals are also now split into individual routed demo pages (e.g. `/demo/team/tasks`, `/demo/operator/overview`, `/demo/owner/dashboard`, etc.), but still use **static demo data only** — no Supabase wiring has been added for them yet.

All connections are read-only and unauthenticated (anon key only).

**Login shell note:** `/login` exists as a polished access page with two sections — demo role cards routing to `/demo/*`, and a "Future Sign In" form UI shell (email + password inputs and a "Sign In — Coming Soon" button). The form **does not authenticate**: submit calls `preventDefault()`, inputs are held in local component state only, and nothing is sent to Supabase Auth or any other service. No sessions, cookies, localStorage tokens, or JWT are created. Real auth architecture is documented in [`../../docs/AUTH_ARCHITECTURE_PLAN.md`](../../docs/AUTH_ARCHITECTURE_PLAN.md).

**Auth draft SQL note:** A draft real-auth data model (`user_profiles` + `veroxa_user_role` enum), production SELECT-only RLS direction, and the V1 team assignment schema (`team_client_assignments`, see `docs/database/auth-draft/003_team_assignment_schema_draft.sql`) live under [`../../docs/database/auth-draft/`](../../docs/database/auth-draft/). **These files are not applied** to any Supabase project. Team / Operator / Owner portals remain static demo-only. The current frontend Supabase access remains anon read-only for the Client Portal demo. No service role key and no real auth are used yet.

**Auth shell note:** A frontend auth shell now exists — `src/lib/auth/` (placeholder types + hook), `src/components/auth/RequireRole.tsx` (preview guard), a Future Sign In form on `/login`, and placeholder pages at `/client/dashboard`, `/team/tasks`, `/operator/overview`, `/owner/dashboard`. **No Supabase Auth calls are used** — no `signIn`, `signInWithPassword`, `signInWithOtp`, `getSession`, `onAuthStateChange`, or `signOut`. Supabase here remains anon read-only for the Client Portal demo only.

**Write draft note:** Planning for the first write surfaces now lives under [`../../docs/database/write-draft/`](../../docs/database/write-draft/) and [`../../docs/FIRST_WRITE_SURFACE_PLAN.md`](../../docs/FIRST_WRITE_SURFACE_PLAN.md). **No SQL has been applied.** The current frontend Supabase access remains anon read-only for the Client Portal demo. **No `INSERT` / `UPDATE` / `DELETE` / `UPSERT` functions exist anywhere in the app today.** Future writes require real auth, production RLS, and the `audit_logs` table to be in place first — see the plan doc for the full prerequisite list.

**Client Onboarding demo note:** A polished Client Onboarding demo exists at `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`). The form uses **local component state only** — no Supabase reads or writes, no API calls, no real upload handling (the menu upload area is a visual placeholder), no `localStorage`, no cookies. Submit shows "Demo only — onboarding is not saved yet." Supabase frontend access remains read-only.

**Media Library demo note:** A polished Media Library demo exists at `/demo/client/media` (`src/pages/client-media.tsx`). The drag-and-drop / file picker reads only file *names*, sizes, and MIME types into **local component state** — **no `fetch`, no `FormData`, no Supabase Storage, no API call, no database mutation, no `localStorage`, no cookies.** The "Choose Files — Coming Soon" button does not initiate a real upload. Supabase frontend access remains anon read-only for the Client Portal demo only.

---

## Next steps

1. Configure RLS read policies in the Supabase dev project
2. Wire `getClientById` and related queries into the Client Portal components, replacing static demo-data imports one by one
3. Add auth before expanding to Team, Operator, or Owner portals
