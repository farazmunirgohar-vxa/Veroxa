-- =============================================================================
-- M002 APPLY — DEV SUPABASE ONLY — NOT PRODUCTION
--
-- Source: docs/sql_drafts/migrations_review/002_client_foundation_draft.sql
-- Target: dev Supabase project where M001 has been applied and tested green.
--
-- HARD PRECONDITION:
--   * M001 already applied (public.user_profiles, public.team_members,
--     private.* helpers, public.set_updated_at()).
--   * M001 dev test green.
--
-- HOW TO RUN:
--   1. Open the Supabase dashboard → SQL Editor.
--   2. Confirm the project name in the top-left is the DEV project.
--   3. Paste this entire file and click Run.
--   4. Expected: success on every statement.
--   5. If any statement errors: STOP. Do not patch silently. Report and
--      restore from snapshot.
--
-- This file is identical to 002_client_foundation_draft.sql minus the
-- "DO NOT RUN" header. The content is otherwise unchanged.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. clients
-- -----------------------------------------------------------------------------
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
alter table public.user_profiles
  add constraint user_profiles_client_id_fkey
  foreign key (client_id) references public.clients(id)
  on delete set null;

-- -----------------------------------------------------------------------------
-- 3. team_client_assignments
-- -----------------------------------------------------------------------------
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

create index team_client_assignments_team_member_id_idx on public.team_client_assignments (team_member_id);
create index team_client_assignments_client_id_idx      on public.team_client_assignments (client_id);
create index team_client_assignments_is_active_idx      on public.team_client_assignments (is_active);

create trigger team_client_assignments_set_updated_at
  before update on public.team_client_assignments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. client_platforms
-- -----------------------------------------------------------------------------
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

create or replace function private.can_view_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    private.current_user_client_id() = p_client
    or private.is_assigned_to_client(p_client),
    false
  );
$$;

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
-- PRICING-WRITE OWNER-ONLY GUARD
-- =============================================================================

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

-- clients
create policy clients_select_own_client
  on public.clients for select to authenticated
  using (id = private.current_user_client_id());

create policy clients_select_assigned_team
  on public.clients for select to authenticated
  using (private.is_assigned_to_client(id));

create policy clients_update_operator
  on public.clients for update to authenticated
  using       (private.is_operator())
  with check  (private.is_operator());

create policy clients_owner_all
  on public.clients for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- team_client_assignments
create policy tca_select_self_team
  on public.team_client_assignments for select to authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.team_members tm
      where tm.id = team_member_id
        and tm.user_profile_id = auth.uid()
    )
  );

create policy tca_select_staff
  on public.team_client_assignments for select to authenticated
  using (private.is_operator());

create policy tca_owner_all
  on public.team_client_assignments for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- client_platforms
create policy client_platforms_select_own_client
  on public.client_platforms for select to authenticated
  using (client_id = private.current_user_client_id());

create policy client_platforms_select_staff
  on public.client_platforms for select to authenticated
  using (private.can_view_client(client_id));

create policy client_platforms_manage_assigned
  on public.client_platforms for all to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

create policy client_platforms_owner_all
  on public.client_platforms for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- onboarding_items
create policy onboarding_items_select_own_client
  on public.onboarding_items for select to authenticated
  using (client_id = private.current_user_client_id());

create policy onboarding_items_update_own_client_items
  on public.onboarding_items for update to authenticated
  using       (client_id = private.current_user_client_id() and owner_role = 'client')
  with check  (client_id = private.current_user_client_id() and owner_role = 'client');

create policy onboarding_items_select_staff
  on public.onboarding_items for select to authenticated
  using (private.can_view_client(client_id));

create policy onboarding_items_manage_assigned
  on public.onboarding_items for all to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

create policy onboarding_items_owner_all
  on public.onboarding_items for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- client_requests
create policy client_requests_select_own_client
  on public.client_requests for select to authenticated
  using (client_id = private.current_user_client_id());

create policy client_requests_insert_own_client
  on public.client_requests for insert to authenticated
  with check (client_id = private.current_user_client_id());

create policy client_requests_update_own_client
  on public.client_requests for update to authenticated
  using       (client_id = private.current_user_client_id())
  with check  (client_id = private.current_user_client_id());

create policy client_requests_select_staff
  on public.client_requests for select to authenticated
  using (private.can_view_client(client_id));

create policy client_requests_manage_assigned
  on public.client_requests for all to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

create policy client_requests_owner_all
  on public.client_requests for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

commit;

-- =============================================================================
-- NOTE on deprecated array column:
--   This migration does NOT touch any team_members.assigned_client_ids
--   uuid[] column because it never existed in M001. team_client_assignments
--   is the only assignment surface. If a future audit finds a stray array
--   column, that is a separate cleanup migration.
--
-- NOTE on client-safe views:
--   The view stubs at the bottom of 002_client_foundation_draft.sql remain
--   commented. Real CREATE VIEW + revoke-from-authenticated lands in M003
--   portal-connect, not here.
-- =============================================================================
