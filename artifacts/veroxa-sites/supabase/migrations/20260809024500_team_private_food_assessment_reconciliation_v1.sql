-- Forward-only reconciliation after the exact live47 private-authority repair.
-- Add only the missing Team assessment-only intake and strict private-food
-- assessment contract. Preserve live47's source-tombstone and Ready authority.
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



-- Live47 centralized content eligibility in this exact-asset authority helper.
-- Tighten that existing boundary with the v2 prompt, accounting, objective
-- food tag, and permanent Team assessment-only exclusion. All live47 callers
-- inherit the stricter gate without replacing its Ready authority functions.
create or replace function
  veroxa_private.media_has_current_real_owner_association_v1(
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
  select exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_private_media_assessment_intakes_v1 intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.platform_ready
     and intake.content_sha256 = p_source_content_sha256
    join public.veroxa_private_media_assessment_asset_links_v1 link
      on link.asset_id = asset.id
     and link.restaurant_id = asset.restaurant_id
     and link.intake_id = intake.id
     and link.source_content_sha256 = intake.content_sha256
    join public.veroxa_private_media_assessments_v1 assessment
      on assessment.id = link.assessment_id
     and assessment.restaurant_id = asset.restaurant_id
     and assessment.source_content_sha256 = intake.content_sha256
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
         and pg_catalog.jsonb_typeof(tag.value -> 'confidence') = 'number'
         and (tag.value ->> 'confidence')::numeric >= 0.70
         and tag.value -> 'uncertainty' = 'null'::jsonb
     )
     and veroxa_private.private_media_assessment_output_valid_v1(
       assessment.output_payload
     )
    join public.veroxa_media_rights rights
      on rights.id = p_rights_id
     and rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
     and not rights.team_private_assessment_only
    join lateral (
      select association.*
      from public.veroxa_media_restaurant_associations_v1 association
      where association.restaurant_id = asset.restaurant_id
        and association.asset_id = asset.id
        and association.rights_id = p_rights_id
        and association.source_content_sha256 = p_source_content_sha256
      order by association.recorded_at desc, association.id desc
      limit 1
    ) latest on true
    where asset.id = p_asset_id
      and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = p_source_content_sha256
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
      and latest.association =
        'represents_current_restaurant_offering'
      and latest.evidence_class = 'real_owner'
      and not latest.external_write_allowed
  );
$$;
revoke all on function
  veroxa_private.media_has_current_real_owner_association_v1(
    uuid, uuid, uuid, text
  ) from public, anon, authenticated, service_role;

-- The forward patch ends in the exact operational hold. Client and Team
-- registration plus assessment mutation remain unreachable until the later
-- identity-bound activation routine is installed and invoked.
revoke all on function
  public.veroxa_register_momo_media_v2(
    uuid, text, text, bigint, text, text, jsonb, date
  ),
  public.veroxa_register_team_private_media_v1(
    uuid, text, text, bigint, text, text, jsonb, date
  ),
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ),
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  )
  from public, anon, authenticated, service_role;

