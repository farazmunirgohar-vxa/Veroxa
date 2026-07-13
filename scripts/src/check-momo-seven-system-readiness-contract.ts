import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const contract = read(
  "artifacts/veroxa/docs/MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md",
);
const milestone = read("artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const checkpoint = read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const types = read("artifacts/veroxa/src/domain/momoOperationsV1/types.ts");
const adapters = read(
  "artifacts/veroxa/src/domain/momoOperationsV1/providerAdapters.ts",
);
const readiness = read(
  "artifacts/veroxa/src/domain/momoOperationsV1/readiness.ts",
);
const provisioning = read("scripts/src/provision-approved-team-identity.ts");
const provisioningHelper = read("scripts/src/approved-team-identity.ts");
const provisioningSource = `${provisioning}\n${provisioningHelper}`;
const provisioningContract = read(
  "scripts/src/check-approved-team-identity-provisioning.ts",
);
const authSmoke = read("scripts/src/smoke-approved-team-auth.ts");
const rootPackage = read("package.json");
const scriptsPackage = read("scripts/package.json");
const migration = read(
  "supabase/migrations/20260713010710_momo_full_operating_system_v1.sql",
);
const sqlTest = read("supabase/tests/momo_full_operating_system_v1.sql");
const rehearsalMigration = read(
  "supabase/migrations/20260713161533_momo_zero_cost_operating_rehearsal_v1.sql",
);
const rehearsalSqlTest = read(
  "supabase/tests/momo_zero_cost_operating_rehearsal_v1.sql",
);

const systemHeadings = [
  "### 1. Restaurant Intelligence + Onboarding V1",
  "### 2. Team identity + authenticated Team/Momo access",
  "### 3. Media intake + intelligence",
  "### 4. AI content strategy + calendar",
  "### 5. Meta social handling",
  "### 6. Google Business Profile + local visibility",
  "### 7. Work orchestration + reporting + final gate",
];
for (const heading of systemHeadings) {
  must(contract.includes(heading), `Seven-system contract missing: ${heading}`);
}

for (const marker of [
  "release candidate",
  "blocked external authority",
  "inactive pending authorized access",
  "No real Momo owner-confirmed",
  "active Team profile plus active Momo membership",
  "No new spend is approved",
  "provider_not_authorized",
  "incremental_spend_not_approved",
  "must not simulate success",
  "score is 100",
]) {
  must(
    contract.toLowerCase().includes(marker.toLowerCase()),
    `Seven-system contract missing fail-closed truth: ${marker}`,
  );
}

for (const marker of [
  "restaurant_truth",
  "onboarding",
  "media",
  "content",
  "approvals",
  "meta",
  "google_local",
  "operations",
  "monitoring_recovery",
  'state: "not_connected" | "pending_owner" | "connected"',
  'gate: "ready" | "blocked"',
]) {
  must(types.includes(marker), `Momo operations type contract missing: ${marker}`);
}

for (const marker of [
  "createDeferredMomoProviderAdapters",
  'status: "blocked"',
  "provider_not_authorized",
  "incremental_spend_not_approved",
  "classifyMedia",
  "generateContent",
  "publishApproved",
  "monitorVisibility",
  "capabilityForPublication",
  "google_business_profile_write",
]) {
  must(adapters.includes(marker), `Deferred provider contract missing: ${marker}`);
}
must(
  !adapters.includes('status: "completed"'),
  "Default provider adapter must not fabricate a completed provider result",
);
for (const marker of [
  "score === 100 && blockingChecks.length === 0",
  "Passed readiness check lacks evidence",
  "Duplicate readiness key",
  "Invalid readiness weight",
]) {
  must(readiness.includes(marker), `Readiness fail-closed contract missing: ${marker}`);
}

for (const marker of [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VEROXA_APPROVED_TEAM_EMAIL",
  "VEROXA_PROVISION_APPROVED_TEAM_IDENTITY",
  "auth.admin.createUser",
  "email_confirm: true",
  "persistSession: false",
]) {
  must(provisioningSource.includes(marker), `Server-only Team provisioning missing: ${marker}`);
}
must(
  !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(provisioning),
  "Approved Team email must not be hardcoded in the provisioning entrypoint",
);
for (const marker of [
  "already_exists",
  "rolled back",
  "calls.remove",
  "not-allowlisted@example.test",
]) {
  must(
    provisioningContract.includes(marker),
    `Provisioning mock contract missing: ${marker}`,
  );
}
for (const marker of [
  "VEROXA_RUN_APPROVED_TEAM_AUTH_SMOKE",
  "SUPABASE_PUBLISHABLE_KEY",
  "validatedAuthRedirect",
  "veroxasystems.com",
  "generateLink",
  "hashed_token",
  "verifyOtp",
  "Authenticated Team RLS smoke query failed",
  'signOut({ scope: "local" })',
  'admin.auth.admin.signOut(accessToken, "local")',
]) {
  must(authSmoke.includes(marker), `Authenticated Team smoke harness missing: ${marker}`);
}
must(
  !/(?:console\.(?:log|error)\(\s*(?:link|tokenHash|session)|JSON\.stringify\(\s*(?:link|tokenHash|session))/i.test(
    authSmoke,
  ),
  "Auth smoke harness may expose a link, token, or session",
);

for (const marker of [
  "veroxa_restaurant_truth_fields",
  "owner_confirmed",
  "rights",
  "readiness",
  "retry",
  "meta",
  "google",
  "enable row level security",
  "force row level security",
  "revoke all on table",
  "grant select, insert, update",
  "security invoker",
  "jsonb_array_length(evidence) > 0",
  "create policy veroxa_media_team_update on public.veroxa_media_assets",
  "veroxa_momo_client_snapshot_v1",
  "security definer",
  "set search_path = ''",
  "revoke all on function public.veroxa_momo_client_snapshot_v1",
  "grant execute on function public.veroxa_momo_client_snapshot_v1",
  "veroxa_private.validate_confirmation_subject",
  "veroxa_confirmations_subject_guard",
  "before insert or update of restaurant_id, subject_type, subject_id, confirmation_kind",
  "confirmation_subject_kind_mismatch",
  "veroxa_private.validate_content_calendar_gate",
  "veroxa_content_calendar_approval_gate",
  "veroxa_apply_approval_v1",
  "veroxa_review_momo_media_v1",
  "'pendingContentConfirmations'",
]) {
  must(
    migration.toLowerCase().includes(marker.toLowerCase()),
    `Seven-system migration missing cross-system marker: ${marker}`,
  );
}
must(migration.trim().length > 1_000, "Seven-system migration is empty or incomplete");
const snapshotStart = migration.indexOf(
  "create or replace function public.veroxa_momo_client_snapshot_v1",
);
const snapshotEnd = migration.indexOf(
  "revoke all on function public.veroxa_momo_client_snapshot_v1",
  snapshotStart,
);
const snapshotFunction =
  snapshotStart >= 0 && snapshotEnd > snapshotStart
    ? migration.slice(snapshotStart, snapshotEnd)
    : "";
for (const marker of [
  "security definer",
  "set search_path = ''",
  "public.veroxa_current_user_has_active_restaurant(target_restaurant_id)",
  "'source', field.source",
  "'storagePath', asset.storage_path",
  "'reviewStatus', review.status",
]) {
  must(snapshotFunction.includes(marker), `Client snapshot authorization missing: ${marker}`);
}
for (const forbiddenColumn of [
  "external_account_id",
  "scopes",
  "last_error",
  "input_payload",
  "output_payload",
]) {
  must(
    !snapshotFunction.includes(forbiddenColumn),
    `Client snapshot exposes internal column: ${forbiddenColumn}`,
  );
}
for (const marker of [
  "plan(",
  "veroxa_restaurant_truth_fields",
  "veroxa_readiness_gate_runs",
  "veroxa_publish_queue",
  "veroxa_provider_connections",
  "relforcerowsecurity",
  "second operational restaurant",
  "empty evidence",
  "veroxa_momo_client_snapshot_v1",
  "Client can bypass sanitized snapshot through content base table",
  "Client can read internal provider connection columns directly",
  "Sanitized client snapshot omitted truthful safe data",
  "confirmation_subject_not_in_momo_scope",
  "Kind-only confirmation update bypassed subject pairing",
  "Content calendar accepted an unapproved variant",
  "Transactional media review did not supersede history and update asset state",
  "veroxa_apply_approval_v1",
  "storagePath",
  "pendingContentConfirmations",
]) {
  must(sqlTest.includes(marker), `Seven-system pgTAP contract missing: ${marker}`);
}

for (const marker of [
  "Momo Zero-Cost Operating Rehearsal V1",
  "momo-media-rights-v1",
  "8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f",
  "veroxa_private.truth_value_shape_valid_v1",
  "jsonb_object_keys",
  "veroxa_submit_momo_confirmation_v1",
  "veroxa_save_momo_contact_prefill_v1",
  "veroxa_add_momo_media_tag_v1",
  "veroxa_create_manual_content_draft_v1",
  "veroxa_create_manual_variant_v1",
  "veroxa_schedule_momo_variant_v1",
  "veroxa_revise_momo_report_draft_v1",
  "veroxa_transition_momo_alert_v1",
  "veroxa_private.provider_presence_authority_current_v1",
  "owner_presence_authorization_withdrawn",
  "owner_content_direction_rejected",
  "eligibleCapabilities",
  "provider_runtime_inactive_zero_cost_rehearsal",
  "active_recovery_blocks_work_retry",
  "veroxa_run_momo_no_go_rehearsal_v1",
  "clock_timestamp()",
]) {
  must(
    rehearsalMigration.includes(marker),
    `Zero-cost rehearsal migration missing: ${marker}`,
  );
}
must(
  !rehearsalMigration.includes("jsonb_object_length"),
  "Zero-cost rehearsal migration uses nonexistent jsonb_object_length",
);
must(
  rehearsalMigration.trim().length > 10_000,
  "Zero-cost rehearsal migration is empty or incomplete",
);
for (const marker of [
  "plan(2)",
  "[\"no\",\"halal\"]",
  "Free delivery today.",
  "Lobster $12.",
  "100% certified halal.",
  "We offer delivery.",
  "We serve steamed chicken momo.",
  "We are open until 11 PM.",
  "Pending owner presence withdrawal did not freeze preflight",
  "Owner content rejection did not cancel queue and calendar",
  "Attempt ledger did not preserve initial plus retry history",
  "Unsafe report narrative was accepted",
  "No-Go rehearsal did not remain fail-closed",
]) {
  must(
    rehearsalSqlTest.includes(marker),
    `Zero-cost rehearsal pgTAP contract missing: ${marker}`,
  );
}

for (const document of [milestone, status, activeDocs]) {
  must(
    document.includes("MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md"),
    "Durable operating docs do not reference the seven-system contract",
  );
}
for (const marker of [
  "authenticated Team/Momo protected",
  "inactive pending authorized access",
  "no Momo owner",
]) {
  must(
    `${milestone}\n${status}\n${checkpoint}`.toLowerCase().includes(marker.toLowerCase()),
    `Durable release truth missing: ${marker}`,
  );
}

for (const command of [
  "check-momo-seven-system-readiness-contract",
  "check-approved-team-identity-provisioning",
  "check-sites-momo-operating-contract",
]) {
  must(rootPackage.includes(command), `verify:veroxa does not run ${command}`);
  must(scriptsPackage.includes(command), `Scripts package missing ${command}`);
}
for (const command of [
  "provision-approved-team-identity",
  "smoke-approved-team-auth",
]) {
  must(scriptsPackage.includes(command), `Scripts package missing ${command}`);
  must(
    !rootPackage.includes(`run ${command}`),
    `External identity command must not run automatically in verify:veroxa: ${command}`,
  );
}

if (failures.length) {
  console.error(
    "Momo seven-system readiness contract failed:\n" +
      failures.map((failure) => `- ${failure}`).join("\n"),
  );
  process.exit(1);
}

console.log("Momo seven-system readiness contract passed.");
