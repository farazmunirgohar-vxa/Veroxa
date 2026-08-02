-- Keep a confirmation's submitted subject and snapshot immutable. When an
-- already-confirmed truth is reattested, record the resulting current revision
-- in a separate immutable application ledger consumed by every readiness gate.

drop trigger if exists veroxa_confirmations_subject_lineage_guard
  on public.veroxa_confirmations;
drop function if exists
  veroxa_private.validate_confirmation_subject_lineage_v1();

comment on column public.veroxa_confirmations.submitted_subject_id is
  'Original immutable subject row captured by the submission snapshot. The resulting truth revision, when distinct, is stored in veroxa_private.momo_truth_confirmation_applications.';

create or replace function veroxa_private.protect_confirmation_submitted_subject_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.submitted_subject_id is distinct from old.submitted_subject_id
     and (
       old.submitted_subject_id is not null
       or new.submitted_subject_id is distinct from old.subject_id
     ) then
    raise exception using errcode = '23514',
      message = 'confirmation_submitted_subject_is_immutable';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.protect_confirmation_submitted_subject_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_confirmations_submitted_subject_guard
  on public.veroxa_confirmations;
create trigger veroxa_confirmations_submitted_subject_guard
before update of submitted_subject_id on public.veroxa_confirmations
for each row execute function
  veroxa_private.protect_confirmation_submitted_subject_v1();

create table if not exists
  veroxa_private.momo_truth_confirmation_applications (
    confirmation_id uuid primary key
      references public.veroxa_confirmations(id) on delete restrict,
    restaurant_id uuid not null
      references public.veroxa_restaurants(id) on delete cascade,
    submitted_truth_id uuid not null
      references public.veroxa_restaurant_truth_fields(id) on delete restrict,
    applied_truth_id uuid not null unique
      references public.veroxa_restaurant_truth_fields(id) on delete restrict,
    applied_by uuid not null
      references public.veroxa_user_profiles(user_id) on delete restrict,
    applied_at timestamptz not null,
    created_at timestamptz not null default now(),
    check (submitted_truth_id <> applied_truth_id)
  );

revoke all on table
  veroxa_private.momo_truth_confirmation_applications
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.validate_momo_truth_confirmation_application_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_at timestamptz;
begin
  select confirmation.reviewed_at into reviewed_at
  from public.veroxa_confirmations confirmation
  join public.veroxa_restaurant_truth_fields submitted
    on submitted.id = new.submitted_truth_id
   and submitted.restaurant_id = confirmation.restaurant_id
  join public.veroxa_restaurant_truth_fields applied
    on applied.id = new.applied_truth_id
   and applied.restaurant_id = confirmation.restaurant_id
  where confirmation.id = new.confirmation_id
    and confirmation.restaurant_id = new.restaurant_id
    and confirmation.subject_type = 'truth_field'
    and confirmation.subject_id = new.submitted_truth_id
    and coalesce(
      confirmation.submitted_subject_id,
      confirmation.subject_id
    ) = new.submitted_truth_id
    and confirmation.confirmation_kind = 'business_truth'
    and confirmation.decision in ('confirm','correct')
    and confirmation.status = 'approved'
    and confirmation.reviewed_by = new.applied_by
    and confirmation.reviewed_at is not null
    and applied.supersedes_id = submitted.id
    and applied.is_current
    and applied.status = 'owner_confirmed'
    and applied.owner_confirmed_by = confirmation.submitted_by
    and applied.owner_confirmed_at = confirmation.submitted_at
    and applied.created_by = confirmation.reviewed_by
    and applied.evidence_class = confirmation.evidence_class
  for share of confirmation, submitted, applied;

  if reviewed_at is null then
    raise exception using errcode = '23514',
      message = 'invalid_momo_truth_confirmation_application';
  end if;
  new.applied_at := reviewed_at;
  new.created_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_truth_confirmation_application_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_momo_truth_confirmation_application_guard
  on veroxa_private.momo_truth_confirmation_applications;
create trigger veroxa_momo_truth_confirmation_application_guard
before insert on veroxa_private.momo_truth_confirmation_applications
for each row execute function
  veroxa_private.validate_momo_truth_confirmation_application_v1();

create or replace function
  veroxa_private.protect_momo_truth_confirmation_application_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_truth_confirmation_application_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.protect_momo_truth_confirmation_application_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_momo_truth_confirmation_application_immutable
  on veroxa_private.momo_truth_confirmation_applications;
create trigger veroxa_momo_truth_confirmation_application_immutable
before update or delete on
  veroxa_private.momo_truth_confirmation_applications
for each row execute function
  veroxa_private.protect_momo_truth_confirmation_application_v1();

create or replace function veroxa_private.truth_confirmation_applies_to_v1(
  p_confirmation_id uuid,
  p_truth_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_confirmations confirmation
    where confirmation.id = p_confirmation_id
      and (
        confirmation.subject_id = p_truth_id
        or exists (
          select 1
          from veroxa_private.momo_truth_confirmation_applications application
          where application.confirmation_id = confirmation.id
            and application.applied_truth_id = p_truth_id
        )
      )
  );
$$;
revoke all on function
  veroxa_private.truth_confirmation_applies_to_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

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
  current_authority_evidence text;
  applied_truth_evidence text;
  new_truth_id uuid;
  defer_truth_confirmation_status boolean := false;
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

  if p_decision = 'approved'
     and confirmation_record.subject_type = 'truth_field'
     and confirmation_record.decision in ('confirm','correct','reject') then
    select * into old_truth
    from public.veroxa_restaurant_truth_fields
    where id = confirmation_record.subject_id
      and restaurant_id = confirmation_record.restaurant_id
      and is_current
    for update;
    if not found then
      raise exception using errcode = '23503', message = 'confirmation_subject_missing';
    end if;

    select authority.evidence_class into current_authority_evidence
    from public.veroxa_momo_evidence_authorities authority
    where authority.restaurant_id = confirmation_record.restaurant_id
      and authority.user_id = confirmation_record.submitted_by
      and authority.active
    for share;
    current_authority_evidence := coalesce(current_authority_evidence, 'unknown');
    if current_authority_evidence is distinct from confirmation_record.evidence_class then
      raise exception using errcode = '40001',
        message = 'truth_confirmation_authority_changed_resubmit_required';
    end if;
    if old_truth.evidence_class = 'real_owner'
       and confirmation_record.evidence_class <> 'real_owner' then
      raise exception using errcode = '23514',
        message = 'truth_confirmation_evidence_cannot_be_downgraded';
    end if;
    defer_truth_confirmation_status :=
      confirmation_record.decision in ('confirm','correct')
      and old_truth.status = 'owner_confirmed';
  end if;

  if not defer_truth_confirmation_status then
    update public.veroxa_confirmations
    set status = p_decision, reviewed_by = reviewer_id, reviewed_at = now(),
        review_notes = nullif(btrim(p_review_notes), '')
    where id = confirmation_record.id;
  end if;

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
        if old_truth.status = 'owner_confirmed' then
          update public.veroxa_restaurant_truth_fields
          set is_current = false, status = 'superseded'
          where id = old_truth.id;
          insert into public.veroxa_restaurant_truth_fields (
            restaurant_id, field_key, section, value_json, status, source, is_current,
            owner_confirmed_by, owner_confirmed_at, supersedes_id, created_by
          ) values (
            old_truth.restaurant_id, old_truth.field_key, old_truth.section,
            coalesce(applied_value, old_truth.value_json),
            'owner_confirmed', 'owner', true, confirmation_record.submitted_by,
            confirmation_record.submitted_at, old_truth.id, reviewer_id
          )
          returning id, evidence_class into new_truth_id, applied_truth_evidence;
          if applied_truth_evidence is distinct from confirmation_record.evidence_class then
            raise exception using errcode = '40001',
              message = 'truth_confirmation_authority_changed_resubmit_required';
          end if;
          update public.veroxa_confirmations
          set status = p_decision, reviewed_by = reviewer_id, reviewed_at = now(),
              review_notes = nullif(btrim(p_review_notes), '')
          where id = confirmation_record.id;
          insert into veroxa_private.momo_truth_confirmation_applications (
            confirmation_id, restaurant_id, submitted_truth_id,
            applied_truth_id, applied_by
          ) values (
            confirmation_record.id, confirmation_record.restaurant_id,
            confirmation_record.subject_id, new_truth_id, reviewer_id
          );
        else
          update public.veroxa_restaurant_truth_fields
          set value_json = coalesce(applied_value, value_json), status = 'owner_confirmed',
              owner_confirmed_by = confirmation_record.submitted_by,
              owner_confirmed_at = confirmation_record.submitted_at
          where id = old_truth.id
          returning evidence_class into applied_truth_evidence;
          if applied_truth_evidence is distinct from confirmation_record.evidence_class then
            raise exception using errcode = '40001',
              message = 'truth_confirmation_authority_changed_resubmit_required';
          end if;
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
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_apply_confirmation_v1(uuid, public.veroxa_review_status_v1, jsonb, text)
  to authenticated;


create or replace function veroxa_private.content_inputs_current_v1(
  p_content_item_id uuid, p_restaurant_id uuid, p_platform text default null
) returns boolean
language sql stable security definer set search_path = ''
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
          )) or (item.primary_media_asset_id is not null and exists (
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
            or field.evidence_class <> 'real_owner'
            or input.truth_value_sha256 is distinct from
              encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, field.id::text,
                encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex'),
                item.manual_pillar), 'UTF8'), 'sha256'), 'hex')
          )) or (input.input_kind = 'permissioned_media' and (
            rights.id is null or rights.rights_status <> 'confirmed'
            or rights.evidence_class <> 'real_owner'
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
        on field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      join lateral (
        select confirmation.* from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = input.restaurant_id
          and confirmation.subject_type = 'truth_field'
          and veroxa_private.truth_confirmation_applies_to_v1(
            confirmation.id, input.truth_field_id
          )
        order by confirmation.submitted_at desc, confirmation.created_at desc, confirmation.id desc
        limit 1
      ) latest on true
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
        and not (
          latest.status = 'approved' and latest.decision in ('confirm','correct')
          and latest.evidence_class = 'real_owner'
          and field.owner_confirmed_by = latest.submitted_by
          and field.owner_confirmed_at = latest.submitted_at
        )
    );
$$;

revoke all on function veroxa_private.content_inputs_current_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_momo_manual_pilot_gate_v1(
  p_restaurant_id uuid
)
returns table (
  status text,
  can_review boolean,
  owner_user_id uuid,
  required_check_count integer,
  passed_check_count integer,
  blocker_count integer,
  evidence jsonb,
  blockers jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner_count integer := 0;
  v_owner_id uuid;
  v_contact_count integer := 0;
  v_truth_count integer := 0;
  v_onboarding_count integer := 0;
  v_media_count integer := 0;
  v_readiness_count integer := 0;
  v_readiness_snapshot jsonb := '[]'::jsonb;
  v_request_id uuid;
  v_work_id uuid;
  v_approval_id uuid;
  v_activity_id uuid;
  v_report_id uuid;
  v_report_approval_id uuid;
  v_recovery_id uuid;
  v_passed integer := 0;
  v_blockers jsonb := '[]'::jsonb;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     or not exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.scope_key = 'momo_house_san_antonio'
         and scope.restaurant_id = p_restaurant_id and scope.enabled
     ) then
    raise exception using errcode = '42501',
      message = 'momo_team_manual_pilot_gate_required';
  end if;

  select count(*)::integer,
    (array_agg(profile.user_id order by profile.user_id))[1]
  into v_owner_count, v_owner_id
  from public.veroxa_user_profiles profile
  join public.veroxa_restaurant_members member
    on member.user_id = profile.user_id
   and member.role = profile.role
  where member.restaurant_id = p_restaurant_id
    and profile.role = 'client'
    and profile.status = 'active'
    and member.status = 'active';
  if v_owner_count = 1 then
    v_passed := v_passed + 1;
  else
    v_owner_id := null;
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','single_active_client_owner_required',
      'message','Exactly one active Client identity must own all pilot evidence.',
      'observedCount',v_owner_count));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_contact_count
    from public.veroxa_restaurant_contacts contact
    where contact.restaurant_id = p_restaurant_id
      and contact.contact_kind = 'owner'
      and contact.is_primary
      and contact.status = 'owner_confirmed'
      and contact.owner_confirmed_by = v_owner_id
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'contact'
          and confirmation.subject_id = contact.id
          and confirmation.confirmation_kind = 'contact'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = contact.owner_confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'contact'
              and latest.subject_id = contact.id
              and latest.confirmation_kind = 'contact'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_contact_count = 1 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','owner_primary_contact_unverified',
      'message','One latest-approved primary owner contact from the same Client is required.'));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_truth_count
    from public.veroxa_restaurant_truth_fields field
    where field.restaurant_id = p_restaurant_id
      and field.is_current
      and field.status = 'owner_confirmed'
      and field.owner_confirmed_by = v_owner_id
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'truth_field'
          and veroxa_private.truth_confirmation_applies_to_v1(
            confirmation.id, field.id
          )
          and confirmation.confirmation_kind = 'business_truth'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = field.owner_confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'truth_field'
              and veroxa_private.truth_confirmation_applies_to_v1(
                latest.id, field.id
              )
              and latest.confirmation_kind = 'business_truth'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_truth_count = 18 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_owner_truth_confirmations_required',
      'message','All 18 current truth fields require latest approved confirmation from the same Client.',
      'observedCount',v_truth_count,'requiredCount',18));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_onboarding_count
    from public.veroxa_onboarding_steps step
    join public.veroxa_confirmations confirmation
      on confirmation.id = step.owner_confirmation_id
    where step.restaurant_id = p_restaurant_id
      and step.status = 'verified'
      and step.completed_at is not null
      and jsonb_array_length(step.completion_evidence) > 0
      and confirmation.restaurant_id = p_restaurant_id
      and confirmation.subject_type = 'onboarding_step'
      and confirmation.subject_id = step.id
      and confirmation.confirmation_kind = 'onboarding'
      and confirmation.decision in ('confirm','correct')
      and confirmation.status = 'approved'
      and confirmation.submitted_by = v_owner_id
      and confirmation.submitted_at <= step.completed_at
      and confirmation.id = (
        select latest.id from public.veroxa_confirmations latest
        where latest.restaurant_id = p_restaurant_id
          and latest.subject_type = 'onboarding_step'
          and latest.subject_id = step.id
          and latest.confirmation_kind = 'onboarding'
        order by latest.submitted_at desc, latest.created_at desc,
          latest.id desc limit 1
      );
  end if;
  if v_onboarding_count = 11 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_owner_onboarding_confirmations_required',
      'message','All 11 onboarding steps require evidence and latest confirmation from the same Client.',
      'observedCount',v_onboarding_count,'requiredCount',11));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_media_count
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.asset_id = asset.id and rights.restaurant_id = asset.restaurant_id
    join public.veroxa_media_reviews review
      on review.asset_id = asset.id and review.restaurant_id = asset.restaurant_id
     and review.is_current
    where asset.restaurant_id = p_restaurant_id
      and asset.uploaded_by = v_owner_id
      and asset.status in ('ready_to_use','used')
      and rights.rights_status = 'confirmed'
      and rights.confirmed_by = v_owner_id
      and coalesce(rights.valid_from, rights.confirmed_at) <= clock_timestamp()
      and (rights.expires_at is null or rights.expires_at > clock_timestamp())
      and rights.usage_scope @>
        '["facebook","instagram","google_business","website"]'::jsonb
      and rights.attestation_version = 'momo-media-rights-v1'
      and rights.attestation_sha256 =
        '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f'
      and review.status = 'approved'
      and review.public_use_approved
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'media_rights'
          and confirmation.subject_id = rights.id
          and confirmation.confirmation_kind = 'usage_rights'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = rights.confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'media_rights'
              and latest.subject_id = rights.id
              and latest.confirmation_kind = 'usage_rights'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_media_count > 0 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','externally_usable_owner_media_required',
      'message','Same-owner media needs current attested rights, all four external scopes, and approved public-use review.'));
  end if;

  select count(*)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'dimensionKey', dimension.dimension_key,
      'status', dimension.status,
      'required', dimension.required
    ) order by dimension.dimension_key), '[]'::jsonb)
  into v_readiness_count, v_readiness_snapshot
  from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = p_restaurant_id
    and dimension.required;
  if v_readiness_count = 10 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_readiness_rows_required',
      'message','All 10 required readiness rows must exist; their honest blocked states remain visible.',
      'observedCount',v_readiness_count,'requiredCount',10));
  end if;

  if v_owner_id is not null then
    select request.id, work.id, work_approval.id, activity.id, report.id,
      report_approval.id, recovery.id
    into v_request_id, v_work_id, v_approval_id, v_activity_id,
      v_report_id, v_report_approval_id, v_recovery_id
    from public.veroxa_client_requests request
    join public.veroxa_work_items work
      on work.client_request_id = request.id
     and work.restaurant_id = request.restaurant_id
    join public.veroxa_approvals work_approval
      on work_approval.restaurant_id = work.restaurant_id
     and work_approval.subject_type = work.subject_type
     and work_approval.subject_id = work.subject_id
     and work_approval.status = 'approved'
     and work_approval.decided_at >= work.created_at
    join public.veroxa_activity_events activity
      on activity.restaurant_id = work.restaurant_id
     and activity.subject_type = 'work_item'
     and activity.subject_id = work.id
     and activity.visibility in ('client','both')
     and activity.report_eligible
     and activity.occurred_at >= work_approval.decided_at
    join public.veroxa_reports report
      on report.restaurant_id = activity.restaurant_id
     and activity.id = any(report.evidence_event_ids)
     and report.status = 'approved'
     and report.approved_at is not null
     and report.created_at >= activity.occurred_at
    join public.veroxa_approvals report_approval
      on report_approval.restaurant_id = report.restaurant_id
     and report_approval.subject_type = 'report'
     and report_approval.subject_id = report.id
     and report_approval.approval_kind = 'report_release'
     and report_approval.status = 'approved'
     and report_approval.decided_at = report.approved_at
    join public.veroxa_recovery_runs recovery
      on recovery.restaurant_id = work.restaurant_id
     and recovery.subject_type = 'work_item'
     and recovery.subject_id = work.id
     and recovery.status = 'completed'
     and recovery.completed_at >= report_approval.decided_at
    where request.restaurant_id = p_restaurant_id
      and request.created_by = v_owner_id
      and request.status = 'completed'
      and request.completed_at >= recovery.completed_at
      and work.status = 'completed'
      and work.subject_type is not null
      and work.subject_id is not null
      and work.created_at >= request.created_at
    order by request.completed_at desc, request.id desc
    limit 1;
  end if;
  if v_recovery_id is not null then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','single_request_to_recovery_chain_required',
      'message','One same-owner request must link to approved work, client-visible report evidence, released report, and completed recovery.'));
  end if;

  status := case when v_passed = 7
    then 'ready_for_visual_review' else 'blocked' end;
  can_review := v_passed = 7;
  owner_user_id := v_owner_id;
  required_check_count := 7;
  passed_check_count := v_passed;
  blocker_count := jsonb_array_length(v_blockers);
  evidence := jsonb_build_object(
    'ownerCount', v_owner_count,
    'primaryOwnerContactCount', v_contact_count,
    'ownerConfirmedTruthCount', v_truth_count,
    'ownerConfirmedOnboardingCount', v_onboarding_count,
    'externallyUsableMediaCount', v_media_count,
    'readinessRowCount', v_readiness_count,
    'readinessRows', v_readiness_snapshot,
    'chain', jsonb_build_object(
      'requestId', v_request_id, 'workItemId', v_work_id,
      'workApprovalId', v_approval_id, 'activityEventId', v_activity_id,
      'reportId', v_report_id, 'reportApprovalId', v_report_approval_id,
      'recoveryRunId', v_recovery_id
    ),
    'activationAuthorized', false,
    'externalPublishingAuthorized', false,
    'aiEnabled', false
  );
  blockers := v_blockers;
  return next;
end;
$$;

revoke all on function public.veroxa_momo_manual_pilot_gate_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_manual_pilot_gate_v1(uuid)
  to authenticated;

