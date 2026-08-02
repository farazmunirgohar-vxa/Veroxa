import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TREE_HASH_ALGORITHM,
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

type VerifiedRelease = {
  pullRequest: number;
  reviewedHead?: string;
  githubMainCommit: string;
  sitesCheckoutCommit: string;
  sitesVersion: number;
  sourceFileCount: number;
  sourceTreeSha256: string;
  productionMigrationCount: number;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseApplied: boolean;
  databaseVerified: boolean;
  sitesPublished: boolean;
  sitesVerified: boolean;
  customDomainsVerified: boolean;
  sitesSourceParityVerified: boolean;
  migrationContentParityVerified: boolean;
  migrationFilenameParityVerified: boolean;
};

type ProductionObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  githubMainMatchesCandidate: boolean;
  sitesVersion: number;
  sitesCheckoutCommit: string;
  sourceFileCount: number;
  sourceTreeSha256: string;
  candidateSourceMatchesLiveSites: boolean;
  productionMigrationCount: number;
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
  recordKind: string;
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  observedProductionBaseline: {
    reviewedAt: string;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    sourceParityVerified: boolean;
  };
  verifiedReconciliationRelease: VerifiedRelease;
  previousVerifiedRelease: VerifiedRelease & { reviewedHead: string };
  lastGitHubParityRelease: VerifiedRelease & {
    evidenceScope: string;
    supersededAsLiveBaseline: boolean;
    reviewedHead: string;
  };
  historicalProductionObservations: Array<{
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    githubSourceParityVerified: boolean;
    sitesVersion: number;
    sitesCheckoutCommit: string | null;
    sourceFileCount: number | null;
    sourceTreeSha256: string | null;
    sitesSourceParityVerified: boolean;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
  }>;
  currentProductionObservation: ProductionObservation;
  releaseCandidate: {
    status: string;
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
    sitesPublished: boolean;
  };
  source: {
    evidenceScope: string;
    root: string;
    mappingTarget: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
    generatedPathExclusions: string[];
  };
  migrations: {
    evidenceScope: string;
    root: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    allowedDeployment: string;
    releaseCondition: string;
  };
  activationState: Record<string, boolean>;
  activationStateScope: string;
  currentRuntimeIdentityObservation: {
    observedAt: string;
    teamIdentityProvisioned: boolean;
    momoDevelopmentProxyClientIdentityProvisioned: boolean;
    momoRealOwnerClientIdentityProvisioned: boolean;
    developmentClientEvidenceClass: string;
    scope: string;
  };
  cleanupState: {
    inventoryReviewed: boolean;
    branchDeletionCapabilityAvailable: boolean;
    branchDeletionAllowed: boolean;
    legacyViteArchived: boolean;
    legacyViteRemovalAllowed: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
    blocker: string;
  };
};

const manifest = readDeploymentManifest() as unknown as Manifest;
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const baseline = {
  reviewedAt: "2026-07-13",
  githubMainCommit: "674e1a7c0d140c9b281029277baeb2e68962dac2",
  sitesCheckoutCommit: "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  sitesVersion: 13,
  productionMigrationCount: 11,
  latestProductionMigration:
    "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  latestProductionMigrationSha256:
    "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
};
const pr149 = {
  pullRequest: 149,
  githubMainCommit: "9749b68ce2cfc383deeae6aa63c413019ef61385",
  sitesCheckoutCommit: "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
  sitesVersion: 15,
  sourceFileCount: 55,
  sourceTreeSha256:
    "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
  productionMigrationCount: 13,
  latestProductionMigration:
    "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
  latestProductionMigrationSha256:
    "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
};
const pr154 = {
  pullRequest: 154,
  reviewedHead: "4a7a2122bb71defc0f1db0c795b4c4c8fdb930a5",
  githubMainCommit: "72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695",
  sitesCheckoutCommit: "8c50dd6726629e77d22f07eb6aac9f6982001902",
  sitesVersion: 21,
  sourceFileCount: 88,
  sourceTreeSha256:
    "60c2e069d6a5f54480c8ee3151e28ccc7d920e52fd5e3b978f47f41dec4013bb",
  productionMigrationCount: 16,
  latestProductionMigration: "20260728044916_momo_media_ai_pilot_v1.sql",
  latestProductionMigrationSha256:
    "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1",
};
const pr155 = {
  pullRequest: 155,
  reviewedHead: "96a6c00857b438b37c2e8d99329c0f556de850a2",
  githubMainCommit: "d1f6a9a78ac54cd5447689d5f8b3d42466daf479",
  sitesCheckoutCommit: "83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e",
  sitesVersion: 22,
  sourceFileCount: 93,
  sourceTreeSha256:
    "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490",
  productionMigrationCount: 16,
  latestProductionMigration: "20260728044916_momo_media_ai_pilot_v1.sql",
  latestProductionMigrationSha256:
    "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1",
};
const v18 = {
  observedAt: "2026-07-22",
  evidenceStatus: "historical_live_not_source_reconciled",
  canonicalGitHubMainCommit: "4f95b30413632b4d30a289c7f4b9011f37a37b80",
  sitesVersion: 18,
  productionMigrationCount: 14,
  latestProductionMigration: "20260716035027_momo_preconnection_foundation.sql",
  latestProductionMigrationSha256:
    "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367",
};
const v36 = {
  observedAt: "2026-08-02",
  canonicalGitHubMainCommit: "302621bf6b9ab78320abe4175b45b56e9e64ae2a",
  sitesVersion: 36,
  sitesCheckoutCommit: "b8122642b72e5d4e6e74c379469f2a157781ab3d",
  sourceFileCount: 185,
  sourceTreeSha256:
    "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7",
  productionMigrationCount: 37,
  migrationTreeSha256:
    "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  latestProductionMigration:
    "20260802020000_momo_pipeline_query_indexes_v2.sql",
  latestProductionMigrationSha256:
    "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd",
};

const sameReleaseIdentity = (
  actual: VerifiedRelease,
  expected: typeof pr149 | typeof pr154 | typeof pr155,
) =>
  actual.pullRequest === expected.pullRequest &&
  actual.githubMainCommit === expected.githubMainCommit &&
  actual.sitesCheckoutCommit === expected.sitesCheckoutCommit &&
  actual.sitesVersion === expected.sitesVersion &&
  actual.sourceFileCount === expected.sourceFileCount &&
  actual.sourceTreeSha256 === expected.sourceTreeSha256 &&
  actual.productionMigrationCount === expected.productionMigrationCount &&
  actual.latestProductionMigration === expected.latestProductionMigration &&
  actual.latestProductionMigrationSha256 ===
    expected.latestProductionMigrationSha256 &&
  (!("reviewedHead" in expected) ||
    actual.reviewedHead === expected.reviewedHead);

const fullyVerified = (release: VerifiedRelease) =>
  release.databaseVerified &&
  release.sitesPublished &&
  release.sitesVerified &&
  release.customDomainsVerified &&
  release.sitesSourceParityVerified &&
  release.migrationContentParityVerified &&
  release.migrationFilenameParityVerified;

must(
  manifest.schemaVersion === 4,
  "Deployment manifest schema version must be 4.",
);
must(
  manifest.recordKind === "veroxa_production_reconciliation_manifest",
  "Deployment manifest record kind is invalid.",
);
const refreshedReleaseState =
  "live_sites_v36_github_reconciliation_fingerprints_refreshed_review_required";
const reviewedReleaseState =
  "live_sites_v36_github_reconciliation_reviewed_unmerged";
const refreshedCandidateStatus =
  "fingerprints_refreshed_review_required_unmerged";
const reviewedCandidateStatus = "reviewed_locally_unmerged";
must(
  [refreshedReleaseState, reviewedReleaseState].includes(manifest.releaseState),
  "Release state must remain an unmerged Sites-v36 GitHub reconciliation state.",
);
must(
  manifest.canonicalRepository === "farazmunirgohar-vxa/Veroxa" &&
    manifest.canonicalBranch === "main",
  "GitHub main must remain the canonical release source.",
);
must(
  manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de",
  "Sites project identity drifted.",
);

const observedBaseline = manifest.observedProductionBaseline;
must(
  observedBaseline.reviewedAt === baseline.reviewedAt &&
    observedBaseline.githubMainCommit === baseline.githubMainCommit &&
    observedBaseline.sitesCheckoutCommit === baseline.sitesCheckoutCommit &&
    observedBaseline.sitesVersion === baseline.sitesVersion &&
    observedBaseline.productionMigrationCount ===
      baseline.productionMigrationCount &&
    observedBaseline.latestProductionMigration ===
      baseline.latestProductionMigration &&
    observedBaseline.latestProductionMigrationSha256 ===
      baseline.latestProductionMigrationSha256 &&
    !observedBaseline.sourceParityVerified,
  "The pre-PR #148 production baseline must remain immutable historical evidence.",
);

const release149 = manifest.verifiedReconciliationRelease;
must(
  sameReleaseIdentity(release149, pr149) &&
    !release149.databaseApplied &&
    fullyVerified(release149),
  "PR #149 / Sites v15 historical release proof changed.",
);
const release154 = manifest.previousVerifiedRelease;
must(
  sameReleaseIdentity(release154, pr154) &&
    release154.databaseApplied &&
    fullyVerified(release154),
  "PR #154 / Sites v21 historical release proof changed.",
);
const release155 = manifest.lastGitHubParityRelease;
must(
  release155.evidenceScope === "last_github_sites_parity_release" &&
    release155.supersededAsLiveBaseline &&
    sameReleaseIdentity(release155, pr155) &&
    release155.databaseApplied &&
    fullyVerified(release155),
  "PR #155 / Sites v22 must remain the exact last GitHub-to-Sites parity release.",
);

must(
  manifest.historicalProductionObservations.length === 1,
  "Historical production observations must preserve the one source-unreconciled v18 record.",
);
const historicalObservation = manifest.historicalProductionObservations[0];
must(
  historicalObservation?.observedAt === v18.observedAt &&
    historicalObservation.evidenceStatus === v18.evidenceStatus &&
    historicalObservation.canonicalGitHubMainCommit ===
      v18.canonicalGitHubMainCommit &&
    !historicalObservation.githubSourceParityVerified &&
    historicalObservation.sitesVersion === v18.sitesVersion &&
    historicalObservation.sitesCheckoutCommit === null &&
    historicalObservation.sourceFileCount === null &&
    historicalObservation.sourceTreeSha256 === null &&
    !historicalObservation.sitesSourceParityVerified &&
    historicalObservation.productionMigrationCount ===
      v18.productionMigrationCount &&
    historicalObservation.latestProductionMigration ===
      v18.latestProductionMigration &&
    historicalObservation.latestProductionMigrationSha256 ===
      v18.latestProductionMigrationSha256 &&
    historicalObservation.databaseLedgerObserved &&
    historicalObservation.databaseAppliedThroughLatestObserved,
  "Historical Sites v18 / 14-migration drift evidence changed or invented source identity.",
);

const observation = manifest.currentProductionObservation;
must(
  observation.observedAt === v36.observedAt &&
    observation.evidenceStatus ===
      "sites_v36_live_github_reconciliation_in_progress" &&
    observation.canonicalGitHubMainCommit === v36.canonicalGitHubMainCommit &&
    !observation.githubMainMatchesCandidate &&
    observation.sitesVersion === v36.sitesVersion &&
    observation.sitesCheckoutCommit === v36.sitesCheckoutCommit &&
    observation.sourceFileCount === v36.sourceFileCount &&
    observation.sourceTreeSha256 === v36.sourceTreeSha256 &&
    observation.candidateSourceMatchesLiveSites &&
    observation.productionMigrationCount === v36.productionMigrationCount &&
    observation.migrationTreeSha256 === v36.migrationTreeSha256 &&
    observation.latestProductionMigration === v36.latestProductionMigration &&
    observation.latestProductionMigrationSha256 ===
      v36.latestProductionMigrationSha256 &&
    observation.databaseLedgerObserved &&
    observation.databaseAppliedThroughLatestObserved &&
    observation.candidateMigrationsMatchLiveLedger &&
    !observation.fullReleaseGatePassed,
  "Current production must remain the exact observed Sites v36 / 37-migration state ahead of GitHub main.",
);

const candidate = manifest.releaseCandidate;
const statePairIsValid =
  (manifest.releaseState === refreshedReleaseState &&
    candidate.status === refreshedCandidateStatus &&
    !candidate.reviewedLocally) ||
  (manifest.releaseState === reviewedReleaseState &&
    candidate.status === reviewedCandidateStatus &&
    candidate.reviewedLocally);
must(statePairIsValid, "Release and candidate review states are inconsistent.");
must(
  candidate.actionScope === "github_reconciliation_candidate" &&
    candidate.basedOnGitHubMainCommit === v36.canonicalGitHubMainCommit &&
    candidate.pullRequest === null &&
    !candidate.githubMerged &&
    candidate.futureMergedGitHubCommit === null &&
    candidate.futureSitesVersion === null &&
    candidate.candidateSourceMatchesLiveSites &&
    candidate.candidateMigrationsMatchLiveLedger &&
    !candidate.githubMainMatchesCandidate &&
    !candidate.fullReleaseGatePassed &&
    candidate.sourceFileCount === v36.sourceFileCount &&
    candidate.sourceTreeSha256 === v36.sourceTreeSha256 &&
    candidate.migrationFileCount === v36.productionMigrationCount &&
    candidate.migrationTreeSha256 === v36.migrationTreeSha256 &&
    candidate.latestCandidateMigration === v36.latestProductionMigration &&
    candidate.latestCandidateMigrationSha256 ===
      v36.latestProductionMigrationSha256 &&
    !candidate.databaseChangesRequired &&
    !candidate.databaseMigrationApplied &&
    !candidate.sitesPublishRequired &&
    !candidate.sitesPublished,
  "The v36 GitHub reconciliation candidate must match live source and migrations while all candidate actions remain unmerged, unpublished, and unapplied.",
);

must(
  manifest.source.evidenceScope ===
    "github_reconciliation_candidate_matching_live_sites_v36" &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.mappingTarget === "Sites repository root" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Sites-v36 reconciliation source mapping or evidence scope drifted.",
);
const sourceRoot = resolve(repoRoot, manifest.source.root);
must(existsSync(sourceRoot), "Canonical Sites source root is missing.");
const sourceTree = hashTree(sourceRoot, {
  exclusions: manifest.source.generatedPathExclusions,
});
must(
  sourceTree.fileCount === v36.sourceFileCount &&
    sourceTree.sha256 === v36.sourceTreeSha256 &&
    sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256 &&
    sourceTree.fileCount === candidate.sourceFileCount &&
    sourceTree.sha256 === candidate.sourceTreeSha256,
  `Sites-v36 reconciliation source drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  sourceTree.files.includes(".npmrc"),
  "Canonical Sites source must include .npmrc.",
);
const requiredExclusions = [
  ".git",
  ".next",
  ".sites-runtime",
  ".vinext",
  ".wrangler",
  "dist",
  "node_modules",
  "outputs",
  "tsconfig.tsbuildinfo",
  "work",
];
must(
  requiredExclusions.every((entry) =>
    manifest.source.generatedPathExclusions.includes(entry),
  ),
  "Sites source exclusions must preserve every generated/runtime path.",
);

must(
  manifest.migrations.evidenceScope ===
    "github_reconciliation_candidate_matching_live_ledger_v36" &&
    manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Live-ledger reconciliation migration mapping or evidence scope drifted.",
);
const migrationRoot = resolve(repoRoot, manifest.migrations.root);
const migrationTree = hashTree(migrationRoot, { suffix: ".sql" });
must(
  migrationTree.fileCount === v36.productionMigrationCount &&
    migrationTree.sha256 === v36.migrationTreeSha256 &&
    migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256 &&
    migrationTree.fileCount === candidate.migrationFileCount &&
    migrationTree.sha256 === candidate.migrationTreeSha256,
  `Live-ledger reconciliation migration tree drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
const latestMigrationPath = resolve(
  migrationRoot,
  v36.latestProductionMigration,
);
must(
  existsSync(latestMigrationPath),
  `Latest live migration is absent: ${v36.latestProductionMigration}`,
);
if (existsSync(latestMigrationPath)) {
  must(
    sha256File(latestMigrationPath) === v36.latestProductionMigrationSha256,
    `Latest live migration changed: ${v36.latestProductionMigration}`,
  );
}

const hosting = JSON.parse(
  readFileSync(resolve(sourceRoot, ".openai/hosting.json"), "utf8"),
) as { project_id?: unknown };
must(
  hosting.project_id === manifest.sitesProjectId,
  "Sites hosting manifest and deployment manifest disagree.",
);

must(
  manifest.deploymentFreeze.state ===
    "production_frozen_github_reconciliation_review_required" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    /No Sites deployment or database apply is required/i.test(
      manifest.deploymentFreeze.allowedDeployment,
    ) &&
    /all four workflows are green/i.test(
      manifest.deploymentFreeze.releaseCondition,
    ) &&
    /review threads are clear/i.test(
      manifest.deploymentFreeze.releaseCondition,
    ),
  "GitHub reconciliation must remain frozen, reviewed, manual, and fail-closed.",
);
for (const [name, value] of Object.entries(manifest.activationState)) {
  must(value === false, `Historical PR #149 activation state changed: ${name}`);
}
must(
  /Historical PR #149 release authorization snapshot/.test(
    manifest.activationStateScope,
  ),
  "Activation-state evidence scope must remain historical and explicit.",
);
must(
  manifest.currentRuntimeIdentityObservation.observedAt === "2026-08-02" &&
    manifest.currentRuntimeIdentityObservation.teamIdentityProvisioned &&
    manifest.currentRuntimeIdentityObservation
      .momoDevelopmentProxyClientIdentityProvisioned &&
    !manifest.currentRuntimeIdentityObservation
      .momoRealOwnerClientIdentityProvisioned &&
    manifest.currentRuntimeIdentityObservation
      .developmentClientEvidenceClass === "development_proxy" &&
    /not Momo owner authority/i.test(
      manifest.currentRuntimeIdentityObservation.scope,
    ),
  "Runtime identity evidence must distinguish the development proxy from real-owner authority.",
);
must(
  manifest.cleanupState.inventoryReviewed &&
    manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.branchDeletionAllowed &&
    manifest.cleanupState.legacyViteArchived &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired &&
    /cleanup remains unauthorized/i.test(manifest.cleanupState.blocker) &&
    /external Vercel Git disconnection/i.test(manifest.cleanupState.blocker),
  "Cleanup and Vercel safety gates drifted.",
);
must(
  deploymentManifestPath.endsWith("VEROXA_DEPLOYMENT_MANIFEST.json"),
  "Deployment manifest path is not canonical.",
);

if (failures.length) {
  console.error("Veroxa deployment manifest guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Veroxa release evidence passed: immutable PR #149 / Sites v15, PR #154 / Sites v21, and last GitHub parity PR #155 / Sites v22 evidence is preserved; the GitHub reconciliation candidate matches live Sites v36 (${sourceTree.fileCount} files) and its ${migrationTree.fileCount}-migration ledger while GitHub main and the full release gate remain false.`,
);
