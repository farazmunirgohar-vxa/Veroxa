-- Executable tenant, idempotency, SHA, and external-lock contract for the
-- isolated Veroxa pre-intervention acceptance path.
begin;
create extension if not exists pgtap with schema extensions;
select plan(57);

insert into public.veroxa_restaurants (
  id, name, city, state, timezone, status
) values
  (
    '21000000-0000-4000-8000-000000000191'::uuid,
    'Veroxa Internal Acceptance CI 20260815',
    'Synthetic', 'TX', 'America/Chicago', 'active'
  ),
  (
    '22000000-0000-4000-8000-000000000191'::uuid,
    'Veroxa Internal Acceptance Reassignment Sentinel 20260815',
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
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.internal_acceptance_scope_v1'::pg_catalog.regclass
      and constraint_record.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_record.oid)
        like '%singleton_slot%'
  ),
  1,
  'the acceptance tenant has a database-enforced singleton slot'
);
select throws_ok(
  $$select veroxa_private.provision_internal_acceptance_scope_v1(
    '22000000-0000-4000-8000-000000000191'::uuid,
    'veroxa_internal_acceptance_conflict_20260815',
    '13000000-0000-4000-8000-000000000191'::uuid,
    '14000000-0000-4000-8000-000000000191'::uuid
  )$$,
  '23505',
  'internal_acceptance_scope_singleton_conflict',
  'a different acceptance tenant cannot acquire live-AI authority'
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
    'public.veroxa_begin_media_upload_v1(uuid,uuid,text,text,bigint,text,jsonb,jsonb,date,text,text)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_commit_media_upload_v1(uuid,uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'anon',
    'public.veroxa_commit_media_upload_v1(uuid,uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'service_role',
    'public.veroxa_commit_media_upload_v1(uuid,uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'anon',
    'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
    'execute'
  ) and pg_catalog.has_function_privilege(
    'service_role',
    'public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)',
    'execute'
  ),
  'authenticated Clients can only begin; service_role alone can commit v2'
);
select ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'veroxa_private.profile_visible_to_current_team_v1(uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'anon',
    'veroxa_private.profile_visible_to_current_team_v1(uuid)',
    'execute'
  ) and not pg_catalog.has_function_privilege(
    'service_role',
    'veroxa_private.profile_visible_to_current_team_v1(uuid)',
    'execute'
  ),
  'the authenticated RLS policy helper is executable only by authenticated'
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

select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '40000000-0000-4000-8000-000000000191'::uuid,
    repeat('0', 64), 'image/jpeg', 12000, 'missing-attestation.jpg',
    null,
    '["instagram","facebook"]'::jsonb, null,
    'represents_current_restaurant_offering',
    'A direct RPC cannot manufacture owner rights.'
  )$$,
  '23514',
  'media_upload_owner_attestation_invalid',
  'a missing owner attestation creates no upload session or rights'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '40000000-0000-4000-8000-000000000192'::uuid,
    repeat('0', 64), 'image/jpeg', 12000, 'false-offering.jpg',
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
    '["instagram","facebook"]'::jsonb, null,
    'represents_current_restaurant_offering',
    'A false current-offering claim must fail closed.'
  )$$,
  '23514',
  'media_upload_owner_attestation_invalid',
  'current-offering association requires an explicit true attestation'
);

create temporary table acceptance_begin_v1 on commit drop as
select * from public.veroxa_begin_media_upload_v1(
  '21000000-0000-4000-8000-000000000191'::uuid,
  '41000000-0000-4000-8000-000000000191'::uuid,
  repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
  '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
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
      '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
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
      '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
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
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
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
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
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
select ok(
  (
    select pg_catalog.count(*) = 2
      and pg_catalog.bool_and(
        alias_record.request_sha256 = pg_catalog.encode(extensions.digest(
          pg_catalog.convert_to(
            veroxa_private.momo_canonical_json_v1(
              alias_record.request_snapshot
            ), 'UTF8'
          ), 'sha256'
        ), 'hex')
      )
      and pg_catalog.bool_and(
        alias_record.request_snapshot #>>
          '{ownerAttestation,ownerRightsAccepted}' = 'true'
      )
      and pg_catalog.bool_and(
        alias_record.request_snapshot #>>
          '{ownerAttestation,currentOfferingAccepted}' = 'true'
      )
    from veroxa_private.media_upload_session_aliases_v1 alias_record
    where alias_record.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
  ),
  'each actor/idempotency alias preserves an immutable hashed attestation'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_index index_record
    join pg_catalog.pg_class index_relation
      on index_relation.oid = index_record.indexrelid
    where index_record.indrelid =
      'veroxa_private.media_upload_sessions_v1'::pg_catalog.regclass
      and index_record.indisunique
      and index_record.indpred is not null
      and index_relation.relname = 'media_upload_sessions_live_sha_v1'
  ) and exists (
    select 1
    from pg_catalog.pg_index index_record
    join pg_catalog.pg_class index_relation
      on index_relation.oid = index_record.indexrelid
    where index_record.indrelid =
      'veroxa_private.media_upload_sessions_v1'::pg_catalog.regclass
      and index_record.indisunique
      and index_record.indpred is not null
      and index_relation.relname = 'media_upload_sessions_live_request_v1'
  ),
  'live SHA/request reservations use partial unique indexes'
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

create temporary table acceptance_delete_probe_v1 (
  deleted_count integer not null
) on commit drop;
grant select on acceptance_begin_v1 to authenticated, service_role;
grant insert, select on acceptance_delete_probe_v1 to authenticated;
set local role authenticated;
select lives_ok(
  $$insert into storage.objects (
      bucket_id, name, owner, owner_id, version, metadata
    )
    select 'restaurant-media', begin_row.storage_path,
      '11000000-0000-4000-8000-000000000191'::uuid,
      '11000000-0000-4000-8000-000000000191',
      'acceptance-object-v1',
      '{"mimetype":"image/jpeg","size":12000}'::jsonb
    from acceptance_begin_v1 begin_row$$,
  'the authenticated Client can insert the reserved object path through RLS'
);
select set_config('storage.allow_delete_query', 'true', true);
with deleted as (
  delete from storage.objects object_record
  where object_record.bucket_id = 'restaurant-media'
    and object_record.name = (
      select storage_path from acceptance_begin_v1
    )
  returning 1
)
insert into acceptance_delete_probe_v1 (deleted_count)
select pg_catalog.count(*)::integer from deleted;
reset role;
select is(
  (select deleted_count from acceptance_delete_probe_v1),
  0,
  'orphan cleanup cannot delete an object protected by a live session'
);

create temporary table acceptance_storage_object_v1 on commit drop as
select object_record.id, object_record.version
from storage.objects object_record
join acceptance_begin_v1 begin_row
  on object_record.bucket_id = 'restaurant-media'
 and object_record.name = begin_row.storage_path;
grant select on acceptance_storage_object_v1 to service_role;

create temporary table acceptance_commit_v1 (
  upload_session_id uuid,
  storage_path text,
  session_status text,
  asset_id uuid,
  rights_id uuid,
  instruction_id uuid,
  ingestion_receipt_id uuid,
  ingestion_correlation_id uuid,
  original_sha256 text,
  external_write_allowed boolean
) on commit drop;
grant insert, select on acceptance_commit_v1 to service_role;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
select throws_ok(
  $$select * from public.veroxa_commit_media_upload_v2(
    '21000000-0000-4000-8000-000000000191'::uuid,
    (select upload_session_id from acceptance_begin_v1),
    '49000000-0000-4000-8000-000000000191'::uuid,
    repeat('1', 64),
    (select id from acceptance_storage_object_v1),
    (select version from acceptance_storage_object_v1),
    '11000000-0000-4000-8000-000000000191'::uuid
  )$$,
  '23514',
  'media_upload_owner_attestation_invalid',
  'server commit cannot bypass the exact actor/idempotency attestation alias'
);
select throws_ok(
  $$select * from public.veroxa_commit_media_upload_v2(
    '21000000-0000-4000-8000-000000000191'::uuid,
    (select upload_session_id from acceptance_begin_v1),
    '41000000-0000-4000-8000-000000000191'::uuid,
    repeat('1', 64),
    (select id from acceptance_storage_object_v1),
    (select version || '-wrong' from acceptance_storage_object_v1),
    '11000000-0000-4000-8000-000000000191'::uuid
  )$$,
  '23514',
  'media_upload_storage_object_mismatch',
  'server commit rejects an object version outside the reserved identity'
);
select throws_ok(
  $$select * from public.veroxa_commit_media_upload_v2(
    '21000000-0000-4000-8000-000000000191'::uuid,
    (select upload_session_id from acceptance_begin_v1),
    '41000000-0000-4000-8000-000000000191'::uuid,
    repeat('2', 64),
    (select id from acceptance_storage_object_v1),
    (select version from acceptance_storage_object_v1),
    '11000000-0000-4000-8000-000000000191'::uuid
  )$$,
  '23514',
  'media_upload_expected_sha256_mismatch',
  'server-observed bytes must match the claimed SHA before registration'
);
reset role;
select is(
  pg_catalog.jsonb_build_array(
    (select pg_catalog.count(*) from public.veroxa_media_assets
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*) from public.veroxa_media_rights
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*)
      from public.veroxa_media_upload_instructions_v1
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*)
      from veroxa_private.momo_media_ingestion_outbox_v1
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 session
      where session.id = (
          select upload_session_id from acceptance_begin_v1
        )
        and (session.observed_sha256 is not null
          or session.storage_object_id is not null
          or session.storage_object_version is not null
          or session.committed_at is not null))
  ),
  '[0,0,0,0,0]'::jsonb,
  'mismatch creates no durable row or committed session evidence'
);

set local role service_role;
insert into acceptance_commit_v1
select * from public.veroxa_commit_media_upload_v2(
  '21000000-0000-4000-8000-000000000191'::uuid,
  (select upload_session_id from acceptance_begin_v1),
  '41000000-0000-4000-8000-000000000191'::uuid,
  repeat('1', 64),
  (select id from acceptance_storage_object_v1),
  (select version from acceptance_storage_object_v1),
  '11000000-0000-4000-8000-000000000191'::uuid
);
reset role;
select ok(
  (select session_status = 'registered' from acceptance_commit_v1)
  and (select session.observed_sha256 = repeat('1', 64)
      and session.storage_object_id = object_record.id
      and session.storage_object_version = object_record.version
      and session.committed_at = session.registered_at
    from veroxa_private.media_upload_sessions_v1 session
    cross join acceptance_storage_object_v1 object_record
    where session.id = (select upload_session_id from acceptance_commit_v1)),
  'service commit persists immutable verified object and byte evidence'
);
set local role service_role;
select is(
  (
    select replay.asset_id
    from public.veroxa_commit_media_upload_v2(
      '21000000-0000-4000-8000-000000000191'::uuid,
      (select upload_session_id from acceptance_begin_v1),
      '41000000-0000-4000-8000-000000000191'::uuid,
      repeat('1', 64),
      (select id from acceptance_storage_object_v1),
      (select version from acceptance_storage_object_v1),
      '11000000-0000-4000-8000-000000000191'::uuid
    ) replay
  ),
  (select asset_id from acceptance_commit_v1),
  'verified commit replay returns the same registered asset'
);
select throws_ok(
  $$select * from public.veroxa_commit_media_upload_v2(
    '21000000-0000-4000-8000-000000000191'::uuid,
    (select upload_session_id from acceptance_begin_v1),
    '41000000-0000-4000-8000-000000000191'::uuid,
    repeat('1', 64),
    (select id from acceptance_storage_object_v1),
    (select version || '-new' from acceptance_storage_object_v1),
    '11000000-0000-4000-8000-000000000191'::uuid
  )$$,
  '23514',
  'media_upload_commit_evidence_conflict',
  'registered replay is bound to the canonical committed object version'
);
reset role;
select throws_ok(
  $$update public.veroxa_media_assets asset
    set restaurant_id = '22000000-0000-4000-8000-000000000191'::uuid
    where asset.id = (select asset_id from acceptance_commit_v1)$$,
  '23514',
  'operational_restaurant_scope_is_immutable',
  'an operational asset cannot be reassigned across restaurant scope'
);

insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '13000000-0000-4000-8000-000000000191'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'acceptance-client-two-20260815@veroxa.invalid',
  pg_catalog.clock_timestamp(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
);
insert into public.veroxa_user_profiles (
  user_id, email, role, display_name, status
) values (
  '13000000-0000-4000-8000-000000000191'::uuid,
  'acceptance-client-two-20260815@veroxa.invalid', 'client',
  'Internal Acceptance Client Two', 'active'
);
insert into public.veroxa_restaurant_members (
  restaurant_id, user_id, role, status
) values (
  '21000000-0000-4000-8000-000000000191'::uuid,
  '13000000-0000-4000-8000-000000000191'::uuid,
  'client', 'active'
);
insert into public.veroxa_momo_evidence_authorities (
  restaurant_id, user_id, evidence_class, active, assigned_by, notes
) values (
  '21000000-0000-4000-8000-000000000191'::uuid,
  '13000000-0000-4000-8000-000000000191'::uuid,
  'real_owner', true,
  '12000000-0000-4000-8000-000000000191'::uuid,
  'Second fictional owner identity for restaurant-wide deduplication proof.'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"13000000-0000-4000-8000-000000000191","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '13000000-0000-4000-8000-000000000191', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
create temporary table acceptance_second_client_replay_v1 on commit drop as
select * from public.veroxa_begin_media_upload_v1(
  '21000000-0000-4000-8000-000000000191'::uuid,
  '44000000-0000-4000-8000-000000000191'::uuid,
  repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
  '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
  '["instagram","facebook"]'::jsonb, null,
  'represents_current_restaurant_offering',
  'Synthetic food fixture owned only by the fictional acceptance restaurant.'
);
select is(
  (select upload_session_id from acceptance_second_client_replay_v1),
  (select upload_session_id from acceptance_begin_v1),
  'a second restaurant Client reuses the canonical restaurant/SHA session'
);
select is(
  (select storage_path from acceptance_second_client_replay_v1),
  (select storage_path from acceptance_begin_v1),
  'a second restaurant Client cannot allocate another exact-byte object path'
);
grant select on acceptance_second_client_replay_v1 to service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;
select is(
  (
    select replay.asset_id
    from public.veroxa_commit_media_upload_v2(
      '21000000-0000-4000-8000-000000000191'::uuid,
      (select upload_session_id from acceptance_second_client_replay_v1),
      '44000000-0000-4000-8000-000000000191'::uuid,
      repeat('1', 64),
      (select id from acceptance_storage_object_v1),
      (select version from acceptance_storage_object_v1),
      '13000000-0000-4000-8000-000000000191'::uuid
    ) replay
  ),
  (select asset_id from acceptance_commit_v1),
  'server-verified replay returns the canonical asset for a second Client alias'
);
reset role;
select is(
  pg_catalog.jsonb_build_array(
    (select pg_catalog.count(*) from veroxa_private.media_upload_sessions_v1
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*) from public.veroxa_media_assets
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*) from public.veroxa_media_rights
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*) from veroxa_private.momo_media_ingestion_outbox_v1
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid),
    (select pg_catalog.count(*) from veroxa_private.media_upload_session_aliases_v1
      where restaurant_id = '21000000-0000-4000-8000-000000000191'::uuid)
  ),
  '[1,1,1,1,3]'::jsonb,
  'restaurant-wide replay leaves one session, object identity, rights row, and receipt with actor aliases'
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
  select finalized.*
  from canonical
  cross join lateral public.veroxa_finalize_private_media_assessment_intake_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    canonical.asset_id, canonical.object_id, canonical.object_version,
    'image/jpeg', 12000, 1000, 1000, repeat('2', 64),
    canonical.snapshot, canonical.canonical,
    pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
      canonical.canonical, 'UTF8'
    ), 'sha256'), 'hex'),
    repeat('3', 64),
    '11000000-0000-4000-8000-000000000191'::uuid
  ) finalized$$,
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

-- An abandoned reservation keeps immutable evidence but releases its live
-- SHA reservation after the server-authoritative expiry sweep.
create temporary table acceptance_abandoned_begin_v1 on commit drop as
select * from public.veroxa_begin_media_upload_v1(
  '21000000-0000-4000-8000-000000000191'::uuid,
  '45000000-0000-4000-8000-000000000191'::uuid,
  repeat('a', 64), 'image/jpeg', 12000, 'abandoned-fixture.jpg',
  '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
  '["internal"]'::jsonb, null, 'not_for_restaurant',
  'An initiated fixture that simulates an abandoned browser upload.'
);
alter table veroxa_private.media_upload_sessions_v1
  disable trigger veroxa_media_upload_session_guard_v1;
update veroxa_private.media_upload_sessions_v1 session
set created_at = pg_catalog.statement_timestamp() - interval '20 minutes',
    initiation_expires_at =
      pg_catalog.statement_timestamp() - interval '5 minutes',
    updated_at = pg_catalog.statement_timestamp() - interval '20 minutes'
where session.id = (
  select upload_session_id from acceptance_abandoned_begin_v1
);
alter table veroxa_private.media_upload_sessions_v1
  enable trigger veroxa_media_upload_session_guard_v1;

create temporary table acceptance_reclaimed_begin_v1 on commit drop as
select * from public.veroxa_begin_media_upload_v1(
  '21000000-0000-4000-8000-000000000191'::uuid,
  '45000000-0000-4000-8000-000000000192'::uuid,
  repeat('a', 64), 'image/jpeg', 12000, 'abandoned-fixture.jpg',
  '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
  '["internal"]'::jsonb, null, 'not_for_restaurant',
  'An initiated fixture that simulates an abandoned browser upload.'
);
select ok(
  (select old_session.state = 'expired'
      and old_session.expired_at is not null
      and old_session.expired_at >= old_session.initiation_expires_at
      and old_session.expired_by_actor_id =
        '11000000-0000-4000-8000-000000000191'::uuid
      and (select pg_catalog.count(*)
        from veroxa_private.media_upload_session_aliases_v1 alias_record
        where alias_record.upload_session_id = old_session.id) = 1
    from veroxa_private.media_upload_sessions_v1 old_session
    where old_session.id = (
      select upload_session_id from acceptance_abandoned_begin_v1
    ))
  and (select new_session.state = 'initiated'
      and new_session.id <> (
        select upload_session_id from acceptance_abandoned_begin_v1
      )
    from veroxa_private.media_upload_sessions_v1 new_session
    where new_session.id = (
      select upload_session_id from acceptance_reclaimed_begin_v1
    )),
  'expiry preserves abandoned evidence while a new session reclaims the SHA'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '45000000-0000-4000-8000-000000000191'::uuid,
    repeat('a', 64), 'image/jpeg', 12000, 'abandoned-fixture.jpg',
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
    '["internal"]'::jsonb, null, 'not_for_restaurant',
    'An initiated fixture that simulates an abandoned browser upload.'
  )$$,
  '55000',
  'media_upload_session_expired',
  'an expired idempotency alias cannot be replayed or rebound'
);
select throws_ok(
  $$delete from veroxa_private.media_upload_sessions_v1 session
    where session.id = (
      select upload_session_id from acceptance_abandoned_begin_v1
    )$$,
  '23514',
  'media_upload_session_is_immutable',
  'expired upload evidence cannot be deleted'
);

-- A registered session remains replayable, but one actor can retain at most
-- eight aliases for it even when every new request is byte-for-byte exact.
do $fixture$
declare
  alias_number integer;
begin
  for alias_number in 1..6 loop
    perform replay.upload_session_id
    from public.veroxa_begin_media_upload_v1(
      '21000000-0000-4000-8000-000000000191'::uuid,
      (
        '46000000-0000-4000-8000-' ||
        pg_catalog.lpad(alias_number::text, 12, '0')
      )::uuid,
      repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
      '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
      '["instagram","facebook"]'::jsonb, null,
      'represents_current_restaurant_offering',
      'Synthetic food fixture owned only by the fictional acceptance restaurant.'
    ) replay;
  end loop;
end;
$fixture$;
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.media_upload_session_aliases_v1 alias_record
    where alias_record.upload_session_id = (
      select upload_session_id from acceptance_commit_v1
    )
      and alias_record.actor_id =
        '11000000-0000-4000-8000-000000000191'::uuid
  ),
  8,
  'one actor can retain no more than eight exact-replay aliases per session'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '46000000-0000-4000-8000-000000000007'::uuid,
    repeat('1', 64), 'image/jpeg', 12000, 'synthetic-success.jpg',
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":true}'::jsonb,
    '["instagram","facebook"]'::jsonb, null,
    'represents_current_restaurant_offering',
    'Synthetic food fixture owned only by the fictional acceptance restaurant.'
  )$$,
  '54000',
  'media_upload_alias_limit_reached',
  'a ninth actor/session alias fails closed'
);

do $fixture$
declare
  fixture_number integer;
  fixture_sha text;
begin
  for fixture_number in 1..2 loop
    fixture_sha := case fixture_number
      when 1 then repeat('b', 64)
      else repeat('c', 64)
    end;
    perform begun.upload_session_id
    from public.veroxa_begin_media_upload_v1(
      '21000000-0000-4000-8000-000000000191'::uuid,
      (
        '47000000-0000-4000-8000-' ||
        pg_catalog.lpad(fixture_number::text, 12, '0')
      )::uuid,
      fixture_sha, 'image/jpeg', 12000,
      'active-quota-' || fixture_number::text || '.jpg',
      '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
      '["internal"]'::jsonb, null, 'not_for_restaurant',
      'Active-session quota fixture.'
    ) begun;
  end loop;
end;
$fixture$;
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '47000000-0000-4000-8000-000000000003'::uuid,
    repeat('d', 64), 'image/jpeg', 12000, 'active-quota-3.jpg',
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
    '["internal"]'::jsonb, null, 'not_for_restaurant',
    'Active-session quota fixture.'
  )$$,
  '54000',
  'media_upload_session_rate_or_active_limit_reached',
  'a fourth active initiated session for one actor fails closed'
);

-- Retire the active fixtures and fill only immutable expired evidence to
-- isolate the ten-sessions-per-hour actor quota from the active-session cap.
alter table veroxa_private.media_upload_sessions_v1
  disable trigger veroxa_media_upload_session_guard_v1;
update veroxa_private.media_upload_sessions_v1 session
set state = 'expired',
    created_at = pg_catalog.statement_timestamp() - interval '20 minutes',
    initiation_expires_at =
      pg_catalog.statement_timestamp() - interval '5 minutes',
    expired_at = pg_catalog.statement_timestamp() - interval '4 minutes',
    expired_by_actor_id =
      '11000000-0000-4000-8000-000000000191'::uuid,
    updated_at = pg_catalog.statement_timestamp()
where session.restaurant_id =
    '21000000-0000-4000-8000-000000000191'::uuid
  and session.created_by_actor_id =
    '11000000-0000-4000-8000-000000000191'::uuid
  and session.state = 'initiated';
alter table veroxa_private.media_upload_sessions_v1
  enable trigger veroxa_media_upload_session_guard_v1;

with needed as (
  select (10 - pg_catalog.count(*))::integer fixture_count
  from veroxa_private.media_upload_sessions_v1 session
  where session.restaurant_id =
      '21000000-0000-4000-8000-000000000191'::uuid
    and session.created_by_actor_id =
      '11000000-0000-4000-8000-000000000191'::uuid
    and session.created_at >=
      pg_catalog.statement_timestamp() - interval '1 hour'
), fixtures as (
  select extensions.gen_random_uuid() id, series.fixture_number
  from needed
  cross join lateral pg_catalog.generate_series(
    1, needed.fixture_count
  ) series(fixture_number)
)
insert into veroxa_private.media_upload_sessions_v1 (
  id, restaurant_id, created_by_actor_id, content_request_sha256,
  original_sha256, storage_path, declared_mime_type, declared_file_size,
  original_file_name, usage_scope, requested_association, state,
  initiation_expires_at, expired_at, expired_by_actor_id,
  created_at, updated_at
)
select fixtures.id,
  '21000000-0000-4000-8000-000000000191'::uuid,
  '11000000-0000-4000-8000-000000000191'::uuid,
  pg_catalog.encode(extensions.digest(
    'rate-content-' || fixtures.fixture_number::text, 'sha256'
  ), 'hex'),
  pg_catalog.encode(extensions.digest(
    'rate-original-' || fixtures.fixture_number::text, 'sha256'
  ), 'hex'),
  'restaurants/21000000-0000-4000-8000-000000000191/uploads/' ||
    pg_catalog.to_char(
      pg_catalog.statement_timestamp() at time zone 'UTC', 'YYYY/MM'
    ) || '/' || fixtures.id::text || '.jpg',
  'image/jpeg', 12000,
  'rate-fixture-' || fixtures.fixture_number::text || '.jpg',
  '["internal"]'::jsonb, 'not_for_restaurant', 'expired',
  pg_catalog.statement_timestamp() - interval '5 minutes',
  pg_catalog.statement_timestamp() - interval '4 minutes',
  '11000000-0000-4000-8000-000000000191'::uuid,
  pg_catalog.statement_timestamp() - interval '20 minutes',
  pg_catalog.statement_timestamp()
from fixtures;
select is(
  pg_catalog.jsonb_build_array(
    (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 session
      where session.restaurant_id =
          '21000000-0000-4000-8000-000000000191'::uuid
        and session.created_by_actor_id =
          '11000000-0000-4000-8000-000000000191'::uuid
        and session.state = 'initiated'),
    (select pg_catalog.count(*)
      from veroxa_private.media_upload_sessions_v1 session
      where session.restaurant_id =
          '21000000-0000-4000-8000-000000000191'::uuid
        and session.created_by_actor_id =
          '11000000-0000-4000-8000-000000000191'::uuid
        and session.created_at >=
          pg_catalog.statement_timestamp() - interval '1 hour')
  ),
  '[0,10]'::jsonb,
  'the actor rate fixture has zero active and ten recent immutable sessions'
);
select throws_ok(
  $$select * from public.veroxa_begin_media_upload_v1(
    '21000000-0000-4000-8000-000000000191'::uuid,
    '47000000-0000-4000-8000-000000000004'::uuid,
    repeat('e', 64), 'image/jpeg', 12000, 'rate-quota.jpg',
    '{"schemaVersion":"veroxa-media-owner-attestation-v1","ownerRightsAccepted":true,"currentOfferingAccepted":false}'::jsonb,
    '["internal"]'::jsonb, null, 'not_for_restaurant',
    'Actor rate quota fixture.'
  )$$,
  '54000',
  'media_upload_session_rate_or_active_limit_reached',
  'an eleventh recent session for one actor fails closed with no active rows'
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
