-- Bind signed OpenAI webhook work to the exact verified header/body pair and
-- to a caller-owned, expiring claim. All webhook lifecycle mutations below
-- verify ownership while holding run -> event locks in one transaction.

-- Freeze both identity surfaces in runtime lock order. This also closes the
-- historical check-then-write race around provider response IDs before the
-- unique index is installed.
lock table public.veroxa_momo_content_ai_runs
  in access exclusive mode;
lock table veroxa_private.momo_content_ai_webhook_events
  in access exclusive mode;
do $$
begin
  if exists (
    select run.provider_response_id
    from public.veroxa_momo_content_ai_runs run
    where run.provider_response_id is not null
    group by run.provider_response_id
    having pg_catalog.count(*) > 1
  ) then
    raise exception using errcode = '55000',
      message = 'momo_provider_response_unique_requires_no_duplicates';
  end if;
  if exists (
    select 1 from veroxa_private.momo_content_ai_webhook_events
  ) then
    raise exception using errcode = '55000',
      message = 'momo_webhook_claim_lease_requires_empty_event_table';
  end if;
end;
$$;

create unique index veroxa_momo_content_ai_provider_response_id_key
  on public.veroxa_momo_content_ai_runs (provider_response_id)
  where provider_response_id is not null;

drop trigger momo_content_ai_webhook_event_guard
  on veroxa_private.momo_content_ai_webhook_events;
drop trigger momo_content_ai_webhook_event_consistency
  on veroxa_private.momo_content_ai_webhook_events;

alter table veroxa_private.momo_content_ai_webhook_events
  add column webhook_id text not null,
  add column claim_token uuid not null,
  add column claim_lease_expires_at timestamptz,
  add column claim_attempts smallint not null default 1,
  add constraint momo_content_ai_webhook_events_webhook_id_v1 check (
    webhook_id = pg_catalog.btrim(webhook_id)
    and pg_catalog.char_length(webhook_id) <= 200
    and webhook_id ~ '^wh_[A-Za-z0-9_-]{8,196}$'
  ),
  add constraint momo_content_ai_webhook_events_webhook_id_key
    unique (webhook_id),
  add constraint momo_content_ai_webhook_events_claim_token_v1 check (
    claim_token <> '00000000-0000-0000-0000-000000000000'::uuid
  ),
  add constraint momo_content_ai_webhook_events_claim_attempts_v1 check (
    claim_attempts between 1 and 1000
  ),
  add constraint momo_content_ai_webhook_events_claim_lease_v1 check (
    coalesce(
      (state = 'claimed'
        and claim_lease_expires_at is not null
        and claim_lease_expires_at
          <= updated_at + interval '5 minutes')
      or (state in ('processed','failed')
        and claim_lease_expires_at is null),
      false
    )
  );

create index momo_content_ai_webhook_events_claim_lease_idx
  on veroxa_private.momo_content_ai_webhook_events
    (claim_lease_expires_at, event_id)
  where state = 'claimed';

create or replace function
  veroxa_private.guard_momo_content_ai_webhook_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  observed_at timestamptz := pg_catalog.clock_timestamp();
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_is_immutable';
  end if;
  if old.event_id is distinct from new.event_id
     or old.webhook_id is distinct from new.webhook_id
     or old.provider_response_id is distinct from new.provider_response_id
     or old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.claimed_at is distinct from new.claimed_at then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_is_immutable';
  end if;

  if old.state = 'claimed' and new.state = 'claimed' then
    if old.claim_lease_expires_at > observed_at
       or new.claim_token is null
       or new.claim_token =
         '00000000-0000-0000-0000-000000000000'::uuid
       or new.claim_lease_expires_at is null
       or new.claim_lease_expires_at <= observed_at
       or new.claim_lease_expires_at > observed_at + interval '5 minutes'
       or new.claim_attempts <> old.claim_attempts + 1
       or new.error_code is not null
       or new.finished_at is not null then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_claim_cas_invalid';
    end if;
  elsif old.state = 'claimed'
      and new.state in ('processed','failed') then
    if old.claim_lease_expires_at <= observed_at
       or new.claim_token is distinct from old.claim_token
       or new.claim_attempts <> old.claim_attempts
       or new.claim_lease_expires_at is not null then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_webhook_event_is_immutable';
    end if;
  else
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_is_immutable';
  end if;
  new.updated_at := observed_at;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_webhook_event_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_webhook_event_guard
before update or delete on veroxa_private.momo_content_ai_webhook_events
for each row execute function
  veroxa_private.guard_momo_content_ai_webhook_event_v1();

create or replace function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_run_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_webhook_event_consistency
before insert or update on veroxa_private.momo_content_ai_webhook_events
for each row execute function
  veroxa_private.enforce_momo_content_ai_webhook_event_consistency_v1();

-- Tokenless webhook entry points cannot participate in claim ownership.
revoke all on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,uuid,text
) from public, anon, authenticated, service_role;
drop function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,uuid,text
);
revoke all on function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,text,text
) from public, anon, authenticated, service_role;
drop function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,text,text
);

create function public.veroxa_claim_momo_content_ai_webhook_v1(
  p_event_id text,
  p_webhook_id text,
  p_provider_response_id text,
  p_run_id uuid,
  p_request_hash text,
  p_claim_token uuid
)
returns table (
  run_id uuid, run_status text, request_hash text,
  source_storage_path text, source_mime_type text, source_file_size bigint,
  source_content_sha256 text, source_width integer, source_height integer,
  target_platforms jsonb, truth_snapshot jsonb, truth_snapshot_sha256 text,
  reserved_microusd bigint, provider_response_id text, output_payload jsonb,
  provider_error_code text, requested_by uuid, event_status text,
  event_id text, webhook_id text, webhook_claim_token uuid,
  webhook_claim_lease_expires_at timestamptz,
  owns_webhook_claim boolean, webhook_claim_status text
)
language plpgsql
security definer
set search_path = ''
as $$
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
     or run.prompt_version <> 'momo-content-package-2026-08-01-v4'
     or run.validator_version <> 'momo-content-validator-2026-08-01-v4' then
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
$$;
revoke all on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,text,uuid,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_claim_momo_content_ai_webhook_v1(
  text,text,text,uuid,text,uuid
) to service_role;

create or replace function
  veroxa_private.assert_momo_content_ai_webhook_claim_v1(
    p_event_id text,
    p_webhook_id text,
    p_claim_token uuid,
    p_run_id uuid,
    p_request_hash text,
    p_provider_response_id text
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  webhook_event veroxa_private.momo_content_ai_webhook_events%rowtype;
begin
  if p_event_id is null
     or p_event_id !~ '^evt_[A-Za-z0-9_-]{8,196}$'
     or pg_catalog.char_length(p_event_id) > 200
     or p_webhook_id is null
     or p_webhook_id !~ '^wh_[A-Za-z0-9_-]{8,196}$'
     or pg_catalog.char_length(p_webhook_id) > 200
     or p_claim_token is null
     or p_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_run_id is null
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_webhook_ownership';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or (p_provider_response_id is not null
       and run.provider_response_id is distinct from p_provider_response_id) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_run_invalid';
  end if;
  select * into webhook_event
  from veroxa_private.momo_content_ai_webhook_events target_event
  where target_event.event_id = p_event_id
  for update;
  if not found
     or webhook_event.webhook_id is distinct from p_webhook_id
     or webhook_event.run_id is distinct from run.id
     or webhook_event.request_hash is distinct from run.request_hash
     or webhook_event.restaurant_id is distinct from run.restaurant_id
     or webhook_event.provider_response_id is distinct from run.provider_response_id
     or webhook_event.claim_token is distinct from p_claim_token
     or webhook_event.state <> 'claimed'
     or webhook_event.claim_lease_expires_at
        <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '55P03',
      message = 'momo_content_ai_webhook_ownership_required';
  end if;
end;
$$;
revoke all on function
  veroxa_private.assert_momo_content_ai_webhook_claim_v1(
    text,text,uuid,uuid,text,text
  ) from public, anon, authenticated, service_role;

create function public.veroxa_stage_momo_content_ai_webhook_result_v1(
  p_event_id text,
  p_webhook_id text,
  p_claim_token uuid,
  p_run_id uuid,
  p_request_hash text,
  p_provider_response_id text,
  p_output_payload jsonb,
  p_output_canonical text,
  p_output_sha256 text,
  p_validation_report jsonb,
  p_validation_canonical text,
  p_validation_sha256 text,
  p_accounted_microusd bigint,
  p_accounting_basis text,
  p_provider_usage jsonb,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.assert_momo_content_ai_webhook_claim_v1(
    p_event_id, p_webhook_id, p_claim_token, p_run_id,
    p_request_hash, p_provider_response_id
  );
  return public.veroxa_stage_momo_content_ai_result_v1(
    p_run_id, p_request_hash, p_provider_response_id,
    p_output_payload, p_output_canonical, p_output_sha256,
    p_validation_report, p_validation_canonical, p_validation_sha256,
    p_accounted_microusd, p_accounting_basis, p_provider_usage, p_actor_id
  );
end;
$$;
revoke all on function public.veroxa_stage_momo_content_ai_webhook_result_v1(
  text,text,uuid,uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_stage_momo_content_ai_webhook_result_v1(
  text,text,uuid,uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid
) to service_role;

create function public.veroxa_complete_staged_momo_content_ai_webhook_v1(
  p_event_id text,
  p_webhook_id text,
  p_claim_token uuid,
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.assert_momo_content_ai_webhook_claim_v1(
    p_event_id, p_webhook_id, p_claim_token, p_run_id,
    p_request_hash, null
  );
  return public.veroxa_complete_staged_momo_content_ai_run_v1(
    p_run_id, p_request_hash, p_actor_id
  );
end;
$$;
revoke all on function
  public.veroxa_complete_staged_momo_content_ai_webhook_v1(
    text,text,uuid,uuid,text,uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_complete_staged_momo_content_ai_webhook_v1(
    text,text,uuid,uuid,text,uuid
  ) to service_role;

create function public.veroxa_fail_momo_content_ai_webhook_v1(
  p_event_id text,
  p_webhook_id text,
  p_claim_token uuid,
  p_run_id uuid,
  p_request_hash text,
  p_provider_response_id text,
  p_error_code text,
  p_provider_called boolean,
  p_accounted_microusd bigint,
  p_provider_usage jsonb,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.assert_momo_content_ai_webhook_claim_v1(
    p_event_id, p_webhook_id, p_claim_token, p_run_id,
    p_request_hash, p_provider_response_id
  );
  return public.veroxa_fail_momo_content_ai_run_v1(
    p_run_id, p_request_hash, p_provider_response_id, p_error_code,
    p_provider_called, p_accounted_microusd, p_provider_usage, p_actor_id
  );
end;
$$;
revoke all on function public.veroxa_fail_momo_content_ai_webhook_v1(
  text,text,uuid,uuid,text,text,text,boolean,bigint,jsonb,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_fail_momo_content_ai_webhook_v1(
  text,text,uuid,uuid,text,text,text,boolean,bigint,jsonb,uuid
) to service_role;

create function public.veroxa_finish_momo_content_ai_webhook_v1(
  p_event_id text,
  p_webhook_id text,
  p_claim_token uuid,
  p_provider_response_id text,
  p_run_id uuid,
  p_request_hash text,
  p_outcome text,
  p_error_code text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  webhook_event veroxa_private.momo_content_ai_webhook_events%rowtype;
  changed_rows integer;
begin
  if p_outcome is null
     or p_outcome not in ('processed','failed')
     or (p_outcome = 'processed' and p_error_code is not null)
     or (p_outcome = 'failed' and (
       p_error_code is null or p_error_code !~ '^[a-z0-9_]{3,80}$'
     )) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_content_ai_webhook_finish';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  if not found
     or run.request_hash is distinct from p_request_hash
     or run.provider_response_id is distinct from p_provider_response_id
     or not run.provider_called
     or run.provider_started_at is null
     or (p_outcome = 'processed'
       and run.status not in ('pending_review','materialized','rejected'))
     or (p_outcome = 'failed' and (
       run.status <> 'failed'
       or p_error_code is distinct from run.provider_error_code
     )) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_outcome_invalid';
  end if;
  select * into webhook_event
  from veroxa_private.momo_content_ai_webhook_events target_event
  where target_event.event_id = p_event_id
  for update;
  if not found
     or webhook_event.webhook_id is distinct from p_webhook_id
     or webhook_event.provider_response_id is distinct from p_provider_response_id
     or webhook_event.run_id is distinct from run.id
     or webhook_event.request_hash is distinct from run.request_hash
     or webhook_event.restaurant_id is distinct from run.restaurant_id
     or webhook_event.claim_token is distinct from p_claim_token then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_event_invalid';
  end if;

  if webhook_event.state <> 'claimed' then
    if webhook_event.state = p_outcome
       and webhook_event.error_code is not distinct from p_error_code then
      return webhook_event.event_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_webhook_finish_conflict';
  end if;
  if webhook_event.claim_lease_expires_at
       <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '55P03',
      message = 'momo_content_ai_webhook_ownership_required';
  end if;

  update veroxa_private.momo_content_ai_webhook_events target_event
  set state = p_outcome,
      error_code = p_error_code,
      claim_lease_expires_at = null,
      finished_at = pg_catalog.clock_timestamp()
  where target_event.event_id = webhook_event.event_id
    and target_event.webhook_id = webhook_event.webhook_id
    and target_event.state = 'claimed'
    and target_event.claim_token = p_claim_token
    and target_event.claim_lease_expires_at
      = webhook_event.claim_lease_expires_at
    and target_event.claim_lease_expires_at > pg_catalog.clock_timestamp();
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_webhook_finish_cas_failed';
  end if;
  return webhook_event.event_id;
end;
$$;
revoke all on function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,uuid,text,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_finish_momo_content_ai_webhook_v1(
  text,text,uuid,text,uuid,text,text,text
) to service_role;

-- Close the abort-before-delayed-start race. A pristine reserved abort writes
-- an immutable tombstone for that exact token; a delayed start then rejects the
-- used token. If start won the run lock first, abort resets only its active token.
create or replace function public.veroxa_abort_momo_content_ai_before_provider_v1(
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
  existing_claim veroxa_private.momo_content_ai_dispatch_claims%rowtype;
  changed_rows integer;
  observed_at timestamptz;
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
  if not found
     or run.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_abort_before_provider_rejected';
  end if;
  observed_at := pg_catalog.clock_timestamp();

  select * into existing_claim
  from veroxa_private.momo_content_ai_dispatch_claims claim
  where claim.dispatch_claim_token = p_dispatch_claim_token;

  if run.status = 'reserved'
     and not run.provider_called
     and run.provider_started_at is null
     and run.provider_response_id is null
     and run.dispatch_claim_token is null
     and run.provider_usage is null
     and run.output_payload is null
     and run.output_canonical is null
     and run.output_sha256 is null
     and run.validation_report is null
     and run.validation_canonical is null
     and run.validation_sha256 is null
     and run.provider_error_code is null
     and run.accounted_microusd is null
     and run.accounting_basis is null
     and run.completed_at is null
     and not exists (
       select 1 from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
     )
     and not exists (
       select 1 from veroxa_private.momo_content_ai_webhook_events event
       where event.run_id = run.id
     )
     and exists (
       select 1 from veroxa_private.momo_ai_cost_ledger ledger
       where ledger.operation_kind = 'content_package'
         and ledger.source_id = run.id
         and ledger.restaurant_id = run.restaurant_id
         and ledger.idempotency_hash = run.idempotency_hash
         and ledger.state = 'reserved'
         and not ledger.provider_called
         and ledger.reserved_microusd = run.reserved_microusd
         and ledger.accounted_microusd is null
         and ledger.accounting_basis is null
     ) then
    if existing_claim.dispatch_claim_token is not null then
      if existing_claim.run_id = run.id
         and existing_claim.request_hash = run.request_hash
         and existing_claim.restaurant_id = run.restaurant_id
         and existing_claim.claimed_by = p_actor_id
         and existing_claim.state = 'aborted' then
        return run.id;
      end if;
      raise exception using errcode = '23505',
        message = 'momo_content_ai_abort_before_provider_token_conflict';
    end if;
    insert into veroxa_private.momo_content_ai_dispatch_claims (
      dispatch_claim_token, run_id, request_hash, restaurant_id, claimed_by,
      state, claimed_at, cleared_at
    ) values (
      p_dispatch_claim_token, run.id, run.request_hash, run.restaurant_id,
      p_actor_id, 'aborted', observed_at, observed_at
    );
    return run.id;
  end if;

  if run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is not null
     or run.dispatch_claim_token is distinct from p_dispatch_claim_token
     or existing_claim.run_id is distinct from run.id
     or existing_claim.request_hash is distinct from run.request_hash
     or existing_claim.restaurant_id is distinct from run.restaurant_id
     or existing_claim.claimed_by is distinct from p_actor_id
     or existing_claim.state is distinct from 'active'
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
      message = 'momo_content_ai_abort_before_provider_invalid';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'reserved',
      provider_called = false,
      provider_started_at = null,
      dispatch_claim_token = null,
      reservation_lease_expires_at =
        pg_catalog.clock_timestamp() + interval '15 minutes',
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id
    and target_run.status = 'provider_running'
    and target_run.provider_called
    and target_run.provider_response_id is null
    and target_run.dispatch_claim_token = p_dispatch_claim_token;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_abort_before_provider_race';
  end if;

  update veroxa_private.momo_ai_cost_ledger ledger
  set provider_called = false,
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
      message = 'momo_content_ai_abort_before_provider_ledger_invalid';
  end if;
  return run.id;
end;
$$;
revoke all on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid,uuid
) to service_role;

comment on column
  veroxa_private.momo_content_ai_webhook_events.webhook_id is
  'Verified OpenAI webhook-id header, uniquely bound to the body event ID.';
comment on column
  veroxa_private.momo_content_ai_webhook_events.claim_token is
  'Durable caller-owned webhook processing claim; exact retries preserve ownership and expired leases may be reclaimed by CAS.';
