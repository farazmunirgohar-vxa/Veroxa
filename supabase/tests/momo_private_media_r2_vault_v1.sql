-- Executable regression for the private exact-byte R2 vault ledger.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.veroxa_restaurants (
  id, name, city, state, timezone, status
) values (
  '20000000-0000-4000-8000-000000000190'::uuid,
  'Momo Vault Fixture', 'San Antonio', 'TX',
  'America/Chicago', 'active'
);
insert into veroxa_private.operational_restaurant_scope (
  scope_key, restaurant_id, enabled
) values (
  'momo_house_san_antonio',
  '20000000-0000-4000-8000-000000000190'::uuid,
  true
);
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '10000000-0000-4000-8000-000000000190'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'vault-fixture@veroxa.invalid', pg_catalog.clock_timestamp(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
);
insert into public.veroxa_user_profiles (
  user_id, email, role, display_name, status
) values (
  '10000000-0000-4000-8000-000000000190'::uuid,
  'vault-fixture@veroxa.invalid', 'client', 'Vault Fixture', 'active'
);
insert into public.veroxa_restaurant_members (
  restaurant_id, user_id, role, status
) values (
  '20000000-0000-4000-8000-000000000190'::uuid,
  '10000000-0000-4000-8000-000000000190'::uuid,
  'client', 'active'
);

insert into public.veroxa_media_assets (
  id, restaurant_id, storage_path, original_file_name, mime_type, file_size,
  uploaded_by, status, width, height, content_sha256
) values (
  '30000000-0000-4000-8000-000000000190'::uuid,
  '20000000-0000-4000-8000-000000000190'::uuid,
  'restaurants/20000000-0000-4000-8000-000000000190/uploads/2026/08/40000000-0000-4000-8000-000000000190.jpg',
  'vault-fixture.jpg', 'image/jpeg', 12000,
  '10000000-0000-4000-8000-000000000190'::uuid, 'uploaded',
  1200, 900, pg_catalog.repeat('a', 64)
);

insert into public.veroxa_private_media_assessment_intakes_v1 (
  id, restaurant_id, asset_id, storage_path, storage_object_id,
  storage_object_version, declared_mime_type, detected_mime_type, file_size,
  width, height, content_sha256, verifier_version, verification_snapshot,
  verification_canonical, verification_sha256, idempotency_hash,
  platform_ready, status, initiated_by
) values (
  '50000000-0000-4000-8000-000000000190'::uuid,
  '20000000-0000-4000-8000-000000000190'::uuid,
  '30000000-0000-4000-8000-000000000190'::uuid,
  'restaurants/20000000-0000-4000-8000-000000000190/uploads/2026/08/40000000-0000-4000-8000-000000000190.jpg',
  '60000000-0000-4000-8000-000000000190'::uuid,
  'source-version-1', 'image/jpeg', 'image/jpeg', 12000, 1200, 900,
  pg_catalog.repeat('a', 64),
  'veroxa-private-image-byte-verifier-2026-08-08-v1',
  '{}'::jsonb, '{}', pg_catalog.repeat('b', 64),
  pg_catalog.repeat('c', 64), true, 'verified',
  '10000000-0000-4000-8000-000000000190'::uuid
);

select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.momo_media_vault_outbox_v1 work
    where work.asset_id =
      '30000000-0000-4000-8000-000000000190'::uuid
      and work.state = 'pending' and work.attempt_count = 0
      and not work.external_write_allowed
  ),
  1,
  'verified intake transactionally creates one private pending vault item'
);

create temporary table vault_claim on commit drop as
select * from public.veroxa_claim_momo_media_vault_v1(
  '70000000-0000-4000-8000-000000000190'::uuid,
  pg_catalog.floor(extract(epoch from pg_catalog.clock_timestamp()) * 1000)::bigint,
  '80000000-0000-4000-8000-000000000190'::uuid
);

select is(
  (select pg_catalog.count(*)::integer from vault_claim
   where asset_id = '30000000-0000-4000-8000-000000000190'::uuid
     and attempt_count = 1 and not external_write_allowed),
  1,
  'service worker claims the exact source under one bounded lease'
);

create temporary table vault_completion on commit drop as
with work as (
  select * from veroxa_private.momo_media_vault_outbox_v1
  where asset_id = '30000000-0000-4000-8000-000000000190'::uuid
), evidence as (
  select work.*,
    pg_catalog.jsonb_build_object(
      'schemaVersion', 1,
      'verifierVersion', 'veroxa-private-media-vault-2026-08-15-v1',
      'restaurantId', work.restaurant_id,
      'assetId', work.asset_id,
      'intakeId', work.intake_id,
      'sourceStoragePath', work.storage_path,
      'sourceStorageObjectId', work.storage_object_id,
      'sourceStorageObjectVersion', work.storage_object_version,
      'vaultKey', 'private-originals/v1/restaurants/' ||
        work.restaurant_id::text || '/sha256/' || work.content_sha256 || '.jpg',
      'vaultVersion', 'r2-version-1',
      'vaultEtag', '0123456789abcdef0123456789abcdef',
      'mimeType', work.mime_type,
      'fileSize', work.file_size,
      'contentSha256', work.content_sha256,
      'readbackHashVerified', true
    ) as snapshot
  from work
), canonical as (
  select evidence.*,
    veroxa_private.momo_canonical_json_v1(evidence.snapshot) as canonical
  from evidence
)
select completed.*
from canonical
cross join lateral public.veroxa_complete_momo_media_vault_v1(
  canonical.id,
  canonical.lease_token,
  'private-originals/v1/restaurants/' || canonical.restaurant_id::text ||
    '/sha256/' || canonical.content_sha256 || '.jpg',
  'r2-version-1',
  '0123456789abcdef0123456789abcdef',
  canonical.file_size,
  canonical.content_sha256,
  canonical.snapshot,
  canonical.canonical,
  pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(canonical.canonical, 'UTF8'), 'sha256'
  ), 'hex')
) completed;

select is(
  (select status from vault_completion),
  'verified',
  'exact readback evidence completes as verified'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from veroxa_private.momo_media_vault_receipts_v1 receipt
    where receipt.asset_id =
      '30000000-0000-4000-8000-000000000190'::uuid
      and receipt.content_sha256 = pg_catalog.repeat('a', 64)
      and receipt.file_size = 12000
      and receipt.verification_snapshot -> 'readbackHashVerified' =
        'true'::jsonb
      and not receipt.external_write_allowed
  ),
  1,
  'one append-only receipt binds source identity, size, hash, and readback proof'
);
select is(
  (
    select state
    from veroxa_private.momo_media_vault_outbox_v1 work
    where work.asset_id =
      '30000000-0000-4000-8000-000000000190'::uuid
  ),
  'completed',
  'the durable item reaches completed only after receipt insertion'
);
select throws_ok(
  $$
    update veroxa_private.momo_media_vault_receipts_v1
    set vault_etag = 'changed'
    where asset_id = '30000000-0000-4000-8000-000000000190'::uuid
  $$,
  '23514',
  'momo_media_vault_receipt_is_append_only_v1',
  'vault receipts cannot be rewritten or deleted'
);
select is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.pg_trigger trigger_record
    where trigger_record.tgrelid =
      'public.veroxa_momo_ready_packages_v2'::regclass
      and trigger_record.tgname =
        'veroxa_require_momo_media_vault_before_ready_v1'
      and not trigger_record.tgisinternal
  ),
  1,
  'the authoritative Ready table has the vault receipt gate'
);
select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.veroxa_claim_momo_media_vault_v1(uuid,bigint,uuid)',
    'execute'
  ),
  'authenticated users cannot claim private vault work'
);
select ok(
  pg_catalog.has_function_privilege(
    'service_role',
    'public.veroxa_claim_momo_media_vault_v1(uuid,bigint,uuid)',
    'execute'
  ),
  'only the service worker receives the claim RPC'
);
select is(
  (
    select pg_catalog.count(*)::integer from cron.job
    where jobname = 'veroxa-momo-private-media-vault'
  ),
  1,
  'one bounded vault wake schedule is installed'
);
select is(
  (
    select asset.content_sha256
    from public.veroxa_media_assets asset
    where asset.id = '30000000-0000-4000-8000-000000000190'::uuid
  ),
  pg_catalog.repeat('a', 64),
  'vault completion never mutates the source original hash'
);
select is(
  (select pg_catalog.count(*)::integer from net.http_request_queue),
  0,
  'the database test does not perform any outbound request'
);

select * from finish();
rollback;
