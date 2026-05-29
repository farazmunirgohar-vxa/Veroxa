# M023E — Team Upload Inbox Real Reads (with fixture fallback)

Lets the Team Upload Inbox display real `public.upload_submissions` rows when a
safe read mode is enabled, while always keeping the fixture/demo inbox as the
default and as the fallback. **Read-only. No team writes, no approve/reject in
Supabase, no storage, no AI.**

## Read mode / flag used

- Gate: `DATA_MODE === "supabase_readonly"` via `VITE_VEROXA_DATA_MODE`
  (`src/lib/data/dataMode.ts`, `isSupabaseReadonlyMode()`).
- Default is `"fixture"` → no network call is ever attempted.
- Client: the anon read-only handle from
  `getReadOnlySupabaseClient()` (`src/lib/supabase/supabaseReadOnlyClient.ts`),
  which exposes only `.from().select()` — no insert/update/delete/upsert,
  no storage, no auth mutation, and only the public anon key
  (`VITE_SUPABASE_ANON_KEY`). No service-role key anywhere.

## Where it runs

- Adapter: `src/lib/data/uploadSubmissionsReadOnly.ts` →
  `readUploadSubmissionsInbox()`.
- Page: `src/pages/team-upload-inbox.tsx` calls it once on mount inside a
  `useEffect`, only when `isSupabaseReadonlyMode()` is true.

## Table read

`public.upload_submissions` (schema from M024A migration).

A second best-effort read of `public.clients (id, display_name)` resolves the
restaurant label. If that read is blocked/unavailable, a generic
`Restaurant <short-id>` label is used instead — it never fails the inbox read.

## Fields selected

From `upload_submissions`:
`id, restaurant_id, category, priority, note, submitted_by_label, status, created_at`
— ordered by `created_at desc`, limited to 100 rows.

Mapped to the existing `DemoUploadSubmission` shape for rendering:

| UI field | Source |
|---|---|
| restaurant/client label | `clients.display_name` (or generic `Restaurant <id8>`) |
| category | `category` (coerced to a known value, else `other`) |
| priority | `priority` (coerced, else `use_anytime`) |
| kind (image/video) | derived: `short_video` → video, else image |
| file label | derived from category label (table never stores raw filenames) |
| client note | `note` (already sanitized at write time) |
| submitted time | formatted from `created_at` |
| status | `status` (coerced, else `received`) |

`restaurant_id` (UUID) is carried only for structural compatibility; it is not
rendered. Triage on a live row updates **in-memory React state only** — no DB
write happens (writes are out of scope for this step).

## Fallback behavior

`readUploadSubmissionsInbox()` never throws. It returns `status: "live"` **only**
when the client is available, the query succeeds, and ≥1 row maps successfully.
Every other path returns a non-live status with an empty list, so the page keeps
showing fixtures + session uploads:

- `skipped` — DATA_MODE is fixture (default). No query attempted.
- `fallback` — missing Supabase env, client init failure, query error, RLS block,
  empty result, or unmappable rows.

Fixtures are a **true fallback**: when a live read succeeds, the inbox shows the
live rows plus this browser session's real uploads, and the demo fixtures drop
out. When no live rows are available, the demo fixtures remain so the inbox is
never empty.

No raw DB error text is shown to the team. When live rows are present, a subtle
sky-toned line (`banner-live-uploads-readonly`) notes the count and that triage is
in-memory only.

## RLS assumptions

- With `AUTH_MODE = "placeholder"` there is no authenticated Supabase session, so
  dev-stage RLS will usually block reads → the adapter returns `fallback` and the
  fixture inbox stays active.
- The inbox can show real rows only where the dev-stage RLS policies allow anon
  `select` on `upload_submissions` (and optionally `clients`). Production RLS must
  be tightened before launch; this step does not change any policy.

## What remains fixture

- Default mode (no env / `fixture`) → 100% fixtures + session uploads.
- `clients` display-name lookup falls back to generic labels when blocked.
- Triage actions (In Review / Accept / Needs Better Photo / Save for Later) never
  persist for live rows — they are in-memory only.
- All client-facing pages are unchanged.
- All the AI preview/content-intelligence panels on the page still use the
  existing demo repository data.

## What this step does NOT do

- No team writes, no approve/reject persisted to Supabase.
- No storage / file bytes.
- No AI / OpenAI calls.
- No auth, RLS, schema, or pricing changes.

## Next step after this

Team write-back for triage decisions (status updates / `team_review_decisions`)
behind the same dev-write flag and central write adapter — only after the
read path is confirmed stable. Storage upload and AI remain later, staged
milestones (see `docs/AI_MEDIA_PIPELINE_PLAN.md`).
