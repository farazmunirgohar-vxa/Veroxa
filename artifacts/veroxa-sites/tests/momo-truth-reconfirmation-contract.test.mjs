import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL(
  "../supabase/migrations/20260802003123_momo_truth_confirmation_application_lineage.sql",
  import.meta.url,
), "utf8");
const firstHardening = await readFile(new URL(
  "../supabase/migrations/20260802002812_momo_real_owner_truth_reconfirmation.sql",
  import.meta.url,
), "utf8");

const historical = [
  [
    "../supabase/migrations/20260713191147_momo_zero_cost_operating_rehearsal_v1.sql",
    "07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a",
  ],
  [
    "../supabase/migrations/20260716035027_momo_preconnection_foundation.sql",
    "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367",
  ],
  [
    "../supabase/migrations/20260802002812_momo_real_owner_truth_reconfirmation.sql",
    "e6e2922b2637b1addadf92b0e26cccb618d30647e37352c4f4fb7bd760e76632",
  ],
];

function applyBody() {
  const start = migration.indexOf(
    "create or replace function public.veroxa_apply_confirmation_v1",
  );
  const end = migration.indexOf(
    "revoke all on function public.veroxa_apply_confirmation_v1",
    start,
  );
  assert.ok(start >= 0 && end > start);
  return migration.slice(start, end);
}

test("truth reconfirmation is forward-only and preserves applied history", async () => {
  for (const [path, expected] of historical) {
    const bytes = await readFile(new URL(path, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }
  assert.match(firstHardening, /add column if not exists submitted_subject_id uuid/u);
  assert.match(firstHardening, /new\.submitted_subject_id := new\.subject_id/u);
  assert.match(migration, /confirmation_submitted_subject_is_immutable/u);
  assert.match(migration, /momo_truth_confirmation_applications/u);
  assert.match(migration, /applied\.supersedes_id = submitted\.id/u);
  assert.match(migration, /applied\.owner_confirmed_by = confirmation\.submitted_by/u);
  assert.match(migration, /applied\.owner_confirmed_at = confirmation\.submitted_at/u);
  assert.match(migration, /applied\.evidence_class = confirmation\.evidence_class/u);
});

test("authority is frozen and cannot be upgraded or downgraded during review", () => {
  const body = applyBody();
  assert.match(body, /from public\.veroxa_momo_evidence_authorities authority[\s\S]*?for share/u);
  assert.match(body, /current_authority_evidence is distinct from confirmation_record\.evidence_class/u);
  assert.match(body, /truth_confirmation_authority_changed_resubmit_required/u);
  assert.match(body, /old_truth\.evidence_class = 'real_owner'[\s\S]*?confirmation_record\.evidence_class <> 'real_owner'/u);
  assert.match(body, /truth_confirmation_evidence_cannot_be_downgraded/u);
  assert.ok(body.indexOf("truth_confirmation_authority_changed_resubmit_required") <
    body.indexOf("update public.veroxa_confirmations"));
});

test("every confirmed-truth reattestation creates one linked immutable successor", () => {
  const body = applyBody();
  assert.match(body, /if old_truth\.status = 'owner_confirmed' then[\s\S]*?set is_current = false, status = 'superseded'/u);
  assert.match(body, /coalesce\(applied_value, old_truth\.value_json\)/u);
  assert.match(body, /owner_confirmed_by, owner_confirmed_at, supersedes_id, created_by/u);
  assert.match(body, /returning id, evidence_class into new_truth_id, applied_truth_evidence/u);
  assert.match(body, /insert into veroxa_private\.momo_truth_confirmation_applications/u);
  assert.match(body, /confirmation_record\.subject_id, new_truth_id, reviewer_id/u);
  assert.doesNotMatch(body, /subject_id = new_truth_id/u);
  assert.doesNotMatch(body, /set\s+evidence_class\s*=/u);
});

test("all truth consumers resolve the immutable application lineage", () => {
  assert.match(migration, /truth_confirmation_applies_to_v1/u);
  assert.match(migration, /confirmation\.subject_id = p_truth_id[\s\S]*?application\.applied_truth_id = p_truth_id/u);
  assert.match(migration, /content_inputs_current_v1[\s\S]*?truth_confirmation_applies_to_v1\([\s\S]*?confirmation\.id, input\.truth_field_id/u);
  assert.match(migration, /veroxa_momo_manual_pilot_gate_v1[\s\S]*?truth_confirmation_applies_to_v1\([\s\S]*?confirmation\.id, field\.id/u);
});

test("the human review RPC remains authenticated-only and fail-closed", () => {
  assert.match(migration, /language plpgsql[\s\S]*?security definer[\s\S]*?set search_path = ''/u);
  assert.match(migration, /from public, anon, authenticated, service_role;[\s\S]*?to authenticated;/u);
  assert.match(migration, /confirmation_already_decided/u);
  assert.match(migration, /confirmation_subject_changed_resubmit_required/u);
});
