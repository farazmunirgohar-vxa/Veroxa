-- Forward-only durable media ingestion and recovery.
--
-- Registration and private object upload are separate storage/database
-- boundaries.  This migration makes every registered asset acquire one
-- durable ingestion receipt in the same database transaction, then processes
-- receipts through a service-role-only leased worker.  It never authorizes a
-- provider, review reply, website write, schedule, publication, or other
-- external action.

create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create table veroxa_private.momo_media_ingestion_outbox_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null unique
    references public.veroxa_media_assets(id) on delete restrict,
  actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  correlation_id uuid not null unique default extensions.gen_random_uuid(),
  storage_path text not null,
  declared_mime_type text not null
    check (declared_mime_type in ('image/jpeg','image/png')),
  declared_file_size bigint not null
    check (declared_file_size between 10240 and 10485760),
  state text not null default 'pending'
    check (state in (
      'pending','leased','retry_wait','completed','dead_letter'
    )),
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  max_attempts integer not null default 5 check (max_attempts = 5),
  next_attempt_at timestamptz,
  lease_token uuid unique,
  lease_expires_at timestamptz,
  last_failure_stage text,
  last_failure_code text,
  last_evidence_sha256 text
    check (last_evidence_sha256 is null or
      last_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  last_attempt_id uuid
    references public.veroxa_momo_media_intake_attempts_v2(id)
    on delete restrict,
  completed_verification_id uuid
    references public.veroxa_private_media_assessment_intakes_v1(id)
    on delete restrict,
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
    '[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|jpeg|png)$'
  )),
  check (
    (state = 'leased' and lease_token is not null and
      lease_expires_at is not null and next_attempt_at is null)
    or
    (state <> 'leased' and lease_token is null and lease_expires_at is null)
  ),
  check (
    (state = 'pending' and attempt_count = 0 and next_attempt_at is null)
    or (state = 'retry_wait' and attempt_count between 1 and 4 and
      next_attempt_at is not null)
    or (state = 'leased' and attempt_count between 1 and 5)
    or (state = 'completed' and completed_verification_id is not null and
      completed_at is not null and next_attempt_at is null and
      dead_lettered_at is null)
    or (state = 'dead_letter' and dead_lettered_at is not null and
      next_attempt_at is null and completed_verification_id is null)
  )
);

create index momo_media_ingestion_outbox_due_v1
  on veroxa_private.momo_media_ingestion_outbox_v1 (
    coalesce(next_attempt_at, created_at), created_at, id
  ) where state in ('pending','retry_wait','leased');
create index momo_media_ingestion_outbox_restaurant_v1
  on veroxa_private.momo_media_ingestion_outbox_v1 (
    restaurant_id, created_at desc
  );

alter table veroxa_private.momo_media_ingestion_outbox_v1
  enable row level security;
alter table veroxa_private.momo_media_ingestion_outbox_v1
  force row level security;
revoke all on table veroxa_private.momo_media_ingestion_outbox_v1
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_media_recovery_actor_v1(
  p_restaurant_id uuid,
  p_original_actor_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  recovery_actor_id uuid;
begin
  if veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_original_actor_id
  ) then
    return p_original_actor_id;
  end if;
  select member.user_id into recovery_actor_id
  from public.veroxa_restaurant_members member
  where member.restaurant_id = p_restaurant_id
    and member.role = 'team'
    and veroxa_private.momo_actor_has_operational_membership_v1(
      p_restaurant_id, member.user_id
    )
  order by member.created_at, member.user_id
  limit 1;
  return recovery_actor_id;
end;
$$;
revoke all on function
  veroxa_private.momo_media_recovery_actor_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

-- Recovery failures must remain recordable after the original uploader is
-- deactivated. This helper binds the immutable outbox provenance, attributes
-- the row to the original actor or a deterministic active Team recovery actor,
-- and creates the same durable Team exception without a current-membership
-- dependency on the historical uploader.
create or replace function
  veroxa_private.record_momo_media_ingestion_attempt_v1(
    p_outbox_id uuid,
    p_payload jsonb
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  recovery_actor_id uuid;
  outcome text;
  reasons jsonb;
  evidence_snapshot jsonb;
  evidence_canonical text;
  evidence_sha256 text;
  idempotency_sha256 text;
  attempt public.veroxa_momo_media_intake_attempts_v2%rowtype;
  exception_snapshot jsonb;
  exception_canonical text;
  exception_sha256 text;
begin
  select * into receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 candidate
  where candidate.id = p_outbox_id;
  outcome := p_payload ->> 'outcome';
  reasons := p_payload -> 'reasonCodes';
  evidence_snapshot := p_payload -> 'evidenceSnapshot';
  evidence_canonical := p_payload ->> 'evidenceCanonical';
  evidence_sha256 := p_payload ->> 'evidenceSha256';
  idempotency_sha256 := p_payload ->> 'idempotencySha256';
  if receipt.id is null
     or not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
       'restaurantId','assetId','actorId','outcome','reasonCodes',
       'evidenceSnapshot','evidenceCanonical','evidenceSha256',
       'idempotencySha256'
     ])
     or p_payload ->> 'restaurantId' is distinct from
       receipt.restaurant_id::text
     or p_payload ->> 'assetId' is distinct from receipt.asset_id::text
     or p_payload ->> 'actorId' is distinct from receipt.actor_id::text
     or outcome not in ('rejected','unavailable')
     or not veroxa_private.momo_jsonb_sorted_codes_v2(reasons, 1, 16)
     or pg_catalog.jsonb_typeof(evidence_snapshot) is distinct from 'object'
     or evidence_snapshot ->> 'restaurantId' is distinct from
       receipt.restaurant_id::text
     or evidence_snapshot ->> 'assetId' is distinct from
       receipt.asset_id::text
     or evidence_snapshot ->> 'originalActorId' is distinct from
       receipt.actor_id::text
     or evidence_snapshot ->> 'outcome' is distinct from outcome
     or evidence_snapshot -> 'reasonCodes' is distinct from reasons
     or evidence_canonical is distinct from
       veroxa_private.momo_canonical_json_v1(evidence_snapshot)
     or evidence_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(evidence_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     )
     or idempotency_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ingestion_attempt_v1';
  end if;

  recovery_actor_id := veroxa_private.momo_media_recovery_actor_v1(
    receipt.restaurant_id, receipt.actor_id
  );
  -- The original actor remains immutable provenance and a valid audit FK even
  -- when no currently active Team recovery actor exists. Failure/incident
  -- persistence therefore remains available to dead-letter bounded work.
  recovery_actor_id := coalesce(recovery_actor_id, receipt.actor_id);
  insert into public.veroxa_momo_media_intake_attempts_v2 (
    restaurant_id, source_asset_id, actor_id, outcome, reason_codes,
    evidence_snapshot, evidence_canonical, evidence_sha256,
    idempotency_sha256
  ) values (
    receipt.restaurant_id, receipt.asset_id, recovery_actor_id, outcome,
    reasons, evidence_snapshot, evidence_canonical, evidence_sha256,
    idempotency_sha256
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;
  select * into strict attempt
  from public.veroxa_momo_media_intake_attempts_v2 target
  where target.restaurant_id = receipt.restaurant_id
    and target.idempotency_sha256 = idempotency_sha256;
  if attempt.source_asset_id is distinct from receipt.asset_id
     or attempt.outcome is distinct from outcome
     or attempt.evidence_sha256 is distinct from evidence_sha256 then
    raise exception using errcode = '23505',
      message = 'momo_media_ingestion_attempt_conflict_v1';
  end if;

  exception_snapshot := pg_catalog.jsonb_build_object(
    'intakeAttemptId', attempt.id,
    'outcome', outcome,
    'reasonCodes', reasons,
    'intakeEvidenceSha256', evidence_sha256
  );
  exception_canonical := veroxa_private.momo_canonical_json_v1(
    pg_catalog.jsonb_build_object(
      'stage', 'media_intake',
      'policyVersion', 'momo-image-byte-verifier-2026-08-02-v2',
      'blockers', reasons,
      'warnings', '[]'::jsonb,
      'evidenceSnapshot', exception_snapshot
    )
  );
  exception_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(exception_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  perform veroxa_private.momo_upsert_exception_v2(
    receipt.restaurant_id, receipt.asset_id, receipt.asset_id, null,
    'media_intake', 'momo-image-byte-verifier-2026-08-02-v2', reasons,
    '[]'::jsonb, exception_snapshot, exception_canonical, exception_sha256
  );
  return pg_catalog.jsonb_build_object(
    'attemptId', attempt.id,
    'status', 'recorded',
    'assetId', receipt.asset_id
  );
end;
$$;
revoke all on function
  veroxa_private.record_momo_media_ingestion_attempt_v1(uuid,jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.enqueue_momo_media_ingestion_v1(
  p_restaurant_id uuid,
  p_asset_id uuid,
  p_actor_id uuid
)
returns veroxa_private.momo_media_ingestion_outbox_v1
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.veroxa_media_assets%rowtype;
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
begin
  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.uploaded_by = p_actor_id
  for share;
  if not found
     or asset.status <> 'uploaded'
     or asset.mime_type not in ('image/jpeg','image/png')
     or asset.file_size not between 10240 and 10485760
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       p_restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '23514',
      message = 'invalid_momo_media_ingestion_source_v1';
  end if;

  insert into veroxa_private.momo_media_ingestion_outbox_v1 (
    restaurant_id, asset_id, actor_id, storage_path,
    declared_mime_type, declared_file_size
  ) values (
    asset.restaurant_id, asset.id, asset.uploaded_by, asset.storage_path,
    asset.mime_type, asset.file_size
  ) on conflict (asset_id) do nothing;

  select * into strict receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 target
  where target.asset_id = asset.id;
  if receipt.restaurant_id is distinct from asset.restaurant_id
     or receipt.actor_id is distinct from asset.uploaded_by
     or receipt.storage_path is distinct from asset.storage_path
     or receipt.declared_mime_type is distinct from asset.mime_type
     or receipt.declared_file_size is distinct from asset.file_size then
    raise exception using errcode = '23505',
      message = 'momo_media_ingestion_receipt_conflict_v1';
  end if;
  return receipt;
end;
$$;
revoke all on function
  veroxa_private.enqueue_momo_media_ingestion_v1(uuid,uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.enqueue_registered_momo_media_ingestion_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'uploaded'
     or new.mime_type not in ('image/jpeg','image/png')
     or new.file_size not between 10240 and 10485760
     or new.storage_path !~ (
       '^restaurants/' || new.restaurant_id::text ||
       '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
       '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
       '[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|jpeg|png)$'
     )
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       new.restaurant_id, new.uploaded_by
     ) then
    return new;
  end if;
  perform veroxa_private.enqueue_momo_media_ingestion_v1(
    new.restaurant_id, new.id, new.uploaded_by
  );
  return new;
end;
$$;
revoke all on function
  veroxa_private.enqueue_registered_momo_media_ingestion_v1()
  from public, anon, authenticated, service_role;

-- An AFTER INSERT trigger is part of the registering statement's transaction,
-- so both Client v3 and Team private registration acquire a receipt without
-- duplicating either large security-definer function.
drop trigger if exists veroxa_enqueue_registered_momo_media_ingestion_v1
  on public.veroxa_media_assets;
create trigger veroxa_enqueue_registered_momo_media_ingestion_v1
after insert on public.veroxa_media_assets
for each row execute function
  veroxa_private.enqueue_registered_momo_media_ingestion_v1();

create table veroxa_private.momo_media_ingestion_wake_nonces_v1 (
  nonce uuid primary key,
  signed_at_ms bigint not null,
  accepted_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (signed_at_ms between 1000000000000 and 9999999999999)
);
alter table veroxa_private.momo_media_ingestion_wake_nonces_v1
  enable row level security;
alter table veroxa_private.momo_media_ingestion_wake_nonces_v1
  force row level security;
revoke all on table veroxa_private.momo_media_ingestion_wake_nonces_v1
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_claim_momo_media_ingestion_v1(
  p_wake_nonce uuid,
  p_signed_at_ms bigint,
  p_lease_token uuid
)
returns table (
  outbox_id uuid,
  restaurant_id uuid,
  asset_id uuid,
  storage_path text,
  storage_object_id uuid,
  storage_object_version text,
  declared_mime_type text,
  declared_file_size bigint,
  actor_id uuid,
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
  claimed veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  object_record record;
  stale veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  failure_snapshot jsonb;
  failure_canonical text;
  failure_sha256 text;
  failure_idempotency text;
  attempt_result jsonb;
begin
  if p_wake_nonce is null
     or p_lease_token is null
     or p_wake_nonce = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_signed_at_ms is null
     or pg_catalog.abs(
       pg_catalog.floor(extract(epoch from
         pg_catalog.clock_timestamp()) * 1000)::bigint - p_signed_at_ms
     ) > 60000 then
    raise exception using errcode = '42501',
      message = 'momo_media_ingestion_wake_invalid_v1';
  end if;
  with expired as (
    select candidate.nonce
    from veroxa_private.momo_media_ingestion_wake_nonces_v1 candidate
    where candidate.accepted_at <
      pg_catalog.clock_timestamp() - interval '10 minutes'
    order by candidate.accepted_at, candidate.nonce
    limit 1000
  )
  delete from veroxa_private.momo_media_ingestion_wake_nonces_v1 consumed
  using expired
  where consumed.nonce = expired.nonce;
  insert into veroxa_private.momo_media_ingestion_wake_nonces_v1 (
    nonce, signed_at_ms
  ) values (p_wake_nonce, p_signed_at_ms);

  -- Recover abandoned leases before selecting one due receipt. Each expiry is
  -- an evidence-backed attempt and Team incident, including the terminal one.
  for stale in
    select candidate.*
    from veroxa_private.momo_media_ingestion_outbox_v1 candidate
    where candidate.state = 'leased'
      and candidate.lease_expires_at <= pg_catalog.clock_timestamp()
    order by candidate.lease_expires_at, candidate.id
    limit 100
    for update skip locked
  loop
    failure_snapshot := pg_catalog.jsonb_build_object(
      'schemaVersion', 1,
      'verifierVersion',
        'veroxa-private-image-byte-verifier-2026-08-08-v1',
      'restaurantId', stale.restaurant_id,
      'assetId', stale.asset_id,
      'storagePath', stale.storage_path,
      'outboxId', stale.id,
      'correlationId', stale.correlation_id,
      'originalActorId', stale.actor_id,
      'outcome', 'unavailable',
      'reasonCodes',
        pg_catalog.jsonb_build_array('media_ingestion_lease_expired'),
      'observed', pg_catalog.jsonb_build_object(
        'stage', 'worker_lease',
        'attemptCount', stale.attempt_count,
        'externalWriteAllowed', false
      )
    );
    failure_canonical :=
      veroxa_private.momo_canonical_json_v1(failure_snapshot);
    failure_sha256 := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(failure_canonical, 'UTF8'), 'sha256'
    ), 'hex');
    failure_idempotency := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(
        'momo-media-ingestion-lease-expired-v1:' || stale.id::text || ':' ||
        stale.attempt_count::text, 'UTF8'
      ), 'sha256'
    ), 'hex');
    attempt_result :=
      veroxa_private.record_momo_media_ingestion_attempt_v1(
      stale.id,
      pg_catalog.jsonb_build_object(
        'restaurantId', stale.restaurant_id,
        'assetId', stale.asset_id,
        'actorId', stale.actor_id,
        'outcome', 'unavailable',
        'reasonCodes',
          pg_catalog.jsonb_build_array('media_ingestion_lease_expired'),
        'evidenceSnapshot', failure_snapshot,
        'evidenceCanonical', failure_canonical,
        'evidenceSha256', failure_sha256,
        'idempotencySha256', failure_idempotency
      )
    );
    update veroxa_private.momo_media_ingestion_outbox_v1 target
    set state = case when stale.attempt_count >= stale.max_attempts
        then 'dead_letter' else 'retry_wait' end,
        next_attempt_at = case
          when stale.attempt_count >= stale.max_attempts then null
          else pg_catalog.clock_timestamp()
        end,
        dead_lettered_at = case
          when stale.attempt_count >= stale.max_attempts
            then pg_catalog.clock_timestamp()
          else null
        end,
        lease_token = null,
        lease_expires_at = null,
        last_failure_stage = 'worker_lease',
        last_failure_code = 'media_ingestion_lease_expired',
        last_evidence_sha256 = failure_sha256,
        last_attempt_id = (attempt_result ->> 'attemptId')::uuid,
        updated_at = pg_catalog.clock_timestamp()
    where target.id = stale.id;
  end loop;

  select * into claimed
  from veroxa_private.momo_media_ingestion_outbox_v1 candidate
  where candidate.state in ('pending','retry_wait')
    and (candidate.next_attempt_at is null or
      candidate.next_attempt_at <= pg_catalog.clock_timestamp())
  order by coalesce(candidate.next_attempt_at, candidate.created_at),
    candidate.created_at, candidate.id
  limit 1
  for update skip locked;
  if not found then return; end if;

  update veroxa_private.momo_media_ingestion_outbox_v1 target
  set state = 'leased',
      attempt_count = target.attempt_count + 1,
      next_attempt_at = null,
      lease_token = p_lease_token,
      lease_expires_at = pg_catalog.clock_timestamp() + interval '5 minutes',
      updated_at = pg_catalog.clock_timestamp()
  where target.id = claimed.id
  returning * into claimed;

  select object.id, object.version into object_record
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = claimed.storage_path;

  return query select
    claimed.id,
    claimed.restaurant_id,
    claimed.asset_id,
    claimed.storage_path,
    object_record.id::uuid,
    object_record.version::text,
    claimed.declared_mime_type,
    claimed.declared_file_size,
    claimed.actor_id,
    claimed.correlation_id,
    claimed.lease_token,
    claimed.attempt_count,
    false;
end;
$$;
revoke all on function
  public.veroxa_claim_momo_media_ingestion_v1(uuid,bigint,uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_claim_momo_media_ingestion_v1(uuid,bigint,uuid)
  to service_role;

create or replace function
  public.veroxa_complete_momo_media_ingestion_v1(
    p_outbox_id uuid,
    p_lease_token uuid,
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
    p_idempotency_hash text
  )
returns table (
  outbox_id uuid,
  asset_id uuid,
  verification_id uuid,
  status text,
  canonical_asset_id uuid,
  duplicate_asset_id uuid,
  correlation_id uuid,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  finalized record;
  result_status text;
  result_canonical_asset_id uuid;
  result_duplicate_asset_id uuid;
begin
  select * into receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 candidate
  where candidate.id = p_outbox_id
  for update;
  if not found
     or receipt.state <> 'leased'
     or receipt.lease_token is distinct from p_lease_token
     or receipt.lease_expires_at <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '40001',
      message = 'momo_media_ingestion_lease_invalid_v1';
  end if;

  select * into strict finalized
  from public.veroxa_finalize_private_media_assessment_intake_v1(
    receipt.restaurant_id,
    receipt.asset_id,
    p_storage_object_id,
    p_storage_object_version,
    p_detected_mime,
    p_file_size,
    p_width,
    p_height,
    p_content_sha256,
    p_verification_snapshot,
    p_verification_canonical,
    p_verification_sha256,
    p_idempotency_hash,
    veroxa_private.momo_media_recovery_actor_v1(
      receipt.restaurant_id, receipt.actor_id
    )
  );
  if finalized.asset_id is distinct from receipt.asset_id
     or finalized.external_write_allowed is distinct from false then
    raise exception using errcode = '23514',
      message = 'momo_media_ingestion_finalize_invalid_v1';
  end if;

  result_status := 'verified';
  result_canonical_asset_id := receipt.asset_id;
  result_duplicate_asset_id := null;
  -- Recovery ends at immutable private verification. It deliberately does
  -- not invoke the automation pipeline, reserve AI budget, create a content
  -- run, dispatch a provider, or make the upload Ready.
  perform veroxa_private.momo_resolve_exceptions_v2(
    receipt.restaurant_id, receipt.asset_id, null, 'intake_verified'
  );

  update veroxa_private.momo_media_ingestion_outbox_v1 target
  set state = 'completed',
      completed_verification_id = finalized.intake_id,
      completed_at = pg_catalog.clock_timestamp(),
      lease_token = null,
      lease_expires_at = null,
      next_attempt_at = null,
      last_failure_stage = null,
      last_failure_code = null,
      dead_lettered_at = null,
      updated_at = pg_catalog.clock_timestamp()
  where target.id = receipt.id;

  return query select
    receipt.id,
    receipt.asset_id,
    finalized.intake_id::uuid,
    result_status,
    result_canonical_asset_id,
    result_duplicate_asset_id,
    receipt.correlation_id,
    false;
end;
$$;
revoke all on function
  public.veroxa_complete_momo_media_ingestion_v1(
    uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_complete_momo_media_ingestion_v1(
    uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text
  ) to service_role;

create or replace function public.veroxa_fail_momo_media_ingestion_v1(
  p_outbox_id uuid,
  p_lease_token uuid,
  p_failure_code text,
  p_retryable boolean,
  p_evidence_snapshot jsonb,
  p_evidence_canonical text,
  p_evidence_sha256 text,
  p_idempotency_sha256 text
)
returns table (
  outbox_id uuid,
  asset_id uuid,
  status text,
  failure_code text,
  correlation_id uuid,
  incident_id uuid,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  attempt_result jsonb;
  existing_attempt public.veroxa_momo_media_intake_attempts_v2%rowtype;
  attempt_snapshot jsonb;
  attempt_canonical text;
  attempt_sha256 text;
  durable_state text;
  retry_at timestamptz;
  result_incident_id uuid;
begin
  select * into receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 candidate
  where candidate.id = p_outbox_id
  for update;
  if not found
     or receipt.state <> 'leased'
     or receipt.lease_token is distinct from p_lease_token
     or receipt.lease_expires_at <= pg_catalog.clock_timestamp()
     or p_failure_code !~ '^[a-z0-9][a-z0-9_]{2,79}$'
     or p_retryable is null
     or pg_catalog.jsonb_typeof(p_evidence_snapshot) is distinct from 'object'
     or p_evidence_snapshot ->> 'restaurantId' is distinct from
       receipt.restaurant_id::text
     or p_evidence_snapshot ->> 'assetId' is distinct from
       receipt.asset_id::text
     or p_evidence_snapshot ->> 'outboxId' is distinct from receipt.id::text
     or p_evidence_snapshot ->> 'correlationId' is distinct from
       receipt.correlation_id::text
     or p_evidence_snapshot ->> 'originalActorId' is distinct from
       receipt.actor_id::text
     or p_evidence_snapshot ->> 'failureCode' is distinct from p_failure_code
     or p_evidence_canonical is distinct from
       veroxa_private.momo_canonical_json_v1(p_evidence_snapshot)
     or p_evidence_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(p_evidence_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     )
     or p_idempotency_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ingestion_failure_v1';
  end if;

  attempt_snapshot := p_evidence_snapshot || pg_catalog.jsonb_build_object(
    'outcome', case when p_retryable then 'unavailable' else 'rejected' end,
    'reasonCodes', pg_catalog.jsonb_build_array(p_failure_code)
  );
  attempt_canonical :=
    veroxa_private.momo_canonical_json_v1(attempt_snapshot);
  attempt_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(attempt_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  attempt_result := veroxa_private.record_momo_media_ingestion_attempt_v1(
    receipt.id,
    pg_catalog.jsonb_build_object(
      'restaurantId', receipt.restaurant_id,
      'assetId', receipt.asset_id,
      'actorId', receipt.actor_id,
      'outcome', case when p_retryable then 'unavailable' else 'rejected' end,
      'reasonCodes', pg_catalog.jsonb_build_array(p_failure_code),
      'evidenceSnapshot', attempt_snapshot,
      'evidenceCanonical', attempt_canonical,
      'evidenceSha256', attempt_sha256,
      'idempotencySha256', p_idempotency_sha256
    )
  );
  select * into strict existing_attempt
  from public.veroxa_momo_media_intake_attempts_v2 candidate
  where candidate.id = (attempt_result ->> 'attemptId')::uuid
    and candidate.restaurant_id = receipt.restaurant_id
    and candidate.source_asset_id = receipt.asset_id;
  select incident.id into result_incident_id
  from public.veroxa_momo_exception_incidents_v2 incident
  where incident.restaurant_id = receipt.restaurant_id
    and incident.canonical_asset_id = receipt.asset_id
    and incident.stage = 'media_intake'
    and incident.status = 'open'
  order by incident.last_seen_at desc, incident.id desc
  limit 1;

  durable_state := case
    when p_retryable and receipt.attempt_count < receipt.max_attempts
      then 'retry_wait'
    else 'dead_letter'
  end;
  retry_at := case when durable_state = 'retry_wait'
    then pg_catalog.clock_timestamp() +
      pg_catalog.make_interval(secs =>
        least(900, 15 * (1 <<
          least(receipt.attempt_count - 1, 5))))
    else null end;
  update veroxa_private.momo_media_ingestion_outbox_v1 target
  set state = durable_state,
      next_attempt_at = retry_at,
      lease_token = null,
      lease_expires_at = null,
      last_failure_stage = coalesce(
        nullif(p_evidence_snapshot ->> 'stage', ''), 'worker'
      ),
      last_failure_code = p_failure_code,
      last_evidence_sha256 = attempt_sha256,
      last_attempt_id = existing_attempt.id,
      dead_lettered_at = case when durable_state = 'dead_letter'
        then pg_catalog.clock_timestamp() else null end,
      updated_at = pg_catalog.clock_timestamp()
  where target.id = receipt.id;

  return query select receipt.id, receipt.asset_id, durable_state,
    p_failure_code, receipt.correlation_id, result_incident_id, false;
end;
$$;
revoke all on function
  public.veroxa_fail_momo_media_ingestion_v1(
    uuid,uuid,text,boolean,jsonb,text,text,text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_fail_momo_media_ingestion_v1(
    uuid,uuid,text,boolean,jsonb,text,text,text
  ) to service_role;

-- The authenticated finalize route must be able to persist a failure even
-- when the signed lifecycle Edge bridge is unavailable.  The caller supplies
-- only a bounded observation; tenant, source path, actor, canonical evidence,
-- hashes, retry state, and Team incident are derived here.
create or replace function
  public.veroxa_record_momo_media_intake_failure_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_correlation_id uuid,
    p_failure_stage text,
    p_error_code text,
    p_outcome text
  )
returns table (
  attempt_id uuid,
  asset_id uuid,
  outbox_id uuid,
  status text,
  correlation_id uuid,
  incident_id uuid,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  asset public.veroxa_media_assets%rowtype;
  receipt veroxa_private.momo_media_ingestion_outbox_v1%rowtype;
  outcome text;
  reasons jsonb;
  snapshot jsonb;
  canonical text;
  evidence_hash text;
  idempotency_hash text;
  attempt_result jsonb;
  existing_attempt public.veroxa_momo_media_intake_attempts_v2%rowtype;
  result_incident_id uuid;
begin
  if actor_id is null
     or p_correlation_id is null
     or p_failure_stage not in (
       'download','storage_metadata','byte_inspection','trusted_decode',
       'finalize_bridge'
     )
     or p_error_code not in (
       'media_verification_unavailable','media_verification_failed',
       'media_not_platform_ready','media_not_assessable'
     )
     or p_outcome not in ('rejected','unavailable')
     or (p_outcome = 'unavailable' and
       p_error_code <> 'media_verification_unavailable')
     or (p_outcome = 'rejected' and
       p_error_code = 'media_verification_unavailable')
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       p_restaurant_id, actor_id
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_intake_failure_v1';
  end if;

  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.uploaded_by = actor_id
    and candidate.status = 'uploaded'
  for share;
  if not found then
    raise exception using errcode = '42501',
      message = 'momo_media_intake_failure_source_required_v1';
  end if;
  select * into receipt
  from veroxa_private.momo_media_ingestion_outbox_v1 candidate
  where candidate.asset_id = asset.id
    and candidate.restaurant_id = asset.restaurant_id
    and candidate.actor_id = actor_id
    and candidate.storage_path = asset.storage_path
  for update;
  if not found
     or receipt.state = 'completed' then
    raise exception using errcode = '23514',
      message = 'momo_media_intake_failure_receipt_required_v1';
  end if;

  outcome := p_outcome;
  reasons := pg_catalog.jsonb_build_array(p_error_code);
  snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 4,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', receipt.restaurant_id,
    'assetId', receipt.asset_id,
    'storagePath', receipt.storage_path,
    'outboxId', receipt.id,
    'correlationId', receipt.correlation_id,
    'requestCorrelationId', p_correlation_id,
    'originalActorId', receipt.actor_id,
    'stage', p_failure_stage,
    'failureCode', p_error_code,
    'outcome', outcome,
    'reasonCodes', reasons,
    'observed', pg_catalog.jsonb_build_object(
      'source', 'authenticated_finalize_route',
      'externalWriteAllowed', false
    )
  );
  canonical := veroxa_private.momo_canonical_json_v1(snapshot);
  evidence_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(canonical, 'UTF8'), 'sha256'
  ), 'hex');
  idempotency_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(
      'momo-authenticated-intake-failure-v1:' || receipt.id::text || ':' ||
      p_correlation_id::text,
      'UTF8'
    ), 'sha256'
  ), 'hex');

  -- A caller retry with the same request correlation is an exact replay. It
  -- must neither add an exception occurrence nor consume another outbox
  -- attempt. Reusing a request correlation for different evidence is a
  -- conflict, not a second failure.
  select * into existing_attempt
  from public.veroxa_momo_media_intake_attempts_v2 candidate
  where candidate.restaurant_id = receipt.restaurant_id
    and candidate.idempotency_sha256 = idempotency_hash;
  if found then
    if existing_attempt.source_asset_id is distinct from receipt.asset_id
       or existing_attempt.actor_id is distinct from actor_id
       or existing_attempt.outcome is distinct from outcome
       or existing_attempt.evidence_sha256 is distinct from evidence_hash then
      raise exception using errcode = '23505',
        message = 'momo_media_intake_failure_replay_conflict_v1';
    end if;
    select incident.id into result_incident_id
    from public.veroxa_momo_exception_incidents_v2 incident
    where incident.restaurant_id = receipt.restaurant_id
      and incident.canonical_asset_id = receipt.asset_id
      and incident.stage = 'media_intake'
    order by (incident.status = 'open') desc,
      incident.last_seen_at desc, incident.id desc
    limit 1;
    if result_incident_id is null then
      raise exception using errcode = '23514',
        message = 'momo_media_intake_failure_incident_required_v1';
    end if;
    return query select existing_attempt.id, receipt.asset_id, receipt.id,
      'recorded'::text, receipt.correlation_id, result_incident_id, false;
    return;
  end if;

  -- The worker owns an active lease. An interactive request cannot clear or
  -- mutate it; the route will correctly report exception recording as
  -- unconfirmed and the lease remains recoverable by the worker.
  if receipt.state = 'leased' then
    raise exception using errcode = '40001',
      message = 'momo_media_ingestion_lease_active_v1';
  end if;

  -- Dead letter is terminal. A later HTTP request returns the already durable
  -- attempt and incident without creating an unbounded stream of attempts.
  if receipt.state = 'dead_letter' then
    select * into strict existing_attempt
    from public.veroxa_momo_media_intake_attempts_v2 candidate
    where candidate.id = receipt.last_attempt_id
      and candidate.restaurant_id = receipt.restaurant_id
      and candidate.source_asset_id = receipt.asset_id;
    select incident.id into result_incident_id
    from public.veroxa_momo_exception_incidents_v2 incident
    where incident.restaurant_id = receipt.restaurant_id
      and incident.canonical_asset_id = receipt.asset_id
      and incident.stage = 'media_intake'
    order by (incident.status = 'open') desc,
      incident.last_seen_at desc, incident.id desc
    limit 1;
    if result_incident_id is null then
      raise exception using errcode = '23514',
        message = 'momo_media_intake_failure_incident_required_v1';
    end if;
    return query select existing_attempt.id, receipt.asset_id, receipt.id,
      'recorded'::text, receipt.correlation_id, result_incident_id, false;
    return;
  end if;

  attempt_result := veroxa_private.record_momo_media_ingestion_attempt_v1(
    receipt.id,
    pg_catalog.jsonb_build_object(
      'restaurantId', receipt.restaurant_id,
      'assetId', receipt.asset_id,
      'actorId', receipt.actor_id,
      'outcome', outcome,
      'reasonCodes', reasons,
      'evidenceSnapshot', snapshot,
      'evidenceCanonical', canonical,
      'evidenceSha256', evidence_hash,
      'idempotencySha256', idempotency_hash
    )
  );
  select * into strict existing_attempt
  from public.veroxa_momo_media_intake_attempts_v2 candidate
  where candidate.id = (attempt_result ->> 'attemptId')::uuid
    and candidate.restaurant_id = receipt.restaurant_id
    and candidate.source_asset_id = receipt.asset_id;
  select incident.id into result_incident_id
  from public.veroxa_momo_exception_incidents_v2 incident
  where incident.restaurant_id = receipt.restaurant_id
    and incident.canonical_asset_id = receipt.asset_id
    and incident.stage = 'media_intake'
    and incident.status = 'open'
  order by incident.last_seen_at desc, incident.id desc
  limit 1;
  if result_incident_id is null then
    raise exception using errcode = '23514',
      message = 'momo_media_intake_failure_incident_required_v1';
  end if;

  update veroxa_private.momo_media_ingestion_outbox_v1 target
  set state = case
        when outcome = 'unavailable' and
          target.attempt_count + 1 < target.max_attempts
          then 'retry_wait'
        else 'dead_letter'
      end,
      attempt_count = target.attempt_count + 1,
      next_attempt_at = case
        when outcome = 'unavailable' and
          target.attempt_count + 1 < target.max_attempts
          then pg_catalog.clock_timestamp() +
            pg_catalog.make_interval(secs => least(
              900, 15 * (1 << least(target.attempt_count, 5))
            ))
        else null
      end,
      lease_token = null,
      lease_expires_at = null,
      last_failure_stage = p_failure_stage,
      last_failure_code = p_error_code,
      last_evidence_sha256 = evidence_hash,
      last_attempt_id = existing_attempt.id,
      dead_lettered_at = case
        when outcome = 'unavailable' and
          target.attempt_count + 1 < target.max_attempts then null
        else pg_catalog.clock_timestamp() end,
      updated_at = pg_catalog.clock_timestamp()
  where target.id = receipt.id
    and target.state in ('pending','retry_wait');
  if not found then
    raise exception using errcode = '40001',
      message = 'momo_media_intake_failure_state_changed_v1';
  end if;

  return query select
    existing_attempt.id,
    receipt.asset_id,
    receipt.id,
    'recorded'::text,
    receipt.correlation_id,
    result_incident_id,
    false;
end;
$$;
revoke all on function
  public.veroxa_record_momo_media_intake_failure_v1(
    uuid,uuid,uuid,text,text,text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_record_momo_media_intake_failure_v1(
    uuid,uuid,uuid,text,text,text
  ) to authenticated;

-- Reconcile any eligible original that predates the trigger (including the
-- current stranded upload).  Missing storage is intentionally still enqueued:
-- the worker will create a durable terminal attempt and Team exception.
do $$
declare
  candidate record;
begin
  for candidate in
    select asset.restaurant_id, asset.id, asset.uploaded_by
    from public.veroxa_media_assets asset
    where asset.status = 'uploaded'
      and asset.mime_type in ('image/jpeg','image/png')
      and asset.file_size between 10240 and 10485760
      and asset.storage_path ~ (
        '^restaurants/' || asset.restaurant_id::text ||
        '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
        '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
        '[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|jpeg|png)$'
      )
      and not exists (
        select 1
        from public.veroxa_private_media_assessment_intakes_v1 intake
        where intake.restaurant_id = asset.restaurant_id
          and intake.asset_id = asset.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_media_ingestion_outbox_v1 receipt
        where receipt.asset_id = asset.id
      )
      and veroxa_private.momo_actor_has_operational_membership_v1(
        asset.restaurant_id, asset.uploaded_by
      )
  loop
    perform veroxa_private.enqueue_momo_media_ingestion_v1(
      candidate.restaurant_id, candidate.id, candidate.uploaded_by
    );
  end loop;
end;
$$;

-- The same audited HMAC already used by Momo background content wakes signs a
-- media-recovery wake.  Its endpoint remains a separate exact Vault value.
create or replace function
  veroxa_private.momo_media_ingestion_runtime_secret_v1(p_name text)
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
    'momo_media_ingestion_recovery_endpoint_v1',
    'momo_content_ai_internal_hmac_v1'
  ) then return null; end if;
  select pg_catalog.count(*)::integer,
    pg_catalog.min(secret.decrypted_secret)
  into secret_count, secret_value
  from vault.decrypted_secrets secret
  where secret.name = p_name;
  if secret_count <> 1
     or secret_value is null
     or secret_value is distinct from pg_catalog.btrim(secret_value) then
    return null;
  end if;
  return secret_value;
end;
$$;
revoke all on function
  veroxa_private.momo_media_ingestion_runtime_secret_v1(text)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.deliver_momo_media_ingestion_recovery_wake_v1()
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
    'veroxa:momo-media-ingestion-recovery-wake:v1' ||
    pg_catalog.chr(10) || 'POST' || pg_catalog.chr(10) ||
    '/api/internal/momo/media/recover';
begin
  if not exists (
    select 1
    from veroxa_private.momo_media_ingestion_outbox_v1 receipt
    where receipt.state in ('pending','retry_wait','leased')
      and (
        receipt.state = 'leased'
          and receipt.lease_expires_at <= pg_catalog.clock_timestamp()
        or receipt.state <> 'leased'
          and (receipt.next_attempt_at is null or
            receipt.next_attempt_at <= pg_catalog.clock_timestamp())
      )
  ) then return null; end if;
  endpoint := veroxa_private.momo_media_ingestion_runtime_secret_v1(
    'momo_media_ingestion_recovery_endpoint_v1'
  );
  hmac_secret := veroxa_private.momo_media_ingestion_runtime_secret_v1(
    'momo_content_ai_internal_hmac_v1'
  );
  if endpoint is distinct from
       'https://veroxasystems.com/api/internal/momo/media/recover'
     or hmac_secret is null
     or hmac_secret !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  signature := pg_catalog.encode(extensions.hmac(
    pg_catalog.convert_to(
      signature_context || pg_catalog.chr(10) ||
      signed_at_ms::text || pg_catalog.chr(10) || wake_nonce::text ||
      pg_catalog.chr(10) || canonical_body,
      'UTF8'
    ),
    pg_catalog.decode(hmac_secret, 'hex'),
    'sha256'
  ), 'hex');
  select net.http_post(
    url := endpoint,
    headers := pg_catalog.jsonb_build_object(
      'content-type', 'application/json',
      'x-veroxa-media-ingestion-timestamp-ms', signed_at_ms::text,
      'x-veroxa-media-ingestion-nonce', wake_nonce::text,
      'x-veroxa-media-ingestion-signature', signature
    ),
    body := pg_catalog.jsonb_build_object('schemaVersion', 1),
    timeout_milliseconds := 120000
  ) into request_id;
  if request_id is null then
    raise exception using errcode = '58000',
      message = 'momo_media_ingestion_recovery_delivery_not_queued_v1';
  end if;
  return request_id;
end;
$$;
revoke all on function
  veroxa_private.deliver_momo_media_ingestion_recovery_wake_v1()
  from public, anon, authenticated, service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'veroxa-momo-media-ingestion-recovery'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'veroxa-momo-media-ingestion-recovery',
    '* * * * *',
    'select veroxa_private.deliver_momo_media_ingestion_recovery_wake_v1();'
  );
end;
$$;

-- Retire, never delete, legacy media jobs whose subject asset no longer
-- exists.  Their audit rows remain available while routine reads and prepare
-- calls no longer treat them as actionable canonical work.
update public.veroxa_ai_jobs job
set status = 'cancelled',
    next_attempt_at = null,
    last_error = 'source_asset_retired',
    completed_at = coalesce(job.completed_at, pg_catalog.clock_timestamp()),
    superseded_at = coalesce(job.superseded_at,
      pg_catalog.clock_timestamp()),
    supersession_reason = coalesce(job.supersession_reason,
      'source_asset_retired'),
    updated_at = pg_catalog.clock_timestamp()
where job.subject_type = 'media_asset'
  and job.job_kind in (
    'media_classification','media_quality','duplicate_detection'
  )
  and job.status in ('queued','blocked','retrying','failed')
  and job.provider_key is null
  and job.attempt_count = 0
  and job.output_payload is null
  and job.superseded_at is null
  and not exists (
    select 1 from public.veroxa_media_assets asset
    where asset.id = job.subject_id
      and asset.restaurant_id = job.restaurant_id
  );

create or replace function public.veroxa_prepare_momo_ai_job_v1(
  p_restaurant_id uuid,
  p_job_kind text,
  p_subject_type text,
  p_subject_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical_job_id uuid;
begin
  if p_job_kind in (
    'media_classification','media_quality','duplicate_detection'
  ) then
    if not public.veroxa_current_user_is_team_for_restaurant(
      p_restaurant_id
    ) then
      raise exception using errcode = '42501',
        message = 'momo_team_ai_job_required';
    end if;
    if p_subject_type <> 'media_asset'
       or not exists (
         select 1
         from public.veroxa_media_assets asset
         where asset.id = p_subject_id
           and asset.restaurant_id = p_restaurant_id
       ) then
      raise exception using errcode = '55000',
        message = 'momo_media_ai_subject_unavailable_v1';
    end if;
    select job.id into canonical_job_id
    from public.veroxa_ai_jobs job
    where job.restaurant_id = p_restaurant_id
      and job.job_kind = p_job_kind
      and job.subject_type = 'media_asset'
      and job.subject_id = p_subject_id
      and job.superseded_by_job_id is null
      and job.superseded_at is null
      and job.status <> 'cancelled'
      and exists (
        select 1
        from public.veroxa_media_assets asset
        where asset.id = job.subject_id
          and asset.restaurant_id = job.restaurant_id
      )
    order by job.created_at, job.id
    limit 1;
    if canonical_job_id is not null then return canonical_job_id; end if;
    raise exception using errcode = '55000',
      message = 'momo_media_ai_managed_by_upload_pipeline_v2';
  end if;
  return public.veroxa_prepare_momo_ai_job_legacy_v1(
    p_restaurant_id, p_job_kind, p_subject_type, p_subject_id
  );
end;
$$;
revoke all on function public.veroxa_prepare_momo_ai_job_v1(
  uuid,text,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_prepare_momo_ai_job_v1(
  uuid,text,text,uuid
) to authenticated;

-- Preserve every external action lock.  Durable ingestion performs private
-- verification only; any later provider work remains separately gated.
update public.veroxa_momo_runtime_controls
set provider_writes = false,
    review_replies = false,
    website_writes = false,
    external_scheduling = false,
    updated_at = pg_catalog.clock_timestamp()
where provider_writes
   or review_replies
   or website_writes
   or external_scheduling;

comment on table veroxa_private.momo_media_ingestion_outbox_v1 is
  'Private one-receipt-per-asset ingestion outbox with bounded leases and retries. It never authorizes an external write.';
comment on function
  veroxa_private.deliver_momo_media_ingestion_recovery_wake_v1() is
  'Queues one signed private media recovery wake only when a durable receipt is due. It cannot call a provider or publish.';
