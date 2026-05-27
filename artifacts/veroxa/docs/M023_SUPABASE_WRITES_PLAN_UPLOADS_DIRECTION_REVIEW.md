# M023 — Supabase Writes Plan (Uploads + Direction + Team Review)

The next build that will introduce **controlled, dev-only Supabase
writes**, behind an explicit feature flag. This plan does NOT add any
writes itself; it scopes what M023 will do.

## Build order

### M023A — SQL planning only (no migrations applied)

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

### M023B — Supabase write adapter, disabled by default

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
