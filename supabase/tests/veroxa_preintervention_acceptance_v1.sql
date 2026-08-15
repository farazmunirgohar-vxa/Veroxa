-- Executable tenant, idempotency, SHA, and external-lock contract for the
-- isolated Veroxa pre-intervention acceptance path.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

insert into public.veroxa_restaurants (
  id, name, city, state, timezone, status
) values (
  '21000000-0000-4000-8000-000000000191'::uuid,
  'Veroxa Internal Acceptance CI 20260815',
  'Synthetic', 'TX', 'America/Chicago', 'active'
);

insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11000000-0000-4000-8000-000000000191'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'acceptance-client-20260815@veroxa.invalid',
    pg_catalog.clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ),
  (
    '12000000-0000-4000-8000-000000000191'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'acceptance-team-20260815@veroxa.invalid',
    pg_catalog.clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );

insert into public.veroxa_user_profiles (
  user_id, email, role, display_name, status
) values
  (
    '11000000-0000-4000-8000-000000000191'::uuid,
    'acceptance-client-20260815@veroxa.invalid', 'client',
    'Internal Acceptance Client', 'active'
  ),
  (
    '12000000-0000-4000-8000-000000000191'::uuid,
    'acceptance-team-20260815@veroxa.invalid', 'team',
    'Internal Acceptance Team', 'active'
  );
insert into public.veroxa_restaurant_members (
  restaurant_id, user_id, role, status
) values
  (
    '21000000-0000-4000-8000-000000000191'::uuid,
    '11000000-0000-4000-8000-000000000191'::uuid,
    'client', 'active'
  ),
  (
    '21000000-0000-4000-8000-000000000191'::uuid,
    '12000000-0000-4000-8000-000000000191'::uuid,
    'team', 'active'
  );

select lives_ok(
  $$select veroxa_private.provision_internal_acceptance_scope_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    'veroxa_internal_acceptance_ci_20260815',
    '11000000-0000-4000-8000-000000000191'::uuid,
    '12000000-0000-4000-8000-000000000191'::uuid
  )$$,
  'a dedicated fictional tenant provisions through the private boundary'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.operational_restaurant_scope scope
    where scope.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  0,
  'the Momo singleton does not acquire the internal acceptance tenant'
);
select ok(
  (
    select scope.enabled and not scope.customer_visible
      and scope.excluded_from_reports
      and not scope.external_write_allowed
      and scope.purpose = 'synthetic_upload_to_ready'
      and scope.evidence_snapshot ->> 'excludedFromReports' = 'true'
    from veroxa_private.internal_acceptance_scope_v1 scope
    where scope.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  'the internal binding is enabled, test-labeled, invisible, and write-locked'
);
select ok(
  not pg_catalog.has_table_privilege(
    'service_role',
    'veroxa_private.internal_acceptance_scope_v1',
    'select,insert,update,delete'
  ) and not pg_catalog.has_table_privilege(
    'service_role',
    'veroxa_private.media_upload_sessions_v1',
    'select,insert,update,delete'
  ) and not pg_catalog.has_table_privilege(
    'service_role',
    'veroxa_private.media_upload_session_aliases_v1',
    'select,insert,update,delete'
  ),
  'service_role cannot directly read or mutate private acceptance controls'
);
select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_register_momo_media_v3(uuid,text,text,bigint,text,jsonb,date,text,text)',
    'execute'
  ) and pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_begin_media_upload_v1(uuid,uuid,text,text,bigint,text,jsonb,date,text,text)',
    'execute'
  ) and pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_commit_media_upload_v1(uuid)',
    'execute'
  ),
  'authenticated Client registration is begin/commit only'
);
select ok(
  veroxa_private.actor_has_supported_operational_membership_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '11000000-0000-4000-8000-000000000191'::uuid,
    'client'::public.veroxa_role_v1
  ),
  'the bound single-membership client is accepted for its test tenant'
);
select ok(
  veroxa_private.actor_has_supported_operational_membership_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '12000000-0000-4000-8000-000000000191'::uuid,
    'team'::public.veroxa_role_v1
  ),
  'the bound single-membership Team actor is accepted for its test tenant'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000191","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '12000000-0000-4000-8000-000000000191', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is(
  public.veroxa_current_user_is_active_team(),
  false,
  'the internal Team actor never enters the Momo-global Team surface'
);
select is(
  public.veroxa_current_user_is_team_for_restaurant(
    '21000000-0000-4000-8000-000000000191'::uuid
  ),
  true,
  'the internal Team actor receives only target-scoped Team access'
);
set local role authenticated;
select is(
  (select pg_catalog.count(*)::integer from public.veroxa_user_profiles),
  2,
  'the test Team sees only the two profiles in its own tenant'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-4000-8000-000000000191","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '11000000-0000-4000-8000-000000000191', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temporary table acceptance_begin_v1 on commit drop as
select * from public.veroxa_begin_media_upload_v1(
  '21000000-0000-4000-8000-000000000191'::uuid,
  '41000000-0000-4000-8000-000000000191'::uuid,
  repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
  '["instagram","facebook"]'::jsonb, null,
  'represents_current_restaurant_offering',
  'Synthetic food fixture owned only by the fictional acceptance restaurant.'
);
select is(
  (select session_status from acceptance_begin_v1),
  'initiated',
  'authenticated initiation creates one pending private upload session'
);
select is(
  (
    select replay.upload_session_id
    from public.veroxa_begin_media_upload_v1(
      '21000000-0000-4000-8000-000000000191'::uuid,
      '41000000-0000-4000-8000-000000000191'::uuid,
      repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
      '["instagram","facebook"]'::jsonb, null,
      'represents_current_restaurant_offering',
      'Synthetic food fixture owned only by the fictional acceptance restaurant.'
    ) replay
  ),
  (select upload_session_id from acceptance_begin_v1),
  'the same idempotency key returns the same session'
);
select is(
  (
    select replay.upload_session_id
    from public.veroxa_begin_media_upload_v1(
      '21000000-0000-4000-8000-000000000191'::uuid,
      '42000000-0000-4000-8000-000000000191'::uuid,
      repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
      '["instagram","facebook"]'::jsonb, null,
      'represents_current_restaurant_offering',
      'Synthetic food fixture owned only by the fictional acceptance restaurant.'
    ) replay
  ),
  (select upload_session_id from acceptance_begin_v1),
  'an exact content/request replay also reuses the original session and object'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '41000000-0000-4000-8000-000000000191'::uuid,
    repeat('2', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
    '["instagram","facebook"]'::jsonb, null,
    'represents_current_restaurant_offering',
    'Synthetic food fixture owned only by the fictional acceptance restaurant.'
  )$$,
  '23505',
  'media_upload_session_idempotency_conflict',
  'a reused idempotency key with changed bytes fails closed'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '43000000-0000-4000-8000-000000000191'::uuid,
    repeat('1', 64), 'image/jpeg', 12000, 'renamed-synthetic.jpg',
    '["instagram"]'::jsonb, null,
    'represents_current_restaurant_offering',
    'Changed metadata cannot allocate another object for identical bytes.'
  )$$,
  '23505',
  'media_upload_content_metadata_conflict',
  'same content with changed metadata cannot create a second object'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.media_upload_session_aliases_v1 alias_record
    where alias_record.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  2,
  'both exact idempotency keys are immutably aliased to one session'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.media_upload_sessions_v1'::pg_catalog.regclass
      and constraint_record.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_record.oid)
        like '%restaurant_id, actor_id, original_sha256%'
  ),
  1,
  'one tenant actor can have only one session for an original SHA-256'
);
select throws_ok(
  $$update veroxa_private.media_upload_session_aliases_v1 alias_record
    set request_sha256 = repeat('9', 64)
    where alias_record.client_idempotency_key =
      '42000000-0000-4000-8000-000000000191'::uuid$$,
  '23514',
  'media_upload_session_alias_is_immutable',
  'an idempotency-key alias can never be rebound'
);

insert into storage.objects (
  bucket_id, name, owner, owner_id, version, metadata
)
select 'restaurant-media', begin_row.storage_path,
  '11000000-0000-4000-8000-000000000191'::uuid,
  '11000000-0000-4000-8000-000000000191',
  'acceptance-object-v1',
  '{"mimetype":"image/jpeg","size":12000}'::jsonb
from acceptance_begin_v1 begin_row;

create temporary table acceptance_commit_v1 on commit drop as
select * from public.veroxa_commit_media_upload_v1(
  (select upload_session_id from acceptance_begin_v1)
);
select is(
  (select session_status from acceptance_commit_v1),
  'registered',
  'commit registers the object and its durable ingestion receipt'
);
select is(
  (
    select replay.asset_id
    from public.veroxa_commit_media_upload_v1(
      (select upload_session_id from acceptance_begin_v1)
    ) replay
  ),
  (select asset_id from acceptance_commit_v1),
  'commit replay returns the same registered asset'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.media_upload_sessions_v1 session
    where session.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  1,
  'exact replay leaves one upload session'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.momo_media_ingestion_outbox_v1 receipt
    where receipt.asset_id = (select asset_id from acceptance_commit_v1)
  ),
  1,
  'registration leaves exactly one durable ingestion receipt'
);
select ok(
  (
    select not session.external_write_allowed
      and not runtime.provider_writes
      and not runtime.review_replies
      and not runtime.website_writes
      and not runtime.external_scheduling
      and not budget.external_publishing_authorized
    from veroxa_private.media_upload_sessions_v1 session
    join public.veroxa_momo_runtime_controls runtime
      on runtime.restaurant_id = session.restaurant_id
    join veroxa_private.momo_ai_budget_controls budget
      on budget.restaurant_id = session.restaurant_id
    where session.id = (select upload_session_id from acceptance_commit_v1)
  ),
  'session, runtime, and budget all keep external actions false'
);
select throws_ok(
  $$insert into public.veroxa_provider_connections (
    restaurant_id, provider, status
  ) values (
    '21000000-0000-4000-8000-000000000191'::uuid,
    'meta', 'not_connected'
  )$$,
  '23514',
  'internal_acceptance_surface_not_allowed',
  'the test tenant cannot create a restaurant-platform connection'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000191","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '12000000-0000-4000-8000-000000000191', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('veroxa.trusted_activity_write', 'on', true);
select lives_ok(
  $$insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    '21000000-0000-4000-8000-000000000191'::uuid,
    'acceptance_ready_review_audit', 'media_asset',
    (select asset_id from acceptance_commit_v1),
    '12000000-0000-4000-8000-000000000191'::uuid,
    'team', false, '{"externalWriteAllowed":false}'::jsonb
  )$$,
  'the Ready review audit surface remains available to the test tenant'
);
select throws_ok(
  $$insert into public.veroxa_activity_events (
    restaurant_id, event_type, actor_id, visibility,
    report_eligible, payload
  ) values (
    '21000000-0000-4000-8000-000000000191'::uuid,
    'forbidden_report_event',
    '12000000-0000-4000-8000-000000000191'::uuid,
    'team', true, '{"externalWriteAllowed":false}'::jsonb
  )$$,
  '23514',
  'internal_acceptance_report_evidence_forbidden',
  'test-tenant activity cannot enter operational reports'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-4000-8000-000000000191","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '11000000-0000-4000-8000-000000000191', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('veroxa.trusted_activity_write', 'off', true);

select throws_ok(
  $$with verification as (
    select
      pg_catalog.jsonb_build_object(
        'schemaVersion', 3,
        'verifierVersion',
          'veroxa-private-image-byte-verifier-2026-08-08-v1',
        'restaurantId',
          '21000000-0000-4000-8000-000000000191'::uuid,
        'assetId', commit_row.asset_id,
        'storagePath', commit_row.storage_path,
        'storageObjectId', object_record.id,
        'storageObjectVersion', object_record.version,
        'detectedMime', 'image/jpeg',
        'fileSize', 12000,
        'width', 1000,
        'height', 1000,
        'contentSha256', repeat('2', 64)
      ) snapshot,
      commit_row.asset_id,
      object_record.id object_id,
      object_record.version object_version
    from acceptance_commit_v1 commit_row
    join storage.objects object_record
      on object_record.bucket_id = 'restaurant-media'
     and object_record.name = commit_row.storage_path
  ), canonical as (
    select verification.*,
      veroxa_private.momo_canonical_json_v1(snapshot) canonical
    from verification
  )
  select * from public.veroxa_finalize_private_media_assessment_intake_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    canonical.asset_id, canonical.object_id, canonical.object_version,
    'image/jpeg', 12000, 1000, 1000, repeat('2', 64),
    canonical.snapshot, canonical.canonical,
    pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
      canonical.canonical, 'UTF8'
    ), 'sha256'), 'hex'),
    repeat('3', 64),
    '11000000-0000-4000-8000-000000000191'::uuid
  ) from canonical$$,
  '23514',
  'media_upload_expected_sha256_mismatch',
  'the full-byte verifier cannot complete against a different expected SHA'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from public.veroxa_private_media_assessment_intakes_v1 intake
    where intake.asset_id = (select asset_id from acceptance_commit_v1)
  ),
  0,
  'an expected-SHA mismatch creates no verified intake'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from public.veroxa_momo_media_intake_verifications verification
    where verification.asset_id = (select asset_id from acceptance_commit_v1)
  ),
  0,
  'an expected-SHA mismatch creates no strict completed verification'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from public.veroxa_momo_ready_packages_v2 package
    where package.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  0,
  'an expected-SHA mismatch creates no Ready package'
);
select throws_ok(
  $$update veroxa_private.internal_acceptance_scope_v1
    set customer_visible = true
    where restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid$$,
  '23514',
  'internal_acceptance_scope_is_immutable',
  'the internal acceptance binding cannot be rewritten'
);

select * from finish();
rollback;
