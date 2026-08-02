-- Preserve immutable truth history across genuine owner handoff and repeat
-- attestation. A terminal confirmation points at the resulting current truth,
-- while submitted_subject_id permanently retains the exact row described by
-- its submitted snapshot and hash.

alter table public.veroxa_confirmations
  add column if not exists submitted_subject_id uuid;

comment on column public.veroxa_confirmations.submitted_subject_id is
  'Original subject row captured by the immutable submission snapshot. For a superseding truth confirmation, subject_id is atomically rebound to the approved resulting revision while this column retains the predecessor.';

create or replace function veroxa_private.prepare_confirmation_subject_lineage_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.submitted_subject_id := new.subject_id;
  return new;
end;
$$;
revoke all on function
  veroxa_private.prepare_confirmation_subject_lineage_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_confirmations_prepare_subject_lineage
  on public.veroxa_confirmations;
create trigger veroxa_confirmations_prepare_subject_lineage
before insert on public.veroxa_confirmations
for each row execute function
  veroxa_private.prepare_confirmation_subject_lineage_v1();

create or replace function veroxa_private.validate_confirmation_subject_lineage_v1()
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

  if new.subject_id is distinct from old.subject_id then
    if old.subject_type <> 'truth_field'
       or old.confirmation_kind <> 'business_truth'
       or old.decision not in ('confirm','correct')
       or old.status not in ('pending','in_review')
       or new.status <> 'approved'
       or new.submitted_subject_id is distinct from old.subject_id
       or not exists (
         select 1
         from public.veroxa_restaurant_truth_fields result
         where result.id = new.subject_id
           and result.restaurant_id = old.restaurant_id
           and result.supersedes_id = old.subject_id
           and result.is_current
           and result.status = 'owner_confirmed'
           and result.owner_confirmed_by = old.submitted_by
           and result.owner_confirmed_at = old.submitted_at
           and result.evidence_class = old.evidence_class
       ) then
      raise exception using errcode = '23514',
        message = 'confirmation_result_subject_rebind_is_invalid';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_confirmation_subject_lineage_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists veroxa_confirmations_subject_lineage_guard
  on public.veroxa_confirmations;
create trigger veroxa_confirmations_subject_lineage_guard
before update of subject_id, submitted_subject_id, status
on public.veroxa_confirmations
for each row execute function
  veroxa_private.validate_confirmation_subject_lineage_v1();

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
              review_notes = nullif(btrim(p_review_notes), ''),
              subject_id = new_truth_id,
              submitted_subject_id = coalesce(
                confirmation_record.submitted_subject_id,
                confirmation_record.subject_id
              )
          where id = confirmation_record.id;
          confirmation_record.subject_id := new_truth_id;
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

