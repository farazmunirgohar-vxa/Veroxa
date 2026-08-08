-- Forward-only reconciliation after 064300, 064335, and 070840.
-- Compose the v5 Momo lifecycle with private assessment, real-owner
-- association, source-tombstone, and single Ready-decision authority.
-- Never edit these bytes after this migration is applied.

create or replace function public.veroxa_register_momo_media_v2(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_intake_notes text default null,
  p_usage_scope jsonb default
    '["facebook","instagram","google_business","website"]'::jsonb,
  p_expires_on date default null
)
returns table (asset_id uuid, rights_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  expiry timestamptz;
begin
  if p_mime_type not in ('image/jpeg', 'image/png')
     or not coalesce(p_file_size between 10240 and 10485760, false)
     or not (
       (p_mime_type = 'image/jpeg'
         and lower(p_storage_path) ~ '\.(jpg|jpeg)$')
       or (p_mime_type = 'image/png'
         and lower(p_storage_path) ~ '\.png$')
     ) then
    raise exception using errcode = '22023',
      message = 'private_media_requires_jpeg_or_png';
  end if;
  if p_expires_on is not null then
    if p_expires_on <
       (pg_catalog.now() at time zone 'America/Chicago')::date then
      raise exception using errcode = '22023',
        message = 'media_rights_expiry_must_not_be_past';
    end if;
    expiry := (p_expires_on + time '23:59:59.999999')
      at time zone 'America/Chicago';
  end if;
  return query
  select registered.asset_id, registered.rights_id
  from public.veroxa_register_momo_media_v1(
    p_restaurant_id,
    p_storage_path,
    p_mime_type,
    p_file_size,
    p_original_file_name,
    p_intake_notes,
    p_usage_scope,
    expiry
  ) registered;
end;
$$;
revoke all on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) from public, anon, authenticated, service_role;

-- A Team upload is permanently assessment-only. The explicit marker is
-- durable across later confirmation workflows and cannot be cleared or
-- broadened into owner evidence or an external usage scope.
alter table public.veroxa_media_rights
  add column team_private_assessment_only boolean not null default false;
alter table public.veroxa_media_rights
  add constraint veroxa_media_rights_team_private_assessment_only_v1
  check (
    not team_private_assessment_only
    or (
      evidence_class = 'development_proxy'
      and usage_scope = '["internal"]'::jsonb
    )
  );

create or replace function
  veroxa_private.guard_team_private_media_rights_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.team_private_assessment_only is distinct from
       old.team_private_assessment_only then
    raise exception using errcode = '23514',
      message = 'team_private_assessment_marker_is_immutable';
  end if;
  if old.team_private_assessment_only and (
    new.restaurant_id is distinct from old.restaurant_id
    or new.asset_id is distinct from old.asset_id
    or new.usage_scope is distinct from '["internal"]'::jsonb
    or new.valid_from is distinct from old.valid_from
    or new.expires_at is distinct from old.expires_at
    or new.confirmed_by is distinct from old.confirmed_by
    or new.confirmed_at is distinct from old.confirmed_at
    or new.evidence_class is distinct from 'development_proxy'
    or not (
      new.rights_status is not distinct from old.rights_status
      or (
        old.rights_status = 'confirmed'
        and new.rights_status = 'revoked'
      )
    )
  ) then
    raise exception using errcode = '23514',
      message = 'team_private_media_rights_are_assessment_only';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_team_private_media_rights_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_guard_team_private_media_rights_v1
  on public.veroxa_media_rights;
create trigger veroxa_guard_team_private_media_rights_v1
before update on public.veroxa_media_rights
for each row execute function
  veroxa_private.guard_team_private_media_rights_v1();

create or replace function
  veroxa_private.guard_team_private_media_association_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.association = 'represents_current_restaurant_offering'
     and exists (
       select 1
       from public.veroxa_media_rights rights
       where rights.id = new.rights_id
         and rights.restaurant_id = new.restaurant_id
         and rights.asset_id = new.asset_id
         and rights.team_private_assessment_only
     ) then
    raise exception using errcode = '23514',
      message = 'team_private_media_is_assessment_only';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_team_private_media_association_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_guard_team_private_media_association_v1
  on public.veroxa_media_restaurant_associations_v1;
create trigger veroxa_guard_team_private_media_association_v1
before insert on public.veroxa_media_restaurant_associations_v1
for each row execute function
  veroxa_private.guard_team_private_media_association_v1();

-- Keep the existing active-Client upload policy during the operational hold.
-- Team storage INSERT/DELETE activation is intentionally deferred to the
-- source-tracked cutover migration. JPEG and PNG are the only accepted upload
-- formats in this release.
update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png']::text[]
where id = 'restaurant-media';

drop policy if exists
  veroxa_restaurant_media_client_upload_insert on storage.objects;
create policy veroxa_restaurant_media_client_upload_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'restaurant-media'
  and owner_id = (select auth.uid())::text
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png)$'
  and public.veroxa_current_user_has_active_restaurant(
    public.veroxa_restaurant_id_from_storage_path(name)
  )
);

drop policy if exists
  veroxa_restaurant_media_client_delete_orphan on storage.objects;
create policy veroxa_restaurant_media_client_delete_orphan
on storage.objects
for delete to authenticated
using (
  bucket_id = 'restaurant-media'
  and owner_id = (select auth.uid())::text
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/'
  and public.veroxa_current_user_has_active_restaurant(
    public.veroxa_restaurant_id_from_storage_path(name)
  )
  and not public.veroxa_media_storage_path_registered(name)
);

create or replace function
  veroxa_private.momo_evidence_class_for_user_v1(
    p_restaurant_id uuid,
    p_user_id uuid
  )
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when exists (
    select 1
    from public.veroxa_user_profiles profile
    join public.veroxa_restaurant_members member
      on member.user_id = profile.user_id
     and member.restaurant_id = p_restaurant_id
     and member.role = 'team'
     and member.status = 'active'
    where profile.user_id = p_user_id
      and profile.role = 'team'
      and profile.status = 'active'
  ) then 'development_proxy' else coalesce((
    select authority.evidence_class
    from public.veroxa_momo_evidence_authorities authority
    where authority.restaurant_id = p_restaurant_id
      and authority.user_id = p_user_id
      and authority.active
  ), 'unknown') end;
$$;
revoke all on function
  veroxa_private.momo_evidence_class_for_user_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.validate_registered_media_rights_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rights_status = 'confirmed' and (
    new.confirmed_by is distinct from (select auth.uid())
    or not (
      public.veroxa_current_user_has_active_restaurant(new.restaurant_id)
      or public.veroxa_current_user_is_team_for_restaurant(
        new.restaurant_id
      )
    )
  ) then
    raise exception using errcode = '42501',
      message = 'confirmed_media_rights_require_current_owner_or_team';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_registered_media_rights_v1()
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.classify_momo_media_rights_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.team_private_assessment_only
     and (
       new.evidence_class is distinct from old.evidence_class
       or new.usage_scope is distinct from old.usage_scope
       or new.confirmed_by is distinct from old.confirmed_by
     ) then
    raise exception using errcode = '23514',
      message = 'team_private_media_rights_are_assessment_only';
  end if;
  if tg_op = 'UPDATE'
     and new.confirmed_by is not distinct from old.confirmed_by then
    new.evidence_class := old.evidence_class;
    return new;
  end if;
  new.evidence_class := case
    when new.confirmed_by is null then 'unknown'
    when exists (
      select 1
      from public.veroxa_user_profiles profile
      join public.veroxa_restaurant_members member
        on member.user_id = profile.user_id
       and member.restaurant_id = new.restaurant_id
       and member.role = 'team'
       and member.status = 'active'
      where profile.user_id = new.confirmed_by
        and profile.role = 'team'
        and profile.status = 'active'
    ) then 'development_proxy'
    else veroxa_private.momo_evidence_class_for_user_v1(
      new.restaurant_id, new.confirmed_by
    )
  end;
  return new;
end;
$$;
revoke all on function
  veroxa_private.classify_momo_media_rights_v1()
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_register_team_private_media_v1(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_intake_notes text default null,
  p_usage_scope jsonb default '["internal"]'::jsonb,
  p_expires_on date default null
)
returns table (asset_id uuid, rights_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_asset_id uuid := extensions.gen_random_uuid();
  new_rights_id uuid := extensions.gen_random_uuid();
  expiry timestamptz;
  object_metadata jsonb;
  object_size numeric;
  recorded_evidence_class text;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_momo_team_required_for_private_media';
  end if;
  if p_mime_type not in ('image/jpeg','image/png')
     or not coalesce(
       p_file_size between 10240 and 10485760, false
     )
     or p_storage_path !~ (
       '^restaurants/' || p_restaurant_id::text
       || '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/'
       || '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-'
       || '[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png)$'
     )
     or (p_mime_type = 'image/jpeg'
       and pg_catalog.lower(p_storage_path) !~ '\.(jpg|jpeg)$')
     or (p_mime_type = 'image/png'
       and pg_catalog.lower(p_storage_path) !~ '\.png$') then
    raise exception using errcode = '22023',
      message = 'private_media_requires_jpeg_or_png';
  end if;
  if p_usage_scope is distinct from '["internal"]'::jsonb then
    raise exception using errcode = '22023',
      message = 'invalid_media_usage_scope';
  end if;
  if pg_catalog.char_length(coalesce(
       p_original_file_name, ''
     )) > 255
     or pg_catalog.char_length(coalesce(
       p_intake_notes, ''
     )) > 2000 then
    raise exception using errcode = '22001',
      message = 'media_intake_text_too_long';
  end if;
  if p_expires_on is not null then
    if p_expires_on <
       (pg_catalog.now() at time zone 'America/Chicago')::date then
      raise exception using errcode = '22023',
        message = 'media_rights_expiry_must_not_be_past';
    end if;
    expiry := (p_expires_on + time '23:59:59.999999')
      at time zone 'America/Chicago';
  end if;

  select object.metadata into object_metadata
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = p_storage_path
    and object.owner = actor_id
    and object.owner_id = actor_id::text;
  if not found then
    raise exception using errcode = '23503',
      message = 'uploaded_storage_object_not_found';
  end if;
  if pg_catalog.jsonb_typeof(object_metadata) is distinct from 'object'
     or pg_catalog.jsonb_typeof(object_metadata -> 'mimetype')
       is distinct from 'string'
     or object_metadata ->> 'mimetype' is distinct from p_mime_type
     or pg_catalog.jsonb_typeof(object_metadata -> 'size')
       is distinct from 'number' then
    raise exception using errcode = '23514',
      message = 'storage_object_metadata_mismatch';
  end if;
  object_size := (object_metadata ->> 'size')::numeric;
  if object_size <> p_file_size
     or object_size <> pg_catalog.trunc(object_size) then
    raise exception using errcode = '23514',
      message = 'storage_object_metadata_mismatch';
  end if;

  insert into public.veroxa_media_assets (
    id, restaurant_id, storage_path, mime_type, file_size,
    uploaded_by, status, original_file_name, intake_notes
  ) values (
    new_asset_id, p_restaurant_id, p_storage_path,
    p_mime_type, p_file_size, actor_id, 'uploaded',
    nullif(pg_catalog.btrim(p_original_file_name), ''),
    nullif(pg_catalog.btrim(p_intake_notes), '')
  );
  insert into public.veroxa_media_rights (
    id, restaurant_id, asset_id, rights_status, usage_scope,
    valid_from, expires_at, confirmed_by, confirmed_at,
    team_private_assessment_only
  ) values (
    new_rights_id, p_restaurant_id, new_asset_id,
    'confirmed', '["internal"]'::jsonb, pg_catalog.now(), expiry,
    actor_id, pg_catalog.now(), true
  );
  select rights.evidence_class into recorded_evidence_class
  from public.veroxa_media_rights rights
  where rights.id = new_rights_id;
  if recorded_evidence_class is distinct from 'development_proxy' then
    raise exception using errcode = '23514',
      message = 'team_private_media_must_be_development_proxy';
  end if;
  return query select new_asset_id, new_rights_id;
end;
$$;
revoke all on function public.veroxa_register_team_private_media_v1(
  uuid,text,text,bigint,text,text,jsonb,date
) from public, anon, authenticated, service_role;

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
       p_width::bigint * p_height::bigint <= 16777216,
       false
     )
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

-- Private recognition v2 preserves bounded food hypotheses for Team-only
-- inspection. The JSON shape remains v1, while the prompt version changes so
-- old results can never satisfy a request made under the new semantics.
alter table public.veroxa_private_media_assessments_v1
  drop constraint veroxa_private_media_assessments_v1_prompt_version_check;
alter table public.veroxa_private_media_assessments_v1
  add constraint veroxa_private_media_assessments_v1_prompt_version_check
  check (prompt_version in (
    'veroxa-private-media-assessment-2026-08-08-v1',
    'veroxa-private-media-assessment-2026-08-08-v2'
  )) not valid;
alter table public.veroxa_private_media_assessments_v1
  validate constraint
    veroxa_private_media_assessments_v1_prompt_version_check;

alter function
  veroxa_private.private_media_assessment_output_valid_v1(jsonb)
  rename to private_media_assessment_output_legacy_v1;
revoke all on function
  veroxa_private.private_media_assessment_output_legacy_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.private_media_assessment_output_valid_v1(p_output jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  tag jsonb;
  descriptor text;
  confidence numeric;
  hypothesis_count integer;
  objective_count integer;
  surrogate_tags jsonb;
  surrogate_output jsonb;
begin
  if pg_catalog.jsonb_typeof(p_output) <> 'object'
     or pg_catalog.jsonb_typeof(p_output -> 'tags') <> 'array'
     or pg_catalog.jsonb_array_length(p_output -> 'tags')
       not between 1 and 16 then
    return false;
  end if;

  select pg_catalog.count(*) filter (
      where element.value ->> 'evidenceClass' = 'visual_hypothesis'
    )::integer,
    pg_catalog.count(*) filter (
      where element.value ->> 'evidenceClass' = 'objective'
    )::integer
    into hypothesis_count, objective_count
  from pg_catalog.jsonb_array_elements(p_output -> 'tags') element(value);
  if hypothesis_count > 5
     or hypothesis_count + objective_count <>
       pg_catalog.jsonb_array_length(p_output -> 'tags')
     or (
       select pg_catalog.count(distinct element.value ->> 'slug')
       from pg_catalog.jsonb_array_elements(p_output -> 'tags') element(value)
     ) <> pg_catalog.jsonb_array_length(p_output -> 'tags')
     or (
       select pg_catalog.count(distinct pg_catalog.lower(
         element.value ->> 'label'
       ))
       from pg_catalog.jsonb_array_elements(p_output -> 'tags') element(value)
     ) <> pg_catalog.jsonb_array_length(p_output -> 'tags') then
    return false;
  end if;

  for tag in
    select element.value
    from pg_catalog.jsonb_array_elements(p_output -> 'tags') element(value)
    where element.value ->> 'evidenceClass' = 'visual_hypothesis'
  loop
    if not veroxa_private.momo_jsonb_exact_keys_v2(tag, array[
      'slug', 'label', 'evidenceClass', 'category',
      'confidence', 'uncertainty'
    ])
       or pg_catalog.jsonb_typeof(tag -> 'slug') <> 'string'
       or pg_catalog.jsonb_typeof(tag -> 'label') <> 'string'
       or pg_catalog.jsonb_typeof(tag -> 'category') <> 'string'
       or pg_catalog.jsonb_typeof(tag -> 'confidence') <> 'number'
       or (tag ->> 'confidence') !~ '^(0(\.[0-9]+)?|1(\.0+)?)$'
       or pg_catalog.jsonb_typeof(tag -> 'uncertainty') <> 'string'
       or tag ->> 'uncertainty' <>
         'Pixels alone cannot confirm this possible visual identity.' then
      return false;
    end if;
    confidence := (tag ->> 'confidence')::numeric;

    if tag ->> 'category' = 'other_hypothesis' then
      if tag ->> 'slug' <> 'possible-other-visual-identity'
         or tag ->> 'label' <> 'Possible other visual identity'
         or confidence not between 0.35 and 0.9 then
        return false;
      end if;
    elsif tag ->> 'category' in (
      'dish_hypothesis', 'ingredient_hypothesis'
    ) then
      if pg_catalog.left(tag ->> 'label', 9) <> 'Possible ' then
        return false;
      end if;
      descriptor := pg_catalog.substr(tag ->> 'label', 10);
      if pg_catalog.char_length(descriptor) not between 3 and 60
         or descriptor !~
           '^[a-z0-9]+(-[a-z0-9]+)*( [a-z0-9]+(-[a-z0-9]+)*){0,5}$'
         or tag ->> 'slug' is distinct from
           'possible-' || pg_catalog.replace(descriptor, ' ', '-')
         or confidence not between 0.35 and 0.9
         or descriptor ~
           '(^|[^[:alnum:]_])(address|authentic|best|brand|business|cafe|café|company|cuisine|delicious|favorite|fresh|halal|health|healthy|kosher|licensed|location|logo|menu|momo|offering|organic|owner|ownership|permission|price|restaurant|rights|san([- ]|[[:space:]])antonio|shop|signature|tasty|trademark|value|vegan|vegetarian)([^[:alnum:]_]|$)' then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  if hypothesis_count = 0 then
    return veroxa_private.private_media_assessment_output_legacy_v1(
      p_output
    );
  end if;

  select pg_catalog.jsonb_agg(
    element.value order by element.ordinality
  ) into surrogate_tags
  from pg_catalog.jsonb_array_elements(p_output -> 'tags')
    with ordinality element(value, ordinality)
  where element.value ->> 'evidenceClass' = 'objective';
  if surrogate_tags is null then
    surrogate_tags := pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'slug', 'possible-other-visual-identity',
        'label', 'Possible other visual identity',
        'evidenceClass', 'visual_hypothesis',
        'category', 'other_hypothesis',
        'confidence', 0.35,
        'uncertainty',
          'Pixels alone cannot confirm this possible visual identity.'
      )
    );
  end if;
  surrogate_output := pg_catalog.jsonb_set(
    p_output, '{tags}', surrogate_tags
  );
  return veroxa_private.private_media_assessment_output_legacy_v1(
    surrogate_output
  );
exception
  when others then
    return false;
end;
$$;
revoke all on function
  veroxa_private.private_media_assessment_output_valid_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.private_media_provider_usage_microusd_v2(
    p_usage jsonb
  )
returns bigint
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  input_tokens numeric;
  output_tokens numeric;
  total_tokens numeric;
  measured numeric;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_usage, array[
    'input_tokens','output_tokens','total_tokens'
  ])
     or pg_catalog.jsonb_typeof(p_usage -> 'input_tokens') <> 'number'
     or pg_catalog.jsonb_typeof(p_usage -> 'output_tokens') <> 'number'
     or pg_catalog.jsonb_typeof(p_usage -> 'total_tokens') <> 'number' then
    return null;
  end if;
  input_tokens := (p_usage ->> 'input_tokens')::numeric;
  output_tokens := (p_usage ->> 'output_tokens')::numeric;
  total_tokens := (p_usage ->> 'total_tokens')::numeric;
  if input_tokens <> pg_catalog.trunc(input_tokens)
     or output_tokens <> pg_catalog.trunc(output_tokens)
     or total_tokens <> pg_catalog.trunc(total_tokens)
     or input_tokens not between 1 and 1050000
     or output_tokens not between 0 and 3000
     or total_tokens <> input_tokens + output_tokens then
    return null;
  end if;
  measured := input_tokens * case
      when input_tokens > 272000 then 10 else 5 end
    + output_tokens * case
      when input_tokens > 272000 then 45 else 30 end;
  if measured not between 1 and 20000000 then
    return null;
  end if;
  return measured::bigint;
exception
  when others then
    return null;
end;
$$;
revoke all on function
  veroxa_private.private_media_provider_usage_microusd_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_private_media_assessment_transition_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_microusd bigint;
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_is_immutable';
  end if;
  if new.id is distinct from old.id
     or new.restaurant_id is distinct from old.restaurant_id
     or new.source_content_sha256 is distinct from old.source_content_sha256
     or new.model is distinct from old.model
     or new.prompt_version is distinct from old.prompt_version
     or new.schema_version is distinct from old.schema_version
     or new.request_hash is distinct from old.request_hash
     or new.idempotency_hash is distinct from old.idempotency_hash
     or new.evidence_class is distinct from old.evidence_class
     or new.reserved_microusd is distinct from old.reserved_microusd
     or new.requested_by is distinct from old.requested_by
     or new.requested_at is distinct from old.requested_at
     or new.external_write_allowed then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_lineage_is_immutable';
  end if;
  if not (
    (old.status = 'reserved'
      and new.status in ('provider_running', 'failed'))
    or (old.status = 'provider_running'
      and new.status in ('completed', 'failed'))
  ) then
    raise exception using errcode = '23514',
      message = 'invalid_private_media_assessment_transition';
  end if;

  if new.status = 'completed' then
    if (
      new.prompt_version =
        'veroxa-private-media-assessment-2026-08-08-v1'
      and not veroxa_private.private_media_assessment_output_legacy_v1(
        new.output_payload
      )
    ) or (
      new.prompt_version =
        'veroxa-private-media-assessment-2026-08-08-v2'
      and not veroxa_private.private_media_assessment_output_valid_v1(
        new.output_payload
      )
    ) then
      raise exception using errcode = '23514',
        message = 'private_media_assessment_prompt_output_mismatch';
    end if;
    if new.accounting_basis = 'provider_usage_estimate' then
      expected_microusd :=
        veroxa_private.private_media_provider_usage_microusd_v2(
          new.provider_usage
        );
      if expected_microusd is null
         or new.accounted_microusd is distinct from expected_microusd then
        raise exception using errcode = '23514',
          message = 'private_media_assessment_accounting_mismatch_v2';
      end if;
    elsif new.accounting_basis <> 'conservative_reservation'
       or new.provider_usage is not null
       or new.accounted_microusd is distinct from new.reserved_microusd then
      raise exception using errcode = '23514',
        message = 'private_media_assessment_accounting_mismatch_v2';
    end if;
  elsif new.status = 'failed' then
    if new.provider_called and new.provider_usage is not null then
      expected_microusd :=
        veroxa_private.private_media_provider_usage_microusd_v2(
          new.provider_usage
        );
      if new.accounting_basis <> 'provider_usage_estimate'
         or expected_microusd is null
         or new.accounted_microusd is distinct from expected_microusd then
        raise exception using errcode = '23514',
          message = 'private_media_assessment_accounting_mismatch_v2';
      end if;
    elsif new.provider_called then
      if new.accounting_basis <> 'conservative_reservation'
         or new.accounted_microusd is distinct from
           new.reserved_microusd then
        raise exception using errcode = '23514',
          message = 'private_media_assessment_accounting_mismatch_v2';
      end if;
    elsif new.accounting_basis <> 'zero_pre_provider'
       or new.provider_usage is not null
       or new.accounted_microusd is distinct from 0 then
      raise exception using errcode = '23514',
        message = 'private_media_assessment_accounting_mismatch_v2';
    end if;
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_private_media_assessment_transition_v1()
  from public, anon, authenticated, service_role;

create or replace function
  public.veroxa_reserve_private_media_assessment_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_request_hash text,
    p_idempotency_hash text,
    p_model text,
    p_prompt_version text,
    p_schema_version text,
    p_reserved_microusd bigint,
    p_actor_id uuid
  )
returns table (
  assessment_id uuid,
  assessment_status text,
  request_hash text,
  source_storage_path text,
  source_storage_object_id uuid,
  source_storage_object_version text,
  source_mime_type text,
  source_file_size bigint,
  source_width integer,
  source_height integer,
  source_content_sha256 text,
  evidence_class text,
  reused_from_assessment_id uuid,
  provider_response_id text,
  output_payload jsonb,
  output_sha256 text,
  reserved_microusd bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
  assessment public.veroxa_private_media_assessments_v1%rowtype;
  link public.veroxa_private_media_assessment_asset_links_v1%rowtype;
  actor_evidence_class text;
  committed_microusd bigint;
  reused_id uuid;
  source_media_discarded boolean;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  actor_evidence_class :=
    veroxa_private.momo_evidence_class_for_user_v1(
      p_restaurant_id, p_actor_id
    );
  if actor_evidence_class not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_evidence_authority_required';
  end if;
  if p_request_hash is null or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_model is distinct from 'gpt-5.6-sol'
     or p_prompt_version is distinct from
       'veroxa-private-media-assessment-2026-08-08-v2'
     or p_schema_version is distinct from
       'veroxa-private-media-assessment-v1'
     or p_reserved_microusd is distinct from 1000000 then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_assessment_reservation';
  end if;

  select * into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
    and candidate.status = 'verified'
  for share;
  if not found then
    raise exception using errcode = '23503',
      message = 'verified_private_media_intake_required';
  end if;

  if not exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
    where asset.id = p_asset_id
      and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = intake.content_sha256
      and rights.rights_status = 'confirmed'
      and rights.evidence_class in ('development_proxy', 'real_owner')
      and rights.attestation_version = 'momo-media-rights-v1'
      and rights.attestation_sha256 ~ '^[0-9a-f]{64}$'
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
  ) then
    raise exception using errcode = '40001',
      message = 'current_media_rights_refresh_required_for_assessment';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    p_restaurant_id, intake.content_sha256
  );
  source_media_discarded :=
    veroxa_private.momo_source_media_discarded_v1(
      p_restaurant_id, intake.content_sha256
    );

  select * into link
  from public.veroxa_private_media_assessment_asset_links_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
  for share;
  if found then
    select * into assessment
    from public.veroxa_private_media_assessments_v1 candidate
    where candidate.id = link.assessment_id
      and candidate.restaurant_id = p_restaurant_id
      and candidate.source_content_sha256 = intake.content_sha256
      and candidate.model = p_model
      and candidate.prompt_version = p_prompt_version
      and candidate.schema_version = p_schema_version
    for share;
    if not found
       or link.intake_id <> intake.id
       or link.source_content_sha256 <> intake.content_sha256 then
      raise exception using errcode = '23505',
        message = 'private_media_assessment_asset_link_conflict';
    end if;
    if source_media_discarded and assessment.status <> 'completed' then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    return query
    select assessment.id, assessment.status, assessment.request_hash,
      intake.storage_path, intake.storage_object_id,
      intake.storage_object_version, intake.detected_mime_type,
      intake.file_size, intake.width, intake.height, intake.content_sha256,
      link.evidence_class, link.reused_from_assessment_id,
      assessment.provider_response_id,
      case when assessment.status = 'completed'
        then assessment.output_payload else null end,
      case when assessment.status = 'completed'
        then assessment.output_sha256 else null end,
      assessment.reserved_microusd;
    return;
  end if;

  perform budget.restaurant_id
  from veroxa_private.momo_ai_budget_controls budget
  where budget.restaurant_id = p_restaurant_id
    and budget.enabled
    and not budget.external_publishing_authorized
  for update;
  if not found or not exists (
    select 1
    from public.veroxa_momo_runtime_controls runtime
    where runtime.restaurant_id = p_restaurant_id
      and runtime.ai_live_calls
      and not runtime.provider_writes
      and not runtime.review_replies
      and not runtime.website_writes
      and not runtime.external_scheduling
  ) then
    raise exception using errcode = '55000',
      message = 'private_media_assessment_runtime_or_budget_disabled';
  end if;

  select * into assessment
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.source_content_sha256 = intake.content_sha256
    and candidate.model = p_model
    and candidate.prompt_version = p_prompt_version
    and candidate.schema_version = p_schema_version
  for update;
  if source_media_discarded
     and (not found or assessment.status <> 'completed') then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  if not found then
    select coalesce(pg_catalog.sum(case
      when candidate.status in ('reserved', 'provider_running')
        then candidate.reserved_microusd
      else coalesce(candidate.accounted_microusd, 0)
    end), 0)::bigint
      into committed_microusd
    from public.veroxa_private_media_assessments_v1 candidate
    where candidate.restaurant_id = p_restaurant_id;
    if committed_microusd + p_reserved_microusd > 20000000 then
      raise exception using errcode = '54000',
        message = 'private_media_assessment_twenty_usd_cap_exceeded';
    end if;

    insert into public.veroxa_private_media_assessments_v1 (
      restaurant_id, source_content_sha256, model, prompt_version,
      schema_version, request_hash, idempotency_hash, evidence_class,
      status, reserved_microusd, requested_by
    ) values (
      p_restaurant_id, intake.content_sha256, p_model, p_prompt_version,
      p_schema_version, p_request_hash, p_idempotency_hash,
      actor_evidence_class, 'reserved', p_reserved_microusd, p_actor_id
    ) returning * into assessment;
    reused_id := null;
  else
    reused_id := assessment.id;
  end if;

  insert into public.veroxa_private_media_assessment_asset_links_v1 (
    restaurant_id, asset_id, intake_id, assessment_id,
    source_content_sha256, reused_from_assessment_id,
    evidence_class, linked_by
  ) values (
    p_restaurant_id, p_asset_id, intake.id, assessment.id,
    intake.content_sha256, reused_id, actor_evidence_class, p_actor_id
  ) returning * into link;

  insert into public.veroxa_private_media_assessment_events_v1 (
    restaurant_id, assessment_id, asset_id,
    event_kind, event_payload, actor_id
  ) values (
    p_restaurant_id, assessment.id, p_asset_id,
    case when reused_id is null then 'reserved' else 'reused' end,
    pg_catalog.jsonb_build_object(
      'sourceContentSha256', intake.content_sha256,
      'reusedFromAssessmentId', reused_id,
      'externalWriteAllowed', false
    ),
    p_actor_id
  );

  return query
  select assessment.id, assessment.status, assessment.request_hash,
    intake.storage_path, intake.storage_object_id,
    intake.storage_object_version, intake.detected_mime_type,
    intake.file_size, intake.width, intake.height, intake.content_sha256,
    link.evidence_class, link.reused_from_assessment_id,
    assessment.provider_response_id,
    case when assessment.status = 'completed'
      then assessment.output_payload else null end,
    case when assessment.status = 'completed'
      then assessment.output_sha256 else null end,
    assessment.reserved_microusd;
end;
$$;
revoke all on function
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  ) from public, anon, authenticated, service_role;

create table veroxa_private.momo_ready_source_discards_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null
    references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  decision_reason text not null check (
    decision_reason = pg_catalog.btrim(decision_reason)
    and pg_catalog.char_length(decision_reason) between 4 and 500
    and decision_reason !~ '[[:cntrl:]]'
  ),
  review_snapshot jsonb not null
    check (pg_catalog.jsonb_typeof(review_snapshot) = 'object'),
  review_snapshot_canonical text not null check (
    pg_catalog.char_length(review_snapshot_canonical) between 2 and 262144
  ),
  review_snapshot_sha256 text not null
    check (review_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  decision_request_sha256 text not null
    check (decision_request_sha256 ~ '^[0-9a-f]{64}$'),
  discarded_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  discarded_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (restaurant_id, source_content_sha256)
);

alter table veroxa_private.momo_ready_source_discards_v2
  enable row level security;
alter table veroxa_private.momo_ready_source_discards_v2
  force row level security;
revoke all on table veroxa_private.momo_ready_source_discards_v2
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_momo_ready_source_discard_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  expected_request_sha text;
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    raise exception using errcode = '23514',
      message = 'momo_ready_source_discard_is_immutable_v2';
  end if;
  if new.discarded_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_is_team_for_restaurant(
       new.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;
  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = new.ready_package_id
    and target.restaurant_id = new.restaurant_id;
  if not found
     or ready.source_content_sha256 is distinct from
       new.source_content_sha256
     or ready.external_write_allowed
     or new.review_snapshot ->> 'readyPackageId' is distinct from
       ready.id::text
     or new.review_snapshot ->> 'restaurantId' is distinct from
       ready.restaurant_id::text
     or new.review_snapshot ->> 'sourceAssetId' is distinct from
       ready.source_asset_id::text
     or new.review_snapshot ->> 'outputSha256' is distinct from
       ready.output_sha256
     or not veroxa_private.momo_canonical_payload_matches_v1(
       new.review_snapshot,
       new.review_snapshot_canonical,
       new.review_snapshot_sha256
     ) then
    raise exception using errcode = '23514',
      message = 'momo_ready_source_discard_snapshot_mismatch_v2';
  end if;
  expected_request_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'schemaVersion',
              'momo-ready-source-discard-request-2026-08-08-v2',
            'readyPackageId', ready.id,
            'restaurantId', ready.restaurant_id,
            'sourceContentSha256', ready.source_content_sha256,
            'expectedReviewSnapshotSha256',
              new.review_snapshot_sha256,
            'reason', new.decision_reason,
            'externalWriteAllowed', false
          )
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  if new.decision_request_sha256 is distinct from expected_request_sha then
    raise exception using errcode = '23514',
      message = 'momo_ready_source_discard_request_mismatch_v2';
  end if;
  perform veroxa_private.lock_momo_source_media_v1(
    new.restaurant_id, new.source_content_sha256
  );
  new.discarded_at := pg_catalog.clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_ready_source_discard_v2()
  from public, anon, authenticated, service_role;

create trigger veroxa_momo_ready_source_discard_guard_v2
before insert or update or delete
on veroxa_private.momo_ready_source_discards_v2
for each row execute function
  veroxa_private.guard_momo_ready_source_discard_v2();


create or replace function
  veroxa_private.momo_media_has_current_food_association_v2(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_rights_id uuid,
    p_source_content_sha256 text
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    veroxa_private.media_has_current_real_owner_association_v1(
      p_restaurant_id,
      p_asset_id,
      p_rights_id,
      p_source_content_sha256
    )
    and exists (
      select 1
      from public.veroxa_media_rights rights
      where rights.id = p_rights_id
        and rights.restaurant_id = p_restaurant_id
        and rights.asset_id = p_asset_id
        and not rights.team_private_assessment_only
    )
    and exists (
      select 1
      from public.veroxa_private_media_assessment_intakes_v1 intake
      join public.veroxa_private_media_assessment_asset_links_v1 link
        on link.intake_id = intake.id
       and link.restaurant_id = intake.restaurant_id
       and link.asset_id = intake.asset_id
       and link.source_content_sha256 = intake.content_sha256
      join public.veroxa_private_media_assessments_v1 assessment
        on assessment.id = link.assessment_id
       and assessment.restaurant_id = link.restaurant_id
       and assessment.source_content_sha256 = link.source_content_sha256
      where intake.restaurant_id = p_restaurant_id
        and intake.asset_id = p_asset_id
        and intake.content_sha256 = p_source_content_sha256
        and intake.status = 'verified'
        and intake.platform_ready
        and assessment.status = 'completed'
        and assessment.model = 'gpt-5.6-sol'
        and assessment.prompt_version =
          'veroxa-private-media-assessment-2026-08-08-v2'
        and assessment.schema_version =
          'veroxa-private-media-assessment-v1'
        and (
          (
            assessment.accounting_basis = 'provider_usage_estimate'
            and assessment.accounted_microusd =
              veroxa_private.private_media_provider_usage_microusd_v2(
                assessment.provider_usage
              )
          ) or (
            assessment.accounting_basis = 'conservative_reservation'
            and assessment.provider_usage is null
            and assessment.accounted_microusd =
              assessment.reserved_microusd
          )
        )
        and assessment.output_payload ->> 'subject' = 'food'
        and exists (
          select 1
          from pg_catalog.jsonb_array_elements(
            assessment.output_payload -> 'tags'
          ) tag(value)
          where tag.value ->> 'slug' = 'food-visible'
            and tag.value ->> 'label' = 'Food visible'
            and tag.value ->> 'evidenceClass' = 'objective'
            and tag.value ->> 'category' = 'scene'
            and pg_catalog.jsonb_typeof(tag.value -> 'confidence') =
              'number'
            and (tag.value ->> 'confidence')::numeric >= 0.70
            and tag.value -> 'uncertainty' = 'null'::jsonb
        )
        and veroxa_private.private_media_assessment_output_valid_v1(
          assessment.output_payload
        )
    );
$$;
revoke all on function
  veroxa_private.momo_media_has_current_food_association_v2(
    uuid, uuid, uuid, text
  ) from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_content_ai_post_provider_evidence_v2(
  p_run_id uuid
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
      on asset.id = run.source_asset_id
     and asset.restaurant_id = run.restaurant_id
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = run.intake_verification_id
     and intake.asset_id = asset.id
     and intake.restaurant_id = run.restaurant_id
    join public.veroxa_media_rights rights
      on rights.id = run.rights_id
     and rights.asset_id = asset.id
     and rights.restaurant_id = run.restaurant_id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = run.source_storage_path
     and object.id = run.source_storage_object_id
    join veroxa_private.momo_ai_cost_ledger ledger
      on ledger.operation_kind = 'content_package'
     and ledger.source_id = run.id
     and ledger.restaurant_id = run.restaurant_id
     and ledger.idempotency_hash = run.idempotency_hash
    where run.id = p_run_id
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.review_id is null
      and run.status = 'pending_review'
      and asset.status in ('uploaded','ready_to_use')
      and asset.content_sha256 = run.source_content_sha256
      and asset.storage_path = run.source_storage_path
      and asset.mime_type = run.source_mime_type
      and asset.file_size = run.source_file_size
      and asset.width = run.source_width
      and asset.height = run.source_height
      and run.source_mime_type = 'image/jpeg'
      and run.source_file_size between 10240 and 5242880
      and run.source_width between 320 and 12000
      and run.source_height between 250 and 12000
      and run.source_width::numeric / run.source_height::numeric
        between 0.8 and 1.91
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
      and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
      and run.target_platforms <@ rights.usage_scope
      and veroxa_private.momo_media_has_current_food_association_v2(
        run.restaurant_id,
        run.source_asset_id,
        run.rights_id,
        run.source_content_sha256
      )
      and run.truth_snapshot_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(
          veroxa_private.current_momo_truth_snapshot_v1(run.restaurant_id)::text,
          'UTF8'
        ), 'sha256'
      ), 'hex')
      and ledger.state = 'settled'
      and ledger.provider_called
      and ledger.reserved_microusd = run.reserved_microusd
      and ledger.accounted_microusd = run.accounted_microusd
      and ledger.accounting_basis = run.accounting_basis
      and exists (
        select 1
        from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = run.restaurant_id
          and not runtime.provider_writes
          and not runtime.review_replies
          and not runtime.website_writes
          and not runtime.external_scheduling
      )
  );
$$;
revoke all on function
  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)
  from public, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.veroxa_reserve_momo_content_ai_run_v1(p_restaurant_id uuid, p_source_asset_id uuid, p_idempotency_hash text, p_client_request_hash text, p_recovery_response_id text)
 RETURNS TABLE(run_id uuid, run_status text, request_hash text, source_storage_path text, source_mime_type text, source_file_size bigint, source_content_sha256 text, source_width integer, source_height integer, target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text, reserved_microusd bigint, provider_response_id text, output_payload jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  source_hash text;
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

  -- Resolve immutable source identity without taking a row lock. Source is
  -- the global terminal boundary and must be acquired before run, asset,
  -- budget, ledger, or idempotency ownership.
  select run.source_content_sha256 into source_hash
  from public.veroxa_momo_content_ai_runs run
  where run.restaurant_id = p_restaurant_id
    and run.idempotency_hash = p_idempotency_hash;
  if not found then
    select intake.content_sha256 into source_hash
    from public.veroxa_media_assets asset
    join public.veroxa_momo_media_intake_verifications intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.content_sha256 = asset.content_sha256
    where asset.id = p_source_asset_id
      and asset.restaurant_id = p_restaurant_id;
  end if;
  if coalesce(source_hash ~ '^[0-9a-f]{64}$', false) then
    perform veroxa_private.lock_momo_source_media_v1(
      p_restaurant_id, source_hash
    );
    if veroxa_private.momo_source_media_discarded_v1(
      p_restaurant_id, source_hash
    ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
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
       or existing.client_request_hash <> p_client_request_hash
       or existing.prompt_version <> 'momo-content-package-2026-08-08-v5'
       or existing.validator_version <> 'momo-content-validator-2026-08-08-v5' then
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
  if not veroxa_private.momo_media_has_current_food_association_v2(
    p_restaurant_id,
    p_source_asset_id,
    rights.id,
    intake.content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'momo_content_requires_current_food_association';
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
      p_client_request_hash, 'momo-content-package-2026-08-08-v5',
      'momo-content-validator-2026-08-08-v5', asset.id::text, intake.id::text,
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
    'momo-content-package-2026-08-08-v5', 'momo-content-package-v1',
    'momo-content-validator-2026-08-08-v5',
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
$function$;

CREATE OR REPLACE FUNCTION veroxa_private.momo_advance_verified_asset_v2(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_processing_asset_id uuid;
  v_verification_id uuid;
  v_preliminary_rights_id uuid;
  v_preliminary_source_hash text;
  v_actor_id uuid;
  v_asset public.veroxa_media_assets%rowtype;
  v_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_rights public.veroxa_media_rights%rowtype;
  v_canonical_rights public.veroxa_media_rights%rowtype;
  v_processing_asset public.veroxa_media_assets%rowtype;
  v_processing_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_processing_rights public.veroxa_media_rights%rowtype;
  v_identity public.veroxa_momo_media_canonical_identities_v2%rowtype;
  v_canonical_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_link public.veroxa_momo_media_asset_identity_links_v2%rowtype;
  v_existing_run public.veroxa_momo_content_ai_runs%rowtype;
  v_retry_parent public.veroxa_momo_content_ai_runs%rowtype;
  v_stale_run public.veroxa_momo_content_ai_runs%rowtype;
  v_blocking_run public.veroxa_momo_content_ai_runs%rowtype;
  v_budget veroxa_private.momo_ai_budget_controls%rowtype;
  v_truth jsonb;
  v_truth_hash text;
  v_platforms jsonb;
  v_client_request_hash text;
  v_idempotency_hash text;
  v_request_hash text;
  v_advance_hash text;
  v_retry_generation smallint := 0;
  v_attempt_hash text;
  v_attempt_snapshot jsonb;
  v_attempt_canonical text;
  v_attempt_evidence_hash text;
  v_run_id uuid;
  v_outcome text;
  v_reasons jsonb := '[]'::jsonb;
  v_duplicate boolean;
  v_exception_snapshot jsonb;
  v_exception_canonical text;
  v_exception_hash text;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
    'restaurantId','assetId','verificationId','actorId'
  ]) then
    raise exception using errcode = '22023', message = 'invalid_momo_advance_v2';
  end if;
  v_restaurant_id := (p_payload ->> 'restaurantId')::uuid;
  v_asset_id := (p_payload ->> 'assetId')::uuid;
  v_verification_id := (p_payload ->> 'verificationId')::uuid;
  v_actor_id := (p_payload ->> 'actorId')::uuid;
  if not veroxa_private.momo_actor_has_operational_membership_v1(
      v_restaurant_id, v_actor_id
    ) then
    raise exception using errcode = '42501', message = 'momo_advance_member_required_v2';
  end if;

  -- Resolve immutable source evidence without row ownership. The source hash
  -- lock is dominant over every identity, asset, run, and budget lock.
  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id and asset.restaurant_id = v_restaurant_id;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified';
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514', message = 'momo_advance_evidence_invalid_v2';
  end if;
  v_preliminary_rights_id := v_rights.id;
  v_preliminary_source_hash := v_verification.content_sha256;

  perform veroxa_private.lock_momo_source_media_v1(
    v_restaurant_id, v_preliminary_source_hash
  );
  if veroxa_private.momo_source_media_discarded_v1(
    v_restaurant_id, v_preliminary_source_hash
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  -- Re-read and lock the exact evidence only after the source boundary.
  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id
    and asset.restaurant_id = v_restaurant_id
  for share;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified'
  for share;
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.id = v_preliminary_rights_id
    and rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_verification.content_sha256 is distinct from
      v_preliminary_source_hash
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514',
      message = 'momo_advance_evidence_invalid_v2';
  end if;

  -- Upload verification succeeds independently. Content work remains held
  -- until this concrete asset is assessed as food and explicitly associated
  -- with the current restaurant by real-owner evidence.
  if not veroxa_private.momo_media_has_current_food_association_v2(
    v_restaurant_id,
    v_asset_id,
    v_rights.id,
    v_verification.content_sha256
  ) then
    return pg_catalog.jsonb_build_object(
      'verificationId', v_verification_id,
      'status', 'verified',
      'canonicalAssetId', v_asset_id,
      'duplicateAssetId', null::uuid
    );
  end if;

  select * into v_identity
  from public.veroxa_momo_media_canonical_identities_v2 identity
  where identity.restaurant_id = v_restaurant_id
    and identity.content_sha256 = v_verification.content_sha256
  for update;
  if not found then
    select verification.* into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    join public.veroxa_media_assets asset
      on asset.id = verification.asset_id
     and asset.restaurant_id = verification.restaurant_id
    where verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_verification.content_sha256
      and asset.content_sha256 = verification.content_sha256
    order by verification.verified_at, verification.id
    limit 1
    for share of verification;
    if v_canonical_verification.id is null then
      raise exception using errcode = '23514', message = 'momo_canonical_verification_missing_v2';
    end if;
    insert into public.veroxa_momo_media_canonical_identities_v2 (
      restaurant_id, content_sha256, canonical_asset_id,
      canonical_verification_id
    ) values (
      v_restaurant_id, v_verification.content_sha256,
      v_canonical_verification.asset_id, v_canonical_verification.id
    ) returning * into v_identity;
  else
    select * into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.id = v_identity.canonical_verification_id;
  end if;

  select * into v_canonical_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_identity.canonical_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_canonical_rights.id is null
    or v_canonical_verification.asset_id <> v_identity.canonical_asset_id
    or v_canonical_verification.content_sha256 <> v_identity.content_sha256 then
    raise exception using errcode = '23514', message = 'momo_canonical_identity_invalid_v2';
  end if;

  -- Ensure the canonical asset has an explicit self-link even when an older
  -- verified upload is first encountered through a later exact duplicate.
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_identity.canonical_asset_id,
    v_identity.canonical_verification_id, v_identity.canonical_asset_id,
    'canonical', v_identity.content_sha256, v_canonical_rights.id,
    v_canonical_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;

  v_duplicate := v_asset_id <> v_identity.canonical_asset_id;
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id,
    case when v_duplicate then 'exact_duplicate' else 'canonical' end,
    v_verification.content_sha256, v_rights.id,
    v_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;
  select * into v_link
  from public.veroxa_momo_media_asset_identity_links_v2 link
  where link.asset_id = v_asset_id;
  if v_link.identity_id <> v_identity.id
    or v_link.verification_id <> v_verification_id
    or v_link.content_sha256 <> v_verification.content_sha256
    or v_link.canonical_asset_id <> v_identity.canonical_asset_id then
    raise exception using errcode = '23505', message = 'momo_identity_link_conflict_v2';
  end if;

  v_attempt_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 2,
    'restaurantId', v_restaurant_id,
    'assetId', v_asset_id,
    'verificationId', v_verification_id,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'outcome', case when v_duplicate then 'duplicate' else 'verified' end,
    'contentSha256', v_verification.content_sha256,
    'identityMethod', 'sha256_exact_bytes'
  );
  v_attempt_canonical := veroxa_private.momo_canonical_json_v1(v_attempt_snapshot);
  v_attempt_evidence_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(v_attempt_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  v_attempt_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-intake-success-v2:' || v_verification_id::text || ':' ||
      v_identity.id::text, 'UTF8'
  ), 'sha256'), 'hex');
  insert into public.veroxa_momo_media_intake_attempts_v2 (
    restaurant_id, source_asset_id, verification_id, canonical_asset_id,
    actor_id, outcome, reason_codes, evidence_snapshot, evidence_canonical,
    evidence_sha256, idempotency_sha256
  ) values (
    v_restaurant_id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id, v_actor_id,
    case when v_duplicate then 'duplicate' else 'verified' end,
    '[]'::jsonb, v_attempt_snapshot, v_attempt_canonical,
    v_attempt_evidence_hash, v_attempt_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;
  perform veroxa_private.momo_resolve_exceptions_v2(
    v_restaurant_id, v_asset_id, null, 'intake_verified'
  );

  if v_duplicate then
    if v_rights.usage_scope is distinct from v_canonical_rights.usage_scope
      or v_rights.valid_from is distinct from v_canonical_rights.valid_from
      or v_rights.expires_at is distinct from v_canonical_rights.expires_at
      or v_rights.rights_status is distinct from v_canonical_rights.rights_status
      or v_rights.evidence_class is distinct from v_canonical_rights.evidence_class then
      v_reasons := '["duplicate_rights_differ"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'sourceAssetId', v_asset_id,
        'canonicalAssetId', v_identity.canonical_asset_id,
        'sourceRightsId', v_rights.id,
        'canonicalRightsId', v_canonical_rights.id,
        'contentSha256', v_identity.content_sha256,
        'authorizationPolicy', 'single_current_exact_link_rights',
        'duplicateRightsCombined', false,
        'externalWriteAllowed', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'rights_reconciliation',
          'policyVersion', 'momo-exact-byte-identity-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id, v_asset_id, null,
        'rights_reconciliation', 'momo-exact-byte-identity-2026-08-02-v2',
        v_reasons, '[]'::jsonb, v_exception_snapshot,
        v_exception_canonical, v_exception_hash
      );
      -- A duplicate upload is independent provenance, not a permission
      -- amendment or withdrawal. Preserve both attestations, never combine or
      -- expand them. Deterministic processing-source selection below binds any
      -- run to exactly one current link and its own validated rights. The
      -- transient incident leaves immutable open/resolved events but never
      -- becomes routine Team clutter.
      perform veroxa_private.momo_resolve_exceptions_v2(
        v_restaurant_id, v_identity.canonical_asset_id, null,
        'duplicate_rights_isolated'
      );
      v_reasons := '[]'::jsonb;
    end if;
  end if;

  -- Canonical identity is permanent, but processing authorization belongs to
  -- one concrete upload. Prefer the canonical link only while its own rights
  -- remain current; otherwise choose the earliest verified exact-byte link
  -- with its own current real-owner rights. Never union permission scopes.
  select link.asset_id into v_processing_asset_id
  from public.veroxa_momo_media_asset_identity_links_v2 link
  join public.veroxa_media_assets asset
    on asset.id = link.asset_id
   and asset.restaurant_id = link.restaurant_id
  join public.veroxa_momo_media_intake_verifications verification
    on verification.id = link.verification_id
   and verification.asset_id = asset.id
   and verification.restaurant_id = asset.restaurant_id
  join public.veroxa_media_rights rights
    on rights.id = link.rights_id
   and rights.asset_id = asset.id
   and rights.restaurant_id = asset.restaurant_id
  join storage.objects object
    on object.bucket_id = 'restaurant-media'
   and object.name = verification.storage_path
   and object.id = verification.storage_object_id
  where link.identity_id = v_identity.id
    and link.restaurant_id = v_restaurant_id
    and link.canonical_asset_id = v_identity.canonical_asset_id
    and link.content_sha256 = v_identity.content_sha256
    and asset.content_sha256 = v_identity.content_sha256
    and asset.status in ('uploaded','ready_to_use')
    and verification.status = 'verified'
    and verification.content_sha256 = v_identity.content_sha256
    and object.version = verification.storage_object_version
    and coalesce(object.metadata ->> 'mimetype', '') =
      verification.detected_mime_type
    and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
      then (object.metadata ->> 'size')::numeric = verification.file_size::numeric
      else false end
    and rights.rights_status = 'confirmed'
    and rights.evidence_class = 'real_owner'
    and rights.attestation_version = 'momo-media-rights-v1'
    and rights.attestation_sha256 = link.rights_attestation_sha256
    and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
    and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
    and veroxa_private.momo_media_has_current_food_association_v2(
      v_restaurant_id,
      link.asset_id,
      rights.id,
      v_identity.content_sha256
    )
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(rights.usage_scope) use_name
      where use_name in ('facebook','instagram','google_business')
    )
  order by (link.asset_id = v_identity.canonical_asset_id) desc,
    verification.verified_at, verification.id
  limit 1;

  if v_processing_asset_id is not null then
    select * into v_processing_asset
    from public.veroxa_media_assets asset
    where asset.id = v_processing_asset_id
      and asset.restaurant_id = v_restaurant_id
    for share;
    select * into v_processing_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.asset_id = v_processing_asset_id
      and verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_identity.content_sha256
    for share;
    select * into v_processing_rights
    from public.veroxa_media_rights rights
    where rights.asset_id = v_processing_asset_id
      and rights.restaurant_id = v_restaurant_id
    for share;
  end if;

  v_truth := veroxa_private.current_momo_truth_snapshot_v1(v_restaurant_id);
  v_truth_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    v_truth::text, 'UTF8'
  ), 'sha256'), 'hex');
  select coalesce(pg_catalog.jsonb_agg(platform order by platform), '[]'::jsonb)
  into v_platforms
  from (
    select distinct value as platform
    from pg_catalog.jsonb_array_elements_text(v_processing_rights.usage_scope)
    where value in ('facebook','instagram','google_business')
  ) allowed;
  select * into v_budget
  from veroxa_private.momo_ai_budget_controls control
  where control.restaurant_id = v_restaurant_id
  for update;
  v_client_request_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(veroxa_private.momo_canonical_json_v1(
      pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'model', 'gpt-5.6-sol',
        'promptVersion', 'momo-content-package-2026-08-08-v5',
        'validatorVersion', 'momo-content-validator-2026-08-08-v5',
        'budgetAuthorizerId', v_budget.authorized_by,
        'automationPolicyVersion',
          'momo-upload-veroxa-ready-2026-08-02-v2'
      )
    ), 'UTF8'), 'sha256'
  ), 'hex');
  v_request_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.concat_ws('|', v_client_request_hash,
      v_identity.canonical_asset_id::text,
      v_identity.id::text, v_processing_asset_id::text,
      v_processing_verification.id::text,
      v_processing_verification.storage_object_id::text,
      v_processing_verification.storage_object_version,
      v_identity.content_sha256, v_processing_rights.id::text,
      v_processing_rights.attestation_sha256,
      v_budget.authorized_by::text, v_truth_hash, v_platforms::text,
      'automation_policy_v2'
    ), 'UTF8'
  ), 'sha256'), 'hex');
  v_idempotency_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to('momo-content-auto-v2:' || v_request_hash,
      'UTF8'), 'sha256'
  ), 'hex');

  if exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.status = 'veroxa_ready'
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
      and run.prompt_version = 'momo-content-package-2026-08-08-v5'
      and run.validator_version = 'momo-content-validator-2026-08-08-v5'
      and v_processing_rights.rights_status = 'confirmed'
      and v_processing_rights.evidence_class = 'real_owner'
      and (v_processing_rights.valid_from is null
        or v_processing_rights.valid_from <= pg_catalog.now())
      and (v_processing_rights.expires_at is null
        or v_processing_rights.expires_at > pg_catalog.now())
  ) then
    select ready.content_ai_run_id into v_run_id
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
      and run.prompt_version = 'momo-content-package-2026-08-08-v5'
      and run.validator_version = 'momo-content-validator-2026-08-08-v5'
    order by ready.ready_at desc limit 1;
    v_outcome := case when v_duplicate
      then 'duplicate_reused' else 'already_ready' end;
  else
    select run.* into v_existing_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.source_asset_id = v_processing_asset_id
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.request_hash = v_request_hash
      and (
        (run.automation_retry_generation = 0
          and run.automation_retry_of_run_id is null
          and run.idempotency_hash = v_idempotency_hash)
        or (run.automation_retry_generation = 1
          and run.automation_retry_of_run_id is not null
          and run.idempotency_hash = pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' ||
                run.automation_retry_of_run_id::text || ':' || v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex'))
      )
      and run.status in ('reserved','provider_running','result_staged','pending_review')
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, v_budget.authorized_by
      )
    order by run.automation_retry_generation desc,
      run.requested_at desc, run.id desc
    limit 1;
    if v_existing_run.id is not null then
      v_run_id := v_existing_run.id;
      v_outcome := case when v_duplicate
        then 'duplicate_reused' else 'replayed' end;
    end if;
  end if;

  if v_run_id is null then
    -- Authorization, rights, or truth may change after a reservation but
    -- before a provider call. Release only pristine pre-provider attempts so
    -- the same immutable identity can recover with newly current evidence.
    for v_stale_run in
      select run.*
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.automation_identity_id = v_identity.id
        and run.decision_mode = 'automation_policy_v2'
        and run.status = 'reserved'
        and not run.provider_called
        and run.provider_response_id is null
        and not veroxa_private.momo_content_ai_current_evidence_v1(
          run.id, run.requested_by
        )
      order by run.requested_at, run.id
      for update skip locked
    loop
      perform public.veroxa_fail_momo_content_ai_run_v1(
        v_stale_run.id, v_stale_run.request_hash, null,
        'automation_evidence_superseded', false, null, null,
        v_stale_run.requested_by
      );
    end loop;

    select run.* into v_blocking_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.decision_mode = 'automation_policy_v2'
      and (
        run.status in ('reserved','provider_running','result_staged')
        or (run.status = 'pending_review'
          and not exists (
            select 1
            from public.veroxa_momo_ready_packages_v2 ready
            where ready.content_ai_run_id = run.id
          ))
      )
    order by run.requested_at, run.id
    limit 1;
    if v_blocking_run.id is not null then
      v_run_id := v_blocking_run.id;
      v_outcome := 'exception';
      v_reasons := '["automation_identity_run_in_flight"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'blockingRunId', v_blocking_run.id,
        'blockingRunStatus', v_blocking_run.status,
        'providerCalled', v_blocking_run.provider_called
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        v_blocking_run.source_asset_id, v_blocking_run.id,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons,
        '[]'::jsonb, v_exception_snapshot, v_exception_canonical,
        v_exception_hash
      );
    end if;
  end if;

  if v_run_id is null then
    if v_processing_asset_id is null
      or v_processing_verification.id is null
      or v_processing_rights.id is null
      or v_processing_rights.rights_status <> 'confirmed'
      or v_processing_rights.evidence_class <> 'real_owner'
      or v_processing_rights.attestation_version <>
        'momo-media-rights-v1'
      or v_processing_rights.attestation_sha256 !~ '^[0-9a-f]{64}$'
      or (v_processing_rights.valid_from is not null
        and v_processing_rights.valid_from > pg_catalog.now())
      or (v_processing_rights.expires_at is not null
        and v_processing_rights.expires_at <= pg_catalog.now())
      or pg_catalog.jsonb_array_length(v_platforms) = 0
      or pg_catalog.jsonb_array_length(v_truth) < 4
      or pg_catalog.octet_length(v_truth::text) > 32768
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.display_name')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'address.primary')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.cuisine')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'menu.primary')
      or v_budget.restaurant_id is null or not v_budget.enabled
      or v_budget.external_publishing_authorized
      or not exists (
        select 1
        from public.veroxa_restaurant_members member
        join public.veroxa_user_profiles profile
          on profile.user_id = member.user_id
        where member.restaurant_id = v_restaurant_id
          and member.user_id = v_budget.authorized_by
          and member.role = 'team' and member.status = 'active'
          and profile.role = 'team' and profile.status = 'active'
      )
      or veroxa_private.momo_ai_committed_microusd_v1(v_restaurant_id)
        + 6000000 > v_budget.authorization_cap_microusd
      or not exists (
        select 1 from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = v_restaurant_id
          and runtime.ai_live_calls
          and not runtime.provider_writes and not runtime.review_replies
          and not runtime.website_writes and not runtime.external_scheduling
      ) then
      v_reasons := '["automation_evidence_or_budget_unavailable"]'::jsonb;
      v_outcome := 'exception';
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'verificationId', v_processing_verification.id,
        'budgetAuthorizerId', v_budget.authorized_by,
        'truthSnapshotSha256', v_truth_hash,
        'platformCount', pg_catalog.jsonb_array_length(v_platforms),
        'runtimeExternalWritesRequired', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        coalesce(v_processing_asset_id, v_asset_id), null,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons, '[]'::jsonb,
        v_exception_snapshot, v_exception_canonical, v_exception_hash
      );
    else
      -- The reservation identity was bound above before every replay lookup.
      select run.* into v_existing_run
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.idempotency_hash = v_idempotency_hash
      for update;
      if v_existing_run.id is not null then
        if v_existing_run.request_hash is distinct from v_request_hash
          or v_existing_run.automation_identity_id is distinct from v_identity.id
          or v_existing_run.source_asset_id is distinct from v_processing_asset_id
          or v_existing_run.rights_id is distinct from v_processing_rights.id
          or v_existing_run.rights_attestation_sha256 is distinct from
            v_processing_rights.attestation_sha256
          or v_existing_run.target_platforms is distinct from v_platforms
          or v_existing_run.truth_snapshot_sha256 is distinct from v_truth_hash
          or v_existing_run.decision_mode <> 'automation_policy_v2'
          or v_existing_run.requested_by is distinct from
            v_budget.authorized_by
          or v_existing_run.automation_retry_generation <> 0
          or v_existing_run.automation_retry_of_run_id is not null then
          raise exception using errcode = '23505',
            message = 'momo_automation_idempotency_conflict_v2';
        end if;

        if v_existing_run.status = 'failed'
          and veroxa_private.momo_content_ai_safe_retry_parent_v2(
            v_existing_run.id, v_restaurant_id, v_identity.id,
            v_request_hash, v_budget.authorized_by
          ) then
          -- One new generation is allowed only from the fully released,
          -- provably pre-provider parent above. Its key is deterministic so an
          -- exact concurrent/replayed recovery cannot create another child.
          v_retry_parent := v_existing_run;
          v_retry_generation := 1;
          v_idempotency_hash := pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' || v_retry_parent.id::text || ':' ||
                v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex');
          select run.* into v_existing_run
          from public.veroxa_momo_content_ai_runs run
          where run.restaurant_id = v_restaurant_id
            and run.idempotency_hash = v_idempotency_hash
          for update;
          if v_existing_run.id is not null then
            if v_existing_run.request_hash is distinct from v_request_hash
              or v_existing_run.automation_identity_id is distinct from
                v_identity.id
              or v_existing_run.source_asset_id is distinct from
                v_processing_asset_id
              or v_existing_run.rights_id is distinct from
                v_processing_rights.id
              or v_existing_run.rights_attestation_sha256 is distinct from
                v_processing_rights.attestation_sha256
              or v_existing_run.target_platforms is distinct from v_platforms
              or v_existing_run.truth_snapshot_sha256 is distinct from
                v_truth_hash
              or v_existing_run.decision_mode <> 'automation_policy_v2'
              or v_existing_run.requested_by is distinct from
                v_budget.authorized_by
              or v_existing_run.automation_retry_generation <>
                v_retry_generation
              or v_existing_run.automation_retry_of_run_id is distinct from
                v_retry_parent.id then
              raise exception using errcode = '23505',
                message = 'momo_automation_retry_idempotency_conflict_v2';
            end if;
            v_run_id := v_existing_run.id;
            v_outcome := case when v_existing_run.status = 'failed'
              then 'exception' else 'replayed' end;
            if v_existing_run.status = 'failed' then
              v_reasons := pg_catalog.jsonb_build_array(coalesce(
                v_existing_run.provider_error_code,
                'previous_automation_retry_failed'
              ));
            end if;
          end if;
        else
          -- A provider-called, response-bearing, send-intent, uncertain, or
          -- already retried failure is immutable and never regenerated.
          v_run_id := v_existing_run.id;
          v_outcome := case when v_existing_run.status = 'failed'
            then 'exception' else 'replayed' end;
          if v_existing_run.status = 'failed' then
            v_reasons := pg_catalog.jsonb_build_array(
              coalesce(v_existing_run.provider_error_code,
                'previous_automation_failed')
            );
          end if;
        end if;
      end if;

      if v_run_id is null then
        insert into public.veroxa_momo_content_ai_runs (
        restaurant_id, source_asset_id, intake_verification_id,
        source_storage_path, source_storage_object_id,
        source_storage_object_version, source_mime_type, source_file_size,
        source_width, source_height, source_content_sha256, rights_id,
        rights_attestation_sha256, review_id, truth_snapshot,
        truth_snapshot_sha256, target_platforms, model, reasoning_effort,
        prompt_version, schema_version, validator_version, pricing_version,
        idempotency_hash, client_request_hash, request_hash, requested_by,
        reserved_microusd, reservation_lease_expires_at, decision_mode,
        automation_policy_version, automation_identity_id,
        automation_initiated_by, automation_retry_of_run_id,
        automation_retry_generation
      ) values (
        v_restaurant_id, v_processing_asset_id,
        v_processing_verification.id,
        v_processing_verification.storage_path,
        v_processing_verification.storage_object_id,
        v_processing_verification.storage_object_version,
        v_processing_verification.detected_mime_type,
        v_processing_verification.file_size, v_processing_verification.width,
        v_processing_verification.height,
        v_processing_verification.content_sha256,
        v_processing_rights.id, v_processing_rights.attestation_sha256, null,
        v_truth, v_truth_hash, v_platforms, 'gpt-5.6-sol', 'high',
        'momo-content-package-2026-08-08-v5', 'momo-content-package-v1',
        'momo-content-validator-2026-08-08-v5',
        'openai-gpt-5.6-sol-2026-08-01-v2', v_idempotency_hash,
        v_client_request_hash, v_request_hash, v_budget.authorized_by, 6000000,
        pg_catalog.clock_timestamp() + interval '15 minutes',
        'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',
        v_identity.id, v_actor_id, v_retry_parent.id, v_retry_generation
        ) returning id into v_run_id;
        insert into veroxa_private.momo_ai_cost_ledger (
          restaurant_id, operation_kind, source_id, idempotency_hash,
          state, provider_called, reserved_microusd
        ) values (
          v_restaurant_id, 'content_package', v_run_id, v_idempotency_hash,
          'reserved', false, 6000000
        );
        v_outcome := 'queued';
      end if;
    end if;
  end if;

  if v_outcome is null then
    raise exception using errcode = '23514',
      message = 'momo_advance_outcome_missing_v2';
  end if;
  -- Idempotency belongs to the immutable transition, not merely the request.
  -- Thus an exception that later recovers to a concrete queued run appends new
  -- evidence, while the exact same outcome/run/reason replay remains a no-op.
  v_advance_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-advance-transition-v2:' ||
      veroxa_private.momo_canonical_json_v1(pg_catalog.jsonb_build_object(
        'verificationId', v_verification_id,
        'identityId', v_identity.id,
        'actorId', v_actor_id,
        'requestHash', v_request_hash,
        'outcome', v_outcome,
        'runId', v_run_id,
        'reasonCodes', v_reasons
      )),
    'UTF8'
  ), 'sha256'), 'hex');

  insert into public.veroxa_momo_automation_advances_v2 (
    restaurant_id, identity_id, source_asset_id, actor_id,
    processing_asset_id,
    canonical_asset_id,
    intake_verification_id, content_ai_run_id, outcome, reason_codes,
    policy_version, idempotency_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_actor_id,
    v_processing_asset_id,
    v_identity.canonical_asset_id, v_verification_id, v_run_id,
    v_outcome, v_reasons, 'momo-upload-veroxa-ready-2026-08-02-v2',
    v_advance_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;

  return pg_catalog.jsonb_build_object(
    'verificationId', v_verification_id,
    'status', case when v_duplicate then 'duplicate' else 'verified' end,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'duplicateAssetId', case when v_duplicate then v_asset_id else null end
  );
end;
$function$;

CREATE OR REPLACE FUNCTION veroxa_private.momo_materialize_veroxa_ready_v2(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_run_id uuid;
  v_request_hash text;
  v_preliminary_run public.veroxa_momo_content_ai_runs%rowtype;
  v_run public.veroxa_momo_content_ai_runs%rowtype;
  v_identity public.veroxa_momo_media_canonical_identities_v2%rowtype;
  v_ready public.veroxa_momo_ready_packages_v2%rowtype;
  v_variant jsonb;
  v_variant_count integer := 0;
  v_hashtags jsonb;
  v_seo jsonb;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(
    p_payload, array['runId','requestHash']
  ) then
    raise exception using errcode = '22023', message = 'invalid_momo_ready_v2';
  end if;
  v_run_id := (p_payload ->> 'runId')::uuid;
  v_request_hash := p_payload ->> 'requestHash';

  -- Source tombstone owns the first lock. Resolve the immutable run identity
  -- without row ownership, serialize against discard, then re-read the run.
  select * into v_preliminary_run
  from public.veroxa_momo_content_ai_runs run
  where run.id = v_run_id
    and run.request_hash = v_request_hash;
  if found then
    perform veroxa_private.lock_momo_source_media_v1(
      v_preliminary_run.restaurant_id,
      v_preliminary_run.source_content_sha256
    );
    if veroxa_private.momo_source_media_discarded_v1(
      v_preliminary_run.restaurant_id,
      v_preliminary_run.source_content_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    if not veroxa_private.momo_media_has_current_food_association_v2(
      v_preliminary_run.restaurant_id,
      v_preliminary_run.source_asset_id,
      v_preliminary_run.rights_id,
      v_preliminary_run.source_content_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'momo_ready_requires_current_food_association';
    end if;
  end if;

  select * into v_run
  from public.veroxa_momo_content_ai_runs run
  where run.id = v_run_id
  for update;
  if v_run.id is null
    or v_run.request_hash is distinct from v_request_hash
    or v_run.decision_mode <> 'automation_policy_v2'
    or v_run.automation_policy_version <>
      'momo-upload-veroxa-ready-2026-08-02-v2'
    or v_run.status <> 'pending_review'
    or v_run.output_payload is null
    or v_run.output_canonical is null
    or v_run.output_sha256 is null
    or v_run.validation_report is null
    or v_run.validation_canonical is null
    or v_run.validation_sha256 is null
    or not veroxa_private.momo_content_contract_version_pair_valid_v2(
      v_run.prompt_version, v_run.validator_version
    )
    or v_run.validation_report ->> 'validatorVersion'
      is distinct from v_run.validator_version
    or v_run.validation_report -> 'passed' is distinct from 'true'::jsonb
    or v_run.validation_report -> 'platformSet'
      is distinct from v_run.target_platforms
    or not veroxa_private.momo_canonical_payload_matches_v1(
      v_run.output_payload, v_run.output_canonical, v_run.output_sha256
    )
    or not veroxa_private.momo_canonical_payload_matches_v1(
      v_run.validation_report, v_run.validation_canonical,
      v_run.validation_sha256
    )
    or not veroxa_private.momo_current_content_contract_valid_v2(
      v_run.output_payload, v_run.target_platforms, v_run.truth_snapshot,
      v_run.prompt_version, v_run.validator_version
    )
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        v_run.output_payload -> 'variants'
      ) variant
      where variant ->> 'scheduleWindow' is distinct from 'unspecified'
    )
    or not veroxa_private.momo_content_ai_post_provider_evidence_v2(
      v_run.id
    )
    or not exists (
      select 1
      from veroxa_private.momo_content_ai_result_outbox outbox
      where outbox.run_id = v_run.id
        and outbox.request_hash = v_run.request_hash
        and outbox.state = 'applied'
        and outbox.output_sha256 = v_run.output_sha256
        and outbox.validation_sha256 = v_run.validation_sha256
    ) then
    raise exception using errcode = '23514', message = 'momo_ready_evidence_invalid_v2';
  end if;
  select identity.* into v_identity
  from public.veroxa_momo_media_asset_identity_links_v2 link
  join public.veroxa_momo_media_canonical_identities_v2 identity
    on identity.id = link.identity_id
  where link.asset_id = v_run.source_asset_id
    and link.identity_id = v_run.automation_identity_id
    and link.canonical_asset_id = identity.canonical_asset_id
    and identity.restaurant_id = v_run.restaurant_id
    and identity.content_sha256 = v_run.source_content_sha256;
  if v_identity.id is null then
    raise exception using errcode = '23514', message = 'momo_ready_identity_invalid_v2';
  end if;

  select * into v_ready
  from public.veroxa_momo_ready_packages_v2 ready
  where ready.content_ai_run_id = v_run.id;
  if v_ready.id is null then
    insert into public.veroxa_momo_ready_packages_v2 (
      restaurant_id, content_ai_run_id, identity_id, canonical_asset_id,
      source_asset_id, intake_verification_id, rights_id,
      rights_attestation_sha256, truth_snapshot_sha256,
      source_storage_path, source_storage_object_id,
      source_storage_object_version, source_mime_type, source_file_size,
      source_width, source_height, source_content_sha256, output_payload,
      output_canonical, output_sha256, validation_report,
      validation_canonical, validation_sha256, decision_mode,
      policy_version, status
    ) values (
      v_run.restaurant_id, v_run.id, v_identity.id,
      v_identity.canonical_asset_id, v_run.source_asset_id,
      v_run.intake_verification_id, v_run.rights_id,
      v_run.rights_attestation_sha256, v_run.truth_snapshot_sha256,
      v_run.source_storage_path, v_run.source_storage_object_id,
      v_run.source_storage_object_version, v_run.source_mime_type,
      v_run.source_file_size, v_run.source_width, v_run.source_height,
      v_run.source_content_sha256, v_run.output_payload,
      v_run.output_canonical, v_run.output_sha256, v_run.validation_report,
      v_run.validation_canonical, v_run.validation_sha256,
      'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',
      'veroxa_ready'
    ) returning * into v_ready;

    for v_variant in
      select item
      from pg_catalog.jsonb_array_elements(v_run.output_payload -> 'variants') item
    loop
      select coalesce(pg_catalog.jsonb_agg(hashtag.item ->> 'tag'
        order by selected.position), '[]'::jsonb)
      into v_hashtags
      from pg_catalog.jsonb_array_elements_text(v_variant -> 'hashtagIds')
        with ordinality selected(id, position)
      join pg_catalog.jsonb_array_elements(v_run.output_payload -> 'hashtags') hashtag(item)
        on hashtag.item ->> 'id' = selected.id;
      select coalesce(pg_catalog.jsonb_agg(phrase.item ->> 'phrase'
        order by selected.position), '[]'::jsonb)
      into v_seo
      from pg_catalog.jsonb_array_elements_text(v_variant -> 'seoPhraseIds')
        with ordinality selected(id, position)
      join pg_catalog.jsonb_array_elements(v_run.output_payload -> 'seoPhrases') phrase(item)
        on phrase.item ->> 'id' = selected.id;
      insert into public.veroxa_momo_ready_variants_v2 (
        restaurant_id, ready_package_id, platform, caption, hashtags,
        seo_phrases, alt_text, call_to_action, claim_ids, status
      ) values (
        v_run.restaurant_id, v_ready.id, v_variant ->> 'platform',
        v_variant ->> 'caption', v_hashtags, v_seo,
        v_run.output_payload ->> 'altText', v_variant -> 'cta',
        v_variant -> 'claimIds', 'veroxa_ready'
      );
      v_variant_count := v_variant_count + 1;
    end loop;
    if v_variant_count <> pg_catalog.jsonb_array_length(v_run.target_platforms)
      or v_variant_count not between 1 and 3 then
      raise exception using errcode = '23514', message = 'momo_ready_variant_mismatch_v2';
    end if;
  end if;

  update public.veroxa_media_assets asset
  set status = 'ready_to_use', updated_at = pg_catalog.clock_timestamp()
  where asset.id = v_run.source_asset_id
    and asset.restaurant_id = v_run.restaurant_id
    and asset.status in ('uploaded','under_veroxa_review');
  perform veroxa_private.momo_resolve_exceptions_v2(
    v_run.restaurant_id, v_identity.canonical_asset_id, v_run.id,
    'veroxa_ready'
  );
  return pg_catalog.jsonb_build_object(
    'readyPackageId', v_ready.id,
    'runId', v_run.id,
    'status', 'veroxa_ready',
    'externalWriteAllowed', false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.veroxa_momo_upload_pipeline_v2(p_operation text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  canonical_asset_id uuid;
  restaurant_id uuid;
  asset_id uuid;
  verification_id uuid;
  private_intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
begin
  if p_operation = 'advance_verified_asset'
     and veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
       'restaurantId','assetId','verificationId','actorId'
     ]) then
    restaurant_id := (p_payload ->> 'restaurantId')::uuid;
    asset_id := (p_payload ->> 'assetId')::uuid;
    verification_id := (p_payload ->> 'verificationId')::uuid;
    select * into private_intake
    from public.veroxa_private_media_assessment_intakes_v1 candidate
    where candidate.id = verification_id
      and candidate.restaurant_id = restaurant_id
      and candidate.asset_id = asset_id
      and candidate.status = 'verified';
    if private_intake.id is null
       or not private_intake.platform_ready
       or veroxa_private.momo_source_media_discarded_v1(
         restaurant_id, private_intake.content_sha256
       )
       or not exists (
         select 1
         from public.veroxa_media_rights rights
         where rights.restaurant_id = restaurant_id
           and rights.asset_id = asset_id
           and veroxa_private.momo_media_has_current_food_association_v2(
             restaurant_id,
             asset_id,
             rights.id,
             private_intake.content_sha256
           )
       ) then
      return pg_catalog.jsonb_build_object(
        'verificationId', verification_id,
        'status', 'verified',
        'canonicalAssetId', asset_id,
        'duplicateAssetId', null::uuid
      );
    end if;
  end if;

  if p_operation = 'record_intake_attempt' then
    return veroxa_private.momo_record_intake_attempt_v2(p_payload);
  elsif p_operation = 'advance_verified_asset' then
    return veroxa_private.momo_advance_verified_asset_v2(p_payload);
  elsif p_operation = 'record_exception' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
      'runId','requestHash','stage','policyVersion','blockers','warnings',
      'evidenceSnapshot','evidenceCanonical','evidenceSha256'
    ]) or p_payload ->> 'stage' <> 'content_validation'
      or p_payload ->> 'policyVersion' not in (
        'momo-content-validator-2026-08-01-v4',
        'momo-content-validator-2026-08-08-v5'
      ) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_exception_operation_v2';
    end if;
    select * into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid
    for update;
    if run.id is null
      or run.request_hash is distinct from p_payload ->> 'requestHash'
      or run.decision_mode <> 'automation_policy_v2'
      or run.automation_policy_version <>
        'momo-upload-veroxa-ready-2026-08-02-v2'
      or not veroxa_private.momo_content_contract_version_pair_valid_v2(
        run.prompt_version, run.validator_version
      )
      or p_payload ->> 'policyVersion' is distinct from run.validator_version then
      raise exception using errcode = '23514',
        message = 'momo_exception_run_mismatch_v2';
    end if;
    select identity.canonical_asset_id into canonical_asset_id
    from public.veroxa_momo_media_canonical_identities_v2 identity
    where identity.id = run.automation_identity_id
      and identity.restaurant_id = run.restaurant_id;
    if canonical_asset_id is null then
      raise exception using errcode = '23514',
        message = 'momo_exception_identity_mismatch_v2';
    end if;
    return veroxa_private.momo_upsert_exception_v2(
      run.restaurant_id, canonical_asset_id, run.source_asset_id, run.id,
      p_payload ->> 'stage', p_payload ->> 'policyVersion',
      p_payload -> 'blockers', p_payload -> 'warnings',
      p_payload -> 'evidenceSnapshot', p_payload ->> 'evidenceCanonical',
      p_payload ->> 'evidenceSha256'
    );
  elsif p_operation = 'materialize_veroxa_ready' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(
      p_payload, array['runId','requestHash']
    ) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_ready_operation_v2';
    end if;
    select * into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid;
    if run.id is null
      or run.request_hash is distinct from p_payload ->> 'requestHash' then
      raise exception using errcode = '23514',
        message = 'momo_ready_run_mismatch_v2';
    end if;
    if run.decision_mode <> 'automation_policy_v2' then
      return pg_catalog.jsonb_build_object(
        'runId', run.id,
        'status', 'not_applicable',
        'externalWriteAllowed', false
      );
    end if;
    return veroxa_private.momo_materialize_veroxa_ready_v2(p_payload);
  end if;
  raise exception using errcode = '22023',
    message = 'invalid_momo_upload_pipeline_operation_v2';
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = '22023',
      message = 'invalid_momo_upload_pipeline_payload_v2';
end;
$function$;

create or replace function
  veroxa_private.momo_ready_review_snapshot_v2(
    p_ready_package_id uuid
  )
returns table (
  review_snapshot jsonb,
  review_snapshot_canonical text,
  review_snapshot_sha256 text,
  checks_current boolean,
  blocker_codes jsonb
)
language plpgsql
stable
security definer
set search_path = ''
set timezone = 'UTC'
as $function$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  current_truth_sha text;
  current_rights jsonb;
  current_storage jsonb;
  current_association jsonb;
  variant_set_sha text;
  package_current boolean;
  identity_current boolean;
  rights_current boolean;
  truth_current boolean;
  storage_current boolean;
  validator_current boolean;
  variants_current boolean;
  runtime_current boolean;
  cost_current boolean;
  source_current boolean;
  association_current boolean;
  source_disposition_current boolean;
  external_lock_current boolean;
  blockers jsonb := '[]'::jsonb;
  snapshot jsonb;
  canonical text;
begin
  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = p_ready_package_id;
  if not found then
    return;
  end if;

  select target.* into run
  from public.veroxa_momo_content_ai_runs target
  where target.id = ready.content_ai_run_id;

  current_truth_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.current_momo_truth_snapshot_v1(
          ready.restaurant_id
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  select pg_catalog.jsonb_build_object(
    'id', rights.id,
    'status', rights.rights_status,
    'evidenceClass', rights.evidence_class,
    'attestationVersion', rights.attestation_version,
    'attestationSha256', rights.attestation_sha256,
    'usageScope', rights.usage_scope,
    'validFrom', rights.valid_from,
    'expiresAt', rights.expires_at
  ) into current_rights
  from public.veroxa_media_rights rights
  where rights.id = ready.rights_id
    and rights.asset_id = ready.source_asset_id
    and rights.restaurant_id = ready.restaurant_id;

  select pg_catalog.jsonb_build_object(
    'bucketId', object.bucket_id,
    'path', object.name,
    'objectId', object.id,
    'objectVersion', object.version,
    'mimeType', coalesce(object.metadata ->> 'mimetype', ''),
    'size', coalesce(object.metadata ->> 'size', '')
  ) into current_storage
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = ready.source_storage_path
    and object.id = ready.source_storage_object_id;

  select pg_catalog.jsonb_build_object(
    'id', association.id,
    'rightsId', association.rights_id,
    'association', association.association,
    'evidenceClass', association.evidence_class,
    'recordedBy', association.recorded_by,
    'recordedAt', association.recorded_at,
    'sourceContentSha256', association.source_content_sha256,
    'externalWriteAllowed', association.external_write_allowed
  ) into current_association
  from public.veroxa_media_restaurant_associations_v1 association
  where association.restaurant_id = ready.restaurant_id
    and association.asset_id = ready.source_asset_id
    and association.rights_id = ready.rights_id
    and association.source_content_sha256 = ready.source_content_sha256
  order by association.recorded_at desc, association.id desc
  limit 1;

  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(coalesce(
          pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'platform', ready_variant.platform,
              'caption', ready_variant.caption,
              'hashtags', ready_variant.hashtags,
              'seoPhrases', ready_variant.seo_phrases,
              'altText', ready_variant.alt_text,
              'callToAction', ready_variant.call_to_action,
              'claimIds', ready_variant.claim_ids,
              'status', ready_variant.status,
              'externalWriteAllowed',
                ready_variant.external_write_allowed
            )
            order by ready_variant.platform
          ),
          '[]'::jsonb
        )),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) into variant_set_sha
  from public.veroxa_momo_ready_variants_v2 ready_variant
  where ready_variant.ready_package_id = ready.id;

  package_current := run.id is not null
    and ready.status = 'veroxa_ready'
    and ready.decision_mode = 'automation_policy_v2'
    and ready.policy_version =
      'momo-upload-veroxa-ready-2026-08-02-v2'
    and not ready.external_write_allowed
    and run.restaurant_id = ready.restaurant_id
    and run.source_asset_id = ready.source_asset_id
    and run.intake_verification_id = ready.intake_verification_id
    and run.rights_id = ready.rights_id
    and run.rights_attestation_sha256 =
      ready.rights_attestation_sha256
    and run.truth_snapshot_sha256 = ready.truth_snapshot_sha256
    and run.source_storage_path = ready.source_storage_path
    and run.source_storage_object_id = ready.source_storage_object_id
    and run.source_storage_object_version =
      ready.source_storage_object_version
    and run.source_mime_type = ready.source_mime_type
    and run.source_file_size = ready.source_file_size
    and run.source_width = ready.source_width
    and run.source_height = ready.source_height
    and run.source_content_sha256 = ready.source_content_sha256
    and run.output_payload = ready.output_payload
    and run.output_canonical = ready.output_canonical
    and run.output_sha256 = ready.output_sha256
    and run.validation_report = ready.validation_report
    and run.validation_canonical = ready.validation_canonical
    and run.validation_sha256 = ready.validation_sha256
    and run.decision_mode = ready.decision_mode
    and run.automation_policy_version = ready.policy_version
    and veroxa_private.momo_canonical_payload_matches_v1(
      ready.output_payload, ready.output_canonical, ready.output_sha256
    )
    and veroxa_private.momo_canonical_payload_matches_v1(
      ready.validation_report, ready.validation_canonical,
      ready.validation_sha256
    );

  identity_current := exists (
    select 1
    from public.veroxa_momo_media_canonical_identities_v2 identity
    join public.veroxa_momo_media_asset_identity_links_v2 link
      on link.identity_id = identity.id
     and link.restaurant_id = identity.restaurant_id
    where identity.id = ready.identity_id
      and identity.restaurant_id = ready.restaurant_id
      and identity.canonical_asset_id = ready.canonical_asset_id
      and identity.content_sha256 = ready.source_content_sha256
      and link.asset_id = ready.source_asset_id
      and link.verification_id = ready.intake_verification_id
      and link.canonical_asset_id = ready.canonical_asset_id
      and link.rights_id = ready.rights_id
      and link.rights_attestation_sha256 =
        ready.rights_attestation_sha256
      and run.automation_identity_id = identity.id
  );

  rights_current := exists (
    select 1
    from public.veroxa_media_rights rights
    where rights.id = ready.rights_id
      and rights.restaurant_id = ready.restaurant_id
      and rights.asset_id = ready.source_asset_id
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and rights.attestation_sha256 =
        ready.rights_attestation_sha256
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
      and run.target_platforms <@ rights.usage_scope
  );

  truth_current := run.id is not null
    and run.truth_snapshot_sha256 = ready.truth_snapshot_sha256
    and current_truth_sha = ready.truth_snapshot_sha256;

  storage_current := exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = ready.intake_verification_id
     and intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = ready.source_storage_path
     and object.id = ready.source_storage_object_id
    where asset.id = ready.source_asset_id
      and asset.restaurant_id = ready.restaurant_id
      and asset.status in ('uploaded','ready_to_use')
      and asset.content_sha256 = ready.source_content_sha256
      and asset.storage_path = ready.source_storage_path
      and asset.mime_type = ready.source_mime_type
      and asset.file_size = ready.source_file_size
      and asset.width = ready.source_width
      and asset.height = ready.source_height
      and intake.status = 'verified'
      and intake.storage_path = ready.source_storage_path
      and intake.storage_object_id = ready.source_storage_object_id
      and intake.storage_object_version =
        ready.source_storage_object_version
      and intake.detected_mime_type = ready.source_mime_type
      and intake.file_size = ready.source_file_size
      and intake.width = ready.source_width
      and intake.height = ready.source_height
      and intake.content_sha256 = ready.source_content_sha256
      and object.version = ready.source_storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') =
        ready.source_mime_type
      and case
        when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
          then (object.metadata ->> 'size')::numeric =
            ready.source_file_size::numeric
        else false
      end
  );

  validator_current := run.id is not null
    and run.prompt_version =
      'momo-content-package-2026-08-08-v5'
    and run.validator_version =
      'momo-content-validator-2026-08-08-v5'
    and run.schema_version = 'momo-content-package-v1'
    and run.validation_report ->> 'validatorVersion' =
      run.validator_version
    and run.validation_report -> 'passed' = 'true'::jsonb
    and run.validation_report -> 'platformSet' = run.target_platforms
    and veroxa_private.momo_current_content_contract_valid_v2(
      run.output_payload, run.target_platforms, run.truth_snapshot,
      run.prompt_version, run.validator_version
    );

  variants_current :=
    veroxa_private.momo_ready_variants_current_v2(ready.id);

  runtime_current := exists (
    select 1
    from public.veroxa_momo_runtime_controls runtime
    where runtime.restaurant_id = ready.restaurant_id
      and not runtime.provider_writes
      and not runtime.review_replies
      and not runtime.website_writes
      and not runtime.external_scheduling
  );

  cost_current := exists (
    select 1
    from veroxa_private.momo_ai_cost_ledger ledger
    where ledger.operation_kind = 'content_package'
      and ledger.source_id = run.id
      and ledger.restaurant_id = ready.restaurant_id
      and ledger.idempotency_hash = run.idempotency_hash
      and ledger.state = 'settled'
      and ledger.provider_called
      and ledger.reserved_microusd = run.reserved_microusd
      and ledger.accounted_microusd = run.accounted_microusd
      and ledger.accounting_basis = run.accounting_basis
  );

  association_current := coalesce(
    current_association ->> 'association' =
      'represents_current_restaurant_offering'
    and current_association ->> 'evidenceClass' = 'real_owner'
    and current_association -> 'externalWriteAllowed' = 'false'::jsonb
    and veroxa_private.momo_media_has_current_food_association_v2(
      ready.restaurant_id,
      ready.source_asset_id,
      ready.rights_id,
      ready.source_content_sha256
    ),
    false
  );

  -- A tombstone written by the canonical v2 discard transaction is the
  -- intended terminal effect and must not make its own immutable snapshot
  -- stale. Any legacy, foreign-package, or later source tombstone still
  -- invalidates approval and export.
  source_disposition_current := not exists (
    select 1
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.restaurant_id = ready.restaurant_id
      and event.source_content_sha256 = ready.source_content_sha256
      and event.disposition = 'discarded'
      and not event.external_write_allowed
      and not exists (
        select 1
        from veroxa_private.momo_ready_source_discards_v2 source_discard
        join public.veroxa_momo_ready_packages_v2 discarded_ready
          on discarded_ready.id = source_discard.ready_package_id
         and discarded_ready.restaurant_id = source_discard.restaurant_id
        where source_discard.restaurant_id = event.restaurant_id
          and source_discard.ready_package_id = ready.id
          and source_discard.ready_package_id = event.ready_package_id
          and source_discard.source_content_sha256 =
            event.source_content_sha256
          and discarded_ready.output_sha256 = event.output_sha256
          and source_discard.decision_reason = event.note
          and source_discard.discarded_by = event.recorded_by
          and event.recorded_at >= source_discard.discarded_at
      )
  );

  source_current := coalesce(
    veroxa_private.momo_content_ai_post_provider_evidence_v2(run.id),
    false
  ) and association_current and source_disposition_current;

  external_lock_current := not ready.external_write_allowed
    and not exists (
      select 1
      from public.veroxa_momo_ready_variants_v2 ready_variant
      where ready_variant.ready_package_id = ready.id
        and ready_variant.external_write_allowed
    )
    and runtime_current;

  if not cost_current then
    blockers := blockers || '["cost_evidence_changed"]'::jsonb;
  end if;
  if not external_lock_current then
    blockers := blockers || '["external_write_lock_changed"]'::jsonb;
  end if;
  if not identity_current then
    blockers := blockers || '["identity_changed"]'::jsonb;
  end if;
  if not package_current then
    blockers := blockers || '["package_evidence_changed"]'::jsonb;
  end if;
  if not rights_current then
    blockers := blockers || '["rights_changed"]'::jsonb;
  end if;
  if not runtime_current then
    blockers := blockers || '["runtime_controls_changed"]'::jsonb;
  end if;
  if not source_current then
    blockers := blockers || '["source_evidence_changed"]'::jsonb;
  end if;
  if not storage_current then
    blockers := blockers || '["storage_changed"]'::jsonb;
  end if;
  if not truth_current then
    blockers := blockers || '["truth_changed"]'::jsonb;
  end if;
  if not validator_current then
    blockers := blockers || '["validator_changed"]'::jsonb;
  end if;
  if not variants_current then
    blockers := blockers || '["variants_changed"]'::jsonb;
  end if;

  snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 'momo-ready-review-snapshot-2026-08-08-v1',
    'restaurantId', ready.restaurant_id,
    'readyPackageId', ready.id,
    'contentAiRunId', ready.content_ai_run_id,
    'identityId', ready.identity_id,
    'canonicalAssetId', ready.canonical_asset_id,
    'sourceAssetId', ready.source_asset_id,
    'intakeVerificationId', ready.intake_verification_id,
    'rightsId', ready.rights_id,
    'rightsAttestationSha256', ready.rights_attestation_sha256,
    'truthSnapshotSha256', ready.truth_snapshot_sha256,
    'outputSha256', ready.output_sha256,
    'validationSha256', ready.validation_sha256,
    'promptVersion', run.prompt_version,
    'validatorVersion', run.validator_version,
    'outputSchemaVersion', run.schema_version,
    'automationPolicyVersion', ready.policy_version,
    'currentTruthSnapshotSha256', current_truth_sha,
    'currentRights', current_rights,
    'currentStorage', current_storage,
    'currentRestaurantAssociation', current_association,
    'readyVariantSetSha256', variant_set_sha,
    'requiredInspectionAttestationVersion',
      'momo-ready-team-inspection-2026-08-08-v1',
    'requiredInspectionAttestationText',
      'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.',
    'requiredInspectionAttestationSha256', pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(
          'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.',
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    ),
    'checks', pg_catalog.jsonb_build_object(
      'costEvidenceCurrent', cost_current,
      'externalWriteLockCurrent', external_lock_current,
      'identityCurrent', identity_current,
      'packageEvidenceCurrent', package_current,
      'rightsCurrent', rights_current,
      'runtimeControlsCurrent', runtime_current,
      'restaurantAssociationCurrent', association_current,
      'sourceEvidenceCurrent', source_current,
      'storageCurrent', storage_current,
      'truthCurrent', truth_current,
      'validatorCurrent', validator_current,
      'variantsCurrent', variants_current
    ),
    'blockerCodes', blockers,
    'externalWriteAllowed', false
  );
  canonical := veroxa_private.momo_canonical_json_v1(snapshot);

  return query select
    snapshot,
    canonical,
    pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(canonical, 'UTF8'),
        'sha256'
      ),
      'hex'
    ),
    pg_catalog.jsonb_array_length(blockers) = 0,
    blockers;
end;
$function$;

create or replace function public.veroxa_momo_ready_review_status_v2(
  p_restaurant_id uuid,
  p_ready_package_id uuid default null
)
returns table (
  ready_package_id uuid,
  review_state text,
  decision_id uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  terminal_decision text,
  decision_review_snapshot_sha256 text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  current_review_snapshot_sha256 text,
  snapshot_current boolean,
  can_manual_export boolean,
  external_write_allowed boolean,
  blocker_codes jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;

  return query
  with candidate_ready as materialized (
    select target.*
    from public.veroxa_momo_ready_packages_v2 target
    where target.restaurant_id = p_restaurant_id
      and (
        p_ready_package_id is null
        or target.id = p_ready_package_id
      )
    order by target.ready_at desc, target.id
    limit 50
  )
  select
    ready.id,
    case
      when source_discard.id is not null then 'discarded'
      when decision.decision = 'discarded' then 'discarded'
      when decision.decision = 'approved_for_manual_export'
        and decision.review_snapshot_sha256 =
          snapshot.review_snapshot_sha256
        and snapshot.checks_current
        then 'approved_for_manual_export'
      when decision.id is not null then 'blocked'
      when snapshot.checks_current then 'awaiting_team_review'
      else 'blocked'
    end,
    coalesce(source_discard.id, decision.id),
    coalesce(source_discard.discarded_by, decision.decided_by),
    coalesce(source_discard.discarded_at, decision.decided_at),
    coalesce(source_discard.decision_reason, decision.decision_reason),
    case when source_discard.id is not null
      then 'discarded' else decision.decision end,
    coalesce(
      source_discard.review_snapshot_sha256,
      decision.review_snapshot_sha256
    ),
    case when source_discard.id is not null
      then null else decision.inspection_attestation_version end,
    case when source_discard.id is not null
      then null else decision.inspection_attestation_text end,
    case when source_discard.id is not null
      then null else decision.inspection_attestation_sha256 end,
    snapshot.review_snapshot_sha256,
    case
      when source_discard.id is not null
        then source_discard.review_snapshot_sha256 =
          snapshot.review_snapshot_sha256
      when decision.id is null
        then snapshot.review_snapshot_sha256 is not null
      else decision.review_snapshot_sha256 =
        snapshot.review_snapshot_sha256
    end,
    (
      decision.decision = 'approved_for_manual_export'
      and source_discard.id is null
      and decision.review_snapshot_sha256 =
        snapshot.review_snapshot_sha256
      and snapshot.checks_current
    ),
    false,
    case
      when coalesce(source_discard.id, decision.id) is not null
        and coalesce(
          source_discard.review_snapshot_sha256,
          decision.review_snapshot_sha256
        ) <>
          snapshot.review_snapshot_sha256
        then '["review_snapshot_stale"]'::jsonb ||
          snapshot.blocker_codes
      else snapshot.blocker_codes
    end
  from candidate_ready ready
  cross join lateral
    veroxa_private.momo_ready_review_snapshot_v2(ready.id) snapshot
  left join veroxa_private.momo_ready_decisions_v2 decision
   on decision.ready_package_id = ready.id
   and decision.restaurant_id = ready.restaurant_id
  left join veroxa_private.momo_ready_source_discards_v2 source_discard
    on source_discard.restaurant_id = ready.restaurant_id
   and source_discard.source_content_sha256 =
     ready.source_content_sha256
  where ready.restaurant_id = p_restaurant_id
  order by ready.ready_at desc, ready.id;
end;
$function$;

create or replace function public.veroxa_decide_momo_ready_package_v2(
  p_ready_package_id uuid,
  p_decision text,
  p_expected_review_snapshot_sha256 text,
  p_reason text default null,
  p_inspection_attestation text default null
)
returns table (
  decision_id uuid,
  ready_package_id uuid,
  review_state text,
  terminal_decision text,
  decision_review_snapshot_sha256 text,
  replayed boolean,
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  current_review_snapshot_sha256 text,
  snapshot_current boolean,
  can_manual_export boolean,
  external_write_allowed boolean,
  blocker_codes jsonb
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  snapshot record;
  existing veroxa_private.momo_ready_decisions_v2%rowtype;
  source_discard veroxa_private.momo_ready_source_discards_v2%rowtype;
  normalized_reason text;
  attestation_version text;
  attestation_text text;
  attestation_sha text;
  request_sha text;
  source_discard_request_sha text;
  has_existing_decision boolean := false;
  was_replayed boolean := false;
begin
  if p_ready_package_id is null
     or p_decision is null
     or p_decision not in (
       'approved_for_manual_export','discarded'
     )
     or p_expected_review_snapshot_sha256 is null
     or p_expected_review_snapshot_sha256 !~ '^[0-9a-f]{64}$'
     or actor_id is null then
    raise exception using errcode = '22023',
      message = 'invalid_momo_ready_decision_v2';
  end if;

  normalized_reason := case
    when p_decision = 'discarded' then pg_catalog.btrim(p_reason)
    else null
  end;

  if p_decision = 'approved_for_manual_export' then
    if p_reason is not null
       or p_inspection_attestation is distinct from
         'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.' then
      raise exception using errcode = '22023',
        message = 'momo_ready_inspection_attestation_required_v2';
    end if;
    attestation_version :=
      'momo-ready-team-inspection-2026-08-08-v1';
    attestation_text := p_inspection_attestation;
    attestation_sha := pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(attestation_text, 'UTF8'),
        'sha256'
      ),
      'hex'
    );
  else
    if normalized_reason is null
       or pg_catalog.char_length(normalized_reason) not between 4 and 500
       or normalized_reason ~ '[[:cntrl:]]'
       or p_inspection_attestation is not null then
      raise exception using errcode = '22023',
        message = 'momo_ready_discard_reason_required_v2';
    end if;
    attestation_version := null;
    attestation_text := null;
    attestation_sha := null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'momo-ready-decision-v2:' || p_ready_package_id::text,
      0
    )
  );

  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = p_ready_package_id;

  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(
       ready.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;

  -- Approval and discard serialize on immutable source bytes before taking a
  -- decision row lock. This prevents approval racing a source-global discard.
  perform veroxa_private.lock_momo_source_media_v1(
    ready.restaurant_id, ready.source_content_sha256
  );

  request_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'schemaVersion',
              'momo-ready-team-decision-request-2026-08-08-v1',
            'readyPackageId', ready.id,
            'restaurantId', ready.restaurant_id,
            'decision', p_decision,
            'expectedReviewSnapshotSha256',
              p_expected_review_snapshot_sha256,
            'reason', normalized_reason,
            'inspectionAttestationVersion', attestation_version,
            'inspectionAttestationText', attestation_text,
            'inspectionAttestationSha256', attestation_sha,
            'externalWriteAllowed', false
          )
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  if p_decision = 'discarded' then
    source_discard_request_sha := pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(
          veroxa_private.momo_canonical_json_v1(
            pg_catalog.jsonb_build_object(
              'schemaVersion',
                'momo-ready-source-discard-request-2026-08-08-v2',
              'readyPackageId', ready.id,
              'restaurantId', ready.restaurant_id,
              'sourceContentSha256', ready.source_content_sha256,
              'expectedReviewSnapshotSha256',
                p_expected_review_snapshot_sha256,
              'reason', normalized_reason,
              'externalWriteAllowed', false
            )
          ),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );

    select target.* into source_discard
    from veroxa_private.momo_ready_source_discards_v2 target
    where target.restaurant_id = ready.restaurant_id
      and target.source_content_sha256 = ready.source_content_sha256
    for update;
    if found then
      if source_discard.ready_package_id is distinct from ready.id
         or source_discard.decision_reason is distinct from normalized_reason
         or source_discard.review_snapshot_sha256 is distinct from
              p_expected_review_snapshot_sha256
         or source_discard.decision_request_sha256 is distinct from
              source_discard_request_sha then
        raise exception using errcode = '23505',
          message = 'momo_ready_source_discard_conflict_v2';
      end if;
      was_replayed := true;
    end if;
  end if;

  select target.* into existing
  from veroxa_private.momo_ready_decisions_v2 target
  where target.ready_package_id = ready.id
  for update;
  has_existing_decision := found;

  if was_replayed then
    -- The exact source-discard request is immutable. Reconcile current status
    -- without reapplying the tombstone, even after unrelated evidence drift.
    null;
  elsif p_decision = 'approved_for_manual_export'
        and has_existing_decision then
    if existing.restaurant_id is distinct from ready.restaurant_id
       or existing.decision is distinct from p_decision
       or existing.decision_reason is distinct from normalized_reason
       or existing.inspection_attestation_version
            is distinct from attestation_version
       or existing.inspection_attestation_text
            is distinct from attestation_text
       or existing.inspection_attestation_sha256
            is distinct from attestation_sha
       or existing.review_snapshot_sha256 is distinct from
            p_expected_review_snapshot_sha256
       or existing.decision_request_sha256 is distinct from request_sha then
      raise exception using errcode = '23505',
        message = 'momo_ready_terminal_decision_conflict_v2';
    end if;
    was_replayed := true;
  elsif p_decision = 'discarded'
        and has_existing_decision
        and existing.decision = 'discarded' then
    -- A canonical pre-approval discard must always carry the source-global
    -- companion row. Its absence is an integrity failure, never a new write.
    raise exception using errcode = '23514',
      message = 'momo_ready_source_discard_evidence_missing_v2';
  elsif p_decision = 'approved_for_manual_export'
        and has_existing_decision then
    raise exception using errcode = '23505',
      message = 'momo_ready_terminal_decision_conflict_v2';
  else
    -- A first approval or source discard must bind exact current snapshot
    -- bytes. Discard remains allowed when eligibility blockers are present.
    if p_decision = 'approved_for_manual_export'
       and veroxa_private.momo_source_media_discarded_v1(
         ready.restaurant_id, ready.source_content_sha256
       ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    select target.* into snapshot
    from veroxa_private.momo_ready_review_snapshot_v2(
      p_ready_package_id
    ) target;

    if snapshot.review_snapshot_sha256 is null
       or snapshot.review_snapshot_sha256 is distinct from
         p_expected_review_snapshot_sha256 then
      raise exception using errcode = '23514',
        message = 'momo_ready_review_snapshot_stale_v2';
    end if;

    if p_decision = 'approved_for_manual_export'
       and not snapshot.checks_current then
      raise exception using errcode = '23514',
        message = 'momo_ready_approval_blocked_v2';
    end if;

    if p_decision = 'approved_for_manual_export'
       or not has_existing_decision then
      insert into veroxa_private.momo_ready_decisions_v2 (
        restaurant_id, ready_package_id, decision, decision_reason,
        inspection_attestation_version, inspection_attestation_text,
        inspection_attestation_sha256, review_snapshot,
        review_snapshot_canonical, review_snapshot_sha256,
        decision_request_sha256, decided_by
      ) values (
        ready.restaurant_id, ready.id, p_decision, normalized_reason,
        attestation_version, attestation_text, attestation_sha,
        snapshot.review_snapshot, snapshot.review_snapshot_canonical,
        snapshot.review_snapshot_sha256, request_sha, actor_id
      ) returning * into existing;

      perform pg_catalog.set_config(
        'veroxa.trusted_activity_write', 'on', true
      );
      insert into public.veroxa_activity_events (
        restaurant_id, event_type, subject_type, subject_id,
        actor_id, visibility, report_eligible, payload
      ) values (
        ready.restaurant_id, 'momo_ready_team_decided_v2',
        'momo_ready_package_v2', ready.id, actor_id, 'team', false,
        pg_catalog.jsonb_build_object(
          'decisionId', existing.id,
          'decision', existing.decision,
          'decisionReason', existing.decision_reason,
          'reviewSnapshotSha256', existing.review_snapshot_sha256,
          'inspectionAttestationVersion',
            existing.inspection_attestation_version,
          'inspectionAttestationSha256',
            existing.inspection_attestation_sha256,
          'externalWriteAllowed', false
        )
      );
    elsif existing.decision <> 'approved_for_manual_export' then
      raise exception using errcode = '23505',
        message = 'momo_ready_terminal_decision_conflict_v2';
    end if;

    if p_decision = 'discarded' then
      insert into veroxa_private.momo_ready_source_discards_v2 (
        restaurant_id,
        ready_package_id,
        source_content_sha256,
        decision_reason,
        review_snapshot,
        review_snapshot_canonical,
        review_snapshot_sha256,
        decision_request_sha256,
        discarded_by
      ) values (
        ready.restaurant_id,
        ready.id,
        ready.source_content_sha256,
        normalized_reason,
        snapshot.review_snapshot,
        snapshot.review_snapshot_canonical,
        snapshot.review_snapshot_sha256,
        source_discard_request_sha,
        actor_id
      ) returning * into source_discard;

      if not veroxa_private.momo_source_media_discarded_v1(
        ready.restaurant_id, ready.source_content_sha256
      ) then
        insert into public.veroxa_momo_ready_disposition_events_v1 (
          restaurant_id,
          ready_package_id,
          output_sha256,
          source_content_sha256,
          disposition,
          note,
          attestation,
          recorded_by
        ) values (
          ready.restaurant_id,
          ready.id,
          ready.output_sha256,
          ready.source_content_sha256,
          'discarded',
          normalized_reason,
          '{
            "teamReviewed": true,
            "noExternalWriteAuthorized": true,
            "decisionIsFinalForThisMedia": true
          }'::jsonb,
          actor_id
        );
      end if;
      if not veroxa_private.momo_source_media_discarded_v1(
        ready.restaurant_id, ready.source_content_sha256
      ) then
        raise exception using errcode = '23514',
          message = 'momo_ready_source_discard_not_enforced_v2';
      end if;

      perform pg_catalog.set_config(
        'veroxa.trusted_activity_write', 'on', true
      );
      insert into public.veroxa_activity_events (
        restaurant_id, event_type, subject_type, subject_id,
        actor_id, visibility, report_eligible, payload
      ) values (
        ready.restaurant_id, 'momo_ready_source_discarded_v2',
        'momo_ready_package_v2', ready.id, actor_id, 'team', false,
        pg_catalog.jsonb_build_object(
          'sourceDiscardId', source_discard.id,
          'sourceContentSha256', source_discard.source_content_sha256,
          'reviewSnapshotSha256',
            source_discard.review_snapshot_sha256,
          'externalWriteAllowed', false
        )
      );
    end if;
  end if;

  return query
  select
    status.decision_id,
    status.ready_package_id,
    status.review_state,
    status.terminal_decision,
    status.decision_review_snapshot_sha256,
    was_replayed,
    status.decided_by,
    status.decided_at,
    status.decision_reason,
    status.inspection_attestation_version,
    status.inspection_attestation_text,
    status.inspection_attestation_sha256,
    status.current_review_snapshot_sha256,
    status.snapshot_current,
    status.can_manual_export,
    status.external_write_allowed,
    status.blocker_codes
  from public.veroxa_momo_ready_review_status_v2(
    ready.restaurant_id, ready.id
  ) status
  where status.ready_package_id = ready.id;
end;
$function$;

create or replace function public.veroxa_momo_client_upload_status_v4(
  p_restaurant_id uuid
)
returns table (
  asset_id uuid,
  verification_status text,
  pipeline_status text,
  is_exact_duplicate boolean,
  attention_reasons jsonb,
  external_write_allowed boolean,
  source_content_sha256 text,
  platform_ready boolean,
  private_assessment_status text,
  private_assessment jsonb,
  assessment_reused_from_id uuid,
  restaurant_association text,
  association_evidence_class text,
  association_id uuid,
  association_recorded_at timestamptz,
  source_media_discarded boolean,
  source_media_discarded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, (select auth.uid())
  ) then
    raise exception using errcode = '42501',
      message = 'momo_client_upload_status_access_required_v4';
  end if;

  return query
  select base.asset_id,
    base.verification_status,
    case
      when source_discard.id is not null then 'verified'
      when base.pipeline_status = 'veroxa_ready'
       and not coalesce(displayed_ready.current_evidence, false)
        then 'verified'
      when displayed_ready.disposition = 'discarded'
        then 'verified'
      when displayed_ready.terminal_decision = 'discarded'
        then 'verified'
      else base.pipeline_status
    end,
    base.is_exact_duplicate,
    case when source_discard.id is not null
        or displayed_ready.terminal_decision = 'discarded'
      then '[]'::jsonb else base.attention_reasons end,
    false,
    coalesce(intake.content_sha256, asset.content_sha256),
    coalesce(intake.platform_ready, strict_intake.id is not null, false),
    assessment.status,
    case when assessment.status = 'completed'
      then assessment.output_payload else null end,
    case when assessment.status = 'completed'
      then assessment_link.reused_from_assessment_id else null end,
    association.association,
    association.evidence_class,
    association.id,
    association.recorded_at,
    source_discard.id is not null,
    source_discard.recorded_at
  from public.veroxa_momo_client_upload_status_v3(p_restaurant_id) base
  join public.veroxa_media_assets asset
    on asset.id = base.asset_id
   and asset.restaurant_id = p_restaurant_id
  left join lateral (
    select candidate.*
    from public.veroxa_private_media_assessment_intakes_v1 candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.status = 'verified'
    limit 1
  ) intake on true
  left join lateral (
    select candidate.id
    from public.veroxa_momo_media_intake_verifications candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.status = 'verified'
    order by candidate.verified_at desc, candidate.id desc
    limit 1
  ) strict_intake on true
  left join lateral (
    select candidate.*
    from public.veroxa_private_media_assessment_asset_links_v1 candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
    limit 1
  ) assessment_link on true
  left join public.veroxa_private_media_assessments_v1 assessment
    on assessment.id = assessment_link.assessment_id
   and assessment.restaurant_id = assessment_link.restaurant_id
   and assessment.source_content_sha256 =
     assessment_link.source_content_sha256
  left join lateral (
    select candidate.id,
      candidate.association,
      candidate.evidence_class,
      candidate.recorded_at
    from public.veroxa_media_restaurant_associations_v1 candidate
    join public.veroxa_media_rights rights
      on rights.id = candidate.rights_id
     and rights.restaurant_id = candidate.restaurant_id
     and rights.asset_id = candidate.asset_id
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
    order by candidate.recorded_at desc, candidate.id desc
    limit 1
  ) association on true
  left join lateral (
    select event.id, event.recorded_at
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.restaurant_id = p_restaurant_id
      and event.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
      and event.disposition = 'discarded'
      and not event.external_write_allowed
    order by event.recorded_at desc, event.id desc
    limit 1
  ) source_discard on true
  left join lateral (
    select latest_event.disposition,
      case when ready_source_discard.id is not null
        then 'discarded' else ready_decision.decision end
        as terminal_decision,
      veroxa_private.momo_content_ai_current_evidence_v1(
        ready.content_ai_run_id, run.requested_by
      )
      and veroxa_private.media_has_current_real_owner_association_v1(
        p_restaurant_id,
        identity_link.asset_id,
        identity_link.rights_id,
        identity_link.content_sha256
      )
      and latest_event.disposition is distinct from 'discarded'
      and ready_source_discard.id is null
      and ready_decision.decision is distinct from 'discarded'
        as current_evidence
    from public.veroxa_momo_media_asset_identity_links_v2 identity_link
    join public.veroxa_momo_ready_packages_v2 ready
      on ready.identity_id = identity_link.identity_id
     and ready.restaurant_id = identity_link.restaurant_id
     and ready.status = 'veroxa_ready'
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
     and run.restaurant_id = ready.restaurant_id
    left join veroxa_private.momo_ready_decisions_v2 ready_decision
      on ready_decision.ready_package_id = ready.id
     and ready_decision.restaurant_id = ready.restaurant_id
    left join veroxa_private.momo_ready_source_discards_v2
      ready_source_discard
      on ready_source_discard.restaurant_id = ready.restaurant_id
     and ready_source_discard.source_content_sha256 =
       ready.source_content_sha256
    left join lateral (
      select event.disposition
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.ready_package_id = ready.id
      order by (event.disposition = 'discarded') desc,
        event.recorded_at desc, event.id desc
      limit 1
    ) latest_event on true
    where identity_link.restaurant_id = p_restaurant_id
      and identity_link.asset_id = asset.id
    order by ready.ready_at desc, ready.id desc
    limit 1
  ) displayed_ready on true
  order by asset.created_at desc, asset.id desc;
end;
$$;
revoke all on function public.veroxa_momo_client_upload_status_v4(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_client_upload_status_v4(uuid)
  to authenticated;

-- Retire the superseded Ready-v1 mutation and unbounded readbacks. Historical
-- evidence remains immutable and is consumed only as a source tombstone.
revoke all on function
  public.veroxa_record_momo_ready_disposition_v1(
    uuid,uuid,text,text,text,text,jsonb
  ),
  public.veroxa_momo_team_ready_active_v1(uuid),
  public.veroxa_momo_team_ready_evidence_v1(uuid),
  public.veroxa_momo_team_ready_freshness_v1(uuid,uuid,text,text)
  from public, anon, authenticated, service_role;

do $$
declare
  held_restaurant_id constant uuid :=
    '6386d7e3-7966-4498-a13e-8736590bd505'::uuid;
  restaurant_rows integer;
  scope_rows integer;
  runtime_rows_present integer;
  runtime_rows integer;
begin
  select pg_catalog.count(*)::integer into restaurant_rows
  from public.veroxa_restaurants restaurant
  where restaurant.id = held_restaurant_id;
  select pg_catalog.count(*)::integer into scope_rows
  from veroxa_private.operational_restaurant_scope scope
  where scope.restaurant_id = held_restaurant_id
     or scope.scope_key = 'momo_house_san_antonio';
  select pg_catalog.count(*)::integer into runtime_rows_present
  from public.veroxa_momo_runtime_controls runtime
  where runtime.restaurant_id = held_restaurant_id;

  -- A clean migration replay has no operational restaurant fixture yet. Only
  -- that complete absence is a no-op; any partial or mismatched production
  -- identity fails closed.
  if restaurant_rows = 0
     and scope_rows = 0
     and runtime_rows_present = 0 then
    return;
  end if;
  if restaurant_rows <> 1
     or scope_rows <> 1
     or runtime_rows_present <> 1
     or not exists (
    select 1
    from public.veroxa_restaurants restaurant
    join veroxa_private.operational_restaurant_scope scope
      on scope.restaurant_id = restaurant.id
     and scope.scope_key = 'momo_house_san_antonio'
    where restaurant.id = held_restaurant_id
      and restaurant.name = 'Momo''s House San Antonio'
      and restaurant.city = 'San Antonio'
      and restaurant.state = 'TX'
      and restaurant.status = 'active'
  ) then
    raise exception using errcode = '23514',
      message = 'momo_operational_restaurant_identity_required';
  end if;

  perform 1
  from public.veroxa_momo_runtime_controls runtime
  where runtime.restaurant_id = held_restaurant_id
  for update;
  if exists (
    select 1
    from public.veroxa_momo_runtime_controls runtime
    where runtime.restaurant_id = held_restaurant_id
      and (
        runtime.provider_writes
        or runtime.review_replies
        or runtime.website_writes
        or runtime.external_scheduling
      )
  ) then
    raise exception using errcode = '23514',
      message = 'momo_external_write_hold_required';
  end if;
  update public.veroxa_momo_runtime_controls runtime
  set ai_live_calls = false,
      provider_writes = false,
      review_replies = false,
      website_writes = false,
      external_scheduling = false,
      updated_at = pg_catalog.clock_timestamp()
  where runtime.restaurant_id = held_restaurant_id;
  get diagnostics runtime_rows = row_count;
  if runtime_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_runtime_hold_row_required';
  end if;
end;
$$;

-- End this repair in the audited production hold. A later source-tracked
-- activation migration may only install a postgres-only, no-grant routine
-- bound to exact merged Sites and Edge identities. Roles remain revoked until
-- a post-second-parity audited invocation, with ai_live_calls still false.
revoke all on function
  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid),
  veroxa_private.momo_media_has_current_food_association_v2(
    uuid,uuid,uuid,text
  ),
  veroxa_private.momo_evidence_class_for_user_v1(uuid,uuid),
  veroxa_private.guard_team_private_media_rights_v1(),
  veroxa_private.guard_team_private_media_association_v1(),
  veroxa_private.private_media_assessment_output_legacy_v1(jsonb),
  veroxa_private.private_media_assessment_output_valid_v1(jsonb),
  veroxa_private.private_media_provider_usage_microusd_v2(jsonb),
  veroxa_private.validate_registered_media_rights_v1(),
  veroxa_private.classify_momo_media_rights_v1(),
  veroxa_private.guard_private_media_assessment_transition_v1(),
  veroxa_private.guard_momo_ready_source_discard_v2(),
  veroxa_private.momo_advance_verified_asset_v2(jsonb),
  veroxa_private.momo_materialize_veroxa_ready_v2(jsonb),
  veroxa_private.momo_ready_review_snapshot_v2(uuid)
  from public, anon, authenticated, service_role;

revoke all on function
  public.veroxa_register_momo_media_v1(
    uuid,text,text,bigint,text,text,jsonb,timestamptz
  ),
  public.veroxa_register_momo_media_v2(
    uuid,text,text,bigint,text,text,jsonb,date
  ),
  public.veroxa_register_team_private_media_v1(
    uuid,text,text,bigint,text,text,jsonb,date
  ),
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid,uuid,uuid,text,text,bigint,integer,integer,text,
    jsonb,text,text,text,uuid
  ),
  public.veroxa_reserve_private_media_assessment_v1(
    uuid,uuid,text,text,text,text,text,bigint,uuid
  ),
  public.veroxa_start_private_media_assessment_provider_v1(
    uuid,text,uuid
  ),
  public.veroxa_complete_private_media_assessment_v1(
    uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_fail_private_media_assessment_v1(
    uuid,text,text,text,boolean,bigint,jsonb,uuid
  ),
  public.veroxa_record_media_restaurant_association_v1(
    uuid,uuid,uuid,text,text,text
  ),
  public.veroxa_finalize_momo_media_intake_v1(
    uuid,uuid,uuid,text,text,bigint,integer,integer,text,
    jsonb,text,text,text,uuid
  ),
  public.veroxa_reserve_momo_media_ai_candidate_v1(
    uuid,uuid,text,text,text,text,text,text,text
  ),
  public.veroxa_start_momo_media_ai_provider_v1(uuid,text,uuid),
  public.veroxa_complete_momo_media_ai_candidate_v1(
    uuid,text,text,text,bigint,integer,integer,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_fail_momo_media_ai_candidate_v1(uuid,text,text,uuid),
  public.veroxa_close_momo_media_ai_attempt_v1(uuid),
  public.veroxa_approve_momo_media_ai_candidate_v1(uuid,text,text,text),
  public.veroxa_reject_momo_media_ai_candidate_v1(uuid,text,text,text),
  public.veroxa_momo_media_ai_lifecycle_preflight_v1(uuid,uuid),
  public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text,text),
  public.veroxa_start_momo_content_ai_run_v1(uuid,text,uuid,uuid),
  public.veroxa_claim_momo_content_ai_dispatch_v1(uuid,bigint,uuid),
  public.veroxa_begin_momo_content_ai_dispatch_v1(
    uuid,text,uuid,uuid,text
  ),
  public.veroxa_cancel_momo_content_ai_dispatch_before_post_v1(
    uuid,text,uuid,uuid,text,text
  ),
  public.veroxa_release_momo_content_ai_dispatch_v1(
    uuid,text,uuid,text,boolean
  ),
  public.veroxa_bind_momo_content_ai_dispatch_response_v1(
    uuid,text,uuid,uuid,text
  ),
  public.veroxa_reconcile_momo_content_ai_dispatch_v1(
    uuid,text,uuid,uuid,text
  ),
  public.veroxa_reject_momo_content_ai_dispatch_after_post_v1(
    uuid,text,uuid,uuid,text,integer,text,text
  ),
  public.veroxa_claim_momo_content_ai_recovery_v1(uuid,bigint),
  public.veroxa_abort_momo_content_ai_before_provider_v1(
    uuid,text,uuid,uuid
  ),
  public.veroxa_record_momo_content_ai_provider_response_v1(
    uuid,text,text,uuid
  ),
  public.veroxa_claim_momo_content_ai_webhook_v1(
    text,text,text,uuid,text,uuid
  ),
  public.veroxa_stage_momo_content_ai_webhook_result_v1(
    text,text,uuid,uuid,text,text,jsonb,text,text,jsonb,text,text,
    bigint,text,jsonb,uuid
  ),
  public.veroxa_complete_staged_momo_content_ai_webhook_v1(
    text,text,uuid,uuid,text,uuid
  ),
  public.veroxa_fail_momo_content_ai_webhook_v1(
    text,text,uuid,uuid,text,text,text,boolean,bigint,jsonb,uuid
  ),
  public.veroxa_finish_momo_content_ai_webhook_v1(
    text,text,uuid,text,uuid,text,text,text
  ),
  public.veroxa_stage_momo_content_ai_result_v1(
    uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_complete_staged_momo_content_ai_run_v1(uuid,text,uuid),
  public.veroxa_complete_momo_content_ai_run_v1(
    uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_fail_momo_content_ai_run_v1(
    uuid,text,text,text,boolean,bigint,jsonb,uuid
  ),
  public.veroxa_reject_momo_content_ai_run_v1(uuid,text),
  public.veroxa_momo_upload_pipeline_v2(text,jsonb),
  public.veroxa_momo_ready_review_status_v2(uuid,uuid),
  public.veroxa_decide_momo_ready_package_v2(uuid,text,text,text,text),
  public.veroxa_momo_client_upload_status_v4(uuid)
  from public, anon, authenticated, service_role;

grant execute on function
  public.veroxa_momo_ready_review_status_v2(uuid,uuid),
  public.veroxa_momo_client_upload_status_v4(uuid)
  to authenticated;
