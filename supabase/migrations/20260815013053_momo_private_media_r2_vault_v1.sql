-- Forward-only private original-media vault.
--
-- Supabase remains the application source of truth. Every verified original is
-- copied byte-for-byte into a private, content-addressed Cloudflare R2 vault.
-- AI work may continue in parallel, but a new Veroxa Ready package cannot be
-- created until an exact-byte R2 readback receipt is durable. This migration
-- never authorizes posting, scheduling, review replies, website writes, or any
-- other public/provider action.

create table veroxa_private.momo_media_vault_outbox_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null unique
    references public.veroxa_media_assets(id) on delete restrict,
  intake_id uuid not null unique
    references public.veroxa_private_media_assessment_intakes_v1(id)
    on delete restrict,
  correlation_id uuid not null unique default extensions.gen_random_uuid(),
  storage_path text not null,
  storage_object_id uuid not null,
  storage_object_version text not null
    check (char_length(storage_object_version) between 1 and 200),
  mime_type text not null check (mime_type in ('image/jpeg','image/png')),
  file_size bigint not null check (file_size between 10240 and 10485760),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  state text not null default 'pending'
    check (state in ('pending','leased','retry_wait','completed','dead_letter')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  max_attempts integer not null default 5 check (max_attempts = 5),
  next_attempt_at timestamptz,
  lease_token uuid unique,
  lease_expires_at timestamptz,
  last_failure_code text,
  last_evidence_sha256 text
    check (last_evidence_sha256 is null or
      last_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  completed_receipt_id uuid,
  completed_at timestamptz,
  dead_lettered_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  check (storage_path ~ (
    '^restaurants/' || restaurant_id::text ||
    '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
    '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
    '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
  )),
  check (
    (state = 'leased' and lease_token is not null and
      lease_expires_at is not null and next_attempt_at is null)
    or (state <> 'leased' and lease_token is null and lease_expires_at is null)
  ),
  check (
    (state = 'pending' and attempt_count = 0 and next_attempt_at is null)
    or (state = 'leased' and attempt_count between 1 and 5)
    or (state = 'retry_wait' and attempt_count between 1 and 4 and
      next_attempt_at is not null)
    or (state = 'completed' and completed_receipt_id is not null and
      completed_at is not null and next_attempt_at is null and
      dead_lettered_at is null)
    or (state = 'dead_letter' and dead_lettered_at is not null and
      completed_receipt_id is null and next_attempt_at is null)
  )
);

create table veroxa_private.momo_media_vault_receipts_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  outbox_id uuid not null unique
    references veroxa_private.momo_media_vault_outbox_v1(id)
    on delete restrict,
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null unique
    references public.veroxa_media_assets(id) on delete restrict,
  intake_id uuid not null unique
    references public.veroxa_private_media_assessment_intakes_v1(id)
    on delete restrict,
  source_storage_path text not null,
  source_storage_object_id uuid not null,
  source_storage_object_version text not null
    check (char_length(source_storage_object_version) between 1 and 200),
  mime_type text not null check (mime_type in ('image/jpeg','image/png')),
  file_size bigint not null check (file_size between 10240 and 10485760),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  vault_key text not null,
  vault_version text not null check (char_length(vault_version) between 1 and 200),
  vault_etag text not null check (char_length(vault_etag) between 1 and 200),
  verification_snapshot jsonb not null
    check (pg_catalog.jsonb_typeof(verification_snapshot) = 'object'),
  verification_canonical text not null,
  verification_sha256 text not null
    check (verification_sha256 ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  check (source_storage_path ~ (
    '^restaurants/' || restaurant_id::text ||
    '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
    '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
    '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
  )),
  check (vault_key = (
    'private-originals/v1/restaurants/' || restaurant_id::text ||
    '/sha256/' || content_sha256 ||
    case when mime_type = 'image/png' then '.png' else '.jpg' end
  ))
);

alter table veroxa_private.momo_media_vault_outbox_v1
  add constraint momo_media_vault_outbox_receipt_fk_v1
  foreign key (completed_receipt_id)
  references veroxa_private.momo_media_vault_receipts_v1(id)
  on delete restrict;

create index momo_media_vault_outbox_due_v1
  on veroxa_private.momo_media_vault_outbox_v1 (
    coalesce(next_attempt_at, created_at), created_at, id
  ) where state in ('pending','retry_wait','leased');
create index momo_media_vault_receipts_restaurant_v1
  on veroxa_private.momo_media_vault_receipts_v1 (
    restaurant_id, verified_at desc, id
  );
create index momo_media_vault_receipts_key_v1
  on veroxa_private.momo_media_vault_receipts_v1 (vault_key);

alter table veroxa_private.momo_media_vault_outbox_v1 enable row level security;
alter table veroxa_private.momo_media_vault_outbox_v1 force row level security;
alter table veroxa_private.momo_media_vault_receipts_v1 enable row level security;
alter table veroxa_private.momo_media_vault_receipts_v1 force row level security;
revoke all on table veroxa_private.momo_media_vault_outbox_v1
  from public, anon, authenticated, service_role;
revoke all on table veroxa_private.momo_media_vault_receipts_v1
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_media_vault_receipt_guard_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_media_vault_receipt_is_append_only_v1';
end;
$$;
revoke all on function
  veroxa_private.momo_media_vault_receipt_guard_v1()
  from public, anon, authenticated, service_role;
create trigger veroxa_momo_media_vault_receipts_append_only_v1
before update or delete on veroxa_private.momo_media_vault_receipts_v1
for each row execute function
  veroxa_private.momo_media_vault_receipt_guard_v1();

create or replace function veroxa_private.enqueue_momo_media_vault_v1(
  p_intake_id uuid
)
returns veroxa_private.momo_media_vault_outbox_v1
language plpgsql
security definer
set search_path = ''
as $$
declare
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
  receipt veroxa_private.momo_media_vault_outbox_v1%rowtype;
begin
  select * into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.id = p_intake_id
    and candidate.status = 'verified'
  for share;
  if not found
     or intake.detected_mime_type not in ('image/jpeg','image/png')
     or intake.file_size not between 10240 and 10485760
     or intake.content_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514',
      message = 'invalid_momo_media_vault_source_v1';
  end if;

  insert into veroxa_private.momo_media_vault_outbox_v1 (
    restaurant_id, asset_id, intake_id, storage_path, storage_object_id,
    storage_object_version, mime_type, file_size, content_sha256
  ) values (
    intake.restaurant_id, intake.asset_id, intake.id, intake.storage_path,
    intake.storage_object_id, intake.storage_object_version,
    intake.detected_mime_type, intake.file_size, intake.content_sha256
  ) on conflict (asset_id) do nothing;

  select * into strict receipt
  from veroxa_private.momo_media_vault_outbox_v1 target
  where target.asset_id = intake.asset_id;
  if receipt.restaurant_id is distinct from intake.restaurant_id
     or receipt.intake_id is distinct from intake.id
     or receipt.storage_path is distinct from intake.storage_path
     or receipt.storage_object_id is distinct from intake.storage_object_id
     or receipt.storage_object_version is distinct from
       intake.storage_object_version
     or receipt.mime_type is distinct from intake.detected_mime_type
     or receipt.file_size is distinct from intake.file_size
     or receipt.content_sha256 is distinct from intake.content_sha256 then
    raise exception using errcode = '23505',
      message = 'momo_media_vault_outbox_conflict_v1';
  end if;
  return receipt;
end;
$$;
revoke all on function veroxa_private.enqueue_momo_media_vault_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.enqueue_verified_momo_media_vault_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'verified'
     and new.detected_mime_type in ('image/jpeg','image/png')
     and new.file_size between 10240 and 10485760 then
    perform veroxa_private.enqueue_momo_media_vault_v1(new.id);
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enqueue_verified_momo_media_vault_v1()
  from public, anon, authenticated, service_role;
create trigger veroxa_enqueue_verified_momo_media_vault_v1
after insert on public.veroxa_private_media_assessment_intakes_v1
for each row execute function
  veroxa_private.enqueue_verified_momo_media_vault_v1();

create table veroxa_private.momo_media_vault_wake_nonces_v1 (
  nonce uuid primary key,
  signed_at_ms bigint not null,
  accepted_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (signed_at_ms between 1000000000000 and 9999999999999)
);
alter table veroxa_private.momo_media_vault_wake_nonces_v1
  enable row level security;
alter table veroxa_private.momo_media_vault_wake_nonces_v1
  force row level security;
revoke all on table veroxa_private.momo_media_vault_wake_nonces_v1
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_claim_momo_media_vault_v1(
  p_wake_nonce uuid,
  p_signed_at_ms bigint,
  p_lease_token uuid
)
returns table (
  outbox_id uuid,
  restaurant_id uuid,
  asset_id uuid,
  intake_id uuid,
  storage_path text,
  storage_object_id uuid,
  storage_object_version text,
  mime_type text,
  file_size bigint,
  content_sha256 text,
  correlation_id uuid,
  lease_token uuid,
  attempt_count integer,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed veroxa_private.momo_media_vault_outbox_v1%rowtype;
begin
  if p_wake_nonce is null or p_lease_token is null
     or p_wake_nonce = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_signed_at_ms is null
     or pg_catalog.abs(pg_catalog.floor(extract(epoch from
       pg_catalog.clock_timestamp()) * 1000)::bigint - p_signed_at_ms) > 60000
  then
    raise exception using errcode = '42501',
      message = 'momo_media_vault_wake_invalid_v1';
  end if;
  delete from veroxa_private.momo_media_vault_wake_nonces_v1 consumed
  where consumed.accepted_at <
    pg_catalog.clock_timestamp() - interval '10 minutes';
  insert into veroxa_private.momo_media_vault_wake_nonces_v1 (
    nonce, signed_at_ms
  ) values (p_wake_nonce, p_signed_at_ms);

  update veroxa_private.momo_media_vault_outbox_v1 stale
  set state = case when stale.attempt_count >= stale.max_attempts
        then 'dead_letter' else 'retry_wait' end,
      next_attempt_at = case when stale.attempt_count >= stale.max_attempts
        then null else pg_catalog.clock_timestamp() end,
      dead_lettered_at = case when stale.attempt_count >= stale.max_attempts
        then pg_catalog.clock_timestamp() else null end,
      lease_token = null,
      lease_expires_at = null,
      last_failure_code = 'media_vault_lease_expired',
      updated_at = pg_catalog.clock_timestamp()
  where stale.state = 'leased'
    and stale.lease_expires_at <= pg_catalog.clock_timestamp();

  select * into claimed
  from veroxa_private.momo_media_vault_outbox_v1 candidate
  where candidate.state in ('pending','retry_wait')
    and (candidate.next_attempt_at is null or
      candidate.next_attempt_at <= pg_catalog.clock_timestamp())
  order by coalesce(candidate.next_attempt_at, candidate.created_at),
    candidate.created_at, candidate.id
  limit 1
  for update skip locked;
  if not found then return; end if;

  update veroxa_private.momo_media_vault_outbox_v1 target
  set state = 'leased',
      attempt_count = target.attempt_count + 1,
      next_attempt_at = null,
      lease_token = p_lease_token,
      lease_expires_at = pg_catalog.clock_timestamp() + interval '5 minutes',
      updated_at = pg_catalog.clock_timestamp()
  where target.id = claimed.id
  returning * into claimed;

  return query select claimed.id, claimed.restaurant_id, claimed.asset_id,
    claimed.intake_id, claimed.storage_path, claimed.storage_object_id,
    claimed.storage_object_version, claimed.mime_type, claimed.file_size,
    claimed.content_sha256, claimed.correlation_id, claimed.lease_token,
    claimed.attempt_count, false;
end;
$$;
revoke all on function
  public.veroxa_claim_momo_media_vault_v1(uuid,bigint,uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_claim_momo_media_vault_v1(uuid,bigint,uuid)
  to service_role;

create or replace function public.veroxa_complete_momo_media_vault_v1(
  p_outbox_id uuid,
  p_lease_token uuid,
  p_vault_key text,
  p_vault_version text,
  p_vault_etag text,
  p_file_size bigint,
  p_content_sha256 text,
  p_verification_snapshot jsonb,
  p_verification_canonical text,
  p_verification_sha256 text
)
returns table (
  outbox_id uuid,
  asset_id uuid,
  receipt_id uuid,
  status text,
  correlation_id uuid,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  work veroxa_private.momo_media_vault_outbox_v1%rowtype;
  receipt veroxa_private.momo_media_vault_receipts_v1%rowtype;
  expected_key text;
  expected_snapshot jsonb;
  expected_canonical text;
begin
  select * into work
  from veroxa_private.momo_media_vault_outbox_v1 candidate
  where candidate.id = p_outbox_id
  for update;
  if not found or work.state <> 'leased'
     or work.lease_token is distinct from p_lease_token
     or work.lease_expires_at <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '40001',
      message = 'momo_media_vault_lease_invalid_v1';
  end if;
  expected_key := 'private-originals/v1/restaurants/' ||
    work.restaurant_id::text || '/sha256/' || work.content_sha256 ||
    case when work.mime_type = 'image/png' then '.png' else '.jpg' end;
  expected_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 1,
    'verifierVersion', 'veroxa-private-media-vault-2026-08-15-v1',
    'restaurantId', work.restaurant_id,
    'assetId', work.asset_id,
    'intakeId', work.intake_id,
    'sourceStoragePath', work.storage_path,
    'sourceStorageObjectId', work.storage_object_id,
    'sourceStorageObjectVersion', work.storage_object_version,
    'vaultKey', expected_key,
    'vaultVersion', p_vault_version,
    'vaultEtag', p_vault_etag,
    'mimeType', work.mime_type,
    'fileSize', work.file_size,
    'contentSha256', work.content_sha256,
    'readbackHashVerified', true
  );
  expected_canonical :=
    veroxa_private.momo_canonical_json_v1(expected_snapshot);
  if p_vault_key is distinct from expected_key
     or p_file_size is distinct from work.file_size
     or p_content_sha256 is distinct from work.content_sha256
     or char_length(coalesce(p_vault_version, '')) not between 1 and 200
     or char_length(coalesce(p_vault_etag, '')) not between 1 and 200
     or p_verification_snapshot is distinct from expected_snapshot
     or p_verification_canonical is distinct from expected_canonical
     or p_verification_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(expected_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     ) then
    raise exception using errcode = '23514',
      message = 'momo_media_vault_verification_invalid_v1';
  end if;

  insert into veroxa_private.momo_media_vault_receipts_v1 (
    outbox_id, restaurant_id, asset_id, intake_id, source_storage_path,
    source_storage_object_id, source_storage_object_version, mime_type,
    file_size, content_sha256, vault_key, vault_version, vault_etag,
    verification_snapshot, verification_canonical, verification_sha256
  ) values (
    work.id, work.restaurant_id, work.asset_id, work.intake_id,
    work.storage_path, work.storage_object_id, work.storage_object_version,
    work.mime_type, work.file_size, work.content_sha256, expected_key,
    p_vault_version, p_vault_etag, expected_snapshot, expected_canonical,
    p_verification_sha256
  ) on conflict (asset_id) do nothing;
  select * into strict receipt
  from veroxa_private.momo_media_vault_receipts_v1 candidate
  where candidate.asset_id = work.asset_id;
  if receipt.outbox_id is distinct from work.id
     or receipt.intake_id is distinct from work.intake_id
     or receipt.source_storage_object_id is distinct from
       work.storage_object_id
     or receipt.source_storage_object_version is distinct from
       work.storage_object_version
     or receipt.file_size is distinct from work.file_size
     or receipt.content_sha256 is distinct from work.content_sha256
     or receipt.vault_key is distinct from expected_key
     or receipt.verification_sha256 is distinct from p_verification_sha256 then
    raise exception using errcode = '23505',
      message = 'momo_media_vault_receipt_conflict_v1';
  end if;

  update veroxa_private.momo_media_vault_outbox_v1 target
  set state = 'completed', completed_receipt_id = receipt.id,
      completed_at = pg_catalog.clock_timestamp(), lease_token = null,
      lease_expires_at = null, next_attempt_at = null,
      last_failure_code = null, last_evidence_sha256 = null,
      dead_lettered_at = null, updated_at = pg_catalog.clock_timestamp()
  where target.id = work.id;
  return query select work.id, work.asset_id, receipt.id, 'verified'::text,
    work.correlation_id, false;
end;
$$;
revoke all on function public.veroxa_complete_momo_media_vault_v1(
  uuid,uuid,text,text,text,bigint,text,jsonb,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_complete_momo_media_vault_v1(
  uuid,uuid,text,text,text,bigint,text,jsonb,text,text
) to service_role;

create or replace function public.veroxa_fail_momo_media_vault_v1(
  p_outbox_id uuid,
  p_lease_token uuid,
  p_failure_code text,
  p_retryable boolean,
  p_evidence_snapshot jsonb,
  p_evidence_canonical text,
  p_evidence_sha256 text
)
returns table (
  outbox_id uuid,
  asset_id uuid,
  status text,
  failure_code text,
  correlation_id uuid,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  work veroxa_private.momo_media_vault_outbox_v1%rowtype;
  next_state text;
  retry_at timestamptz;
begin
  select * into work
  from veroxa_private.momo_media_vault_outbox_v1 candidate
  where candidate.id = p_outbox_id
  for update;
  if not found or work.state <> 'leased'
     or work.lease_token is distinct from p_lease_token
     or work.lease_expires_at <= pg_catalog.clock_timestamp()
     or p_failure_code !~ '^media_vault_[a-z0-9_]{1,100}$'
     or not veroxa_private.momo_jsonb_exact_keys_v2(
       p_evidence_snapshot, array[
         'schemaVersion','verifierVersion','outboxId','correlationId',
         'restaurantId','assetId','intakeId','sourceStoragePath',
         'sourceStorageObjectId','sourceStorageObjectVersion','contentSha256',
         'attemptCount','failureCode','retryable','externalWriteAllowed'
       ]
     )
     or p_evidence_snapshot -> 'schemaVersion' is distinct from '1'::jsonb
     or p_evidence_snapshot ->> 'verifierVersion' is distinct from
       'veroxa-private-media-vault-2026-08-15-v1'
     or p_evidence_snapshot ->> 'outboxId' is distinct from work.id::text
     or p_evidence_snapshot ->> 'correlationId' is distinct from
       work.correlation_id::text
     or p_evidence_snapshot ->> 'restaurantId' is distinct from
       work.restaurant_id::text
     or p_evidence_snapshot ->> 'assetId' is distinct from work.asset_id::text
     or p_evidence_snapshot ->> 'intakeId' is distinct from work.intake_id::text
     or p_evidence_snapshot ->> 'sourceStoragePath' is distinct from
       work.storage_path
     or p_evidence_snapshot ->> 'sourceStorageObjectId' is distinct from
       work.storage_object_id::text
     or p_evidence_snapshot ->> 'sourceStorageObjectVersion' is distinct from
       work.storage_object_version
     or p_evidence_snapshot ->> 'contentSha256' is distinct from
       work.content_sha256
     or p_evidence_snapshot -> 'attemptCount' is distinct from
       pg_catalog.to_jsonb(work.attempt_count)
     or p_evidence_snapshot ->> 'failureCode' is distinct from p_failure_code
     or p_evidence_snapshot -> 'retryable' is distinct from
       pg_catalog.to_jsonb(p_retryable)
     or p_evidence_snapshot -> 'externalWriteAllowed' is distinct from
       'false'::jsonb
     or p_evidence_canonical is distinct from
       veroxa_private.momo_canonical_json_v1(p_evidence_snapshot)
     or p_evidence_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(p_evidence_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     ) then
    raise exception using errcode = '23514',
      message = 'momo_media_vault_failure_invalid_v1';
  end if;
  next_state := case when p_retryable and work.attempt_count < work.max_attempts
    then 'retry_wait' else 'dead_letter' end;
  retry_at := case when next_state = 'retry_wait' then
    pg_catalog.clock_timestamp() + case work.attempt_count
      when 1 then interval '1 minute'
      when 2 then interval '5 minutes'
      when 3 then interval '15 minutes'
      else interval '1 hour'
    end else null end;
  update veroxa_private.momo_media_vault_outbox_v1 target
  set state = next_state, next_attempt_at = retry_at,
      lease_token = null, lease_expires_at = null,
      last_failure_code = p_failure_code,
      last_evidence_sha256 = p_evidence_sha256,
      dead_lettered_at = case when next_state = 'dead_letter'
        then pg_catalog.clock_timestamp() else null end,
      updated_at = pg_catalog.clock_timestamp()
  where target.id = work.id;
  return query select work.id, work.asset_id, next_state, p_failure_code,
    work.correlation_id, false;
end;
$$;
revoke all on function public.veroxa_fail_momo_media_vault_v1(
  uuid,uuid,text,boolean,jsonb,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_fail_momo_media_vault_v1(
  uuid,uuid,text,boolean,jsonb,text,text
) to service_role;

-- This is the authoritative final-state boundary. AI generation/validation can
-- proceed while the vault worker retries; only Ready creation waits.
create or replace function
  veroxa_private.require_momo_media_vault_before_ready_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from veroxa_private.momo_media_vault_receipts_v1 receipt
    where receipt.restaurant_id = new.restaurant_id
      and receipt.asset_id = new.source_asset_id
      and receipt.intake_id = new.intake_verification_id
      and receipt.source_storage_path = new.source_storage_path
      and receipt.source_storage_object_id = new.source_storage_object_id
      and receipt.source_storage_object_version =
        new.source_storage_object_version
      and receipt.mime_type = new.source_mime_type
      and receipt.file_size = new.source_file_size
      and receipt.content_sha256 = new.source_content_sha256
      and receipt.verification_snapshot -> 'readbackHashVerified' =
        'true'::jsonb
  ) then
    raise exception using errcode = '55000',
      message = 'momo_media_vault_verification_required_v1';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.require_momo_media_vault_before_ready_v1()
  from public, anon, authenticated, service_role;
create trigger veroxa_require_momo_media_vault_before_ready_v1
before insert on public.veroxa_momo_ready_packages_v2
for each row execute function
  veroxa_private.require_momo_media_vault_before_ready_v1();

-- Reconcile all previously verified originals without modifying source bytes.
do $$
declare
  candidate record;
begin
  for candidate in
    select intake.id
    from public.veroxa_private_media_assessment_intakes_v1 intake
    where intake.status = 'verified'
      and intake.detected_mime_type in ('image/jpeg','image/png')
      and intake.file_size between 10240 and 10485760
      and not exists (
        select 1
        from veroxa_private.momo_media_vault_outbox_v1 work
        where work.asset_id = intake.asset_id
      )
    order by intake.verified_at, intake.id
  loop
    perform veroxa_private.enqueue_momo_media_vault_v1(candidate.id);
  end loop;
end;
$$;

create or replace function
  veroxa_private.momo_media_vault_runtime_secret_v1(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_count integer;
  secret_value text;
begin
  if not veroxa_private.momo_content_ai_database_boundary_v1() then
    return null;
  end if;
  if p_name not in (
    'momo_private_media_vault_endpoint_v1',
    'momo_content_ai_internal_hmac_v1'
  ) then return null; end if;
  select pg_catalog.count(*)::integer,
    pg_catalog.min(secret.decrypted_secret)
  into secret_count, secret_value
  from vault.decrypted_secrets secret
  where secret.name = p_name;
  if secret_count <> 1 or secret_value is null
     or secret_value is distinct from pg_catalog.btrim(secret_value) then
    return null;
  end if;
  return secret_value;
end;
$$;
revoke all on function
  veroxa_private.momo_media_vault_runtime_secret_v1(text)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.deliver_momo_media_vault_wake_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  hmac_secret text;
  wake_nonce uuid := extensions.gen_random_uuid();
  signed_at_ms bigint := pg_catalog.floor(extract(epoch from
    pg_catalog.clock_timestamp()) * 1000)::bigint;
  signature text;
  request_id bigint;
  canonical_body constant text := '{"schemaVersion":1}';
  signature_context constant text :=
    'veroxa:momo-private-media-vault-wake:v1' ||
    pg_catalog.chr(10) || 'POST' || pg_catalog.chr(10) ||
    '/api/internal/momo/media/vault';
begin
  if not exists (
    select 1 from veroxa_private.momo_media_vault_outbox_v1 work
    where work.state in ('pending','retry_wait','leased')
      and (work.state = 'leased'
        and work.lease_expires_at <= pg_catalog.clock_timestamp()
        or work.state <> 'leased' and (work.next_attempt_at is null or
          work.next_attempt_at <= pg_catalog.clock_timestamp()))
  ) then return null; end if;
  endpoint := veroxa_private.momo_media_vault_runtime_secret_v1(
    'momo_private_media_vault_endpoint_v1'
  );
  hmac_secret := veroxa_private.momo_media_vault_runtime_secret_v1(
    'momo_content_ai_internal_hmac_v1'
  );
  if endpoint is distinct from
       'https://veroxasystems.com/api/internal/momo/media/vault'
     or hmac_secret is null or hmac_secret !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  signature := pg_catalog.encode(extensions.hmac(
    pg_catalog.convert_to(
      signature_context || pg_catalog.chr(10) || signed_at_ms::text ||
      pg_catalog.chr(10) || wake_nonce::text || pg_catalog.chr(10) ||
      canonical_body, 'UTF8'
    ), pg_catalog.decode(hmac_secret, 'hex'), 'sha256'
  ), 'hex');
  select net.http_post(
    url := endpoint,
    headers := pg_catalog.jsonb_build_object(
      'content-type', 'application/json',
      'x-veroxa-media-vault-timestamp-ms', signed_at_ms::text,
      'x-veroxa-media-vault-nonce', wake_nonce::text,
      'x-veroxa-media-vault-signature', signature
    ),
    body := pg_catalog.jsonb_build_object('schemaVersion', 1),
    timeout_milliseconds := 120000
  ) into request_id;
  if request_id is null then
    raise exception using errcode = '58000',
      message = 'momo_media_vault_delivery_not_queued_v1';
  end if;
  return request_id;
end;
$$;
revoke all on function
  veroxa_private.deliver_momo_media_vault_wake_v1()
  from public, anon, authenticated, service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'veroxa-momo-private-media-vault'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'veroxa-momo-private-media-vault',
    '* * * * *',
    'select veroxa_private.deliver_momo_media_vault_wake_v1();'
  );
end;
$$;

-- Preserve every public/provider action lock.
update public.veroxa_momo_runtime_controls
set provider_writes = false,
    review_replies = false,
    website_writes = false,
    external_scheduling = false,
    updated_at = pg_catalog.clock_timestamp()
where provider_writes or review_replies or website_writes
   or external_scheduling;

comment on table veroxa_private.momo_media_vault_receipts_v1 is
  'Append-only exact-byte R2 readback receipts for private original media. Receipts never authorize publishing or any public/provider write.';
comment on function
  veroxa_private.deliver_momo_media_vault_wake_v1() is
  'Queues one signed private backup wake when due work exists. AI may run independently; Ready remains fail-closed until receipt verification.';
