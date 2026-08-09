-- Save the restaurant-association instruction in the same transaction that
-- registers an upload. Momo uploads once; Veroxa and Team Faraz own every
-- technical processing or recovery step after that point.

create table public.veroxa_media_upload_instructions_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null unique
    references public.veroxa_media_assets(id) on delete cascade,
  rights_id uuid not null unique
    references public.veroxa_media_rights(id) on delete cascade,
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
  evidence_class text not null check (
    evidence_class in ('unknown','development_proxy','real_owner')
  ),
  submitted_by uuid not null
    references public.veroxa_user_profiles(user_id),
  processing_owner text not null default 'veroxa_team' check (
    processing_owner = 'veroxa_team'
  ),
  external_write_allowed boolean not null default false check (
    not external_write_allowed
  ),
  created_at timestamptz not null default pg_catalog.now()
);

create index veroxa_media_upload_instructions_restaurant_created_idx
  on public.veroxa_media_upload_instructions_v1 (
    restaurant_id, created_at desc
  );

alter table public.veroxa_media_upload_instructions_v1 enable row level security;
revoke all on table public.veroxa_media_upload_instructions_v1
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_media_upload_instruction_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'media_upload_instruction_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.guard_media_upload_instruction_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_media_upload_instruction_immutable_v1
before update or delete on public.veroxa_media_upload_instructions_v1
for each row execute function
  veroxa_private.guard_media_upload_instruction_v1();

create or replace function public.veroxa_register_momo_media_v3(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_usage_scope jsonb default
    '["facebook","instagram","google_business"]'::jsonb,
  p_expires_on date default null,
  p_requested_association text default 'not_for_restaurant',
  p_association_note text default null
)
returns table (
  asset_id uuid,
  rights_id uuid,
  instruction_id uuid,
  instruction_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  registered record;
  new_instruction_id uuid;
  actor_evidence_class text;
  normalized_note text := nullif(
    pg_catalog.btrim(p_association_note), ''
  );
  durable_instruction jsonb;
begin
  if actor_id is null
     or p_requested_association not in (
       'not_for_restaurant',
       'licensed_generic_only',
       'represents_current_restaurant_offering'
     )
     or pg_catalog.char_length(coalesce(p_association_note, '')) > 2000 then
    raise exception using errcode = '22023',
      message = 'invalid_media_upload_instruction';
  end if;

  actor_evidence_class :=
    veroxa_private.momo_evidence_class_for_user_v1(
      p_restaurant_id, actor_id
    );
  if actor_evidence_class not in (
    'unknown','development_proxy','real_owner'
  ) then
    actor_evidence_class := 'unknown';
  end if;

  durable_instruction := pg_catalog.jsonb_build_object(
    'schemaVersion', 'veroxa-media-upload-instruction-v1',
    'requestedAssociation', p_requested_association,
    'associationNote', normalized_note,
    'evidenceClass', actor_evidence_class,
    'processingOwner', 'veroxa_team',
    'clientActionAfterUpload', 'none'
  );

  select * into strict registered
  from public.veroxa_register_momo_media_v2(
    p_restaurant_id,
    p_storage_path,
    p_mime_type,
    p_file_size,
    p_original_file_name,
    durable_instruction::text,
    p_usage_scope,
    p_expires_on
  );

  insert into public.veroxa_media_upload_instructions_v1 (
    restaurant_id,
    asset_id,
    rights_id,
    requested_association,
    association_note,
    evidence_class,
    submitted_by
  ) values (
    p_restaurant_id,
    registered.asset_id,
    registered.rights_id,
    p_requested_association,
    normalized_note,
    actor_evidence_class,
    actor_id
  ) returning id into new_instruction_id;

  return query select
    registered.asset_id,
    registered.rights_id,
    new_instruction_id,
    'saved'::text;
end;
$$;
revoke all on function public.veroxa_register_momo_media_v3(
  uuid,text,text,bigint,text,jsonb,date,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_register_momo_media_v3(
  uuid,text,text,bigint,text,jsonb,date,text,text
) to authenticated;

create or replace function
  public.veroxa_momo_media_upload_instructions_v1(
    p_restaurant_id uuid
  )
returns table (
  instruction_id uuid,
  asset_id uuid,
  rights_id uuid,
  requested_association text,
  association_note text,
  evidence_class text,
  created_at timestamptz,
  external_write_allowed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not (
       public.veroxa_current_user_has_active_restaurant(
         p_restaurant_id
       )
       or public.veroxa_current_user_is_team_for_restaurant(
         p_restaurant_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'active_momo_membership_required';
  end if;

  return query
  select
    instruction.id,
    instruction.asset_id,
    instruction.rights_id,
    instruction.requested_association,
    instruction.association_note,
    instruction.evidence_class,
    instruction.created_at,
    false
  from public.veroxa_media_upload_instructions_v1 instruction
  where instruction.restaurant_id = p_restaurant_id
  order by instruction.created_at desc;
end;
$$;
revoke all on function
  public.veroxa_momo_media_upload_instructions_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_media_upload_instructions_v1(uuid)
  to authenticated;

-- Every already-saved original that has no verified intake becomes a Team
-- exception. This does not infer or fabricate a missing Momo association
-- instruction, and it performs no provider or external write.
do $$
declare
  candidate record;
  evidence_snapshot jsonb;
  evidence_canonical text;
  evidence_sha256 text;
  idempotency_sha256 text;
begin
  for candidate in
    select
      asset.restaurant_id,
      asset.id as asset_id,
      asset.storage_path,
      asset.uploaded_by as actor_id
    from public.veroxa_media_assets asset
    where asset.status = 'uploaded'
      and not exists (
        select 1
        from public.veroxa_private_media_assessment_intakes_v1 intake
        where intake.restaurant_id = asset.restaurant_id
          and intake.asset_id = asset.id
      )
      and exists (
        select 1
        from storage.objects object
        where object.bucket_id = 'restaurant-media'
          and object.name = asset.storage_path
      )
      and veroxa_private.momo_actor_has_operational_membership_v1(
        asset.restaurant_id, asset.uploaded_by
      )
  loop
    evidence_snapshot := pg_catalog.jsonb_build_object(
      'schemaVersion', 3,
      'verifierVersion',
        'veroxa-private-image-byte-verifier-2026-08-08-v1',
      'restaurantId', candidate.restaurant_id,
      'assetId', candidate.asset_id,
      'storagePath', candidate.storage_path,
      'outcome', 'unavailable',
      'reasonCodes',
        pg_catalog.jsonb_build_array('media_verification_unavailable'),
      'observed', pg_catalog.jsonb_build_object(
        'recoveryOwner', 'veroxa_team',
        'clientActionRequired', false
      )
    );
    evidence_canonical :=
      veroxa_private.momo_canonical_json_v1(evidence_snapshot);
    evidence_sha256 := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(evidence_canonical, 'UTF8'), 'sha256'
    ), 'hex');
    idempotency_sha256 := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(
        'momo-team-handoff-v1:' || candidate.asset_id::text,
        'UTF8'
      ), 'sha256'
    ), 'hex');

    perform public.veroxa_momo_upload_pipeline_v2(
      'record_intake_attempt',
      pg_catalog.jsonb_build_object(
        'restaurantId', candidate.restaurant_id,
        'assetId', candidate.asset_id,
        'actorId', candidate.actor_id,
        'outcome', 'unavailable',
        'reasonCodes',
          pg_catalog.jsonb_build_array('media_verification_unavailable'),
        'evidenceSnapshot', evidence_snapshot,
        'evidenceCanonical', evidence_canonical,
        'evidenceSha256', evidence_sha256,
        'idempotencySha256', idempotency_sha256
      )
    );
  end loop;
end;
$$;

