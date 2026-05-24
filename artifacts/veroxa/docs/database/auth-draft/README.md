# Auth Draft — `docs/database/auth-draft/`

**Status:** Planning only. Nothing in this directory has been applied to any Supabase project.

This directory captures the future Veroxa **real-auth data model** and the production **RLS direction** that depends on it. None of the SQL here is executed today, and the running app does not consume it.

---

## Files

- **`001_auth_user_profiles.sql`** — DRAFT
  Defines the `veroxa_user_role` enum and the `user_profiles` table that will map `auth.users.id` to a Veroxa role (client / team / operator / owner) and, when applicable, a tenant scope (`client_id`). Includes role/`client_id` consistency CHECK, indexes, a draft `updated_at` trigger, and `ENABLE ROW LEVEL SECURITY` (with policies deferred to file 002).

- **`002_production_rls_policy_draft.sql`** — DRAFT
  Sketches **SELECT-only** RLS direction for production across `clients`, `client_platforms`, `onboarding_items`, `media_assets`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`, `content_concepts`, `draft_sets`, `draft_variants`, and `notifications`. All policy bodies are commented as `DRAFT` — nothing executes as-is. Team-role policies are now sketched as **client-scoped via `team_client_assignments`** (V1 decision; see file 003).

- **`003_team_assignment_schema_draft.sql`** — DRAFT
  Defines the V1 team assignment model: a `team_client_assignments` table mapping a team user (`user_profiles.user_id`) to one or more `clients`, with `assignment_role` (CHECK-constrained to `content_team` / `reviewer` / `scheduler` / `reporting_support`), `is_active`, unique `(team_user_id, client_id)`, indexes, an `updated_at` trigger, a draft `current_team_client_ids()` SECURITY DEFINER helper, and `ENABLE ROW LEVEL SECURITY`.

---

## What this directory is NOT

- It is **not** applied to the current dev Supabase database.
- It does **not** replace the temporary anon read policies in `../rls-draft/001_dev_read_policies.sql` — those remain in effect for the Client Portal demo until real auth ships.
- It does **not** add any frontend writes, sessions, sign-in, or Supabase Auth wiring.
- It is **not** a complete production migration. Write (`INSERT` / `UPDATE` / `DELETE`) policies are out of scope and will be drafted in a later phase alongside the actual write paths.

---

## Current demo state (unchanged)

- `/demo/*` routes are public and consume demo data (static + read-only Supabase for Client Portal).
- `/login` is a demo role router only — no accounts, no passwords, no sessions, no Supabase Auth.
- Team, Operator, and Owner portals are static demo-only and are not wired to Supabase.
- The temporary anon dev read policies in `../rls-draft/001_dev_read_policies.sql` are the only RLS in effect on dev.

---

## Future production direction (what these files plan)

1. **Supabase Auth** becomes the identity provider.
2. **`user_profiles`** maps `auth.users.id → role → client_id (for clients only)`.
3. **`client` role requires `client_id`**; `team` / `operator` / `owner` do not have a `client_id` in V1.
4. **Production RLS** depends on `auth.uid()` joining `user_profiles` (helper functions `current_user_role()` and `current_user_client_id()` are sketched in file 002).
5. **All anon SELECT access is dropped in production.** The dev anon read policies must be removed before any real client data is loaded.
6. **Service role key never reaches the frontend.** Privileged operations go through a server-side function (Postgres function, Edge Function, or backend API).
7. **Team assignment — V1 decision:** team access is **client-scoped** via the `team_client_assignments` table in `003_team_assignment_schema_draft.sql`. A team user is assigned to one or more clients and can read that client's work rows; there is no per-post / per-draft / per-report assignment in V1. Resource-level assignment can be layered on later without breaking V1. The Team portal stays static demo-only until real auth and this schema are applied together.

---

## Sequencing

These three files are step 1 of a larger sequence:

1. **(this directory)** Draft the auth data model, team assignment schema, and SELECT RLS direction.
2. ✅ Real `/login` form UI shell behind a feature flag (no live auth wired) — done.
3. ✅ `<RequireRole>` route guard component (no live auth wired) — done.
4. ✅ Decide team assignment schema — done (V1 = client-scoped via `team_client_assignments`).
5. Draft the first **write surface** policies (approvals / read flags / actions) — next planning phase.
6. Wire actual Supabase Auth sessions + the first authenticated `/client/*` route.
7. Apply `001_auth_user_profiles.sql`, then `003_team_assignment_schema_draft.sql`, then the finalised `002_production_rls_policy_draft.sql`, then drop `../rls-draft/001_dev_read_policies.sql`.

See `../../AUTH_ARCHITECTURE_PLAN.md` for the broader architectural plan, and `../../BUILD_STATUS.md` for the current build state.
