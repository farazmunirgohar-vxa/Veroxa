-- Activate the signed database-to-Sites dispatch and GET-only recovery wakes.
-- Secrets remain in Supabase Vault; no provider credential or posting endpoint
-- is present in the database. Missing/ambiguous configuration fails before a
-- one-time wake is issued.

create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net with schema extensions;

-- pg_net's upstream install grants broad PUBLIC access to its schema and queue
-- objects. This release uses it only behind the private security-definer wake
-- functions below, so remove every inherited direct-call/read path first.
revoke all on schema net from public, anon, authenticated, service_role;
revoke all on all tables in schema net
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema net
  from public, anon, authenticated, service_role;
revoke all on all functions in schema net
  from public, anon, authenticated, service_role;

create function veroxa_private.momo_content_ai_runtime_secret_v1(
  p_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_count integer;
  secret_value text;
begin
  if p_name not in (
    'momo_content_ai_dispatch_endpoint_v1',
    'momo_content_ai_recovery_endpoint_v1',
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
$$;
revoke all on function
  veroxa_private.momo_content_ai_runtime_secret_v1(text)
  from public, anon, authenticated, service_role;

create function veroxa_private.deliver_momo_content_ai_dispatch_wake_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  hmac_secret text;
  wake record;
  signature text;
  request_id bigint;
  canonical_body constant text := '{"schemaVersion":1}';
  signature_context constant text :=
    'veroxa:momo-content-ai-dispatch-wake:v1' || pg_catalog.chr(10) ||
    'POST' || pg_catalog.chr(10) ||
    '/api/internal/momo/content-ai/dispatch';
begin
  endpoint := veroxa_private.momo_content_ai_runtime_secret_v1(
    'momo_content_ai_dispatch_endpoint_v1'
  );
  hmac_secret := veroxa_private.momo_content_ai_runtime_secret_v1(
    'momo_content_ai_internal_hmac_v1'
  );
  if endpoint is distinct from
       'https://veroxasystems.com/api/internal/momo/content-ai/dispatch'
     or hmac_secret is null
     or hmac_secret !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select * into wake
  from veroxa_private.issue_momo_content_ai_dispatch_wake_v1();
  if not found then return null; end if;
  signature := pg_catalog.encode(extensions.hmac(
    pg_catalog.convert_to(
      signature_context || pg_catalog.chr(10) ||
      wake.wake_signed_at_ms::text || pg_catalog.chr(10) ||
      wake.wake_nonce::text || pg_catalog.chr(10) || canonical_body,
      'UTF8'
    ),
    pg_catalog.decode(hmac_secret, 'hex'),
    'sha256'
  ), 'hex');

  select net.http_post(
    url := endpoint,
    headers := pg_catalog.jsonb_build_object(
      'content-type', 'application/json',
      'x-veroxa-dispatch-timestamp-ms', wake.wake_signed_at_ms::text,
      'x-veroxa-dispatch-nonce', wake.wake_nonce::text,
      'x-veroxa-dispatch-signature', signature
    ),
    body := pg_catalog.jsonb_build_object('schemaVersion', 1),
    timeout_milliseconds := 120000
  ) into request_id;
  if request_id is null then
    raise exception using errcode = '58000',
      message = 'momo_content_ai_dispatch_delivery_not_queued';
  end if;
  return request_id;
end;
$$;
revoke all on function
  veroxa_private.deliver_momo_content_ai_dispatch_wake_v1()
  from public, anon, authenticated, service_role;

create function veroxa_private.deliver_momo_content_ai_recovery_wake_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  hmac_secret text;
  wake record;
  signature text;
  request_id bigint;
  canonical_body constant text := '{"schemaVersion":1}';
  signature_context constant text :=
    'veroxa:momo-content-ai-recovery-wake:v1' || pg_catalog.chr(10) ||
    'POST' || pg_catalog.chr(10) ||
    '/api/internal/momo/content-ai/recover';
begin
  endpoint := veroxa_private.momo_content_ai_runtime_secret_v1(
    'momo_content_ai_recovery_endpoint_v1'
  );
  hmac_secret := veroxa_private.momo_content_ai_runtime_secret_v1(
    'momo_content_ai_internal_hmac_v1'
  );
  if endpoint is distinct from
       'https://veroxasystems.com/api/internal/momo/content-ai/recover'
     or hmac_secret is null
     or hmac_secret !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select * into wake
  from veroxa_private.issue_momo_content_ai_recovery_wake_v1();
  if not found then return null; end if;
  signature := pg_catalog.encode(extensions.hmac(
    pg_catalog.convert_to(
      signature_context || pg_catalog.chr(10) ||
      wake.wake_signed_at_ms::text || pg_catalog.chr(10) ||
      wake.wake_nonce::text || pg_catalog.chr(10) || canonical_body,
      'UTF8'
    ),
    pg_catalog.decode(hmac_secret, 'hex'),
    'sha256'
  ), 'hex');

  select net.http_post(
    url := endpoint,
    headers := pg_catalog.jsonb_build_object(
      'content-type', 'application/json',
      'x-veroxa-recovery-timestamp-ms', wake.wake_signed_at_ms::text,
      'x-veroxa-recovery-nonce', wake.wake_nonce::text,
      'x-veroxa-recovery-signature', signature
    ),
    body := pg_catalog.jsonb_build_object('schemaVersion', 1),
    timeout_milliseconds := 120000
  ) into request_id;
  if request_id is null then
    raise exception using errcode = '58000',
      message = 'momo_content_ai_recovery_delivery_not_queued';
  end if;
  return request_id;
end;
$$;
revoke all on function
  veroxa_private.deliver_momo_content_ai_recovery_wake_v1()
  from public, anon, authenticated, service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in (
      'veroxa-momo-content-ai-dispatch',
      'veroxa-momo-content-ai-response-recovery',
      'veroxa-momo-content-ai-bound-response-expiry'
    )
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'veroxa-momo-content-ai-dispatch',
    '* * * * *',
    'select veroxa_private.deliver_momo_content_ai_dispatch_wake_v1();'
  );
  perform cron.schedule(
    'veroxa-momo-content-ai-response-recovery',
    '*/5 * * * *',
    'select veroxa_private.deliver_momo_content_ai_recovery_wake_v1();'
  );
  perform cron.schedule(
    'veroxa-momo-content-ai-bound-response-expiry',
    '*/15 * * * *',
    'select veroxa_private.expire_momo_content_ai_bound_responses_v1();'
  );
end;
$$;

comment on function
  veroxa_private.deliver_momo_content_ai_dispatch_wake_v1() is
  'Queues one signed Momo-only content dispatch wake through pg_net after exact Vault configuration is verified. It never calls a provider or posting endpoint.';
comment on function
  veroxa_private.deliver_momo_content_ai_recovery_wake_v1() is
  'Queues one signed GET-only recovery wake for an already-bound Momo OpenAI response. It cannot create or publish content.';
