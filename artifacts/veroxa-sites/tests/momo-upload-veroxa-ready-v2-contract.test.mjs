import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL(
  "../supabase/migrations/20260802063124_momo_upload_veroxa_ready_v2.sql",
  import.meta.url,
), "utf8");
const queryIndexesMigration = await readFile(new URL(
  "../supabase/migrations/20260802063829_momo_pipeline_query_indexes_v2.sql",
  import.meta.url,
), "utf8");
const lifecycle = await readFile(new URL(
  "../supabase/functions/momo-content-ai-lifecycle/index.ts",
  import.meta.url,
), "utf8");
const lifecycleContract = await readFile(new URL(
  "../supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  import.meta.url,
), "utf8");
const webhookLifecycle = await readFile(new URL(
  "../supabase/functions/momo-content-ai-webhook-lifecycle/index.ts",
  import.meta.url,
), "utf8");
const webhookCore = await readFile(new URL(
  "../app/api/openai/webhook/core.ts",
  import.meta.url,
), "utf8");
const finalizeCore = await readFile(new URL(
  "../app/api/media/finalize/core.ts",
  import.meta.url,
), "utf8");
const finalizeRoute = await readFile(new URL(
  "../app/api/media/finalize/route.ts",
  import.meta.url,
), "utf8");

const V2_TABLES = [
  "veroxa_momo_media_intake_attempts_v2",
  "veroxa_momo_media_canonical_identities_v2",
  "veroxa_momo_media_asset_identity_links_v2",
  "veroxa_momo_automation_advances_v2",
  "veroxa_momo_exception_incidents_v2",
  "veroxa_momo_exception_events_v2",
  "veroxa_momo_ready_packages_v2",
  "veroxa_momo_ready_variants_v2",
];

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `${startMarker} must exist`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `${endMarker} must follow ${startMarker}`);
  return source.slice(start, end);
}

const advance = between(
  migration,
  "create or replace function veroxa_private.momo_advance_verified_asset_v2(",
  "revoke all on function veroxa_private.momo_advance_verified_asset_v2(jsonb)",
);
const currentEvidence = between(
  migration,
  "create or replace function veroxa_private.momo_content_ai_current_evidence_v1(",
  "revoke all on function veroxa_private.momo_content_ai_current_evidence_v1(uuid,uuid)",
);
const safeRetryParent = between(
  migration,
  "veroxa_private.momo_content_ai_safe_retry_parent_v2(",
  "revoke all on function\n  veroxa_private.momo_content_ai_safe_retry_parent_v2(uuid,uuid,uuid,text,uuid)",
);
const runIdentityGuard = between(
  migration,
  "create or replace function veroxa_private.momo_automation_run_identity_guard_v2()",
  "revoke all on function\n  veroxa_private.momo_automation_run_identity_guard_v2()",
);
const providerBoundaryGuard = between(
  migration,
  "create or replace function\n  veroxa_private.momo_automation_provider_boundary_guard_v2()",
  "revoke all on function\n  veroxa_private.momo_automation_provider_boundary_guard_v2()",
);
const materialize = between(
  migration,
  "create or replace function veroxa_private.momo_materialize_veroxa_ready_v2(",
  "revoke all on function veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)",
);
const postProviderEvidence = between(
  migration,
  "create or replace function veroxa_private.momo_content_ai_post_provider_evidence_v2(",
  "revoke all on function\n  veroxa_private.momo_content_ai_post_provider_evidence_v2(uuid)",
);
const coherence = between(
  migration,
  "create or replace function veroxa_private.momo_v2_coherence_guard()",
  "revoke all on function veroxa_private.momo_v2_coherence_guard()",
);
const wrapper = between(
  migration,
  "create or replace function public.veroxa_momo_upload_pipeline_v2(",
  "-- Retire only the three legacy media fan-out jobs.",
);
const rls = migration.slice(migration.indexOf("-- Browser reads are Team-only"));

test("exact-byte identity replaces asset hash uniqueness and duplicates still reach canonical reservation", () => {
  assert.match(migration, /drop index if exists public\.veroxa_media_assets_hash_unique;/u);
  assert.match(migration, /create index if not exists veroxa_media_assets_hash_lookup_v2\s+on public\.veroxa_media_assets \(restaurant_id, content_sha256\)\s+where content_sha256 is not null;/u);
  assert.doesNotMatch(migration, /create unique index(?: if not exists)? veroxa_media_assets_hash_lookup_v2/u);

  const identities = between(
    migration,
    "create table public.veroxa_momo_media_canonical_identities_v2",
    "create table public.veroxa_momo_media_asset_identity_links_v2",
  );
  assert.match(identities, /identity_method text not null default 'sha256_exact_bytes'/u);
  assert.match(identities, /unique \(restaurant_id, content_sha256\)/u);
  assert.match(advance, /v_duplicate := v_asset_id <> v_identity\.canonical_asset_id;/u);
  assert.match(advance, /case when v_duplicate then 'exact_duplicate' else 'canonical' end/u);

  const duplicateDecision = advance.indexOf("v_duplicate :=");
  const canonicalReservation = advance.indexOf("if v_run_id is null then", duplicateDecision);
  const finalReturn = advance.indexOf("return pg_catalog.jsonb_build_object", canonicalReservation);
  assert.ok(duplicateDecision >= 0 && canonicalReservation > duplicateDecision);
  assert.ok(finalReturn > canonicalReservation);
  assert.doesNotMatch(
    advance.slice(duplicateDecision, canonicalReservation),
    /\breturn\b/u,
    "an exact duplicate must not return before canonical Ready/run reconciliation",
  );
  assert.equal((advance.match(/\breturn\b/gu) || []).length, 1);
  assert.match(advance, /'duplicateAssetId', case when v_duplicate then v_asset_id else null end/u);
  assert.match(advance, /from public\.veroxa_media_assets asset[\s\S]*?for share;/u);
  assert.match(advance, /momo_resolve_exceptions_v2\(\s*v_restaurant_id, v_asset_id, null, 'intake_verified'/u);
  assert.match(migration, /p_resolution = 'intake_verified'[\s\S]*?target\.stage = 'media_intake'/u);
  assert.match(migration, /coalesce\(p_run_id::text, 'no-run'\)/u);
  assert.match(advance, /'authorizationPolicy', 'single_current_exact_link_rights'[\s\S]*?'duplicateRightsCombined', false[\s\S]*?'externalWriteAllowed', false/u);
  assert.match(advance, /momo_resolve_exceptions_v2\([\s\S]*?'duplicate_rights_isolated'[\s\S]*?v_reasons := '\[\]'::jsonb/u);
  assert.match(migration, /p_resolution = 'duplicate_rights_isolated'[\s\S]*?target\.stage = 'rights_reconciliation'/u);
});

test("processing selects one deterministic current exact link and never unions or copies rights", () => {
  const processingSelection = between(
    advance,
    "-- Canonical identity is permanent, but processing authorization belongs to",
    "if v_processing_asset_id is not null then",
  );
  assert.match(processingSelection, /from public\.veroxa_momo_media_asset_identity_links_v2 link/u);
  assert.match(processingSelection, /verification\.id = link\.verification_id[\s\S]*?verification\.asset_id = asset\.id/u);
  assert.match(processingSelection, /rights\.id = link\.rights_id[\s\S]*?rights\.asset_id = asset\.id/u);
  assert.match(processingSelection, /object\.id = verification\.storage_object_id/u);
  assert.match(processingSelection, /link\.identity_id = v_identity\.id[\s\S]*?link\.canonical_asset_id = v_identity\.canonical_asset_id[\s\S]*?link\.content_sha256 = v_identity\.content_sha256/u);
  assert.match(processingSelection, /rights\.attestation_sha256 = link\.rights_attestation_sha256/u);
  assert.match(processingSelection, /rights\.rights_status = 'confirmed'[\s\S]*?rights\.evidence_class = 'real_owner'[\s\S]*?rights\.attestation_version = 'momo-media-rights-v1'/u);
  assert.match(processingSelection, /rights\.valid_from is null or rights\.valid_from <= pg_catalog\.now\(\)[\s\S]*?rights\.expires_at is null or rights\.expires_at > pg_catalog\.now\(\)/u);
  assert.match(processingSelection, /order by \(link\.asset_id = v_identity\.canonical_asset_id\) desc,\s*verification\.verified_at, verification\.id\s*limit 1;/u);

  const platformDerivation = between(
    advance,
    "select coalesce(pg_catalog.jsonb_agg(platform order by platform), '[]'::jsonb)",
    "select * into v_budget",
  );
  assert.match(platformDerivation, /jsonb_array_elements_text\(v_processing_rights\.usage_scope\)/u);
  assert.doesNotMatch(platformDerivation, /v_(?:canonical_)?rights\.usage_scope/u);

  const executableAdvance = advance.replace(/^\s*--.*$/gmu, "");
  assert.doesNotMatch(executableAdvance, /\bunion\b/iu);
  assert.doesNotMatch(executableAdvance, /\b(?:insert into|update)\s+public\.veroxa_media_rights\b/iu);
});

test("automation identity, initiator, and advance actor lineage are immutable and identity-scoped", () => {
  assert.match(migration, /add column if not exists automation_identity_id uuid,[\s\S]*?add column if not exists automation_initiated_by uuid\s+references public\.veroxa_user_profiles\(user_id\) on delete restrict,[\s\S]*?add column if not exists automation_retry_of_run_id uuid,[\s\S]*?add column if not exists automation_retry_generation smallint not null\s+default 0/u);
  assert.match(migration, /decision_mode = 'automation_policy_v2'[\s\S]*?automation_identity_id is not null[\s\S]*?automation_initiated_by is not null[\s\S]*?automation_retry_generation = 0\s+and automation_retry_of_run_id is null[\s\S]*?automation_retry_generation = 1\s+and automation_retry_of_run_id is not null/u);
  assert.match(migration, /foreign key \(automation_identity_id\)\s+references public\.veroxa_momo_media_canonical_identities_v2\(id\)\s+on delete restrict/u);
  assert.match(migration, /foreign key \(automation_retry_of_run_id\)\s+references public\.veroxa_momo_content_ai_runs\(id\)\s+on delete restrict/u);
  assert.match(migration, /create unique index veroxa_momo_content_ai_one_retry_child_v2\s+on public\.veroxa_momo_content_ai_runs \(automation_retry_of_run_id\)\s+where automation_retry_of_run_id is not null;/u);
  assert.match(migration, /create unique index veroxa_momo_content_ai_one_active_identity_v2\s+on public\.veroxa_momo_content_ai_runs\s+\(restaurant_id, automation_identity_id\)\s+where decision_mode = 'automation_policy_v2'\s+and automation_identity_id is not null\s+and status in \('reserved','provider_running','result_staged'\);/u);

  const advancesTable = between(
    migration,
    "create table public.veroxa_momo_automation_advances_v2",
    "create table public.veroxa_momo_exception_incidents_v2",
  );
  assert.match(advancesTable, /actor_id uuid not null references public\.veroxa_user_profiles\(user_id\) on delete restrict/u);
  assert.match(advancesTable, /processing_asset_id uuid references public\.veroxa_media_assets\(id\) on delete restrict/u);
  assert.match(advancesTable, /check \(outcome = 'exception' or processing_asset_id is not null\)/u);

  assert.match(runIdentityGuard, /new\.automation_identity_id is distinct from old\.automation_identity_id/u);
  assert.match(runIdentityGuard, /new\.automation_initiated_by is distinct from old\.automation_initiated_by/u);
  assert.match(runIdentityGuard, /new\.automation_retry_of_run_id is distinct from\s+old\.automation_retry_of_run_id/u);
  assert.match(runIdentityGuard, /new\.automation_retry_generation is distinct from\s+old\.automation_retry_generation/u);
  assert.match(runIdentityGuard, /new\.requested_by is distinct from old\.requested_by/u);
  assert.match(runIdentityGuard, /link\.asset_id = new\.source_asset_id[\s\S]*?link\.verification_id = new\.intake_verification_id[\s\S]*?link\.rights_id = new\.rights_id[\s\S]*?link\.rights_attestation_sha256 = new\.rights_attestation_sha256/u);
  assert.match(runIdentityGuard, /identity\.id = new\.automation_identity_id[\s\S]*?identity\.content_sha256 = new\.source_content_sha256/u);
  assert.match(runIdentityGuard, /momo_actor_has_operational_membership_v1\(\s*new\.restaurant_id, new\.automation_initiated_by/u);

  const runInsert = between(
    advance,
    "insert into public.veroxa_momo_content_ai_runs (",
    ") returning id into v_run_id;",
  );
  assert.match(runInsert, /automation_policy_version, automation_identity_id,\s*automation_initiated_by, automation_retry_of_run_id,\s*automation_retry_generation/u);
  assert.match(runInsert, /v_client_request_hash, v_request_hash, v_budget\.authorized_by, 6000000/u);
  assert.match(runInsert, /'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',\s*v_identity\.id, v_actor_id, v_retry_parent\.id, v_retry_generation/u);

  const advanceInsert = between(
    advance,
    "insert into public.veroxa_momo_automation_advances_v2 (",
    "on conflict (restaurant_id, idempotency_sha256) do nothing;",
  );
  assert.match(advanceInsert, /source_asset_id, actor_id,\s*processing_asset_id/u);
  assert.match(advanceInsert, /v_restaurant_id, v_identity\.id, v_asset_id, v_actor_id,\s*v_processing_asset_id/u);
});

test("only one conclusively pristine zero-provider failure can create an immutable retry child", () => {
  assert.match(safeRetryParent, /run\.automation_retry_generation = 0\s+and run\.automation_retry_of_run_id is null/u);
  assert.match(safeRetryParent, /run\.status = 'failed'\s+and not run\.provider_called\s+and run\.provider_started_at is null\s+and run\.provider_response_id is null\s+and run\.dispatch_claim_token is null/u);
  assert.match(safeRetryParent, /run\.provider_usage is null[\s\S]*?run\.output_payload is null[\s\S]*?run\.validation_report is null[\s\S]*?run\.accounted_microusd = 0\s+and run\.accounting_basis = 'zero_pre_provider'/u);
  assert.match(safeRetryParent, /dispatch\.state = 'terminal'[\s\S]*?dispatch\.dispatch_claim_token is null[\s\S]*?dispatch\.provider_request_sha256 is null[\s\S]*?dispatch\.send_intent_at is null[\s\S]*?dispatch\.provider_response_id is null[\s\S]*?dispatch\.reconciliation_required_at is null[\s\S]*?dispatch\.terminal_at is not null/u);
  assert.match(safeRetryParent, /ledger\.state = 'released'\s+and not ledger\.provider_called[\s\S]*?ledger\.accounted_microusd = 0\s+and ledger\.accounting_basis = 'zero_pre_provider'/u);
  for (const forbiddenEvidence of [
    "momo_content_ai_dispatch_claims",
    "momo_content_ai_dispatch_prepost_aborts",
    "momo_content_ai_result_outbox",
    "momo_content_ai_webhook_events",
    "momo_content_ai_recovery_wakes",
    "momo_content_ai_provider_rejection_receipts",
  ]) {
    assert.match(safeRetryParent, new RegExp(
      `not exists \\(\\s*select 1\\s*from veroxa_private\\.${forbiddenEvidence}`,
      "u",
    ));
  }

  assert.match(runIdentityGuard, /momo_content_ai_safe_retry_parent_v2\(\s*new\.automation_retry_of_run_id, new\.restaurant_id,\s*new\.automation_identity_id, new\.request_hash, new\.requested_by/u);
  assert.match(runIdentityGuard, /new\.automation_retry_generation <> 0[\s\S]*?'momo-content-auto-v2:' \|\| new\.request_hash/u);
  assert.match(runIdentityGuard, /parent\.source_asset_id = new\.source_asset_id[\s\S]*?parent\.intake_verification_id = new\.intake_verification_id[\s\S]*?parent\.rights_id = new\.rights_id[\s\S]*?parent\.truth_snapshot_sha256 = new\.truth_snapshot_sha256[\s\S]*?parent\.client_request_hash = new\.client_request_hash[\s\S]*?parent\.request_hash = new\.request_hash/u);
  assert.match(runIdentityGuard, /'momo-content-auto-v2-retry:1:' \|\| parent\.id::text \|\| ':' \|\|\s*new\.request_hash/u);

  assert.match(advance, /if v_existing_run\.status = 'failed'\s+and veroxa_private\.momo_content_ai_safe_retry_parent_v2\([\s\S]*?v_retry_parent := v_existing_run;\s+v_retry_generation := 1;[\s\S]*?'momo-content-auto-v2-retry:1:' \|\| v_retry_parent\.id::text \|\| ':' \|\|\s*v_request_hash/u);
  assert.match(advance, /automation_initiated_by, automation_retry_of_run_id,\s*automation_retry_generation[\s\S]*?v_identity\.id, v_actor_id, v_retry_parent\.id, v_retry_generation/u);
  assert.match(advance, /else\s+-- A provider-called, response-bearing, send-intent, uncertain, or\s+-- already retried failure is immutable and never regenerated\.[\s\S]*?v_outcome := case when v_existing_run\.status = 'failed'\s+then 'exception' else 'replayed' end/u);
  assert.doesNotMatch(migration, /automation_retry_generation = 2|v_retry_generation := 2/u);
});

test("the v2 write wrapper is service-only and every v2 read table is Team tenant-scoped", () => {
  assert.match(wrapper, /security definer\s+set search_path = ''/u);
  for (const operation of [
    "record_intake_attempt",
    "advance_verified_asset",
    "record_exception",
    "materialize_veroxa_ready",
  ]) assert.match(wrapper, new RegExp(`p_operation = '${operation}'`, "u"));
  assert.match(wrapper, /message = 'invalid_momo_upload_pipeline_operation_v2'/u);
  assert.match(wrapper, /revoke all on function public\.veroxa_momo_upload_pipeline_v2\(text,jsonb\)\s+from public, anon, authenticated, service_role;/u);
  assert.match(wrapper, /grant execute on function public\.veroxa_momo_upload_pipeline_v2\(text,jsonb\)\s+to service_role;/u);
  assert.doesNotMatch(wrapper, /grant execute[\s\S]*?to (?:anon|authenticated)/u);

  const tableLoop = rls.match(/foreach table_name in array array\[(?<tables>[\s\S]*?)\]\s+loop/u);
  assert.ok(tableLoop?.groups?.tables, "the exact v2 RLS table allowlist must exist");
  const scopedTables = [...tableLoop.groups.tables.matchAll(/'([^']+)'/gu)].map((match) => match[1]);
  assert.deepEqual(scopedTables, V2_TABLES);
  assert.match(rls, /alter table public\.%I enable row level security/u);
  assert.match(rls, /alter table public\.%I force row level security/u);
  assert.match(rls, /revoke all on table public\.%I from public, anon, authenticated, service_role/u);
  assert.match(rls, /grant select on table public\.%I to authenticated/u);
  assert.match(rls, /execute function veroxa_private\.enforce_momo_operational_row\(\)/u);

  for (const table of V2_TABLES) {
    assert.match(rls, new RegExp(
      `create policy [a-z0-9_]+\\s+on public\\.${table}\\s+for select to authenticated\\s+using \\(public\\.veroxa_current_user_is_team_for_restaurant\\(restaurant_id\\)\\);`,
      "u",
    ));
  }
});

test("immutable evidence is append-only and all repeated tenant keys have coherence guards", () => {
  assert.match(migration, /message = 'momo_v2_evidence_is_append_only'/u);
  const immutableTriggers = new Map([
    ["veroxa_momo_media_intake_attempts_v2", "veroxa_momo_intake_attempts_v2_append_only"],
    ["veroxa_momo_media_canonical_identities_v2", "veroxa_momo_identities_v2_append_only"],
    ["veroxa_momo_media_asset_identity_links_v2", "veroxa_momo_identity_links_v2_append_only"],
    ["veroxa_momo_automation_advances_v2", "veroxa_momo_advances_v2_append_only"],
    ["veroxa_momo_exception_events_v2", "veroxa_momo_exception_events_v2_append_only"],
    ["veroxa_momo_ready_packages_v2", "veroxa_momo_ready_packages_v2_append_only"],
    ["veroxa_momo_ready_variants_v2", "veroxa_momo_ready_variants_v2_append_only"],
  ]);
  for (const [table, trigger] of immutableTriggers) {
    assert.match(migration, new RegExp(
      `create trigger ${trigger}\\s+before update or delete on public\\.${table}\\s+for each row execute function veroxa_private\\.momo_v2_append_only_guard\\(\\);`,
      "u",
    ));
  }
  assert.doesNotMatch(migration, /create trigger veroxa_momo_exception_incidents_v2_append_only/u);

  const coherenceTriggers = new Map([
    ["veroxa_momo_media_intake_attempts_v2", "veroxa_momo_intake_attempts_v2_coherence"],
    ["veroxa_momo_media_canonical_identities_v2", "veroxa_momo_identities_v2_coherence"],
    ["veroxa_momo_media_asset_identity_links_v2", "veroxa_momo_identity_links_v2_coherence"],
    ["veroxa_momo_automation_advances_v2", "veroxa_momo_advances_v2_coherence"],
    ["veroxa_momo_exception_incidents_v2", "veroxa_momo_exception_incidents_v2_coherence"],
    ["veroxa_momo_exception_events_v2", "veroxa_momo_exception_events_v2_coherence"],
    ["veroxa_momo_ready_packages_v2", "veroxa_momo_ready_packages_v2_coherence"],
    ["veroxa_momo_ready_variants_v2", "veroxa_momo_ready_variants_v2_coherence"],
  ]);
  for (const [table, trigger] of coherenceTriggers) {
    assert.match(coherence, new RegExp(`tg_table_name = '${table}'`, "u"));
    const event = table === "veroxa_momo_exception_incidents_v2"
      ? "before insert or update"
      : "before insert";
    assert.match(migration, new RegExp(
      `create trigger ${trigger}\\s+${event} on public\\.${table}\\s+for each row execute function veroxa_private\\.momo_v2_coherence_guard\\(\\);`,
      "u",
    ));
  }
});

test("v2 query indexes cover only exercised client, Team, and lifecycle reads", () => {
  for (const index of [
    "veroxa_momo_content_ai_runs_identity_latest_v2_idx",
    "veroxa_momo_intake_attempts_source_latest_v2_idx",
    "veroxa_momo_exception_events_run_stage_v2_idx",
    "veroxa_momo_exception_events_restaurant_latest_v2_idx",
    "veroxa_momo_identity_links_restaurant_latest_v2_idx",
    "veroxa_momo_ready_packages_identity_latest_v2_idx",
    "veroxa_momo_ready_variants_restaurant_platform_v2_idx",
  ]) {
    assert.match(queryIndexesMigration, new RegExp(`create index if not exists ${index}`));
  }
  assert.doesNotMatch(queryIndexesMigration, /superseded_by_job_id|automation_initiated_by/);
});

test("a new identity reservation binds requested_by to the current active Team budget authorizer", () => {
  assert.match(advance, /from veroxa_private\.momo_ai_budget_controls control[\s\S]*?where control\.restaurant_id = v_restaurant_id[\s\S]*?for update;/u);
  assert.match(advance, /v_budget\.restaurant_id is null or not v_budget\.enabled/u);
  assert.match(advance, /v_budget\.external_publishing_authorized/u);
  assert.match(advance, /member\.user_id = v_budget\.authorized_by/u);
  assert.match(advance, /member\.role = 'team' and member\.status = 'active'/u);
  assert.match(advance, /profile\.role = 'team' and profile\.status = 'active'/u);
  assert.match(advance, /momo_ai_committed_microusd_v1\(v_restaurant_id\)\s+\+ 6000000 > v_budget\.authorization_cap_microusd/u);
  assert.match(advance, /runtime\.ai_live_calls[\s\S]*?not runtime\.provider_writes and not runtime\.review_replies[\s\S]*?not runtime\.website_writes and not runtime\.external_scheduling/u);
  assert.match(runIdentityGuard, /budget\.enabled[\s\S]*?not budget\.external_publishing_authorized[\s\S]*?budget\.authorized_by = new\.requested_by/u);
  assert.match(runIdentityGuard, /momo_media_ai_actor_has_operational_team_v1\(\s*new\.restaurant_id, new\.requested_by/u);
  assert.match(currentEvidence, /p_actor_id = run\.requested_by/u);
  assert.match(currentEvidence, /budget\.authorized_by = run\.requested_by/u);
});

test("request, run, replay, and advance hashes bind the selected processing evidence and authorizer", () => {
  const requestHashAt = advance.indexOf("v_request_hash :=");
  assert.ok(requestHashAt >= 0, "processing request hashing must exist");
  const requestHashEnd = advance.indexOf("v_idempotency_hash :=", requestHashAt);
  assert.ok(requestHashEnd > requestHashAt);
  const requestHash = advance.slice(requestHashAt, requestHashEnd);
  for (const input of [
    "v_client_request_hash",
    "v_identity.canonical_asset_id::text",
    "v_identity.id::text",
    "v_processing_asset_id::text",
    "v_processing_verification.id::text",
    "v_processing_verification.storage_object_id::text",
    "v_processing_verification.storage_object_version",
    "v_identity.content_sha256",
    "v_processing_rights.id::text",
    "v_processing_rights.attestation_sha256",
    "v_budget.authorized_by::text",
    "v_truth_hash",
    "v_platforms::text",
    "'automation_policy_v2'",
  ]) assert.ok(requestHash.includes(input), `${input} must bind the request hash`);
  assert.match(advance, /v_idempotency_hash :=[\s\S]*?'momo-content-auto-v2:' \|\| v_request_hash/u);
  assert.match(advance, /v_retry_generation := 1;[\s\S]*?v_idempotency_hash :=[\s\S]*?'momo-content-auto-v2-retry:1:' \|\| v_retry_parent\.id::text \|\| ':' \|\|\s*v_request_hash/u);

  const outcomeComplete = advance.indexOf("if v_outcome is null then");
  const advanceHashAt = advance.indexOf("v_advance_hash :=");
  assert.ok(outcomeComplete >= 0 && advanceHashAt > outcomeComplete,
    "advance idempotency must be derived only after outcome and run selection");
  const advanceHash = advance.slice(
    advanceHashAt,
    advance.indexOf("insert into public.veroxa_momo_automation_advances_v2", advanceHashAt),
  );
  assert.match(advanceHash, /'momo-advance-transition-v2:' \|\|/u);
  for (const field of [
    ["verificationId", "v_verification_id"],
    ["identityId", "v_identity.id"],
    ["actorId", "v_actor_id"],
    ["requestHash", "v_request_hash"],
    ["outcome", "v_outcome"],
    ["runId", "v_run_id"],
    ["reasonCodes", "v_reasons"],
  ]) assert.match(advanceHash, new RegExp(`'${field[0]}', ${field[1].replace(".", "\\.")}`, "u"));

  const runInsert = between(
    advance,
    "insert into public.veroxa_momo_content_ai_runs (",
    ") returning id into v_run_id;",
  );
  assert.match(runInsert, /v_restaurant_id, v_processing_asset_id,\s*v_processing_verification\.id,\s*v_processing_verification\.storage_path,\s*v_processing_verification\.storage_object_id,\s*v_processing_verification\.storage_object_version/u);
  assert.match(runInsert, /v_processing_verification\.content_sha256,\s*v_processing_rights\.id, v_processing_rights\.attestation_sha256, null/u);
  assert.match(runInsert, /v_client_request_hash, v_request_hash, v_budget\.authorized_by, 6000000/u);
  assert.match(runInsert, /v_identity\.id, v_actor_id, v_retry_parent\.id, v_retry_generation/u);

  const replayQueries = [...advance.matchAll(/select run\.\* into v_existing_run[\s\S]*?;/gu)];
  assert.ok(replayQueries.length >= 1, "active/idempotent replay lookup must exist");
  for (const replay of replayQueries) {
    assert.ok(
      requestHashAt < replay.index,
      "the full current request identity must be computed before any run replay",
    );
    assert.match(
      replay[0],
      /run\.(?:request_hash = v_request_hash|idempotency_hash = v_idempotency_hash)/u,
      "a mutable-evidence-only lookup must not replay a differently bound request",
    );
  }
  assert.match(advance, /run\.automation_identity_id = v_identity\.id[\s\S]*?run\.source_asset_id = v_processing_asset_id[\s\S]*?run\.request_hash = v_request_hash[\s\S]*?run\.idempotency_hash = v_idempotency_hash/u);
  assert.match(advance, /v_existing_run\.request_hash is distinct from v_request_hash/u);
  assert.match(advance, /v_existing_run\.automation_identity_id is distinct from v_identity\.id/u);
  assert.match(advance, /v_existing_run\.source_asset_id is distinct from v_processing_asset_id/u);
  assert.match(advance, /v_existing_run\.rights_id is distinct from v_processing_rights\.id/u);
  assert.match(advance, /v_existing_run\.rights_attestation_sha256 is distinct from\s+v_processing_rights\.attestation_sha256/u);
  assert.match(advance, /v_existing_run\.target_platforms is distinct from v_platforms/u);
  assert.match(advance, /v_existing_run\.truth_snapshot_sha256 is distinct from v_truth_hash/u);
  assert.match(advance, /v_existing_run\.requested_by is distinct from\s+v_budget\.authorized_by/u);
});

test("standing authorizer checks stop at the provider boundary while settlement remains recoverable", () => {
  assert.match(providerBoundaryGuard, /old\.status = 'reserved'\s+and new\.status = 'provider_running'\s+and new\.decision_mode = 'automation_policy_v2'/u);
  assert.match(providerBoundaryGuard, /momo_content_ai_current_evidence_v1\(\s*old\.id, old\.requested_by/u);
  assert.match(providerBoundaryGuard, /ledger\.state = 'reserved'[\s\S]*?not ledger\.provider_called[\s\S]*?ledger\.accounted_microusd is null/u);
  assert.match(providerBoundaryGuard, /runtime\.ai_live_calls[\s\S]*?not runtime\.provider_writes[\s\S]*?not runtime\.external_scheduling/u);
  assert.match(migration, /before update of status,provider_called\s+on public\.veroxa_momo_content_ai_runs\s+for each row execute function\s+veroxa_private\.momo_automation_provider_boundary_guard_v2\(\);/u);

  assert.match(postProviderEvidence, /ledger\.state = 'settled'[\s\S]*?ledger\.provider_called/u);
  assert.match(postProviderEvidence, /rights\.attestation_sha256 = run\.rights_attestation_sha256/u);
  assert.match(postProviderEvidence, /current_momo_truth_snapshot_v1\(run\.restaurant_id\)/u);
  for (const staleAuthorizationDependency of [
    "momo_ai_budget_controls",
    "requested_by",
    "authorized_by",
    "momo_media_ai_actor_has_operational_team_v1",
    "momo_actor_has_operational_membership_v1",
  ]) {
    assert.ok(
      !postProviderEvidence.includes(staleAuthorizationDependency),
      `post-provider evidence must not depend on ${staleAuthorizationDependency}`,
    );
  }
});

test("Ready materializes only from an applied outbox and current processing-source post-provider evidence", () => {
  const outboxReady = between(
    migration,
    "create or replace function veroxa_private.momo_auto_ready_after_outbox_v2()",
    "-- Every immutable child repeats its tenant and evidence keys",
  );
  assert.match(outboxReady, /new\.state = 'applied' and old\.state is distinct from new\.state/u);
  assert.match(outboxReady, /run\.decision_mode = 'automation_policy_v2'/u);
  assert.match(outboxReady, /perform veroxa_private\.momo_materialize_veroxa_ready_v2/u);
  assert.match(outboxReady, /create trigger veroxa_momo_auto_ready_after_outbox_v2\s+after update of state on veroxa_private\.momo_content_ai_result_outbox/u);

  assert.match(materialize, /v_run\.request_hash is distinct from v_request_hash/u);
  assert.match(materialize, /momo_canonical_payload_matches_v1\(\s*v_run\.output_payload, v_run\.output_canonical, v_run\.output_sha256/u);
  assert.match(materialize, /momo_canonical_payload_matches_v1\(\s*v_run\.validation_report, v_run\.validation_canonical,[\s\S]*?v_run\.validation_sha256/u);
  assert.match(materialize, /momo_current_content_contract_valid_v1\(\s*v_run\.output_payload, v_run\.target_platforms, v_run\.truth_snapshot/u);
  assert.match(materialize, /variant ->> 'scheduleWindow' is distinct from 'unspecified'/u);
  assert.match(materialize, /momo_content_ai_post_provider_evidence_v2\(\s*v_run\.id/u);
  assert.match(materialize, /outbox\.state = 'applied'[\s\S]*?outbox\.output_sha256 = v_run\.output_sha256[\s\S]*?outbox\.validation_sha256 = v_run\.validation_sha256/u);
  assert.match(materialize, /'status', 'veroxa_ready',[\s\S]*?'externalWriteAllowed', false/u);
  for (const edge of [lifecycle, webhookLifecycle]) {
    assert.match(edge, /body\.operation === "complete_staged"[\s\S]*?p_operation: "materialize_veroxa_ready"/u);
  }
  assert.match(webhookCore, /claim\.status === "pending_review"[\s\S]*?dependencies\.completeStaged\(identity\)[\s\S]*?outcome: "processed"/u);

  assert.match(postProviderEvidence, /object\.version = run\.source_storage_object_version/u);
  assert.match(postProviderEvidence, /rights\.attestation_sha256 = run\.rights_attestation_sha256/u);
  assert.match(postProviderEvidence, /current_momo_truth_snapshot_v1\(run\.restaurant_id\)/u);
  assert.match(postProviderEvidence, /ledger\.state = 'settled'[\s\S]*?ledger\.provider_called/u);
  assert.match(postProviderEvidence, /not runtime\.provider_writes[\s\S]*?not runtime\.external_scheduling/u);

  const readyTables = between(
    migration,
    "create table public.veroxa_momo_ready_packages_v2",
    "create index veroxa_momo_ready_packages_v2_latest",
  );
  assert.doesNotMatch(readyTables, /scheduled_for|timezone|publish(?:ed|ing)?/iu);
});

test("Ready, exceptions, and coherence preserve canonical A with exact-linked processing source B", () => {
  assert.match(materialize, /where link\.asset_id = v_run\.source_asset_id\s+and link\.identity_id = v_run\.automation_identity_id\s+and link\.canonical_asset_id = identity\.canonical_asset_id/u);
  assert.match(materialize, /v_identity\.canonical_asset_id, v_run\.source_asset_id,\s*v_run\.intake_verification_id, v_run\.rights_id/u);
  assert.doesNotMatch(materialize, /v_run\.source_asset_id\s*(?:=|is not distinct from)\s*v_identity\.canonical_asset_id/u);

  assert.match(coherence, /processing_link\.identity_id = new\.identity_id[\s\S]*?processing_link\.asset_id = new\.processing_asset_id[\s\S]*?processing_link\.canonical_asset_id = new\.canonical_asset_id/u);
  assert.match(coherence, /run\.automation_identity_id = new\.identity_id[\s\S]*?new\.outcome = 'exception'\s+or run\.source_asset_id = new\.processing_asset_id/u);
  assert.match(coherence, /join public\.veroxa_momo_media_canonical_identities_v2 identity\s+on identity\.id = run\.automation_identity_id[\s\S]*?join public\.veroxa_momo_media_asset_identity_links_v2 link\s+on link\.identity_id = identity\.id[\s\S]*?link\.asset_id = run\.source_asset_id[\s\S]*?run\.source_asset_id = new\.source_asset_id[\s\S]*?identity\.canonical_asset_id = new\.canonical_asset_id/u);
  assert.match(coherence, /run\.automation_identity_id = identity\.id[\s\S]*?run\.source_asset_id = new\.source_asset_id[\s\S]*?identity\.canonical_asset_id = new\.canonical_asset_id[\s\S]*?link\.verification_id = new\.intake_verification_id[\s\S]*?link\.rights_id = new\.rights_id/u);
  assert.doesNotMatch(coherence, /new\.source_asset_id is distinct from new\.canonical_asset_id/u);

  const failure = between(
    migration,
    "create or replace function veroxa_private.momo_auto_failure_exception_v2()",
    "revoke all on function veroxa_private.momo_auto_failure_exception_v2()",
  );
  assert.match(failure, /where identity\.id = new\.automation_identity_id[\s\S]*?momo_upsert_exception_v2\(\s*new\.restaurant_id, canonical_asset_id, new\.source_asset_id, new\.id/u);
});

test("an automated terminal failure creates one durable exception when richer evidence is absent", () => {
  const failure = between(
    migration,
    "create or replace function veroxa_private.momo_auto_failure_exception_v2()",
    "-- The single service-role RPC is an explicit operation allowlist.",
  );
  assert.match(failure, /new\.decision_mode = 'automation_policy_v2'/u);
  assert.match(failure, /new\.status = 'failed'[\s\S]*?old\.status is distinct from new\.status/u);
  const suppression = between(
    failure,
    "and not exists (",
    ") then",
  );
  assert.match(suppression, /event\.content_ai_run_id = new\.id\s+and event\.stage in \('content_processing','content_validation'\)/u);
  assert.doesNotMatch(suppression, /media_intake|rights_reconciliation|automation_reservation/u);
  assert.match(failure, /'stage', 'content_processing'/u);
  assert.match(failure, /perform veroxa_private\.momo_upsert_exception_v2\([\s\S]*?new\.id,[\s\S]*?'content_processing'/u);
  assert.match(failure, /create trigger veroxa_momo_auto_failure_exception_v2\s+after update of status on public\.veroxa_momo_content_ai_runs/u);
});

test("legacy media fan-out is retired without deleting its historical rows", () => {
  const retirement = between(
    migration,
    "-- Preserve the six observed legacy blocked jobs",
    "-- Browser reads are Team-only",
  );
  assert.match(retirement, /set superseded_by_job_id = ranked\.canonical_id,[\s\S]*?supersession_reason = 'consolidated_by_momo_upload_veroxa_ready_v2'/u);
  assert.match(retirement, /alter function public\.veroxa_prepare_momo_ai_job_v1\(uuid,text,text,uuid\)\s+rename to veroxa_prepare_momo_ai_job_legacy_v1;/u);
  assert.match(retirement, /p_job_kind in \(\s*'media_classification','media_quality','duplicate_detection'\s*\)/u);
  assert.match(retirement, /job\.superseded_by_job_id is null[\s\S]*?return canonical_job_id;/u);
  assert.match(retirement, /message = 'momo_media_ai_managed_by_upload_pipeline_v2'/u);
  assert.match(retirement, /return public\.veroxa_prepare_momo_ai_job_legacy_v1/u);
  assert.doesNotMatch(retirement, /delete from public\.veroxa_ai_jobs/u);
  const replacement = retirement.slice(retirement.indexOf(
    "create or replace function public.veroxa_prepare_momo_ai_job_v1(",
  ));
  assert.doesNotMatch(replacement, /insert into public\.veroxa_ai_jobs/u);
});

test("finalize advances through the signed lifecycle and records failures independently", () => {
  const finalize = between(
    lifecycle,
    "if (body.operation === \"finalize_upload\")",
    "if (body.operation === \"record_intake_attempt\")",
  );
  const finalizeRpc = finalize.indexOf("veroxa_finalize_private_media_assessment_intake_v1");
  const platformGate = finalize.indexOf("if (!finalized.platform_ready)");
  const advanceRpc = finalize.indexOf("veroxa_momo_upload_pipeline_v2");
  const success = finalize.lastIndexOf("return response({ data }, 200)");
  assert.ok(finalizeRpc >= 0 && platformGate > finalizeRpc && advanceRpc > platformGate && success > advanceRpc);
  assert.match(finalize, /if \(!finalized\.platform_ready\) \{[\s\S]*?status: "verified"[\s\S]*?canonicalAssetId: body\.assetId/u);
  assert.match(finalize, /p_operation: "advance_verified_asset"/u);
  assert.match(finalize, /verificationId,[\s\S]*?actorId: userData\.user\.id/u);
  assert.match(finalize, /finalizeError \|\| !isPlainObject\(finalized\)[\s\S]*?typeof finalized\.intake_id !== "string"[\s\S]*?finalized\.external_write_allowed !== false/u);

  const failureLedger = between(
    lifecycle,
    "if (body.operation === \"record_intake_attempt\")",
    "let rpc:",
  );
  assert.match(failureLedger, /admin\.rpc\("veroxa_momo_upload_pipeline_v2"/u);
  assert.match(failureLedger, /p_operation: "record_intake_attempt"/u);
  assert.match(failureLedger, /actorId: userData\.user\.id/u);
  for (const field of [
    "outcome", "reasonCodes", "evidenceSnapshot", "evidenceCanonical",
    "evidenceSha256", "idempotencySha256",
  ]) assert.match(failureLedger, new RegExp(`${field}: body\\.${field}`, "u"));

  assert.match(lifecycleContract, /operation: "record_intake_attempt";[\s\S]*?outcome: "rejected" \| "unavailable"/u);
  assert.match(lifecycleContract, /if \(body\.operation === "record_intake_attempt"\)[\s\S]*?validSortedCodes\(body\.reasonCodes, 1, 16\)/u);
  assert.match(lifecycleContract, /JSON\.stringify\(body\.evidenceSnapshot\.reasonCodes\) === JSON\.stringify\(body\.reasonCodes\)/u);

  assert.match(finalizeRoute, /operation: "finalize_upload", \.\.\.input/u);
  assert.match(
    finalizeRoute,
    /client\.rpc\(\s*"veroxa_record_momo_media_intake_failure_v1"/u,
  );
  const routeFailure = finalizeRoute.slice(finalizeRoute.indexOf(
    "async recordFailure",
  ));
  assert.doesNotMatch(routeFailure, /invokeMomoContentAiLifecycleBridge/u);
  assert.match(finalizeCore, /\[\s*"media_verification_unavailable",\s*"media_verification_failed",\s*"media_not_platform_ready",\s*"media_not_assessable",\s*\]\.includes\(publicError\.code\)/u);
  assert.match(finalizeCore, /`momo-intake-failure-v2:\$\{evidenceSha256\}`/u);
  assert.match(finalizeCore, /recordedIntakeFailure\(recorded, input\.assetId\)[\s\S]*?team_exception_recorded/u);
});
