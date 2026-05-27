# M023A — RLS Policy Plan

Narrative plan for Row-Level Security on the future first-client
tables defined in `M023A_FIRST_CLIENT_SCHEMA_PLAN.sql.txt`. This
document is the contract reviewers will compare against when the
real migration is authored.

## Principles

- **Default deny.** Every table has RLS enabled. No policy = no access.
- **Restaurant upload key access is extremely narrow.** It is an
  upload-only credential, not an identity.
- **No service role key in the frontend.** Ever. Service-role-only
  work runs server-side (admin jobs, never user-driven).
- **Client Portal reads use client-safe views**, not raw tables, so
  internal columns are not selectable from the client side.
- **Database errors must be transformed into safe client messages.**
  Never leak Postgres / Supabase error strings to a client surface.
- **AUTH_MODE is still `placeholder`.** Real auth strategy must be
  finalized before any of these policies turn on in production.

## Policy categories

### 1. Upload-key session policies

Apply to: `upload_submissions`, `media_assets` (write paths only).

- Upload key context is established via a short-lived signed token
  containing `restaurant_id` and `upload_key_id`. The token is
  validated server-side; no key material lives in the browser.
- INSERT into `upload_submissions` allowed only when:
  - `restaurant_upload_keys.status = 'active'`
  - `upload_submissions.restaurant_id = key.restaurant_id`
  - `upload_submissions.upload_key_id = key.id`
- INSERT into `media_assets` allowed only when linked to an
  `upload_submissions` row owned by the same restaurant.
- Upload key **cannot** SELECT from other restaurants' rows.
- Upload key **cannot** SELECT or write to any of:
  `team_review_decisions`, `content_workflow_items`, `weekly_updates`,
  `restaurants` (other than minimal name/display lookup if needed for
  the upload UI — and that should be a view, not the raw table).
- Upload key **cannot** SELECT `restaurant_upload_keys` rows.

### 2. Client-safe read policies

Apply to: `upload_submissions`, `direction_requests`,
`media_assets`, `content_workflow_items`, `weekly_updates`.

- Reads are exposed through `client_portal_*` views, never raw tables.
- Each view filters by `restaurant_id = auth.uid_to_restaurant()`
  (or the equivalent helper resolved from the auth session).
- Views project only client-safe columns. In particular:
  - No `internal_note`.
  - No `reviewed_by_user_id`.
  - No `team_visible_status`.
  - No raw RLS/DB error data.
- Status columns are mapped to client-safe labels by the view or by
  a SQL function (`get_client_safe_upload_status(status)`).

### 3. Team role policies

Apply to: `upload_submissions`, `direction_requests`,
`team_review_decisions`, `content_workflow_items`.

- Team users have a role claim (`role = 'team'`).
- Team SELECT: full operational columns across all restaurants.
- Team INSERT into `team_review_decisions`: allowed when
  `reviewed_by_user_id = auth.uid()` and the target row's
  `restaurant_id` matches.
- Team UPDATE on `upload_submissions.status` and
  `direction_requests.status`: allowed; must write a paired
  `team_review_decisions` row.
- Team **cannot** modify `restaurants.service_plan`, billing, or
  owner-only fields. Those move to owner/admin policies later.

### 4. Internal/admin policies

- Owner/Operator portals are out of scope for this pass.
- Admin/service-role writes (cleanup, backfill, billing) run from
  server-side jobs, never from the frontend.
- Any admin mutation must produce an audit log entry (separate
  future table).

### 5. Audit / read-only policies

- No client surface may read `team_review_decisions.internal_note`.
- Append-only audit log table (planned, not in this migration):
  INSERT for service role; SELECT for owner role only.

## Failure behavior

- All write functions translate database errors into one of:
  - `safeMessage = "Saved locally — we'll sync when live saving is enabled."`
  - `safeMessage = "Could not save right now. Please try again."`
- `retryable` flag set based on error class (transient vs schema).
- No raw error text is included in responses to clients.

## Open items before production

- Finalize auth (`AUTH_MODE != "placeholder"`).
- Decide token format for upload-key sessions (signed JWT vs
  Supabase RPC with key challenge).
- Decide which views back the Client Portal vs which use direct
  selects with RLS.
- Audit-log table + policies.
- Soft-delete (`archived_at`) policy across reads.
