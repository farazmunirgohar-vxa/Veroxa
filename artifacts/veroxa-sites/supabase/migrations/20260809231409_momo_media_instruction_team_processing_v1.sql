-- Close the one-step media handoff without changing the already-applied
-- live50 migration. Every authenticated Client registration must enter
-- through v3, and Team may apply only the exact immutable instruction that
-- the original uploader supplied. No Team input can create owner truth.

revoke all on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) from public, anon, authenticated, service_role;

alter table public.veroxa_media_upload_instructions_v1
  force row level security;
revoke all on table public.veroxa_media_upload_instructions_v1
  from public, anon, authenticated, service_role;

create table public.veroxa_media_upload_instruction_applications_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  instruction_id uuid not null unique
    references public.veroxa_media_upload_instructions_v1(id)
      on delete restrict,
  asset_id uuid not null
    references public.veroxa_media_assets(id) on delete restrict,
  association_id uuid not null unique
    references public.veroxa_media_restaurant_associations_v1(id)
      on delete restrict,
  instruction_submitted_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  instruction_evidence_class text not null check (
    instruction_evidence_class in ('development_proxy', 'real_owner')
  ),
  applied_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  applied_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false check (
    not external_write_allowed
  )
);

create index veroxa_media_upload_instruction_applications_asset_idx
  on public.veroxa_media_upload_instruction_applications_v1 (
    restaurant_id, asset_id, applied_at desc
  );

alter table public.veroxa_media_upload_instruction_applications_v1
  enable row level security;
alter table public.veroxa_media_upload_instruction_applications_v1
  force row level security;
revoke all on table
  public.veroxa_media_upload_instruction_applications_v1
  from public, anon, authenticated, service_role;

create trigger veroxa_media_upload_instruction_application_immutable_v1
before update or delete
on public.veroxa_media_upload_instruction_applications_v1
for each row execute function
  veroxa_private.guard_media_upload_instruction_v1();

create or replace function
  public.veroxa_apply_momo_media_upload_instruction_v1(
    p_restaurant_id uuid,
    p_asset_id uuid
  )
returns table (
  upload_instruction_id uuid,
  association_id uuid,
  application_status text,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  instruction
    public.veroxa_media_upload_instructions_v1%rowtype;
  application
    public.veroxa_media_upload_instruction_applications_v1%rowtype;
  asset public.veroxa_media_assets%rowtype;
  rights public.veroxa_media_rights%rowtype;
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
  existing public.veroxa_media_restaurant_associations_v1%rowtype;
  applied public.veroxa_media_restaurant_associations_v1%rowtype;
  result_status text;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'team_media_instruction_processor_required';
  end if;

  select candidate.* into instruction
  from public.veroxa_media_upload_instructions_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
  for update;
  if not found then
    raise exception using errcode = '22023',
      message = 'media_upload_instruction_not_found';
  end if;

  select candidate.* into application
  from public.veroxa_media_upload_instruction_applications_v1 candidate
  where candidate.instruction_id = instruction.id;
  if found then
    return query select
      instruction.id,
      application.association_id,
      'already_applied'::text,
      false;
    return;
  end if;

  if instruction.evidence_class not in (
    'development_proxy', 'real_owner'
  ) or (
    instruction.requested_association =
      'represents_current_restaurant_offering'
    and instruction.evidence_class <> 'real_owner'
  ) then
    return query select
      instruction.id,
      null::uuid,
      'needs_restaurant_fact_or_permission'::text,
      false;
    return;
  end if;

  select candidate.* into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id;
  select candidate.* into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.status = 'verified';
  if asset.id is null or intake.id is null
     or asset.content_sha256 is null
     or intake.content_sha256 is distinct from asset.content_sha256
     or not exists (
       select 1
       from public.veroxa_private_media_assessment_asset_links_v1 link
       join public.veroxa_private_media_assessments_v1 assessment
         on assessment.id = link.assessment_id
        and assessment.restaurant_id = link.restaurant_id
        and assessment.status = 'completed'
       where link.restaurant_id = p_restaurant_id
         and link.asset_id = p_asset_id
         and link.intake_id = intake.id
         and link.source_content_sha256 = asset.content_sha256
         and assessment.source_content_sha256 = asset.content_sha256
     ) then
    return query select
      instruction.id,
      null::uuid,
      'awaiting_private_assessment'::text,
      false;
    return;
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    p_restaurant_id, asset.content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    p_restaurant_id, asset.content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  select candidate.* into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for share;
  select candidate.* into rights
  from public.veroxa_media_rights candidate
  where candidate.id = instruction.rights_id
    and candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for share;
  select candidate.* into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.status = 'verified'
  for share;
  if asset.id is null or rights.id is null or intake.id is null
     or asset.content_sha256 is null
     or intake.content_sha256 is distinct from asset.content_sha256
     or rights.team_private_assessment_only
     or not exists (
       select 1
       from public.veroxa_private_media_assessment_asset_links_v1 link
       join public.veroxa_private_media_assessments_v1 assessment
         on assessment.id = link.assessment_id
        and assessment.restaurant_id = link.restaurant_id
        and assessment.status = 'completed'
       where link.restaurant_id = p_restaurant_id
         and link.asset_id = p_asset_id
         and link.intake_id = intake.id
         and link.source_content_sha256 = asset.content_sha256
         and assessment.source_content_sha256 = asset.content_sha256
     ) then
    raise exception using errcode = '40001',
      message = 'completed_current_private_assessment_refresh_required';
  end if;

  if instruction.requested_association =
      'represents_current_restaurant_offering'
     and (
       instruction.evidence_class <> 'real_owner'
       or rights.rights_status <> 'confirmed'
       or rights.evidence_class <> 'real_owner'
       or (rights.valid_from is not null
         and rights.valid_from > pg_catalog.now())
       or (rights.expires_at is not null
         and rights.expires_at <= pg_catalog.now())
     ) then
    return query select
      instruction.id,
      null::uuid,
      'needs_restaurant_fact_or_permission'::text,
      false;
    return;
  end if;

  select candidate.* into existing
  from public.veroxa_media_restaurant_associations_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
    and candidate.rights_id = instruction.rights_id
    and candidate.source_content_sha256 = asset.content_sha256;
  if found then
    if existing.association is distinct from
         instruction.requested_association
       or existing.evidence_class is distinct from
         instruction.evidence_class
       or existing.recorded_by is distinct from
         instruction.submitted_by then
      raise exception using errcode = '23505',
        message = 'media_restaurant_association_decision_is_terminal';
    end if;
    applied := existing;
    result_status := 'applied_existing';
  else
    insert into public.veroxa_media_restaurant_associations_v1 (
      restaurant_id,
      asset_id,
      rights_id,
      source_content_sha256,
      association,
      note,
      evidence_class,
      recorded_by
    ) values (
      p_restaurant_id,
      p_asset_id,
      instruction.rights_id,
      asset.content_sha256,
      instruction.requested_association,
      pg_catalog.format(
        'Applied from immutable upload instruction %s.',
        instruction.id
      ),
      instruction.evidence_class,
      instruction.submitted_by
    ) returning * into applied;
    result_status := 'applied';
  end if;

  insert into public.veroxa_media_upload_instruction_applications_v1 (
    restaurant_id,
    instruction_id,
    asset_id,
    association_id,
    instruction_submitted_by,
    instruction_evidence_class,
    applied_by
  ) values (
    p_restaurant_id,
    instruction.id,
    p_asset_id,
    applied.id,
    instruction.submitted_by,
    instruction.evidence_class,
    actor_id
  ) returning * into application;

  if instruction.requested_association =
      'represents_current_restaurant_offering'
     and intake.platform_ready
     and veroxa_private.media_has_current_real_owner_association_v1(
       p_restaurant_id,
       p_asset_id,
       instruction.rights_id,
       asset.content_sha256
     ) then
    begin
      perform veroxa_private.momo_advance_verified_asset_v2(
        pg_catalog.jsonb_build_object(
          'restaurantId', p_restaurant_id,
          'assetId', p_asset_id,
          'verificationId', intake.id,
          'actorId', actor_id
        )
      );
    exception
      when integrity_constraint_violation
        or serialization_failure
        or raise_exception
        or invalid_parameter_value
        or object_not_in_prerequisite_state then
        null;
    end;
  end if;

  return query select
    instruction.id,
    applied.id,
    result_status,
    false;
end;
$$;
revoke all on function
  public.veroxa_apply_momo_media_upload_instruction_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_apply_momo_media_upload_instruction_v1(uuid, uuid)
  to authenticated;

-- Reassert every external lock. This forward fix authorizes no provider or
-- public write and consumes no new rollout authority.
do $$
begin
  update public.veroxa_momo_runtime_controls
  set provider_writes = false,
      review_replies = false,
      website_writes = false,
      external_scheduling = false,
      updated_at = pg_catalog.clock_timestamp();
end;
$$;
