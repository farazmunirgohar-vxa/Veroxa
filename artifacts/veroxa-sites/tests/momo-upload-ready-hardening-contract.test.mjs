import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const original = await readFile(new URL(
  "../supabase/migrations/20260801011047_momo_upload_to_ready_pipeline_v1.sql",
  import.meta.url,
), "utf8");
const indexes = await readFile(new URL(
  "../supabase/migrations/20260801011301_momo_upload_ready_index_hardening.sql",
  import.meta.url,
), "utf8");
const sql = await readFile(new URL(
  "../supabase/migrations/20260801021452_momo_upload_ready_contract_hardening.sql",
  import.meta.url,
), "utf8");
const dispatchSql = await readFile(new URL(
  "../supabase/migrations/20260801024213_momo_content_ai_dispatch_claim_token.sql",
  import.meta.url,
), "utf8");
const advisorSql = await readFile(new URL(
  "../supabase/migrations/20260801021615_momo_upload_ready_advisor_hardening.sql",
  import.meta.url,
), "utf8");
const webhookLeaseSql = await readFile(new URL(
  "../supabase/migrations/20260801045225_momo_content_ai_webhook_claim_lease.sql",
  import.meta.url,
), "utf8");
const unboundRecoverySql = await readFile(new URL(
  "../supabase/migrations/20260801045232_momo_content_ai_unbound_dispatch_recovery.sql",
  import.meta.url,
), "utf8");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function functionBody(name, nextName, source = sql) {
  const replaceStart = source.indexOf(`create or replace function ${name}`);
  const createStart = source.indexOf(`create function ${name}`);
  const start = replaceStart === -1 ? createStart : replaceStart;
  assert.notEqual(start, -1, `${name} must exist`);
  const nextReplace = nextName
    ? source.indexOf(`create or replace function ${nextName}`, start + 1)
    : -1;
  const nextCreate = nextName
    ? source.indexOf(`create function ${nextName}`, start + 1)
    : -1;
  const end = !nextName
    ? source.length
    : nextReplace === -1
      ? nextCreate
      : nextCreate === -1
        ? nextReplace
        : Math.min(nextReplace, nextCreate);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return source.slice(start, end);
}

test("hardening is forward-only and preserves both applied migration statements", () => {
  assert.equal(sha256(original), "343d2d2b4c1bf7c4a8782e587d92fccbc7b0e5f48a436ec0093c039c3b7f944c");
  assert.equal(sha256(indexes), "1e701a5151642e7a01be171bdb4d52471f53d98e9dcb4ef6cc13d7c9486816dc");
  assert.match(sql, /Forward-only hardening for Momo upload-to-Ready/u);
  assert.match(sql, /lock table public\.veroxa_momo_content_ai_runs in access exclusive mode;[\s\S]*?momo_content_v4_requires_empty_run_table/u);
  assert.doesNotMatch(sql, /drop table|truncate table/iu);
});

test("new generation is pinned to prompt and validator v4 with a USD6 reservation", () => {
  assert.match(sql, /drop constraint veroxa_momo_content_ai_runs_prompt_version_check/u);
  assert.match(sql, /drop constraint veroxa_momo_content_ai_runs_validator_version_check/u);
  assert.match(sql, /drop constraint veroxa_momo_content_ai_runs_reserved_microusd_check/u);
  assert.match(sql, /prompt_version = 'momo-content-package-2026-08-01-v4'/u);
  assert.match(sql, /validator_version = 'momo-content-validator-2026-08-01-v4'/u);
  assert.match(sql, /reserved_microusd = 6000000/u);
  assert.doesNotMatch(sql, /momo-content-(?:package|validator)-2026-08-01-v3/u);
  assert.match(sql, /momo_ai_committed_microusd_v1\(p_restaurant_id\)[\s\S]*?\+ 6000000/u);
});

test("upload verification stores one exact canonical snapshot and cannot be updated", () => {
  const finalize = functionBody(
    "public.veroxa_finalize_momo_media_intake_v1",
    "veroxa_private.momo_canonical_payload_matches_v1",
  );
  assert.match(sql, /add column verification_canonical text/u);
  assert.match(sql, /veroxa_momo_intake_snapshot_exact_v1[\s\S]*?'storageObjectVersion', storage_object_version[\s\S]*?'contentSha256', content_sha256/u);
  assert.match(sql, /veroxa_momo_intake_canonical_exact_v1[\s\S]*?momo_canonical_json_v1\(verification_snapshot\)/u);
  assert.match(sql, /veroxa_momo_intake_hash_exact_v1[\s\S]*?convert_to\(verification_canonical, 'UTF8'\)/u);
  assert.match(sql, /create trigger veroxa_momo_intake_verification_immutable[\s\S]*?before update/u);
  assert.match(finalize, /expected_snapshot := pg_catalog\.jsonb_build_object/u);
  assert.match(finalize, /p_verification_snapshot is distinct from expected_snapshot/u);
  assert.match(finalize, /p_verification_canonical is distinct from expected_canonical/u);
  assert.match(finalize, /verification_snapshot, verification_canonical, verification_sha256/u);
});

test("terminal provider results cross one durable result_staged boundary", () => {
  const stage = functionBody(
    "public.veroxa_stage_momo_content_ai_result_v1",
    "public.veroxa_complete_staged_momo_content_ai_run_v1",
  );
  const complete = functionBody(
    "public.veroxa_complete_staged_momo_content_ai_run_v1",
    "public.veroxa_fail_momo_content_ai_run_v1",
  );
  assert.match(sql, /create table veroxa_private\.momo_content_ai_result_outbox/u);
  assert.match(sql, /primary key \(run_id, request_hash\)/u);
  assert.match(sql, /output_canonical text not null check \([\s\S]*?between 2 and 262144/u);
  assert.match(sql, /accounted_microusd between 1 and 6000000/u);
  assert.match(sql, /force row level security/u);
  assert.match(sql, /revoke all on table veroxa_private\.momo_content_ai_result_outbox[\s\S]*?service_role/u);
  assert.match(sql, /momo_content_ai_result_outbox_is_immutable/u);
  assert.match(sql, /status in \([\s\S]*?'result_staged'[\s\S]*?'pending_review'/u);
  assert.match(sql, /veroxa_momo_content_ai_one_active_asset[\s\S]*?'result_staged'/u);
  assert.match(sql, /output_canonical =[\s\S]*?momo_canonical_json_v1\(output_payload\)/u);
  assert.match(sql, /validation_canonical =[\s\S]*?momo_canonical_json_v1\(validation_report\)/u);
  assert.match(sql, /create trigger momo_content_ai_result_outbox_consistency/u);
  assert.match(sql, /momo_content_ai_result_outbox_run_mismatch/u);
  assert.doesNotMatch(sql, /momo_content_ai_result_outbox_scope/u);
  assert.match(stage, /momo_canonical_payload_matches_v1/u);
  assert.match(stage, /momo_current_content_contract_valid_v1/u);
  assert.doesNotMatch(stage, /momo_content_ai_current_evidence_v1/u);
  assert.match(stage, /if found then[\s\S]*?return staged\.run_id/u);
  assert.match(stage, /set status = 'result_staged'[\s\S]*?output_payload = p_output_payload/u);
  assert.match(stage, /set state = 'settled', provider_called = true/u);
  assert.match(stage, /get diagnostics ledger_rows = row_count[\s\S]*?ledger_rows <> 1/u);
  assert.match(complete, /run\.status in \('pending_review','materialized','rejected'\)/u);
  assert.match(complete, /run\.status <> 'result_staged'/u);
  assert.match(complete, /set status = 'pending_review'/u);
  assert.doesNotMatch(complete, /momo_content_ai_current_evidence_v1/u);
  assert.doesNotMatch(complete, /veroxa_complete_momo_content_ai_run_v1/u);
  assert.match(complete, /set state = 'applied', applied_at = pg_catalog\.clock_timestamp\(\)/u);
  assert.match(sql, /grant execute on function public\.veroxa_stage_momo_content_ai_result_v1\([\s\S]*?to service_role/u);
  assert.match(sql, /grant execute on function public\.veroxa_complete_staged_momo_content_ai_run_v1\([\s\S]*?to service_role/u);
  assert.doesNotMatch(sql, /grant execute on function public\.veroxa_complete_momo_content_ai_run_v1\([\s\S]*?to service_role/u);
});

test("background provider response IDs are recorded once and remain resumable", () => {
  const record = functionBody(
    "public.veroxa_record_momo_content_ai_provider_response_v1",
    "public.veroxa_stage_momo_content_ai_result_v1",
  );
  const fail = functionBody(
    "public.veroxa_fail_momo_content_ai_run_v1",
    "public.veroxa_reserve_momo_content_ai_run_v1",
  );
  const reserve = functionBody(
    "public.veroxa_reserve_momo_content_ai_run_v1",
    "public.veroxa_start_momo_content_ai_run_v1",
  );
  assert.match(record, /run\.status <> 'provider_running'/u);
  assert.doesNotMatch(sql, /\^resp_\[A-Za-z0-9_-\]\{8,196\}\$/u);
  assert.match(sql, /char_length\(provider_response_id\) <= 200[\s\S]*?\^resp_\[A-Za-z0-9_-\]\{8,195\}\$/u);
  assert.match(record, /char_length\(p_provider_response_id\) > 200[\s\S]*?\^resp_\[A-Za-z0-9_-\]\{8,195\}\$/u);
  assert.match(record, /if run\.provider_response_id is not null then[\s\S]*?run\.provider_response_id = p_provider_response_id[\s\S]*?return run\.id/u);
  assert.match(record, /set provider_response_id = p_provider_response_id/u);
  assert.match(sql, /grant execute on function public\.veroxa_record_momo_content_ai_provider_response_v1\([\s\S]*?to service_role/u);
  assert.match(fail, /p_provider_response_id is distinct from run\.provider_response_id/u);
  assert.match(fail, /run\.status = 'provider_running'[\s\S]*?run\.provider_response_id is null[\s\S]*?momo_content_ai_provider_identity_reconciliation_required/u);
  assert.doesNotMatch(fail, /provider_response_retrieval_required/u);
  assert.match(reserve, /reserved_microusd bigint, provider_response_id text, output_payload jsonb/u);
  assert.doesNotMatch(reserve, /existing\.status = 'provider_running'[\s\S]*?provider_response_identity_lost/u);
  assert.doesNotMatch(reserve, /provider_response_identity_lost|provider_started_at <=[\s\S]*?interval '15 minutes'/u);
  assert.match(reserve, /existing\.provider_response_id, existing\.output_payload/u);
  assert.match(reserve, /run\.provider_response_id, run\.output_payload/u);
});

test("signed webhooks recover one exact provider result without browser state", () => {
  const claim = functionBody(
    "public.veroxa_claim_momo_content_ai_webhook_v1",
    "public.veroxa_finish_momo_content_ai_webhook_v1",
  );
  const finish = functionBody(
    "public.veroxa_finish_momo_content_ai_webhook_v1",
    "public.veroxa_stage_momo_content_ai_result_v1",
  );
  assert.match(sql, /create table veroxa_private\.momo_content_ai_webhook_events/u);
  assert.match(sql, /event_id text primary key check \([\s\S]*?\^evt_\[A-Za-z0-9_-\]\{8,196\}\$/u);
  assert.match(sql, /provider_response_id text not null check \([\s\S]*?\^resp_\[A-Za-z0-9_-\]\{8,195\}\$/u);
  assert.match(sql, /alter table veroxa_private\.momo_content_ai_webhook_events[\s\S]*?force row level security/u);
  assert.match(sql, /revoke all on table veroxa_private\.momo_content_ai_webhook_events[\s\S]*?service_role/u);
  assert.match(sql, /momo_content_ai_webhook_event_is_immutable/u);
  assert.match(sql, /momo_content_ai_webhook_event_run_mismatch/u);
  assert.match(claim, /from public\.veroxa_momo_content_ai_runs target_run[\s\S]*?for update/u);
  assert.match(claim, /from veroxa_private\.momo_content_ai_webhook_events target_event[\s\S]*?for update/u);
  assert.ok(claim.indexOf("from public.veroxa_momo_content_ai_runs target_run") < claim.indexOf("from veroxa_private.momo_content_ai_webhook_events target_event"));
  assert.match(claim, /run\.request_hash is distinct from p_request_hash/u);
  assert.match(claim, /run\.provider_response_id is null[\s\S]*?run\.status <> 'provider_running'/u);
  assert.match(claim, /set provider_response_id = p_provider_response_id/u);
  assert.match(claim, /webhook_event\.provider_response_id is distinct from p_provider_response_id[\s\S]*?webhook_event\.run_id is distinct from run\.id/u);
  assert.match(claim, /run\.requested_by, webhook_event\.state/u);
  assert.doesNotMatch(claim, /momo_content_ai_current_evidence_v1|momo_ai_committed_microusd_v1|momo_runtime_controls/u);
  assert.match(claim, /revoke all on function public\.veroxa_claim_momo_content_ai_webhook_v1\([\s\S]*?public, anon, authenticated, service_role/u);
  assert.match(claim, /grant execute on function public\.veroxa_claim_momo_content_ai_webhook_v1\([\s\S]*?to service_role/u);
  assert.match(finish, /webhook_event\.state <> 'claimed'[\s\S]*?webhook_event\.state = p_outcome[\s\S]*?return webhook_event\.event_id/u);
  assert.match(finish, /set state = p_outcome,[\s\S]*?error_code = p_error_code,[\s\S]*?finished_at = pg_catalog\.clock_timestamp\(\)/u);
  assert.match(finish, /p_outcome not in \('processed','failed'\)/u);
  assert.match(finish, /grant execute on function public\.veroxa_finish_momo_content_ai_webhook_v1\([\s\S]*?to service_role/u);
});

test("trusted pre-POST abort is narrow, atomic, and service-only", () => {
  const abort = functionBody(
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    "public.veroxa_complete_momo_content_ai_run_v1",
  );
  assert.match(abort, /momo_media_ai_actor_has_operational_team_v1/u);
  assert.doesNotMatch(abort, /p_actor_id = run\.requested_by/u);
  assert.match(abort, /run\.status = 'reserved'[\s\S]*?not run\.provider_called[\s\S]*?not ledger\.provider_called[\s\S]*?return run\.id/u);
  assert.match(abort, /run\.status <> 'provider_running'[\s\S]*?not run\.provider_called[\s\S]*?run\.provider_response_id is not null/u);
  assert.match(abort, /momo_content_ai_result_outbox[\s\S]*?momo_content_ai_webhook_events/u);
  assert.match(abort, /set status = 'reserved',[\s\S]*?provider_called = false,[\s\S]*?provider_started_at = null[\s\S]*?interval '15 minutes'/u);
  assert.match(abort, /ledger\.state = 'reserved'[\s\S]*?ledger\.provider_called[\s\S]*?ledger\.accounted_microusd is null/u);
  assert.match(abort, /get diagnostics changed_rows = row_count[\s\S]*?changed_rows <> 1[\s\S]*?abort_before_provider_ledger_invalid/u);
  assert.match(abort, /revoke all on function public\.veroxa_abort_momo_content_ai_before_provider_v1\([\s\S]*?public, anon, authenticated, service_role/u);
  assert.match(abort, /grant execute on function public\.veroxa_abort_momo_content_ai_before_provider_v1\([\s\S]*?to service_role/u);
});

test("caller-owned dispatch tokens prevent cross-request start and abort races", () => {
  const start = functionBody(
    "public.veroxa_start_momo_content_ai_run_v1",
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    dispatchSql,
  );
  const abort = functionBody(
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    null,
    dispatchSql,
  );
  assert.match(dispatchSql, /add column dispatch_claim_token uuid/u);
  assert.match(dispatchSql, /revoke select on table public\.veroxa_momo_content_ai_runs[\s\S]*?from authenticated/u);
  assert.match(dispatchSql, /attribute\.attname <> 'dispatch_claim_token'/u);
  assert.match(dispatchSql, /grant select \(%s\) on table public\.veroxa_momo_content_ai_runs to authenticated/u);
  assert.match(dispatchSql, /momo_dispatch_claim_requires_no_legacy_ambiguous_run/u);
  assert.match(dispatchSql, /veroxa_momo_content_ai_dispatch_claim_state_v1[\s\S]*?status = 'provider_running'[\s\S]*?provider_response_id is null[\s\S]*?dispatch_claim_token is not null/u);
  assert.match(dispatchSql, /create table veroxa_private\.momo_content_ai_dispatch_claims/u);
  assert.match(dispatchSql, /dispatch_claim_token uuid primary key/u);
  assert.match(dispatchSql, /force row level security/u);
  assert.match(dispatchSql, /revoke all on table veroxa_private\.momo_content_ai_dispatch_claims[\s\S]*?service_role/u);
  assert.match(dispatchSql, /momo_content_ai_dispatch_claim_is_immutable/u);
  assert.match(dispatchSql, /momo_content_ai_dispatch_claim_run_mismatch/u);
  assert.match(dispatchSql, /new\.provider_response_id is not null[\s\S]*?new\.dispatch_claim_token := null/u);
  assert.match(dispatchSql, /when new\.provider_response_id is not null then 'response_bound'[\s\S]*?when new\.status = 'reserved' then 'aborted'/u);
  assert.match(dispatchSql, /drop function public\.veroxa_start_momo_content_ai_run_v1\(uuid,text,uuid\)/u);
  assert.match(dispatchSql, /drop function public\.veroxa_abort_momo_content_ai_before_provider_v1\([\s\S]*?uuid,text,uuid/u);
  assert.match(start, /p_dispatch_claim_token uuid/u);
  assert.match(start, /run\.dispatch_claim_token is distinct from p_dispatch_claim_token[\s\S]*?momo_content_ai_dispatch_claim_conflict/u);
  assert.match(start, /dispatch_claim_token = p_dispatch_claim_token/u);
  assert.match(start, /insert into veroxa_private\.momo_content_ai_dispatch_claims/u);
  assert.match(start, /momo_content_ai_dispatch_claim_reused/u);
  assert.match(start, /grant execute on function public\.veroxa_start_momo_content_ai_run_v1\([\s\S]*?uuid,text,uuid,uuid[\s\S]*?to service_role/u);
  assert.match(abort, /p_dispatch_claim_token uuid/u);
  assert.match(abort, /run\.dispatch_claim_token is distinct from p_dispatch_claim_token/u);
  assert.match(abort, /claim\.dispatch_claim_token = p_dispatch_claim_token[\s\S]*?claim\.claimed_by = p_actor_id[\s\S]*?claim\.state = 'active'/u);
  assert.match(abort, /claim\.state = 'aborted'[\s\S]*?return run\.id/u);
  assert.match(abort, /target_run\.dispatch_claim_token = p_dispatch_claim_token/u);
  assert.match(abort, /grant execute on function public\.veroxa_abort_momo_content_ai_before_provider_v1\([\s\S]*?uuid,text,uuid,uuid[\s\S]*?to service_role/u);
});

test("post-provider settlement survives initiator offboarding without authorizing a new call", () => {
  for (const [name, next] of [
    ["public.veroxa_record_momo_content_ai_provider_response_v1", "public.veroxa_stage_momo_content_ai_result_v1"],
    ["public.veroxa_stage_momo_content_ai_result_v1", "public.veroxa_complete_staged_momo_content_ai_run_v1"],
    ["public.veroxa_complete_staged_momo_content_ai_run_v1", "public.veroxa_fail_momo_content_ai_run_v1"],
    ["public.veroxa_fail_momo_content_ai_run_v1", "public.veroxa_reserve_momo_content_ai_run_v1"],
    ["public.veroxa_complete_momo_content_ai_run_v1", "public.veroxa_momo_ready_package_status_v1"],
  ]) {
    const body = functionBody(name, next);
    assert.match(body, /p_actor_id = run\.requested_by[\s\S]*?momo_media_ai_actor_has_operational_team_v1/u);
  }
  const start = functionBody(
    "public.veroxa_start_momo_content_ai_run_v1",
    "public.veroxa_complete_momo_content_ai_run_v1",
  );
  assert.doesNotMatch(start, /p_actor_id = run\.requested_by/u);
  assert.match(start, /momo_media_ai_actor_has_operational_team_v1/u);
});

test("failure uses persisted provider truth and consumes a staged paid result", () => {
  const fail = functionBody(
    "public.veroxa_fail_momo_content_ai_run_v1",
    "public.veroxa_reserve_momo_content_ai_run_v1",
  );
  assert.match(fail, /momo_content_ai_result_outbox[\s\S]*?return public\.veroxa_complete_staged_momo_content_ai_run_v1/u);
  assert.match(sql, /drop function public\.veroxa_fail_momo_content_ai_run_v1\(\s*uuid,text,text,boolean,bigint,jsonb,uuid\s*\)/u);
  assert.match(sql, /grant execute on function public\.veroxa_fail_momo_content_ai_run_v1\(\s*uuid,text,text,text,boolean,bigint,jsonb,uuid\s*\)[\s\S]*?to service_role/u);
  assert.match(fail, /actual_called := run\.provider_called/u);
  assert.match(fail, /p_provider_called is distinct from run\.provider_called/u);
  assert.match(fail, /p_provider_called and not actual_called/u);
  assert.doesNotMatch(fail, /actual_called := run\.provider_called or p_provider_called/u);
  assert.doesNotMatch(fail, /run\.provider_called and not p_provider_called/u);
  assert.match(fail, /actual_called and run\.provider_started_at is null/u);
  assert.match(fail, /run\.status = 'failed'[\s\S]*?exists \([\s\S]*?ledger\.state = target_state[\s\S]*?ledger\.accounting_basis = target_basis/u);
  assert.match(fail, /ledger\.restaurant_id = run\.restaurant_id[\s\S]*?ledger\.idempotency_hash = run\.idempotency_hash[\s\S]*?ledger\.state = 'reserved'/u);
  assert.match(fail, /get diagnostics ledger_rows = row_count[\s\S]*?ledger_rows <> 1[\s\S]*?momo_content_ai_failure_ledger_settlement_failed/u);
  assert.match(sql, /status = 'failed'[\s\S]*?provider_called and provider_started_at is not null[\s\S]*?provider_response_id is not null/u);
});

test("an exact replay returns result_staged before mutable evidence or budget", () => {
  const reserve = functionBody(
    "public.veroxa_reserve_momo_content_ai_run_v1",
    "public.veroxa_start_momo_content_ai_run_v1",
  );
  const existing = reserve.indexOf("select * into existing");
  const returnExisting = reserve.indexOf("return query select existing.id", existing);
  const asset = reserve.indexOf("select * into asset");
  const truth = reserve.indexOf("current_momo_truth_snapshot_v1");
  const budget = reserve.indexOf("momo_ai_committed_microusd_v1");
  const insert = reserve.indexOf("insert into public.veroxa_momo_content_ai_runs");
  assert.ok(existing >= 0 && returnExisting > existing);
  assert.ok(asset > returnExisting, "mutable source evidence follows exact replay");
  assert.ok(truth > returnExisting, "mutable truth follows exact replay");
  assert.ok(budget > returnExisting, "incremental budget applies only after exact replay returns");
  assert.ok(insert > budget, "new ledger reservation follows the budget gate");
  assert.match(reserve, /existing\.source_asset_id <> p_source_asset_id/u);
  assert.match(reserve, /existing\.client_request_hash <> p_client_request_hash/u);
  assert.match(reserve, /existing\.provider_response_id, existing\.output_payload/u);
  assert.doesNotMatch(reserve, /veroxa_complete_staged_momo_content_ai_run_v1/u);
});

test("expired reserved leases are reclaimable and can never start a provider", () => {
  const reserve = functionBody(
    "public.veroxa_reserve_momo_content_ai_run_v1",
    "public.veroxa_start_momo_content_ai_run_v1",
  );
  const start = functionBody(
    "public.veroxa_start_momo_content_ai_run_v1",
    "veroxa_private.momo_chicago_minute_v1",
  );
  assert.match(sql, /add column reservation_lease_expires_at timestamptz/u);
  assert.match(sql, /veroxa_momo_content_ai_reserved_lease_idx/u);
  assert.match(reserve, /existing\.status = 'reserved'[\s\S]*?set reservation_lease_expires_at =[\s\S]*?interval '15 minutes'/u);
  assert.match(reserve, /run\.status = 'reserved'[\s\S]*?reservation_lease_expires_at <=[\s\S]*?provider_error_code = 'reservation_lease_expired'[\s\S]*?accounting_basis = 'zero_pre_provider'/u);
  assert.match(start, /reservation_lease_expires_at <= pg_catalog\.clock_timestamp\(\)/u);
  assert.match(start, /set state = 'released', provider_called = false/u);
  assert.ok(start.indexOf("reservation_lease_expires_at <=") < start.indexOf("set status = 'provider_running'"));
  assert.ok(start.indexOf("reservation_lease_expires_at <=") < start.indexOf("momo_content_ai_current_evidence_v1"));
});

test("Ready status reruns current rules and converts malformed evidence to blockers", () => {
  const status = functionBody("public.veroxa_momo_ready_package_status_v1");
  assert.match(status, /momo_current_content_contract_valid_v1\([\s\S]*?package\.approved_payload, run\.target_platforms, run\.truth_snapshot/u);
  assert.match(status, /validation_report ->> 'validatorVersion'[\s\S]*?run\.validator_version/u);
  assert.match(status, /validation_report -> 'passed' is distinct from 'true'::jsonb/u);
  assert.match(status, /momo_canonical_payload_matches_v1\([\s\S]*?run\.validation_report/u);
  assert.match(status, /momo_chicago_minute_v1/u);
  assert.match(status, /exception when others then[\s\S]*?'\["integrity_check_failed_closed"\]'::jsonb/u);
  assert.match(status, /"content_contract_changed"/u);
  assert.match(status, /"posting_boundary_violated"/u);
});

test("v4 SQL semantics require contiguous SEO and objective grounded copy", () => {
  const current = functionBody(
    "veroxa_private.momo_current_content_contract_valid_v1",
    "veroxa_private.guard_momo_ready_package_v4",
  );
  assert.match(sql, /create or replace function veroxa_private\.momo_content_seo_phrase_applied_v4/u);
  assert.match(sql, /absolute_hit = 1[\s\S]*?!~ '\[A-Za-z0-9\]'[\s\S]*?after_hit/u);
  assert.match(sql, /momo_content_has_unsupported_ungrounded_v4/u);
  assert.match(sql, /momo_content_without_ledgered_claims_v4/u);
  assert.match(sql, /word_count not between 1 and 12/u);
  assert.match(sql, /all_objective/u);
  assert.match(current, /momo_content_payload_contract_valid_v1/u);
  assert.match(current, /momo_content_payload_v4_extra_valid_v1/u);
  assert.match(sql, /create trigger veroxa_momo_ready_package_v4_guard[\s\S]*?before insert/u);
  assert.match(sql, /momo_ready_v4_contract_failed/u);
});

test("USD6 conservative terminal accounting remains an exact supported path", () => {
  const stage = functionBody(
    "public.veroxa_stage_momo_content_ai_result_v1",
    "public.veroxa_complete_staged_momo_content_ai_run_v1",
  );
  assert.match(stage, /p_accounting_basis = 'conservative_reservation'[\s\S]*?p_provider_usage is not null[\s\S]*?p_accounted_microusd <> run\.reserved_microusd/u);
  assert.match(sql, /reserved_microusd = 6000000/u);
});

test("webhook leasing is forward-only and leaves the frozen release chain unchanged", () => {
  assert.equal(sha256(sql), "fad2f417c3ac359dbb81fc6f55e5ef46e5d69f397051ea08190c2a2baa9d63af");
  assert.equal(sha256(advisorSql), "8904b5dd9562b9bd0f9439ae3180d5a20714b47af6fa437dd299d810dc816783");
  assert.equal(sha256(dispatchSql), "ce9b6ac433ff0e9653c6e38ef7226823066de65142d6286506b35ce40b69c17f");
  assert.match(webhookLeaseSql, /lock table public\.veroxa_momo_content_ai_runs\s+in access exclusive mode/u);
  assert.match(webhookLeaseSql, /lock table veroxa_private\.momo_content_ai_webhook_events\s+in access exclusive mode/u);
  assert.ok(
    webhookLeaseSql.indexOf("lock table public.veroxa_momo_content_ai_runs") <
      webhookLeaseSql.indexOf("lock table veroxa_private.momo_content_ai_webhook_events"),
  );
  assert.match(webhookLeaseSql, /momo_webhook_claim_lease_requires_empty_event_table/u);
  assert.doesNotMatch(webhookLeaseSql, /update\s+public\.veroxa_momo_content_ai_runs\s+set\s+prompt_version/iu);
});

test("one provider response and one verified webhook header bind to one claim lease", () => {
  const claim = functionBody(
    "public.veroxa_claim_momo_content_ai_webhook_v1",
    "public.veroxa_stage_momo_content_ai_webhook_result_v1",
    webhookLeaseSql,
  );
  assert.match(webhookLeaseSql, /create unique index veroxa_momo_content_ai_provider_response_id_key/u);
  assert.match(webhookLeaseSql, /add constraint momo_content_ai_webhook_events_webhook_id_key\s+unique \(webhook_id\)/u);
  assert.match(webhookLeaseSql, /claim_lease_expires_at[\s\S]*?interval '5 minutes'/u);
  assert.match(claim, /p_event_id text,[\s\S]*?p_webhook_id text,[\s\S]*?p_claim_token uuid/u);
  assert.match(claim, /p_event_id !~ '\^evt_/u);
  assert.match(claim, /p_webhook_id !~ '\^wh_/u);
  assert.match(claim, /webhook_event\.claim_token <> p_claim_token[\s\S]*?claim_lease_expires_at > observed_at[\s\S]*?claim_live_conflict/u);
  assert.match(claim, /claim_lease_expires_at <= observed_at[\s\S]*?claim_attempts = webhook_event\.claim_attempts[\s\S]*?claim_attempts < 1000/u);
  assert.match(claim, /webhook_claim_token uuid,[\s\S]*?owns_webhook_claim boolean,[\s\S]*?webhook_claim_status text/u);
  assert.match(claim, /'terminal_owner'[\s\S]*?'terminal_other'/u);
  assert.match(claim, /grant execute on function public\.veroxa_claim_momo_content_ai_webhook_v1\([\s\S]*?to service_role/u);
});

test("every webhook mutation rechecks the same live claim and remains service-only", () => {
  const assertionStart = webhookLeaseSql.indexOf("veroxa_private.assert_momo_content_ai_webhook_claim_v1(");
  const assertionEnd = webhookLeaseSql.indexOf("create function public.veroxa_stage_momo_content_ai_webhook_result_v1", assertionStart);
  assert.ok(assertionStart >= 0 && assertionEnd > assertionStart);
  const assertion = webhookLeaseSql.slice(assertionStart, assertionEnd);
  assert.match(assertion, /webhook_event\.webhook_id is distinct from p_webhook_id/u);
  assert.match(assertion, /webhook_event\.claim_token is distinct from p_claim_token/u);
  assert.match(assertion, /webhook_event\.state <> 'claimed'/u);
  assert.match(assertion, /claim_lease_expires_at\s+<= pg_catalog\.clock_timestamp\(\)/u);
  for (const name of [
    "veroxa_stage_momo_content_ai_webhook_result_v1",
    "veroxa_complete_staged_momo_content_ai_webhook_v1",
    "veroxa_fail_momo_content_ai_webhook_v1",
  ]) {
    assert.match(webhookLeaseSql, new RegExp(
      `create function\\s+public\\.${name}\\([\\s\\S]*?assert_momo_content_ai_webhook_claim_v1`,
      "u",
    ));
    assert.match(webhookLeaseSql, new RegExp(
      `grant execute on function\\s+public\\.${name}\\([\\s\\S]*?to service_role`,
      "u",
    ));
  }
});

test("webhook finish requires exact durable run outcome, error, token, and live lease", () => {
  const finish = functionBody(
    "public.veroxa_finish_momo_content_ai_webhook_v1",
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    webhookLeaseSql,
  );
  assert.match(finish, /p_outcome = 'processed'[\s\S]*?run\.status not in \('pending_review','materialized','rejected'\)/u);
  assert.match(finish, /p_outcome = 'failed'[\s\S]*?run\.status <> 'failed'[\s\S]*?p_error_code is distinct from run\.provider_error_code/u);
  assert.match(finish, /webhook_event\.claim_token is distinct from p_claim_token/u);
  assert.match(finish, /claim_lease_expires_at[\s\S]*?> pg_catalog\.clock_timestamp\(\)/u);
  assert.match(finish, /state = p_outcome,[\s\S]*?error_code = p_error_code,[\s\S]*?claim_lease_expires_at = null/u);
});

test("abort writes a token tombstone so abort-before-start and start-before-abort both fail closed", () => {
  const abort = functionBody(
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    null,
    webhookLeaseSql,
  );
  const start = functionBody(
    "public.veroxa_start_momo_content_ai_run_v1",
    "public.veroxa_abort_momo_content_ai_before_provider_v1",
    dispatchSql,
  );
  assert.match(abort, /run\.status = 'reserved'[\s\S]*?insert into veroxa_private\.momo_content_ai_dispatch_claims/u);
  assert.match(abort, /p_actor_id, 'aborted', observed_at, observed_at/u);
  assert.match(abort, /existing_claim\.state = 'aborted'[\s\S]*?return run\.id/u);
  assert.match(abort, /run\.status <> 'provider_running'[\s\S]*?run\.dispatch_claim_token is distinct from p_dispatch_claim_token/u);
  assert.match(abort, /set status = 'reserved',[\s\S]*?provider_called = false,[\s\S]*?dispatch_claim_token = null/u);
  assert.match(start, /if exists \([\s\S]*?dispatch_claim_token = p_dispatch_claim_token[\s\S]*?momo_content_ai_dispatch_claim_reused/u);
});

test("unbound dispatch recovery is token-owned, conservative, scheduled, and never redispatches", () => {
  const failUnbound = functionBody(
    "public.veroxa_fail_unbound_momo_content_ai_dispatch_v1",
    "veroxa_private.expire_momo_content_ai_unbound_dispatches_v1",
    unboundRecoverySql,
  );
  const expire = functionBody(
    "veroxa_private.expire_momo_content_ai_unbound_dispatches_v1",
    null,
    unboundRecoverySql,
  );
  assert.match(unboundRecoverySql, /drop constraint veroxa_momo_content_ai_runs_check1/u);
  assert.match(unboundRecoverySql, /provider_response_id is null[\s\S]*?provider_error_code in \([\s\S]*?'provider_http_error_without_response'[\s\S]*?'provider_identity_timeout'/u);
  assert.match(failUnbound, /run\.dispatch_claim_token is distinct from p_dispatch_claim_token/u);
  assert.match(failUnbound, /claim\.claimed_by is distinct from p_actor_id/u);
  assert.match(failUnbound, /claim\.state <> 'active'/u);
  assert.match(failUnbound, /or exists[\s\S]*?momo_content_ai_webhook_events/u);
  assert.match(failUnbound, /provider_error_code = 'provider_http_error_without_response'/u);
  assert.match(failUnbound, /state = 'uncertain'[\s\S]*?accounted_microusd = run\.reserved_microusd/u);
  assert.match(expire, /provider_started_at <=[\s\S]*?interval '96 hours'/u);
  assert.match(expire, /for update of target_run skip locked/u);
  assert.match(expire, /not exists[\s\S]*?momo_content_ai_webhook_events/u);
  assert.doesNotMatch(expire, /claim\.claimed_by = target_run\.requested_by/u);
  assert.match(expire, /provider_error_code = 'provider_identity_timeout'/u);
  assert.match(unboundRecoverySql, /'veroxa-momo-content-ai-unbound-recovery'[\s\S]*?'\*\/15 \* \* \* \*'/u);
  assert.doesNotMatch(unboundRecoverySql, /https:\/\/api\.openai|\bfetch\b|net\.http|provider_response_create/iu);
});
