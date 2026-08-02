import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/migrations/20260801011047_momo_upload_to_ready_pipeline_v1.sql", import.meta.url), "utf8");
const indexSql = await readFile(new URL("../supabase/migrations/20260801011301_momo_upload_ready_index_hardening.sql", import.meta.url), "utf8");
const supabaseConfig = await readFile(new URL("../supabase/config.toml", import.meta.url), "utf8");
const contentRoute = await readFile(new URL("../app/api/team/content-ai/package/route.ts", import.meta.url), "utf8");

test("server intake accepts only an exact three-platform-ready JPG profile", () => {
  assert.match(sql, /detected_mime_type text not null check \(detected_mime_type = 'image\/jpeg'\)/);
  assert.match(sql, /file_size bigint not null check \(file_size between 10240 and 5242880\)/);
  assert.match(sql, /width integer not null check \(width between 320 and 12000\)/);
  assert.match(sql, /height integer not null check \(height between 250 and 12000\)/);
  assert.match(sql, /reserved_microusd bigint not null check \(reserved_microusd = 5000000\)/);
  assert.match(sql, /width::numeric \/ height::numeric between 0\.8 and 1\.91/);
  assert.match(sql, /p_detected_mime <> 'image\/jpeg'/);
  assert.match(sql, /p_width::numeric \/ p_height::numeric not between 0\.8 and 1\.91/);
});

test("content generation requires inspected high-quality real-owner media", () => {
  assert.match(sql, /rights\.evidence_class <> 'real_owner'/);
  assert.match(sql, /not coalesce\(review\.quality_score between 80 and 100, false\)/);
  assert.match(sql, /review\.reviewed_by is null or review\.reviewed_at is null/);
  assert.match(sql, /char_length\(btrim\(coalesce\(review\.quality_notes, ''\)\)\) < 10/);
  assert.match(sql, /review\.quality_score between 80 and 100/);
  assert.match(sql, /octet_length\(truth_snapshot::text\) <= 32768/);
  assert.match(sql, /octet_length\(snapshot::text\) > 32768/);
  assert.match(sql, /qualityScore}', ''\) !~ '\^\[4-5\]\$'/);
  assert.match(sql, /qualityIssues}' is distinct from '\["none"\]'::jsonb/);
});

test("every Ready platform variant pins the exact accepted original", () => {
  for (const column of [
    "media_source_kind", "media_asset_id", "media_review_id", "media_storage_path",
    "media_storage_object_id", "media_storage_object_version", "media_mime_type",
    "media_file_size", "media_width", "media_height", "media_content_sha256",
  ]) assert.match(sql, new RegExp(`${column}[^,\\n]*`));
  assert.match(sql, /media_source_kind text not null check \(media_source_kind = 'original_accepted'\)/);
  assert.match(sql, /run\.source_storage_object_id, run\.source_storage_object_version,[\s\S]*?run\.source_content_sha256, variant ->> 'caption'/);
  assert.match(sql, /variant\.media_storage_object_version is distinct from package\.source_storage_object_version/);
  assert.match(sql, /object\.id = variant\.media_storage_object_id[\s\S]*?object\.version = variant\.media_storage_object_version/);
});

test("Ready recomputes exact copy, SEO, hashtags, schedule, and posting-off state", () => {
  assert.match(sql, /check \(coalesce\(\([\s\S]*?status = 'pending_review'[\s\S]*?accounted_microusd between 1 and reserved_microusd[\s\S]*?\), false\)\)/);
  assert.match(sql, /jsonb_typeof\(p_payload -> 'direction'\) is distinct from 'object'/);
  assert.match(sql, /jsonb_typeof\(p_payload -> 'internalMediaTags'\) is distinct from 'array'/);
  assert.match(sql, /jsonb_array_length\(p_payload -> 'claims'\) not between 1 and 30/);
  assert.match(sql, /coalesce\(payload_entry ->> 'tag', ''\) !~ '\^#\[A-Za-z\]\[A-Za-z0-9_\]\{1,39\}\$'/);
  assert.match(sql, /momo_content_payload_contract_valid_v1\(run\.output_payload, run\.target_platforms, run\.truth_snapshot\)/);
  assert.match(sql, /variant #>> '\{cta,kind\}' is null/);
  assert.match(sql, /variant #>> '\{cta,text\}' is null/);
  assert.match(sql, /variant\.caption is distinct from \([\s\S]*?package\.approved_payload -> 'variants'/);
  assert.match(sql, /variant\.hashtags is distinct from coalesce/);
  assert.match(sql, /variant\.seo_phrases is distinct from coalesce/);
  assert.match(sql, /jsonb_array_length\(variant\.seo_phrases\) not between 3 and 8/);
  assert.match(sql, /variant\.platform = 'google_business'[\s\S]*?jsonb_array_length\(variant\.hashtags\) <> 0/);
  assert.match(sql, /queue\.restaurant_id = package\.restaurant_id/);
  assert.match(sql, /attempt\.restaurant_id = package\.restaurant_id/);
  assert.match(sql, /schedule_local := schedule_text::timestamp without time zone/);
  assert.match(sql, /schedule_local at time zone 'America\/Chicago'/);
  assert.match(sql, /variant\.scheduled_for <= now\(\)/);
});

test("the content lifecycle edge function requires a verified JWT", () => {
  assert.match(supabaseConfig, /\[functions\.momo-content-ai-lifecycle\]\s+verify_jwt = true/u);
  assert.match(contentRoute, /VEROXA_MOMO_CONTENT_AI_ENABLED === "true"/u);
  assert.match(contentRoute, /width > MOMO_CONTENT_AI_MAX_SOURCE_WIDTH/);
  assert.match(contentRoute, /height > MOMO_CONTENT_AI_MAX_SOURCE_HEIGHT/);
  assert.match(contentRoute, /MOMO_CONTENT_AI_MAX_TRUTH_BYTES/);
  assert.doesNotMatch(contentRoute, /enabled:\s*process\.env\.VEROXA_MEDIA_AI_ENABLED/u);
});

test("USD100 authority, indexes, and Momo-only publication guards are asserted", () => {
  assert.match(sql, /authorization_cap_microusd = 100000000/);
  assert.match(sql, /scope_count <> 1/);
  assert.match(sql, /active_authorizer_count <> 1/);
  assert.match(sql, /runtime_count <> 1/);
  assert.match(sql, /runtime\.ai_live_calls[\s\S]*?not runtime\.provider_writes[\s\S]*?not runtime\.external_scheduling/);
  assert.match(sql, /committed > cap/);
  assert.match(sql, /pricing_version text not null check \(pricing_version = 'openai-gpt-5\.6-sol-2026-08-01-v2'\)/);
  assert.match(sql, /usage_input > 272000 then 10 else 5/);
  assert.match(sql, /usage_input > 272000 then 45 else 30/);
  assert.match(sql, /usage_output not between 0 and 25000/);
  assert.match(sql, /p_accounted_microusd is distinct from expected_microusd/);
  assert.match(sql, /veroxa_fail_momo_content_ai_run_v1\(uuid,text,text,boolean,bigint,jsonb,uuid\)/);
  assert.match(sql, /veroxa_momo_content_ai_runs_restaurant_requested_idx/);
  assert.match(sql, /veroxa_momo_ready_packages_restaurant_ready_idx/);
  assert.match(sql, /veroxa_momo_ready_variants_restaurant_schedule_idx/);
  for (const index of [
    "veroxa_momo_content_runs_intake_idx",
    "veroxa_momo_content_runs_requested_by_idx",
    "veroxa_momo_content_runs_review_idx",
    "veroxa_momo_content_runs_rights_idx",
    "veroxa_momo_content_runs_source_asset_idx",
    "veroxa_momo_content_runs_team_decided_by_idx",
    "veroxa_momo_media_intake_asset_idx",
    "veroxa_momo_media_intake_initiated_by_idx",
    "veroxa_momo_ready_variants_media_asset_idx",
    "veroxa_momo_ready_variants_media_review_idx",
    "veroxa_momo_ready_packages_approved_by_idx",
    "veroxa_momo_ready_packages_intake_idx",
    "veroxa_momo_ready_packages_review_idx",
    "veroxa_momo_ready_packages_rights_idx",
    "veroxa_momo_ready_packages_source_asset_idx",
    "momo_ai_budget_controls_authorized_by_idx",
  ]) assert.match(indexSql, new RegExp(`create index if not exists ${index}`));
  assert.match(sql, /scope\.restaurant_id = new\.restaurant_id[\s\S]*?scope\.scope_key = 'momo_house_san_antonio'/);
  assert.match(sql, /create trigger veroxa_publish_queue_posting_off[\s\S]*?before insert or update on public\.veroxa_publish_queue/);
  assert.match(sql, /create trigger veroxa_publish_attempts_posting_off[\s\S]*?before insert or update on public\.veroxa_publish_attempts/);
  assert.match(sql, /create trigger veroxa_calendar_prepared_only[\s\S]*?before insert or update on public\.veroxa_content_calendar/);
  assert.match(sql, /create trigger veroxa_media_usage_prepared_only[\s\S]*?before insert or update on public\.veroxa_media_usage/);
  assert.match(sql, /tg_op = 'UPDATE' and exists \([\s\S]*?scope\.restaurant_id = old\.restaurant_id[\s\S]*?momo_external_posting_disabled_upload_to_ready_only/);
  assert.match(sql, /old\.restaurant_id is distinct from new\.restaurant_id[\s\S]*?momo_calendar_restaurant_scope_immutable/);
  assert.match(sql, /old\.restaurant_id is distinct from new\.restaurant_id[\s\S]*?momo_media_usage_restaurant_scope_immutable/);
  assert.match(sql, /calendar\.status not in \('draft','awaiting_approval','approved','cancelled'\)/);
  assert.match(sql, /calendar\.published_at is not null/);
  assert.match(sql, /new\.status not in \('draft','awaiting_approval','approved','cancelled'\)[\s\S]*?new\.published_at is not null/);
  assert.match(sql, /usage\.usage_kind = 'published' or usage\.external_reference is not null/);
  assert.match(sql, /problems := problems \|\| '"posting_boundary_violated"'::jsonb/);
  assert.doesNotMatch(sql, /before insert or update or delete on public\.veroxa_publish_(?:queue|attempts)/);
});
