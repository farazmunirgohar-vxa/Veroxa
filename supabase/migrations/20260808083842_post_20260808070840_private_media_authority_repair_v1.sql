-- Forward-only repair after
-- 20260808070840_momo_ready_team_decisions_and_food_tags_v2.
--
-- The later migration introduced the v5 content/tag contract but replaced
-- source-first private-media controls and added a parallel package-only Ready
-- decision authority. This migration preserves v5 exactly while restoring the
-- source-byte tombstone, exact real-owner association, private-assessment,
-- current-evidence, tenant, cost, and external-write boundaries.
--
-- Connector must assign the migration version before release. Never rewrite
-- any applied migration.

-- The PR164 decision table was briefly writable authority, and public v1 also
-- permitted bridge-less approvals before this repair. Production was verified
-- empty before authoring. Serialize both cutovers against concurrent writers
-- and fail closed if either legacy authority shape appears. Take the DDL's
-- SHARE ROW EXCLUSIVE mode up front so an old queued writer cannot deadlock a
-- later lock upgrade while CREATE TRIGGER installs persistent invariants.
lock table public.veroxa_momo_ready_disposition_events_v1,
  veroxa_private.momo_ready_decisions_v2
  in share row exclusive mode;

do $momo_ready_v2_zero_row_preflight$
begin
  if exists (
    select 1
    from veroxa_private.momo_ready_decisions_v2
  ) then
    raise exception using errcode = '55000',
      message = 'momo_ready_v2_legacy_decisions_require_reconciliation';
  end if;
  if exists (
    select 1
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.disposition = 'approved_for_posting'
  ) then
    raise exception using errcode = '55000',
      message = 'momo_ready_v1_legacy_approvals_require_reconciliation';
  end if;
end;
$momo_ready_v2_zero_row_preflight$;

-- Every post-cutover approval event must have a private, immutable intent
-- created by the v2 adapter in the same transaction and backend. This closes
-- the deployment race where an already-running old public-v1 body waits on the
-- table lock and resumes after commit: it has no intent and is rejected. A
-- source-wide discard does not require approval intent and remains public v1.
create table veroxa_private.momo_ready_v2_approval_intents_v1 (
  id uuid primary key default extensions.gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null unique
    references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  output_sha256 text not null
    check (output_sha256 ~ '^[0-9a-f]{64}$'),
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  review_snapshot_sha256 text not null
    check (review_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  decision_request_sha256 text not null unique
    check (decision_request_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  transaction_id bigint not null check (transaction_id > 0),
  backend_pid integer not null check (backend_pid > 0),
  recorded_at timestamptz not null default pg_catalog.clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed)
);
alter table veroxa_private.momo_ready_v2_approval_intents_v1
  enable row level security;
alter table veroxa_private.momo_ready_v2_approval_intents_v1
  force row level security;
revoke all on table veroxa_private.momo_ready_v2_approval_intents_v1
  from public, anon, authenticated, service_role;

create trigger momo_ready_v2_approval_intents_append_only_v1
before update or delete
on veroxa_private.momo_ready_v2_approval_intents_v1
for each row execute function veroxa_private.momo_v2_append_only_guard();

create or replace function
  veroxa_private.validate_momo_ready_v2_approval_intent_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
begin
  select candidate.* into ready
  from public.veroxa_momo_ready_packages_v2 candidate
  where candidate.id = new.ready_package_id;

  if ready.id is null
     or ready.restaurant_id is distinct from new.restaurant_id
     or ready.output_sha256 is distinct from new.output_sha256
     or ready.source_content_sha256 is distinct from
       new.source_content_sha256
     or new.recorded_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_is_team_for_restaurant(
       new.restaurant_id
     )
     or new.transaction_id is distinct from pg_catalog.txid_current()
     or new.backend_pid is distinct from pg_catalog.pg_backend_pid()
     or new.external_write_allowed then
    raise exception using errcode = '23514',
      message = 'momo_ready_v2_approval_intent_invalid';
  end if;
  new.recorded_at := pg_catalog.clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_ready_v2_approval_intent_v1()
  from public, anon, authenticated, service_role;

create trigger momo_ready_v2_approval_intent_validate_v1
before insert on veroxa_private.momo_ready_v2_approval_intents_v1
for each row execute function
  veroxa_private.validate_momo_ready_v2_approval_intent_v1();

create or replace function
  veroxa_private.require_momo_ready_v2_intent_for_approval_event_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.disposition = 'approved_for_posting'
     and (
       new.note is distinct from
         'Approved through Team Ready review v2 for manual copy and download only.'
       or new.attestation is distinct from '{
         "teamReviewed": true,
         "noExternalWriteAuthorized": true,
         "decisionIsFinalForThisOutput": true
       }'::jsonb
       or not exists (
         select 1
         from veroxa_private.momo_ready_v2_approval_intents_v1 intent
         where intent.restaurant_id = new.restaurant_id
           and intent.ready_package_id = new.ready_package_id
           and intent.output_sha256 = new.output_sha256
           and intent.source_content_sha256 = new.source_content_sha256
           and intent.recorded_by = new.recorded_by
           and intent.transaction_id = pg_catalog.txid_current()
           and intent.backend_pid = pg_catalog.pg_backend_pid()
           and not intent.external_write_allowed
       )
     ) then
      raise exception using errcode = '42501',
        message = 'momo_ready_v2_approval_required';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.require_momo_ready_v2_intent_for_approval_event_v1()
  from public, anon, authenticated, service_role;

create trigger aa_momo_ready_v2_intent_required_for_approval_event_v1
before insert on public.veroxa_momo_ready_disposition_events_v1
for each row execute function
  veroxa_private.require_momo_ready_v2_intent_for_approval_event_v1();

-- The transaction-scoped preflight also needs a persistent hand-off guard.
-- An old live46 v2 call may already be running when deployment begins, wait
-- behind the SHARE lock at its INSERT, and resume after commit. Require the
-- v1 event to exist first on every compatibility-audit insert so that old
-- package-only code fails closed while the repaired adapter (v1 then audit)
-- succeeds. Do not acquire the source lock here: old code may already hold the
-- Ready row, and introducing Ready -> source would invert the repaired order.
create or replace function
  veroxa_private.require_momo_ready_v1_authority_for_v2_audit_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  authority_exists boolean := false;
begin
  select candidate.* into ready
  from public.veroxa_momo_ready_packages_v2 candidate
  where candidate.id = new.ready_package_id;

  if ready.id is null
     or ready.restaurant_id is distinct from new.restaurant_id
     or new.external_write_allowed then
    raise exception using errcode = '23514',
      message = 'momo_ready_v2_authority_event_required';
  end if;

  if new.decision = 'approved_for_manual_export' then
    select exists (
      select 1
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.restaurant_id = ready.restaurant_id
        and event.ready_package_id = ready.id
        and event.output_sha256 = ready.output_sha256
        and event.source_content_sha256 = ready.source_content_sha256
        and event.disposition = 'approved_for_posting'
        and not event.external_write_allowed
    ) into authority_exists;
  elsif new.decision = 'discarded' then
    select exists (
      select 1
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.restaurant_id = ready.restaurant_id
        and event.source_content_sha256 = ready.source_content_sha256
        and event.disposition = 'discarded'
        and not event.external_write_allowed
    ) into authority_exists;
  end if;

  if not authority_exists then
    raise exception using errcode = '23514',
      message = 'momo_ready_v2_authority_event_required';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.require_momo_ready_v1_authority_for_v2_audit_v1()
  from public, anon, authenticated, service_role;

create trigger aa_momo_ready_v2_authority_required_v1
before insert on veroxa_private.momo_ready_decisions_v2
for each row execute function
  veroxa_private.require_momo_ready_v1_authority_for_v2_audit_v1();

-- A completed generic assessment remains privately useful for every allowed
-- subject, but the current paid v5 Momo contract accepts exactly `food`.
-- Centralize that stricter condition in the existing exact-asset evidence
-- helper so reservation, duplicate-source selection, current-evidence, Ready,
-- and all compatibility readbacks fail closed together. `food_and_drink` stays
-- assessment-only until a comprehensively versioned content contract permits
-- it; it must not incur a known-failing paid v5 call.
create or replace function
  veroxa_private.media_has_current_real_owner_association_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_rights_id uuid,
    p_source_content_sha256 text
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_private_media_assessment_intakes_v1 intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.content_sha256 = p_source_content_sha256
    join public.veroxa_private_media_assessment_asset_links_v1 link
      on link.asset_id = asset.id
     and link.restaurant_id = asset.restaurant_id
     and link.intake_id = intake.id
     and link.source_content_sha256 = intake.content_sha256
    join public.veroxa_private_media_assessments_v1 assessment
      on assessment.id = link.assessment_id
     and assessment.restaurant_id = asset.restaurant_id
     and assessment.source_content_sha256 = intake.content_sha256
     and assessment.status = 'completed'
     and veroxa_private.private_media_assessment_output_valid_v1(
       assessment.output_payload
     )
     and assessment.output_payload ->> 'subject' = 'food'
    join public.veroxa_media_rights rights
      on rights.id = p_rights_id
     and rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
    join lateral (
      select association.*
      from public.veroxa_media_restaurant_associations_v1 association
      where association.restaurant_id = asset.restaurant_id
        and association.asset_id = asset.id
        and association.rights_id = p_rights_id
        and association.source_content_sha256 =
          p_source_content_sha256
      order by association.recorded_at desc, association.id desc
      limit 1
    ) latest on true
    where asset.id = p_asset_id
      and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = p_source_content_sha256
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
      and latest.association =
        'represents_current_restaurant_offering'
      and latest.evidence_class = 'real_owner'
      and not latest.external_write_allowed
  );
$$;
revoke all on function
  veroxa_private.media_has_current_real_owner_association_v1(
    uuid, uuid, uuid, text
  ) from public, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION veroxa_private.momo_advance_verified_asset_v2(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_processing_asset_id uuid;
  v_verification_id uuid;
  v_preliminary_rights_id uuid;
  v_preliminary_source_hash text;
  v_actor_id uuid;
  v_asset public.veroxa_media_assets%rowtype;
  v_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_rights public.veroxa_media_rights%rowtype;
  v_canonical_rights public.veroxa_media_rights%rowtype;
  v_processing_asset public.veroxa_media_assets%rowtype;
  v_processing_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_processing_rights public.veroxa_media_rights%rowtype;
  v_identity public.veroxa_momo_media_canonical_identities_v2%rowtype;
  v_canonical_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_link public.veroxa_momo_media_asset_identity_links_v2%rowtype;
  v_existing_run public.veroxa_momo_content_ai_runs%rowtype;
  v_retry_parent public.veroxa_momo_content_ai_runs%rowtype;
  v_stale_run public.veroxa_momo_content_ai_runs%rowtype;
  v_blocking_run public.veroxa_momo_content_ai_runs%rowtype;
  v_budget veroxa_private.momo_ai_budget_controls%rowtype;
  v_truth jsonb;
  v_truth_hash text;
  v_platforms jsonb;
  v_client_request_hash text;
  v_idempotency_hash text;
  v_request_hash text;
  v_advance_hash text;
  v_retry_generation smallint := 0;
  v_attempt_hash text;
  v_attempt_snapshot jsonb;
  v_attempt_canonical text;
  v_attempt_evidence_hash text;
  v_run_id uuid;
  v_outcome text;
  v_reasons jsonb := '[]'::jsonb;
  v_duplicate boolean;
  v_exception_snapshot jsonb;
  v_exception_canonical text;
  v_exception_hash text;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
    'restaurantId','assetId','verificationId','actorId'
  ]) then
    raise exception using errcode = '22023', message = 'invalid_momo_advance_v2';
  end if;
  v_restaurant_id := (p_payload ->> 'restaurantId')::uuid;
  v_asset_id := (p_payload ->> 'assetId')::uuid;
  v_verification_id := (p_payload ->> 'verificationId')::uuid;
  v_actor_id := (p_payload ->> 'actorId')::uuid;
  if not veroxa_private.momo_actor_has_operational_membership_v1(
      v_restaurant_id, v_actor_id
    ) then
    raise exception using errcode = '42501', message = 'momo_advance_member_required_v2';
  end if;

  -- Resolve tenant-bound immutable identity without a row lock, acquire the
  -- canonical per-source lock, then re-read every evidence row under SHARE.
  -- No mutable/exclusive row or tenant-budget lock may precede this source
  -- serialization point.
  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id
    and asset.restaurant_id = v_restaurant_id;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified';
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514',
      message = 'momo_advance_evidence_invalid_v2';
  end if;
  v_preliminary_rights_id := v_rights.id;
  v_preliminary_source_hash := v_verification.content_sha256;

  perform veroxa_private.lock_momo_source_media_v1(
    v_restaurant_id, v_preliminary_source_hash
  );
  if veroxa_private.momo_source_media_discarded_v1(
    v_restaurant_id, v_preliminary_source_hash
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id
    and asset.restaurant_id = v_restaurant_id
  for share;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified'
  for share;
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.id = v_preliminary_rights_id
    and rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_verification.content_sha256 is distinct from
      v_preliminary_source_hash
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514',
      message = 'momo_advance_evidence_invalid_v2';
  end if;

  select * into v_identity
  from public.veroxa_momo_media_canonical_identities_v2 identity
  where identity.restaurant_id = v_restaurant_id
    and identity.content_sha256 = v_verification.content_sha256
  for update;
  if not found then
    select verification.* into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    join public.veroxa_media_assets asset
      on asset.id = verification.asset_id
     and asset.restaurant_id = verification.restaurant_id
    where verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_verification.content_sha256
      and asset.content_sha256 = verification.content_sha256
    order by verification.verified_at, verification.id
    limit 1
    for share of verification;
    if v_canonical_verification.id is null then
      raise exception using errcode = '23514', message = 'momo_canonical_verification_missing_v2';
    end if;
    insert into public.veroxa_momo_media_canonical_identities_v2 (
      restaurant_id, content_sha256, canonical_asset_id,
      canonical_verification_id
    ) values (
      v_restaurant_id, v_verification.content_sha256,
      v_canonical_verification.asset_id, v_canonical_verification.id
    ) returning * into v_identity;
  else
    select * into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.id = v_identity.canonical_verification_id;
  end if;

  select * into v_canonical_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_identity.canonical_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_canonical_rights.id is null
    or v_canonical_verification.asset_id <> v_identity.canonical_asset_id
    or v_canonical_verification.content_sha256 <> v_identity.content_sha256 then
    raise exception using errcode = '23514', message = 'momo_canonical_identity_invalid_v2';
  end if;

  -- Ensure the canonical asset has an explicit self-link even when an older
  -- verified upload is first encountered through a later exact duplicate.
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_identity.canonical_asset_id,
    v_identity.canonical_verification_id, v_identity.canonical_asset_id,
    'canonical', v_identity.content_sha256, v_canonical_rights.id,
    v_canonical_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;

  v_duplicate := v_asset_id <> v_identity.canonical_asset_id;
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id,
    case when v_duplicate then 'exact_duplicate' else 'canonical' end,
    v_verification.content_sha256, v_rights.id,
    v_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;
  select * into v_link
  from public.veroxa_momo_media_asset_identity_links_v2 link
  where link.asset_id = v_asset_id;
  if v_link.identity_id <> v_identity.id
    or v_link.verification_id <> v_verification_id
    or v_link.content_sha256 <> v_verification.content_sha256
    or v_link.canonical_asset_id <> v_identity.canonical_asset_id then
    raise exception using errcode = '23505', message = 'momo_identity_link_conflict_v2';
  end if;

  v_attempt_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 2,
    'restaurantId', v_restaurant_id,
    'assetId', v_asset_id,
    'verificationId', v_verification_id,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'outcome', case when v_duplicate then 'duplicate' else 'verified' end,
    'contentSha256', v_verification.content_sha256,
    'identityMethod', 'sha256_exact_bytes'
  );
  v_attempt_canonical := veroxa_private.momo_canonical_json_v1(v_attempt_snapshot);
  v_attempt_evidence_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(v_attempt_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  v_attempt_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-intake-success-v2:' || v_verification_id::text || ':' ||
      v_identity.id::text, 'UTF8'
  ), 'sha256'), 'hex');
  insert into public.veroxa_momo_media_intake_attempts_v2 (
    restaurant_id, source_asset_id, verification_id, canonical_asset_id,
    actor_id, outcome, reason_codes, evidence_snapshot, evidence_canonical,
    evidence_sha256, idempotency_sha256
  ) values (
    v_restaurant_id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id, v_actor_id,
    case when v_duplicate then 'duplicate' else 'verified' end,
    '[]'::jsonb, v_attempt_snapshot, v_attempt_canonical,
    v_attempt_evidence_hash, v_attempt_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;
  perform veroxa_private.momo_resolve_exceptions_v2(
    v_restaurant_id, v_asset_id, null, 'intake_verified'
  );

  if v_duplicate then
    if v_rights.usage_scope is distinct from v_canonical_rights.usage_scope
      or v_rights.valid_from is distinct from v_canonical_rights.valid_from
      or v_rights.expires_at is distinct from v_canonical_rights.expires_at
      or v_rights.rights_status is distinct from v_canonical_rights.rights_status
      or v_rights.evidence_class is distinct from v_canonical_rights.evidence_class then
      v_reasons := '["duplicate_rights_differ"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'sourceAssetId', v_asset_id,
        'canonicalAssetId', v_identity.canonical_asset_id,
        'sourceRightsId', v_rights.id,
        'canonicalRightsId', v_canonical_rights.id,
        'contentSha256', v_identity.content_sha256,
        'authorizationPolicy', 'single_current_exact_link_rights',
        'duplicateRightsCombined', false,
        'externalWriteAllowed', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'rights_reconciliation',
          'policyVersion', 'momo-exact-byte-identity-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id, v_asset_id, null,
        'rights_reconciliation', 'momo-exact-byte-identity-2026-08-02-v2',
        v_reasons, '[]'::jsonb, v_exception_snapshot,
        v_exception_canonical, v_exception_hash
      );
      -- A duplicate upload is independent provenance, not a permission
      -- amendment or withdrawal. Preserve both attestations, never combine or
      -- expand them. Deterministic processing-source selection below binds any
      -- run to exactly one current link and its own validated rights. The
      -- transient incident leaves immutable open/resolved events but never
      -- becomes routine Team clutter.
      perform veroxa_private.momo_resolve_exceptions_v2(
        v_restaurant_id, v_identity.canonical_asset_id, null,
        'duplicate_rights_isolated'
      );
      v_reasons := '[]'::jsonb;
    end if;
  end if;

  -- Canonical identity is permanent, but processing authorization belongs to
  -- one concrete upload. Prefer the canonical link only while its own rights
  -- remain current; otherwise choose the earliest verified exact-byte link
  -- with its own current real-owner rights. Never union permission scopes.
  select link.asset_id into v_processing_asset_id
  from public.veroxa_momo_media_asset_identity_links_v2 link
  join public.veroxa_media_assets asset
    on asset.id = link.asset_id
   and asset.restaurant_id = link.restaurant_id
  join public.veroxa_momo_media_intake_verifications verification
    on verification.id = link.verification_id
   and verification.asset_id = asset.id
   and verification.restaurant_id = asset.restaurant_id
  join public.veroxa_media_rights rights
    on rights.id = link.rights_id
   and rights.asset_id = asset.id
   and rights.restaurant_id = asset.restaurant_id
  join storage.objects object
    on object.bucket_id = 'restaurant-media'
   and object.name = verification.storage_path
   and object.id = verification.storage_object_id
  where link.identity_id = v_identity.id
    and link.restaurant_id = v_restaurant_id
    and link.canonical_asset_id = v_identity.canonical_asset_id
    and link.content_sha256 = v_identity.content_sha256
    and asset.content_sha256 = v_identity.content_sha256
    and asset.status in ('uploaded','ready_to_use')
    and verification.status = 'verified'
    and verification.content_sha256 = v_identity.content_sha256
    and object.version = verification.storage_object_version
    and coalesce(object.metadata ->> 'mimetype', '') =
      verification.detected_mime_type
    and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
      then (object.metadata ->> 'size')::numeric = verification.file_size::numeric
      else false end
    and rights.rights_status = 'confirmed'
    and rights.evidence_class = 'real_owner'
    and rights.attestation_version = 'momo-media-rights-v1'
    and rights.attestation_sha256 = link.rights_attestation_sha256
    and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
    and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
    and veroxa_private.media_has_current_real_owner_association_v1(
      v_restaurant_id,
      link.asset_id,
      rights.id,
      v_identity.content_sha256
    )
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(rights.usage_scope) use_name
      where use_name in ('facebook','instagram','google_business')
    )
  order by (link.asset_id = v_identity.canonical_asset_id) desc,
    verification.verified_at, verification.id
  limit 1;

  if v_processing_asset_id is not null then
    select * into v_processing_asset
    from public.veroxa_media_assets asset
    where asset.id = v_processing_asset_id
      and asset.restaurant_id = v_restaurant_id
    for share;
    select * into v_processing_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.asset_id = v_processing_asset_id
      and verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_identity.content_sha256
    for share;
    select * into v_processing_rights
    from public.veroxa_media_rights rights
    where rights.asset_id = v_processing_asset_id
      and rights.restaurant_id = v_restaurant_id
    for share;
  end if;

  v_truth := veroxa_private.current_momo_truth_snapshot_v1(v_restaurant_id);
  v_truth_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    v_truth::text, 'UTF8'
  ), 'sha256'), 'hex');
  select coalesce(pg_catalog.jsonb_agg(platform order by platform), '[]'::jsonb)
  into v_platforms
  from (
    select distinct value as platform
    from pg_catalog.jsonb_array_elements_text(v_processing_rights.usage_scope)
    where value in ('facebook','instagram','google_business')
  ) allowed;
  select * into v_budget
  from veroxa_private.momo_ai_budget_controls control
  where control.restaurant_id = v_restaurant_id
  for update;
  v_client_request_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(veroxa_private.momo_canonical_json_v1(
      pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'model', 'gpt-5.6-sol',
        'promptVersion', 'momo-content-package-2026-08-08-v5',
        'validatorVersion', 'momo-content-validator-2026-08-08-v5',
        'budgetAuthorizerId', v_budget.authorized_by,
        'automationPolicyVersion',
          'momo-upload-veroxa-ready-2026-08-02-v2'
      )
    ), 'UTF8'), 'sha256'
  ), 'hex');
  v_request_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.concat_ws('|', v_client_request_hash,
      v_identity.canonical_asset_id::text,
      v_identity.id::text, v_processing_asset_id::text,
      v_processing_verification.id::text,
      v_processing_verification.storage_object_id::text,
      v_processing_verification.storage_object_version,
      v_identity.content_sha256, v_processing_rights.id::text,
      v_processing_rights.attestation_sha256,
      v_budget.authorized_by::text, v_truth_hash, v_platforms::text,
      'automation_policy_v2'
    ), 'UTF8'
  ), 'sha256'), 'hex');
  v_idempotency_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to('momo-content-auto-v2:' || v_request_hash,
      'UTF8'), 'sha256'
  ), 'hex');

  if exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.status = 'veroxa_ready'
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
      and run.prompt_version = 'momo-content-package-2026-08-08-v5'
      and run.validator_version = 'momo-content-validator-2026-08-08-v5'
      and v_processing_rights.rights_status = 'confirmed'
      and v_processing_rights.evidence_class = 'real_owner'
      and (v_processing_rights.valid_from is null
        or v_processing_rights.valid_from <= pg_catalog.now())
      and (v_processing_rights.expires_at is null
        or v_processing_rights.expires_at > pg_catalog.now())
  ) then
    select ready.content_ai_run_id into v_run_id
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
      and run.prompt_version = 'momo-content-package-2026-08-08-v5'
      and run.validator_version = 'momo-content-validator-2026-08-08-v5'
    order by ready.ready_at desc limit 1;
    v_outcome := case when v_duplicate
      then 'duplicate_reused' else 'already_ready' end;
  else
    select run.* into v_existing_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.source_asset_id = v_processing_asset_id
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.request_hash = v_request_hash
      and (
        (run.automation_retry_generation = 0
          and run.automation_retry_of_run_id is null
          and run.idempotency_hash = v_idempotency_hash)
        or (run.automation_retry_generation = 1
          and run.automation_retry_of_run_id is not null
          and run.idempotency_hash = pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' ||
                run.automation_retry_of_run_id::text || ':' || v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex'))
      )
      and run.status in ('reserved','provider_running','result_staged','pending_review')
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, v_budget.authorized_by
      )
    order by run.automation_retry_generation desc,
      run.requested_at desc, run.id desc
    limit 1;
    if v_existing_run.id is not null then
      v_run_id := v_existing_run.id;
      v_outcome := case when v_duplicate
        then 'duplicate_reused' else 'replayed' end;
    end if;
  end if;

  if v_run_id is null then
    -- Authorization, rights, or truth may change after a reservation but
    -- before a provider call. Release only pristine pre-provider attempts so
    -- the same immutable identity can recover with newly current evidence.
    for v_stale_run in
      select run.*
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.automation_identity_id = v_identity.id
        and run.decision_mode = 'automation_policy_v2'
        and run.status = 'reserved'
        and not run.provider_called
        and run.provider_response_id is null
        and not veroxa_private.momo_content_ai_current_evidence_v1(
          run.id, run.requested_by
        )
      order by run.requested_at, run.id
      for update skip locked
    loop
      perform public.veroxa_fail_momo_content_ai_run_v1(
        v_stale_run.id, v_stale_run.request_hash, null,
        'automation_evidence_superseded', false, null, null,
        v_stale_run.requested_by
      );
    end loop;

    select run.* into v_blocking_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.decision_mode = 'automation_policy_v2'
      and (
        run.status in ('reserved','provider_running','result_staged')
        or (run.status = 'pending_review'
          and not exists (
            select 1
            from public.veroxa_momo_ready_packages_v2 ready
            where ready.content_ai_run_id = run.id
          ))
      )
    order by run.requested_at, run.id
    limit 1;
    if v_blocking_run.id is not null then
      v_run_id := v_blocking_run.id;
      v_outcome := 'exception';
      v_reasons := '["automation_identity_run_in_flight"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'blockingRunId', v_blocking_run.id,
        'blockingRunStatus', v_blocking_run.status,
        'providerCalled', v_blocking_run.provider_called
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        v_blocking_run.source_asset_id, v_blocking_run.id,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons,
        '[]'::jsonb, v_exception_snapshot, v_exception_canonical,
        v_exception_hash
      );
    end if;
  end if;

  if v_run_id is null then
    if v_processing_asset_id is null
      or v_processing_verification.id is null
      or v_processing_rights.id is null
      or v_processing_rights.rights_status <> 'confirmed'
      or v_processing_rights.evidence_class <> 'real_owner'
      or v_processing_rights.attestation_version <>
        'momo-media-rights-v1'
      or v_processing_rights.attestation_sha256 !~ '^[0-9a-f]{64}$'
      or (v_processing_rights.valid_from is not null
        and v_processing_rights.valid_from > pg_catalog.now())
      or (v_processing_rights.expires_at is not null
        and v_processing_rights.expires_at <= pg_catalog.now())
      or pg_catalog.jsonb_array_length(v_platforms) = 0
      or pg_catalog.jsonb_array_length(v_truth) < 4
      or pg_catalog.octet_length(v_truth::text) > 32768
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.display_name')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'address.primary')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.cuisine')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'menu.primary')
      or v_budget.restaurant_id is null or not v_budget.enabled
      or v_budget.external_publishing_authorized
      or not exists (
        select 1
        from public.veroxa_restaurant_members member
        join public.veroxa_user_profiles profile
          on profile.user_id = member.user_id
        where member.restaurant_id = v_restaurant_id
          and member.user_id = v_budget.authorized_by
          and member.role = 'team' and member.status = 'active'
          and profile.role = 'team' and profile.status = 'active'
      )
      or veroxa_private.momo_ai_committed_microusd_v1(v_restaurant_id)
        + 6000000 > v_budget.authorization_cap_microusd
      or not exists (
        select 1 from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = v_restaurant_id
          and runtime.ai_live_calls
          and not runtime.provider_writes and not runtime.review_replies
          and not runtime.website_writes and not runtime.external_scheduling
      ) then
      v_reasons := '["automation_evidence_or_budget_unavailable"]'::jsonb;
      v_outcome := 'exception';
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'verificationId', v_processing_verification.id,
        'budgetAuthorizerId', v_budget.authorized_by,
        'truthSnapshotSha256', v_truth_hash,
        'platformCount', pg_catalog.jsonb_array_length(v_platforms),
        'runtimeExternalWritesRequired', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        coalesce(v_processing_asset_id, v_asset_id), null,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons, '[]'::jsonb,
        v_exception_snapshot, v_exception_canonical, v_exception_hash
      );
    else
      -- The reservation identity was bound above before every replay lookup.
      select run.* into v_existing_run
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.idempotency_hash = v_idempotency_hash
      for update;
      if v_existing_run.id is not null then
        if v_existing_run.request_hash is distinct from v_request_hash
          or v_existing_run.automation_identity_id is distinct from v_identity.id
          or v_existing_run.source_asset_id is distinct from v_processing_asset_id
          or v_existing_run.rights_id is distinct from v_processing_rights.id
          or v_existing_run.rights_attestation_sha256 is distinct from
            v_processing_rights.attestation_sha256
          or v_existing_run.target_platforms is distinct from v_platforms
          or v_existing_run.truth_snapshot_sha256 is distinct from v_truth_hash
          or v_existing_run.decision_mode <> 'automation_policy_v2'
          or v_existing_run.requested_by is distinct from
            v_budget.authorized_by
          or v_existing_run.automation_retry_generation <> 0
          or v_existing_run.automation_retry_of_run_id is not null then
          raise exception using errcode = '23505',
            message = 'momo_automation_idempotency_conflict_v2';
        end if;

        if v_existing_run.status = 'failed'
          and veroxa_private.momo_content_ai_safe_retry_parent_v2(
            v_existing_run.id, v_restaurant_id, v_identity.id,
            v_request_hash, v_budget.authorized_by
          ) then
          -- One new generation is allowed only from the fully released,
          -- provably pre-provider parent above. Its key is deterministic so an
          -- exact concurrent/replayed recovery cannot create another child.
          v_retry_parent := v_existing_run;
          v_retry_generation := 1;
          v_idempotency_hash := pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' || v_retry_parent.id::text || ':' ||
                v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex');
          select run.* into v_existing_run
          from public.veroxa_momo_content_ai_runs run
          where run.restaurant_id = v_restaurant_id
            and run.idempotency_hash = v_idempotency_hash
          for update;
          if v_existing_run.id is not null then
            if v_existing_run.request_hash is distinct from v_request_hash
              or v_existing_run.automation_identity_id is distinct from
                v_identity.id
              or v_existing_run.source_asset_id is distinct from
                v_processing_asset_id
              or v_existing_run.rights_id is distinct from
                v_processing_rights.id
              or v_existing_run.rights_attestation_sha256 is distinct from
                v_processing_rights.attestation_sha256
              or v_existing_run.target_platforms is distinct from v_platforms
              or v_existing_run.truth_snapshot_sha256 is distinct from
                v_truth_hash
              or v_existing_run.decision_mode <> 'automation_policy_v2'
              or v_existing_run.requested_by is distinct from
                v_budget.authorized_by
              or v_existing_run.automation_retry_generation <>
                v_retry_generation
              or v_existing_run.automation_retry_of_run_id is distinct from
                v_retry_parent.id then
              raise exception using errcode = '23505',
                message = 'momo_automation_retry_idempotency_conflict_v2';
            end if;
            v_run_id := v_existing_run.id;
            v_outcome := case when v_existing_run.status = 'failed'
              then 'exception' else 'replayed' end;
            if v_existing_run.status = 'failed' then
              v_reasons := pg_catalog.jsonb_build_array(coalesce(
                v_existing_run.provider_error_code,
                'previous_automation_retry_failed'
              ));
            end if;
          end if;
        else
          -- A provider-called, response-bearing, send-intent, uncertain, or
          -- already retried failure is immutable and never regenerated.
          v_run_id := v_existing_run.id;
          v_outcome := case when v_existing_run.status = 'failed'
            then 'exception' else 'replayed' end;
          if v_existing_run.status = 'failed' then
            v_reasons := pg_catalog.jsonb_build_array(
              coalesce(v_existing_run.provider_error_code,
                'previous_automation_failed')
            );
          end if;
        end if;
      end if;

      if v_run_id is null then
        insert into public.veroxa_momo_content_ai_runs (
        restaurant_id, source_asset_id, intake_verification_id,
        source_storage_path, source_storage_object_id,
        source_storage_object_version, source_mime_type, source_file_size,
        source_width, source_height, source_content_sha256, rights_id,
        rights_attestation_sha256, review_id, truth_snapshot,
        truth_snapshot_sha256, target_platforms, model, reasoning_effort,
        prompt_version, schema_version, validator_version, pricing_version,
        idempotency_hash, client_request_hash, request_hash, requested_by,
        reserved_microusd, reservation_lease_expires_at, decision_mode,
        automation_policy_version, automation_identity_id,
        automation_initiated_by, automation_retry_of_run_id,
        automation_retry_generation
      ) values (
        v_restaurant_id, v_processing_asset_id,
        v_processing_verification.id,
        v_processing_verification.storage_path,
        v_processing_verification.storage_object_id,
        v_processing_verification.storage_object_version,
        v_processing_verification.detected_mime_type,
        v_processing_verification.file_size, v_processing_verification.width,
        v_processing_verification.height,
        v_processing_verification.content_sha256,
        v_processing_rights.id, v_processing_rights.attestation_sha256, null,
        v_truth, v_truth_hash, v_platforms, 'gpt-5.6-sol', 'high',
        'momo-content-package-2026-08-08-v5', 'momo-content-package-v1',
        'momo-content-validator-2026-08-08-v5',
        'openai-gpt-5.6-sol-2026-08-01-v2', v_idempotency_hash,
        v_client_request_hash, v_request_hash, v_budget.authorized_by, 6000000,
        pg_catalog.clock_timestamp() + interval '15 minutes',
        'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',
        v_identity.id, v_actor_id, v_retry_parent.id, v_retry_generation
        ) returning id into v_run_id;
        insert into veroxa_private.momo_ai_cost_ledger (
          restaurant_id, operation_kind, source_id, idempotency_hash,
          state, provider_called, reserved_microusd
        ) values (
          v_restaurant_id, 'content_package', v_run_id, v_idempotency_hash,
          'reserved', false, 6000000
        );
        v_outcome := 'queued';
      end if;
    end if;
  end if;

  if v_outcome is null then
    raise exception using errcode = '23514',
      message = 'momo_advance_outcome_missing_v2';
  end if;
  -- Idempotency belongs to the immutable transition, not merely the request.
  -- Thus an exception that later recovers to a concrete queued run appends new
  -- evidence, while the exact same outcome/run/reason replay remains a no-op.
  v_advance_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-advance-transition-v2:' ||
      veroxa_private.momo_canonical_json_v1(pg_catalog.jsonb_build_object(
        'verificationId', v_verification_id,
        'identityId', v_identity.id,
        'actorId', v_actor_id,
        'requestHash', v_request_hash,
        'outcome', v_outcome,
        'runId', v_run_id,
        'reasonCodes', v_reasons
      )),
    'UTF8'
  ), 'sha256'), 'hex');

  insert into public.veroxa_momo_automation_advances_v2 (
    restaurant_id, identity_id, source_asset_id, actor_id,
    processing_asset_id,
    canonical_asset_id,
    intake_verification_id, content_ai_run_id, outcome, reason_codes,
    policy_version, idempotency_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_actor_id,
    v_processing_asset_id,
    v_identity.canonical_asset_id, v_verification_id, v_run_id,
    v_outcome, v_reasons, 'momo-upload-veroxa-ready-2026-08-02-v2',
    v_advance_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;

  return pg_catalog.jsonb_build_object(
    'verificationId', v_verification_id,
    'status', case when v_duplicate then 'duplicate' else 'verified' end,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'duplicateAssetId', case when v_duplicate then v_asset_id else null end
  );
end;
$function$;

revoke all on function veroxa_private.momo_advance_verified_asset_v2(jsonb)
  from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- Current post-provider evidence includes private authority
-- -------------------------------------------------------------------------

alter function veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)
  rename to momo_content_ai_post_provider_evidence_pre_private_authority_v2;
revoke all on function
  veroxa_private.momo_content_ai_post_provider_evidence_pre_private_authority_v2(
    uuid
  ) from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.momo_content_ai_post_provider_evidence_v2(
    p_run_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    veroxa_private.momo_content_ai_post_provider_evidence_pre_private_authority_v2(
      p_run_id
    )
    and exists (
      select 1
      from public.veroxa_momo_content_ai_runs run
      where run.id = p_run_id
        and veroxa_private.momo_content_ai_current_evidence_v1(
          run.id, run.requested_by
        )
    );
$$;
revoke all on function
  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)
  from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- Source-first public reservation and authoritative v1 disposition
-- -------------------------------------------------------------------------

alter function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) rename to veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1;
revoke all on function
  public.veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1(
    uuid, uuid, text, text, text
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_reserve_momo_content_ai_run_v1(
  p_restaurant_id uuid,
  p_source_asset_id uuid,
  p_idempotency_hash text,
  p_client_request_hash text,
  p_recovery_response_id text
)
returns table (
  run_id uuid,
  run_status text,
  request_hash text,
  source_storage_path text,
  source_mime_type text,
  source_file_size bigint,
  source_content_sha256 text,
  source_width integer,
  source_height integer,
  target_platforms jsonb,
  truth_snapshot jsonb,
  truth_snapshot_sha256 text,
  reserved_microusd bigint,
  provider_response_id text,
  output_payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  source_hash text;
  source_rights_id uuid;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_team_required';
  end if;

  select run.source_content_sha256 into source_hash
  from public.veroxa_momo_content_ai_runs run
  where run.restaurant_id = p_restaurant_id
    and run.idempotency_hash = p_idempotency_hash
    and run.source_asset_id = p_source_asset_id
    and run.client_request_hash = p_client_request_hash;
  if not found then
    select intake.content_sha256 into source_hash
    from public.veroxa_media_assets asset
    join public.veroxa_momo_media_intake_verifications intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.content_sha256 = asset.content_sha256
    where asset.id = p_source_asset_id
      and asset.restaurant_id = p_restaurant_id;
  end if;

  if not coalesce(source_hash ~ '^[0-9a-f]{64}$', false) then
    raise exception using errcode = '40001',
      message = 'momo_content_ai_current_private_food_evidence_required';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    p_restaurant_id, source_hash
  );
  if veroxa_private.momo_source_media_discarded_v1(
    p_restaurant_id, source_hash
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  -- Source serialization dominates the rights row and the preserved v5
  -- delegate's run/budget locks. Reject known non-food and food-and-drink
  -- private assessments before any $6 reservation, run, ledger, or event.
  select rights.id into source_rights_id
  from public.veroxa_media_rights rights
  where rights.restaurant_id = p_restaurant_id
    and rights.asset_id = p_source_asset_id
  for share;
  if source_rights_id is null
     or not veroxa_private.media_has_current_real_owner_association_v1(
       p_restaurant_id,
       p_source_asset_id,
       source_rights_id,
       source_hash
     ) then
    raise exception using errcode = '40001',
      message = 'momo_content_ai_current_private_food_evidence_required';
  end if;

  return query
  select reserved.run_id,
    reserved.run_status,
    reserved.request_hash,
    reserved.source_storage_path,
    reserved.source_mime_type,
    reserved.source_file_size,
    reserved.source_content_sha256,
    reserved.source_width,
    reserved.source_height,
    reserved.target_platforms,
    reserved.truth_snapshot,
    reserved.truth_snapshot_sha256,
    reserved.reserved_microusd,
    reserved.provider_response_id,
    reserved.output_payload
  from public.veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1(
    p_restaurant_id,
    p_source_asset_id,
    p_idempotency_hash,
    p_client_request_hash,
    p_recovery_response_id
  ) reserved;
end;
$$;
revoke all on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) to authenticated;

alter function public.veroxa_record_momo_ready_disposition_v1(
  uuid, uuid, text, text, text, text, jsonb
) rename to veroxa_record_momo_ready_disposition_pre_source_lock_v1;
revoke all on function
  public.veroxa_record_momo_ready_disposition_pre_source_lock_v1(
    uuid, uuid, text, text, text, text, jsonb
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_record_momo_ready_disposition_v1(
  p_restaurant_id uuid,
  p_ready_package_id uuid,
  p_expected_output_sha256 text,
  p_expected_source_content_sha256 text,
  p_disposition text,
  p_note text,
  p_attestation jsonb
)
returns table (
  event_id uuid,
  ready_package_id uuid,
  disposition text,
  active_for_manual_use boolean,
  external_write_allowed boolean,
  recorded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  preliminary public.veroxa_momo_ready_packages_v2%rowtype;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_team_ready_disposition_required';
  end if;

  -- Public v1 remains the source-wide discard surface. Approval requires the
  -- v2 inspection snapshot and bridge evidence, so only the v2 adapter may
  -- invoke the preserved v1 event writer for approved_for_posting.
  if p_disposition is distinct from 'discarded' then
    raise exception using errcode = '42501',
      message = 'momo_ready_v2_approval_required';
  end if;

  select ready.* into preliminary
  from public.veroxa_momo_ready_packages_v2 ready
  where ready.id = p_ready_package_id
    and ready.restaurant_id = p_restaurant_id;

  if found
     and preliminary.source_content_sha256 ~ '^[0-9a-f]{64}$' then
    perform veroxa_private.lock_momo_source_media_v1(
      preliminary.restaurant_id,
      preliminary.source_content_sha256
    );
  end if;

  return query
  select recorded.event_id,
    recorded.ready_package_id,
    recorded.disposition,
    recorded.active_for_manual_use,
    recorded.external_write_allowed,
    recorded.recorded_at
  from public.veroxa_record_momo_ready_disposition_pre_source_lock_v1(
    p_restaurant_id,
    p_ready_package_id,
    p_expected_output_sha256,
    p_expected_source_content_sha256,
    p_disposition,
    p_note,
    p_attestation
  ) recorded;
end;
$$;
revoke all on function public.veroxa_record_momo_ready_disposition_v1(
  uuid, uuid, text, text, text, text, jsonb
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_record_momo_ready_disposition_v1(
  uuid, uuid, text, text, text, text, jsonb
) to authenticated;

-- -------------------------------------------------------------------------
-- Source-first v5 Ready materialization
-- -------------------------------------------------------------------------

alter function veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  rename to momo_materialize_veroxa_ready_v5_pre_source_lock_v2;
revoke all on function
  veroxa_private.momo_materialize_veroxa_ready_v5_pre_source_lock_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_materialize_veroxa_ready_v2(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_request_hash text;
  preliminary public.veroxa_momo_content_ai_runs%rowtype;
begin
  if veroxa_private.momo_jsonb_exact_keys_v2(
    p_payload, array['runId', 'requestHash']
  ) then
    v_run_id := (p_payload ->> 'runId')::uuid;
    v_request_hash := p_payload ->> 'requestHash';
    select run.* into preliminary
    from public.veroxa_momo_content_ai_runs run
    where run.id = v_run_id
      and run.request_hash = v_request_hash;
    if found then
      perform veroxa_private.lock_momo_source_media_v1(
        preliminary.restaurant_id,
        preliminary.source_content_sha256
      );
      if veroxa_private.momo_source_media_discarded_v1(
        preliminary.restaurant_id,
        preliminary.source_content_sha256
      ) then
        raise exception using errcode = '23514',
          message = 'source_media_discarded_terminal';
      end if;
      if not veroxa_private.momo_content_ai_current_evidence_v1(
        preliminary.id, preliminary.requested_by
      ) then
        raise exception using errcode = '23514',
          message = 'momo_ready_evidence_invalid_v2';
      end if;
    end if;
  end if;

  return veroxa_private.momo_materialize_veroxa_ready_v5_pre_source_lock_v2(
    p_payload
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = '22023',
      message = 'invalid_momo_ready_v2';
end;
$$;
revoke all on function
  veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- V5-aware upload pipeline with assessment-only intake sequencing
-- -------------------------------------------------------------------------

alter function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  rename to veroxa_momo_upload_pipeline_v5_pre_private_authority_v2;
revoke all on function
  public.veroxa_momo_upload_pipeline_v5_pre_private_authority_v2(
    text, jsonb
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_momo_upload_pipeline_v2(
  p_operation text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  canonical_asset_id uuid;
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_verification_id uuid;
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
begin
  if p_operation = 'record_intake_attempt' then
    return veroxa_private.momo_record_intake_attempt_v2(p_payload);

  elsif p_operation = 'advance_verified_asset' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
      'restaurantId', 'assetId', 'verificationId', 'actorId'
    ]) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_upload_pipeline_payload_v2';
    end if;

    v_restaurant_id := (p_payload ->> 'restaurantId')::uuid;
    v_asset_id := (p_payload ->> 'assetId')::uuid;
    v_verification_id := (p_payload ->> 'verificationId')::uuid;

    select candidate.* into intake
    from public.veroxa_private_media_assessment_intakes_v1 candidate
    where candidate.id = v_verification_id
      and candidate.restaurant_id = v_restaurant_id
      and candidate.asset_id = v_asset_id
      and candidate.status = 'verified';

    if intake.id is not null
       and veroxa_private.momo_source_media_discarded_v1(
         v_restaurant_id, intake.content_sha256
       ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;

    if intake.id is null
       or not intake.platform_ready
       or not exists (
         select 1
         from public.veroxa_private_media_assessment_asset_links_v1 link
         join public.veroxa_private_media_assessments_v1 assessment
           on assessment.id = link.assessment_id
          and assessment.restaurant_id = link.restaurant_id
          and assessment.status = 'completed'
         where link.restaurant_id = v_restaurant_id
           and link.asset_id = v_asset_id
           and link.intake_id = v_verification_id
           and link.source_content_sha256 = intake.content_sha256
           and assessment.source_content_sha256 = intake.content_sha256
       )
       or not exists (
         select 1
         from public.veroxa_media_rights rights
         where rights.restaurant_id = v_restaurant_id
           and rights.asset_id = v_asset_id
           and veroxa_private.media_has_current_real_owner_association_v1(
             v_restaurant_id,
             v_asset_id,
             rights.id,
             intake.content_sha256
           )
       ) then
      return pg_catalog.jsonb_build_object(
        'verificationId', v_verification_id,
        'status', 'verified',
        'canonicalAssetId', v_asset_id,
        'duplicateAssetId', null::uuid
      );
    end if;

    return veroxa_private.momo_advance_verified_asset_v2(p_payload);

  elsif p_operation = 'record_exception' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
      'runId','requestHash','stage','policyVersion','blockers','warnings',
      'evidenceSnapshot','evidenceCanonical','evidenceSha256'
    ]) or p_payload ->> 'stage' <> 'content_validation'
      or p_payload ->> 'policyVersion' not in (
        'momo-content-validator-2026-08-01-v4',
        'momo-content-validator-2026-08-08-v5'
      ) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_exception_operation_v2';
    end if;

    select target.* into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid
    for update;
    if run.id is null
      or run.request_hash is distinct from p_payload ->> 'requestHash'
      or run.decision_mode <> 'automation_policy_v2'
      or run.automation_policy_version <>
        'momo-upload-veroxa-ready-2026-08-02-v2'
      or not veroxa_private.momo_content_contract_version_pair_valid_v2(
        run.prompt_version, run.validator_version
      )
      or p_payload ->> 'policyVersion' is distinct from
        run.validator_version then
      raise exception using errcode = '23514',
        message = 'momo_exception_run_mismatch_v2';
    end if;

    select identity.canonical_asset_id into canonical_asset_id
    from public.veroxa_momo_media_canonical_identities_v2 identity
    where identity.id = run.automation_identity_id
      and identity.restaurant_id = run.restaurant_id;
    if canonical_asset_id is null then
      raise exception using errcode = '23514',
        message = 'momo_exception_identity_mismatch_v2';
    end if;

    return veroxa_private.momo_upsert_exception_v2(
      run.restaurant_id,
      canonical_asset_id,
      run.source_asset_id,
      run.id,
      p_payload ->> 'stage',
      p_payload ->> 'policyVersion',
      p_payload -> 'blockers',
      p_payload -> 'warnings',
      p_payload -> 'evidenceSnapshot',
      p_payload ->> 'evidenceCanonical',
      p_payload ->> 'evidenceSha256'
    );

  elsif p_operation = 'materialize_veroxa_ready' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(
      p_payload, array['runId','requestHash']
    ) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_ready_operation_v2';
    end if;

    -- This is intentionally nonlocking. The private materializer establishes
    -- source -> run ordering and then performs the authoritative locked read.
    select target.* into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid;
    if run.id is null
      or run.request_hash is distinct from p_payload ->> 'requestHash' then
      raise exception using errcode = '23514',
        message = 'momo_ready_run_mismatch_v2';
    end if;
    if run.decision_mode <> 'automation_policy_v2' then
      return pg_catalog.jsonb_build_object(
        'runId', run.id,
        'status', 'not_applicable',
        'externalWriteAllowed', false
      );
    end if;
    return veroxa_private.momo_materialize_veroxa_ready_v2(p_payload);
  end if;

  raise exception using errcode = '22023',
    message = 'invalid_momo_upload_pipeline_operation_v2';
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = '22023',
      message = 'invalid_momo_upload_pipeline_payload_v2';
end;
$$;
revoke all on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  to service_role;

revoke all on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) to authenticated;

revoke all on function
  public.veroxa_record_media_restaurant_association_v1(
    uuid, uuid, uuid, text, text, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_record_media_restaurant_association_v1(
    uuid, uuid, uuid, text, text, text
  ) to authenticated;

-- Preserve the established Team-only human reservation boundary. Live46
-- exposed owner-only ACL drift on this single pre-existing RPC; no body or
-- provider authority changes here.
revoke all on function
  public.veroxa_reserve_momo_media_ai_candidate_v1(
    uuid, uuid, text, text, text, text, text, text, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_reserve_momo_media_ai_candidate_v1(
    uuid, uuid, text, text, text, text, text, text, text
  ) to authenticated;

revoke all on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ),
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  ),
  public.veroxa_start_private_media_assessment_provider_v1(
    uuid, text, uuid
  ),
  public.veroxa_complete_private_media_assessment_v1(
    uuid, text, text, jsonb, text, text, bigint, text, jsonb, uuid
  ),
  public.veroxa_fail_private_media_assessment_v1(
    uuid, text, text, text, boolean, bigint, jsonb, uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ),
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  ),
  public.veroxa_start_private_media_assessment_provider_v1(
    uuid, text, uuid
  ),
  public.veroxa_complete_private_media_assessment_v1(
    uuid, text, text, jsonb, text, text, bigint, text, jsonb, uuid
  ),
  public.veroxa_fail_private_media_assessment_v1(
    uuid, text, text, text, boolean, bigint, jsonb, uuid
  ) to service_role;

-- -------------------------------------------------------------------------
-- Rich v2 review snapshots are audit projections of v1 authority
-- -------------------------------------------------------------------------

alter function veroxa_private.momo_ready_review_snapshot_v2(uuid)
  rename to momo_ready_review_snapshot_pre_private_authority_v2;
revoke all on function
  veroxa_private.momo_ready_review_snapshot_pre_private_authority_v2(uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.momo_ready_review_snapshot_v2(
    p_ready_package_id uuid
  )
returns table (
  review_snapshot jsonb,
  review_snapshot_canonical text,
  review_snapshot_sha256 text,
  checks_current boolean,
  blocker_codes jsonb
)
language plpgsql
stable
security definer
set search_path = ''
set timezone = 'UTC'
as $$
declare
  base record;
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  run public.veroxa_momo_content_ai_runs%rowtype;
  source_discarded boolean := false;
  private_authority_current boolean := false;
  latest_ready_current boolean := false;
  blockers jsonb := '[]'::jsonb;
  checks jsonb := '{}'::jsonb;
  snapshot jsonb;
  canonical text;
begin
  select source.* into base
  from veroxa_private.momo_ready_review_snapshot_pre_private_authority_v2(
    p_ready_package_id
  ) source;
  if not found then
    return;
  end if;

  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = p_ready_package_id;
  select target.* into run
  from public.veroxa_momo_content_ai_runs target
  where target.id = ready.content_ai_run_id;

  source_discarded := coalesce(
    veroxa_private.momo_source_media_discarded_v1(
      ready.restaurant_id, ready.source_content_sha256
    ),
    false
  );
  private_authority_current := run.id is not null
    and veroxa_private.momo_content_ai_current_evidence_v1(
      run.id, run.requested_by
    );
  latest_ready_current := not exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 newer
    where newer.restaurant_id = ready.restaurant_id
      and newer.identity_id = ready.identity_id
      and (newer.ready_at, newer.id) > (ready.ready_at, ready.id)
  );

  blockers := coalesce(base.blocker_codes, '[]'::jsonb);
  if source_discarded then
    blockers := blockers - 'source_evidence_changed';
    if not (blockers ? 'source_media_discarded_terminal') then
      blockers := pg_catalog.jsonb_build_array(
        'source_media_discarded_terminal'
      ) || blockers;
    end if;
  elsif not private_authority_current
        and not (
          blockers ? 'private_assessment_or_association_changed'
        ) then
    blockers := pg_catalog.jsonb_build_array(
      'private_assessment_or_association_changed'
    ) || blockers;
  end if;

  if not latest_ready_current
     and not (blockers ? 'newer_ready_package_exists') then
    blockers := pg_catalog.jsonb_build_array(
      'newer_ready_package_exists'
    ) || blockers;
  end if;

  if pg_catalog.jsonb_array_length(blockers) > 12 then
    select coalesce(
      pg_catalog.jsonb_agg(entry.value order by entry.position),
      '[]'::jsonb
    ) into blockers
    from (
      select source.value, source.position
      from pg_catalog.jsonb_array_elements_text(blockers)
        with ordinality source(value, position)
      order by source.position
      limit 12
    ) entry;
  end if;

  checks := coalesce(base.review_snapshot -> 'checks', '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
      'latestReadyPackageCurrent', latest_ready_current,
      'privateAuthorityCurrent', private_authority_current,
      'sourceMediaNotDiscarded', not source_discarded
    );
  snapshot := pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      base.review_snapshot,
      '{checks}',
      checks
    ),
    '{blockerCodes}',
    blockers
  );
  canonical := veroxa_private.momo_canonical_json_v1(snapshot);

  return query select
    snapshot,
    canonical,
    pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(canonical, 'UTF8'),
        'sha256'
      ),
      'hex'
    ),
    base.checks_current
      and private_authority_current
      and latest_ready_current
      and not source_discarded,
    blockers;
end;
$$;
revoke all on function
  veroxa_private.momo_ready_review_snapshot_v2(uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.momo_ready_v2_inspection_attestation_text_v1()
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Team Faraz reviewed the exact rendered image, generic visual assessment and tags, owner-grounded public copy, alt text, calls to action, and the current evidence snapshot. This approval permits manual copy and download only; it does not schedule, post, connect a provider, or authorize any external write.'::text;
$$;
revoke all on function
  veroxa_private.momo_ready_v2_inspection_attestation_text_v1()
  from public, anon, authenticated, service_role;

create table veroxa_private.momo_ready_v2_authority_evidence_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null
    references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  disposition_event_id uuid not null
    references public.veroxa_momo_ready_disposition_events_v1(id)
      on delete restrict,
  requested_decision text not null check (
    requested_decision in ('approved_for_manual_export', 'discarded')
  ),
  decision_reason text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  review_snapshot jsonb not null,
  review_snapshot_canonical text not null,
  review_snapshot_sha256 text not null check (
    review_snapshot_sha256 ~ '^[0-9a-f]{64}$'
  ),
  decision_request_sha256 text not null unique check (
    decision_request_sha256 ~ '^[0-9a-f]{64}$'
  ),
  recorded_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  recorded_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false check (
    not external_write_allowed
  ),
  constraint momo_ready_v2_authority_evidence_shape_v1 check (
    (
      requested_decision = 'approved_for_manual_export'
      and decision_reason is null
      and inspection_attestation_version =
        'momo-ready-team-inspection-2026-08-08-v1'
      and inspection_attestation_text =
        veroxa_private.momo_ready_v2_inspection_attestation_text_v1()
      and inspection_attestation_sha256 = pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to(inspection_attestation_text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    ) or (
      requested_decision = 'discarded'
      and decision_reason is not null
      and decision_reason = pg_catalog.btrim(decision_reason)
      and pg_catalog.char_length(decision_reason) between 4 and 500
      and decision_reason !~ '[[:cntrl:]]'
      and inspection_attestation_version is null
      and inspection_attestation_text is null
      and inspection_attestation_sha256 is null
    )
  ),
  constraint momo_ready_v2_authority_snapshot_canonical_v1 check (
    review_snapshot_canonical =
      veroxa_private.momo_canonical_json_v1(review_snapshot)
  ),
  constraint momo_ready_v2_authority_snapshot_sha_v1 check (
    review_snapshot_sha256 = pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(review_snapshot_canonical, 'UTF8'),
        'sha256'
      ),
      'hex'
    )
  ),
  unique (disposition_event_id, ready_package_id),
  unique (ready_package_id)
);

create index momo_ready_v2_authority_evidence_restaurant_ready_v1
  on veroxa_private.momo_ready_v2_authority_evidence_v1 (
    restaurant_id, ready_package_id, recorded_at desc
  );

alter table veroxa_private.momo_ready_v2_authority_evidence_v1
  enable row level security;
alter table veroxa_private.momo_ready_v2_authority_evidence_v1
  force row level security;
revoke all on table veroxa_private.momo_ready_v2_authority_evidence_v1
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.protect_momo_ready_v2_authority_evidence_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_ready_v2_authority_evidence_is_immutable';
end;
$$;
revoke all on function
  veroxa_private.protect_momo_ready_v2_authority_evidence_v1()
  from public, anon, authenticated, service_role;

create trigger momo_ready_v2_authority_evidence_immutable_v1
before update or delete
on veroxa_private.momo_ready_v2_authority_evidence_v1
for each row execute function
  veroxa_private.protect_momo_ready_v2_authority_evidence_v1();

create or replace function
  veroxa_private.validate_momo_ready_v2_authority_evidence_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  authority public.veroxa_momo_ready_disposition_events_v1%rowtype;
  expected_request_sha text;
begin
  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = new.ready_package_id
  for key share;
  select target.* into authority
  from public.veroxa_momo_ready_disposition_events_v1 target
  where target.id = new.disposition_event_id;

  expected_request_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'schemaVersion',
              'momo-ready-team-decision-request-2026-08-08-v1',
            'readyPackageId', new.ready_package_id,
            'restaurantId', new.restaurant_id,
            'decision', new.requested_decision,
            'expectedReviewSnapshotSha256',
              new.review_snapshot_sha256,
            'reason', new.decision_reason,
            'inspectionAttestationVersion',
              new.inspection_attestation_version,
            'inspectionAttestationText',
              new.inspection_attestation_text,
            'inspectionAttestationSha256',
              new.inspection_attestation_sha256,
            'externalWriteAllowed', false
          )
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  if ready.id is null
     or authority.id is null
     or new.recorded_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_is_team_for_restaurant(
       new.restaurant_id
     )
     or new.restaurant_id is distinct from ready.restaurant_id
     or authority.restaurant_id is distinct from ready.restaurant_id
     or authority.source_content_sha256 is distinct from
       ready.source_content_sha256
     or authority.output_sha256 !~ '^[0-9a-f]{64}$'
     or authority.external_write_allowed
     or (
       new.requested_decision = 'approved_for_manual_export'
       and (
         authority.disposition <> 'approved_for_posting'
         or authority.ready_package_id <> ready.id
         or authority.output_sha256 <> ready.output_sha256
       )
     )
     or (
       new.requested_decision = 'discarded'
       and authority.disposition <> 'discarded'
     )
     or new.review_snapshot ->> 'schemaVersion' is distinct from
       'momo-ready-review-snapshot-2026-08-08-v1'
     or new.review_snapshot ->> 'restaurantId' is distinct from
       ready.restaurant_id::text
     or new.review_snapshot ->> 'readyPackageId' is distinct from
       ready.id::text
     or new.review_snapshot ->> 'contentAiRunId' is distinct from
       ready.content_ai_run_id::text
     or new.review_snapshot ->> 'identityId' is distinct from
       ready.identity_id::text
     or new.review_snapshot ->> 'canonicalAssetId' is distinct from
       ready.canonical_asset_id::text
     or new.review_snapshot ->> 'sourceAssetId' is distinct from
       ready.source_asset_id::text
     or new.review_snapshot ->> 'intakeVerificationId' is distinct from
       ready.intake_verification_id::text
     or new.review_snapshot ->> 'rightsId' is distinct from
       ready.rights_id::text
     or new.review_snapshot ->> 'rightsAttestationSha256'
       is distinct from ready.rights_attestation_sha256
     or new.review_snapshot ->> 'truthSnapshotSha256'
       is distinct from ready.truth_snapshot_sha256
     or new.review_snapshot ->> 'outputSha256'
       is distinct from ready.output_sha256
     or new.review_snapshot ->> 'validationSha256'
       is distinct from ready.validation_sha256
     or new.review_snapshot -> 'externalWriteAllowed'
       is distinct from 'false'::jsonb
     or new.decision_request_sha256 is distinct from expected_request_sha then
    raise exception using errcode = '23514',
      message = 'momo_ready_v2_authority_evidence_coherence_failed';
  end if;

  new.recorded_at := pg_catalog.clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.validate_momo_ready_v2_authority_evidence_v1()
  from public, anon, authenticated, service_role;

create trigger momo_ready_v2_authority_evidence_validate_v1
before insert
on veroxa_private.momo_ready_v2_authority_evidence_v1
for each row execute function
  veroxa_private.validate_momo_ready_v2_authority_evidence_v1();

create or replace function veroxa_private.momo_ready_v2_blockers_v1(
  p_base jsonb,
  p_priority_code text default null
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  candidate jsonb := case
    when pg_catalog.jsonb_typeof(p_base) = 'array' then p_base
    else '[]'::jsonb
  end;
  result jsonb;
begin
  if p_priority_code is not null
     and p_priority_code <> ''
     and not (candidate ? p_priority_code) then
    candidate := pg_catalog.jsonb_build_array(p_priority_code)
      || candidate;
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(unique_code.code order by unique_code.position),
    '[]'::jsonb
  ) into result
  from (
    select entry.code, min(entry.position) as position
    from pg_catalog.jsonb_array_elements_text(candidate)
      with ordinality entry(code, position)
    where entry.code <> ''
      and pg_catalog.char_length(entry.code) < 80
    group by entry.code
    order by min(entry.position)
    limit 12
  ) unique_code;
  return result;
end;
$$;
revoke all on function
  veroxa_private.momo_ready_v2_blockers_v1(jsonb, text)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_momo_ready_review_status_v2(
  p_restaurant_id uuid,
  p_ready_package_id uuid default null
)
returns table (
  ready_package_id uuid,
  review_state text,
  decision_id uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  terminal_decision text,
  decision_review_snapshot_sha256 text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  current_review_snapshot_sha256 text,
  snapshot_current boolean,
  can_manual_export boolean,
  external_write_allowed boolean,
  blocker_codes jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;

  return query
  with candidate_ready as materialized (
    select target.*
    from public.veroxa_momo_ready_packages_v2 target
    where target.restaurant_id = p_restaurant_id
      and (
        p_ready_package_id is null
        or target.id = p_ready_package_id
      )
    order by target.ready_at desc, target.id
    limit 50
  ), projected as (
    select ready.*,
      snapshot.review_snapshot_sha256 as live_snapshot_sha,
      snapshot.checks_current,
      snapshot.blocker_codes as live_blockers,
      coalesce(source_discard.id, package_approval.id) as authority_id,
      coalesce(
        source_discard.recorded_by,
        package_approval.recorded_by
      ) as authority_actor,
      coalesce(
        source_discard.recorded_at,
        package_approval.recorded_at
      ) as authority_time,
      source_discard.id is not null as is_discarded,
      case
        when source_discard.id is not null then
          case
            when pg_catalog.char_length(source_discard.note) >= 4
              then source_discard.note
            else 'Team discard: ' || source_discard.note
          end
        else null::text
      end as displayed_reason,
      bridge.review_snapshot_sha256 as authority_snapshot_sha,
      bridge.inspection_attestation_version
        as bridge_inspection_attestation_version,
      bridge.inspection_attestation_text
        as bridge_inspection_attestation_text,
      bridge.inspection_attestation_sha256
        as bridge_inspection_attestation_sha256
    from candidate_ready ready
    cross join lateral
      veroxa_private.momo_ready_review_snapshot_v2(ready.id) snapshot
    left join lateral (
      select event.*
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.restaurant_id = ready.restaurant_id
        and event.source_content_sha256 = ready.source_content_sha256
        and event.disposition = 'discarded'
        and not event.external_write_allowed
      order by event.recorded_at, event.id
      limit 1
    ) source_discard on true
    left join lateral (
      select event.*
      from public.veroxa_momo_ready_disposition_events_v1 event
      where source_discard.id is null
        and event.restaurant_id = ready.restaurant_id
        and event.ready_package_id = ready.id
        and event.output_sha256 = ready.output_sha256
        and event.source_content_sha256 = ready.source_content_sha256
        and event.disposition = 'approved_for_posting'
        and not event.external_write_allowed
      order by event.recorded_at, event.id
      limit 1
    ) package_approval on true
    left join lateral (
      select evidence.*
      from veroxa_private.momo_ready_v2_authority_evidence_v1 evidence
      where evidence.disposition_event_id =
          coalesce(source_discard.id, package_approval.id)
        and evidence.ready_package_id = ready.id
        and evidence.restaurant_id = ready.restaurant_id
        and not evidence.external_write_allowed
      limit 1
    ) bridge on true
  ), normalized as (
    select projected.*,
      case
        when projected.authority_id is null then null::text
        when projected.authority_snapshot_sha is not null
          then projected.authority_snapshot_sha
        else pg_catalog.encode(
          extensions.digest(
            pg_catalog.convert_to(
              'momo-ready-v1-authority-event:' ||
                projected.authority_id::text,
              'UTF8'
            ),
            'sha256'
          ),
          'hex'
        )
      end as decision_snapshot_sha,
      case
        when projected.authority_id is not null
             and projected.authority_snapshot_sha is null
          then 'authoritative_v1_snapshot_unavailable'
        when projected.authority_id is not null
             and projected.authority_snapshot_sha <>
               projected.live_snapshot_sha
          then 'review_snapshot_stale'
        else null::text
      end as priority_blocker
    from projected
  )
  select normalized.id,
    case
      when normalized.is_discarded then 'discarded'
      when normalized.authority_id is not null
       and normalized.authority_snapshot_sha is not null
       and normalized.authority_snapshot_sha = normalized.live_snapshot_sha
       and normalized.checks_current
        then 'approved_for_manual_export'
      when normalized.authority_id is not null then 'blocked'
      when normalized.checks_current then 'awaiting_team_review'
      else 'blocked'
    end,
    normalized.authority_id,
    normalized.authority_actor,
    normalized.authority_time,
    normalized.displayed_reason,
    case
      when normalized.is_discarded then 'discarded'
      when normalized.authority_id is not null
        then 'approved_for_manual_export'
      else null::text
    end,
    normalized.decision_snapshot_sha,
    normalized.bridge_inspection_attestation_version,
    normalized.bridge_inspection_attestation_text,
    normalized.bridge_inspection_attestation_sha256,
    case
      when normalized.is_discarded
       and normalized.authority_snapshot_sha is not null
        then normalized.authority_snapshot_sha
      else normalized.live_snapshot_sha
    end,
    case
      when normalized.authority_id is null then true
      when normalized.is_discarded
       and normalized.authority_snapshot_sha is not null then true
      else normalized.decision_snapshot_sha = normalized.live_snapshot_sha
    end,
    normalized.authority_id is not null
      and not normalized.is_discarded
      and normalized.authority_snapshot_sha is not null
      and normalized.authority_snapshot_sha = normalized.live_snapshot_sha
      and normalized.checks_current,
    false,
    veroxa_private.momo_ready_v2_blockers_v1(
      normalized.live_blockers,
      normalized.priority_blocker
    )
  from normalized
  order by normalized.ready_at desc, normalized.id;
end;
$$;
revoke all on function
  public.veroxa_momo_ready_review_status_v2(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_momo_ready_review_status_v2(uuid, uuid)
  to authenticated;

create or replace function public.veroxa_decide_momo_ready_package_v2(
  p_ready_package_id uuid,
  p_decision text,
  p_expected_review_snapshot_sha256 text,
  p_reason text default null,
  p_inspection_attestation text default null
)
returns table (
  decision_id uuid,
  ready_package_id uuid,
  review_state text,
  terminal_decision text,
  decision_review_snapshot_sha256 text,
  replayed boolean,
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  inspection_attestation_version text,
  inspection_attestation_text text,
  inspection_attestation_sha256 text,
  current_review_snapshot_sha256 text,
  snapshot_current boolean,
  can_manual_export boolean,
  external_write_allowed boolean,
  blocker_codes jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  preliminary public.veroxa_momo_ready_packages_v2%rowtype;
  ready public.veroxa_momo_ready_packages_v2%rowtype;
  authority public.veroxa_momo_ready_disposition_events_v1%rowtype;
  bridge veroxa_private.momo_ready_v2_authority_evidence_v1%rowtype;
  legacy_audit veroxa_private.momo_ready_decisions_v2%rowtype;
  snapshot record;
  receipt record;
  normalized_reason text;
  mapped_disposition text;
  authoritative_note text;
  authoritative_attestation jsonb;
  attestation_version text;
  attestation_text text;
  attestation_sha text;
  request_sha text;
  was_replayed boolean := false;
begin
  if p_ready_package_id is null
     or p_decision is null
     or p_decision not in (
       'approved_for_manual_export', 'discarded'
     )
     or p_expected_review_snapshot_sha256 is null
     or p_expected_review_snapshot_sha256 !~ '^[0-9a-f]{64}$'
     or actor_id is null then
    raise exception using errcode = '22023',
      message = 'invalid_momo_ready_decision_v2';
  end if;

  normalized_reason := case
    when p_decision = 'discarded' then pg_catalog.btrim(p_reason)
    else null
  end;
  if p_decision = 'approved_for_manual_export' then
    if p_reason is not null
       or p_inspection_attestation is distinct from
         veroxa_private.momo_ready_v2_inspection_attestation_text_v1() then
      raise exception using errcode = '22023',
        message = 'momo_ready_inspection_attestation_required_v2';
    end if;
    mapped_disposition := 'approved_for_posting';
    authoritative_note :=
      'Approved through Team Ready review v2 for manual copy and download only.';
    authoritative_attestation := '{
      "teamReviewed": true,
      "noExternalWriteAuthorized": true,
      "decisionIsFinalForThisOutput": true
    }'::jsonb;
    attestation_version :=
      'momo-ready-team-inspection-2026-08-08-v1';
    attestation_text := p_inspection_attestation;
    attestation_sha := pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(attestation_text, 'UTF8'),
        'sha256'
      ),
      'hex'
    );
  else
    if normalized_reason is null
       or pg_catalog.char_length(normalized_reason) not between 4 and 500
       or normalized_reason ~ '[[:cntrl:]]'
       or p_inspection_attestation is not null then
      raise exception using errcode = '22023',
        message = 'momo_ready_discard_reason_required_v2';
    end if;
    mapped_disposition := 'discarded';
    authoritative_note := normalized_reason;
    authoritative_attestation := '{
      "teamReviewed": true,
      "noExternalWriteAuthorized": true,
      "decisionIsFinalForThisMedia": true
    }'::jsonb;
    attestation_version := null;
    attestation_text := null;
    attestation_sha := null;
  end if;

  -- Resolve tenant and source without a row lock, then take the source lock
  -- before the Ready row. This is the same order used by disposition v1,
  -- advance, reservation, provider start, and materialization.
  select target.* into preliminary
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = p_ready_package_id;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(
       preliminary.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    preliminary.restaurant_id,
    preliminary.source_content_sha256
  );

  select target.* into ready
  from public.veroxa_momo_ready_packages_v2 target
  where target.id = p_ready_package_id
    and target.restaurant_id = preliminary.restaurant_id
    and target.source_content_sha256 =
      preliminary.source_content_sha256
  for update;
  if not found
     or ready.status <> 'veroxa_ready'
     or ready.external_write_allowed
     or not public.veroxa_current_user_is_team_for_restaurant(
       ready.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_ready_team_review_required_v2';
  end if;

  -- Source discard dominates every package and every API surface.
  select event.* into authority
  from public.veroxa_momo_ready_disposition_events_v1 event
  where event.restaurant_id = ready.restaurant_id
    and event.source_content_sha256 = ready.source_content_sha256
    and event.disposition = 'discarded';
  if found then
    if p_decision <> 'discarded' then
      if exists (
        select 1
        from veroxa_private.momo_ready_v2_authority_evidence_v1 evidence
        where evidence.ready_package_id = ready.id
          and evidence.disposition_event_id = authority.id
          and evidence.requested_decision = 'discarded'
      ) then
        raise exception using errcode = '23505',
          message = 'momo_ready_terminal_decision_conflict_v2';
      end if;
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    if exists (
      select 1
      from veroxa_private.momo_ready_v2_authority_evidence_v1 evidence
      where evidence.ready_package_id = ready.id
        and evidence.requested_decision <> 'discarded'
    ) then
      raise exception using errcode = '23505',
        message = 'momo_ready_terminal_decision_conflict_v2';
    end if;
    if authority.note is distinct from normalized_reason
       or authority.attestation is distinct from
         authoritative_attestation then
      raise exception using errcode = '23505',
        message = 'momo_ready_terminal_decision_conflict_v2';
    end if;
  else
    select evidence.* into bridge
    from veroxa_private.momo_ready_v2_authority_evidence_v1 evidence
    where evidence.ready_package_id = ready.id;
    if found then
      if bridge.requested_decision is distinct from p_decision then
        raise exception using errcode = '23505',
          message = 'momo_ready_terminal_decision_conflict_v2';
      end if;
      select event.* into authority
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.id = bridge.disposition_event_id;
    elsif p_decision = 'approved_for_manual_export' then
      select event.* into authority
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.restaurant_id = ready.restaurant_id
        and event.ready_package_id = ready.id
        and event.output_sha256 = ready.output_sha256
        and event.source_content_sha256 = ready.source_content_sha256
        and event.disposition = 'approved_for_posting';
    end if;
  end if;

  request_sha := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'schemaVersion',
              'momo-ready-team-decision-request-2026-08-08-v1',
            'readyPackageId', ready.id,
            'restaurantId', ready.restaurant_id,
            'decision', p_decision,
            'expectedReviewSnapshotSha256',
              p_expected_review_snapshot_sha256,
            'reason', normalized_reason,
            'inspectionAttestationVersion', attestation_version,
            'inspectionAttestationText', attestation_text,
            'inspectionAttestationSha256', attestation_sha,
            'externalWriteAllowed', false
          )
        ),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  -- The PR164 row remains an immutable, derived compatibility receipt only.
  -- It never supplies disposition authority or current eligibility, but an
  -- exact v2 replay must still match the originally persisted request bytes.
  select target.* into legacy_audit
  from veroxa_private.momo_ready_decisions_v2 target
  where target.ready_package_id = ready.id;
  if found and (
       legacy_audit.restaurant_id is distinct from ready.restaurant_id
       or legacy_audit.decision is distinct from p_decision
       or legacy_audit.decision_reason is distinct from normalized_reason
       or legacy_audit.inspection_attestation_version
            is distinct from attestation_version
       or legacy_audit.inspection_attestation_text
            is distinct from attestation_text
       or legacy_audit.inspection_attestation_sha256
            is distinct from attestation_sha
       or legacy_audit.review_snapshot_sha256 is distinct from
            p_expected_review_snapshot_sha256
       or legacy_audit.decision_request_sha256 is distinct from request_sha
     ) then
    raise exception using errcode = '23505',
      message = 'momo_ready_terminal_decision_conflict_v2';
  end if;

  -- Exact terminal replay is checked before current-snapshot freshness. The
  -- authoritative event remains immutable even if later evidence blocks use.
  if authority.id is not null then
    select evidence.* into bridge
    from veroxa_private.momo_ready_v2_authority_evidence_v1 evidence
    where evidence.disposition_event_id = authority.id
      and evidence.ready_package_id = ready.id;
    if found then
      if bridge.restaurant_id is distinct from ready.restaurant_id
         or bridge.requested_decision is distinct from p_decision
         or bridge.decision_reason is distinct from normalized_reason
         or bridge.inspection_attestation_version
              is distinct from attestation_version
         or bridge.inspection_attestation_text
              is distinct from attestation_text
         or bridge.inspection_attestation_sha256
              is distinct from attestation_sha
         or bridge.review_snapshot_sha256 is distinct from
              p_expected_review_snapshot_sha256
         or bridge.decision_request_sha256 is distinct from request_sha then
        raise exception using errcode = '23505',
          message = 'momo_ready_terminal_decision_conflict_v2';
      end if;
      if legacy_audit.id is null then
        raise exception using errcode = '23505',
          message = 'momo_ready_v2_audit_receipt_missing';
      end if;
      was_replayed := true;
      return query
      select status.decision_id,
        status.ready_package_id,
        status.review_state,
        status.terminal_decision,
        status.decision_review_snapshot_sha256,
        was_replayed,
        status.decided_by,
        status.decided_at,
        status.decision_reason,
        status.inspection_attestation_version,
        status.inspection_attestation_text,
        status.inspection_attestation_sha256,
        status.current_review_snapshot_sha256,
        status.snapshot_current,
        status.can_manual_export,
        status.external_write_allowed,
        status.blocker_codes
      from public.veroxa_momo_ready_review_status_v2(
        ready.restaurant_id, ready.id
      ) status
      where status.ready_package_id = ready.id;
      return;
    end if;
  end if;

  select target.* into snapshot
  from veroxa_private.momo_ready_review_snapshot_v2(ready.id) target;
  if snapshot.review_snapshot_sha256 is null
     or snapshot.review_snapshot_sha256 is distinct from
       p_expected_review_snapshot_sha256 then
    raise exception using errcode = '23514',
      message = 'momo_ready_review_snapshot_stale_v2';
  end if;
  if p_decision = 'approved_for_manual_export'
     and not snapshot.checks_current then
    raise exception using errcode = '23514',
      message = 'momo_ready_approval_blocked_v2';
  end if;

  if authority.id is null
     and mapped_disposition = 'approved_for_posting' then
    insert into veroxa_private.momo_ready_v2_approval_intents_v1 (
      restaurant_id,
      ready_package_id,
      output_sha256,
      source_content_sha256,
      review_snapshot_sha256,
      decision_request_sha256,
      recorded_by,
      transaction_id,
      backend_pid
    ) values (
      ready.restaurant_id,
      ready.id,
      ready.output_sha256,
      ready.source_content_sha256,
      snapshot.review_snapshot_sha256,
      request_sha,
      actor_id,
      pg_catalog.txid_current(),
      pg_catalog.pg_backend_pid()
    );
  end if;

  if authority.id is null then
    select recorded.* into receipt
    from public.veroxa_record_momo_ready_disposition_pre_source_lock_v1(
      ready.restaurant_id,
      ready.id,
      ready.output_sha256,
      ready.source_content_sha256,
      mapped_disposition,
      authoritative_note,
      authoritative_attestation
    ) recorded;
    select event.* into authority
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.id = receipt.event_id;
  end if;

  if authority.id is null
     or authority.restaurant_id is distinct from ready.restaurant_id
     or authority.source_content_sha256 is distinct from
       ready.source_content_sha256
     or authority.disposition is distinct from mapped_disposition then
    raise exception using errcode = '23514',
      message = 'momo_ready_v1_authority_record_failed';
  end if;

  if legacy_audit.id is null then
    insert into veroxa_private.momo_ready_decisions_v2 (
      restaurant_id,
      ready_package_id,
      decision,
      decision_reason,
      inspection_attestation_version,
      inspection_attestation_text,
      inspection_attestation_sha256,
      review_snapshot,
      review_snapshot_canonical,
      review_snapshot_sha256,
      decision_request_sha256,
      decided_by
    ) values (
      ready.restaurant_id,
      ready.id,
      p_decision,
      normalized_reason,
      attestation_version,
      attestation_text,
      attestation_sha,
      snapshot.review_snapshot,
      snapshot.review_snapshot_canonical,
      snapshot.review_snapshot_sha256,
      request_sha,
      actor_id
    ) returning * into legacy_audit;
  end if;

  insert into veroxa_private.momo_ready_v2_authority_evidence_v1 (
    restaurant_id,
    ready_package_id,
    disposition_event_id,
    requested_decision,
    decision_reason,
    inspection_attestation_version,
    inspection_attestation_text,
    inspection_attestation_sha256,
    review_snapshot,
    review_snapshot_canonical,
    review_snapshot_sha256,
    decision_request_sha256,
    recorded_by
  ) values (
    ready.restaurant_id,
    ready.id,
    authority.id,
    p_decision,
    normalized_reason,
    attestation_version,
    attestation_text,
    attestation_sha,
    snapshot.review_snapshot,
    snapshot.review_snapshot_canonical,
    snapshot.review_snapshot_sha256,
    request_sha,
    actor_id
  ) returning * into bridge;

  perform pg_catalog.set_config(
    'veroxa.trusted_activity_write', 'on', true
  );
  insert into public.veroxa_activity_events (
    restaurant_id,
    event_type,
    subject_type,
    subject_id,
    actor_id,
    visibility,
    report_eligible,
    payload
  ) values (
    ready.restaurant_id,
    'momo_ready_team_decided_v2',
    'momo_ready_package_v2',
    ready.id,
    actor_id,
    'team',
    false,
    pg_catalog.jsonb_build_object(
      'authorityEvidenceId', bridge.id,
      'authoritativeDispositionEventId', authority.id,
      'derivedLegacyDecisionAuditId', legacy_audit.id,
      'decision', p_decision,
      'decisionReason', normalized_reason,
      'reviewSnapshotSha256', bridge.review_snapshot_sha256,
      'inspectionAttestationVersion', attestation_version,
      'inspectionAttestationSha256', attestation_sha,
      'externalWriteAllowed', false
    )
  );

  return query
  select status.decision_id,
    status.ready_package_id,
    status.review_state,
    status.terminal_decision,
    status.decision_review_snapshot_sha256,
    was_replayed,
    status.decided_by,
    status.decided_at,
    status.decision_reason,
    status.inspection_attestation_version,
    status.inspection_attestation_text,
    status.inspection_attestation_sha256,
    status.current_review_snapshot_sha256,
    status.snapshot_current,
    status.can_manual_export,
    status.external_write_allowed,
    status.blocker_codes
  from public.veroxa_momo_ready_review_status_v2(
    ready.restaurant_id, ready.id
  ) status
  where status.ready_package_id = ready.id;
end;
$$;

revoke all on function
  public.veroxa_decide_momo_ready_package_v2(
    uuid, text, text, text, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_decide_momo_ready_package_v2(
    uuid, text, text, text, text
  ) to authenticated;

-- Reassert every externally callable boundary. Internal preserved bodies and
-- bridge helpers remain unreachable directly, including to service_role.
revoke all on function
  veroxa_private.momo_advance_verified_asset_v2(jsonb),
  veroxa_private.momo_materialize_veroxa_ready_v2(jsonb),
  veroxa_private.momo_ready_review_snapshot_v2(uuid),
  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)
  from public, anon, authenticated, service_role;

revoke all on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  to service_role;
