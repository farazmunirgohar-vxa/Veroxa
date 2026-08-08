-- Sanitized Client readback for the private Momo upload -> Veroxa Ready flow.
--
-- A displayed upload never inherits permission from the canonical processing
-- source.  Its identity link must still bind its own current real-owner rights,
-- and any processing run must independently bind current rights for its source.
-- Internal identifiers, provider details, blocker payloads, and generated
-- content remain outside this authenticated Client boundary.

create or replace function public.veroxa_momo_client_upload_status_v3(
  target_restaurant_id uuid
)
returns table (
  asset_id uuid,
  verification_status text,
  pipeline_status text,
  is_exact_duplicate boolean,
  attention_reasons jsonb,
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
      message = 'momo_client_upload_status_access_required_v3';
  end if;

  return query
  select asset.id,
    case when verification.id is not null then 'verified' else null end,
    case
      when (link.identity_id is not null and asset_rights.id is null)
        or (run.id is not null and run_rights.id is null)
        then 'needs_attention'
      when incident.id is not null or run.status = 'failed'
        then 'needs_attention'
      when attempt.outcome = 'rejected' then 'needs_attention'
      when attempt.outcome = 'unavailable' then 'needs_attention'
      when ready.id is not null then 'veroxa_ready'
      when run.status in (
        'reserved','provider_running','result_staged','pending_review'
      ) then 'processing'
      when verification.id is not null then 'verified'
      else 'uploaded'
    end,
    coalesce(link.link_kind = 'exact_duplicate', false),
    case
      when (link.identity_id is not null and asset_rights.id is null)
        or (run.id is not null and run_rights.id is null)
        then pg_catalog.jsonb_build_array('permission_needs_update')
      when incident.id is not null or run.status = 'failed'
        then pg_catalog.jsonb_build_array(
          'preparation_needs_veroxa_review'
        )
      when attempt.outcome = 'rejected'
        then pg_catalog.jsonb_build_array('image_needs_replacement')
      when attempt.outcome = 'unavailable'
        then pg_catalog.jsonb_build_array(
          'checking_temporarily_unavailable'
        )
      else '[]'::jsonb
    end,
    false
  from public.veroxa_media_assets asset
  left join lateral (
    select candidate.identity_id, candidate.canonical_asset_id,
      candidate.link_kind, candidate.rights_id,
      candidate.rights_attestation_sha256
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
    select candidate.outcome
    from public.veroxa_momo_media_intake_attempts_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.source_asset_id = asset.id
    order by candidate.attempted_at desc, candidate.id desc
    limit 1
  ) attempt on true
  left join lateral (
    select candidate.id
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
      candidate.intake_verification_id, candidate.rights_id,
      candidate.rights_attestation_sha256, candidate.target_platforms
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
    from public.veroxa_media_rights candidate
    where candidate.id = link.rights_id
      and candidate.restaurant_id = asset.restaurant_id
      and candidate.asset_id = asset.id
      and candidate.rights_status = 'confirmed'
      and candidate.evidence_class = 'real_owner'
      and candidate.attestation_sha256 =
        link.rights_attestation_sha256
      and (candidate.valid_from is null
        or candidate.valid_from <= pg_catalog.now())
      and (candidate.expires_at is null
        or candidate.expires_at > pg_catalog.now())
    limit 1
  ) asset_rights on true
  left join lateral (
    select candidate.id
    from public.veroxa_media_rights candidate
    where candidate.id = run.rights_id
      and candidate.restaurant_id = asset.restaurant_id
      and candidate.asset_id = run.source_asset_id
      and candidate.rights_status = 'confirmed'
      and candidate.evidence_class = 'real_owner'
      and candidate.attestation_sha256 =
        run.rights_attestation_sha256
      and (candidate.valid_from is null
        or candidate.valid_from <= pg_catalog.now())
      and (candidate.expires_at is null
        or candidate.expires_at > pg_catalog.now())
      and run.target_platforms <@ candidate.usage_scope
    limit 1
  ) run_rights on true
  left join lateral (
    select candidate.id
    from public.veroxa_momo_ready_packages_v2 candidate
    where candidate.restaurant_id = asset.restaurant_id
      and candidate.identity_id = link.identity_id
      and candidate.content_ai_run_id = run.id
      and candidate.canonical_asset_id = link.canonical_asset_id
      and candidate.source_asset_id = run.source_asset_id
      and candidate.intake_verification_id = run.intake_verification_id
      and candidate.rights_id = run.rights_id
      and candidate.rights_attestation_sha256 =
        run.rights_attestation_sha256
      and candidate.status = 'veroxa_ready'
    order by candidate.ready_at desc, candidate.id desc
    limit 1
  ) ready on true
  where asset.restaurant_id = target_restaurant_id
  order by asset.created_at desc, asset.id desc;
end;
$$;

revoke all on function public.veroxa_momo_client_upload_status_v3(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_client_upload_status_v3(uuid)
  to authenticated;
