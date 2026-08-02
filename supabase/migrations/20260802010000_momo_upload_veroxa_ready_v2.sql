-- Momo upload -> Veroxa Ready v2
--
-- Forward-only release boundary:
--   * every registered upload keeps its own asset, rights record, and intake event;
--   * exact SHA-256 equality selects one canonical processing identity;
--   * near-duplicate inference is intentionally not an automatic merge;
--   * validated content becomes unscheduled `veroxa_ready`, never scheduled or published;
--   * Team Faraz sees one consolidated exception per canonical blocker set;
--   * legacy scheduled Ready v1 tables remain unchanged as historical evidence.

-- The legacy uniqueness rule discarded the second exact-byte asset while the
-- storage object and rights assertion already existed. v2 preserves that asset
-- and records canonical identity separately.
drop index if exists public.veroxa_media_assets_hash_unique;
create index if not exists veroxa_media_assets_hash_lookup_v2
  on public.veroxa_media_assets (restaurant_id, content_sha256)
  where content_sha256 is not null;

alter table public.veroxa_momo_content_ai_runs
  alter column review_id drop not null,
  add column if not exists decision_mode text not null default 'team_review_v1',
  add column if not exists automation_policy_version text,
  add column if not exists automation_identity_id uuid,
  add column if not exists automation_initiated_by uuid
    references public.veroxa_user_profiles(user_id) on delete restrict,
  add column if not exists automation_retry_of_run_id uuid,
  add column if not exists automation_retry_generation smallint not null
    default 0;

alter table public.veroxa_momo_content_ai_runs
  drop constraint if exists veroxa_momo_content_ai_decision_mode_v2,
  add constraint veroxa_momo_content_ai_decision_mode_v2 check (
    (decision_mode = 'team_review_v1' and review_id is not null
      and automation_policy_version is null
      and automation_identity_id is null
      and automation_initiated_by is null
      and automation_retry_of_run_id is null
      and automation_retry_generation = 0)
    or (decision_mode = 'automation_policy_v2' and review_id is null
      and automation_policy_version = 'momo-upload-veroxa-ready-2026-08-02-v2'
      and automation_identity_id is not null
      and automation_initiated_by is not null
      and (
        (automation_retry_generation = 0
          and automation_retry_of_run_id is null)
        or (automation_retry_generation = 1
          and automation_retry_of_run_id is not null)
      ))
  );

-- A completed automation run stays in the legacy transport state
-- `pending_review` because the v1 row contract reserves `materialized` for a
-- human decision. It must not block a fresh reservation after truth or rights
-- drift, while legacy Team-review runs keep their original one-pending limit.
drop index if exists public.veroxa_momo_content_ai_one_active_asset;
create unique index veroxa_momo_content_ai_one_active_asset
  on public.veroxa_momo_content_ai_runs (restaurant_id, source_asset_id)
  where status in ('reserved','provider_running','result_staged');
create unique index veroxa_momo_content_ai_one_pending_team_asset_v2
  on public.veroxa_momo_content_ai_runs (restaurant_id, source_asset_id)
  where status = 'pending_review' and decision_mode = 'team_review_v1';

create table public.veroxa_momo_media_intake_attempts_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  source_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  verification_id uuid references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  canonical_asset_id uuid references public.veroxa_media_assets(id) on delete restrict,
  actor_id uuid not null references public.veroxa_user_profiles(user_id) on delete restrict,
  outcome text not null check (outcome in ('verified','duplicate','rejected','unavailable')),
  reason_codes jsonb not null check (
    jsonb_typeof(reason_codes) = 'array'
    and jsonb_array_length(reason_codes) between 0 and 16
  ),
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'object'),
  evidence_canonical text not null check (char_length(evidence_canonical) between 2 and 32768),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  idempotency_sha256 text not null check (idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  attempted_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, idempotency_sha256),
  check ((outcome in ('verified','duplicate')) = (verification_id is not null)),
  check ((outcome in ('verified','duplicate')) = (canonical_asset_id is not null)),
  check ((outcome in ('verified','duplicate') and reason_codes = '[]'::jsonb)
    or (outcome in ('rejected','unavailable') and jsonb_array_length(reason_codes) >= 1))
);

create table public.veroxa_momo_media_canonical_identities_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  canonical_asset_id uuid not null unique references public.veroxa_media_assets(id) on delete restrict,
  canonical_verification_id uuid not null unique references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  identity_method text not null default 'sha256_exact_bytes' check (identity_method = 'sha256_exact_bytes'),
  policy_version text not null default 'momo-exact-byte-identity-2026-08-02-v2'
    check (policy_version = 'momo-exact-byte-identity-2026-08-02-v2'),
  created_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, content_sha256)
);

alter table public.veroxa_momo_content_ai_runs
  add constraint veroxa_momo_content_ai_automation_identity_fkey_v2
  foreign key (automation_identity_id)
  references public.veroxa_momo_media_canonical_identities_v2(id)
  on delete restrict;

alter table public.veroxa_momo_content_ai_runs
  add constraint veroxa_momo_content_ai_automation_retry_of_fkey_v2
  foreign key (automation_retry_of_run_id)
  references public.veroxa_momo_content_ai_runs(id)
  on delete restrict;

create unique index veroxa_momo_content_ai_one_retry_child_v2
  on public.veroxa_momo_content_ai_runs (automation_retry_of_run_id)
  where automation_retry_of_run_id is not null;

create unique index veroxa_momo_content_ai_one_active_identity_v2
  on public.veroxa_momo_content_ai_runs
    (restaurant_id, automation_identity_id)
  where decision_mode = 'automation_policy_v2'
    and automation_identity_id is not null
    and status in ('reserved','provider_running','result_staged');

create table public.veroxa_momo_media_asset_identity_links_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  identity_id uuid not null references public.veroxa_momo_media_canonical_identities_v2(id) on delete restrict,
  asset_id uuid not null unique references public.veroxa_media_assets(id) on delete restrict,
  verification_id uuid not null unique references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  canonical_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  link_kind text not null check (link_kind in ('canonical','exact_duplicate')),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  rights_id uuid not null references public.veroxa_media_rights(id) on delete restrict,
  rights_attestation_sha256 text not null check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  unique (identity_id, asset_id),
  check ((link_kind = 'canonical') = (asset_id = canonical_asset_id))
);

create table public.veroxa_momo_automation_advances_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  identity_id uuid not null references public.veroxa_momo_media_canonical_identities_v2(id) on delete restrict,
  source_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  actor_id uuid not null references public.veroxa_user_profiles(user_id) on delete restrict,
  processing_asset_id uuid references public.veroxa_media_assets(id) on delete restrict,
  canonical_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  intake_verification_id uuid not null references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  content_ai_run_id uuid references public.veroxa_momo_content_ai_runs(id) on delete restrict,
  outcome text not null check (outcome in ('queued','replayed','duplicate_reused','exception','already_ready')),
  reason_codes jsonb not null check (
    jsonb_typeof(reason_codes) = 'array' and jsonb_array_length(reason_codes) between 0 and 16
  ),
  policy_version text not null check (policy_version = 'momo-upload-veroxa-ready-2026-08-02-v2'),
  idempotency_sha256 text not null check (idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  advanced_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, idempotency_sha256),
  check (outcome = 'exception' or processing_asset_id is not null)
);

create table public.veroxa_momo_exception_incidents_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  canonical_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  stage text not null check (stage in ('media_intake','rights_reconciliation','automation_reservation','content_processing','content_validation')),
  policy_version text not null check (char_length(policy_version) between 8 and 160),
  blocker_set_sha256 text not null check (blocker_set_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open','resolved')),
  blockers jsonb not null check (jsonb_typeof(blockers) = 'array' and jsonb_array_length(blockers) between 1 and 64),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array' and jsonb_array_length(warnings) <= 32),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  first_seen_at timestamptz not null default clock_timestamp(),
  last_seen_at timestamptz not null default clock_timestamp(),
  resolved_at timestamptz,
  external_write_allowed boolean not null default false check (not external_write_allowed),
  check ((status = 'open' and resolved_at is null) or (status = 'resolved' and resolved_at is not null))
);
create unique index veroxa_momo_one_open_exception_v2
  on public.veroxa_momo_exception_incidents_v2
    (restaurant_id, canonical_asset_id, stage, policy_version)
  where status = 'open';
create index veroxa_momo_exception_attention_v2
  on public.veroxa_momo_exception_incidents_v2 (restaurant_id, last_seen_at desc)
  where status = 'open';

create table public.veroxa_momo_exception_events_v2 (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.veroxa_momo_exception_incidents_v2(id) on delete restrict,
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  canonical_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  source_asset_id uuid references public.veroxa_media_assets(id) on delete restrict,
  content_ai_run_id uuid references public.veroxa_momo_content_ai_runs(id) on delete restrict,
  stage text not null,
  event_kind text not null check (event_kind in ('opened','repeated','resolved')),
  policy_version text not null,
  blockers jsonb not null check (jsonb_typeof(blockers) = 'array'),
  warnings jsonb not null check (jsonb_typeof(warnings) = 'array'),
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'object'),
  evidence_canonical text not null check (char_length(evidence_canonical) between 2 and 32768),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  event_idempotency_sha256 text not null check (event_idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, event_idempotency_sha256)
);

create table public.veroxa_momo_ready_packages_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  content_ai_run_id uuid not null unique references public.veroxa_momo_content_ai_runs(id) on delete restrict,
  identity_id uuid not null references public.veroxa_momo_media_canonical_identities_v2(id) on delete restrict,
  canonical_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  source_asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  intake_verification_id uuid not null references public.veroxa_momo_media_intake_verifications(id) on delete restrict,
  rights_id uuid not null references public.veroxa_media_rights(id) on delete restrict,
  rights_attestation_sha256 text not null check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  truth_snapshot_sha256 text not null check (truth_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  source_storage_path text not null,
  source_storage_object_id uuid not null,
  source_storage_object_version text not null,
  source_mime_type text not null check (source_mime_type = 'image/jpeg'),
  source_file_size bigint not null check (source_file_size between 10240 and 5242880),
  source_width integer not null check (source_width between 320 and 12000),
  source_height integer not null check (source_height between 250 and 12000),
  source_content_sha256 text not null check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  output_payload jsonb not null check (jsonb_typeof(output_payload) = 'object'),
  output_canonical text not null,
  output_sha256 text not null check (output_sha256 ~ '^[0-9a-f]{64}$'),
  validation_report jsonb not null check (jsonb_typeof(validation_report) = 'object'),
  validation_canonical text not null,
  validation_sha256 text not null check (validation_sha256 ~ '^[0-9a-f]{64}$'),
  decision_mode text not null check (decision_mode = 'automation_policy_v2'),
  policy_version text not null check (policy_version = 'momo-upload-veroxa-ready-2026-08-02-v2'),
  status text not null check (status = 'veroxa_ready'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  ready_at timestamptz not null default clock_timestamp(),
  check (source_width::numeric / source_height::numeric between 0.8 and 1.91)
);

create table public.veroxa_momo_ready_variants_v2 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  ready_package_id uuid not null references public.veroxa_momo_ready_packages_v2(id) on delete restrict,
  platform text not null check (platform in ('facebook','instagram','google_business')),
  caption text not null check (char_length(caption) between 1 and 2000),
  hashtags jsonb not null check (jsonb_typeof(hashtags) = 'array'),
  seo_phrases jsonb not null check (jsonb_typeof(seo_phrases) = 'array'),
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  call_to_action jsonb not null check (jsonb_typeof(call_to_action) = 'object'),
  claim_ids jsonb not null check (jsonb_typeof(claim_ids) = 'array'),
  status text not null check (status = 'veroxa_ready'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_at timestamptz not null default clock_timestamp(),
  unique (ready_package_id, platform)
);

create index veroxa_momo_ready_packages_v2_latest
  on public.veroxa_momo_ready_packages_v2 (restaurant_id, ready_at desc);
create index veroxa_momo_ready_variants_v2_package
  on public.veroxa_momo_ready_variants_v2 (ready_package_id, platform);

-- Preserve the six observed legacy blocked jobs while making their canonical
-- representative explicit. Routine UI queries can exclude superseded rows.
alter table public.veroxa_ai_jobs
  add column if not exists superseded_by_job_id uuid references public.veroxa_ai_jobs(id) on delete restrict,
  add column if not exists superseded_at timestamptz,
  add column if not exists supersession_reason text;

with ranked as (
  select job.id,
    first_value(job.id) over (
      partition by job.restaurant_id, job.job_kind, job.subject_type, job.subject_id
      order by job.created_at, job.id
    ) as canonical_id,
    row_number() over (
      partition by job.restaurant_id, job.job_kind, job.subject_type, job.subject_id
      order by job.created_at, job.id
    ) as position
  from public.veroxa_ai_jobs job
  where job.status = 'blocked'
    and job.provider_key is null
    and job.last_error = 'Provider connection not authorized'
    and job.job_kind in ('media_classification','media_quality','duplicate_detection')
)
update public.veroxa_ai_jobs job
set superseded_by_job_id = ranked.canonical_id,
    superseded_at = clock_timestamp(),
    supersession_reason = 'consolidated_by_momo_upload_veroxa_ready_v2'
from ranked
where job.id = ranked.id and ranked.position > 1
  and job.superseded_by_job_id is null;

create or replace function veroxa_private.momo_jsonb_exact_keys_v2(
  p_value jsonb,
  p_keys text[]
)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_typeof(p_value) = 'object'
    and coalesce((
      select pg_catalog.array_agg(key order by key)
      from pg_catalog.jsonb_object_keys(p_value) key
    ), '{}'::text[]) = (
      select pg_catalog.array_agg(key order by key)
      from pg_catalog.unnest(p_keys) key
    );
$$;
revoke all on function veroxa_private.momo_jsonb_exact_keys_v2(jsonb,text[])
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_v2_append_only_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'momo_v2_evidence_is_append_only';
end;
$$;
revoke all on function veroxa_private.momo_v2_append_only_guard()
  from public, anon, authenticated, service_role;

create trigger veroxa_momo_intake_attempts_v2_append_only
before update or delete on public.veroxa_momo_media_intake_attempts_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_identities_v2_append_only
before update or delete on public.veroxa_momo_media_canonical_identities_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_identity_links_v2_append_only
before update or delete on public.veroxa_momo_media_asset_identity_links_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_advances_v2_append_only
before update or delete on public.veroxa_momo_automation_advances_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_exception_events_v2_append_only
before update or delete on public.veroxa_momo_exception_events_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_ready_packages_v2_append_only
before update or delete on public.veroxa_momo_ready_packages_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();
create trigger veroxa_momo_ready_variants_v2_append_only
before update or delete on public.veroxa_momo_ready_variants_v2
for each row execute function veroxa_private.momo_v2_append_only_guard();

-- Dispatch, webhook recovery, and replay all call this evidence predicate.
-- Automated runs use verified bytes + current real-owner rights + current truth;
-- legacy runs keep their exact inspected Team review requirement.
create or replace function veroxa_private.momo_content_ai_current_evidence_v1(
  p_run_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    join public.veroxa_media_assets asset
      on asset.id = run.source_asset_id and asset.restaurant_id = run.restaurant_id
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = run.intake_verification_id and intake.asset_id = asset.id
    join public.veroxa_media_rights rights
      on rights.id = run.rights_id and rights.asset_id = asset.id
    left join public.veroxa_media_reviews review
      on review.id = run.review_id and review.asset_id = asset.id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = run.source_storage_path
     and object.id = run.source_storage_object_id
    where run.id = p_run_id
      and (
        (run.decision_mode = 'team_review_v1'
          and veroxa_private.momo_media_ai_actor_has_operational_team_v1(
            run.restaurant_id, p_actor_id
          )
          and asset.status = 'ready_to_use'
          and review.is_current and review.status = 'approved'
          and review.public_use_approved
          and review.quality_score between 80 and 100
          and review.reviewed_by is not null and review.reviewed_at is not null
          and pg_catalog.char_length(pg_catalog.btrim(
            coalesce(review.quality_notes, '')
          )) >= 10)
        or
        (run.decision_mode = 'automation_policy_v2'
          and run.automation_policy_version =
            'momo-upload-veroxa-ready-2026-08-02-v2'
          and run.review_id is null
          and run.automation_identity_id is not null
          and run.automation_initiated_by is not null
          and asset.status in ('uploaded','ready_to_use')
          and p_actor_id = run.requested_by
          and veroxa_private.momo_media_ai_actor_has_operational_team_v1(
            run.restaurant_id, p_actor_id
          )
          and exists (
            select 1
            from veroxa_private.momo_ai_budget_controls budget
            where budget.restaurant_id = run.restaurant_id
              and budget.enabled
              and not budget.external_publishing_authorized
              and budget.authorized_by = run.requested_by
          )
          and exists (
            select 1
            from public.veroxa_momo_media_canonical_identities_v2 identity
            join public.veroxa_momo_media_asset_identity_links_v2 link
              on link.identity_id = identity.id
             and link.asset_id = run.source_asset_id
             and link.verification_id = run.intake_verification_id
             and link.rights_id = run.rights_id
             and link.rights_attestation_sha256 =
               run.rights_attestation_sha256
            where identity.id = run.automation_identity_id
              and identity.restaurant_id = run.restaurant_id
              and identity.content_sha256 = run.source_content_sha256
          ))
      )
      and asset.content_sha256 = run.source_content_sha256
      and asset.storage_path = run.source_storage_path
      and asset.mime_type = run.source_mime_type
      and asset.file_size = run.source_file_size
      and asset.width = run.source_width
      and asset.height = run.source_height
      and run.source_mime_type = 'image/jpeg'
      and run.source_file_size between 10240 and 5242880
      and run.source_width between 320 and 12000
      and run.source_height between 250 and 12000
      and run.source_width::numeric / run.source_height::numeric between 0.8 and 1.91
      and intake.status = 'verified'
      and intake.storage_path = run.source_storage_path
      and intake.storage_object_id = run.source_storage_object_id
      and intake.storage_object_version = run.source_storage_object_version
      and intake.detected_mime_type = run.source_mime_type
      and intake.file_size = run.source_file_size
      and intake.width = run.source_width
      and intake.height = run.source_height
      and intake.content_sha256 = run.source_content_sha256
      and object.version = run.source_storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') = run.source_mime_type
      and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
        then (object.metadata ->> 'size')::numeric = run.source_file_size::numeric
        else false end
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and rights.attestation_sha256 = run.rights_attestation_sha256
      and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
      and run.target_platforms <@ rights.usage_scope
      and run.truth_snapshot_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(
          veroxa_private.current_momo_truth_snapshot_v1(run.restaurant_id)::text,
          'UTF8'
        ), 'sha256'
      ), 'hex')
  );
$$;
revoke all on function veroxa_private.momo_content_ai_current_evidence_v1(uuid,uuid)
  from public, anon, authenticated, service_role;

-- A terminal dispatch may be regenerated once only when every durable boundary
-- proves OpenAI was never reachable. The terminal outbox must contain no send
-- intent or response identity, all provider/result ledgers must be empty, and
-- the cost reservation must already be released at zero. This predicate is
-- shared by the reservation function and the insert guard so service-role code
-- cannot create an unproven retry lineage directly.
create or replace function
  veroxa_private.momo_content_ai_safe_retry_parent_v2(
    p_parent_run_id uuid,
    p_restaurant_id uuid,
    p_identity_id uuid,
    p_request_hash text,
    p_requested_by uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    join veroxa_private.momo_content_ai_dispatch_outbox dispatch
      on dispatch.run_id = run.id
     and dispatch.restaurant_id = run.restaurant_id
     and dispatch.request_hash = run.request_hash
     and dispatch.requested_by = run.requested_by
    join veroxa_private.momo_ai_cost_ledger ledger
      on ledger.operation_kind = 'content_package'
     and ledger.source_id = run.id
     and ledger.restaurant_id = run.restaurant_id
     and ledger.idempotency_hash = run.idempotency_hash
    where run.id = p_parent_run_id
      and run.restaurant_id = p_restaurant_id
      and run.automation_identity_id = p_identity_id
      and run.request_hash = p_request_hash
      and run.requested_by = p_requested_by
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.automation_retry_generation = 0
      and run.automation_retry_of_run_id is null
      and run.status = 'failed'
      and not run.provider_called
      and run.provider_started_at is null
      and run.provider_response_id is null
      and run.dispatch_claim_token is null
      and run.provider_usage is null
      and run.output_payload is null
      and run.output_canonical is null
      and run.output_sha256 is null
      and run.validation_report is null
      and run.validation_canonical is null
      and run.validation_sha256 is null
      and run.provider_error_code is not null
      and run.accounted_microusd = 0
      and run.accounting_basis = 'zero_pre_provider'
      and run.completed_at is not null
      and dispatch.state = 'terminal'
      and dispatch.dispatch_claim_token is null
      and dispatch.provider_request_sha256 is null
      and dispatch.send_intent_at is null
      and dispatch.provider_response_id is null
      and dispatch.response_bound_at is null
      and dispatch.reconciliation_required_at is null
      and dispatch.terminal_at is not null
      and ledger.state = 'released'
      and not ledger.provider_called
      and ledger.reserved_microusd = run.reserved_microusd
      and ledger.accounted_microusd = 0
      and ledger.accounting_basis = 'zero_pre_provider'
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_dispatch_claims claim
        where claim.run_id = run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_dispatch_prepost_aborts abort_record
        where abort_record.run_id = run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_result_outbox result_record
        where result_record.run_id = run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_webhook_events webhook
        where webhook.run_id = run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_recovery_wakes recovery
        where recovery.run_id = run.id
      )
      and not exists (
        select 1
        from veroxa_private.momo_content_ai_provider_rejection_receipts rejection
        where rejection.run_id = run.id
      )
  );
$$;
revoke all on function
  veroxa_private.momo_content_ai_safe_retry_parent_v2(uuid,uuid,uuid,text,uuid)
  from public, anon, authenticated, service_role;

-- The automation initiator remains the upload provenance actor. The existing
-- `requested_by` transport column is instead bound to the current Team budget
-- authorizer so every legacy dispatch/abort receipt retains an active Team
-- principal without inventing a review or approval.
create or replace function veroxa_private.momo_automation_run_identity_guard_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.decision_mode is distinct from old.decision_mode
    or new.automation_policy_version is distinct from
      old.automation_policy_version
    or new.automation_identity_id is distinct from old.automation_identity_id
    or new.automation_initiated_by is distinct from old.automation_initiated_by
    or new.automation_retry_of_run_id is distinct from
      old.automation_retry_of_run_id
    or new.automation_retry_generation is distinct from
      old.automation_retry_generation
    or new.requested_by is distinct from old.requested_by
    or new.source_asset_id is distinct from old.source_asset_id
    or new.intake_verification_id is distinct from old.intake_verification_id
    or new.rights_id is distinct from old.rights_id
    or new.rights_attestation_sha256 is distinct from
      old.rights_attestation_sha256
    or new.source_content_sha256 is distinct from old.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'momo_automation_run_lineage_is_immutable_v2';
  end if;

  if new.decision_mode = 'automation_policy_v2' and not exists (
    select 1
    from public.veroxa_momo_media_canonical_identities_v2 identity
    join public.veroxa_momo_media_asset_identity_links_v2 link
      on link.identity_id = identity.id
     and link.asset_id = new.source_asset_id
     and link.verification_id = new.intake_verification_id
     and link.rights_id = new.rights_id
     and link.rights_attestation_sha256 = new.rights_attestation_sha256
    join veroxa_private.momo_ai_budget_controls budget
      on budget.restaurant_id = identity.restaurant_id
     and budget.enabled
     and not budget.external_publishing_authorized
     and budget.authorized_by = new.requested_by
    where identity.id = new.automation_identity_id
      and identity.restaurant_id = new.restaurant_id
      and identity.content_sha256 = new.source_content_sha256
      and veroxa_private.momo_media_ai_actor_has_operational_team_v1(
        new.restaurant_id, new.requested_by
      )
      and veroxa_private.momo_actor_has_operational_membership_v1(
        new.restaurant_id, new.automation_initiated_by
      )
  ) then
    raise exception using errcode = '23514',
      message = 'momo_automation_run_lineage_invalid_v2';
  end if;

  if new.decision_mode = 'automation_policy_v2' and (
    (new.automation_retry_of_run_id is null
      and (
        new.automation_retry_generation <> 0
        or new.idempotency_hash is distinct from pg_catalog.encode(
          extensions.digest(pg_catalog.convert_to(
            'momo-content-auto-v2:' || new.request_hash, 'UTF8'
          ), 'sha256'),
          'hex'
        )
      ))
    or (new.automation_retry_of_run_id is not null and (
      new.automation_retry_generation <> 1
      or not veroxa_private.momo_content_ai_safe_retry_parent_v2(
        new.automation_retry_of_run_id, new.restaurant_id,
        new.automation_identity_id, new.request_hash, new.requested_by
      )
      or not exists (
        select 1
        from public.veroxa_momo_content_ai_runs parent
        where parent.id = new.automation_retry_of_run_id
          and parent.restaurant_id = new.restaurant_id
          and parent.automation_identity_id = new.automation_identity_id
          and parent.source_asset_id = new.source_asset_id
          and parent.intake_verification_id = new.intake_verification_id
          and parent.source_storage_path = new.source_storage_path
          and parent.source_storage_object_id = new.source_storage_object_id
          and parent.source_storage_object_version =
            new.source_storage_object_version
          and parent.source_mime_type = new.source_mime_type
          and parent.source_file_size = new.source_file_size
          and parent.source_width = new.source_width
          and parent.source_height = new.source_height
          and parent.source_content_sha256 = new.source_content_sha256
          and parent.rights_id = new.rights_id
          and parent.rights_attestation_sha256 =
            new.rights_attestation_sha256
          and parent.review_id is null and new.review_id is null
          and parent.truth_snapshot = new.truth_snapshot
          and parent.truth_snapshot_sha256 = new.truth_snapshot_sha256
          and parent.target_platforms = new.target_platforms
          and parent.model = new.model
          and parent.reasoning_effort = new.reasoning_effort
          and parent.prompt_version = new.prompt_version
          and parent.schema_version = new.schema_version
          and parent.validator_version = new.validator_version
          and parent.pricing_version = new.pricing_version
          and parent.client_request_hash = new.client_request_hash
          and parent.request_hash = new.request_hash
          and parent.requested_by = new.requested_by
          and parent.reserved_microusd = new.reserved_microusd
          and new.idempotency_hash = pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' || parent.id::text || ':' ||
                new.request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex')
      )
    ))
  ) then
    raise exception using errcode = '23514',
      message = 'momo_automation_retry_lineage_invalid_v2';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.momo_automation_run_identity_guard_v2()
  from public, anon, authenticated, service_role;
create trigger momo_automation_run_identity_guard_v2
before insert or update of decision_mode,automation_policy_version,
  automation_identity_id,automation_initiated_by,
  automation_retry_of_run_id,automation_retry_generation,requested_by,
  source_asset_id,intake_verification_id,rights_id,
  rights_attestation_sha256,source_content_sha256
on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.momo_automation_run_identity_guard_v2();

-- Recheck standing authorization at the last database transition before a
-- provider POST. Later result settlement intentionally does not use this
-- trigger: once a provider was called, durable accounting and recovery must
-- complete even if the Team authorizer is subsequently deactivated.
create or replace function
  veroxa_private.momo_automation_provider_boundary_guard_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'reserved'
     and new.status = 'provider_running'
     and new.decision_mode = 'automation_policy_v2'
     and (
       not veroxa_private.momo_content_ai_current_evidence_v1(
         old.id, old.requested_by
       )
       or not exists (
         select 1
         from veroxa_private.momo_ai_cost_ledger ledger
         where ledger.operation_kind = 'content_package'
           and ledger.source_id = old.id
           and ledger.restaurant_id = old.restaurant_id
           and ledger.idempotency_hash = old.idempotency_hash
           and ledger.state = 'reserved'
           and not ledger.provider_called
           and ledger.reserved_microusd = old.reserved_microusd
           and ledger.accounted_microusd is null
           and ledger.accounting_basis is null
       )
       or not exists (
         select 1
         from public.veroxa_momo_runtime_controls runtime
         where runtime.restaurant_id = old.restaurant_id
           and runtime.ai_live_calls
           and not runtime.provider_writes
           and not runtime.review_replies
           and not runtime.website_writes
           and not runtime.external_scheduling
       )
     ) then
    raise exception using errcode = '42501',
      message = 'momo_automation_provider_boundary_rejected_v2';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.momo_automation_provider_boundary_guard_v2()
  from public, anon, authenticated, service_role;
create trigger momo_automation_provider_boundary_guard_v2
before update of status,provider_called
on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.momo_automation_provider_boundary_guard_v2();

create or replace function veroxa_private.momo_jsonb_sorted_codes_v2(
  p_value jsonb,
  p_minimum integer,
  p_maximum integer
)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_typeof(p_value) = 'array'
    and pg_catalog.jsonb_array_length(p_value) between p_minimum and p_maximum
    and not exists (
      select 1
      from pg_catalog.jsonb_array_elements(p_value) item
      where pg_catalog.jsonb_typeof(item) <> 'string'
        or item #>> '{}' !~ '^[a-z0-9][a-z0-9_]{1,79}$'
    )
    and (
      select coalesce(pg_catalog.bool_and(
        position = 1 or previous_value < value
      ), true)
      from (
        select value, position,
          pg_catalog.lag(value) over (order by position) as previous_value
        from pg_catalog.jsonb_array_elements_text(p_value)
          with ordinality item(value, position)
      ) ordered
    );
$$;
revoke all on function veroxa_private.momo_jsonb_sorted_codes_v2(jsonb,integer,integer)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_upsert_exception_v2(
  p_restaurant_id uuid,
  p_canonical_asset_id uuid,
  p_source_asset_id uuid,
  p_run_id uuid,
  p_stage text,
  p_policy_version text,
  p_blockers jsonb,
  p_warnings jsonb,
  p_evidence_snapshot jsonb,
  p_evidence_canonical text,
  p_evidence_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_canonical text;
  blocker_hash text;
  event_hash text;
  incident public.veroxa_momo_exception_incidents_v2%rowtype;
  existing_event public.veroxa_momo_exception_events_v2%rowtype;
  event_id uuid;
  event_kind text;
begin
  if p_stage not in (
      'media_intake','rights_reconciliation','automation_reservation',
      'content_processing','content_validation'
    )
    or p_policy_version is null
    or pg_catalog.char_length(p_policy_version) not between 8 and 160
    or not veroxa_private.momo_jsonb_sorted_codes_v2(p_blockers, 1, 64)
    or not veroxa_private.momo_jsonb_sorted_codes_v2(p_warnings, 0, 32)
    or pg_catalog.jsonb_typeof(p_evidence_snapshot) is distinct from 'object'
    or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
    or not exists (
      select 1 from public.veroxa_media_assets asset
      where asset.id = p_canonical_asset_id
        and asset.restaurant_id = p_restaurant_id
    )
    or (p_source_asset_id is not null and not exists (
      select 1 from public.veroxa_media_assets asset
      where asset.id = p_source_asset_id
        and asset.restaurant_id = p_restaurant_id
    ))
    or (p_run_id is not null and not exists (
      select 1
      from public.veroxa_momo_content_ai_runs run
      join public.veroxa_momo_media_canonical_identities_v2 identity
        on identity.id = run.automation_identity_id
       and identity.restaurant_id = run.restaurant_id
      join public.veroxa_momo_media_asset_identity_links_v2 link
        on link.identity_id = identity.id
       and link.restaurant_id = run.restaurant_id
       and link.asset_id = run.source_asset_id
      where run.id = p_run_id
        and run.restaurant_id = p_restaurant_id
        and run.decision_mode = 'automation_policy_v2'
        and run.source_asset_id = p_source_asset_id
        and identity.canonical_asset_id = p_canonical_asset_id
    )) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_exception_evidence_v2';
  end if;

  expected_canonical := veroxa_private.momo_canonical_json_v1(
    pg_catalog.jsonb_build_object(
      'stage', p_stage,
      'policyVersion', p_policy_version,
      'blockers', p_blockers,
      'warnings', p_warnings,
      'evidenceSnapshot', p_evidence_snapshot
    )
  );
  if p_evidence_canonical is distinct from expected_canonical
    or p_evidence_sha256 is distinct from pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(expected_canonical, 'UTF8'), 'sha256'),
      'hex'
    ) then
    raise exception using errcode = '22023',
      message = 'invalid_momo_exception_evidence_v2';
  end if;

  blocker_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    veroxa_private.momo_canonical_json_v1(p_blockers), 'UTF8'
  ), 'sha256'), 'hex');
  event_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.concat_ws('|', p_restaurant_id::text,
      p_canonical_asset_id::text, coalesce(p_source_asset_id::text, ''),
      coalesce(p_run_id::text, ''), p_stage, p_policy_version,
      p_evidence_sha256
    ), 'UTF8'
  ), 'sha256'), 'hex');

  select event.* into existing_event
  from public.veroxa_momo_exception_events_v2 event
  where event.restaurant_id = p_restaurant_id
    and event.event_idempotency_sha256 = event_hash;
  if found then
    select * into incident
    from public.veroxa_momo_exception_incidents_v2 target
    where target.id = existing_event.incident_id;
    return pg_catalog.jsonb_build_object(
      'incidentId', incident.id,
      'eventId', existing_event.id,
      'status', incident.status,
      'occurrenceCount', incident.occurrence_count,
      'canonicalAssetId', incident.canonical_asset_id,
      'runId', p_run_id
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_restaurant_id::text || ':' || p_canonical_asset_id::text || ':' ||
      p_stage || ':' || p_policy_version, 0
  ));
  -- A concurrent exact retry may have committed while this call waited for
  -- the canonical incident lock. Re-read before incrementing or inserting.
  select event.* into existing_event
  from public.veroxa_momo_exception_events_v2 event
  where event.restaurant_id = p_restaurant_id
    and event.event_idempotency_sha256 = event_hash;
  if found then
    select * into incident
    from public.veroxa_momo_exception_incidents_v2 target
    where target.id = existing_event.incident_id;
    return pg_catalog.jsonb_build_object(
      'incidentId', incident.id,
      'eventId', existing_event.id,
      'status', incident.status,
      'occurrenceCount', incident.occurrence_count,
      'canonicalAssetId', incident.canonical_asset_id,
      'runId', p_run_id
    );
  end if;
  select * into incident
  from public.veroxa_momo_exception_incidents_v2 target
  where target.restaurant_id = p_restaurant_id
    and target.canonical_asset_id = p_canonical_asset_id
    and target.stage = p_stage
    and target.policy_version = p_policy_version
    and target.status = 'open'
  for update;
  if found then
    event_kind := 'repeated';
    update public.veroxa_momo_exception_incidents_v2 target
    set blocker_set_sha256 = blocker_hash,
        blockers = p_blockers,
        warnings = p_warnings,
        evidence_sha256 = p_evidence_sha256,
        occurrence_count = target.occurrence_count + 1,
        last_seen_at = pg_catalog.clock_timestamp()
    where target.id = incident.id
    returning target.* into incident;
  else
    event_kind := 'opened';
    insert into public.veroxa_momo_exception_incidents_v2 (
      restaurant_id, canonical_asset_id, stage, policy_version,
      blocker_set_sha256, blockers, warnings, evidence_sha256
    ) values (
      p_restaurant_id, p_canonical_asset_id, p_stage, p_policy_version,
      blocker_hash, p_blockers, p_warnings, p_evidence_sha256
    ) returning * into incident;
  end if;

  insert into public.veroxa_momo_exception_events_v2 (
    incident_id, restaurant_id, canonical_asset_id, source_asset_id,
    content_ai_run_id, stage, event_kind, policy_version, blockers,
    warnings, evidence_snapshot, evidence_canonical, evidence_sha256,
    event_idempotency_sha256
  ) values (
    incident.id, p_restaurant_id, p_canonical_asset_id, p_source_asset_id,
    p_run_id, p_stage, event_kind, p_policy_version, p_blockers,
    p_warnings, p_evidence_snapshot, expected_canonical, p_evidence_sha256,
    event_hash
  ) returning id into event_id;

  return pg_catalog.jsonb_build_object(
    'incidentId', incident.id,
    'eventId', event_id,
    'status', incident.status,
    'occurrenceCount', incident.occurrence_count,
    'canonicalAssetId', incident.canonical_asset_id,
    'runId', p_run_id
  );
end;
$$;
revoke all on function veroxa_private.momo_upsert_exception_v2(
  uuid,uuid,uuid,uuid,text,text,jsonb,jsonb,jsonb,text,text
) from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_record_intake_attempt_v2(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_actor_id uuid;
  v_outcome text;
  v_reason_codes jsonb;
  v_evidence_snapshot jsonb;
  v_evidence_canonical text;
  v_evidence_sha256 text;
  v_idempotency_sha256 text;
  attempt public.veroxa_momo_media_intake_attempts_v2%rowtype;
  exception_snapshot jsonb;
  exception_canonical text;
  exception_sha256 text;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
    'restaurantId','assetId','actorId','outcome','reasonCodes',
    'evidenceSnapshot','evidenceCanonical','evidenceSha256','idempotencySha256'
  ]) then
    raise exception using errcode = '22023', message = 'invalid_momo_intake_attempt_v2';
  end if;
  v_restaurant_id := (p_payload ->> 'restaurantId')::uuid;
  v_asset_id := (p_payload ->> 'assetId')::uuid;
  v_actor_id := (p_payload ->> 'actorId')::uuid;
  v_outcome := p_payload ->> 'outcome';
  v_reason_codes := p_payload -> 'reasonCodes';
  v_evidence_snapshot := p_payload -> 'evidenceSnapshot';
  v_evidence_canonical := p_payload ->> 'evidenceCanonical';
  v_evidence_sha256 := p_payload ->> 'evidenceSha256';
  v_idempotency_sha256 := p_payload ->> 'idempotencySha256';
  if v_outcome not in ('rejected','unavailable')
    or not veroxa_private.momo_actor_has_operational_membership_v1(
      v_restaurant_id, v_actor_id
    )
    or not exists (
      select 1 from public.veroxa_media_assets asset
      where asset.id = v_asset_id and asset.restaurant_id = v_restaurant_id
    )
    or not veroxa_private.momo_jsonb_sorted_codes_v2(v_reason_codes, 1, 16)
    or pg_catalog.jsonb_typeof(v_evidence_snapshot) is distinct from 'object'
    or v_evidence_snapshot ->> 'restaurantId' is distinct from v_restaurant_id::text
    or v_evidence_snapshot ->> 'assetId' is distinct from v_asset_id::text
    or v_evidence_snapshot ->> 'outcome' is distinct from v_outcome
    or v_evidence_snapshot -> 'reasonCodes' is distinct from v_reason_codes
    or v_evidence_canonical is distinct from
      veroxa_private.momo_canonical_json_v1(v_evidence_snapshot)
    or v_evidence_sha256 is distinct from pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(v_evidence_canonical, 'UTF8'), 'sha256'
    ), 'hex')
    or v_idempotency_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid_momo_intake_attempt_v2';
  end if;

  insert into public.veroxa_momo_media_intake_attempts_v2 (
    restaurant_id, source_asset_id, actor_id, outcome, reason_codes,
    evidence_snapshot, evidence_canonical, evidence_sha256,
    idempotency_sha256
  ) values (
    v_restaurant_id, v_asset_id, v_actor_id, v_outcome, v_reason_codes,
    v_evidence_snapshot, v_evidence_canonical, v_evidence_sha256,
    v_idempotency_sha256
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;
  select * into attempt
  from public.veroxa_momo_media_intake_attempts_v2 target
  where target.restaurant_id = v_restaurant_id
    and target.idempotency_sha256 = v_idempotency_sha256;
  if attempt.source_asset_id <> v_asset_id or attempt.outcome <> v_outcome
    or attempt.evidence_sha256 <> v_evidence_sha256 then
    raise exception using errcode = '23505', message = 'momo_intake_attempt_conflict_v2';
  end if;

  exception_snapshot := pg_catalog.jsonb_build_object(
    'intakeAttemptId', attempt.id,
    'outcome', v_outcome,
    'reasonCodes', v_reason_codes,
    'intakeEvidenceSha256', v_evidence_sha256
  );
  exception_canonical := veroxa_private.momo_canonical_json_v1(
    pg_catalog.jsonb_build_object(
      'stage', 'media_intake',
      'policyVersion', 'momo-image-byte-verifier-2026-08-02-v2',
      'blockers', v_reason_codes,
      'warnings', '[]'::jsonb,
      'evidenceSnapshot', exception_snapshot
    )
  );
  exception_sha256 := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(exception_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  perform veroxa_private.momo_upsert_exception_v2(
    v_restaurant_id, v_asset_id, v_asset_id, null, 'media_intake',
    'momo-image-byte-verifier-2026-08-02-v2', v_reason_codes, '[]'::jsonb,
    exception_snapshot, exception_canonical, exception_sha256
  );
  return pg_catalog.jsonb_build_object(
    'attemptId', attempt.id,
    'status', 'recorded',
    'assetId', v_asset_id
  );
end;
$$;
revoke all on function veroxa_private.momo_record_intake_attempt_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_advance_verified_asset_v2(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_processing_asset_id uuid;
  v_verification_id uuid;
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

  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id and asset.restaurant_id = v_restaurant_id
  -- Concurrent exact-byte uploads may each hold their own asset. SHARE is
  -- sufficient for immutable evidence and remains compatible with the
  -- canonical asset key-share lock acquired by foreign keys after the
  -- per-hash advisory lock, avoiding an inverted UPDATE/advisory deadlock.
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
  where rights.asset_id = v_asset_id and rights.restaurant_id = v_restaurant_id
  for share;
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
    raise exception using errcode = '23514', message = 'momo_advance_evidence_invalid_v2';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    v_restaurant_id::text || ':' || v_verification.content_sha256, 0
  ));
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
        'promptVersion', 'momo-content-package-2026-08-01-v4',
        'validatorVersion', 'momo-content-validator-2026-08-01-v4',
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
        'momo-content-package-2026-08-01-v4', 'momo-content-package-v1',
        'momo-content-validator-2026-08-01-v4',
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
$$;
revoke all on function veroxa_private.momo_advance_verified_asset_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_resolve_exceptions_v2(
  p_restaurant_id uuid,
  p_canonical_asset_id uuid,
  p_run_id uuid,
  p_resolution text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  incident public.veroxa_momo_exception_incidents_v2%rowtype;
  resolution_source_asset_id uuid;
  snapshot jsonb;
  canonical text;
  evidence_hash text;
  event_hash text;
begin
  if p_resolution !~ '^[a-z0-9][a-z0-9_]{2,79}$' then
    raise exception using errcode = '22023', message = 'invalid_momo_resolution_v2';
  end if;
  resolution_source_asset_id := p_canonical_asset_id;
  if p_run_id is not null then
    select run.source_asset_id into resolution_source_asset_id
    from public.veroxa_momo_content_ai_runs run
    join public.veroxa_momo_media_canonical_identities_v2 identity
      on identity.id = run.automation_identity_id
     and identity.restaurant_id = run.restaurant_id
    where run.id = p_run_id
      and run.restaurant_id = p_restaurant_id
      and identity.canonical_asset_id = p_canonical_asset_id;
    if resolution_source_asset_id is null then
      raise exception using errcode = '23514',
        message = 'momo_resolution_run_mismatch_v2';
    end if;
  end if;
  for incident in
    select target.*
    from public.veroxa_momo_exception_incidents_v2 target
    where target.restaurant_id = p_restaurant_id
      and target.canonical_asset_id = p_canonical_asset_id
      and target.status = 'open'
      and target.stage in (
        'media_intake','rights_reconciliation','automation_reservation',
        'content_processing','content_validation'
      )
      and (
        (p_resolution = 'intake_verified'
          and target.stage = 'media_intake')
        or (p_resolution = 'duplicate_rights_isolated'
          and target.stage = 'rights_reconciliation')
        or (p_resolution not in (
            'intake_verified','duplicate_rights_isolated'
          ) and target.stage <> 'rights_reconciliation')
      )
    for update
  loop
    snapshot := pg_catalog.jsonb_build_object(
      'incidentId', incident.id,
      'resolution', p_resolution,
      'runId', p_run_id
    );
    canonical := veroxa_private.momo_canonical_json_v1(
      pg_catalog.jsonb_build_object(
        'stage', incident.stage,
        'policyVersion', incident.policy_version,
        'blockers', incident.blockers,
        'warnings', incident.warnings,
        'evidenceSnapshot', snapshot
      )
    );
    evidence_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(canonical, 'UTF8'), 'sha256'
    ), 'hex');
    event_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
      'momo-exception-resolved-v2:' || incident.id::text || ':' ||
        coalesce(p_run_id::text, 'no-run') || ':' || p_resolution, 'UTF8'
    ), 'sha256'), 'hex');
    insert into public.veroxa_momo_exception_events_v2 (
      incident_id, restaurant_id, canonical_asset_id, source_asset_id,
      content_ai_run_id, stage, event_kind, policy_version, blockers,
      warnings, evidence_snapshot, evidence_canonical, evidence_sha256,
      event_idempotency_sha256
    ) values (
      incident.id, p_restaurant_id, p_canonical_asset_id,
      resolution_source_asset_id, p_run_id, incident.stage, 'resolved',
      incident.policy_version, incident.blockers, incident.warnings,
      snapshot, canonical, evidence_hash, event_hash
    ) on conflict (restaurant_id, event_idempotency_sha256) do nothing;
    update public.veroxa_momo_exception_incidents_v2 target
    set status = 'resolved', resolved_at = pg_catalog.clock_timestamp(),
        last_seen_at = pg_catalog.clock_timestamp()
    where target.id = incident.id and target.status = 'open';
  end loop;
end;
$$;
revoke all on function veroxa_private.momo_resolve_exceptions_v2(uuid,uuid,uuid,text)
  from public, anon, authenticated, service_role;

-- Provider settlement is a durable boundary. Once the provider has been
-- called, the original uploader remains provenance but is not treated as a
-- current human approver. Current bytes, storage, rights, truth, cost, and
-- external-write controls must still agree before an immutable Ready package
-- can be emitted.
create or replace function veroxa_private.momo_content_ai_post_provider_evidence_v2(
  p_run_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    join public.veroxa_media_assets asset
      on asset.id = run.source_asset_id
     and asset.restaurant_id = run.restaurant_id
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = run.intake_verification_id
     and intake.asset_id = asset.id
     and intake.restaurant_id = run.restaurant_id
    join public.veroxa_media_rights rights
      on rights.id = run.rights_id
     and rights.asset_id = asset.id
     and rights.restaurant_id = run.restaurant_id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = run.source_storage_path
     and object.id = run.source_storage_object_id
    join veroxa_private.momo_ai_cost_ledger ledger
      on ledger.operation_kind = 'content_package'
     and ledger.source_id = run.id
     and ledger.restaurant_id = run.restaurant_id
     and ledger.idempotency_hash = run.idempotency_hash
    where run.id = p_run_id
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.review_id is null
      and run.status = 'pending_review'
      and asset.status in ('uploaded','ready_to_use')
      and asset.content_sha256 = run.source_content_sha256
      and asset.storage_path = run.source_storage_path
      and asset.mime_type = run.source_mime_type
      and asset.file_size = run.source_file_size
      and asset.width = run.source_width
      and asset.height = run.source_height
      and run.source_mime_type = 'image/jpeg'
      and run.source_file_size between 10240 and 5242880
      and run.source_width between 320 and 12000
      and run.source_height between 250 and 12000
      and run.source_width::numeric / run.source_height::numeric
        between 0.8 and 1.91
      and intake.status = 'verified'
      and intake.storage_path = run.source_storage_path
      and intake.storage_object_id = run.source_storage_object_id
      and intake.storage_object_version = run.source_storage_object_version
      and intake.detected_mime_type = run.source_mime_type
      and intake.file_size = run.source_file_size
      and intake.width = run.source_width
      and intake.height = run.source_height
      and intake.content_sha256 = run.source_content_sha256
      and object.version = run.source_storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') = run.source_mime_type
      and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
        then (object.metadata ->> 'size')::numeric = run.source_file_size::numeric
        else false end
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and rights.attestation_sha256 = run.rights_attestation_sha256
      and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
      and run.target_platforms <@ rights.usage_scope
      and run.truth_snapshot_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(
          veroxa_private.current_momo_truth_snapshot_v1(run.restaurant_id)::text,
          'UTF8'
        ), 'sha256'
      ), 'hex')
      and ledger.state = 'settled'
      and ledger.provider_called
      and ledger.reserved_microusd = run.reserved_microusd
      and ledger.accounted_microusd = run.accounted_microusd
      and ledger.accounting_basis = run.accounting_basis
      and exists (
        select 1
        from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = run.restaurant_id
          and not runtime.provider_writes
          and not runtime.review_replies
          and not runtime.website_writes
          and not runtime.external_scheduling
      )
  );
$$;
revoke all on function
  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)
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
  v_run public.veroxa_momo_content_ai_runs%rowtype;
  v_identity public.veroxa_momo_media_canonical_identities_v2%rowtype;
  v_ready public.veroxa_momo_ready_packages_v2%rowtype;
  v_variant jsonb;
  v_variant_count integer := 0;
  v_hashtags jsonb;
  v_seo jsonb;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(
    p_payload, array['runId','requestHash']
  ) then
    raise exception using errcode = '22023', message = 'invalid_momo_ready_v2';
  end if;
  v_run_id := (p_payload ->> 'runId')::uuid;
  v_request_hash := p_payload ->> 'requestHash';
  select * into v_run
  from public.veroxa_momo_content_ai_runs run
  where run.id = v_run_id
  for update;
  if v_run.id is null
    or v_run.request_hash is distinct from v_request_hash
    or v_run.decision_mode <> 'automation_policy_v2'
    or v_run.automation_policy_version <>
      'momo-upload-veroxa-ready-2026-08-02-v2'
    or v_run.status <> 'pending_review'
    or v_run.output_payload is null
    or v_run.output_canonical is null
    or v_run.output_sha256 is null
    or v_run.validation_report is null
    or v_run.validation_canonical is null
    or v_run.validation_sha256 is null
    or v_run.validation_report ->> 'validatorVersion' <>
      'momo-content-validator-2026-08-01-v4'
    or v_run.validation_report -> 'passed' is distinct from 'true'::jsonb
    or v_run.validation_report -> 'platformSet'
      is distinct from v_run.target_platforms
    or not veroxa_private.momo_canonical_payload_matches_v1(
      v_run.output_payload, v_run.output_canonical, v_run.output_sha256
    )
    or not veroxa_private.momo_canonical_payload_matches_v1(
      v_run.validation_report, v_run.validation_canonical,
      v_run.validation_sha256
    )
    or not veroxa_private.momo_current_content_contract_valid_v1(
      v_run.output_payload, v_run.target_platforms, v_run.truth_snapshot
    )
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        v_run.output_payload -> 'variants'
      ) variant
      where variant ->> 'scheduleWindow' is distinct from 'unspecified'
    )
    or not veroxa_private.momo_content_ai_post_provider_evidence_v2(
      v_run.id
    )
    or not exists (
      select 1
      from veroxa_private.momo_content_ai_result_outbox outbox
      where outbox.run_id = v_run.id
        and outbox.request_hash = v_run.request_hash
        and outbox.state = 'applied'
        and outbox.output_sha256 = v_run.output_sha256
        and outbox.validation_sha256 = v_run.validation_sha256
    ) then
    raise exception using errcode = '23514', message = 'momo_ready_evidence_invalid_v2';
  end if;
  select identity.* into v_identity
  from public.veroxa_momo_media_asset_identity_links_v2 link
  join public.veroxa_momo_media_canonical_identities_v2 identity
    on identity.id = link.identity_id
  where link.asset_id = v_run.source_asset_id
    and link.identity_id = v_run.automation_identity_id
    and link.canonical_asset_id = identity.canonical_asset_id
    and identity.restaurant_id = v_run.restaurant_id
    and identity.content_sha256 = v_run.source_content_sha256;
  if v_identity.id is null then
    raise exception using errcode = '23514', message = 'momo_ready_identity_invalid_v2';
  end if;

  select * into v_ready
  from public.veroxa_momo_ready_packages_v2 ready
  where ready.content_ai_run_id = v_run.id;
  if v_ready.id is null then
    insert into public.veroxa_momo_ready_packages_v2 (
      restaurant_id, content_ai_run_id, identity_id, canonical_asset_id,
      source_asset_id, intake_verification_id, rights_id,
      rights_attestation_sha256, truth_snapshot_sha256,
      source_storage_path, source_storage_object_id,
      source_storage_object_version, source_mime_type, source_file_size,
      source_width, source_height, source_content_sha256, output_payload,
      output_canonical, output_sha256, validation_report,
      validation_canonical, validation_sha256, decision_mode,
      policy_version, status
    ) values (
      v_run.restaurant_id, v_run.id, v_identity.id,
      v_identity.canonical_asset_id, v_run.source_asset_id,
      v_run.intake_verification_id, v_run.rights_id,
      v_run.rights_attestation_sha256, v_run.truth_snapshot_sha256,
      v_run.source_storage_path, v_run.source_storage_object_id,
      v_run.source_storage_object_version, v_run.source_mime_type,
      v_run.source_file_size, v_run.source_width, v_run.source_height,
      v_run.source_content_sha256, v_run.output_payload,
      v_run.output_canonical, v_run.output_sha256, v_run.validation_report,
      v_run.validation_canonical, v_run.validation_sha256,
      'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',
      'veroxa_ready'
    ) returning * into v_ready;

    for v_variant in
      select item
      from pg_catalog.jsonb_array_elements(v_run.output_payload -> 'variants') item
    loop
      select coalesce(pg_catalog.jsonb_agg(hashtag.item ->> 'tag'
        order by selected.position), '[]'::jsonb)
      into v_hashtags
      from pg_catalog.jsonb_array_elements_text(v_variant -> 'hashtagIds')
        with ordinality selected(id, position)
      join pg_catalog.jsonb_array_elements(v_run.output_payload -> 'hashtags') hashtag(item)
        on hashtag.item ->> 'id' = selected.id;
      select coalesce(pg_catalog.jsonb_agg(phrase.item ->> 'phrase'
        order by selected.position), '[]'::jsonb)
      into v_seo
      from pg_catalog.jsonb_array_elements_text(v_variant -> 'seoPhraseIds')
        with ordinality selected(id, position)
      join pg_catalog.jsonb_array_elements(v_run.output_payload -> 'seoPhrases') phrase(item)
        on phrase.item ->> 'id' = selected.id;
      insert into public.veroxa_momo_ready_variants_v2 (
        restaurant_id, ready_package_id, platform, caption, hashtags,
        seo_phrases, alt_text, call_to_action, claim_ids, status
      ) values (
        v_run.restaurant_id, v_ready.id, v_variant ->> 'platform',
        v_variant ->> 'caption', v_hashtags, v_seo,
        v_run.output_payload ->> 'altText', v_variant -> 'cta',
        v_variant -> 'claimIds', 'veroxa_ready'
      );
      v_variant_count := v_variant_count + 1;
    end loop;
    if v_variant_count <> pg_catalog.jsonb_array_length(v_run.target_platforms)
      or v_variant_count not between 1 and 3 then
      raise exception using errcode = '23514', message = 'momo_ready_variant_mismatch_v2';
    end if;
  end if;

  update public.veroxa_media_assets asset
  set status = 'ready_to_use', updated_at = pg_catalog.clock_timestamp()
  where asset.id = v_run.source_asset_id
    and asset.restaurant_id = v_run.restaurant_id
    and asset.status in ('uploaded','under_veroxa_review');
  perform veroxa_private.momo_resolve_exceptions_v2(
    v_run.restaurant_id, v_identity.canonical_asset_id, v_run.id,
    'veroxa_ready'
  );
  return pg_catalog.jsonb_build_object(
    'readyPackageId', v_ready.id,
    'runId', v_run.id,
    'status', 'veroxa_ready',
    'externalWriteAllowed', false
  );
end;
$$;
revoke all on function veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_auto_ready_after_outbox_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.veroxa_momo_content_ai_runs%rowtype;
  canonical_asset_id uuid;
  blockers jsonb := '["ready_materialization_failed"]'::jsonb;
  snapshot jsonb;
  canonical text;
  evidence_hash text;
begin
  if new.state = 'applied' and old.state is distinct from new.state then
    select * into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = new.run_id;
    if run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2' then
      select identity.canonical_asset_id into canonical_asset_id
      from public.veroxa_momo_media_canonical_identities_v2 identity
      where identity.id = run.automation_identity_id
        and identity.restaurant_id = run.restaurant_id;
      if canonical_asset_id is null then
        raise exception using errcode = '23514',
          message = 'momo_ready_identity_invalid_v2';
      end if;
      begin
        perform veroxa_private.momo_materialize_veroxa_ready_v2(
          pg_catalog.jsonb_build_object(
            'runId', run.id,
            'requestHash', run.request_hash
          )
        );
      exception when others then
        snapshot := pg_catalog.jsonb_build_object(
          'runId', run.id,
          'requestHash', run.request_hash,
          'outputSha256', run.output_sha256,
          'validationSha256', run.validation_sha256,
          'outboxState', new.state
        );
        canonical := veroxa_private.momo_canonical_json_v1(
          pg_catalog.jsonb_build_object(
            'stage', 'content_validation',
            'policyVersion',
              'momo-upload-veroxa-ready-2026-08-02-v2',
            'blockers', blockers,
            'warnings', '[]'::jsonb,
            'evidenceSnapshot', snapshot
          )
        );
        evidence_hash := pg_catalog.encode(extensions.digest(
          pg_catalog.convert_to(canonical, 'UTF8'), 'sha256'
        ), 'hex');
        perform veroxa_private.momo_upsert_exception_v2(
          run.restaurant_id, canonical_asset_id, run.source_asset_id,
          run.id, 'content_validation',
          'momo-upload-veroxa-ready-2026-08-02-v2', blockers,
          '[]'::jsonb, snapshot, canonical, evidence_hash
        );
      end;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.momo_auto_ready_after_outbox_v2()
  from public, anon, authenticated, service_role;
create trigger veroxa_momo_auto_ready_after_outbox_v2
after update of state on veroxa_private.momo_content_ai_result_outbox
for each row execute function veroxa_private.momo_auto_ready_after_outbox_v2();

-- Every immutable child repeats its tenant and evidence keys intentionally so
-- it can be audited without following mutable application state. These guards
-- make those repeated keys fail closed rather than trusting service-role code.
create or replace function veroxa_private.momo_v2_coherence_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'veroxa_momo_media_intake_attempts_v2' then
    if not exists (
      select 1
      from public.veroxa_media_assets asset
      where asset.id = new.source_asset_id
        and asset.restaurant_id = new.restaurant_id
    ) or not veroxa_private.momo_actor_has_operational_membership_v1(
      new.restaurant_id, new.actor_id
    ) or (new.verification_id is not null and not exists (
      select 1
      from public.veroxa_momo_media_intake_verifications verification
      where verification.id = new.verification_id
        and verification.restaurant_id = new.restaurant_id
        and verification.asset_id = new.source_asset_id
        and verification.status = 'verified'
    )) or (new.canonical_asset_id is not null and not exists (
      select 1
      from public.veroxa_media_assets canonical
      where canonical.id = new.canonical_asset_id
        and canonical.restaurant_id = new.restaurant_id
    )) then
      raise exception using errcode = '23514',
        message = 'momo_intake_attempt_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_media_canonical_identities_v2' then
    if not exists (
      select 1
      from public.veroxa_media_assets asset
      join public.veroxa_momo_media_intake_verifications verification
        on verification.id = new.canonical_verification_id
       and verification.asset_id = asset.id
       and verification.restaurant_id = asset.restaurant_id
      where asset.id = new.canonical_asset_id
        and asset.restaurant_id = new.restaurant_id
        and asset.content_sha256 = new.content_sha256
        and verification.status = 'verified'
        and verification.content_sha256 = new.content_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'momo_identity_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_media_asset_identity_links_v2' then
    if not exists (
      select 1
      from public.veroxa_momo_media_canonical_identities_v2 identity
      join public.veroxa_media_assets asset
        on asset.id = new.asset_id
       and asset.restaurant_id = new.restaurant_id
      join public.veroxa_momo_media_intake_verifications verification
        on verification.id = new.verification_id
       and verification.asset_id = asset.id
       and verification.restaurant_id = new.restaurant_id
      join public.veroxa_media_rights rights
        on rights.id = new.rights_id
       and rights.asset_id = asset.id
       and rights.restaurant_id = new.restaurant_id
      where identity.id = new.identity_id
        and identity.restaurant_id = new.restaurant_id
        and identity.canonical_asset_id = new.canonical_asset_id
        and identity.content_sha256 = new.content_sha256
        and asset.content_sha256 = new.content_sha256
        and verification.status = 'verified'
        and verification.content_sha256 = new.content_sha256
        and rights.attestation_sha256 = new.rights_attestation_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'momo_identity_link_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_automation_advances_v2' then
    if not exists (
      select 1
      from public.veroxa_momo_media_canonical_identities_v2 identity
      join public.veroxa_momo_media_asset_identity_links_v2 source_link
        on source_link.identity_id = identity.id
       and source_link.restaurant_id = new.restaurant_id
       and source_link.asset_id = new.source_asset_id
       and source_link.verification_id = new.intake_verification_id
      join public.veroxa_media_assets asset
        on asset.id = new.source_asset_id
       and asset.restaurant_id = new.restaurant_id
      join public.veroxa_momo_media_intake_verifications verification
        on verification.id = new.intake_verification_id
       and verification.asset_id = asset.id
       and verification.restaurant_id = new.restaurant_id
      where identity.id = new.identity_id
        and identity.restaurant_id = new.restaurant_id
        and identity.canonical_asset_id = new.canonical_asset_id
        and identity.content_sha256 = source_link.content_sha256
        and asset.content_sha256 = identity.content_sha256
        and verification.status = 'verified'
        and verification.content_sha256 = identity.content_sha256
    ) or not veroxa_private.momo_actor_has_operational_membership_v1(
      new.restaurant_id, new.actor_id
    ) or (new.processing_asset_id is not null and not exists (
      select 1
      from public.veroxa_momo_media_asset_identity_links_v2 processing_link
      where processing_link.identity_id = new.identity_id
        and processing_link.restaurant_id = new.restaurant_id
        and processing_link.asset_id = new.processing_asset_id
        and processing_link.canonical_asset_id = new.canonical_asset_id
    )) or (new.content_ai_run_id is not null and not exists (
      select 1
      from public.veroxa_momo_content_ai_runs run
      where run.id = new.content_ai_run_id
        and run.restaurant_id = new.restaurant_id
        and run.automation_identity_id = new.identity_id
        and (
          new.outcome = 'exception'
          or run.source_asset_id = new.processing_asset_id
        )
    )) then
      raise exception using errcode = '23514',
        message = 'momo_advance_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_exception_incidents_v2' then
    if not exists (
      select 1
      from public.veroxa_media_assets asset
      where asset.id = new.canonical_asset_id
        and asset.restaurant_id = new.restaurant_id
    ) then
      raise exception using errcode = '23514',
        message = 'momo_exception_incident_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_exception_events_v2' then
    if not exists (
      select 1
      from public.veroxa_momo_exception_incidents_v2 incident
      where incident.id = new.incident_id
        and incident.restaurant_id = new.restaurant_id
        and incident.canonical_asset_id = new.canonical_asset_id
        and incident.stage = new.stage
        and incident.policy_version = new.policy_version
    ) or (new.source_asset_id is not null and not exists (
      select 1
      from public.veroxa_media_assets asset
      where asset.id = new.source_asset_id
        and asset.restaurant_id = new.restaurant_id
    )) or (new.content_ai_run_id is not null and not exists (
      select 1
      from public.veroxa_momo_content_ai_runs run
      join public.veroxa_momo_media_canonical_identities_v2 identity
        on identity.id = run.automation_identity_id
       and identity.restaurant_id = run.restaurant_id
      join public.veroxa_momo_media_asset_identity_links_v2 link
        on link.identity_id = identity.id
       and link.restaurant_id = run.restaurant_id
       and link.asset_id = run.source_asset_id
      where run.id = new.content_ai_run_id
        and run.restaurant_id = new.restaurant_id
        and run.decision_mode = 'automation_policy_v2'
        and run.source_asset_id = new.source_asset_id
        and identity.canonical_asset_id = new.canonical_asset_id
    )) then
      raise exception using errcode = '23514',
        message = 'momo_exception_event_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_ready_packages_v2' then
    if not exists (
        select 1
        from public.veroxa_momo_content_ai_runs run
        join public.veroxa_momo_media_canonical_identities_v2 identity
          on identity.id = new.identity_id
         and identity.restaurant_id = run.restaurant_id
        join public.veroxa_momo_media_asset_identity_links_v2 link
          on link.identity_id = identity.id
         and link.restaurant_id = run.restaurant_id
         and link.asset_id = run.source_asset_id
        join public.veroxa_momo_media_intake_verifications intake
          on intake.id = run.intake_verification_id
         and intake.asset_id = run.source_asset_id
        join public.veroxa_media_rights rights
          on rights.id = run.rights_id
         and rights.asset_id = run.source_asset_id
        where run.id = new.content_ai_run_id
          and run.restaurant_id = new.restaurant_id
          and run.automation_identity_id = identity.id
          and run.source_asset_id = new.source_asset_id
          and run.intake_verification_id = new.intake_verification_id
          and run.rights_id = new.rights_id
          and run.rights_attestation_sha256 =
            new.rights_attestation_sha256
          and run.truth_snapshot_sha256 = new.truth_snapshot_sha256
          and run.source_storage_path = new.source_storage_path
          and run.source_storage_object_id = new.source_storage_object_id
          and run.source_storage_object_version =
            new.source_storage_object_version
          and run.source_mime_type = new.source_mime_type
          and run.source_file_size = new.source_file_size
          and run.source_width = new.source_width
          and run.source_height = new.source_height
          and run.source_content_sha256 = new.source_content_sha256
          and run.output_payload = new.output_payload
          and run.output_canonical = new.output_canonical
          and run.output_sha256 = new.output_sha256
          and run.validation_report = new.validation_report
          and run.validation_canonical = new.validation_canonical
          and run.validation_sha256 = new.validation_sha256
          and run.decision_mode = 'automation_policy_v2'
          and run.automation_policy_version = new.policy_version
          and identity.canonical_asset_id = new.canonical_asset_id
          and identity.content_sha256 = new.source_content_sha256
          and link.verification_id = new.intake_verification_id
          and link.rights_id = new.rights_id
          and link.rights_attestation_sha256 =
            new.rights_attestation_sha256
          and intake.restaurant_id = new.restaurant_id
          and rights.restaurant_id = new.restaurant_id
      ) then
      raise exception using errcode = '23514',
        message = 'momo_ready_package_coherence_failed_v2';
    end if;
  elsif tg_table_name = 'veroxa_momo_ready_variants_v2' then
    if not exists (
      select 1
      from public.veroxa_momo_ready_packages_v2 ready
      join public.veroxa_momo_content_ai_runs run
        on run.id = ready.content_ai_run_id
      join lateral pg_catalog.jsonb_array_elements(
        run.output_payload -> 'variants'
      ) variant(value) on variant.value ->> 'platform' = new.platform
      where ready.id = new.ready_package_id
        and ready.restaurant_id = new.restaurant_id
        and variant.value ->> 'scheduleWindow' = 'unspecified'
        and variant.value ->> 'caption' = new.caption
        and variant.value -> 'cta' = new.call_to_action
        and variant.value -> 'claimIds' = new.claim_ids
        and run.output_payload ->> 'altText' = new.alt_text
        and new.hashtags = coalesce((
          select pg_catalog.jsonb_agg(hashtag.value ->> 'tag'
            order by selected.position)
          from pg_catalog.jsonb_array_elements_text(
            variant.value -> 'hashtagIds'
          ) with ordinality selected(id, position)
          join pg_catalog.jsonb_array_elements(
            run.output_payload -> 'hashtags'
          ) hashtag(value) on hashtag.value ->> 'id' = selected.id
        ), '[]'::jsonb)
        and new.seo_phrases = coalesce((
          select pg_catalog.jsonb_agg(phrase.value ->> 'phrase'
            order by selected.position)
          from pg_catalog.jsonb_array_elements_text(
            variant.value -> 'seoPhraseIds'
          ) with ordinality selected(id, position)
          join pg_catalog.jsonb_array_elements(
            run.output_payload -> 'seoPhrases'
          ) phrase(value) on phrase.value ->> 'id' = selected.id
        ), '[]'::jsonb)
    ) then
      raise exception using errcode = '23514',
        message = 'momo_ready_variant_coherence_failed_v2';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.momo_v2_coherence_guard()
  from public, anon, authenticated, service_role;

create trigger veroxa_momo_intake_attempts_v2_coherence
before insert on public.veroxa_momo_media_intake_attempts_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_identities_v2_coherence
before insert on public.veroxa_momo_media_canonical_identities_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_identity_links_v2_coherence
before insert on public.veroxa_momo_media_asset_identity_links_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_advances_v2_coherence
before insert on public.veroxa_momo_automation_advances_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_exception_incidents_v2_coherence
before insert or update on public.veroxa_momo_exception_incidents_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_exception_events_v2_coherence
before insert on public.veroxa_momo_exception_events_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_ready_packages_v2_coherence
before insert on public.veroxa_momo_ready_packages_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();
create trigger veroxa_momo_ready_variants_v2_coherence
before insert on public.veroxa_momo_ready_variants_v2
for each row execute function veroxa_private.momo_v2_coherence_guard();

-- Any automation failure that did not already persist richer validation
-- evidence still becomes one durable, consolidated Team exception.
create or replace function veroxa_private.momo_auto_failure_exception_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical_asset_id uuid;
  blockers jsonb;
  snapshot jsonb;
  canonical text;
  evidence_hash text;
begin
  if new.decision_mode = 'automation_policy_v2'
    and new.automation_policy_version =
      'momo-upload-veroxa-ready-2026-08-02-v2'
    and new.status = 'failed'
    and old.status is distinct from new.status
    and not exists (
      select 1
      from public.veroxa_momo_exception_events_v2 event
      where event.content_ai_run_id = new.id
        and event.stage in ('content_processing','content_validation')
    ) then
    select identity.canonical_asset_id into canonical_asset_id
    from public.veroxa_momo_media_canonical_identities_v2 identity
    where identity.id = new.automation_identity_id
      and identity.restaurant_id = new.restaurant_id;
    if canonical_asset_id is null then
      raise exception using errcode = '23514',
        message = 'momo_failure_identity_invalid_v2';
    end if;
    blockers := pg_catalog.jsonb_build_array(
      case when coalesce(new.provider_error_code, '') ~
          '^[a-z0-9][a-z0-9_]{1,79}$'
        then new.provider_error_code
        else 'content_processing_failed'
      end
    );
    snapshot := pg_catalog.jsonb_build_object(
      'runId', new.id,
      'requestHash', new.request_hash,
      'providerCalled', new.provider_called,
      'providerResponseRecorded', new.provider_response_id is not null,
      'accountingBasis', new.accounting_basis
    );
    canonical := veroxa_private.momo_canonical_json_v1(
      pg_catalog.jsonb_build_object(
        'stage', 'content_processing',
        'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
        'blockers', blockers,
        'warnings', '[]'::jsonb,
        'evidenceSnapshot', snapshot
      )
    );
    evidence_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(canonical, 'UTF8'), 'sha256'
    ), 'hex');
    perform veroxa_private.momo_upsert_exception_v2(
      new.restaurant_id, canonical_asset_id, new.source_asset_id, new.id,
      'content_processing', 'momo-upload-veroxa-ready-2026-08-02-v2',
      blockers, '[]'::jsonb, snapshot, canonical, evidence_hash
    );
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.momo_auto_failure_exception_v2()
  from public, anon, authenticated, service_role;
create trigger veroxa_momo_auto_failure_exception_v2
after update of status on public.veroxa_momo_content_ai_runs
for each row execute function veroxa_private.momo_auto_failure_exception_v2();

-- The single service-role RPC is an explicit operation allowlist. API callers
-- cannot write evidence tables directly, and webhook exception identity is
-- derived from the immutable run rather than supplied tenant/asset values.
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
begin
  if p_operation = 'record_intake_attempt' then
    return veroxa_private.momo_record_intake_attempt_v2(p_payload);
  elsif p_operation = 'advance_verified_asset' then
    return veroxa_private.momo_advance_verified_asset_v2(p_payload);
  elsif p_operation = 'record_exception' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
      'runId','requestHash','stage','policyVersion','blockers','warnings',
      'evidenceSnapshot','evidenceCanonical','evidenceSha256'
    ]) or p_payload ->> 'stage' <> 'content_validation'
      or p_payload ->> 'policyVersion' <>
        'momo-content-validator-2026-08-01-v4' then
      raise exception using errcode = '22023',
        message = 'invalid_momo_exception_operation_v2';
    end if;
    select * into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid
    for update;
    if run.id is null
      or run.request_hash is distinct from p_payload ->> 'requestHash'
      or run.decision_mode <> 'automation_policy_v2'
      or run.automation_policy_version <>
        'momo-upload-veroxa-ready-2026-08-02-v2' then
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
      run.restaurant_id, canonical_asset_id, run.source_asset_id, run.id,
      p_payload ->> 'stage', p_payload ->> 'policyVersion',
      p_payload -> 'blockers', p_payload -> 'warnings',
      p_payload -> 'evidenceSnapshot', p_payload ->> 'evidenceCanonical',
      p_payload ->> 'evidenceSha256'
    );
  elsif p_operation = 'materialize_veroxa_ready' then
    if not veroxa_private.momo_jsonb_exact_keys_v2(
      p_payload, array['runId','requestHash']
    ) then
      raise exception using errcode = '22023',
        message = 'invalid_momo_ready_operation_v2';
    end if;
    select * into run
    from public.veroxa_momo_content_ai_runs target
    where target.id = (p_payload ->> 'runId')::uuid
    for update;
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
revoke all on function public.veroxa_momo_upload_pipeline_v2(text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_upload_pipeline_v2(text,jsonb)
  to service_role;

-- Retire only the three legacy media fan-out jobs. Historical rows remain
-- queryable; non-media legacy jobs keep their original behavior through the
-- renamed implementation.
alter function public.veroxa_prepare_momo_ai_job_v1(uuid,text,text,uuid)
  rename to veroxa_prepare_momo_ai_job_legacy_v1;
revoke all on function
  public.veroxa_prepare_momo_ai_job_legacy_v1(uuid,text,text,uuid)
  from public, anon, authenticated, service_role;
create or replace function public.veroxa_prepare_momo_ai_job_v1(
  p_restaurant_id uuid,
  p_job_kind text,
  p_subject_type text,
  p_subject_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical_job_id uuid;
begin
  if p_job_kind in (
    'media_classification','media_quality','duplicate_detection'
  ) then
    if not public.veroxa_current_user_is_team_for_restaurant(
      p_restaurant_id
    ) then
      raise exception using errcode = '42501',
        message = 'momo_team_ai_job_required';
    end if;
    select job.id into canonical_job_id
    from public.veroxa_ai_jobs job
    where job.restaurant_id = p_restaurant_id
      and job.job_kind = p_job_kind
      and job.subject_type = p_subject_type
      and job.subject_id = p_subject_id
      and job.superseded_by_job_id is null
    order by job.created_at, job.id
    limit 1;
    if canonical_job_id is not null then
      return canonical_job_id;
    end if;
    raise exception using errcode = '55000',
      message = 'momo_media_ai_managed_by_upload_pipeline_v2';
  end if;
  return public.veroxa_prepare_momo_ai_job_legacy_v1(
    p_restaurant_id, p_job_kind, p_subject_type, p_subject_id
  );
end;
$$;
revoke all on function public.veroxa_prepare_momo_ai_job_v1(
  uuid,text,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_prepare_momo_ai_job_v1(
  uuid,text,text,uuid
) to authenticated;

-- Browser reads are Team-only and tenant scoped. All writes flow through the
-- owner-executed functions above; even service_role has no direct table grant.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_momo_media_intake_attempts_v2',
    'veroxa_momo_media_canonical_identities_v2',
    'veroxa_momo_media_asset_identity_links_v2',
    'veroxa_momo_automation_advances_v2',
    'veroxa_momo_exception_incidents_v2',
    'veroxa_momo_exception_events_v2',
    'veroxa_momo_ready_packages_v2',
    'veroxa_momo_ready_variants_v2'
  ] loop
    execute pg_catalog.format(
      'alter table public.%I enable row level security', table_name
    );
    execute pg_catalog.format(
      'alter table public.%I force row level security', table_name
    );
    execute pg_catalog.format(
      'revoke all on table public.%I from public, anon, authenticated, service_role',
      table_name
    );
    execute pg_catalog.format(
      'grant select on table public.%I to authenticated', table_name
    );
    execute pg_catalog.format(
      'create trigger %I before insert or update of restaurant_id on public.%I '
      || 'for each row execute function veroxa_private.enforce_momo_operational_row()',
      table_name || '_momo_scope', table_name
    );
  end loop;
end;
$$;

create policy veroxa_momo_intake_attempts_v2_team_select
on public.veroxa_momo_media_intake_attempts_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_identities_v2_team_select
on public.veroxa_momo_media_canonical_identities_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_identity_links_v2_team_select
on public.veroxa_momo_media_asset_identity_links_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_advances_v2_team_select
on public.veroxa_momo_automation_advances_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_exception_incidents_v2_team_select
on public.veroxa_momo_exception_incidents_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_exception_events_v2_team_select
on public.veroxa_momo_exception_events_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_ready_packages_v2_team_select
on public.veroxa_momo_ready_packages_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
create policy veroxa_momo_ready_variants_v2_team_select
on public.veroxa_momo_ready_variants_v2
for select to authenticated
using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id));
