-- Private, signed, create-only production proof for the media-inspection
-- dependency. It never touches restaurant media, invokes a provider, or
-- authorizes any external customer action.

create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create table veroxa_private.media_inspection_preflight_runs_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  wake_nonce uuid not null unique,
  signed_at_ms bigint not null
    check (signed_at_ms between 1000000000000 and 9999999999999),
  state text not null default 'queued'
    check (state in ('queued','running','passed','failed','delivery_failed')),
  attempt_count integer not null default 0
    check (attempt_count between 0 and 1),
  request_id bigint,
  fixture_sha256 text
    check (fixture_sha256 is null or fixture_sha256 ~ '^[0-9a-f]{64}$'),
  failure_code text
    check (failure_code is null or failure_code ~ '^[a-z0-9_]{3,160}$'),
  diagnostics jsonb
    check (diagnostics is null or (
      pg_catalog.jsonb_typeof(diagnostics) = 'object'
      and pg_catalog.octet_length(diagnostics::text) <= 16384
    )),
  queued_at timestamptz not null default pg_catalog.clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  check (
    (state = 'queued' and attempt_count = 0 and started_at is null and
      completed_at is null and failure_code is null)
    or (state = 'running' and attempt_count = 1 and started_at is not null and
      completed_at is null and failure_code is null)
    or (state = 'passed' and attempt_count = 1 and started_at is not null and
      completed_at is not null and failure_code is null and
      fixture_sha256 is not null)
    or (state = 'failed' and attempt_count = 1 and started_at is not null and
      completed_at is not null and failure_code is not null)
    or (state = 'delivery_failed' and attempt_count = 0 and started_at is null and
      completed_at is not null and failure_code is not null)
  )
);

create index media_inspection_preflight_runs_v1_recent_idx
  on veroxa_private.media_inspection_preflight_runs_v1 (
    queued_at desc, id desc
  );

alter table veroxa_private.media_inspection_preflight_runs_v1
  enable row level security;
alter table veroxa_private.media_inspection_preflight_runs_v1
  force row level security;
revoke all on table veroxa_private.media_inspection_preflight_runs_v1
  from public, anon, authenticated, service_role;

-- The preflight is environment-bound in Vault.  A clean or non-production
-- database without this exact endpoint records a configuration failure and
-- never sends its signed wake to production.
create or replace function
  veroxa_private.media_inspection_preflight_runtime_secret_v1(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $secret$
declare
  secret_count integer;
  secret_value text;
begin
  if not veroxa_private.momo_content_ai_database_boundary_v1() then
    return null;
  end if;
  if p_name not in (
    'veroxa_media_inspection_preflight_endpoint_v1',
    'momo_content_ai_internal_hmac_v1'
  ) then
    return null;
  end if;
  select pg_catalog.count(*)::integer,
    pg_catalog.min(secret.decrypted_secret)
  into secret_count, secret_value
  from vault.decrypted_secrets secret
  where secret.name = p_name;
  if secret_count <> 1 or secret_value is null
     or secret_value is distinct from pg_catalog.btrim(secret_value) then
    return null;
  end if;
  return secret_value;
end;
$secret$;
revoke all on function
  veroxa_private.media_inspection_preflight_runtime_secret_v1(text)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.deliver_media_inspection_preflight_v1()
returns uuid
language plpgsql
security definer
set search_path = ''
as $delivery$
declare
  endpoint text;
  canonical_body constant text := '{"schemaVersion":1}';
  signature_context constant text :=
    'veroxa:media-inspection-preflight:v1' || pg_catalog.chr(10) ||
    'POST' || pg_catalog.chr(10) ||
    '/api/internal/veroxa/media/inspection-preflight';
  run_id uuid;
  wake_nonce uuid := extensions.gen_random_uuid();
  signed_at_ms bigint := pg_catalog.floor(extract(epoch from
    pg_catalog.clock_timestamp()) * 1000)::bigint;
  hmac_secret text;
  signature text;
  queued_request_id bigint;
begin
  -- pg_net delivery is bounded at two minutes. A prior queued delivery that
  -- never reached the private route must become explicit evidence rather than
  -- looking indefinitely pending until the next monitor cycle.
  update veroxa_private.media_inspection_preflight_runs_v1 stale
  set state = 'delivery_failed',
      failure_code = 'media_inspection_preflight_delivery_expired',
      completed_at = pg_catalog.clock_timestamp()
  where stale.state = 'queued'
    and stale.queued_at < pg_catalog.clock_timestamp() - interval '3 minutes';
  update veroxa_private.media_inspection_preflight_runs_v1 stale
  set state = 'failed',
      failure_code = 'media_inspection_preflight_handler_expired',
      completed_at = pg_catalog.clock_timestamp()
  where stale.state = 'running'
    and stale.started_at < pg_catalog.clock_timestamp() - interval '5 minutes';

  insert into veroxa_private.media_inspection_preflight_runs_v1 (
    wake_nonce, signed_at_ms
  ) values (wake_nonce, signed_at_ms)
  returning id into run_id;

  endpoint := veroxa_private.media_inspection_preflight_runtime_secret_v1(
    'veroxa_media_inspection_preflight_endpoint_v1'
  );
  hmac_secret := veroxa_private.media_inspection_preflight_runtime_secret_v1(
    'momo_content_ai_internal_hmac_v1'
  );
  if endpoint is distinct from
       'https://veroxasystems.com/api/internal/veroxa/media/inspection-preflight'
     or hmac_secret is null or hmac_secret !~ '^[0-9a-f]{64}$' then
    update veroxa_private.media_inspection_preflight_runs_v1
    set state = 'delivery_failed',
        failure_code = 'media_inspection_preflight_configuration_unavailable',
        completed_at = pg_catalog.clock_timestamp()
    where id = run_id;
    return run_id;
  end if;

  signature := pg_catalog.encode(extensions.hmac(
    pg_catalog.convert_to(
      signature_context || pg_catalog.chr(10) || signed_at_ms::text ||
      pg_catalog.chr(10) || wake_nonce::text || pg_catalog.chr(10) ||
      canonical_body,
      'UTF8'
    ),
    pg_catalog.decode(hmac_secret, 'hex'),
    'sha256'
  ), 'hex');

  begin
    select net.http_post(
      url := endpoint,
      headers := pg_catalog.jsonb_build_object(
        'content-type', 'application/json',
        'x-veroxa-media-inspection-timestamp-ms', signed_at_ms::text,
        'x-veroxa-media-inspection-nonce', wake_nonce::text,
        'x-veroxa-media-inspection-signature', signature
      ),
      body := pg_catalog.jsonb_build_object('schemaVersion', 1),
      timeout_milliseconds := 120000
    ) into queued_request_id;
    if queued_request_id is null then
      raise exception using errcode = '58000',
        message = 'media_inspection_preflight_delivery_not_queued_v1';
    end if;
    update veroxa_private.media_inspection_preflight_runs_v1
    set request_id = queued_request_id
    where id = run_id;
  exception when others then
    update veroxa_private.media_inspection_preflight_runs_v1
    set state = 'delivery_failed',
        failure_code = 'media_inspection_preflight_delivery_unavailable',
        completed_at = pg_catalog.clock_timestamp()
    where id = run_id;
  end;
  return run_id;
end;
$delivery$;
revoke all on function
  veroxa_private.deliver_media_inspection_preflight_v1()
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_claim_media_inspection_preflight_v1(
  p_wake_nonce uuid,
  p_signed_at_ms bigint
)
returns table (preflight_run_id uuid)
language plpgsql
security definer
set search_path = ''
as $claim$
declare
  claimed veroxa_private.media_inspection_preflight_runs_v1%rowtype;
begin
  if p_wake_nonce is null or
     p_wake_nonce = '00000000-0000-0000-0000-000000000000'::uuid or
     p_signed_at_ms is null or pg_catalog.abs(
       pg_catalog.floor(extract(epoch from pg_catalog.clock_timestamp()) * 1000)
         ::bigint - p_signed_at_ms
     ) > 120000 then
    raise exception using errcode = '42501',
      message = 'media_inspection_preflight_wake_invalid_v1';
  end if;

  select * into claimed
  from veroxa_private.media_inspection_preflight_runs_v1 candidate
  where candidate.wake_nonce = p_wake_nonce
    and candidate.signed_at_ms = p_signed_at_ms
    and candidate.state = 'queued'
    and candidate.queued_at >= pg_catalog.clock_timestamp() - interval '10 minutes'
  for update skip locked;
  if not found then return; end if;

  update veroxa_private.media_inspection_preflight_runs_v1 target
  set state = 'running',
      attempt_count = 1,
      started_at = pg_catalog.clock_timestamp()
  where target.id = claimed.id;
  return query select claimed.id;
end;
$claim$;
revoke all on function
  public.veroxa_claim_media_inspection_preflight_v1(uuid,bigint)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_claim_media_inspection_preflight_v1(uuid,bigint)
  to service_role;

create or replace function public.veroxa_complete_media_inspection_preflight_v1(
  p_run_id uuid,
  p_state text,
  p_failure_code text,
  p_diagnostics jsonb,
  p_fixture_sha256 text
)
returns table (preflight_run_id uuid, state text)
language plpgsql
security definer
set search_path = ''
as $complete$
declare
  receipt veroxa_private.media_inspection_preflight_runs_v1%rowtype;
begin
  if p_run_id is null or p_state not in ('passed','failed') or
     (p_state = 'passed' and (
       p_failure_code is not null or p_fixture_sha256 is null or
       p_fixture_sha256 !~ '^[0-9a-f]{64}$'
     )) or
     (p_state = 'failed' and (
       p_failure_code is null or p_failure_code !~ '^[a-z0-9_]{3,160}$'
     )) or
     (p_diagnostics is not null and (
       pg_catalog.jsonb_typeof(p_diagnostics) <> 'object' or
       pg_catalog.octet_length(p_diagnostics::text) > 16384
     )) then
    raise exception using errcode = '22023',
      message = 'media_inspection_preflight_completion_invalid_v1';
  end if;

  select * into receipt
  from veroxa_private.media_inspection_preflight_runs_v1 candidate
  where candidate.id = p_run_id
  for update;
  if not found or receipt.state <> 'running' or receipt.attempt_count <> 1 then
    raise exception using errcode = '40001',
      message = 'media_inspection_preflight_lease_invalid_v1';
  end if;

  update veroxa_private.media_inspection_preflight_runs_v1 target
  set state = p_state,
      failure_code = p_failure_code,
      diagnostics = p_diagnostics,
      fixture_sha256 = p_fixture_sha256,
      completed_at = pg_catalog.clock_timestamp()
  where target.id = receipt.id;
  return query select receipt.id, p_state;
end;
$complete$;
revoke all on function
  public.veroxa_complete_media_inspection_preflight_v1(uuid,text,text,jsonb,text)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_complete_media_inspection_preflight_v1(uuid,text,text,jsonb,text)
  to service_role;

do $schedule$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'veroxa-media-inspection-preflight'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  -- The canary uses one immutable, create-only 3x2 synthetic JPEG and a
  -- one-pixel transform. It records every terminal outcome in the private
  -- ledger without touching customer media or any external action surface.
  perform cron.schedule(
    'veroxa-media-inspection-preflight',
    '7 * * * *',
    'select veroxa_private.deliver_media_inspection_preflight_v1();'
  );
end;
$schedule$;

comment on table veroxa_private.media_inspection_preflight_runs_v1 is
  'Private dependency-health evidence for production image inspection; no customer media, prompt, provider output, or external write is stored.';
comment on function veroxa_private.deliver_media_inspection_preflight_v1() is
  'Queues a signed private runtime canary for the exact Storage transformation path.';
