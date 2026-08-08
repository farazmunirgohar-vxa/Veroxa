const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  TREE_HASH_ALGORITHM,
  V36_LIVE_PARITY_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  hashTree,
  readDeploymentManifest,
  repoRoot,
} from "./release-manifest";
const EXPECTED_CANDIDATE_TREE_SHA256 =
  "e19e1d7cc102ba1e6297de1860d005f19cbbb2dfd3873ed195af0c89d92b829c";
const EXPECTED_PENDING_HASHES = new Map<string, string>([
  [
    "20260808001210_audit_intake_envelope_v2.sql",
    "dbfe78e26034fa3d70851513f686c15cb332de128a242076953e90b372140983",
  ],
  [
    "20260808001430_momo_client_pipeline_readback_v3.sql",
    "b3671ef8a292f88e55bb733ceeda473ecf3095fd6048d20519fc7d5ddebe28ff",
  ],
  [
    "20260808001842_retire_audit_intake_v1.sql",
    "194b8737c12d4725bc978caa2c0b67135db6c954a34c07464bfffa4bc9dd1206",
  ],
  [
    "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
    "dee985a72833f78ffcf9ed6fa18ab231ae5f00fdb10e0737d4de83e82e61ce2d",
  ],
  [
    "20260808002609_future_object_default_acl_hardening.sql",
    "ab41ed8adf7170d81dc60a51607b12497cae6d52f1c28f63639e4fef6392e01a",
  ],
]);
const correctedLiveMigrationLedger = [
  "20260712213930_momo_production_foundation_v1.sql",
  "20260712213939_restaurant_audit_center_v1.sql",
  "20260712214343_production_foundation_advisor_hardening.sql",
  "20260712220501_production_release_blocker_hardening.sql",
  "20260712220656_audit_trigger_type_safety.sql",
  "20260712230242_audit_center_release_hardening.sql",
  "20260713010710_momo_full_operating_system_v1.sql",
  "20260713010916_momo_full_operating_system_advisor_hardening.sql",
  "20260713191147_momo_zero_cost_operating_rehearsal_v1.sql",
  "20260713212046_restaurant_audit_generation_v2.sql",
  "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
  "20260716035027_momo_preconnection_foundation.sql",
  "20260722210026_momo_client_media_status_v1.sql",
  "20260730221906_momo_media_ai_pilot_v1.sql",
  "20260801011047_momo_upload_to_ready_pipeline_v1.sql",
  "20260801011301_momo_upload_ready_index_hardening.sql",
  "20260801021452_momo_upload_ready_contract_hardening.sql",
  "20260801021615_momo_upload_ready_advisor_hardening.sql",
  "20260801024213_momo_content_ai_dispatch_claim_token.sql",
  "20260801045225_momo_content_ai_webhook_claim_lease.sql",
  "20260801045232_momo_content_ai_unbound_dispatch_recovery.sql",
  "20260801045317_momo_content_ai_dispatch_outbox.sql",
  "20260801045327_momo_content_ai_response_recovery.sql",
  "20260801045328_momo_content_ai_definitive_http_rejection.sql",
  "20260801045329_momo_content_ai_bound_response_expiry.sql",
  "20260802000522_momo_content_ai_background_activation.sql",
  "20260802002812_momo_real_owner_truth_reconfirmation.sql",
  "20260802002819_momo_content_ai_managed_boundary.sql",
  "20260802003123_momo_truth_confirmation_application_lineage.sql",
  "20260802003527_momo_private_rendition_usage_boundary.sql",
  "20260802004536_momo_content_input_confirmation_fail_closed.sql",
  "20260802004541_momo_rendition_usage_transaction_boundary.sql",
  "20260802063124_momo_upload_veroxa_ready_v2.sql",
  "20260802063133_momo_client_pipeline_readback_v2.sql",
  "20260802063829_momo_pipeline_query_indexes_v2.sql",
];
const expectedCandidateLedger = [
  ...correctedLiveMigrationLedger,
  ...LOCAL_CANDIDATE_PENDING_MIGRATIONS,
];
const retiredNormalizedFilenames = [
  "20260802010000_momo_upload_veroxa_ready_v2.sql",
  "20260802013000_momo_client_pipeline_readback_v2.sql",
  "20260802020000_momo_pipeline_query_indexes_v2.sql",
];
const retiredHistoricalAliases = [
  "20260722000100_momo_client_media_status_v1.sql",
  "20260728044916_momo_media_ai_pilot_v1.sql",
];
const expectedArchived = [
  "20260601000000_m024a_first_client_metadata_schema.sql",
  "20260615010100_live_automation_v1_database_foundation.sql",
  "20260615010200_media_upload_storage_foundation.sql",
  "20260616010400_profile_corrections_foundation.sql",
  "20260616010500_real_messages_foundation.sql",
  "20260616010600_activity_log_foundation.sql",
  "20260616010700_ai_draft_preparation_foundation.sql",
  "20260616010800_reports_from_activity_foundation.sql",
];
function sqlFiles(directory: string): string[] {
  return readdirSync(resolve(repoRoot, directory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
}
__name(sqlFiles, "sqlFiles");
function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
__name(sha256, "sha256");
function migrationTreeHash(directory: string, files: string[]): string {
  const hash = createHash("sha256");
  for (const filename of files) {
    hash.update(filename, "utf8");
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, directory, filename)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
__name(migrationTreeHash, "migrationTreeHash");
const manifest = readDeploymentManifest();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  throw new Error(
    `Deployment manifest does not preserve live/candidate separation: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}
const rootLedger = sqlFiles("supabase/migrations");
const sitesLedger = sqlFiles("artifacts/veroxa-sites/supabase/migrations");
const archivedLedger = sqlFiles("supabase/archive/legacy_unapplied_migrations");
const pendingSet = new Set<string>(LOCAL_CANDIDATE_PENDING_MIGRATIONS);
const rootLiveLedger = rootLedger.filter(
  (filename) => !pendingSet.has(filename),
);
const sitesLiveLedger = sitesLedger.filter(
  (filename) => !pendingSet.has(filename),
);
if (
  JSON.stringify(rootLedger) !== JSON.stringify(expectedCandidateLedger) ||
  JSON.stringify(sitesLedger) !== JSON.stringify(expectedCandidateLedger)
) {
  throw new Error(
    "Root and Sites migration inventories must contain the corrected live 37 followed by exactly five candidate-only migrations.",
  );
}
if (
  JSON.stringify(rootLiveLedger) !==
    JSON.stringify(correctedLiveMigrationLedger) ||
  JSON.stringify(sitesLiveLedger) !==
    JSON.stringify(correctedLiveMigrationLedger)
) {
  throw new Error(
    "Corrected live migration baseline no longer matches the exact 37-row remote ledger.",
  );
}
if (JSON.stringify(archivedLedger) !== JSON.stringify(expectedArchived)) {
  throw new Error(
    `Archived legacy migration set drifted: ${archivedLedger.join(", ")}`,
  );
}
for (const filename of [
  ...retiredNormalizedFilenames,
  ...retiredHistoricalAliases,
]) {
  if (rootLedger.includes(filename) || sitesLedger.includes(filename)) {
    throw new Error(`Non-ledger timestamp is active: ${filename}`);
  }
}
for (const filename of expectedCandidateLedger) {
  const rootSource = readFileSync(
    resolve(repoRoot, "supabase/migrations", filename),
  );
  const sitesSource = readFileSync(
    resolve(repoRoot, "artifacts/veroxa-sites/supabase/migrations", filename),
  );
  if (
    !/^\d{14}_.+\.sql$/u.test(filename) ||
    rootSource.toString().trim().length < 50
  ) {
    throw new Error(`Invalid canonical migration: ${filename}`);
  }
  if (!rootSource.equals(sitesSource)) {
    throw new Error(`Root/Sites migration parity failed: ${filename}`);
  }
}
const rootLiveTreeHash = migrationTreeHash(
  "supabase/migrations",
  rootLiveLedger,
);
const sitesLiveTreeHash = migrationTreeHash(
  "artifacts/veroxa-sites/supabase/migrations",
  sitesLiveLedger,
);
if (
  rootLiveTreeHash !== V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 ||
  sitesLiveTreeHash !== V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 ||
  rootLiveLedger.length !== 37 ||
  sitesLiveLedger.length !== 37
) {
  throw new Error(
    `Exact remote live baseline drifted (root=${rootLiveTreeHash}, Sites=${sitesLiveTreeHash}).`,
  );
}
const rootCandidateTree = hashTree(
  resolve(repoRoot, manifest.migrations.root),
  { suffix: ".sql" },
);
const sitesCandidateTree = hashTree(
  resolve(repoRoot, manifest.migrations.mirrorRoot!),
  { suffix: ".sql" },
);
if (
  rootCandidateTree.fileCount !== 42 ||
  sitesCandidateTree.fileCount !== 42 ||
  rootCandidateTree.sha256 !== EXPECTED_CANDIDATE_TREE_SHA256 ||
  sitesCandidateTree.sha256 !== EXPECTED_CANDIDATE_TREE_SHA256 ||
  manifest.migrations.evidenceScope !==
    LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE ||
  manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM ||
  manifest.migrations.fileCount !== rootCandidateTree.fileCount ||
  manifest.migrations.mirrorFileCount !== sitesCandidateTree.fileCount ||
  manifest.migrations.treeSha256 !== rootCandidateTree.sha256 ||
  manifest.migrations.mirrorTreeSha256 !== sitesCandidateTree.sha256 ||
  manifest.releaseCandidate.migrationTreeSha256 !== rootCandidateTree.sha256 ||
  manifest.releaseCandidate.migrationFileCount !== 42
) {
  throw new Error(
    `Local candidate fingerprint drifted (root=${rootCandidateTree.fileCount}/${rootCandidateTree.sha256}, Sites=${sitesCandidateTree.fileCount}/${sitesCandidateTree.sha256}).`,
  );
}
if (
  JSON.stringify(manifest.releaseCandidate.pendingMigrations) !==
    JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) ||
  manifest.releaseCandidate.databaseMigrationApplied ||
  manifest.releaseCandidate.databaseMigrationsApplied?.length !== 0 ||
  manifest.releaseCandidate.databaseApplyAuthorized ||
  manifest.releaseCandidate.deploymentAuthorized
) {
  throw new Error(
    "Forward migrations must remain candidate-only, unapplied, and unauthorized.",
  );
}
for (const filename of LOCAL_CANDIDATE_PENDING_MIGRATIONS) {
  const actualHash = sha256(resolve(repoRoot, "supabase/migrations", filename));
  if (actualHash !== EXPECTED_PENDING_HASHES.get(filename)) {
    throw new Error(`Pending candidate migration content drifted: ${filename}`);
  }
}
const latestLiveHash = sha256(
  resolve(
    repoRoot,
    "supabase/migrations",
    V36_LIVE_PARITY_EVIDENCE.latestMigration,
  ),
);
if (latestLiveHash !== V36_LIVE_PARITY_EVIDENCE.latestMigrationSha256) {
  throw new Error(
    `Latest corrected live migration drifted: ${V36_LIVE_PARITY_EVIDENCE.latestMigration}`,
  );
}
const historicalCloseout = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
    ),
    "utf8",
  ),
);
if (
  historicalCloseout.database?.migrationTreeSha256 !==
    V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 ||
  historicalCloseout.database.latestAppliedMigration !==
    "20260802020000_momo_pipeline_query_indexes_v2.sql" ||
  manifest.currentProductionObservation.migrationTreeEvidenceScope !==
    LIVE_MIGRATION_EVIDENCE_SCOPE ||
  manifest.currentProductionObservation
    .historicalRepositoryMigrationTreeEvidenceScope !==
    HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE
) {
  throw new Error(
    "Historical v36 repository evidence must remain immutable and explicitly separate from the corrected remote ledger.",
  );
}
console.log(
  "Supabase migration ledger guardrail passed: exact remote live37 d306d26c is mirrored byte-for-byte; five ordered forward migrations remain a 42-file local candidate only; historical v36 repository evidence is preserved separately.",
);
