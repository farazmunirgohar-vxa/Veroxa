import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL(
  "../supabase/migrations/20260802004536_momo_content_input_confirmation_fail_closed.sql",
  import.meta.url,
), "utf8");

test("every truth input stays visible when no applicable confirmation exists", () => {
  assert.match(migration, /left join lateral \([\s\S]*?truth_confirmation_applies_to_v1/u);
  assert.doesNotMatch(migration, /\n\s+join lateral \(/u);
  assert.match(migration, /latest\.id is null/u);
});

test("latest pending, rejected, or mismatched confirmation fails closed", () => {
  assert.match(migration, /latest\.status is distinct from 'approved'/u);
  assert.match(migration, /latest\.decision is null[\s\S]*?latest\.decision not in \('confirm','correct'\)/u);
  assert.match(migration, /latest\.evidence_class is distinct from 'real_owner'/u);
  assert.match(migration, /field\.owner_confirmed_by is distinct from latest\.submitted_by/u);
  assert.match(migration, /field\.owner_confirmed_at is distinct from latest\.submitted_at/u);
});

test("the validator remains private and not directly callable by API roles", () => {
  assert.match(migration, /security definer set search_path = ''/u);
  assert.match(migration, /from public, anon, authenticated, service_role;/u);
  assert.doesNotMatch(migration, /grant execute/u);
});
