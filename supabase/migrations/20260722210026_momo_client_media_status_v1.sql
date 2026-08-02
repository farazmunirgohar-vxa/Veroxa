-- Tenant-safe Client readback for private owner-asset renditions.
-- The Client receives only the latest currently eligible private derivative
-- needed for visual review. Team recipes, hashes, IDs, and synthetic evidence
-- remain hidden. Eligibility is recalculated on every read.

-- Migration 14 was created under legacy Supabase default privileges. Those
-- defaults exposed every new public table to anon/authenticated/service_role
-- before RLS was evaluated and did not FORCE RLS. This forward-only repair
-- makes the intended API surface explicit: authenticated users may read only
-- the tenant-filtered evidence tables used by the Team UI; all mutations stay
-- behind actor-bound RPCs; anon and service_role receive no direct table path.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'veroxa_campaign_tracking_contracts',
    'veroxa_content_media_placements',
    'veroxa_external_content_cache',
    'veroxa_growth_evidence_sources',
    'veroxa_media_renditions',
    'veroxa_momo_account_handoffs',
    'veroxa_momo_action_consents',
    'veroxa_momo_authority_events',
    'veroxa_momo_evidence_authorities',
    'veroxa_momo_release_attestations',
    'veroxa_momo_runtime_controls',
    'veroxa_preconnection_gate_runs',
    'veroxa_publication_rehearsals',
    'veroxa_seo_change_sets',
    'veroxa_seo_page_baselines'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    execute format('alter table public.%I force row level security', target_table);
    execute format(
      'revoke all privileges on table public.%I from public, anon, authenticated, service_role',
      target_table
    );
  end loop;
end;
$$;

grant select on
  public.veroxa_momo_evidence_authorities,
  public.veroxa_growth_evidence_sources,
  public.veroxa_momo_action_consents,
  public.veroxa_momo_runtime_controls,
  public.veroxa_media_renditions,
  public.veroxa_content_media_placements,
  public.veroxa_publication_rehearsals,
  public.veroxa_seo_page_baselines,
  public.veroxa_seo_change_sets,
  public.veroxa_preconnection_gate_runs,
  public.veroxa_momo_account_handoffs,
  public.veroxa_momo_authority_events,
  public.veroxa_momo_release_attestations,
  public.veroxa_campaign_tracking_contracts
to authenticated;

-- Service-role credentials are for narrowly scoped administration, not an
-- alternate readiness API. Remove the direct grants inherited by both the
-- legacy readiness chain and the newer preconnection gate. Authenticated Team
-- calls retain their explicit grants and their in-function tenant checks.
revoke execute on function
  public.veroxa_reconcile_momo_readiness_v1(uuid),
  public.veroxa_run_momo_readiness_gate_v1(uuid),
  public.veroxa_record_momo_no_go_v1(uuid,uuid,text,boolean),
  public.veroxa_momo_readiness_summary_v1(uuid),
  public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text),
  public.veroxa_run_momo_preconnection_gate_v1(uuid)
from public, anon, service_role;

create or replace function public.veroxa_momo_client_can_read_rendition_v1(target_storage_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_restaurant_id uuid;
  caller_evidence_class text;
begin
  if (select auth.uid()) is null
     or target_storage_path is null
     or target_storage_path !~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/renditions/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{64}[.](jpg|png|webp)$' then
    return false;
  end if;

  target_restaurant_id := public.veroxa_restaurant_id_from_storage_path(target_storage_path);
  if target_restaurant_id is null
     or not public.veroxa_current_user_has_active_restaurant(target_restaurant_id) then
    return false;
  end if;
  caller_evidence_class := veroxa_private.momo_evidence_class_for_user_v1(
    target_restaurant_id, (select auth.uid())
  );
  if caller_evidence_class is null
     or caller_evidence_class not in ('development_proxy', 'real_owner') then
    return false;
  end if;

  return exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.restaurant_id = asset.restaurant_id and rights.asset_id = asset.id
    join public.veroxa_media_reviews review
      on review.restaurant_id = asset.restaurant_id and review.asset_id = asset.id and review.is_current
    join public.veroxa_media_renditions rendition
      on rendition.restaurant_id = asset.restaurant_id and rendition.source_asset_id = asset.id
    join storage.objects object on object.id = rendition.storage_object_id
    where asset.restaurant_id = target_restaurant_id
      and asset.status = 'ready_to_use'
      and asset.content_sha256 is not null
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = caller_evidence_class
      and rights.evidence_class in ('development_proxy', 'real_owner')
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and review.status = 'approved'
      and review.public_use_approved
      and rendition.storage_path = target_storage_path
      and rendition.source_kind = 'owner_asset'
      and rendition.source_key = asset.id::text
      and rendition.source_content_sha256 = asset.content_sha256
      and rendition.evidence_class = rights.evidence_class
      and rights.usage_scope ? rendition.intended_use
      and rendition.status = 'ready'
      and rendition.output_hash_attested_at is not null
      and not rendition.external_write_allowed
      and object.bucket_id = 'restaurant-media'
      and object.name = rendition.storage_path
      and object.version is not null
      and rendition.storage_object_version is not null
      and object.version = rendition.storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') = rendition.mime_type
      and case
        when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
          then (object.metadata ->> 'size')::numeric = rendition.file_size
        else false
      end
  );
end;
$$;

create or replace function public.veroxa_momo_client_media_status_v1(target_restaurant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(target_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'assetId', asset.id,
    'renditionStatus', case when eligible.storage_path is not null then 'ready' else null end,
    'renditionStoragePath', eligible.storage_path,
    'renditionAltText', eligible.alt_text,
    'renditionWidth', eligible.width,
    'renditionHeight', eligible.height
  ) order by asset.created_at desc), '[]'::jsonb)
  into result
  from public.veroxa_media_assets asset
  left join lateral (
    select rendition.storage_path, rendition.alt_text, rendition.width, rendition.height
    from public.veroxa_media_renditions rendition
    where rendition.restaurant_id = target_restaurant_id
      and rendition.source_asset_id = asset.id
      and public.veroxa_momo_client_can_read_rendition_v1(rendition.storage_path)
    order by rendition.created_at desc, rendition.id desc
    limit 1
  ) eligible on true
  where asset.restaurant_id = target_restaurant_id;

  return result;
end;
$$;

-- Keep Team access to all tenant-scoped rendition evidence. A Client can read
-- only the exact owner-asset derivative that passes the helper above.
drop policy if exists veroxa_restaurant_media_member_select on storage.objects;
create policy veroxa_restaurant_media_member_select on storage.objects
for select to authenticated using (
  bucket_id = 'restaurant-media'
  and (
    (name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/'
      and (
        public.veroxa_current_user_has_active_restaurant(
          public.veroxa_restaurant_id_from_storage_path(name))
        or public.veroxa_current_user_is_team_for_restaurant(
          public.veroxa_restaurant_id_from_storage_path(name))
      ))
    or
    (name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/renditions/'
      and (
        public.veroxa_current_user_is_team_for_restaurant(
          public.veroxa_restaurant_id_from_storage_path(name))
        or public.veroxa_momo_client_can_read_rendition_v1(name)
      ))
  )
);

revoke all on function public.veroxa_momo_client_can_read_rendition_v1(text),
  public.veroxa_momo_client_media_status_v1(uuid)
from public, anon, authenticated, service_role;

grant execute on function public.veroxa_momo_client_can_read_rendition_v1(text),
  public.veroxa_momo_client_media_status_v1(uuid)
to authenticated;
