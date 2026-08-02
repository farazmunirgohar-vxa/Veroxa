-- Terminally reconcile provider dispatches that never acquire a response ID.
-- OpenAI does not document idempotent Responses creation, so an ambiguous
-- transport may never be redispatched. A signed webhook may bind the response
-- for 72 hours; after a 96-hour safety window, the database closes the run and
-- conservatively accounts the full reservation instead of leaving it stuck.

lock table public.veroxa_momo_content_ai_runs in access exclusive mode;
lock table veroxa_private.momo_ai_cost_ledger in share row exclusive mode;
lock table veroxa_private.momo_content_ai_dispatch_claims
  in share row exclusive mode;
lock table veroxa_private.momo_content_ai_webhook_events
  in share row exclusive mode;
lock table veroxa_private.momo_content_ai_result_outbox
  in share row exclusive mode;

alter table public.veroxa_momo_content_ai_runs
  drop constraint veroxa_momo_content_ai_runs_check1;

alter table public.veroxa_momo_content_ai_runs
  add constraint veroxa_momo_content_ai_runs_check1 check (coalesce(
    (status = 'reserved'
      and not provider_called and provider_started_at is null
      and provider_response_id is null and provider_usage is null
      and output_payload is null and output_canonical is null
      and output_sha256 is null and validation_report is null
      and validation_canonical is null and validation_sha256 is null
      and provider_error_code is null and accounted_microusd is null
      and accounting_basis is null and completed_at is null
      and team_decided_by is null and team_decided_at is null
      and decision_notes is null)
    or (status = 'provider_running'
      and provider_called and provider_started_at is not null
      and provider_usage is null and output_payload is null
      and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null
      and validation_sha256 is null and provider_error_code is null
      and accounted_microusd is null and accounting_basis is null
      and completed_at is null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'result_staged'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null
      and output_payload is not null and output_canonical is not null
      and output_sha256 is not null and validation_report is not null
      and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'pending_review'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null
      and output_payload is not null and output_canonical is not null
      and output_sha256 is not null and validation_report is not null
      and validation_canonical is not null and validation_sha256 is not null
      and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is null
      and team_decided_at is null and decision_notes is null)
    or (status = 'materialized'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null and output_payload is not null
      and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null
      and validation_sha256 is not null and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is not null
      and team_decided_at is not null and decision_notes is null)
    or (status = 'rejected'
      and provider_called and provider_started_at is not null
      and provider_response_id is not null and output_payload is not null
      and output_canonical is not null and output_sha256 is not null
      and validation_report is not null and validation_canonical is not null
      and validation_sha256 is not null and provider_error_code is null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate','conservative_reservation'
      )
      and ((accounting_basis = 'provider_usage_estimate'
          and pg_catalog.jsonb_typeof(provider_usage) = 'object')
        or (accounting_basis = 'conservative_reservation'
          and provider_usage is null))
      and completed_at is not null and team_decided_by is not null
      and team_decided_at is not null and decision_notes is not null)
    or (status = 'failed'
      and output_payload is null
      and output_canonical is null and output_sha256 is null
      and validation_report is null and validation_canonical is null
      and validation_sha256 is null and provider_error_code is not null
      and completed_at is not null and team_decided_by is null
      and team_decided_at is null and decision_notes is null
      and ((provider_called and provider_started_at is not null
        and (
          (provider_response_id is not null and (
            (provider_usage is null
              and accounted_microusd = reserved_microusd
              and accounting_basis = 'conservative_reservation')
            or (pg_catalog.jsonb_typeof(provider_usage) = 'object'
              and accounted_microusd between 1 and 100000000
              and accounting_basis = 'provider_usage_estimate')
          ))
          or (provider_response_id is null
            and provider_usage is null
            and provider_error_code in (
              'provider_http_error_without_response',
              'provider_identity_timeout'
            )
            and accounted_microusd = reserved_microusd
            and accounting_basis = 'conservative_reservation')
        ))
        or (not provider_called and provider_started_at is null
          and provider_response_id is null
          and provider_usage is null and accounted_microusd = 0
          and accounting_basis = 'zero_pre_provider'))),
    false
  ));

create function public.veroxa_fail_unbound_momo_content_ai_dispatch_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid,
  p_dispatch_claim_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  claim veroxa_private.momo_content_ai_dispatch_claims%rowtype;
  changed_rows integer;
begin
  if p_dispatch_claim_token is null
     or p_dispatch_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_claim_invalid';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into claim
  from veroxa_private.momo_content_ai_dispatch_claims target_claim
  where target_claim.dispatch_claim_token = p_dispatch_claim_token
  for update;

  if not found
     or run.request_hash is distinct from p_request_hash
     or claim.run_id is distinct from run.id
     or claim.request_hash is distinct from run.request_hash
     or claim.restaurant_id is distinct from run.restaurant_id
     or claim.claimed_by is distinct from p_actor_id
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_unbound_failure_rejected';
  end if;

  if run.status = 'failed' then
    if run.provider_called
       and run.provider_started_at is not null
       and run.provider_response_id is null
       and run.provider_usage is null
       and run.provider_error_code = 'provider_http_error_without_response'
       and run.accounted_microusd = run.reserved_microusd
       and run.accounting_basis = 'conservative_reservation'
       and run.completed_at is not null
       and claim.state = 'terminal'
       and exists (
         select 1 from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = run.id
           and ledger.restaurant_id = run.restaurant_id
           and ledger.idempotency_hash = run.idempotency_hash
           and ledger.state = 'uncertain'
           and ledger.provider_called
           and ledger.reserved_microusd = run.reserved_microusd
           and ledger.accounted_microusd = run.reserved_microusd
           and ledger.accounting_basis = 'conservative_reservation'
       ) then
      return run.id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_unbound_failure_replay_conflict';
  end if;

  if run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is not null
     or run.dispatch_claim_token is distinct from p_dispatch_claim_token
     or claim.state <> 'active'
     or run.provider_usage is not null
     or run.output_payload is not null
     or run.output_canonical is not null
     or run.output_sha256 is not null
     or run.validation_report is not null
     or run.validation_canonical is not null
     or run.validation_sha256 is not null
     or run.provider_error_code is not null
     or run.accounted_microusd is not null
     or run.accounting_basis is not null
     or run.completed_at is not null
     or exists (
       select 1 from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
     )
     or exists (
       select 1 from veroxa_private.momo_content_ai_webhook_events event
       where event.run_id = run.id
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_unbound_failure_state_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'failed',
      provider_error_code = 'provider_http_error_without_response',
      accounted_microusd = target_run.reserved_microusd,
      accounting_basis = 'conservative_reservation',
      completed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id
    and target_run.status = 'provider_running'
    and target_run.dispatch_claim_token = p_dispatch_claim_token
    and target_run.provider_response_id is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_unbound_failure_race';
  end if;

  update veroxa_private.momo_ai_cost_ledger ledger
  set state = 'uncertain',
      provider_called = true,
      accounted_microusd = run.reserved_microusd,
      accounting_basis = 'conservative_reservation',
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
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_unbound_failure_ledger_invalid';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_fail_unbound_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_fail_unbound_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid
) to service_role;

create function veroxa_private.expire_momo_content_ai_unbound_dispatches_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  changed_rows integer;
  expired_count bigint := 0;
begin
  for run in
    select target_run.*
    from public.veroxa_momo_content_ai_runs target_run
    where target_run.status = 'provider_running'
      and target_run.provider_called
      and target_run.provider_started_at <=
        pg_catalog.clock_timestamp() - interval '96 hours'
      and target_run.provider_response_id is null
      and target_run.dispatch_claim_token is not null
      and target_run.provider_usage is null
      and target_run.output_payload is null
      and target_run.validation_report is null
      and target_run.provider_error_code is null
      and target_run.accounted_microusd is null
      and target_run.accounting_basis is null
      and target_run.completed_at is null
      and not exists (
        select 1 from veroxa_private.momo_content_ai_result_outbox outbox
        where outbox.run_id = target_run.id
      )
      and not exists (
        select 1 from veroxa_private.momo_content_ai_webhook_events event
        where event.run_id = target_run.id
      )
      and exists (
        select 1
        from veroxa_private.momo_content_ai_dispatch_claims claim
        where claim.dispatch_claim_token = target_run.dispatch_claim_token
          and claim.run_id = target_run.id
          and claim.request_hash = target_run.request_hash
          and claim.restaurant_id = target_run.restaurant_id
          and claim.state = 'active'
      )
    order by target_run.provider_started_at, target_run.id
    for update of target_run skip locked
  loop
    update public.veroxa_momo_content_ai_runs target_run
    set status = 'failed',
        provider_error_code = 'provider_identity_timeout',
        accounted_microusd = target_run.reserved_microusd,
        accounting_basis = 'conservative_reservation',
        completed_at = pg_catalog.clock_timestamp(),
        updated_at = pg_catalog.clock_timestamp()
    where target_run.id = run.id
      and target_run.status = 'provider_running'
      and target_run.dispatch_claim_token = run.dispatch_claim_token
      and target_run.provider_response_id is null;
    get diagnostics changed_rows = row_count;
    if changed_rows <> 1 then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_unbound_expiry_race';
    end if;

    update veroxa_private.momo_ai_cost_ledger ledger
    set state = 'uncertain',
        provider_called = true,
        accounted_microusd = run.reserved_microusd,
        accounting_basis = 'conservative_reservation',
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
    get diagnostics changed_rows = row_count;
    if changed_rows <> 1 then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_unbound_expiry_ledger_invalid';
    end if;
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end;
$$;
revoke all on function
  veroxa_private.expire_momo_content_ai_unbound_dispatches_v1()
  from public, anon, authenticated, service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'veroxa-momo-content-ai-unbound-recovery'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'veroxa-momo-content-ai-unbound-recovery',
    '*/15 * * * *',
    'select veroxa_private.expire_momo_content_ai_unbound_dispatches_v1();'
  );
end $$;

comment on function
  veroxa_private.expire_momo_content_ai_unbound_dispatches_v1() is
  'Every 15 minutes, closes response-ID-less Momo provider dispatches only after OpenAI webhook retries have exceeded their documented 72-hour window; never redispatches an ambiguous paid request.';
