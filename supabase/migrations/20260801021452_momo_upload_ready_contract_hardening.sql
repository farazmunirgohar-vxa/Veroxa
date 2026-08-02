-- Forward-only hardening for Momo upload-to-Ready.
-- The two preceding upload-to-Ready migrations are already applied in production
-- and must never be edited or replayed.

-- Hold the run table empty for the complete semantic-v4 cutover. This prevents a
-- concurrent reservation from being created after the preflight check but before
-- the v4-only constraints and functions are installed.
lock table public.veroxa_momo_content_ai_runs in access exclusive mode;
do $$
begin
  if exists (select 1 from public.veroxa_momo_content_ai_runs) then
    raise exception using errcode = '55000',
      message = 'momo_content_v4_requires_empty_run_table';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Deterministic JSON evidence and immutable upload verification
-- ---------------------------------------------------------------------------

create or replace function veroxa_private.momo_canonical_json_v1(
  p_value jsonb
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  result text;
begin
  case pg_catalog.jsonb_typeof(p_value)
    when 'object' then
      select '{' || coalesce(pg_catalog.string_agg(
        pg_catalog.to_json(key_name)::text || ':' ||
          veroxa_private.momo_canonical_json_v1(object_value),
        ',' order by key_name collate "C"
      ), '') || '}'
      into result
      from pg_catalog.jsonb_each(p_value) entry(key_name, object_value);
    when 'array' then
      select '[' || coalesce(pg_catalog.string_agg(
        veroxa_private.momo_canonical_json_v1(array_value),
        ',' order by ordinal
      ), '') || ']'
      into result
      from pg_catalog.jsonb_array_elements(p_value)
        with ordinality entry(array_value, ordinal);
    else
      result := p_value::text;
  end case;
  return result;
end;
$$;
revoke all on function veroxa_private.momo_canonical_json_v1(jsonb)
  from public, anon, authenticated, service_role;

alter table public.veroxa_momo_media_intake_verifications
  add column verification_canonical text;

update public.veroxa_momo_media_intake_verifications verification
set verification_canonical = veroxa_private.momo_canonical_json_v1(
  verification.verification_snapshot
);

alter table public.veroxa_momo_media_intake_verifications
  alter column verification_canonical set not null,
  add constraint veroxa_momo_intake_snapshot_exact_v1 check (
    verification_snapshot = pg_catalog.jsonb_build_object(
      'schemaVersion', 1,
      'verifierVersion', verifier_version,
      'restaurantId', restaurant_id,
      'assetId', asset_id,
      'storagePath', storage_path,
      'storageObjectId', storage_object_id,
      'storageObjectVersion', storage_object_version,
      'detectedMime', detected_mime_type,
      'fileSize', file_size,
      'width', width,
      'height', height,
      'contentSha256', content_sha256
    )
  ),
  add constraint veroxa_momo_intake_canonical_exact_v1 check (
    pg_catalog.char_length(verification_canonical) between 2 and 32768
    and verification_canonical =
      veroxa_private.momo_canonical_json_v1(verification_snapshot)
  ),
  add constraint veroxa_momo_intake_hash_exact_v1 check (
    verification_sha256 = pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(verification_canonical, 'UTF8'), 'sha256'
    ), 'hex')
  );

create or replace function veroxa_private.protect_momo_intake_verification_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new is distinct from old then
    raise exception using errcode = '23514',
      message = 'momo_upload_verification_is_immutable';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_momo_intake_verification_v1()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_momo_intake_verification_immutable
  on public.veroxa_momo_media_intake_verifications;
create trigger veroxa_momo_intake_verification_immutable
before update on public.veroxa_momo_media_intake_verifications
for each row execute function veroxa_private.protect_momo_intake_verification_v1();

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
  expected_snapshot jsonb;
  expected_canonical text;
  verification_id uuid;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'momo_upload_member_required';
  end if;
  if p_detected_mime is distinct from 'image/jpeg'
     or p_content_sha256 is null
     or p_content_sha256 !~ '^[0-9a-f]{64}$'
     or p_verification_sha256 is null
     or p_verification_sha256 !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or not coalesce(p_file_size between 10240 and 5242880, false)
     or not coalesce(p_width between 320 and 12000, false)
     or not coalesce(p_height between 250 and 12000, false)
     or not coalesce(
       case when p_height <> 0
         then p_width::numeric / p_height::numeric between 0.8 and 1.91
         else false
       end,
       false
     ) then
    raise exception using errcode = '22023', message = 'invalid_momo_upload_verification';
  end if;

  select * into asset
  from public.veroxa_media_assets
  where id = p_asset_id and restaurant_id = p_restaurant_id
  for update;
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
     or coalesce(object_record.metadata ->> 'mimetype', '')
        is distinct from p_detected_mime
     or (case
       when coalesce(object_record.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
         then (object_record.metadata ->> 'size')::numeric
           is distinct from p_file_size::numeric
       else true
     end) then
    raise exception using errcode = '23514', message = 'momo_upload_storage_object_mismatch';
  end if;

  expected_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 1,
    'verifierVersion', 'momo-image-byte-verifier-2026-07-31-v1',
    'restaurantId', p_restaurant_id,
    'assetId', p_asset_id,
    'storagePath', asset.storage_path,
    'storageObjectId', p_storage_object_id,
    'storageObjectVersion', p_storage_object_version,
    'detectedMime', p_detected_mime,
    'fileSize', p_file_size,
    'width', p_width,
    'height', p_height,
    'contentSha256', p_content_sha256
  );
  expected_canonical := veroxa_private.momo_canonical_json_v1(expected_snapshot);
  if p_verification_snapshot is distinct from expected_snapshot
     or p_verification_canonical is distinct from expected_canonical
     or p_verification_sha256 is distinct from pg_catalog.encode(
       extensions.digest(pg_catalog.convert_to(expected_canonical, 'UTF8'), 'sha256'),
       'hex'
     ) then
    raise exception using errcode = '22023', message = 'invalid_momo_upload_verification';
  end if;

  select * into existing
  from public.veroxa_momo_media_intake_verifications
  where restaurant_id = p_restaurant_id and asset_id = p_asset_id
  for update;
  if found then
    if existing.idempotency_hash = p_idempotency_hash
       and existing.storage_path = asset.storage_path
       and existing.storage_object_id = p_storage_object_id
       and existing.storage_object_version = p_storage_object_version
       and existing.detected_mime_type = p_detected_mime
       and existing.file_size = p_file_size
       and existing.width = p_width
       and existing.height = p_height
       and existing.content_sha256 = p_content_sha256
       and existing.verification_snapshot = expected_snapshot
       and existing.verification_canonical = expected_canonical
       and existing.verification_sha256 = p_verification_sha256 then
      return existing.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_upload_verification_immutable_conflict';
  end if;
  if (asset.content_sha256 is not null and asset.content_sha256 <> p_content_sha256)
     or (asset.width is not null and asset.width <> p_width)
     or (asset.height is not null and asset.height <> p_height) then
    raise exception using errcode = '23505',
      message = 'momo_upload_asset_hash_immutable_conflict';
  end if;

  insert into public.veroxa_momo_media_intake_verifications (
    restaurant_id, asset_id, storage_path, storage_object_id,
    storage_object_version, declared_mime_type, detected_mime_type,
    file_size, width, height, content_sha256, verifier_version,
    verification_snapshot, verification_canonical, verification_sha256,
    idempotency_hash, status, initiated_by
  ) values (
    p_restaurant_id, p_asset_id, asset.storage_path, p_storage_object_id,
    p_storage_object_version, asset.mime_type, p_detected_mime,
    p_file_size, p_width, p_height, p_content_sha256,
    'momo-image-byte-verifier-2026-07-31-v1', expected_snapshot,
    expected_canonical, p_verification_sha256, p_idempotency_hash,
    'verified', p_actor_id
  ) returning id into verification_id;

  update public.veroxa_media_assets
  set content_sha256 = coalesce(content_sha256, p_content_sha256),
      width = coalesce(width, p_width),
      height = coalesce(height, p_height),
      updated_at = pg_catalog.clock_timestamp()
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

-- ---------------------------------------------------------------------------
-- Explicit pre-provider reservation lease
-- ---------------------------------------------------------------------------

alter table public.veroxa_momo_content_ai_runs
  add column reservation_lease_expires_at timestamptz;

update public.veroxa_momo_content_ai_runs run
set reservation_lease_expires_at = greatest(
  run.requested_at + interval '15 minutes',
  coalesce(run.provider_started_at, run.requested_at) + interval '15 minutes'
);

alter table public.veroxa_momo_content_ai_runs
  alter column reservation_lease_expires_at set not null,
  add constraint veroxa_momo_content_ai_lease_valid_v1 check (
    reservation_lease_expires_at > requested_at
  );

create index veroxa_momo_content_ai_reserved_lease_idx
  on public.veroxa_momo_content_ai_runs
    (restaurant_id, reservation_lease_expires_at)
  where status = 'reserved';

alter table public.veroxa_momo_content_ai_runs
  drop constraint veroxa_momo_content_ai_runs_prompt_version_check,
  drop constraint veroxa_momo_content_ai_runs_validator_version_check,
  drop constraint veroxa_momo_content_ai_runs_reserved_microusd_check,
  drop constraint veroxa_momo_content_ai_runs_status_check,
  drop constraint veroxa_momo_content_ai_runs_check1,
  add constraint veroxa_momo_content_ai_runs_prompt_version_check check (
    prompt_version = 'momo-content-package-2026-08-01-v4'
  ),
  add constraint veroxa_momo_content_ai_runs_validator_version_check check (
    validator_version = 'momo-content-validator-2026-08-01-v4'
  ),
  add constraint veroxa_momo_content_ai_runs_reserved_microusd_check check (
    reserved_microusd = 6000000
  ),
  add constraint veroxa_momo_content_ai_runs_status_check check (
    status in (
      'reserved','provider_running','result_staged','pending_review',
      'materialized','rejected','failed'
    )
  ),
  add constraint veroxa_momo_content_ai_output_canonical_exact_v1 check (
    (output_payload is null and output_canonical is null and output_sha256 is null)
    or (
      output_payload is not null
      and output_canonical = veroxa_private.momo_canonical_json_v1(output_payload)
      and output_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(output_canonical, 'UTF8'), 'sha256'
      ), 'hex')
    )
  ),
  add constraint veroxa_momo_content_ai_validation_canonical_exact_v1 check (
    (validation_report is null
      and validation_canonical is null and validation_sha256 is null)
    or (
      validation_report is not null
      and validation_canonical =
        veroxa_private.momo_canonical_json_v1(validation_report)
      and validation_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(validation_canonical, 'UTF8'), 'sha256'
      ), 'hex')
    )
  ),
  add constraint veroxa_momo_content_ai_provider_response_id_v1 check (
    provider_response_id is null or (
      provider_response_id = pg_catalog.btrim(provider_response_id)
      and pg_catalog.char_length(provider_response_id) <= 200
      and provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
    )
  ),
  add constraint veroxa_momo_content_ai_runs_check1 check (coalesce(
    (status = 'reserved'
      and not provider_called and provider_started_at is null
      and provider_response_id is null and provider_usage is null
      and output_payload is null and output_canonical is null
      and output_sha256 is null and validation_report is null
      and validation_canonical is null and validation_sha256 is null
      and provider_error_code is null and accounted_microusd is null
      and accounting_basis is null and completed_at is null
      and team_decided_by is null and team_decided_at is null
      and decision_notes is null)
    or (status = 'provider_running'
      and provider_called and provider_started_at is not null
      and provider_usage is null and output_payload is null
      and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null
      and validation_sha256 is null and provider_error_code is null
      and accounted_microusd is null and accounting_basis is null
      and completed_at is null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'result_staged'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null
      and output_payload is not null and output_canonical is not null
      and output_sha256 is not null and validation_report is not null
      and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'pending_review'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null
      and output_payload is not null and output_canonical is not null
      and output_sha256 is not null and validation_report is not null
      and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'materialized'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null and output_payload is not null
      and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null
      and validation_sha256 is not null and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is not null
      and team_decided_at is not null and decision_notes is null)
    or (status = 'rejected'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null and output_payload is not null
      and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null
      and validation_sha256 is not null and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is not null
      and team_decided_at is not null and decision_notes is not null)
    or (status = 'failed'
      and output_payload is null
      and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null
      and validation_sha256 is null and provider_error_code is not null
      and completed_at is not null and team_decided_by is null
      and team_decided_at is null and decision_notes is null
      and ((provider_called and provider_started_at is not null
        and provider_response_id is not null
        and (
          (provider_usage is null
            and accounted_microusd = reserved_microusd
            and accounting_basis = 'conservative_reservation')
          or (pg_catalog.jsonb_typeof(provider_usage) = 'object'
            and accounted_microusd between 1 and 100000000
            and accounting_basis = 'provider_usage_estimate')
        ))
        or (not provider_called and provider_started_at is null
          and provider_response_id is null
          and provider_usage is null and accounted_microusd = 0
          and accounting_basis = 'zero_pre_provider'))),
    false
  ));

drop index if exists public.veroxa_momo_content_ai_one_active_asset;
create unique index veroxa_momo_content_ai_one_active_asset
  on public.veroxa_momo_content_ai_runs (restaurant_id, source_asset_id)
  where status in (
    'reserved','provider_running','result_staged','pending_review'
  );

-- ---------------------------------------------------------------------------
-- Durable, service-only terminal-result outbox
-- ---------------------------------------------------------------------------

create table veroxa_private.momo_content_ai_result_outbox (
  run_id uuid not null references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  prompt_version text not null check (
    prompt_version = 'momo-content-package-2026-08-01-v4'
  ),
  validator_version text not null check (
    validator_version = 'momo-content-validator-2026-08-01-v4'
  ),
  provider_response_id text not null unique check (
    provider_response_id = pg_catalog.btrim(provider_response_id)
    and pg_catalog.char_length(provider_response_id) <= 200
    and provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
  ),
  output_payload jsonb not null check (
    pg_catalog.jsonb_typeof(output_payload) = 'object'
  ),
  output_canonical text not null check (
    pg_catalog.char_length(output_canonical) between 2 and 262144
    and output_canonical =
      veroxa_private.momo_canonical_json_v1(output_payload)
  ),
  output_sha256 text not null check (
    output_sha256 ~ '^[0-9a-f]{64}$'
    and output_sha256 = pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(output_canonical, 'UTF8'), 'sha256'
    ), 'hex')
  ),
  validation_report jsonb not null check (
    pg_catalog.jsonb_typeof(validation_report) = 'object'
  ),
  validation_canonical text not null check (
    pg_catalog.char_length(validation_canonical) between 2 and 262144
    and validation_canonical =
      veroxa_private.momo_canonical_json_v1(validation_report)
  ),
  validation_sha256 text not null check (
    validation_sha256 ~ '^[0-9a-f]{64}$'
    and validation_sha256 = pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(validation_canonical, 'UTF8'), 'sha256'
    ), 'hex')
  ),
  accounted_microusd bigint not null check (
    accounted_microusd between 1 and 6000000
  ),
  accounting_basis text not null check (
    accounting_basis in ('provider_usage_estimate','conservative_reservation')
  ),
  provider_usage jsonb check (
    provider_usage is null or pg_catalog.jsonb_typeof(provider_usage) = 'object'
  ),
  state text not null default 'staged' check (state in ('staged','applied')),
  staged_by uuid not null references public.veroxa_user_profiles(user_id)
    on delete restrict,
  staged_at timestamptz not null default pg_catalog.clock_timestamp(),
  applied_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (run_id, request_hash),
  unique (run_id),
  check (coalesce(
    (state = 'staged' and applied_at is null)
    or (state = 'applied' and applied_at is not null), false
  )),
  check (coalesce(
    (accounting_basis = 'provider_usage_estimate' and provider_usage is not null)
    or (accounting_basis = 'conservative_reservation' and provider_usage is null),
    false
  ))
);

alter table veroxa_private.momo_content_ai_result_outbox enable row level security;
alter table veroxa_private.momo_content_ai_result_outbox force row level security;
revoke all on table veroxa_private.momo_content_ai_result_outbox
  from public, anon, authenticated, service_role;

create index momo_content_ai_result_outbox_restaurant_state_idx
  on veroxa_private.momo_content_ai_result_outbox
    (restaurant_id, state, staged_at);

create or replace function veroxa_private.guard_momo_content_ai_result_outbox_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.prompt_version is distinct from new.prompt_version
     or old.validator_version is distinct from new.validator_version
     or old.provider_response_id is distinct from new.provider_response_id
     or old.output_payload is distinct from new.output_payload
     or old.output_canonical is distinct from new.output_canonical
     or old.output_sha256 is distinct from new.output_sha256
     or old.validation_report is distinct from new.validation_report
     or old.validation_canonical is distinct from new.validation_canonical
     or old.validation_sha256 is distinct from new.validation_sha256
     or old.accounted_microusd is distinct from new.accounted_microusd
     or old.accounting_basis is distinct from new.accounting_basis
     or old.provider_usage is distinct from new.provider_usage
     or old.staged_by is distinct from new.staged_by
     or old.staged_at is distinct from new.staged_at
     or not (
       (old.state = 'staged' and new.state = 'applied'
         and old.applied_at is null and new.applied_at is not null)
       or (old.state = new.state and old.applied_at is not distinct from new.applied_at)
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_outbox_is_immutable';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function veroxa_private.guard_momo_content_ai_result_outbox_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_result_outbox_guard
before update on veroxa_private.momo_content_ai_result_outbox
for each row execute function veroxa_private.guard_momo_content_ai_result_outbox_v1();

create or replace function
  veroxa_private.enforce_momo_content_ai_result_outbox_consistency_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = new.run_id
  for key share;
  if not found
     or new.request_hash is distinct from run.request_hash
     or new.restaurant_id is distinct from run.restaurant_id
     or new.prompt_version is distinct from run.prompt_version
     or new.validator_version is distinct from run.validator_version
     or new.provider_response_id is distinct from run.provider_response_id
     or new.output_payload is distinct from run.output_payload
     or new.output_canonical is distinct from run.output_canonical
     or new.output_sha256 is distinct from run.output_sha256
     or new.validation_report is distinct from run.validation_report
     or new.validation_canonical is distinct from run.validation_canonical
     or new.validation_sha256 is distinct from run.validation_sha256
     or new.accounted_microusd is distinct from run.accounted_microusd
     or new.accounting_basis is distinct from run.accounting_basis
     or new.provider_usage is distinct from run.provider_usage
     or (new.state = 'staged' and run.status <> 'result_staged')
     or (new.state = 'applied'
       and run.status not in ('pending_review','materialized','rejected')) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_outbox_run_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_result_outbox_consistency_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_result_outbox_consistency
before insert or update on veroxa_private.momo_content_ai_result_outbox
for each row execute function
  veroxa_private.enforce_momo_content_ai_result_outbox_consistency_v1();

-- ---------------------------------------------------------------------------
-- Durable, service-only signed webhook recovery ledger
-- ---------------------------------------------------------------------------

create table veroxa_private.momo_content_ai_webhook_events (
  event_id text primary key check (
    event_id = pg_catalog.btrim(event_id)
    and pg_catalog.char_length(event_id) <= 200
    and event_id ~ '^evt_[A-Za-z0-9_-]{8,196}$'
  ),
  provider_response_id text not null check (
    provider_response_id = pg_catalog.btrim(provider_response_id)
    and pg_catalog.char_length(provider_response_id) <= 200
    and provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
  ),
  run_id uuid not null references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  state text not null default 'claimed' check (
    state in ('claimed','processed','failed')
  ),
  error_code text,
  claimed_at timestamptz not null default pg_catalog.clock_timestamp(),
  finished_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (coalesce(
    (state = 'claimed' and error_code is null and finished_at is null)
    or (state = 'processed' and error_code is null and finished_at is not null)
    or (state = 'failed' and error_code ~ '^[a-z0-9_]{3,80}$'
      and finished_at is not null),
    false
  ))
);

alter table veroxa_private.momo_content_ai_webhook_events
  enable row level security;
alter table veroxa_private.momo_content_ai_webhook_events
  force row level security;
revoke all on table veroxa_private.momo_content_ai_webhook_events
  from public, anon, authenticated, service_role;

create index momo_content_ai_webhook_events_run_state_idx
  on veroxa_private.momo_content_ai_webhook_events
    (run_id, state, claimed_at);

create or replace function
  veroxa_private.guard_momo_content_ai_webhook_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_is_immutable';
  end if;
  if old.event_id is distinct from new.event_id
     or old.provider_response_id is distinct from new.provider_response_id
     or old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.claimed_at is distinct from new.claimed_at
     or old.state <> 'claimed'
     or new.state not in ('processed','failed') then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_is_immutable';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_webhook_event_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_webhook_event_guard
before update or delete on veroxa_private.momo_content_ai_webhook_events
for each row execute function
  veroxa_private.guard_momo_content_ai_webhook_event_v1();

create or replace function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = new.run_id
  for key share;
  if not found
     or new.request_hash is distinct from run.request_hash
     or new.restaurant_id is distinct from run.restaurant_id
     or new.provider_response_id is distinct from run.provider_response_id
     or not run.provider_called
     or run.provider_started_at is null
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_run_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_webhook_event_consistency
before insert or update on veroxa_private.momo_content_ai_webhook_events
for each row execute function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1();

create or replace function veroxa_private.momo_canonical_payload_matches_v1(
  p_payload jsonb,
  p_canonical text,
  p_sha256 text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_payload is null or p_canonical is null or p_sha256 is null
     or pg_catalog.char_length(p_canonical) not between 2 and 262144
     or p_sha256 !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  return p_canonical = veroxa_private.momo_canonical_json_v1(p_payload)
    and p_sha256 = pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(p_canonical, 'UTF8'), 'sha256'
    ), 'hex');
exception when others then
  return false;
end;
$$;

create or replace function veroxa_private.momo_content_seo_phrase_applied_v4(
  p_caption text,
  p_phrase text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  normalized_caption text;
  normalized_phrase text;
  search_from integer := 1;
  relative_hit integer;
  absolute_hit integer;
  after_hit integer;
begin
  if p_caption is null or p_phrase is null then
    return false;
  end if;
  normalized_caption := pg_catalog.regexp_replace(
    pg_catalog.lower(p_caption), '[[:space:]]+', ' ', 'g'
  );
  normalized_phrase := pg_catalog.regexp_replace(
    pg_catalog.btrim(pg_catalog.lower(p_phrase)), '[[:space:]]+', ' ', 'g'
  );
  if normalized_phrase = '' then
    return false;
  end if;

  loop
    relative_hit := pg_catalog.strpos(
      pg_catalog.substr(normalized_caption, search_from), normalized_phrase
    );
    if relative_hit = 0 then
      return false;
    end if;
    absolute_hit := search_from + relative_hit - 1;
    after_hit := absolute_hit + pg_catalog.char_length(normalized_phrase);
    if (absolute_hit = 1 or pg_catalog.substr(
          normalized_caption, absolute_hit - 1, 1
        ) !~ '[A-Za-z0-9]')
       and (after_hit > pg_catalog.char_length(normalized_caption)
         or pg_catalog.substr(normalized_caption, after_hit, 1)
           !~ '[A-Za-z0-9]') then
      return true;
    end if;
    search_from := absolute_hit + 1;
    if search_from > pg_catalog.char_length(normalized_caption) then
      return false;
    end if;
  end loop;
end;
$$;

create or replace function veroxa_private.momo_content_replace_ci_v4(
  p_source text,
  p_needle text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  remainder text := p_source;
  result text := '';
  hit integer;
begin
  if p_source is null then
    return null;
  end if;
  if p_needle is null or p_needle = '' then
    return p_source;
  end if;
  loop
    hit := pg_catalog.strpos(
      pg_catalog.lower(remainder), pg_catalog.lower(p_needle)
    );
    if hit = 0 then
      return result || remainder;
    end if;
    result := result || pg_catalog.substr(remainder, 1, hit - 1) || ' ';
    remainder := pg_catalog.substr(
      remainder, hit + pg_catalog.char_length(p_needle)
    );
  end loop;
end;
$$;

create or replace function
  veroxa_private.momo_content_without_ledgered_claims_v4(
    p_payload jsonb,
    p_destination text
  )
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  result text;
  claim jsonb;
begin
  if p_destination = 'master' then
    result := p_payload ->> 'masterCaption';
  elsif p_destination = 'alt_text' then
    result := p_payload ->> 'altText';
  else
    select variant ->> 'caption' into result
    from pg_catalog.jsonb_array_elements(p_payload -> 'variants') variant
    where variant ->> 'platform' = p_destination;
  end if;
  if result is null then
    return null;
  end if;
  for claim in
    select value
    from pg_catalog.jsonb_array_elements(p_payload -> 'claims') source(value)
    where value -> 'appearsIn' ? p_destination
  loop
    result := veroxa_private.momo_content_replace_ci_v4(
      result, claim ->> 'exactText'
    );
  end loop;
  return result;
exception when others then
  return null;
end;
$$;

create or replace function
  veroxa_private.momo_content_has_unsupported_ungrounded_v4(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_text ~* (
      '\m(popular|most[- ]loved|beloved|best[- ]selling|bestseller|signature)\M'
      || '|\m(customer|crowd|fan|guest)[[:space:]]+(favorite|favourite|choice|pick)\M'
      || '|\m(favorite|favourite)\M'
      || '|\m(fresh|freshly|house[- ]made|homemade|handmade)\M'
      || '|\m(made|prepared|cooked|baked)[[:space:]]+(today|daily|fresh|freshly|in[- ]house|to[[:space:]]+order)\M'
      || '|\m(authentic|traditional|genuine|original)\M'
      || '|\m(delicious|tasty|savoury|savory|flavourful|flavorful|flavour|flavor|crispy|creamy|juicy|tender)\M'
      || '|\m(offers?|provides?)\M'
      || '|\m(warm|welcoming|inviting)[[:space:]]+(dining|restaurant|setting|space|atmosphere|environment)\M'
    ),
    false
  );
$$;

create or replace function
  veroxa_private.momo_content_has_blocked_marketing_v4(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_text ~* (
      '\mnear[[:space:]]+me\M'
      || '|\m(best|number[[:space:]]+one|top[- ]rated|award[- ]winning|most[[:space:]]+popular)\M'
      || '|\m(cheap|cheapest|lowest[[:space:]]+price)\M'
      || '|\m(trending|viral)\M'
      || '|\m(act[[:space:]]+now|hurry|limited[[:space:]]+time|don''t[[:space:]]+miss[[:space:]]+out|while[[:space:]]+supplies[[:space:]]+last)\M'
      || '|\m(follow[[:space:]]+for[[:space:]]+follow|like[[:space:]]+and[[:space:]]+share|tag[[:space:]]+(all|three|your)[[:space:]]+friends)\M'
    ) or pg_catalog.strpos(pg_catalog.lower(coalesce(p_text, '')), '#1') > 0,
    false
  );
$$;

create or replace function veroxa_private.momo_content_payload_v4_extra_valid_v1(
  p_payload jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  variant jsonb;
  phrase jsonb;
  claim jsonb;
  destination text;
  remainder text;
  word_count integer;
  has_anchor boolean;
  all_objective boolean;
  uppercase_count integer;
begin
  if pg_catalog.jsonb_typeof(p_payload) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_payload -> 'variants') is distinct from 'array'
     or pg_catalog.jsonb_typeof(p_payload -> 'seoPhrases') is distinct from 'array'
     or pg_catalog.jsonb_typeof(p_payload -> 'claims') is distinct from 'array' then
    return false;
  end if;

  if veroxa_private.momo_content_has_blocked_marketing_v4(
       p_payload ->> 'masterCaption'
     ) then
    return false;
  end if;
  select pg_catalog.count(*) into uppercase_count
  from pg_catalog.regexp_matches(
    coalesce(p_payload ->> 'masterCaption', ''),
    '\m[A-Z]{4,}\M', 'g'
  );
  if uppercase_count >= 2 then
    return false;
  end if;
  if coalesce(p_payload ->> 'altText', '') ~* (
       '^(an? )?(image|photo|picture)[[:space:]]+of\M'
       || '|\m(best|delicious|mouthwatering|must[- ]try|irresistible)\M'
       || '|https?://|#[A-Za-z]'
     ) then
    return false;
  end if;

  for variant in
    select value from pg_catalog.jsonb_array_elements(p_payload -> 'variants')
  loop
    if veroxa_private.momo_content_has_blocked_marketing_v4(
         variant ->> 'caption'
       ) then
      return false;
    end if;
    select pg_catalog.count(*) into uppercase_count
    from pg_catalog.regexp_matches(
      coalesce(variant ->> 'caption', ''),
      '\m[A-Z]{4,}\M', 'g'
    );
    if uppercase_count >= 2 then
      return false;
    end if;
    for phrase in
      select source.value
      from pg_catalog.jsonb_array_elements(p_payload -> 'seoPhrases') source(value)
      where variant -> 'seoPhraseIds' ? (source.value ->> 'id')
    loop
      if not veroxa_private.momo_content_seo_phrase_applied_v4(
        variant ->> 'caption', phrase ->> 'phrase'
      ) then
        return false;
      end if;
    end loop;
  end loop;

  foreach destination in array array['master','alt_text']::text[] loop
    remainder := veroxa_private.momo_content_without_ledgered_claims_v4(
      p_payload, destination
    );
    if remainder is null
       or veroxa_private.momo_content_has_unsupported_ungrounded_v4(
         remainder
       )
       or exists (
         select 1
         from pg_catalog.unnest(
           veroxa_private.momo_content_tokens_v1(remainder)
         ) token
         where token <> all(array[
           'a','an','and','are','area','as','at','await','background','brings',
           'centered','clear','come','discover','discovering','diners','dining',
           'explore','find','for','from','here','in','introduction','inviting',
           'is','lit','local','made','moment','new','no','of','offers','on','our',
           'plan','restaurant','see','serves','setting','simple','softly',
           'something','table','the','this','to','today','us','view','visit',
           'warm','welcoming','with','your'
         ]::text[])
       ) then
      return false;
    end if;
  end loop;

  for variant in
    select value from pg_catalog.jsonb_array_elements(p_payload -> 'variants')
  loop
    destination := variant ->> 'platform';
    remainder := veroxa_private.momo_content_without_ledgered_claims_v4(
      p_payload, destination
    );
    if remainder is null
       or veroxa_private.momo_content_has_unsupported_ungrounded_v4(
         remainder
       )
       or exists (
         select 1
         from pg_catalog.unnest(
           veroxa_private.momo_content_tokens_v1(remainder)
         ) token
         where token <> all(array[
           'a','an','and','are','area','as','at','await','background','brings',
           'centered','clear','come','discover','discovering','diners','dining',
           'explore','find','for','from','here','in','introduction','inviting',
           'is','lit','local','made','moment','new','no','of','offers','on','our',
           'plan','restaurant','see','serves','setting','simple','softly',
           'something','table','the','this','to','today','us','view','visit',
           'warm','welcoming','with','your'
         ]::text[])
       ) then
      return false;
    end if;
  end loop;

  for claim in
    select value from pg_catalog.jsonb_array_elements(p_payload -> 'claims')
  loop
    if claim ->> 'source' <> 'owner_truth'
       and veroxa_private.momo_content_has_unsupported_ungrounded_v4(
         claim ->> 'exactText'
       ) then
      return false;
    end if;
    if claim ->> 'source' = 'visible_media' then
      select pg_catalog.count(*),
        coalesce(pg_catalog.bool_or(token = any(array[
          'background','bowl','counter','cup','dish','door','exterior','food',
          'foreground','glass','hand','hands','interior','light','lighting',
          'person','people','plate','plated','restaurant','serving','sign',
          'table','tray','window'
        ]::text[])), false),
        coalesce(pg_catalog.bool_and(token = any(array[
          'an','and','at','background','beside','bowl','centered','counter',
          'cup','dish','door','exterior','food','foreground','glass','hand',
          'hands','in','interior','light','lighting','near','on','person',
          'people','plate','plated','restaurant','serving','sign','softly',
          'table','the','tray','window','with'
        ]::text[])), false)
      into word_count, has_anchor, all_objective
      from pg_catalog.regexp_split_to_table(
        pg_catalog.regexp_replace(
          pg_catalog.lower(coalesce(claim ->> 'exactText', '')),
          '[^a-z0-9]+', ' ', 'g'
        ),
        '[[:space:]]+'
      ) token
      where pg_catalog.char_length(token) > 1;
      if claim ->> 'category' <> 'visual'
         or word_count not between 1 and 12
         or not has_anchor
         or not all_objective
         or veroxa_private.momo_content_has_blocked_marketing_v4(
           claim ->> 'exactText'
         )
         or veroxa_private.momo_content_has_unsupported_ungrounded_v4(
           claim ->> 'exactText'
         )
         or coalesce(claim ->> 'exactText', '') ~* (
           '\m(amazing|appealing|appetizing|beautiful|gorgeous|mouthwatering|perfect|premium|stunning|tempting|high[- ]quality|quality|experience)\M'
           || '|\m(customers?|crowd|fans?|guests?|diners?|locals?)\M'
           || '|\m(serves?|available|menu|offer|service)\M'
         ) then
        return false;
      end if;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function veroxa_private.momo_current_content_contract_valid_v1(
  p_payload jsonb,
  p_platforms jsonb,
  p_truth_snapshot jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not coalesce(
       veroxa_private.momo_content_payload_contract_valid_v1(
         p_payload, p_platforms, p_truth_snapshot
       ),
       false
     ) then
    return false;
  end if;
  return coalesce(
    veroxa_private.momo_content_payload_v4_extra_valid_v1(p_payload), false
  );
exception when others then
  return false;
end;
$$;

revoke all on function
  veroxa_private.momo_canonical_payload_matches_v1(jsonb,text,text),
  veroxa_private.momo_content_seo_phrase_applied_v4(text,text),
  veroxa_private.momo_content_replace_ci_v4(text,text),
  veroxa_private.momo_content_without_ledgered_claims_v4(jsonb,text),
  veroxa_private.momo_content_has_unsupported_ungrounded_v4(text),
  veroxa_private.momo_content_has_blocked_marketing_v4(text),
  veroxa_private.momo_content_payload_v4_extra_valid_v1(jsonb),
  veroxa_private.momo_current_content_contract_valid_v1(jsonb,jsonb,jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.guard_momo_ready_package_v4()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = new.content_ai_run_id
  for key share;
  if not found
     or run.status <> 'pending_review'
     or run.restaurant_id is distinct from new.restaurant_id
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4'
     or new.status <> 'ready_to_post'
     or new.external_write_allowed
     or new.approved_payload is distinct from run.output_payload
     or new.approved_payload_sha256 is distinct from run.output_sha256
     or new.validation_sha256 is distinct from run.validation_sha256
     or run.validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or run.validation_report -> 'passed' is distinct from 'true'::jsonb
     or run.validation_report -> 'platformSet'
        is distinct from run.target_platforms
     or not veroxa_private.momo_canonical_payload_matches_v1(
       run.output_payload, run.output_canonical, run.output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       run.validation_report, run.validation_canonical, run.validation_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       new.schedule_snapshot, new.schedule_canonical, new.schedule_sha256
     )
     or not veroxa_private.momo_current_content_contract_valid_v1(
       run.output_payload, run.target_platforms, run.truth_snapshot
     )
     or not veroxa_private.momo_content_ai_current_evidence_v1(
       run.id, new.approved_by
     )
     or not exists (
       select 1
       from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
         and outbox.request_hash = run.request_hash
         and outbox.state = 'applied'
         and outbox.output_sha256 = run.output_sha256
         and outbox.validation_sha256 = run.validation_sha256
     ) then
    raise exception using errcode = '23514',
      message = 'momo_ready_v4_contract_failed';
  end if;
  return new;
exception when others then
  if sqlstate in ('23514','42501') then
    raise;
  end if;
  raise exception using errcode = '23514',
    message = 'momo_ready_v4_contract_failed';
end;
$$;
revoke all on function veroxa_private.guard_momo_ready_package_v4()
  from public, anon, authenticated, service_role;
drop trigger if exists veroxa_momo_ready_package_v4_guard
  on public.veroxa_momo_ready_packages;
create trigger veroxa_momo_ready_package_v4_guard
before insert on public.veroxa_momo_ready_packages
for each row execute function veroxa_private.guard_momo_ready_package_v4();

create or replace function public.veroxa_record_momo_content_ai_provider_response_v1(
  p_run_id uuid,
  p_request_hash text,
  p_provider_response_id text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_provider_response_rejected';
  end if;
  if run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_started_at is null
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(p_provider_response_id)
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_provider_response_invalid';
  end if;
  if run.provider_response_id is not null then
    if run.provider_response_id = p_provider_response_id then
      return run.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_provider_response_conflict';
  end if;
  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs other_run
    where other_run.provider_response_id = p_provider_response_id
      and other_run.id <> run.id
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_provider_response_conflict';
  end if;
  update public.veroxa_momo_content_ai_runs target_run
  set provider_response_id = p_provider_response_id,
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id;
  return run.id;
end;
$$;
revoke all on function public.veroxa_record_momo_content_ai_provider_response_v1(
  uuid,text,text,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_record_momo_content_ai_provider_response_v1(
  uuid,text,text,uuid
) to service_role;

-- A verified webhook can recover the provider identity without relying on an
-- open browser. Exact retries return the same immutable reservation snapshot;
-- no mutable evidence or new budget authorization is consulted here.
create or replace function public.veroxa_claim_momo_content_ai_webhook_v1(
  p_event_id text,
  p_provider_response_id text,
  p_run_id uuid,
  p_request_hash text
)
returns table (
  run_id uuid, run_status text, request_hash text,
  source_storage_path text, source_mime_type text, source_file_size bigint,
  source_content_sha256 text, source_width integer, source_height integer,
  target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text,
  reserved_microusd bigint, provider_response_id text, output_payload jsonb,
  requested_by uuid, event_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  webhook_event veroxa_private.momo_content_ai_webhook_events%rowtype;
begin
  if p_event_id is null
     or p_event_id is distinct from pg_catalog.btrim(p_event_id)
     or pg_catalog.char_length(p_event_id) > 200
     or p_event_id !~ '^evt_[A-Za-z0-9_-]{8,196}$'
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(
       p_provider_response_id
     )
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or p_run_id is null
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_webhook_claim';
  end if;

  -- Claim, finish, and abort all lock the run first so their transitions are
  -- serialized and cannot disagree about whether a provider ID exists.
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not run.provider_called
     or run.provider_started_at is null
     or run.status not in (
       'provider_running','result_staged','pending_review',
       'materialized','rejected','failed'
     )
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_run_invalid';
  end if;

  select * into webhook_event
  from veroxa_private.momo_content_ai_webhook_events target_event
  where target_event.event_id = p_event_id
  for update;
  if found then
    if webhook_event.provider_response_id is distinct from p_provider_response_id
       or webhook_event.run_id is distinct from run.id
       or webhook_event.request_hash is distinct from run.request_hash
       or webhook_event.restaurant_id is distinct from run.restaurant_id
       or run.provider_response_id is distinct from p_provider_response_id then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_webhook_claim_conflict';
    end if;
    return query select run.id, run.status, run.request_hash,
      run.source_storage_path, run.source_mime_type, run.source_file_size,
      run.source_content_sha256, run.source_width, run.source_height,
      run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
      run.reserved_microusd, run.provider_response_id, run.output_payload,
      run.requested_by, webhook_event.state;
    return;
  end if;

  if run.provider_response_id is null then
    if run.status <> 'provider_running' then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_run_invalid';
    end if;
    update public.veroxa_momo_content_ai_runs target_run
    set provider_response_id = p_provider_response_id,
        updated_at = pg_catalog.clock_timestamp()
    where target_run.id = run.id
      and target_run.status = 'provider_running'
      and target_run.provider_response_id is null
    returning target_run.* into run;
    if not found then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_claim_race';
    end if;
  elsif run.provider_response_id is distinct from p_provider_response_id then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_response_conflict';
  end if;

  insert into veroxa_private.momo_content_ai_webhook_events (
    event_id, provider_response_id, run_id, request_hash, restaurant_id
  ) values (
    p_event_id, p_provider_response_id, run.id, run.request_hash,
    run.restaurant_id
  ) returning * into webhook_event;

  return query select run.id, run.status, run.request_hash,
    run.source_storage_path, run.source_mime_type, run.source_file_size,
    run.source_content_sha256, run.source_width, run.source_height,
    run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
    run.reserved_microusd, run.provider_response_id, run.output_payload,
    run.requested_by, webhook_event.state;
end;
$$;
revoke all on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,uuid,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,uuid,text
) to service_role;

create or replace function public.veroxa_finish_momo_content_ai_webhook_v1(
  p_event_id text,
  p_provider_response_id text,
  p_run_id uuid,
  p_request_hash text,
  p_outcome text,
  p_error_code text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  webhook_event veroxa_private.momo_content_ai_webhook_events%rowtype;
  changed_rows integer;
begin
  if p_event_id is null
     or p_event_id is distinct from pg_catalog.btrim(p_event_id)
     or pg_catalog.char_length(p_event_id) > 200
     or p_event_id !~ '^evt_[A-Za-z0-9_-]{8,196}$'
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(
       p_provider_response_id
     )
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or p_run_id is null
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_outcome is null
     or p_outcome not in ('processed','failed')
     or (p_outcome = 'processed' and p_error_code is not null)
     or (p_outcome = 'failed'
       and (p_error_code is null
         or p_error_code !~ '^[a-z0-9_]{3,80}$')) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_webhook_finish';
  end if;

  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or run.provider_response_id is distinct from p_provider_response_id
     or not run.provider_called
     or run.provider_started_at is null then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_run_invalid';
  end if;

  select * into webhook_event
  from veroxa_private.momo_content_ai_webhook_events target_event
  where target_event.event_id = p_event_id
  for update;
  if not found
     or webhook_event.provider_response_id is distinct from p_provider_response_id
     or webhook_event.run_id is distinct from run.id
     or webhook_event.request_hash is distinct from run.request_hash
     or webhook_event.restaurant_id is distinct from run.restaurant_id then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_invalid';
  end if;

  if webhook_event.state <> 'claimed' then
    if webhook_event.state = p_outcome
       and webhook_event.error_code is not distinct from p_error_code then
      return webhook_event.event_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_finish_conflict';
  end if;

  update veroxa_private.momo_content_ai_webhook_events target_event
  set state = p_outcome,
      error_code = p_error_code,
      finished_at = pg_catalog.clock_timestamp()
  where target_event.event_id = webhook_event.event_id
    and target_event.state = 'claimed';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_finish_race';
  end if;
  return webhook_event.event_id;
end;
$$;
revoke all on function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,text,text
) to service_role;

create or replace function public.veroxa_stage_momo_content_ai_result_v1(
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
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
  ledger_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_result_stage_rejected';
  end if;

  -- An exact terminal-result replay is reconciliation, not a fresh validation
  -- attempt. The original insert already passed v4 and settled the ledger.
  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if found then
    if staged.restaurant_id = run.restaurant_id
       and staged.prompt_version = run.prompt_version
       and staged.validator_version = run.validator_version
       and staged.provider_response_id = p_provider_response_id
       and staged.output_payload = p_output_payload
       and staged.output_canonical = p_output_canonical
       and staged.output_sha256 = p_output_sha256
       and staged.validation_report = p_validation_report
       and staged.validation_canonical = p_validation_canonical
       and staged.validation_sha256 = p_validation_sha256
       and staged.accounted_microusd = p_accounted_microusd
       and staged.accounting_basis = p_accounting_basis
       and staged.provider_usage is not distinct from p_provider_usage
       and run.provider_response_id = staged.provider_response_id
       and run.output_payload = staged.output_payload
       and run.output_canonical = staged.output_canonical
       and run.output_sha256 = staged.output_sha256
       and run.validation_report = staged.validation_report
       and run.validation_canonical = staged.validation_canonical
       and run.validation_sha256 = staged.validation_sha256
       and run.accounted_microusd = staged.accounted_microusd
       and run.accounting_basis = staged.accounting_basis
       and run.provider_usage is not distinct from staged.provider_usage
       and ((run.status = 'result_staged' and staged.state = 'staged')
         or (run.status in ('pending_review','materialized','rejected')
           and staged.state = 'applied'))
       and exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = run.id
           and ledger.restaurant_id = run.restaurant_id
           and ledger.idempotency_hash = run.idempotency_hash
           and ledger.state = 'settled'
           and ledger.provider_called
           and ledger.reserved_microusd = run.reserved_microusd
           and ledger.accounted_microusd = staged.accounted_microusd
           and ledger.accounting_basis = staged.accounting_basis
       ) then
      return staged.run_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_result_stage_conflict';
  end if;

  if run.status not in (
       'provider_running','result_staged','pending_review','materialized','rejected'
     )
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4'
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is distinct from p_provider_response_id
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(p_provider_response_id)
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or pg_catalog.jsonb_typeof(p_output_payload) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_validation_report) is distinct from 'object'
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_output_payload, p_output_canonical, p_output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_validation_report, p_validation_canonical, p_validation_sha256
     )
     or p_validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or p_validation_report -> 'passed' is distinct from 'true'::jsonb
     or p_validation_report -> 'platformSet' is distinct from run.target_platforms
     or not veroxa_private.momo_current_content_contract_valid_v1(
       p_output_payload, run.target_platforms, run.truth_snapshot
     )
     or p_accounted_microusd not between 1 and run.reserved_microusd
     or p_accounting_basis not in (
       'provider_usage_estimate','conservative_reservation'
     )
     or (p_accounting_basis = 'provider_usage_estimate'
       and pg_catalog.jsonb_typeof(p_provider_usage) is distinct from 'object')
     or (p_accounting_basis = 'conservative_reservation'
       and (p_provider_usage is not null
         or p_accounted_microusd <> run.reserved_microusd)) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_result_stage';
  end if;

  if p_accounting_basis = 'provider_usage_estimate' then
    begin
      if (select pg_catalog.count(*)
          from pg_catalog.jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_usage';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 25000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_usage';
      end if;
      expected_microusd := usage_input * (
        case when usage_input > 272000 then 10 else 5 end
      ) + usage_output * (
        case when usage_input > 272000 then 45 else 30 end
      );
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and run.reserved_microusd then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_cost';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'invalid_momo_content_ai_result_stage_usage';
    end;
  end if;

  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs other_run
    where other_run.provider_response_id = p_provider_response_id
      and other_run.id <> run.id
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_provider_response_conflict';
  end if;

  if run.status <> 'provider_running' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_stage_state_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'result_staged',
      provider_usage = p_provider_usage,
      output_payload = p_output_payload,
      output_canonical = p_output_canonical,
      output_sha256 = p_output_sha256,
      validation_report = p_validation_report,
      validation_canonical = p_validation_canonical,
      validation_sha256 = p_validation_sha256,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis,
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'provider_running';

  insert into veroxa_private.momo_content_ai_result_outbox (
    run_id, request_hash, restaurant_id, prompt_version, validator_version,
    provider_response_id,
    output_payload, output_canonical, output_sha256,
    validation_report, validation_canonical, validation_sha256,
    accounted_microusd, accounting_basis, provider_usage,
    state, staged_by, applied_at
  ) values (
    run.id, run.request_hash, run.restaurant_id, run.prompt_version,
    run.validator_version, p_provider_response_id,
    p_output_payload, p_output_canonical, p_output_sha256,
    p_validation_report, p_validation_canonical, p_validation_sha256,
    p_accounted_microusd, p_accounting_basis, p_provider_usage,
    'staged', p_actor_id, null
  );

  update veroxa_private.momo_ai_cost_ledger ledger
  set state = 'settled', provider_called = true,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis,
      updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id
    and ledger.restaurant_id = run.restaurant_id
    and ledger.idempotency_hash = run.idempotency_hash
    and ledger.state = 'reserved'
    and ledger.provider_called
    and ledger.reserved_microusd = run.reserved_microusd
    and ledger.accounted_microusd is null
    and ledger.accounting_basis is null;
  get diagnostics ledger_rows = row_count;
  if ledger_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_ledger_settlement_failed';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_stage_momo_content_ai_result_v1(
  uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_stage_momo_content_ai_result_v1(
  uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) to service_role;

create or replace function public.veroxa_complete_staged_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  outbox_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_staged_completion_rejected';
  end if;

  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if not found
     or staged.restaurant_id is distinct from run.restaurant_id
     or staged.prompt_version is distinct from run.prompt_version
     or staged.validator_version is distinct from run.validator_version
     or staged.provider_response_id is distinct from run.provider_response_id
     or staged.output_payload is distinct from run.output_payload
     or staged.output_canonical is distinct from run.output_canonical
     or staged.output_sha256 is distinct from run.output_sha256
     or staged.validation_report is distinct from run.validation_report
     or staged.validation_canonical is distinct from run.validation_canonical
     or staged.validation_sha256 is distinct from run.validation_sha256
     or staged.accounted_microusd is distinct from run.accounted_microusd
     or staged.accounting_basis is distinct from run.accounting_basis
     or staged.provider_usage is distinct from run.provider_usage then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_required';
  end if;

  if run.status in ('pending_review','materialized','rejected') then
    if staged.state <> 'applied' then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_staged_completion_conflict';
    end if;
    return run.id;
  end if;

  if run.status <> 'result_staged'
     or staged.state <> 'staged'
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4'
     or not exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'settled'
         and ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd = run.accounted_microusd
         and ledger.accounting_basis = run.accounting_basis
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_no_longer_valid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'pending_review',
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'result_staged';
  if not found then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  update veroxa_private.momo_content_ai_result_outbox outbox
  set state = 'applied', applied_at = pg_catalog.clock_timestamp()
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
    and outbox.state = 'staged';
  get diagnostics outbox_rows = row_count;
  if outbox_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_complete_staged_momo_content_ai_run_v1(
  uuid,text,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_complete_staged_momo_content_ai_run_v1(
  uuid,text,uuid
) to service_role;

-- Persisted provider state is authoritative. A caller may not invent a provider
-- call, response ID, or cost, and a lost response may not downgrade known state.
-- If a valid paid result was staged, failure reconciliation consumes it instead.
revoke all on function public.veroxa_fail_momo_content_ai_run_v1(
  uuid,text,text,boolean,bigint,jsonb,uuid
) from public, anon, authenticated, service_role;
drop function public.veroxa_fail_momo_content_ai_run_v1(
  uuid,text,text,boolean,bigint,jsonb,uuid
);
create function public.veroxa_fail_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_provider_response_id text,
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
  ledger_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or p_provider_response_id is distinct from run.provider_response_id
     or p_error_code is null
     or p_error_code !~ '^[a-z0-9_]{3,80}$'
     or p_provider_called is null
     or p_provider_called is distinct from run.provider_called
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;

  if exists (
    select 1
    from veroxa_private.momo_content_ai_result_outbox outbox
    where outbox.run_id = run.id
      and outbox.request_hash = run.request_hash
      and outbox.state in ('staged','applied')
  ) then
    return public.veroxa_complete_staged_momo_content_ai_run_v1(
      run.id, run.request_hash, p_actor_id
    );
  end if;

  -- A provider call without a durable response identity is ambiguous. Keep it
  -- blocked until signed recovery records the ID or the pre-POST bridge proves
  -- that no provider request was sent.
  if run.status = 'provider_running'
     and run.provider_response_id is null then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_provider_identity_reconciliation_required';
  end if;

  actual_called := run.provider_called;
  if (p_provider_called and not actual_called)
     or (actual_called and run.provider_started_at is null)
     or (not actual_called
       and (p_accounted_microusd is not null or p_provider_usage is not null)) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_failure_state_invalid';
  end if;

  if p_provider_usage is not null then
    begin
      if not actual_called
         or pg_catalog.jsonb_typeof(p_provider_usage) is distinct from 'object'
         or (select pg_catalog.count(*)
             from pg_catalog.jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023',
          message = 'momo_content_ai_failure_usage_invalid';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 128000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023',
          message = 'momo_content_ai_failure_usage_invalid';
      end if;
      expected_microusd := usage_input * (
        case when usage_input > 272000 then 10 else 5 end
      ) + usage_output * (
        case when usage_input > 272000 then 45 else 30 end
      );
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and 100000000 then
        raise exception using errcode = '22023',
          message = 'momo_content_ai_failure_cost_invalid';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'momo_content_ai_failure_usage_invalid';
    end;
    target_accounted := expected_microusd;
    target_basis := 'provider_usage_estimate';
    target_state := 'settled';
  elsif actual_called then
    if p_accounted_microusd is not null then
      raise exception using errcode = '22023',
        message = 'momo_content_ai_failure_cost_invalid';
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
       and run.accounting_basis = target_basis
       and exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = run.id
           and ledger.restaurant_id = run.restaurant_id
           and ledger.idempotency_hash = run.idempotency_hash
           and ledger.state = target_state
           and ledger.provider_called = actual_called
           and ledger.reserved_microusd = run.reserved_microusd
           and ledger.accounted_microusd = target_accounted
           and ledger.accounting_basis = target_basis
       ) then
      return run.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_failure_replay_conflict';
  end if;
  if run.status not in ('reserved','provider_running') then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_failure_state_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'failed',
      provider_called = actual_called,
      provider_error_code = p_error_code,
      provider_usage = p_provider_usage,
      accounted_microusd = target_accounted,
      accounting_basis = target_basis,
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id;
  update veroxa_private.momo_ai_cost_ledger ledger
  set state = target_state,
      provider_called = actual_called,
      accounted_microusd = target_accounted,
      accounting_basis = target_basis,
      updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id
    and ledger.restaurant_id = run.restaurant_id
    and ledger.idempotency_hash = run.idempotency_hash
    and ledger.state = 'reserved'
    and ledger.provider_called = actual_called
    and ledger.reserved_microusd = run.reserved_microusd
    and ledger.accounted_microusd is null
    and ledger.accounting_basis is null;
  get diagnostics ledger_rows = row_count;
  if ledger_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_failure_ledger_settlement_failed';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_fail_momo_content_ai_run_v1(
  uuid,text,text,text,boolean,bigint,jsonb,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_fail_momo_content_ai_run_v1(
  uuid,text,text,text,boolean,bigint,jsonb,uuid
) to service_role;

-- Exact idempotency replay is a read/reconcile operation, not a new spend.
-- Expired reservations that never reached a provider release their ledger entry;
-- an exact replay renews its own lease without creating another reservation.
drop function public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text);
create function public.veroxa_reserve_momo_content_ai_run_v1(
  p_restaurant_id uuid,
  p_source_asset_id uuid,
  p_idempotency_hash text,
  p_client_request_hash text,
  p_recovery_response_id text
)
returns table (
  run_id uuid, run_status text, request_hash text,
  source_storage_path text, source_mime_type text, source_file_size bigint,
  source_content_sha256 text, source_width integer, source_height integer,
  target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text,
  reserved_microusd bigint, provider_response_id text, output_payload jsonb
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
  recoverable_run public.veroxa_momo_content_ai_runs%rowtype;
  snapshot jsonb;
  snapshot_hash text;
  platforms jsonb;
  computed_request_hash text;
  new_id uuid;
  ledger_rows integer;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_client_request_hash !~ '^[0-9a-f]{64}$'
     or (p_recovery_response_id is not null and (
       p_recovery_response_id is distinct from pg_catalog.btrim(
         p_recovery_response_id
       )
       or pg_catalog.char_length(p_recovery_response_id) > 200
       or p_recovery_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     )) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_team_required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_source_asset_id::text, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_idempotency_hash, 0
  ));

  -- Exact replay is determined only from immutable request identity and is
  -- returned before current rights, review, truth, runtime, or budget checks.
  select * into existing
  from public.veroxa_momo_content_ai_runs run
  where run.restaurant_id = p_restaurant_id
    and run.idempotency_hash = p_idempotency_hash
  for update;
  if found then
    if existing.source_asset_id <> p_source_asset_id
       or existing.client_request_hash <> p_client_request_hash then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_idempotency_conflict';
    end if;
    if existing.status = 'reserved'
       and existing.reservation_lease_expires_at
         <= pg_catalog.clock_timestamp() then
      if veroxa_private.momo_content_ai_current_evidence_v1(
           existing.id, actor_id
         ) then
        update public.veroxa_momo_content_ai_runs run
        set reservation_lease_expires_at =
              pg_catalog.clock_timestamp() + interval '15 minutes',
            updated_at = pg_catalog.clock_timestamp()
        where run.id = existing.id
        returning run.* into existing;
      else
        update public.veroxa_momo_content_ai_runs run
        set status = 'failed',
            provider_error_code = 'reserved_evidence_superseded',
            accounted_microusd = 0,
            accounting_basis = 'zero_pre_provider',
            completed_at = pg_catalog.clock_timestamp(),
            updated_at = pg_catalog.clock_timestamp()
        where run.id = existing.id and run.status = 'reserved'
        returning run.* into existing;
        update veroxa_private.momo_ai_cost_ledger ledger
        set state = 'released', provider_called = false,
            accounted_microusd = 0,
            accounting_basis = 'zero_pre_provider',
            updated_at = pg_catalog.clock_timestamp()
        where ledger.operation_kind = 'content_package'
          and ledger.source_id = existing.id
          and ledger.restaurant_id = existing.restaurant_id
          and ledger.idempotency_hash = existing.idempotency_hash
          and ledger.state = 'reserved'
          and not ledger.provider_called
          and ledger.reserved_microusd = existing.reserved_microusd
          and ledger.accounted_microusd is null
          and ledger.accounting_basis is null;
        get diagnostics ledger_rows = row_count;
        if ledger_rows <> 1 then
          raise exception using errcode = '23514',
            message = 'momo_content_ai_reserved_release_failed';
        end if;
      end if;
    end if;
    return query select existing.id, existing.status, existing.request_hash,
      existing.source_storage_path, existing.source_mime_type,
      existing.source_file_size, existing.source_content_sha256,
      existing.source_width, existing.source_height,
      existing.target_platforms, existing.truth_snapshot,
      existing.truth_snapshot_sha256, existing.reserved_microusd,
      existing.provider_response_id, existing.output_payload;
    return;
  end if;

  select * into asset
  from public.veroxa_media_assets
  where id = p_source_asset_id and restaurant_id = p_restaurant_id
  for share;
  select * into intake
  from public.veroxa_momo_media_intake_verifications
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id
    and status = 'verified'
  for share;
  select * into rights
  from public.veroxa_media_rights
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id
  for share;
  select * into review
  from public.veroxa_media_reviews
  where asset_id = p_source_asset_id and restaurant_id = p_restaurant_id
    and is_current
  for share;
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
     or (rights.valid_from is not null and rights.valid_from > pg_catalog.now())
     or (rights.expires_at is not null and rights.expires_at <= pg_catalog.now())
     or review.status <> 'approved'
     or not review.public_use_approved
     or not coalesce(review.quality_score between 80 and 100, false)
     or review.reviewed_by is null
     or review.reviewed_at is null
     or pg_catalog.char_length(pg_catalog.btrim(
       coalesce(review.quality_notes, '')
     )) < 10 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_source_not_ready';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(platform order by platform), '[]'::jsonb
  ) into platforms
  from (
    select distinct value as platform
    from pg_catalog.jsonb_array_elements_text(rights.usage_scope)
    where value in ('facebook','instagram','google_business')
  ) scoped;
  if pg_catalog.jsonb_array_length(platforms) = 0 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_no_authorized_platform';
  end if;

  snapshot := veroxa_private.current_momo_truth_snapshot_v1(p_restaurant_id);
  if pg_catalog.jsonb_array_length(snapshot) < 3
     or pg_catalog.octet_length(snapshot::text) > 32768
     or not exists (
       select 1 from pg_catalog.jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'identity.display_name'
     )
     or not exists (
       select 1 from pg_catalog.jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'address.primary'
     )
     or not exists (
       select 1 from pg_catalog.jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'identity.cuisine'
     )
     or not exists (
       select 1 from pg_catalog.jsonb_array_elements(snapshot) field
       where field ->> 'fieldKey' = 'menu.primary'
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_owner_truth_incomplete';
  end if;
  snapshot_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    snapshot::text, 'UTF8'
  ), 'sha256'), 'hex');
  computed_request_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(pg_catalog.concat_ws('|',
      p_client_request_hash, asset.id::text, intake.id::text,
      intake.storage_object_id::text, intake.storage_object_version,
      intake.content_sha256, rights.id::text, rights.attestation_sha256,
      review.id::text, snapshot_hash, platforms::text
    ), 'UTF8'), 'sha256'
  ), 'hex');

  -- A reservation that never crossed the provider boundary is safe to release.
  for recoverable_run in
    select run.*
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = p_restaurant_id
      and run.source_asset_id = p_source_asset_id
      and run.status = 'reserved'
      and run.reservation_lease_expires_at <= pg_catalog.clock_timestamp()
    for update
  loop
    update public.veroxa_momo_content_ai_runs run
    set status = 'failed',
        provider_error_code = 'reservation_lease_expired',
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        completed_at = pg_catalog.clock_timestamp(),
        updated_at = pg_catalog.clock_timestamp()
    where run.id = recoverable_run.id;
    update veroxa_private.momo_ai_cost_ledger ledger
    set state = 'released', provider_called = false,
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        updated_at = pg_catalog.clock_timestamp()
    where ledger.operation_kind = 'content_package'
      and ledger.source_id = recoverable_run.id;
  end loop;

  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = p_restaurant_id
      and run.source_asset_id = p_source_asset_id
      and run.status in (
        'reserved','provider_running','result_staged','pending_review'
      )
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_active_run_exists';
  end if;

  select * into control
  from veroxa_private.momo_ai_budget_controls budget
  where budget.restaurant_id = p_restaurant_id
  for update;
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
       select 1
       from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = p_restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     )
     or veroxa_private.momo_ai_committed_microusd_v1(p_restaurant_id)
          + 6000000 > control.authorization_cap_microusd then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_budget_or_runtime_unavailable';
  end if;

  insert into public.veroxa_momo_content_ai_runs (
    restaurant_id, source_asset_id, intake_verification_id,
    source_storage_path, source_storage_object_id,
    source_storage_object_version, source_mime_type, source_file_size,
    source_width, source_height, source_content_sha256, rights_id,
    rights_attestation_sha256, review_id, truth_snapshot,
    truth_snapshot_sha256, target_platforms, model, reasoning_effort,
    prompt_version, schema_version, validator_version, pricing_version,
    idempotency_hash, client_request_hash, request_hash, requested_by,
    reserved_microusd, reservation_lease_expires_at
  ) values (
    p_restaurant_id, p_source_asset_id, intake.id, asset.storage_path,
    intake.storage_object_id, intake.storage_object_version, asset.mime_type,
    asset.file_size, asset.width, asset.height, asset.content_sha256,
    rights.id, rights.attestation_sha256, review.id, snapshot, snapshot_hash,
    platforms, 'gpt-5.6-sol', 'high',
    'momo-content-package-2026-08-01-v4', 'momo-content-package-v1',
    'momo-content-validator-2026-08-01-v4',
    'openai-gpt-5.6-sol-2026-08-01-v2', p_idempotency_hash,
    p_client_request_hash, computed_request_hash, actor_id, 6000000,
    pg_catalog.clock_timestamp() + interval '15 minutes'
  ) returning id into new_id;
  insert into veroxa_private.momo_ai_cost_ledger (
    restaurant_id, operation_kind, source_id, idempotency_hash, state,
    provider_called, reserved_microusd
  ) values (
    p_restaurant_id, 'content_package', new_id, p_idempotency_hash,
    'reserved', false, 6000000
  );
  return query select run.id, run.status, run.request_hash,
    run.source_storage_path, run.source_mime_type, run.source_file_size,
    run.source_content_sha256, run.source_width, run.source_height,
    run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
    run.reserved_microusd, run.provider_response_id, run.output_payload
  from public.veroxa_momo_content_ai_runs run
  where run.id = new_id;
end;
$$;
revoke all on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid,uuid,text,text,text
) from public, anon, service_role;
grant execute on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid,uuid,text,text,text
) to authenticated;

create or replace function public.veroxa_start_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;
  if run.status = 'provider_running' then
    return query select run.id, false, run.status;
    return;
  end if;
  if run.status <> 'reserved' then
    return query select run.id, false, run.status;
    return;
  end if;
  if run.reservation_lease_expires_at <= pg_catalog.clock_timestamp() then
    update public.veroxa_momo_content_ai_runs target_run
    set status = 'failed',
        provider_error_code = 'reservation_lease_expired',
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        completed_at = pg_catalog.clock_timestamp(),
        updated_at = pg_catalog.clock_timestamp()
    where target_run.id = run.id;
    update veroxa_private.momo_ai_cost_ledger ledger
    set state = 'released', provider_called = false,
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        updated_at = pg_catalog.clock_timestamp()
    where ledger.operation_kind = 'content_package'
      and ledger.source_id = run.id;
    return query select run.id, false, 'failed'::text;
    return;
  end if;
  if not veroxa_private.momo_content_ai_current_evidence_v1(
       p_run_id, p_actor_id
     )
     or not exists (
       select 1
       from veroxa_private.momo_ai_budget_controls budget
       where budget.restaurant_id = run.restaurant_id and budget.enabled
     )
     or not exists (
       select 1
       from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = run.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;
  update public.veroxa_momo_content_ai_runs target_run
  set status = 'provider_running', provider_called = true,
      provider_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id;
  update veroxa_private.momo_ai_cost_ledger ledger
  set provider_called = true, updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id;
  return query select run.id, true, 'provider_running'::text;
end;
$$;
revoke all on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid
) to service_role;

-- This narrow reset is called only by the signed server bridge on a branch
-- proven to have thrown before any provider POST began. A timeout, network
-- error, or missing provider response after fetch starts must never call it.
create or replace function public.veroxa_abort_momo_content_ai_before_provider_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  changed_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_abort_before_provider_rejected';
  end if;

  -- Exact retry after a successful reset is a no-op. The ledger must already
  -- agree with the pre-provider reservation state.
  if run.status = 'reserved'
     and not run.provider_called
     and run.provider_started_at is null
     and run.provider_response_id is null
     and run.provider_usage is null
     and run.output_payload is null
     and run.output_canonical is null
     and run.output_sha256 is null
     and run.validation_report is null
     and run.validation_canonical is null
     and run.validation_sha256 is null
     and run.provider_error_code is null
     and run.accounted_microusd is null
     and run.accounting_basis is null
     and run.completed_at is null
     and run.team_decided_by is null
     and run.team_decided_at is null
     and run.decision_notes is null
     and not exists (
       select 1
       from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
     )
     and not exists (
       select 1
       from veroxa_private.momo_content_ai_webhook_events webhook_event
       where webhook_event.run_id = run.id
     )
     and exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'reserved'
         and not ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd is null
         and ledger.accounting_basis is null
     ) then
    return run.id;
  end if;
  if run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is not null
     or run.provider_usage is not null
     or run.output_payload is not null
     or run.output_canonical is not null
     or run.output_sha256 is not null
     or run.validation_report is not null
     or run.validation_canonical is not null
     or run.validation_sha256 is not null
     or run.provider_error_code is not null
     or run.accounted_microusd is not null
     or run.accounting_basis is not null
     or run.completed_at is not null
     or exists (
       select 1
       from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
     )
     or exists (
       select 1
       from veroxa_private.momo_content_ai_webhook_events webhook_event
       where webhook_event.run_id = run.id
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_abort_before_provider_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'reserved',
      provider_called = false,
      provider_started_at = null,
      reservation_lease_expires_at =
        pg_catalog.clock_timestamp() + interval '15 minutes',
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id
    and target_run.status = 'provider_running'
    and target_run.provider_called
    and target_run.provider_response_id is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_abort_before_provider_race';
  end if;

  update veroxa_private.momo_ai_cost_ledger ledger
  set provider_called = false,
      updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id
    and ledger.restaurant_id = run.restaurant_id
    and ledger.idempotency_hash = run.idempotency_hash
    and ledger.state = 'reserved'
    and ledger.provider_called
    and ledger.reserved_microusd = run.reserved_microusd
    and ledger.accounted_microusd is null
    and ledger.accounting_basis is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_abort_before_provider_ledger_invalid';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid
) to service_role;

-- Legacy direct completion remains owner-only for migration compatibility.
-- Service callers must use stage followed by complete_staged.
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
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
  outbox_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;

  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if not found
     or staged.restaurant_id is distinct from run.restaurant_id
     or staged.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or staged.validator_version <> 'momo-content-validator-2026-08-01-v4'
     or staged.provider_response_id is distinct from p_provider_response_id
     or staged.output_payload is distinct from p_output_payload
     or staged.output_canonical is distinct from p_output_canonical
     or staged.output_sha256 is distinct from p_output_sha256
     or staged.validation_report is distinct from p_validation_report
     or staged.validation_canonical is distinct from p_validation_canonical
     or staged.validation_sha256 is distinct from p_validation_sha256
     or staged.accounted_microusd is distinct from p_accounted_microusd
     or staged.accounting_basis is distinct from p_accounting_basis
     or staged.provider_usage is distinct from p_provider_usage then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_required';
  end if;

  if run.status in ('pending_review','materialized','rejected') then
    if staged.state = 'applied'
       and run.provider_response_id = p_provider_response_id
       and run.output_payload = p_output_payload
       and run.output_canonical = p_output_canonical
       and run.output_sha256 = p_output_sha256
       and run.validation_report = p_validation_report
       and run.validation_canonical = p_validation_canonical
       and run.validation_sha256 = p_validation_sha256
       and run.accounted_microusd = p_accounted_microusd
       and run.accounting_basis = p_accounting_basis
       and run.provider_usage is not distinct from p_provider_usage then
      return run.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_completion_conflict';
  end if;

  if run.status <> 'result_staged'
     or staged.state <> 'staged'
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4'
     or run.provider_response_id is distinct from p_provider_response_id
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(
       p_provider_response_id
     )
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or pg_catalog.jsonb_typeof(p_output_payload) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_validation_report) is distinct from 'object'
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_output_payload, p_output_canonical, p_output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_validation_report, p_validation_canonical, p_validation_sha256
     )
     or p_validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or p_validation_report -> 'passed' is distinct from 'true'::jsonb
     or p_validation_report -> 'platformSet' is distinct from run.target_platforms
     or not veroxa_private.momo_current_content_contract_valid_v1(
       p_output_payload, run.target_platforms, run.truth_snapshot
     )
     or p_accounted_microusd not between 1 and run.reserved_microusd
     or p_accounting_basis not in (
       'provider_usage_estimate','conservative_reservation'
     )
     or (p_accounting_basis = 'provider_usage_estimate'
       and pg_catalog.jsonb_typeof(p_provider_usage) is distinct from 'object')
     or (p_accounting_basis = 'conservative_reservation'
       and (p_provider_usage is not null
         or p_accounted_microusd <> run.reserved_microusd))
     or not exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'settled'
         and ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd = p_accounted_microusd
         and ledger.accounting_basis = p_accounting_basis
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_completion';
  end if;

  if p_accounting_basis = 'provider_usage_estimate' then
    begin
      if (select pg_catalog.count(*)
          from pg_catalog.jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_usage';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 25000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_usage';
      end if;
      expected_microusd := usage_input * (
        case when usage_input > 272000 then 10 else 5 end
      ) + usage_output * (
        case when usage_input > 272000 then 45 else 30 end
      );
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and run.reserved_microusd then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_cost';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'invalid_momo_content_ai_completion_usage';
    end;
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'pending_review',
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'result_staged';
  update veroxa_private.momo_content_ai_result_outbox outbox
  set state = 'applied', applied_at = pg_catalog.clock_timestamp()
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
    and outbox.state = 'staged';
  get diagnostics outbox_rows = row_count;
  if outbox_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_complete_momo_content_ai_run_v1(
  uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Effective Ready is recalculated with current rules and fails closed
-- ---------------------------------------------------------------------------

create or replace function veroxa_private.momo_chicago_minute_v1(
  p_value text
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  local_value timestamp without time zone;
  zoned_value timestamptz;
begin
  if p_value is null
     or p_value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then
    return null;
  end if;
  local_value := p_value::timestamp without time zone;
  zoned_value := local_value at time zone 'America/Chicago';
  if pg_catalog.to_char(
       zoned_value at time zone 'America/Chicago',
       'YYYY-MM-DD"T"HH24:MI'
     ) <> p_value
     or pg_catalog.date_trunc('minute', zoned_value) <> zoned_value then
    return null;
  end if;
  return zoned_value;
exception when others then
  return null;
end;
$$;
revoke all on function veroxa_private.momo_chicago_minute_v1(text)
  from public, anon, authenticated, service_role;

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
  select * into package
  from public.veroxa_momo_ready_packages
  where id = p_ready_package_id;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(
       package.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_package_team_required';
  end if;

  begin
    select * into run
    from public.veroxa_momo_content_ai_runs
    where id = package.content_ai_run_id;
    select * into rights
    from public.veroxa_media_rights
    where id = package.rights_id;

    if run.id is null
       or run.status <> 'materialized'
       or package.restaurant_id is distinct from run.restaurant_id
       or package.source_asset_id is distinct from run.source_asset_id
       or package.source_storage_path is distinct from run.source_storage_path
       or package.source_storage_object_id
          is distinct from run.source_storage_object_id
       or package.source_storage_object_version
          is distinct from run.source_storage_object_version
       or package.source_mime_type is distinct from run.source_mime_type
       or package.source_file_size is distinct from run.source_file_size
       or package.source_width is distinct from run.source_width
       or package.source_height is distinct from run.source_height
       or package.source_content_sha256
          is distinct from run.source_content_sha256
       or package.intake_verification_id
          is distinct from run.intake_verification_id
       or package.rights_id is distinct from run.rights_id
       or package.rights_attestation_sha256
          is distinct from run.rights_attestation_sha256
       or package.review_id is distinct from run.review_id
       or package.truth_snapshot_sha256
          is distinct from run.truth_snapshot_sha256
       or package.approved_payload is distinct from run.output_payload
       or package.approved_payload_sha256 is distinct from run.output_sha256
       or package.validation_sha256 is distinct from run.validation_sha256
       or not veroxa_private.momo_canonical_payload_matches_v1(
         run.output_payload, run.output_canonical, run.output_sha256
       )
       or not veroxa_private.momo_canonical_payload_matches_v1(
         run.validation_report, run.validation_canonical,
         run.validation_sha256
       )
       or not veroxa_private.momo_canonical_payload_matches_v1(
         package.schedule_snapshot, package.schedule_canonical,
         package.schedule_sha256
       )
       or package.status <> 'ready_to_post'
       or package.external_write_allowed then
      problems := problems || '"package_integrity_changed"'::jsonb;
    end if;

    if run.id is null
       or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
       or run.validator_version <> 'momo-content-validator-2026-08-01-v4'
       or run.validation_report ->> 'validatorVersion'
          is distinct from run.validator_version
       or run.validation_report -> 'passed' is distinct from 'true'::jsonb
       or run.validation_report -> 'platformSet'
          is distinct from run.target_platforms then
      problems := problems || '"validation_evidence_changed"'::jsonb;
    end if;

    if run.id is null
       or not veroxa_private.momo_current_content_contract_valid_v1(
         package.approved_payload, run.target_platforms, run.truth_snapshot
       ) then
      problems := problems || '"content_contract_changed"'::jsonb;
    end if;

    if not veroxa_private.momo_content_ai_current_evidence_v1(
      package.content_ai_run_id, (select auth.uid())
    ) then
      problems := problems || '"evidence_changed"'::jsonb;
    end if;

    if exists (
      select 1
      from public.veroxa_momo_ready_package_variants variant
      where variant.ready_package_id = package.id
        and (
          variant.restaurant_id is distinct from package.restaurant_id
          or variant.status <> 'ready_to_post'
          or variant.external_write_allowed
          or variant.media_source_kind <> 'original_accepted'
          or variant.media_asset_id is distinct from package.source_asset_id
          or variant.media_review_id is distinct from package.review_id
          or variant.media_storage_path
             is distinct from package.source_storage_path
          or variant.media_storage_object_id
             is distinct from package.source_storage_object_id
          or variant.media_storage_object_version
             is distinct from package.source_storage_object_version
          or variant.media_mime_type is distinct from package.source_mime_type
          or variant.media_file_size is distinct from package.source_file_size
          or variant.media_width is distinct from package.source_width
          or variant.media_height is distinct from package.source_height
          or variant.media_content_sha256
             is distinct from package.source_content_sha256
          or not exists (
            select 1
            from storage.objects object
            where object.bucket_id = 'restaurant-media'
              and object.name = variant.media_storage_path
              and object.id = variant.media_storage_object_id
              and object.version = variant.media_storage_object_version
              and coalesce(object.metadata ->> 'mimetype', '')
                = variant.media_mime_type
              and case
                when coalesce(object.metadata ->> 'size', '')
                  ~ '^[0-9]{1,30}$'
                  then (object.metadata ->> 'size')::numeric
                    = variant.media_file_size::numeric
                else false
              end
          )
          or variant.timezone <> 'America/Chicago'
          or variant.caption is distinct from (
            select source ->> 'caption'
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'variants'
            ) source
            where source ->> 'platform' = variant.platform
          )
          or variant.alt_text
             is distinct from package.approved_payload ->> 'altText'
          or variant.call_to_action is distinct from (
            select source -> 'cta'
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'variants'
            ) source
            where source ->> 'platform' = variant.platform
          )
          or variant.hashtags is distinct from coalesce((
            select pg_catalog.jsonb_agg(tag ->> 'tag' order by tag ->> 'tag')
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'hashtags'
            ) tag
            where (
              select source -> 'hashtagIds'
              from pg_catalog.jsonb_array_elements(
                package.approved_payload -> 'variants'
              ) source
              where source ->> 'platform' = variant.platform
            ) ? (tag ->> 'id')
          ), '[]'::jsonb)
          or variant.seo_phrases is distinct from coalesce((
            select pg_catalog.jsonb_agg(
              phrase ->> 'phrase' order by phrase ->> 'phrase'
            )
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'seoPhrases'
            ) phrase
            where (
              select source -> 'seoPhraseIds'
              from pg_catalog.jsonb_array_elements(
                package.approved_payload -> 'variants'
              ) source
              where source ->> 'platform' = variant.platform
            ) ? (phrase ->> 'id')
          ), '[]'::jsonb)
          or variant.caption_sha256 is distinct from pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(variant.caption, 'UTF8'), 'sha256'
            ), 'hex'
          )
          or veroxa_private.momo_chicago_minute_v1(
            package.schedule_snapshot ->> variant.platform
          ) is distinct from variant.scheduled_for
          or variant.scheduled_for <= pg_catalog.now()
          or (rights.expires_at is not null
            and variant.scheduled_for >= rights.expires_at)
          or pg_catalog.jsonb_array_length(variant.seo_phrases)
             not between 3 and 8
          or variant.caption ~ '#[A-Za-z]'
          or (variant.platform = 'instagram'
            and pg_catalog.jsonb_array_length(variant.hashtags)
              not between 3 and 5)
          or (variant.platform = 'facebook'
            and pg_catalog.jsonb_array_length(variant.hashtags)
              not between 0 and 3)
          or (variant.platform = 'google_business'
            and pg_catalog.jsonb_array_length(variant.hashtags) <> 0)
        )
    ) then
      problems := problems || '"variant_integrity_changed"'::jsonb;
    end if;

    if run.id is null
       or (select pg_catalog.count(*)
           from public.veroxa_momo_ready_package_variants variant
           where variant.ready_package_id = package.id)
          <> pg_catalog.jsonb_array_length(run.target_platforms)
       or exists (
         select 1
         from pg_catalog.jsonb_array_elements_text(
           run.target_platforms
         ) platform
         where not exists (
           select 1
           from public.veroxa_momo_ready_package_variants variant
           where variant.ready_package_id = package.id
             and variant.platform = platform.value
         )
       )
       or (select pg_catalog.count(*)
           from pg_catalog.jsonb_object_keys(package.schedule_snapshot))
          <> pg_catalog.jsonb_array_length(run.target_platforms) then
      problems := problems || '"variant_set_changed"'::jsonb;
    end if;

    if not exists (
      select 1
      from public.veroxa_momo_runtime_controls runtime
      where runtime.restaurant_id = package.restaurant_id
        and not runtime.provider_writes
        and not runtime.review_replies
        and not runtime.website_writes
        and not runtime.external_scheduling
    ) then
      problems := problems || '"external_write_lock_changed"'::jsonb;
    end if;

    if exists (
      select 1
      from public.veroxa_publish_queue queue
      where queue.restaurant_id = package.restaurant_id
    ) or exists (
      select 1
      from public.veroxa_publish_attempts attempt
      where attempt.restaurant_id = package.restaurant_id
    ) or exists (
      select 1
      from public.veroxa_content_calendar calendar
      where calendar.restaurant_id = package.restaurant_id
        and (calendar.status not in (
          'draft','awaiting_approval','approved','cancelled'
        ) or calendar.published_at is not null)
    ) or exists (
      select 1
      from public.veroxa_media_usage usage
      where usage.restaurant_id = package.restaurant_id
        and (usage.usage_kind = 'published'
          or usage.external_reference is not null)
    ) then
      problems := problems || '"posting_boundary_violated"'::jsonb;
    end if;

    return query select package.id,
      case
        when pg_catalog.jsonb_array_length(problems) = 0
          then 'ready_to_post'
        else 'blocked'
      end,
      problems;
  exception when others then
    return query select package.id, 'blocked'::text,
      '["integrity_check_failed_closed"]'::jsonb;
  end;
end;
$$;
revoke all on function public.veroxa_momo_ready_package_status_v1(uuid)
  from public, anon, service_role;
grant execute on function public.veroxa_momo_ready_package_status_v1(uuid)
  to authenticated;

comment on table veroxa_private.momo_content_ai_result_outbox is
  'Restricted durable Momo provider-result outbox. A paid validated result is staged before run completion and can be consumed idempotently without another provider call.';
