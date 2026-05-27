# M023A + M023B — Write Foundation Planning + Disabled Adapter

## Purpose

Prepare the codebase for future controlled Supabase writes for the
first real client, **without enabling writes** in this build. Two
parts:

- **M023A** — SQL / RLS / write-function planning files only. No
  migrations applied.
- **M023B** — TypeScript write-adapter interfaces and a disabled
  adapter so future code paths have a stable seam. No network calls.

## What was added

### SQL planning files (M023A)

Under `artifacts/veroxa/docs/sql-plan/` — planning only, not
migrations.

- `README.md` — rules of the folder.
- `M023A_FIRST_CLIENT_SCHEMA_PLAN.sql.txt` — proposed tables:
  `restaurants`, `restaurant_upload_keys`, `upload_submissions`,
  `media_assets`, `direction_requests`, `team_review_decisions`,
  `content_workflow_items`, `weekly_updates`. Columns, check
  constraints, index hints, audit notes, soft-delete notes.
- `M023A_RLS_POLICY_PLAN.md` — narrative RLS plan: upload-key
  session policies, client-safe read policies, team role policies,
  internal/admin policies, audit / read-only policies, failure
  behavior, open items before production.

### Write function spec (M023B)

- `M023B_WRITE_FUNCTION_SPEC.md` — contracts for
  `createUploadSubmission`, `createDirectionRequest`,
  `updateUploadReviewStatus`, `updateDirectionStatus`,
  `createTeamReviewDecision` — purpose, inputs, outputs, safety
  checks, failure behavior, gating.

### Write readiness updates (M023B)

`artifacts/veroxa/src/lib/data/writeReadiness.ts`

- `WRITES_ENABLED = false` (unchanged).
- New `WriteMode = "disabled" | "dev_supabase_writes"`.
- New `CURRENT_WRITE_MODE: WriteMode = "disabled"`.
- New `getWriteMode()` — locked to `"disabled"` this build; ignores
  any env flag intentionally.
- New `assertWritesDisabled()` — guard for call sites.
- New `getWriteSafetyBanner()` — shared banner copy.

### Write adapter types (M023B)

`artifacts/veroxa/src/lib/data/writeAdapterTypes.ts`

- Result envelopes: `WriteDisabledResult`, `WriteFailureResult`,
  `WriteSuccessResult<T>`, `WriteResult<T>`.
- Input types: `CreateUploadSubmissionInput`,
  `CreateDirectionRequestInput`, `UpdateUploadReviewStatusInput`,
  `UpdateDirectionStatusInput`, `CreateTeamReviewDecisionInput`.
- Adapter shape: `VeroxaWriteAdapter`.

### Disabled write adapter (M023B)

`artifacts/veroxa/src/lib/data/disabledWriteAdapter.ts`

- Implements `VeroxaWriteAdapter`.
- Every function returns
  `{ ok: false, status: "disabled", safeMessage, reason }`.
- No Supabase, no fetch, no network, no mutation, no file upload.

### Write adapter index (M023B)

`artifacts/veroxa/src/lib/data/writeAdapter.ts`

- `export const veroxaWriteAdapter = disabledWriteAdapter`.
- Comment: future M023C/M024 can swap this re-export behind an
  explicit env flag without churn at call sites.

## Pages now showing write-disabled messaging

Subtle one-liner under the existing demo banner, using
`getWriteSafetyBanner()`:

- `src/components/upload/RestaurantUploadFlow.tsx`
- `src/pages/client-direction-center.tsx`
- `src/pages/team-upload-inbox.tsx`
- `src/pages/team-direction-queue.tsx`

Local/session behavior is unchanged. No submit handlers were
rewritten to call the disabled adapter. The local stores
(`localUploadStore`, `localDirectionStore`) remain the only
persistence path.

## Internal readiness updates

`src/pages/internal-supabase-readiness.tsx` — Write Readiness card
now shows:

- Write mode: disabled
- Writes enabled: No
- Current adapter: `disabledWriteAdapter`
- Storage upload: not connected
- Service role in frontend: not allowed
- Real migrations: not created in this build
- Next step: controlled dev Supabase write adapter behind an
  explicit flag (M023C).

## What is still NOT connected

- No real Supabase writes / inserts / updates / deletes / upserts.
- No Supabase Storage upload.
- No real migrations under `supabase/migrations/`.
- No real auth (AUTH_MODE still `"placeholder"`).
- No OpenAI / Anthropic / Gemini / external AI.
- No Meta / Instagram / TikTok / Google publishing.
- No Meta / TikTok / Google Ads APIs.
- No Stripe / payments / billing.
- Owner / Operator portals not expanded.

## Next safe step

**M023C — controlled dev Supabase metadata writes behind an explicit
env flag, no storage upload yet.**

- Add `VITE_VEROXA_ENABLE_DEV_WRITES=false` (default).
- Add a `supabaseDevWriteAdapter` implementing the same
  `VeroxaWriteAdapter` interface.
- Switch `writeAdapter.ts` to pick adapter by `getWriteMode()`.
- Wire `createUploadSubmission` and `createDirectionRequest` first
  (metadata only — still no file upload).
- Storage upload (signed URLs to a private bucket) is a separate
  later build (M023E).
