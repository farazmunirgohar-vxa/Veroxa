-- =============================================================================
-- 003_team_assignment_schema_draft.sql
-- Veroxa — DRAFT ONLY: V1 team assignment schema (client-scoped)
-- =============================================================================
--
-- STATUS: DRAFT ONLY — DO NOT RUN YET.
--
-- PURPOSE:
--   Define the V1 team assignment model so production RLS can later support
--   Team users safely. V1 is intentionally **client-scoped**, not
--   resource-scoped: a team user is assigned to one or more clients, and
--   gets SELECT access to that client's work rows. Resource-level (per-post,
--   per-draft, per-report) assignment is V2.
--
-- WHY CLIENT-SCOPED FOR V1:
--   - Matches how the agency actually delegates work today (a content team
--     member owns a client, not individual posts).
--   - Drastically simpler RLS — every client-scoped table reuses the same
--     pattern: row.client_id IN (current team user's assigned clients).
--   - Avoids back-filling assignment rows for every existing post / draft /
--     report when the system goes live.
--   - Resource-level (V2) can be layered on top later without breaking V1.
--
-- DO NOT:
--   - Apply this file to any Supabase project yet.
--   - Add corresponding frontend writes during this planning phase.
--   - Wire the Team portal to Supabase.
--   - Use this file to justify enabling real auth in the app today.
--
-- REQUIRES (when applied later):
--   - Supabase Auth enabled on the project (auth.users present).
--   - 001_auth_user_profiles.sql applied (user_profiles + veroxa_user_role enum).
--   - The existing `clients` table.
--
-- RELATED FILES:
--   - 001_auth_user_profiles.sql — user_profiles + role enum.
--   - 002_production_rls_policy_draft.sql — production SELECT RLS direction;
--     team policies now reference team_client_assignments per this file.
--
-- NOTE ON DEMO STATE:
--   /demo/* routes are unchanged. The Team portal remains static demo-only
--   and is not wired to Supabase. This file does not change any runtime
--   behaviour today.
-- =============================================================================


-- =============================================================================
-- 1. team_client_assignments
--
-- One row per (team_user, client) pair. A team user with no rows here has
-- no client-scoped read access. A team user with multiple active rows can
-- read across all of those clients (V1 has no per-client UI scope switch —
-- the team portal will simply union assigned clients).
--
-- assignment_role is a coarse label only. It does NOT grant or restrict
-- anything in V1 RLS — V1 only checks (team_user_id, client_id, is_active).
-- It exists so the UI and future audit logs can show why a person was
-- assigned, and so V2 can use it for finer-grained policies without a
-- migration.
-- =============================================================================

CREATE TABLE team_client_assignments (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  team_user_id     uuid         NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  client_id        uuid         NOT NULL REFERENCES clients(id)            ON DELETE CASCADE,
  assignment_role  text         NOT NULL DEFAULT 'content_team',
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),

  -- A team user can only be assigned to a given client once. If they need
  -- multiple roles on the same client, model that via a separate role-tags
  -- column or a join table in V2 — not by duplicating rows here.
  CONSTRAINT team_client_assignments_unique_pair UNIQUE (team_user_id, client_id),

  -- Constrain assignment_role to the V1 vocabulary. New roles must be added
  -- here intentionally; the column is not free-form.
  CONSTRAINT team_client_assignments_role_check CHECK (
    assignment_role IN (
      'content_team',
      'reviewer',
      'scheduler',
      'reporting_support'
    )
  )
);


-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX team_client_assignments_team_user_id_idx ON team_client_assignments (team_user_id);
CREATE INDEX team_client_assignments_client_id_idx    ON team_client_assignments (client_id);
CREATE INDEX team_client_assignments_is_active_idx    ON team_client_assignments (is_active);


-- =============================================================================
-- 3. updated_at trigger
--
-- Mirrors the pattern in 001_auth_user_profiles.sql. If a shared helper
-- (e.g. public.set_updated_at()) is introduced later, swap this trigger to
-- use it instead of the inline function.
-- =============================================================================

CREATE OR REPLACE FUNCTION team_client_assignments_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER team_client_assignments_set_updated_at
  BEFORE UPDATE ON team_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION team_client_assignments_set_updated_at();


-- =============================================================================
-- 4. Helper function — current_team_client_ids() (DRAFT)
--
-- Conceptually returns the set of client_ids the currently authenticated
-- team user has active assignments to. SECURITY DEFINER so policies on
-- business tables don't need direct access to user_profiles /
-- team_client_assignments.
--
-- Defined as DRAFT — uncomment to apply alongside the policies in
-- 002_production_rls_policy_draft.sql. Until then, the policy examples in
-- that file inline the equivalent subquery for clarity.
-- =============================================================================

-- DRAFT — do not run:
--
-- CREATE OR REPLACE FUNCTION current_team_client_ids()
-- RETURNS SETOF uuid
-- LANGUAGE sql STABLE SECURITY DEFINER
-- AS $$
--   SELECT tca.client_id
--   FROM team_client_assignments tca
--   JOIN user_profiles up ON up.user_id = tca.team_user_id
--   WHERE tca.team_user_id = auth.uid()
--     AND tca.is_active = true
--     AND up.role = 'team';
-- $$;


-- =============================================================================
-- 5. RLS
--
-- Enable RLS so the table is locked down by default. Production policies
-- are intentionally NOT defined here — they are sketched in
-- 002_production_rls_policy_draft.sql alongside the rest of the SELECT
-- direction. Commented draft examples are included below for reference.
-- =============================================================================

ALTER TABLE team_client_assignments ENABLE ROW LEVEL SECURITY;

-- DRAFT — do not run:
--
-- -- A team user can read their own assignment rows (so the team portal can
-- -- show "you are assigned to N clients").
-- CREATE POLICY "team_read_own_assignments"
--   ON team_client_assignments FOR SELECT TO authenticated
--   USING (team_user_id = auth.uid());
--
-- -- Operator / owner can read all assignment rows (oversight).
-- CREATE POLICY "operator_owner_read_all_assignments"
--   ON team_client_assignments FOR SELECT TO authenticated
--   USING (current_user_role() IN ('operator', 'owner'));
--
-- -- INSERT / UPDATE / DELETE policies on team_client_assignments are
-- -- explicitly out of scope. Assignment management is an operator/owner
-- -- workflow and will go through a server-side function using the service
-- -- role key — never the browser client.
