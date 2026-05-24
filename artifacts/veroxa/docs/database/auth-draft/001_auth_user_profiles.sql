-- =============================================================================
-- 001_auth_user_profiles.sql
-- Veroxa — DRAFT ONLY: real auth data model (user_profiles + role enum)
-- =============================================================================
--
-- STATUS: DRAFT ONLY — DO NOT RUN YET.
--
-- PURPOSE:
--   Plan the schema that will map Supabase Auth users (auth.users) to a
--   Veroxa role (client / team / operator / owner) and, when applicable,
--   a tenant scope (client_id). This is the foundation that future
--   production RLS policies will depend on.
--
-- CONTEXT:
--   - Current /demo/* routes are public and do not use auth.
--   - Current /login is a demo role router only.
--   - Client Portal currently reads dev data via anon SELECT (see
--     ../rls-draft/001_dev_read_policies.sql), which is dev-only.
--   - Team, Operator, and Owner portals are static demo-only and are not
--     wired to Supabase at all.
--
-- DO NOT:
--   - Apply this file to any Supabase project yet.
--   - Add corresponding frontend writes during this planning phase.
--   - Wire Supabase Auth in the app during this planning phase.
--   - Expose the service role key to the frontend, ever.
--
-- REQUIRES (when applied later):
--   - Supabase Auth enabled on the project (auth.users present).
--   - The existing `clients` table (see ../migrations-draft/002_create_tables.sql).
--
-- NEXT FILE:
--   - 002_production_rls_policy_draft.sql — drafts SELECT-only RLS policy
--     direction that depends on this user_profiles table.
-- =============================================================================


-- =============================================================================
-- 1. Role enum
--
-- Four canonical Veroxa roles. Additional roles (e.g. admin, billing,
-- read-only viewer) are explicitly out of scope for V1.
-- =============================================================================

CREATE TYPE veroxa_user_role AS ENUM (
  'client',
  'team',
  'operator',
  'owner'
);


-- =============================================================================
-- 2. user_profiles
--
-- One row per Supabase Auth user. user_id is both PK and FK to auth.users(id)
-- with ON DELETE CASCADE so deleting an auth user removes their profile.
--
-- client_id is nullable because only the 'client' role is scoped to a single
-- client tenant. Team, operator, and owner roles do not have a client_id in V1.
-- =============================================================================

CREATE TABLE user_profiles (
  user_id       uuid              PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          veroxa_user_role  NOT NULL,
  client_id     uuid              REFERENCES clients(id) ON DELETE SET NULL,
  display_name  text,
  email         text,
  is_active     boolean           NOT NULL DEFAULT true,
  created_at    timestamptz       NOT NULL DEFAULT now(),
  updated_at    timestamptz       NOT NULL DEFAULT now(),

  -- =========================================================================
  -- 3. Role / client_id consistency
  --
  --   - role='client'   → client_id MUST be set.
  --   - role in (team, operator, owner) → client_id MUST be null.
  --
  -- Team assignment is intentionally NOT modelled here — it requires its own
  -- assignment tables (see README.md). For now, team users have no scope at
  -- the profile level; assignment-based scope will come later.
  -- =========================================================================
  CONSTRAINT user_profiles_role_client_id_match CHECK (
    (role = 'client'  AND client_id IS NOT NULL) OR
    (role <> 'client' AND client_id IS NULL)
  )
);


-- =============================================================================
-- 4. Indexes
-- =============================================================================

CREATE INDEX user_profiles_role_idx       ON user_profiles (role);
CREATE INDEX user_profiles_client_id_idx  ON user_profiles (client_id);
CREATE INDEX user_profiles_is_active_idx  ON user_profiles (is_active);


-- =============================================================================
-- 5. updated_at trigger
--
-- The current project does not yet ship a shared updated_at helper. A simple
-- draft function is included here. If a shared helper is introduced later
-- (e.g. public.set_updated_at()), swap this trigger to use it instead of
-- defining the function inline.
-- =============================================================================

CREATE OR REPLACE FUNCTION user_profiles_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_set_updated_at();


-- =============================================================================
-- 6. RLS
--
-- Enable RLS so the table is locked down by default. Production policies are
-- intentionally NOT defined in this file — see 002_production_rls_policy_draft.sql
-- for SELECT policy direction across business tables, and for the policy that
-- will allow a user to read their own profile row.
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- TODO (002_production_rls_policy_draft.sql):
--   - Policy: a signed-in user can SELECT their own row (user_id = auth.uid()).
--   - Policy: operator/owner may SELECT all user_profiles (read-only).
--   - INSERT/UPDATE/DELETE policies are deferred until the user management
--     phase. In V1 the only writer should be a server-side function using
--     the service role key — never the frontend.
