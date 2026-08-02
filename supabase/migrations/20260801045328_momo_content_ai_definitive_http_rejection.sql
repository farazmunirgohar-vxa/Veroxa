-- Close bounded, structurally valid provider HTTP rejections immediately.
-- The POST did occur, so accounting remains conservative; the immutable
-- receipt distinguishes a definitive provider rejection from transport
-- uncertainty without ever retrying the request.

create table veroxa_private.momo_content_ai_provider_rejection_receipts (
  dispatch_claim_token uuid primary key check (
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
  provider_http_status integer not null check (
    provider_http_status in (400,401,403,404,405,413,415,422)
  ),
  provider_response_sha256 text not null check (
    provider_response_sha256 ~ '^[0-9a-f]{64}$'
  ),
  provider_request_id text check (
    provider_request_id is null or (
      provider_request_id = pg_catalog.btrim(provider_request_id)
      and pg_catalog.char_length(provider_request_id) <= 200
      and provider_request_id ~ '^req_[A-Za-z0-9_-]{8,195}$'
    )
  ),
  rejected_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (run_id, request_hash, dispatch_claim_token)
);
alter table veroxa_private.momo_content_ai_provider_rejection_receipts
  enable row level security;
alter table veroxa_private.momo_content_ai_provider_rejection_receipts
  force row level security;
revoke all on table
  veroxa_private.momo_content_ai_provider_rejection_receipts
  from public, anon, authenticated, service_role;

create function
  veroxa_private.guard_momo_content_ai_provider_rejection_receipt_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_content_ai_provider_rejection_receipt_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_ai_provider_rejection_receipt_v1()
  from public, anon, authenticated, service_role;
create trigger momo_content_ai_provider_rejection_receipt_guard
before update or delete
on veroxa_private.momo_content_ai_provider_rejection_receipts
for each row execute function
  veroxa_private.guard_momo_content_ai_provider_rejection_receipt_v1();

create function public.veroxa_reject_momo_content_ai_dispatch_after_post_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_provider_request_sha256 text,
  p_provider_http_status integer,
  p_provider_response_sha256 text,
  p_provider_request_id text
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
    veroxa_private.momo_content_ai_provider_rejection_receipts%rowtype;
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
     or p_provider_http_status not in (400,401,403,404,405,413,415,422)
     or p_provider_response_sha256 !~ '^[0-9a-f]{64}$'
     or (p_provider_request_id is not null and (
       p_provider_request_id is distinct from
         pg_catalog.btrim(p_provider_request_id)
       or pg_catalog.char_length(p_provider_request_id) > 200
       or p_provider_request_id !~ '^req_[A-Za-z0-9_-]{8,195}$'
     )) then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_provider_rejection_invalid';
  end if;

  -- Global order is RUN -> OUTBOX -> RECEIPT. Claim and ledger rows are read
  -- after their owning run/outbox locks, matching the dispatch lifecycle.
  select * into run
  from public.veroxa_momo_content_ai_runs target_run
  where target_run.id = p_run_id
  for update;
  select * into outbox
  from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
  where target_outbox.run_id = p_run_id
  for update;
  select * into receipt
  from veroxa_private.momo_content_ai_provider_rejection_receipts
    target_receipt
  where target_receipt.dispatch_claim_token = p_dispatch_claim_token
  for update;

  if receipt.dispatch_claim_token is not null then
    if receipt.run_id is distinct from p_run_id
       or receipt.request_hash is distinct from p_request_hash
       or receipt.lease_token is distinct from p_lease_token
       or receipt.provider_request_sha256 is distinct from
         p_provider_request_sha256
       or receipt.provider_http_status is distinct from
         p_provider_http_status
       or receipt.provider_response_sha256 is distinct from
         p_provider_response_sha256
       or receipt.provider_request_id is distinct from p_provider_request_id
       or run.id is distinct from receipt.run_id
       or run.request_hash is distinct from receipt.request_hash
       or run.restaurant_id is distinct from receipt.restaurant_id
       or run.status <> 'failed' or not run.provider_called
       or run.provider_started_at is null
       or run.provider_response_id is not null
       or run.dispatch_claim_token is not null
       or run.provider_usage is not null
       or run.provider_error_code <>
         'provider_http_error_without_response'
       or run.accounted_microusd <> run.reserved_microusd
       or run.accounting_basis <> 'conservative_reservation'
       or run.completed_at is null
       or outbox.run_id is distinct from run.id
       or outbox.state <> 'terminal'
       or outbox.request_hash is distinct from run.request_hash
       or outbox.restaurant_id is distinct from run.restaurant_id
       or outbox.lease_token is distinct from p_lease_token
       or outbox.dispatch_claim_token is distinct from
         p_dispatch_claim_token
       or outbox.provider_request_sha256 is distinct from
         p_provider_request_sha256
       or outbox.provider_response_id is not null
       or outbox.terminal_at is null
       or not exists (
         select 1
         from veroxa_private.momo_content_ai_dispatch_claims claim
         where claim.dispatch_claim_token = p_dispatch_claim_token
           and claim.run_id = run.id
           and claim.request_hash = run.request_hash
           and claim.restaurant_id = run.restaurant_id
           and claim.state = 'terminal'
       )
       or not exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
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
      raise exception using errcode = '23505',
        message = 'momo_content_ai_provider_rejection_replay_conflict';
    end if;
    return run.id;
  end if;

  if run.id is null or outbox.run_id is null
     or run.request_hash is distinct from p_request_hash
     or outbox.request_hash is distinct from p_request_hash
     or outbox.restaurant_id is distinct from run.restaurant_id
     or run.status <> 'provider_running' or not run.provider_called
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
     or outbox.state <> 'send_intent'
     or outbox.lease_token is distinct from p_lease_token
     or outbox.dispatch_claim_token is distinct from
       p_dispatch_claim_token
     or outbox.provider_request_sha256 is distinct from
       p_provider_request_sha256
     or outbox.provider_response_id is not null
     or outbox.response_bound_at is not null
     or outbox.reconciliation_required_at is not null
     or not exists (
       select 1
       from veroxa_private.momo_content_ai_dispatch_claims claim
       where claim.dispatch_claim_token = p_dispatch_claim_token
         and claim.run_id = run.id
         and claim.request_hash = run.request_hash
         and claim.restaurant_id = run.restaurant_id
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
     ) then
    raise exception using errcode = '23514',
      message = 'momo_content_ai_provider_rejection_state_invalid';
  end if;

  insert into
    veroxa_private.momo_content_ai_provider_rejection_receipts (
      dispatch_claim_token, run_id, request_hash, restaurant_id,
      lease_token, provider_request_sha256, provider_http_status,
      provider_response_sha256, provider_request_id
    ) values (
      p_dispatch_claim_token, run.id, run.request_hash, run.restaurant_id,
      p_lease_token, p_provider_request_sha256, p_provider_http_status,
      p_provider_response_sha256, p_provider_request_id
    );

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
      message = 'momo_content_ai_provider_rejection_race';
  end if;

  update veroxa_private.momo_ai_cost_ledger ledger
  set state = 'uncertain', provider_called = true,
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
      message = 'momo_content_ai_provider_rejection_ledger_invalid';
  end if;
  return run.id;
end;
$$;
revoke all on function
  public.veroxa_reject_momo_content_ai_dispatch_after_post_v1(
    uuid,text,uuid,uuid,text,integer,text,text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_reject_momo_content_ai_dispatch_after_post_v1(
    uuid,text,uuid,uuid,text,integer,text,text
  ) to service_role;

comment on table
  veroxa_private.momo_content_ai_provider_rejection_receipts is
  'Immutable proof of a bounded, structurally valid provider HTTP rejection after an exact Momo content POST. It never authorizes redispatch.';
