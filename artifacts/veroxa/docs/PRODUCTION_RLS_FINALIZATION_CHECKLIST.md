# Production RLS Finalization Checklist

> **Docs only.** No RLS policies are being changed by this document. The
> current Supabase RLS in the dev project is **demo-only** and not
> production-safe.

## Current dev state

- Client Portal demo (`/demo/client/*`) uses **anon read-only** Supabase
  access via the read-only frontend client.
- Dev anon RLS read policies exist **only for the demo** and must not be
  reused in production.
- Team / Operator / Owner portals are **static demo only** — no Supabase
  reads or writes from those pages.

## Production RLS requirements

- **No anon access to business tables.** The anon role must not be able
  to read clients, posts, reports, media, onboarding answers, or any
  audit data in production.
- Every policy requires an **authenticated** user.
- `client` can only read rows where `client_id` matches their assigned
  client.
- `team` can read rows for clients listed in
  `team_client_assignments` for that team user — and nothing else.
- `operator` can read operational data across all clients (no client
  isolation), but write rules are still separate.
- `owner` can read business-level data across all clients.
- All **write** policies are separate from read policies and **must** be
  paired with `audit_logs` row inserts (see
  `docs/database/write-draft/002_audit_log_draft.sql`).

## Tables to review

- `clients`
- `client_platforms`
- `onboarding_items`
- `media_assets`
- `posts`
- `post_slots`
- `weekly_reports`
- `monthly_reports`
- `content_concepts`
- `draft_sets`
- `draft_variants`
- `notifications`
- `user_profiles`
- `team_client_assignments`
- future `audit_logs`

For each table, the review must answer:

1. Which roles can `SELECT`?
2. Which roles can `INSERT` / `UPDATE` / `DELETE`, and under what
   `USING` / `WITH CHECK`?
3. Is there a matching `audit_logs` write?
4. Does anon have any access? (Default answer: **no**.)

## Pre-apply test matrix

Before flipping production RLS on:

- [ ] Client **A** cannot read Client **B**'s rows in any table.
- [ ] Team user assigned to Client **A** cannot read Client **B**'s
      rows.
- [ ] Team user with **no** assignments sees zero client data.
- [ ] Operator can read operational rows across all clients.
- [ ] Owner can read all rows.
- [ ] Anon (logged-out) sees **nothing** in any business table.
- [ ] Wrong-role user hitting a restricted route is blocked
      (see `REAL_AUTH_READINESS_CHECKLIST.md`).

Each row should be tested with a real test user, not bypassed.

## Do not apply until

- [ ] Real auth hook is implemented and `RequireRole` reads it.
- [ ] Manual test users exist (one per role) with matching
      `user_profiles` rows.
- [ ] Manual SQL review of all policies has been completed.
- [ ] Rollback plan exists (e.g. previous policy SQL exported, ability
      to disable RLS per table if needed).
- [ ] Backup / export of the affected tables has been completed.
- [ ] `audit_logs` table is in place if any write policies are part of
      the same apply.

## Cross-references

- `docs/REAL_AUTH_READINESS_CHECKLIST.md`
- `docs/FIRST_WRITE_SURFACE_PLAN.md`
- `docs/SAFETY_AUDIT_CHECKLIST.md`
- `docs/database/auth-draft/`
- `docs/database/write-draft/`
