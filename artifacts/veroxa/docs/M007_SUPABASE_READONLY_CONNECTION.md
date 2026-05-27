# M007 — Supabase Read-Only Portal Connection (Dev)

## Purpose

M007 is the first real Veroxa build step after demo stabilization. It
introduces a **safe, controlled, read-only** connection layer between the
Veroxa frontend and the **dev** Supabase project, without changing how
the portal looks or behaves for ordinary use.

The portal still ships in fixture mode by default. Real Supabase reads
only activate when an operator explicitly sets a new environment switch.

## What was connected

- A new **DATA_MODE** switch (separate from AUTH_MODE).
- A read-only adapter that wraps the existing `client_portal_*` view
  queries with safe `{ ok, source, data, error }` results.
- A health/readiness checker that performs a single harmless read.
- An internal Owner-guarded diagnostic page at
  `/demo/internal/supabase-readiness`.
- Integration of the data-mode switch into `useClientPortalData`,
  including automatic fallback to fixtures on any failure.
- A small, internal-only data-source badge on the client dashboard
  that appears only when something other than pure fixture mode is in
  play.

## What remains fixture-only

- All Team, Operator, and Owner portals.
- Notifications and client health snapshots — no client-safe views exist.
- All write operations (none have been added).
- Uploads, AI calls, publishing, and payments — none have been added.

## DATA_MODE vs AUTH_MODE

| Switch | Controls | Default | Values |
|--------|----------|---------|--------|
| `AUTH_MODE` | How the user signs in | `placeholder` | `placeholder` \| `real` |
| `DATA_MODE` | Where portal data comes from | `fixture`     | `fixture` \| `supabase_readonly` |

They are intentionally **independent**.

- `AUTH_MODE = placeholder` + `DATA_MODE = fixture` — current default.
  Portal runs entirely on bundled demo data. No network calls.
- `AUTH_MODE = placeholder` + `DATA_MODE = supabase_readonly` — M007
  diagnostic mode. The portal attempts read-only view queries; RLS
  will almost certainly block them under placeholder auth, so the
  adapter falls back to fixtures cleanly.
- `AUTH_MODE = real`  — pre-existing path, unchanged by M007.

Set the data mode by adding to `.env.local`:

```bash
VITE_VEROXA_DATA_MODE=supabase_readonly
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Any other value resolves to `fixture`.

## Why they are separate

Flipping `AUTH_MODE` to `real` has wide blast-radius — it enables
session persistence, OAuth, and user-profile lookups everywhere.
We are not ready for that. `DATA_MODE` is narrow: it only changes
the **read source** of the client portal, and only after preflight
env checks. This lets us run a real Supabase smoke test in
production-shaped code paths without touching auth.

## RLS safety

- All M007 reads go through the existing **client-safe views**
  (`client_portal_*`) only. No base-table reads. See
  `docs/PORTAL_QUERY_SAFETY_PLAN.md`.
- M007 does **not** disable, weaken, or bypass any RLS policy.
- When RLS blocks a read (very likely under placeholder auth), the
  adapter returns the canonical message:
  *"Supabase read blocked by RLS or missing authenticated session.
  Fixture fallback remains active."*
- Empty result sets are treated as blocked and trigger the same
  fixture fallback.

## What M007 does NOT do

- ❌ No writes / inserts / updates / deletes / upserts.
- ❌ No uploads to Supabase Storage.
- ❌ No OpenAI / Anthropic / Gemini / external AI APIs.
- ❌ No publishing API calls.
- ❌ No Stripe / PayPal / checkout / billing.
- ❌ No service-role key in the frontend.
- ❌ No production database connection.
- ❌ No new `supabase/migrations/` files.
- ❌ No change to `AUTH_MODE`.
- ❌ No change to pricing.
- ❌ Does not bypass `InternalDemoGuard`.

## How to test

### Fixture mode (default)

1. Remove (or leave unset) `VITE_VEROXA_DATA_MODE`.
2. Open any client portal page — runs from fixtures, no network calls.
3. Owner can open `/demo/internal/supabase-readiness` to confirm:
   `DATA_MODE = fixture`, last read test = *not attempted*.

### Supabase read-only mode

1. Set `VITE_VEROXA_DATA_MODE=supabase_readonly` in `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your **dev**
   Supabase project.
3. Restart the dev workflow so the env vars are picked up.
4. Open `/demo/internal/supabase-readiness` (sign in as owner).
   - With no authenticated session, expect the read test to come back
     **blocked** (RLS), and the fixture fallback active.
   - Confirm warnings show the AUTH/DATA mode mismatch.
5. Open the client dashboard — the small internal data-source line
   should read either *Preview data source: Supabase read-only* (if
   rows came back) or *Preview data source: Fixture (Supabase read
   fell back)*.

### Expected fallback behaviour

| Scenario | Source shown | UI impact |
|----------|--------------|-----------|
| Env vars missing | `fallback` | Fixtures shown, no error visible to client |
| RLS blocks read | `fallback` | Fixtures shown, no error visible to client |
| Network error  | `fallback` | Fixtures shown, console warning logged |
| Read returns rows | `supabase_readonly` | Real rows shown |

The client UI never displays raw error messages or stack traces.

## Next safe build step after M007

- M007b: extend coverage to a second portal area (e.g. media library)
  under the same DATA_MODE switch.
- M008: provision a real test user in dev Supabase, sign in via the
  existing login page, and verify the same flows succeed with an
  authenticated session (RLS unblocked).
- Only after M008 do we revisit whether `AUTH_MODE` should flip.

## Files added in M007

- `src/lib/data/dataMode.ts`
- `src/lib/data/supabaseReadOnlyData.ts`
- `src/lib/supabase/supabaseHealth.ts`
- `src/pages/internal-supabase-readiness.tsx`
- `docs/M007_SUPABASE_READONLY_CONNECTION.md` (this file)

## Files modified in M007

- `src/App.tsx` — added `/demo/internal/supabase-readiness` route.
- `src/hooks/useClientPortalData.ts` — added DATA_MODE branching with
  fallback handling and `dataSourceMessage`.
- `src/pages/client-dashboard.tsx` — added small data-source line
  (visible only in non-fixture modes).
- `docs/BUILD_STATUS.md` — recorded M007.

---

*Last updated: May 2026.*
