# M008 — Client Portal Read-Only Connection (Dev)

## Purpose

M008 builds directly on the M007 `DATA_MODE` switch and connects the
**individual Client Portal pages** to dev Supabase in **read-only**
mode. It does this by:

1. Defining UI-safe, normalized data types for every portal section.
2. Adding a defensive transform layer that strips internal fields.
3. Expanding the M007 adapter with per-section normalized functions.
4. Enhancing `useClientPortalData` with section-level status fields.
5. Dropping a small reusable `<DataSourceBadge />` into every client
   portal page so dev/QA can see, at a glance, whether each page is
   running on real reads or fixture fallback.
6. Extending the internal readiness page (`/demo/internal/supabase-readiness`)
   with a per-section coverage table.

It does **not** add writes, uploads, AI, publishing, or payment.
It does **not** change `AUTH_MODE`, pricing, or the InternalDemoGuard.

## Pages connected

| Page | Path | Real-read coverage | Behavior |
|------|------|--------------------|----------|
| Dashboard      | `/client-dashboard`      | Summary / counts / latest report | Already via hook (M007). Now shows badge. |
| Calendar       | `/client-calendar`       | Scheduled posts                  | Already via hook. Now shows badge. |
| Reports        | `/client-reports`        | Latest monthly preview           | Already via hook. Now shows badge. |
| Updates        | `/client-updates`        | Latest weekly update             | Already via hook. Now shows badge. |
| Weekly report  | `/client-weekly-report`  | Fixture (no client-safe view)    | Badge shown; demo banner unchanged. |
| Monthly report | `/client-monthly-report` | Fixture (no client-safe view)    | Badge shown; demo banner unchanged. |
| Media          | `/client-media`          | Fixture (no upload flow added)   | Badge shown; "Demo only — no real uploads" badge retained. |
| Requests       | `/client-requests`       | Fixture (no client-safe view)    | Badge shown. |

Pages keep working in **fixture mode** with no behavioral change.

## DATA_MODE behavior (recap from M007)

| `DATA_MODE`              | Behavior |
|--------------------------|----------|
| `fixture` (default)      | Pure fixtures. No network calls. `<DataSourceBadge />` renders nothing. |
| `supabase_readonly`      | Attempts reads via `client_portal_*` views. Falls back to fixtures on any RLS / env / network / empty-row condition. Badge renders "Supabase read-only" or "Fixture (Supabase read fell back)". |

## Fixture fallback behavior

Fallback is triggered when ANY of the following happens:

- `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.
- The Supabase client can't be initialised.
- A query throws (network, RLS, view missing, etc.).
- The combined result set is empty across all sections (treated as
  RLS-blocked under placeholder auth).

In every case the UI continues to render fixtures. Errors are never
shown to restaurant clients. A single `console.warn` is logged for
dev/QA.

## Tables / views read

All reads go through the existing **client-safe views** only — never
base tables. See `PORTAL_QUERY_SAFETY_PLAN.md`.

| Section | View |
|---------|------|
| Summary / account     | `client_portal_clients_view` |
| Platforms             | `client_portal_platforms_view` |
| Media library         | `client_portal_media_view` |
| Calendar / posts      | `client_portal_calendar_view` |
| Weekly reports        | `client_portal_weekly_reports_view` |
| Monthly reports       | `client_portal_monthly_reports_view` |
| Requests              | _no client-safe view — fixture-only_ |
| Updates / notifications | _no client-safe view — fixture-only_ |
| Google snapshot       | _no client-safe view — fixture-only_ |

If a section needs a field the view doesn't expose, the correct fix is
to **extend the view**, never to add a base-table read in the adapter.

## Client-safe transformation rules

`src/lib/data/clientPortalTransforms.ts` is the single place that maps
raw view rows into UI objects. It enforces:

- Trim long captions and summaries (~100–280 chars).
- Coerce missing/null fields to safe defaults — never `undefined`.
- Map internal review statuses to client-friendly labels
  (e.g. `in_review` → "Pending review").
- Strip every field listed below before it ever reaches the UI:
  `internal_note`, raw `rejection_reason`, staff `quality_score` /
  quality flags, `performed_by_user_id`, `approved_by_user_id`,
  `monthly_fee_cents`, `risk_status`, raw `old_value_json` /
  `new_value_json`, raw RLS / Postgres error details.

If a field is questionable, the transform omits it.

## RLS behavior

- M008 does not weaken, disable, or bypass any RLS policy.
- Under `AUTH_MODE = "placeholder"`, almost every read is expected to
  be RLS-blocked. The portal handles this gracefully (per above).
- No service-role key is referenced anywhere in frontend code.
- No SQL files are added under `supabase/migrations/`.

## What remains NOT connected

- All write paths (intentionally).
- Media uploads / Supabase Storage.
- AI calls (OpenAI / Anthropic / Gemini).
- Publishing / social APIs.
- Stripe / PayPal / billing.
- Notifications / updates / requests / Google snapshot reads — no
  client-safe view exists yet.
- Operator / Owner / Team portals — out of scope for M008.
- Real authenticated session — still pending M009 / future work.

## Testing steps

### 1. Fixture mode (default)

1. Leave `VITE_VEROXA_DATA_MODE` unset.
2. Open `/client-dashboard`, `/client-calendar`, `/client-media`,
   `/client-reports`, `/client-updates`, `/client-requests`,
   `/client-weekly-report`, `/client-monthly-report`.
3. Confirm: pages render exactly as before. **No data-source badge
   appears** anywhere.
4. As Owner, open `/demo/internal/supabase-readiness`. Confirm:
   - `DATA_MODE = fixture`
   - Last read test = *not attempted*
   - Coverage table shows every section as **Skipped** with the
     "DATA_MODE is fixture" reason.

### 2. supabase_readonly mode without authenticated session

1. Set in `.env.local`:
   ```
   VITE_VEROXA_DATA_MODE=supabase_readonly
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
2. Restart the dev workflow.
3. Open the readiness page. Expect:
   - Coverage table mostly **Fallback** (RLS-blocked) for sections that
     have views, **Skipped** for sections without client-safe views.
   - Warnings panel notes the AUTH/DATA mode mismatch.
4. Open the client portal pages. Each one should render fixtures, with
   a small **"Preview data source: Fixture (Supabase read fell back)"**
   badge underneath the title.

### 3. supabase_readonly mode with a valid dev session (future M009)

1. Sign in a real dev client user (this requires M009 wiring; not
   covered by this milestone).
2. With session active, repeat the readiness page check — expect rows
   to flip to **Live** for the sections backed by client-safe views.
3. Confirm the dashboard badge changes to **"Preview data source:
   Supabase read-only"**.

### 4. Fallback / safety behavior

- Manually invalidate `VITE_SUPABASE_URL` — pages should still render,
  badge should say "Fixture (Supabase read fell back)".
- Manually break the network — same behavior.
- Confirm no raw error messages or stack traces are shown anywhere in
  the client portal UI.

## Files added in M008

- `src/lib/data/clientPortalReadOnlyTypes.ts`
- `src/lib/data/clientPortalTransforms.ts`
- `src/components/DataSourceBadge.tsx`
- `docs/M008_CLIENT_PORTAL_READONLY_CONNECTION.md` (this file)

## Files modified in M008

- `src/lib/data/supabaseReadOnlyData.ts` — added 8 normalized
  `getClientPortal*ReadOnly` functions with `ReadOnlyEnvelope<T>` shape.
- `src/hooks/useClientPortalData.ts` — added `isReadOnlyLive` and
  `fallbackReason` fields.
- `src/pages/client-dashboard.tsx`, `client-calendar.tsx`,
  `client-reports.tsx`, `client-updates.tsx`, `client-media.tsx`,
  `client-requests.tsx`, `client-weekly-report.tsx`,
  `client-monthly-report.tsx` — added `<DataSourceBadge />`.
- `src/pages/internal-supabase-readiness.tsx` — added Client Portal
  Read-Only Coverage section.
- `docs/BUILD_STATUS.md` — recorded the M008 pass.

---

*Last updated: May 2026.*
