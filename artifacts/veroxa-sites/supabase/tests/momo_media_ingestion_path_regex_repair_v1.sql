-- Executable regression for the durable upload path boundary.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.veroxa_restaurants (
  id, name, city, state, timezone, status
) values (
  '20000000-0000-4000-8000-000000000180'::uuid,
  'Momo Path Repair Fixture', 'San Antonio', 'TX',
  'America/Chicago', 'active'
);
insert into veroxa_private.operational_restaurant_scope (
  scope_key, restaurant_id, enabled
) values (
  'momo_house_san_antonio',
  '20000000-0000-4000-8000-000000000180'::uuid,
  true
);
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '10000000-0000-4000-8000-000000000180'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'path-repair-fixture@veroxa.invalid', pg_catalog.clock_timestamp(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
);
insert into public.veroxa_user_profiles (
  user_id, email, role, display_name, status
) values (
  '10000000-0000-4000-8000-000000000180'::uuid,
  'path-repair-fixture@veroxa.invalid', 'client',
  'Path Repair Fixture', 'active'
);
insert into public.veroxa_restaurant_members (
  restaurant_id, user_id, role, status
) values (
  '20000000-0000-4000-8000-000000000180'::uuid,
  '10000000-0000-4000-8000-000000000180'::uuid,
  'client', 'active'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000180',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.veroxa_media_assets (
  id, restaurant_id, storage_path, original_file_name, mime_type, file_size,
  uploaded_by, status
) values (
  '30000000-0000-4000-8000-000000000180'::uuid,
  '20000000-0000-4000-8000-000000000180'::uuid,
  'restaurants/20000000-0000-4000-8000-000000000180/uploads/2026/08/40000000-0000-4000-8000-000000000180.jpg',
  'path-repair-fixture.jpg', 'image/jpeg', 12000,
  '10000000-0000-4000-8000-000000000180'::uuid, 'uploaded'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.momo_media_ingestion_outbox_v1'::regclass
      and constraint_record.conname =
        'momo_media_ingestion_outbox_storage_path_v2_check'
      and constraint_record.contype = 'c'
  ),
  1,
  'the corrected explicit path constraint is installed'
);
select ok(
  (
    select pg_catalog.pg_get_constraintdef(constraint_record.oid)
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.momo_media_ingestion_outbox_v1'::regclass
      and constraint_record.conname =
        'momo_media_ingestion_outbox_storage_path_v2_check'
  ) like '%[.](jpg|jpeg|png)$%',
  'the catalog stores the backslash-independent extension boundary'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'veroxa_private.momo_media_ingestion_outbox_v1'::regclass
      and constraint_record.conname = 'momo_media_ingestion_outbox_v1_check'
  ),
  0,
  'the malformed predecessor path constraint is gone'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.momo_media_ingestion_outbox_v1 receipt
    where receipt.asset_id =
      '30000000-0000-4000-8000-000000000180'::uuid
  ),
  1,
  'a normal UUID JPEG upload is transactionally enqueued'
);
select is(
  (
    select receipt.state
    from veroxa_private.momo_media_ingestion_outbox_v1 receipt
    where receipt.asset_id =
      '30000000-0000-4000-8000-000000000180'::uuid
  ),
  'pending',
  'the new receipt starts pending'
);
select is(
  (
    select receipt.external_write_allowed
    from veroxa_private.momo_media_ingestion_outbox_v1 receipt
    where receipt.asset_id =
      '30000000-0000-4000-8000-000000000180'::uuid
  ),
  false,
  'the repaired path never opens external writes'
);
select throws_ok(
  $$
    update veroxa_private.momo_media_ingestion_outbox_v1 receipt
    set storage_path =
      'restaurants/20000000-0000-4000-8000-000000000180/uploads/2026/08/40000000-0000-4000-8000-000000000180xjpg'
    where receipt.asset_id =
      '30000000-0000-4000-8000-000000000180'::uuid
  $$,
  '23514',
  null,
  'the repaired boundary does not accept a non-dot extension separator'
);

select * from finish();
rollback;
