-- Bind each provider dispatch to the exact server request that won the
-- reserved -> provider_running transition. This is forward-only hardening over
-- the applied v4 upload-to-Ready contract and advisor index migration.

alter table public.veroxa_momo_content_ai_runs
  add column dispatch_claim_token uuid;

-- The synchronization token is server-only. Preserve the existing Team
-- readback surface column-by-column without exposing the new token through a
-- broad table SELECT grant.
revoke select on table public.veroxa_momo_content_ai_runs
  from authenticated;
do $$
declare
  readable_columns text;
begin
  select pg_catalog.string_agg(
    pg_catalog.quote_ident(attribute.attname), ', '
    order by attribute.attnum
  ) into readable_columns
  from pg_catalog.pg_attribute attribute
  where attribute.attrelid =
      'public.veroxa_momo_content_ai_runs'::pg_catalog.regclass
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attname <> 'dispatch_claim_token';
  if readable_columns is null then
    raise exception using errcode = '55000',
      message = 'momo_dispatch_claim_read_surface_unavailable';
  end if;
  execute pg_catalog.format(
    'grant select (%s) on table public.veroxa_momo_content_ai_runs to authenticated',
    readable_columns
  );
end;
$$;

-- A provider-running row without a response ID predating this contract cannot
-- be assigned a trustworthy caller-owned token. Fail the migration closed and
-- require manual reconciliation instead of inventing ownership.
do $$
begin
  if exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    where run.status = 'provider_running'
      and run.provider_response_id is null
  ) then
    raise exception using errcode = '55000',
      message = 'momo_dispatch_claim_requires_no_legacy_ambiguous_run';
  end if;
end;
$$;

alter table public.veroxa_momo_content_ai_runs
  add constraint veroxa_momo_content_ai_dispatch_claim_state_v1 check (
    coalesce(
      (status = 'provider_running'
        and provider_response_id is null
        and dispatch_claim_token is not null)
      or ((status <> 'provider_running' or provider_response_id is not null)
        and dispatch_claim_token is null),
      false
    )
  );

create unique index veroxa_momo_content_ai_active_dispatch_claim_idx
  on public.veroxa_momo_content_ai_runs (dispatch_claim_token)
  where dispatch_claim_token is not null;

create table veroxa_private.momo_content_ai_dispatch_claims (
  dispatch_claim_token uuid primary key check (
    dispatch_claim_token <>
      '00000000-0000-0000-0000-000000000000'::uuid
  ),
  run_id uuid not null references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  claimed_by uuid not null references public.veroxa_user_profiles(user_id)
    on delete restrict,
  state text not null default 'active' check (
    state in ('active','response_bound','aborted','terminal')
  ),
  claimed_at timestamptz not null default pg_catalog.clock_timestamp(),
  cleared_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (coalesce(
    (state = 'active' and cleared_at is null)
    or (state in ('response_bound','aborted','terminal')
      and cleared_at is not null),
    false
  ))
);

alter table veroxa_private.momo_content_ai_dispatch_claims
  enable row level security;
alter table veroxa_private.momo_content_ai_dispatch_claims
  force row level security;
revoke all on table veroxa_private.momo_content_ai_dispatch_claims
  from public, anon, authenticated, service_role;

create index momo_content_ai_dispatch_claims_run_state_idx
  on veroxa_private.momo_content_ai_dispatch_claims
    (run_id, state, claimed_at);
create index momo_content_ai_dispatch_claims_restaurant_idx
  on veroxa_private.momo_content_ai_dispatch_claims (restaurant_id);
create index momo_content_ai_dispatch_claims_claimed_by_idx
  on veroxa_private.momo_content_ai_dispatch_claims (claimed_by);

create or replace function
  veroxa_private.guard_momo_content_ai_dispatch_claim_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_is_immutable';
  end if;
  if old.dispatch_claim_token is distinct from new.dispatch_claim_token
     or old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.claimed_by is distinct from new.claimed_by
     or old.claimed_at is distinct from new.claimed_at
     or old.state <> 'active'
     or new.state not in ('response_bound','aborted','terminal') then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_is_immutable';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_dispatch_claim_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_claim_guard
before update or delete on veroxa_private.momo_content_ai_dispatch_claims
for each row execute function
  veroxa_private.guard_momo_content_ai_dispatch_claim_v1();

create or replace function
  veroxa_private.enforce_momo_content_ai_dispatch_claim_consistency_v1()
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
     or (new.state = 'active' and (
       run.status <> 'provider_running'
       or not run.provider_called
       or run.provider_started_at is null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is distinct from new.dispatch_claim_token
     ))
     or (new.state = 'response_bound' and (
       run.provider_response_id is null
       or run.dispatch_claim_token is not null
     ))
     or (new.state = 'aborted' and (
       run.status <> 'reserved'
       or run.provider_called
       or run.provider_started_at is not null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is not null
     ))
     or (new.state = 'terminal' and (
       run.status not in ('result_staged','pending_review','materialized',
         'rejected','failed')
       or run.dispatch_claim_token is not null
     )) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_run_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_dispatch_claim_consistency_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_claim_consistency
before insert or update on veroxa_private.momo_content_ai_dispatch_claims
for each row execute function
  veroxa_private.enforce_momo_content_ai_dispatch_claim_consistency_v1();

-- The active token is immutable while provider identity is ambiguous. Once a
-- response is bound or the run leaves provider_running, clear it atomically.
create or replace function
  veroxa_private.guard_momo_content_ai_run_dispatch_claim_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'provider_running'
     or new.provider_response_id is not null then
    new.dispatch_claim_token := null;
  end if;

  if old.dispatch_claim_token is null
     and new.dispatch_claim_token is not null
     and not (
       old.status = 'reserved'
       and not old.provider_called
       and old.provider_response_id is null
       and new.status = 'provider_running'
       and new.provider_called
       and new.provider_started_at is not null
       and new.provider_response_id is null
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_transition_invalid';
  end if;

  if old.dispatch_claim_token is not null
     and new.dispatch_claim_token is distinct from old.dispatch_claim_token
     and not (
       old.status = 'provider_running'
       and old.provider_called
       and old.provider_started_at is not null
       and old.provider_response_id is null
       and new.dispatch_claim_token is null
       and (new.status <> 'provider_running'
         or new.provider_response_id is not null)
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_transition_invalid';
  end if;

  if new.status = 'provider_running'
     and new.provider_response_id is null
     and new.dispatch_claim_token is null then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_required';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_run_dispatch_claim_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_run_dispatch_claim_guard
before update on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.guard_momo_content_ai_run_dispatch_claim_v1();

create or replace function
  veroxa_private.sync_momo_content_ai_dispatch_claim_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_state text;
  changed_rows integer;
begin
  if old.dispatch_claim_token is null
     or new.dispatch_claim_token is not null then
    return new;
  end if;

  next_state := case
    when new.provider_response_id is not null then 'response_bound'
    when new.status = 'reserved' then 'aborted'
    else 'terminal'
  end;
  update veroxa_private.momo_content_ai_dispatch_claims claim
  set state = next_state,
      cleared_at = pg_catalog.clock_timestamp()
  where claim.dispatch_claim_token = old.dispatch_claim_token
    and claim.run_id = old.id
    and claim.request_hash = old.request_hash
    and claim.restaurant_id = old.restaurant_id
    and claim.state = 'active';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_sync_failed';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.sync_momo_content_ai_dispatch_claim_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_run_dispatch_claim_sync
after update on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.sync_momo_content_ai_dispatch_claim_v1();

-- The old tokenless entry points would bypass caller ownership.
revoke all on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid
) from public, anon, authenticated, service_role;
drop function public.veroxa_start_momo_content_ai_run_v1(uuid,text,uuid);

create function public.veroxa_start_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid,
  p_dispatch_claim_token uuid
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
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
  if not found
     or run.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;

  if run.status = 'provider_running' then
    if run.provider_response_id is null then
      if run.dispatch_claim_token is distinct from p_dispatch_claim_token
         or not exists (
           select 1
           from veroxa_private.momo_content_ai_dispatch_claims claim
           where claim.dispatch_claim_token = p_dispatch_claim_token
             and claim.run_id = run.id
             and claim.request_hash = run.request_hash
             and claim.restaurant_id = run.restaurant_id
             and claim.claimed_by = p_actor_id
             and claim.state = 'active'
         ) then
        raise exception using errcode = '23505',
          message = 'momo_content_ai_dispatch_claim_conflict';
      end if;
    end if;
    return query select run.id, false, run.status;
    return;
  end if;
  if run.status <> 'reserved' then
    return query select run.id, false, run.status;
    return;
  end if;
  if exists (
    select 1
    from veroxa_private.momo_content_ai_dispatch_claims claim
    where claim.dispatch_claim_token = p_dispatch_claim_token
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_dispatch_claim_reused';
  end if;

  if run.reservation_lease_expires_at <= pg_catalog.clock_timestamp() then
    update public.veroxa_momo_content_ai_runs target_run
    set status = 'failed',
        provider_error_code = 'reservation_lease_expired',
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        completed_at = pg_catalog.clock_timestamp(),
        updated_at = pg_catalog.clock_timestamp()
    where target_run.id = run.id and target_run.status = 'reserved';
    get diagnostics changed_rows = row_count;
    if changed_rows <> 1 then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_reservation_expiry_race';
    end if;
    update veroxa_private.momo_ai_cost_ledger ledger
    set state = 'released', provider_called = false,
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        updated_at = pg_catalog.clock_timestamp()
    where ledger.operation_kind = 'content_package'
      and ledger.source_id = run.id
      and ledger.restaurant_id = run.restaurant_id
      and ledger.idempotency_hash = run.idempotency_hash
      and ledger.state = 'reserved'
      and not ledger.provider_called
      and ledger.reserved_microusd = run.reserved_microusd
      and ledger.accounted_microusd is null
      and ledger.accounting_basis is null;
    get diagnostics changed_rows = row_count;
    if changed_rows <> 1 then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_reservation_expiry_ledger_invalid';
    end if;
    return query select run.id, false, 'failed'::text;
    return;
  end if;

  if not veroxa_private.momo_content_ai_current_evidence_v1(
       p_run_id, p_actor_id
     )
     or not exists (
       select 1
       from veroxa_private.momo_ai_budget_controls budget
       where budget.restaurant_id = run.restaurant_id and budget.enabled
     )
     or not exists (
       select 1
       from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = run.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;

  update public.veroxa_momo_content_ai_runs target_run
  set status = 'provider_running',
      provider_called = true,
      provider_started_at = pg_catalog.clock_timestamp(),
      dispatch_claim_token = p_dispatch_claim_token,
      updated_at = pg_catalog.clock_timestamp()
  where target_run.id = run.id
    and target_run.status = 'reserved'
    and not target_run.provider_called
    and target_run.provider_response_id is null
    and target_run.dispatch_claim_token is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_race';
  end if;

  insert into veroxa_private.momo_content_ai_dispatch_claims (
    dispatch_claim_token, run_id, request_hash, restaurant_id, claimed_by
  ) values (
    p_dispatch_claim_token, run.id, run.request_hash, run.restaurant_id,
    p_actor_id
  );

  update veroxa_private.momo_ai_cost_ledger ledger
  set provider_called = true,
      updated_at = pg_catalog.clock_timestamp()
  where ledger.operation_kind = 'content_package'
    and ledger.source_id = run.id
    and ledger.restaurant_id = run.restaurant_id
    and ledger.idempotency_hash = run.idempotency_hash
    and ledger.state = 'reserved'
    and not ledger.provider_called
    and ledger.reserved_microusd = run.reserved_microusd
    and ledger.accounted_microusd is null
    and ledger.accounting_basis is null;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_claim_ledger_invalid';
  end if;
  return query select run.id, true, 'provider_running'::text;
end;
$$;
revoke all on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid,uuid
) to service_role;

revoke all on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid
) from public, anon, authenticated, service_role;
drop function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid
);

create function public.veroxa_abort_momo_content_ai_before_provider_v1(
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
  if not found
     or run.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       run.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_abort_before_provider_rejected';
  end if;

  -- Exact replay is recognized from durable token history. A merely-reserved
  -- run is not enough to prove that this caller owned the aborted dispatch.
  if run.status = 'reserved'
     and not run.provider_called
     and run.provider_started_at is null
     and run.provider_response_id is null
     and run.dispatch_claim_token is null
     and exists (
       select 1
       from veroxa_private.momo_content_ai_dispatch_claims claim
       where claim.dispatch_claim_token = p_dispatch_claim_token
         and claim.run_id = run.id
         and claim.request_hash = run.request_hash
         and claim.restaurant_id = run.restaurant_id
         and claim.claimed_by = p_actor_id
         and claim.state = 'aborted'
     )
     and exists (
       select 1
       from veroxa_private.momo_ai_cost_ledger ledger
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
    return run.id;
  end if;

  if run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_started_at is null
     or run.provider_response_id is not null
     or run.dispatch_claim_token is distinct from p_dispatch_claim_token
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
     or not exists (
       select 1
       from veroxa_private.momo_content_ai_dispatch_claims claim
       where claim.dispatch_claim_token = p_dispatch_claim_token
         and claim.run_id = run.id
         and claim.request_hash = run.request_hash
         and claim.restaurant_id = run.restaurant_id
         and claim.claimed_by = p_actor_id
         and claim.state = 'active'
     )
     or exists (
       select 1
       from veroxa_private.momo_content_ai_result_outbox outbox
       where outbox.run_id = run.id
     )
     or exists (
       select 1
       from veroxa_private.momo_content_ai_webhook_events webhook_event
       where webhook_event.run_id = run.id
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

comment on column public.veroxa_momo_content_ai_runs.dispatch_claim_token is
  'Ephemeral caller-owned token for the exact active provider dispatch. Cleared when provider identity is bound, the dispatch is safely aborted, or the run becomes terminal; durable history remains private.';
