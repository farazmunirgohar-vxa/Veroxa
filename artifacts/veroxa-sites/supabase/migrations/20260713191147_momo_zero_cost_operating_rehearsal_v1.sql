-- Momo Zero-Cost Operating Rehearsal V1
--
-- Hardens the existing Momo-only operating foundation without contacting an
-- owner, calling an AI/provider API, storing provider credentials, publishing,
-- or creating a second operational tenant.  All live Meta/Google execution
-- remains fail-closed.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Client-safe attestations, confirmation snapshots, and input provenance
-- -------------------------------------------------------------------------

alter table public.veroxa_confirmations
  add column if not exists subject_snapshot jsonb,
  add column if not exists subject_snapshot_sha256 text;

alter table public.veroxa_confirmations
  drop constraint if exists veroxa_confirmation_snapshot_sha256_format;
alter table public.veroxa_confirmations
  add constraint veroxa_confirmation_snapshot_sha256_format check (
    subject_snapshot_sha256 is null
    or subject_snapshot_sha256 ~ '^[0-9a-f]{64}$'
  ) not valid;
alter table public.veroxa_confirmations
  validate constraint veroxa_confirmation_snapshot_sha256_format;

alter table public.veroxa_approvals
  add column if not exists subject_snapshot jsonb,
  add column if not exists subject_snapshot_sha256 text;
alter table public.veroxa_approvals
  drop constraint if exists veroxa_approval_snapshot_sha256_format;
alter table public.veroxa_approvals
  add constraint veroxa_approval_snapshot_sha256_format check (
    subject_snapshot_sha256 is null
    or subject_snapshot_sha256 ~ '^[0-9a-f]{64}$'
  ) not valid;
alter table public.veroxa_approvals
  validate constraint veroxa_approval_snapshot_sha256_format;

alter table public.veroxa_onboarding_steps
  add column if not exists owner_confirmation_id uuid
    references public.veroxa_confirmations(id) on delete restrict;
alter table public.veroxa_presence_profiles
  add column if not exists owner_confirmation_id uuid
    references public.veroxa_confirmations(id) on delete restrict;

create index if not exists veroxa_onboarding_owner_confirmation_idx
  on public.veroxa_onboarding_steps (owner_confirmation_id);
create index if not exists veroxa_presence_owner_confirmation_idx
  on public.veroxa_presence_profiles (owner_confirmation_id);

alter table public.veroxa_media_rights
  add column if not exists attestation_version text not null
    default 'momo-media-rights-v1',
  add column if not exists attestation_text text not null
    default 'I confirm I own or have permission to provide this media for the selected Veroxa usage scopes.',
  add column if not exists attestation_sha256 text not null
    default '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f';

alter table public.veroxa_media_rights
  drop constraint if exists veroxa_media_rights_attestation_contract;
alter table public.veroxa_media_rights
  add constraint veroxa_media_rights_attestation_contract check (
    attestation_version = 'momo-media-rights-v1'
    and attestation_text = 'I confirm I own or have permission to provide this media for the selected Veroxa usage scopes.'
    and attestation_sha256 = '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f'
  ) not valid;
alter table public.veroxa_media_rights
  validate constraint veroxa_media_rights_attestation_contract;

create or replace function veroxa_private.protect_media_rights_attestation_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.attestation_version is distinct from old.attestation_version
    or new.attestation_text is distinct from old.attestation_text
    or new.attestation_sha256 is distinct from old.attestation_sha256
  ) then
    raise exception using errcode = '23514', message = 'media_rights_attestation_is_immutable';
  end if;
  new.attestation_version := 'momo-media-rights-v1';
  new.attestation_text := 'I confirm I own or have permission to provide this media for the selected Veroxa usage scopes.';
  new.attestation_sha256 := '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f';
  return new;
end;
$$;
revoke all on function veroxa_private.protect_media_rights_attestation_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_rights_attestation_guard on public.veroxa_media_rights;
create trigger veroxa_media_rights_attestation_guard
before insert or update on public.veroxa_media_rights
for each row execute function veroxa_private.protect_media_rights_attestation_v1();

alter table public.veroxa_content_items
  add column if not exists manual_pillar text;
alter table public.veroxa_content_items
  drop constraint if exists veroxa_content_items_manual_pillar_allowed;
alter table public.veroxa_content_items
  add constraint veroxa_content_items_manual_pillar_allowed check (
    manual_pillar is null or manual_pillar in (
      'Momo Cravings','First-Time Education','Behind the Scenes',
      'Customer Reactions','Snack Discovery','Local Discovery'
    )
  ) not valid;
alter table public.veroxa_content_items
  validate constraint veroxa_content_items_manual_pillar_allowed;

create table if not exists public.veroxa_content_input_ledger (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  content_item_id uuid not null references public.veroxa_content_items(id) on delete cascade,
  input_kind text not null check (input_kind in ('owner_confirmed_truth','permissioned_media')),
  truth_field_id uuid references public.veroxa_restaurant_truth_fields(id) on delete restrict,
  media_asset_id uuid references public.veroxa_media_assets(id) on delete restrict,
  truth_value_sha256 text,
  rights_attestation_version text,
  rights_attestation_sha256 text,
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_by uuid not null references public.veroxa_user_profiles(user_id),
  recorded_at timestamptz not null default now(),
  constraint veroxa_content_input_exact_subject check (
    (input_kind = 'owner_confirmed_truth'
      and truth_field_id is not null and media_asset_id is null
      and truth_value_sha256 ~ '^[0-9a-f]{64}$'
      and rights_attestation_version is null and rights_attestation_sha256 is null)
    or
    (input_kind = 'permissioned_media'
      and media_asset_id is not null and truth_field_id is null
      and truth_value_sha256 is null
      and rights_attestation_version = 'momo-media-rights-v1'
      and rights_attestation_sha256 = '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f')
  ),
  unique (content_item_id, input_kind, truth_field_id, media_asset_id)
);
create index if not exists veroxa_content_input_restaurant_idx
  on public.veroxa_content_input_ledger (restaurant_id, content_item_id, recorded_at);
create index if not exists veroxa_content_input_truth_idx
  on public.veroxa_content_input_ledger (truth_field_id) where truth_field_id is not null;
create index if not exists veroxa_content_input_media_idx
  on public.veroxa_content_input_ledger (media_asset_id) where media_asset_id is not null;
create index if not exists veroxa_content_input_actor_idx
  on public.veroxa_content_input_ledger (recorded_by);
create unique index if not exists veroxa_content_input_truth_unique
  on public.veroxa_content_input_ledger (content_item_id, truth_field_id)
  where truth_field_id is not null;
create unique index if not exists veroxa_content_input_media_unique
  on public.veroxa_content_input_ledger (content_item_id, media_asset_id)
  where media_asset_id is not null;

create or replace function veroxa_private.validate_content_input_ledger_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_truth_hash text;
  expected_input_hash text;
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514', message = 'content_input_ledger_is_immutable';
  end if;
  if current_setting('veroxa.trusted_content_ledger_write', true) is distinct from 'on'
     or new.recorded_by is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'content_input_ledger_requires_trusted_rpc';
  end if;
  if not exists (
    select 1 from public.veroxa_content_items item
    where item.id = new.content_item_id and item.restaurant_id = new.restaurant_id
  ) then
    raise exception using errcode = '23503', message = 'content_input_item_not_in_momo_scope';
  end if;
  if new.input_kind = 'owner_confirmed_truth' then
    select encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
      into expected_truth_hash
    from public.veroxa_restaurant_truth_fields field
    where field.id = new.truth_field_id and field.restaurant_id = new.restaurant_id
      and field.is_current and field.status = 'owner_confirmed';
    expected_input_hash := encode(extensions.digest(convert_to(
      concat_ws('|', new.content_item_id::text, new.input_kind,
        new.truth_field_id::text, expected_truth_hash,
        (select item.manual_pillar from public.veroxa_content_items item where item.id = new.content_item_id)),
      'UTF8'), 'sha256'), 'hex');
    if expected_truth_hash is null
       or new.truth_value_sha256 is distinct from expected_truth_hash
       or new.input_sha256 is distinct from expected_input_hash then
      raise exception using errcode = '23514', message = 'content_truth_provenance_mismatch';
    end if;
  else
    if not exists (
      select 1
      from public.veroxa_media_assets asset
      join public.veroxa_media_rights rights
        on rights.asset_id = asset.id and rights.restaurant_id = asset.restaurant_id
      join public.veroxa_media_reviews review
        on review.asset_id = asset.id and review.restaurant_id = asset.restaurant_id
      where asset.id = new.media_asset_id and asset.restaurant_id = new.restaurant_id
        and rights.rights_status = 'confirmed'
        and (rights.valid_from is null or rights.valid_from <= now())
        and (rights.expires_at is null or rights.expires_at > now())
        and rights.attestation_version = new.rights_attestation_version
        and rights.attestation_sha256 = new.rights_attestation_sha256
        and review.is_current and review.status = 'approved' and review.public_use_approved
    ) then
      raise exception using errcode = '23514', message = 'content_media_provenance_not_current';
    end if;
    expected_input_hash := encode(extensions.digest(convert_to(
      concat_ws('|', new.content_item_id::text, new.input_kind,
        new.media_asset_id::text, new.rights_attestation_version,
        new.rights_attestation_sha256,
        (select item.manual_pillar from public.veroxa_content_items item where item.id = new.content_item_id)),
      'UTF8'), 'sha256'), 'hex');
    if new.input_sha256 is distinct from expected_input_hash then
      raise exception using errcode = '23514', message = 'content_media_provenance_mismatch';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_content_input_ledger_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_content_input_ledger_validate
  on public.veroxa_content_input_ledger;
create trigger veroxa_content_input_ledger_validate
before insert or update or delete on public.veroxa_content_input_ledger
for each row execute function veroxa_private.validate_content_input_ledger_v1();

create table if not exists public.veroxa_activation_decisions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  gate_run_id uuid not null references public.veroxa_readiness_gate_runs(id) on delete restrict,
  mode text not null check (mode = 'rehearsal'),
  decision text not null check (decision = 'no_go'),
  reason text not null check (char_length(btrim(reason)) between 10 and 2000),
  blocker_snapshot jsonb not null check (jsonb_typeof(blocker_snapshot) = 'array'),
  decided_by uuid not null references public.veroxa_user_profiles(user_id),
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (gate_run_id, mode, decision)
);
create index if not exists veroxa_activation_decisions_restaurant_idx
  on public.veroxa_activation_decisions (restaurant_id, decided_at desc);
create index if not exists veroxa_activation_decisions_actor_idx
  on public.veroxa_activation_decisions (decided_by);

-- Singleton scope, forced RLS, and explicit privileges for the new tables.
drop trigger if exists veroxa_content_input_ledger_momo_scope
  on public.veroxa_content_input_ledger;
create trigger veroxa_content_input_ledger_momo_scope
before insert or update of restaurant_id on public.veroxa_content_input_ledger
for each row execute function veroxa_private.enforce_momo_operational_row();
drop trigger if exists veroxa_activation_decisions_momo_scope
  on public.veroxa_activation_decisions;
create trigger veroxa_activation_decisions_momo_scope
before insert or update of restaurant_id on public.veroxa_activation_decisions
for each row execute function veroxa_private.enforce_momo_operational_row();

alter table public.veroxa_content_input_ledger enable row level security;
alter table public.veroxa_content_input_ledger force row level security;
alter table public.veroxa_activation_decisions enable row level security;
alter table public.veroxa_activation_decisions force row level security;
revoke all on table public.veroxa_content_input_ledger,
  public.veroxa_activation_decisions from public, anon, authenticated;
grant select on table public.veroxa_content_input_ledger to authenticated;
grant select on table public.veroxa_activation_decisions to authenticated;

drop policy if exists veroxa_content_input_ledger_team_select
  on public.veroxa_content_input_ledger;
create policy veroxa_content_input_ledger_team_select
on public.veroxa_content_input_ledger for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
drop policy if exists veroxa_content_input_ledger_team_insert
  on public.veroxa_content_input_ledger;
drop policy if exists veroxa_activation_decisions_team_select
  on public.veroxa_activation_decisions;
create policy veroxa_activation_decisions_team_select
on public.veroxa_activation_decisions for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));

-- -------------------------------------------------------------------------
-- Narrow operational-scope helper for server-only provisioning
-- -------------------------------------------------------------------------

create or replace function public.veroxa_is_momo_operational_restaurant_v1(
  p_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    join public.veroxa_restaurants restaurant on restaurant.id = scope.restaurant_id
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and scope.restaurant_id = p_restaurant_id
      and restaurant.status = 'active'::public.veroxa_account_status_v1
  );
$$;
revoke all on function public.veroxa_is_momo_operational_restaurant_v1(uuid)
  from public, anon, authenticated;
grant execute on function public.veroxa_is_momo_operational_restaurant_v1(uuid)
  to service_role;

-- -------------------------------------------------------------------------
-- Confirmation snapshot and stale-subject protection
-- -------------------------------------------------------------------------

create or replace function veroxa_private.content_input_fingerprint_v1(
  p_content_item_id uuid,
  p_restaurant_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'kind', input.input_kind,
        'truthFieldId', input.truth_field_id,
        'mediaAssetId', input.media_asset_id,
        'inputSha256', input.input_sha256,
        'truthValueSha256', input.truth_value_sha256,
        'rightsAttestationVersion', input.rights_attestation_version,
        'rightsAttestationSha256', input.rights_attestation_sha256,
        'currentSource', case input.input_kind
          when 'owner_confirmed_truth' then (
            select jsonb_build_object(
              'isCurrent', field.is_current, 'status', field.status,
              'valueSha256', encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex'),
              'updatedAt', field.updated_at
            )
            from public.veroxa_restaurant_truth_fields field
            where field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
          )
          else (
            select jsonb_build_object(
              'rightsStatus', rights.rights_status, 'usageScope', rights.usage_scope,
              'validFrom', rights.valid_from, 'expiresAt', rights.expires_at,
              'attestationVersion', rights.attestation_version,
              'attestationSha256', rights.attestation_sha256,
              'reviewId', review.id, 'reviewStatus', review.status,
              'reviewCurrent', review.is_current,
              'publicUseApproved', review.public_use_approved,
              'rightsUpdatedAt', rights.updated_at, 'reviewUpdatedAt', review.updated_at
            )
            from public.veroxa_media_rights rights
            left join public.veroxa_media_reviews review
              on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
             and review.is_current
            where rights.asset_id = input.media_asset_id
              and rights.restaurant_id = input.restaurant_id
          )
        end
      ) order by input.input_kind, input.truth_field_id, input.media_asset_id
    ),
    '[]'::jsonb
  )
  from public.veroxa_content_input_ledger input
  where input.restaurant_id = p_restaurant_id
    and input.content_item_id = p_content_item_id;
$$;
revoke all on function veroxa_private.content_input_fingerprint_v1(uuid, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.content_inputs_current_v1(
  p_content_item_id uuid,
  p_restaurant_id uuid,
  p_platform text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.veroxa_content_input_ledger input
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
    )
    and exists (
      select 1 from public.veroxa_content_items item
      where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id
        and (
          (item.primary_media_asset_id is null and not exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
          ))
          or
          (item.primary_media_asset_id is not null and exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
              and media_input.media_asset_id = item.primary_media_asset_id
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_content_items item
        on item.id = input.content_item_id and item.restaurant_id = input.restaurant_id
      left join public.veroxa_restaurant_truth_fields field
        on input.input_kind = 'owner_confirmed_truth'
       and field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      left join public.veroxa_media_rights rights
        on input.input_kind = 'permissioned_media'
       and rights.asset_id = input.media_asset_id and rights.restaurant_id = input.restaurant_id
      left join public.veroxa_media_reviews review
        on input.input_kind = 'permissioned_media'
       and review.asset_id = input.media_asset_id and review.restaurant_id = input.restaurant_id
       and review.is_current
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and (
          (input.input_kind = 'owner_confirmed_truth' and (
            field.id is null or not field.is_current or field.status <> 'owner_confirmed'
            or input.truth_value_sha256 is distinct from
              encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, field.id::text,
                encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex'),
                item.manual_pillar), 'UTF8'), 'sha256'), 'hex')
          ))
          or
          (input.input_kind = 'permissioned_media' and (
            rights.id is null or rights.rights_status <> 'confirmed'
            or (rights.valid_from is not null and rights.valid_from > now())
            or (rights.expires_at is not null and rights.expires_at <= now())
            or rights.attestation_version is distinct from input.rights_attestation_version
            or rights.attestation_sha256 is distinct from input.rights_attestation_sha256
            or review.id is null or not review.is_current or review.status <> 'approved'
            or not review.public_use_approved
            or (p_platform is not null and not (rights.usage_scope ? p_platform))
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, rights.asset_id::text,
                rights.attestation_version, rights.attestation_sha256, item.manual_pillar),
              'UTF8'), 'sha256'), 'hex')
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_restaurant_truth_fields field
        on field.id = input.truth_field_id
       and field.restaurant_id = input.restaurant_id
      join lateral (
        select confirmation.*
        from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = input.restaurant_id
          and confirmation.subject_type = 'truth_field'
          and confirmation.subject_id = input.truth_field_id
        order by confirmation.submitted_at desc, confirmation.created_at desc,
          confirmation.id desc
        limit 1
      ) latest on true
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
        and not (
          latest.status = 'approved'
          and latest.decision in ('confirm','correct')
          and field.owner_confirmed_by = latest.submitted_by
          and field.owner_confirmed_at = latest.submitted_at
        )
    );
$$;
revoke all on function veroxa_private.content_inputs_current_v1(uuid, uuid, text)
  from public, anon, authenticated;

create or replace function veroxa_private.content_media_valid_at_v1(
  p_content_item_id uuid,
  p_restaurant_id uuid,
  p_platform text,
  p_usage_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_usage_at is not null and exists (
    select 1
    from public.veroxa_content_items item
    join public.veroxa_content_input_ledger input
      on input.content_item_id = item.id
     and input.restaurant_id = item.restaurant_id
     and input.input_kind = 'permissioned_media'
     and input.media_asset_id = item.primary_media_asset_id
    join public.veroxa_media_rights rights
      on rights.asset_id = input.media_asset_id
     and rights.restaurant_id = input.restaurant_id
    join public.veroxa_media_reviews review
      on review.asset_id = rights.asset_id
     and review.restaurant_id = rights.restaurant_id
     and review.is_current
    where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id
      and item.primary_media_asset_id is not null
      and rights.rights_status = 'confirmed'
      and (rights.valid_from is null or rights.valid_from <= p_usage_at)
      and (rights.expires_at is null or rights.expires_at > p_usage_at)
      and rights.usage_scope ? p_platform
      and rights.attestation_version = input.rights_attestation_version
      and rights.attestation_sha256 = input.rights_attestation_sha256
      and review.status = 'approved' and review.public_use_approved
  );
$$;
revoke all on function veroxa_private.content_media_valid_at_v1(uuid, uuid, text, timestamptz)
  from public, anon, authenticated;

create or replace function veroxa_private.jsonb_has_explicit_value_v1(
  p_value jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case jsonb_typeof(p_value)
    when 'string' then char_length(btrim(p_value #>> '{}')) > 0
    when 'number' then true
    when 'boolean' then true
    when 'array' then jsonb_array_length(p_value) > 0 and exists (
      select 1 from jsonb_array_elements(p_value) element
      where element <> 'null'::jsonb
        and not (jsonb_typeof(element) = 'string' and btrim(element #>> '{}') = '')
        and not (jsonb_typeof(element) = 'array' and element = '[]'::jsonb)
        and not (jsonb_typeof(element) = 'object' and element = '{}'::jsonb)
    )
    when 'object' then exists (
      select 1 from jsonb_each(p_value) pair
      where pair.value <> 'null'::jsonb
        and not (jsonb_typeof(pair.value) = 'string' and btrim(pair.value #>> '{}') = '')
        and not (jsonb_typeof(pair.value) = 'array' and pair.value = '[]'::jsonb)
        and not (jsonb_typeof(pair.value) = 'object' and pair.value = '{}'::jsonb)
    )
    else false
  end;
$$;
revoke all on function veroxa_private.jsonb_has_explicit_value_v1(jsonb)
  from public, anon, authenticated;

create or replace function veroxa_private.truth_value_shape_valid_v1(
  p_field_key text,
  p_value jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_field_key = 'claims.halal' then
      jsonb_typeof(p_value) = 'array'
      and jsonb_array_length(p_value) = 1
      and jsonb_typeof(p_value -> 0) = 'string'
      and lower(btrim(p_value ->> 0)) in (
        'yes','true','halal','no','false','not_halal'
      )
    when p_field_key like 'services.%'
      or p_field_key like 'goals.%'
      or p_field_key like 'claims.%' then
      jsonb_typeof(p_value) = 'array'
      and jsonb_array_length(p_value) between 1 and 50
      and not exists (
        select 1 from jsonb_array_elements(p_value) element
        where jsonb_typeof(element) <> 'string'
          or char_length(btrim(element #>> '{}')) not between 1 and 240
      )
      and (
        select count(*) = count(distinct lower(btrim(element #>> '{}')))
        from jsonb_array_elements(p_value) element
      )
    else
      jsonb_typeof(p_value) = 'object'
      and p_value ? 'text'
      and not exists (
        select 1 from jsonb_object_keys(p_value) key
        where key <> 'text'
      )
      and jsonb_typeof(p_value -> 'text') = 'string'
      and char_length(btrim(p_value ->> 'text')) between 1 and 4000
  end;
$$;
revoke all on function veroxa_private.truth_value_shape_valid_v1(text, jsonb)
  from public, anon, authenticated;

create or replace function veroxa_private.truth_fields_allow_exact_text_v1(
  p_restaurant_id uuid,
  p_truth_field_ids uuid[],
  p_field_keys text[],
  p_text text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_claim text := lower(regexp_replace(
    btrim(coalesce(p_text, '')), '[^a-zA-Z0-9%$]+', ' ', 'g'));
  truth_text text;
  semantic_claim text;
  semantic_truth text;
  token text;
  checked integer := 0;
  claim_digits text := regexp_replace(coalesce(p_text, ''), '[^0-9]', '', 'g');
  phone_requested boolean;
  address_requested boolean;
  identity_claim_value text;
  address_claim_value text;
begin
  select coalesce(string_agg(lower(regexp_replace(
      btrim(raw.value), '[^a-zA-Z0-9%$]+', ' ', 'g')), ' '), '')
    into truth_text
  from public.veroxa_restaurant_truth_fields field
  cross join lateral (
    select value from jsonb_array_elements_text(
      case when jsonb_typeof(field.value_json) = 'array'
        then field.value_json else '[]'::jsonb end)
    union all
    select field.value_json ->> 'text'
      where jsonb_typeof(field.value_json) = 'object'
        and field.value_json ? 'text'
    union all
    select field.value_json #>> '{}'
      where jsonb_typeof(field.value_json) = 'string'
  ) raw
  where field.restaurant_id = p_restaurant_id
    and field.id = any(coalesce(p_truth_field_ids, '{}'::uuid[]))
    and field.field_key = any(p_field_keys)
    and field.is_current and field.status = 'owner_confirmed';
  if truth_text = '' or normalized_claim = '' then
    return false;
  end if;
  semantic_claim := replace(replace(replace(replace(replace(
    normalized_claim, 'gluten free', 'gluten_free'),
    'dairy free', 'dairy_free'), 'nut free', 'nut_free'),
    'buy one get one', 'bogo'), 'complimentary', 'free');
  semantic_truth := replace(replace(replace(replace(replace(
    truth_text, 'gluten free', 'gluten_free'),
    'dairy free', 'dairy_free'), 'nut free', 'nut_free'),
    'buy one get one', 'bogo'), 'complimentary', 'free');

  if p_field_keys && array['address.primary','phone.primary'] then
    phone_requested := normalized_claim ~ '(^| )(phone|call|text us)( |$)'
      or coalesce(p_text, '') ~
        '(^|[^[:digit:]])(\+?1[[:space:].-]?)?\(?[[:digit:]]{3}\)?[[:space:].-][[:digit:]]{3}[[:space:].-][[:digit:]]{4}([^[:digit:]]|$)';
    address_requested := normalized_claim ~
      '(^| )(address|located at|visit us at|our address|find us at)( |$)';
    if not phone_requested and not address_requested then return false; end if;
    if phone_requested and (char_length(claim_digits) not between 7 and 11 or not exists (
      select 1 from public.veroxa_restaurant_truth_fields field
      where field.restaurant_id = p_restaurant_id
        and field.id = any(coalesce(p_truth_field_ids, '{}'::uuid[]))
        and field.field_key = 'phone.primary'
        and field.is_current and field.status = 'owner_confirmed'
        and right(regexp_replace(field.value_json ->> 'text', '[^0-9]', '', 'g'), 10)
          = right(claim_digits, 10)
    )) then return false; end if;
    address_claim_value := btrim(regexp_replace(normalized_claim,
      '^(our address is |our address |address |located at |location |visit us at |find us at )',
      '', 'i'));
    if address_requested and not exists (
      select 1 from public.veroxa_restaurant_truth_fields field
      where field.restaurant_id = p_restaurant_id
        and field.id = any(coalesce(p_truth_field_ids, '{}'::uuid[]))
        and field.field_key = 'address.primary'
        and field.is_current and field.status = 'owner_confirmed'
        and btrim(lower(regexp_replace(field.value_json ->> 'text',
          '[^a-zA-Z0-9]+', ' ', 'g'))) = address_claim_value
    ) then return false; end if;
    return true;
  end if;

  if p_field_keys && array['hours.regular','hours.special'] then
    semantic_claim := btrim(regexp_replace(semantic_claim,
      '^(we are |we re )', '', 'i'));
    semantic_claim := btrim(regexp_replace(semantic_claim,
      '^business hours ', '', 'i'));
    return semantic_claim <> ''
      and position(semantic_claim in btrim(semantic_truth)) > 0;
  end if;

  if p_field_keys && array['services.active','services.delivery','services.catering'] then
    if semantic_claim ~ '(^| )(delivery|deliver|delivers)( |$)' then
      checked := checked + 1;
      if semantic_truth !~ '(^| )(delivery|deliver|delivers)( |$)' then return false; end if;
    end if;
    if semantic_claim ~ '(^| )(catering|cater|caters)( |$)' then
      checked := checked + 1;
      if semantic_truth !~ '(^| )(catering|cater|caters)( |$)' then return false; end if;
    end if;
    if semantic_claim ~ '(^| )(takeout|take out)( |$)' then
      checked := checked + 1;
      if semantic_truth !~ '(^| )(takeout|take out)( |$)' then return false; end if;
    end if;
    if semantic_claim ~ '(^| )(pickup|pick up)( |$)' then
      checked := checked + 1;
      if semantic_truth !~ '(^| )(pickup|pick up)( |$)' then return false; end if;
    end if;
    foreach token in array array['dine in','order online','drive thru'] loop
      if semantic_claim like ('%' || token || '%') then
        checked := checked + 1;
        if semantic_truth not like ('%' || token || '%') then return false; end if;
      end if;
    end loop;
    foreach token in array regexp_split_to_array(semantic_claim, ' ') loop
      if char_length(token) >= 2 and token not in (
        'we','our','is','are','offer','offers','available','with','and','for','to',
        'delivery','deliver','delivers','catering','cater','caters','takeout',
        'take','out','pickup','pick','up','dine','in','order','online','drive','thru'
      ) and (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then
        return false;
      end if;
    end loop;
    return checked > 0;
  end if;

  if p_field_keys && array['claims.dietary'] then
    foreach token in array array['vegan','vegetarian','kosher'] loop
      if (' ' || semantic_claim || ' ') like ('% ' || token || ' %') then
        checked := checked + 1;
        if (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then return false; end if;
      end if;
    end loop;
    foreach token in array array['gluten_free','dairy_free','nut_free'] loop
      if semantic_claim like ('%' || token || '%') then
        checked := checked + 1;
        if semantic_truth not like ('%' || token || '%') then return false; end if;
      end if;
    end loop;
    foreach token in array regexp_split_to_array(semantic_claim, ' ') loop
      if char_length(token) >= 2 and token not in (
        'we','our','is','are','with','and','for','options','dishes',
        'vegan','vegetarian','kosher','gluten_free','dairy_free','nut_free'
      ) and (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then
        return false;
      end if;
    end loop;
    return checked > 0;
  end if;

  if p_field_keys && array['menu.primary'] then
    if coalesce(p_text, '') ~ '\$[[:space:]]*[[:digit:]]'
       or normalized_claim ~ '(^| )(price|prices|pricing|cost|costs|priced at|for only)( |$)' then
      return position(btrim(semantic_claim) in btrim(semantic_truth)) > 0;
    end if;
    if semantic_claim ~ '(^| )(free|discount|bogo|off|deal|offer)( |$)' then
      foreach token in array array['free','discount','bogo','off','deal','offer'] loop
        if (' ' || semantic_claim || ' ') like ('% ' || token || ' %') then
          checked := checked + 1;
          if (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then return false; end if;
        end if;
      end loop;
    end if;
    foreach token in array regexp_split_to_array(semantic_claim, ' ') loop
      if token ~ '^[0-9]+$' then
        checked := checked + 1;
        if (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then return false; end if;
      end if;
    end loop;
    foreach token in array regexp_split_to_array(semantic_claim, ' ') loop
      if char_length(token) >= 2 and token not in (
        'a','an','and','are','at','available','for','from','is','menu','now',
        'on','only','order','our','priced','cost','costs','serve','serves',
        'serving','the','to','try','we'
      ) then
        checked := checked + 1;
        if (' ' || semantic_truth || ' ') not like ('% ' || token || ' %') then return false; end if;
      end if;
    end loop;
    return checked > 0;
  end if;

  -- Identity framing is stripped, then the remaining value must exactly equal
  -- one selected canonical owner value.  Prefix/suffix strengthening is denied.
  identity_claim_value := btrim(regexp_replace(normalized_claim,
    '^(our )?(official name|restaurant name)( is)? |^known as ', '', 'i'));
  return exists (
    select 1
    from public.veroxa_restaurant_truth_fields field
    cross join lateral (
      select value from jsonb_array_elements_text(
        case when jsonb_typeof(field.value_json) = 'array'
          then field.value_json else '[]'::jsonb end)
      union all
      select field.value_json ->> 'text'
        where jsonb_typeof(field.value_json) = 'object' and field.value_json ? 'text'
    ) raw
    where field.restaurant_id = p_restaurant_id
      and field.id = any(coalesce(p_truth_field_ids, '{}'::uuid[]))
      and field.field_key = any(p_field_keys)
      and field.is_current and field.status = 'owner_confirmed'
      and btrim(lower(regexp_replace(raw.value,
        '[^a-zA-Z0-9]+', ' ', 'g'))) = identity_claim_value
  );
end;
$$;
revoke all on function veroxa_private.truth_fields_allow_exact_text_v1(uuid, uuid[], text[], text)
  from public, anon, authenticated;

create or replace function veroxa_private.text_claims_supported_by_truth_ids_v1(
  p_restaurant_id uuid,
  p_text text,
  p_truth_field_ids uuid[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_text text := lower(regexp_replace(
    btrim(coalesce(p_text, '')), '[[:space:]]+', ' ', 'g'));
  promotion_scan_text text;
begin
  promotion_scan_text := regexp_replace(normalized_text,
    '(gluten|dairy|nut)[[:space:]-]+free', '', 'g');
  -- Comparative/ranking claims have no dedicated owner-confirmed source in V1.
  if normalized_text ~ '(^|[^[:alnum:]_])(best|number[[:space:]-]*one|top[[:space:]-]*rated|ranked[[:space:]-]+first)([^[:alnum:]_]|$)'
     or normalized_text ~ '#[[:space:]]*1([^[:digit:]]|$)' then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(not[[:space:]-]+halal|non[[:space:]-]+halal)([^[:alnum:]_]|$)' then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(100[[:space:]]*%|all|certified|certification|fully|zabiha)([^[:alnum:]_]|$)'
     and normalized_text ~ '(^|[^[:alnum:]_])(halal|vegan|vegetarian|gluten[[:space:]-]+free|dairy[[:space:]-]+free|nut[[:space:]-]+free|kosher)([^[:alnum:]_]|$)' then
    return false;
  end if;
  if normalized_text ~ '[[:digit:]]'
     and normalized_text ~ '(^|[^[:alnum:]_])(halal|vegan|vegetarian|gluten[[:space:]-]+free|dairy[[:space:]-]+free|nut[[:space:]-]+free|kosher|delivery|deliver|catering|cater|takeout|pickup)([^[:alnum:]_]|$)' then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(today|tonight|currently|right[[:space:]]+now)([^[:alnum:]_]|$)'
     and normalized_text ~ '(^|[^[:alnum:]_])(open|opens|hours|closing|closes)([^[:alnum:]_]|$)' then
    return false;
  end if;
  if promotion_scan_text ~ '(^|[^[:alnum:]_])(discount|discounts|free|complimentary|bogo)([^[:alnum:]_]|$)'
     or promotion_scan_text ~ '(^|[^[:alnum:]_])(buy[[:space:]]+one[[:space:]]+get[[:space:]]+one|limited[[:space:]-]*time[[:space:]]+(deal|offer)|special[[:space:]]+offer)([^[:alnum:]_]|$)'
     or promotion_scan_text ~ '[[:digit:]][[:space:]]*%[[:space:]]*off([^[:alnum:]_]|$)' then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])halal([^[:alnum:]_]|$)'
     and not exists (
       select 1 from public.veroxa_restaurant_truth_fields field
       where field.restaurant_id = p_restaurant_id
         and field.id = any(coalesce(p_truth_field_ids, '{}'::uuid[]))
         and field.field_key = 'claims.halal'
         and field.is_current and field.status = 'owner_confirmed'
         and jsonb_typeof(field.value_json) = 'array'
         and exists (
           select 1 from jsonb_array_elements_text(field.value_json) value
           where lower(btrim(value)) in ('halal','yes','true','confirmed halal')
         )
         and not exists (
           select 1 from jsonb_array_elements_text(field.value_json) value
           where lower(btrim(value)) ~ '(^|[^[:alnum:]_])(no|not|false|unknown|unverified|unconfirmed|non[[:space:]-]*halal)([^[:alnum:]_]|$)'
         )
     ) then
    return false;
  end if;
  if (normalized_text ~ '(^|[^[:alnum:]_])(menu|price|prices|pricing)([^[:alnum:]_]|$)'
      or normalized_text ~ '(^|[^[:alnum:]_])(costs?|priced[[:space:]]+at|for[[:space:]]+only)([^[:alnum:]_]|$)'
      or normalized_text ~ '(^|[^[:alnum:]_])(we[[:space:]]+serve|now[[:space:]]+serving|available[[:space:]]+to[[:space:]]+order)([^[:alnum:]_]|$)'
      or normalized_text ~ '\$[[:space:]]*[[:digit:]]'
    )
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids, array['menu.primary'], p_text
     ) then
    return false;
  end if;
  if (normalized_text ~ '(^|[^[:alnum:]_])(open[[:space:]]+(daily|today|until|from)|business[[:space:]]+hours)([^[:alnum:]_]|$)'
      or normalized_text ~ '(^|[^[:digit:]])24[[:space:]]*/[[:space:]]*7([^[:digit:]]|$)'
      or normalized_text ~ '(^|[^[:digit:]])[[:digit:]]{1,2}(:[[:digit:]]{2})?[[:space:]]*(am|pm)([^[:alpha:]]|$)')
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids,
       array['hours.regular','hours.special'], p_text
     ) then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(delivery|deliver|delivers|catering|cater|caters|takeout|take[[:space:]-]+out|pickup|pick[[:space:]-]+up|ordering|order[[:space:]]+online|dine[[:space:]-]+in|drive[[:space:]-]+thru)([^[:alnum:]_]|$)'
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids,
       array['services.active','services.delivery','services.catering'], p_text
     ) then
    return false;
  end if;
  if (normalized_text ~ '(^|[^[:alnum:]_])(address|located|location|located[[:space:]]+at|visit[[:space:]]+us([[:space:]]+at)?|our[[:space:]]+address|find[[:space:]]+us[[:space:]]+at|phone|call|contact[[:space:]]+us|text[[:space:]]+us)([^[:alnum:]_]|$)'
      or normalized_text ~ '(^|[^[:digit:]])(\+?1[[:space:].-]?)?\(?[[:digit:]]{3}\)?[[:space:].-][[:digit:]]{3}[[:space:].-][[:digit:]]{4}([^[:digit:]]|$)')
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids,
       array['address.primary','phone.primary'], p_text
     ) then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(vegan|vegetarian|gluten[[:space:]-]+free|dairy[[:space:]-]+free|nut[[:space:]-]+free|allergen|allergy[[:space:]-]+friendly|kosher)([^[:alnum:]_]|$)'
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids,
       array['claims.dietary'], p_text
     ) then
    return false;
  end if;
  if normalized_text ~ '(^|[^[:alnum:]_])(official[[:space:]]+name|restaurant[[:space:]]+name|known[[:space:]]+as)([^[:alnum:]_]|$)'
     and not veroxa_private.truth_fields_allow_exact_text_v1(
       p_restaurant_id, p_truth_field_ids,
       array['identity.display_name','identity.legal_name','identity.cuisine'], p_text
     ) then
    return false;
  end if;
  return true;
end;
$$;
revoke all on function veroxa_private.text_claims_supported_by_truth_ids_v1(uuid, text, uuid[])
  from public, anon, authenticated;

create or replace function veroxa_private.content_claims_supported_v1(
  p_content_item_id uuid,
  p_restaurant_id uuid,
  p_extra_text text default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  title_text text;
  concept_text text;
  caption_text text;
  truth_ids uuid[];
begin
  select item.title, item.concept, item.master_caption
    into title_text, concept_text, caption_text
  from public.veroxa_content_items item
  where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id;
  if not found then
    return false;
  end if;
  select coalesce(array_agg(input.truth_field_id order by input.truth_field_id), '{}'::uuid[])
    into truth_ids
  from public.veroxa_content_input_ledger input
  where input.content_item_id = p_content_item_id
    and input.restaurant_id = p_restaurant_id
    and input.input_kind = 'owner_confirmed_truth';
  return veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, title_text, truth_ids)
    and veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, concept_text, truth_ids)
    and veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, caption_text, truth_ids)
    and veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, p_extra_text, truth_ids);
end;
$$;
revoke all on function veroxa_private.content_claims_supported_v1(uuid, uuid, text)
  from public, anon, authenticated;

create or replace function veroxa_private.confirmation_subject_snapshot_v1(
  p_restaurant_id uuid,
  p_subject_type text,
  p_subject_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  case p_subject_type
    when 'truth_field' then
      select jsonb_build_object(
        'id', row.id, 'fieldKey', row.field_key, 'section', row.section,
        'value', row.value_json, 'status', row.status, 'source', row.source,
        'isCurrent', row.is_current, 'updatedAt', row.updated_at
      ) into result
      from public.veroxa_restaurant_truth_fields row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
        and row.is_current and row.status <> 'superseded';
    when 'contact' then
      select jsonb_build_object(
        'id', row.id, 'kind', row.contact_kind, 'name', row.name,
        'email', row.email, 'phone', row.phone, 'isPrimary', row.is_primary,
        'status', row.status, 'updatedAt', row.updated_at
      ) into result
      from public.veroxa_restaurant_contacts row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
        and row.status <> 'superseded';
    when 'onboarding_step' then
      select jsonb_build_object(
        'id', row.id, 'stepKey', row.step_key, 'status', row.status,
        'completionEvidence', row.completion_evidence,
        'blockerReason', row.blocker_reason, 'updatedAt', row.updated_at
      ) into result
      from public.veroxa_onboarding_steps row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'presence_profile' then
      select jsonb_build_object(
        'id', row.id, 'provider', row.provider, 'publicUrl', row.public_url,
        'accessStatus', row.access_status, 'truthStatus', row.truth_status,
        'externalAccountLabel', row.external_account_label,
        'lastCheckedAt', row.last_checked_at, 'updatedAt', row.updated_at
      ) into result
      from public.veroxa_presence_profiles row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
        and row.truth_status <> 'superseded';
    when 'media_rights' then
      select jsonb_build_object(
        'id', row.id, 'assetId', row.asset_id, 'rightsStatus', row.rights_status,
        'usageScope', row.usage_scope, 'validFrom', row.valid_from,
        'expiresAt', row.expires_at,
        'attestationVersion', row.attestation_version,
        'attestationSha256', row.attestation_sha256, 'updatedAt', row.updated_at
      ) into result
      from public.veroxa_media_rights row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'content_item' then
      select jsonb_build_object(
        'id', row.id, 'title', row.title, 'concept', row.concept,
        'masterCaption', row.master_caption, 'manualPillar', row.manual_pillar,
        'primaryMediaAssetId', row.primary_media_asset_id,
        'inputs', veroxa_private.content_input_fingerprint_v1(row.id, row.restaurant_id)
      ) into result
      from public.veroxa_content_items row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
        and row.status in ('pending','in_review','approved');
    else
      result := null;
  end case;
  return result;
end;
$$;
revoke all on function veroxa_private.confirmation_subject_snapshot_v1(uuid, text, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.confirmation_snapshot_sha256_v1(
  p_snapshot jsonb
)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(coalesce(p_snapshot, 'null'::jsonb)::text, 'UTF8'), 'sha256'), 'hex');
$$;
revoke all on function veroxa_private.confirmation_snapshot_sha256_v1(jsonb)
  from public, anon, authenticated;

create or replace function veroxa_private.variant_owner_confirmation_satisfied(
  target_variant_id uuid,
  target_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_content_variants variant
    join public.veroxa_content_items item on item.id = variant.content_item_id
    where variant.id = target_variant_id
      and variant.restaurant_id = target_restaurant_id
      and item.restaurant_id = target_restaurant_id
      and item.status = 'approved'
      and not item.requires_owner_confirmation
      and not exists (
        select 1
        from lateral (
          select confirmation.*
          from public.veroxa_confirmations confirmation
          where confirmation.restaurant_id = item.restaurant_id
            and confirmation.subject_type = 'content_item'
            and confirmation.subject_id = item.id
          order by confirmation.submitted_at desc, confirmation.created_at desc,
            confirmation.id desc
          limit 1
        ) latest
        where not (
          latest.status = 'approved'
          and latest.decision in ('confirm','correct')
          and item.owner_confirmation_id = latest.id
        )
      )
      and (
        item.owner_confirmation_id is null
        or exists (
          select 1 from public.veroxa_confirmations confirmation
          where confirmation.id = item.owner_confirmation_id
            and confirmation.restaurant_id = target_restaurant_id
            and confirmation.subject_type = 'content_item'
            and confirmation.subject_id = item.id
            and confirmation.confirmation_kind = 'content_direction'
            and confirmation.decision in ('confirm','correct')
            and confirmation.status = 'approved'
            and (
              (confirmation.decision = 'confirm'
                and confirmation.subject_snapshot_sha256 =
                  veroxa_private.confirmation_snapshot_sha256_v1(
                    veroxa_private.confirmation_subject_snapshot_v1(
                      item.restaurant_id, 'content_item', item.id)))
              or
              (confirmation.decision = 'correct'
                and item.title = coalesce(
                  confirmation.proposed_value ->> 'title',
                  confirmation.subject_snapshot ->> 'title')
                and item.concept = coalesce(
                  confirmation.proposed_value ->> 'concept',
                  confirmation.subject_snapshot ->> 'concept')
                and item.master_caption is not distinct from coalesce(
                  nullif(confirmation.proposed_value ->> 'masterCaption', ''),
                  confirmation.subject_snapshot ->> 'masterCaption')
                and item.manual_pillar is not distinct from
                  confirmation.subject_snapshot ->> 'manualPillar'
                and item.primary_media_asset_id::text is not distinct from
                  confirmation.subject_snapshot ->> 'primaryMediaAssetId'
                and veroxa_private.content_input_fingerprint_v1(
                  item.id, item.restaurant_id) = confirmation.subject_snapshot -> 'inputs')
            )
        )
      )
      and (item.manual_pillar is null
        or veroxa_private.content_inputs_current_v1(item.id, item.restaurant_id, variant.platform))
      and veroxa_private.content_claims_supported_v1(
        item.id, item.restaurant_id, variant.caption)
  );
$$;
revoke all on function veroxa_private.variant_owner_confirmation_satisfied(uuid, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.canonical_https_url_v1(p_url text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  candidate text := split_part(btrim(coalesce(p_url, '')), '#', 1);
  authority text;
  canonical_authority text;
  remainder text;
begin
  if candidate = '' or candidate !~ '^https://' or candidate ~ '[[:space:]]' then
    return null;
  end if;
  authority := substring(candidate from '^https://([^/?#]+)');
  if authority is null or authority ~ '@'
     or authority !~ '^[A-Za-z0-9.-]+(:[0-9]{1,5})?$' then
    return null;
  end if;
  remainder := substr(candidate, 9 + char_length(authority));
  canonical_authority := lower(regexp_replace(authority, ':443$', ''));
  if canonical_authority = '' or canonical_authority like '.%'
     or canonical_authority like '%.' or canonical_authority like '%..%' then
    return null;
  end if;
  if remainder = '' then
    remainder := '/';
  elsif left(remainder, 1) = '?' then
    remainder := '/' || remainder;
  elsif left(remainder, 1) <> '/' then
    return null;
  end if;
  return 'https://' || canonical_authority || remainder;
end;
$$;
revoke all on function veroxa_private.canonical_https_url_v1(text)
  from public, anon, authenticated;

create or replace function veroxa_private.prepare_confirmation_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.submitted_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_has_active_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'confirmation_requires_active_client_author';
  end if;
  new.subject_snapshot := veroxa_private.confirmation_subject_snapshot_v1(
    new.restaurant_id, new.subject_type, new.subject_id
  );
  if new.subject_snapshot is null then
    raise exception using errcode = '23503', message = 'confirmation_subject_not_in_momo_scope';
  end if;
  new.subject_snapshot_sha256 := veroxa_private.confirmation_snapshot_sha256_v1(new.subject_snapshot);
  new.status := 'pending';
  new.submitted_at := clock_timestamp();
  new.created_at := clock_timestamp();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_notes := null;
  return new;
end;
$$;
revoke all on function veroxa_private.prepare_confirmation_submission()
  from public, anon, authenticated;

create or replace function public.veroxa_submit_momo_confirmation_v1(
  p_restaurant_id uuid,
  p_subject_type text,
  p_subject_id uuid,
  p_confirmation_kind text,
  p_decision text,
  p_proposed_value jsonb default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_confirmation_id uuid;
  submitted_value jsonb := p_proposed_value;
  canonical_url text;
  truth_key text;
  truth_value jsonb;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;
  if p_decision not in ('confirm','correct','reject','needs_help') then
    raise exception using errcode = '22023', message = 'invalid_confirmation_decision';
  end if;
  if p_decision = 'correct' and p_proposed_value is null then
    raise exception using errcode = '23514', message = 'correction_requires_client_proposed_value';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000 then
    raise exception using errcode = '22001', message = 'confirmation_notes_too_long';
  end if;
  if not (
    (p_subject_type = 'truth_field' and p_confirmation_kind = 'business_truth')
    or (p_subject_type = 'contact' and p_confirmation_kind = 'contact')
    or (p_subject_type = 'onboarding_step' and p_confirmation_kind = 'onboarding')
    or (p_subject_type = 'presence_profile' and p_confirmation_kind = 'presence')
    or (p_subject_type = 'media_rights' and p_confirmation_kind = 'usage_rights')
    or (p_subject_type = 'content_item' and p_confirmation_kind = 'content_direction')
  ) then
    raise exception using errcode = '23514', message = 'confirmation_subject_kind_mismatch';
  end if;
  if p_subject_type = 'media_rights' and exists (
    select 1 from public.veroxa_media_rights rights
    where rights.id = p_subject_id and rights.restaurant_id = p_restaurant_id
      and rights.rights_status = 'revoked'
  ) then
    raise exception using errcode = '23514', message = 'revoked_media_rights_are_terminal_register_new_asset';
  end if;
  if p_subject_type = 'truth_field' and p_decision in ('confirm','correct') then
    select field.field_key,
      case when p_decision = 'correct' then submitted_value else field.value_json end
      into truth_key, truth_value
    from public.veroxa_restaurant_truth_fields field
    where field.id = p_subject_id and field.restaurant_id = p_restaurant_id
      and field.is_current;
    if truth_key is null
       or not veroxa_private.truth_value_shape_valid_v1(truth_key, truth_value) then
      raise exception using errcode = '22023', message = 'truth_confirmation_requires_canonical_field_shape';
    end if;
  end if;
  if p_subject_type = 'presence_profile' and submitted_value ? 'publicUrl' then
    canonical_url := veroxa_private.canonical_https_url_v1(submitted_value ->> 'publicUrl');
    if canonical_url is null then
      raise exception using errcode = '22023', message = 'presence_confirmation_requires_canonical_https_url';
    end if;
    submitted_value := jsonb_set(submitted_value, '{publicUrl}', to_jsonb(canonical_url), true);
  end if;
  if p_subject_type = 'onboarding_step'
     and p_decision in ('confirm','correct') and not exists (
    select 1 from public.veroxa_onboarding_steps step
    where step.id = p_subject_id and step.restaurant_id = p_restaurant_id
      and step.status = 'ready_for_review'
      and jsonb_array_length(step.completion_evidence) > 0
  ) then
    raise exception using errcode = '23514', message = 'onboarding_confirmation_requires_ready_for_review_evidence';
  end if;
  insert into public.veroxa_confirmations (
    restaurant_id, subject_type, subject_id, confirmation_kind, decision,
    proposed_value, notes, submitted_by
  ) values (
    p_restaurant_id, p_subject_type, p_subject_id, p_confirmation_kind, p_decision,
    submitted_value, nullif(btrim(p_notes), ''), (select auth.uid())
  ) returning id into new_confirmation_id;
  return new_confirmation_id;
end;
$$;
revoke all on function public.veroxa_submit_momo_confirmation_v1(uuid, text, uuid, text, text, jsonb, text)
  from public, anon;
grant execute on function public.veroxa_submit_momo_confirmation_v1(uuid, text, uuid, text, text, jsonb, text)
  to authenticated;

revoke insert on table public.veroxa_confirmations from authenticated;
drop policy if exists veroxa_confirmations_client_insert on public.veroxa_confirmations;

-- An owner-confirmed contact is an immutable truth record.  Team correction is
-- allowed only while applying the exact approved client confirmation.
create or replace function veroxa_private.protect_owner_confirmed_contact_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare confirmation_id uuid;
begin
  confirmation_id := nullif(current_setting('veroxa.approved_contact_confirmation_id', true), '')::uuid;
  if confirmation_id is null
     and public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
     and (new.status <> 'team_prefilled'
       or new.owner_confirmed_by is not null
       or new.owner_confirmed_at is not null) then
    raise exception using errcode = '23514', message = 'team_contact_update_must_remain_unconfirmed_prefill';
  end if;
  if old.status <> 'owner_confirmed' and new.status = 'owner_confirmed'
     and (confirmation_id is null or not exists (
       select 1 from public.veroxa_confirmations confirmation
       where confirmation.id = confirmation_id
         and confirmation.restaurant_id = old.restaurant_id
         and confirmation.subject_type = 'contact'
         and confirmation.subject_id = old.id
         and confirmation.confirmation_kind = 'contact'
         and confirmation.decision in ('confirm','correct')
         and confirmation.status = 'approved'
     )) then
    raise exception using errcode = '23514', message = 'contact_owner_confirmation_requires_approved_client_evidence';
  end if;
  if old.status = 'owner_confirmed' and (
    new.contact_kind is distinct from old.contact_kind
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or new.phone is distinct from old.phone
    or new.is_primary is distinct from old.is_primary
    or new.status is distinct from old.status
    or new.owner_confirmed_by is distinct from old.owner_confirmed_by
    or new.owner_confirmed_at is distinct from old.owner_confirmed_at
  ) then
    if confirmation_id is null or not exists (
      select 1 from public.veroxa_confirmations confirmation
      where confirmation.id = confirmation_id
        and confirmation.restaurant_id = old.restaurant_id
        and confirmation.subject_type = 'contact'
        and confirmation.subject_id = old.id
        and confirmation.confirmation_kind = 'contact'
        and confirmation.decision in ('correct','reject')
        and confirmation.status = 'approved'
    ) then
      raise exception using errcode = '23514', message = 'owner_confirmed_contact_requires_approved_client_correction';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_owner_confirmed_contact_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_contacts_owner_confirmed_guard
  on public.veroxa_restaurant_contacts;
create trigger veroxa_contacts_owner_confirmed_guard
before update on public.veroxa_restaurant_contacts
for each row execute function veroxa_private.protect_owner_confirmed_contact_v1();

create or replace function veroxa_private.validate_owner_confirmed_contact_insert_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id) then
    if new.status <> 'team_prefilled'
       or new.created_by is distinct from (select auth.uid())
       or new.owner_confirmed_by is not null
       or new.owner_confirmed_at is not null then
      raise exception using errcode = '42501', message = 'team_contact_insert_must_be_unconfirmed_prefill';
    end if;
  elsif new.status = 'owner_confirmed' then
    if new.owner_confirmed_by is distinct from (select auth.uid())
       or new.created_by is distinct from (select auth.uid())
       or not public.veroxa_current_user_has_active_restaurant(new.restaurant_id) then
      raise exception using errcode = '42501', message = 'owner_confirmed_contact_requires_current_client';
    end if;
  else
    raise exception using errcode = '42501', message = 'contact_insert_requires_current_team_or_client';
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function veroxa_private.validate_owner_confirmed_contact_insert_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_contacts_owner_confirmed_insert_guard
  on public.veroxa_restaurant_contacts;
create trigger veroxa_contacts_owner_confirmed_insert_guard
before insert on public.veroxa_restaurant_contacts
for each row execute function veroxa_private.validate_owner_confirmed_contact_insert_v1();

create or replace function public.veroxa_save_momo_contact_prefill_v1(
  p_restaurant_id uuid,
  p_contact_id uuid,
  p_contact_kind text,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_is_primary boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id uuid;
  existing_record public.veroxa_restaurant_contacts%rowtype;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_contact_prefill_required';
  end if;
  if p_contact_kind not in ('owner','primary','manager','secondary')
     or char_length(coalesce(btrim(p_name), '')) not between 1 and 160
     or (nullif(lower(btrim(p_email)), '') is null
       and nullif(btrim(p_phone), '') is null) then
    raise exception using errcode = '22023', message = 'invalid_contact_prefill_payload';
  end if;
  if p_contact_id is null then
    insert into public.veroxa_restaurant_contacts (
      restaurant_id, contact_kind, name, email, phone, is_primary, status,
      owner_confirmed_by, owner_confirmed_at, created_by
    ) values (
      p_restaurant_id, p_contact_kind, btrim(p_name),
      nullif(lower(btrim(p_email)), ''), nullif(btrim(p_phone), ''),
      p_is_primary, 'team_prefilled', null, null, (select auth.uid())
    ) returning id into saved_id;
  else
    select * into existing_record
    from public.veroxa_restaurant_contacts contact
    where contact.id = p_contact_id and contact.restaurant_id = p_restaurant_id
    for update;
    if not found then
      raise exception using errcode = '23503', message = 'contact_not_in_momo_scope';
    end if;
    if existing_record.status = 'owner_confirmed' then
      raise exception using errcode = '23514', message = 'owner_confirmed_contact_requires_new_client_correction';
    end if;
    update public.veroxa_restaurant_contacts
    set contact_kind = p_contact_kind, name = btrim(p_name),
        email = nullif(lower(btrim(p_email)), ''),
        phone = nullif(btrim(p_phone), ''), is_primary = p_is_primary,
        status = 'team_prefilled', owner_confirmed_by = null,
        owner_confirmed_at = null
    where id = existing_record.id
    returning id into saved_id;
  end if;
  return saved_id;
end;
$$;
revoke all on function public.veroxa_save_momo_contact_prefill_v1(
  uuid, uuid, text, text, text, text, boolean
) from public, anon;
grant execute on function public.veroxa_save_momo_contact_prefill_v1(
  uuid, uuid, text, text, text, text, boolean
) to authenticated;
revoke insert, update, delete on table public.veroxa_restaurant_contacts
  from authenticated;
drop policy if exists veroxa_restaurant_contacts_team_insert
  on public.veroxa_restaurant_contacts;
drop policy if exists veroxa_restaurant_contacts_team_update
  on public.veroxa_restaurant_contacts;

create or replace function veroxa_private.protect_content_owner_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.owner_confirmation_id is not null and (
    new.strategy_id is distinct from old.strategy_id
    or new.primary_media_asset_id is distinct from old.primary_media_asset_id
    or new.title is distinct from old.title
    or new.concept is distinct from old.concept
    or new.master_caption is distinct from old.master_caption
    or new.manual_pillar is distinct from old.manual_pillar
  ) and not exists (
    select 1 from public.veroxa_confirmations confirmation
    where confirmation.id = new.owner_confirmation_id
      and confirmation.id is distinct from old.owner_confirmation_id
      and confirmation.restaurant_id = new.restaurant_id
      and confirmation.subject_type = 'content_item'
      and confirmation.subject_id = new.id
      and confirmation.confirmation_kind = 'content_direction'
      and confirmation.decision = 'correct'
      and confirmation.status = 'approved'
      and confirmation.subject_snapshot_sha256 =
        veroxa_private.confirmation_snapshot_sha256_v1(
          veroxa_private.confirmation_subject_snapshot_v1(new.restaurant_id, 'content_item', new.id)
        )
      and new.title = coalesce(confirmation.proposed_value ->> 'title', confirmation.subject_snapshot ->> 'title')
      and new.concept = coalesce(confirmation.proposed_value ->> 'concept', confirmation.subject_snapshot ->> 'concept')
      and new.master_caption is not distinct from coalesce(
        nullif(confirmation.proposed_value ->> 'masterCaption', ''),
        confirmation.subject_snapshot ->> 'masterCaption')
      and new.manual_pillar is not distinct from coalesce(
        confirmation.proposed_value ->> 'manualPillar',
        confirmation.subject_snapshot ->> 'manualPillar')
      and new.primary_media_asset_id::text is not distinct from
        confirmation.subject_snapshot ->> 'primaryMediaAssetId'
      and veroxa_private.content_input_fingerprint_v1(new.id, new.restaurant_id)
        = confirmation.subject_snapshot -> 'inputs'
      and (new.manual_pillar is null
        or veroxa_private.content_inputs_current_v1(new.id, new.restaurant_id, null))
  ) then
    new.requires_owner_confirmation := true;
    new.owner_confirmation_id := null;
  end if;
  if tg_op = 'UPDATE' and old.requires_owner_confirmation and not new.requires_owner_confirmation
     and not exists (
       select 1 from public.veroxa_confirmations confirmation
       where confirmation.id = new.owner_confirmation_id
         and confirmation.restaurant_id = new.restaurant_id
         and confirmation.subject_type = 'content_item'
         and confirmation.subject_id = new.id
         and confirmation.confirmation_kind = 'content_direction'
         and confirmation.decision in ('confirm','correct')
         and confirmation.status = 'approved'
         and (
           (confirmation.decision = 'confirm'
             and confirmation.subject_snapshot_sha256 =
               veroxa_private.confirmation_snapshot_sha256_v1(
                 veroxa_private.confirmation_subject_snapshot_v1(new.restaurant_id, 'content_item', new.id)
               ))
           or
           (confirmation.decision = 'correct'
             and confirmation.subject_snapshot_sha256 =
               veroxa_private.confirmation_snapshot_sha256_v1(
                 veroxa_private.confirmation_subject_snapshot_v1(new.restaurant_id, 'content_item', new.id)
               )
             and new.title = coalesce(confirmation.proposed_value ->> 'title', confirmation.subject_snapshot ->> 'title')
             and new.concept = coalesce(confirmation.proposed_value ->> 'concept', confirmation.subject_snapshot ->> 'concept')
             and new.master_caption is not distinct from coalesce(
               nullif(confirmation.proposed_value ->> 'masterCaption', ''),
               confirmation.subject_snapshot ->> 'masterCaption')
             and new.manual_pillar is not distinct from coalesce(
               confirmation.proposed_value ->> 'manualPillar',
               confirmation.subject_snapshot ->> 'manualPillar')
             and new.primary_media_asset_id::text is not distinct from
               confirmation.subject_snapshot ->> 'primaryMediaAssetId'
             and veroxa_private.content_input_fingerprint_v1(new.id, new.restaurant_id)
               = confirmation.subject_snapshot -> 'inputs')
         )
         and (new.manual_pillar is null
           or veroxa_private.content_inputs_current_v1(new.id, new.restaurant_id, null))
     ) then
    raise exception using errcode = '23514', message = 'content_owner_confirmation_evidence_required';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_content_owner_confirmation()
  from public, anon, authenticated;
drop trigger if exists veroxa_content_items_owner_confirmation_guard
  on public.veroxa_content_items;
create trigger veroxa_content_items_owner_confirmation_guard
before update of strategy_id, primary_media_asset_id, title, concept, master_caption,
  manual_pillar, requires_owner_confirmation, owner_confirmation_id
on public.veroxa_content_items
for each row execute function veroxa_private.protect_content_owner_confirmation();

create or replace function public.veroxa_apply_confirmation_v1(
  p_confirmation_id uuid,
  p_decision public.veroxa_review_status_v1,
  p_applied_value jsonb default null,
  p_review_notes text default null
)
returns table (
  confirmation_id uuid,
  status public.veroxa_review_status_v1,
  subject_type text,
  subject_id uuid,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmation_record public.veroxa_confirmations%rowtype;
  current_snapshot jsonb;
  applied_value jsonb;
  reviewer_id uuid := (select auth.uid());
  old_truth public.veroxa_restaurant_truth_fields%rowtype;
  withdrawn_provider text;
  revoked_connection_count integer := 0;
  cancelled_queue_count integer := 0;
  cancelled_calendar_count integer := 0;
begin
  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception using errcode = '22023', message = 'terminal_confirmation_decision_required';
  end if;
  select * into confirmation_record
  from public.veroxa_confirmations where id = p_confirmation_id for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(confirmation_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_confirmation_required';
  end if;
  if confirmation_record.status not in ('pending','in_review') then
    raise exception using errcode = '23514', message = 'confirmation_already_decided';
  end if;

  case confirmation_record.subject_type
    when 'truth_field' then
      perform row.id from public.veroxa_restaurant_truth_fields row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
    when 'contact' then
      perform row.id from public.veroxa_restaurant_contacts row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
    when 'onboarding_step' then
      perform row.id from public.veroxa_onboarding_steps row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
    when 'presence_profile' then
      perform row.id from public.veroxa_presence_profiles row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
    when 'media_rights' then
      perform row.id from public.veroxa_media_rights row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
    when 'content_item' then
      perform row.id from public.veroxa_content_items row
      where row.id = confirmation_record.subject_id
        and row.restaurant_id = confirmation_record.restaurant_id for update;
      perform input.id from public.veroxa_content_input_ledger input
      where input.content_item_id = confirmation_record.subject_id
        and input.restaurant_id = confirmation_record.restaurant_id
      order by input.id for share;
      perform field.id
      from public.veroxa_restaurant_truth_fields field
      join public.veroxa_content_input_ledger input on input.truth_field_id = field.id
      where input.content_item_id = confirmation_record.subject_id
        and input.restaurant_id = confirmation_record.restaurant_id
      order by field.id for share of field;
      perform rights.id
      from public.veroxa_media_rights rights
      join public.veroxa_content_input_ledger input on input.media_asset_id = rights.asset_id
      join public.veroxa_media_reviews review
        on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
       and review.is_current
      where input.content_item_id = confirmation_record.subject_id
        and input.restaurant_id = confirmation_record.restaurant_id
      order by rights.id for share of rights, review;
    else
      raise exception using errcode = '23514', message = 'unsupported_confirmation_subject';
  end case;

  current_snapshot := veroxa_private.confirmation_subject_snapshot_v1(
    confirmation_record.restaurant_id,
    confirmation_record.subject_type,
    confirmation_record.subject_id
  );
  if p_decision = 'approved' and (current_snapshot is null
     or confirmation_record.subject_snapshot_sha256 is null
     or veroxa_private.confirmation_snapshot_sha256_v1(current_snapshot)
        is distinct from confirmation_record.subject_snapshot_sha256) then
    raise exception using errcode = '40001', message = 'confirmation_subject_changed_resubmit_required';
  end if;

  applied_value := null;
  if confirmation_record.decision = 'correct' then
    if confirmation_record.proposed_value is null then
      raise exception using errcode = '23514', message = 'correction_requires_client_proposed_value';
    end if;
    if p_applied_value is not null
       and p_applied_value is distinct from confirmation_record.proposed_value then
      raise exception using errcode = '23514', message = 'team_cannot_override_client_correction';
    end if;
    applied_value := confirmation_record.proposed_value;
  elsif p_applied_value is not null then
    raise exception using errcode = '23514', message = 'confirmation_cannot_apply_unsubmitted_value';
  end if;

  if p_decision = 'approved' and not exists (
    select 1
    from public.veroxa_user_profiles profile
    join public.veroxa_restaurant_members member on member.user_id = profile.user_id
    where profile.user_id = confirmation_record.submitted_by
      and profile.role = 'client' and profile.status = 'active'
      and member.restaurant_id = confirmation_record.restaurant_id
      and member.role = 'client' and member.status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'owner_confirmation_requires_active_client_submitter';
  end if;

  update public.veroxa_confirmations
  set status = p_decision, reviewed_by = reviewer_id, reviewed_at = now(),
      review_notes = nullif(btrim(p_review_notes), '')
  where id = confirmation_record.id;

  if p_decision = 'approved' and confirmation_record.decision in ('confirm','correct') then
    case confirmation_record.subject_type
      when 'truth_field' then
        select * into old_truth
        from public.veroxa_restaurant_truth_fields
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id
          and is_current
        for update;
        if not found then
          raise exception using errcode = '23503', message = 'confirmation_subject_missing';
        end if;
        if not veroxa_private.truth_value_shape_valid_v1(
          old_truth.field_key, coalesce(applied_value, old_truth.value_json)
        ) then
          raise exception using errcode = '22023', message = 'truth_confirmation_requires_canonical_field_shape';
        end if;
        if confirmation_record.decision = 'correct' and old_truth.status = 'owner_confirmed' then
          update public.veroxa_restaurant_truth_fields
          set is_current = false, status = 'superseded'
          where id = old_truth.id;
          insert into public.veroxa_restaurant_truth_fields (
            restaurant_id, field_key, section, value_json, status, source, is_current,
            owner_confirmed_by, owner_confirmed_at, supersedes_id, created_by
          ) values (
            old_truth.restaurant_id, old_truth.field_key, old_truth.section, applied_value,
            'owner_confirmed', 'owner', true, confirmation_record.submitted_by,
            confirmation_record.submitted_at, old_truth.id, reviewer_id
          );
        else
          update public.veroxa_restaurant_truth_fields
          set value_json = coalesce(applied_value, value_json), status = 'owner_confirmed',
              owner_confirmed_by = confirmation_record.submitted_by,
              owner_confirmed_at = confirmation_record.submitted_at
          where id = old_truth.id;
        end if;
      when 'contact' then
        perform set_config('veroxa.approved_contact_confirmation_id', confirmation_record.id::text, true);
        update public.veroxa_restaurant_contacts
        set name = case when applied_value ? 'name' then btrim(applied_value ->> 'name') else name end,
            email = case when applied_value ? 'email' then nullif(lower(btrim(applied_value ->> 'email')), '') else email end,
            phone = case when applied_value ? 'phone' then nullif(btrim(applied_value ->> 'phone'), '') else phone end,
            is_primary = case when applied_value ? 'isPrimary' then (applied_value ->> 'isPrimary')::boolean else is_primary end,
            status = 'owner_confirmed', owner_confirmed_by = confirmation_record.submitted_by,
            owner_confirmed_at = confirmation_record.submitted_at
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'onboarding_step' then
        update public.veroxa_onboarding_steps
        set owner_confirmation_id = confirmation_record.id
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'presence_profile' then
        update public.veroxa_presence_profiles
        set public_url = case when applied_value ? 'publicUrl'
              then veroxa_private.canonical_https_url_v1(applied_value ->> 'publicUrl')
              else veroxa_private.canonical_https_url_v1(public_url) end,
            owner_confirmation_id = confirmation_record.id
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'media_rights' then
        if exists (
          select 1 from public.veroxa_media_rights rights
          where rights.id = confirmation_record.subject_id
            and rights.restaurant_id = confirmation_record.restaurant_id
            and rights.rights_status = 'revoked'
        ) then
          raise exception using errcode = '23514', message = 'revoked_media_rights_are_terminal_register_new_asset';
        end if;
        update public.veroxa_media_rights
        set rights_status = 'confirmed',
            usage_scope = coalesce(applied_value -> 'usageScope', usage_scope),
            confirmed_by = confirmation_record.submitted_by,
            confirmed_at = confirmation_record.submitted_at,
            valid_from = coalesce(valid_from, confirmation_record.submitted_at)
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'content_item' then
        if confirmation_record.decision = 'correct' and (
          (confirmation_record.proposed_value ? 'manualPillar'
            and confirmation_record.proposed_value ->> 'manualPillar'
              is distinct from confirmation_record.subject_snapshot ->> 'manualPillar')
          or confirmation_record.proposed_value ? 'primaryMediaAssetId'
        ) then
          raise exception using errcode = '23514', message = 'content_pillar_or_media_correction_requires_new_draft';
        end if;
        if exists (
          select 1 from public.veroxa_content_items item
          where item.id = confirmation_record.subject_id
            and item.restaurant_id = confirmation_record.restaurant_id
            and item.manual_pillar is not null
        ) and not veroxa_private.content_inputs_current_v1(
          confirmation_record.subject_id, confirmation_record.restaurant_id, null
        ) then
          raise exception using errcode = '40001', message = 'content_confirmation_inputs_changed_resubmit_required';
        end if;
        update public.veroxa_content_items
        set title = case when applied_value ? 'title' then btrim(applied_value ->> 'title') else title end,
            concept = case when applied_value ? 'concept' then btrim(applied_value ->> 'concept') else concept end,
            master_caption = case when applied_value ? 'masterCaption' then nullif(btrim(applied_value ->> 'masterCaption'), '') else master_caption end,
            manual_pillar = case when applied_value ? 'manualPillar' then applied_value ->> 'manualPillar' else manual_pillar end,
            requires_owner_confirmation = false,
            owner_confirmation_id = confirmation_record.id
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
        if not exists (
          select 1 from public.veroxa_content_items item
          where item.id = confirmation_record.subject_id
            and item.restaurant_id = confirmation_record.restaurant_id
            and not item.requires_owner_confirmation
            and item.owner_confirmation_id = confirmation_record.id
            and (item.manual_pillar is null
              or veroxa_private.content_inputs_current_v1(item.id, item.restaurant_id, null))
            and veroxa_private.content_claims_supported_v1(
              item.id, item.restaurant_id, null)
        ) then
          raise exception using errcode = '23514', message = 'content_correction_confirmation_was_not_retained';
        end if;
      else
        raise exception using errcode = '23514', message = 'unsupported_confirmation_subject';
    end case;
    if confirmation_record.subject_type <> 'truth_field' and not found then
      raise exception using errcode = '23503', message = 'confirmation_subject_missing';
    end if;
  elsif p_decision = 'approved' and confirmation_record.decision = 'reject' then
    case confirmation_record.subject_type
      when 'truth_field' then
        select * into old_truth
        from public.veroxa_restaurant_truth_fields field
        where field.id = confirmation_record.subject_id
          and field.restaurant_id = confirmation_record.restaurant_id
          and field.is_current
        for update;
        if not found then
          raise exception using errcode = '23503', message = 'confirmation_subject_missing';
        end if;
        update public.veroxa_restaurant_truth_fields
        set is_current = false, status = 'superseded'
        where id = old_truth.id;
        insert into public.veroxa_restaurant_truth_fields (
          restaurant_id, field_key, section, value_json, status, source,
          is_current, supersedes_id, created_by
        ) values (
          old_truth.restaurant_id, old_truth.field_key, old_truth.section,
          old_truth.value_json, 'rejected', 'owner', true, old_truth.id, reviewer_id
        );
      when 'contact' then
        perform set_config('veroxa.approved_contact_confirmation_id', confirmation_record.id::text, true);
        update public.veroxa_restaurant_contacts
        set status = 'rejected'
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'onboarding_step' then
        update public.veroxa_onboarding_steps
        set status = 'blocked', owner_confirmation_id = confirmation_record.id,
            blocker_reason = 'Owner rejected this onboarding evidence.',
            completed_by = null, completed_at = null,
            completion_evidence = completion_evidence || jsonb_build_array(
              jsonb_build_object('ownerRejectionConfirmationId', confirmation_record.id,
                'reviewedAt', now()))
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'presence_profile' then
        select case profile.provider
            when 'facebook' then 'meta'
            when 'instagram' then 'meta'
            when 'google_business' then 'google_business'
            else null
          end into withdrawn_provider
        from public.veroxa_presence_profiles profile
        where profile.id = confirmation_record.subject_id
          and profile.restaurant_id = confirmation_record.restaurant_id;
        update public.veroxa_presence_profiles
        set access_status = 'revoked', truth_status = 'rejected',
            owner_confirmation_id = confirmation_record.id,
            last_checked_at = now(),
            notes = concat_ws(E'\n', nullif(notes, ''),
              'Owner withdrew presence authorization through reviewed confirmation.')
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
        if withdrawn_provider is not null then
          update public.veroxa_provider_connections connection
          set status = 'revoked',
              last_error = 'owner_presence_authorization_withdrawn'
          where connection.restaurant_id = confirmation_record.restaurant_id
            and connection.provider = withdrawn_provider
            and connection.status <> 'revoked';
          get diagnostics revoked_connection_count = row_count;

          update public.veroxa_publish_queue queue
          set status = 'cancelled', next_attempt_at = null,
              last_error = 'owner_presence_authorization_withdrawn'
          from public.veroxa_provider_connections connection
          where queue.connection_id = connection.id
            and queue.restaurant_id = confirmation_record.restaurant_id
            and connection.restaurant_id = confirmation_record.restaurant_id
            and connection.provider = withdrawn_provider
            and queue.status not in ('published','cancelled');
          get diagnostics cancelled_queue_count = row_count;
        end if;
        perform set_config('veroxa.trusted_activity_write', 'on', true);
        insert into public.veroxa_activity_events (
          restaurant_id, event_type, subject_type, subject_id, actor_id,
          visibility, report_eligible, payload
        ) values (
          confirmation_record.restaurant_id, 'presence_authorization_withdrawn',
          'presence_profile', confirmation_record.subject_id, reviewer_id,
          'both', false, jsonb_build_object(
            'confirmationId', confirmation_record.id,
            'provider', withdrawn_provider,
            'revokedConnectionCount', revoked_connection_count,
            'cancelledQueueCount', cancelled_queue_count
          )
        );
      when 'content_item' then
        perform set_config('veroxa.approved_content_rejection_confirmation_id',
          confirmation_record.id::text, true);
        update public.veroxa_content_items
        set status = 'changes_requested', requires_owner_confirmation = true,
            owner_confirmation_id = confirmation_record.id,
            approved_by = null, approved_at = null
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
        update public.veroxa_publish_queue queue
        set status = 'cancelled', next_attempt_at = null,
            last_error = 'owner_content_direction_rejected'
        from public.veroxa_content_variants variant
        where queue.variant_id = variant.id
          and variant.content_item_id = confirmation_record.subject_id
          and queue.restaurant_id = confirmation_record.restaurant_id
          and variant.restaurant_id = confirmation_record.restaurant_id
          and queue.status not in ('published','cancelled');
        get diagnostics cancelled_queue_count = row_count;

        update public.veroxa_content_calendar calendar
        set status = 'cancelled'
        from public.veroxa_content_variants variant
        where calendar.variant_id = variant.id
          and variant.content_item_id = confirmation_record.subject_id
          and calendar.restaurant_id = confirmation_record.restaurant_id
          and variant.restaurant_id = confirmation_record.restaurant_id
          and calendar.status not in ('published','cancelled');
        get diagnostics cancelled_calendar_count = row_count;

        perform set_config('veroxa.trusted_activity_write', 'on', true);
        insert into public.veroxa_activity_events (
          restaurant_id, event_type, subject_type, subject_id, actor_id,
          visibility, report_eligible, payload
        ) values (
          confirmation_record.restaurant_id, 'content_direction_rejected',
          'content_item', confirmation_record.subject_id, reviewer_id,
          'both', false, jsonb_build_object(
            'confirmationId', confirmation_record.id,
            'cancelledQueueCount', cancelled_queue_count,
            'cancelledCalendarCount', cancelled_calendar_count
          )
        );
      else
        raise exception using errcode = '23514', message = 'unsupported_owner_rejection_subject';
    end case;
    if confirmation_record.subject_type <> 'truth_field' and not found then
      raise exception using errcode = '23503', message = 'confirmation_subject_missing';
    end if;
  end if;

  return query select confirmation_record.id, p_decision,
    confirmation_record.subject_type, confirmation_record.subject_id, now();
end;
$$;
revoke all on function public.veroxa_apply_confirmation_v1(uuid, public.veroxa_review_status_v1, jsonb, text)
  from public, anon;
grant execute on function public.veroxa_apply_confirmation_v1(uuid, public.veroxa_review_status_v1, jsonb, text)
  to authenticated;

-- -------------------------------------------------------------------------
-- Atomic truth saves and evidence-bound onboarding/presence updates
-- -------------------------------------------------------------------------

create or replace function public.veroxa_create_truth_revisions_v1(
  p_restaurant_id uuid,
  p_revisions jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  revision jsonb;
  current_record public.veroxa_restaurant_truth_fields%rowtype;
  new_id uuid;
  result_ids uuid[] := '{}'::uuid[];
  field_key text;
  section_key text;
  expected_section text;
  source_key text;
  value_json jsonb;
  supplied_existing_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_truth_revision_required';
  end if;
  if p_revisions is null or jsonb_typeof(p_revisions) <> 'array'
     or jsonb_array_length(p_revisions) = 0 then
    raise exception using errcode = '22023', message = 'nonempty_truth_revision_array_required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_revisions) item
    group by item ->> 'field_key'
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate_truth_field_key';
  end if;

  -- Lock all current subjects in deterministic order before changing any row.
  perform field.id
  from public.veroxa_restaurant_truth_fields field
  where field.restaurant_id = p_restaurant_id and field.is_current
    and field.field_key in (
      select item ->> 'field_key' from jsonb_array_elements(p_revisions) item
    )
  order by field.field_key
  for update;

  for revision in select value from jsonb_array_elements(p_revisions) loop
    field_key := revision ->> 'field_key';
    section_key := revision ->> 'section';
    source_key := coalesce(nullif(revision ->> 'source', ''), 'team');
    value_json := revision -> 'value_json';
    supplied_existing_id := nullif(revision ->> 'existing_id', '')::uuid;

    if field_key is null or section_key is null or value_json is null
       or value_json = 'null'::jsonb or source_key not in ('team','public_evidence','import') then
      raise exception using errcode = '22023', message = 'invalid_truth_revision_payload';
    end if;
    if not veroxa_private.truth_value_shape_valid_v1(field_key, value_json) then
      raise exception using errcode = '22023', message = 'truth_value_must_match_canonical_field_shape';
    end if;
    expected_section := case
      when field_key like 'identity.%' then 'identity'
      when field_key = 'address.primary' then 'address'
      when field_key = 'phone.primary' then 'phone'
      when field_key like 'hours.%' then 'hours'
      when field_key = 'menu.primary' then 'menu'
      when field_key like 'services.%' then 'services'
      when field_key like 'claims.%' then 'claims'
      when field_key like 'brand.%' then 'brand'
      when field_key like 'goals.%' then 'goals'
      else null
    end;
    if section_key is distinct from expected_section then
      raise exception using errcode = '22023', message = 'truth_field_section_mismatch';
    end if;

    select * into current_record
    from public.veroxa_restaurant_truth_fields field
    where field.restaurant_id = p_restaurant_id
      and field.field_key = (revision ->> 'field_key') and field.is_current;
    if found and current_record.status = 'owner_confirmed' then
      raise exception using errcode = '23514', message = 'owner_confirmed_truth_requires_client_correction';
    end if;
    if (found and supplied_existing_id is null)
       or (supplied_existing_id is not null
         and (not found or current_record.id is distinct from supplied_existing_id)) then
      raise exception using errcode = '40001', message = 'truth_revision_subject_changed';
    end if;
    if found then
      update public.veroxa_restaurant_truth_fields
      set is_current = false, status = 'superseded'
      where id = current_record.id;
    end if;
    insert into public.veroxa_restaurant_truth_fields (
      restaurant_id, field_key, section, value_json, status, source,
      is_current, supersedes_id, created_by
    ) values (
      p_restaurant_id, field_key, section_key, value_json, 'team_prefilled', source_key,
      true, current_record.id, (select auth.uid())
    ) returning id into new_id;
    result_ids := array_append(result_ids, new_id);
  end loop;
  return result_ids;
end;
$$;
revoke all on function public.veroxa_create_truth_revisions_v1(uuid, jsonb)
  from public, anon;
grant execute on function public.veroxa_create_truth_revisions_v1(uuid, jsonb)
  to authenticated;

-- The atomic batch RPC and approved-confirmation workflow are the only truth
-- writers.  The legacy single-row RPC could supersede owner-confirmed truth.
revoke insert, update, delete on table public.veroxa_restaurant_truth_fields
  from authenticated;
drop policy if exists veroxa_restaurant_truth_fields_team_insert
  on public.veroxa_restaurant_truth_fields;
drop policy if exists veroxa_restaurant_truth_fields_team_update
  on public.veroxa_restaurant_truth_fields;
revoke execute on function public.veroxa_create_truth_revision_v1(
  uuid, text, text, jsonb, text
) from authenticated;

create or replace function public.veroxa_update_momo_onboarding_step_v1(
  p_restaurant_id uuid,
  p_step_id uuid,
  p_status public.veroxa_readiness_status_v1,
  p_completion_evidence jsonb default '[]'::jsonb,
  p_blocker_reason text default null,
  p_confirmation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare step_record public.veroxa_onboarding_steps%rowtype;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_onboarding_update_required';
  end if;
  if jsonb_typeof(coalesce(p_completion_evidence, 'null'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'onboarding_evidence_array_required';
  end if;
  select * into step_record from public.veroxa_onboarding_steps
  where id = p_step_id and restaurant_id = p_restaurant_id for update;
  if not found then
    raise exception using errcode = '23503', message = 'onboarding_step_not_in_momo_scope';
  end if;
  if p_status = 'blocked' and nullif(btrim(p_blocker_reason), '') is null then
    raise exception using errcode = '23514', message = 'blocked_onboarding_requires_reason';
  end if;
  if p_status = 'verified' and (
    jsonb_array_length(p_completion_evidence) = 0
    or p_confirmation_id is null
    or step_record.owner_confirmation_id is distinct from p_confirmation_id
    or not exists (
      select 1 from public.veroxa_confirmations confirmation
      where confirmation.id = p_confirmation_id
        and confirmation.restaurant_id = p_restaurant_id
        and confirmation.subject_type = 'onboarding_step'
        and confirmation.subject_id = p_step_id
        and confirmation.confirmation_kind = 'onboarding'
        and confirmation.decision in ('confirm','correct')
        and confirmation.status = 'approved'
        and confirmation.subject_snapshot -> 'completionEvidence' = p_completion_evidence
        and confirmation.subject_snapshot ->> 'blockerReason'
          is not distinct from nullif(btrim(p_blocker_reason), '')
        and confirmation.id = (
          select latest.id
          from public.veroxa_confirmations latest
          where latest.restaurant_id = p_restaurant_id
            and latest.subject_type = 'onboarding_step'
            and latest.subject_id = p_step_id
            and latest.confirmation_kind = 'onboarding'
          order by latest.submitted_at desc, latest.created_at desc, latest.id desc
          limit 1
        )
    )
  ) then
    raise exception using errcode = '23514', message = 'verified_onboarding_requires_evidence_and_owner_confirmation';
  end if;

  update public.veroxa_onboarding_steps
  set status = p_status,
      completion_evidence = p_completion_evidence,
      blocker_reason = case when p_status = 'blocked' then nullif(btrim(p_blocker_reason), '') else null end,
      owner_confirmation_id = case when p_status = 'verified' then p_confirmation_id else null end,
      completed_by = case when p_status = 'verified' then (select auth.uid()) else null end,
      completed_at = case when p_status = 'verified' then now() else null end
  where id = p_step_id;
  return p_step_id;
end;
$$;
revoke all on function public.veroxa_update_momo_onboarding_step_v1(uuid, uuid, public.veroxa_readiness_status_v1, jsonb, text, uuid)
  from public, anon;
grant execute on function public.veroxa_update_momo_onboarding_step_v1(uuid, uuid, public.veroxa_readiness_status_v1, jsonb, text, uuid)
  to authenticated;

create or replace function veroxa_private.validate_onboarding_owner_evidence_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'verified' and not exists (
    select 1 from public.veroxa_confirmations confirmation
    where confirmation.id = new.owner_confirmation_id
      and confirmation.restaurant_id = new.restaurant_id
      and confirmation.subject_type = 'onboarding_step'
      and confirmation.subject_id = new.id
      and confirmation.confirmation_kind = 'onboarding'
      and confirmation.decision in ('confirm','correct')
      and confirmation.status = 'approved'
      and confirmation.subject_snapshot -> 'completionEvidence' = new.completion_evidence
      and confirmation.subject_snapshot ->> 'blockerReason'
        is not distinct from new.blocker_reason
      and confirmation.id = (
        select latest.id
        from public.veroxa_confirmations latest
        where latest.restaurant_id = new.restaurant_id
          and latest.subject_type = 'onboarding_step'
          and latest.subject_id = new.id
          and latest.confirmation_kind = 'onboarding'
        order by latest.submitted_at desc, latest.created_at desc, latest.id desc
        limit 1
      )
  ) then
    raise exception using errcode = '23514', message = 'verified_onboarding_requires_exact_owner_reviewed_evidence';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_onboarding_owner_evidence_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_onboarding_owner_evidence_guard
  on public.veroxa_onboarding_steps;
create trigger veroxa_onboarding_owner_evidence_guard
before insert or update on public.veroxa_onboarding_steps
for each row execute function veroxa_private.validate_onboarding_owner_evidence_v1();

create or replace function public.veroxa_update_momo_presence_v1(
  p_restaurant_id uuid,
  p_presence_profile_id uuid,
  p_public_url text default null,
  p_access_status public.veroxa_connection_status_v1 default 'not_connected',
  p_truth_status public.veroxa_truth_status_v1 default 'unverified',
  p_notes text default null,
  p_confirmation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  presence_record public.veroxa_presence_profiles%rowtype;
  canonical_url text := veroxa_private.canonical_https_url_v1(p_public_url);
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_presence_update_required';
  end if;
  select * into presence_record from public.veroxa_presence_profiles
  where id = p_presence_profile_id and restaurant_id = p_restaurant_id for update;
  if not found then
    raise exception using errcode = '23503', message = 'presence_profile_not_in_momo_scope';
  end if;
  if nullif(btrim(coalesce(p_public_url, '')), '') is not null
     and canonical_url is null then
    raise exception using errcode = '22023', message = 'presence_update_requires_canonical_https_url';
  end if;
  if p_truth_status = 'owner_confirmed' or p_access_status in ('connected','degraded') then
    if p_confirmation_id is null
       or presence_record.owner_confirmation_id is distinct from p_confirmation_id
       or not exists (
      select 1 from public.veroxa_confirmations confirmation
      where confirmation.id = p_confirmation_id
        and confirmation.restaurant_id = p_restaurant_id
        and confirmation.subject_type = 'presence_profile'
        and confirmation.subject_id = p_presence_profile_id
        and confirmation.confirmation_kind = 'presence'
        and confirmation.decision in ('confirm','correct')
        and confirmation.status = 'approved'
        and canonical_url is not distinct from
          veroxa_private.canonical_https_url_v1(coalesce(
            confirmation.proposed_value ->> 'publicUrl',
            confirmation.subject_snapshot ->> 'publicUrl'
          ))
        and confirmation.id = (
          select latest.id from public.veroxa_confirmations latest
          where latest.restaurant_id = confirmation.restaurant_id
            and latest.subject_type = 'presence_profile'
            and latest.subject_id = confirmation.subject_id
            and latest.confirmation_kind = 'presence'
          order by latest.submitted_at desc, latest.created_at desc, latest.id desc
          limit 1
        )
    ) then
      raise exception using errcode = '23514', message = 'presence_truth_requires_exact_owner_confirmation';
    end if;
  end if;
  if p_access_status in ('connected','degraded') and not exists (
    select 1 from public.veroxa_confirmations confirmation
    where confirmation.id = p_confirmation_id
      and confirmation.restaurant_id = p_restaurant_id
      and confirmation.subject_type = 'presence_profile'
      and confirmation.subject_id = p_presence_profile_id
      and confirmation.confirmation_kind = 'presence'
      and confirmation.decision in ('confirm','correct')
      and confirmation.status = 'approved'
      and coalesce((confirmation.proposed_value ->> 'accessAuthorized')::boolean, false)
      and confirmation.id = (
        select latest.id from public.veroxa_confirmations latest
        where latest.restaurant_id = confirmation.restaurant_id
          and latest.subject_type = 'presence_profile'
          and latest.subject_id = confirmation.subject_id
          and latest.confirmation_kind = 'presence'
        order by latest.submitted_at desc, latest.created_at desc, latest.id desc
        limit 1
      )
  ) then
    raise exception using errcode = '23514', message = 'connected_presence_requires_owner_access_authorization';
  end if;
  if p_access_status in ('connected','degraded') and (
    p_truth_status <> 'owner_confirmed'
    or canonical_url is null
    or char_length(coalesce(btrim(p_notes), '')) < 10
  ) then
    raise exception using errcode = '23514', message = 'connected_presence_requires_https_owner_confirmed_evidence';
  end if;
  if presence_record.truth_status = 'owner_confirmed'
     and p_truth_status <> 'owner_confirmed' then
    raise exception using errcode = '23514', message = 'owner_confirmed_presence_truth_cannot_be_downgraded';
  end if;
  if presence_record.truth_status = 'owner_confirmed'
     and canonical_url is distinct from
       veroxa_private.canonical_https_url_v1(presence_record.public_url)
     and not exists (
       select 1 from public.veroxa_confirmations confirmation
       where confirmation.id = p_confirmation_id
         and confirmation.restaurant_id = p_restaurant_id
         and confirmation.subject_type = 'presence_profile'
         and confirmation.subject_id = p_presence_profile_id
         and confirmation.confirmation_kind = 'presence'
         and confirmation.decision = 'correct'
         and confirmation.status = 'approved'
         and canonical_url = veroxa_private.canonical_https_url_v1(
           confirmation.proposed_value ->> 'publicUrl')
         and confirmation.id = (
           select latest.id from public.veroxa_confirmations latest
           where latest.restaurant_id = confirmation.restaurant_id
             and latest.subject_type = 'presence_profile'
             and latest.subject_id = confirmation.subject_id
             and latest.confirmation_kind = 'presence'
           order by latest.submitted_at desc, latest.created_at desc, latest.id desc
           limit 1
         )
     ) then
    raise exception using errcode = '23514', message = 'owner_confirmed_presence_url_requires_fresh_client_correction';
  end if;
  update public.veroxa_presence_profiles
  set public_url = canonical_url, access_status = p_access_status,
      truth_status = p_truth_status, notes = nullif(btrim(p_notes), ''),
      owner_confirmation_id = case
        when p_truth_status = 'owner_confirmed'
          or p_access_status in ('connected','degraded')
          then p_confirmation_id else owner_confirmation_id end,
      last_checked_at = case when p_access_status in ('connected','degraded') then now() else last_checked_at end
  where id = p_presence_profile_id;
  return p_presence_profile_id;
end;
$$;
revoke all on function public.veroxa_update_momo_presence_v1(uuid, uuid, text, public.veroxa_connection_status_v1, public.veroxa_truth_status_v1, text, uuid)
  from public, anon;
grant execute on function public.veroxa_update_momo_presence_v1(uuid, uuid, text, public.veroxa_connection_status_v1, public.veroxa_truth_status_v1, text, uuid)
  to authenticated;

revoke insert, update, delete on table public.veroxa_onboarding_steps,
  public.veroxa_presence_profiles from authenticated;
revoke update, delete on table public.veroxa_media_rights from authenticated;
drop policy if exists veroxa_onboarding_steps_team_insert on public.veroxa_onboarding_steps;
drop policy if exists veroxa_onboarding_steps_team_update on public.veroxa_onboarding_steps;
drop policy if exists veroxa_presence_profiles_team_insert on public.veroxa_presence_profiles;
drop policy if exists veroxa_presence_profiles_team_update on public.veroxa_presence_profiles;
drop policy if exists veroxa_media_rights_team_update on public.veroxa_media_rights;

-- -------------------------------------------------------------------------
-- Owner-attested media, immutable provenance, manual drafts, and scheduling
-- -------------------------------------------------------------------------

create or replace function public.veroxa_register_momo_media_v2(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_intake_notes text default null,
  p_usage_scope jsonb default '["facebook","instagram","google_business","website"]'::jsonb,
  p_expires_on date default null
)
returns table (asset_id uuid, rights_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare expiry timestamptz;
begin
  if p_expires_on is not null then
    if p_expires_on < (now() at time zone 'America/Chicago')::date then
      raise exception using errcode = '22023', message = 'media_rights_expiry_must_not_be_past';
    end if;
    expiry := (p_expires_on + time '23:59:59.999999') at time zone 'America/Chicago';
  end if;
  return query
  select registered.asset_id, registered.rights_id
  from public.veroxa_register_momo_media_v1(
    p_restaurant_id, p_storage_path, p_mime_type, p_file_size,
    p_original_file_name, p_intake_notes, p_usage_scope, expiry
  ) registered;
end;
$$;
revoke all on function public.veroxa_register_momo_media_v2(uuid, text, text, bigint, text, text, jsonb, date)
  from public, anon;
grant execute on function public.veroxa_register_momo_media_v2(uuid, text, text, bigint, text, text, jsonb, date)
  to authenticated;

alter function public.veroxa_register_momo_media_v1(
  uuid, text, text, bigint, text, text, jsonb, timestamptz
) security definer;
revoke execute on function public.veroxa_register_momo_media_v1(
  uuid, text, text, bigint, text, text, jsonb, timestamptz
) from authenticated;
revoke insert, update, delete on table public.veroxa_media_assets,
  public.veroxa_media_rights from authenticated;
drop policy if exists veroxa_media_team_insert on public.veroxa_media_assets;
drop policy if exists veroxa_media_team_update on public.veroxa_media_assets;
drop policy if exists veroxa_media_rights_team_insert on public.veroxa_media_rights;
drop policy if exists veroxa_media_rights_team_update on public.veroxa_media_rights;
drop policy if exists veroxa_media_rights_client_insert on public.veroxa_media_rights;

create or replace function veroxa_private.validate_registered_media_asset_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.uploaded_by is distinct from (select auth.uid())
     or new.storage_path !~ (
       '^restaurants/' || new.restaurant_id::text
       || '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|webm)$'
     ) then
    raise exception using errcode = '23514', message = 'registered_media_actor_or_path_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_registered_media_asset_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_assets_registration_guard
  on public.veroxa_media_assets;
create trigger veroxa_media_assets_registration_guard
before insert on public.veroxa_media_assets
for each row execute function veroxa_private.validate_registered_media_asset_v1();

create or replace function veroxa_private.validate_registered_media_rights_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rights_status = 'confirmed' and (
    new.confirmed_by is distinct from (select auth.uid())
    or not public.veroxa_current_user_has_active_restaurant(new.restaurant_id)
  ) then
    raise exception using errcode = '42501', message = 'confirmed_media_rights_require_current_owner';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_registered_media_rights_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_rights_registration_guard
  on public.veroxa_media_rights;
create trigger veroxa_media_rights_registration_guard
before insert on public.veroxa_media_rights
for each row execute function veroxa_private.validate_registered_media_rights_v1();

create or replace function veroxa_private.validate_manual_media_tag_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'media_tag_requires_current_momo_team';
  end if;
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.restaurant_id is distinct from old.restaurant_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using errcode = '23514', message = 'media_tag_audit_identity_is_immutable';
  end if;
  new.source := 'team';
  if tg_op = 'INSERT' then
    new.created_at := now();
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_manual_media_tag_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_tags_manual_source_guard on public.veroxa_media_tags;
create trigger veroxa_media_tags_manual_source_guard
before insert or update on public.veroxa_media_tags
for each row execute function veroxa_private.validate_manual_media_tag_v1();

create or replace function veroxa_private.validate_manual_media_asset_tag_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
     or not exists (
       select 1
       from public.veroxa_media_assets asset
       join public.veroxa_media_tags tag
         on tag.id = new.tag_id and tag.restaurant_id = asset.restaurant_id
       where asset.id = new.asset_id
         and asset.restaurant_id = new.restaurant_id
  ) then
    raise exception using errcode = '23514', message = 'media_asset_tag_requires_same_tenant_team_sources';
  end if;
  if tg_op = 'UPDATE' and (
    new.restaurant_id is distinct from old.restaurant_id
    or new.asset_id is distinct from old.asset_id
    or new.tag_id is distinct from old.tag_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using errcode = '23514', message = 'media_asset_tag_audit_identity_is_immutable';
  end if;
  new.source := 'team';
  if tg_op = 'INSERT' then
    new.created_at := now();
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_manual_media_asset_tag_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_asset_tags_manual_source_guard
  on public.veroxa_media_asset_tags;
create trigger veroxa_media_asset_tags_manual_source_guard
before insert or update on public.veroxa_media_asset_tags
for each row execute function veroxa_private.validate_manual_media_asset_tag_v1();

create or replace function public.veroxa_add_momo_media_tag_v1(
  p_restaurant_id uuid,
  p_asset_id uuid,
  p_label text
)
returns table (tag_id uuid, asset_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_label text := btrim(coalesce(p_label, ''));
  normalized_slug text;
  selected_tag public.veroxa_media_tags%rowtype;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_media_tag_required';
  end if;
  normalized_slug := trim(both '-' from regexp_replace(
    lower(normalized_label), '[^a-z0-9]+', '-', 'g'));
  if char_length(normalized_label) not between 1 and 80 or normalized_slug = '' then
    raise exception using errcode = '22023', message = 'invalid_manual_media_tag';
  end if;
  perform asset.id from public.veroxa_media_assets asset
  where asset.id = p_asset_id and asset.restaurant_id = p_restaurant_id
  for share;
  if not found then
    raise exception using errcode = '23503', message = 'media_tag_asset_not_in_momo_scope';
  end if;
  select * into selected_tag
  from public.veroxa_media_tags tag
  where tag.restaurant_id = p_restaurant_id and tag.slug = normalized_slug
  for update;
  if found and selected_tag.source <> 'team' then
    raise exception using errcode = '23514', message = 'media_tag_provenance_owned_by_non_team_source';
  elsif found then
    update public.veroxa_media_tags
    set label = normalized_label
    where id = selected_tag.id;
  else
    insert into public.veroxa_media_tags (restaurant_id, slug, label, source)
    values (p_restaurant_id, normalized_slug, normalized_label, 'team')
    returning * into selected_tag;
  end if;
  insert into public.veroxa_media_asset_tags (
    restaurant_id, asset_id, tag_id, source, confidence
  ) values (
    p_restaurant_id, p_asset_id, selected_tag.id, 'team', 1
  ) on conflict on constraint veroxa_media_asset_tags_pkey do nothing;
  return query select selected_tag.id, p_asset_id;
end;
$$;
revoke all on function public.veroxa_add_momo_media_tag_v1(uuid, uuid, text)
  from public, anon;
grant execute on function public.veroxa_add_momo_media_tag_v1(uuid, uuid, text)
  to authenticated;
revoke insert, update, delete on table public.veroxa_media_tags,
  public.veroxa_media_asset_tags from authenticated;
drop policy if exists veroxa_media_tags_team_insert on public.veroxa_media_tags;
drop policy if exists veroxa_media_tags_team_update on public.veroxa_media_tags;
drop policy if exists veroxa_media_asset_tags_team_insert on public.veroxa_media_asset_tags;
drop policy if exists veroxa_media_asset_tags_team_update on public.veroxa_media_asset_tags;

-- Permit the rights-revocation RPC to append a terminal owner audit record
-- while retaining the ordinary client-only confirmation submission rule.
create or replace function veroxa_private.prepare_confirmation_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare internal_rights_revocation boolean :=
  current_setting('veroxa.internal_rights_revocation', true) = 'on';
begin
  if internal_rights_revocation then
    if new.subject_type <> 'media_rights'
       or new.submitted_by is distinct from (select auth.uid())
       or not (
         public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
         or public.veroxa_current_user_has_active_restaurant(new.restaurant_id)
       ) then
      raise exception using errcode = '42501', message = 'rights_revocation_requires_current_audit_actor';
    end if;
  elsif new.submitted_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_has_active_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'confirmation_requires_active_client_author';
  end if;
  new.subject_snapshot := veroxa_private.confirmation_subject_snapshot_v1(
    new.restaurant_id, new.subject_type, new.subject_id
  );
  if new.subject_snapshot is null then
    raise exception using errcode = '23503', message = 'confirmation_subject_not_in_momo_scope';
  end if;
  new.subject_snapshot_sha256 := veroxa_private.confirmation_snapshot_sha256_v1(new.subject_snapshot);
  new.status := 'pending';
  new.submitted_at := clock_timestamp();
  new.created_at := clock_timestamp();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_notes := null;
  return new;
end;
$$;
revoke all on function veroxa_private.prepare_confirmation_submission()
  from public, anon, authenticated;

create or replace function public.veroxa_revoke_momo_media_rights_v1(
  p_restaurant_id uuid,
  p_media_rights_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rights_record public.veroxa_media_rights%rowtype;
  audit_confirmation_id uuid;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null or not (
    public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
    or public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
  ) then
    raise exception using errcode = '42501', message = 'momo_media_rights_revoke_forbidden';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) not between 10 and 2000 then
    raise exception using errcode = '22023', message = 'media_rights_revocation_reason_required';
  end if;
  select * into rights_record from public.veroxa_media_rights
  where id = p_media_rights_id and restaurant_id = p_restaurant_id for update;
  if not found then
    raise exception using errcode = '23503', message = 'media_rights_not_in_momo_scope';
  end if;
  if rights_record.rights_status = 'revoked' then
    return rights_record.id;
  end if;
  if rights_record.rights_status <> 'confirmed' or rights_record.confirmed_by is null then
    raise exception using errcode = '23514', message = 'only_confirmed_media_rights_can_be_revoked';
  end if;

  update public.veroxa_confirmations
  set status = 'rejected', reviewed_by = caller_id, reviewed_at = now(),
      review_notes = 'Closed automatically because media rights were revoked.'
  where restaurant_id = p_restaurant_id and subject_type = 'media_rights'
    and subject_id = rights_record.id and status in ('pending','in_review');

  perform set_config('veroxa.internal_rights_revocation', 'on', true);
  insert into public.veroxa_confirmations (
    restaurant_id, subject_type, subject_id, confirmation_kind, decision,
    notes, submitted_by
  ) values (
    p_restaurant_id, 'media_rights', rights_record.id, 'usage_rights', 'reject',
    btrim(p_reason), caller_id
  ) returning id into audit_confirmation_id;
  update public.veroxa_confirmations
  set status = 'approved', reviewed_by = caller_id, reviewed_at = now(),
      review_notes = 'Rights revocation recorded transactionally.'
  where id = audit_confirmation_id;

  update public.veroxa_media_rights
  set rights_status = 'revoked', notes = concat_ws(E'\n', nullif(notes, ''),
      'Revoked: ' || btrim(p_reason))
  where id = rights_record.id;

  update public.veroxa_publish_queue queue
  set status = 'cancelled', next_attempt_at = null,
      last_error = 'media_rights_revoked_before_publication'
  from public.veroxa_content_variants variant
  join public.veroxa_content_items item on item.id = variant.content_item_id
  where queue.variant_id = variant.id
    and queue.restaurant_id = p_restaurant_id
    and variant.restaurant_id = p_restaurant_id
    and item.restaurant_id = p_restaurant_id
    and item.primary_media_asset_id = rights_record.asset_id
    and queue.status not in ('published','cancelled');

  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    p_restaurant_id, 'media_rights_revoked', 'media_rights', rights_record.id,
    caller_id, 'both', false,
    jsonb_build_object('rightsId', rights_record.id, 'reason', btrim(p_reason),
      'confirmationId', audit_confirmation_id)
  );
  return rights_record.id;
end;
$$;
revoke all on function public.veroxa_revoke_momo_media_rights_v1(uuid, uuid, text)
  from public, anon;
grant execute on function public.veroxa_revoke_momo_media_rights_v1(uuid, uuid, text)
  to authenticated;

create or replace function public.veroxa_create_manual_content_draft_v1(
  p_restaurant_id uuid,
  p_strategy_id uuid,
  p_primary_media_asset_id uuid,
  p_title text,
  p_concept text,
  p_master_caption text,
  p_requires_owner_confirmation boolean,
  p_truth_field_ids uuid[],
  p_pillar text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_content_id uuid := gen_random_uuid();
  truth_id uuid;
  truth_hash text;
  input_hash text;
  rights_record public.veroxa_media_rights%rowtype;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null or not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_content_draft_required';
  end if;
  if p_pillar not in (
    'Momo Cravings','First-Time Education','Behind the Scenes',
    'Customer Reactions','Snack Discovery','Local Discovery'
  ) then
    raise exception using errcode = '22023', message = 'invalid_manual_content_pillar';
  end if;
  if char_length(coalesce(btrim(p_title), '')) = 0
     or char_length(coalesce(btrim(p_concept), '')) = 0
     or p_truth_field_ids is null or cardinality(p_truth_field_ids) = 0 then
    raise exception using errcode = '22023', message = 'manual_content_requires_title_concept_and_truth';
  end if;
  if (select count(*) from unnest(p_truth_field_ids) id) <>
     (select count(distinct id) from unnest(p_truth_field_ids) id) then
    raise exception using errcode = '22023', message = 'duplicate_content_truth_input';
  end if;
  if p_strategy_id is not null and not exists (
    select 1 from public.veroxa_content_strategies strategy
    where strategy.id = p_strategy_id and strategy.restaurant_id = p_restaurant_id
      and strategy.status = 'approved'
  ) then
    raise exception using errcode = '23514', message = 'manual_content_requires_approved_strategy';
  end if;
  perform field.id
  from public.veroxa_restaurant_truth_fields field
  where field.restaurant_id = p_restaurant_id and field.id = any(p_truth_field_ids)
  order by field.id for share;
  if (select count(*) from public.veroxa_restaurant_truth_fields field
      where field.restaurant_id = p_restaurant_id and field.id = any(p_truth_field_ids)
        and field.is_current and field.status = 'owner_confirmed') <> cardinality(p_truth_field_ids) then
    raise exception using errcode = '23514', message = 'content_requires_current_owner_confirmed_truth';
  end if;
  if not veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, p_title, p_truth_field_ids)
     or not veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, p_concept, p_truth_field_ids)
     or not veroxa_private.text_claims_supported_by_truth_ids_v1(
      p_restaurant_id, p_master_caption, p_truth_field_ids) then
    raise exception using errcode = '23514', message = 'content_claim_requires_matching_owner_confirmed_truth';
  end if;
  if p_primary_media_asset_id is not null then
    select rights.* into rights_record
    from public.veroxa_media_rights rights
    join public.veroxa_media_assets asset
      on asset.id = rights.asset_id and asset.restaurant_id = rights.restaurant_id
    join public.veroxa_media_reviews review
      on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
     and review.is_current and review.status = 'approved' and review.public_use_approved
    where rights.restaurant_id = p_restaurant_id
      and rights.asset_id = p_primary_media_asset_id
      and rights.rights_status = 'confirmed'
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and rights.usage_scope ?| array['facebook','instagram','google_business','website']
    for share of rights, review;
    if not found then
      raise exception using errcode = '23514', message = 'content_requires_current_permissioned_reviewed_media';
    end if;
  end if;

  insert into public.veroxa_content_items (
    id, restaurant_id, strategy_id, primary_media_asset_id, title, concept,
    master_caption, manual_pillar, status, requires_owner_confirmation, created_by
  ) values (
    new_content_id, p_restaurant_id, p_strategy_id, p_primary_media_asset_id,
    btrim(p_title), btrim(p_concept), nullif(btrim(p_master_caption), ''), p_pillar,
    'pending', p_requires_owner_confirmation, caller_id
  );

  perform set_config('veroxa.trusted_content_ledger_write', 'on', true);
  foreach truth_id in array p_truth_field_ids loop
    select encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
      into truth_hash
    from public.veroxa_restaurant_truth_fields field
    where field.id = truth_id and field.restaurant_id = p_restaurant_id
      and field.is_current and field.status = 'owner_confirmed';
    input_hash := encode(extensions.digest(convert_to(concat_ws('|',
      new_content_id::text, 'owner_confirmed_truth', truth_id::text,
      truth_hash, p_pillar), 'UTF8'), 'sha256'), 'hex');
    insert into public.veroxa_content_input_ledger (
      restaurant_id, content_item_id, input_kind, truth_field_id,
      truth_value_sha256, input_sha256, recorded_by
    ) values (
      p_restaurant_id, new_content_id, 'owner_confirmed_truth', truth_id,
      truth_hash, input_hash, caller_id
    );
  end loop;
  if p_primary_media_asset_id is not null then
    input_hash := encode(extensions.digest(convert_to(concat_ws('|',
      new_content_id::text, 'permissioned_media', p_primary_media_asset_id::text,
      rights_record.attestation_version, rights_record.attestation_sha256, p_pillar),
      'UTF8'), 'sha256'), 'hex');
    insert into public.veroxa_content_input_ledger (
      restaurant_id, content_item_id, input_kind, media_asset_id,
      rights_attestation_version, rights_attestation_sha256, input_sha256, recorded_by
    ) values (
      p_restaurant_id, new_content_id, 'permissioned_media', p_primary_media_asset_id,
      rights_record.attestation_version, rights_record.attestation_sha256, input_hash, caller_id
    );

    perform set_config('veroxa.trusted_media_usage_write', 'on', true);
    insert into public.veroxa_media_usage (
      restaurant_id, asset_id, content_item_id, platform, usage_kind, recorded_by
    ) values (
      p_restaurant_id, p_primary_media_asset_id, new_content_id, null, 'draft', caller_id
    );

  end if;
  return new_content_id;
end;
$$;
revoke all on function public.veroxa_create_manual_content_draft_v1(uuid, uuid, uuid, text, text, text, boolean, uuid[], text)
  from public, anon;
grant execute on function public.veroxa_create_manual_content_draft_v1(uuid, uuid, uuid, text, text, text, boolean, uuid[], text)
  to authenticated;

create or replace function public.veroxa_schedule_momo_variant_v1(
  p_restaurant_id uuid,
  p_variant_id uuid,
  p_local_scheduled_at timestamp without time zone,
  p_timezone text default 'America/Chicago'
)
returns table (calendar_entry_id uuid, scheduled_for timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_time timestamptz;
  item_id uuid;
  asset_id uuid;
  variant_platform text;
  entry_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_schedule_required';
  end if;
  if p_timezone <> 'America/Chicago' or p_local_scheduled_at is null then
    raise exception using errcode = '22023', message = 'momo_schedule_timezone_must_be_america_chicago';
  end if;
  stored_time := p_local_scheduled_at at time zone p_timezone;
  if (stored_time at time zone p_timezone) is distinct from p_local_scheduled_at
     or ((p_local_scheduled_at + interval '1 hour') at time zone p_timezone) - stored_time
       is distinct from interval '1 hour'
     or stored_time - ((p_local_scheduled_at - interval '1 hour') at time zone p_timezone)
       is distinct from interval '1 hour'
     or stored_time <= now() then
    raise exception using errcode = '22023', message = 'invalid_or_past_local_schedule';
  end if;
  select variant.content_item_id, item.primary_media_asset_id, variant.platform
    into item_id, asset_id, variant_platform
  from public.veroxa_content_variants variant
  join public.veroxa_content_items item on item.id = variant.content_item_id
  where variant.id = p_variant_id and variant.restaurant_id = p_restaurant_id
    and item.restaurant_id = p_restaurant_id
    and variant.status = 'approved' and item.status = 'approved'
  for share of variant, item;
  if not found or not veroxa_private.variant_owner_confirmation_satisfied(p_variant_id, p_restaurant_id) then
    raise exception using errcode = '23514', message = 'schedule_requires_approved_confirmed_variant';
  end if;
  if asset_id is null then
    raise exception using errcode = '23514', message = 'public_schedule_requires_permissioned_media';
  end if;
  perform input.id from public.veroxa_content_input_ledger input
  where input.content_item_id = item_id and input.restaurant_id = p_restaurant_id
  order by input.id for share;
  perform field.id
  from public.veroxa_restaurant_truth_fields field
  join public.veroxa_content_input_ledger input on input.truth_field_id = field.id
  where input.content_item_id = item_id and input.restaurant_id = p_restaurant_id
  order by field.id for share of field;
  perform rights.id
  from public.veroxa_media_rights rights
  join public.veroxa_content_input_ledger input on input.media_asset_id = rights.asset_id
  join public.veroxa_media_reviews review
    on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
   and review.is_current
  where input.content_item_id = item_id and input.restaurant_id = p_restaurant_id
  order by rights.id for share of rights, review;
  if not veroxa_private.content_inputs_current_v1(item_id, p_restaurant_id, variant_platform) then
    raise exception using errcode = '23514', message = 'schedule_requires_current_content_inputs';
  end if;
  if not veroxa_private.content_media_valid_at_v1(
    item_id, p_restaurant_id, variant_platform, stored_time
  ) then
    raise exception using errcode = '23514', message = 'schedule_requires_media_rights_valid_at_scheduled_time';
  end if;
  if not veroxa_private.content_claims_supported_v1(
    item_id,
    p_restaurant_id,
    (select variant.caption from public.veroxa_content_variants variant
      where variant.id = p_variant_id and variant.restaurant_id = p_restaurant_id)
  ) then
    raise exception using errcode = '23514', message = 'schedule_claim_requires_matching_owner_confirmed_truth';
  end if;
  if exists (
    select 1 from public.veroxa_content_calendar existing
    where existing.variant_id = p_variant_id and existing.restaurant_id = p_restaurant_id
      and existing.status in ('queued','publishing','published')
    for update
  ) then
    raise exception using errcode = '23514', message = 'active_or_published_variant_cannot_be_rescheduled';
  end if;
  if exists (
    select 1 from public.veroxa_publish_queue queue
    where queue.variant_id = p_variant_id and queue.restaurant_id = p_restaurant_id
      and queue.status not in ('cancelled','failed')
    for update
  ) then
    raise exception using errcode = '23514', message = 'prepared_or_active_publication_cannot_be_rescheduled';
  end if;
  if exists (
    select 1 from public.veroxa_approvals approval
    where approval.restaurant_id = p_restaurant_id
      and approval.subject_type in ('content_variant','publish')
      and approval.subject_id = p_variant_id
      and approval.approval_kind = 'publishing'
      and approval.status in ('pending','in_review','approved')
    for update
  ) then
    raise exception using errcode = '23514', message = 'publishing_approval_exists_schedule_is_frozen';
  end if;
  insert into public.veroxa_content_calendar (
    restaurant_id, variant_id, status, scheduled_for, timezone, created_by
  ) values (
    p_restaurant_id, p_variant_id, 'approved', stored_time, p_timezone, (select auth.uid())
  ) on conflict (variant_id) do update
    set status = 'approved', scheduled_for = excluded.scheduled_for,
        timezone = excluded.timezone
  returning id into entry_id;
  perform set_config('veroxa.trusted_media_usage_write', 'on', true);
  insert into public.veroxa_media_usage (
    restaurant_id, asset_id, content_item_id, platform, usage_kind, used_at, recorded_by
  ) values (
    p_restaurant_id, asset_id, item_id, variant_platform, 'scheduled', stored_time, (select auth.uid())
  );
  return query select entry_id, stored_time;
end;
$$;
revoke all on function public.veroxa_schedule_momo_variant_v1(uuid, uuid, timestamp without time zone, text)
  from public, anon;
grant execute on function public.veroxa_schedule_momo_variant_v1(uuid, uuid, timestamp without time zone, text)
  to authenticated;

revoke insert, update, delete on table public.veroxa_content_calendar from authenticated;
drop policy if exists veroxa_content_calendar_team_insert on public.veroxa_content_calendar;
drop policy if exists veroxa_content_calendar_team_update on public.veroxa_content_calendar;

create or replace function public.veroxa_record_momo_media_reuse_v1(
  p_restaurant_id uuid,
  p_asset_id uuid,
  p_content_item_id uuid,
  p_platform text,
  p_usage_kind text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare usage_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_media_reuse_required';
  end if;
  if p_platform not in ('facebook','instagram','google_business','website','internal')
     or p_usage_kind not in ('draft','report','internal_reference') then
    raise exception using errcode = '22023', message = 'invalid_media_reuse_kind';
  end if;
  if p_content_item_id is not null and not exists (
    select 1 from public.veroxa_content_items item
    where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id
      and item.primary_media_asset_id = p_asset_id
  ) then
    raise exception using errcode = '23503', message = 'media_reuse_content_scope_mismatch';
  end if;
  perform rights.id
  from public.veroxa_media_rights rights
  join public.veroxa_media_reviews review
    on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
  where rights.asset_id = p_asset_id and rights.restaurant_id = p_restaurant_id
    and rights.rights_status = 'confirmed'
    and (rights.valid_from is null or rights.valid_from <= now())
    and (rights.expires_at is null or rights.expires_at > now())
    and rights.usage_scope ? p_platform
    and review.is_current and review.status = 'approved' and review.public_use_approved
  for share of rights, review;
  if not found then
    raise exception using errcode = '23514', message = 'media_reuse_requires_current_rights_and_review';
  end if;
  perform set_config('veroxa.trusted_media_usage_write', 'on', true);
  insert into public.veroxa_media_usage (
    restaurant_id, asset_id, content_item_id, platform, usage_kind, recorded_by
  ) values (
    p_restaurant_id, p_asset_id, p_content_item_id, p_platform, p_usage_kind,
    (select auth.uid())
  ) returning id into usage_id;
  return usage_id;
end;
$$;
revoke all on function public.veroxa_record_momo_media_reuse_v1(uuid, uuid, uuid, text, text)
  from public, anon;
grant execute on function public.veroxa_record_momo_media_reuse_v1(uuid, uuid, uuid, text, text)
  to authenticated;

alter function public.veroxa_review_momo_media_v1(
  uuid, public.veroxa_review_status_v1, smallint, text, boolean
) security definer;
revoke insert, update, delete on table public.veroxa_media_reviews from authenticated;
revoke update, delete on table public.veroxa_media_assets from authenticated;
drop policy if exists veroxa_media_reviews_team_insert on public.veroxa_media_reviews;
drop policy if exists veroxa_media_reviews_team_update on public.veroxa_media_reviews;
drop policy if exists veroxa_media_team_update on public.veroxa_media_assets;

revoke insert, update, delete on table public.veroxa_media_usage from authenticated;
drop policy if exists veroxa_media_usage_team_insert on public.veroxa_media_usage;
drop policy if exists veroxa_media_usage_team_update on public.veroxa_media_usage;

create or replace function veroxa_private.protect_media_usage_audit_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514', message = 'media_usage_history_is_immutable';
  end if;
  if current_setting('veroxa.trusted_media_usage_write', true) is distinct from 'on' then
    raise exception using errcode = '42501', message = 'media_usage_requires_transactional_workflow';
  end if;
  if new.recorded_by is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'media_usage_actor_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_media_usage_audit_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_media_usage_audit_guard on public.veroxa_media_usage;
create trigger veroxa_media_usage_audit_guard
before insert or update or delete on public.veroxa_media_usage
for each row execute function veroxa_private.protect_media_usage_audit_v1();

-- -------------------------------------------------------------------------
-- Approval/report request-to-decision freshness
-- -------------------------------------------------------------------------

create or replace function veroxa_private.protect_approved_material()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'veroxa_content_items' then
    if old.status = 'approved'
       and new.status = 'changes_requested'
       and new.requires_owner_confirmation
       and new.approved_by is null and new.approved_at is null
       and new.strategy_id is not distinct from old.strategy_id
       and new.primary_media_asset_id is not distinct from old.primary_media_asset_id
       and new.title is not distinct from old.title
       and new.concept is not distinct from old.concept
       and new.master_caption is not distinct from old.master_caption
       and new.manual_pillar is not distinct from old.manual_pillar
       and exists (
         select 1 from public.veroxa_confirmations confirmation
         where confirmation.id = nullif(current_setting(
             'veroxa.approved_content_rejection_confirmation_id', true), '')::uuid
           and confirmation.id = new.owner_confirmation_id
           and confirmation.restaurant_id = new.restaurant_id
           and confirmation.subject_type = 'content_item'
           and confirmation.subject_id = new.id
           and confirmation.confirmation_kind = 'content_direction'
           and confirmation.decision = 'reject'
           and confirmation.status = 'approved'
       ) then
      return new;
    end if;
  end if;
  if old.status <> 'approved' then
    return new;
  end if;
  if new.status <> 'approved'
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception using errcode = '23514', message = 'approved_record_is_immutable_create_new_revision';
  end if;
  if tg_table_name = 'veroxa_content_strategies' then
    if new.title is distinct from old.title or new.goals is distinct from old.goals
       or new.pillars is distinct from old.pillars
       or new.brand_voice_snapshot is distinct from old.brand_voice_snapshot then
      raise exception using errcode = '23514', message = 'approved_material_requires_new_revision';
    end if;
  elsif tg_table_name = 'veroxa_content_items' then
    if new.strategy_id is distinct from old.strategy_id
       or new.primary_media_asset_id is distinct from old.primary_media_asset_id
       or new.title is distinct from old.title or new.concept is distinct from old.concept
       or new.master_caption is distinct from old.master_caption
       or new.manual_pillar is distinct from old.manual_pillar
       or new.requires_owner_confirmation is distinct from old.requires_owner_confirmation
       or new.owner_confirmation_id is distinct from old.owner_confirmation_id then
      raise exception using errcode = '23514', message = 'approved_material_requires_new_revision';
    end if;
  elsif tg_table_name = 'veroxa_content_variants' then
    if new.content_item_id is distinct from old.content_item_id
       or new.platform is distinct from old.platform or new.caption is distinct from old.caption
       or new.metadata is distinct from old.metadata then
      raise exception using errcode = '23514', message = 'approved_material_requires_new_revision';
    end if;
  elsif tg_table_name = 'veroxa_reports' then
    if new.report_type is distinct from old.report_type
       or new.period_start is distinct from old.period_start
       or new.period_end is distinct from old.period_end
       or new.summary is distinct from old.summary
       or new.evidence_event_ids is distinct from old.evidence_event_ids then
      raise exception using errcode = '23514', message = 'approved_material_requires_new_revision';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_approved_material()
  from public, anon, authenticated;

create or replace function veroxa_private.report_summary_safe_v1(p_summary jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_summary) = 'object'
    and p_summary ? 'narrative'
    and not exists (
      select 1 from jsonb_object_keys(p_summary) key
      where key <> 'narrative'
    )
    and jsonb_typeof(p_summary -> 'narrative') = 'string'
    and (p_summary ->> 'narrative') in (
      'Manual operating update: Team completed reviewed internal workflow steps for this period. No external outcome is claimed.',
      'Rehearsal update: Team recorded internal testing activity for this period. No external outcome is claimed.',
      'Blocker update: Team documented unresolved operating blockers for this period. No external outcome is claimed.'
    );
$$;
revoke all on function veroxa_private.report_summary_safe_v1(jsonb)
  from public, anon, authenticated;

create or replace function veroxa_private.validate_report_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare matching_events integer;
begin
  if not veroxa_private.report_summary_safe_v1(new.summary) then
    raise exception using errcode = '23514', message = 'report_summary_must_be_safe_manual_rehearsal_narrative';
  end if;
  if cardinality(new.evidence_event_ids) = 0 then
    if new.status = 'approved' then
      raise exception using errcode = '23514', message = 'approved_report_requires_evidence';
    end if;
    return new;
  end if;
  select count(*) into matching_events
  from public.veroxa_activity_events event
  where event.id = any(new.evidence_event_ids)
    and event.restaurant_id = new.restaurant_id
    and event.report_eligible
    and event.visibility in ('client','both')
    and (event.occurred_at at time zone 'America/Chicago')::date
      between new.period_start and new.period_end;
  if matching_events <> cardinality(new.evidence_event_ids) then
    raise exception using errcode = '23514', message = 'report_requires_in_period_client_safe_evidence';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_report_evidence()
  from public, anon, authenticated;

create or replace function public.veroxa_create_momo_report_draft_v1(
  p_restaurant_id uuid,
  p_report_type text,
  p_period_start date,
  p_period_end date,
  p_summary jsonb,
  p_evidence_event_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare report_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_report_required';
  end if;
  if p_report_type not in ('weekly','monthly')
     or p_period_start is null or p_period_end is null or p_period_end < p_period_start
     or p_summary is null or jsonb_typeof(p_summary) <> 'object'
     or p_evidence_event_ids is null or cardinality(p_evidence_event_ids) = 0 then
    raise exception using errcode = '22023', message = 'invalid_report_draft_payload';
  end if;
  insert into public.veroxa_reports (
    restaurant_id, report_type, period_start, period_end, status,
    summary, evidence_event_ids, created_by
  ) values (
    p_restaurant_id, p_report_type, p_period_start, p_period_end, 'pending',
    p_summary, p_evidence_event_ids, (select auth.uid())
  ) returning id into report_id;
  return report_id;
end;
$$;
revoke all on function public.veroxa_create_momo_report_draft_v1(uuid, text, date, date, jsonb, uuid[])
  from public, anon;
grant execute on function public.veroxa_create_momo_report_draft_v1(uuid, text, date, date, jsonb, uuid[])
  to authenticated;
revoke insert on table public.veroxa_reports from authenticated;
drop policy if exists veroxa_reports_team_insert on public.veroxa_reports;

create or replace function public.veroxa_revise_momo_report_draft_v1(
  p_report_id uuid,
  p_summary jsonb,
  p_evidence_event_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_record public.veroxa_reports%rowtype;
  caller_id uuid := (select auth.uid());
begin
  select * into report_record from public.veroxa_reports report
  where report.id = p_report_id for update;
  if not found or caller_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(report_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_report_revision_required';
  end if;
  if report_record.status not in ('changes_requested','rejected')
     or not veroxa_private.report_summary_safe_v1(p_summary)
     or p_evidence_event_ids is null or cardinality(p_evidence_event_ids) = 0 then
    raise exception using errcode = '23514', message = 'report_revision_requires_rejected_or_changes_requested_safe_draft';
  end if;
  if exists (
    select 1 from public.veroxa_approvals approval
    where approval.restaurant_id = report_record.restaurant_id
      and approval.subject_type = 'report'
      and approval.subject_id = report_record.id
      and approval.status in ('pending','in_review','approved')
  ) then
    raise exception using errcode = '23514', message = 'report_revision_blocked_by_active_or_approved_release_review';
  end if;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    report_record.restaurant_id, 'report_revised', 'report', report_record.id,
    caller_id, 'team', false, jsonb_build_object(
      'previousSummarySha256', encode(extensions.digest(
        convert_to(report_record.summary::text, 'UTF8'), 'sha256'), 'hex'),
      'previousEvidenceCount', cardinality(report_record.evidence_event_ids),
      'newEvidenceCount', cardinality(p_evidence_event_ids)
    )
  );
  update public.veroxa_reports
  set status = 'pending', summary = p_summary,
      evidence_event_ids = p_evidence_event_ids,
      approved_by = null, approved_at = null, published_at = null
  where id = report_record.id;
  return report_record.id;
end;
$$;
revoke all on function public.veroxa_revise_momo_report_draft_v1(uuid, jsonb, uuid[])
  from public, anon;
grant execute on function public.veroxa_revise_momo_report_draft_v1(uuid, jsonb, uuid[])
  to authenticated;

create or replace function veroxa_private.approval_subject_snapshot_v1(
  p_restaurant_id uuid,
  p_subject_type text,
  p_subject_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  case p_subject_type
    when 'content_strategy' then
      select jsonb_build_object(
        'id', row.id, 'title', row.title, 'goals', row.goals,
        'pillars', row.pillars, 'brandVoice', row.brand_voice_snapshot,
        'status', row.status, 'updatedAt', row.updated_at
      ) into result from public.veroxa_content_strategies row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'content_item' then
      select jsonb_build_object(
        'id', row.id, 'strategyId', row.strategy_id,
        'primaryMediaAssetId', row.primary_media_asset_id,
        'title', row.title, 'concept', row.concept,
        'masterCaption', row.master_caption, 'manualPillar', row.manual_pillar,
        'requiresOwnerConfirmation', row.requires_owner_confirmation,
        'ownerConfirmationId', row.owner_confirmation_id,
        'status', row.status,
        'inputs', veroxa_private.content_input_fingerprint_v1(row.id, row.restaurant_id),
        'inputsCurrent', case when row.manual_pillar is null then true
          else veroxa_private.content_inputs_current_v1(row.id, row.restaurant_id, null) end,
        'updatedAt', row.updated_at
      ) into result from public.veroxa_content_items row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'content_variant', 'publish' then
      select jsonb_build_object(
        'id', variant.id, 'contentItemId', variant.content_item_id,
        'platform', variant.platform, 'caption', variant.caption,
        'metadata', variant.metadata, 'status', variant.status,
        'item', veroxa_private.approval_subject_snapshot_v1(
          variant.restaurant_id, 'content_item', variant.content_item_id),
        'calendar', (
          select jsonb_build_object('id', calendar.id, 'status', calendar.status,
            'scheduledFor', calendar.scheduled_for, 'timezone', calendar.timezone)
          from public.veroxa_content_calendar calendar
          where calendar.variant_id = variant.id and calendar.restaurant_id = variant.restaurant_id
        ),
        'updatedAt', variant.updated_at
      ) into result from public.veroxa_content_variants variant
      where variant.id = p_subject_id and variant.restaurant_id = p_restaurant_id;
    when 'review_response' then
      select jsonb_build_object(
        'id', row.id, 'responseDraft', row.response_draft,
        'responseStatus', row.response_status, 'approvalId', row.approval_id,
        'updatedAt', row.updated_at
      ) into result from public.veroxa_review_records row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'report' then
      select jsonb_build_object(
        'id', row.id, 'reportType', row.report_type,
        'periodStart', row.period_start, 'periodEnd', row.period_end,
        'summary', row.summary, 'evidenceEventIds', row.evidence_event_ids,
        'evidence', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', event.id, 'visibility', event.visibility,
            'reportEligible', event.report_eligible, 'payload', event.payload,
            'occurredAt', event.occurred_at
          ) order by event.id)
          from public.veroxa_activity_events event
          where event.id = any(row.evidence_event_ids)
        ), '[]'::jsonb),
        'status', row.status, 'updatedAt', row.updated_at
      ) into result from public.veroxa_reports row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    when 'presence_action' then
      select jsonb_build_object(
        'id', row.id, 'checkType', row.check_type, 'status', row.status,
        'evidence', row.evidence, 'findings', row.findings,
        'recommendedActions', row.recommended_actions, 'updatedAt', row.updated_at
      ) into result from public.veroxa_local_presence_checks row
      where row.id = p_subject_id and row.restaurant_id = p_restaurant_id;
    else result := null;
  end case;
  return result;
end;
$$;
revoke all on function veroxa_private.approval_subject_snapshot_v1(uuid, text, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.approval_request_allowed_v1(
  p_restaurant_id uuid,
  p_subject_type text,
  p_subject_id uuid,
  p_approval_kind text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  case
    when p_subject_type = 'content_strategy' and p_approval_kind = 'team_review' then
      return exists (select 1 from public.veroxa_content_strategies row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status in ('pending','in_review'));
    when p_subject_type = 'content_item' and p_approval_kind = 'team_review' then
      return exists (select 1 from public.veroxa_content_items row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status in ('pending','in_review')
          and not row.requires_owner_confirmation);
    when p_subject_type = 'content_variant' and p_approval_kind = 'team_review' then
      return exists (select 1 from public.veroxa_content_variants row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status in ('pending','in_review'));
    when p_subject_type in ('content_variant','publish')
      and p_approval_kind = 'publishing' then
      return exists (select 1 from public.veroxa_content_variants row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status = 'approved');
    when p_subject_type = 'review_response'
      and p_approval_kind = 'reputation_sensitive' then
      return exists (select 1 from public.veroxa_review_records row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.response_status in ('pending','in_review')
          and nullif(btrim(row.response_draft), '') is not null);
    when p_subject_type = 'report' and p_approval_kind = 'report_release' then
      return exists (select 1 from public.veroxa_reports row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status in ('pending','in_review')
          and veroxa_private.report_summary_safe_v1(row.summary));
    when p_subject_type = 'presence_action' and p_approval_kind = 'team_review' then
      return exists (select 1 from public.veroxa_local_presence_checks row
        where row.id = p_subject_id and row.restaurant_id = p_restaurant_id
          and row.status = 'waiting_approval');
    else
      return false;
  end case;
end;
$$;
revoke all on function veroxa_private.approval_request_allowed_v1(uuid, text, uuid, text)
  from public, anon, authenticated;

create or replace function veroxa_private.prepare_approval_snapshot_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.requested_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'approval_request_requires_team_author';
  end if;
  if not veroxa_private.approval_request_allowed_v1(
    new.restaurant_id, new.subject_type, new.subject_id, new.approval_kind
  ) then
    raise exception using errcode = '23514', message = 'approval_subject_kind_or_lifecycle_not_allowed';
  end if;
  new.subject_snapshot := veroxa_private.approval_subject_snapshot_v1(
    new.restaurant_id, new.subject_type, new.subject_id
  );
  if new.subject_snapshot is null then
    raise exception using errcode = '23503', message = 'approval_subject_not_in_momo_scope';
  end if;
  new.subject_snapshot_sha256 := veroxa_private.confirmation_snapshot_sha256_v1(new.subject_snapshot);
  new.status := 'pending';
  new.requested_at := clock_timestamp();
  new.created_at := clock_timestamp();
  new.decided_by := null;
  new.decided_at := null;
  new.decision_notes := null;
  return new;
end;
$$;
revoke all on function veroxa_private.prepare_approval_snapshot_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_approvals_prepare_snapshot on public.veroxa_approvals;
create trigger veroxa_approvals_prepare_snapshot
before insert on public.veroxa_approvals
for each row execute function veroxa_private.prepare_approval_snapshot_v1();

create or replace function public.veroxa_apply_approval_v1(
  p_approval_id uuid,
  p_decision public.veroxa_review_status_v1,
  p_decision_notes text default null
)
returns table (
  approval_id uuid,
  status public.veroxa_review_status_v1,
  subject_type text,
  subject_id uuid,
  decided_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  approval_record public.veroxa_approvals%rowtype;
  reviewer_id uuid := (select auth.uid());
  subject_updated_at timestamptz;
  affected integer;
  dependency_item_id uuid;
begin
  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception using errcode = '22023', message = 'terminal_approval_decision_required';
  end if;
  select * into approval_record from public.veroxa_approvals
  where id = p_approval_id for update;
  if not found or not public.veroxa_current_user_is_team_for_restaurant(approval_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_approval_required';
  end if;
  if approval_record.status not in ('pending','in_review') then
    raise exception using errcode = '23514', message = 'approval_already_decided';
  end if;
  if approval_record.approval_kind = 'owner_confirmation' then
    raise exception using errcode = '23514', message = 'owner_confirmation_requires_client_confirmation_workflow';
  end if;
  if not veroxa_private.approval_request_allowed_v1(
    approval_record.restaurant_id, approval_record.subject_type,
    approval_record.subject_id, approval_record.approval_kind
  ) then
    raise exception using errcode = '23514', message = 'approval_subject_lifecycle_changed_request_new_review';
  end if;

  case approval_record.subject_type
    when 'content_strategy' then
      select row.updated_at into subject_updated_at from public.veroxa_content_strategies row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'content_item' then
      select row.updated_at into subject_updated_at from public.veroxa_content_items row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'content_variant' then
      select row.updated_at into subject_updated_at from public.veroxa_content_variants row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'publish' then
      select row.updated_at into subject_updated_at from public.veroxa_content_variants row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'review_response' then
      select row.updated_at into subject_updated_at from public.veroxa_review_records row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'report' then
      select row.updated_at into subject_updated_at from public.veroxa_reports row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    when 'presence_action' then
      select row.updated_at into subject_updated_at from public.veroxa_local_presence_checks row
      where row.id = approval_record.subject_id and row.restaurant_id = approval_record.restaurant_id for share;
    else
      raise exception using errcode = '23514', message = 'unsupported_approval_subject';
  end case;
  if subject_updated_at is null then
    raise exception using errcode = '23503', message = 'approval_subject_missing';
  end if;
  if approval_record.subject_type = 'content_item' then
    dependency_item_id := approval_record.subject_id;
  elsif approval_record.subject_type in ('content_variant','publish') then
    select variant.content_item_id into dependency_item_id
    from public.veroxa_content_variants variant
    where variant.id = approval_record.subject_id
      and variant.restaurant_id = approval_record.restaurant_id;
  end if;
  if dependency_item_id is not null then
    perform item.id from public.veroxa_content_items item
    where item.id = dependency_item_id
      and item.restaurant_id = approval_record.restaurant_id for share;
    perform input.id from public.veroxa_content_input_ledger input
    where input.content_item_id = dependency_item_id
      and input.restaurant_id = approval_record.restaurant_id
    order by input.id for share;
    perform field.id
    from public.veroxa_restaurant_truth_fields field
    join public.veroxa_content_input_ledger input on input.truth_field_id = field.id
    where input.content_item_id = dependency_item_id
      and input.restaurant_id = approval_record.restaurant_id
    order by field.id for share of field;
    perform rights.id
    from public.veroxa_media_rights rights
    join public.veroxa_content_input_ledger input on input.media_asset_id = rights.asset_id
    join public.veroxa_media_reviews review
      on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
     and review.is_current
    where input.content_item_id = dependency_item_id
      and input.restaurant_id = approval_record.restaurant_id
    order by rights.id for share of rights, review;
    perform calendar.id from public.veroxa_content_calendar calendar
    where calendar.variant_id = approval_record.subject_id
      and calendar.restaurant_id = approval_record.restaurant_id
    for share;
  end if;
  if p_decision = 'approved' and subject_updated_at > approval_record.requested_at then
    raise exception using errcode = '40001', message = 'approval_subject_changed_request_new_review';
  end if;
  if p_decision = 'approved' and (
    approval_record.subject_snapshot_sha256 is null
    or veroxa_private.confirmation_snapshot_sha256_v1(
      veroxa_private.approval_subject_snapshot_v1(
        approval_record.restaurant_id,
        approval_record.subject_type,
        approval_record.subject_id
      )
    ) is distinct from approval_record.subject_snapshot_sha256
  ) then
    raise exception using errcode = '40001', message = 'approval_subject_snapshot_changed_request_new_review';
  end if;
  if p_decision = 'approved' and approval_record.subject_type = 'content_item'
     and exists (
       select 1 from public.veroxa_content_items item
       where item.id = approval_record.subject_id
         and item.restaurant_id = approval_record.restaurant_id
         and item.requires_owner_confirmation
     ) then
    raise exception using errcode = '23514', message = 'content_approval_requires_resolved_owner_confirmation';
  end if;
  if p_decision = 'approved' and approval_record.subject_type = 'content_item'
     and exists (
       select 1 from public.veroxa_content_items item
       where item.id = approval_record.subject_id and item.manual_pillar is not null
     ) and not veroxa_private.content_inputs_current_v1(
       approval_record.subject_id, approval_record.restaurant_id, null
     ) then
    raise exception using errcode = '23514', message = 'content_approval_requires_current_inputs';
  end if;
  if p_decision = 'approved' and approval_record.subject_type = 'content_item'
     and not veroxa_private.content_claims_supported_v1(
       approval_record.subject_id, approval_record.restaurant_id, null
     ) then
    raise exception using errcode = '23514', message = 'content_approval_claim_requires_matching_owner_confirmed_truth';
  end if;
  if p_decision = 'approved' and approval_record.subject_type in ('content_variant','publish')
     and not exists (
       select 1
       from public.veroxa_content_variants variant
       join public.veroxa_content_items item on item.id = variant.content_item_id
       where variant.id = approval_record.subject_id
         and variant.restaurant_id = approval_record.restaurant_id
         and item.restaurant_id = approval_record.restaurant_id
         and item.status = 'approved'
         and not item.requires_owner_confirmation
         and item.primary_media_asset_id is not null
         and veroxa_private.content_inputs_current_v1(
           item.id, item.restaurant_id, variant.platform)
         and veroxa_private.content_claims_supported_v1(
           item.id, item.restaurant_id, variant.caption)
     ) then
    raise exception using errcode = '23514', message = 'variant_approval_requires_current_inputs';
  end if;
  if p_decision = 'approved'
     and approval_record.approval_kind = 'publishing'
     and approval_record.subject_type in ('content_variant','publish')
     and not exists (
       select 1
       from public.veroxa_content_calendar calendar
       join public.veroxa_content_variants variant
         on variant.id = calendar.variant_id
        and variant.restaurant_id = calendar.restaurant_id
       where calendar.restaurant_id = approval_record.restaurant_id
         and calendar.variant_id = approval_record.subject_id
         and calendar.status = 'approved'
         and calendar.timezone = 'America/Chicago'
         and calendar.scheduled_for is not null
         and calendar.scheduled_for > now()
         and veroxa_private.content_media_valid_at_v1(
           variant.content_item_id, calendar.restaurant_id,
           variant.platform, calendar.scheduled_for)
     ) then
    raise exception using errcode = '23514', message = 'publishing_approval_requires_current_future_chicago_schedule';
  end if;

  update public.veroxa_approvals
  set status = p_decision, decided_by = reviewer_id, decided_at = now(),
      decision_notes = nullif(btrim(p_decision_notes), '')
  where id = approval_record.id;

  affected := 1;
  case approval_record.subject_type
    when 'content_strategy' then
      update public.veroxa_content_strategies
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
      get diagnostics affected = row_count;
    when 'content_item' then
      update public.veroxa_content_items
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
      get diagnostics affected = row_count;
    when 'content_variant' then
      if approval_record.approval_kind = 'team_review' then
        update public.veroxa_content_variants
        set status = p_decision,
            approved_by = case when p_decision = 'approved' then reviewer_id else null end,
            approved_at = case when p_decision = 'approved' then now() else null end
        where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
        get diagnostics affected = row_count;
      end if;
    when 'review_response' then
      update public.veroxa_review_records set response_status = p_decision
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
      get diagnostics affected = row_count;
    when 'report' then
      update public.veroxa_reports
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
      get diagnostics affected = row_count;
    when 'publish' then null;
    when 'presence_action' then null;
    else raise exception using errcode = '23514', message = 'unsupported_approval_subject';
  end case;
  if affected = 0 then
    raise exception using errcode = '23503', message = 'approval_subject_missing';
  end if;
  return query select approval_record.id, p_decision, approval_record.subject_type,
    approval_record.subject_id, now();
end;
$$;
revoke all on function public.veroxa_apply_approval_v1(uuid, public.veroxa_review_status_v1, text)
  from public, anon;
grant execute on function public.veroxa_apply_approval_v1(uuid, public.veroxa_review_status_v1, text)
  to authenticated;

revoke update, delete on table public.veroxa_confirmations, public.veroxa_approvals
  from authenticated;
revoke update, delete on table public.veroxa_content_strategies,
  public.veroxa_content_items, public.veroxa_content_variants,
  public.veroxa_reports from authenticated;
revoke insert on table public.veroxa_content_items from authenticated;
drop policy if exists veroxa_confirmations_team_update on public.veroxa_confirmations;
drop policy if exists veroxa_approvals_team_update on public.veroxa_approvals;
drop policy if exists veroxa_content_strategies_team_update on public.veroxa_content_strategies;
drop policy if exists veroxa_content_items_team_update on public.veroxa_content_items;
drop policy if exists veroxa_content_items_team_insert on public.veroxa_content_items;
drop policy if exists veroxa_content_variants_team_update on public.veroxa_content_variants;
drop policy if exists veroxa_reports_team_update on public.veroxa_reports;

-- Immutable authorship closes the legacy broad-Team UPDATE surface without
-- preventing legitimate lifecycle changes through the reviewed RPCs.
create or replace function veroxa_private.protect_momo_authorship_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  protected_keys text[];
  protected_key text;
begin
  protected_keys := case tg_table_name
    when 'veroxa_restaurant_truth_fields' then array['created_by','created_at']
    when 'veroxa_restaurant_contacts' then array['created_by','created_at']
    when 'veroxa_onboarding_steps' then array['created_at']
    when 'veroxa_presence_profiles' then array['created_at']
    when 'veroxa_confirmations' then array[
      'restaurant_id','subject_type','subject_id','confirmation_kind','decision',
      'proposed_value','notes','submitted_by','submitted_at','subject_snapshot',
      'subject_snapshot_sha256','created_at'
    ]
    when 'veroxa_readiness_gate_runs' then array[
      'restaurant_id','status','required_count','verified_count','blocker_count',
      'evidence_snapshot','blocker_snapshot','evaluated_by','evaluated_at','created_at'
    ]
    when 'veroxa_media_assets' then array['restaurant_id','storage_path','uploaded_by','created_at']
    when 'veroxa_content_strategies' then array['created_by','created_at']
    when 'veroxa_content_items' then array['created_by','created_at']
    when 'veroxa_content_variants' then array['created_at']
    when 'veroxa_approvals' then array[
      'restaurant_id','subject_type','subject_id','approval_kind','requested_by',
      'requested_at','subject_snapshot','subject_snapshot_sha256','created_at'
    ]
    when 'veroxa_content_calendar' then array['created_by','created_at']
    when 'veroxa_publish_queue' then array['created_by','created_at','idempotency_key']
    when 'veroxa_work_items' then array['created_by','created_at']
    when 'veroxa_reports' then array['created_by','created_at']
    when 'veroxa_recovery_runs' then array['initiated_by','created_at']
    else array[]::text[]
  end;
  foreach protected_key in array protected_keys loop
    if (to_jsonb(new) -> protected_key) is distinct from (to_jsonb(old) -> protected_key) then
      raise exception using errcode = '23514', message =
        format('%s.%s_is_immutable', tg_table_name, protected_key);
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_momo_authorship_v1()
  from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_gate_runs',
    'veroxa_media_assets','veroxa_content_strategies','veroxa_content_items',
    'veroxa_content_variants','veroxa_approvals','veroxa_content_calendar',
    'veroxa_publish_queue','veroxa_work_items','veroxa_reports','veroxa_recovery_runs'
  ] loop
    execute format('drop trigger if exists %I on public.%I',
      table_name || '_authorship_guard', table_name);
    execute format('create trigger %I before update on public.%I for each row '
      || 'execute function veroxa_private.protect_momo_authorship_v1()',
      table_name || '_authorship_guard', table_name);
  end loop;
end $$;

create or replace function veroxa_private.require_current_insert_actor_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare actor_key text;
begin
  actor_key := case tg_table_name
    when 'veroxa_restaurant_truth_fields' then 'created_by'
    when 'veroxa_restaurant_contacts' then 'created_by'
    when 'veroxa_content_strategies' then 'created_by'
    when 'veroxa_content_items' then 'created_by'
    when 'veroxa_work_items' then 'created_by'
    when 'veroxa_reports' then 'created_by'
    else null
  end;
  if actor_key is null
     or (to_jsonb(new) ->> actor_key) is distinct from (select auth.uid())::text then
    raise exception using errcode = '42501', message = 'insert_actor_must_be_current_user';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.require_current_insert_actor_v1()
  from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts',
    'veroxa_content_strategies','veroxa_content_items','veroxa_work_items','veroxa_reports'
  ] loop
    execute format('drop trigger if exists %I on public.%I',
      table_name || '_insert_actor_guard', table_name);
    execute format('create trigger %I before insert on public.%I for each row '
      || 'execute function veroxa_private.require_current_insert_actor_v1()',
      table_name || '_insert_actor_guard', table_name);
  end loop;
end $$;

create or replace function veroxa_private.protect_activity_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514', message = 'activity_event_is_immutable';
  end if;
  if current_setting('veroxa.trusted_activity_write', true) is distinct from 'on'
     or new.actor_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'activity_event_requires_transactional_rpc';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_activity_event_v1()
  from public, anon, authenticated;
revoke insert, update, delete on table public.veroxa_activity_events from authenticated;
drop policy if exists veroxa_activity_events_team_insert on public.veroxa_activity_events;
drop policy if exists veroxa_activity_events_team_update on public.veroxa_activity_events;
drop trigger if exists veroxa_activity_events_trusted_guard on public.veroxa_activity_events;
create trigger veroxa_activity_events_trusted_guard
before insert or update or delete on public.veroxa_activity_events
for each row execute function veroxa_private.protect_activity_event_v1();

create or replace function veroxa_private.bind_readiness_actor_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_readiness_actor_required';
  end if;
  if tg_op = 'INSERT' and not new.required then
    raise exception using errcode = '23514', message = 'momo_readiness_dimensions_are_required';
  end if;
  if tg_op = 'UPDATE' and (
    new.restaurant_id is distinct from old.restaurant_id
    or new.dimension_key is distinct from old.dimension_key
    or new.label is distinct from old.label
    or new.required is distinct from old.required
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using errcode = '23514', message = 'readiness_dimension_identity_is_immutable';
  end if;
  if new.status = 'verified' then
    new.verified_by := (select auth.uid());
    new.verified_at := now();
  else
    new.verified_by := null;
    new.verified_at := null;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.bind_readiness_actor_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_readiness_dimensions_actor_guard
  on public.veroxa_readiness_dimensions;
create trigger veroxa_readiness_dimensions_actor_guard
before insert or update on public.veroxa_readiness_dimensions
for each row execute function veroxa_private.bind_readiness_actor_v1();

revoke insert, update, delete on table public.veroxa_readiness_dimensions from authenticated;
drop policy if exists veroxa_readiness_dimensions_team_insert on public.veroxa_readiness_dimensions;
drop policy if exists veroxa_readiness_dimensions_team_update on public.veroxa_readiness_dimensions;

create or replace function veroxa_private.bind_gate_actor_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.evaluated_by is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'gate_evaluator_must_be_current_actor';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.bind_gate_actor_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_readiness_gate_actor_guard
  on public.veroxa_readiness_gate_runs;
create trigger veroxa_readiness_gate_actor_guard
before insert on public.veroxa_readiness_gate_runs
for each row execute function veroxa_private.bind_gate_actor_v1();

create or replace function veroxa_private.validate_deferred_ai_job_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare subject_exists boolean;
begin
  new.created_at := now();
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
     or new.created_by is distinct from (select auth.uid())
     or new.status <> 'blocked'
     or new.provider_key is not null or new.model_key is not null
     or new.output_payload is not null or new.next_attempt_at is not null
     or new.started_at is not null or new.completed_at is not null
     or new.attempt_count <> 0 or new.max_attempts <> 3
     or new.prompt_version is distinct from 'v1-provider-neutral'
     or new.input_payload is distinct from jsonb_build_object('subject_id', new.subject_id)
     or new.safety_flags is distinct from
       '["live_provider_not_connected","human_review_required"]'::jsonb
     or new.last_error is distinct from 'Provider connection not authorized' then
    raise exception using errcode = '23514', message = 'ai_job_must_remain_exact_deferred_fixture';
  end if;
  subject_exists := case new.subject_type
    when 'media_asset' then exists (
      select 1 from public.veroxa_media_assets row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'content_strategy' then exists (
      select 1 from public.veroxa_content_strategies row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'content_item' then exists (
      select 1 from public.veroxa_content_items row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'report' then exists (
      select 1 from public.veroxa_reports row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'restaurant' then new.subject_id = new.restaurant_id and exists (
      select 1 from public.veroxa_restaurants row where row.id = new.restaurant_id)
    else false
  end;
  if not subject_exists then
    raise exception using errcode = '23503', message = 'ai_job_subject_not_in_momo_scope';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_deferred_ai_job_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_ai_jobs_deferred_only_guard on public.veroxa_ai_jobs;
create trigger veroxa_ai_jobs_deferred_only_guard
before insert on public.veroxa_ai_jobs
for each row execute function veroxa_private.validate_deferred_ai_job_v1();
revoke update, delete on table public.veroxa_ai_jobs from authenticated;
drop policy if exists veroxa_ai_jobs_team_update on public.veroxa_ai_jobs;

create or replace function veroxa_private.validate_initial_work_item_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
     or new.created_by is distinct from (select auth.uid())
     or new.status <> 'queued' or new.attempt_count <> 0
     or new.blocked_reason is not null or new.next_attempt_at is not null
     or new.completed_at is not null then
    raise exception using errcode = '23514', message = 'work_item_must_start_as_current_actor_queued_fixture';
  end if;
  if new.assigned_to is not null and not exists (
    select 1
    from public.veroxa_user_profiles profile
    join public.veroxa_restaurant_members member on member.user_id = profile.user_id
    where profile.user_id = new.assigned_to
      and profile.role = 'team' and profile.status = 'active'
      and member.restaurant_id = new.restaurant_id
      and member.role = 'team' and member.status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'work_assignment_requires_active_momo_team_member';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_initial_work_item_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_work_items_initial_state_guard on public.veroxa_work_items;
create trigger veroxa_work_items_initial_state_guard
before insert on public.veroxa_work_items
for each row execute function veroxa_private.validate_initial_work_item_v1();

create or replace function veroxa_private.validate_initial_content_record_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if new.status <> 'pending' or new.approved_by is not null or new.approved_at is not null then
    raise exception using errcode = '23514', message = 'content_record_must_start_pending_unapproved';
  end if;
  if tg_table_name = 'veroxa_content_strategies' then
    if new.created_by is distinct from (select auth.uid())
       or not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id) then
      raise exception using errcode = '42501', message = 'strategy_requires_current_team_author';
    end if;
  elsif tg_table_name = 'veroxa_content_variants' then
    if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
       or new.metadata is distinct from '{"prepared_manually":true}'::jsonb then
      raise exception using errcode = '42501', message = 'variant_requires_exact_current_team_manual_provenance';
    end if;
    if not exists (
      select 1 from public.veroxa_content_items item
      where item.id = new.content_item_id and item.restaurant_id = new.restaurant_id
        and item.status = 'approved'
    ) then
      raise exception using errcode = '23514', message = 'variant_requires_same_tenant_approved_parent';
    end if;
    if not veroxa_private.content_claims_supported_v1(
      new.content_item_id, new.restaurant_id, new.caption
    ) then
      raise exception using errcode = '23514', message = 'variant_claim_requires_matching_owner_confirmed_truth';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_initial_content_record_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_content_strategies_initial_guard
  on public.veroxa_content_strategies;
create trigger veroxa_content_strategies_initial_guard
before insert on public.veroxa_content_strategies
for each row execute function veroxa_private.validate_initial_content_record_v1();
drop trigger if exists veroxa_content_variants_initial_guard
  on public.veroxa_content_variants;
create trigger veroxa_content_variants_initial_guard
before insert on public.veroxa_content_variants
for each row execute function veroxa_private.validate_initial_content_record_v1();

create or replace function public.veroxa_create_manual_variant_v1(
  p_restaurant_id uuid,
  p_content_item_id uuid,
  p_platform text,
  p_caption text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_variant_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_manual_variant_required';
  end if;
  if p_platform not in ('facebook','instagram','google_business')
     or char_length(coalesce(btrim(p_caption), '')) = 0 then
    raise exception using errcode = '22023', message = 'invalid_manual_variant_payload';
  end if;
  insert into public.veroxa_content_variants (
    restaurant_id, content_item_id, platform, caption, metadata, status
  ) values (
    p_restaurant_id, p_content_item_id, p_platform, btrim(p_caption),
    '{"prepared_manually":true}'::jsonb, 'pending'
  ) returning id into new_variant_id;
  return new_variant_id;
end;
$$;
revoke all on function public.veroxa_create_manual_variant_v1(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.veroxa_create_manual_variant_v1(uuid, uuid, text, text)
  to authenticated;
revoke insert on table public.veroxa_content_variants from authenticated;
drop policy if exists veroxa_content_variants_team_insert
  on public.veroxa_content_variants;

-- -------------------------------------------------------------------------
-- Executable failure -> retry -> recovery -> activity -> report rehearsal
-- -------------------------------------------------------------------------

create or replace function public.veroxa_transition_work_item_v1(
  p_work_item_id uuid,
  p_target_status public.veroxa_job_status_v1,
  p_reason text default null,
  p_visibility text default 'team',
  p_report_eligible boolean default false,
  p_payload jsonb default '{}'::jsonb
)
returns table (
  work_item_id uuid,
  status public.veroxa_job_status_v1,
  activity_event_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_record public.veroxa_work_items%rowtype;
  event_id uuid;
  caller_id uuid := (select auth.uid());
begin
  select * into work_record from public.veroxa_work_items
  where id = p_work_item_id for update;
  if not found or caller_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(work_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_work_transition_required';
  end if;
  if p_visibility not in ('team','client','both')
     or jsonb_typeof(coalesce(p_payload, 'null'::jsonb)) <> 'object'
     or (p_report_eligible and p_visibility = 'team') then
    raise exception using errcode = '22023', message = 'invalid_work_activity_visibility_or_payload';
  end if;
  if p_target_status in ('failed','blocked','cancelled')
     and char_length(coalesce(btrim(p_reason), '')) < 5 then
    raise exception using errcode = '22023', message = 'work_transition_reason_required';
  end if;
  if work_record.work_type in (
       'publishing','google','seo','reviews','website','monitoring'
     )
     and (p_visibility <> 'team' or p_report_eligible) then
    raise exception using errcode = '23514', message = 'external_work_event_is_internal_only_without_source_backed_provider_evidence';
  end if;
  if p_target_status = 'completed'
     and (p_visibility in ('client','both') or p_report_eligible)
     and char_length(coalesce(btrim(p_reason), '')) < 10 then
    raise exception using errcode = '23514', message = 'client_visible_work_success_requires_meaningful_evidence';
  end if;
  if work_record.status = 'retrying'
     and p_target_status <> 'cancelled'
     and (work_record.next_attempt_at is null or work_record.next_attempt_at > now()) then
    raise exception using errcode = '55000', message = 'retry_backoff_not_yet_due';
  end if;
  if exists (
    select 1 from public.veroxa_recovery_runs run
    where run.restaurant_id = work_record.restaurant_id
      and run.subject_type = 'work_item' and run.subject_id = work_record.id
      and run.status in ('queued','in_progress','retrying')
  ) then
    raise exception using errcode = '55000', message = 'active_recovery_locks_work_transition';
  end if;
  if not (
    (work_record.status = 'queued' and p_target_status in ('in_progress','blocked','cancelled'))
    or (work_record.status = 'in_progress' and p_target_status in ('completed','failed','blocked','waiting_approval','cancelled'))
    or (work_record.status = 'waiting_approval' and p_target_status in ('in_progress','blocked','cancelled'))
    or (work_record.status = 'retrying' and p_target_status in ('in_progress','failed','blocked','cancelled'))
    or (work_record.status = 'blocked' and p_target_status in ('failed','cancelled'))
  ) then
    raise exception using errcode = '23514', message = 'invalid_work_item_transition';
  end if;

  if work_record.status = 'queued' and p_target_status = 'in_progress' then
    insert into public.veroxa_job_attempts (
      restaurant_id, work_item_id, attempt_number, status, started_at
    ) values (
      work_record.restaurant_id, work_record.id, 1, 'in_progress', now()
    );
  end if;

  update public.veroxa_job_attempts attempt
  set status = case when p_target_status = 'in_progress' then 'in_progress'::public.veroxa_job_status_v1
      when p_target_status = 'completed' then 'completed'::public.veroxa_job_status_v1
      when p_target_status in ('failed','blocked','cancelled') then 'failed'::public.veroxa_job_status_v1
      else attempt.status end,
      started_at = case when p_target_status = 'in_progress' then now() else attempt.started_at end,
      completed_at = case when p_target_status in ('completed','failed','blocked','cancelled')
        then now() else attempt.completed_at end,
      error_category = case when p_target_status in ('failed','blocked')
        then p_target_status::text else attempt.error_category end,
      error_message = case when p_target_status in ('failed','blocked')
        then nullif(btrim(p_reason), '') else attempt.error_message end
  where attempt.work_item_id = work_record.id
    and attempt.completed_at is null;

  update public.veroxa_work_items
  set status = p_target_status,
      attempt_count = case
        when work_record.status = 'queued' and p_target_status = 'in_progress'
          then 1
        else attempt_count
      end,
      blocked_reason = case when p_target_status = 'blocked' then btrim(p_reason) else null end,
      next_attempt_at = null,
      completed_at = case when p_target_status in ('completed','cancelled') then now() else null end
  where id = work_record.id;

  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    work_record.restaurant_id, 'work_item_' || p_target_status::text,
    'work_item', work_record.id, caller_id, p_visibility, p_report_eligible,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object(
      'workType', work_record.work_type, 'status', p_target_status,
      'reason', nullif(btrim(p_reason), ''))
  ) returning id into event_id;
  return query select work_record.id, p_target_status, event_id;
end;
$$;
revoke all on function public.veroxa_transition_work_item_v1(uuid, public.veroxa_job_status_v1, text, text, boolean, jsonb)
  from public, anon;
grant execute on function public.veroxa_transition_work_item_v1(uuid, public.veroxa_job_status_v1, text, text, boolean, jsonb)
  to authenticated;

create or replace function public.veroxa_retry_work_item_v1(p_work_item_id uuid)
returns table (
  work_item_id uuid,
  attempt_number integer,
  next_attempt_at timestamptz,
  status public.veroxa_job_status_v1
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_record public.veroxa_work_items%rowtype;
  next_number integer;
  retry_at timestamptz;
begin
  select * into work_record from public.veroxa_work_items
  where id = p_work_item_id for update;
  if not found or not public.veroxa_current_user_is_team_for_restaurant(work_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_work_item_required';
  end if;
  if work_record.status not in ('failed','blocked') then
    raise exception using errcode = '23514', message = 'work_item_not_retryable';
  end if;
  if work_record.attempt_count >= work_record.max_attempts then
    raise exception using errcode = '23514', message = 'work_item_retry_limit_reached';
  end if;
  if exists (
    select 1 from public.veroxa_recovery_runs run
    where run.restaurant_id = work_record.restaurant_id
      and run.subject_type = 'work_item' and run.subject_id = work_record.id
      and run.status in ('queued','in_progress','retrying')
  ) then
    raise exception using errcode = '55000', message = 'active_recovery_blocks_work_retry';
  end if;
  update public.veroxa_job_attempts as attempt
  set status = 'failed', completed_at = coalesce(attempt.completed_at, now()),
      error_category = coalesce(attempt.error_category, work_record.status::text),
      error_message = coalesce(attempt.error_message, work_record.blocked_reason)
  where attempt.work_item_id = work_record.id and attempt.completed_at is null;
  next_number := work_record.attempt_count + 1;
  retry_at := now() + make_interval(
    secs => least(3600, (30 * power(2::numeric, next_number - 1))::integer)
  );
  insert into public.veroxa_job_attempts (
    restaurant_id, work_item_id, attempt_number, status, started_at
  ) values (
    work_record.restaurant_id, work_record.id, next_number, 'retrying', now()
  );
  update public.veroxa_work_items
  set status = 'retrying', attempt_count = next_number, next_attempt_at = retry_at,
      blocked_reason = null, completed_at = null
  where id = work_record.id;
  return query select work_record.id, next_number, retry_at,
    'retrying'::public.veroxa_job_status_v1;
end;
$$;
revoke all on function public.veroxa_retry_work_item_v1(uuid) from public, anon;
grant execute on function public.veroxa_retry_work_item_v1(uuid) to authenticated;

create or replace function public.veroxa_record_monitor_check_v1(
  p_restaurant_id uuid,
  p_check_key text,
  p_status text,
  p_details jsonb default '{}'::jsonb,
  p_next_check_at timestamptz default null
)
returns table (monitor_check_id uuid, alert_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  check_id uuid;
  opened_alert_id uuid;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null or not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_monitor_check_required';
  end if;
  if char_length(coalesce(btrim(p_check_key), '')) not between 3 and 120
     or p_status not in ('healthy','warning','critical')
     or jsonb_typeof(coalesce(p_details, 'null'::jsonb)) <> 'object'
     or (p_next_check_at is not null and p_next_check_at <= now()) then
    raise exception using errcode = '22023', message = 'invalid_monitor_check_payload';
  end if;
  insert into public.veroxa_monitor_checks (
    restaurant_id, check_key, status, details, next_check_at
  ) values (
    p_restaurant_id, btrim(p_check_key), p_status, p_details, p_next_check_at
  ) returning id into check_id;
  if p_status in ('warning','critical') then
    insert into public.veroxa_alerts (
      restaurant_id, monitor_check_id, severity, title, message
    ) values (
      p_restaurant_id, check_id, p_status,
      'Momo monitor ' || p_status || ': ' || btrim(p_check_key),
      coalesce(nullif(p_details ->> 'note', ''), 'Manual monitor check requires Team attention.')
    ) returning id into opened_alert_id;
  end if;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    p_restaurant_id, 'monitor_' || p_status, 'monitor_check', check_id,
    caller_id, 'team', false,
    jsonb_build_object('checkKey', btrim(p_check_key), 'status', p_status,
      'alertId', opened_alert_id, 'details', p_details)
  );
  return query select check_id, opened_alert_id;
end;
$$;
revoke all on function public.veroxa_record_monitor_check_v1(uuid, text, text, jsonb, timestamptz)
  from public, anon;
grant execute on function public.veroxa_record_monitor_check_v1(uuid, text, text, jsonb, timestamptz)
  to authenticated;

create or replace function public.veroxa_transition_momo_alert_v1(
  p_alert_id uuid,
  p_target_status text,
  p_notes text
)
returns table (alert_id uuid, status text, transitioned_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  alert_record public.veroxa_alerts%rowtype;
  caller_id uuid := (select auth.uid());
begin
  select * into alert_record from public.veroxa_alerts alert
  where alert.id = p_alert_id for update;
  if not found or caller_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(alert_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_alert_transition_required';
  end if;
  if char_length(coalesce(btrim(p_notes), '')) not between 10 and 2000
     or not (
       (alert_record.status = 'open' and p_target_status = 'acknowledged')
       or (alert_record.status = 'acknowledged' and p_target_status = 'resolved')
     ) then
    raise exception using errcode = '23514', message = 'invalid_alert_transition_or_notes';
  end if;
  if p_target_status = 'acknowledged' then
    update public.veroxa_alerts
    set status = 'acknowledged', acknowledged_by = caller_id,
        acknowledged_at = now(), message = concat_ws(E'\n', message,
          'Acknowledgement: ' || btrim(p_notes))
    where id = alert_record.id;
  else
    update public.veroxa_alerts
    set status = 'resolved', resolved_by = caller_id,
        resolved_at = now(), message = concat_ws(E'\n', message,
          'Resolution: ' || btrim(p_notes))
    where id = alert_record.id;
  end if;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    alert_record.restaurant_id, 'alert_' || p_target_status, 'alert',
    alert_record.id, caller_id, 'team', false,
    jsonb_build_object('status', p_target_status, 'notes', btrim(p_notes))
  );
  return query select alert_record.id, p_target_status, now();
end;
$$;
revoke all on function public.veroxa_transition_momo_alert_v1(uuid, text, text)
  from public, anon;
grant execute on function public.veroxa_transition_momo_alert_v1(uuid, text, text)
  to authenticated;

create or replace function public.veroxa_start_recovery_run_v1(
  p_work_item_id uuid,
  p_action_key text,
  p_max_attempts integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_record public.veroxa_work_items%rowtype;
  run_id uuid;
begin
  select * into work_record from public.veroxa_work_items
  where id = p_work_item_id for update;
  if not found or not public.veroxa_current_user_is_team_for_restaurant(work_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_recovery_required';
  end if;
  if work_record.status not in ('failed','blocked')
     or char_length(coalesce(btrim(p_action_key), '')) not between 3 and 120
     or p_max_attempts <> 1 then
    raise exception using errcode = '23514', message = 'invalid_recovery_start';
  end if;
  if exists (
    select 1 from public.veroxa_recovery_runs run
    where run.restaurant_id = work_record.restaurant_id
      and run.subject_type = 'work_item' and run.subject_id = work_record.id
      and run.status in ('queued','in_progress','retrying')
  ) then
    raise exception using errcode = '23505', message = 'active_recovery_already_exists';
  end if;
  insert into public.veroxa_recovery_runs (
    restaurant_id, subject_type, subject_id, action_key, status,
    attempt_count, max_attempts, initiated_by, started_at
  ) values (
    work_record.restaurant_id, 'work_item', work_record.id, btrim(p_action_key),
    'in_progress', 1, 1, (select auth.uid()), now()
  ) returning id into run_id;
  return run_id;
end;
$$;
revoke all on function public.veroxa_start_recovery_run_v1(uuid, text, integer)
  from public, anon;
grant execute on function public.veroxa_start_recovery_run_v1(uuid, text, integer)
  to authenticated;

create or replace function public.veroxa_complete_recovery_run_v1(
  p_recovery_run_id uuid,
  p_succeeded boolean,
  p_notes text default null,
  p_visibility text default 'both'
)
returns table (
  recovery_run_id uuid,
  status public.veroxa_job_status_v1,
  activity_event_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_record public.veroxa_recovery_runs%rowtype;
  work_record public.veroxa_work_items%rowtype;
  event_id uuid;
  target_status public.veroxa_job_status_v1;
  caller_id uuid := (select auth.uid());
begin
  select * into run_record from public.veroxa_recovery_runs
  where id = p_recovery_run_id for update;
  if not found or caller_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(run_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_recovery_required';
  end if;
  if run_record.subject_type <> 'work_item'
     or run_record.status not in ('queued','in_progress','retrying')
     or p_visibility not in ('team','client','both')
     or (not p_succeeded and char_length(coalesce(btrim(p_notes), '')) < 5) then
    raise exception using errcode = '23514', message = 'invalid_recovery_completion';
  end if;
  select * into work_record
  from public.veroxa_work_items work
  where work.id = run_record.subject_id
    and work.restaurant_id = run_record.restaurant_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'recovery_work_item_missing';
  end if;
  if work_record.status not in ('failed','blocked')
     or work_record.next_attempt_at is not null then
    raise exception using errcode = '40001', message = 'recovery_work_item_state_changed_restart_required';
  end if;
  if work_record.work_type in (
       'publishing','google','seo','reviews','website','monitoring'
     )
     and p_visibility <> 'team' then
    raise exception using errcode = '23514', message = 'external_recovery_event_is_internal_only_without_source_backed_provider_evidence';
  end if;
  if p_succeeded and p_visibility in ('client','both')
     and char_length(coalesce(btrim(p_notes), '')) < 10 then
    raise exception using errcode = '23514', message = 'client_visible_recovery_success_requires_meaningful_evidence';
  end if;
  target_status := case when p_succeeded then 'completed'::public.veroxa_job_status_v1
    else 'failed'::public.veroxa_job_status_v1 end;
  update public.veroxa_recovery_runs
  set status = target_status, completed_at = now(), next_attempt_at = null,
      last_error = case when p_succeeded then null else btrim(p_notes) end
  where id = run_record.id;
  update public.veroxa_work_items
  set status = target_status,
      completed_at = case when p_succeeded then now() else null end,
      blocked_reason = case when p_succeeded then null else btrim(p_notes) end,
      next_attempt_at = null
  where id = run_record.subject_id and restaurant_id = run_record.restaurant_id;
  update public.veroxa_job_attempts
  set status = target_status, completed_at = now(),
      error_category = case when p_succeeded then null else 'recovery_failed' end,
      error_message = case when p_succeeded then null else btrim(p_notes) end
  where work_item_id = run_record.subject_id and completed_at is null;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    run_record.restaurant_id,
    case when p_succeeded then 'recovery_succeeded' else 'recovery_failed' end,
    'recovery_run', run_record.id, caller_id, p_visibility,
    p_succeeded and p_visibility in ('client','both'),
    jsonb_build_object('workItemId', run_record.subject_id,
      'actionKey', run_record.action_key, 'succeeded', p_succeeded,
      'notes', nullif(btrim(p_notes), ''))
  ) returning id into event_id;
  return query select run_record.id, target_status, event_id;
end;
$$;
revoke all on function public.veroxa_complete_recovery_run_v1(uuid, boolean, text, text)
  from public, anon;
grant execute on function public.veroxa_complete_recovery_run_v1(uuid, boolean, text, text)
  to authenticated;

revoke update, delete on table public.veroxa_work_items,
  public.veroxa_job_attempts, public.veroxa_monitor_checks,
  public.veroxa_recovery_runs from authenticated;
revoke insert on table public.veroxa_job_attempts, public.veroxa_monitor_checks,
  public.veroxa_recovery_runs from authenticated;
drop policy if exists veroxa_work_items_team_update on public.veroxa_work_items;
drop policy if exists veroxa_job_attempts_team_insert on public.veroxa_job_attempts;
drop policy if exists veroxa_job_attempts_team_update on public.veroxa_job_attempts;
drop policy if exists veroxa_monitor_checks_team_insert on public.veroxa_monitor_checks;
drop policy if exists veroxa_monitor_checks_team_update on public.veroxa_monitor_checks;
drop policy if exists veroxa_recovery_runs_team_insert on public.veroxa_recovery_runs;
drop policy if exists veroxa_recovery_runs_team_update on public.veroxa_recovery_runs;

-- -------------------------------------------------------------------------
-- Provider-neutral preflight and prepared-only publication queue
-- -------------------------------------------------------------------------

revoke insert, update, delete on table public.veroxa_provider_connections,
  public.veroxa_publish_queue, public.veroxa_publish_attempts from authenticated;
revoke insert, update, delete on table public.veroxa_local_presence_checks,
  public.veroxa_review_records, public.veroxa_visibility_snapshots,
  public.veroxa_alerts from authenticated;
drop policy if exists veroxa_provider_connections_team_insert on public.veroxa_provider_connections;
drop policy if exists veroxa_provider_connections_team_update on public.veroxa_provider_connections;
drop policy if exists veroxa_publish_queue_team_insert on public.veroxa_publish_queue;
drop policy if exists veroxa_publish_queue_team_update on public.veroxa_publish_queue;
drop policy if exists veroxa_publish_attempts_team_insert on public.veroxa_publish_attempts;
drop policy if exists veroxa_publish_attempts_team_update on public.veroxa_publish_attempts;
drop policy if exists veroxa_local_presence_checks_team_insert on public.veroxa_local_presence_checks;
drop policy if exists veroxa_local_presence_checks_team_update on public.veroxa_local_presence_checks;
drop policy if exists veroxa_review_records_team_insert on public.veroxa_review_records;
drop policy if exists veroxa_review_records_team_update on public.veroxa_review_records;
drop policy if exists veroxa_visibility_snapshots_team_insert on public.veroxa_visibility_snapshots;
drop policy if exists veroxa_visibility_snapshots_team_update on public.veroxa_visibility_snapshots;
drop policy if exists veroxa_alerts_team_insert on public.veroxa_alerts;
drop policy if exists veroxa_alerts_team_update on public.veroxa_alerts;

create or replace function veroxa_private.provider_owner_authorization_current_v1(
  p_connection_id uuid,
  p_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_provider_connections connection
    join public.veroxa_user_profiles profile
      on profile.user_id = connection.owner_authorized_by
    join public.veroxa_restaurant_members member
      on member.user_id = connection.owner_authorized_by
     and member.restaurant_id = connection.restaurant_id
    where connection.id = p_connection_id
      and connection.restaurant_id = p_restaurant_id
      and connection.owner_authorized_by is not null
      and connection.owner_authorized_at is not null
      and connection.last_verified_at is not null
      and connection.last_verified_at >= connection.owner_authorized_at
      and profile.role = 'client' and profile.status = 'active'
      and member.role = 'client' and member.status = 'active'
  );
$$;
revoke all on function veroxa_private.provider_owner_authorization_current_v1(uuid, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.provider_presence_authority_current_v1(
  p_restaurant_id uuid,
  p_provider text,
  p_required_capability text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with mapped_presence as (
    select case
      when p_provider = 'meta' and p_required_capability = 'facebook_publish'
        then 'facebook'
      when p_provider = 'meta' and p_required_capability = 'instagram_publish'
        then 'instagram'
      when p_provider = 'google_business' and p_required_capability in (
        'google_business_publish','review_reply','business_profile_read'
      ) then 'google_business'
      else null
    end as presence_provider
  )
  select not exists (
    select 1
    from mapped_presence mapped
    join public.veroxa_presence_profiles profile
      on profile.restaurant_id = p_restaurant_id
     and profile.provider = mapped.presence_provider
    left join lateral (
      select confirmation.decision, confirmation.status
      from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = profile.restaurant_id
        and confirmation.subject_type = 'presence_profile'
        and confirmation.subject_id = profile.id
        and confirmation.confirmation_kind = 'presence'
      order by confirmation.submitted_at desc, confirmation.created_at desc,
        confirmation.id desc
      limit 1
    ) latest on true
    where mapped.presence_provider is not null
      and (
        profile.access_status = 'revoked'
        or profile.truth_status = 'rejected'
        or latest.decision in ('reject','needs_help')
      )
  );
$$;
revoke all on function veroxa_private.provider_presence_authority_current_v1(uuid, text, text)
  from public, anon, authenticated;

create or replace function public.veroxa_provider_preflight_v1(
  p_restaurant_id uuid,
  p_provider text,
  p_required_capability text
)
returns table (
  provider text,
  connection_status public.veroxa_connection_status_v1,
  allowed boolean,
  blockers jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  stored_connection_id uuid;
  stored_status public.veroxa_connection_status_v1 := 'not_connected';
  stored_capabilities jsonb := '[]'::jsonb;
  blocker_list jsonb := '[]'::jsonb;
begin
  if not (
    public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
    or public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
  ) then
    raise exception using errcode = '42501', message = 'momo_provider_preflight_forbidden';
  end if;
  if not (
    (p_provider = 'meta' and p_required_capability in ('facebook_publish','instagram_publish'))
    or (p_provider = 'google_business' and p_required_capability in (
      'google_business_publish','review_reply','business_profile_read'))
  ) then
    raise exception using errcode = '22023', message = 'unsupported_provider_capability';
  end if;
  select connection.id, connection.status, connection.capabilities
    into stored_connection_id, stored_status, stored_capabilities
  from public.veroxa_provider_connections connection
  where connection.restaurant_id = p_restaurant_id
    and connection.provider = p_provider;
  if not found then
    stored_status := 'not_connected';
    stored_capabilities := '[]'::jsonb;
  end if;
  if stored_status <> 'connected' then
    blocker_list := blocker_list || jsonb_build_array(jsonb_build_object(
      'code', 'provider_not_connected', 'message', 'No verified owner-authorized provider connection is active.'));
  end if;
  if not exists (
    select 1 from public.veroxa_provider_connections connection
    where connection.restaurant_id = p_restaurant_id and connection.provider = p_provider
      and connection.owner_authorized_by is not null
      and connection.owner_authorized_at is not null
      and connection.last_verified_at is not null
      and connection.last_verified_at >= connection.owner_authorized_at
  ) then
    blocker_list := blocker_list || jsonb_build_array(jsonb_build_object(
      'code', 'owner_authorization_missing',
      'message', 'A current owner authorization record is required.'));
  end if;
  if stored_connection_id is not null
     and not veroxa_private.provider_owner_authorization_current_v1(
       stored_connection_id, p_restaurant_id
     ) then
    blocker_list := blocker_list || jsonb_build_array(jsonb_build_object(
      'code', 'owner_authorization_actor_inactive',
      'message', 'The authorizing owner must retain an active Client profile and restaurant membership.'));
  end if;
  if not veroxa_private.provider_presence_authority_current_v1(
    p_restaurant_id, p_provider, p_required_capability
  ) then
    blocker_list := blocker_list || jsonb_build_array(jsonb_build_object(
      'code', 'owner_presence_authority_withdrawn',
      'message', 'The latest owner presence decision blocks this provider capability.'));
  end if;
  if not (stored_capabilities ? p_required_capability) then
    blocker_list := blocker_list || jsonb_build_array(jsonb_build_object(
      'code', 'capability_not_verified', 'message', 'The required provider capability has not been verified.'));
  end if;
  blocker_list := blocker_list || jsonb_build_array(
    jsonb_build_object('code', 'provider_credentials_not_provisioned',
      'message', 'Provider credentials are intentionally absent from this zero-cost rehearsal.'),
    jsonb_build_object('code', 'provider_runtime_inactive',
      'message', 'No provider execution worker is active; no external request will be made.')
  );
  return query select p_provider, stored_status, false, blocker_list;
end;
$$;
revoke all on function public.veroxa_provider_preflight_v1(uuid, text, text)
  from public, anon;
grant execute on function public.veroxa_provider_preflight_v1(uuid, text, text)
  to authenticated;

create or replace function veroxa_private.validate_publish_queue_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  variant_platform text;
  variant_status public.veroxa_review_status_v1;
  item_status public.veroxa_review_status_v1;
  item_id uuid;
  asset_id uuid;
  approval_record public.veroxa_approvals%rowtype;
  connection_record public.veroxa_provider_connections%rowtype;
  calendar_time timestamptz;
  calendar_status public.veroxa_publish_status_v1;
  calendar_timezone text;
begin
  if new.status not in ('approved','queued','publishing','published') then
    return new;
  end if;
  select variant.platform, variant.status, variant.content_item_id,
      item.primary_media_asset_id, item.status
    into variant_platform, variant_status, item_id, asset_id, item_status
  from public.veroxa_content_variants variant
  join public.veroxa_content_items item on item.id = variant.content_item_id
  where variant.id = new.variant_id and variant.restaurant_id = new.restaurant_id
    and item.restaurant_id = new.restaurant_id;
  select * into approval_record from public.veroxa_approvals approval
  where approval.id = new.approval_id and approval.restaurant_id = new.restaurant_id;
  select * into connection_record from public.veroxa_provider_connections connection
  where connection.id = new.connection_id and connection.restaurant_id = new.restaurant_id;
  select calendar.scheduled_for, calendar.status, calendar.timezone
    into calendar_time, calendar_status, calendar_timezone
  from public.veroxa_content_calendar calendar
  where calendar.variant_id = new.variant_id and calendar.restaurant_id = new.restaurant_id;

  if variant_status is distinct from 'approved'
     or item_status is distinct from 'approved'
     or approval_record.status is distinct from 'approved'
     or approval_record.subject_type not in ('content_variant','publish')
     or approval_record.subject_id is distinct from new.variant_id
     or approval_record.approval_kind <> 'publishing'
     or approval_record.subject_snapshot_sha256 is null
     or approval_record.subject_snapshot_sha256 is distinct from
       veroxa_private.confirmation_snapshot_sha256_v1(
         veroxa_private.approval_subject_snapshot_v1(
           new.restaurant_id, approval_record.subject_type, new.variant_id))
     or connection_record.status is distinct from 'connected'
     or connection_record.owner_authorized_by is null
     or connection_record.owner_authorized_at is null
     or connection_record.last_verified_at is null
     or connection_record.last_verified_at < connection_record.owner_authorized_at
     or not veroxa_private.provider_owner_authorization_current_v1(
       new.connection_id, new.restaurant_id)
     or not veroxa_private.provider_presence_authority_current_v1(
       new.restaurant_id, connection_record.provider,
       case variant_platform
         when 'facebook' then 'facebook_publish'
         when 'instagram' then 'instagram_publish'
         else 'google_business_publish'
       end)
     or not veroxa_private.variant_owner_confirmation_satisfied(new.variant_id, new.restaurant_id)
     or not veroxa_private.content_inputs_current_v1(item_id, new.restaurant_id, variant_platform)
     or not veroxa_private.content_media_valid_at_v1(
       item_id, new.restaurant_id, variant_platform, calendar_time)
     or not veroxa_private.content_claims_supported_v1(
       item_id, new.restaurant_id,
       (select variant.caption from public.veroxa_content_variants variant
        where variant.id = new.variant_id and variant.restaurant_id = new.restaurant_id))
     or calendar_time is null or calendar_time <= now()
     or calendar_status is distinct from 'approved'
     or calendar_timezone is distinct from 'America/Chicago'
     or new.scheduled_for is distinct from calendar_time
     or asset_id is null
     or (variant_platform in ('facebook','instagram') and connection_record.provider <> 'meta')
     or (variant_platform = 'google_business' and connection_record.provider <> 'google_business')
     or not (connection_record.capabilities ? case variant_platform
       when 'facebook' then 'facebook_publish'
       when 'instagram' then 'instagram_publish'
       else 'google_business_publish' end) then
    raise exception using errcode = '23514', message = 'publication_requires_fresh_approval_schedule_inputs_and_connection';
  end if;
  if new.status in ('queued','publishing','published') then
    raise exception using errcode = '55000', message = 'provider_runtime_inactive_zero_cost_rehearsal';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_publish_queue_gate()
  from public, anon, authenticated;

create or replace function public.veroxa_queue_momo_publication_v1(
  p_restaurant_id uuid,
  p_connection_id uuid,
  p_variant_id uuid,
  p_approval_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  connection_record public.veroxa_provider_connections%rowtype;
  approval_record public.veroxa_approvals%rowtype;
  variant_record public.veroxa_content_variants%rowtype;
  item_record public.veroxa_content_items%rowtype;
  calendar_record public.veroxa_content_calendar%rowtype;
  queue_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_publication_queue_required';
  end if;
  select * into connection_record from public.veroxa_provider_connections
  where id = p_connection_id and restaurant_id = p_restaurant_id for share;
  select * into variant_record from public.veroxa_content_variants
  where id = p_variant_id and restaurant_id = p_restaurant_id for share;
  if not found then
    raise exception using errcode = '23503', message = 'publication_variant_not_in_momo_scope';
  end if;
  select * into item_record from public.veroxa_content_items
  where id = variant_record.content_item_id and restaurant_id = p_restaurant_id for share;
  perform input.id from public.veroxa_content_input_ledger input
  where input.content_item_id = item_record.id and input.restaurant_id = p_restaurant_id
  order by input.id for share;
  perform field.id
  from public.veroxa_restaurant_truth_fields field
  join public.veroxa_content_input_ledger input on input.truth_field_id = field.id
  where input.content_item_id = item_record.id and input.restaurant_id = p_restaurant_id
  order by field.id for share of field;
  perform rights.id
  from public.veroxa_media_rights rights
  join public.veroxa_content_input_ledger input on input.media_asset_id = rights.asset_id
  join public.veroxa_media_reviews review
    on review.asset_id = rights.asset_id and review.restaurant_id = rights.restaurant_id
   and review.is_current
  where input.content_item_id = item_record.id and input.restaurant_id = p_restaurant_id
  order by rights.id for share of rights, review;
  select * into approval_record from public.veroxa_approvals
  where id = p_approval_id and restaurant_id = p_restaurant_id for share;
  select * into calendar_record from public.veroxa_content_calendar
  where variant_id = p_variant_id and restaurant_id = p_restaurant_id for update;
  if connection_record.id is null or approval_record.id is null
     or calendar_record.id is null or calendar_record.scheduled_for is null
     or calendar_record.status <> 'approved'
     or calendar_record.timezone <> 'America/Chicago'
     or calendar_record.scheduled_for <= now()
     or variant_record.status <> 'approved' or item_record.status <> 'approved'
     or approval_record.status <> 'approved'
     or approval_record.approval_kind <> 'publishing'
     or approval_record.subject_type not in ('content_variant','publish')
     or approval_record.subject_id <> p_variant_id
     or approval_record.subject_snapshot_sha256 is null
     or approval_record.subject_snapshot_sha256 is distinct from
       veroxa_private.confirmation_snapshot_sha256_v1(
         veroxa_private.approval_subject_snapshot_v1(
           p_restaurant_id, approval_record.subject_type, p_variant_id))
     or connection_record.status <> 'connected'
     or connection_record.owner_authorized_by is null
     or connection_record.owner_authorized_at is null
     or connection_record.last_verified_at is null
     or connection_record.last_verified_at < connection_record.owner_authorized_at
     or not veroxa_private.provider_owner_authorization_current_v1(
       connection_record.id, p_restaurant_id)
     or not veroxa_private.provider_presence_authority_current_v1(
       p_restaurant_id, connection_record.provider,
       case variant_record.platform
         when 'facebook' then 'facebook_publish'
         when 'instagram' then 'instagram_publish'
         else 'google_business_publish'
       end)
     or not veroxa_private.variant_owner_confirmation_satisfied(
       p_variant_id, p_restaurant_id)
     or not veroxa_private.content_inputs_current_v1(
       item_record.id, p_restaurant_id, variant_record.platform)
     or not veroxa_private.content_media_valid_at_v1(
       item_record.id, p_restaurant_id, variant_record.platform,
       calendar_record.scheduled_for)
     or not veroxa_private.content_claims_supported_v1(
       item_record.id, p_restaurant_id, variant_record.caption)
     or item_record.primary_media_asset_id is null
  then
    raise exception using errcode = '23514', message = 'publication_queue_preconditions_failed';
  end if;
  if exists (
    select 1 from public.veroxa_publish_queue queue
    where queue.restaurant_id = p_restaurant_id and queue.variant_id = p_variant_id
      and queue.status <> 'cancelled' for update
  ) then
    raise exception using errcode = '23505', message = 'publication_queue_duplicate';
  end if;
  insert into public.veroxa_publish_queue (
    restaurant_id, connection_id, variant_id, approval_id, status,
    scheduled_for, next_attempt_at, last_error, created_by
  ) values (
    p_restaurant_id, p_connection_id, p_variant_id, p_approval_id, 'approved',
    calendar_record.scheduled_for, null,
    'prepared_only_provider_runtime_inactive', (select auth.uid())
  ) returning id into queue_id;
  return queue_id;
end;
$$;
revoke all on function public.veroxa_queue_momo_publication_v1(uuid, uuid, uuid, uuid)
  from public, anon;
grant execute on function public.veroxa_queue_momo_publication_v1(uuid, uuid, uuid, uuid)
  to authenticated;

-- -------------------------------------------------------------------------
-- Objective reconciliation, derived gate snapshots, and atomic No-Go only
-- -------------------------------------------------------------------------

create or replace function public.veroxa_reconcile_momo_readiness_v1(
  p_restaurant_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  foundation_ok boolean;
  active_team_count integer;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_readiness_reconciliation_required';
  end if;
  select exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    join public.veroxa_restaurants restaurant on restaurant.id = scope.restaurant_id
    where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
      and scope.restaurant_id = p_restaurant_id
      and restaurant.status = 'active'::public.veroxa_account_status_v1
  ) into foundation_ok;
  select count(*)::integer into active_team_count
  from public.veroxa_restaurant_members member
  join public.veroxa_user_profiles profile on profile.user_id = member.user_id
  where member.restaurant_id = p_restaurant_id
    and member.role = 'team' and member.status = 'active'
    and profile.role = 'team' and profile.status = 'active';

  update public.veroxa_readiness_dimensions dimension
  set status = case
        when dimension.dimension_key = 'production_foundation' and foundation_ok then 'verified'::public.veroxa_readiness_status_v1
        when dimension.dimension_key = 'team_identity_and_access' and active_team_count > 0 then 'verified'::public.veroxa_readiness_status_v1
        else 'blocked'::public.veroxa_readiness_status_v1
      end,
      evidence = case
        when dimension.dimension_key = 'production_foundation' and foundation_ok then
          jsonb_build_array(jsonb_build_object(
            'objectiveSource', 'enabled_singleton_scope_and_active_restaurant',
            'scopeKey', 'momo_house_san_antonio'))
        when dimension.dimension_key = 'team_identity_and_access' and active_team_count > 0 then
          jsonb_build_array(jsonb_build_object(
            'objectiveSource', 'active_team_profile_and_membership',
            'activeTeamCount', active_team_count))
        else '[]'::jsonb
      end,
      blockers = case dimension.dimension_key
        when 'production_foundation' then case when foundation_ok then '[]'::jsonb else
          jsonb_build_array(jsonb_build_object('code','foundation_scope_not_active','message','The enabled singleton production scope is not active.')) end
        when 'team_identity_and_access' then case when active_team_count > 0 then '[]'::jsonb else
          jsonb_build_array(jsonb_build_object('code','active_team_identity_missing','message','An active Team profile and restaurant membership are required.')) end
        when 'business_truth_and_onboarding' then jsonb_build_array(jsonb_build_object(
          'code','owner_truth_and_onboarding_incomplete','message','Owner-confirmed truth and all evidence-bound onboarding steps are not yet complete.'))
        when 'media_and_rights' then jsonb_build_array(jsonb_build_object(
          'code','media_rights_review_incomplete','message','Current owner rights and public-use media review are not complete for every planned asset.'))
        when 'ai_and_automation' then jsonb_build_array(jsonb_build_object(
          'code','paid_ai_runtime_intentionally_inactive','message','AI/provider automation is deferred to preserve zero incremental spend.'))
        when 'meta_social' then jsonb_build_array(jsonb_build_object(
          'code','meta_runtime_not_connected','message','Meta credentials, verified capabilities, and execution runtime are inactive.'))
        when 'google_seo_and_reviews' then jsonb_build_array(jsonb_build_object(
          'code','google_runtime_not_connected','message','Google Business credentials and verified execution runtime are inactive.'))
        when 'website_menu_and_ordering' then jsonb_build_array(jsonb_build_object(
          'code','public_presence_not_fully_verified','message','Website, menu, ordering, and public contact paths are not fully verified.'))
        when 'operations_reporting_and_monitoring' then jsonb_build_array(jsonb_build_object(
          'code','operating_cycle_rehearsal_only','message','Operations, reporting, monitoring, and recovery remain rehearsal-only.'))
        when 'activation_and_recovery' then jsonb_build_array(jsonb_build_object(
          'code','activation_no_go_required','message','Activation remains No-Go while provider/runtime blockers exist.'))
        else jsonb_build_array(jsonb_build_object('code','unknown_readiness_dimension','message','This dimension is not objectively verified.'))
      end
  where dimension.restaurant_id = p_restaurant_id;
end;
$$;
revoke all on function public.veroxa_reconcile_momo_readiness_v1(uuid)
  from public, anon;
grant execute on function public.veroxa_reconcile_momo_readiness_v1(uuid)
  to authenticated;

create or replace function public.veroxa_run_momo_readiness_gate_v1(
  p_restaurant_id uuid
)
returns table (
  gate_run_id uuid,
  status public.veroxa_readiness_status_v1,
  required_count integer,
  verified_count integer,
  blocker_count integer,
  can_activate boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid;
  derived_status public.veroxa_readiness_status_v1;
  required_total integer;
  verified_total integer;
  blocker_total integer;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_readiness_gate_required';
  end if;
  perform public.veroxa_reconcile_momo_readiness_v1(p_restaurant_id);
  perform dimension.id from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = p_restaurant_id order by dimension.dimension_key for share;
  select count(*) filter (where dimension.required)::integer,
      count(*) filter (where dimension.required and dimension.status = 'verified')::integer,
      count(*) filter (where dimension.required and (
        dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0))::integer
    into required_total, verified_total, blocker_total
  from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = p_restaurant_id;
  derived_status := case
    when required_total = 0 then 'not_started'::public.veroxa_readiness_status_v1
    when verified_total = required_total and blocker_total = 0 then 'verified'::public.veroxa_readiness_status_v1
    else 'blocked'::public.veroxa_readiness_status_v1 end;
  insert into public.veroxa_readiness_gate_runs (
    restaurant_id, status, required_count, verified_count, blocker_count, evaluated_by
  ) values (
    p_restaurant_id, derived_status, required_total, verified_total, blocker_total,
    (select auth.uid())
  ) returning id into run_id;
  return query select run_id, derived_status, required_total, verified_total,
    blocker_total, derived_status = 'verified';
end;
$$;
revoke all on function public.veroxa_run_momo_readiness_gate_v1(uuid)
  from public, anon;
grant execute on function public.veroxa_run_momo_readiness_gate_v1(uuid)
  to authenticated;

create or replace function public.veroxa_record_momo_no_go_v1(
  p_restaurant_id uuid,
  p_gate_run_id uuid,
  p_reason text,
  p_rehearsal boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gate_record public.veroxa_readiness_gate_runs%rowtype;
  decision_id uuid;
  current_blockers jsonb;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_no_go_required';
  end if;
  if not p_rehearsal or char_length(coalesce(btrim(p_reason), '')) not between 10 and 2000 then
    raise exception using errcode = '22023', message = 'valid_rehearsal_no_go_reason_required';
  end if;
  select * into gate_record from public.veroxa_readiness_gate_runs
  where id = p_gate_run_id and restaurant_id = p_restaurant_id for share;
  select coalesce(jsonb_agg(jsonb_build_object(
      'dimensionKey', dimension.dimension_key, 'status', dimension.status,
      'blockers', dimension.blockers) order by dimension.dimension_key), '[]'::jsonb)
    into current_blockers
  from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = p_restaurant_id and dimension.required
    and (dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0);
  if gate_record.id is null or gate_record.status <> 'blocked'
     or gate_record.blocker_count = 0
     or gate_record.blocker_snapshot is distinct from current_blockers then
    raise exception using errcode = '40001', message = 'no_go_requires_current_blocked_gate';
  end if;
  insert into public.veroxa_activation_decisions (
    restaurant_id, gate_run_id, mode, decision, reason,
    blocker_snapshot, decided_by
  ) values (
    p_restaurant_id, p_gate_run_id, 'rehearsal', 'no_go', btrim(p_reason),
    gate_record.blocker_snapshot, (select auth.uid())
  ) returning id into decision_id;
  return decision_id;
end;
$$;
revoke all on function public.veroxa_record_momo_no_go_v1(uuid, uuid, text, boolean)
  from public, anon;
grant execute on function public.veroxa_record_momo_no_go_v1(uuid, uuid, text, boolean)
  to authenticated;

create or replace function public.veroxa_run_momo_no_go_rehearsal_v1(
  p_restaurant_id uuid,
  p_reason text
)
returns table (
  gate_run_id uuid,
  status public.veroxa_readiness_status_v1,
  required_count integer,
  verified_count integer,
  blocker_count integer,
  can_activate boolean,
  decision_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  gate_result record;
  new_decision_id uuid;
begin
  select * into gate_result
  from public.veroxa_run_momo_readiness_gate_v1(p_restaurant_id);
  if gate_result.status <> 'blocked' or gate_result.can_activate then
    raise exception using errcode = '55000', message = 'rehearsal_must_never_record_go';
  end if;
  new_decision_id := public.veroxa_record_momo_no_go_v1(
    p_restaurant_id, gate_result.gate_run_id, p_reason, true
  );
  return query select gate_result.gate_run_id, gate_result.status,
    gate_result.required_count, gate_result.verified_count,
    gate_result.blocker_count, false, new_decision_id;
end;
$$;
revoke all on function public.veroxa_run_momo_no_go_rehearsal_v1(uuid, text)
  from public, anon;
grant execute on function public.veroxa_run_momo_no_go_rehearsal_v1(uuid, text)
  to authenticated;

revoke insert, update, delete on table public.veroxa_readiness_gate_runs,
  public.veroxa_activation_decisions from authenticated;
drop policy if exists veroxa_readiness_gate_runs_team_insert on public.veroxa_readiness_gate_runs;
drop policy if exists veroxa_readiness_gate_runs_team_update on public.veroxa_readiness_gate_runs;

create or replace function veroxa_private.protect_activation_decision_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514', message = 'activation_decision_is_immutable';
  end if;
  if new.decided_by is distinct from (select auth.uid())
     or new.mode <> 'rehearsal' or new.decision <> 'no_go' then
    raise exception using errcode = '42501', message = 'only_current_actor_rehearsal_no_go_is_allowed';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_activation_decision_v1()
  from public, anon, authenticated;
drop trigger if exists veroxa_activation_decisions_immutable
  on public.veroxa_activation_decisions;
create trigger veroxa_activation_decisions_immutable
before insert or update or delete on public.veroxa_activation_decisions
for each row execute function veroxa_private.protect_activation_decision_v1();

-- -------------------------------------------------------------------------
-- Client-safe snapshot: current-state gate semantics and no secret hashes
-- -------------------------------------------------------------------------

create or replace function public.veroxa_momo_client_snapshot_v1(
  target_restaurant_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(target_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;
  select jsonb_build_object(
    'restaurantId', target_restaurant_id,
    'onboarding', jsonb_build_object(
      'truthFields', coalesce((select jsonb_agg(jsonb_build_object(
        'id', field.id, 'fieldKey', field.field_key, 'section', field.section,
        'value', field.value_json, 'status', field.status, 'source', field.source,
        'ownerConfirmedAt', field.owner_confirmed_at, 'updatedAt', field.updated_at
      ) order by field.field_key)
        from public.veroxa_restaurant_truth_fields field
        where field.restaurant_id = target_restaurant_id and field.is_current
          and field.status <> 'superseded'), '[]'::jsonb),
      'contacts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', contact.id, 'kind', contact.contact_kind, 'name', contact.name,
        'email', contact.email, 'phone', contact.phone,
        'isPrimary', contact.is_primary, 'status', contact.status,
        'ownerConfirmedAt', contact.owner_confirmed_at
      ) order by contact.is_primary desc, contact.created_at)
        from public.veroxa_restaurant_contacts contact
        where contact.restaurant_id = target_restaurant_id
          and contact.status not in ('rejected','superseded')), '[]'::jsonb),
      'steps', coalesce((select jsonb_agg(jsonb_build_object(
        'id', step.id, 'stepKey', step.step_key, 'title', step.title,
        'position', step.position, 'status', step.status,
        'completedAt', step.completed_at
      ) order by step.position)
        from public.veroxa_onboarding_steps step
        where step.restaurant_id = target_restaurant_id), '[]'::jsonb),
      'presence', coalesce((select jsonb_agg(jsonb_build_object(
        'id', presence.id, 'provider', presence.provider,
        'publicUrl', presence.public_url, 'accessStatus', presence.access_status,
        'truthStatus', presence.truth_status, 'lastCheckedAt', presence.last_checked_at
      ) order by presence.provider)
        from public.veroxa_presence_profiles presence
        where presence.restaurant_id = target_restaurant_id), '[]'::jsonb)
    ),
    'connections', coalesce((select jsonb_agg(jsonb_build_object(
      'provider', connection.provider, 'status', connection.status,
      'ownerAuthorizedAt', connection.owner_authorized_at,
      'lastVerifiedAt', connection.last_verified_at,
      'eligibleCapabilities', case
        when connection.status = 'connected'
          and connection.last_verified_at is not null
          and connection.owner_authorized_at is not null
          and connection.last_verified_at >= connection.owner_authorized_at
          and veroxa_private.provider_owner_authorization_current_v1(
            connection.id, target_restaurant_id)
        then coalesce((
          select jsonb_agg(capability.value order by capability.value)
          from jsonb_array_elements_text(connection.capabilities) capability(value)
          where (
            (connection.provider = 'meta' and capability.value in (
              'facebook_publish','instagram_publish'))
            or (connection.provider = 'google_business' and capability.value in (
              'google_business_publish','review_reply','business_profile_read'))
          )
          and veroxa_private.provider_presence_authority_current_v1(
            target_restaurant_id, connection.provider, capability.value)
        ), '[]'::jsonb)
        else '[]'::jsonb
      end
    ) order by connection.provider)
      from public.veroxa_provider_connections connection
      where connection.restaurant_id = target_restaurant_id), '[]'::jsonb),
    'readiness', jsonb_build_object(
      'dimensions', coalesce((select jsonb_agg(jsonb_build_object(
        'dimensionKey', dimension.dimension_key, 'label', dimension.label,
        'required', dimension.required, 'status', dimension.status,
        'verifiedAt', dimension.verified_at
      ) order by dimension.dimension_key)
        from public.veroxa_readiness_dimensions dimension
        where dimension.restaurant_id = target_restaurant_id), '[]'::jsonb),
      'latestGate', (
        select jsonb_build_object(
          'status', case when summary.required_count = 0 then 'not_started' else 'blocked' end,
          'currentStatus', case when summary.required_count = 0 then 'not_started' else 'blocked' end,
          'evaluatedStatus', gate.status,
          'requiredCount', summary.required_count,
          'verifiedCount', summary.verified_count,
          'blockerCount', greatest(summary.blocker_count, case when summary.required_count > 0 then 1 else 0 end),
          'canActivate', false,
          'evaluatedAt', gate.evaluated_at
        )
        from (
          select count(*) filter (where dimension.required)::integer as required_count,
            count(*) filter (where dimension.required and dimension.status = 'verified')::integer as verified_count,
            count(*) filter (where dimension.required and (
              dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0))::integer as blocker_count
          from public.veroxa_readiness_dimensions dimension
          where dimension.restaurant_id = target_restaurant_id
        ) summary
        left join lateral (
          select stored.status, stored.evaluated_at
          from public.veroxa_readiness_gate_runs stored
          where stored.restaurant_id = target_restaurant_id
          order by stored.evaluated_at desc limit 1
        ) gate on true
      )
    ),
    'confirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'id', confirmation.id, 'subjectType', confirmation.subject_type,
      'subjectId', confirmation.subject_id, 'kind', confirmation.confirmation_kind,
      'decision', confirmation.decision, 'proposedValue', confirmation.proposed_value,
      'notes', confirmation.notes, 'status', confirmation.status,
      'submittedAt', confirmation.submitted_at, 'reviewedAt', confirmation.reviewed_at
    ) order by confirmation.submitted_at desc)
      from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = target_restaurant_id
        and confirmation.submitted_by = (select auth.uid())), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(jsonb_build_object(
      'id', asset.id, 'storagePath', asset.storage_path,
      'displayFileName', asset.original_file_name, 'mimeType', asset.mime_type,
      'fileSize', asset.file_size, 'status', asset.status,
      'createdAt', asset.created_at, 'rightsId', rights.id,
      'rightsStatus', rights.rights_status, 'usageScope', rights.usage_scope,
      'attestationVersion', rights.attestation_version,
      'validFrom', rights.valid_from, 'expiresAt', rights.expires_at,
      'confirmedAt', rights.confirmed_at, 'reviewStatus', review.status,
      'publicUseApproved', coalesce(review.public_use_approved, false)
    ) order by asset.created_at desc)
      from public.veroxa_media_assets asset
      left join public.veroxa_media_rights rights on rights.asset_id = asset.id
      left join public.veroxa_media_reviews review
        on review.asset_id = asset.id and review.is_current
      where asset.restaurant_id = target_restaurant_id), '[]'::jsonb),
    'pendingContentConfirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'concept', item.concept,
      'masterCaption', item.master_caption, 'manualPillar', item.manual_pillar,
      'mediaDisplayFileName', asset.original_file_name,
      'confirmationStatus', (
        select confirmation.status
        from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = target_restaurant_id
          and confirmation.subject_type = 'content_item'
          and confirmation.subject_id = item.id
          and confirmation.submitted_by = (select auth.uid())
        order by confirmation.submitted_at desc limit 1)
    ) order by item.created_at)
      from public.veroxa_content_items item
      left join public.veroxa_media_assets asset on asset.id = item.primary_media_asset_id
      where item.restaurant_id = target_restaurant_id
        and item.requires_owner_confirmation
        and item.status in ('pending','in_review','approved')), '[]'::jsonb),
    'contentCalendar', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'variantId', variant.id,
      'platform', variant.platform, 'caption', variant.caption,
      'calendarStatus', calendar.status, 'scheduledFor', calendar.scheduled_for,
      'timezone', calendar.timezone, 'publishedAt', calendar.published_at
    ) order by calendar.scheduled_for nulls last)
      from public.veroxa_content_calendar calendar
      join public.veroxa_content_variants variant on variant.id = calendar.variant_id
      join public.veroxa_content_items item on item.id = variant.content_item_id
      where calendar.restaurant_id = target_restaurant_id
        and variant.status = 'approved'
        and item.status = 'approved'
        and (
          (calendar.status = 'published' and calendar.published_at is not null)
          or
          (calendar.status in ('approved','queued','publishing')
            and calendar.scheduled_for is not null
            and calendar.scheduled_for > now()
            and calendar.timezone = 'America/Chicago'
            and veroxa_private.variant_owner_confirmation_satisfied(
              variant.id, target_restaurant_id)
            and veroxa_private.content_inputs_current_v1(
              item.id, target_restaurant_id, variant.platform)
            and veroxa_private.content_claims_supported_v1(
              item.id, target_restaurant_id, variant.caption)
            and veroxa_private.content_media_valid_at_v1(
              item.id, target_restaurant_id, variant.platform,
              calendar.scheduled_for)
            and exists (
              select 1 from public.veroxa_approvals approval
              where approval.restaurant_id = target_restaurant_id
                and approval.subject_type in ('content_variant','publish')
                and approval.subject_id = variant.id
                and approval.approval_kind = 'publishing'
                and approval.status = 'approved'
                and approval.subject_snapshot_sha256 =
                  veroxa_private.confirmation_snapshot_sha256_v1(
                    veroxa_private.approval_subject_snapshot_v1(
                      target_restaurant_id, approval.subject_type, variant.id))
            ))
        )), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(jsonb_build_object(
      'id', report.id, 'reportType', report.report_type,
      'periodStart', report.period_start, 'periodEnd', report.period_end,
      'summary', report.summary, 'status', report.status,
      'approvedAt', report.approved_at, 'publishedAt', report.published_at,
      'updatedAt', report.updated_at
    ) order by report.period_end desc)
      from public.veroxa_reports report
      where report.restaurant_id = target_restaurant_id
        and report.status = 'approved'), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.veroxa_momo_client_snapshot_v1(uuid)
  from public, anon;
grant execute on function public.veroxa_momo_client_snapshot_v1(uuid)
  to authenticated;

create or replace function public.veroxa_momo_readiness_summary_v1(
  target_restaurant_id uuid
)
returns table (
  required_count integer,
  verified_count integer,
  blocker_count integer,
  overall_status public.veroxa_readiness_status_v1,
  can_activate boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with summary as (
    select count(*) filter (where dimension.required)::integer as required_count,
      count(*) filter (where dimension.required and dimension.status = 'verified')::integer as verified_count,
      count(*) filter (where dimension.required and (
        dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0))::integer as blocker_count
    from public.veroxa_readiness_dimensions dimension
    where dimension.restaurant_id = target_restaurant_id
      and public.veroxa_current_user_is_team_for_restaurant(target_restaurant_id)
  )
  select summary.required_count, summary.verified_count,
    greatest(summary.blocker_count, case when summary.required_count > 0 then 1 else 0 end),
    case when summary.required_count = 0
      then 'not_started'::public.veroxa_readiness_status_v1
      else 'blocked'::public.veroxa_readiness_status_v1 end,
    false
  from summary;
$$;
revoke all on function public.veroxa_momo_readiness_summary_v1(uuid)
  from public, anon;
grant execute on function public.veroxa_momo_readiness_summary_v1(uuid)
  to authenticated;

comment on function public.veroxa_provider_preflight_v1(uuid, text, text) is
  'Read-only fail-closed preflight. Never reads credentials and never calls Meta or Google.';
comment on function public.veroxa_queue_momo_publication_v1(uuid, uuid, uuid, uuid) is
  'Creates prepared-only approved metadata. Provider execution is hard-blocked in this zero-cost rehearsal.';
