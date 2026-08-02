-- Momo upload-to-Ready production pipeline v1.
-- The only enabled scope is Momo's House San Antonio / Team Faraz.
-- This release can verify uploads and create/approve private content packages.
-- Every external publishing path remains disabled at the database boundary.

create extension if not exists pgcrypto;
create schema if not exists veroxa_private;
revoke all on schema veroxa_private from public, anon, authenticated, service_role;

-- Refuse to apply a posting-off release over an active or historical public
-- execution row. Production was verified empty before this migration.
do $$
begin
  if exists (
       select 1 from public.veroxa_publish_queue queue
       join veroxa_private.operational_restaurant_scope scope
         on scope.restaurant_id = queue.restaurant_id
       where scope.scope_key = 'momo_house_san_antonio'
     )
     or exists (
       select 1 from public.veroxa_publish_attempts attempt
       join veroxa_private.operational_restaurant_scope scope
         on scope.restaurant_id = attempt.restaurant_id
       where scope.scope_key = 'momo_house_san_antonio'
     )
     or exists (
       select 1 from public.veroxa_content_calendar calendar
       join veroxa_private.operational_restaurant_scope scope
         on scope.restaurant_id = calendar.restaurant_id
       where scope.scope_key = 'momo_house_san_antonio'
         and (calendar.status not in ('draft','awaiting_approval','approved','cancelled')
           or calendar.published_at is not null)
     )
     or exists (
       select 1 from public.veroxa_media_usage usage
       join veroxa_private.operational_restaurant_scope scope
         on scope.restaurant_id = usage.restaurant_id
       where scope.scope_key = 'momo_house_san_antonio'
         and (usage.usage_kind = 'published' or usage.external_reference is not null)
     ) then
    raise exception using errcode = '55000',
      message = 'momo_posting_rows_must_be_empty_before_upload_to_ready_release';
  end if;
end;
$$;

-- -----------------------------------------------------------------------
-- Posting-off boundary
-- -----------------------------------------------------------------------

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
begin
  if not exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id = p_restaurant_id
      and scope.scope_key = 'momo_house_san_antonio'
  ) then
    raise exception using errcode = '42501',
      message = 'momo_operational_scope_required';
  end if;
  raise exception using errcode = '55000',
    message = 'momo_external_posting_disabled_upload_to_ready_only';
end;
$$;
revoke all on function public.veroxa_queue_momo_publication_v1(uuid,uuid,uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.reject_momo_external_publication_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id = new.restaurant_id
      and scope.scope_key = 'momo_house_san_antonio'
  ) then
    raise exception using errcode = '55000',
      message = 'momo_external_posting_disabled_upload_to_ready_only';
  end if;
  if tg_op = 'UPDATE' and exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id = old.restaurant_id
      and scope.scope_key = 'momo_house_san_antonio'
  ) then
    raise exception using errcode = '55000',
      message = 'momo_external_posting_disabled_upload_to_ready_only';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.reject_momo_external_publication_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_publish_queue_posting_off on public.veroxa_publish_queue;
create trigger veroxa_publish_queue_posting_off
before insert or update on public.veroxa_publish_queue
for each row execute function veroxa_private.reject_momo_external_publication_v1();
drop trigger if exists veroxa_publish_attempts_posting_off on public.veroxa_publish_attempts;
create trigger veroxa_publish_attempts_posting_off
before insert or update on public.veroxa_publish_attempts
for each row execute function veroxa_private.reject_momo_external_publication_v1();

create or replace function veroxa_private.guard_momo_calendar_prepared_only_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
revoke all on function veroxa_private.guard_momo_calendar_prepared_only_v1()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_calendar_prepared_only on public.veroxa_content_calendar;
create trigger veroxa_calendar_prepared_only
before insert or update on public.veroxa_content_calendar
for each row execute function veroxa_private.guard_momo_calendar_prepared_only_v1();

create or replace function veroxa_private.guard_momo_media_usage_prepared_only_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
revoke all on function veroxa_private.guard_momo_media_usage_prepared_only_v1()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_media_usage_prepared_only on public.veroxa_media_usage;
create trigger veroxa_media_usage_prepared_only
before insert or update on public.veroxa_media_usage
for each row execute function veroxa_private.guard_momo_media_usage_prepared_only_v1();

update public.veroxa_momo_runtime_controls
set provider_writes = false,
    review_replies = false,
    website_writes = false,
    external_scheduling = false,
    updated_at = clock_timestamp()
where restaurant_id in (
  select scope.restaurant_id
  from veroxa_private.operational_restaurant_scope scope
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
);

-- -----------------------------------------------------------------------
-- Server-verified upload intake
-- -----------------------------------------------------------------------

create table public.veroxa_momo_media_intake_verifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null references public.veroxa_media_assets(id) on delete cascade,
  storage_path text not null,
  storage_object_id uuid not null,
  storage_object_version text not null,
  declared_mime_type text not null,
  detected_mime_type text not null check (detected_mime_type = 'image/jpeg'),
  file_size bigint not null check (file_size between 10240 and 5242880),
  width integer not null check (width between 320 and 12000),
  height integer not null check (height between 250 and 12000),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  verifier_version text not null check (verifier_version = 'momo-image-byte-verifier-2026-07-31-v1'),
  verification_snapshot jsonb not null check (jsonb_typeof(verification_snapshot) = 'object'),
  verification_sha256 text not null check (verification_sha256 ~ '^[0-9a-f]{64}$'),
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  status text not null check (status = 'verified'),
  failure_codes jsonb not null default '[]'::jsonb check (failure_codes = '[]'::jsonb),
  initiated_by uuid not null references public.veroxa_user_profiles(user_id),
  verified_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, asset_id),
  unique (restaurant_id, idempotency_hash),
  unique (storage_object_id, storage_object_version),
  check (width::numeric / height::numeric between 0.8 and 1.91)
);

revoke all on function public.veroxa_record_momo_original_metadata_v1(uuid,uuid,text,integer,integer)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_actor_has_operational_membership_v1(
  p_restaurant_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_actor_id is not null and exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    join public.veroxa_restaurants restaurant on restaurant.id = scope.restaurant_id
    join public.veroxa_restaurant_members member
      on member.restaurant_id = scope.restaurant_id and member.user_id = p_actor_id
    join public.veroxa_user_profiles profile on profile.user_id = member.user_id
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled and scope.restaurant_id = p_restaurant_id
      and restaurant.status = 'active'
      and member.status = 'active' and profile.status = 'active'
      and member.role = profile.role
      and profile.role in ('client','team')
  );
$$;
revoke all on function veroxa_private.momo_actor_has_operational_membership_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_finalize_momo_media_intake_v1(
  p_restaurant_id uuid,
  p_asset_id uuid,
  p_storage_object_id uuid,
  p_storage_object_version text,
  p_detected_mime text,
  p_file_size bigint,
  p_width integer,
  p_height integer,
  p_content_sha256 text,
  p_verification_snapshot jsonb,
  p_verification_canonical text,
  p_verification_sha256 text,
  p_idempotency_hash text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.veroxa_media_assets%rowtype;
  object_record record;
  existing public.veroxa_momo_media_intake_verifications%rowtype;
  verification_id uuid;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'momo_upload_member_required';
  end if;
  if p_detected_mime <> 'image/jpeg'
     or p_content_sha256 !~ '^[0-9a-f]{64}$'
     or p_verification_sha256 !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_file_size not between 10240 and 5242880
     or p_width not between 320 and 12000
     or p_height not between 250 and 12000
     or p_width::numeric / p_height::numeric not between 0.8 and 1.91
     or jsonb_typeof(p_verification_snapshot) is distinct from 'object'
     or p_verification_canonical::jsonb is distinct from p_verification_snapshot
     or p_verification_sha256 is distinct from encode(
       extensions.digest(convert_to(p_verification_canonical, 'UTF8'), 'sha256'), 'hex'
     ) then
    raise exception using errcode = '22023', message = 'invalid_momo_upload_verification';
  end if;
  select * into asset from public.veroxa_media_assets
  where id = p_asset_id and restaurant_id = p_restaurant_id for update;
  if not found or asset.mime_type is distinct from p_detected_mime
     or asset.file_size is distinct from p_file_size then
    raise exception using errcode = '23514', message = 'momo_upload_asset_metadata_mismatch';
  end if;
  select object.id, object.version, object.metadata into object_record
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = asset.storage_path
    and object.id = p_storage_object_id;
  if not found
     or object_record.version is null
     or object_record.version is distinct from p_storage_object_version
     or coalesce(object_record.metadata ->> 'mimetype', '') is distinct from p_detected_mime
     or (case when coalesce(object_record.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
       then (object_record.metadata ->> 'size')::numeric is distinct from p_file_size::numeric
       else true end) then
    raise exception using errcode = '23514', message = 'momo_upload_storage_object_mismatch';
  end if;
  select * into existing from public.veroxa_momo_media_intake_verifications
  where restaurant_id = p_restaurant_id and asset_id = p_asset_id for update;
  if found then
    if existing.idempotency_hash = p_idempotency_hash
       and existing.storage_object_id = p_storage_object_id
       and existing.storage_object_version = p_storage_object_version
       and existing.content_sha256 = p_content_sha256
       and existing.verification_sha256 = p_verification_sha256 then
      return existing.id;
    end if;
    raise exception using errcode = '23505', message = 'momo_upload_verification_immutable_conflict';
  end if;
  if (asset.content_sha256 is not null and asset.content_sha256 <> p_content_sha256)
     or (asset.width is not null and asset.width <> p_width)
     or (asset.height is not null and asset.height <> p_height) then
    raise exception using errcode = '23505', message = 'momo_upload_asset_hash_immutable_conflict';
  end if;
  insert into public.veroxa_momo_media_intake_verifications (
    restaurant_id, asset_id, storage_path, storage_object_id,
    storage_object_version, declared_mime_type, detected_mime_type,
    file_size, width, height, content_sha256, verifier_version,
    verification_snapshot, verification_sha256, idempotency_hash,
    status, initiated_by
  ) values (
    p_restaurant_id, p_asset_id, asset.storage_path, p_storage_object_id,
    p_storage_object_version, asset.mime_type, p_detected_mime,
    p_file_size, p_width, p_height, p_content_sha256,
    'momo-image-byte-verifier-2026-07-31-v1', p_verification_snapshot,
    p_verification_sha256, p_idempotency_hash, 'verified', p_actor_id
  ) returning id into verification_id;
  update public.veroxa_media_assets
  set content_sha256 = coalesce(content_sha256, p_content_sha256),
      width = coalesce(width, p_width),
      height = coalesce(height, p_height),
      updated_at = clock_timestamp()
  where id = p_asset_id;
  return verification_id;
end;
$$;
revoke all on function public.veroxa_finalize_momo_media_intake_v1(
  uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_finalize_momo_media_intake_v1(
  uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid
) to service_role;

-- -----------------------------------------------------------------------
-- Aggregate Momo AI authorization envelope (USD 100 maximum)
-- -----------------------------------------------------------------------

create table veroxa_private.momo_ai_budget_controls (
  restaurant_id uuid primary key references public.veroxa_restaurants(id) on delete cascade,
  enabled boolean not null default true,
  authorization_cap_microusd bigint not null check (authorization_cap_microusd = 100000000),
  scope_key text not null check (scope_key = 'momo-upload-to-ready-v1'),
  external_publishing_authorized boolean not null default false check (not external_publishing_authorized),
  authorized_by uuid not null references public.veroxa_user_profiles(user_id),
  authorized_at timestamptz not null,
  updated_at timestamptz not null default clock_timestamp()
);

create table veroxa_private.momo_ai_cost_ledger (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  operation_kind text not null check (operation_kind in ('media_enhancement','content_package')),
  source_id uuid not null,
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('reserved','settled','released','uncertain')),
  provider_called boolean not null default false,
  reserved_microusd bigint not null check (reserved_microusd between 1 and 20000000),
  accounted_microusd bigint check (accounted_microusd is null or accounted_microusd between 0 and 100000000),
  accounting_basis text check (accounting_basis is null or accounting_basis in ('provider_usage_estimate','conservative_reservation','zero_pre_provider')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (operation_kind, source_id),
  unique (restaurant_id, operation_kind, idempotency_hash),
  check (coalesce(
    (state = 'reserved' and accounted_microusd is null and accounting_basis is null)
    or (state = 'settled' and (
      (accounting_basis = 'provider_usage_estimate' and accounted_microusd between 1 and 100000000)
      or (accounting_basis = 'conservative_reservation' and accounted_microusd between 1 and reserved_microusd)
    ))
    or (state = 'released' and not provider_called and accounted_microusd = 0 and accounting_basis = 'zero_pre_provider')
    or (state = 'uncertain' and provider_called and accounted_microusd = reserved_microusd and accounting_basis = 'conservative_reservation'),
    false
  ))
);

revoke all on table veroxa_private.momo_ai_budget_controls,
  veroxa_private.momo_ai_cost_ledger
  from public, anon, authenticated, service_role;
alter table veroxa_private.momo_ai_budget_controls enable row level security;
alter table veroxa_private.momo_ai_budget_controls force row level security;
alter table veroxa_private.momo_ai_cost_ledger enable row level security;
alter table veroxa_private.momo_ai_cost_ledger force row level security;

create or replace function veroxa_private.momo_ai_committed_microusd_v1(
  p_restaurant_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(
    case when ledger.accounted_microusd is null
      then ledger.reserved_microusd else ledger.accounted_microusd end
  ), 0)::bigint
  from veroxa_private.momo_ai_cost_ledger ledger
  where ledger.restaurant_id = p_restaurant_id
    and ledger.state in ('reserved','settled','uncertain');
$$;
revoke all on function veroxa_private.momo_ai_committed_microusd_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.guard_momo_media_ai_aggregate_budget_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare control veroxa_private.momo_ai_budget_controls%rowtype;
begin
  select * into control from veroxa_private.momo_ai_budget_controls
  where restaurant_id = new.restaurant_id for update;
  if not found or not control.enabled
     or veroxa_private.momo_ai_committed_microusd_v1(new.restaurant_id)
        + new.reserved_microusd > control.authorization_cap_microusd then
    raise exception using errcode = '23514', message = 'momo_ai_aggregate_budget_exhausted';
  end if;
  if new.evidence_class <> 'real_owner'
     or new.source_mime_type <> 'image/jpeg'
     or new.source_file_size not between 10240 and 5242880
     or not exists (
       select 1
       from public.veroxa_momo_media_intake_verifications intake
       where intake.restaurant_id = new.restaurant_id
         and intake.asset_id = new.source_asset_id
         and intake.status = 'verified'
         and intake.storage_path = new.source_storage_path
         and intake.storage_object_id = new.source_storage_object_id
         and intake.storage_object_version = new.source_storage_object_version
         and intake.detected_mime_type = new.source_mime_type
         and intake.file_size = new.source_file_size
         and intake.content_sha256 = new.source_content_sha256
     ) then
    raise exception using errcode = '23514', message = 'momo_media_ai_verified_real_owner_source_required';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.guard_momo_media_ai_aggregate_budget_v1()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_media_ai_aggregate_budget_guard
  on public.veroxa_momo_media_ai_candidates;
create trigger veroxa_media_ai_aggregate_budget_guard
before insert on public.veroxa_momo_media_ai_candidates
for each row execute function veroxa_private.guard_momo_media_ai_aggregate_budget_v1();

create or replace function veroxa_private.sync_momo_media_ai_cost_ledger_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_state text; target_accounted bigint; target_basis text;
begin
  if new.status = 'failed' and not new.provider_called then
    target_state := 'released'; target_accounted := 0; target_basis := 'zero_pre_provider';
  elsif new.status = 'failed' and new.provider_called then
    target_state := 'uncertain'; target_accounted := new.reserved_microusd;
    target_basis := 'conservative_reservation';
  elsif new.accounted_microusd is not null then
    target_state := 'settled'; target_accounted := new.accounted_microusd;
    target_basis := new.accounting_basis;
  else
    target_state := 'reserved'; target_accounted := null; target_basis := null;
  end if;
  insert into veroxa_private.momo_ai_cost_ledger (
    restaurant_id, operation_kind, source_id, idempotency_hash, state,
    provider_called, reserved_microusd, accounted_microusd, accounting_basis
  ) values (
    new.restaurant_id, 'media_enhancement', new.id, new.idempotency_hash,
    target_state, new.provider_called, new.reserved_microusd,
    target_accounted, target_basis
  ) on conflict (operation_kind, source_id) do update
    set state = excluded.state, provider_called = excluded.provider_called,
        accounted_microusd = excluded.accounted_microusd,
        accounting_basis = excluded.accounting_basis,
        updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function veroxa_private.sync_momo_media_ai_cost_ledger_v1()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_media_ai_cost_ledger_sync
  on public.veroxa_momo_media_ai_candidates;
create trigger veroxa_media_ai_cost_ledger_sync
after insert or update of status,provider_called,accounted_microusd,accounting_basis
on public.veroxa_momo_media_ai_candidates
for each row execute function veroxa_private.sync_momo_media_ai_cost_ledger_v1();

-- -----------------------------------------------------------------------
-- Content AI generation lifecycle
-- -----------------------------------------------------------------------

create table public.veroxa_momo_content_ai_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  source_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  intake_verification_id uuid not null references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  source_storage_path text not null,
  source_storage_object_id uuid not null,
  source_storage_object_version text not null,
  source_mime_type text not null check (source_mime_type = 'image/jpeg'),
  source_file_size bigint not null check (source_file_size between 10240 and 5242880),
  source_width integer not null check (source_width between 320 and 12000),
  source_height integer not null check (source_height between 250 and 12000),
  source_content_sha256 text not null check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  rights_id uuid not null references public.veroxa_media_rights(id) on delete restrict,
  rights_attestation_sha256 text not null check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  review_id uuid not null references public.veroxa_media_reviews(id) on delete restrict,
  truth_snapshot jsonb not null check (
    jsonb_typeof(truth_snapshot) = 'array'
    and jsonb_array_length(truth_snapshot) > 0
    and octet_length(truth_snapshot::text) <= 32768
  ),
  truth_snapshot_sha256 text not null check (truth_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  target_platforms jsonb not null check (
    jsonb_typeof(target_platforms) = 'array'
    and jsonb_array_length(target_platforms) between 1 and 3
    and target_platforms <@ '["facebook","instagram","google_business"]'::jsonb
  ),
  model text not null check (model = 'gpt-5.6-sol'),
  reasoning_effort text not null check (reasoning_effort = 'high'),
  prompt_version text not null check (prompt_version = 'momo-content-package-2026-08-01-v3'),
  schema_version text not null check (schema_version = 'momo-content-package-v1'),
  validator_version text not null check (validator_version = 'momo-content-validator-2026-08-01-v3'),
  pricing_version text not null check (pricing_version = 'openai-gpt-5.6-sol-2026-08-01-v2'),
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  client_request_hash text not null check (client_request_hash ~ '^[0-9a-f]{64}$'),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'reserved' check (status in ('reserved','provider_running','pending_review','materialized','rejected','failed')),
  requested_by uuid not null references public.veroxa_user_profiles(user_id),
  requested_at timestamptz not null default clock_timestamp(),
  provider_called boolean not null default false,
  provider_started_at timestamptz,
  provider_response_id text unique,
  provider_usage jsonb check (provider_usage is null or jsonb_typeof(provider_usage) = 'object'),
  reserved_microusd bigint not null check (reserved_microusd = 5000000),
  accounted_microusd bigint check (accounted_microusd is null or accounted_microusd between 0 and 100000000),
  accounting_basis text check (accounting_basis is null or accounting_basis in ('zero_pre_provider','provider_usage_estimate','conservative_reservation')),
  output_payload jsonb check (output_payload is null or jsonb_typeof(output_payload) = 'object'),
  output_canonical text check (output_canonical is null or char_length(output_canonical) between 2 and 262144),
  output_sha256 text check (output_sha256 is null or output_sha256 ~ '^[0-9a-f]{64}$'),
  validation_report jsonb check (validation_report is null or jsonb_typeof(validation_report) = 'object'),
  validation_canonical text check (validation_canonical is null or char_length(validation_canonical) between 2 and 262144),
  validation_sha256 text check (validation_sha256 is null or validation_sha256 ~ '^[0-9a-f]{64}$'),
  provider_error_code text check (provider_error_code is null or provider_error_code ~ '^[a-z0-9_]{3,80}$'),
  completed_at timestamptz,
  team_decided_by uuid references public.veroxa_user_profiles(user_id),
  team_decided_at timestamptz,
  decision_notes text check (decision_notes is null or char_length(btrim(decision_notes)) between 10 and 1000),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  updated_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, idempotency_hash),
  check (source_width::numeric / source_height::numeric between 0.8 and 1.91),
  check (coalesce((
    (status = 'reserved'
      and not provider_called and provider_started_at is null
      and provider_response_id is null and provider_usage is null
      and output_payload is null and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null and validation_sha256 is null
      and provider_error_code is null and accounted_microusd is null and accounting_basis is null
      and completed_at is null and team_decided_by is null and team_decided_at is null and decision_notes is null)
    or (status = 'provider_running'
      and provider_called and provider_started_at is not null
      and provider_response_id is null and provider_usage is null
      and output_payload is null and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null and validation_sha256 is null
      and provider_error_code is null and accounted_microusd is null and accounting_basis is null
      and completed_at is null and team_decided_by is null and team_decided_at is null and decision_notes is null)
    or (status = 'pending_review'
      and provider_called and provider_started_at is not null and provider_response_id is not null
      and output_payload is not null and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in ('provider_usage_estimate','conservative_reservation') and completed_at is not null
      and team_decided_by is null and team_decided_at is null and decision_notes is null)
    or (status = 'materialized'
      and provider_called and provider_started_at is not null and provider_response_id is not null
      and output_payload is not null and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in ('provider_usage_estimate','conservative_reservation') and completed_at is not null
      and team_decided_by is not null and team_decided_at is not null and decision_notes is null)
    or (status = 'rejected'
      and provider_called and provider_started_at is not null and provider_response_id is not null
      and output_payload is not null and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in ('provider_usage_estimate','conservative_reservation') and completed_at is not null
      and team_decided_by is not null and team_decided_at is not null and decision_notes is not null)
    or (status = 'failed'
      and provider_response_id is null
      and output_payload is null and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null and validation_sha256 is null
      and provider_error_code is not null and completed_at is not null
      and team_decided_by is null and team_decided_at is null and decision_notes is null
      and ((provider_called and provider_started_at is not null and (
          (provider_usage is null and accounted_microusd = reserved_microusd and accounting_basis = 'conservative_reservation')
          or (jsonb_typeof(provider_usage) = 'object' and accounted_microusd between 1 and 100000000 and accounting_basis = 'provider_usage_estimate')
        ))
        or (not provider_called and provider_started_at is null and provider_usage is null
          and accounted_microusd = 0 and accounting_basis = 'zero_pre_provider')))
  ), false))
);
create unique index veroxa_momo_content_ai_one_active_asset
  on public.veroxa_momo_content_ai_runs (restaurant_id, source_asset_id)
  where status in ('reserved','provider_running','pending_review');

create or replace function veroxa_private.current_momo_truth_snapshot_v1(
  p_restaurant_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', field.id,
    'fieldKey', field.field_key,
    'value', field.value_json,
    'evidenceClass', field.evidence_class,
    'ownerConfirmedAt', field.owner_confirmed_at
  ) order by field.field_key, field.id), '[]'::jsonb)
  from public.veroxa_restaurant_truth_fields field
  where field.restaurant_id = p_restaurant_id
    and field.is_current
    and field.status = 'owner_confirmed'
    and field.evidence_class = 'real_owner';
$$;
revoke all on function veroxa_private.current_momo_truth_snapshot_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_reserve_momo_content_ai_run_v1(
  p_restaurant_id uuid,
  p_source_asset_id uuid,
  p_idempotency_hash text,
  p_client_request_hash text
)
returns table (
  run_id uuid, run_status text, request_hash text,
  source_storage_path text, source_mime_type text, source_file_size bigint,
  source_content_sha256 text, source_width integer, source_height integer,
  target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text,
  reserved_microusd bigint, output_payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  asset public.veroxa_media_assets%rowtype;
  intake public.veroxa_momo_media_intake_verifications%rowtype;
  rights public.veroxa_media_rights%rowtype;
  review public.veroxa_media_reviews%rowtype;
  control veroxa_private.momo_ai_budget_controls%rowtype;
  existing public.veroxa_momo_content_ai_runs%rowtype;
  stale_run public.veroxa_momo_content_ai_runs%rowtype;
  snapshot jsonb;
  snapshot_hash text;
  platforms jsonb;
  computed_request_hash text;
  new_id uuid;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_client_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '42501', message = 'momo_content_ai_team_required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_source_asset_id::text, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_idempotency_hash, 0
  ));
  select * into control from veroxa_private.momo_ai_budget_controls
  where restaurant_id = p_restaurant_id for update;
  if not found or not control.enabled
     or not exists (
       select 1
       from public.veroxa_restaurant_members authorizer_member
       join public.veroxa_user_profiles authorizer_profile
         on authorizer_profile.user_id = authorizer_member.user_id
       where authorizer_member.restaurant_id = p_restaurant_id
         and authorizer_member.user_id = control.authorized_by
         and authorizer_member.role = 'team'
         and authorizer_member.status = 'active'
         and authorizer_profile.role = 'team'
         and authorizer_profile.status = 'active'
     )
     or not exists (
       select 1 from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = p_restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes and not runtime.review_replies
         and not runtime.website_writes and not runtime.external_scheduling
     )
     or veroxa_private.momo_ai_committed_microusd_v1(p_restaurant_id) + 5000000
        > control.authorization_cap_microusd then
    raise exception using errcode = '23514', message = 'momo_content_ai_budget_or_runtime_unavailable';
  end if;
  for stale_run in
    select run.* from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = p_restaurant_id
      and run.source_asset_id = p_source_asset_id
      and run.status = 'provider_running'
      and run.provider_started_at <= now() - interval '15 minutes'
    for update
  loop
    update public.veroxa_momo_content_ai_runs
    set status = 'failed', provider_error_code = 'provider_result_unknown',
        accounted_microusd = reserved_microusd,
        accounting_basis = 'conservative_reservation',
        completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = stale_run.id;
    update veroxa_private.momo_ai_cost_ledger
    set state = 'uncertain', provider_called = true,
        accounted_microusd = reserved_microusd,
        accounting_basis = 'conservative_reservation', updated_at = clock_timestamp()
    where operation_kind = 'content_package' and source_id = stale_run.id;
  end loop;
  select * into asset from public.veroxa_media_assets
  where id = p_source_asset_id and restaurant_id = p_restaurant_id for share;
  select * into intake from public.veroxa_momo_media_intake_verifications
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id
    and status = 'verified' for share;
  select * into rights from public.veroxa_media_rights
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id for share;
  select * into review from public.veroxa_media_reviews
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id
    and is_current for share;
  if asset.id is null or intake.id is null or rights.id is null or review.id is null
     or asset.status <> 'ready_to_use'
     or asset.mime_type <> 'image/jpeg'
     or asset.file_size not between 10240 and 5242880
     or asset.width not between 320 and 12000
     or asset.height not between 250 and 12000
     or asset.width::numeric / asset.height::numeric not between 0.8 and 1.91
     or asset.content_sha256 is distinct from intake.content_sha256
     or asset.width is distinct from intake.width
     or asset.height is distinct from intake.height
     or asset.storage_path is distinct from intake.storage_path
     or rights.rights_status <> 'confirmed'
     or rights.evidence_class <> 'real_owner'
     or rights.attestation_version <> 'momo-media-rights-v1'
     or rights.attestation_sha256 !~ '^[0-9a-f]{64}$'
     or (rights.valid_from is not null and rights.valid_from > now())
     or (rights.expires_at is not null and rights.expires_at <= now())
     or review.status <> 'approved' or not review.public_use_approved
     or not coalesce(review.quality_score between 80 and 100, false)
     or review.reviewed_by is null or review.reviewed_at is null
     or char_length(btrim(coalesce(review.quality_notes, ''))) < 10 then
    raise exception using errcode = '23514', message = 'momo_content_ai_source_not_ready';
  end if;
  select coalesce(jsonb_agg(platform order by platform), '[]'::jsonb)
  into platforms
  from (
    select distinct value as platform
    from jsonb_array_elements_text(rights.usage_scope)
    where value in ('facebook','instagram','google_business')
  ) scoped;
  if jsonb_array_length(platforms) = 0 then
    raise exception using errcode = '23514', message = 'momo_content_ai_no_authorized_platform';
  end if;
  snapshot := veroxa_private.current_momo_truth_snapshot_v1(p_restaurant_id);
  if jsonb_array_length(snapshot) < 3
     or octet_length(snapshot::text) > 32768
     or not exists (
       select 1 from jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'identity.display_name'
     )
     or not exists (
       select 1 from jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'address.primary'
     )
     or not exists (
       select 1 from jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'identity.cuisine'
     )
     or not exists (
       select 1 from jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'menu.primary'
     ) then
    raise exception using errcode = '23514', message = 'momo_content_ai_owner_truth_incomplete';
  end if;
  snapshot_hash := encode(extensions.digest(convert_to(snapshot::text, 'UTF8'), 'sha256'), 'hex');
  computed_request_hash := encode(extensions.digest(convert_to(concat_ws('|',
    p_client_request_hash, asset.id::text, intake.id::text,
    intake.storage_object_id::text, intake.storage_object_version,
    intake.content_sha256, rights.id::text, rights.attestation_sha256,
    review.id::text, snapshot_hash, platforms::text
  ), 'UTF8'), 'sha256'), 'hex');
  select * into existing from public.veroxa_momo_content_ai_runs
  where restaurant_id = p_restaurant_id and idempotency_hash = p_idempotency_hash
  for update;
  if found then
    if existing.client_request_hash <> p_client_request_hash
       or existing.request_hash <> computed_request_hash then
      raise exception using errcode = '23505', message = 'momo_content_ai_idempotency_conflict';
    end if;
    return query select existing.id, existing.status, existing.request_hash,
      existing.source_storage_path, existing.source_mime_type,
      existing.source_file_size, existing.source_content_sha256,
      existing.source_width, existing.source_height, existing.target_platforms,
      existing.truth_snapshot, existing.truth_snapshot_sha256,
      existing.reserved_microusd, existing.output_payload;
    return;
  end if;
  if exists (
    select 1 from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = p_restaurant_id
      and run.source_asset_id = p_source_asset_id
      and run.status in ('reserved','provider_running','pending_review')
  ) then
    raise exception using errcode = '23505', message = 'momo_content_ai_active_run_exists';
  end if;
  insert into public.veroxa_momo_content_ai_runs (
    restaurant_id, source_asset_id, intake_verification_id,
    source_storage_path, source_storage_object_id, source_storage_object_version,
    source_mime_type, source_file_size, source_width, source_height,
    source_content_sha256, rights_id, rights_attestation_sha256, review_id,
    truth_snapshot, truth_snapshot_sha256, target_platforms, model,
    reasoning_effort, prompt_version, schema_version, validator_version,
    pricing_version, idempotency_hash, client_request_hash, request_hash,
    requested_by, reserved_microusd
  ) values (
    p_restaurant_id, p_source_asset_id, intake.id, asset.storage_path,
    intake.storage_object_id, intake.storage_object_version, asset.mime_type,
    asset.file_size, asset.width, asset.height, asset.content_sha256,
    rights.id, rights.attestation_sha256, review.id, snapshot, snapshot_hash,
    platforms, 'gpt-5.6-sol', 'high',
    'momo-content-package-2026-08-01-v3', 'momo-content-package-v1',
    'momo-content-validator-2026-08-01-v3',
    'openai-gpt-5.6-sol-2026-08-01-v2', p_idempotency_hash,
    p_client_request_hash, computed_request_hash, actor_id, 5000000
  ) returning id into new_id;
  insert into veroxa_private.momo_ai_cost_ledger (
    restaurant_id, operation_kind, source_id, idempotency_hash, state,
    provider_called, reserved_microusd
  ) values (
    p_restaurant_id, 'content_package', new_id, p_idempotency_hash,
    'reserved', false, 5000000
  );
  return query select run.id, run.status, run.request_hash,
    run.source_storage_path, run.source_mime_type, run.source_file_size,
    run.source_content_sha256, run.source_width, run.source_height,
    run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
    run.reserved_microusd, run.output_payload
  from public.veroxa_momo_content_ai_runs run where run.id = new_id;
end;
$$;
revoke all on function public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text)
  from public, anon, service_role;
grant execute on function public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text)
  to authenticated;

create or replace function veroxa_private.momo_content_ai_current_evidence_v1(
  p_run_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    join public.veroxa_media_assets asset
      on asset.id = run.source_asset_id and asset.restaurant_id = run.restaurant_id
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = run.intake_verification_id and intake.asset_id = asset.id
    join public.veroxa_media_rights rights
      on rights.id = run.rights_id and rights.asset_id = asset.id
    join public.veroxa_media_reviews review
      on review.id = run.review_id and review.asset_id = asset.id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = run.source_storage_path
     and object.id = run.source_storage_object_id
    where run.id = p_run_id
      and veroxa_private.momo_media_ai_actor_has_operational_team_v1(run.restaurant_id, p_actor_id)
      and asset.status = 'ready_to_use'
      and asset.content_sha256 = run.source_content_sha256
      and asset.storage_path = run.source_storage_path
      and asset.mime_type = run.source_mime_type
      and asset.file_size = run.source_file_size
      and asset.width = run.source_width
      and asset.height = run.source_height
      and run.source_mime_type = 'image/jpeg'
      and run.source_file_size between 10240 and 5242880
      and run.source_width >= 320 and run.source_height >= 250
      and run.source_width::numeric / run.source_height::numeric between 0.8 and 1.91
      and intake.status = 'verified'
      and intake.storage_path = run.source_storage_path
      and intake.storage_object_id = run.source_storage_object_id
      and intake.storage_object_version = run.source_storage_object_version
      and intake.detected_mime_type = run.source_mime_type
      and intake.file_size = run.source_file_size
      and intake.width = run.source_width
      and intake.height = run.source_height
      and intake.content_sha256 = run.source_content_sha256
      and object.version = run.source_storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') = run.source_mime_type
      and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
        then (object.metadata ->> 'size')::numeric = run.source_file_size::numeric
        else false end
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and rights.attestation_sha256 = run.rights_attestation_sha256
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and run.target_platforms <@ rights.usage_scope
      and review.is_current and review.status = 'approved' and review.public_use_approved
      and review.quality_score between 80 and 100
      and review.reviewed_by is not null and review.reviewed_at is not null
      and char_length(btrim(coalesce(review.quality_notes, ''))) >= 10
      and run.truth_snapshot_sha256 = encode(extensions.digest(convert_to(
        veroxa_private.current_momo_truth_snapshot_v1(run.restaurant_id)::text,
        'UTF8'), 'sha256'), 'hex')
  );
$$;
revoke all on function veroxa_private.momo_content_ai_current_evidence_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_start_momo_content_ai_run_v1(
  p_run_id uuid, p_request_hash text, p_actor_id uuid
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
begin
  select * into run from public.veroxa_momo_content_ai_runs
  where id = p_run_id for update;
  if not found or run.request_hash <> p_request_hash
     or not veroxa_private.momo_content_ai_current_evidence_v1(p_run_id, p_actor_id)
     or not exists (
       select 1 from veroxa_private.momo_ai_budget_controls budget
       where budget.restaurant_id = run.restaurant_id and budget.enabled
     )
     or not exists (
       select 1 from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = run.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes and not runtime.review_replies
         and not runtime.website_writes and not runtime.external_scheduling
     ) then
    raise exception using errcode = '42501', message = 'momo_content_ai_lifecycle_rejected';
  end if;
  if run.status = 'provider_running' then
    return query select run.id, false, run.status; return;
  end if;
  if run.status <> 'reserved' then
    return query select run.id, false, run.status; return;
  end if;
  update public.veroxa_momo_content_ai_runs
  set status = 'provider_running', provider_called = true,
      provider_started_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = p_run_id;
  update veroxa_private.momo_ai_cost_ledger
  set provider_called = true, updated_at = clock_timestamp()
  where operation_kind = 'content_package' and source_id = p_run_id;
  return query select p_run_id, true, 'provider_running'::text;
end;
$$;

create or replace function public.veroxa_complete_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_provider_response_id text,
  p_output_payload jsonb,
  p_output_canonical text,
  p_output_sha256 text,
  p_validation_report jsonb,
  p_validation_canonical text,
  p_validation_sha256 text,
  p_accounted_microusd bigint,
  p_accounting_basis text,
  p_provider_usage jsonb,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
begin
  select * into run from public.veroxa_momo_content_ai_runs
  where id = p_run_id for update;
  if not found or run.request_hash <> p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(run.restaurant_id, p_actor_id) then
    raise exception using errcode = '42501', message = 'momo_content_ai_lifecycle_rejected';
  end if;
  if run.status = 'pending_review' then
    if run.provider_response_id = p_provider_response_id
       and run.output_canonical = p_output_canonical
       and run.output_sha256 = p_output_sha256
       and run.validation_canonical = p_validation_canonical
       and run.validation_sha256 = p_validation_sha256
       and run.accounted_microusd = p_accounted_microusd
       and run.accounting_basis = p_accounting_basis
       and run.provider_usage is not distinct from p_provider_usage then return run.id; end if;
    raise exception using errcode = '23505', message = 'momo_content_ai_completion_conflict';
  end if;
  if run.status <> 'provider_running'
     or p_provider_response_id is null or char_length(btrim(p_provider_response_id)) not between 1 and 200
     or jsonb_typeof(p_output_payload) is distinct from 'object'
     or jsonb_typeof(p_validation_report) is distinct from 'object'
     or p_output_canonical::jsonb is distinct from p_output_payload
     or p_validation_canonical::jsonb is distinct from p_validation_report
     or p_output_sha256 is distinct from encode(extensions.digest(convert_to(p_output_canonical, 'UTF8'), 'sha256'), 'hex')
     or p_validation_sha256 is distinct from encode(extensions.digest(convert_to(p_validation_canonical, 'UTF8'), 'sha256'), 'hex')
     or p_validation_report ->> 'validatorVersion' is distinct from 'momo-content-validator-2026-08-01-v3'
     or p_validation_report -> 'passed' is distinct from 'true'::jsonb
     or p_accounted_microusd not between 1 and run.reserved_microusd
     or p_accounting_basis not in ('provider_usage_estimate','conservative_reservation')
     or (p_accounting_basis = 'provider_usage_estimate' and jsonb_typeof(p_provider_usage) is distinct from 'object')
     or (p_accounting_basis = 'conservative_reservation'
       and (p_provider_usage is not null or p_accounted_microusd <> run.reserved_microusd)) then
    raise exception using errcode = '22023', message = 'invalid_momo_content_ai_completion';
  end if;
  if p_accounting_basis = 'provider_usage_estimate' then
    begin
      if (select count(*) from jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023', message = 'invalid_momo_content_ai_completion_usage';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 25000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023', message = 'invalid_momo_content_ai_completion_usage';
      end if;
      expected_microusd := usage_input * (case when usage_input > 272000 then 10 else 5 end)
        + usage_output * (case when usage_input > 272000 then 45 else 30 end);
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and run.reserved_microusd then
        raise exception using errcode = '22023', message = 'invalid_momo_content_ai_completion_cost';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = 'invalid_momo_content_ai_completion_usage';
    end;
  end if;
  update public.veroxa_momo_content_ai_runs
  set status = 'pending_review', provider_response_id = p_provider_response_id,
      provider_usage = p_provider_usage, output_payload = p_output_payload,
      output_canonical = p_output_canonical, output_sha256 = p_output_sha256,
      validation_report = p_validation_report,
      validation_canonical = p_validation_canonical, validation_sha256 = p_validation_sha256,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis, completed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id;
  update veroxa_private.momo_ai_cost_ledger
  set state = 'settled', provider_called = true,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis, updated_at = clock_timestamp()
  where operation_kind = 'content_package' and source_id = p_run_id;
  return p_run_id;
end;
$$;

create or replace function public.veroxa_fail_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_error_code text,
  p_provider_called boolean,
  p_accounted_microusd bigint,
  p_provider_usage jsonb,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  actual_called boolean;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
  target_accounted bigint;
  target_basis text;
  target_state text;
begin
  select * into run from public.veroxa_momo_content_ai_runs
  where id = p_run_id for update;
  if not found or run.request_hash <> p_request_hash
     or p_error_code !~ '^[a-z0-9_]{3,80}$'
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(run.restaurant_id, p_actor_id) then
    raise exception using errcode = '42501', message = 'momo_content_ai_lifecycle_rejected';
  end if;
  actual_called := run.provider_called or p_provider_called;
  if (run.provider_called and not p_provider_called)
     or (not actual_called and (p_accounted_microusd is not null or p_provider_usage is not null)) then
    raise exception using errcode = '23514', message = 'momo_content_ai_failure_state_invalid';
  end if;
  if p_provider_usage is not null then
    begin
      if not actual_called or jsonb_typeof(p_provider_usage) is distinct from 'object'
         or (select count(*) from jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023', message = 'momo_content_ai_failure_usage_invalid';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 128000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023', message = 'momo_content_ai_failure_usage_invalid';
      end if;
      expected_microusd := usage_input * (case when usage_input > 272000 then 10 else 5 end)
        + usage_output * (case when usage_input > 272000 then 45 else 30 end);
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and 100000000 then
        raise exception using errcode = '22023', message = 'momo_content_ai_failure_cost_invalid';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023', message = 'momo_content_ai_failure_usage_invalid';
    end;
    target_accounted := expected_microusd;
    target_basis := 'provider_usage_estimate';
    target_state := 'settled';
  elsif actual_called then
    if p_accounted_microusd is not null then
      raise exception using errcode = '22023', message = 'momo_content_ai_failure_cost_invalid';
    end if;
    target_accounted := run.reserved_microusd;
    target_basis := 'conservative_reservation';
    target_state := 'uncertain';
  else
    target_accounted := 0;
    target_basis := 'zero_pre_provider';
    target_state := 'released';
  end if;
  if run.status = 'failed' then
    if run.provider_error_code = p_error_code
       and run.provider_called = actual_called
       and run.provider_usage is not distinct from p_provider_usage
       and run.accounted_microusd = target_accounted
       and run.accounting_basis = target_basis then return run.id; end if;
    raise exception using errcode = '23505', message = 'momo_content_ai_failure_replay_conflict';
  end if;
  if run.status not in ('reserved','provider_running') then
    raise exception using errcode = '23514', message = 'momo_content_ai_failure_state_invalid';
  end if;
  update public.veroxa_momo_content_ai_runs
  set status = 'failed', provider_called = actual_called,
      provider_error_code = p_error_code,
      provider_usage = p_provider_usage,
      accounted_microusd = target_accounted,
      accounting_basis = target_basis,
      completed_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = p_run_id;
  update veroxa_private.momo_ai_cost_ledger
  set state = target_state, provider_called = actual_called,
      accounted_microusd = target_accounted,
      accounting_basis = target_basis,
      updated_at = clock_timestamp()
  where operation_kind = 'content_package' and source_id = p_run_id;
  return p_run_id;
end;
$$;

create or replace function public.veroxa_reject_momo_content_ai_run_v1(
  p_run_id uuid, p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare run public.veroxa_momo_content_ai_runs%rowtype; actor_id uuid := (select auth.uid());
begin
  select * into run from public.veroxa_momo_content_ai_runs where id = p_run_id for update;
  if not found or not public.veroxa_current_user_is_team_for_restaurant(run.restaurant_id)
     or run.status <> 'pending_review'
     or char_length(btrim(coalesce(p_notes, ''))) not between 10 and 1000 then
    raise exception using errcode = '23514', message = 'invalid_momo_content_ai_rejection';
  end if;
  update public.veroxa_momo_content_ai_runs
  set status = 'rejected', team_decided_by = actor_id,
      team_decided_at = clock_timestamp(), decision_notes = btrim(p_notes),
      updated_at = clock_timestamp()
  where id = p_run_id;
  return p_run_id;
end;
$$;

revoke all on function public.veroxa_start_momo_content_ai_run_v1(uuid,text,uuid),
  public.veroxa_complete_momo_content_ai_run_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid),
  public.veroxa_fail_momo_content_ai_run_v1(uuid,text,text,boolean,bigint,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.veroxa_start_momo_content_ai_run_v1(uuid,text,uuid),
  public.veroxa_complete_momo_content_ai_run_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid),
  public.veroxa_fail_momo_content_ai_run_v1(uuid,text,text,boolean,bigint,jsonb,uuid)
  to service_role;
revoke all on function public.veroxa_reject_momo_content_ai_run_v1(uuid,text)
  from public, anon, service_role;
grant execute on function public.veroxa_reject_momo_content_ai_run_v1(uuid,text)
  to authenticated;

-- -----------------------------------------------------------------------
-- Canonical Team-approved Ready packages
-- -----------------------------------------------------------------------

create table public.veroxa_momo_ready_packages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  content_ai_run_id uuid not null unique references public.veroxa_momo_content_ai_runs(id) on delete restrict,
  source_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  source_storage_path text not null,
  source_storage_object_id uuid not null,
  source_storage_object_version text not null,
  source_mime_type text not null check (source_mime_type = 'image/jpeg'),
  source_file_size bigint not null check (source_file_size between 10240 and 5242880),
  source_width integer not null check (source_width between 320 and 12000),
  source_height integer not null check (source_height between 250 and 12000),
  source_content_sha256 text not null check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  intake_verification_id uuid not null references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  rights_id uuid not null references public.veroxa_media_rights(id) on delete restrict,
  rights_attestation_sha256 text not null check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  review_id uuid not null references public.veroxa_media_reviews(id) on delete restrict,
  truth_snapshot_sha256 text not null check (truth_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  approved_payload jsonb not null check (jsonb_typeof(approved_payload) = 'object'),
  approved_payload_sha256 text not null check (approved_payload_sha256 ~ '^[0-9a-f]{64}$'),
  validation_sha256 text not null check (validation_sha256 ~ '^[0-9a-f]{64}$'),
  schedule_snapshot jsonb not null check (jsonb_typeof(schedule_snapshot) = 'object'),
  schedule_canonical text not null check (char_length(schedule_canonical) between 2 and 4096),
  schedule_sha256 text not null check (schedule_sha256 ~ '^[0-9a-f]{64}$'),
  inspection_attestation_version text not null check (inspection_attestation_version = 'momo-ready-team-inspection-v1'),
  inspection_attestation text not null check (
    inspection_attestation = 'Team Faraz reviewed the final media, factual claims, platform copy, SEO phrases, hashtags, alt text, calls to action, and future America/Chicago plan. This package is ready for manual posting only; no external publishing is authorized.'
  ),
  status text not null check (status = 'ready_to_post'),
  approved_by uuid not null references public.veroxa_user_profiles(user_id),
  ready_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_at timestamptz not null default clock_timestamp(),
  check (source_width::numeric / source_height::numeric between 0.8 and 1.91)
);

create table public.veroxa_momo_ready_package_variants (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  ready_package_id uuid not null references public.veroxa_momo_ready_packages(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','google_business')),
  media_source_kind text not null check (media_source_kind = 'original_accepted'),
  media_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  media_review_id uuid not null references public.veroxa_media_reviews(id) on delete restrict,
  media_storage_path text not null,
  media_storage_object_id uuid not null,
  media_storage_object_version text not null,
  media_mime_type text not null check (media_mime_type = 'image/jpeg'),
  media_file_size bigint not null check (media_file_size between 10240 and 5242880),
  media_width integer not null check (media_width between 320 and 12000),
  media_height integer not null check (media_height between 250 and 12000),
  media_content_sha256 text not null check (media_content_sha256 ~ '^[0-9a-f]{64}$'),
  caption text not null check (char_length(btrim(caption)) between 80 and 1500),
  caption_sha256 text not null check (caption_sha256 ~ '^[0-9a-f]{64}$'),
  hashtags jsonb not null check (
    jsonb_typeof(hashtags) = 'array'
    and ((platform = 'instagram' and jsonb_array_length(hashtags) between 3 and 5)
      or (platform = 'facebook' and jsonb_array_length(hashtags) between 0 and 3)
      or (platform = 'google_business' and jsonb_array_length(hashtags) = 0))
  ),
  seo_phrases jsonb not null check (jsonb_typeof(seo_phrases) = 'array' and jsonb_array_length(seo_phrases) between 3 and 8),
  alt_text text not null check (char_length(btrim(alt_text)) between 30 and 180),
  call_to_action jsonb not null check (jsonb_typeof(call_to_action) = 'object'),
  scheduled_for timestamptz not null,
  timezone text not null check (timezone = 'America/Chicago'),
  status text not null check (status = 'ready_to_post'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_at timestamptz not null default clock_timestamp(),
  unique (ready_package_id, platform),
  check (media_width::numeric / media_height::numeric between 0.8 and 1.91)
);

create or replace function veroxa_private.momo_content_json_text_v1(
  p_value jsonb
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  child jsonb;
  result text := '';
begin
  if p_value is null or jsonb_typeof(p_value) = 'null' then
    return '';
  end if;
  if jsonb_typeof(p_value) in ('string','number','boolean') then
    return coalesce(p_value #>> '{}', '');
  end if;
  if jsonb_typeof(p_value) = 'array' then
    for child in select value from jsonb_array_elements(p_value) loop
      result := concat_ws(' ', nullif(result, ''),
        nullif(veroxa_private.momo_content_json_text_v1(child), ''));
    end loop;
    return btrim(result);
  end if;
  if jsonb_typeof(p_value) = 'object' then
    for child in select value from jsonb_each(p_value) order by key loop
      result := concat_ws(' ', nullif(result, ''),
        nullif(veroxa_private.momo_content_json_text_v1(child), ''));
    end loop;
    return btrim(result);
  end if;
  return '';
end;
$$;

create or replace function veroxa_private.momo_content_tokens_v1(
  p_text text
)
returns text[]
language sql
immutable
set search_path = ''
as $$
  with pieces as (
    select token, ordinal
    from pg_catalog.regexp_split_to_table(
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(p_text, '')), '[^a-z0-9]+', ' ', 'g'),
      '[[:space:]]+'
    ) with ordinality as split(token, ordinal)
    where pg_catalog.char_length(token) > 1
  ), first_occurrence as (
    select token, min(ordinal) as ordinal
    from pieces group by token
  )
  select coalesce(pg_catalog.array_agg(token order by ordinal), array[]::text[])
  from first_occurrence;
$$;

create or replace function veroxa_private.momo_content_pascal_v1(
  p_words text[]
)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(pg_catalog.string_agg(
    pg_catalog.upper(pg_catalog.left(word, 1)) || pg_catalog.substr(word, 2),
    '' order by ordinal
  ), '')
  from pg_catalog.unnest(coalesce(p_words, array[]::text[]))
    with ordinality as words(word, ordinal);
$$;

create or replace function veroxa_private.momo_content_exact_occurrence_count_v1(
  p_text text,
  p_exact text
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_text is null or p_exact is null or p_exact = '' then 0
    else ((char_length(p_text) - char_length(replace(p_text, p_exact, '')))
      / char_length(p_exact))::integer
  end;
$$;

create or replace function veroxa_private.momo_content_repeated_copy_v1(
  p_text text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with sentence_values as (
    select sentence, sentence_ordinal
    from pg_catalog.regexp_split_to_table(coalesce(p_text, ''), '[.!?]+')
      with ordinality source(sentence, sentence_ordinal)
  ), normalized_sentences as (
    select sentence_ordinal,
      coalesce(pg_catalog.string_agg(token, ' ' order by token_ordinal), '') as normalized
    from sentence_values
    cross join lateral pg_catalog.regexp_split_to_table(
      pg_catalog.regexp_replace(pg_catalog.lower(sentence), '[^a-z0-9]+', ' ', 'g'),
      '[[:space:]]+'
    ) with ordinality words(token, token_ordinal)
    where pg_catalog.char_length(token) > 1
    group by sentence_ordinal
  ), copy_tokens as (
    select token, token_ordinal
    from pg_catalog.regexp_split_to_table(
      pg_catalog.regexp_replace(pg_catalog.lower(coalesce(p_text, '')), '[^a-z0-9]+', ' ', 'g'),
      '[[:space:]]+'
    ) with ordinality words(token, token_ordinal)
    where pg_catalog.char_length(token) > 1
  ), bigrams as (
    select left_token.token || ' ' || right_token.token as bigram
    from copy_tokens left_token
    join copy_tokens right_token
      on right_token.token_ordinal = left_token.token_ordinal + 1
  )
  select exists (
    select 1 from normalized_sentences
    where char_length(normalized) >= 12
    group by normalized having count(*) > 1
  ) or exists (
    select 1 from bigrams group by bigram having count(*) > 2
  );
$$;

create or replace function veroxa_private.momo_content_allowed_hashtags_v1(
  p_truth_snapshot jsonb
)
returns table (tag text, kind text, truth_field_ids text[])
language plpgsql
immutable
set search_path = ''
as $$
declare
  brand jsonb;
  cuisine jsonb;
  locality jsonb;
  menu jsonb;
  brand_words text[] := array[]::text[];
  cuisine_words text[] := array[]::text[];
  locality_words text[] := array[]::text[];
  dish_words text[] := array[]::text[];
  locality_text text;
begin
  if jsonb_typeof(p_truth_snapshot) is distinct from 'array' then return; end if;
  select value into brand from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'identity.display_name' order by ordinal limit 1;
  select value into cuisine from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'identity.cuisine' order by ordinal limit 1;
  select value into locality from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'address.primary' order by ordinal limit 1;
  select value into menu from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'menu.primary' order by ordinal limit 1;

  if brand is not null then
    select coalesce(array_agg(word order by ordinal), array[]::text[]) into brand_words
    from unnest(veroxa_private.momo_content_tokens_v1(
      veroxa_private.momo_content_json_text_v1(brand -> 'value')
    )) with ordinality words(word, ordinal)
    where word <> 'the';
  end if;
  if cuisine is not null then
    select coalesce(array_agg(word order by ordinal), array[]::text[]) into cuisine_words
    from unnest(veroxa_private.momo_content_tokens_v1(
      veroxa_private.momo_content_json_text_v1(cuisine -> 'value')
    )) with ordinality words(word, ordinal)
    where word <> all(array['cuisine','food','restaurant','the']::text[]);
  end if;
  if locality is not null then
    locality_text := veroxa_private.momo_content_json_text_v1(locality -> 'value');
    if locality_text ~* 'san[[:space:]]+antonio' then
      locality_words := array['san','antonio']::text[];
    else
      select coalesce(array_agg(word order by ordinal), array[]::text[]) into locality_words
      from (
        select word, ordinal
        from unnest(veroxa_private.momo_content_tokens_v1(locality_text))
          with ordinality words(word, ordinal)
        where word <> all(array['street','road','avenue','suite','texas','tx']::text[])
        order by ordinal limit 2
      ) scoped;
    end if;
  end if;
  if menu is not null then
    select coalesce(array_agg(word order by ordinal), array[]::text[]) into dish_words
    from (
      select word, ordinal
      from unnest(veroxa_private.momo_content_tokens_v1(
        veroxa_private.momo_content_json_text_v1(menu -> 'value')
      )) with ordinality words(word, ordinal)
      where word <> all(array['and','menu','snack','snacks','food','cuisine','the']::text[])
      order by ordinal limit 2
    ) scoped;
  end if;

  if cardinality(brand_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(brand_words[1:4]);
    kind := 'brand'; truth_field_ids := array[brand ->> 'id']; return next;
  end if;
  if cardinality(locality_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(locality_words);
    kind := 'locality'; truth_field_ids := array[locality ->> 'id']; return next;
  end if;
  if cardinality(cuisine_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(cuisine_words[1:2]) || 'Food';
    kind := 'cuisine'; truth_field_ids := array[cuisine ->> 'id']; return next;
  end if;
  if cardinality(dish_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(dish_words[1:1]);
    kind := 'dish'; truth_field_ids := array[menu ->> 'id']; return next;
  end if;
  if cardinality(dish_words) > 0 and cardinality(locality_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(dish_words[1:1])
      || veroxa_private.momo_content_pascal_v1(locality_words);
    kind := 'dish'; truth_field_ids := array[menu ->> 'id', locality ->> 'id']; return next;
  end if;
  if cardinality(cuisine_words) > 0 and cardinality(locality_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(cuisine_words[1:1]) || 'Food'
      || veroxa_private.momo_content_pascal_v1(locality_words);
    kind := 'cuisine'; truth_field_ids := array[cuisine ->> 'id', locality ->> 'id']; return next;
  end if;
  if cardinality(brand_words) > 0 and cardinality(locality_words) > 0 then
    tag := '#' || veroxa_private.momo_content_pascal_v1(brand_words[1:3])
      || veroxa_private.momo_content_pascal_v1(locality_words);
    kind := 'brand'; truth_field_ids := array[brand ->> 'id', locality ->> 'id']; return next;
  end if;
end;
$$;

create or replace function veroxa_private.momo_content_allowed_seo_phrases_v1(
  p_truth_snapshot jsonb
)
returns table (phrase text, kind text, truth_field_ids text[])
language plpgsql
immutable
set search_path = ''
as $$
declare
  brand jsonb;
  cuisine jsonb;
  locality jsonb;
  menu jsonb;
  brand_phrase text;
  locality_phrase text;
  cuisine_phrase text;
  dish_phrase text;
  owner_text text;
  menu_first_segment text;
  candidate text;
  cuisine_words text[] := array[]::text[];
  dish_words text[] := array[]::text[];
begin
  if jsonb_typeof(p_truth_snapshot) is distinct from 'array' then return; end if;
  select value into brand from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'identity.display_name' order by ordinal limit 1;
  select value into cuisine from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'identity.cuisine' order by ordinal limit 1;
  select value into locality from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'address.primary' order by ordinal limit 1;
  select value into menu from jsonb_array_elements(p_truth_snapshot) with ordinality source(value, ordinal)
    where value ->> 'fieldKey' = 'menu.primary' order by ordinal limit 1;

  if brand is not null then
    owner_text := btrim(regexp_replace(
      veroxa_private.momo_content_json_text_v1(brand -> 'value'),
      '[[:space:]]+', ' ', 'g'
    ));
    if char_length(owner_text) between 3 and 80
       and owner_text ~ '^[A-Za-z0-9][A-Za-z0-9&''’. -]+$'
       and owner_text !~* '\m(near[[:space:]]+me|best|number[[:space:]]+one|top[- ]rated|award[- ]winning|most[[:space:]]+popular|cheap|cheapest|lowest[[:space:]]+price|trending|viral)\M'
       and owner_text not like '%#1%' then
      brand_phrase := owner_text;
    end if;
  end if;
  if locality is not null
     and veroxa_private.momo_content_json_text_v1(locality -> 'value') ~* '\msan[[:space:]]+antonio\M' then
    locality_phrase := 'San Antonio';
  end if;
  if cuisine is not null then
    select coalesce(array_agg(word order by ordinal), array[]::text[]) into cuisine_words
    from (
      select word, ordinal
      from unnest(veroxa_private.momo_content_tokens_v1(
        veroxa_private.momo_content_json_text_v1(cuisine -> 'value')
      )) with ordinality words(word, ordinal)
      where word <> all(array['cuisine','food','restaurant','the']::text[])
      order by ordinal limit 3
    ) scoped;
    if cardinality(cuisine_words) > 0 then
      cuisine_phrase := array_to_string(array(
        select upper(left(word, 1)) || substr(word, 2)
        from unnest(cuisine_words) with ordinality words(word, ordinal)
        order by ordinal
      ), ' ');
    end if;
  end if;
  if menu is not null then
    menu_first_segment := btrim(regexp_replace(
      veroxa_private.momo_content_json_text_v1(menu -> 'value'),
      '([[:space:]]+(and|or)[[:space:]]+|[,/&]).*$', '', 'i'
    ));
    select coalesce(array_agg(word order by ordinal), array[]::text[]) into dish_words
    from (
      select word, ordinal
      from unnest(veroxa_private.momo_content_tokens_v1(menu_first_segment))
        with ordinality words(word, ordinal)
      where word <> all(array['menu','snack','snacks','food','cuisine','the']::text[])
      order by ordinal limit 3
    ) scoped;
    if cardinality(dish_words) > 0 then
      dish_phrase := array_to_string(array(
        select upper(left(word, 1)) || substr(word, 2)
        from unnest(dish_words) with ordinality words(word, ordinal)
        order by ordinal
      ), ' ');
    end if;
  end if;

  if brand_phrase is not null then
    phrase := brand_phrase; kind := 'brand';
    truth_field_ids := array[brand ->> 'id']; return next;
  end if;
  if locality_phrase is not null then
    phrase := locality_phrase || ' restaurant'; kind := 'locality';
    truth_field_ids := array[locality ->> 'id']; return next;
    phrase := locality_phrase || ' dining'; kind := 'locality';
    truth_field_ids := array[locality ->> 'id']; return next;
  end if;
  if cuisine_phrase is not null then
    phrase := cuisine_phrase || ' cuisine'; kind := 'cuisine';
    truth_field_ids := array[cuisine ->> 'id']; return next;
    phrase := cuisine_phrase || ' food'; kind := 'cuisine';
    truth_field_ids := array[cuisine ->> 'id']; return next;
  end if;
  if dish_phrase is not null and char_length(dish_phrase) between 3 and 80 then
    phrase := dish_phrase; kind := 'dish';
    truth_field_ids := array[menu ->> 'id']; return next;
  end if;
  if brand_phrase is not null and locality_phrase is not null then
    candidate := brand_phrase || ' ' || locality_phrase;
    if char_length(candidate) between 3 and 80 then
      phrase := candidate; kind := 'brand';
      truth_field_ids := array[brand ->> 'id', locality ->> 'id']; return next;
    end if;
  end if;
  if cuisine_phrase is not null and locality_phrase is not null then
    candidate := cuisine_phrase || ' food in ' || locality_phrase;
    if char_length(candidate) between 3 and 80 then
      phrase := candidate; kind := 'cuisine';
      truth_field_ids := array[cuisine ->> 'id', locality ->> 'id']; return next;
    end if;
  end if;
  if dish_phrase is not null and locality_phrase is not null then
    candidate := dish_phrase || ' in ' || locality_phrase;
    if char_length(candidate) between 3 and 80 then
      phrase := candidate; kind := 'dish';
      truth_field_ids := array[menu ->> 'id', locality ->> 'id']; return next;
    end if;
  end if;
end;
$$;

revoke all on function veroxa_private.momo_content_json_text_v1(jsonb),
  veroxa_private.momo_content_tokens_v1(text),
  veroxa_private.momo_content_pascal_v1(text[]),
  veroxa_private.momo_content_exact_occurrence_count_v1(text,text),
  veroxa_private.momo_content_repeated_copy_v1(text),
  veroxa_private.momo_content_allowed_hashtags_v1(jsonb),
  veroxa_private.momo_content_allowed_seo_phrases_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_content_payload_contract_valid_v1(
  p_payload jsonb,
  p_platforms jsonb,
  p_truth_snapshot jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  variant jsonb;
  payload_entry jsonb;
  platform text;
  seen text[] := array[]::text[];
  material_words text[] := array[]::text[];
  required_field_pattern text;
  cta_kind text;
  cta_text text;
  count_tags integer;
  count_seo integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object'
     or jsonb_typeof(p_payload -> 'schemaVersion') is distinct from 'string'
     or p_payload ->> 'schemaVersion' is distinct from 'momo-content-package-v1'
     or jsonb_typeof(p_platforms) is distinct from 'array'
     or jsonb_typeof(p_truth_snapshot) is distinct from 'array'
     or jsonb_typeof(p_payload -> 'variants') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'seoPhrases') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'hashtags') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'claims') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'uncertainties') is distinct from 'array'
     or jsonb_typeof(p_payload -> 'assetAssessment') is distinct from 'object'
     or jsonb_typeof(p_payload -> 'direction') is distinct from 'object'
     or jsonb_typeof(p_payload -> 'internalMediaTags') is distinct from 'array'
     or jsonb_typeof(p_payload #> '{assetAssessment,qualityIssues}') is distinct from 'array'
     or jsonb_typeof(p_payload #> '{assetAssessment,subject}') is distinct from 'string'
     or jsonb_typeof(p_payload #> '{assetAssessment,visualSummary}') is distinct from 'string'
     or jsonb_typeof(p_payload #> '{direction,pillar}') is distinct from 'string'
     or jsonb_typeof(p_payload #> '{direction,objective}') is distinct from 'string'
     or jsonb_typeof(p_payload #> '{direction,angle}') is distinct from 'string'
     or jsonb_typeof(p_payload #> '{direction,audienceIntent}') is distinct from 'string'
     or jsonb_typeof(p_payload -> 'masterCaption') is distinct from 'string'
     or jsonb_typeof(p_payload -> 'altText') is distinct from 'string'
  then return false;
  end if;
  if (select count(*) from jsonb_object_keys(p_payload)) <> 11
     or (select count(*) from jsonb_object_keys(p_payload -> 'assetAssessment')) <> 4
     or (select count(*) from jsonb_object_keys(p_payload -> 'direction')) <> 4
     or jsonb_array_length(p_platforms) not between 1 and 3
     or jsonb_array_length(p_truth_snapshot) < 1
     or jsonb_array_length(p_payload -> 'variants') <> jsonb_array_length(p_platforms)
     or jsonb_array_length(p_payload -> 'seoPhrases') not between 3 and 8
     or jsonb_array_length(p_payload -> 'hashtags') not between 3 and 10
     or jsonb_array_length(p_payload -> 'claims') not between 1 and 30
     or jsonb_array_length(p_payload -> 'internalMediaTags') not between 3 and 10
     or jsonb_array_length(p_payload -> 'uncertainties') > 8
     or jsonb_array_length(p_payload #> '{assetAssessment,qualityIssues}') not between 1 and 6
  then return false;
  end if;
  if exists (
       select 1 from jsonb_array_elements(p_platforms) target
       where jsonb_typeof(target) is distinct from 'string'
          or coalesce(target #>> '{}', '') not in ('facebook','instagram','google_business')
     )
     or (select count(*) <> count(distinct lower(value))
         from jsonb_array_elements_text(p_platforms))
     or coalesce(p_payload #>> '{assetAssessment,subject}', '') not in ('food','drink','interior','exterior','team','menu','other')
     or coalesce(char_length(p_payload #>> '{assetAssessment,visualSummary}'), 0) not between 20 and 400
     or p_payload #>> '{assetAssessment,visualSummary}' is distinct from btrim(p_payload #>> '{assetAssessment,visualSummary}')
     or jsonb_typeof(p_payload #> '{assetAssessment,qualityScore}') is distinct from 'number'
     or coalesce(p_payload #>> '{assetAssessment,qualityScore}', '') !~ '^[4-5]$'
     or p_payload #> '{assetAssessment,qualityIssues}' is distinct from '["none"]'::jsonb
     or exists (
       select 1 from jsonb_array_elements(p_payload #> '{assetAssessment,qualityIssues}') issue
       where jsonb_typeof(issue) is distinct from 'string'
          or coalesce(issue #>> '{}', '') not in ('blur','dark','overexposed','glare','cropped_subject','busy_background','readable_text','possible_logo_or_watermark','none')
     )
     or (select count(*) <> count(distinct lower(value))
         from jsonb_array_elements_text(p_payload #> '{assetAssessment,qualityIssues}'))
     or ((p_payload #> '{assetAssessment,qualityIssues}') ? 'none'
         and jsonb_array_length(p_payload #> '{assetAssessment,qualityIssues}') <> 1)
     or coalesce(p_payload #>> '{direction,pillar}', '') not in ('Momo Cravings','First-Time Education','Behind the Scenes','Customer Reactions','Snack Discovery','Local Discovery')
     or coalesce(p_payload #>> '{direction,objective}', '') not in ('craving','education','local_discovery','brand_trust','visit_intent')
     or coalesce(char_length(p_payload #>> '{direction,angle}'), 0) not between 20 and 400
     or p_payload #>> '{direction,angle}' is distinct from btrim(p_payload #>> '{direction,angle}')
     or coalesce(char_length(p_payload #>> '{direction,audienceIntent}'), 0) not between 10 and 240
     or p_payload #>> '{direction,audienceIntent}' is distinct from btrim(p_payload #>> '{direction,audienceIntent}')
     or coalesce(char_length(p_payload ->> 'masterCaption'), 0) not between 40 and 1200
     or p_payload ->> 'masterCaption' is distinct from btrim(p_payload ->> 'masterCaption')
     or coalesce(char_length(p_payload ->> 'altText'), 0) not between 30 and 180
     or p_payload ->> 'altText' is distinct from btrim(p_payload ->> 'altText')
     or coalesce(p_payload ->> 'altText', '') ~ E'[\r\n#]'
  then return false;
  end if;
  if (p_payload #>> '{assetAssessment,qualityScore}')::integer < 3 then return false; end if;
  if veroxa_private.momo_content_repeated_copy_v1(p_payload ->> 'masterCaption') then return false; end if;
  if exists (
       select 1 from jsonb_array_elements(p_truth_snapshot) truth
       where jsonb_typeof(truth) is distinct from 'object'
          or (select count(*) from jsonb_object_keys(truth)) <> 5
          or jsonb_typeof(truth -> 'id') is distinct from 'string'
          or jsonb_typeof(truth -> 'fieldKey') is distinct from 'string'
          or jsonb_typeof(truth -> 'evidenceClass') is distinct from 'string'
          or jsonb_typeof(truth -> 'ownerConfirmedAt') is distinct from 'string'
          or not (truth ? 'value')
          or coalesce(truth ->> 'id', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          or truth ->> 'evidenceClass' is distinct from 'real_owner'
          or coalesce(char_length(truth ->> 'fieldKey'), 0) not between 1 and 160
          or truth ->> 'ownerConfirmedAt' is null
     )
     or (select count(*) <> count(distinct lower(truth ->> 'id'))
         from jsonb_array_elements(p_truth_snapshot) truth)
  then return false;
  end if;

  for payload_entry in select value from jsonb_array_elements(p_payload -> 'seoPhrases') loop
    if jsonb_typeof(payload_entry) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(payload_entry)) <> 4
       or jsonb_typeof(payload_entry -> 'id') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'phrase') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'kind') is distinct from 'string'
       or coalesce(char_length(payload_entry ->> 'id'), 0) not between 1 and 80
       or payload_entry ->> 'id' is distinct from btrim(payload_entry ->> 'id')
       or coalesce(char_length(payload_entry ->> 'phrase'), 0) not between 3 and 80
       or payload_entry ->> 'phrase' is distinct from btrim(payload_entry ->> 'phrase')
       or coalesce(payload_entry ->> 'kind', '') not in ('brand','cuisine','locality','dish')
       or jsonb_typeof(payload_entry -> 'truthFieldIds') is distinct from 'array'
    then return false;
    end if;
    if jsonb_array_length(payload_entry -> 'truthFieldIds') not between 1 and 3
       or exists (
         select 1 from jsonb_array_elements(payload_entry -> 'truthFieldIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
       or (select count(*) <> count(distinct lower(value))
           from jsonb_array_elements_text(payload_entry -> 'truthFieldIds'))
       or exists (
         select 1 from jsonb_array_elements_text(payload_entry -> 'truthFieldIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_truth_snapshot) truth
           where truth ->> 'id' = ref.value
         )
       )
    then return false;
    end if;

    if payload_entry ->> 'phrase' ~* '\m(near[[:space:]]+me|best|number[[:space:]]+one|top[- ]rated|award[- ]winning|most[[:space:]]+popular|cheap|cheapest|lowest[[:space:]]+price|trending|viral)\M'
       or payload_entry ->> 'phrase' like '%#1%'
       or not exists (
      select 1
      from veroxa_private.momo_content_allowed_seo_phrases_v1(p_truth_snapshot) allowed
      where lower(allowed.phrase) = lower(payload_entry ->> 'phrase')
        and allowed.kind = payload_entry ->> 'kind'
        and cardinality(allowed.truth_field_ids)
          = jsonb_array_length(payload_entry -> 'truthFieldIds')
        and not exists (
          select 1
          from jsonb_array_elements_text(payload_entry -> 'truthFieldIds') ref
          where not (ref.value = any(allowed.truth_field_ids))
        )
        and not exists (
          select 1 from unnest(allowed.truth_field_ids) allowed_ref
          where not (payload_entry -> 'truthFieldIds' ? allowed_ref)
        )
       ) then
      return false;
    end if;
  end loop;
  if (select count(*) <> count(distinct lower(item ->> 'id'))
      from jsonb_array_elements(p_payload -> 'seoPhrases') item)
     or (select count(*) <> count(distinct lower(item ->> 'phrase'))
         from jsonb_array_elements(p_payload -> 'seoPhrases') item)
  then return false;
  end if;

  for payload_entry in select value from jsonb_array_elements(p_payload -> 'hashtags') loop
    if jsonb_typeof(payload_entry) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(payload_entry)) <> 4
       or jsonb_typeof(payload_entry -> 'id') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'tag') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'kind') is distinct from 'string'
       or coalesce(char_length(payload_entry ->> 'id'), 0) not between 1 and 80
       or payload_entry ->> 'id' is distinct from btrim(payload_entry ->> 'id')
       or coalesce(payload_entry ->> 'tag', '') !~ '^#[A-Za-z][A-Za-z0-9_]{1,39}$'
       or coalesce(payload_entry ->> 'kind', '') not in ('brand','cuisine','locality','dish')
       or jsonb_typeof(payload_entry -> 'truthFieldIds') is distinct from 'array'
    then return false;
    end if;
    if jsonb_array_length(payload_entry -> 'truthFieldIds') not between 1 and 3
       or exists (
         select 1 from jsonb_array_elements(payload_entry -> 'truthFieldIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
       or (select count(*) <> count(distinct lower(value))
           from jsonb_array_elements_text(payload_entry -> 'truthFieldIds'))
       or exists (
         select 1 from jsonb_array_elements_text(payload_entry -> 'truthFieldIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_truth_snapshot) truth
           where truth ->> 'id' = ref.value
         )
       )
    then return false;
    end if;
    if lower(payload_entry ->> 'tag') in (
         '#fyp','#viral','#follow4follow','#like4like','#explorepage',
         '#foodporn','#giveaway','#contest','#trending'
       )
       or not exists (
         select 1
         from veroxa_private.momo_content_allowed_hashtags_v1(p_truth_snapshot) allowed
         where lower(allowed.tag) = lower(payload_entry ->> 'tag')
           and allowed.kind = payload_entry ->> 'kind'
           and cardinality(allowed.truth_field_ids)
             = jsonb_array_length(payload_entry -> 'truthFieldIds')
           and not exists (
             select 1
             from jsonb_array_elements_text(payload_entry -> 'truthFieldIds') ref
             where not (ref.value = any(allowed.truth_field_ids))
           )
           and not exists (
             select 1 from unnest(allowed.truth_field_ids) allowed_ref
             where not (payload_entry -> 'truthFieldIds' ? allowed_ref)
           )
       ) then
      return false;
    end if;
  end loop;
  if (select count(*) <> count(distinct lower(item ->> 'id'))
      from jsonb_array_elements(p_payload -> 'hashtags') item)
     or (select count(*) <> count(distinct lower(item ->> 'tag'))
         from jsonb_array_elements(p_payload -> 'hashtags') item)
  then return false;
  end if;

  for payload_entry in select value from jsonb_array_elements(p_payload -> 'claims') loop
    if jsonb_typeof(payload_entry) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(payload_entry)) <> 6
       or jsonb_typeof(payload_entry -> 'id') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'exactText') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'source') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'category') is distinct from 'string'
       or coalesce(char_length(payload_entry ->> 'id'), 0) not between 1 and 80
       or payload_entry ->> 'id' is distinct from btrim(payload_entry ->> 'id')
       or coalesce(char_length(payload_entry ->> 'exactText'), 0) not between 1 and 300
       or payload_entry ->> 'exactText' is distinct from btrim(payload_entry ->> 'exactText')
       or coalesce(payload_entry ->> 'source', '') not in ('owner_truth','visible_media','editorial')
       or coalesce(payload_entry ->> 'category', '') not in ('restaurant_name','location','cuisine','menu','hours','service','dietary','halal','offer','price','phone','visual','sensory','other')
       or jsonb_typeof(payload_entry -> 'truthFieldIds') is distinct from 'array'
       or jsonb_typeof(payload_entry -> 'appearsIn') is distinct from 'array'
    then return false;
    end if;
    if jsonb_array_length(payload_entry -> 'truthFieldIds') not between 0 and 3
       or (payload_entry ->> 'source' = 'owner_truth' and jsonb_array_length(payload_entry -> 'truthFieldIds') = 0)
       or exists (
         select 1 from jsonb_array_elements(payload_entry -> 'truthFieldIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
       or (select count(*) <> count(distinct lower(value))
           from jsonb_array_elements_text(payload_entry -> 'truthFieldIds'))
       or jsonb_array_length(payload_entry -> 'appearsIn') not between 1 and 5
       or exists (
         select 1 from jsonb_array_elements(payload_entry -> 'appearsIn') destination
         where jsonb_typeof(destination) is distinct from 'string'
            or coalesce(destination #>> '{}', '') not in ('master','alt_text','facebook','instagram','google_business')
       )
       or (select count(*) <> count(distinct lower(value))
           from jsonb_array_elements_text(payload_entry -> 'appearsIn'))
       or exists (
         select 1 from jsonb_array_elements_text(payload_entry -> 'truthFieldIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_truth_snapshot) truth
           where truth ->> 'id' = ref.value
         )
       )
       or exists (
         select 1 from jsonb_array_elements_text(payload_entry -> 'appearsIn') destination
         where destination.value in ('facebook','instagram','google_business')
           and not (p_platforms ? destination.value)
       )
       or exists (
         select 1
         from (
           select 'master'::text as destination, p_payload ->> 'masterCaption' as content
           union all
           select 'alt_text'::text, p_payload ->> 'altText'
           union all
           select candidate ->> 'platform', candidate ->> 'caption'
           from jsonb_array_elements(p_payload -> 'variants') candidate
         ) destination_content
         where veroxa_private.momo_content_exact_occurrence_count_v1(
           destination_content.content, payload_entry ->> 'exactText'
         ) <> case when payload_entry -> 'appearsIn' ? destination_content.destination
           then 1 else 0 end
       )
    then return false;
    end if;

    if payload_entry ->> 'source' = 'owner_truth' then
      required_field_pattern := case payload_entry ->> 'category'
        when 'restaurant_name' then '^identity[.]display_name$'
        when 'location' then '^address[.]'
        when 'cuisine' then '^identity[.]cuisine$'
        when 'menu' then '^menu[.]'
        when 'hours' then '^hours[.]'
        when 'service' then '^services[.]'
        when 'dietary' then '^claims[.]dietary$'
        when 'halal' then '^claims[.]halal$'
        when 'offer' then '^(offers?|promotions?)[.]|^claims[.](offer|promotion)$'
        when 'price' then '^(prices?)[.]|^menu[.]prices?$|^claims[.]price$'
        when 'phone' then '^phone[.]'
        else null
      end;
      select coalesce(array_agg(word order by ordinal), array[]::text[])
      into material_words
      from unnest(veroxa_private.momo_content_tokens_v1(payload_entry ->> 'exactText'))
        with ordinality words(word, ordinal)
      where word <> all(array[
        'a','an','and','are','at','available','brings','discover','for','from',
        'in','is','local','of','on','our','restaurant','serves','the','to','we','with'
      ]::text[]);
      if required_field_pattern is null
         or cardinality(material_words) = 0
         or not exists (
           select 1
           from jsonb_array_elements(p_truth_snapshot) truth
           where (payload_entry -> 'truthFieldIds') ? (truth ->> 'id')
             and truth ->> 'fieldKey' ~* required_field_pattern
             and (
               payload_entry ->> 'category' not in ('offer','price','hours','service','dietary','menu','halal')
               or lower(veroxa_private.momo_content_json_text_v1(truth -> 'value'))
                 !~ '\m(no|not|none|false|unavailable|disabled|unknown|unverified|unconfirmed|declined|expired|revoked)\M'
             )
             and not exists (
               select 1 from unnest(material_words) word
               where not (word = any(veroxa_private.momo_content_tokens_v1(
                 veroxa_private.momo_content_json_text_v1(truth -> 'value')
               )))
             )
         ) then
        return false;
      end if;
    elsif jsonb_array_length(payload_entry -> 'truthFieldIds') <> 0 then
      return false;
    end if;
    if payload_entry ->> 'source' = 'visible_media'
       and payload_entry ->> 'category' <> 'visual' then
      return false;
    end if;
    if payload_entry ->> 'source' = 'editorial' then
      if payload_entry ->> 'category' <> 'other'
         or exists (
           select 1
           from unnest(veroxa_private.momo_content_tokens_v1(payload_entry ->> 'exactText')) word
           where word <> all(array[
             'a','an','and','are','area','as','at','await','background','brings','centered',
             'clear','come','discover','discovering','diners','dining','explore','find','for','from',
             'here','in','introduction','inviting','is','lit','local','made','moment','new','no',
             'of','offers','on','our','plan','restaurant','see','serves','setting','simple','softly',
             'something','table','the','this','to','today','us','view','visit','warm','welcoming',
             'with','your'
           ]::text[])
         ) then
        return false;
      end if;
    end if;
  end loop;
  if (select count(*) <> count(distinct lower(item ->> 'id'))
      from jsonb_array_elements(p_payload -> 'claims') item)
     or not exists (
       select 1 from jsonb_array_elements(p_payload -> 'claims') item
       where item ->> 'source' = 'visible_media'
         and item ->> 'category' = 'visual'
         and item -> 'appearsIn' ? 'alt_text'
     )
  then return false;
  end if;

  for variant in select value from jsonb_array_elements(p_payload -> 'variants') loop
    if jsonb_typeof(variant) is distinct from 'object' then return false; end if;
    platform := variant ->> 'platform';
    if (select count(*) from jsonb_object_keys(variant)) <> 7
       or jsonb_typeof(variant -> 'platform') is distinct from 'string'
       or jsonb_typeof(variant -> 'caption') is distinct from 'string'
       or jsonb_typeof(variant -> 'scheduleWindow') is distinct from 'string'
       or platform is null
       or platform not in ('facebook','instagram','google_business')
       or platform = any(seen)
       or not (p_platforms ? platform)
       or jsonb_typeof(variant -> 'hashtagIds') is distinct from 'array'
       or jsonb_typeof(variant -> 'seoPhraseIds') is distinct from 'array'
       or jsonb_typeof(variant -> 'claimIds') is distinct from 'array'
       or jsonb_typeof(variant -> 'cta') is distinct from 'object'
       or coalesce(variant ->> 'scheduleWindow', '') not in ('lunch','afternoon','dinner','unspecified')
       or coalesce(char_length(variant ->> 'caption'), 0) not between 80 and
          (case platform when 'instagram' then 900 when 'google_business' then 800 else 1500 end)
       or variant ->> 'caption' is distinct from btrim(variant ->> 'caption')
       or veroxa_private.momo_content_repeated_copy_v1(variant ->> 'caption')
    then
      return false;
    end if;
    if (select count(*) from jsonb_object_keys(variant -> 'cta')) <> 2
       or jsonb_typeof(variant #> '{cta,kind}') is distinct from 'string'
       or jsonb_typeof(variant #> '{cta,text}') is distinct from 'string'
       or variant #>> '{cta,kind}' is null
       or variant #>> '{cta,kind}' not in ('none','visit','explore_menu','order_online','call')
       or variant #>> '{cta,text}' is null
       or coalesce(char_length(variant #>> '{cta,text}'), 0) > 160
       or variant #>> '{cta,text}' is distinct from btrim(variant #>> '{cta,text}')
       or (variant #>> '{cta,kind}' = 'none' and variant #>> '{cta,text}' <> '')
       or (variant #>> '{cta,kind}' <> 'none' and coalesce(char_length(variant #>> '{cta,text}'), 0) < 1)
       or (variant #>> '{cta,kind}' <> 'none'
         and strpos(variant ->> 'caption', variant #>> '{cta,text}') > 0)
    then return false;
    end if;
    cta_kind := variant #>> '{cta,kind}';
    cta_text := variant #>> '{cta,text}';
    if cta_kind <> 'none' then
      required_field_pattern := case cta_kind
        when 'visit' then '^address[.]primary$'
        when 'explore_menu' then '^menu[.]primary$'
        when 'order_online' then '^services[.]delivery$'
        when 'call' then '^phone[.]primary$'
        else null
      end;
      if required_field_pattern is null
         or (case cta_kind
           when 'visit' then cta_text !~* '\m(visit|plan|come|find)\M'
           when 'explore_menu' then cta_text !~* '\m(menu|explore|browse|see)\M'
           when 'order_online' then not (cta_text ~* '\morder\M.*\monline\M')
           when 'call' then cta_text !~* '\mcall\M'
           else true end)
         or cta_text ~* '\m(act[[:space:]]+now|hurry|limited[[:space:]]+time|don''t[[:space:]]+miss[[:space:]]+out|while[[:space:]]+supplies[[:space:]]+last|follow[[:space:]]+for[[:space:]]+follow|like[[:space:]]+and[[:space:]]+share)\M'
         or exists (
           select 1
           from unnest(veroxa_private.momo_content_tokens_v1(cta_text)) word
           where word <> all(array[
             'a','an','and','are','area','as','at','await','background','brings','centered',
             'clear','come','discover','discovering','diners','dining','explore','find','for','from',
             'here','in','introduction','inviting','is','lit','local','made','moment','new','no',
             'of','offers','on','our','plan','restaurant','see','serves','setting','simple','softly',
             'something','table','the','this','to','today','us','view','visit','warm','welcoming',
             'with','your'
           ]::text[])
             and not exists (
               select 1 from jsonb_array_elements(p_truth_snapshot) truth
               where word = any(veroxa_private.momo_content_tokens_v1(
                 veroxa_private.momo_content_json_text_v1(truth -> 'value')
               ))
             )
         )
         or not exists (
           select 1
           from jsonb_array_elements(p_truth_snapshot) truth
           where truth ->> 'fieldKey' ~* required_field_pattern
             and coalesce(char_length(veroxa_private.momo_content_json_text_v1(truth -> 'value')), 0) > 0
             and (cta_kind <> 'order_online' or (
               lower(veroxa_private.momo_content_json_text_v1(truth -> 'value'))
                 !~ '\m(no|not|none|false|unavailable|disabled|unknown|unverified|unconfirmed|declined|expired|revoked)\M'
               and lower(veroxa_private.momo_content_json_text_v1(truth -> 'value'))
                 not in ('0','null')
             ))
         ) then
        return false;
      end if;
    end if;
    count_tags := jsonb_array_length(variant -> 'hashtagIds');
    count_seo := jsonb_array_length(variant -> 'seoPhraseIds');
    if jsonb_array_length(variant -> 'claimIds') not between 0 and 30
       or count_seo not between 3 and 8
       or count_tags not between 0 and 5
       or exists (
         select 1 from jsonb_array_elements(variant -> 'claimIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
       or exists (
         select 1 from jsonb_array_elements(variant -> 'seoPhraseIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
       or exists (
         select 1 from jsonb_array_elements(variant -> 'hashtagIds') ref
         where jsonb_typeof(ref) is distinct from 'string'
            or coalesce(char_length(ref #>> '{}'), 0) not between 1 and 100
            or ref #>> '{}' is distinct from btrim(ref #>> '{}')
       )
    then return false;
    end if;
    if (platform = 'instagram' and count_tags not between 3 and 5)
       or (platform = 'facebook' and count_tags not between 0 and 3)
       or (platform = 'google_business' and (count_tags <> 0 or coalesce(variant ->> 'caption', '') ~ '#[A-Za-z]')) then
      return false;
    end if;
    if not exists (
         select 1 from jsonb_array_elements(p_payload -> 'seoPhrases') source
         where source ->> 'kind' = 'brand'
           and variant -> 'seoPhraseIds' ? (source ->> 'id')
       )
       or not exists (
         select 1 from jsonb_array_elements(p_payload -> 'seoPhrases') source
         where source ->> 'kind' = 'locality'
           and variant -> 'seoPhraseIds' ? (source ->> 'id')
       )
       or not exists (
         select 1 from jsonb_array_elements(p_payload -> 'seoPhrases') source
         where source ->> 'kind' in ('cuisine','dish')
           and variant -> 'seoPhraseIds' ? (source ->> 'id')
       )
       or (platform = 'instagram' and not exists (
         select 1 from jsonb_array_elements(p_payload -> 'hashtags') source
         where source ->> 'kind' = 'locality'
           and variant -> 'hashtagIds' ? (source ->> 'id')
       ))
       or (platform = 'instagram' and not exists (
         select 1 from jsonb_array_elements(p_payload -> 'hashtags') source
         where source ->> 'kind' in ('brand','cuisine')
           and variant -> 'hashtagIds' ? (source ->> 'id')
       ))
       or coalesce(variant ->> 'caption', '') ~ '#[A-Za-z]'
       or (select count(*) <> count(distinct value)
           from jsonb_array_elements_text(variant -> 'seoPhraseIds'))
       or (select count(*) <> count(distinct value)
           from jsonb_array_elements_text(variant -> 'hashtagIds'))
       or (select count(*) <> count(distinct value)
           from jsonb_array_elements_text(variant -> 'claimIds'))
       or exists (
         select 1 from jsonb_array_elements_text(variant -> 'seoPhraseIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_payload -> 'seoPhrases') source
           where source ->> 'id' = ref.value
         )
       )
       or exists (
         select 1
         from jsonb_array_elements(p_payload -> 'seoPhrases') source
         where variant -> 'seoPhraseIds' ? (source ->> 'id')
           and (
             not exists (
               select 1
               from unnest(veroxa_private.momo_content_tokens_v1(source ->> 'phrase')) word
               where word <> all(case source ->> 'kind'
                 when 'brand' then array['the','house','restaurant']::text[]
                 when 'cuisine' then array['cuisine','food','restaurant']::text[]
                 when 'locality' then array['street','st','road','rd','avenue','ave','suite','tx','restaurant','food','dining','local']::text[]
                 else array['and','menu','snack','snacks','food','dish','dishes']::text[]
               end)
             )
             or exists (
               select 1
               from unnest(veroxa_private.momo_content_tokens_v1(source ->> 'phrase')) word
               where word <> all(case source ->> 'kind'
                 when 'brand' then array['the','house','restaurant']::text[]
                 when 'cuisine' then array['cuisine','food','restaurant']::text[]
                 when 'locality' then array['street','st','road','rd','avenue','ave','suite','tx','restaurant','food','dining','local']::text[]
                 else array['and','menu','snack','snacks','food','dish','dishes']::text[]
               end)
                 and not (word = any(veroxa_private.momo_content_tokens_v1(variant ->> 'caption')))
             )
           )
       )
       or exists (
         select 1 from jsonb_array_elements_text(variant -> 'hashtagIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_payload -> 'hashtags') source
           where source ->> 'id' = ref.value
         )
       )
       or exists (
         select 1 from jsonb_array_elements_text(variant -> 'claimIds') ref
         where not exists (
           select 1 from jsonb_array_elements(p_payload -> 'claims') source
           where source ->> 'id' = ref.value
         )
       )
       or exists (
         select 1 from jsonb_array_elements(p_payload -> 'claims') source
         where ((source -> 'appearsIn') ? platform)
               is distinct from ((variant -> 'claimIds') ? (source ->> 'id'))
       ) then return false;
    end if;
    seen := array_append(seen, platform);
  end loop;

  for payload_entry in select value from jsonb_array_elements(p_payload -> 'internalMediaTags') loop
    if jsonb_typeof(payload_entry) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(payload_entry)) <> 3
       or jsonb_typeof(payload_entry -> 'slug') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'label') is distinct from 'string'
       or coalesce(payload_entry ->> 'slug', '') !~ '^[a-z0-9]+(-[a-z0-9]+){0,5}$'
       or char_length(payload_entry ->> 'slug') > 80
       or coalesce(char_length(payload_entry ->> 'label'), 0) not between 1 and 80
       or payload_entry ->> 'label' is distinct from btrim(payload_entry ->> 'label')
       or jsonb_typeof(payload_entry -> 'confidence') is distinct from 'number'
    then return false;
    end if;
    if (payload_entry ->> 'confidence')::numeric not between 0 and 1 then return false; end if;
  end loop;

  for payload_entry in select value from jsonb_array_elements(p_payload -> 'uncertainties') loop
    if jsonb_typeof(payload_entry) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(payload_entry)) <> 3
       or jsonb_typeof(payload_entry -> 'field') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'reason') is distinct from 'string'
       or jsonb_typeof(payload_entry -> 'severity') is distinct from 'string'
       or coalesce(char_length(payload_entry ->> 'field'), 0) not between 1 and 100
       or payload_entry ->> 'field' is distinct from btrim(payload_entry ->> 'field')
       or coalesce(char_length(payload_entry ->> 'reason'), 0) not between 10 and 300
       or payload_entry ->> 'reason' is distinct from btrim(payload_entry ->> 'reason')
       or coalesce(payload_entry ->> 'severity', '') not in ('warning')
    then return false;
    end if;
  end loop;
  return array_length(seen, 1) = jsonb_array_length(p_platforms);
end;
$$;
revoke all on function veroxa_private.momo_content_payload_contract_valid_v1(jsonb,jsonb,jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_materialize_momo_ready_package_v1(
  p_run_id uuid,
  p_request_hash text,
  p_schedule_snapshot jsonb,
  p_schedule_canonical text,
  p_schedule_sha256 text,
  p_inspection_attestation text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  rights public.veroxa_media_rights%rowtype;
  existing_package public.veroxa_momo_ready_packages%rowtype;
  package_id uuid;
  variant jsonb;
  platform text;
  schedule_text text;
  schedule_local timestamp without time zone;
  schedule_time timestamptz;
  hashtag_values jsonb;
  seo_values jsonb;
begin
  select * into run from public.veroxa_momo_content_ai_runs
  where id = p_run_id for update;
  if not found or run.request_hash <> p_request_hash
     or not veroxa_private.momo_content_ai_current_evidence_v1(p_run_id, p_actor_id) then
    raise exception using errcode = '42501', message = 'momo_ready_materialization_rejected';
  end if;
  select * into existing_package from public.veroxa_momo_ready_packages
  where content_ai_run_id = p_run_id;
  if found then
    if existing_package.approved_payload_sha256 = run.output_sha256
       and existing_package.schedule_sha256 = p_schedule_sha256
       and existing_package.schedule_canonical = p_schedule_canonical
       and existing_package.inspection_attestation = p_inspection_attestation then
      return existing_package.id;
    end if;
    raise exception using errcode = '23505', message = 'momo_ready_materialization_conflict';
  end if;
  if run.status <> 'pending_review'
     or run.accounted_microusd is null
     or run.output_payload is null
     or run.output_canonical is null
     or run.output_canonical::jsonb is distinct from run.output_payload
     or run.output_sha256 is distinct from encode(extensions.digest(convert_to(run.output_canonical, 'UTF8'), 'sha256'), 'hex')
     or not veroxa_private.momo_content_payload_contract_valid_v1(run.output_payload, run.target_platforms, run.truth_snapshot)
     or jsonb_typeof(p_schedule_snapshot) is distinct from 'object'
     or p_schedule_canonical::jsonb is distinct from p_schedule_snapshot
     or p_schedule_sha256 is distinct from encode(extensions.digest(convert_to(p_schedule_canonical, 'UTF8'), 'sha256'), 'hex')
     or p_inspection_attestation is distinct from
       'Team Faraz reviewed the final media, factual claims, platform copy, SEO phrases, hashtags, alt text, calls to action, and future America/Chicago plan. This package is ready for manual posting only; no external publishing is authorized.' then
    raise exception using errcode = '23514', message = 'momo_ready_contract_failed';
  end if;
  select * into rights from public.veroxa_media_rights where id = run.rights_id for share;
  for variant in select value from jsonb_array_elements(run.output_payload -> 'variants') loop
    platform := variant ->> 'platform';
    schedule_text := p_schedule_snapshot ->> platform;
    begin
      if schedule_text is null or schedule_text !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then
        raise exception using errcode = '22023', message = 'momo_ready_schedule_invalid';
      end if;
      schedule_local := schedule_text::timestamp without time zone;
      schedule_time := schedule_local at time zone 'America/Chicago';
    exception when others then
      raise exception using errcode = '22023', message = 'momo_ready_schedule_invalid';
    end;
    if to_char(schedule_time at time zone 'America/Chicago', 'YYYY-MM-DD"T"HH24:MI') <> schedule_text
       or date_trunc('minute', schedule_time) <> schedule_time
       or schedule_time <= clock_timestamp() + interval '15 minutes'
       or (rights.expires_at is not null and schedule_time >= rights.expires_at)
       or not (run.target_platforms ? platform) then
      raise exception using errcode = '23514', message = 'momo_ready_schedule_or_rights_invalid';
    end if;
  end loop;
  if (select count(*) from jsonb_object_keys(p_schedule_snapshot))
     <> jsonb_array_length(run.target_platforms) then
    raise exception using errcode = '23514', message = 'momo_ready_schedule_platform_mismatch';
  end if;
  insert into public.veroxa_momo_ready_packages (
    restaurant_id, content_ai_run_id, source_asset_id,
    source_storage_path, source_storage_object_id, source_storage_object_version,
    source_mime_type, source_file_size, source_width, source_height,
    source_content_sha256,
    intake_verification_id, rights_id, rights_attestation_sha256, review_id,
    truth_snapshot_sha256, approved_payload, approved_payload_sha256,
    validation_sha256, schedule_snapshot, schedule_canonical, schedule_sha256,
    inspection_attestation_version, inspection_attestation, status, approved_by
  ) values (
    run.restaurant_id, run.id, run.source_asset_id,
    run.source_storage_path, run.source_storage_object_id,
    run.source_storage_object_version, run.source_mime_type,
    run.source_file_size, run.source_width, run.source_height,
    run.source_content_sha256,
    run.intake_verification_id, run.rights_id, run.rights_attestation_sha256,
    run.review_id, run.truth_snapshot_sha256, run.output_payload,
    run.output_sha256, run.validation_sha256, p_schedule_snapshot,
    p_schedule_canonical, p_schedule_sha256, 'momo-ready-team-inspection-v1',
    p_inspection_attestation, 'ready_to_post', p_actor_id
  ) returning id into package_id;
  for variant in select value from jsonb_array_elements(run.output_payload -> 'variants') loop
    platform := variant ->> 'platform';
    schedule_time := ((p_schedule_snapshot ->> platform)::timestamp without time zone)
      at time zone 'America/Chicago';
    select coalesce(jsonb_agg(tag ->> 'tag' order by tag ->> 'tag'), '[]'::jsonb)
      into hashtag_values
    from jsonb_array_elements(run.output_payload -> 'hashtags') tag
    where variant -> 'hashtagIds' ? (tag ->> 'id');
    select coalesce(jsonb_agg(phrase ->> 'phrase' order by phrase ->> 'phrase'), '[]'::jsonb)
      into seo_values
    from jsonb_array_elements(run.output_payload -> 'seoPhrases') phrase
    where variant -> 'seoPhraseIds' ? (phrase ->> 'id');
    insert into public.veroxa_momo_ready_package_variants (
      restaurant_id, ready_package_id, platform, media_source_kind,
      media_asset_id, media_review_id, media_storage_path,
      media_storage_object_id, media_storage_object_version, media_mime_type,
      media_file_size, media_width, media_height, media_content_sha256,
      caption, caption_sha256,
      hashtags, seo_phrases, alt_text, call_to_action, scheduled_for,
      timezone, status
    ) values (
      run.restaurant_id, package_id, platform, 'original_accepted',
      run.source_asset_id, run.review_id, run.source_storage_path,
      run.source_storage_object_id, run.source_storage_object_version,
      run.source_mime_type, run.source_file_size, run.source_width,
      run.source_height, run.source_content_sha256, variant ->> 'caption',
      encode(extensions.digest(convert_to(variant ->> 'caption', 'UTF8'), 'sha256'), 'hex'),
      hashtag_values, seo_values, run.output_payload ->> 'altText',
      variant -> 'cta', schedule_time, 'America/Chicago', 'ready_to_post'
    );
  end loop;
  update public.veroxa_momo_content_ai_runs
  set status = 'materialized', team_decided_by = p_actor_id,
      team_decided_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = p_run_id;
  return package_id;
end;
$$;
revoke all on function public.veroxa_materialize_momo_ready_package_v1(uuid,text,jsonb,text,text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.veroxa_materialize_momo_ready_package_v1(uuid,text,jsonb,text,text,text,uuid)
  to service_role;

create or replace function public.veroxa_momo_ready_package_status_v1(
  p_ready_package_id uuid
)
returns table (ready_package_id uuid, effective_status text, blockers jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  package public.veroxa_momo_ready_packages%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  rights public.veroxa_media_rights%rowtype;
  problems jsonb := '[]'::jsonb;
begin
  select * into package from public.veroxa_momo_ready_packages
  where id = p_ready_package_id;
  if not found or not public.veroxa_current_user_is_team_for_restaurant(package.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_ready_package_team_required';
  end if;
  select * into run from public.veroxa_momo_content_ai_runs
  where id = package.content_ai_run_id;
  select * into rights from public.veroxa_media_rights
  where id = package.rights_id;
  if run.id is null
     or run.status <> 'materialized'
     or package.restaurant_id is distinct from run.restaurant_id
     or package.source_asset_id is distinct from run.source_asset_id
     or package.source_storage_path is distinct from run.source_storage_path
     or package.source_storage_object_id is distinct from run.source_storage_object_id
     or package.source_storage_object_version is distinct from run.source_storage_object_version
     or package.source_mime_type is distinct from run.source_mime_type
     or package.source_file_size is distinct from run.source_file_size
     or package.source_width is distinct from run.source_width
     or package.source_height is distinct from run.source_height
     or package.source_content_sha256 is distinct from run.source_content_sha256
     or package.intake_verification_id is distinct from run.intake_verification_id
     or package.rights_id is distinct from run.rights_id
     or package.rights_attestation_sha256 is distinct from run.rights_attestation_sha256
     or package.review_id is distinct from run.review_id
     or package.truth_snapshot_sha256 is distinct from run.truth_snapshot_sha256
     or package.approved_payload is distinct from run.output_payload
     or package.approved_payload_sha256 is distinct from run.output_sha256
     or package.validation_sha256 is distinct from run.validation_sha256
     or run.output_canonical is null
     or run.output_canonical::jsonb is distinct from run.output_payload
     or run.output_sha256 is distinct from encode(extensions.digest(
       convert_to(run.output_canonical, 'UTF8'), 'sha256'), 'hex')
     or package.schedule_canonical::jsonb is distinct from package.schedule_snapshot
     or package.schedule_sha256 is distinct from encode(extensions.digest(
       convert_to(package.schedule_canonical, 'UTF8'), 'sha256'), 'hex')
     or package.status <> 'ready_to_post' or package.external_write_allowed then
    problems := problems || '"package_integrity_changed"'::jsonb;
  end if;
  if not veroxa_private.momo_content_ai_current_evidence_v1(package.content_ai_run_id, (select auth.uid())) then
    problems := problems || '"evidence_changed"'::jsonb;
  end if;
  if exists (
    select 1 from public.veroxa_momo_ready_package_variants variant
    where variant.ready_package_id = package.id
      and (
        variant.restaurant_id is distinct from package.restaurant_id
        or variant.status <> 'ready_to_post' or variant.external_write_allowed
        or variant.media_source_kind <> 'original_accepted'
        or variant.media_asset_id is distinct from package.source_asset_id
        or variant.media_review_id is distinct from package.review_id
        or variant.media_storage_path is distinct from package.source_storage_path
        or variant.media_storage_object_id is distinct from package.source_storage_object_id
        or variant.media_storage_object_version is distinct from package.source_storage_object_version
        or variant.media_mime_type is distinct from package.source_mime_type
        or variant.media_file_size is distinct from package.source_file_size
        or variant.media_width is distinct from package.source_width
        or variant.media_height is distinct from package.source_height
        or variant.media_content_sha256 is distinct from package.source_content_sha256
        or not exists (
          select 1 from storage.objects object
          where object.bucket_id = 'restaurant-media'
            and object.name = variant.media_storage_path
            and object.id = variant.media_storage_object_id
            and object.version = variant.media_storage_object_version
            and coalesce(object.metadata ->> 'mimetype', '') = variant.media_mime_type
            and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
              then (object.metadata ->> 'size')::numeric = variant.media_file_size::numeric
              else false end
        )
        or variant.timezone <> 'America/Chicago'
        or variant.caption is distinct from (
          select source ->> 'caption'
          from jsonb_array_elements(package.approved_payload -> 'variants') source
          where source ->> 'platform' = variant.platform
        )
        or variant.alt_text is distinct from package.approved_payload ->> 'altText'
        or variant.call_to_action is distinct from (
          select source -> 'cta'
          from jsonb_array_elements(package.approved_payload -> 'variants') source
          where source ->> 'platform' = variant.platform
        )
        or variant.hashtags is distinct from coalesce((
          select jsonb_agg(tag ->> 'tag' order by tag ->> 'tag')
          from jsonb_array_elements(package.approved_payload -> 'hashtags') tag
          where (
            select source -> 'hashtagIds'
            from jsonb_array_elements(package.approved_payload -> 'variants') source
            where source ->> 'platform' = variant.platform
          ) ? (tag ->> 'id')
        ), '[]'::jsonb)
        or variant.seo_phrases is distinct from coalesce((
          select jsonb_agg(phrase ->> 'phrase' order by phrase ->> 'phrase')
          from jsonb_array_elements(package.approved_payload -> 'seoPhrases') phrase
          where (
            select source -> 'seoPhraseIds'
            from jsonb_array_elements(package.approved_payload -> 'variants') source
            where source ->> 'platform' = variant.platform
          ) ? (phrase ->> 'id')
        ), '[]'::jsonb)
        or variant.caption_sha256 is distinct from encode(extensions.digest(
          convert_to(variant.caption, 'UTF8'), 'sha256'), 'hex')
        or ((package.schedule_snapshot ->> variant.platform)::timestamp without time zone
              at time zone 'America/Chicago')
           is distinct from variant.scheduled_for
        or variant.scheduled_for <= now()
        or (rights.expires_at is not null and variant.scheduled_for >= rights.expires_at)
        or jsonb_array_length(variant.seo_phrases) not between 3 and 8
        or variant.caption ~ '#[A-Za-z]'
        or (variant.platform = 'instagram' and jsonb_array_length(variant.hashtags) not between 3 and 5)
        or (variant.platform = 'facebook' and jsonb_array_length(variant.hashtags) not between 0 and 3)
        or (variant.platform = 'google_business' and jsonb_array_length(variant.hashtags) <> 0)
      )
  ) then problems := problems || '"variant_integrity_changed"'::jsonb; end if;
  if run.id is null
     or (select count(*) from public.veroxa_momo_ready_package_variants variant
         where variant.ready_package_id = package.id)
        <> jsonb_array_length(run.target_platforms)
     or exists (
       select 1 from jsonb_array_elements_text(run.target_platforms) platform
       where not exists (
         select 1 from public.veroxa_momo_ready_package_variants variant
         where variant.ready_package_id = package.id and variant.platform = platform.value
       )
     )
     or (select count(*) from jsonb_object_keys(package.schedule_snapshot))
        <> jsonb_array_length(run.target_platforms) then
    problems := problems || '"variant_set_changed"'::jsonb;
  end if;
  if not exists (
    select 1 from public.veroxa_momo_runtime_controls runtime
    where runtime.restaurant_id = package.restaurant_id
      and not runtime.provider_writes and not runtime.review_replies
      and not runtime.website_writes and not runtime.external_scheduling
  ) then problems := problems || '"external_write_lock_changed"'::jsonb; end if;
  if exists (
    select 1 from public.veroxa_publish_queue queue
    where queue.restaurant_id = package.restaurant_id
  ) or exists (
    select 1 from public.veroxa_publish_attempts attempt
    where attempt.restaurant_id = package.restaurant_id
  ) or exists (
    select 1 from public.veroxa_content_calendar calendar
    where calendar.restaurant_id = package.restaurant_id
      and (calendar.status not in ('draft','awaiting_approval','approved','cancelled')
        or calendar.published_at is not null)
  ) or exists (
    select 1 from public.veroxa_media_usage usage
    where usage.restaurant_id = package.restaurant_id
      and (usage.usage_kind = 'published' or usage.external_reference is not null)
  ) then
    problems := problems || '"posting_boundary_violated"'::jsonb;
  end if;
  return query select package.id,
    case when jsonb_array_length(problems) = 0 then 'ready_to_post' else 'blocked' end,
    problems;
end;
$$;
revoke all on function public.veroxa_momo_ready_package_status_v1(uuid)
  from public, anon, service_role;
grant execute on function public.veroxa_momo_ready_package_status_v1(uuid)
  to authenticated;

-- -----------------------------------------------------------------------
-- RLS, singleton scope, explicit read surface, and Momo authorization seed
-- -----------------------------------------------------------------------

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_momo_media_intake_verifications',
    'veroxa_momo_content_ai_runs',
    'veroxa_momo_ready_packages',
    'veroxa_momo_ready_package_variants'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
    execute format('drop trigger if exists %I on public.%I', table_name || '_momo_scope', table_name);
    execute format('create trigger %I before insert or update of restaurant_id on public.%I for each row execute function veroxa_private.enforce_momo_operational_row()', table_name || '_momo_scope', table_name);
  end loop;
end;
$$;

create policy veroxa_momo_media_intake_team_select
on public.veroxa_momo_media_intake_verifications for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_content_ai_runs_team_select
on public.veroxa_momo_content_ai_runs for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_ready_packages_team_select
on public.veroxa_momo_ready_packages for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_ready_variants_team_select
on public.veroxa_momo_ready_package_variants for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));

create index veroxa_momo_content_ai_runs_restaurant_requested_idx
  on public.veroxa_momo_content_ai_runs (restaurant_id, requested_at desc);
create index veroxa_momo_ready_packages_restaurant_ready_idx
  on public.veroxa_momo_ready_packages (restaurant_id, ready_at desc);
create index veroxa_momo_ready_variants_restaurant_schedule_idx
  on public.veroxa_momo_ready_package_variants (restaurant_id, scheduled_for);

insert into veroxa_private.momo_ai_budget_controls (
  restaurant_id, enabled, authorization_cap_microusd, scope_key,
  external_publishing_authorized, authorized_by, authorized_at
)
select scope.restaurant_id, true, 100000000, 'momo-upload-to-ready-v1',
  false, profile.user_id, clock_timestamp()
from veroxa_private.operational_restaurant_scope scope
join lateral (
  select member.user_id
  from public.veroxa_restaurant_members member
  join public.veroxa_user_profiles profile on profile.user_id = member.user_id
  where member.restaurant_id = scope.restaurant_id
    and member.role = 'team' and member.status = 'active'
    and profile.role = 'team' and profile.status = 'active'
  order by member.created_at, member.user_id limit 1
) profile on true
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (restaurant_id) do update
set enabled = true, authorization_cap_microusd = 100000000,
    scope_key = 'momo-upload-to-ready-v1',
    external_publishing_authorized = false,
    updated_at = clock_timestamp();

-- Backfill the aggregate ledger if a media-AI candidate predates this release.
insert into veroxa_private.momo_ai_cost_ledger (
  restaurant_id, operation_kind, source_id, idempotency_hash, state,
  provider_called, reserved_microusd, accounted_microusd, accounting_basis
)
select candidate.restaurant_id, 'media_enhancement', candidate.id,
  candidate.idempotency_hash,
  case
    when candidate.status = 'failed' and not candidate.provider_called then 'released'
    when candidate.status = 'failed' and candidate.provider_called then 'uncertain'
    when candidate.accounted_microusd is not null then 'settled'
    else 'reserved'
  end,
  candidate.provider_called, candidate.reserved_microusd,
  case
    when candidate.status = 'failed' and not candidate.provider_called then 0
    when candidate.status = 'failed' and candidate.provider_called then candidate.reserved_microusd
    else candidate.accounted_microusd
  end,
  case
    when candidate.status = 'failed' and not candidate.provider_called then 'zero_pre_provider'
    when candidate.status = 'failed' and candidate.provider_called then 'conservative_reservation'
    else candidate.accounting_basis
  end
from public.veroxa_momo_media_ai_candidates candidate
join veroxa_private.operational_restaurant_scope scope
  on scope.restaurant_id = candidate.restaurant_id
  and scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (operation_kind, source_id) do nothing;

do $$
declare
  scope_count integer;
  budget_count integer;
  active_authorizer_count integer;
  runtime_count integer;
  committed bigint;
  cap bigint;
begin
  select count(*) into scope_count
  from veroxa_private.operational_restaurant_scope scope
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled;
  if scope_count <> 1 then
    raise exception using errcode = '55000',
      message = 'momo_upload_to_ready_requires_exactly_one_enabled_scope';
  end if;

  select count(*), max(control.authorization_cap_microusd)
  into budget_count, cap
  from veroxa_private.momo_ai_budget_controls control
  join veroxa_private.operational_restaurant_scope scope
    on scope.restaurant_id = control.restaurant_id
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
    and control.enabled and control.scope_key = 'momo-upload-to-ready-v1'
    and not control.external_publishing_authorized;
  if budget_count <> 1 or cap <> 100000000 then
    raise exception using errcode = '55000',
      message = 'momo_upload_to_ready_budget_seed_invalid';
  end if;

  select count(*) into active_authorizer_count
  from veroxa_private.momo_ai_budget_controls control
  join public.veroxa_restaurant_members member
    on member.restaurant_id = control.restaurant_id
   and member.user_id = control.authorized_by
   and member.role = 'team' and member.status = 'active'
  join public.veroxa_user_profiles profile
    on profile.user_id = control.authorized_by
   and profile.role = 'team' and profile.status = 'active'
  join veroxa_private.operational_restaurant_scope scope
    on scope.restaurant_id = control.restaurant_id
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled;
  if active_authorizer_count <> 1 then
    raise exception using errcode = '55000',
      message = 'momo_upload_to_ready_active_team_authorizer_required';
  end if;

  select count(*) into runtime_count
  from public.veroxa_momo_runtime_controls runtime
  join veroxa_private.operational_restaurant_scope scope
    on scope.restaurant_id = runtime.restaurant_id
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
    and runtime.ai_live_calls
    and not runtime.provider_writes and not runtime.review_replies
    and not runtime.website_writes and not runtime.external_scheduling;
  if runtime_count <> 1 then
    raise exception using errcode = '55000',
      message = 'momo_upload_to_ready_runtime_controls_invalid';
  end if;

  select veroxa_private.momo_ai_committed_microusd_v1(scope.restaurant_id)
  into committed
  from veroxa_private.operational_restaurant_scope scope
  where scope.scope_key = 'momo_house_san_antonio' and scope.enabled;
  if committed > cap then
    raise exception using errcode = '55000',
      message = 'momo_upload_to_ready_backfilled_spend_exceeds_authorization';
  end if;
end;
$$;

comment on table public.veroxa_momo_content_ai_runs is
  'Private Momo/Team Faraz content packages generated from byte-verified media and current real-owner truth. Generation never implies Ready or permission to publish.';
comment on table public.veroxa_momo_ready_packages is
  'Canonical Team-approved Momo packages ready for manual posting only. Effective readiness must be recomputed; external writes remain disabled.';
