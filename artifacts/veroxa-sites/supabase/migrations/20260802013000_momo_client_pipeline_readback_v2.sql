-- Minimal client readback for the private Momo upload -> Veroxa Ready flow.
-- It exposes state labels and bounded reason codes only: no captions, provider
-- payloads, internal evidence snapshots, schedules, or external-write control.

create or replace function public.veroxa_momo_client_upload_status_v2(
  target_restaurant_id uuid
)
returns table (
  asset_id uuid,
  canonical_asset_id uuid,
  verification_status text,
  pipeline_status text,
  is_exact_duplicate boolean,
  processing_asset_id uuid,
  is_processing_source boolean,
  reason_codes jsonb,
  ready_package_id uuid,
  external_write_allowed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    target_restaurant_id, (select auth.uid())
  ) then
    raise exception using errcode = '42501',
      message = 'momo_client_upload_status_access_required_v2';
  end if;

  return query
  select asset.id,
    coalesce(link.canonical_asset_id, asset.id),
    case when verification.id is not null then 'verified' else null end,
    case
      when incident.id is not null then 'needs_attention'
      when run.status = 'failed' then 'needs_attention'
      when ready.id is not null then 'veroxa_ready'
      when run.status in (
        'reserved','provider_running','result_staged','pending_review'
      ) then 'processing'
      when verification.id is not null then 'verified'
      else 'uploaded'
    end,
    coalesce(link.link_kind = 'exact_duplicate', false),
    run.source_asset_id,
    coalesce(run.source_asset_id = asset.id, false),
    case
      when incident.id is not null then incident.blockers
      when run.status = 'failed' then pg_catalog.jsonb_build_array(
        coalesce(run.provider_error_code, 'content_processing_failed')
      )
      when attempt.outcome in ('rejected','unavailable')
        then attempt.reason_codes
      else '[]'::jsonb
    end,
    case when incident.id is null and run.status <> 'failed'
      then ready.id else null end,
    false
  from public.veroxa_media_assets asset
  left join lateral (
    select candidate.identity_id, candidate.canonical_asset_id,
      candidate.link_kind
    from public.veroxa_momo_media_asset_identity_links_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.asset_id = asset.id
    order by candidate.created_at desc, candidate.id desc
    limit 1
  ) link on true
  left join lateral (
    select candidate.id
    from public.veroxa_momo_media_intake_verifications candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.asset_id = asset.id
      and candidate.status = 'verified'
    order by candidate.verified_at desc, candidate.id desc
    limit 1
  ) verification on true
  left join lateral (
    select candidate.outcome, candidate.reason_codes
    from public.veroxa_momo_media_intake_attempts_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.source_asset_id = asset.id
    order by candidate.attempted_at desc, candidate.id desc
    limit 1
  ) attempt on true
  left join lateral (
    select candidate.id, candidate.blockers
    from public.veroxa_momo_exception_incidents_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.canonical_asset_id =
        coalesce(link.canonical_asset_id, asset.id)
      and candidate.status = 'open'
    order by candidate.last_seen_at desc, candidate.id desc
    limit 1
  ) incident on true
  left join lateral (
    select candidate.id, candidate.status, candidate.source_asset_id,
      candidate.provider_error_code
    from public.veroxa_momo_content_ai_runs candidate
    join public.veroxa_momo_media_asset_identity_links_v2 processing_link
      on processing_link.restaurant_id = candidate.restaurant_id
     and processing_link.identity_id = candidate.automation_identity_id
     and processing_link.asset_id = candidate.source_asset_id
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.automation_identity_id = link.identity_id
      and candidate.decision_mode = 'automation_policy_v2'
      and candidate.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
    order by candidate.requested_at desc, candidate.id desc
    limit 1
  ) run on true
  left join lateral (
    select candidate.id
    from public.veroxa_momo_ready_packages_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.identity_id = link.identity_id
      and candidate.content_ai_run_id = run.id
      and candidate.status = 'veroxa_ready'
    order by candidate.ready_at desc, candidate.id desc
    limit 1
  ) ready on true
  where asset.restaurant_id = target_restaurant_id
  order by asset.created_at desc, asset.id desc;
end;
$$;

revoke all on function public.veroxa_momo_client_upload_status_v2(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_client_upload_status_v2(uuid)
  to authenticated;
