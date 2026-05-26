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
- `private.user_profiles_guard_role_change()` (column-write guard)

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

## What to add to this plan in Migration 002

- FK constraint on `user_profiles.client_id → clients(id)` and the
  related tests (insert with bad client_id → fails)
- `team_client_assignments` policies and the revocation test
  (`is_active=false` → loses visibility on next statement)
- `is_assigned_to_client()` helper coverage (operator/owner
  short-circuit, active row required, inactive row ignored)
- Cross-tenant probe: Client A ↛ Client B's anything
