# M023 — Supabase Writes Plan (Uploads + Direction + Team Review)

The next build that will introduce **controlled, dev-only Supabase
writes**, behind an explicit feature flag. This plan does NOT add any
writes itself; it scopes what M023 will do.

## Status

- **M023A — SQL / RLS / write function planning.** Complete. See
  `docs/sql-plan/` (`README.md`, `M023A_FIRST_CLIENT_SCHEMA_PLAN.sql.txt`,
  `M023A_RLS_POLICY_PLAN.md`, `M023B_WRITE_FUNCTION_SPEC.md`).
  Files live under `docs/sql-plan/` on purpose — none of them are
  active migrations and none of them live in `supabase/migrations/`.
- **M023B — Disabled write adapter.** Complete. See
  `src/lib/data/writeAdapterTypes.ts`,
  `src/lib/data/disabledWriteAdapter.ts`,
  `src/lib/data/writeAdapter.ts`,
  and the extended `src/lib/data/writeReadiness.ts`
  (`CURRENT_WRITE_MODE = "disabled"`).
- **Writes still off.** `WRITES_ENABLED = false`,
  `CURRENT_WRITE_MODE = "disabled"`. No migrations created. No
  Supabase Storage upload connected. No real AI / publishing / ads /
  payments connected.
- **Next safe step (M023C).** Controlled dev Supabase metadata
  writes behind an explicit env flag, no storage yet.

## Build order

### M023A — SQL planning only (no migrations applied) ✅

Tables to design:

- `restaurant_upload_keys` — id, restaurant_id, key_hash, label,
  active, revoked_at, created_at, last_used_at. Indexed on
  (restaurant_id, active). Audit columns.
- `upload_submissions` — id, restaurant_id, upload_key_id, category,
  priority, note, status, internal_note, submitted_at, reviewed_at,
  reviewed_by. Indexed on (restaurant_id, status, submitted_at).
- `direction_requests` — id, restaurant_id, focus, channel, urgency,
  title, client_note, preferred_timing_label, related_media_id,
  avoid_item, status, submitted_at. Indexed on
  (restaurant_id, status).
- `team_review_decisions` — id, target_type, target_id, reviewer_id,
  decision, internal_note, created_at. Indexed on
  (target_type, target_id).
- `media_assets` — extend status (`pending`, `usable`, `rejected`)
  and link to submission. Keep storage_path private.

RLS policy plan:

- Restaurant Upload Key writes scoped to a single restaurant via a
  short-lived signed token; no read access to other tables.
- Client reads constrained to own restaurant_id via auth session.
- Team writes constrained to authenticated team role.

Audit fields on every table: `created_at`, `updated_at`,
`created_by`, `updated_by`.

### M023B — Supabase write adapter, disabled by default ✅

- New flag: `VITE_VEROXA_ENABLE_DEV_WRITES=false` (default).
- New module: `src/lib/data/writes/*.ts` exposing:
  - `createUploadSubmission`
  - `createDirectionRequest`
  - `updateUploadReviewStatus`
  - `updateDirectionStatus`
- No service role key in frontend. Anon / authenticated-only.
- Graceful fallback: when flag off, calls return a typed
  `{ ok: false, reason: "writes_disabled" }` envelope and the UI
  stays on local/session behavior.

### M023C — Connect upload form to writes

- Only when `VITE_VEROXA_ENABLE_DEV_WRITES=true`.
- Metadata first; storage upload comes later in M023E.

### M023D — Connect team review actions to writes

- Guarded behind the same flag.
- Local-store path remains the default for demo.

### M023E — Storage upload

- Separate, later build.
- File size + MIME type limits enforced server-side.
- Signed URLs from a private bucket — no public bucket for raw
  client media.
- Content moderation / malware scanning queued as a follow-up.

## Security rules (apply to all M023 substeps)

- Never expose the Supabase service role key in any frontend bundle.
- No production writes — dev project only.
- RLS must scope Restaurant Upload Key to one restaurant.
- Restaurant Upload Key cannot read team/internal data.
- Team writes must be role-gated.
- All write functions return safe error messages — never raw DB
  errors to clients.
- Audit logs persisted server-side (separate work item).
- Pricing, AUTH_MODE, and InternalDemoGuard untouched by this work.

## M023C status — Dev Supabase write adapter (disabled by default)

- Added real Supabase write adapter behind explicit env flag
  `VITE_VEROXA_ENABLE_DEV_WRITES` (only the exact string `"true"`).
- Writes are **disabled by default**. `WRITES_ENABLED = false` unless
  the flag is set.
- Write functions are **metadata only**:
  `createUploadSubmission`, `createDirectionRequest`,
  `updateUploadReviewStatus`, `updateDirectionStatus`,
  `createTeamReviewDecision`.
- **No** storage upload, **no** service role, **no** file blobs,
  **no** FormData/fetch, **no** AI / publishing / ads / payments.
- **No** active migrations created in this build. If the env flag is
  set against a dev project without schema, calls fail safely with a
  client-safe `failure` envelope; demo flows continue on local/session
  stores.
- Supabase writes exist **only** inside
  `src/lib/data/devSupabaseWriteAdapter.ts`. No page component calls
  `supabase.from(...).insert/update/upsert/delete`.
- Errors are safe-mapped via `src/lib/data/writeErrors.ts` — raw DB
  error text never reaches the client.
- Notes sanitized via `src/lib/data/writeMappers.ts` (email / phone /
  `@handle` redaction, 500-char cap).

### Next step after M023C

- **M023D** — schema migration approval and controlled dev table
  creation, **or** connect adapter to selected pages after schema
  exists.
- Storage upload remains a separate later milestone.

## M024A status — Metadata schema migration + RLS foundation

- Created one migration:
  `supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`.
- Tables created: `clients`, `restaurant_upload_keys`,
  `upload_submissions`, `direction_requests`,
  `team_review_decisions`.
- `set_updated_at()` trigger added; RLS enabled on every new table.
- Policies are dev-stage only — `authenticated` read/write where
  noted; no `anon` writes; no public wide-open access.
- M024A does NOT connect frontend writes — pages still use
  local/session stores.
- Storage remains a separate later milestone.
- Production RLS (per-restaurant scoping, role separation,
  internal_note visibility, upload-key session binding) remains
  future work.
