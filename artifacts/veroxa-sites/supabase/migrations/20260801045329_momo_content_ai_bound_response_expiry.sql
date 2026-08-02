-- A bound provider response is never redispatched. If neither signed webhooks
-- nor GET-only recovery can settle it after the documented webhook retry
-- window plus a safety margin, close the run conservatively instead of
-- retaining an asset lock forever.

create function
  veroxa_private.expire_momo_content_ai_bound_responses_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  run public.veroxa_momo_content_ai_runs%rowtype;
  outbox veroxa_private.momo_content_ai_dispatch_outbox%rowtype;
  failed_id uuid;
  expired_count bigint := 0;
begin
  for candidate in
    select target_run.id
    from public.veroxa_momo_content_ai_runs target_run
    join veroxa_private.momo_content_ai_dispatch_outbox target_outbox
      on target_outbox.run_id = target_run.id
    where target_run.status = 'provider_running'
      and target_run.provider_called
      and target_run.provider_response_id is not null
      and target_outbox.state = 'response_bound'
      and target_outbox.provider_response_id =
        target_run.provider_response_id
      and target_outbox.response_bound_at <=
        pg_catalog.clock_timestamp() - interval '96 hours'
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_result_outbox result
        where result.run_id = target_run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_webhook_events event
        where event.run_id = target_run.id
          and event.state = 'claimed'
          and event.claim_lease_expires_at > pg_catalog.clock_timestamp()
      )
    order by target_outbox.response_bound_at, target_run.id
    for update of target_run skip locked
    limit 16
  loop
    select * into run
    from public.veroxa_momo_content_ai_runs target_run
    where target_run.id = candidate.id;
    select * into outbox
    from veroxa_private.momo_content_ai_dispatch_outbox target_outbox
    where target_outbox.run_id = candidate.id
    for update;

    if run.status <> 'provider_running'
       or not run.provider_called
       or run.provider_started_at is null
       or run.provider_response_id is null
       or outbox.state <> 'response_bound'
       or outbox.provider_response_id is distinct from
         run.provider_response_id
       or outbox.response_bound_at >
         pg_catalog.clock_timestamp() - interval '96 hours'
       or exists (
         select 1
         from veroxa_private.momo_content_ai_result_outbox result
         where result.run_id = run.id
       )
       or exists (
         select 1
         from veroxa_private.momo_content_ai_webhook_events event
         where event.run_id = run.id
           and event.state = 'claimed'
           and event.claim_lease_expires_at > pg_catalog.clock_timestamp()
       ) then
      continue;
    end if;

    failed_id := public.veroxa_fail_momo_content_ai_run_v1(
      run.id, run.request_hash, run.provider_response_id,
      'provider_response_recovery_timeout', true, null, null,
      run.requested_by
    );
    if failed_id is distinct from run.id then
      raise exception using errcode = '23514',
        message = 'momo_content_ai_bound_response_expiry_invalid';
    end if;
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end;
$$;
revoke all on function
  veroxa_private.expire_momo_content_ai_bound_responses_v1()
  from public, anon, authenticated, service_role;

comment on function
  veroxa_private.expire_momo_content_ai_bound_responses_v1() is
  'After 96 hours, conservatively closes a response-bound Momo content run that signed webhook and GET-only recovery could not settle. It never creates or redispatches a provider response.';
