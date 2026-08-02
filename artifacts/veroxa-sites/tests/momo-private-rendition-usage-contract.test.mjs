import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL(
  "../supabase/migrations/20260802004541_momo_rendition_usage_transaction_boundary.sql",
  import.meta.url,
), "utf8");
const postingOff = await readFile(new URL(
  "../supabase/migrations/20260801011047_momo_upload_to_ready_pipeline_v1.sql",
  import.meta.url,
), "utf8");

test("private rendition attachment cannot resemble an external publication receipt", () => {
  assert.match(migration, /veroxa_content_media_placements/u);
  assert.match(migration, /p_platform, 'draft', null, \(select auth\.uid\(\)\)/u);
  assert.doesNotMatch(migration, /'rendition:' \|\| rendition_record\.id/u);
  assert.match(postingOff, /new\.usage_kind = 'published' or new\.external_reference is not null/u);
});

test("rendition attachment authorizes its immutable usage insert in the same RPC", () => {
  const trustedWrite = migration.indexOf(
    "perform set_config('veroxa.trusted_media_usage_write', 'on', true)",
  );
  const usageInsert = migration.indexOf("insert into public.veroxa_media_usage");
  assert.ok(trustedWrite >= 0 && usageInsert > trustedWrite);
});

test("rendition attachment remains a Team-only authenticated operation", () => {
  assert.match(migration, /veroxa_current_user_is_team_for_restaurant/u);
  assert.match(migration, /security definer set search_path = ''/u);
  assert.match(migration, /from public, anon, authenticated, service_role;[\s\S]*?to authenticated;/u);
});
