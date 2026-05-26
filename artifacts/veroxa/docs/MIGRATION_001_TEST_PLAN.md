# Migration 001 — Identity Foundation: Test Plan

**Status:** Planning document. Migration 001 itself is a **draft** at
`docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql` and
has **not** been applied to any database. This plan lists the manual /
future-automated checks that must pass before the draft is promoted to
`supabase/migrations/` and run.

`AUTH_MODE` remains `"placeholder"`. None of the tests below need to be
executed yet; they exist so the eventual review pass has a known target.

---

## Scope under test

Tables created by Migration 001:
- `public.user_profiles`
- `public.team_members`

Helpers created by Migration 001 (schema `private`):
- `current_user_role()`
- `current_user_client_id()`
- `is_owner()`, `is_operator()`, `is_team_member()`, `is_system_actor()`

Triggers:
- `public.set_updated_at()` (attached to both tables)
- `private.user_profiles_column_write_guard()` (column-write guard — blocks non-owner writes to `role`, `is_active`, `client_id`, `email`; blocks self-role-change for everyone including owner)

Not in scope (deferred to Migration 002 or later):
- `clients` table and the FK constraint on `user_profiles.client_id`
- `team_client_assignments`
- `is_assigned_to_client()`, `can_view_client()`, `can_manage_*()` helpers
- Any operational table (`media_assets`, `posts`, reports, etc.)

---

## Test fixtures

Four `auth.users` + `user_profiles` rows, one per role:

| Email | `role` | `client_id` | Notes |
|---|---|---|---|
| `owner@veroxa.test` | `owner` | NULL | full access |
| `operator@veroxa.test` | `operator` | NULL | read-all, no role writes |
| `team@veroxa.test` | `team` | NULL | scoped reader |
| `client@veroxa.test` | `client` | NULL until Migration 002 | own-row only |
| `inactive@veroxa.test` | `team` | NULL, `is_active=false` | exercises is_active gate |

Plus one `team_members` row referencing `team@veroxa.test`, `role_label='Content Lead'`.

Two execution contexts to exercise per test:
- **anon** — no JWT (PostgREST anon role)
- **service role** — Supabase service key (RLS bypass)

---

## Required tests (Migration 001)

### 1. Anonymous access is fully blocked
- [ ] anon `select * from public.user_profiles` → 0 rows / permission denied (per Supabase grant model)
- [ ] anon `select * from public.team_members`  → 0 rows / permission denied
- [ ] anon `insert into public.user_profiles ...` → denied
- [ ] anon `update public.user_profiles set role='owner' where ...` → denied

### 2. Client sees only their own profile
- [ ] Sign in as `client@veroxa.test`; `select * from public.user_profiles` returns exactly 1 row (own)
- [ ] Same context: `select * from public.user_profiles where id <> auth.uid()` returns 0 rows
- [ ] Same context: `select * from public.team_members` returns 0 rows

### 3. Team sees only own profile and own team_member row
- [ ] Sign in as `team@veroxa.test`; `select * from public.user_profiles` returns exactly 1 row (own)
- [ ] `select * from public.team_members` returns exactly 1 row (own — `user_profile_id = auth.uid()`)
- [ ] `select * from public.team_members where user_profile_id <> auth.uid()` returns 0 rows

### 4. Operator can view all profiles and all team_members
- [ ] Sign in as `operator@veroxa.test`; `select count(*) from public.user_profiles` returns 5
- [ ] `select count(*) from public.team_members` returns ≥ 1
- [ ] Operator `update public.user_profiles set display_name='X' where id = ...team_user_id...` → **denied** (operator has no UPDATE policy)

### 5. Owner can view and update profiles
- [ ] Sign in as `owner@veroxa.test`; `select count(*) from public.user_profiles` returns 5
- [ ] `update public.user_profiles set display_name='X' where id = ...team_user_id...` → succeeds
- [ ] `insert into public.team_members (user_profile_id, role_label) values (...operator_user_id..., 'Operator')` → succeeds

### 6. Owner can change role; non-owner cannot
- [ ] As owner: `update public.user_profiles set role='operator' where id = ...team_user_id...` → succeeds; new `current_user_role()` for that user returns `'operator'` on next statement
- [ ] As operator: same update → **denied** (`role changes are restricted to owner` from trigger)
- [ ] As team: same update → **denied**
- [ ] As client: same update → **denied** (also blocked by SELF policy `with check`)
- [ ] As owner trying to change **own** role: `update public.user_profiles set role='client' where id = auth.uid()` → **denied** (`users cannot change their own role`)

### 6a. Email is owner-only (column-write guard)
- [ ] As client: `update public.user_profiles set email='other@x.test' where id = auth.uid()` → **denied** (`email changes are restricted to owner`)
- [ ] As team / operator: same self-update → **denied**
- [ ] As owner editing another user's email → succeeds
- [ ] As owner editing **own** email → succeeds (no self-restriction on email, unlike role)
- [ ] After fix: confirm `display_name` and `avatar_url` self-updates still succeed (guard is targeted, not blanket)

### 7. `is_active` changes are owner-only
- [ ] As owner: flip `is_active=false` on a team user → succeeds
- [ ] As operator: same → denied
- [ ] As the affected user themselves: same → denied

### 8. `client_id` changes are owner-only
- [ ] As owner: set `client_id` on a client user → succeeds (no FK enforcement until Migration 002 — covered then)
- [ ] As operator / team / client: same → denied

### 9. `current_user_role()` returns the right value
- [ ] Each role's session returns the expected string from `select private.current_user_role()`
- [ ] Anonymous session returns NULL (no row) — never raises
- [ ] Service-role session returns NULL (no `auth.uid()`) — never raises
- [ ] A user whose `is_active=false` returns NULL (helper filters on `is_active`)

### 10. `is_owner` / `is_operator` / `is_team_member` semantics
- [ ] owner → all three return `true`
- [ ] operator → `is_operator` and `is_team_member` return `true`; `is_owner` returns `false`
- [ ] team → only `is_team_member` returns `true`
- [ ] client → all three return `false`
- [ ] anon → all three return `false`, no exception

### 11. `current_user_client_id()` semantics
- [ ] For a client user with `client_id=<uuid>`: returns that uuid
- [ ] For a team / operator / owner user: returns NULL even if `client_id` is set
- [ ] For an inactive client user (`is_active=false`): returns NULL
- [ ] For anon: returns NULL, no exception

### 12. `is_system_actor()` semantics
- [ ] Service-role context: returns `true`
- [ ] Any end-user context: returns `false`
- [ ] anon: returns `false`

### 13. `updated_at` trigger
- [ ] Any `update` on `user_profiles` advances `updated_at` to the current `now()`
- [ ] Any `update` on `team_members` advances `updated_at` to the current `now()`
- [ ] An `update` that changes no columns (e.g. `set display_name = display_name`) still fires the trigger and bumps `updated_at` — document this; it is by design

### 14. RLS-bypass confirmation for service role
- [ ] Service-role key: `select count(*) from public.user_profiles` returns 5 (RLS bypassed)
- [ ] Service-role key: can insert / update / delete any row (used by Supabase admin auth APIs)

### 15. Search-path hijack defense
- [ ] In a session where the user creates `pg_temp.user_profiles` with a faked `role='owner'` column and sets `search_path='pg_temp,public'`, calling `private.current_user_role()` still reads from `public.user_profiles` (because the function has `set search_path = pg_catalog, public`)
- [ ] `private.is_owner()` returns `false` in that hostile session

### 16. Cascade on `auth.users` delete
- [ ] Deleting an `auth.users` row cascades to the `user_profiles` row (PK FK with `on delete cascade`)
- [ ] Deleting a `user_profiles` row cascades to the `team_members` row (FK with `on delete cascade`)

### 17. Helper EXECUTE grants
- [ ] `authenticated` role can `execute` each helper
- [ ] `anon` role **cannot** `execute` any helper (revoke from public, no grant to anon)
- [ ] `service_role` can `execute` each helper

---

## Inactive-users handling (documented behavior)

The schema uses **two** independent `is_active` flags:

- `user_profiles.is_active` — global account flag. When `false`,
  `current_user_role()` returns NULL, so the user is treated as if they
  have no role and every helper-dependent policy denies access.
  Self-SELECT (`user_profiles_select_self`) still works because it
  doesn't go through the helper — this is intentional so an inactive
  user can sign in and see they've been deactivated.
- `team_members.is_active` — per-staff-profile flag. Inactive staff
  still satisfy `team_members_select_self`, and operator/owner still
  see them. Migration 002 will add policies on operational tables that
  check both flags before allowing reads.

Why filter on `is_active` inside `current_user_role()` rather than in
every downstream policy? It keeps the deactivation kill-switch in one
place — flipping `user_profiles.is_active=false` cuts off all
role-dependent access on the next statement, with no per-policy edits
needed.

---

## Service role / system behavior (documented)

- The Supabase **service role** bypasses RLS by definition. Background
  jobs, Edge Functions, and migrations should use the service-role key,
  not an end-user JWT.
- `is_system_actor()` is provided so app-side code (running with a
  user JWT) can detect "this request is from a service-role context"
  if it needs to branch. **Policies should not depend on it** — the
  service role already bypasses RLS, so adding a `using (is_system_actor() or …)`
  clause is redundant and a footgun.
- All system-originated mutations that change a status field on a
  business-domain table must, in Migration 003+, write a corresponding
  `activity_logs` row with `performed_by_role='system'`. Out of scope
  for this migration.

---

## Additional required tests (audit follow-ups)

### 18. INSERT-denial for non-owner authenticated users
- [ ] As client: `insert into public.user_profiles (id, display_name, email, role) values (...)` → **denied**
- [ ] As team: same → **denied**
- [ ] As operator: same → **denied**
- [ ] As owner: same → succeeds (owner_all covers INSERT)
- [ ] As any non-owner: `insert into public.team_members (...)` → **denied**

### 19. DELETE-denial for operator and below
- [ ] As operator: `delete from public.user_profiles where id = ...` → **denied** (no DELETE policy for operator)
- [ ] As team / client: same → **denied**
- [ ] As owner: same → succeeds
- [ ] As operator: `delete from public.team_members where id = ...` → **denied**
- [ ] As owner: same → succeeds

### 20. `auth.users` orphan (signup race / missing bootstrap)
- [ ] Create an `auth.users` row directly (service role) **without** inserting a `user_profiles` row
- [ ] Sign in as that user: `select private.current_user_role()` returns NULL (not exception)
- [ ] Same context: `select * from public.user_profiles where id = auth.uid()` returns 0 rows
- [ ] Same context: `select * from public.team_members` returns 0 rows
- [ ] Same context: every `is_*` helper returns `false`, every operational query denies cleanly
- [ ] Document: this is why a `before insert on auth.users` bootstrap trigger (Migration 001a — see Blocking Issues) must land before `AUTH_MODE` flips to `"real"`

### 21. Email uniqueness conflict
- [ ] Two profiles with the same email on INSERT → fails with the unique constraint violation
- [ ] UPDATE one profile's email to an existing email → fails with the unique constraint violation
- [ ] Failure surfaces as a clean Postgres error (no row-data leak in the error message)

### 22. Operator without `team_members` row
- [ ] An operator user with no `team_members` row: `select * from public.team_members` returns all rows (operator policy doesn't require self row)
- [ ] Helpers (`is_operator`, `is_team_member`) return `true` regardless of `team_members` presence (helpers read `user_profiles.role`, not `team_members`)

### 23. JWT-expiry / stale session
- [ ] Expired or missing JWT: behaves identically to anon (test 1) — every query denies, every helper returns NULL/false
- [ ] Helpers do not raise on missing `auth.uid()`

---

## Rollback expectation

**Strategy: forward-only + pre-cutover snapshot.** Migration 001 is the
first real schema migration, so there is no prior schema state to revert
to. The chosen safety net is:

1. **Before promoting** the draft to `supabase/migrations/`, take a full
   logical backup of the dev / staging project (`pg_dump --schema=public --schema=private`
   plus `pg_dump --schema=auth --data-only` if seed users exist).
2. **Apply** through the Supabase migration runner (`supabase db push`),
   not by piping the SQL file directly. The runner records the
   migration version and refuses to re-apply.
3. **If a rollback is required** (post-apply discovery of a defect), the
   strategy is:
   - On a dev project: drop the `private` schema cascade, drop both
     `public.user_profiles` and `public.team_members`, restore from the
     pre-cutover snapshot, fix the migration draft, re-apply.
   - On a production project: do not improvise rollback. Restore from
     the pre-cutover snapshot via the Supabase dashboard / PITR, then
     correct the migration in dev and re-promote.

A formal `down` SQL companion (`001_identity_foundation_down.sql`) is
**not** maintained because:
- The destructive operations (`drop schema private cascade`,
  `drop table public.user_profiles cascade`) would also drop every
  downstream object created by M002+, which is rarely the intended
  outcome of a "rollback".
- The snapshot-restore path is the only safe production option.

### Rollback tests

- [ ] Apply the migration to a clean dev project → succeeds.
- [ ] Re-apply the same migration through the runner → runner reports
      "already applied", does not re-execute.
- [ ] Re-run the raw `.sql` file directly against the same project →
      fails cleanly with "relation already exists" or "trigger already
      exists"; does not leave partial state.
- [ ] Snapshot-restore: take a snapshot pre-apply, apply, restore;
      confirm the schema is exactly the pre-apply state.

---

## Blocking Issues Before Real Migration

Each item below MUST be resolved (or explicitly accepted with a written
exception by the owner) before the file at
`docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
moves into `supabase/migrations/`.

| # | Issue | Severity | Resolution |
|---|---|---|---|
| B1 | `email` column had no column-write guard in the initial draft | RESOLVED in this revision — guard renamed to `user_profiles_column_write_guard` and now rejects non-owner email changes | ✓ done |
| B2 | No `before insert on auth.users` bootstrap trigger exists to create a matching `user_profiles` row at signup time | **Blocker for `AUTH_MODE='real'`** (NOT for the migration in isolation) | Land Migration 001a (`docs/sql_drafts/migrations_review/001a_auth_users_bootstrap_draft.sql`) before the auth cutover. Documented as a hard prerequisite in the cutover checklist. |
| B3 | `public.set_updated_at()` lives in `public` (auto-exposed by PostgREST) | Low — cosmetic / consistency | Either move to `private` and re-grant, or document explicitly why `public` is acceptable for this single-purpose trigger function. Either is fine. |
| B4 | Test plan items above are written but not yet executed against any database | Blocker for promotion | Run the full test plan against a clean dev Supabase project; record pass/fail; remediate any failure before promotion. |
| B5 | No `clients` table exists yet — `user_profiles.client_id` is a bare column with no FK | NOT a blocker for M001 | M002 adds the FK. Until then, an owner can write any UUID into `client_id` — acceptable for an unpopulated greenfield. |
| B6 | No `team_client_assignments` exists yet — `is_assigned_to_client()` is intentionally absent | NOT a blocker for M001 | M002 adds the helper. |
| B7 | `is_system_actor()` uses Supabase-specific `auth.role()` | NOT a blocker | Document file as Supabase-targeted (single-line comment at the top is sufficient). |
| B8 | Re-application of the raw `.sql` file is not idempotent (no `if not exists` on policies/triggers) | NOT a blocker if applied via Supabase runner | Acceptable; the runner tracks versions. Do not pipe the file directly. |

**Promotion gate:** B1 ✓, B4 must be green, B2 must have a scheduled landing date before the auth cutover. B3 and B7 are optional polish.

---

## What to add to this plan in Migration 002

- FK constraint on `user_profiles.client_id → clients(id)` and the
  related tests (insert with bad client_id → fails)
- `team_client_assignments` policies and the revocation test
  (`is_active=false` → loses visibility on next statement)
- `is_assigned_to_client()` helper coverage (operator/owner
  short-circuit, active row required, inactive row ignored)
- Cross-tenant probe: Client A ↛ Client B's anything
