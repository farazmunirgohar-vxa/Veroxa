-- Forward-only repair for the durable ingestion path boundary.
--
-- The predecessor used two backslashes before the extension dot. With
-- standard_conforming_strings enabled, PostgreSQL preserved both and the
-- regular expression required a literal backslash in every object path.
-- Keep the applied predecessor immutable; replace its path constraint and
-- trigger predicate here, then backfill every still-eligible upload.

alter table veroxa_private.momo_media_ingestion_outbox_v1
  drop constraint momo_media_ingestion_outbox_v1_check,
  add constraint momo_media_ingestion_outbox_storage_path_v2_check check (
    storage_path ~ (
      '^restaurants/' || restaurant_id::text ||
      '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
      '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
      '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
    )
  );

-- Block concurrent registrations until the corrected trigger is visible.
-- The outbox ALTER comes first to match the worker's outbox-to-asset lock
-- order. Any earlier canonical INSERT still runs the broken trigger, then this
-- lock waits for it and the later READ COMMITTED backfill sees it.
lock table public.veroxa_media_assets in share row exclusive mode;

create or replace function
  veroxa_private.enqueue_registered_momo_media_ingestion_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'uploaded'
     or new.mime_type not in ('image/jpeg','image/png')
     or new.file_size not between 10240 and 10485760
     or new.storage_path !~ (
       '^restaurants/' || new.restaurant_id::text ||
       '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
       '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
       '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
     )
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       new.restaurant_id, new.uploaded_by
     ) then
    return new;
  end if;
  perform veroxa_private.enqueue_momo_media_ingestion_v1(
    new.restaurant_id, new.id, new.uploaded_by
  );
  return new;
end;
$$;
revoke all on function
  veroxa_private.enqueue_registered_momo_media_ingestion_v1()
  from public, anon, authenticated, service_role;

do $$
declare
  candidate record;
begin
  for candidate in
    select asset.restaurant_id, asset.id, asset.uploaded_by
    from public.veroxa_media_assets asset
    where asset.status = 'uploaded'
      and asset.mime_type in ('image/jpeg','image/png')
      and asset.file_size between 10240 and 10485760
      and asset.storage_path ~ (
        '^restaurants/' || asset.restaurant_id::text ||
        '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
        '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
        '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
      )
      and not exists (
        select 1
        from public.veroxa_private_media_assessment_intakes_v1 intake
        where intake.restaurant_id = asset.restaurant_id
          and intake.asset_id = asset.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_media_ingestion_outbox_v1 receipt
        where receipt.asset_id = asset.id
      )
      and veroxa_private.momo_actor_has_operational_membership_v1(
        asset.restaurant_id, asset.uploaded_by
      )
  loop
    perform veroxa_private.enqueue_momo_media_ingestion_v1(
      candidate.restaurant_id, candidate.id, candidate.uploaded_by
    );
  end loop;

  if exists (
    select 1
    from public.veroxa_media_assets asset
    where asset.status = 'uploaded'
      and asset.mime_type in ('image/jpeg','image/png')
      and asset.file_size between 10240 and 10485760
      and asset.storage_path ~ (
        '^restaurants/' || asset.restaurant_id::text ||
        '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/' ||
        '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-' ||
        '[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|jpeg|png)$'
      )
      and not exists (
        select 1
        from public.veroxa_private_media_assessment_intakes_v1 intake
        where intake.restaurant_id = asset.restaurant_id
          and intake.asset_id = asset.id
      )
      and veroxa_private.momo_actor_has_operational_membership_v1(
        asset.restaurant_id, asset.uploaded_by
      )
      and not exists (
        select 1
        from veroxa_private.momo_media_ingestion_outbox_v1 receipt
        where receipt.asset_id = asset.id
      )
  ) then
    raise exception using errcode = '23514',
      message = 'momo_media_ingestion_path_repair_backfill_incomplete_v1';
  end if;
end;
$$;
