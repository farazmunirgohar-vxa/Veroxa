-- Run after all migrations against a disposable/local Supabase database.
-- Fails immediately if Audit Center is not a separate, Team-only domain.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);
select lives_ok($test$
do $$
declare
  unsafe_policy record;
  operational_fk record;
begin
  if to_regclass('public.audit_restaurants') is null
     or to_regclass('public.audit_requests') is null
     or to_regclass('public.audit_runs') is null
     or to_regclass('public.audit_findings') is null
     or to_regclass('public.audit_reports') is null then
    raise exception 'Audit Center V1 tables are missing';
  end if;

  if not exists (
    select 1 from pg_class table_record
    join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
    where schema_record.nspname = 'public'
      and table_record.relname = 'audit_requests'
      and table_record.relrowsecurity
      and table_record.relforcerowsecurity
  ) then
    raise exception 'Audit Center RLS is not enabled and forced';
  end if;

  select schemaname, tablename, policyname into unsafe_policy
  from pg_policies
  where schemaname = 'public'
    and tablename like 'audit_%'
    and ('anon'::name = any(roles) or 'public'::name = any(roles))
  limit 1;
  if found then
    raise exception 'anonymous Audit Center table policy exists: %.%.%',
      unsafe_policy.schemaname, unsafe_policy.tablename, unsafe_policy.policyname;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename like 'audit_%'
      and ('authenticated'::name = any(roles))
      and coalesce(qual, '') || coalesce(with_check, '')
        not like '%veroxa_current_user_is_active_team%'
  ) then
    raise exception 'an Audit Center policy is not Team-only';
  end if;

  select source_table.relname as source_table, target_table.relname as target_table
  into operational_fk
  from pg_constraint constraint_record
  join pg_class source_table on source_table.oid = constraint_record.conrelid
  join pg_class target_table on target_table.oid = constraint_record.confrelid
  join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
  join pg_namespace target_schema on target_schema.oid = target_table.relnamespace
  where constraint_record.contype = 'f'
    and source_schema.nspname = 'public'
    and source_table.relname like 'audit_%'
    and target_schema.nspname = 'public'
    and target_table.relname in (
      'clients', 'restaurants', 'restaurant_members', 'restaurant_profile_fields',
      'media_assets', 'messages', 'ai_drafts', 'approvals', 'reports'
    )
  limit 1;
  if found then
    raise exception 'Audit Center links to operational table: % -> %',
      operational_fk.source_table, operational_fk.target_table;
  end if;

  if to_regprocedure('public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamp with time zone,text,text,text,text)') is null then
    raise exception 'validated public Audit Center intake function is missing';
  end if;
  if has_function_privilege('anon', 'public.create_team_audit_v1(text,text,text,text,text,text,text,text)', 'execute')
     or has_function_privilege('anon', 'public.start_audit_rerun_v1(uuid)', 'execute') then
    raise exception 'anonymous role can execute a Team-only Audit Center function';
  end if;
  if has_function_privilege('authenticated', 'public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamp with time zone,text,text,text,text)', 'execute') then
    raise exception 'signed-in users can bypass the server-only public intake route';
  end if;
  if not has_function_privilege('authenticated', 'public.create_team_audit_v1(text,text,text,text,text,text,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.start_audit_rerun_v1(uuid)', 'execute') then
    raise exception 'authenticated Team role cannot execute required Audit Center functions';
  end if;
  if to_regclass('private.audit_intake_config') is null then
    raise exception 'private Audit Center intake secret store is missing';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'audit_runs_reviewed_immutable' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgname = 'audit_reports_reviewed_immutable' and not tgisinternal
  ) then
    raise exception 'reviewed Audit Center records are not immutable';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'audit_restaurants_public_identity_guard' and not tgisinternal
  ) then
    raise exception 'anonymous audit restaurant identity protection is missing';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'audit_runs_review_gate' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgname = 'audit_reports_review_gate' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgname = 'audit_requests_review_gate' and not tgisinternal
  ) then
    raise exception 'evidence-backed Audit Center review gates are missing';
  end if;
end $$;
$test$, 'Restaurant Audit Center V1 catalog, isolation, and review gates are valid');

select lives_ok($workflow$
do $$
declare
  v_restaurant_id uuid := '20000000-0000-0000-0000-000000000001';
  v_team_user_id uuid := '10000000-0000-0000-0000-000000000001';
  v_client_user_id uuid := '10000000-0000-0000-0000-000000000002';
  v_request_id uuid;
  v_public_request_id uuid;
  v_repeat_request_id uuid;
  v_run_id uuid;
  v_rerun_id uuid;
  v_visible_count bigint;
  v_canonical_website text;
  v_snapshot_website text;
  v_rate_index integer;
  v_secret text := repeat('c', 64);
  v_fingerprint text;
  v_token text;
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values (v_restaurant_id, 'Momo Test Scope', 'San Antonio', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope (scope_key, restaurant_id, enabled)
  values ('momo_house_san_antonio', v_restaurant_id, true);
  insert into veroxa_private.auth_identity_allowlist (email, role, display_name, restaurant_id, enabled)
  values
    ('team-ci@veroxa.invalid', 'team', 'Team CI', v_restaurant_id, true),
    ('client-ci@veroxa.invalid', 'client', 'Client CI', v_restaurant_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_team_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'team-ci@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_client_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'client-ci@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  if not exists (
    select 1 from public.veroxa_restaurant_members
    where restaurant_id = v_restaurant_id and user_id = v_team_user_id
      and role = 'team' and status = 'active'
  ) or not exists (
    select 1 from public.veroxa_restaurant_members
    where restaurant_id = v_restaurant_id and user_id = v_client_user_id
      and role = 'client' and status = 'active'
  ) then
    raise exception 'allowlisted auth identities were not provisioned';
  end if;

  begin
    perform set_config('request.jwt.claims', jsonb_build_object(
      'sub', v_client_user_id::text, 'role', 'authenticated'
    )::text, true);
    execute 'set local role authenticated';
    if public.veroxa_current_user_is_active_team()
       or not public.veroxa_current_user_has_active_restaurant(v_restaurant_id) then
      raise exception 'client role matrix is incorrect';
    end if;
    select count(*) into v_visible_count from public.audit_requests;
    if v_visible_count <> 0 then
      raise exception 'client can read Team Audit Center rows';
    end if;
    begin
      perform * from public.create_team_audit_v1(
        'Denied Client Audit', 'San Antonio', 'TX', null, null, null, null, null
      );
      raise exception 'client unexpectedly created a Team audit';
    exception when insufficient_privilege then null;
    end;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;

  begin
    perform set_config('request.jwt.claims', jsonb_build_object(
      'sub', v_team_user_id::text, 'role', 'authenticated'
    )::text, true);
    execute 'set local role authenticated';
    if not public.veroxa_current_user_is_active_team() then
      raise exception 'active Team identity is denied';
    end if;
    select created.request_id into v_request_id
    from public.create_team_audit_v1(
      'CI Test Restaurant', 'Austin', 'TX', 'https://canonical.example',
      'https://www.google.com/maps/place/canonical', 'team-owner@example.invalid',
      '+1 210 555 0199', 'CI-created audit with preserved Team context.'
    ) created;
    select id into v_run_id from public.audit_runs
    where audit_request_id = v_request_id and run_number = 1;

    begin
      update public.audit_requests set status = 'reviewed' where id = v_request_id;
      raise exception 'request review gate accepted a request without a reviewed report';
    exception when check_violation then null;
    end;
    begin
      insert into public.audit_reports (
        audit_run_id, status, executive_summary, priority_actions, prepared_by
      ) values (
        v_run_id, 'reviewed', 'Premature reviewed report summary is intentionally long.',
        'Premature reviewed report actions are intentionally long.', v_team_user_id
      );
      raise exception 'report review gate accepted an unreviewed run';
    exception when check_violation then null;
    end;

    insert into public.audit_findings (
      audit_run_id, category, severity, title, summary,
      evidence_url, evidence_label, recommended_action, created_by
    ) values (
      v_run_id, 'website', 'high', 'Primary contact path is unclear',
      'The reviewed website evidence shows the contact path needs clarification.',
      'https://canonical.example/contact', 'Reviewed website evidence',
      'Clarify the primary restaurant contact path.', v_team_user_id
    );
    update public.audit_runs
      set status = 'reviewed', score_snapshot = '{"overall":62}'::jsonb
      where id = v_run_id;
    insert into public.audit_reports (
      audit_run_id, status, executive_summary, priority_actions, prepared_by
    ) values (
      v_run_id, 'reviewed',
      'The reviewed audit found one evidence-backed website opportunity.',
      'Clarify the primary contact path and re-check the published page.',
      v_team_user_id
    );
    update public.audit_requests set status = 'reviewed' where id = v_request_id;

    begin
      update public.audit_findings
      set summary = 'A reviewed finding must not be mutable.'
      where audit_run_id = v_run_id;
      raise exception 'reviewed finding was mutable';
    exception when object_not_in_prerequisite_state then null;
    end;

    select public.start_audit_rerun_v1(v_request_id) into v_rerun_id;
    insert into public.audit_findings (
      audit_run_id, category, severity, title, summary,
      evidence_url, evidence_label, recommended_action, created_by
    ) values (
      v_rerun_id, 'website', 'medium', 'Contact path improved',
      'The repeat review shows a clearer contact path and one remaining action.',
      'https://canonical.example/contact', 'Repeat website evidence',
      'Keep the path consistent across restaurant profiles.', v_team_user_id
    );
    begin
      update public.audit_runs set status = 'reviewed' where id = v_rerun_id;
      raise exception 'reviewed rerun accepted no comparison';
    exception when check_violation then null;
    end;
    update public.audit_runs
      set status = 'reviewed', comparison_summary = 'The contact path improved since run one.'
      where id = v_rerun_id;
    insert into public.audit_reports (
      audit_run_id, status, executive_summary, priority_actions, prepared_by
    ) values (
      v_rerun_id, 'reviewed',
      'The repeat audit verifies a meaningful contact-path improvement.',
      'Maintain the improvement and align the same path on every profile.',
      v_team_user_id
    );
    update public.audit_requests set status = 'reviewed' where id = v_request_id;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;

  insert into private.audit_intake_config (singleton, hmac_secret)
  values (true, v_secret)
  on conflict (singleton) do update set hmac_secret = excluded.hmac_secret;
  v_fingerprint := 'ci-public-fingerprint-1';
  v_token := encode(extensions.hmac(v_fingerprint, v_secret, 'sha256'), 'hex');
  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    select submitted.request_id into v_public_request_id
    from public.submit_audit_request_v1(
      'CI Test Restaurant', 'Austin', 'TX', 'https://untrusted.example',
      'https://www.google.com/maps/place/untrusted', 'Public CI',
      'public-ci@example.invalid', null, 'Public context', true, '2026-07-12',
      now() - interval '4 seconds', null, v_fingerprint, v_token,
      'ci-idempotency-key-0001'
    ) submitted;
    select submitted.request_id into v_repeat_request_id
    from public.submit_audit_request_v1(
      'CI Test Restaurant', 'Austin', 'TX', 'https://untrusted.example',
      'https://www.google.com/maps/place/untrusted', 'Public CI',
      'public-ci@example.invalid', null, 'Public context', true, '2026-07-12',
      now() - interval '4 seconds', null, v_fingerprint, v_token,
      'ci-idempotency-key-0001'
    ) submitted;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;
  if v_public_request_id is distinct from v_repeat_request_id then
    raise exception 'public intake idempotency failed';
  end if;
  select restaurant.website_url into v_canonical_website
  from public.audit_restaurants restaurant
  where restaurant.normalized_name = 'ci test restaurant'
    and restaurant.normalized_city = 'austin'
    and restaurant.normalized_state = 'tx';
  if v_canonical_website is distinct from 'https://canonical.example' then
    raise exception 'public intake overwrote canonical restaurant identity';
  end if;
  select run.source_snapshot ->> 'website_url' into v_snapshot_website
  from public.audit_runs run
  where run.audit_request_id = v_public_request_id and run.run_number = 1;
  if v_snapshot_website is distinct from 'https://untrusted.example' then
    raise exception 'public-submitted source context was not preserved for review';
  end if;

  begin
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    for v_rate_index in 2..3 loop
      v_fingerprint := 'ci-public-fingerprint-' || v_rate_index::text;
      v_token := encode(extensions.hmac(v_fingerprint, v_secret, 'sha256'), 'hex');
      perform * from public.submit_audit_request_v1(
        'CI Rate Restaurant ' || v_rate_index::text, 'Austin', 'TX', null, null,
        'Public CI', 'public-ci@example.invalid', null, null, true, '2026-07-12',
        now() - interval '4 seconds', null, v_fingerprint, v_token,
        'ci-idempotency-key-000' || v_rate_index::text
      );
    end loop;
    v_fingerprint := 'ci-public-fingerprint-4';
    v_token := encode(extensions.hmac(v_fingerprint, v_secret, 'sha256'), 'hex');
    begin
      perform * from public.submit_audit_request_v1(
        'CI Rate Restaurant 4', 'Austin', 'TX', null, null,
        'Public CI', 'public-ci@example.invalid', null, null, true, '2026-07-12',
        now() - interval '4 seconds', null, v_fingerprint, v_token,
        'ci-idempotency-key-0004'
      );
      raise exception 'rate_limit_not_enforced';
    exception when sqlstate 'P0001' then
      if sqlerrm <> 'rate_limited' then raise; end if;
    end;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;

  begin
    perform set_config('request.jwt.claims', jsonb_build_object(
      'sub', v_client_user_id::text, 'role', 'authenticated'
    )::text, true);
    execute 'set local role authenticated';
    select count(*) into v_visible_count from public.audit_requests;
    if v_visible_count <> 0 then
      raise exception 'client can read populated Team Audit Center rows';
    end if;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;

  update public.veroxa_restaurant_members
    set status = 'disabled'
    where restaurant_id = v_restaurant_id and user_id = v_team_user_id;
  begin
    perform set_config('request.jwt.claims', jsonb_build_object(
      'sub', v_team_user_id::text, 'role', 'authenticated'
    )::text, true);
    execute 'set local role authenticated';
    begin
      perform * from public.create_team_audit_v1(
        'Revoked Team Audit', 'San Antonio', 'TX', null, null, null, null, null
      );
      raise exception 'revoked Team membership retained Audit Center access';
    exception when insufficient_privilege then null;
    end;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    raise;
  end;
end $$;
$workflow$, 'role matrix, signed intake, idempotency, isolation, review gates, immutability, and rerun workflow pass');
select * from finish();
rollback;
