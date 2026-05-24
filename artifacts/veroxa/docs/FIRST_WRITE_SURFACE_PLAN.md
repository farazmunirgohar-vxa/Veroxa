# First Write Surface Plan

**Status:** Planning only. No writes exist in the app today. No SQL has been applied. This document defines the order in which write surfaces should be introduced once real auth and production RLS are in place.

---

## Context

- Veroxa today is **read-only**:
  - `/demo/*` routes use static demo data (plus read-only Supabase fallback for Client Portal).
  - The app has **no `INSERT` / `UPDATE` / `DELETE` / `UPSERT` paths anywhere.**
- `/login` is a demo role router plus a "Future Sign In" UI shell. No real auth is wired.
- The future authenticated routes (`/client/dashboard`, `/team/tasks`, `/operator/overview`, `/owner/dashboard`) currently render only the `<RequireRole>` preview card.
- The auth data model (`user_profiles`, `veroxa_user_role`) and the V1 team assignment table (`team_client_assignments`) are **drafted in `docs/database/auth-draft/`** but not applied.

---

## Principles for the first write phase

1. **Small, auditable, low-risk.** First writes change internal workflow state, not anything customer-visible on the open internet.
2. **No publishing, no AI generation, no Google Business Profile writes, no automated decisions** in the first write phase.
3. **Every write must be covered by an `audit_logs` row.** No silent state changes.
4. **Tenant scoping comes from the same primitives as reads** — `user_profiles.role`, `user_profiles.client_id` (for clients), `team_client_assignments` (for team).
5. **Owner stays oversight-only.** Owners do not perform daily execution writes in V1.
6. **Service role key never reaches the frontend.** High-risk or cross-tenant writes go through a server-side function.
7. **Order of rollout is non-negotiable:** real auth → production RLS → audit logs → first writes. Skipping a step is not allowed.

---

## Prerequisites (must be in place before ANY V1 write ships)

- ✅ Auth data model drafted (`docs/database/auth-draft/001_auth_user_profiles.sql`).
- ✅ Production SELECT RLS drafted (`docs/database/auth-draft/002_production_rls_policy_draft.sql`).
- ✅ V1 team assignment schema drafted (`docs/database/auth-draft/003_team_assignment_schema_draft.sql`).
- ⬜ Real Supabase Auth wired in the app (sign-in, session lookup, `<RequireRole>` swapped to read a real session).
- ⬜ Auth data model + team assignment table actually applied to the production Supabase project.
- ⬜ Production SELECT RLS applied; dev anon read policies dropped.
- ⬜ `audit_logs` table applied (`docs/database/write-draft/002_audit_log_draft.sql`).
- ⬜ Server-side function path established for writes that cannot run safely client-side under RLS.

---

## Write priorities

Priorities are ordered. **Do not skip ahead.** Each priority must ship, be observed in production for a meaningful window, and pass an audit-log review before moving on.

### Priority 1 — Safe low-risk internal actions

Single-row state flips, all reversible, all scoped to a known tenant.

- Mark a notification as read.
- Mark an onboarding item as complete / incomplete.
- Team task status update (e.g. `todo` → `in_progress` → `done`).
- Draft variant approval status (operator only).
- Report approval status (operator only).

Why first: smallest possible blast radius. Each write touches one row, changes one column, has clear ownership, and can be safely reverted.

### Priority 2 — Controlled content workflow

Multi-field edits inside the agency's content production loop. Still internal — nothing leaves Veroxa.

- Create / edit a content concept.
- Create / edit a draft set.
- Create / edit a draft variant.
- Schedule a post slot (set `scheduled_at`, choose a slot).
- Update a post's internal workflow status (e.g. `draft` → `ready_for_review` → `approved`).

Why second: these depend on Priority 1 being stable (status flips are the building blocks).

### Priority 3 — Client-facing writes

The first writes the **client role** is allowed to perform.

- Client onboarding answers.
- Client preferred posting windows.
- Client media upload metadata (the **metadata row only** — actual upload pipeline is excluded from V1; see Priority 4 / "out of scope" below).
- Client content notes / comments (review feedback on drafts).

Why third: these introduce a new actor (the restaurant owner). They require the client role's RLS to be hardened and a clear "you wrote this" audit trail before opening it up.

### Priority 4 — Later high-risk writes (NOT part of the first write phase)

**Explicitly out of scope for the first write phase. Do not ship these in V1.**

- Publishing posts to social platforms (Instagram, Facebook, TikTok, etc.).
- Google Business Profile updates.
- AI-generated content creation (writing/regenerating drafts, image generation).
- Automated scheduling decisions (auto-pick of slots, auto-publish).
- Billing / subscription changes.
- Bulk operations across multiple clients.
- Anything that mutates state outside Veroxa's own database.

These each require their own design phase: rate limiting, idempotency, retry semantics, external-API failure handling, revocation, and (for AI / publishing) human-in-the-loop approval gates.

---

## Roles × write surface (V1 target)

| Surface                              | Client | Team (assigned client) | Operator | Owner |
|--------------------------------------|:------:|:----------------------:|:--------:|:-----:|
| Mark own notification read           | ✓      | ✓                      | ✓        | ✓     |
| Onboarding item complete/incomplete  | ✓      | review                 | review   | read  |
| Team task status                     | —      | ✓                      | read     | read  |
| Draft variant edit                   | —      | ✓                      | read     | read  |
| Draft variant approve/reject         | —      | —                      | ✓        | read  |
| Post workflow status (internal)      | —      | ✓                      | ✓        | read  |
| Post publish-readiness flag          | —      | —                      | ✓        | read  |
| Weekly / monthly report draft        | —      | ✓                      | edit     | read  |
| Weekly / monthly report approve      | —      | —                      | ✓        | read  |
| Client content notes / comments      | ✓      | read                   | read     | read  |
| Anything in Priority 4               | —      | —                      | —        | —     |

`—` = no write permission in V1. `read` = can read but not write at this layer.

---

## Audit logs

Every Priority 1–3 write **must** create one `audit_logs` row. The draft schema is in `docs/database/write-draft/002_audit_log_draft.sql`. Key rules:

- Append-only — no `UPDATE` / `DELETE` policies on `audit_logs` for any role.
- Frontend never inserts directly in production; a server-side function inserts the audit row in the same transaction as the business write.
- `actor_user_id` + `actor_role` + (optional) `client_id` make every action traceable.
- Read access: owner / operator read all; clients read only their own `client_id` and only safe (non-internal) actions.

---

## Draft files (do not run)

- `docs/database/write-draft/001_first_write_surface_draft.sql` — per-table commentary and DRAFT-only policy examples for Priority 1–2 surfaces.
- `docs/database/write-draft/002_audit_log_draft.sql` — `audit_logs` table draft.
- `docs/database/write-draft/README.md` — directory rationale and gating prerequisites.

---

## What this document is NOT

- Not a migration plan with dates.
- Not a feature spec — UI behavior for each write is designed when that write actually ships.
- Not an authorization model — that lives in `AUTH_ARCHITECTURE_PLAN.md` and the auth-draft RLS file. This document only lists **what** changes and **in what order**.
- Not a publishing / AI / uploads spec — those are explicitly excluded from the first write phase.
