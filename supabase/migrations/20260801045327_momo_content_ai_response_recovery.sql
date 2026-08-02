-- Recover response-bound Momo content runs when an OpenAI webhook is delayed
-- or unavailable. Recovery is GET-only: it can retrieve and validate the
-- exact stored response ID, but it can never create or redispatch a response.

create table veroxa_private.momo_content_ai_recovery_wakes (
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
  provider_response_id text not null check (
    provider_response_id = pg_catalog.btrim(provider_response_id)
    and pg_catalog.char_length(provider_response_id) <= 200
    and provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
  ),
  state text not null default 'issued' check (
    state in ('issued','consumed','expired')
  ),
  issued_at timestamptz not null default pg_catalog.clock_timestamp(),
  consumed_at timestamptz,
  expired_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (coalesce(
    (state = 'issued' and consumed_at is null and expired_at is null)
    or (state = 'consumed' and consumed_at is not null
      and expired_at is null)
    or (state = 'expired' and consumed_at is null
      and expired_at is not null),
    false
  ))
);
alter table veroxa_private.momo_content_ai_recovery_wakes
  enable row level security;
alter table veroxa_private.momo_content_ai_recovery_wakes
  force row level security;
revoke all on table veroxa_private.momo_content_ai_recovery_wakes
  from public, anon, authenticated, service_role;

create index momo_content_ai_recovery_wakes_state_issued_idx
  on veroxa_private.momo_content_ai_recovery_wakes (state, issued_at);
create index momo_content_ai_recovery_wakes_run_issued_idx
  on veroxa_private.momo_content_ai_recovery_wakes (run_id, issued_at desc);
create unique index momo_content_ai_recovery_one_issued_per_run_idx
  on veroxa_private.momo_content_ai_recovery_wakes (run_id)
  where state = 'issued';

create function veroxa_private.guard_momo_content_ai_recovery_wake_v1()
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
     or old.provider_response_id is distinct from
       new.provider_response_id
     or old.issued_at is distinct from new.issued_at
     or old.state <> 'issued'
     or new.state not in ('consumed','expired')
     or (new.state = 'consumed' and (
       new.consumed_at is null or new.expired_at is not null
     ))
     or (new.state = 'expired' and (
       new.consumed_at is not null or new.expired_at is null
     )) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_recovery_wake_is_immutable';
  end if;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_recovery_wake_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_recovery_wake_guard
before update or delete
on veroxa_private.momo_content_ai_recovery_wakes
for each row execute function
  veroxa_private.guard_momo_content_ai_recovery_wake_v1();

create function veroxa_private.expire_momo_content_ai_recovery_wakes_v1()
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
    from veroxa_private.momo_content_ai_recovery_wakes wake
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
    update veroxa_private.momo_content_ai_recovery_wakes wake
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
  veroxa_private.expire_momo_content_ai_recovery_wakes_v1()
  from public, anon, authenticated, service_role;

create function veroxa_private.issue_momo_content_ai_recovery_wake_v1()
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
    'veroxa:momo-content-ai-recovery-issue:v1', 0
  ));
  perform veroxa_private.expire_momo_content_ai_recovery_wakes_v1();

  select run.* into target_run
  from public.veroxa_momo_content_ai_runs run
  join veroxa_private.momo_content_ai_dispatch_outbox outbox
    on outbox.run_id = run.id
  where outbox.state = 'response_bound'
    and outbox.response_bound_at <=
      pg_catalog.clock_timestamp() - interval '2 minutes'
    and run.status = 'provider_running'
    and run.provider_called
    and run.provider_response_id is not null
    and run.provider_response_id = outbox.provider_response_id
    and not exists (
      select 1
      from veroxa_private.momo_content_ai_recovery_wakes wake
      where wake.run_id = run.id and wake.state = 'issued'
    )
    and not exists (
      select 1
      from veroxa_private.momo_content_ai_recovery_wakes recent
      where recent.run_id = run.id
        and recent.issued_at >
          pg_catalog.clock_timestamp() - interval '5 minutes'
    )
    and not exists (
      select 1
      from veroxa_private.momo_content_ai_webhook_events event
      where event.run_id = run.id and event.state = 'claimed'
        and event.claim_lease_expires_at > pg_catalog.clock_timestamp()
    )
  order by outbox.response_bound_at, outbox.run_id
  for update of run skip locked
  limit 1;
  if not found then return; end if;

  select * into target_outbox
  from veroxa_private.momo_content_ai_dispatch_outbox outbox
  where outbox.run_id = target_run.id
  for update;
  if target_outbox.state <> 'response_bound'
     or target_outbox.response_bound_at >
       pg_catalog.clock_timestamp() - interval '2 minutes'
     or target_run.status <> 'provider_running'
     or not target_run.provider_called
     or target_run.provider_response_id is null
     or target_run.provider_response_id is distinct from
       target_outbox.provider_response_id
     or exists (
       select 1
       from veroxa_private.momo_content_ai_recovery_wakes wake
       where wake.run_id = target_run.id and wake.state = 'issued'
     )
     or exists (
       select 1
       from veroxa_private.momo_content_ai_recovery_wakes recent
       where recent.run_id = target_run.id
         and recent.issued_at >
           pg_catalog.clock_timestamp() - interval '5 minutes'
     )
     or exists (
       select 1
       from veroxa_private.momo_content_ai_webhook_events event
       where event.run_id = target_run.id and event.state = 'claimed'
         and event.claim_lease_expires_at > pg_catalog.clock_timestamp()
     ) then
    return;
  end if;

  issued_nonce := extensions.gen_random_uuid();
  issued_ms := pg_catalog.floor(
    extract(epoch from pg_catalog.clock_timestamp()) * 1000
  )::bigint;
  insert into veroxa_private.momo_content_ai_recovery_wakes (
    nonce, signed_at_ms, run_id, request_hash, restaurant_id,
    provider_response_id
  ) values (
    issued_nonce, issued_ms, target_run.id, target_run.request_hash,
    target_run.restaurant_id, target_run.provider_response_id
  );
  return query select issued_nonce, issued_ms;
end;
$$;
revoke all on function
  veroxa_private.issue_momo_content_ai_recovery_wake_v1()
  from public, anon, authenticated, service_role;

create function public.veroxa_claim_momo_content_ai_recovery_v1(
  p_wake_nonce uuid,
  p_signed_at_ms bigint
)
returns table (
  run_id uuid,
  request_hash text,
  restaurant_id uuid,
  provider_response_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  wake veroxa_private.momo_content_ai_recovery_wakes%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
begin
  if p_wake_nonce is null
     or p_wake_nonce =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_signed_at_ms not between 1000000000000 and 9999999999999 then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_recovery_claim_invalid';
  end if;

  select * into wake
  from veroxa_private.momo_content_ai_recovery_wakes target_wake
  where target_wake.nonce = p_wake_nonce;
  if not found then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_recovery_wake_rejected';
  end if;
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = wake.run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
  where target_outbox.run_id = wake.run_id
  for update;
  select * into wake
  from veroxa_private.momo_content_ai_recovery_wakes target_wake
  where target_wake.nonce = p_wake_nonce
  for update;
  if not found or wake.state <> 'issued'
     or wake.signed_at_ms <> p_signed_at_ms
     or wake.run_id is distinct from run.id
     or wake.request_hash is distinct from run.request_hash
     or wake.restaurant_id is distinct from run.restaurant_id
     or wake.issued_at <
       pg_catalog.clock_timestamp() - interval '2 minutes'
     or wake.issued_at >
       pg_catalog.clock_timestamp() + interval '5 seconds' then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_recovery_wake_rejected';
  end if;

  update veroxa_private.momo_content_ai_recovery_wakes target_wake
  set state = 'consumed', consumed_at = pg_catalog.clock_timestamp()
  where target_wake.nonce = wake.nonce
    and target_wake.state = 'issued';

  if outbox.state <> 'response_bound'
     or outbox.request_hash is distinct from run.request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or run.status <> 'provider_running'
     or not run.provider_called
     or run.provider_response_id is null
     or run.provider_response_id is distinct from
       outbox.provider_response_id
     or run.provider_response_id is distinct from
       wake.provider_response_id then
    return;
  end if;

  return query select run.id, run.request_hash, run.restaurant_id,
    run.provider_response_id;
end;
$$;
revoke all on function public.veroxa_claim_momo_content_ai_recovery_v1(
  uuid,bigint
) from public, anon, authenticated;
grant execute on function public.veroxa_claim_momo_content_ai_recovery_v1(
  uuid,bigint
) to service_role;

comment on table veroxa_private.momo_content_ai_recovery_wakes is
  'Private one-time wake ledger for GET-only recovery of already-bound OpenAI response IDs. It cannot create or redispatch a provider response.';
