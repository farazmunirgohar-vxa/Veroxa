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
  "3efcc5266275463665f45eed9320cd3bf108abe623c2a7771558789ecd1c669e";
const EXPECTED_CURRENT_LIVE_TREE_SHA256 =
  "dc565dd1f5f4a5efe6a2b253e7437e93f6364b5581c56bb811969fa7241a7a84";
const EXPECTED_CURRENT_LIVE_SITES_TREE_SHA256 =
  "929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18";
const EXPECTED_CANDIDATE_SITES_TREE_SHA256 =
  "a007f78d2826aa9b9f372f1aec8cae4d768e759ba15e6b7cf7281a013b79db3e";
const APPLIED_FORWARD_MIGRATIONS = [
  "20260808001210_audit_intake_envelope_v2.sql",
  "20260808001430_momo_client_pipeline_readback_v3.sql",
  "20260808001842_retire_audit_intake_v1.sql",
  "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
  "20260808002609_future_object_default_acl_hardening.sql",
] as const;
const EXPECTED_APPLIED_FORWARD_HASHES = new Map<string, string>([
  [
    "20260808001210_audit_intake_envelope_v2.sql",
    "dbfe78e26034fa3d70851513f686c15cb332de128a242076953e90b372140983",
  ],
  [
    "20260808001430_momo_client_pipeline_readback_v3.sql",
    "987186e74590c6e484ebfee47e1c7ed384e2b4dc8c4a97ad7243ae38feb765cc",
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
const EXPECTED_PENDING_HASHES = new Map<string, string>([
  [
    "20260808040400_momo_client_pipeline_displayed_rights_scope_fix.sql",
    "3255058ddb4a406757d27b5e9d4c61c6462bff24bde64da6c6573637a3fdbaac",
  ],
]);
const historicalLiveMigrationLedger = [
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
  ...historicalLiveMigrationLedger,
  ...APPLIED_FORWARD_MIGRATIONS,
  ...LOCAL_CANDIDATE_PENDING_MIGRATIONS,
];
const expectedCurrentLiveLedger = [
  ...historicalLiveMigrationLedger,
  ...APPLIED_FORWARD_MIGRATIONS,
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
    "Root and Sites migration inventories must contain immutable historical37, the exact five-migration live rollout prefix, and only the pending 040400 repair.",
  );
}
if (
  JSON.stringify(rootLiveLedger) !==
    JSON.stringify(expectedCurrentLiveLedger) ||
  JSON.stringify(sitesLiveLedger) !== JSON.stringify(expectedCurrentLiveLedger)
) {
  throw new Error(
    "Current migration baseline no longer matches the exact 42-row production ledger through 02609.",
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
  rootLiveTreeHash !== EXPECTED_CURRENT_LIVE_TREE_SHA256 ||
  sitesLiveTreeHash !== EXPECTED_CURRENT_LIVE_TREE_SHA256 ||
  rootLiveLedger.length !== 42 ||
  sitesLiveLedger.length !== 42 ||
  rootLiveLedger.at(-1) !==
    "20260808002609_future_object_default_acl_hardening.sql"
) {
  throw new Error(
    `Exact remote live42 prefix drifted (root=${rootLiveTreeHash}, Sites=${sitesLiveTreeHash}).`,
  );
}
const rootHistoricalTreeHash = migrationTreeHash(
  "supabase/migrations",
  historicalLiveMigrationLedger,
);
const sitesHistoricalTreeHash = migrationTreeHash(
  "artifacts/veroxa-sites/supabase/migrations",
  historicalLiveMigrationLedger,
);
if (
  historicalLiveMigrationLedger.length !== 37 ||
  rootHistoricalTreeHash !== V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 ||
  sitesHistoricalTreeHash !== V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256
) {
  throw new Error(
    "Immutable historical37 d306d26c prefix drifted while recording the partial rollout.",
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
  rootCandidateTree.fileCount !== 43 ||
  sitesCandidateTree.fileCount !== 43 ||
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
  manifest.releaseCandidate.migrationFileCount !== 43
) {
  throw new Error(
    `Local candidate fingerprint drifted (root=${rootCandidateTree.fileCount}/${rootCandidateTree.sha256}, Sites=${sitesCandidateTree.fileCount}/${sitesCandidateTree.sha256}).`,
  );
}
const currentProduction = manifest.currentProductionObservation;
if (
  manifest.schemaVersion !== 7 ||
  currentProduction.sitesVersion !== 37 ||
  !currentProduction.sitesCheckoutCommit.startsWith("61e9ace") ||
  currentProduction.sourceFileCount !== 200 ||
  currentProduction.sourceTreeSha256 !==
    EXPECTED_CURRENT_LIVE_SITES_TREE_SHA256 ||
  currentProduction.productionMigrationCount !== 42 ||
  currentProduction.migrationTreeSha256 !== EXPECTED_CURRENT_LIVE_TREE_SHA256 ||
  currentProduction.latestProductionMigration !==
    "20260808002609_future_object_default_acl_hardening.sql" ||
  currentProduction.latestProductionMigrationSha256 !==
    EXPECTED_APPLIED_FORWARD_HASHES.get(
      "20260808002609_future_object_default_acl_hardening.sql",
    ) ||
  !currentProduction.databaseLedgerObserved ||
  !currentProduction.databaseAppliedThroughLatestObserved ||
  currentProduction.candidateMigrationsMatchLiveLedger ||
  currentProduction.fullReleaseGatePassed
) {
  throw new Error(
    "Schema-7 production evidence must identify exact Sites v37 / 61e9ace and the exact live42 prefix through 02609 without claiming full candidate parity.",
  );
}
if (
  JSON.stringify(manifest.releaseCandidate.pendingMigrations) !==
    JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) ||
  manifest.releaseCandidate.databaseMigrationApplied ||
  JSON.stringify(manifest.releaseCandidate.databaseMigrationsApplied) !==
    JSON.stringify(APPLIED_FORWARD_MIGRATIONS) ||
  manifest.releaseCandidate.sourceFileCount !== 201 ||
  manifest.releaseCandidate.sourceTreeSha256 !==
    EXPECTED_CANDIDATE_SITES_TREE_SHA256 ||
  manifest.releaseCandidate.futureSitesVersion !== null ||
  manifest.releaseCandidate.sitesPublished ||
  !manifest.releaseCandidate.databaseApplyAuthorized ||
  !manifest.releaseCandidate.sitesPublishAuthorized ||
  !manifest.releaseCandidate.deploymentAuthorized
) {
  throw new Error(
    "Release evidence must record five applied migrations, only 040400 pending, and an authorized but not-yet-published corrective Sites candidate whose version is not preassigned.",
  );
}
const rolloutSteps = manifest.rolloutSequence?.steps ?? [];
const migrationStep = (filename: string) =>
  rolloutSteps.find((step) => step.migration === filename);
const originalSitesPublish = rolloutSteps.find(
  (step) => step.id === "publish_and_verify_audit_v2_and_client_v3_routes",
);
const repairStep = migrationStep(LOCAL_CANDIDATE_PENDING_MIGRATIONS[0]);
const correctiveSitesPublish = rolloutSteps.find(
  (step) => step.id === "republish_and_verify_repaired_client_v3",
);
if (
  rolloutSteps.length !== 8 ||
  APPLIED_FORWARD_MIGRATIONS.some(
    (filename) => migrationStep(filename)?.completed !== true,
  ) ||
  LOCAL_CANDIDATE_PENDING_MIGRATIONS.some(
    (filename) => migrationStep(filename)?.completed !== false,
  ) ||
  originalSitesPublish?.action !== "sites_publish_and_verify" ||
  originalSitesPublish.completed !== true ||
  originalSitesPublish.requiresCompletedStep !==
    migrationStep(APPLIED_FORWARD_MIGRATIONS[1])?.id ||
  repairStep?.id !== "repair_client_pipeline_displayed_rights_scope" ||
  repairStep.action !== "database_migration" ||
  repairStep.completed !== false ||
  repairStep.requiresCompletedStep !==
    migrationStep(APPLIED_FORWARD_MIGRATIONS[4])?.id ||
  correctiveSitesPublish?.action !== "sites_publish_and_verify" ||
  correctiveSitesPublish.completed !== false ||
  correctiveSitesPublish.requiresCompletedStep !== repairStep.id
) {
  throw new Error(
    "Rollout evidence must mark the five live migrations and original Sites v37 publish complete, then keep 040400 and the dependent corrective Sites v38 republish pending.",
  );
}
for (const filename of APPLIED_FORWARD_MIGRATIONS) {
  const actualHash = sha256(resolve(repoRoot, "supabase/migrations", filename));
  if (actualHash !== EXPECTED_APPLIED_FORWARD_HASHES.get(filename)) {
    throw new Error(
      `Applied production migration content drifted: ${filename}`,
    );
  }
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
  "Supabase migration ledger guardrail passed: historical37 d306d26c is immutable; live42 dc565dd1 through 02609 plus pending 040400 form the exact 43-file candidate; corrective Sites v38 publication remains blocked behind the repair.",
);
