-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
-- This file is not active. It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- =============================================================================
--
-- Migration 001 — Identity Foundation (DRAFT)
--
-- Scope:
--   * user_profiles                 (linked to auth.users)
--   * team_members                  (operational profile for staff users)
--   * set_updated_at()              (generic trigger function)
--   * helper functions (private schema): current_user_role,
--     current_user_client_id, is_owner, is_operator, is_team_member,
--     is_system_actor
--   * RLS enabled + base policies on user_profiles and team_members
--   * Indexes for role lookup and assignment scans
--
-- Intentionally deferred to Migration 002 (client foundation):
--   * clients table
--   * team_client_assignments table
--   * The FK constraint on user_profiles.client_id (target table doesn't
--     exist yet — column is created here without the FK, added in 002)
--   * is_assigned_to_client() helper (depends on team_client_assignments
--     AND clients.assigned_operator_id, both created in 002)
--   * can_view_client / can_manage_client_operations / can_manage_pricing
--     (all depend on tables created in 002 or later)
--
-- Source of truth:
--   * docs/SUPABASE_SCHEMA_DRAFT_V1.md
--   * docs/SUPABASE_RLS_PLAN_V1.md
--   * docs/sql_drafts/001_veroxa_schema_draft.sql (table planning notes)
--   * docs/sql_drafts/002_rls_policy_examples.sql (policy planning sketches)
--
-- AUTH_MODE remains "placeholder" until this and downstream migrations
-- have been reviewed, applied to a dev environment, and signed off
-- against the auth activation checklist (RLS plan Part 7).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Schemas
-- -----------------------------------------------------------------------------

-- The `private` schema holds RLS helper functions. It is NOT exposed via
-- PostgREST (Supabase API layer). Functions here are SECURITY DEFINER and
-- must be tightly grant-restricted.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres;
-- (`grant execute on function` per helper is done below, not blanket.)


-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------

-- pgcrypto provides gen_random_uuid(). Supabase enables it by default; this
-- is defensive in case the draft is applied to a vanilla project.
create extension if not exists pgcrypto;


-- -----------------------------------------------------------------------------
-- Generic updated_at trigger function
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- user_profiles
-- -----------------------------------------------------------------------------
--
-- One row per authenticated user. PK == auth.users.id so we can join cheaply.
-- The `role` column drives every RLS helper. The `system` / service role is
-- intentionally NOT a value here — service-role traffic comes from the
-- Supabase service key and bypasses RLS entirely (no user_profiles row).
--
-- client_id: nullable. Only populated for users with role='client'. The FK
-- to clients(id) is INTENTIONALLY deferred to Migration 002 because the
-- clients table does not exist yet. The column is created here so the
-- helper `current_user_client_id()` can be written now without rewriting
-- the table later.

create table public.user_profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text        not null,
  email        text        not null unique,
  role         text        not null
                 check (role in ('client','team','operator','owner')),
  client_id    uuid        null,
                  -- FK to clients(id) added in Migration 002.
  avatar_url   text        null,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table  public.user_profiles is
  'One row per authenticated user. Joined 1:1 with auth.users via id. Role drives all RLS.';
comment on column public.user_profiles.client_id is
  'Only set when role = ''client''. FK to public.clients(id) is added in Migration 002.';
comment on column public.user_profiles.is_active is
  'Soft-deactivation flag. Inactive users still own their row (cascade preserved) but policies should treat them as disabled. See Migration 001 test plan, "inactive users handling".';

create index user_profiles_role_idx  on public.user_profiles (role);
create index user_profiles_email_idx on public.user_profiles (email);

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- team_members
-- -----------------------------------------------------------------------------
--
-- Operational profile for users with role in ('team','operator'). Keeps
-- staff-specific fields out of user_profiles.
--
-- Client assignments are INTENTIONALLY excluded from Migration 001 and
-- will be handled by team_client_assignments in Migration 002. Earlier
-- drafts had `assigned_client_ids uuid[]` on this table — that is the
-- deprecated design and is NOT created here.

create table public.team_members (
  id              uuid        primary key default gen_random_uuid(),
  user_profile_id uuid        not null unique
                     references public.user_profiles(id) on delete cascade,
  role_label      text        not null,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.team_members is
  'Operational profile for staff users. Client assignments live in team_client_assignments (Migration 002), NOT here.';
comment on column public.team_members.is_active is
  'Soft-deactivation for staff. Does not affect their user_profiles.is_active.';

create index team_members_user_profile_id_idx on public.team_members (user_profile_id);
create index team_members_is_active_idx       on public.team_members (is_active);

create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Helper functions (private schema, SECURITY DEFINER)
-- -----------------------------------------------------------------------------
--
-- Safety rules (from RLS plan Part 4):
--   * explicit schema (`private.*`), fully-qualified table refs
--   * set search_path = pg_catalog, public  (defeats search-path hijack)
--   * stable (cacheable per statement)
--   * no exceptions raised to the caller
--   * no dynamic SQL
--   * read only from schema-controlled tables (user_profiles here; later
--     migrations add team_members, team_client_assignments, clients)
--   * EXECUTE is revoked from public and granted explicitly

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select role
  from public.user_profiles
  where id = auth.uid()
    and is_active = true;
$$;

create or replace function private.current_user_client_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when up.role = 'client' and up.is_active = true
    then up.client_id
    else null
  end
  from public.user_profiles up
  where up.id = auth.uid();
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(private.current_user_role() = 'owner', false);
$$;

create or replace function private.is_operator()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  -- Owner inherits all operator capabilities.
  select coalesce(private.current_user_role() in ('operator','owner'), false);
$$;

create or replace function private.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  -- Operator/Owner inherit team visibility.
  select coalesce(
    private.current_user_role() in ('team','operator','owner'),
    false
  );
$$;

create or replace function private.is_system_actor()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  -- True when the caller is the Supabase service role (no end-user JWT).
  -- Service-role traffic bypasses RLS by definition; this helper exists
  -- so app-side code can branch on "is this a system context" too.
  select coalesce(auth.role() = 'service_role', false);
$$;

-- NOTE — DEFERRED TO MIGRATION 002:
--   private.is_assigned_to_client(uuid)
--   private.can_view_client(uuid)
--   private.can_manage_client_operations(uuid)
--   private.can_manage_pricing()
-- These depend on the clients table and the team_client_assignments join
-- table, neither of which exist until Migration 002. Adding them here
-- with NULL tables would either fail to compile or fail-open silently.

-- Grant EXECUTE explicitly. Default policy: nothing for `public`,
-- read-only helpers for authenticated end users, full access for the
-- service role.
revoke execute on function private.current_user_role()         from public;
revoke execute on function private.current_user_client_id()    from public;
revoke execute on function private.is_owner()                  from public;
revoke execute on function private.is_operator()               from public;
revoke execute on function private.is_team_member()            from public;
revoke execute on function private.is_system_actor()           from public;

grant execute on function private.current_user_role()        to authenticated, service_role;
grant execute on function private.current_user_client_id()   to authenticated, service_role;
grant execute on function private.is_owner()                 to authenticated, service_role;
grant execute on function private.is_operator()              to authenticated, service_role;
grant execute on function private.is_team_member()           to authenticated, service_role;
grant execute on function private.is_system_actor()          to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.team_members  enable row level security;

-- user_profiles ---------------------------------------------------------------

-- 1. A user can SELECT their own row.
create policy user_profiles_select_self
  on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid());

-- 2. Operator and Owner can SELECT all rows.
create policy user_profiles_select_staff
  on public.user_profiles
  for select
  to authenticated
  using (private.is_operator());

-- 3. A user can UPDATE their own row, but only the safe self-edit
--    fields: display_name, avatar_url. The sensitive fields
--    (role, client_id, email, is_active) are owner-only — enforced by
--    the `user_profiles_column_write_guard` trigger below, because
--    RLS cannot column-restrict UPDATE.
--
--    Self-edit allowed/denied matrix (enforced by policy + trigger):
--      ALLOWED self-edit for any role:  display_name, avatar_url
--      DENIED for non-owner:            role, client_id, email, is_active
--      DENIED even for owner on own:    role (anti-self-demotion lockout)
create policy user_profiles_update_self
  on public.user_profiles
  for update
  to authenticated
  using       (id = auth.uid())
  with check  (id = auth.uid());

-- 4. Owner has full access (insert / update / delete).
create policy user_profiles_owner_all
  on public.user_profiles
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- 5. Column-write guard: enforces "owner-only" writes on sensitive columns
--    that the `update_self` policy would otherwise allow. RLS can't
--    column-restrict UPDATE, so this trigger does it.
--
--    Sensitive columns (owner-only): role, is_active, client_id, email.
--      * role + is_active + client_id — protect identity and tenant binding.
--      * email — drives Supabase Auth password-reset and notifications;
--        a self-edit would silently redirect those flows. Future verified-
--        email flow can relax this by routing changes through a separate
--        controlled function.
--    Special case: even Owner cannot change their own `role` (anti-lockout
--    / anti-self-demotion).
--
--    The function below replaces an earlier draft named
--    `user_profiles_guard_role_change` — renamed because it now guards
--    more than just role.
create or replace function private.user_profiles_column_write_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.role is distinct from old.role then
    if not private.is_owner() then
      raise exception 'role changes are restricted to owner';
    end if;
    if new.id = auth.uid() then
      raise exception 'users cannot change their own role';
    end if;
  end if;

  if new.is_active is distinct from old.is_active then
    if not private.is_owner() then
      raise exception 'is_active changes are restricted to owner';
    end if;
  end if;

  if new.client_id is distinct from old.client_id then
    if not private.is_owner() then
      raise exception 'client_id changes are restricted to owner';
    end if;
  end if;

  if new.email is distinct from old.email then
    if not private.is_owner() then
      raise exception 'email changes are restricted to owner (use the verified-email flow when available)';
    end if;
  end if;

  return new;
end;
$$;

create trigger user_profiles_column_write_guard_trg
  before update on public.user_profiles
  for each row execute function private.user_profiles_column_write_guard();

-- team_members ----------------------------------------------------------------

-- 1. A team user can SELECT their own team_member row (joined via
--    user_profile_id == auth.uid()).
create policy team_members_select_self
  on public.team_members
  for select
  to authenticated
  using (user_profile_id = auth.uid());

-- 2. Operator and Owner can SELECT all team_members.
create policy team_members_select_staff
  on public.team_members
  for select
  to authenticated
  using (private.is_operator());

-- 3. Owner has full INSERT / UPDATE / DELETE.
create policy team_members_owner_all
  on public.team_members
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- Note: there is intentionally NO policy granting anon or public access
-- to either table. Without a matching policy, RLS denies by default.


-- -----------------------------------------------------------------------------
-- End of Migration 001 draft.
-- -----------------------------------------------------------------------------
commit;

-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- =============================================================================
