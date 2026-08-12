-- Forward-only migration: high_resolution_private_media_v1.
-- Removes the total-pixel acceptance ceiling while preserving the existing
-- 10 MB source-byte limit, 12,000px per-axis bounds, aspect-ratio checks,
-- immutable verification evidence, and platform-ready envelope.

alter table public.veroxa_private_media_assessment_intakes_v1
  drop constraint veroxa_private_media_assessment_intakes_v1_check1;

create or replace function
  public.veroxa_finalize_private_media_assessment_intake_v1(
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
returns table (
  intake_id uuid,
  asset_id uuid,
  platform_ready boolean,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.veroxa_media_assets%rowtype;
  object_record record;
  existing public.veroxa_private_media_assessment_intakes_v1%rowtype;
  strict_existing public.veroxa_momo_media_intake_verifications%rowtype;
  expected_snapshot jsonb;
  expected_canonical text;
  strict_snapshot jsonb;
  strict_canonical text;
  strict_sha256 text;
  strict_idempotency_hash text;
  selected_intake_id uuid;
  is_platform_ready boolean;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501',
      message = 'private_media_upload_member_required';
  end if;
  if p_detected_mime not in ('image/jpeg', 'image/png')
     or p_content_sha256 is null
     or p_content_sha256 !~ '^[0-9a-f]{64}$'
     or p_verification_sha256 is null
     or p_verification_sha256 !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or char_length(coalesce(p_storage_object_version, ''))
       not between 1 and 200
     or not coalesce(p_file_size between 10240 and 10485760, false)
     or not coalesce(p_width between 128 and 12000, false)
     or not coalesce(p_height between 128 and 12000, false)
     or not coalesce(
       case when p_height <> 0 then
         p_width::numeric / p_height::numeric between 0.4 and 2.5
       else false end,
       false
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_upload_verification';
  end if;

  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for update;
  if not found
     or asset.mime_type is distinct from p_detected_mime
     or asset.file_size is distinct from p_file_size then
    raise exception using errcode = '23514',
      message = 'private_media_asset_metadata_mismatch';
  end if;

  select object.id, object.version, object.metadata
    into object_record
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
       when coalesce(object_record.metadata ->> 'size', '')
         ~ '^[0-9]{1,30}$'
       then (object_record.metadata ->> 'size')::numeric
         is distinct from p_file_size::numeric
       else true
     end) then
    raise exception using errcode = '23514',
      message = 'private_media_storage_object_mismatch';
  end if;

  expected_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
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
  expected_canonical :=
    veroxa_private.momo_canonical_json_v1(expected_snapshot);
  if p_verification_snapshot is distinct from expected_snapshot
     or p_verification_canonical is distinct from expected_canonical
     or p_verification_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(expected_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_upload_verification';
  end if;

  is_platform_ready := p_detected_mime = 'image/jpeg'
    and p_file_size between 10240 and 5242880
    and p_width between 320 and 12000
    and p_height between 250 and 12000
    and p_width::numeric / p_height::numeric between 0.8 and 1.91;

  select * into existing
  from public.veroxa_private_media_assessment_intakes_v1 intake
  where intake.restaurant_id = p_restaurant_id
    and intake.asset_id = p_asset_id
  for update;
  if found then
    if existing.storage_path = asset.storage_path
       and existing.storage_object_id = p_storage_object_id
       and existing.storage_object_version = p_storage_object_version
       and existing.detected_mime_type = p_detected_mime
       and existing.file_size = p_file_size
       and existing.width = p_width
       and existing.height = p_height
       and existing.content_sha256 = p_content_sha256
       and existing.verification_snapshot = expected_snapshot
       and existing.verification_canonical = expected_canonical
       and existing.verification_sha256 = p_verification_sha256
       and existing.idempotency_hash = p_idempotency_hash
       and existing.platform_ready = is_platform_ready then
      return query select existing.id, existing.asset_id,
        existing.platform_ready, false;
      return;
    end if;
    raise exception using errcode = '23505',
      message = 'private_media_intake_immutable_conflict';
  end if;

  if (asset.content_sha256 is not null
       and asset.content_sha256 <> p_content_sha256)
     or (asset.width is not null and asset.width <> p_width)
     or (asset.height is not null and asset.height <> p_height) then
    raise exception using errcode = '23505',
      message = 'private_media_asset_hash_immutable_conflict';
  end if;

  selected_intake_id := gen_random_uuid();
  if is_platform_ready then
    select * into strict_existing
    from public.veroxa_momo_media_intake_verifications verification
    where verification.restaurant_id = p_restaurant_id
      and verification.asset_id = p_asset_id
    for share;
    if found then
      if strict_existing.storage_path <> asset.storage_path
         or strict_existing.storage_object_id <> p_storage_object_id
         or strict_existing.storage_object_version <>
           p_storage_object_version
         or strict_existing.detected_mime_type <> p_detected_mime
         or strict_existing.file_size <> p_file_size
         or strict_existing.width <> p_width
         or strict_existing.height <> p_height
         or strict_existing.content_sha256 <> p_content_sha256 then
        raise exception using errcode = '23505',
          message = 'platform_media_intake_immutable_conflict';
      end if;
      selected_intake_id := strict_existing.id;
    end if;
  end if;

  insert into public.veroxa_private_media_assessment_intakes_v1 (
    id,
    restaurant_id,
    asset_id,
    storage_path,
    storage_object_id,
    storage_object_version,
    declared_mime_type,
    detected_mime_type,
    file_size,
    width,
    height,
    content_sha256,
    verifier_version,
    verification_snapshot,
    verification_canonical,
    verification_sha256,
    idempotency_hash,
    platform_ready,
    status,
    initiated_by
  ) values (
    selected_intake_id,
    p_restaurant_id,
    p_asset_id,
    asset.storage_path,
    p_storage_object_id,
    p_storage_object_version,
    asset.mime_type,
    p_detected_mime,
    p_file_size,
    p_width,
    p_height,
    p_content_sha256,
    'veroxa-private-image-byte-verifier-2026-08-08-v1',
    expected_snapshot,
    expected_canonical,
    p_verification_sha256,
    p_idempotency_hash,
    is_platform_ready,
    'verified',
    p_actor_id
  );

  if is_platform_ready and strict_existing.id is null then
    strict_snapshot := pg_catalog.jsonb_build_object(
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
    strict_canonical :=
      veroxa_private.momo_canonical_json_v1(strict_snapshot);
    strict_sha256 := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(strict_canonical, 'UTF8'), 'sha256'
    ), 'hex');
    strict_idempotency_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(
        'momo-platform-intake-derived-v1:' || p_idempotency_hash,
        'UTF8'
      ), 'sha256'
    ), 'hex');
    insert into public.veroxa_momo_media_intake_verifications (
      id,
      restaurant_id,
      asset_id,
      storage_path,
      storage_object_id,
      storage_object_version,
      declared_mime_type,
      detected_mime_type,
      file_size,
      width,
      height,
      content_sha256,
      verifier_version,
      verification_snapshot,
      verification_canonical,
      verification_sha256,
      idempotency_hash,
      status,
      initiated_by
    ) values (
      selected_intake_id,
      p_restaurant_id,
      p_asset_id,
      asset.storage_path,
      p_storage_object_id,
      p_storage_object_version,
      asset.mime_type,
      p_detected_mime,
      p_file_size,
      p_width,
      p_height,
      p_content_sha256,
      'momo-image-byte-verifier-2026-07-31-v1',
      strict_snapshot,
      strict_canonical,
      strict_sha256,
      strict_idempotency_hash,
      'verified',
      p_actor_id
    );
  end if;

  update public.veroxa_media_assets target
  set content_sha256 = coalesce(target.content_sha256, p_content_sha256),
      width = coalesce(target.width, p_width),
      height = coalesce(target.height, p_height),
      updated_at = clock_timestamp()
  where target.id = p_asset_id;

  return query
  select selected_intake_id, p_asset_id, is_platform_ready, false;
end;
$$;
revoke all on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ) from public, anon, authenticated, service_role;
