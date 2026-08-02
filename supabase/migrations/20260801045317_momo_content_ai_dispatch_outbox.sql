-- Make Momo content generation independent of the browser while preserving a
-- strict at-most-once provider boundary. Reservations enqueue transactionally;
-- only a one-time database wake can lease work; and no send-intent is ever
-- automatically redispatched without a verified OpenAI response identity.

lock table public.veroxa_momo_content_ai_runs in access exclusive mode;
lock table veroxa_private.momo_ai_cost_ledger in share row exclusive mode;
lock table veroxa_private.momo_content_ai_dispatch_claims
  in share row exclusive mode;

-- This forward-only release deliberately starts with an empty content-run
-- ledger. Backfilling a partially dispatched provider call would require
-- inventing ownership and could create a duplicate paid response.
do $$
begin
  if exists (select 1 from public.veroxa_momo_content_ai_runs) then
    raise exception using errcode = '55000',
      message = 'momo_dispatch_outbox_requires_empty_content_run_ledger';
  end if;
end;
$$;

create table veroxa_private.momo_content_ai_dispatch_outbox (
  run_id uuid primary key references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  requested_by uuid not null references public.veroxa_user_profiles(user_id)
    on delete restrict,
  state text not null default 'queued' check (state in (
    'queued','leased','send_intent','response_bound',
    'reconciliation_required','terminal'
  )),
  attempt_count integer not null default 0 check (
    attempt_count between 0 and 100
  ),
  next_attempt_at timestamptz,
  lease_token uuid,
  leased_at timestamptz,
  lease_expires_at timestamptz,
  dispatch_claim_token uuid,
  provider_request_sha256 text check (
    provider_request_sha256 is null
    or provider_request_sha256 ~ '^[0-9a-f]{64}$'
  ),
  send_intent_at timestamptz,
  provider_response_id text check (
    provider_response_id is null or (
      provider_response_id = pg_catalog.btrim(provider_response_id)
      and pg_catalog.char_length(provider_response_id) <= 200
      and provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
    )
  ),
  response_bound_at timestamptz,
  reconciliation_required_at timestamptz,
  last_error_code text check (
    last_error_code is null or last_error_code ~ '^[a-z0-9_]{3,80}$'
  ),
  terminal_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (run_id, request_hash),
  unique (lease_token),
  unique (dispatch_claim_token),
  unique (provider_response_id),
  check (lease_token is null or lease_token <>
    '00000000-0000-0000-0000-000000000000'::uuid),
  check (dispatch_claim_token is null or dispatch_claim_token <>
    '00000000-0000-0000-0000-000000000000'::uuid),
  check (coalesce(
    (state = 'queued'
      and next_attempt_at is not null
      and lease_token is null and leased_at is null
      and lease_expires_at is null and dispatch_claim_token is null
      and provider_request_sha256 is null and send_intent_at is null
      and provider_response_id is null and response_bound_at is null
      and reconciliation_required_at is null and terminal_at is null)
    or (state = 'leased'
      and attempt_count >= 1 and next_attempt_at is null
      and lease_token is not null and leased_at is not null
      and lease_expires_at > leased_at and dispatch_claim_token is null
      and provider_request_sha256 is null and send_intent_at is null
      and provider_response_id is null and response_bound_at is null
      and reconciliation_required_at is null and terminal_at is null)
    or (state = 'send_intent'
      and attempt_count >= 1 and next_attempt_at is null
      and lease_token is not null and leased_at is not null
      and lease_expires_at > leased_at and dispatch_claim_token is not null
      and provider_request_sha256 is not null and send_intent_at is not null
      and provider_response_id is null and response_bound_at is null
      and reconciliation_required_at is null and terminal_at is null)
    or (state = 'reconciliation_required'
      and attempt_count >= 1 and next_attempt_at is null
      and lease_token is not null and leased_at is not null
      and lease_expires_at > leased_at and dispatch_claim_token is not null
      and provider_request_sha256 is not null and send_intent_at is not null
      and provider_response_id is null and response_bound_at is null
      and reconciliation_required_at is not null
      and last_error_code is not null and terminal_at is null)
    or (state = 'response_bound'
      and attempt_count >= 1 and next_attempt_at is null
      and lease_token is not null and leased_at is not null
      and lease_expires_at > leased_at and dispatch_claim_token is not null
      and provider_request_sha256 is not null and send_intent_at is not null
      and provider_response_id is not null and response_bound_at is not null
      and terminal_at is null)
    or (state = 'terminal'
      and next_attempt_at is null and terminal_at is not null
      and ((provider_response_id is null and response_bound_at is null)
        or (provider_response_id is not null
          and response_bound_at is not null))),
    false
  ))
);

alter table veroxa_private.momo_content_ai_dispatch_outbox
  enable row level security;
alter table veroxa_private.momo_content_ai_dispatch_outbox
  force row level security;
revoke all on table veroxa_private.momo_content_ai_dispatch_outbox
  from public, anon, authenticated, service_role;

-- A worker may lose both acknowledgements for the database-only begin step.
-- Because it has not called OpenAI yet, it can safely cancel that exact
-- lease/token/body tuple. This immutable receipt makes cancellation replayable
-- even after a later attempt has already leased the same run.
create table veroxa_private.momo_content_ai_dispatch_prepost_aborts (
  dispatch_claim_token uuid primary key references
    veroxa_private.momo_content_ai_dispatch_claims(dispatch_claim_token)
    on delete restrict check (
    dispatch_claim_token <>
      '00000000-0000-0000-0000-000000000000'::uuid
  ),
  run_id uuid not null references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  lease_token uuid not null unique check (
    lease_token <> '00000000-0000-0000-0000-000000000000'::uuid
  ),
  provider_request_sha256 text not null check (
    provider_request_sha256 ~ '^[0-9a-f]{64}$'
  ),
  error_code text not null check (error_code ~ '^[a-z0-9_]{3,80}$'),
  aborted_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (run_id, request_hash, dispatch_claim_token)
);
alter table veroxa_private.momo_content_ai_dispatch_prepost_aborts
  enable row level security;
alter table veroxa_private.momo_content_ai_dispatch_prepost_aborts
  force row level security;
revoke all on table
  veroxa_private.momo_content_ai_dispatch_prepost_aborts
  from public, anon, authenticated, service_role;

create function
  veroxa_private.guard_momo_content_ai_dispatch_prepost_abort_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_content_ai_dispatch_prepost_abort_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_dispatch_prepost_abort_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_prepost_abort_guard
before update or delete
on veroxa_private.momo_content_ai_dispatch_prepost_aborts
for each row execute function
  veroxa_private.guard_momo_content_ai_dispatch_prepost_abort_v1();

create function
  veroxa_private.enforce_momo_content_ai_dispatch_prepost_abort_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim veroxa_private.momo_content_ai_dispatch_claims%rowtype;
begin
  select * into claim
  from veroxa_private.momo_content_ai_dispatch_claims target_claim
  where target_claim.dispatch_claim_token = new.dispatch_claim_token
  for key share;
  if not found
     or claim.run_id is distinct from new.run_id
     or claim.request_hash is distinct from new.request_hash
     or claim.restaurant_id is distinct from new.restaurant_id
     or claim.state <> 'aborted'
     or claim.cleared_at is null then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_prepost_abort_claim_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_dispatch_prepost_abort_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_prepost_abort_consistency
before insert
on veroxa_private.momo_content_ai_dispatch_prepost_aborts
for each row execute function
  veroxa_private.enforce_momo_content_ai_dispatch_prepost_abort_v1();

create index momo_content_ai_dispatch_outbox_due_idx
  on veroxa_private.momo_content_ai_dispatch_outbox
    (next_attempt_at, created_at, run_id)
  where state = 'queued';
create index momo_content_ai_dispatch_outbox_restaurant_state_idx
  on veroxa_private.momo_content_ai_dispatch_outbox
    (restaurant_id, state, created_at);

create table veroxa_private.momo_content_ai_dispatch_wakes (
  nonce uuid primary key check (
    nonce <> '00000000-0000-0000-0000-000000000000'::uuid
  ),
  signed_at_ms bigint not null check (
    signed_at_ms between 1000000000000 and 9999999999999
  ),
  run_id uuid not null references public.veroxa_momo_content_ai_runs(id)
    on delete restrict,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  restaurant_id uuid not null references public.veroxa_restaurants(id)
    on delete restrict,
  consumed_lease_token uuid unique,
  state text not null default 'issued' check (
    state in ('issued','consumed','expired')
  ),
  issued_at timestamptz not null default pg_catalog.clock_timestamp(),
  consumed_at timestamptz,
  expired_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (coalesce(
    (state = 'issued' and consumed_lease_token is null
      and consumed_at is null and expired_at is null)
    or (state = 'consumed' and consumed_at is not null
      and consumed_lease_token is not null and expired_at is null)
    or (state = 'expired' and consumed_lease_token is null
      and consumed_at is null
      and expired_at is not null),
    false
  )),
  check (consumed_lease_token is null or consumed_lease_token <>
    '00000000-0000-0000-0000-000000000000'::uuid)
);

alter table veroxa_private.momo_content_ai_dispatch_wakes
  enable row level security;
alter table veroxa_private.momo_content_ai_dispatch_wakes
  force row level security;
revoke all on table veroxa_private.momo_content_ai_dispatch_wakes
  from public, anon, authenticated, service_role;

create index momo_content_ai_dispatch_wakes_state_issued_idx
  on veroxa_private.momo_content_ai_dispatch_wakes (state, issued_at);
create unique index momo_content_ai_dispatch_one_issued_wake_per_run_idx
  on veroxa_private.momo_content_ai_dispatch_wakes (run_id)
  where state = 'issued';

create or replace function
  veroxa_private.guard_momo_content_ai_dispatch_wake_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
     or old.nonce is distinct from new.nonce
     or old.signed_at_ms is distinct from new.signed_at_ms
     or old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.issued_at is distinct from new.issued_at
     or old.state <> 'issued'
     or new.state not in ('consumed','expired')
     or (new.state = 'consumed' and (
       new.consumed_lease_token is null or new.consumed_at is null
       or new.expired_at is not null
     ))
     or (new.state = 'expired' and (
       new.consumed_lease_token is not null
       or new.consumed_at is not null or new.expired_at is null
     )) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_wake_is_immutable';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_dispatch_wake_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_wake_guard
before update or delete on veroxa_private.momo_content_ai_dispatch_wakes
for each row execute function
  veroxa_private.guard_momo_content_ai_dispatch_wake_v1();

create or replace function
  veroxa_private.guard_momo_content_ai_dispatch_outbox_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
     or old.run_id is distinct from new.run_id
     or old.request_hash is distinct from new.request_hash
     or old.restaurant_id is distinct from new.restaurant_id
     or old.requested_by is distinct from new.requested_by
     or old.created_at is distinct from new.created_at
     or not (
      (old.state = 'queued' and new.state in ('leased','terminal'))
      or (old.state = 'leased'
        and new.state in ('queued','send_intent','terminal'))
      or (old.state = 'send_intent'
        and new.state in (
          'queued','response_bound','reconciliation_required','terminal'
        ))
       or (old.state = 'reconciliation_required'
         and new.state in ('response_bound','terminal'))
       or (old.state = 'response_bound' and new.state = 'terminal')
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_outbox_transition_invalid';
  end if;

  if old.state = 'queued' and new.state = 'leased' then
    if new.attempt_count <> old.attempt_count + 1
       or new.last_error_code is distinct from old.last_error_code then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_lease_invalid';
    end if;
  elsif old.state = 'leased' and new.state = 'queued' then
    if new.attempt_count <> old.attempt_count
       or new.last_error_code is null then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_retry_invalid';
    end if;
  elsif old.state = 'leased' and new.state = 'send_intent' then
    if new.attempt_count <> old.attempt_count
       or new.lease_token is distinct from old.lease_token
       or new.leased_at is distinct from old.leased_at
       or new.lease_expires_at is distinct from old.lease_expires_at
       or new.last_error_code is distinct from old.last_error_code then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_send_invalid';
    end if;
  elsif old.state = 'send_intent' and new.state = 'queued' then
    if new.attempt_count <> old.attempt_count
       or new.last_error_code is null then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_prepost_abort_invalid';
    end if;
  elsif old.state = 'send_intent'
        and new.state = 'reconciliation_required' then
    if new.attempt_count <> old.attempt_count
       or new.lease_token is distinct from old.lease_token
       or new.leased_at is distinct from old.leased_at
       or new.lease_expires_at is distinct from old.lease_expires_at
       or new.dispatch_claim_token is distinct from
         old.dispatch_claim_token
       or new.provider_request_sha256 is distinct from
         old.provider_request_sha256
       or new.send_intent_at is distinct from old.send_intent_at
       or new.last_error_code is null then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_reconciliation_invalid';
    end if;
  elsif new.state = 'response_bound' then
    if new.attempt_count <> old.attempt_count
       or new.lease_token is distinct from old.lease_token
       or new.leased_at is distinct from old.leased_at
       or new.lease_expires_at is distinct from old.lease_expires_at
       or new.dispatch_claim_token is distinct from
         old.dispatch_claim_token
       or new.provider_request_sha256 is distinct from
         old.provider_request_sha256
       or new.send_intent_at is distinct from old.send_intent_at then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_response_invalid';
    end if;
  elsif new.state = 'terminal' then
    if new.attempt_count <> old.attempt_count
       or new.lease_token is distinct from old.lease_token
       or new.leased_at is distinct from old.leased_at
       or new.lease_expires_at is distinct from old.lease_expires_at
       or new.dispatch_claim_token is distinct from
         old.dispatch_claim_token
       or new.provider_request_sha256 is distinct from
         old.provider_request_sha256
       or new.send_intent_at is distinct from old.send_intent_at
       or new.provider_response_id is distinct from
         old.provider_response_id
       or new.response_bound_at is distinct from old.response_bound_at
       or new.reconciliation_required_at is distinct from
         old.reconciliation_required_at then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_outbox_terminal_invalid';
    end if;
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_dispatch_outbox_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_outbox_guard
before update or delete on veroxa_private.momo_content_ai_dispatch_outbox
for each row execute function
  veroxa_private.guard_momo_content_ai_dispatch_outbox_v1();

create or replace function
  veroxa_private.enforce_momo_content_ai_dispatch_outbox_consistency_v1()
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
     or new.requested_by is distinct from run.requested_by
     or (new.state in ('queued','leased') and (
       run.status <> 'reserved' or run.provider_called
       or run.provider_started_at is not null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is not null
     ))
     or (new.state in ('send_intent','reconciliation_required') and (
       run.status <> 'provider_running' or not run.provider_called
       or run.provider_started_at is null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is distinct from
         new.dispatch_claim_token
     ))
     or (new.state = 'response_bound' and (
       not run.provider_called or run.provider_started_at is null
       or run.provider_response_id is distinct from
         new.provider_response_id
       or run.dispatch_claim_token is not null
     ))
     or (new.state = 'terminal' and run.status not in (
       'result_staged','pending_review','materialized','rejected','failed'
     )) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_outbox_run_mismatch';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.enforce_momo_content_ai_dispatch_outbox_consistency_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_dispatch_outbox_consistency
before insert or update on veroxa_private.momo_content_ai_dispatch_outbox
for each row execute function
  veroxa_private.enforce_momo_content_ai_dispatch_outbox_consistency_v1();

-- A run reservation and its dispatch job are created in the same transaction.
-- The original reserve function then writes the cost ledger; a deferred
-- constraint trigger verifies all three records once the statement sequence is
-- complete, without copying or weakening the canonical reservation logic.
create or replace function
  veroxa_private.enqueue_momo_content_ai_dispatch_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'reserved' or new.provider_called
     or new.provider_started_at is not null
     or new.provider_response_id is not null
     or new.dispatch_claim_token is not null then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_enqueue_invalid';
  end if;
  insert into veroxa_private.momo_content_ai_dispatch_outbox (
    run_id, request_hash, restaurant_id, requested_by, next_attempt_at
  ) values (
    new.id, new.request_hash, new.restaurant_id, new.requested_by,
    pg_catalog.clock_timestamp()
  );
  return new;
end;
$$;
revoke all on function
  veroxa_private.enqueue_momo_content_ai_dispatch_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_run_dispatch_enqueue
after insert on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.enqueue_momo_content_ai_dispatch_v1();

create or replace function
  veroxa_private.assert_momo_content_ai_dispatch_coupling_v1(
    p_run_id uuid
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  ledger veroxa_private.momo_ai_cost_ledger%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
  where target_outbox.run_id = p_run_id;
  select * into ledger
  from veroxa_private.momo_ai_cost_ledger target_ledger
  where target_ledger.operation_kind = 'content_package'
    and target_ledger.source_id = p_run_id;
  if run.id is null or outbox.run_id is null or ledger.id is null
     or outbox.request_hash is distinct from run.request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.requested_by is distinct from run.requested_by
     or ledger.restaurant_id is distinct from run.restaurant_id
     or ledger.idempotency_hash is distinct from run.idempotency_hash
     or ledger.reserved_microusd is distinct from run.reserved_microusd
     or ledger.provider_called is distinct from run.provider_called
     or (run.status = 'reserved'
       and outbox.state not in ('queued','leased'))
     or (run.status = 'provider_running'
       and run.provider_response_id is null
       and outbox.state not in (
         'send_intent','reconciliation_required'
       ))
     or (run.status = 'provider_running'
       and run.provider_response_id is not null
       and outbox.state <> 'response_bound')
     or (run.status in (
       'result_staged','pending_review','materialized','rejected','failed'
     ) and outbox.state <> 'terminal') then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_coupling_invalid';
  end if;
end;
$$;
revoke all on function
  veroxa_private.assert_momo_content_ai_dispatch_coupling_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.validate_momo_content_ai_dispatch_coupling_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.assert_momo_content_ai_dispatch_coupling_v1(
    new.run_id
  );
  return null;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_content_ai_dispatch_coupling_v1()
  from public, anon, authenticated, service_role;
create constraint trigger momo_content_ai_dispatch_coupling
after insert or update on veroxa_private.momo_content_ai_dispatch_outbox
deferrable initially deferred
for each row execute function
  veroxa_private.validate_momo_content_ai_dispatch_coupling_v1();

create or replace function
  veroxa_private.validate_momo_content_ai_run_dispatch_coupling_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.assert_momo_content_ai_dispatch_coupling_v1(
    new.id
  );
  return null;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_content_ai_run_dispatch_coupling_v1()
  from public, anon, authenticated, service_role;
create constraint trigger momo_content_ai_run_dispatch_coupling
after insert or update on public.veroxa_momo_content_ai_runs
deferrable initially deferred
for each row execute function
  veroxa_private.validate_momo_content_ai_run_dispatch_coupling_v1();

create or replace function
  veroxa_private.reap_momo_content_ai_pre_provider_dispatch_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  failure_code text;
  changed bigint := 0;
begin
  loop
    exit when changed >= 32;
    select target_run.id as run_id
    into candidate
    from public.veroxa_momo_content_ai_runs target_run
    join veroxa_private.momo_content_ai_dispatch_outbox target_outbox
      on target_outbox.run_id = target_run.id
    where target_run.status = 'reserved'
      and target_outbox.state in ('queued','leased')
      and (
        (target_outbox.state = 'queued'
          and target_outbox.attempt_count >= 8)
        or target_run.reservation_lease_expires_at <=
          pg_catalog.clock_timestamp()
        or (target_outbox.state = 'leased'
          and target_outbox.lease_expires_at <=
            pg_catalog.clock_timestamp())
        or not veroxa_private.momo_content_ai_current_evidence_v1(
          target_run.id, target_outbox.requested_by
        )
        or not exists (
          select 1
          from veroxa_private.momo_ai_budget_controls budget
          where budget.restaurant_id = target_run.restaurant_id
            and budget.enabled
        )
        or not exists (
          select 1
          from public.veroxa_momo_runtime_controls runtime
          where runtime.restaurant_id = target_run.restaurant_id
            and runtime.ai_live_calls
            and not runtime.provider_writes
            and not runtime.review_replies
            and not runtime.website_writes
            and not runtime.external_scheduling
        )
      )
    order by target_outbox.created_at, target_run.id
    for update of target_run skip locked
    limit 1;
    exit when not found;

    select * into run
    from public.veroxa_momo_content_ai_runs target_run
    where target_run.id = candidate.run_id;
    select * into outbox
    from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
    where target_outbox.run_id = run.id
    for update;

    if outbox.state = 'leased'
       and outbox.lease_expires_at <= pg_catalog.clock_timestamp()
       and outbox.attempt_count < 8
       and run.reservation_lease_expires_at >
         pg_catalog.clock_timestamp()
       and veroxa_private.momo_content_ai_current_evidence_v1(
         run.id, outbox.requested_by
       )
       and exists (
         select 1
         from veroxa_private.momo_ai_budget_controls budget
         where budget.restaurant_id = run.restaurant_id
           and budget.enabled
       )
       and exists (
         select 1
         from public.veroxa_momo_runtime_controls runtime
         where runtime.restaurant_id = run.restaurant_id
           and runtime.ai_live_calls
           and not runtime.provider_writes
           and not runtime.review_replies
           and not runtime.website_writes
           and not runtime.external_scheduling
       ) then
      update veroxa_private.momo_content_ai_dispatch_outbox target_outbox
      set state = 'queued',
          next_attempt_at = pg_catalog.clock_timestamp(),
          lease_token = null, leased_at = null, lease_expires_at = null,
          last_error_code = 'dispatch_lease_expired'
      where target_outbox.run_id = outbox.run_id
        and target_outbox.state = 'leased';
      changed := changed + 1;
      continue;
    end if;

    -- The candidate predicate above is intentionally unlocked. Recompute it
    -- from the rows we now own so a concurrently refreshed budget, runtime
    -- control, or evidence record cannot be terminally failed from stale data.
    failure_code := case
      when run.status <> 'reserved'
        or outbox.state not in ('queued','leased')
        then null
      when outbox.state = 'queued' and outbox.attempt_count >= 8
        then 'dispatch_attempt_limit_reached'
      when outbox.state = 'leased'
        and outbox.lease_expires_at <= pg_catalog.clock_timestamp()
        and outbox.attempt_count >= 8
        then 'dispatch_attempt_limit_reached'
      when run.reservation_lease_expires_at <=
        pg_catalog.clock_timestamp()
        then 'reservation_lease_expired'
      when not veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, outbox.requested_by
      ) then 'dispatch_preconditions_expired'
      when not exists (
        select 1
        from veroxa_private.momo_ai_budget_controls budget
        where budget.restaurant_id = run.restaurant_id
          and budget.enabled
      ) then 'dispatch_preconditions_expired'
      when not exists (
        select 1
        from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = run.restaurant_id
          and runtime.ai_live_calls
          and not runtime.provider_writes
          and not runtime.review_replies
          and not runtime.website_writes
          and not runtime.external_scheduling
      ) then 'dispatch_preconditions_expired'
      else null
    end;
    if failure_code is null then
      continue;
    end if;
    perform public.veroxa_fail_momo_content_ai_run_v1(
      run.id, run.request_hash, null, failure_code,
      false, null, null, run.requested_by
    );
    changed := changed + 1;
  end loop;
  return changed;
end;
$$;
revoke all on function
  veroxa_private.reap_momo_content_ai_pre_provider_dispatch_v1()
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.expire_momo_content_ai_dispatch_wakes_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  changed bigint := 0;
begin
  loop
    exit when changed >= 32;
    select wake.nonce, wake.run_id
    into candidate
    from veroxa_private.momo_content_ai_dispatch_wakes wake
    where wake.state = 'issued'
      and wake.issued_at <=
        pg_catalog.clock_timestamp() - interval '2 minutes'
    order by wake.issued_at, wake.nonce
    limit 1;
    exit when not found;

    perform 1
    from public.veroxa_momo_content_ai_runs run
    where run.id = candidate.run_id
    for update;
    perform 1
    from veroxa_private.momo_content_ai_dispatch_outbox outbox
    where outbox.run_id = candidate.run_id
    for update;
    update veroxa_private.momo_content_ai_dispatch_wakes wake
    set state = 'expired', expired_at = pg_catalog.clock_timestamp()
    where wake.nonce = candidate.nonce
      and wake.state = 'issued'
      and wake.issued_at <=
        pg_catalog.clock_timestamp() - interval '2 minutes';
    if found then changed := changed + 1; end if;
  end loop;
  return changed;
end;
$$;
revoke all on function
  veroxa_private.expire_momo_content_ai_dispatch_wakes_v1()
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.issue_momo_content_ai_dispatch_wake_v1()
returns table (wake_nonce uuid, wake_signed_at_ms bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  issued_nonce uuid;
  issued_ms bigint;
  target_run public.veroxa_momo_content_ai_runs%rowtype;
  target_outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'veroxa:momo-content-ai-dispatch-issue:v1', 0
  ));
  perform veroxa_private.reap_momo_content_ai_pre_provider_dispatch_v1();
  perform veroxa_private.expire_momo_content_ai_dispatch_wakes_v1();

  select run.* into target_run
  from public.veroxa_momo_content_ai_runs run
  join veroxa_private.momo_content_ai_dispatch_outbox outbox
    on outbox.run_id = run.id
  where outbox.state = 'queued'
    and outbox.next_attempt_at <= pg_catalog.clock_timestamp()
    and run.status = 'reserved'
    and not run.provider_called
    and run.provider_response_id is null
    and run.reservation_lease_expires_at > pg_catalog.clock_timestamp()
    and not exists (
      select 1
      from veroxa_private.momo_content_ai_dispatch_wakes wake
      where wake.run_id = run.id and wake.state = 'issued'
    )
  order by outbox.next_attempt_at, outbox.created_at, outbox.run_id
  for update of run skip locked
  limit 1;
  if not found then return; end if;
  select * into target_outbox
  from veroxa_private.momo_content_ai_dispatch_outbox outbox
  where outbox.run_id = target_run.id
  for update;
  if target_outbox.state <> 'queued'
     or target_outbox.next_attempt_at > pg_catalog.clock_timestamp() then
    return;
  end if;
  if target_outbox.attempt_count >= 8
     or target_run.reservation_lease_expires_at <=
       pg_catalog.clock_timestamp()
     or not veroxa_private.momo_content_ai_current_evidence_v1(
       target_run.id, target_outbox.requested_by
     )
     or not exists (
       select 1 from veroxa_private.momo_ai_budget_controls budget
       where budget.restaurant_id = target_run.restaurant_id
         and budget.enabled
     )
     or not exists (
       select 1 from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = target_run.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     ) then
    perform public.veroxa_fail_momo_content_ai_run_v1(
      target_run.id, target_run.request_hash, null,
      case
        when target_outbox.attempt_count >= 8
          then 'dispatch_attempt_limit_reached'
        when target_run.reservation_lease_expires_at <=
          pg_catalog.clock_timestamp()
          then 'reservation_lease_expired'
        else 'dispatch_preconditions_expired'
      end,
      false, null, null, target_run.requested_by
    );
    return;
  end if;

  issued_nonce := extensions.gen_random_uuid();
  issued_ms := pg_catalog.floor(
    extract(epoch from pg_catalog.clock_timestamp()) * 1000
  )::bigint;
  insert into veroxa_private.momo_content_ai_dispatch_wakes (
    nonce, signed_at_ms, run_id, request_hash, restaurant_id
  ) values (
    issued_nonce, issued_ms, target_run.id, target_run.request_hash,
    target_run.restaurant_id
  );
  return query select issued_nonce, issued_ms;
end;
$$;
revoke all on function
  veroxa_private.issue_momo_content_ai_dispatch_wake_v1()
  from public, anon, authenticated, service_role;

create function public.veroxa_claim_momo_content_ai_dispatch_v1(
  p_wake_nonce uuid,
  p_signed_at_ms bigint,
  p_lease_token uuid
)
returns table (
  run_id uuid, request_hash text, restaurant_id uuid,
  requested_by uuid, source_storage_path text,
  source_mime_type text, source_file_size bigint,
  source_content_sha256 text, source_width integer, source_height integer,
  target_platforms jsonb, truth_snapshot jsonb,
  truth_snapshot_sha256 text, reserved_microusd bigint,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  wake veroxa_private.momo_content_ai_dispatch_wakes%rowtype;
  target veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
begin
  if p_wake_nonce is null
     or p_wake_nonce = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_signed_at_ms not between 1000000000000 and 9999999999999 then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_claim_invalid';
  end if;

  -- Read the immutable wake identity without a row lock, then acquire every
  -- mutable row in the global RUN -> OUTBOX -> WAKE order.
  select * into wake
  from veroxa_private.momo_content_ai_dispatch_wakes target_wake
  where target_wake.nonce = p_wake_nonce;
  if not found then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_wake_rejected';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = wake.run_id
  for update;
  select * into target
  from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
  where target_outbox.run_id = wake.run_id
  for update;
  select * into wake
  from veroxa_private.momo_content_ai_dispatch_wakes target_wake
  where target_wake.nonce = p_wake_nonce
  for update;
  if not found or wake.state <> 'issued'
     or wake.signed_at_ms <> p_signed_at_ms
     or wake.run_id is distinct from run.id
     or wake.request_hash is distinct from run.request_hash
     or wake.restaurant_id is distinct from run.restaurant_id
     or target.run_id is distinct from run.id
     or target.request_hash is distinct from run.request_hash
     or wake.issued_at < pg_catalog.clock_timestamp() - interval '2 minutes'
     or wake.issued_at > pg_catalog.clock_timestamp() + interval '5 seconds' then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_wake_rejected';
  end if;
  update veroxa_private.momo_content_ai_dispatch_wakes target_wake
  set state = 'consumed', consumed_lease_token = p_lease_token,
      consumed_at = pg_catalog.clock_timestamp()
  where target_wake.nonce = wake.nonce and target_wake.state = 'issued';

  if target.state <> 'queued'
     or target.next_attempt_at > pg_catalog.clock_timestamp()
     or target.attempt_count >= 8
     or run.status <> 'reserved'
     or run.provider_called or run.provider_response_id is not null
     or run.reservation_lease_expires_at <= pg_catalog.clock_timestamp()
     or not veroxa_private.momo_content_ai_current_evidence_v1(
       run.id, target.requested_by
     )
     or not exists (
       select 1 from veroxa_private.momo_ai_budget_controls budget
       where budget.restaurant_id = run.restaurant_id and budget.enabled
     )
     or not exists (
       select 1 from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = run.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     ) then
    if target.state = 'queued' and run.status = 'reserved'
       and not run.provider_called and run.provider_response_id is null
       and (
         target.attempt_count >= 8
         or run.reservation_lease_expires_at <=
           pg_catalog.clock_timestamp()
         or not veroxa_private.momo_content_ai_current_evidence_v1(
           run.id, target.requested_by
         )
         or not exists (
           select 1
           from veroxa_private.momo_ai_budget_controls budget
           where budget.restaurant_id = run.restaurant_id
             and budget.enabled
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
         )
       ) then
      perform public.veroxa_fail_momo_content_ai_run_v1(
        run.id, run.request_hash, null,
        case
          when target.attempt_count >= 8
            then 'dispatch_attempt_limit_reached'
          when run.reservation_lease_expires_at <=
            pg_catalog.clock_timestamp()
            then 'reservation_lease_expired'
          else 'dispatch_preconditions_expired'
        end,
        false, null, null, run.requested_by
      );
    end if;
    return;
  end if;

  update veroxa_private.momo_content_ai_dispatch_outbox outbox
  set state = 'leased', attempt_count = outbox.attempt_count + 1,
      next_attempt_at = null, lease_token = p_lease_token,
      leased_at = pg_catalog.clock_timestamp(),
      lease_expires_at = pg_catalog.clock_timestamp() + interval '2 minutes'
  where outbox.run_id = target.run_id
  returning * into target;

  return query select run.id, run.request_hash, run.restaurant_id,
    run.requested_by, run.source_storage_path, run.source_mime_type,
    run.source_file_size, run.source_content_sha256, run.source_width,
    run.source_height, run.target_platforms, run.truth_snapshot,
    run.truth_snapshot_sha256, run.reserved_microusd,
    target.attempt_count;
end;
$$;
revoke all on function public.veroxa_claim_momo_content_ai_dispatch_v1(
  uuid,bigint,uuid
) from public, anon, authenticated;
grant execute on function public.veroxa_claim_momo_content_ai_dispatch_v1(
  uuid,bigint,uuid
) to service_role;

create function public.veroxa_begin_momo_content_ai_dispatch_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_provider_request_sha256 text
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  started record;
begin
  if p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_dispatch_claim_token is null
     or p_dispatch_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_provider_request_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_begin_invalid';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target
  where target.run_id = p_run_id
  for update;
  if run.id is null or not found
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.lease_token is distinct from p_lease_token then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_lease_rejected';
  end if;
  if exists (
    select 1
    from veroxa_private.momo_content_ai_dispatch_prepost_aborts receipt
    where receipt.dispatch_claim_token = p_dispatch_claim_token
  ) then
    raise exception using errcode = '23505',
      message = 'momo_content_ai_dispatch_claim_reused';
  end if;

  -- A lost response from this database-only transition is safe to replay with
  -- the exact same lease, dispatch token, and serialized provider-body hash.
  -- The worker has not called OpenAI until this confirmation is returned.
  if outbox.state = 'send_intent' then
    if outbox.dispatch_claim_token is distinct from p_dispatch_claim_token
       or outbox.provider_request_sha256 is distinct from
         p_provider_request_sha256
       or run.status <> 'provider_running'
       or not run.provider_called
       or run.provider_response_id is not null
       or run.dispatch_claim_token is distinct from
         outbox.dispatch_claim_token then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_dispatch_begin_replay_conflict';
    end if;
    return query select outbox.run_id, true, 'provider_running'::text;
    return;
  end if;
  if outbox.state <> 'leased' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_begin_state_invalid';
  end if;
  if outbox.lease_expires_at <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_lease_rejected';
  end if;

  select * into started
  from public.veroxa_start_momo_content_ai_run_v1(
    p_run_id, p_request_hash, outbox.requested_by,
    p_dispatch_claim_token
  );
  if started.run_id is distinct from p_run_id then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_begin_invalid';
  end if;
  if started.should_call then
    update veroxa_private.momo_content_ai_dispatch_outbox target
    set state = 'send_intent',
        dispatch_claim_token = p_dispatch_claim_token,
        provider_request_sha256 = p_provider_request_sha256,
        send_intent_at = pg_catalog.clock_timestamp()
    where target.run_id = outbox.run_id
      and target.state = 'leased'
      and target.lease_token = p_lease_token;
  end if;
  return query select p_run_id, started.should_call, started.run_status;
end;
$$;
revoke all on function public.veroxa_begin_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid,text
) from public, anon, authenticated;
grant execute on function public.veroxa_begin_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid,text
) to service_role;

create function public.veroxa_cancel_momo_content_ai_dispatch_before_post_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_provider_request_sha256 text,
  p_error_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  receipt
    veroxa_private.momo_content_ai_dispatch_prepost_aborts%rowtype;
  changed_rows integer;
begin
  if p_run_id is null
     or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_lease_token is null
     or p_lease_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_dispatch_claim_token is null
     or p_dispatch_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_provider_request_sha256 !~ '^[0-9a-f]{64}$'
     or p_error_code !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_prepost_abort_invalid';
  end if;

  -- Keep the global lock order. A replay receipt is checked only after the
  -- current run and outbox are owned, so it is safe even if a later attempt is
  -- already active.
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
  where target_outbox.run_id = p_run_id
  for update;
  select * into receipt
  from veroxa_private.momo_content_ai_dispatch_prepost_aborts target_receipt
  where target_receipt.dispatch_claim_token = p_dispatch_claim_token;

  if receipt.dispatch_claim_token is not null then
    if receipt.run_id is distinct from p_run_id
       or receipt.request_hash is distinct from p_request_hash
       or receipt.restaurant_id is distinct from run.restaurant_id
       or receipt.lease_token is distinct from p_lease_token
       or receipt.provider_request_sha256 is distinct from
         p_provider_request_sha256
       or receipt.error_code is distinct from p_error_code then
      raise exception using errcode = '23505',
        message = 'momo_content_ai_dispatch_prepost_abort_conflict';
    end if;
    return p_run_id;
  end if;

  if run.id is null or outbox.run_id is null
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.requested_by is distinct from run.requested_by
     or outbox.lease_token is distinct from p_lease_token then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_prepost_abort_rejected';
  end if;

  if outbox.state = 'leased' then
    if run.status <> 'reserved' or run.provider_called
       or run.provider_started_at is not null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is not null
       or outbox.dispatch_claim_token is not null
       or outbox.provider_request_sha256 is not null
       or outbox.send_intent_at is not null
       or not exists (
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
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_prepost_abort_state_invalid';
    end if;

    -- Reserve this token globally even though begin never committed. The
    -- dispatch-claim primary key serializes a concurrent begin on another run;
    -- the receipt below is then foreign-keyed to this canonical tombstone.
    insert into veroxa_private.momo_content_ai_dispatch_claims (
      dispatch_claim_token, run_id, request_hash, restaurant_id, claimed_by,
      state, cleared_at
    ) values (
      p_dispatch_claim_token, run.id, run.request_hash, run.restaurant_id,
      outbox.requested_by, 'aborted', pg_catalog.clock_timestamp()
    );
  elsif outbox.state = 'send_intent' then
    if outbox.dispatch_claim_token is distinct from
         p_dispatch_claim_token
       or outbox.provider_request_sha256 is distinct from
         p_provider_request_sha256
       or run.status <> 'provider_running'
       or not run.provider_called
       or run.provider_started_at is null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is distinct from
         p_dispatch_claim_token
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
           and claim.claimed_by = outbox.requested_by
           and claim.state = 'active'
       )
       or exists (
         select 1
         from veroxa_private.momo_content_ai_result_outbox result
         where result.run_id = run.id
       )
       or exists (
         select 1
         from veroxa_private.momo_content_ai_webhook_events event
         where event.run_id = run.id
       )
       or not exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = run.id
           and ledger.restaurant_id = run.restaurant_id
           and ledger.idempotency_hash = run.idempotency_hash
           and ledger.state = 'reserved'
           and ledger.provider_called
           and ledger.reserved_microusd = run.reserved_microusd
           and ledger.accounted_microusd is null
           and ledger.accounting_basis is null
       ) then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_prepost_abort_state_invalid';
    end if;

    update public.veroxa_momo_content_ai_runs target_run
    set status = 'reserved', provider_called = false,
        provider_started_at = null,
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
        message = 'momo_content_ai_dispatch_prepost_abort_run_race';
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
        message = 'momo_content_ai_dispatch_prepost_abort_ledger_invalid';
    end if;
  else
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_prepost_abort_state_invalid';
  end if;

  insert into veroxa_private.momo_content_ai_dispatch_prepost_aborts (
    dispatch_claim_token, run_id, request_hash, restaurant_id, lease_token,
    provider_request_sha256, error_code
  ) values (
    p_dispatch_claim_token, run.id, run.request_hash, run.restaurant_id,
    p_lease_token, p_provider_request_sha256, p_error_code
  );

  update veroxa_private.momo_content_ai_dispatch_outbox target
  set state = 'queued',
      next_attempt_at = pg_catalog.clock_timestamp()
        + pg_catalog.make_interval(
          secs => least(300, 5 * (2 ^ least(outbox.attempt_count, 6)))
        ),
      lease_token = null, leased_at = null, lease_expires_at = null,
      dispatch_claim_token = null, provider_request_sha256 = null,
      send_intent_at = null, last_error_code = p_error_code
  where target.run_id = outbox.run_id
    and target.state in ('leased','send_intent')
    and target.lease_token = p_lease_token;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_prepost_abort_outbox_race';
  end if;
  return run.id;
end;
$$;
revoke all on function
  public.veroxa_cancel_momo_content_ai_dispatch_before_post_v1(
    uuid,text,uuid,uuid,text,text
  ) from public, anon, authenticated;
grant execute on function
  public.veroxa_cancel_momo_content_ai_dispatch_before_post_v1(
    uuid,text,uuid,uuid,text,text
  ) to service_role;

create function public.veroxa_release_momo_content_ai_dispatch_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_error_code text,
  p_retryable boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  failed_id uuid;
begin
  if p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_error_code !~ '^[a-z0-9_]{3,80}$'
     or p_retryable is null then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_release_invalid';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target
  where target.run_id = p_run_id
  for update;
  if run.id is null or not found
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.state <> 'leased'
     or outbox.lease_token is distinct from p_lease_token
     or outbox.lease_expires_at <= pg_catalog.clock_timestamp() then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_lease_rejected';
  end if;
  if p_retryable and outbox.attempt_count < 8 then
    update veroxa_private.momo_content_ai_dispatch_outbox target
    set state = 'queued',
        next_attempt_at = pg_catalog.clock_timestamp()
          + pg_catalog.make_interval(
            secs => least(300, 5 * (2 ^ least(outbox.attempt_count, 6)))
          ),
        lease_token = null, leased_at = null, lease_expires_at = null,
        last_error_code = p_error_code
    where target.run_id = outbox.run_id;
    return outbox.run_id;
  end if;

  failed_id := public.veroxa_fail_momo_content_ai_run_v1(
    outbox.run_id, outbox.request_hash, null,
    case when outbox.attempt_count >= 8
      then 'dispatch_attempt_limit_reached' else p_error_code end,
    false, null, null, outbox.requested_by
  );
  if failed_id is distinct from outbox.run_id then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_release_invalid';
  end if;
  return failed_id;
end;
$$;
revoke all on function public.veroxa_release_momo_content_ai_dispatch_v1(
  uuid,text,uuid,text,boolean
) from public, anon, authenticated;
grant execute on function public.veroxa_release_momo_content_ai_dispatch_v1(
  uuid,text,uuid,text,boolean
) to service_role;

create function public.veroxa_bind_momo_content_ai_dispatch_response_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_provider_response_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  bound_id uuid;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target
  where target.run_id = p_run_id
  for update;
  if run.id is null or not found
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.lease_token is distinct from p_lease_token
     or outbox.dispatch_claim_token is distinct from p_dispatch_claim_token
     or outbox.state not in (
       'send_intent','reconciliation_required','response_bound','terminal'
     )
     or p_provider_response_id is null
     or p_provider_response_id is distinct from
       pg_catalog.btrim(p_provider_response_id)
     or pg_catalog.char_length(p_provider_response_id) > 200
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$' then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_bind_rejected';
  end if;
  if outbox.state = 'response_bound' then
    if outbox.provider_response_id = p_provider_response_id then
      return outbox.run_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_dispatch_response_conflict';
  end if;
  if outbox.state = 'terminal' then
    if outbox.provider_response_id = p_provider_response_id
       and run.provider_response_id = p_provider_response_id
       and run.provider_called and run.provider_started_at is not null
       and run.dispatch_claim_token is null
       and run.status in (
         'result_staged','pending_review','materialized','rejected','failed'
       )
       and exists (
         select 1
         from veroxa_private.momo_content_ai_dispatch_claims claim
         where claim.dispatch_claim_token = p_dispatch_claim_token
           and claim.run_id = run.id
           and claim.request_hash = run.request_hash
           and claim.restaurant_id = run.restaurant_id
           and claim.state in ('response_bound','terminal')
       ) then
      return outbox.run_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_dispatch_response_conflict';
  end if;

  bound_id := public.veroxa_record_momo_content_ai_provider_response_v1(
    outbox.run_id, outbox.request_hash, p_provider_response_id,
    outbox.requested_by
  );
  if bound_id is distinct from outbox.run_id
     or not exists (
       select 1
       from veroxa_private.momo_content_ai_dispatch_outbox target
       where target.run_id = outbox.run_id
         and target.state = 'response_bound'
         and target.provider_response_id = p_provider_response_id
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_bind_invalid';
  end if;
  return bound_id;
end;
$$;
revoke all on function
  public.veroxa_bind_momo_content_ai_dispatch_response_v1(
    uuid,text,uuid,uuid,text
  ) from public, anon, authenticated;
grant execute on function
  public.veroxa_bind_momo_content_ai_dispatch_response_v1(
    uuid,text,uuid,uuid,text
  ) to service_role;

create function public.veroxa_reconcile_momo_content_ai_dispatch_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_error_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
begin
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target
  where target.run_id = p_run_id
  for update;
  if run.id is null or not found
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or outbox.lease_token is distinct from p_lease_token
     or outbox.dispatch_claim_token is distinct from p_dispatch_claim_token
     or p_error_code !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_dispatch_reconciliation_rejected';
  end if;
  if outbox.state = 'response_bound' then
    return outbox.run_id;
  end if;
  if outbox.state = 'reconciliation_required' then
    if outbox.last_error_code = p_error_code then
      return outbox.run_id;
    end if;
    raise exception using errcode = '23505',
      message = 'momo_content_ai_dispatch_reconciliation_conflict';
  end if;
  if outbox.state <> 'send_intent' then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_dispatch_reconciliation_state_invalid';
  end if;
  update veroxa_private.momo_content_ai_dispatch_outbox target
  set state = 'reconciliation_required',
      reconciliation_required_at = pg_catalog.clock_timestamp(),
      last_error_code = p_error_code
  where target.run_id = outbox.run_id and target.state = 'send_intent';
  return outbox.run_id;
end;
$$;
revoke all on function public.veroxa_reconcile_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid,text
) from public, anon, authenticated;
grant execute on function public.veroxa_reconcile_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid,text
) to service_role;

-- Keep the dispatch audit state synchronized with every authoritative run
-- transition, including webhook-first response binding and 96-hour expiry.
create or replace function
  veroxa_private.sync_momo_content_ai_dispatch_outbox_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_rows integer;
begin
  if new.provider_response_id is not null
     and old.provider_response_id is null then
    update veroxa_private.momo_content_ai_dispatch_outbox outbox
    set state = 'response_bound',
        provider_response_id = new.provider_response_id,
        response_bound_at = pg_catalog.clock_timestamp()
    where outbox.run_id = new.id
      and outbox.request_hash = new.request_hash
      and outbox.restaurant_id = new.restaurant_id
      and outbox.state in ('send_intent','reconciliation_required');
    get diagnostics changed_rows = row_count;
    if changed_rows <> 1 then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_response_sync_failed';
    end if;
  end if;

  if new.status in (
    'result_staged','pending_review','materialized','rejected','failed'
  ) and old.status is distinct from new.status then
    update veroxa_private.momo_content_ai_dispatch_outbox outbox
    set state = 'terminal', next_attempt_at = null,
        last_error_code = coalesce(
          new.provider_error_code, outbox.last_error_code
        ),
        terminal_at = pg_catalog.clock_timestamp()
    where outbox.run_id = new.id
      and outbox.request_hash = new.request_hash
      and outbox.restaurant_id = new.restaurant_id
      and outbox.state <> 'terminal';
    get diagnostics changed_rows = row_count;
    if changed_rows = 0 and not exists (
      select 1
      from veroxa_private.momo_content_ai_dispatch_outbox outbox
      where outbox.run_id = new.id
        and outbox.request_hash = new.request_hash
        and outbox.restaurant_id = new.restaurant_id
        and outbox.state = 'terminal'
    ) then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_dispatch_terminal_sync_failed';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.sync_momo_content_ai_dispatch_outbox_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_run_dispatch_outbox_sync
after update of status,provider_response_id
on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.sync_momo_content_ai_dispatch_outbox_v1();

-- These legacy service entry points predate the transactional outbox and can
-- otherwise mutate a run without owning its worker lease. SECURITY DEFINER
-- wrappers above retain owner-level access while PostgREST/Edge callers cannot
-- invoke the bypasses directly.
revoke execute on function public.veroxa_start_momo_content_ai_run_v1(
  uuid,text,uuid,uuid
) from service_role;
revoke execute on function public.veroxa_abort_momo_content_ai_before_provider_v1(
  uuid,text,uuid,uuid
) from service_role;
revoke execute on function public.veroxa_record_momo_content_ai_provider_response_v1(
  uuid,text,text,uuid
) from service_role;
revoke execute on function public.veroxa_fail_unbound_momo_content_ai_dispatch_v1(
  uuid,text,uuid,uuid
) from service_role;

comment on table veroxa_private.momo_content_ai_dispatch_outbox is
  'Private transactional Momo AI dispatch ledger. Only pre-send leases may return to queued; send-intent rows are never automatically redispatched.';
comment on function
  veroxa_private.issue_momo_content_ai_dispatch_wake_v1() is
  'Issues a short-lived one-time nonce only when a Momo content dispatch is due. A later activation migration signs and delivers this wake to the internal Sites worker.';
