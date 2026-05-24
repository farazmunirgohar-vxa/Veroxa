# Write Draft — `docs/database/write-draft/`

**Status:** Planning only. Nothing in this directory has been applied to any Supabase project, and the running app does not perform any writes.

This directory plans the **first write surfaces** for Veroxa: which actions ship first, who is allowed to perform them, what fields they may change, and how every action is audited.

---

## Files

- **`001_first_write_surface_draft.sql`** — DRAFT
  Per-table commentary plus DRAFT-only RLS policy sketches for the first write surfaces (`notifications`, `onboarding_items`, `content_concepts`, `draft_variants`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`). Every policy is commented out. No `INSERT` / `DELETE` policies are included.

- **`002_audit_log_draft.sql`** — DRAFT
  `audit_logs` table draft (append-only). Includes the table shape, indexes, draft mutation-blocking trigger, draft SELECT policies for operator / owner / client (whitelisted actions), and an explicit "no client-side `INSERT`" stance — audit rows are written only by a server-side function in the same transaction as the business write.

- **`../../FIRST_WRITE_SURFACE_PLAN.md`** — the human-readable plan: priorities, role × surface matrix, hard exclusions, prerequisite ordering.

---

## What this directory is NOT

- It is **not** applied to the dev or production Supabase database.
- It does **not** add any frontend writes. The app today has zero `INSERT` / `UPDATE` / `DELETE` / `UPSERT` paths.
- It is **not** a publishing / AI / uploads spec. Those surfaces are explicitly excluded from the first write phase (see Priority 4 in the plan doc).
- It does **not** finalise INSERT or DELETE policies — those ship feature-by-feature when the corresponding UI ships.

---

## Why the first writes are intentionally tiny

1. **Audit-log discipline.** Establishing the "every write produces an audit row" pattern is easier on single-column status flips than on multi-field content edits.
2. **Tenant-scoping verification.** The Priority 1 actions are the smallest possible test that the production RLS for `client` / `team` / `operator` / `owner` actually behaves as drafted.
3. **Reversibility.** Every Priority 1 write is a single-row state flip that can be reverted by another flip plus a compensating audit row. Larger writes (Priority 2+) are not.
4. **No external systems.** Nothing in Priority 1 touches a social platform, Google Business Profile, AI provider, payment processor, or anything else outside Veroxa's own database. External writes have their own design phase.

---

## Hard prerequisites before any V1 write ships

A write surface from `001_first_write_surface_draft.sql` may only ship after **all** of the following are in place — no exceptions, no parallel work:

1. **Supabase Auth** wired in the app (real sign-in, real session lookup).
2. **`user_profiles`** applied (`docs/database/auth-draft/001_auth_user_profiles.sql`).
3. **`team_client_assignments`** applied (`docs/database/auth-draft/003_team_assignment_schema_draft.sql`).
4. **Production SELECT RLS** finalised and applied (`docs/database/auth-draft/002_production_rls_policy_draft.sql`); dev anon read policies in `docs/database/rls-draft/` dropped.
5. **`audit_logs`** applied (`002_audit_log_draft.sql`) and an audit-write helper function in place.
6. **`<RequireRole>` guard** swapped from the placeholder hook to a real session hook, with redirect behaviour decided.
7. **A documented server-side function path** for writes that cannot safely run client-side under RLS.

If any of the above are missing, no write surface ships.

---

## Out of scope for the first write phase

Publishing posts to social platforms, Google Business Profile updates, AI-generated content (writing / regenerating drafts, image generation), automated scheduling decisions, billing / subscription changes, bulk cross-client operations, file uploads themselves (the storage pipeline is separate; only the metadata row is in scope, and only in Priority 3).

These are deliberately excluded — each needs its own design phase covering rate limiting, idempotency, retry semantics, external-API failure handling, and human-in-the-loop approval gates.

---

## See also

- [`../../FIRST_WRITE_SURFACE_PLAN.md`](../../FIRST_WRITE_SURFACE_PLAN.md) — full plan with role × surface matrix.
- [`../auth-draft/README.md`](../auth-draft/README.md) — the auth + RLS draft that this directory depends on.
- [`../../AUTH_ARCHITECTURE_PLAN.md`](../../AUTH_ARCHITECTURE_PLAN.md) — overall auth architecture and role boundaries.
- [`../../BUILD_STATUS.md`](../../BUILD_STATUS.md) — current build state.
