-- Team Ready decisions and arbitrary-food content contract v2.
-- This migration is additive: v4 rows remain valid/readable while every new
-- reservation is pinned to the distinct v5 prompt/validator pair.

create or replace function
  veroxa_private.momo_content_contract_version_pair_valid_v2(
    p_prompt_version text,
    p_validator_version text
  )
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select (p_prompt_version, p_validator_version) in (
    (
      'momo-content-package-2026-08-01-v4',
      'momo-content-validator-2026-08-01-v4'
    ),
    (
      'momo-content-package-2026-08-08-v5',
      'momo-content-validator-2026-08-08-v5'
    )
  );
$function$;


create or replace function
  veroxa_private.momo_content_food_tags_valid_v2(
    p_payload jsonb,
    p_truth_snapshot jsonb
  )
returns boolean
language plpgsql
immutable
set search_path = ''
as $function$
declare
  tag jsonb;
  summary text;
  expected_visual_text text;
  expected_label text;
begin
  if pg_catalog.jsonb_typeof(p_payload) is distinct from 'object'
     or p_payload #>> '{assetAssessment,subject}' is distinct from 'food'
     or pg_catalog.jsonb_typeof(
       p_payload #> '{assetAssessment,visualSummary}'
     ) is distinct from 'string'
     or p_payload #>> '{assetAssessment,visualSummary}'
       is distinct from p_payload ->> 'altText'
     or pg_catalog.jsonb_typeof(
       p_payload -> 'internalMediaTags'
     ) is distinct from 'array'
     or pg_catalog.jsonb_typeof(p_truth_snapshot) is distinct from 'array'
     or pg_catalog.jsonb_array_length(
       p_payload -> 'internalMediaTags'
     ) not between 3 and 10
     or not (p_payload -> 'internalMediaTags') @>
       '[{"slug":"food","label":"Food"}]'::jsonb
     or (
       select pg_catalog.count(*) <> pg_catalog.count(
         distinct pg_catalog.lower(value ->> 'slug')
       )
       from pg_catalog.jsonb_array_elements(
         p_payload -> 'internalMediaTags'
       ) entry(value)
     ) then
    return false;
  end if;

  select 'Food presentation: ' || pg_catalog.string_agg(
    tag.value ->> 'label', '; ' order by tag.position
  ) || '.' into expected_visual_text
  from pg_catalog.jsonb_array_elements(
    p_payload -> 'internalMediaTags'
  ) with ordinality tag(value, position);

  if p_payload #>> '{assetAssessment,visualSummary}'
       is distinct from expected_visual_text
     or p_payload ->> 'altText' is distinct from expected_visual_text
     or (
       select pg_catalog.count(*)
       from pg_catalog.jsonb_array_elements(
         p_payload -> 'claims'
       ) claim(value)
       where claim.value ->> 'source' = 'visible_media'
     ) <> 1
     or not exists (
       select 1
       from pg_catalog.jsonb_array_elements(
         p_payload -> 'claims'
       ) claim(value)
       where claim.value ->> 'source' = 'visible_media'
         and claim.value ->> 'exactText' = expected_visual_text
         and claim.value ->> 'category' = 'visual'
         and claim.value -> 'truthFieldIds' = '[]'::jsonb
         and claim.value -> 'appearsIn' = '["alt_text"]'::jsonb
     )
     or exists (
       select 1
       from pg_catalog.jsonb_array_elements(
         p_payload -> 'claims'
       ) claim(value)
       where claim.value ->> 'source' = 'owner_truth'
         and (claim.value -> 'appearsIn') ? 'alt_text'
     ) then
    return false;
  end if;

  summary := pg_catalog.lower(expected_visual_text);

  for tag in
    select value
    from pg_catalog.jsonb_array_elements(
      p_payload -> 'internalMediaTags'
    )
  loop
    if pg_catalog.jsonb_typeof(tag) is distinct from 'object'
       or (select pg_catalog.count(*)
           from pg_catalog.jsonb_object_keys(tag)) <> 3
       or pg_catalog.jsonb_typeof(tag -> 'slug') is distinct from 'string'
       or pg_catalog.jsonb_typeof(tag -> 'label') is distinct from 'string'
       or pg_catalog.jsonb_typeof(tag -> 'confidence')
            is distinct from 'number'
       or (tag ->> 'confidence')::numeric not between 0.70 and 1 then
      return false;
    end if;

    expected_label := case tag ->> 'slug'
      when 'food' then 'Food'
      when 'plated-food' then 'Plated food'
      when 'serving' then 'Serving'
      when 'plate' then 'Plate'
      when 'bowl' then 'Bowl'
      when 'tray' then 'Tray'
      when 'table-setting' then 'Table setting'
      when 'restaurant-setting' then 'Restaurant setting'
      when 'close-up' then 'Close-up'
      when 'overhead-view' then 'Overhead view'
      when 'handheld-food' then 'Handheld food'
      when 'shared-serving' then 'Shared serving'
      when 'packaged-food' then 'Packaged food'
      when 'multiple-items' then 'Multiple items'
      when 'people-present' then 'People present'
      else null
    end;
    if expected_label is null
       or tag ->> 'label' is distinct from expected_label then
      return false;
    end if;

    if (case tag ->> 'slug'
      when 'food' then false
      when 'plated-food' then summary !~* '\m(plate|plated)\M'
      when 'serving' then summary !~* '\m(serving|served)\M'
      when 'plate' then summary !~* '\m(plate|plated)\M'
      when 'bowl' then summary !~* '\mbowl\M'
      when 'tray' then summary !~* '\mtray\M'
      when 'table-setting' then summary !~* '\mtable\M'
      when 'restaurant-setting' then summary !~* '\mrestaurant\M'
      when 'close-up' then
        summary !~* '(\mclose[- ]?up\M|\mcloseup\M)'
      when 'overhead-view' then
        summary !~* '(\moverhead\M|\mtop[- ]down\M|\mfrom above\M)'
      when 'handheld-food' then
        summary !~* '\m(hand|hands|held|handheld)\M'
      when 'shared-serving' then
        summary !~* '(\mshared serving\M|\mserving platter\M|\mplatter\M)'
      when 'packaged-food' then
        summary !~* '\m(package|packaged|wrapper|container)\M'
      when 'multiple-items' then
        summary !~* '\m(multiple|several|two|three|four|items)\M'
      when 'people-present' then
        summary !~* '\m(person|people)\M'
      else true
    end) then
      return false;
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$function$;

create or replace function
  veroxa_private.momo_current_content_contract_valid_v2(
    p_payload jsonb,
    p_platforms jsonb,
    p_truth_snapshot jsonb,
    p_prompt_version text,
    p_validator_version text
  )
returns boolean
language plpgsql
immutable
set search_path = ''
as $function$
declare
  legacy_hardening_payload jsonb;
  legacy_visual_claim constant text :=
    'Food centered on a plate with a table.';
begin
  if (
    p_prompt_version,
    p_validator_version
  ) = (
    'momo-content-package-2026-08-01-v4',
    'momo-content-validator-2026-08-01-v4'
  ) then
    return coalesce(
      veroxa_private.momo_current_content_contract_valid_v1(
        p_payload, p_platforms, p_truth_snapshot
      ),
      false
    );
  end if;

  if (
    p_prompt_version,
    p_validator_version
  ) <> (
    'momo-content-package-2026-08-08-v5',
    'momo-content-validator-2026-08-08-v5'
  ) or not coalesce(
    veroxa_private.momo_content_food_tags_valid_v2(
      p_payload, p_truth_snapshot
    ),
    false
  ) then
    return false;
  end if;

  -- Reuse every legacy v4 copy/claim hardening rule with an objective visual
  -- surrogate.  The v5 helper above separately proves the original visible
  -- claim and both rendered visual fields are the exact tag-derived sentence.
  select pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      p_payload,
      '{altText}',
      pg_catalog.to_jsonb(legacy_visual_claim)
    ),
    '{claims}',
    pg_catalog.jsonb_agg(
      case
        when claim.value ->> 'source' = 'visible_media'
          then pg_catalog.jsonb_set(
            claim.value,
            '{exactText}',
            pg_catalog.to_jsonb(legacy_visual_claim)
          )
        else claim.value
      end
      order by claim.position
    )
  ) into legacy_hardening_payload
  from pg_catalog.jsonb_array_elements(
    p_payload -> 'claims'
  ) with ordinality claim(value, position);

  return coalesce(
    veroxa_private.momo_current_content_contract_valid_v1(
      legacy_hardening_payload, p_platforms, p_truth_snapshot
    ),
    false
  );
exception
  when others then
    return false;
end;
$function$;

revoke all on function
  veroxa_private.momo_content_contract_version_pair_valid_v2(text,text),
  veroxa_private.momo_content_food_tags_valid_v2(jsonb,jsonb),
  veroxa_private.momo_current_content_contract_valid_v2(
    jsonb,jsonb,jsonb,text,text
  )
  from public, anon, authenticated, service_role;

alter table public.veroxa_momo_content_ai_runs
  drop constraint veroxa_momo_content_ai_runs_prompt_version_check,
  drop constraint veroxa_momo_content_ai_runs_validator_version_check,
  add constraint veroxa_momo_content_ai_runs_prompt_version_check check (
    prompt_version in (
      'momo-content-package-2026-08-01-v4',
      'momo-content-package-2026-08-08-v5'
    )
  ) not valid,
  add constraint veroxa_momo_content_ai_runs_validator_version_check check (
    validator_version in (
      'momo-content-validator-2026-08-01-v4',
      'momo-content-validator-2026-08-08-v5'
    )
  ) not valid,
  add constraint veroxa_momo_content_ai_runs_contract_pair_v2_check check (
    veroxa_private.momo_content_contract_version_pair_valid_v2(
      prompt_version, validator_version
    )
  ) not valid;

alter table public.veroxa_momo_content_ai_runs
  validate constraint veroxa_momo_content_ai_runs_prompt_version_check,
  validate constraint veroxa_momo_content_ai_runs_validator_version_check,
  validate constraint veroxa_momo_content_ai_runs_contract_pair_v2_check;

alter table veroxa_private.momo_content_ai_result_outbox
  drop constraint momo_content_ai_result_outbox_prompt_version_check,
  drop constraint momo_content_ai_result_outbox_validator_version_check,
  add constraint momo_content_ai_result_outbox_prompt_version_check check (
    prompt_version in (
      'momo-content-package-2026-08-01-v4',
      'momo-content-package-2026-08-08-v5'
    )
  ) not valid,
  add constraint momo_content_ai_result_outbox_validator_version_check check (
    validator_version in (
      'momo-content-validator-2026-08-01-v4',
      'momo-content-validator-2026-08-08-v5'
    )
  ) not valid,
  add constraint momo_content_ai_result_outbox_contract_pair_v2_check check (
    veroxa_private.momo_content_contract_version_pair_valid_v2(
      prompt_version, validator_version
    )
  ) not valid;

alter table veroxa_private.momo_content_ai_result_outbox
  validate constraint momo_content_ai_result_outbox_prompt_version_check,
  validate constraint momo_content_ai_result_outbox_validator_version_check,
  validate constraint momo_content_ai_result_outbox_contract_pair_v2_check;

-- Active lifecycle definitions follow. They admit exact matched v4/v5 pairs at
-- recovery boundaries, create only v5 reservations, and validate by run pair.

CREATE OR REPLACE FUNCTION veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = new.run_id
  for key share;
  if not found
     or new.request_hash is distinct from run.request_hash
     or new.restaurant_id is distinct from run.restaurant_id
     or new.provider_response_id is distinct from run.provider_response_id
     or not run.provider_called
     or run.provider_started_at is null
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_run_mismatch';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.veroxa_claim_momo_content_ai_webhook_v1(p_event_id text, p_webhook_id text, p_provider_response_id text, p_run_id uuid, p_request_hash text, p_claim_token uuid)
 RETURNS TABLE(run_id uuid, run_status text, request_hash text, source_storage_path text, source_mime_type text, source_file_size bigint, source_content_sha256 text, source_width integer, source_height integer, target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text, reserved_microusd bigint, provider_response_id text, output_payload jsonb, provider_error_code text, requested_by uuid, event_status text, event_id text, webhook_id text, webhook_claim_token uuid, webhook_claim_lease_expires_at timestamp with time zone, owns_webhook_claim boolean, webhook_claim_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  webhook_event veroxa_private.momo_content_ai_webhook_events%rowtype;
  observed_at timestamptz;
  lease_until timestamptz;
  changed_rows integer;
  ownership_status text;
begin
  if p_event_id is null
     or p_event_id is distinct from pg_catalog.btrim(p_event_id)
     or pg_catalog.char_length(p_event_id) > 200
     or p_event_id !~ '^evt_[A-Za-z0-9_-]{8,196}$'
     or p_webhook_id is null
     or p_webhook_id is distinct from pg_catalog.btrim(p_webhook_id)
     or pg_catalog.char_length(p_webhook_id) > 200
     or p_webhook_id !~ '^wh_[A-Za-z0-9_-]{8,196}$'
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(
       p_provider_response_id
     )
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or p_run_id is null
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_claim_token is null
     or p_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_webhook_claim';
  end if;

  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not run.provider_called
     or run.provider_started_at is null
     or run.status not in (
       'provider_running','result_staged','pending_review',
       'materialized','rejected','failed'
     )
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_run_invalid';
  end if;
  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs other_run
    where other_run.provider_response_id = p_provider_response_id
      and other_run.id <> run.id
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_response_conflict';
  end if;

  select * into webhook_event
  from veroxa_private.momo_content_ai_webhook_events target_event
  where target_event.event_id = p_event_id
  for update;
  -- Start the lease only after both lock acquisitions. A worker that waited on
  -- either lock must not receive an already-aged (or expired) lease.
  observed_at := pg_catalog.clock_timestamp();
  lease_until := observed_at + interval '5 minutes';
  if found then
    if webhook_event.webhook_id is distinct from p_webhook_id
       or webhook_event.provider_response_id is distinct from p_provider_response_id
       or webhook_event.run_id is distinct from run.id
       or webhook_event.request_hash is distinct from run.request_hash
       or webhook_event.restaurant_id is distinct from run.restaurant_id
       or run.provider_response_id is distinct from p_provider_response_id then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_webhook_claim_conflict';
    end if;

    if webhook_event.state in ('processed','failed') then
      return query select run.id, run.status, run.request_hash,
        run.source_storage_path, run.source_mime_type, run.source_file_size,
        run.source_content_sha256, run.source_width, run.source_height,
        run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
        run.reserved_microusd, run.provider_response_id, run.output_payload,
        run.provider_error_code, run.requested_by, webhook_event.state,
        webhook_event.event_id, webhook_event.webhook_id,
        case when webhook_event.claim_token = p_claim_token
          then webhook_event.claim_token else null end,
        null::timestamptz,
        webhook_event.claim_token = p_claim_token,
        case when webhook_event.claim_token = p_claim_token
          then 'terminal_owner' else 'terminal_other' end;
      return;
    end if;

    if webhook_event.claim_token = p_claim_token
       and webhook_event.claim_lease_expires_at > observed_at then
      ownership_status := 'owned';
    elsif webhook_event.claim_token <> p_claim_token
       and webhook_event.claim_lease_expires_at > observed_at then
      raise exception using errcode = '55P03',
        message = 'momo_content_ai_webhook_claim_live_conflict';
    else
      update veroxa_private.momo_content_ai_webhook_events target_event
      set claim_token = p_claim_token,
          claim_lease_expires_at = lease_until,
          claim_attempts = target_event.claim_attempts + 1
      where target_event.event_id = webhook_event.event_id
        and target_event.webhook_id = webhook_event.webhook_id
        and target_event.state = 'claimed'
        and target_event.claim_token = webhook_event.claim_token
        and target_event.claim_lease_expires_at
          = webhook_event.claim_lease_expires_at
        and target_event.claim_lease_expires_at <= observed_at
        and target_event.claim_attempts = webhook_event.claim_attempts
        and target_event.claim_attempts < 1000
      returning target_event.* into webhook_event;
      get diagnostics changed_rows = row_count;
      if changed_rows <> 1 then
        raise exception using errcode = '23514',
          message = 'momo_content_ai_webhook_claim_cas_failed';
      end if;
      ownership_status := 'reclaimed';
    end if;

    return query select run.id, run.status, run.request_hash,
      run.source_storage_path, run.source_mime_type, run.source_file_size,
      run.source_content_sha256, run.source_width, run.source_height,
      run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
      run.reserved_microusd, run.provider_response_id, run.output_payload,
      run.provider_error_code, run.requested_by, webhook_event.state,
      webhook_event.event_id, webhook_event.webhook_id, p_claim_token,
      webhook_event.claim_lease_expires_at, true, ownership_status;
    return;
  end if;

  if exists (
    select 1
    from veroxa_private.momo_content_ai_webhook_events other_event
    where other_event.webhook_id = p_webhook_id
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_header_event_conflict';
  end if;

  if run.provider_response_id is null then
    if run.status <> 'provider_running' then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_run_invalid';
    end if;
    update public.veroxa_momo_content_ai_runs target_run
    set provider_response_id = p_provider_response_id,
        updated_at = pg_catalog.clock_timestamp()
    where target_run.id = run.id
      and target_run.status = 'provider_running'
      and target_run.provider_response_id is null
    returning target_run.* into run;
    if not found then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_claim_race';
    end if;
  elsif run.provider_response_id is distinct from p_provider_response_id then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_response_conflict';
  end if;

  insert into veroxa_private.momo_content_ai_webhook_events (
    event_id, webhook_id, provider_response_id, run_id, request_hash,
    restaurant_id, claim_token, claim_lease_expires_at, claim_attempts
  ) values (
    p_event_id, p_webhook_id, p_provider_response_id, run.id,
    run.request_hash, run.restaurant_id, p_claim_token, lease_until, 1
  ) returning * into webhook_event;

  return query select run.id, run.status, run.request_hash,
    run.source_storage_path, run.source_mime_type, run.source_file_size,
    run.source_content_sha256, run.source_width, run.source_height,
    run.target_platforms, run.truth_snapshot, run.truth_snapshot_sha256,
    run.reserved_microusd, run.provider_response_id, run.output_payload,
    run.provider_error_code, run.requested_by, webhook_event.state,
    webhook_event.event_id, webhook_event.webhook_id,
    webhook_event.claim_token, webhook_event.claim_lease_expires_at,
    true, 'acquired'::text;
end;
$function$;

CREATE OR REPLACE FUNCTION public.veroxa_stage_momo_content_ai_result_v1(p_run_id uuid, p_request_hash text, p_provider_response_id text, p_output_payload jsonb, p_output_canonical text, p_output_sha256 text, p_validation_report jsonb, p_validation_canonical text, p_validation_sha256 text, p_accounted_microusd bigint, p_accounting_basis text, p_provider_usage jsonb, p_actor_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
  ledger_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_result_stage_rejected';
  end if;

  -- An exact terminal-result replay is reconciliation, not a fresh validation
  -- attempt. The original insert already passed v4 and settled the ledger.
  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if found then
    if staged.restaurant_id = run.restaurant_id
       and staged.prompt_version = run.prompt_version
       and staged.validator_version = run.validator_version
       and staged.provider_response_id = p_provider_response_id
       and staged.output_payload = p_output_payload
       and staged.output_canonical = p_output_canonical
       and staged.output_sha256 = p_output_sha256
       and staged.validation_report = p_validation_report
       and staged.validation_canonical = p_validation_canonical
       and staged.validation_sha256 = p_validation_sha256
       and staged.accounted_microusd = p_accounted_microusd
       and staged.accounting_basis = p_accounting_basis
       and staged.provider_usage is not distinct from p_provider_usage
       and run.provider_response_id = staged.provider_response_id
       and run.output_payload = staged.output_payload
       and run.output_canonical = staged.output_canonical
       and run.output_sha256 = staged.output_sha256
       and run.validation_report = staged.validation_report
       and run.validation_canonical = staged.validation_canonical
       and run.validation_sha256 = staged.validation_sha256
       and run.accounted_microusd = staged.accounted_microusd
       and run.accounting_basis = staged.accounting_basis
       and run.provider_usage is not distinct from staged.provider_usage
       and ((run.status = 'result_staged' and staged.state = 'staged')
         or (run.status in ('pending_review','materialized','rejected')
           and staged.state = 'applied'))
       and exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = run.id
           and ledger.restaurant_id = run.restaurant_id
           and ledger.idempotency_hash = run.idempotency_hash
           and ledger.state = 'settled'
           and ledger.provider_called
           and ledger.reserved_microusd = run.reserved_microusd
           and ledger.accounted_microusd = staged.accounted_microusd
           and ledger.accounting_basis = staged.accounting_basis
       ) then
      return staged.run_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_result_stage_conflict';
  end if;

  if run.status not in (
       'provider_running','result_staged','pending_review','materialized','rejected'
     )
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     )
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is distinct from p_provider_response_id
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(p_provider_response_id)
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or pg_catalog.jsonb_typeof(p_output_payload) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_validation_report) is distinct from 'object'
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_output_payload, p_output_canonical, p_output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_validation_report, p_validation_canonical, p_validation_sha256
     )
     or p_validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or p_validation_report -> 'passed' is distinct from 'true'::jsonb
     or p_validation_report -> 'platformSet' is distinct from run.target_platforms
     or not veroxa_private.momo_current_content_contract_valid_v2(
       p_output_payload, run.target_platforms, run.truth_snapshot,
       run.prompt_version, run.validator_version
     )
     or p_accounted_microusd not between 1 and run.reserved_microusd
     or p_accounting_basis not in (
       'provider_usage_estimate','conservative_reservation'
     )
     or (p_accounting_basis = 'provider_usage_estimate'
       and pg_catalog.jsonb_typeof(p_provider_usage) is distinct from 'object')
     or (p_accounting_basis = 'conservative_reservation'
       and (p_provider_usage is not null
         or p_accounted_microusd <> run.reserved_microusd)) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_result_stage';
  end if;

  if p_accounting_basis = 'provider_usage_estimate' then
    begin
      if (select pg_catalog.count(*)
          from pg_catalog.jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_usage';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 25000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_usage';
      end if;
      expected_microusd := usage_input * (
        case when usage_input > 272000 then 10 else 5 end
      ) + usage_output * (
        case when usage_input > 272000 then 45 else 30 end
      );
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and run.reserved_microusd then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_result_stage_cost';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'invalid_momo_content_ai_result_stage_usage';
    end;
  end if;

  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs other_run
    where other_run.provider_response_id = p_provider_response_id
      and other_run.id <> run.id
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_provider_response_conflict';
  end if;

  if run.status <> 'provider_running' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_stage_state_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'result_staged',
      provider_usage = p_provider_usage,
      output_payload = p_output_payload,
      output_canonical = p_output_canonical,
      output_sha256 = p_output_sha256,
      validation_report = p_validation_report,
      validation_canonical = p_validation_canonical,
      validation_sha256 = p_validation_sha256,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis,
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'provider_running';

  insert into veroxa_private.momo_content_ai_result_outbox (
    run_id, request_hash, restaurant_id, prompt_version, validator_version,
    provider_response_id,
    output_payload, output_canonical, output_sha256,
    validation_report, validation_canonical, validation_sha256,
    accounted_microusd, accounting_basis, provider_usage,
    state, staged_by, applied_at
  ) values (
    run.id, run.request_hash, run.restaurant_id, run.prompt_version,
    run.validator_version, p_provider_response_id,
    p_output_payload, p_output_canonical, p_output_sha256,
    p_validation_report, p_validation_canonical, p_validation_sha256,
    p_accounted_microusd, p_accounting_basis, p_provider_usage,
    'staged', p_actor_id, null
  );

  update veroxa_private.momo_ai_cost_ledger ledger
  set state = 'settled', provider_called = true,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis,
      updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id
    and ledger.restaurant_id = run.restaurant_id
    and ledger.idempotency_hash = run.idempotency_hash
    and ledger.state = 'reserved'
    and ledger.provider_called
    and ledger.reserved_microusd = run.reserved_microusd
    and ledger.accounted_microusd is null
    and ledger.accounting_basis is null;
  get diagnostics ledger_rows = row_count;
  if ledger_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_result_ledger_settlement_failed';
  end if;
  return run.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.veroxa_complete_staged_momo_content_ai_run_v1(p_run_id uuid, p_request_hash text, p_actor_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  outbox_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_staged_completion_rejected';
  end if;

  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if not found
     or staged.restaurant_id is distinct from run.restaurant_id
     or staged.prompt_version is distinct from run.prompt_version
     or staged.validator_version is distinct from run.validator_version
     or staged.provider_response_id is distinct from run.provider_response_id
     or staged.output_payload is distinct from run.output_payload
     or staged.output_canonical is distinct from run.output_canonical
     or staged.output_sha256 is distinct from run.output_sha256
     or staged.validation_report is distinct from run.validation_report
     or staged.validation_canonical is distinct from run.validation_canonical
     or staged.validation_sha256 is distinct from run.validation_sha256
     or staged.accounted_microusd is distinct from run.accounted_microusd
     or staged.accounting_basis is distinct from run.accounting_basis
     or staged.provider_usage is distinct from run.provider_usage then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_required';
  end if;

  if run.status in ('pending_review','materialized','rejected') then
    if staged.state <> 'applied' then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_staged_completion_conflict';
    end if;
    return run.id;
  end if;

  if run.status <> 'result_staged'
     or staged.state <> 'staged'
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     )
     or not exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'settled'
         and ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd = run.accounted_microusd
         and ledger.accounting_basis = run.accounting_basis
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_no_longer_valid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'pending_review',
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'result_staged';
  if not found then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  update veroxa_private.momo_content_ai_result_outbox outbox
  set state = 'applied', applied_at = pg_catalog.clock_timestamp()
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
    and outbox.state = 'staged';
  get diagnostics outbox_rows = row_count;
  if outbox_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  return run.id;
end;
$function$;

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

CREATE OR REPLACE FUNCTION public.veroxa_complete_momo_content_ai_run_v1(p_run_id uuid, p_request_hash text, p_provider_response_id text, p_output_payload jsonb, p_output_canonical text, p_output_sha256 text, p_validation_report jsonb, p_validation_canonical text, p_validation_sha256 text, p_accounted_microusd bigint, p_accounting_basis text, p_provider_usage jsonb, p_actor_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  staged veroxa_private.momo_content_ai_result_outbox%rowtype;
  usage_input bigint;
  usage_output bigint;
  usage_total bigint;
  expected_microusd bigint;
  outbox_rows integer;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs
  where id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or not (
       p_actor_id = run.requested_by
       or veroxa_private.momo_media_ai_actor_has_operational_team_v1(
         run.restaurant_id, p_actor_id
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;

  select * into staged
  from veroxa_private.momo_content_ai_result_outbox outbox
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
  for update;
  if not found
     or staged.restaurant_id is distinct from run.restaurant_id
     or staged.prompt_version is distinct from run.prompt_version
     or staged.validator_version is distinct from run.validator_version
     or staged.provider_response_id is distinct from p_provider_response_id
     or staged.output_payload is distinct from p_output_payload
     or staged.output_canonical is distinct from p_output_canonical
     or staged.output_sha256 is distinct from p_output_sha256
     or staged.validation_report is distinct from p_validation_report
     or staged.validation_canonical is distinct from p_validation_canonical
     or staged.validation_sha256 is distinct from p_validation_sha256
     or staged.accounted_microusd is distinct from p_accounted_microusd
     or staged.accounting_basis is distinct from p_accounting_basis
     or staged.provider_usage is distinct from p_provider_usage then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_required';
  end if;

  if run.status in ('pending_review','materialized','rejected') then
    if staged.state = 'applied'
       and run.provider_response_id = p_provider_response_id
       and run.output_payload = p_output_payload
       and run.output_canonical = p_output_canonical
       and run.output_sha256 = p_output_sha256
       and run.validation_report = p_validation_report
       and run.validation_canonical = p_validation_canonical
       and run.validation_sha256 = p_validation_sha256
       and run.accounted_microusd = p_accounted_microusd
       and run.accounting_basis = p_accounting_basis
       and run.provider_usage is not distinct from p_provider_usage then
      return run.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_completion_conflict';
  end if;

  if run.status <> 'result_staged'
     or staged.state <> 'staged'
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     )
     or run.provider_response_id is distinct from p_provider_response_id
     or p_provider_response_id is null
     or p_provider_response_id is distinct from pg_catalog.btrim(
       p_provider_response_id
     )
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or pg_catalog.jsonb_typeof(p_output_payload) is distinct from 'object'
     or pg_catalog.jsonb_typeof(p_validation_report) is distinct from 'object'
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_output_payload, p_output_canonical, p_output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       p_validation_report, p_validation_canonical, p_validation_sha256
     )
     or p_validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or p_validation_report -> 'passed' is distinct from 'true'::jsonb
     or p_validation_report -> 'platformSet' is distinct from run.target_platforms
     or not veroxa_private.momo_current_content_contract_valid_v2(
       p_output_payload, run.target_platforms, run.truth_snapshot,
       run.prompt_version, run.validator_version
     )
     or p_accounted_microusd not between 1 and run.reserved_microusd
     or p_accounting_basis not in (
       'provider_usage_estimate','conservative_reservation'
     )
     or (p_accounting_basis = 'provider_usage_estimate'
       and pg_catalog.jsonb_typeof(p_provider_usage) is distinct from 'object')
     or (p_accounting_basis = 'conservative_reservation'
       and (p_provider_usage is not null
         or p_accounted_microusd <> run.reserved_microusd))
     or not exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'settled'
         and ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd = p_accounted_microusd
         and ledger.accounting_basis = p_accounting_basis
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_completion';
  end if;

  if p_accounting_basis = 'provider_usage_estimate' then
    begin
      if (select pg_catalog.count(*)
          from pg_catalog.jsonb_object_keys(p_provider_usage)) <> 3 then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_usage';
      end if;
      usage_input := (p_provider_usage ->> 'input_tokens')::bigint;
      usage_output := (p_provider_usage ->> 'output_tokens')::bigint;
      usage_total := (p_provider_usage ->> 'total_tokens')::bigint;
      if usage_input not between 1 and 1050000
         or usage_output not between 0 and 25000
         or usage_total <> usage_input + usage_output then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_usage';
      end if;
      expected_microusd := usage_input * (
        case when usage_input > 272000 then 10 else 5 end
      ) + usage_output * (
        case when usage_input > 272000 then 45 else 30 end
      );
      if p_accounted_microusd is distinct from expected_microusd
         or expected_microusd not between 1 and run.reserved_microusd then
        raise exception using errcode = '22023',
          message = 'invalid_momo_content_ai_completion_cost';
      end if;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception using errcode = '22023',
        message = 'invalid_momo_content_ai_completion_usage';
    end;
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'pending_review',
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id and target_run.status = 'result_staged';
  update veroxa_private.momo_content_ai_result_outbox outbox
  set state = 'applied', applied_at = pg_catalog.clock_timestamp()
  where outbox.run_id = run.id and outbox.request_hash = run.request_hash
    and outbox.state = 'staged';
  get diagnostics outbox_rows = row_count;
  if outbox_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_staged_result_apply_failed';
  end if;
  return run.id;
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

  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id and asset.restaurant_id = v_restaurant_id
  -- Concurrent exact-byte uploads may each hold their own asset. SHARE is
  -- sufficient for immutable evidence and remains compatible with the
  -- canonical asset key-share lock acquired by foreign keys after the
  -- per-hash advisory lock, avoiding an inverted UPDATE/advisory deadlock.
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
  where rights.asset_id = v_asset_id and rights.restaurant_id = v_restaurant_id
  for share;
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    v_restaurant_id::text || ':' || v_verification.content_sha256, 0
  ));
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
begin
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
    where target.id = (p_payload ->> 'runId')::uuid
    for update;
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

CREATE OR REPLACE FUNCTION veroxa_private.guard_momo_ready_package_v4()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = new.content_ai_run_id
  for key share;
  if not found
     or run.status <> 'pending_review'
     or run.restaurant_id is distinct from new.restaurant_id
     or not veroxa_private.momo_content_contract_version_pair_valid_v2(
       run.prompt_version, run.validator_version
     )
     or new.status <> 'ready_to_post'
     or new.external_write_allowed
     or new.approved_payload is distinct from run.output_payload
     or new.approved_payload_sha256 is distinct from run.output_sha256
     or new.validation_sha256 is distinct from run.validation_sha256
     or run.validation_report ->> 'validatorVersion'
        is distinct from run.validator_version
     or run.validation_report -> 'passed' is distinct from 'true'::jsonb
     or run.validation_report -> 'platformSet'
        is distinct from run.target_platforms
     or not veroxa_private.momo_canonical_payload_matches_v1(
       run.output_payload, run.output_canonical, run.output_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       run.validation_report, run.validation_canonical, run.validation_sha256
     )
     or not veroxa_private.momo_canonical_payload_matches_v1(
       new.schedule_snapshot, new.schedule_canonical, new.schedule_sha256
     )
     or not veroxa_private.momo_current_content_contract_valid_v2(
       run.output_payload, run.target_platforms, run.truth_snapshot,
       run.prompt_version, run.validator_version
     )
     or not veroxa_private.momo_content_ai_current_evidence_v1(
       run.id, new.approved_by
     )
     or not exists (
       select 1
       from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
         and outbox.request_hash = run.request_hash
         and outbox.state = 'applied'
         and outbox.output_sha256 = run.output_sha256
         and outbox.validation_sha256 = run.validation_sha256
     ) then
    raise exception using errcode = '23514',
      message = 'momo_ready_v4_contract_failed';
  end if;
  return new;
exception when others then
  if sqlstate in ('23514','42501') then
    raise;
  end if;
  raise exception using errcode = '23514',
    message = 'momo_ready_v4_contract_failed';
end;
$function$;

CREATE OR REPLACE FUNCTION public.veroxa_momo_ready_package_status_v1(p_ready_package_id uuid)
 RETURNS TABLE(ready_package_id uuid, effective_status text, blockers jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  package public.veroxa_momo_ready_packages%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  rights public.veroxa_media_rights%rowtype;
  problems jsonb := '[]'::jsonb;
begin
  select * into package
  from public.veroxa_momo_ready_packages
  where id = p_ready_package_id;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(
       package.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_package_team_required';
  end if;

  begin
    select * into run
    from public.veroxa_momo_content_ai_runs
    where id = package.content_ai_run_id;
    select * into rights
    from public.veroxa_media_rights
    where id = package.rights_id;

    if run.id is null
       or run.status <> 'materialized'
       or package.restaurant_id is distinct from run.restaurant_id
       or package.source_asset_id is distinct from run.source_asset_id
       or package.source_storage_path is distinct from run.source_storage_path
       or package.source_storage_object_id
          is distinct from run.source_storage_object_id
       or package.source_storage_object_version
          is distinct from run.source_storage_object_version
       or package.source_mime_type is distinct from run.source_mime_type
       or package.source_file_size is distinct from run.source_file_size
       or package.source_width is distinct from run.source_width
       or package.source_height is distinct from run.source_height
       or package.source_content_sha256
          is distinct from run.source_content_sha256
       or package.intake_verification_id
          is distinct from run.intake_verification_id
       or package.rights_id is distinct from run.rights_id
       or package.rights_attestation_sha256
          is distinct from run.rights_attestation_sha256
       or package.review_id is distinct from run.review_id
       or package.truth_snapshot_sha256
          is distinct from run.truth_snapshot_sha256
       or package.approved_payload is distinct from run.output_payload
       or package.approved_payload_sha256 is distinct from run.output_sha256
       or package.validation_sha256 is distinct from run.validation_sha256
       or not veroxa_private.momo_canonical_payload_matches_v1(
         run.output_payload, run.output_canonical, run.output_sha256
       )
       or not veroxa_private.momo_canonical_payload_matches_v1(
         run.validation_report, run.validation_canonical,
         run.validation_sha256
       )
       or not veroxa_private.momo_canonical_payload_matches_v1(
         package.schedule_snapshot, package.schedule_canonical,
         package.schedule_sha256
       )
       or package.status <> 'ready_to_post'
       or package.external_write_allowed then
      problems := problems || '"package_integrity_changed"'::jsonb;
    end if;

    if run.id is null
       or not veroxa_private.momo_content_contract_version_pair_valid_v2(
         run.prompt_version, run.validator_version
       )
       or run.validation_report ->> 'validatorVersion'
          is distinct from run.validator_version
       or run.validation_report -> 'passed' is distinct from 'true'::jsonb
       or run.validation_report -> 'platformSet'
          is distinct from run.target_platforms then
      problems := problems || '"validation_evidence_changed"'::jsonb;
    end if;

    if run.id is null
       or not veroxa_private.momo_current_content_contract_valid_v2(
         package.approved_payload, run.target_platforms, run.truth_snapshot,
         run.prompt_version, run.validator_version
       ) then
      problems := problems || '"content_contract_changed"'::jsonb;
    end if;

    if not veroxa_private.momo_content_ai_current_evidence_v1(
      package.content_ai_run_id, (select auth.uid())
    ) then
      problems := problems || '"evidence_changed"'::jsonb;
    end if;

    if exists (
      select 1
      from public.veroxa_momo_ready_package_variants variant
      where variant.ready_package_id = package.id
        and (
          variant.restaurant_id is distinct from package.restaurant_id
          or variant.status <> 'ready_to_post'
          or variant.external_write_allowed
          or variant.media_source_kind <> 'original_accepted'
          or variant.media_asset_id is distinct from package.source_asset_id
          or variant.media_review_id is distinct from package.review_id
          or variant.media_storage_path
             is distinct from package.source_storage_path
          or variant.media_storage_object_id
             is distinct from package.source_storage_object_id
          or variant.media_storage_object_version
             is distinct from package.source_storage_object_version
          or variant.media_mime_type is distinct from package.source_mime_type
          or variant.media_file_size is distinct from package.source_file_size
          or variant.media_width is distinct from package.source_width
          or variant.media_height is distinct from package.source_height
          or variant.media_content_sha256
             is distinct from package.source_content_sha256
          or not exists (
            select 1
            from storage.objects object
            where object.bucket_id = 'restaurant-media'
              and object.name = variant.media_storage_path
              and object.id = variant.media_storage_object_id
              and object.version = variant.media_storage_object_version
              and coalesce(object.metadata ->> 'mimetype', '')
                = variant.media_mime_type
              and case
                when coalesce(object.metadata ->> 'size', '')
                  ~ '^[0-9]{1,30}$'
                  then (object.metadata ->> 'size')::numeric
                    = variant.media_file_size::numeric
                else false
              end
          )
          or variant.timezone <> 'America/Chicago'
          or variant.caption is distinct from (
            select source ->> 'caption'
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'variants'
            ) source
            where source ->> 'platform' = variant.platform
          )
          or variant.alt_text
             is distinct from package.approved_payload ->> 'altText'
          or variant.call_to_action is distinct from (
            select source -> 'cta'
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'variants'
            ) source
            where source ->> 'platform' = variant.platform
          )
          or variant.hashtags is distinct from coalesce((
            select pg_catalog.jsonb_agg(tag ->> 'tag' order by tag ->> 'tag')
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'hashtags'
            ) tag
            where (
              select source -> 'hashtagIds'
              from pg_catalog.jsonb_array_elements(
                package.approved_payload -> 'variants'
              ) source
              where source ->> 'platform' = variant.platform
            ) ? (tag ->> 'id')
          ), '[]'::jsonb)
          or variant.seo_phrases is distinct from coalesce((
            select pg_catalog.jsonb_agg(
              phrase ->> 'phrase' order by phrase ->> 'phrase'
            )
            from pg_catalog.jsonb_array_elements(
              package.approved_payload -> 'seoPhrases'
            ) phrase
            where (
              select source -> 'seoPhraseIds'
              from pg_catalog.jsonb_array_elements(
                package.approved_payload -> 'variants'
              ) source
              where source ->> 'platform' = variant.platform
            ) ? (phrase ->> 'id')
          ), '[]'::jsonb)
          or variant.caption_sha256 is distinct from pg_catalog.encode(
            extensions.digest(
              pg_catalog.convert_to(variant.caption, 'UTF8'), 'sha256'
            ), 'hex'
          )
          or veroxa_private.momo_chicago_minute_v1(
            package.schedule_snapshot ->> variant.platform
          ) is distinct from variant.scheduled_for
          or variant.scheduled_for <= pg_catalog.now()
          or (rights.expires_at is not null
            and variant.scheduled_for >= rights.expires_at)
          or pg_catalog.jsonb_array_length(variant.seo_phrases)
             not between 3 and 8
          or variant.caption ~ '#[A-Za-z]'
          or (variant.platform = 'instagram'
            and pg_catalog.jsonb_array_length(variant.hashtags)
              not between 3 and 5)
          or (variant.platform = 'facebook'
            and pg_catalog.jsonb_array_length(variant.hashtags)
              not between 0 and 3)
          or (variant.platform = 'google_business'
            and pg_catalog.jsonb_array_length(variant.hashtags) <> 0)
        )
    ) then
      problems := problems || '"variant_integrity_changed"'::jsonb;
    end if;

    if run.id is null
       or (select pg_catalog.count(*)
           from public.veroxa_momo_ready_package_variants variant
           where variant.ready_package_id = package.id)
          <> pg_catalog.jsonb_array_length(run.target_platforms)
       or exists (
         select 1
         from pg_catalog.jsonb_array_elements_text(
           run.target_platforms
         ) platform
         where not exists (
           select 1
           from public.veroxa_momo_ready_package_variants variant
           where variant.ready_package_id = package.id
             and variant.platform = platform.value
         )
       )
       or (select pg_catalog.count(*)
           from pg_catalog.jsonb_object_keys(package.schedule_snapshot))
          <> pg_catalog.jsonb_array_length(run.target_platforms) then
      problems := problems || '"variant_set_changed"'::jsonb;
    end if;

    if not exists (
      select 1
      from public.veroxa_momo_runtime_controls runtime
      where runtime.restaurant_id = package.restaurant_id
        and not runtime.provider_writes
        and not runtime.review_replies
        and not runtime.website_writes
        and not runtime.external_scheduling
    ) then
      problems := problems || '"external_write_lock_changed"'::jsonb;
    end if;

    if exists (
      select 1
      from public.veroxa_publish_queue queue
      where queue.restaurant_id = package.restaurant_id
    ) or exists (
      select 1
      from public.veroxa_publish_attempts attempt
      where attempt.restaurant_id = package.restaurant_id
    ) or exists (
      select 1
      from public.veroxa_content_calendar calendar
      where calendar.restaurant_id = package.restaurant_id
        and (calendar.status not in (
          'draft','awaiting_approval','approved','cancelled'
        ) or calendar.published_at is not null)
    ) or exists (
      select 1
      from public.veroxa_media_usage usage
      where usage.restaurant_id = package.restaurant_id
        and (usage.usage_kind = 'published'
          or usage.external_reference is not null)
    ) then
      problems := problems || '"posting_boundary_violated"'::jsonb;
    end if;

    return query select package.id,
      case
        when pg_catalog.jsonb_array_length(problems) = 0
          then 'ready_to_post'
        else 'blocked'
      end,
      problems;
  exception when others then
    return query select package.id, 'blocked'::text,
      '["integrity_check_failed_closed"]'::jsonb;
  end;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Dedicated append-only Team decision overlay for Ready-v2 packages.
-- ---------------------------------------------------------------------------

create table veroxa_private.momo_ready_decisions_v2 (
  id uuid primary key default gen_random_uuid(),
  schema_version text not null default
    'momo-ready-team-decision-2026-08-08-v1'
    check (
      schema_version = 'momo-ready-team-decision-2026-08-08-v1'
    ),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null unique
    references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  decision text not null check (
    decision in ('approved_for_manual_export','discarded')
  ),
  decision_reason text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  review_snapshot jsonb not null check (
    pg_catalog.jsonb_typeof(review_snapshot) = 'object'
  ),
  review_snapshot_canonical text not null check (
    pg_catalog.char_length(review_snapshot_canonical) between 2 and 131072
  ),
  review_snapshot_sha256 text not null check (
    review_snapshot_sha256 ~ '^[0-9a-f]{64}$'
  ),
  decision_request_sha256 text not null check (
    decision_request_sha256 ~ '^[0-9a-f]{64}$'
  ),
  decided_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  decided_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  constraint momo_ready_decisions_v2_reason_check check (
    (
      decision = 'approved_for_manual_export'
      and decision_reason is null
      and inspection_attestation_version is not null
      and inspection_attestation_text is not null
      and inspection_attestation_sha256 is not null
      and inspection_attestation_version =
        'momo-ready-team-inspection-2026-08-08-v1'
      and inspection_attestation_text =
        'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.'
      and inspection_attestation_sha256 ~ '^[0-9a-f]{64}$'
      and inspection_attestation_sha256 = pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(inspection_attestation_text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    )
    or (
      decision = 'discarded'
      and decision_reason is not null
      and decision_reason = pg_catalog.btrim(decision_reason)
      and pg_catalog.char_length(decision_reason) between 4 and 500
      and decision_reason !~ '[[:cntrl:]]'
      and inspection_attestation_version is null
      and inspection_attestation_text is null
      and inspection_attestation_sha256 is null
    )
  ),
  constraint momo_ready_decisions_v2_snapshot_canonical_check check (
    review_snapshot_canonical =
      veroxa_private.momo_canonical_json_v1(review_snapshot)
  ),
  constraint momo_ready_decisions_v2_snapshot_sha_check check (
    review_snapshot_sha256 = pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(review_snapshot_canonical, 'UTF8'),
        'sha256'
      ),
      'hex'
    )
  ),
  unique (restaurant_id, decision_request_sha256)
);

create index momo_ready_decisions_v2_restaurant_decided_idx
  on veroxa_private.momo_ready_decisions_v2 (
    restaurant_id, decided_at desc
  );

create trigger momo_ready_decisions_v2_append_only
before update or delete on veroxa_private.momo_ready_decisions_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();

alter table veroxa_private.momo_ready_decisions_v2
  enable row level security;
alter table veroxa_private.momo_ready_decisions_v2
  force row level security;
revoke all on table veroxa_private.momo_ready_decisions_v2
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_momo_ready_decision_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  expected_request_sha text;
begin
  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = new.ready_package_id
  for key share;

  expected_request_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'schemaVersion',
              'momo-ready-team-decision-request-2026-08-08-v1',
            'readyPackageId', new.ready_package_id,
            'restaurantId', new.restaurant_id,
            'decision', new.decision,
            'expectedReviewSnapshotSha256',
              new.review_snapshot_sha256,
            'reason', new.decision_reason,
            'inspectionAttestationVersion',
              new.inspection_attestation_version,
            'inspectionAttestationText',
              new.inspection_attestation_text,
            'inspectionAttestationSha256',
              new.inspection_attestation_sha256,
            'externalWriteAllowed', false
          )
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  if ready.id is null
     or new.restaurant_id is distinct from ready.restaurant_id
     or new.review_snapshot ->> 'schemaVersion' is distinct from
       'momo-ready-review-snapshot-2026-08-08-v1'
     or new.review_snapshot ->> 'restaurantId' is distinct from
       new.restaurant_id::text
     or new.review_snapshot ->> 'readyPackageId' is distinct from
       new.ready_package_id::text
     or new.review_snapshot ->> 'contentAiRunId' is distinct from
       ready.content_ai_run_id::text
     or new.review_snapshot ->> 'identityId' is distinct from
       ready.identity_id::text
     or new.review_snapshot ->> 'canonicalAssetId' is distinct from
       ready.canonical_asset_id::text
     or new.review_snapshot ->> 'sourceAssetId' is distinct from
       ready.source_asset_id::text
     or new.review_snapshot ->> 'intakeVerificationId' is distinct from
       ready.intake_verification_id::text
     or new.review_snapshot ->> 'rightsId' is distinct from
       ready.rights_id::text
     or new.review_snapshot ->> 'rightsAttestationSha256'
       is distinct from ready.rights_attestation_sha256
     or new.review_snapshot ->> 'truthSnapshotSha256'
       is distinct from ready.truth_snapshot_sha256
     or new.review_snapshot ->> 'outputSha256'
       is distinct from ready.output_sha256
     or new.review_snapshot ->> 'validationSha256'
       is distinct from ready.validation_sha256
     or new.review_snapshot ->> 'automationPolicyVersion'
       is distinct from ready.policy_version
     or pg_catalog.jsonb_typeof(
       new.review_snapshot -> 'checks'
     ) is distinct from 'object'
     or pg_catalog.jsonb_typeof(
       new.review_snapshot -> 'blockerCodes'
     ) is distinct from 'array'
     or new.review_snapshot -> 'externalWriteAllowed'
       is distinct from 'false'::jsonb
     or new.review_snapshot ->>
       'requiredInspectionAttestationVersion'
       is distinct from 'momo-ready-team-inspection-2026-08-08-v1'
     or new.review_snapshot ->>
       'requiredInspectionAttestationText'
       is distinct from
       'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.'
     or new.review_snapshot ->>
       'requiredInspectionAttestationSha256'
       is distinct from pg_catalog.encode(
         extensions.digest(
           pg_catalog.convert_to(
             'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.',
             'UTF8'
           ),
           'sha256'
         ),
         'hex'
       )
     or new.decision_request_sha256 is distinct from
       expected_request_sha
     or (
       new.decision = 'approved_for_manual_export'
       and new.review_snapshot -> 'blockerCodes' <> '[]'::jsonb
     ) then
    raise exception using errcode = '23514',
      message = 'momo_ready_decision_coherence_failed_v2';
  end if;
  return new;
exception
  when others then
    if sqlstate in ('23514','42501') then
      raise;
    end if;
    raise exception using errcode = '23514',
      message = 'momo_ready_decision_coherence_failed_v2';
end;
$function$;

revoke all on function
  veroxa_private.guard_momo_ready_decision_v2()
  from public, anon, authenticated, service_role;

create trigger momo_ready_decisions_v2_coherence
before insert on veroxa_private.momo_ready_decisions_v2
for each row execute function
  veroxa_private.guard_momo_ready_decision_v2();

create or replace function
  veroxa_private.momo_ready_variants_current_v2(
    p_ready_package_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.id = p_ready_package_id
      and (
        select pg_catalog.count(*)
        from public.veroxa_momo_ready_variants_v2 ready_variant
        where ready_variant.ready_package_id = ready.id
          and ready_variant.restaurant_id = ready.restaurant_id
          and ready_variant.status = 'veroxa_ready'
          and not ready_variant.external_write_allowed
      ) = pg_catalog.jsonb_array_length(run.target_platforms)
      and not exists (
        select 1
        from public.veroxa_momo_ready_variants_v2 ready_variant
        where ready_variant.ready_package_id = ready.id
          and (
            ready_variant.restaurant_id <> ready.restaurant_id
            or ready_variant.status <> 'veroxa_ready'
            or ready_variant.external_write_allowed
            or not exists (
              select 1
              from pg_catalog.jsonb_array_elements(
                run.output_payload -> 'variants'
              ) output_variant(value)
              where output_variant.value ->> 'platform' =
                    ready_variant.platform
                and output_variant.value ->> 'scheduleWindow' =
                    'unspecified'
                and output_variant.value ->> 'caption' =
                    ready_variant.caption
                and output_variant.value -> 'cta' =
                    ready_variant.call_to_action
                and output_variant.value -> 'claimIds' =
                    ready_variant.claim_ids
                and run.output_payload ->> 'altText' =
                    ready_variant.alt_text
                and ready_variant.hashtags = coalesce((
                  select pg_catalog.jsonb_agg(
                    hashtag.value ->> 'tag'
                    order by selected.position
                  )
                  from pg_catalog.jsonb_array_elements_text(
                    output_variant.value -> 'hashtagIds'
                  ) with ordinality selected(id, position)
                  join pg_catalog.jsonb_array_elements(
                    run.output_payload -> 'hashtags'
                  ) hashtag(value)
                    on hashtag.value ->> 'id' = selected.id
                ), '[]'::jsonb)
                and ready_variant.seo_phrases = coalesce((
                  select pg_catalog.jsonb_agg(
                    phrase.value ->> 'phrase'
                    order by selected.position
                  )
                  from pg_catalog.jsonb_array_elements_text(
                    output_variant.value -> 'seoPhraseIds'
                  ) with ordinality selected(id, position)
                  join pg_catalog.jsonb_array_elements(
                    run.output_payload -> 'seoPhrases'
                  ) phrase(value)
                    on phrase.value ->> 'id' = selected.id
                ), '[]'::jsonb)
            )
          )
      )
      and not exists (
        select 1
        from pg_catalog.jsonb_array_elements(
          run.output_payload -> 'variants'
        ) output_variant(value)
        where not exists (
          select 1
          from public.veroxa_momo_ready_variants_v2 ready_variant
          where ready_variant.ready_package_id = ready.id
            and ready_variant.platform =
                  output_variant.value ->> 'platform'
        )
      )
  );
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

  source_current := coalesce(
    veroxa_private.momo_content_ai_post_provider_evidence_v2(run.id),
    false
  );

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

revoke all on function
  veroxa_private.momo_ready_variants_current_v2(uuid),
  veroxa_private.momo_ready_review_snapshot_v2(uuid)
  from public, anon, authenticated, service_role;

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
    decision.id,
    decision.decided_by,
    decision.decided_at,
    decision.decision_reason,
    decision.decision,
    decision.review_snapshot_sha256,
    decision.inspection_attestation_version,
    decision.inspection_attestation_text,
    decision.inspection_attestation_sha256,
    snapshot.review_snapshot_sha256,
    case
      when decision.id is null
        then snapshot.review_snapshot_sha256 is not null
      else decision.review_snapshot_sha256 =
        snapshot.review_snapshot_sha256
    end,
    (
      decision.decision = 'approved_for_manual_export'
      and decision.review_snapshot_sha256 =
        snapshot.review_snapshot_sha256
      and snapshot.checks_current
    ),
    false,
    case
      when decision.id is not null
        and decision.review_snapshot_sha256 <>
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
  normalized_reason text;
  attestation_version text;
  attestation_text text;
  attestation_sha text;
  request_sha text;
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

  select target.* into existing
  from veroxa_private.momo_ready_decisions_v2 target
  where target.ready_package_id = ready.id
  for update;

  if found then
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
  else
    -- Only a first terminal insert requires the submitted snapshot to still
    -- equal authoritative current evidence. Exact terminal replays reconcile
    -- against readback and may therefore return blocked/stale safely.
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
        'reviewSnapshotSha256',
          existing.review_snapshot_sha256,
        'inspectionAttestationVersion',
          existing.inspection_attestation_version,
        'inspectionAttestationSha256',
          existing.inspection_attestation_sha256,
        'externalWriteAllowed', false
      )
    );
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

revoke all on function
  public.veroxa_momo_ready_review_status_v2(uuid,uuid),
  public.veroxa_decide_momo_ready_package_v2(
    uuid,text,text,text,text
  )
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_ready_review_status_v2(uuid,uuid),
  public.veroxa_decide_momo_ready_package_v2(
    uuid,text,text,text,text
  )
  to authenticated;

-- Reassert lifecycle ACLs after replacing their definitions.
revoke all on function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1(),
  veroxa_private.guard_momo_ready_package_v4(),
  veroxa_private.momo_advance_verified_asset_v2(jsonb),
  veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  from public, anon, authenticated, service_role;

revoke all on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,text,uuid,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,text,uuid,text,uuid
) to service_role;

revoke all on function public.veroxa_stage_momo_content_ai_result_v1(
  uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_stage_momo_content_ai_result_v1(
  uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) to service_role;

revoke all on function
  public.veroxa_complete_staged_momo_content_ai_run_v1(uuid,text,uuid),
  public.veroxa_complete_momo_content_ai_run_v1(
    uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_momo_upload_pipeline_v2(text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_complete_staged_momo_content_ai_run_v1(uuid,text,uuid),
  public.veroxa_complete_momo_content_ai_run_v1(
    uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_momo_upload_pipeline_v2(text,jsonb)
  to service_role;

revoke all on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid,uuid,text,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid,uuid,text,text,text
) to authenticated;

revoke all on function public.veroxa_momo_ready_package_status_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_ready_package_status_v1(uuid)
  to authenticated;
