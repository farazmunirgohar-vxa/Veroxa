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

type Nullable<T> = T | null;
type Manifest = {
  schemaVersion: number;
  recordKind: string;
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  observedProductionBaseline: {
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    sourceParityVerified: boolean;
  };
  verifiedReconciliationRelease: {
    pullRequest: number;
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
  observedProductionDrift: {
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    githubSourceParityVerified: boolean;
    sitesVersion: number;
    sitesCheckoutCommit: Nullable<string>;
    sourceFileCount: Nullable<number>;
    sourceTreeSha256: Nullable<string>;
    sitesSourceParityVerified: boolean;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  currentVerifiedRelease: {
    pullRequest: number;
    reviewedHead: string;
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
  releaseCandidate: {
    status: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
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

const historical = {
  githubMainCommit: "674e1a7c0d140c9b281029277baeb2e68962dac2",
  sitesCheckoutCommit: "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  sitesVersion: 13,
  productionMigrationCount: 11,
  latestProductionMigration:
    "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  latestProductionMigrationSha256:
    "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
};
const verified = {
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
const historicalDrift = {
  canonicalGitHubMainCommit: "4f95b30413632b4d30a289c7f4b9011f37a37b80",
  sitesVersion: 18,
  productionMigrationCount: 14,
  latestProductionMigration: "20260716035027_momo_preconnection_foundation.sql",
  latestProductionMigrationSha256:
    "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367",
};
const currentVerified = {
  pullRequest: 152,
  reviewedHead: "b170c4339ae43755f17a19d74107cb75c6b198d3",
  githubMainCommit: "29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7",
  sitesCheckoutCommit: "aceb17bb446854d48a71e54ba814591cf2c19d33",
  sitesVersion: 20,
  sourceFileCount: 79,
  sourceTreeSha256:
    "5ae5da11de0ae202d33f31dea08ddd337b0b5323aa857d543f3c259f8662a4c2",
  productionMigrationCount: 15,
  latestProductionMigration: "20260722000100_momo_client_media_status_v1.sql",
  latestProductionMigrationSha256:
    "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7",
};
const candidate = {
  sourceFileCount: 79,
  sourceTreeSha256:
    "5ae5da11de0ae202d33f31dea08ddd337b0b5323aa857d543f3c259f8662a4c2",
  migrationFileCount: 15,
  migrationTreeSha256:
    "9eb4e5e16e2abea40143dad453bfcc2fcca27de6a7907d1f997af998b5c7dc0a",
  latestMigration: "20260722000100_momo_client_media_status_v1.sql",
  latestMigrationSha256:
    "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7",
};

must(manifest.schemaVersion === 3, "Deployment manifest schema version must be 3.");
must(
  manifest.recordKind === "veroxa_production_reconciliation_manifest",
  "Deployment manifest record kind is invalid.",
);
must(
  manifest.releaseState === "published_sites_v20_no_database_change",
  "The manifest must identify the published Sites v20 no-database-change follow-up.",
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

const baseline = manifest.observedProductionBaseline;
must(
  baseline.githubMainCommit === historical.githubMainCommit &&
    baseline.sitesCheckoutCommit === historical.sitesCheckoutCommit &&
    baseline.sitesVersion === historical.sitesVersion &&
    baseline.productionMigrationCount === historical.productionMigrationCount &&
    baseline.latestProductionMigration === historical.latestProductionMigration &&
    baseline.latestProductionMigrationSha256 ===
      historical.latestProductionMigrationSha256 &&
    !baseline.sourceParityVerified,
  "The pre-PR #148 drift baseline must remain immutable historical evidence.",
);

const release = manifest.verifiedReconciliationRelease;
must(
  release.pullRequest === verified.pullRequest &&
    release.githubMainCommit === verified.githubMainCommit &&
    release.sitesCheckoutCommit === verified.sitesCheckoutCommit &&
    release.sitesVersion === verified.sitesVersion &&
    release.sourceFileCount === verified.sourceFileCount &&
    release.sourceTreeSha256 === verified.sourceTreeSha256 &&
    release.productionMigrationCount === verified.productionMigrationCount &&
    release.latestProductionMigration === verified.latestProductionMigration &&
    release.latestProductionMigrationSha256 ===
      verified.latestProductionMigrationSha256 &&
    !release.databaseApplied &&
    release.databaseVerified &&
    release.sitesPublished &&
    release.sitesVerified &&
    release.customDomainsVerified &&
    release.sitesSourceParityVerified &&
    release.migrationContentParityVerified &&
    release.migrationFilenameParityVerified,
  "PR #149 / Sites v15 historical release proof changed.",
);

const observed = manifest.observedProductionDrift;
must(
  observed.observedAt === "2026-07-22" &&
    observed.evidenceStatus === "observed_live_not_source_reconciled" &&
    observed.canonicalGitHubMainCommit ===
      historicalDrift.canonicalGitHubMainCommit &&
    !observed.githubSourceParityVerified &&
    observed.sitesVersion === historicalDrift.sitesVersion &&
    observed.sitesCheckoutCommit === null &&
    observed.sourceFileCount === null &&
    observed.sourceTreeSha256 === null &&
    !observed.sitesSourceParityVerified &&
    observed.productionMigrationCount ===
      historicalDrift.productionMigrationCount &&
    observed.latestProductionMigration ===
      historicalDrift.latestProductionMigration &&
    observed.latestProductionMigrationSha256 ===
      historicalDrift.latestProductionMigrationSha256 &&
    observed.databaseLedgerObserved &&
    observed.databaseAppliedThroughLatestObserved &&
    !observed.candidateParityVerified,
  "Historical Sites v18 / 14-migration drift must remain explicit and must not invent a checkout or source hash.",
);

const current = manifest.currentVerifiedRelease;
must(
  current.pullRequest === currentVerified.pullRequest &&
    current.reviewedHead === currentVerified.reviewedHead &&
    current.githubMainCommit === currentVerified.githubMainCommit &&
    current.sitesCheckoutCommit === currentVerified.sitesCheckoutCommit &&
    current.sitesVersion === currentVerified.sitesVersion &&
    current.sourceFileCount === currentVerified.sourceFileCount &&
    current.sourceTreeSha256 === currentVerified.sourceTreeSha256 &&
    current.productionMigrationCount ===
      currentVerified.productionMigrationCount &&
    current.latestProductionMigration ===
      currentVerified.latestProductionMigration &&
    current.latestProductionMigrationSha256 ===
      currentVerified.latestProductionMigrationSha256 &&
    current.databaseApplied &&
    current.databaseVerified &&
    current.sitesPublished &&
    current.sitesVerified &&
    current.customDomainsVerified &&
    current.sitesSourceParityVerified &&
    current.migrationContentParityVerified &&
    current.migrationFilenameParityVerified,
  "PR #152 / Sites v20 must remain the exact current verified release, including reviewed head, merged main, domains, and source/migration parity.",
);

const releaseCandidate = manifest.releaseCandidate;
must(
  releaseCandidate.status === "published_sites_followup_no_database_change" &&
    releaseCandidate.basedOnGitHubMainCommit ===
      "bcd9b9da1796e72c0b9b546e9944a4e7e419c1b4" &&
    releaseCandidate.pullRequest === 152 &&
    releaseCandidate.githubMerged &&
    releaseCandidate.futureMergedGitHubCommit === currentVerified.githubMainCommit &&
    releaseCandidate.futureSitesVersion === currentVerified.sitesVersion &&
    releaseCandidate.reviewedLocally &&
    releaseCandidate.sourceFileCount === candidate.sourceFileCount &&
    releaseCandidate.sourceTreeSha256 === candidate.sourceTreeSha256 &&
    releaseCandidate.migrationFileCount === candidate.migrationFileCount &&
    releaseCandidate.migrationTreeSha256 === candidate.migrationTreeSha256 &&
    releaseCandidate.latestCandidateMigration === candidate.latestMigration &&
    releaseCandidate.latestCandidateMigrationSha256 ===
      candidate.latestMigrationSha256 &&
    !releaseCandidate.databaseChangesRequired &&
    !releaseCandidate.databaseMigrationApplied &&
    releaseCandidate.sitesPublishRequired &&
    releaseCandidate.sitesPublished,
  "The v20 follow-up must remain exact, merged, published, and no-database-change.",
);

must(
  manifest.source.evidenceScope === "published_sites_v20" &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.mappingTarget === "Sites repository root" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Published Sites v20 source mapping or evidence scope drifted.",
);
const sourceRoot = resolve(repoRoot, manifest.source.root);
must(existsSync(sourceRoot), "Canonical Sites source root is missing.");
const sourceTree = hashTree(sourceRoot, {
  exclusions: manifest.source.generatedPathExclusions,
});
must(
  sourceTree.fileCount === candidate.sourceFileCount &&
    sourceTree.sha256 === candidate.sourceTreeSha256 &&
    sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256,
  `Published Sites v20 source drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(sourceTree.files.includes(".npmrc"), "Published Sites source must include .npmrc.");
for (const excluded of [
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
]) {
  must(
    manifest.source.generatedPathExclusions.includes(excluded),
    `Sites sync exclusions must name generated path: ${excluded}`,
  );
}

must(
  manifest.migrations.evidenceScope === "current_verified_release" &&
    manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Current-release migration-tree mapping or evidence scope drifted.",
);
const migrationRoot = resolve(repoRoot, manifest.migrations.root);
const migrationTree = hashTree(migrationRoot, { suffix: ".sql" });
must(
  migrationTree.fileCount === candidate.migrationFileCount &&
    migrationTree.sha256 === candidate.migrationTreeSha256 &&
    migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256,
  `Current-release migration tree drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
for (const [filename, sha256] of Object.entries({
  [verified.latestProductionMigration]: verified.latestProductionMigrationSha256,
  [historicalDrift.latestProductionMigration]:
    historicalDrift.latestProductionMigrationSha256,
  [currentVerified.latestProductionMigration]:
    currentVerified.latestProductionMigrationSha256,
  [candidate.latestMigration]: candidate.latestMigrationSha256,
})) {
  const path = resolve(migrationRoot, filename);
  must(existsSync(path), `Release-evidence migration is absent: ${filename}`);
  if (existsSync(path)) {
    must(sha256File(path) === sha256, `Release-evidence migration changed: ${filename}`);
  }
}

const hosting = JSON.parse(
  readFileSync(resolve(sourceRoot, ".openai/hosting.json"), "utf8"),
) as { project_id?: unknown };
must(
  hosting.project_id === manifest.sitesProjectId,
  "Candidate Sites hosting manifest and deployment manifest disagree.",
);

must(
  manifest.deploymentFreeze.state === "reviewed_manual_deployment_only" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.deploymentFreeze.allowedDeployment.includes("reviewed and merged") &&
    manifest.deploymentFreeze.releaseCondition.includes("production parity"),
  "Delivery must remain reviewed, manual, and fail-closed.",
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
  manifest.currentRuntimeIdentityObservation.observedAt === "2026-07-22" &&
    manifest.currentRuntimeIdentityObservation.teamIdentityProvisioned &&
    manifest.currentRuntimeIdentityObservation.momoDevelopmentProxyClientIdentityProvisioned &&
    !manifest.currentRuntimeIdentityObservation.momoRealOwnerClientIdentityProvisioned &&
    manifest.currentRuntimeIdentityObservation.developmentClientEvidenceClass === "development_proxy" &&
    /not Momo owner authority/i.test(manifest.currentRuntimeIdentityObservation.scope),
  "Current identity evidence must distinguish the iCloud development proxy from future real-owner authority.",
);
must(
  manifest.cleanupState.inventoryReviewed &&
    !manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.branchDeletionAllowed &&
    manifest.cleanupState.legacyViteArchived &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired &&
    /external Vercel Git disconnection/i.test(manifest.cleanupState.blocker),
  "Cleanup must preserve branch, legacy-removal, and Vercel safety gates.",
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
  `Veroxa release evidence passed: historical PR #149 / Sites v15 and observed Sites v18 drift preserved; PR #152 / Sites v20 is the current verified release with ${sourceTree.fileCount} Sites files and ${migrationTree.fileCount} migrations; no v20 database change was required.`,
);
