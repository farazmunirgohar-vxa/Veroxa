-- =============================================================================
-- M001 APPLY — DEV SUPABASE ONLY
--
-- Source: docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql
-- Target: A clean dev Supabase project with no prior schema.
--
-- How to run:
--   1. Open the Supabase dashboard → SQL Editor.
--   2. Make absolutely sure this is the DEV project (check the project
--      name in the top-left corner of the dashboard).
--   3. Paste this entire file and click Run.
--   4. Expected result: "Success. No rows returned." for each statement.
--   5. If any statement fails, STOP. Do not patch silently. Report the error.
--
-- This file is identical to 001_identity_foundation_draft.sql minus the
-- "DO NOT RUN" header. The content is unchanged.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Schemas
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres;

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
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
  select coalesce(private.current_user_role() in ('operator','owner'), false);
$$;

create or replace function private.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
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
  select coalesce(auth.role() = 'service_role', false);
$$;

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

-- user_profiles policies
create policy user_profiles_select_self
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

create policy user_profiles_select_staff
  on public.user_profiles for select to authenticated
  using (private.is_operator());

create policy user_profiles_update_self
  on public.user_profiles for update to authenticated
  using       (id = auth.uid())
  with check  (id = auth.uid());

create policy user_profiles_owner_all
  on public.user_profiles for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- Column-write guard trigger
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

-- team_members policies
create policy team_members_select_self
  on public.team_members for select to authenticated
  using (user_profile_id = auth.uid());

create policy team_members_select_staff
  on public.team_members for select to authenticated
  using (private.is_operator());

create policy team_members_owner_all
  on public.team_members for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

commit;

-- =============================================================================
-- VERIFY: after running this, check the following in Table Editor:
--   * public.user_profiles exists with the correct columns
--   * public.team_members exists
--   * The private schema exists
-- =============================================================================
