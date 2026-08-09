-- Forward-only migration: owner_truth_and_ready_disposition_v1.
-- Never edit these bytes after the migration is applied.

-- ---------------------------------------------------------------------------
-- Owner-authoritative truth confirmation and application
-- ---------------------------------------------------------------------------

create or replace function public.veroxa_owner_truth_subject_snapshots_v1(
  p_restaurant_id uuid
)
returns table (
  truth_field_id uuid,
  subject_snapshot_sha256 text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
     or veroxa_private.momo_evidence_class_for_user_v1(
       p_restaurant_id, actor_id
     ) is distinct from 'real_owner' then
    raise exception using errcode = '42501',
      message = 'active_real_owner_client_required';
  end if;

  return query
  select field.id,
    veroxa_private.confirmation_snapshot_sha256_v1(
      veroxa_private.confirmation_subject_snapshot_v1(
        field.restaurant_id, 'truth_field', field.id
      )
    )
  from public.veroxa_restaurant_truth_fields field
  where field.restaurant_id = p_restaurant_id
    and field.is_current
    and field.status <> 'superseded'
  order by field.section, field.field_key, field.id;
end;
$$;

revoke all on function
  public.veroxa_owner_truth_subject_snapshots_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_owner_truth_subject_snapshots_v1(uuid)
  to authenticated;

create or replace function public.veroxa_owner_apply_truth_confirmation_v1(
  p_restaurant_id uuid,
  p_truth_field_id uuid,
  p_expected_subject_snapshot_sha256 text,
  p_decision text,
  p_proposed_value jsonb default null,
  p_notes text default null
)
returns table (
  confirmation_id uuid,
  submitted_truth_id uuid,
  applied_truth_id uuid,
  status public.veroxa_review_status_v1,
  applied_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  old_truth public.veroxa_restaurant_truth_fields%rowtype;
  confirmation_record public.veroxa_confirmations%rowtype;
  current_snapshot jsonb;
  current_snapshot_sha256 text;
  applied_value jsonb;
  new_truth_id uuid;
  applied_evidence_class text;
  application_time timestamptz;
begin
  if actor_id is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
     or veroxa_private.momo_evidence_class_for_user_v1(
       p_restaurant_id, actor_id
     ) is distinct from 'real_owner' then
    raise exception using errcode = '42501',
      message = 'active_real_owner_client_required';
  end if;

  if p_decision is null or p_decision not in ('confirm', 'correct') then
    raise exception using errcode = '22023',
      message = 'owner_direct_truth_decision_must_be_confirm_or_correct';
  end if;
  if p_expected_subject_snapshot_sha256 is null
     or p_expected_subject_snapshot_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'valid_expected_subject_snapshot_sha256_required';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000 then
    raise exception using errcode = '22001',
      message = 'confirmation_notes_too_long';
  end if;
  if p_decision = 'confirm' and p_proposed_value is not null then
    raise exception using errcode = '23514',
      message = 'confirmation_cannot_apply_unsubmitted_value';
  end if;
  if p_decision = 'correct' and p_proposed_value is null then
    raise exception using errcode = '23514',
      message = 'correction_requires_client_proposed_value';
  end if;

  select * into old_truth
  from public.veroxa_restaurant_truth_fields field
  where field.id = p_truth_field_id
    and field.restaurant_id = p_restaurant_id
    and field.is_current
    and field.status <> 'superseded'
  for update;
  if not found then
    raise exception using errcode = '23503',
      message = 'current_truth_subject_required';
  end if;

  current_snapshot := veroxa_private.confirmation_subject_snapshot_v1(
    p_restaurant_id, 'truth_field', old_truth.id
  );
  current_snapshot_sha256 :=
    veroxa_private.confirmation_snapshot_sha256_v1(current_snapshot);
  if current_snapshot is null
     or current_snapshot_sha256 is distinct from
       p_expected_subject_snapshot_sha256 then
    raise exception using errcode = '40001',
      message = 'truth_subject_changed_refresh_required';
  end if;

  -- The active real owner is authoritative for their own business facts.
  -- Preserve every legacy proposal as immutable evidence, but atomically
  -- close every still-open proposal for this exact submitted snapshot so none
  -- can block or later overwrite the owner's current confirm/correct action.
  update public.veroxa_confirmations pending
  set status = 'rejected',
      reviewed_by = actor_id,
      reviewed_at = clock_timestamp(),
      review_notes =
        'Superseded by the active real owner atomic truth application.'
  where pending.restaurant_id = p_restaurant_id
    and pending.subject_type = 'truth_field'
    and coalesce(pending.submitted_subject_id, pending.subject_id) = old_truth.id
    and pending.status in ('pending', 'in_review');

  applied_value := case
    when p_decision = 'correct' then p_proposed_value
    else old_truth.value_json
  end;
  if not veroxa_private.truth_value_shape_valid_v1(
    old_truth.field_key, applied_value
  ) then
    raise exception using errcode = '22023',
      message = 'truth_confirmation_requires_canonical_field_shape';
  end if;

  insert into public.veroxa_confirmations (
    restaurant_id,
    subject_type,
    subject_id,
    submitted_subject_id,
    confirmation_kind,
    decision,
    proposed_value,
    notes,
    submitted_by
  ) values (
    p_restaurant_id,
    'truth_field',
    old_truth.id,
    old_truth.id,
    'business_truth',
    p_decision,
    case when p_decision = 'correct' then applied_value else null end,
    nullif(btrim(p_notes), ''),
    actor_id
  )
  returning * into confirmation_record;

  if confirmation_record.evidence_class is distinct from 'real_owner'
     or confirmation_record.subject_snapshot_sha256 is distinct from
       p_expected_subject_snapshot_sha256 then
    raise exception using errcode = '40001',
      message = 'truth_owner_authority_or_snapshot_changed';
  end if;

  application_time := confirmation_record.submitted_at;

  update public.veroxa_restaurant_truth_fields
  set is_current = false,
      status = 'superseded'
  where id = old_truth.id;

  insert into public.veroxa_restaurant_truth_fields (
    restaurant_id,
    field_key,
    section,
    value_json,
    status,
    source,
    is_current,
    owner_confirmed_by,
    owner_confirmed_at,
    supersedes_id,
    created_by
  ) values (
    old_truth.restaurant_id,
    old_truth.field_key,
    old_truth.section,
    applied_value,
    'owner_confirmed',
    'owner',
    true,
    actor_id,
    application_time,
    old_truth.id,
    actor_id
  )
  returning id, evidence_class
    into new_truth_id, applied_evidence_class;

  if applied_evidence_class is distinct from 'real_owner' then
    raise exception using errcode = '40001',
      message = 'truth_owner_authority_changed';
  end if;

  update public.veroxa_confirmations confirmation
  set status = 'approved',
      reviewed_by = actor_id,
      reviewed_at = application_time,
      review_notes = 'Applied atomically by the active real-owner Client.'
  where confirmation.id = confirmation_record.id;

  insert into veroxa_private.momo_truth_confirmation_applications (
    confirmation_id,
    restaurant_id,
    submitted_truth_id,
    applied_truth_id,
    applied_by
  ) values (
    confirmation_record.id,
    p_restaurant_id,
    old_truth.id,
    new_truth_id,
    actor_id
  );

  return query
  select confirmation_record.id,
    old_truth.id,
    new_truth_id,
    'approved'::public.veroxa_review_status_v1,
    application_time;
end;
$$;

revoke all on function
  public.veroxa_owner_apply_truth_confirmation_v1(
    uuid, uuid, text, text, jsonb, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_owner_apply_truth_confirmation_v1(
    uuid, uuid, text, text, jsonb, text
  ) to authenticated;

-- Serialize every legacy truth proposal with the same current truth row that
-- the atomic owner path locks. A proposal that began first is visible and
-- superseded by the owner transaction; one that begins later waits, observes
-- the superseded subject, and fails closed instead of surviving the action.
alter function public.veroxa_submit_momo_confirmation_v1(
  uuid, text, uuid, text, text, jsonb, text
) rename to veroxa_submit_momo_confirmation_pre_owner_atomic_v1;
revoke all on function
  public.veroxa_submit_momo_confirmation_pre_owner_atomic_v1(
    uuid, text, uuid, text, text, jsonb, text
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_submit_momo_confirmation_v1(
  p_restaurant_id uuid,
  p_subject_type text,
  p_subject_id uuid,
  p_confirmation_kind text,
  p_decision text,
  p_proposed_value jsonb default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_momo_client_required';
  end if;
  if p_subject_type = 'truth_field' then
    perform field.id
    from public.veroxa_restaurant_truth_fields field
    where field.id = p_subject_id
      and field.restaurant_id = p_restaurant_id
      and field.is_current
      and field.status <> 'superseded'
    for share;
    if not found then
      raise exception using errcode = '40001',
        message = 'truth_subject_changed_refresh_required';
    end if;
  end if;
  return public.veroxa_submit_momo_confirmation_pre_owner_atomic_v1(
    p_restaurant_id,
    p_subject_type,
    p_subject_id,
    p_confirmation_kind,
    p_decision,
    p_proposed_value,
    p_notes
  );
end;
$$;
revoke all on function public.veroxa_submit_momo_confirmation_v1(
  uuid, text, uuid, text, text, jsonb, text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_submit_momo_confirmation_v1(
  uuid, text, uuid, text, text, jsonb, text
) to authenticated;

-- Preserve the old Team implementation for non-truth confirmation subjects,
-- but remove Team's ability to approve/apply Client confirm/correct truth.
alter function public.veroxa_apply_confirmation_v1(
  uuid, public.veroxa_review_status_v1, jsonb, text
) rename to veroxa_apply_confirmation_team_scoped_v1;

revoke all on function public.veroxa_apply_confirmation_team_scoped_v1(
  uuid, public.veroxa_review_status_v1, jsonb, text
) from public, anon, authenticated, service_role;

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
  actor_id uuid := (select auth.uid());
begin
  select * into confirmation_record
  from public.veroxa_confirmations confirmation
  where confirmation.id = p_confirmation_id;

  if actor_id is null
     or confirmation_record.id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       confirmation_record.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_team_confirmation_required';
  end if;

  if confirmation_record.subject_type = 'truth_field'
     and confirmation_record.decision in ('confirm', 'correct')
     and p_decision = 'approved' then
    raise exception using errcode = '42501',
      message = 'truth_confirm_or_correct_must_be_applied_by_real_owner_client';
  end if;

  return query
  select result.confirmation_id,
    result.status,
    result.subject_type,
    result.subject_id,
    result.reviewed_at
  from public.veroxa_apply_confirmation_team_scoped_v1(
    p_confirmation_id,
    p_decision,
    p_applied_value,
    p_review_notes
  ) result;
end;
$$;

revoke all on function public.veroxa_apply_confirmation_v1(
  uuid, public.veroxa_review_status_v1, jsonb, text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_apply_confirmation_v1(
  uuid, public.veroxa_review_status_v1, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Append-only Team Ready disposition evidence
-- ---------------------------------------------------------------------------

create table public.veroxa_momo_ready_disposition_events_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null
    references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  output_sha256 text not null
    check (output_sha256 ~ '^[0-9a-f]{64}$'),
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  disposition text not null
    check (disposition in ('approved_for_posting', 'discarded')),
  note text not null
    check (char_length(btrim(note)) between 3 and 1000),
  attestation jsonb not null check (
    (
      disposition = 'approved_for_posting'
      and attestation = '{
        "teamReviewed": true,
        "noExternalWriteAuthorized": true,
        "decisionIsFinalForThisOutput": true
      }'::jsonb
    ) or (
      disposition = 'discarded'
      and attestation = '{
        "teamReviewed": true,
        "noExternalWriteAuthorized": true,
        "decisionIsFinalForThisMedia": true
      }'::jsonb
    )
  ),
  recorded_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  recorded_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (ready_package_id, disposition)
);

create index veroxa_momo_ready_disposition_restaurant_time_v1
  on public.veroxa_momo_ready_disposition_events_v1
    (restaurant_id, recorded_at desc, id desc);
create unique index veroxa_momo_source_media_discard_terminal_v1
  on public.veroxa_momo_ready_disposition_events_v1
    (restaurant_id, source_content_sha256)
  where disposition = 'discarded';

alter table public.veroxa_momo_ready_disposition_events_v1
  enable row level security;
alter table public.veroxa_momo_ready_disposition_events_v1
  force row level security;
revoke all on table public.veroxa_momo_ready_disposition_events_v1
  from public, anon, authenticated, service_role;

-- The same per-tenant, per-byte lock key is used by canonical identity
-- creation. It serializes discard with duplicate intake, content reservation,
-- provider dispatch, and Ready materialization without deleting source bytes.
create or replace function veroxa_private.lock_momo_source_media_v1(
  p_restaurant_id uuid,
  p_source_content_sha256 text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_restaurant_id is null
     or p_source_content_sha256 is null
     or p_source_content_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'valid_source_media_lock_key_required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_source_content_sha256, 0
  ));
end;
$$;
revoke all on function veroxa_private.lock_momo_source_media_v1(uuid, text)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_source_media_discarded_v1(
  p_restaurant_id uuid,
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
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.restaurant_id = p_restaurant_id
      and event.source_content_sha256 = p_source_content_sha256
      and event.disposition = 'discarded'
      and not event.external_write_allowed
  );
$$;
revoke all on function
  veroxa_private.momo_source_media_discarded_v1(uuid, text)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.protect_momo_ready_disposition_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_ready_disposition_event_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.protect_momo_ready_disposition_event_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_momo_ready_disposition_event_immutable_v1
before update or delete
on public.veroxa_momo_ready_disposition_events_v1
for each row execute function
  veroxa_private.protect_momo_ready_disposition_event_v1();

create or replace function
  veroxa_private.validate_momo_ready_disposition_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recorded_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_is_team_for_restaurant(
       new.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_disposition_required';
  end if;

  if not exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 ready
    where ready.id = new.ready_package_id
      and ready.restaurant_id = new.restaurant_id
      and ready.status = 'veroxa_ready'
      and not ready.external_write_allowed
      and ready.output_sha256 = new.output_sha256
      and ready.source_content_sha256 = new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'ready_disposition_package_or_hash_mismatch';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    new.restaurant_id, new.source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    new.restaurant_id, new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  new.recorded_at := clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_ready_disposition_event_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_momo_ready_disposition_event_validate_v1
before insert
on public.veroxa_momo_ready_disposition_events_v1
for each row execute function
  veroxa_private.validate_momo_ready_disposition_event_v1();

create or replace function public.veroxa_record_momo_ready_disposition_v1(
  p_restaurant_id uuid,
  p_ready_package_id uuid,
  p_expected_output_sha256 text,
  p_expected_source_content_sha256 text,
  p_disposition text,
  p_note text,
  p_attestation jsonb
)
returns table (
  event_id uuid,
  ready_package_id uuid,
  disposition text,
  active_for_manual_use boolean,
  external_write_allowed boolean,
  recorded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  existing public.veroxa_momo_ready_disposition_events_v1%rowtype;
  inserted public.veroxa_momo_ready_disposition_events_v1%rowtype;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_disposition_required';
  end if;
  if p_disposition is null
     or p_disposition not in ('approved_for_posting', 'discarded') then
    raise exception using errcode = '22023',
      message = 'invalid_ready_disposition';
  end if;
  if p_expected_output_sha256 is null
     or p_expected_output_sha256 !~ '^[0-9a-f]{64}$'
     or p_expected_source_content_sha256 is null
     or p_expected_source_content_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'valid_ready_hash_guards_required';
  end if;
  if p_note is null
     or char_length(btrim(p_note)) not between 3 and 1000 then
    raise exception using errcode = '22023',
      message = 'ready_disposition_note_required';
  end if;
  if (
    p_disposition = 'approved_for_posting'
    and p_attestation is distinct from '{
      "teamReviewed": true,
      "noExternalWriteAuthorized": true,
      "decisionIsFinalForThisOutput": true
    }'::jsonb
  ) or (
    p_disposition = 'discarded'
    and p_attestation is distinct from '{
      "teamReviewed": true,
      "noExternalWriteAuthorized": true,
      "decisionIsFinalForThisMedia": true
    }'::jsonb
  ) then
    raise exception using errcode = '22023',
      message = 'exact_ready_disposition_attestation_required';
  end if;

  select * into ready
  from public.veroxa_momo_ready_packages_v2 candidate
  where candidate.id = p_ready_package_id
    and candidate.restaurant_id = p_restaurant_id
  for update;
  if not found
     or ready.status <> 'veroxa_ready'
     or ready.external_write_allowed
     or ready.output_sha256 is distinct from p_expected_output_sha256
     or ready.source_content_sha256 is distinct from
       p_expected_source_content_sha256 then
    raise exception using errcode = '40001',
      message = 'ready_package_changed_refresh_required';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    ready.restaurant_id, ready.source_content_sha256
  );

  -- Discard is a terminal media tombstone, not merely a decision about one
  -- generated package. Exact replays from any Ready package carrying the same
  -- tenant-bound bytes return the original immutable event.
  select * into existing
  from public.veroxa_momo_ready_disposition_events_v1 event
  where event.restaurant_id = ready.restaurant_id
    and event.source_content_sha256 = ready.source_content_sha256
    and event.disposition = 'discarded';
  if found then
    if p_disposition <> 'discarded' then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    if existing.note is distinct from btrim(p_note)
       or existing.attestation is distinct from p_attestation then
      raise exception using errcode = '23505',
        message = 'source_media_discard_idempotency_conflict';
    end if;
    return query
    select existing.id,
      ready.id,
      existing.disposition,
      false,
      false,
      existing.recorded_at;
    return;
  end if;

  perform event.id
  from public.veroxa_momo_ready_disposition_events_v1 event
  where event.ready_package_id = ready.id
  order by event.recorded_at, event.id
  for update;

  select * into existing
  from public.veroxa_momo_ready_disposition_events_v1 event
  where event.ready_package_id = ready.id
    and event.disposition = p_disposition;
  if found then
    if existing.restaurant_id is distinct from p_restaurant_id
       or existing.output_sha256 is distinct from p_expected_output_sha256
       or existing.source_content_sha256 is distinct from
         p_expected_source_content_sha256
       or existing.note is distinct from btrim(p_note)
       or existing.attestation is distinct from p_attestation then
      raise exception using errcode = '23505',
        message = 'ready_disposition_idempotency_conflict';
    end if;
    return query
    select existing.id,
      existing.ready_package_id,
      existing.disposition,
      existing.disposition = 'approved_for_posting'
        and not exists (
          select 1
          from public.veroxa_momo_ready_packages_v2 newer
          where newer.restaurant_id = ready.restaurant_id
            and newer.identity_id = ready.identity_id
            and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
        )
        and exists (
          select 1
          from public.veroxa_momo_content_ai_runs run
          where run.id = ready.content_ai_run_id
            and run.restaurant_id = ready.restaurant_id
            and veroxa_private.momo_content_ai_current_evidence_v1(
              run.id, run.requested_by
            )
        ),
      false,
      existing.recorded_at;
    return;
  end if;

  if p_disposition = 'approved_for_posting' and (
    exists (
      select 1
      from public.veroxa_momo_ready_packages_v2 newer
      where newer.restaurant_id = ready.restaurant_id
        and newer.identity_id = ready.identity_id
        and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
    )
    or not exists (
      select 1
      from public.veroxa_momo_content_ai_runs run
      where run.id = ready.content_ai_run_id
        and run.restaurant_id = ready.restaurant_id
        and veroxa_private.momo_content_ai_current_evidence_v1(
          run.id, run.requested_by
        )
    )
  ) then
    raise exception using errcode = '40001',
      message = 'ready_package_current_evidence_refresh_required';
  end if;

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
    p_restaurant_id,
    ready.id,
    ready.output_sha256,
    ready.source_content_sha256,
    p_disposition,
    btrim(p_note),
    p_attestation,
    actor_id
  ) returning * into inserted;

  return query
  select inserted.id,
    inserted.ready_package_id,
    inserted.disposition,
    inserted.disposition = 'approved_for_posting'
      and not exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      )
      and exists (
        select 1
        from public.veroxa_momo_content_ai_runs run
        where run.id = ready.content_ai_run_id
          and run.restaurant_id = ready.restaurant_id
          and veroxa_private.momo_content_ai_current_evidence_v1(
            run.id, run.requested_by
          )
      ),
    false,
    inserted.recorded_at;
end;
$$;

revoke all on function public.veroxa_record_momo_ready_disposition_v1(
  uuid, uuid, text, text, text, text, jsonb
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_record_momo_ready_disposition_v1(
  uuid, uuid, text, text, text, text, jsonb
) to authenticated;

create or replace function public.veroxa_momo_team_ready_active_v1(
  p_restaurant_id uuid
)
returns table (
  ready_package_id uuid,
  source_asset_id uuid,
  source_content_sha256 text,
  output_sha256 text,
  ready_at timestamptz,
  disposition text,
  disposition_event_id uuid,
  disposition_recorded_at timestamptz,
  active_for_manual_use boolean,
  eligible_for_approval boolean,
  manual_use_blockers text[],
  external_write_allowed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(
    p_restaurant_id
  ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_readback_required';
  end if;

  return query
  select ready.id,
    ready.source_asset_id,
    ready.source_content_sha256,
    ready.output_sha256,
    ready.ready_at,
    latest.disposition,
    latest.id,
    latest.recorded_at,
    coalesce(latest.disposition = 'approved_for_posting', false)
      and not exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      )
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ),
    latest.disposition is null
      and not exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      )
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ),
    pg_catalog.array_remove(array[
      case when exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      ) then 'superseded_by_newer_ready'::text end,
      case when not veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ) and latest.disposition is distinct from 'discarded'
        then 'current_evidence_changed'::text end
    ], null),
    false
  from public.veroxa_momo_ready_packages_v2 ready
  join public.veroxa_momo_content_ai_runs run
    on run.id = ready.content_ai_run_id
   and run.restaurant_id = ready.restaurant_id
  left join lateral (
    select event.id, event.disposition, event.recorded_at
    from public.veroxa_momo_ready_disposition_events_v1 event
    where (
      event.ready_package_id = ready.id
      and event.disposition = 'approved_for_posting'
    ) or (
      event.restaurant_id = ready.restaurant_id
      and event.source_content_sha256 = ready.source_content_sha256
      and event.disposition = 'discarded'
    )
    order by (event.disposition = 'discarded') desc,
      event.recorded_at desc, event.id desc
    limit 1
  ) latest on true
  where ready.restaurant_id = p_restaurant_id
    and ready.status = 'veroxa_ready'
    and not ready.external_write_allowed
    and latest.disposition is distinct from 'discarded'
  order by ready.ready_at desc, ready.id desc;
end;
$$;

revoke all on function
  public.veroxa_momo_team_ready_active_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_team_ready_active_v1(uuid)
  to authenticated;

create or replace function public.veroxa_momo_team_ready_evidence_v1(
  p_restaurant_id uuid
)
returns table (
  ready_package_id uuid,
  source_asset_id uuid,
  source_content_sha256 text,
  output_sha256 text,
  ready_at timestamptz,
  current_disposition text,
  active_for_manual_use boolean,
  eligible_for_approval boolean,
  manual_use_blockers text[],
  external_write_allowed boolean,
  disposition_history jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(
    p_restaurant_id
  ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_evidence_required';
  end if;

  return query
  select ready.id,
    ready.source_asset_id,
    ready.source_content_sha256,
    ready.output_sha256,
    ready.ready_at,
    latest.disposition,
    coalesce(latest.disposition = 'approved_for_posting', false)
      and not exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      )
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ),
    latest.disposition is null
      and not exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      )
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ),
    pg_catalog.array_remove(array[
      case when latest.disposition = 'discarded'
        then 'source_media_discarded_terminal'::text end,
      case when exists (
        select 1
        from public.veroxa_momo_ready_packages_v2 newer
        where newer.restaurant_id = ready.restaurant_id
          and newer.identity_id = ready.identity_id
          and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
      ) then 'superseded_by_newer_ready'::text end,
      case when not veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, run.requested_by
      ) and latest.disposition is distinct from 'discarded'
        then 'current_evidence_changed'::text end
    ], null),
    false,
    coalesce(event_rows.payload, '[]'::jsonb)
  from public.veroxa_momo_ready_packages_v2 ready
  join public.veroxa_momo_content_ai_runs run
    on run.id = ready.content_ai_run_id
   and run.restaurant_id = ready.restaurant_id
  left join lateral (
    select event.disposition
    from public.veroxa_momo_ready_disposition_events_v1 event
    where (
      event.ready_package_id = ready.id
      and event.disposition = 'approved_for_posting'
    ) or (
      event.restaurant_id = ready.restaurant_id
      and event.source_content_sha256 = ready.source_content_sha256
      and event.disposition = 'discarded'
    )
    order by (event.disposition = 'discarded') desc,
      event.recorded_at desc, event.id desc
    limit 1
  ) latest on true
  left join lateral (
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'eventId', event.id,
        'readyPackageId', event.ready_package_id,
        'sourceContentSha256', event.source_content_sha256,
        'disposition', event.disposition,
        'note', event.note,
        'attestation', event.attestation,
        'recordedBy', event.recorded_by,
        'recordedAt', event.recorded_at,
        'externalWriteAllowed', false
      ) order by event.recorded_at, event.id
    ) as payload
    from public.veroxa_momo_ready_disposition_events_v1 event
    where (
      event.ready_package_id = ready.id
      and event.disposition = 'approved_for_posting'
    ) or (
      event.restaurant_id = ready.restaurant_id
      and event.source_content_sha256 = ready.source_content_sha256
      and event.disposition = 'discarded'
    )
  ) event_rows on true
  where ready.restaurant_id = p_restaurant_id
    and ready.status = 'veroxa_ready'
    and not ready.external_write_allowed
  order by ready.ready_at desc, ready.id desc;
end;
$$;

revoke all on function
  public.veroxa_momo_team_ready_evidence_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_team_ready_evidence_v1(uuid)
  to authenticated;

create or replace function public.veroxa_momo_team_ready_freshness_v1(
  p_restaurant_id uuid,
  p_ready_package_id uuid,
  p_expected_output_sha256 text,
  p_expected_source_content_sha256 text
)
returns table (
  ready_package_id uuid,
  disposition text,
  eligible_for_approval boolean,
  active_for_manual_use boolean,
  manual_use_blockers text[],
  external_write_allowed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  current_disposition text;
  has_newer boolean;
  evidence_current boolean;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(
    p_restaurant_id
  ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_freshness_required';
  end if;
  if p_expected_output_sha256 is null
     or p_expected_output_sha256 !~ '^[0-9a-f]{64}$'
     or p_expected_source_content_sha256 is null
     or p_expected_source_content_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'valid_ready_hash_guards_required';
  end if;

  select * into ready
  from public.veroxa_momo_ready_packages_v2 candidate
  where candidate.id = p_ready_package_id
    and candidate.restaurant_id = p_restaurant_id;
  if not found
     or ready.output_sha256 is distinct from p_expected_output_sha256
     or ready.source_content_sha256 is distinct from
       p_expected_source_content_sha256
     or ready.status <> 'veroxa_ready'
     or ready.external_write_allowed then
    raise exception using errcode = '40001',
      message = 'ready_package_changed_refresh_required';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs candidate
  where candidate.id = ready.content_ai_run_id
    and candidate.restaurant_id = ready.restaurant_id;
  if not found then
    raise exception using errcode = '40001',
      message = 'ready_package_lineage_refresh_required';
  end if;
  select event.disposition into current_disposition
  from public.veroxa_momo_ready_disposition_events_v1 event
  where (
    event.ready_package_id = ready.id
    and event.disposition = 'approved_for_posting'
  ) or (
    event.restaurant_id = ready.restaurant_id
    and event.source_content_sha256 = ready.source_content_sha256
    and event.disposition = 'discarded'
  )
  order by (event.disposition = 'discarded') desc,
    event.recorded_at desc, event.id desc
  limit 1;
  has_newer := exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 newer
    where newer.restaurant_id = ready.restaurant_id
      and newer.identity_id = ready.identity_id
      and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
  );
  evidence_current :=
    veroxa_private.momo_content_ai_current_evidence_v1(
      run.id, run.requested_by
    );

  return query
  select ready.id,
    current_disposition,
    current_disposition is null
      and not has_newer
      and evidence_current,
    current_disposition = 'approved_for_posting'
      and not has_newer
      and evidence_current,
    pg_catalog.array_remove(array[
      case when current_disposition = 'discarded'
        then 'source_media_discarded_terminal'::text end,
      case when has_newer
        then 'superseded_by_newer_ready'::text end,
      case when not evidence_current
          and current_disposition is distinct from 'discarded'
        then 'current_evidence_changed'::text end
    ], null),
    false;
end;
$$;
revoke all on function
  public.veroxa_momo_team_ready_freshness_v1(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_team_ready_freshness_v1(uuid, uuid, text, text)
  to authenticated;
