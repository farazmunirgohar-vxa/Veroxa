# M023C — Dev Supabase Write Adapter (disabled by default)

## Purpose

Introduce a real Supabase write adapter for **metadata only**, kept dormant
behind an explicit environment flag. This unblocks future work that needs
real persistence (M023D and beyond) without changing demo behavior or
introducing any production risk in this build.

## Env flag

- `VITE_VEROXA_ENABLE_DEV_WRITES`
- Only the **exact** string `"true"` enables dev writes.
- Missing, `"false"`, `"TRUE"`, `"1"`, `"yes"` → writes stay **disabled**.
- Constant: `DEV_WRITES_ENV_FLAG` in `src/lib/data/writeReadiness.ts`.

## Default behavior

- `CURRENT_WRITE_MODE = "disabled"`.
- `WRITES_ENABLED = false`.
- `veroxaWriteAdapter = disabledWriteAdapter`.
- Pages continue to use `localUploadStore` / `localDirectionStore` /
  session state. Demo flows behave exactly as before M023C.

## Write mode logic

`getWriteMode()` returns one of:

- `"dev_supabase_writes"` — only when the env flag is exactly `"true"`.
- `"disabled"` — otherwise.

`writeAdapter.ts` reads the mode at module load and selects:

- `devSupabaseWriteAdapter` when `dev_supabase_writes`
- `disabledWriteAdapter` when `disabled`

Page components import `veroxaWriteAdapter` — they never pick an
adapter directly.

## `devSupabaseWriteAdapter` functions

All functions: `assertWritesAllowed()` → map input → anon-client write
→ safe-mapped `WriteResult<T>`.

- `createUploadSubmission(input)` → `INSERT upload_submissions`
- `createDirectionRequest(input)` → `INSERT direction_requests`
- `updateUploadReviewStatus(input)` → `UPDATE upload_submissions.status`
- `updateDirectionStatus(input)` → `UPDATE direction_requests.status`
- `createTeamReviewDecision(input)` → `INSERT team_review_decisions`

## `writeMappers`

`src/lib/data/writeMappers.ts` centralizes input → row mapping. No
network. Notes are sanitized as defense-in-depth:

- emails → `[redacted-email]`
- phone-like sequences → `[redacted-phone]`
- `@handles` → `[redacted-handle]`
- length capped at 500 chars

No raw filenames, no file data, no base64.

## `writeErrors`

`src/lib/data/writeErrors.ts` converts raw errors to client-safe
`WriteFailureResult` envelopes:

- `toSafeWriteFailure(error, context)`
- `safeWriteFailure(message, retryable)`

Raw Supabase / Postgres error text is **never** returned to the caller.
A short non-sensitive `console.warn` (code only) aids dev visibility.
Codes `42P01`, `42501`, `23xxx`, `http_400/401/403/404/422` are marked
non-retryable.

## What writes are allowed

- `supabase.from("upload_submissions").insert(...)`
- `supabase.from("direction_requests").insert(...)`
- `supabase.from("team_review_decisions").insert(...)`
- `.update({ status })` on `upload_submissions` / `direction_requests`

Only inside `devSupabaseWriteAdapter.ts`.

## What writes are NOT allowed

- Supabase Storage uploads
- Service role usage in the frontend
- Raw file blobs / base64 storage
- `FormData` or `fetch` upload endpoints
- External AI (OpenAI / Anthropic / Gemini)
- Publishing APIs (Meta / Instagram / TikTok / Google)
- Ad platform APIs
- Payments (Stripe / PayPal / checkout)
- Page-component direct `supabase.from(...).insert/update/upsert/delete`
- Active migrations in `supabase/migrations/`

## Why storage is separate

File storage requires bucket setup, signed-URL infra, RLS for storage,
and review workflow integration. Keeping metadata-only writes isolated
in M023C lets us validate the write surface area, error envelopes, and
table contracts before adding any binary upload path. Storage is a
separate later milestone.

## What happens if tables don't exist

If the env flag is set in a dev environment that has no schema yet,
calls return a safe `failure` envelope (`safeMessage`, `retryable:
false` for `42P01 undefined_table`). The app does not crash and pages
continue to work on their local/session stores.

## How pages should behave

- Local/session stores remain the source of truth in this build.
- No page in this build was switched to depend on Supabase writes.
- A future build (M023D) may opportunistically call
  `veroxaWriteAdapter` **after** local/session success, swallowing
  failures so the demo flow never breaks.

## Next safe step

- M023D — schema migration approval and controlled dev table creation,
  or connect adapter to selected pages after schema exists.
- Storage upload is a later, separate milestone.
