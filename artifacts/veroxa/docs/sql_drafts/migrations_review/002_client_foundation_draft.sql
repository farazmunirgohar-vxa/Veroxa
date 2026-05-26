-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- Migration 002 — Client Foundation (DRAFT)
--
-- Depends on Migration 001 (identity foundation). MUST NOT apply before
-- 001 has succeeded. Required pre-existing objects:
--   * public.user_profiles (with the `client_id` column already present
--     but no FK)
--   * public.team_members
--   * the `private` schema and the six identity helpers
--   * public.set_updated_at() trigger function
--
-- Scope (this file):
--   * public.clients
--   * public.team_client_assignments  (replaces deprecated
--     team_members.assigned_client_ids uuid[])
--   * public.client_platforms
--   * public.onboarding_items
--   * public.client_requests
--   * FK addition: user_profiles.client_id → clients(id) on delete set null
--   * Pricing-write owner-only trigger on clients
--   * Helpers (private): is_assigned_to_client, can_view_client,
--     can_manage_client_operations, can_manage_pricing
--   * RLS + base policies on all five tables
--   * Indexes
--   * Commented client-safe view stubs (real CREATE VIEW deferred to M003
--     when the portal connects)
--
-- Intentionally NOT in scope (deferred to M003+):
--   * media_assets, media_versions
--   * posts, post_slots, post_schedule_windows
--   * reports, report_sections
--   * notifications, activity_logs
--   * AI / content concept tables
--   * Storage buckets and storage RLS
--   * Publishing integration tables
--   * Financial snapshots
--
-- Source-of-truth references:
--   * docs/MIGRATION_002_CLIENT_FOUNDATION_PLAN.md (this file's blueprint)
--   * docs/SUPABASE_SCHEMA_DRAFT_V1.md
--   * docs/SUPABASE_RLS_PLAN_V1.md
--   * docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. clients
-- -----------------------------------------------------------------------------
--
-- timezone is required — no Toronto default. Demo seed may use America/Chicago.
-- monthly_fee_cents is cents, never dollars. Owner-only writes are enforced by
-- the `clients_pricing_write_guard` trigger below; service_package /
-- plan_type / contract_months / start_date / assigned_operator_id are also
-- owner-only.
--
-- Pricing reference (must remain unchanged from the locked pricing table):
--   GPS                     -> service_package='google_presence_starter'  -> 49700
--   COP 12-month            -> service_package='complete_online_presence' -> 99700
--   COP 6-month             -> service_package='complete_online_presence' -> 109700
--   COP 3-month             -> service_package='complete_online_presence' -> 119700
--   COP no-contract         -> service_package='complete_online_presence' -> 149700
-- Google Presence Starter is a SERVICE_PACKAGE, not a plan_type.

create table public.clients (
  id                          uuid        primary key default gen_random_uuid(),
  business_name               text        not null,
  legal_name                  text        null,
  primary_contact_name        text        not null,
  primary_contact_email       text        not null,
  primary_contact_phone       text        null,
  secondary_contact_name      text        null,
  secondary_contact_email     text        null,
  cuisine_type                text        null,
  address                     text        null,
  website_url                 text        null,
  hours_text                  text        null,
  plan_type                   text        not null
    check (plan_type in ('twelve_month','six_month','three_month','no_contract','month_to_month')),
  service_package             text        not null
    check (service_package in ('google_presence_starter','complete_online_presence','ads_addon','ads_only','bundle')),
  monthly_fee_cents           integer     not null,
  contract_months             integer     null,
  start_date                  date        null,
  posting_frequency_weekly    integer     not null default 3,
  timezone                    text        not null,
  assigned_operator_id        uuid        null
    references public.user_profiles(id) on delete set null,
  assigned_team_label         text        null,
  account_status              text        not null default 'onboarding',
  content_health_status       text        not null default 'healthy',
  risk_status                 text        not null default 'good',
  onboarding_complete         boolean     not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table  public.clients is
  'One row per business account. RLS-scoped per role. Owner-only writes on pricing & assignment columns enforced by clients_pricing_write_guard trigger.';
comment on column public.clients.timezone is
  'IANA timezone; required, no default. Demo seed may use America/Chicago.';
comment on column public.clients.monthly_fee_cents is
  'Monetary value in CENTS, never dollars. Owner-only writes.';
comment on column public.clients.service_package is
  'Google Presence Starter is a service_package, NOT a plan_type. Owner-only writes.';

create index clients_account_status_idx       on public.clients (account_status);
create index clients_service_package_idx      on public.clients (service_package);
create index clients_plan_type_idx            on public.clients (plan_type);
create index clients_assigned_operator_id_idx on public.clients (assigned_operator_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. Add FK on user_profiles.client_id (deferred from Migration 001)
-- -----------------------------------------------------------------------------
--
-- Pre-flight: every existing user_profiles.client_id is NULL or points to
-- a real clients.id. On a greenfield install nothing has been written yet,
-- so this is safe. Otherwise null out orphans first.
--
-- on delete set null: removing a client unlinks the user but does not
-- delete their profile.

alter table public.user_profiles
  add constraint user_profiles_client_id_fkey
  foreign key (client_id) references public.clients(id)
  on delete set null;


-- -----------------------------------------------------------------------------
-- 3. team_client_assignments
-- -----------------------------------------------------------------------------
--
-- Replaces the deprecated team_members.assigned_client_ids uuid[].
-- Deactivate by flipping is_active=false; do NOT insert duplicates.

create table public.team_client_assignments (
  id              uuid        primary key default gen_random_uuid(),
  team_member_id  uuid        not null
    references public.team_members(id) on delete cascade,
  client_id       uuid        not null
    references public.clients(id) on delete cascade,
  assignment_role text        not null default 'executor'
    check (assignment_role in ('executor','reviewer','scheduler','reporter','lead')),
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (team_member_id, client_id)
);

comment on table  public.team_client_assignments is
  'Join table for staff-to-client assignments. Replaces deprecated assigned_client_ids array. Deactivate via is_active=false, do not delete-and-reinsert (preserves audit trail).';

create index team_client_assignments_team_member_id_idx
  on public.team_client_assignments (team_member_id);
create index team_client_assignments_client_id_idx
  on public.team_client_assignments (client_id);
create index team_client_assignments_is_active_idx
  on public.team_client_assignments (is_active);

create trigger team_client_assignments_set_updated_at
  before update on public.team_client_assignments
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. client_platforms
-- -----------------------------------------------------------------------------
--
-- `notes` is INTERNAL — must be hidden from client-facing views. See
-- the commented client_portal_platforms_view stub at the bottom.

create table public.client_platforms (
  id                  uuid        primary key default gen_random_uuid(),
  client_id           uuid        not null
    references public.clients(id) on delete cascade,
  platform_name       text        not null
    check (platform_name in ('instagram','facebook','google_business','tiktok','other')),
  access_status       text        not null default 'pending'
    check (access_status in ('pending','granted','verified','revoked')),
  username_or_handle  text        null,
  notes               text        null,
  last_verified_at    timestamptz null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column public.client_platforms.notes is
  'Internal staff notes. Never exposed through client-facing views.';

create index client_platforms_client_id_idx     on public.client_platforms (client_id);
create index client_platforms_platform_name_idx on public.client_platforms (platform_name);

create trigger client_platforms_set_updated_at
  before update on public.client_platforms
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 5. onboarding_items
-- -----------------------------------------------------------------------------

create table public.onboarding_items (
  id                  uuid        primary key default gen_random_uuid(),
  client_id           uuid        not null
    references public.clients(id) on delete cascade,
  item_key            text        not null,
  item_label          text        not null,
  description         text        null,
  status              text        not null default 'not_started'
    check (status in ('not_started','pending','complete','blocked')),
  owner_role          text        not null
    check (owner_role in ('client','team','operator','veroxa')),
  priority            text        not null default 'medium',
  completed_by_role   text        null,
  completed_at        timestamptz null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, item_key)
);

create index onboarding_items_client_id_idx on public.onboarding_items (client_id);
create index onboarding_items_status_idx    on public.onboarding_items (status);

create trigger onboarding_items_set_updated_at
  before update on public.onboarding_items
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 6. client_requests
-- -----------------------------------------------------------------------------

create table public.client_requests (
  id                      uuid        primary key default gen_random_uuid(),
  client_id               uuid        not null
    references public.clients(id) on delete cascade,
  request_type            text        not null,
  title                   text        not null,
  description             text        null,
  status                  text        not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  priority                text        not null default 'normal'
    check (priority in ('low','normal','high')),
  requested_by_user_id    uuid        null
    references public.user_profiles(id) on delete set null,
  assigned_to_role        text        null
    check (assigned_to_role in ('team','operator','owner')),
  due_date                date        null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index client_requests_client_id_idx on public.client_requests (client_id);
create index client_requests_status_idx    on public.client_requests (status);

create trigger client_requests_set_updated_at
  before update on public.client_requests
  for each row execute function public.set_updated_at();


-- =============================================================================
-- HELPER FUNCTIONS (private schema)
-- =============================================================================
--
-- All helpers follow the M001 safety pattern: explicit schema, security
-- definer, stable, explicit search_path, no dynamic SQL, false fallback,
-- EXECUTE revoked from public and granted only to authenticated +
-- service_role.

-- is_assigned_to_client(p_client)
--   true when: caller is operator/owner (short-circuit), OR caller has an
--   ACTIVE row in team_client_assignments for this client AND the
--   underlying team_members row is also active.
create or replace function private.is_assigned_to_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    private.is_operator()
    or exists (
      select 1
      from public.team_client_assignments tca
      join public.team_members            tm  on tm.id = tca.team_member_id
      where tca.client_id = p_client
        and tca.is_active = true
        and tm.is_active  = true
        and tm.user_profile_id = auth.uid()
    ),
    false
  );
$$;

-- can_view_client(p_client)
--   true when: caller is the client owning the row, OR operator/owner,
--   OR has an active assignment to the client.
create or replace function private.can_view_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    private.current_user_client_id() = p_client
    or private.is_assigned_to_client(p_client),  -- short-circuits operator/owner
    false
  );
$$;

-- can_manage_client_operations(p_client)
--   true for operator/owner; for team, only when an active assignment
--   exists with a non-reporter role; never for clients.
create or replace function private.can_manage_client_operations(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    private.is_operator()
    or exists (
      select 1
      from public.team_client_assignments tca
      join public.team_members            tm  on tm.id = tca.team_member_id
      where tca.client_id = p_client
        and tca.is_active = true
        and tm.is_active  = true
        and tm.user_profile_id = auth.uid()
        and tca.assignment_role in ('executor','reviewer','scheduler','lead')
    ),
    false
  );
$$;

-- can_manage_pricing()
--   owner-only. Trivial alias today; the indirection lets future logic
--   (e.g. owner + business-hours + 2FA) plug in without rewriting every
--   policy that depends on it.
create or replace function private.can_manage_pricing()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select private.is_owner();
$$;

revoke execute on function private.is_assigned_to_client(uuid)        from public;
revoke execute on function private.can_view_client(uuid)              from public;
revoke execute on function private.can_manage_client_operations(uuid) from public;
revoke execute on function private.can_manage_pricing()               from public;

grant  execute on function private.is_assigned_to_client(uuid)        to authenticated, service_role;
grant  execute on function private.can_view_client(uuid)              to authenticated, service_role;
grant  execute on function private.can_manage_client_operations(uuid) to authenticated, service_role;
grant  execute on function private.can_manage_pricing()               to authenticated, service_role;


-- =============================================================================
-- PRICING-WRITE OWNER-ONLY GUARD (trigger on clients)
-- =============================================================================
--
-- Same pattern as M001's user_profiles_column_write_guard: RLS can't
-- column-restrict UPDATE, so a trigger enforces it. Owner-only columns:
-- monthly_fee_cents, plan_type, service_package, contract_months,
-- start_date, assigned_operator_id.

create or replace function private.clients_pricing_write_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.monthly_fee_cents is distinct from old.monthly_fee_cents then
    if not private.can_manage_pricing() then
      raise exception 'monthly_fee_cents changes are restricted to owner';
    end if;
  end if;

  if new.plan_type is distinct from old.plan_type then
    if not private.can_manage_pricing() then
      raise exception 'plan_type changes are restricted to owner';
    end if;
  end if;

  if new.service_package is distinct from old.service_package then
    if not private.can_manage_pricing() then
      raise exception 'service_package changes are restricted to owner';
    end if;
  end if;

  if new.contract_months is distinct from old.contract_months then
    if not private.can_manage_pricing() then
      raise exception 'contract_months changes are restricted to owner';
    end if;
  end if;

  if new.start_date is distinct from old.start_date then
    if not private.can_manage_pricing() then
      raise exception 'start_date changes are restricted to owner';
    end if;
  end if;

  if new.assigned_operator_id is distinct from old.assigned_operator_id then
    if not private.is_owner() then
      raise exception 'assigned_operator_id changes are restricted to owner';
    end if;
  end if;

  return new;
end;
$$;

create trigger clients_pricing_write_guard_trg
  before update on public.clients
  for each row execute function private.clients_pricing_write_guard();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.clients                  enable row level security;
alter table public.team_client_assignments  enable row level security;
alter table public.client_platforms         enable row level security;
alter table public.onboarding_items         enable row level security;
alter table public.client_requests          enable row level security;

-- clients ---------------------------------------------------------------------

-- Client sees own row. Note: client-facing reads SHOULD go through
-- client_portal_clients_view (commented stub below) so that sensitive
-- columns like monthly_fee_cents are not exposed. The base-table policy
-- here is permissive on the row but the view enforces column hiding.
create policy clients_select_own_client
  on public.clients
  for select
  to authenticated
  using (id = private.current_user_client_id());

-- Team sees only assigned clients.
create policy clients_select_assigned_team
  on public.clients
  for select
  to authenticated
  using (private.is_assigned_to_client(id));
  -- is_assigned_to_client short-circuits true for operator/owner, so
  -- this policy also covers them for SELECT.

-- Operator can update operational fields (NOT pricing/assignment —
-- enforced by clients_pricing_write_guard trigger).
create policy clients_update_operator
  on public.clients
  for update
  to authenticated
  using       (private.is_operator())
  with check  (private.is_operator());

-- Owner has full access.
create policy clients_owner_all
  on public.clients
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- team_client_assignments ------------------------------------------------------

-- Team sees own ACTIVE assignments only.
create policy tca_select_self_team
  on public.team_client_assignments
  for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.team_members tm
      where tm.id = team_member_id
        and tm.user_profile_id = auth.uid()
    )
  );

-- Operator can SELECT all (read-only; no insert/update policy for operator).
create policy tca_select_staff
  on public.team_client_assignments
  for select
  to authenticated
  using (private.is_operator());

-- Owner has full access (create / update / deactivate).
create policy tca_owner_all
  on public.team_client_assignments
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- client_platforms ------------------------------------------------------------

-- Client sees own platform rows. Column-hiding (notes) is enforced by
-- the client_portal_platforms_view stub below — client portal MUST
-- query the view, not the base table.
create policy client_platforms_select_own_client
  on public.client_platforms
  for select
  to authenticated
  using (client_id = private.current_user_client_id());

-- Team / operator / owner can read for clients they can view.
create policy client_platforms_select_staff
  on public.client_platforms
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team can manage assigned-client platforms (insert / update).
create policy client_platforms_manage_assigned
  on public.client_platforms
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access (redundant with manage_assigned for owner, but
-- explicit for audit clarity).
create policy client_platforms_owner_all
  on public.client_platforms
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- onboarding_items ------------------------------------------------------------

-- Client sees own client's items.
create policy onboarding_items_select_own_client
  on public.onboarding_items
  for select
  to authenticated
  using (client_id = private.current_user_client_id());

-- Client can update only items they own (owner_role='client') on their
-- own client. The portal mutation layer (M003+) should further limit
-- which columns can change (status only).
create policy onboarding_items_update_own_client_items
  on public.onboarding_items
  for update
  to authenticated
  using       (client_id = private.current_user_client_id() and owner_role = 'client')
  with check  (client_id = private.current_user_client_id() and owner_role = 'client');

-- Team / operator / owner can SELECT items for clients they can view.
create policy onboarding_items_select_staff
  on public.onboarding_items
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team can update items on assigned clients.
create policy onboarding_items_manage_assigned
  on public.onboarding_items
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access.
create policy onboarding_items_owner_all
  on public.onboarding_items
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- client_requests -------------------------------------------------------------

-- Client SELECT own.
create policy client_requests_select_own_client
  on public.client_requests
  for select
  to authenticated
  using (client_id = private.current_user_client_id());

-- Client INSERT own (client_id must match current_user_client_id).
create policy client_requests_insert_own_client
  on public.client_requests
  for insert
  to authenticated
  with check (client_id = private.current_user_client_id());

-- Client UPDATE own — RLS permits the row; the portal mutation layer
-- (M003+) restricts which columns/values change (e.g. only status flip
-- from pending → cancelled).
create policy client_requests_update_own_client
  on public.client_requests
  for update
  to authenticated
  using       (client_id = private.current_user_client_id())
  with check  (client_id = private.current_user_client_id());

-- Team / operator / owner can SELECT for clients they can view.
create policy client_requests_select_staff
  on public.client_requests
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team can update assigned-client requests.
create policy client_requests_manage_assigned
  on public.client_requests
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access.
create policy client_requests_owner_all
  on public.client_requests
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());


-- =============================================================================
-- CLIENT-SAFE VIEW STUBS (commented — finalized in M003 portal pass)
-- =============================================================================
--
-- These views are referenced by RLS policy comments above. Real CREATE
-- VIEW statements with security_invoker=true are deferred to Migration
-- 003 (Client Portal Read Layer) when the React portal connects to
-- Supabase. They MUST be finalized before AUTH_MODE flips to "real".
--
-- Pattern: every view uses `with (security_invoker = true)` so that the
-- caller's RLS is applied at the base table; the view itself does the
-- COLUMN hiding (which RLS can't do).
--
-- create view public.client_portal_clients_view
--   with (security_invoker = true) as
-- select
--   id,
--   business_name,
--   primary_contact_name,
--   primary_contact_email,
--   primary_contact_phone,
--   cuisine_type,
--   address,
--   website_url,
--   hours_text,
--   account_status,
--   onboarding_complete,
--   created_at,
--   updated_at
-- from public.clients
-- where id = private.current_user_client_id();
-- -- Hidden: monthly_fee_cents, plan_type, service_package,
-- -- contract_months, start_date, assigned_operator_id,
-- -- assigned_team_label, content_health_status, risk_status.
--
-- create view public.client_portal_platforms_view
--   with (security_invoker = true) as
-- select
--   id,
--   client_id,
--   platform_name,
--   access_status,
--   username_or_handle,
--   last_verified_at,
--   created_at,
--   updated_at
-- from public.client_platforms
-- where client_id = private.current_user_client_id();
-- -- Hidden: notes.
--
-- create view public.client_portal_onboarding_view
--   with (security_invoker = true) as
-- select
--   id,
--   client_id,
--   item_key,
--   item_label,
--   description,
--   status,
--   owner_role,
--   priority,
--   completed_at,
--   created_at,
--   updated_at
-- from public.onboarding_items
-- where client_id = private.current_user_client_id();
-- -- Hidden: completed_by_role (internal audit only).
--
-- create view public.client_portal_requests_view
--   with (security_invoker = true) as
-- select
--   id,
--   client_id,
--   request_type,
--   title,
--   description,
--   status,
--   priority,
--   due_date,
--   created_at,
--   updated_at
-- from public.client_requests
-- where client_id = private.current_user_client_id();
-- -- Hidden: assigned_to_role, requested_by_user_id (internal routing).
--
-- After creating the views in M003, also:
--   revoke all on public.clients,         public.client_platforms,
--          public.onboarding_items,       public.client_requests
--     from authenticated;  -- force the client portal through the views
--   grant select on each view to authenticated;
-- ...but only after the staff app has been migrated to use the same
-- views or to use the service-role path. Do NOT issue these revokes in
-- Migration 002.


-- -----------------------------------------------------------------------------
-- End of Migration 002 draft.
-- -----------------------------------------------------------------------------
commit;

-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- Migration 002 must be applied AFTER Migration 001 succeeds.
-- =============================================================================
