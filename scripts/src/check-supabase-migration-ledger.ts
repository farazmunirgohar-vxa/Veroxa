import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  VERIFIED_GITHUB_PARITY_RELEASE_STATE,
  VERIFIED_GITHUB_PARITY_STATUS,
  VERIFIED_MIGRATION_EVIDENCE_SCOPE,
  VERIFIED_PRODUCTION_EVIDENCE_STATUS,
  V36_GITHUB_RECONCILIATION,
  V36_OPERATIONAL_COMMIT_SCOPE,
  type GitHubReconciliationEvidence,
} from "./release-manifest";

const root = resolve(import.meta.dirname, "../..");
const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as T;

const EXPECTED_MIGRATION_TREE_SHA256 =
  "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90";
const LATEST_MIGRATION = "20260802020000_momo_pipeline_query_indexes_v2.sql";
const LATEST_MIGRATION_SHA256 =
  "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd";
const SITES_V36_SOURCE_SHA256 =
  "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7";
const GITHUB_MAIN_AT_RECONCILIATION =
  "302621bf6b9ab78320abe4175b45b56e9e64ae2a";
const GITHUB_MAIN_AFTER_RECONCILIATION = V36_GITHUB_RECONCILIATION.mergedCommit;

const expectedMigrationLedger = [
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
  "20260802010000_momo_upload_veroxa_ready_v2.sql",
  "20260802013000_momo_client_pipeline_readback_v2.sql",
  LATEST_MIGRATION,
] as const;

const retiredActiveFilenames = [
  "20260722000100_momo_client_media_status_v1.sql",
  "20260728044916_momo_media_ai_pilot_v1.sql",
] as const;

const expectedArchived = [
  "20260601000000_m024a_first_client_metadata_schema.sql",
  "20260615010100_live_automation_v1_database_foundation.sql",
  "20260615010200_media_upload_storage_foundation.sql",
  "20260616010400_profile_corrections_foundation.sql",
  "20260616010500_real_messages_foundation.sql",
  "20260616010600_activity_log_foundation.sql",
  "20260616010700_ai_draft_preparation_foundation.sql",
  "20260616010800_reports_from_activity_foundation.sql",
] as const;

type ReleaseCandidate = {
  status?: string;
  state?: string;
  actionScope: string;
  basedOnGitHubMainCommit: string;
  pullRequest: number | null;
  githubMerged: boolean;
  futureMergedGitHubCommit: string | null;
  futureSitesVersion: number | null;
  reviewedLocally: boolean;
  candidateSourceMatchesLiveSites: boolean;
  candidateMigrationsMatchLiveLedger: boolean;
  githubMainMatchesCandidate: boolean;
  fullReleaseGatePassed: boolean;
  sourceFileCount: number;
  sourceTreeSha256: string;
  migrationFileCount: number;
  migrationTreeSha256: string;
  latestCandidateMigration: string;
  latestCandidateMigrationSha256: string;
  databaseChangesRequired: boolean;
  databaseMigrationApplied: boolean;
  sitesPublishRequired: boolean;
  sitesPublished?: boolean;
  sitesCandidatePublished?: boolean;
  localReviewPassed?: boolean;
  allFourWorkflowsGreen?: boolean | null;
  zeroUnresolvedReviewThreads?: boolean | null;
};

type LastGitHubParityRelease = {
  evidenceScope: string;
  supersededAsLiveBaseline: boolean;
  pullRequest: number;
  githubMainCommit?: string;
  mergedOperationalCommit?: string;
  sitesVersion: number;
  productionMigrationCount?: number;
  productionMigrations?: number;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  sitesSourceParityVerified: boolean;
  migrationContentParityVerified: boolean;
  migrationFilenameParityVerified: boolean;
};

type CurrentProductionObservation = {
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  canonicalGitHubMainCommitScope: string;
  githubMainMatchesCandidate: boolean;
  sitesVersion: number;
  sitesCheckoutCommit?: string;
  sitesCheckoutSourceCommit?: string;
  sourceFileCount: number;
  sourceTreeSha256: string;
  candidateSourceMatchesLiveSites: boolean;
  productionMigrationCount?: number;
  productionMigrations?: number;
  migrationTreeSha256: string;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseLedgerObserved: boolean;
  databaseAppliedThroughLatestObserved: boolean;
  candidateMigrationsMatchLiveLedger: boolean;
  fullReleaseGatePassed: boolean;
};

type Manifest = {
  schemaVersion: number;
  releaseState: string;
  lastGitHubParityRelease: LastGitHubParityRelease;
  historicalProductionObservations: Array<{
    sitesVersion: number;
    productionMigrationCount: number;
    productionMigrations?: number;
    latestProductionMigration: string;
  }>;
  currentProductionObservation: CurrentProductionObservation;
  githubReconciliationEvidence: GitHubReconciliationEvidence;
  releaseCandidate: ReleaseCandidate;
  migrations: {
    evidenceScope: string;
    root: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
  };
};

type Checkpoint = {
  schemaVersion: number;
  status: string;
  lastGitHubParityRelease: LastGitHubParityRelease;
  historicalProductionObservations: Array<{
    sitesVersion: number;
    productionMigrations?: number;
    productionMigrationCount?: number;
    latestProductionMigration: string;
  }>;
  currentProductionObservation: CurrentProductionObservation;
  githubReconciliationEvidence: GitHubReconciliationEvidence;
  releaseCandidate: ReleaseCandidate;
  databaseMigrations: string[];
};

const manifest = readJson<Manifest>(
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);
const checkpoint = readJson<Checkpoint>(
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);

function sqlFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

function migrationTreeHash(
  directory: string,
  files: readonly string[],
): string {
  const hash = createHash("sha256");
  for (const filename of files) {
    hash.update(filename, "utf8");
    hash.update("\0");
    hash.update(readFileSync(resolve(root, directory, filename)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function productionMigrationCount(
  observation: CurrentProductionObservation,
): number | undefined {
  return (
    observation.productionMigrationCount ?? observation.productionMigrations
  );
}

function assertLastGitHubParityRelease(
  release: LastGitHubParityRelease,
  label: string,
): void {
  const migrationCount =
    release.productionMigrationCount ?? release.productionMigrations;
  if (
    release.evidenceScope !== "last_github_sites_parity_release" ||
    !release.supersededAsLiveBaseline ||
    release.pullRequest !== 155 ||
    (release.githubMainCommit ?? release.mergedOperationalCommit) !==
      "d1f6a9a78ac54cd5447689d5f8b3d42466daf479" ||
    release.sitesVersion !== 22 ||
    migrationCount !== 16 ||
    release.latestProductionMigration !==
      "20260728044916_momo_media_ai_pilot_v1.sql" ||
    release.latestProductionMigrationSha256 !==
      "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1" ||
    !release.sitesSourceParityVerified ||
    !release.migrationContentParityVerified ||
    !release.migrationFilenameParityVerified
  ) {
    throw new Error(
      `${label} must preserve PR #155 / Sites v22 solely as the last GitHub-to-Sites parity release.`,
    );
  }
}

function assertCurrentProductionObservation(
  observation: CurrentProductionObservation,
  label: string,
): void {
  if (
    observation.evidenceStatus !== VERIFIED_PRODUCTION_EVIDENCE_STATUS ||
    observation.canonicalGitHubMainCommit !==
      GITHUB_MAIN_AFTER_RECONCILIATION ||
    observation.canonicalGitHubMainCommitScope !==
      V36_OPERATIONAL_COMMIT_SCOPE ||
    !observation.githubMainMatchesCandidate ||
    observation.sitesVersion !== 36 ||
    (observation.sitesCheckoutCommit ??
      observation.sitesCheckoutSourceCommit) !==
      "b8122642b72e5d4e6e74c379469f2a157781ab3d" ||
    observation.sourceFileCount !== 185 ||
    observation.sourceTreeSha256 !== SITES_V36_SOURCE_SHA256 ||
    !observation.candidateSourceMatchesLiveSites ||
    productionMigrationCount(observation) !== expectedMigrationLedger.length ||
    observation.migrationTreeSha256 !== EXPECTED_MIGRATION_TREE_SHA256 ||
    observation.latestProductionMigration !== LATEST_MIGRATION ||
    observation.latestProductionMigrationSha256 !== LATEST_MIGRATION_SHA256 ||
    !observation.databaseLedgerObserved ||
    !observation.databaseAppliedThroughLatestObserved ||
    !observation.candidateMigrationsMatchLiveLedger ||
    !observation.fullReleaseGatePassed
  ) {
    throw new Error(
      `${label} must preserve the live Sites v36 / 37-migration observation with verified GitHub parity.`,
    );
  }
}

function assertReconciliationCandidate(
  candidate: ReleaseCandidate,
  label: string,
): void {
  const published =
    candidate.sitesPublished ?? candidate.sitesCandidatePublished;
  if (
    (candidate.status ?? candidate.state) !== VERIFIED_GITHUB_PARITY_STATUS ||
    candidate.actionScope !== "github_reconciliation_candidate" ||
    candidate.basedOnGitHubMainCommit !== GITHUB_MAIN_AT_RECONCILIATION ||
    candidate.pullRequest !== V36_GITHUB_RECONCILIATION.pullRequest ||
    !candidate.githubMerged ||
    candidate.futureMergedGitHubCommit !== GITHUB_MAIN_AFTER_RECONCILIATION ||
    candidate.futureSitesVersion !== null ||
    !candidate.candidateSourceMatchesLiveSites ||
    !candidate.candidateMigrationsMatchLiveLedger ||
    !candidate.githubMainMatchesCandidate ||
    !candidate.fullReleaseGatePassed ||
    candidate.sourceFileCount !== 185 ||
    candidate.sourceTreeSha256 !== SITES_V36_SOURCE_SHA256 ||
    candidate.migrationFileCount !== expectedMigrationLedger.length ||
    candidate.migrationTreeSha256 !== EXPECTED_MIGRATION_TREE_SHA256 ||
    candidate.latestCandidateMigration !== LATEST_MIGRATION ||
    candidate.latestCandidateMigrationSha256 !== LATEST_MIGRATION_SHA256 ||
    candidate.databaseChangesRequired ||
    candidate.databaseMigrationApplied ||
    candidate.sitesPublishRequired ||
    published !== false
  ) {
    throw new Error(
      `${label} must preserve exact merged PR #157 parity without claiming it applied or published v36.`,
    );
  }
}

if (
  manifest.schemaVersion !== 4 ||
  manifest.releaseState !== VERIFIED_GITHUB_PARITY_RELEASE_STATE
) {
  throw new Error(
    "Deployment manifest must use the schema-4 v36 reconciliation state.",
  );
}
if (
  checkpoint.schemaVersion !== 8 ||
  checkpoint.status !== manifest.releaseState
) {
  throw new Error(
    "RR checkpoint must use schema 8 and match the deployment-manifest state.",
  );
}

assertLastGitHubParityRelease(
  manifest.lastGitHubParityRelease,
  "Deployment manifest",
);
assertLastGitHubParityRelease(
  checkpoint.lastGitHubParityRelease,
  "RR checkpoint",
);
assertCurrentProductionObservation(
  manifest.currentProductionObservation,
  "Deployment manifest",
);
assertCurrentProductionObservation(
  checkpoint.currentProductionObservation,
  "RR checkpoint",
);
assertReconciliationCandidate(manifest.releaseCandidate, "Deployment manifest");
assertReconciliationCandidate(checkpoint.releaseCandidate, "RR checkpoint");
if (
  JSON.stringify(manifest.githubReconciliationEvidence) !==
    JSON.stringify(V36_GITHUB_RECONCILIATION) ||
  JSON.stringify(checkpoint.githubReconciliationEvidence) !==
    JSON.stringify(V36_GITHUB_RECONCILIATION)
) {
  throw new Error(
    "Manifest and RR must preserve the exact PR #157 reviewed head, merge, workflows, and zero-thread evidence.",
  );
}

if (
  manifest.releaseCandidate.reviewedLocally !==
    checkpoint.releaseCandidate.reviewedLocally ||
  manifest.releaseCandidate.status !== checkpoint.releaseCandidate.state ||
  manifest.releaseCandidate.migrationTreeSha256 !==
    checkpoint.releaseCandidate.migrationTreeSha256 ||
  manifest.releaseCandidate.latestCandidateMigrationSha256 !==
    checkpoint.releaseCandidate.latestCandidateMigrationSha256
) {
  throw new Error(
    "RR checkpoint and deployment manifest candidate evidence disagree.",
  );
}

for (const [label, observations] of [
  ["Deployment manifest", manifest.historicalProductionObservations],
  ["RR checkpoint", checkpoint.historicalProductionObservations],
] as const) {
  if (
    observations.length !== 1 ||
    observations[0]?.sitesVersion !== 18 ||
    (observations[0]?.productionMigrationCount ??
      observations[0]?.productionMigrations) !== 14 ||
    observations[0]?.latestProductionMigration !==
      "20260716035027_momo_preconnection_foundation.sql"
  ) {
    throw new Error(`${label} historical production observation drifted.`);
  }
}

if (
  manifest.migrations.evidenceScope !== VERIFIED_MIGRATION_EVIDENCE_SCOPE ||
  manifest.migrations.root !== "supabase/migrations" ||
  manifest.migrations.hashAlgorithm !==
    "veroxa-path-null-content-null-sha256-v1" ||
  manifest.migrations.fileCount !== expectedMigrationLedger.length ||
  manifest.migrations.treeSha256 !== EXPECTED_MIGRATION_TREE_SHA256
) {
  throw new Error(
    "Manifest migration evidence is not the exact live v36 ledger.",
  );
}

const rootLedger = sqlFiles("supabase/migrations");
const sitesLedger = sqlFiles("artifacts/veroxa-sites/supabase/migrations");
const archivedLedger = sqlFiles("supabase/archive/legacy_unapplied_migrations");

if (JSON.stringify(rootLedger) !== JSON.stringify(expectedMigrationLedger)) {
  throw new Error(`Root migration ledger drifted: ${rootLedger.join(", ")}`);
}
if (JSON.stringify(sitesLedger) !== JSON.stringify(expectedMigrationLedger)) {
  throw new Error(`Sites migration ledger drifted: ${sitesLedger.join(", ")}`);
}
if (
  JSON.stringify(checkpoint.databaseMigrations) !==
  JSON.stringify(expectedMigrationLedger)
) {
  throw new Error(
    "RR checkpoint migration ledger is not the exact 37-file live ledger.",
  );
}
if (JSON.stringify(archivedLedger) !== JSON.stringify(expectedArchived)) {
  throw new Error(
    `Archived legacy migration set drifted: ${archivedLedger.join(", ")}`,
  );
}

for (const retiredFilename of retiredActiveFilenames) {
  if (
    rootLedger.includes(retiredFilename) ||
    sitesLedger.includes(retiredFilename)
  ) {
    throw new Error(
      `Historical v22 timestamp must not be required as an active migration: ${retiredFilename}`,
    );
  }
}

for (const filename of expectedMigrationLedger) {
  const rootSource = readFileSync(
    resolve(root, "supabase/migrations", filename),
  );
  const sitesSource = readFileSync(
    resolve(root, "artifacts/veroxa-sites/supabase/migrations", filename),
  );
  if (
    !/^\d{14}_.+\.sql$/.test(filename) ||
    rootSource.toString().trim().length < 50
  ) {
    throw new Error(`Invalid canonical migration: ${filename}`);
  }
  if (!rootSource.equals(sitesSource)) {
    throw new Error(`Root/Sites migration content parity failed: ${filename}`);
  }
}

const rootTreeHash = migrationTreeHash("supabase/migrations", rootLedger);
const sitesTreeHash = migrationTreeHash(
  "artifacts/veroxa-sites/supabase/migrations",
  sitesLedger,
);
if (
  rootTreeHash !== EXPECTED_MIGRATION_TREE_SHA256 ||
  sitesTreeHash !== EXPECTED_MIGRATION_TREE_SHA256
) {
  throw new Error(
    `Migration tree hash drifted (root=${rootTreeHash}, Sites=${sitesTreeHash}).`,
  );
}

const latestMigrationHash = createHash("sha256")
  .update(readFileSync(resolve(root, "supabase/migrations", LATEST_MIGRATION)))
  .digest("hex");
if (latestMigrationHash !== LATEST_MIGRATION_SHA256) {
  throw new Error(`Latest migration content drifted: ${LATEST_MIGRATION}`);
}

console.log(
  "Supabase migration ledger guardrail passed: root and Sites mirrors contain the exact 37-file live v36 ledger; v22 timestamp aliases remain historical evidence only; merged PR #157 reconciled GitHub parity and applied no database change.",
);
