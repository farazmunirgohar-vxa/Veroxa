-- Veroxa pre-intervention acceptance v1.
--
-- Adds one immutable, explicitly non-customer internal acceptance tenant and
-- replay-safe upload sessions. The existing Momo singleton is unchanged.
-- Internal AI may run, while every restaurant-platform/external-write control
-- remains false and the operational-row trigger exposes only the media,
-- assessment, content-generation, and Ready evidence surfaces needed by the
-- acceptance proof.

create extension if not exists pgcrypto;
create schema if not exists veroxa_private;
revoke all on schema veroxa_private
  from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- Immutable internal-acceptance tenant binding
-- -------------------------------------------------------------------------

create table veroxa_private.internal_acceptance_scope_v1 (
  restaurant_id uuid primary key
    references public.veroxa_restaurants(id) on delete restrict,
  singleton_slot smallint not null default 1
    check (singleton_slot = 1),
  scope_key text not null unique check (
    scope_key ~ '^veroxa_internal_acceptance_[a-z0-9_]{3,80}$'
  ),
  client_actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  team_actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  purpose text not null check (purpose = 'synthetic_upload_to_ready'),
  enabled boolean not null default true check (enabled),
  customer_visible boolean not null default false check (not customer_visible),
  excluded_from_reports boolean not null default true
    check (excluded_from_reports),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  created_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  evidence_snapshot jsonb not null
    check (pg_catalog.jsonb_typeof(evidence_snapshot) = 'object'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  unique (singleton_slot),
  check (client_actor_id <> team_actor_id),
  check (created_by = team_actor_id)
);

alter table veroxa_private.internal_acceptance_scope_v1
  enable row level security;
alter table veroxa_private.internal_acceptance_scope_v1
  force row level security;
revoke all on table veroxa_private.internal_acceptance_scope_v1
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_internal_acceptance_scope_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_sha256 text;
  client_memberships integer;
  team_memberships integer;
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514',
      message = 'internal_acceptance_scope_is_immutable';
  end if;

  if exists (
       select 1
       from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = new.restaurant_id
     )
     or not exists (
       select 1
       from public.veroxa_restaurants restaurant
       where restaurant.id = new.restaurant_id
         and restaurant.status = 'active'::public.veroxa_account_status_v1
         and restaurant.name ~* '^Veroxa Internal Acceptance( |$)'
     )
     or not exists (
       select 1
       from public.veroxa_user_profiles profile
       join public.veroxa_restaurant_members member
         on member.user_id = profile.user_id
        and member.restaurant_id = new.restaurant_id
       where profile.user_id = new.client_actor_id
         and profile.role = 'client'::public.veroxa_role_v1
         and member.role = 'client'::public.veroxa_role_v1
         and profile.status = 'active'::public.veroxa_account_status_v1
         and member.status = 'active'::public.veroxa_account_status_v1
     )
     or not exists (
       select 1
       from public.veroxa_user_profiles profile
       join public.veroxa_restaurant_members member
         on member.user_id = profile.user_id
        and member.restaurant_id = new.restaurant_id
       where profile.user_id = new.team_actor_id
         and profile.role = 'team'::public.veroxa_role_v1
         and member.role = 'team'::public.veroxa_role_v1
         and profile.status = 'active'::public.veroxa_account_status_v1
         and member.status = 'active'::public.veroxa_account_status_v1
     ) then
    raise exception using errcode = '23514',
      message = 'invalid_internal_acceptance_scope_binding';
  end if;

  select pg_catalog.count(*)::integer into client_memberships
  from public.veroxa_restaurant_members member
  where member.user_id = new.client_actor_id
    and member.status = 'active'::public.veroxa_account_status_v1;
  select pg_catalog.count(*)::integer into team_memberships
  from public.veroxa_restaurant_members member
  where member.user_id = new.team_actor_id
    and member.status = 'active'::public.veroxa_account_status_v1;
  if client_memberships <> 1 or team_memberships <> 1 then
    raise exception using errcode = '23514',
      message = 'internal_acceptance_actors_require_single_membership';
  end if;

  expected_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(new.evidence_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');
  if new.evidence_snapshot is distinct from pg_catalog.jsonb_build_object(
       'schemaVersion', 'veroxa-internal-acceptance-scope-v1',
       'singletonSlot', 1,
       'scopeKey', new.scope_key,
       'restaurantId', new.restaurant_id,
       'clientActorId', new.client_actor_id,
       'teamActorId', new.team_actor_id,
       'purpose', 'synthetic_upload_to_ready',
       'customerVisible', false,
       'excludedFromReports', true,
       'externalWriteAllowed', false
     )
     or new.evidence_sha256 is distinct from expected_sha256 then
    raise exception using errcode = '23514',
      message = 'invalid_internal_acceptance_scope_evidence';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_internal_acceptance_scope_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_internal_acceptance_scope_guard_v1
before insert or update or delete
on veroxa_private.internal_acceptance_scope_v1
for each row execute function
  veroxa_private.guard_internal_acceptance_scope_v1();

create or replace function
  veroxa_private.internal_acceptance_scope_active_v1(
    p_restaurant_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_restaurant_id is not null and exists (
    select 1
    from veroxa_private.internal_acceptance_scope_v1 scope
    join public.veroxa_restaurants restaurant
      on restaurant.id = scope.restaurant_id
    join public.veroxa_restaurant_members client_member
      on client_member.restaurant_id = scope.restaurant_id
     and client_member.user_id = scope.client_actor_id
    join public.veroxa_user_profiles client_profile
      on client_profile.user_id = client_member.user_id
    join public.veroxa_restaurant_members team_member
      on team_member.restaurant_id = scope.restaurant_id
     and team_member.user_id = scope.team_actor_id
    join public.veroxa_user_profiles team_profile
      on team_profile.user_id = team_member.user_id
    where scope.restaurant_id = p_restaurant_id
      and scope.enabled
      and not scope.customer_visible
      and scope.excluded_from_reports
      and not scope.external_write_allowed
      and scope.purpose = 'synthetic_upload_to_ready'
      and restaurant.status = 'active'::public.veroxa_account_status_v1
      and client_member.role = 'client'::public.veroxa_role_v1
      and client_profile.role = 'client'::public.veroxa_role_v1
      and client_member.status = 'active'::public.veroxa_account_status_v1
      and client_profile.status = 'active'::public.veroxa_account_status_v1
      and team_member.role = 'team'::public.veroxa_role_v1
      and team_profile.role = 'team'::public.veroxa_role_v1
      and team_member.status = 'active'::public.veroxa_account_status_v1
      and team_profile.status = 'active'::public.veroxa_account_status_v1
      and (
        select pg_catalog.count(*)
        from public.veroxa_restaurant_members membership
        where membership.user_id = scope.client_actor_id
          and membership.status = 'active'::public.veroxa_account_status_v1
      ) = 1
      and (
        select pg_catalog.count(*)
        from public.veroxa_restaurant_members membership
        where membership.user_id = scope.team_actor_id
          and membership.status = 'active'::public.veroxa_account_status_v1
      ) = 1
  );
$$;
revoke all on function
  veroxa_private.internal_acceptance_scope_active_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.actor_has_supported_operational_membership_v1(
    p_restaurant_id uuid,
    p_actor_id uuid,
    p_required_role public.veroxa_role_v1 default null
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_actor_id is not null and exists (
    select 1
    from public.veroxa_restaurants restaurant
    join public.veroxa_restaurant_members member
      on member.restaurant_id = restaurant.id
     and member.user_id = p_actor_id
    join public.veroxa_user_profiles profile
      on profile.user_id = member.user_id
    where restaurant.id = p_restaurant_id
      and restaurant.status = 'active'::public.veroxa_account_status_v1
      and member.status = 'active'::public.veroxa_account_status_v1
      and profile.status = 'active'::public.veroxa_account_status_v1
      and member.role = profile.role
      and (p_required_role is null or profile.role = p_required_role)
      and (
        exists (
          select 1
          from veroxa_private.operational_restaurant_scope scope
          where scope.scope_key = 'momo_house_san_antonio'
            and scope.enabled
            and scope.restaurant_id = p_restaurant_id
        )
        or (
          veroxa_private.internal_acceptance_scope_active_v1(
            p_restaurant_id
          )
          and exists (
            select 1
            from veroxa_private.internal_acceptance_scope_v1 scope
            where scope.restaurant_id = p_restaurant_id
              and (
                (
                  profile.role = 'client'::public.veroxa_role_v1
                  and veroxa_private.momo_evidence_class_for_user_v1(
                    p_restaurant_id, p_actor_id
                  ) = 'real_owner'
                  and (
                    select pg_catalog.count(*)
                    from public.veroxa_restaurant_members actor_membership
                    where actor_membership.user_id = p_actor_id
                      and actor_membership.status =
                        'active'::public.veroxa_account_status_v1
                  ) = 1
                )
                or (
                  profile.role = 'team'::public.veroxa_role_v1
                  and scope.team_actor_id = p_actor_id
                )
              )
          )
        )
      )
  );
$$;
revoke all on function
  veroxa_private.actor_has_supported_operational_membership_v1(
    uuid, uuid, public.veroxa_role_v1
  ) from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.current_user_has_operational_membership(
    target_restaurant_id uuid,
    required_role public.veroxa_role_v1
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select veroxa_private.actor_has_supported_operational_membership_v1(
    target_restaurant_id, (select auth.uid()), required_role
  );
$$;
revoke all on function
  veroxa_private.current_user_has_operational_membership(
    uuid, public.veroxa_role_v1
  ) from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id uuid,
    p_actor_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select veroxa_private.actor_has_supported_operational_membership_v1(
    p_restaurant_id, p_actor_id, null
  );
$$;
revoke all on function
  veroxa_private.momo_actor_has_operational_membership_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.momo_media_ai_actor_has_operational_team_v1(
    p_restaurant_id uuid,
    p_actor_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select veroxa_private.actor_has_supported_operational_membership_v1(
    p_restaurant_id, p_actor_id, 'team'::public.veroxa_role_v1
  );
$$;
revoke all on function
  veroxa_private.momo_media_ai_actor_has_operational_team_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

-- Keep the global Team test Momo-only. Its unchanged body resolves the exact
-- Momo singleton before delegating to the target-scoped helper above.
create or replace function
  veroxa_private.profile_visible_to_current_team_v1(p_profile_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_restaurant_members target_member
    where target_member.user_id = p_profile_user_id
      and target_member.status = 'active'::public.veroxa_account_status_v1
      and veroxa_private.current_user_has_operational_membership(
        target_member.restaurant_id, 'team'::public.veroxa_role_v1
      )
  );
$$;
revoke all on function
  veroxa_private.profile_visible_to_current_team_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  veroxa_private.profile_visible_to_current_team_v1(uuid)
  to authenticated;

drop policy if exists veroxa_profiles_self_or_team_select
  on public.veroxa_user_profiles;
create policy veroxa_profiles_self_or_team_select
on public.veroxa_user_profiles
for select to authenticated
using (
  user_id = (select auth.uid())
  or veroxa_private.profile_visible_to_current_team_v1(user_id)
);

-- Preserve every Momo row unchanged. Internal acceptance rows are admitted
-- only on the explicitly enumerated evidence surfaces below; provider,
-- publication, calendar, media-usage, advertising, review, and website rows
-- remain outside this allowlist.
create or replace function veroxa_private.enforce_momo_operational_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.restaurant_id is distinct from new.restaurant_id then
    raise exception using errcode = '23514',
      message = 'operational_restaurant_scope_is_immutable';
  end if;
  if exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and scope.restaurant_id = new.restaurant_id
  ) then
    return new;
  end if;

  if veroxa_private.internal_acceptance_scope_active_v1(new.restaurant_id)
     and tg_table_schema = 'public'
     and tg_table_name = any (array[
       'veroxa_restaurant_truth_fields',
       'veroxa_media_assets',
       'veroxa_media_rights',
       'veroxa_momo_media_intake_verifications',
       'veroxa_momo_media_intake_attempts_v2',
       'veroxa_momo_media_canonical_identities_v2',
       'veroxa_momo_media_asset_identity_links_v2',
       'veroxa_momo_automation_advances_v2',
       'veroxa_momo_exception_incidents_v2',
       'veroxa_momo_exception_events_v2',
       'veroxa_momo_content_ai_runs',
       'veroxa_momo_ready_packages',
       'veroxa_momo_ready_package_variants',
       'veroxa_momo_ready_packages_v2',
       'veroxa_momo_ready_variants_v2',
       'veroxa_activity_events'
     ]::text[]) then
    if tg_table_name = 'veroxa_activity_events'
       and new.report_eligible then
      raise exception using errcode = '23514',
        message = 'internal_acceptance_report_evidence_forbidden';
    end if;
    return new;
  end if;

  if veroxa_private.internal_acceptance_scope_active_v1(new.restaurant_id) then
    raise exception using errcode = '23514',
      message = 'internal_acceptance_surface_not_allowed';
  end if;
  raise exception using errcode = '23514',
    message = 'momo_operational_scope_required';
end;
$$;
revoke all on function veroxa_private.enforce_momo_operational_row()
  from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- External-action locks for the internal acceptance tenant
-- -------------------------------------------------------------------------

create or replace function
  veroxa_private.reject_momo_external_publication_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
       select 1
       from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = new.restaurant_id
         and scope.scope_key = 'momo_house_san_antonio'
     )
     or veroxa_private.internal_acceptance_scope_active_v1(
       new.restaurant_id
     )
     or (tg_op = 'UPDATE' and (
       exists (
         select 1
         from veroxa_private.operational_restaurant_scope scope
         where scope.restaurant_id = old.restaurant_id
           and scope.scope_key = 'momo_house_san_antonio'
       )
       or veroxa_private.internal_acceptance_scope_active_v1(
         old.restaurant_id
       )
     )) then
    raise exception using errcode = '55000',
      message = 'external_posting_disabled_upload_to_ready_only';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.reject_momo_external_publication_v1()
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_momo_calendar_prepared_only_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if veroxa_private.internal_acceptance_scope_active_v1(new.restaurant_id)
     or (tg_op = 'UPDATE' and
       veroxa_private.internal_acceptance_scope_active_v1(old.restaurant_id))
  then
    raise exception using errcode = '55000',
      message = 'internal_acceptance_calendar_disabled';
  end if;
  if tg_op = 'UPDATE' and old.restaurant_id is distinct from new.restaurant_id
     and (exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = old.restaurant_id
         and scope.scope_key = 'momo_house_san_antonio'
     ) or exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = new.restaurant_id
         and scope.scope_key = 'momo_house_san_antonio'
     )) then
    raise exception using errcode = '55000',
      message = 'momo_calendar_restaurant_scope_immutable';
  end if;
  if not exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id = new.restaurant_id
      and scope.scope_key = 'momo_house_san_antonio'
  ) then
    return new;
  end if;
  if new.status not in ('draft','awaiting_approval','approved','cancelled')
     or new.published_at is not null then
    raise exception using errcode = '55000',
      message = 'momo_calendar_is_prepared_only';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_calendar_prepared_only_v1()
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_momo_media_usage_prepared_only_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if veroxa_private.internal_acceptance_scope_active_v1(new.restaurant_id)
     or (tg_op = 'UPDATE' and
       veroxa_private.internal_acceptance_scope_active_v1(old.restaurant_id))
  then
    raise exception using errcode = '55000',
      message = 'internal_acceptance_media_usage_disabled';
  end if;
  if tg_op = 'UPDATE' and old.restaurant_id is distinct from new.restaurant_id
     and (exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = old.restaurant_id
         and scope.scope_key = 'momo_house_san_antonio'
     ) or exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.restaurant_id = new.restaurant_id
         and scope.scope_key = 'momo_house_san_antonio'
     )) then
    raise exception using errcode = '55000',
      message = 'momo_media_usage_restaurant_scope_immutable';
  end if;
  if not exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id = new.restaurant_id
      and scope.scope_key = 'momo_house_san_antonio'
  ) then
    return new;
  end if;
  if new.usage_kind = 'published' or new.external_reference is not null then
    raise exception using errcode = '55000',
      message = 'momo_media_usage_is_prepared_only';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_media_usage_prepared_only_v1()
  from public, anon, authenticated, service_role;

-- Give the isolated tenant an explicit budget label. Existing Momo behavior
-- and its exact scope value remain unchanged.
alter table veroxa_private.momo_ai_budget_controls
  drop constraint if exists momo_ai_budget_controls_scope_key_check;
alter table veroxa_private.momo_ai_budget_controls
  add constraint momo_ai_budget_controls_scope_key_check check (
    scope_key in (
      'momo-upload-to-ready-v1',
      'veroxa-internal-acceptance-v1'
    )
  );

-- PostgreSQL-owner-only provisioning after two dedicated Auth identities,
-- profiles, and single active memberships exist. This creates authority only
-- for the fictional test restaurant; it does not alter Momo authority.
create or replace function
  veroxa_private.provision_internal_acceptance_scope_v1(
    p_restaurant_id uuid,
    p_scope_key text,
    p_client_actor_id uuid,
    p_team_actor_id uuid
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  scope_snapshot jsonb;
  scope_sha256 text;
  client_snapshot jsonb;
  team_snapshot jsonb;
  existing_scope veroxa_private.internal_acceptance_scope_v1%rowtype;
begin
  scope_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-internal-acceptance-scope-v1',
    'singletonSlot', 1,
    'scopeKey', p_scope_key,
    'restaurantId', p_restaurant_id,
    'clientActorId', p_client_actor_id,
    'teamActorId', p_team_actor_id,
    'purpose', 'synthetic_upload_to_ready',
    'customerVisible', false,
    'excludedFromReports', true,
    'externalWriteAllowed', false
  );
  scope_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(scope_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa-internal-acceptance-singleton-v1', 0
  ));
  select * into existing_scope
  from veroxa_private.internal_acceptance_scope_v1 scope
  where scope.singleton_slot = 1;
  if found and (
       existing_scope.scope_key is distinct from p_scope_key
       or existing_scope.client_actor_id is distinct from p_client_actor_id
       or existing_scope.team_actor_id is distinct from p_team_actor_id
       or existing_scope.evidence_snapshot is distinct from scope_snapshot
       or existing_scope.evidence_sha256 is distinct from scope_sha256
     ) then
    raise exception using errcode = '23505',
      message = 'internal_acceptance_scope_singleton_conflict';
  end if;
  if not found then
    insert into veroxa_private.internal_acceptance_scope_v1 (
      restaurant_id, singleton_slot, scope_key, client_actor_id, team_actor_id,
      purpose, enabled, customer_visible, excluded_from_reports,
      external_write_allowed,
      created_by, evidence_snapshot, evidence_sha256
    ) values (
      p_restaurant_id, 1, p_scope_key, p_client_actor_id, p_team_actor_id,
      'synthetic_upload_to_ready', true, false, true, false,
      p_team_actor_id, scope_snapshot, scope_sha256
    );
  end if;

  insert into public.veroxa_momo_evidence_authorities (
    restaurant_id, user_id, evidence_class, active, assigned_by, notes
  ) values (
    p_restaurant_id, p_client_actor_id, 'real_owner', true,
    p_team_actor_id,
    'Owner of a fictional, internal-only Veroxa acceptance restaurant; no customer or Momo authority.'
  ) on conflict (restaurant_id, user_id) do update
  set evidence_class = 'real_owner', active = true, retired_at = null,
      assigned_by = excluded.assigned_by,
      assigned_at = pg_catalog.clock_timestamp(), notes = excluded.notes;

  insert into public.veroxa_momo_evidence_authorities (
    restaurant_id, user_id, evidence_class, active, assigned_by, notes
  ) values (
    p_restaurant_id, p_team_actor_id, 'development_proxy', true,
    p_team_actor_id,
    'Dedicated Team actor for the internal-only Veroxa acceptance restaurant.'
  ) on conflict (restaurant_id, user_id) do update
  set evidence_class = 'development_proxy', active = true, retired_at = null,
      assigned_by = excluded.assigned_by,
      assigned_at = pg_catalog.clock_timestamp(), notes = excluded.notes;

  client_snapshot := scope_snapshot || pg_catalog.jsonb_build_object(
    'authority', 'owner_of_fictional_internal_test_restaurant_only'
  );
  team_snapshot := scope_snapshot || pg_catalog.jsonb_build_object(
    'authority', 'development_proxy_for_internal_test_restaurant_only'
  );
  insert into public.veroxa_momo_authority_events (
    restaurant_id, user_id, event_kind, evidence_snapshot,
    evidence_sha256, recorded_by
  ) values (
    p_restaurant_id, p_client_actor_id, 'real_owner_verified',
    client_snapshot,
    pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(client_snapshot), 'UTF8'
    ), 'sha256'), 'hex'), p_team_actor_id
  ) on conflict (restaurant_id, user_id, event_kind, evidence_sha256)
    do nothing;
  insert into public.veroxa_momo_authority_events (
    restaurant_id, user_id, event_kind, evidence_snapshot,
    evidence_sha256, recorded_by
  ) values (
    p_restaurant_id, p_team_actor_id, 'development_proxy_assigned',
    team_snapshot,
    pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(team_snapshot), 'UTF8'
    ), 'sha256'), 'hex'), p_team_actor_id
  ) on conflict (restaurant_id, user_id, event_kind, evidence_sha256)
    do nothing;

  insert into public.veroxa_momo_runtime_controls (
    restaurant_id, ai_live_calls, provider_writes, review_replies,
    website_writes, external_scheduling, updated_by
  ) values (
    p_restaurant_id, true, false, false, false, false, p_team_actor_id
  ) on conflict (restaurant_id) do update
  set ai_live_calls = true,
      provider_writes = false,
      review_replies = false,
      website_writes = false,
      external_scheduling = false,
      updated_by = excluded.updated_by,
      updated_at = pg_catalog.clock_timestamp();

  insert into veroxa_private.momo_ai_budget_controls (
    restaurant_id, enabled, authorization_cap_microusd, scope_key,
    external_publishing_authorized, authorized_by, authorized_at
  ) values (
    p_restaurant_id, true, 100000000,
    'veroxa-internal-acceptance-v1', false,
    p_team_actor_id, pg_catalog.clock_timestamp()
  ) on conflict (restaurant_id) do update
  set enabled = true,
      authorization_cap_microusd = 100000000,
      scope_key = 'veroxa-internal-acceptance-v1',
      external_publishing_authorized = false,
      authorized_by = excluded.authorized_by,
      authorized_at = excluded.authorized_at,
      updated_at = pg_catalog.clock_timestamp();

  return pg_catalog.jsonb_build_object(
    'restaurantId', p_restaurant_id,
    'scopeKey', p_scope_key,
    'status', 'provisioned',
    'customerVisible', false,
    'excludedFromReports', true,
    'externalWriteAllowed', false
  );
end;
$$;
revoke all on function
  veroxa_private.provision_internal_acceptance_scope_v1(
    uuid, text, uuid, uuid
  ) from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- Replay-safe authenticated upload session
-- -------------------------------------------------------------------------

create table veroxa_private.media_upload_sessions_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  created_by_actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  content_request_sha256 text not null
    check (content_request_sha256 ~ '^[0-9a-f]{64}$'),
  original_sha256 text not null check (original_sha256 ~ '^[0-9a-f]{64}$'),
  storage_path text not null unique,
  declared_mime_type text not null
    check (declared_mime_type in ('image/jpeg','image/png')),
  declared_file_size bigint not null
    check (declared_file_size between 10240 and 10485760),
  original_file_name text not null
    check (pg_catalog.char_length(original_file_name) between 1 and 255),
  usage_scope jsonb not null check (
    pg_catalog.jsonb_typeof(usage_scope) = 'array'
    and pg_catalog.jsonb_array_length(usage_scope) between 1 and 5
    and usage_scope <@
      '["facebook","instagram","google_business","website","internal"]'::jsonb
  ),
  expires_on date,
  requested_association text not null check (
    requested_association in (
      'not_for_restaurant',
      'licensed_generic_only',
      'represents_current_restaurant_offering'
    )
  ),
  association_note text check (
    association_note is null
    or pg_catalog.char_length(association_note) between 1 and 2000
  ),
  state text not null default 'initiated'
    check (state in ('initiated','registered','expired')),
  initiation_expires_at timestamptz not null,
  expired_at timestamptz,
  expired_by_actor_id uuid
    references public.veroxa_user_profiles(user_id) on delete restrict,
  observed_sha256 text check (
    observed_sha256 is null or observed_sha256 ~ '^[0-9a-f]{64}$'
  ),
  storage_object_id uuid,
  storage_object_version text check (
    storage_object_version is null
    or pg_catalog.char_length(storage_object_version) between 1 and 512
  ),
  committed_at timestamptz,
  asset_id uuid references public.veroxa_media_assets(id) on delete restrict,
  rights_id uuid references public.veroxa_media_rights(id) on delete restrict,
  instruction_id uuid
    references public.veroxa_media_upload_instructions_v1(id)
    on delete restrict,
  ingestion_receipt_id uuid
    references veroxa_private.momo_media_ingestion_outbox_v1(id)
    on delete restrict,
  ingestion_correlation_id uuid,
  registered_by_actor_id uuid
    references public.veroxa_user_profiles(user_id) on delete restrict,
  registered_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (id, restaurant_id),
  -- Partial indexes below replace the former
  -- unique (restaurant_id, original_sha256) and content-request constraint so
  -- immutable expired evidence cannot permanently reserve live content.
  check (storage_path ~ (
    '^restaurants/' || restaurant_id::text ||
    '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
    '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
    '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
  )),
  check (
    initiation_expires_at > created_at
    and initiation_expires_at <= created_at + interval '15 minutes'
  ),
  check (
    (state = 'initiated'
      and asset_id is null
      and rights_id is null
      and instruction_id is null
      and ingestion_receipt_id is null
      and ingestion_correlation_id is null
      and registered_by_actor_id is null
      and registered_at is null
      and expired_at is null
      and expired_by_actor_id is null
      and observed_sha256 is null
      and storage_object_id is null
      and storage_object_version is null
      and committed_at is null)
    or (state = 'registered'
      and asset_id is not null
      and rights_id is not null
      and instruction_id is not null
      and ingestion_receipt_id is not null
      and ingestion_correlation_id is not null
      and registered_by_actor_id is not null
      and registered_at is not null
      and expired_at is null
      and expired_by_actor_id is null
      and observed_sha256 = original_sha256
      and storage_object_id is not null
      and storage_object_version is not null
      and committed_at is not null
      and committed_at = registered_at)
    or (state = 'expired'
      and asset_id is null
      and rights_id is null
      and instruction_id is null
      and ingestion_receipt_id is null
      and ingestion_correlation_id is null
      and registered_by_actor_id is null
      and registered_at is null
      and expired_at is not null
      and expired_at >= initiation_expires_at
      and expired_by_actor_id is not null
      and observed_sha256 is null
      and storage_object_id is null
      and storage_object_version is null
      and committed_at is null)
  )
);

create unique index media_upload_sessions_live_sha_v1
  on veroxa_private.media_upload_sessions_v1 (
    restaurant_id, original_sha256
  ) where state in ('initiated','registered');
create unique index media_upload_sessions_live_request_v1
  on veroxa_private.media_upload_sessions_v1 (
    restaurant_id, content_request_sha256
  ) where state in ('initiated','registered');
create index media_upload_sessions_restaurant_created_v1
  on veroxa_private.media_upload_sessions_v1 (
    restaurant_id, created_at desc
  );
create index media_upload_sessions_actor_created_v1
  on veroxa_private.media_upload_sessions_v1 (
    restaurant_id, created_by_actor_id, created_at desc
  );
alter table veroxa_private.media_upload_sessions_v1 enable row level security;
alter table veroxa_private.media_upload_sessions_v1 force row level security;
revoke all on table veroxa_private.media_upload_sessions_v1
  from public, anon, authenticated, service_role;

-- An authenticated owner may delete only a true orphan. A live reservation
-- is already registered for cleanup purposes so DELETE cannot race the
-- server-authoritative object check and durable registration transaction.
create or replace function public.veroxa_media_storage_path_registered(
  target_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      is null then false
    when not (
      public.veroxa_current_user_has_active_restaurant(
        public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      )
      or public.veroxa_current_user_is_team_for_restaurant(
        public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      )
    ) then false
    else exists (
      select 1
      from public.veroxa_media_assets asset
      where asset.storage_path = target_storage_path
    )
      or exists (
        select 1
        from public.veroxa_media_renditions rendition
        where rendition.storage_path = target_storage_path
      )
      or exists (
        select 1
        from public.veroxa_momo_media_ai_candidates candidate
        where candidate.storage_path = target_storage_path
          and candidate.status in ('pending_review','approved')
      )
      or exists (
        select 1
        from veroxa_private.media_upload_sessions_v1 upload_session
        where upload_session.storage_path = target_storage_path
          and upload_session.state in ('initiated','registered')
      )
  end;
$$;
revoke all on function public.veroxa_media_storage_path_registered(text)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_media_storage_path_registered(text)
  to authenticated;

create table veroxa_private.media_upload_session_aliases_v1 (
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  client_idempotency_key uuid not null,
  upload_session_id uuid not null,
  request_snapshot jsonb not null
    check (pg_catalog.jsonb_typeof(request_snapshot) = 'object'),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  primary key (restaurant_id, actor_id, client_idempotency_key),
  foreign key (upload_session_id, restaurant_id)
    references veroxa_private.media_upload_sessions_v1(
      id, restaurant_id
    ) on delete restrict
);
alter table veroxa_private.media_upload_session_aliases_v1
  enable row level security;
alter table veroxa_private.media_upload_session_aliases_v1
  force row level security;
revoke all on table veroxa_private.media_upload_session_aliases_v1
  from public, anon, authenticated, service_role;
create index media_upload_session_aliases_actor_created_v1
  on veroxa_private.media_upload_session_aliases_v1 (
    restaurant_id, actor_id, created_at desc
  );
create index media_upload_session_aliases_session_actor_v1
  on veroxa_private.media_upload_session_aliases_v1 (
    upload_session_id, actor_id
  );

create or replace function
  veroxa_private.guard_media_upload_session_alias_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_sha256 text;
  session veroxa_private.media_upload_sessions_v1%rowtype;
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514',
      message = 'media_upload_session_alias_is_immutable';
  end if;
  select * into session
  from veroxa_private.media_upload_sessions_v1 candidate
  where candidate.id = new.upload_session_id
    and candidate.restaurant_id = new.restaurant_id;
  expected_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(new.request_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');
  if not found
     or new.external_write_allowed
     or new.request_sha256 is distinct from expected_sha256
     or new.request_snapshot is distinct from pg_catalog.jsonb_build_object(
       'schemaVersion', 'veroxa-media-upload-request-v1',
       'restaurantId', new.restaurant_id,
       'actorId', new.actor_id,
       'clientIdempotencyKey', new.client_idempotency_key,
       'originalSha256', session.original_sha256,
       'mimeType', session.declared_mime_type,
       'fileSize', session.declared_file_size,
       'originalFileName', session.original_file_name,
       'usageScope', session.usage_scope,
       'expiresOn', session.expires_on,
       'requestedAssociation', session.requested_association,
       'associationNote', session.association_note,
       'ownerAttestation', pg_catalog.jsonb_build_object(
         'schemaVersion', 'veroxa-media-owner-attestation-v1',
         'ownerRightsAccepted', true,
         'currentOfferingAccepted', session.requested_association =
           'represents_current_restaurant_offering'
       ),
       'externalWriteAllowed', false
     ) then
    raise exception using errcode = '23514',
      message = 'media_upload_owner_attestation_invalid';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_media_upload_session_alias_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_media_upload_session_alias_guard_v1
before insert or update or delete
on veroxa_private.media_upload_session_aliases_v1
for each row execute function
  veroxa_private.guard_media_upload_session_alias_v1();

create or replace function
  veroxa_private.guard_media_upload_session_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'media_upload_session_is_immutable';
  end if;
  if old.state = 'initiated'
     and new.state = 'expired'
     and new.id is not distinct from old.id
     and new.restaurant_id is not distinct from old.restaurant_id
     and new.created_by_actor_id is not distinct from old.created_by_actor_id
     and new.content_request_sha256 is not distinct from old.content_request_sha256
     and new.original_sha256 is not distinct from old.original_sha256
     and new.storage_path is not distinct from old.storage_path
     and new.declared_mime_type is not distinct from old.declared_mime_type
     and new.declared_file_size is not distinct from old.declared_file_size
     and new.original_file_name is not distinct from old.original_file_name
     and new.usage_scope is not distinct from old.usage_scope
     and new.expires_on is not distinct from old.expires_on
     and new.requested_association is not distinct from old.requested_association
     and new.association_note is not distinct from old.association_note
     and new.initiation_expires_at is not distinct from old.initiation_expires_at
     and new.expired_at >= old.initiation_expires_at
     and new.expired_by_actor_id is not null
     and veroxa_private.actor_has_supported_operational_membership_v1(
       new.restaurant_id, new.expired_by_actor_id,
       'client'::public.veroxa_role_v1
     )
     and new.created_at is not distinct from old.created_at
     and not new.external_write_allowed
     and new.updated_at >= old.updated_at then
    return new;
  end if;
  if old.state <> 'initiated'
     or new.state <> 'registered'
     or new.id is distinct from old.id
     or new.restaurant_id is distinct from old.restaurant_id
     or new.created_by_actor_id is distinct from old.created_by_actor_id
     or new.content_request_sha256 is distinct from old.content_request_sha256
     or new.original_sha256 is distinct from old.original_sha256
     or new.storage_path is distinct from old.storage_path
     or new.declared_mime_type is distinct from old.declared_mime_type
     or new.declared_file_size is distinct from old.declared_file_size
     or new.original_file_name is distinct from old.original_file_name
     or new.usage_scope is distinct from old.usage_scope
     or new.expires_on is distinct from old.expires_on
     or new.requested_association is distinct from old.requested_association
     or new.association_note is distinct from old.association_note
     or new.initiation_expires_at is distinct from old.initiation_expires_at
     or new.expired_at is not null
     or new.expired_by_actor_id is not null
     or old.observed_sha256 is not null
     or new.observed_sha256 is distinct from old.original_sha256
     or old.storage_object_id is not null
     or new.storage_object_id is null
     or old.storage_object_version is not null
     or new.storage_object_version is null
     or old.committed_at is not null
     or new.committed_at is null
     or new.committed_at is distinct from new.registered_at
     or new.registered_by_actor_id is null
     or old.registered_by_actor_id is not null
     or not exists (
       select 1
       from veroxa_private.media_upload_session_aliases_v1 alias_record
       where alias_record.upload_session_id = new.id
         and alias_record.restaurant_id = new.restaurant_id
         and alias_record.actor_id = new.registered_by_actor_id
     )
     or new.created_at is distinct from old.created_at
     or new.external_write_allowed
     or new.updated_at < old.updated_at then
    raise exception using errcode = '23514',
      message = 'media_upload_session_is_immutable';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_media_upload_session_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_media_upload_session_guard_v1
before update or delete on veroxa_private.media_upload_sessions_v1
for each row execute function veroxa_private.guard_media_upload_session_v1();

-- Client registration is now begin/commit only. The security-definer commit
-- function below may still invoke the reviewed v3 -> v2 -> v1 owner chain;
-- authenticated browsers cannot call any historical registration stage.
revoke execute on function public.veroxa_register_momo_media_v1(
  uuid,text,text,bigint,text,text,jsonb,timestamptz
) from authenticated;
revoke execute on function public.veroxa_register_momo_media_v2(
  uuid,text,text,bigint,text,text,jsonb,date
) from authenticated;
revoke execute on function public.veroxa_register_momo_media_v3(
  uuid,text,text,bigint,text,jsonb,date,text,text
) from authenticated;

create or replace function public.veroxa_begin_media_upload_v1(
  p_restaurant_id uuid,
  p_client_idempotency_key uuid,
  p_original_sha256 text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text,
  p_owner_attestation jsonb,
  p_usage_scope jsonb default
    '["facebook","instagram","google_business"]'::jsonb,
  p_expires_on date default null,
  p_requested_association text default 'not_for_restaurant',
  p_association_note text default null
)
returns table (
  upload_session_id uuid,
  storage_path text,
  session_status text,
  asset_id uuid,
  rights_id uuid,
  instruction_id uuid,
  ingestion_receipt_id uuid,
  ingestion_correlation_id uuid,
  original_sha256 text,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  normalized_file_name text := nullif(
    pg_catalog.btrim(p_original_file_name), ''
  );
  normalized_note text := nullif(pg_catalog.btrim(p_association_note), '');
  normalized_scope jsonb;
  content_snapshot jsonb;
  content_hash text;
  request_snapshot jsonb;
  request_hash text;
  session veroxa_private.media_upload_sessions_v1%rowtype;
  alias_record veroxa_private.media_upload_session_aliases_v1%rowtype;
  new_session_id uuid := extensions.gen_random_uuid();
  v_now timestamptz := pg_catalog.clock_timestamp();
  active_session_found boolean := false;
  extension text;
begin
  if v_actor_id is null
     or p_client_idempotency_key is null
     or not veroxa_private.actor_has_supported_operational_membership_v1(
       p_restaurant_id, v_actor_id, 'client'::public.veroxa_role_v1
     ) then
    raise exception using errcode = '42501',
      message = 'active_upload_client_required';
  end if;
  if p_original_sha256 is null
     or p_original_sha256 !~ '^[0-9a-f]{64}$'
     or p_mime_type not in ('image/jpeg','image/png')
     or not coalesce(
       p_file_size between 10240 and 10485760, false
     )
     or normalized_file_name is null
     or pg_catalog.char_length(normalized_file_name) > 255
     or pg_catalog.jsonb_typeof(p_usage_scope) is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_usage_scope) not between 1 and 5
     or not p_usage_scope <@
       '["facebook","instagram","google_business","website","internal"]'::jsonb
     or p_requested_association not in (
       'not_for_restaurant',
       'licensed_generic_only',
       'represents_current_restaurant_offering'
     )
     or pg_catalog.char_length(coalesce(p_association_note, '')) > 2000
     or (p_expires_on is not null and p_expires_on <
       (pg_catalog.now() at time zone 'America/Chicago')::date)
     or (p_requested_association =
       'represents_current_restaurant_offering' and
       veroxa_private.momo_evidence_class_for_user_v1(
         p_restaurant_id, v_actor_id
       ) <> 'real_owner') then
    raise exception using errcode = '22023',
      message = 'invalid_media_upload_session_request';
  end if;
  if p_owner_attestation is distinct from pg_catalog.jsonb_build_object(
       'schemaVersion', 'veroxa-media-owner-attestation-v1',
       'ownerRightsAccepted', true,
       'currentOfferingAccepted', p_requested_association =
         'represents_current_restaurant_offering'
     ) then
    raise exception using errcode = '23514',
      message = 'media_upload_owner_attestation_invalid';
  end if;

  select pg_catalog.jsonb_agg(value order by value) into normalized_scope
  from (
    select distinct element.value
    from pg_catalog.jsonb_array_elements_text(p_usage_scope) element(value)
  ) values_sorted;
  content_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-media-upload-content-v1',
    'restaurantId', p_restaurant_id,
    'originalSha256', p_original_sha256,
    'mimeType', p_mime_type,
    'fileSize', p_file_size,
    'originalFileName', normalized_file_name,
    'usageScope', normalized_scope,
    'expiresOn', p_expires_on,
    'requestedAssociation', p_requested_association,
    'associationNote', normalized_note,
    'externalWriteAllowed', false
  );
  content_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(content_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');
  request_snapshot := content_snapshot || pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-media-upload-request-v1',
    'actorId', v_actor_id,
    'clientIdempotencyKey', p_client_idempotency_key,
    'ownerAttestation', p_owner_attestation
  );
  request_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(request_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');

  -- Serialize the restaurant-wide and actor-wide quotas before resolving the
  -- idempotency key. Exact replay remains available after a quota is reached.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa-media-upload-restaurant-quota:' || p_restaurant_id::text, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa-media-upload-actor-quota:' || p_restaurant_id::text || ':' ||
    v_actor_id::text, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa-media-upload-key:' || p_restaurant_id::text || ':' ||
    v_actor_id::text || ':' || p_client_idempotency_key::text, 0
  ));
  v_now := pg_catalog.clock_timestamp();

  -- Retain immutable evidence while releasing only stale, never-registered
  -- reservations. A live Client who reclaims one records that transition.
  update veroxa_private.media_upload_sessions_v1 candidate
  set state = 'expired', expired_at = v_now,
      expired_by_actor_id = v_actor_id, updated_at = v_now
  where candidate.restaurant_id = p_restaurant_id
    and candidate.state = 'initiated'
    and candidate.initiation_expires_at <= v_now;

  select * into alias_record
  from veroxa_private.media_upload_session_aliases_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.actor_id = v_actor_id
    and candidate.client_idempotency_key = p_client_idempotency_key
  for update;
  if found then
    select * into strict session
    from veroxa_private.media_upload_sessions_v1 candidate
    where candidate.id = alias_record.upload_session_id
      and candidate.restaurant_id = alias_record.restaurant_id;
    if session.state = 'expired' then
      raise exception using errcode = '55000',
        message = 'media_upload_session_expired';
    end if;
    if alias_record.request_sha256 is distinct from request_hash
       or alias_record.request_snapshot is distinct from request_snapshot
       or session.content_request_sha256 is distinct from content_hash
       or session.original_sha256 is distinct from p_original_sha256 then
      raise exception using errcode = '23505',
        message = 'media_upload_session_idempotency_conflict';
    end if;
    return query select session.id, session.storage_path, session.state,
      session.asset_id, session.rights_id, session.instruction_id,
      session.ingestion_receipt_id, session.ingestion_correlation_id,
      session.original_sha256, false;
    return;
  end if;

  if (select pg_catalog.count(*)
      from veroxa_private.media_upload_session_aliases_v1 candidate
      where candidate.restaurant_id = p_restaurant_id
        and candidate.actor_id = v_actor_id
        and candidate.created_at >= v_now - interval '1 hour') >= 30 then
    raise exception using errcode = '54000',
      message = 'media_upload_alias_rate_limit_reached';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa-media-upload-content:' || p_restaurant_id::text || ':' ||
    p_original_sha256, 0
  ));
  select * into session
  from veroxa_private.media_upload_sessions_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.original_sha256 = p_original_sha256
    and candidate.state in ('initiated','registered')
  for update;
  active_session_found := found;
  if active_session_found then
    if session.content_request_sha256 is distinct from content_hash then
      raise exception using errcode = '23505',
        message = 'media_upload_content_metadata_conflict';
    end if;
    if session.state = 'initiated'
       and session.created_by_actor_id is distinct from v_actor_id then
      raise exception using errcode = '55000',
        message = 'media_upload_content_in_progress';
    end if;
    if (select pg_catalog.count(*)
        from veroxa_private.media_upload_session_aliases_v1 candidate
        where candidate.upload_session_id = session.id
          and candidate.actor_id = v_actor_id) >= 8
       or (select pg_catalog.count(*)
        from veroxa_private.media_upload_session_aliases_v1 candidate
        where candidate.upload_session_id = session.id) >= 32 then
      raise exception using errcode = '54000',
        message = 'media_upload_alias_limit_reached';
    end if;
    insert into veroxa_private.media_upload_session_aliases_v1 (
      restaurant_id, actor_id, client_idempotency_key,
      upload_session_id, request_snapshot, request_sha256
    ) values (
      p_restaurant_id, v_actor_id, p_client_idempotency_key,
      session.id, request_snapshot, request_hash
    );
    return query select session.id, session.storage_path, session.state,
      session.asset_id, session.rights_id, session.instruction_id,
      session.ingestion_receipt_id, session.ingestion_correlation_id,
      session.original_sha256, false;
    return;
  end if;

  if (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 candidate
      where candidate.restaurant_id = p_restaurant_id
        and candidate.created_by_actor_id = v_actor_id
        and candidate.created_at >= v_now - interval '1 hour') >= 10
     or (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 candidate
      where candidate.restaurant_id = p_restaurant_id
        and candidate.created_by_actor_id = v_actor_id
        and candidate.state = 'initiated') >= 3
     or (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 candidate
      where candidate.restaurant_id = p_restaurant_id
        and candidate.created_at >= v_now - interval '1 hour') >= 50
     or (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 candidate
      where candidate.restaurant_id = p_restaurant_id
        and candidate.state = 'initiated') >= 12 then
    raise exception using errcode = '54000',
      message = 'media_upload_session_rate_or_active_limit_reached';
  end if;

  extension := case p_mime_type
    when 'image/jpeg' then 'jpg'
    else 'png'
  end;
  insert into veroxa_private.media_upload_sessions_v1 (
    id, restaurant_id, created_by_actor_id, content_request_sha256,
    original_sha256, storage_path,
    declared_mime_type, declared_file_size, original_file_name,
    usage_scope, expires_on, requested_association, association_note,
    initiation_expires_at, created_at, updated_at
  ) values (
    new_session_id, p_restaurant_id, v_actor_id, content_hash,
    p_original_sha256,
    'restaurants/' || p_restaurant_id::text || '/uploads/' ||
      pg_catalog.to_char(
        v_now at time zone 'UTC', 'YYYY/MM'
      ) || '/' || new_session_id::text || '.' || extension,
    p_mime_type, p_file_size, normalized_file_name,
    normalized_scope, p_expires_on, p_requested_association, normalized_note,
    v_now + interval '15 minutes', v_now, v_now
  ) returning * into session;

  insert into veroxa_private.media_upload_session_aliases_v1 (
    restaurant_id, actor_id, client_idempotency_key,
    upload_session_id, request_snapshot, request_sha256
  ) values (
    p_restaurant_id, v_actor_id, p_client_idempotency_key,
    session.id, request_snapshot, request_hash
  );

  return query select session.id, session.storage_path, session.state,
    session.asset_id, session.rights_id, session.instruction_id,
    session.ingestion_receipt_id, session.ingestion_correlation_id,
    session.original_sha256, false;
end;
$$;
revoke all on function public.veroxa_begin_media_upload_v1(
  uuid,uuid,text,text,bigint,text,jsonb,jsonb,date,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_begin_media_upload_v1(
  uuid,uuid,text,text,bigint,text,jsonb,jsonb,date,text,text
) to authenticated;

create or replace function public.veroxa_commit_media_upload_v1(
  p_upload_session_id uuid,
  p_client_idempotency_key uuid
)
returns table (
  upload_session_id uuid,
  storage_path text,
  session_status text,
  asset_id uuid,
  rights_id uuid,
  instruction_id uuid,
  ingestion_receipt_id uuid,
  ingestion_correlation_id uuid,
  original_sha256 text,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  session veroxa_private.media_upload_sessions_v1%rowtype;
  alias_record veroxa_private.media_upload_session_aliases_v1%rowtype;
  expected_request_snapshot jsonb;
  expected_request_sha256 text;
  registered record;
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
begin
  select * into session
  from veroxa_private.media_upload_sessions_v1 candidate
  where candidate.id = p_upload_session_id
  for update;
  if not found
     or v_actor_id is null
     or not veroxa_private.actor_has_supported_operational_membership_v1(
       session.restaurant_id, v_actor_id, 'client'::public.veroxa_role_v1
     ) then
    raise exception using errcode = '42501',
      message = 'active_upload_session_client_required';
  end if;

  select * into alias_record
  from veroxa_private.media_upload_session_aliases_v1 candidate
  where candidate.restaurant_id = session.restaurant_id
    and candidate.actor_id = v_actor_id
    and candidate.client_idempotency_key = p_client_idempotency_key
    and candidate.upload_session_id = session.id;
  expected_request_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-media-upload-request-v1',
    'restaurantId', session.restaurant_id,
    'actorId', v_actor_id,
    'clientIdempotencyKey', p_client_idempotency_key,
    'originalSha256', session.original_sha256,
    'mimeType', session.declared_mime_type,
    'fileSize', session.declared_file_size,
    'originalFileName', session.original_file_name,
    'usageScope', session.usage_scope,
    'expiresOn', session.expires_on,
    'requestedAssociation', session.requested_association,
    'associationNote', session.association_note,
    'ownerAttestation', pg_catalog.jsonb_build_object(
      'schemaVersion', 'veroxa-media-owner-attestation-v1',
      'ownerRightsAccepted', true,
      'currentOfferingAccepted', session.requested_association =
        'represents_current_restaurant_offering'
    ),
    'externalWriteAllowed', false
  );
  expected_request_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(expected_request_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');
  if not found
     or alias_record.request_snapshot is distinct from expected_request_snapshot
     or alias_record.request_sha256 is distinct from expected_request_sha256
     or (session.requested_association =
       'represents_current_restaurant_offering' and
       veroxa_private.momo_evidence_class_for_user_v1(
         session.restaurant_id, v_actor_id
       ) <> 'real_owner') then
    raise exception using errcode = '23514',
      message = 'media_upload_owner_attestation_invalid';
  end if;

  if session.state = 'registered' then
    return query select session.id, session.storage_path, session.state,
      session.asset_id, session.rights_id, session.instruction_id,
      session.ingestion_receipt_id, session.ingestion_correlation_id,
      session.original_sha256, false;
    return;
  end if;
  if session.created_by_actor_id is distinct from v_actor_id then
    raise exception using errcode = '42501',
      message = 'media_upload_session_creator_required';
  end if;

  select * into strict registered
  from public.veroxa_register_momo_media_v3(
    session.restaurant_id,
    session.storage_path,
    session.declared_mime_type,
    session.declared_file_size,
    session.original_file_name,
    session.usage_scope,
    session.expires_on,
    session.requested_association,
    session.association_note
  );
  select * into strict receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 outbox
  where outbox.asset_id = registered.asset_id;

  update veroxa_private.media_upload_sessions_v1 target
  set state = 'registered',
      asset_id = registered.asset_id,
      rights_id = registered.rights_id,
      instruction_id = registered.instruction_id,
      ingestion_receipt_id = receipt.id,
      ingestion_correlation_id = receipt.correlation_id,
      registered_by_actor_id = v_actor_id,
      registered_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target.id = session.id
  returning * into session;

  return query select session.id, session.storage_path, session.state,
    session.asset_id, session.rights_id, session.instruction_id,
    session.ingestion_receipt_id, session.ingestion_correlation_id,
    session.original_sha256, false;
end;
$$;
revoke all on function public.veroxa_commit_media_upload_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_commit_media_upload_v2(
  p_restaurant_id uuid,
  p_upload_session_id uuid,
  p_client_idempotency_key uuid,
  p_observed_sha256 text,
  p_storage_object_id uuid,
  p_storage_object_version text,
  p_actor_id uuid
)
returns table (
  upload_session_id uuid,
  storage_path text,
  session_status text,
  asset_id uuid,
  rights_id uuid,
  instruction_id uuid,
  ingestion_receipt_id uuid,
  ingestion_correlation_id uuid,
  original_sha256 text,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  session veroxa_private.media_upload_sessions_v1%rowtype;
  alias_record veroxa_private.media_upload_session_aliases_v1%rowtype;
  expected_request_snapshot jsonb;
  expected_request_sha256 text;
  alias_found boolean := false;
  storage_object record;
  registered record;
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  commit_time timestamptz;
  prior_claim_sub text := pg_catalog.current_setting(
    'request.jwt.claim.sub', true
  );
  prior_claims text := pg_catalog.current_setting(
    'request.jwt.claims', true
  );
begin
  select * into session
  from veroxa_private.media_upload_sessions_v1 candidate
  where candidate.id = p_upload_session_id
    and candidate.restaurant_id = p_restaurant_id
  for update;
  if not found
     or p_actor_id is null
     or p_client_idempotency_key is null
     or not veroxa_private.actor_has_supported_operational_membership_v1(
       p_restaurant_id, p_actor_id, 'client'::public.veroxa_role_v1
     ) then
    raise exception using errcode = '42501',
      message = 'active_upload_session_client_required';
  end if;

  select * into alias_record
  from veroxa_private.media_upload_session_aliases_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.actor_id = p_actor_id
    and candidate.client_idempotency_key = p_client_idempotency_key
    and candidate.upload_session_id = p_upload_session_id;
  alias_found := found;
  expected_request_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-media-upload-request-v1',
    'restaurantId', session.restaurant_id,
    'actorId', p_actor_id,
    'clientIdempotencyKey', p_client_idempotency_key,
    'originalSha256', session.original_sha256,
    'mimeType', session.declared_mime_type,
    'fileSize', session.declared_file_size,
    'originalFileName', session.original_file_name,
    'usageScope', session.usage_scope,
    'expiresOn', session.expires_on,
    'requestedAssociation', session.requested_association,
    'associationNote', session.association_note,
    'ownerAttestation', pg_catalog.jsonb_build_object(
      'schemaVersion', 'veroxa-media-owner-attestation-v1',
      'ownerRightsAccepted', true,
      'currentOfferingAccepted', session.requested_association =
        'represents_current_restaurant_offering'
    ),
    'externalWriteAllowed', false
  );
  expected_request_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      veroxa_private.momo_canonical_json_v1(expected_request_snapshot), 'UTF8'
    ), 'sha256'
  ), 'hex');
  if not alias_found
     or alias_record.request_snapshot is distinct from expected_request_snapshot
     or alias_record.request_sha256 is distinct from expected_request_sha256
     or (session.requested_association =
       'represents_current_restaurant_offering' and
       veroxa_private.momo_evidence_class_for_user_v1(
         session.restaurant_id, p_actor_id
       ) <> 'real_owner') then
    raise exception using errcode = '23514',
      message = 'media_upload_owner_attestation_invalid';
  end if;
  if session.state = 'expired'
     or (session.state = 'initiated' and
       session.initiation_expires_at <= pg_catalog.clock_timestamp()) then
    raise exception using errcode = '55000',
      message = 'media_upload_session_expired';
  end if;
  if session.state = 'initiated'
     and session.created_by_actor_id is distinct from p_actor_id then
    raise exception using errcode = '42501',
      message = 'media_upload_session_creator_required';
  end if;
  if session.state = 'registered' and (
       p_observed_sha256 is distinct from session.observed_sha256
       or p_storage_object_id is distinct from session.storage_object_id
       or p_storage_object_version is distinct from
         session.storage_object_version
     ) then
    raise exception using errcode = '23514',
      message = 'media_upload_commit_evidence_conflict';
  end if;

  select object_record.id, object_record.version, object_record.name,
    object_record.owner_id, object_record.metadata
  into storage_object
  from storage.objects object_record
  where object_record.bucket_id = 'restaurant-media'
    and object_record.id = p_storage_object_id
  for update;
  if not found
     or p_storage_object_version is null
     or storage_object.version is distinct from p_storage_object_version
     or storage_object.name is distinct from session.storage_path
     or storage_object.owner_id is distinct from
       session.created_by_actor_id::text
     or coalesce(
       storage_object.metadata ->> 'mimetype', ''
     ) is distinct from session.declared_mime_type
     or (case when coalesce(
       storage_object.metadata ->> 'size', ''
     ) ~ '^[0-9]{1,30}$'
       then (storage_object.metadata ->> 'size')::numeric is distinct from
         session.declared_file_size::numeric
       else true end) then
    raise exception using errcode = '23514',
      message = 'media_upload_storage_object_mismatch';
  end if;
  if p_observed_sha256 is null
     or p_observed_sha256 !~ '^[0-9a-f]{64}$'
     or p_observed_sha256 is distinct from session.original_sha256 then
    raise exception using errcode = '23514',
      message = 'media_upload_expected_sha256_mismatch';
  end if;

  if session.state = 'registered' then
    return query select session.id, session.storage_path, session.state,
      session.asset_id, session.rights_id, session.instruction_id,
      session.ingestion_receipt_id, session.ingestion_correlation_id,
      session.original_sha256, false;
    return;
  end if;

  -- The reviewed registration chain derives its actor from auth.uid(). The
  -- service-only bridge therefore installs the already-validated actor only
  -- for this transaction and restores the caller claims after registration.
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', p_actor_id::text, true
  );
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
      'sub', p_actor_id, 'role', 'authenticated'
    )::text,
    true
  );
  select * into strict registered
  from public.veroxa_register_momo_media_v3(
    session.restaurant_id,
    session.storage_path,
    session.declared_mime_type,
    session.declared_file_size,
    session.original_file_name,
    session.usage_scope,
    session.expires_on,
    session.requested_association,
    session.association_note
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', coalesce(prior_claim_sub, ''), true
  );
  perform pg_catalog.set_config(
    'request.jwt.claims', coalesce(prior_claims, ''), true
  );

  select * into strict receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 outbox
  where outbox.asset_id = registered.asset_id;

  commit_time := pg_catalog.clock_timestamp();
  update veroxa_private.media_upload_sessions_v1 target
  set state = 'registered',
      observed_sha256 = p_observed_sha256,
      storage_object_id = p_storage_object_id,
      storage_object_version = p_storage_object_version,
      committed_at = commit_time,
      asset_id = registered.asset_id,
      rights_id = registered.rights_id,
      instruction_id = registered.instruction_id,
      ingestion_receipt_id = receipt.id,
      ingestion_correlation_id = receipt.correlation_id,
      registered_by_actor_id = p_actor_id,
      registered_at = commit_time,
      updated_at = commit_time
  where target.id = session.id
  returning * into session;

  return query select session.id, session.storage_path, session.state,
    session.asset_id, session.rights_id, session.instruction_id,
    session.ingestion_receipt_id, session.ingestion_correlation_id,
    session.original_sha256, false;
end;
$$;
revoke all on function public.veroxa_commit_media_upload_v2(
  uuid,uuid,uuid,text,uuid,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_commit_media_upload_v2(
  uuid,uuid,uuid,text,uuid,text,uuid
) to service_role;

-- The server-side full-byte verifier must agree with the browser's expected
-- original SHA before any immutable verified intake can be written. Legacy
-- non-session registrations keep their existing behavior.
create or replace function
  veroxa_private.guard_media_upload_expected_sha256_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session veroxa_private.media_upload_sessions_v1%rowtype;
begin
  select * into session
  from veroxa_private.media_upload_sessions_v1 candidate
  where candidate.asset_id = new.asset_id
    and candidate.restaurant_id = new.restaurant_id;
  if found and (
       session.state <> 'registered'
       or session.storage_path is distinct from new.storage_path
       or session.declared_mime_type is distinct from new.declared_mime_type
       or session.declared_file_size is distinct from new.file_size
       or session.original_sha256 is distinct from new.content_sha256
     ) then
    raise exception using errcode = '23514',
      message = 'media_upload_expected_sha256_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_media_upload_expected_sha256_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_media_upload_expected_sha256_guard_v1
before insert on public.veroxa_private_media_assessment_intakes_v1
for each row execute function
  veroxa_private.guard_media_upload_expected_sha256_v1();

-- Migration-time invariants. These fail the release before any partially
-- configured acceptance boundary can be considered usable.
do $$
begin
  if has_table_privilege(
       'service_role',
       'veroxa_private.internal_acceptance_scope_v1',
       'select'
     )
     or has_table_privilege(
       'service_role',
       'veroxa_private.media_upload_sessions_v1',
       'select'
     )
     or has_table_privilege(
       'service_role',
       'veroxa_private.media_upload_session_aliases_v1',
       'select'
     ) then
    raise exception using errcode = '55000',
      message = 'internal_acceptance_private_table_acl_invalid';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.internal_acceptance_scope_v1'::pg_catalog.regclass
      and constraint_record.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_record.oid)
        like '%singleton_slot%'
  ) then
    raise exception using errcode = '55000',
      message = 'internal_acceptance_singleton_constraint_missing';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_index index_record
    join pg_catalog.pg_class index_relation
      on index_relation.oid = index_record.indexrelid
    where index_record.indrelid =
      'veroxa_private.media_upload_sessions_v1'::pg_catalog.regclass
      and index_record.indisunique
      and index_record.indpred is not null
      and index_relation.relname = 'media_upload_sessions_live_sha_v1'
  ) then
    raise exception using errcode = '55000',
      message = 'media_upload_session_idempotency_constraint_missing';
  end if;
  if pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_register_momo_media_v3(uuid,text,text,bigint,text,jsonb,date,text,text)',
       'execute'
     )
     or not pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_begin_media_upload_v1(uuid,uuid,text,text,bigint,text,jsonb,jsonb,date,text,text)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_commit_media_upload_v1(uuid,uuid)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       'public.veroxa_commit_media_upload_v1(uuid,uuid)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'authenticated',
       'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'anon',
       'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
       'execute'
     )
     or not pg_catalog.has_function_privilege(
       'service_role',
       'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
       'execute'
     )
     or not pg_catalog.has_function_privilege(
       'authenticated',
       'veroxa_private.profile_visible_to_current_team_v1(uuid)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'anon',
       'veroxa_private.profile_visible_to_current_team_v1(uuid)',
       'execute'
     )
     or pg_catalog.has_function_privilege(
       'service_role',
       'veroxa_private.profile_visible_to_current_team_v1(uuid)',
       'execute'
     ) then
    raise exception using errcode = '55000',
      message = 'media_upload_registration_rpc_acl_invalid';
  end if;
end;
$$;
