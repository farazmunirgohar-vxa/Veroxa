import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const failures: string[] = [];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const manifest = JSON.parse(
  read("artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json"),
) as {
  schemaVersion: number;
  sitesProjectId: string;
  releaseState: string;
  deploymentFreeze: { automaticDeploymentsAllowed: boolean };
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
  observedProductionDrift: {
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
    candidateParityVerified: boolean;
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
  source: { fileCount: number; treeSha256: string };
  migrations: { fileCount: number; treeSha256: string };
  cleanupState: {
    branchDeletionCapabilityAvailable: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
  };
};
const checkpoint = JSON.parse(
  read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"),
) as {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  verifiedReconciliationRelease: {
    pullRequest: number;
    githubMainCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseVerified: boolean;
    sitesProductionVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  currentVerifiedRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    sitesProductionVerified: boolean;
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
    sitesCheckoutSourceCommit: string | null;
    sourceFileCount: number | null;
    sourceTreeSha256: string | null;
    sitesSourceParityVerified: boolean;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    manifest: string;
    state: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    localReviewPassed: boolean;
    allFourWorkflowsGreen: boolean | null;
    zeroUnresolvedReviewThreads: boolean | null;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesCandidatePublished: boolean;
  };
};

const historicalRelease = manifest.verifiedReconciliationRelease;
const currentRelease = manifest.currentVerifiedRelease;
const observedProduction = manifest.observedProductionDrift;
const candidate = manifest.releaseCandidate;

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(!existsSync(resolve(root, retiredPath)), `Retired Vercel artifact exists: ${retiredPath}`);
}

const vercelShutdownPath = resolve(root, "vercel.json");
must(existsSync(vercelShutdownPath), "The Vercel automatic-deployment shutdown sentinel is missing.");
if (existsSync(vercelShutdownPath)) {
  try {
    const sentinel = JSON.parse(readFileSync(vercelShutdownPath, "utf8")) as {
      $schema?: unknown;
      git?: Record<string, unknown>;
    };
    must(
      JSON.stringify(Object.keys(sentinel).sort()) === JSON.stringify(["$schema", "git"]) &&
        sentinel.$schema === "https://openapi.vercel.sh/vercel.json" &&
        JSON.stringify(Object.keys(sentinel.git ?? {}).sort()) ===
          JSON.stringify(["deploymentEnabled"]) &&
        sentinel.git?.deploymentEnabled === false,
      "vercel.json must remain the exact inert shutdown sentinel.",
    );
  } catch {
    failures.push("vercel.json is not valid JSON.");
  }
}

const documents = [
  "AGENTS.md",
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/MOMO_MEDIA_V19_LIVE_CLOSEOUT.json",
].map((path) => ({ path, source: read(path).slice(0, 14_000) }));
const combined = documents.map(({ source }) => source).join("\n");
for (const marker of [
  "Vercel is retired",
  `PR #${currentRelease.pullRequest}`,
  currentRelease.reviewedHead,
  currentRelease.githubMainCommit,
  currentRelease.sitesCheckoutCommit,
  `Sites version ${currentRelease.sitesVersion}`,
  `${currentRelease.productionMigrationCount} applied migrations`,
  "Sites v20",
  "Sites-only",
  historicalRelease.githubMainCommit,
  historicalRelease.sitesCheckoutCommit,
  `Sites version ${historicalRelease.sitesVersion}`,
  historicalRelease.sourceTreeSha256,
  "post_release_cleanup_deployed",
  `Sites version ${observedProduction.sitesVersion}`,
  `${observedProduction.productionMigrationCount} applied migrations`,
]) {
  must(combined.includes(marker), `Current source truth is missing delivery marker: ${marker}`);
}
for (const banned of [
  "Vercel is the new primary deployment target",
  "Vercel remains rollback",
  "Vercel is temporary rollback",
  "GitHub + Codex + Vercel",
  "Use Vercel as the deployment target",
]) {
  must(!combined.includes(banned), `Current source truth restores retired Vercel behavior: ${banned}`);
}
must(
  /shutdown sentinel[\s\S]{0,500}(?:external|dashboard)[\s\S]{0,300}disconnect/i.test(combined),
  "Current source truth must retain the sentinel until external Vercel Git disconnection is verified.",
);

const hostingPath = "artifacts/veroxa-sites/.openai/hosting.json";
must(existsSync(resolve(root, hostingPath)), "Sites hosting identity is missing.");
if (existsSync(resolve(root, hostingPath))) {
  const hosting = JSON.parse(read(hostingPath)) as { project_id?: unknown };
  must(
    hosting.project_id === "appgprj_6a53d07c7c28819182801cf35dfd30de",
    "Sites project identity drifted.",
  );
}

const readiness = JSON.parse(
  read("artifacts/veroxa-sites/app/momo-readiness-tracker.json"),
) as {
  schemaVersion: number;
  overallStatus: string;
  overallRule: string;
};
const readinessText = read("artifacts/veroxa-sites/app/momo-readiness-tracker.json");
const releaseIdentityMarkers = [
  historicalRelease.githubMainCommit,
  historicalRelease.sitesCheckoutCommit,
  historicalRelease.sourceTreeSha256,
  currentRelease.reviewedHead,
  currentRelease.githubMainCommit,
  currentRelease.sitesCheckoutCommit,
  currentRelease.sourceTreeSha256,
  currentRelease.latestProductionMigrationSha256,
  candidate.sourceTreeSha256,
  candidate.migrationTreeSha256,
  `Sites version ${historicalRelease.sitesVersion}`,
  `Sites version ${observedProduction.sitesVersion}`,
  `Sites version ${currentRelease.sitesVersion}`,
  "Sites version 20",
  "sitesCandidatePublished",
  "futureSitesVersion",
];
must(
  readiness.schemaVersion === 8 &&
    readiness.overallStatus === "blocked" &&
    /No-Go/i.test(readiness.overallRule) &&
    !releaseIdentityMarkers.some((marker) => readinessText.includes(marker)),
  "Sites-bundled readiness evidence must externalize exact deployment identity and remain stable across publications.",
);

must(
  manifest.schemaVersion === 3 &&
    manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de" &&
    manifest.releaseState ===
      "local_candidate_reviewed_unmerged_unpublished_unapplied" &&
    historicalRelease.pullRequest === 149 &&
    historicalRelease.githubMainCommit === "9749b68ce2cfc383deeae6aa63c413019ef61385" &&
    historicalRelease.sitesCheckoutCommit === "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0" &&
    historicalRelease.sitesVersion === 15 &&
    historicalRelease.sourceFileCount === 55 &&
    historicalRelease.sourceTreeSha256 ===
      "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f" &&
    historicalRelease.productionMigrationCount === 13 &&
    historicalRelease.latestProductionMigration ===
      "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql" &&
    historicalRelease.latestProductionMigrationSha256 ===
      "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d" &&
    !historicalRelease.databaseApplied &&
    historicalRelease.databaseVerified &&
    historicalRelease.sitesPublished &&
    historicalRelease.sitesVerified &&
    historicalRelease.customDomainsVerified &&
    historicalRelease.sitesSourceParityVerified &&
    historicalRelease.migrationContentParityVerified &&
    historicalRelease.migrationFilenameParityVerified &&
    currentRelease.pullRequest === 151 &&
    currentRelease.reviewedHead === "e5c40c02a79df91f424cd51a51e9f1c7e1b7147a" &&
    currentRelease.githubMainCommit === "bcd9b9da1796e72c0b9b546e9944a4e7e419c1b4" &&
    currentRelease.sitesCheckoutCommit === "5b7884983e2891cb8f55aef3d9553e981853be23" &&
    currentRelease.sitesVersion === 19 &&
    currentRelease.sourceFileCount === 79 &&
    currentRelease.sourceTreeSha256 ===
      "6223dbcb6e7644615a3fc7bca1d86a89ee4167c37ca12ddf9a92918ce321a9ad" &&
    currentRelease.productionMigrationCount === 15 &&
    currentRelease.latestProductionMigration ===
      "20260722000100_momo_client_media_status_v1.sql" &&
    currentRelease.latestProductionMigrationSha256 ===
      "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7" &&
    currentRelease.databaseApplied &&
    currentRelease.databaseVerified &&
    currentRelease.sitesPublished &&
    currentRelease.sitesVerified &&
    currentRelease.customDomainsVerified &&
    currentRelease.sitesSourceParityVerified &&
    currentRelease.migrationContentParityVerified &&
    currentRelease.migrationFilenameParityVerified &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    observedProduction.observedAt === "2026-07-22" &&
    observedProduction.evidenceStatus === "observed_live_not_source_reconciled" &&
    observedProduction.canonicalGitHubMainCommit ===
      "4f95b30413632b4d30a289c7f4b9011f37a37b80" &&
    !observedProduction.githubSourceParityVerified &&
    observedProduction.sitesVersion === 18 &&
    observedProduction.sitesCheckoutCommit === null &&
    observedProduction.sourceFileCount === null &&
    observedProduction.sourceTreeSha256 === null &&
    !observedProduction.sitesSourceParityVerified &&
    observedProduction.productionMigrationCount === 14 &&
    observedProduction.latestProductionMigration ===
      "20260716035027_momo_preconnection_foundation.sql" &&
    observedProduction.latestProductionMigrationSha256 ===
      "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367" &&
    observedProduction.databaseLedgerObserved &&
    observedProduction.databaseAppliedThroughLatestObserved &&
    !observedProduction.candidateParityVerified &&
    candidate.status === "reviewed_locally_unmerged_unpublished_unapplied" &&
    candidate.basedOnGitHubMainCommit === currentRelease.githubMainCommit &&
    candidate.pullRequest === 152 &&
    !candidate.githubMerged &&
    candidate.futureMergedGitHubCommit === null &&
    candidate.futureSitesVersion === null &&
    candidate.reviewedLocally &&
    candidate.sourceFileCount === 79 &&
    candidate.sourceTreeSha256 ===
      "5ae5da11de0ae202d33f31dea08ddd337b0b5323aa857d543f3c259f8662a4c2" &&
    candidate.migrationFileCount === 15 &&
    candidate.migrationTreeSha256 ===
      "9eb4e5e16e2abea40143dad453bfcc2fcca27de6a7907d1f997af998b5c7dc0a" &&
    candidate.latestCandidateMigration ===
      "20260722000100_momo_client_media_status_v1.sql" &&
    candidate.latestCandidateMigrationSha256 ===
      "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7" &&
    !candidate.databaseChangesRequired &&
    !candidate.databaseMigrationApplied &&
    candidate.sitesPublishRequired &&
    !candidate.sitesPublished &&
    manifest.source.fileCount === candidate.sourceFileCount &&
    manifest.source.treeSha256 === candidate.sourceTreeSha256 &&
    manifest.migrations.fileCount === candidate.migrationFileCount &&
    manifest.migrations.treeSha256 === candidate.migrationTreeSha256 &&
    !manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired,
  "Schema-3 deployment manifest must preserve PR #149 / Sites v15 history and observed v18 drift, prove PR #151 / Sites v19 / 15 migrations as current, and keep the reviewed 79-file Sites v20 candidate unpublished and database-change-free.",
);

must(
  checkpoint.schemaVersion === 6 &&
    checkpoint.checkpoint === "momo-readiness-copy-sites-v20-candidate-2026-07-22" &&
    checkpoint.status === manifest.releaseState &&
    checkpoint.verifiedReconciliationRelease.pullRequest === historicalRelease.pullRequest &&
    checkpoint.verifiedReconciliationRelease.githubMainCommit === historicalRelease.githubMainCommit &&
    checkpoint.verifiedReconciliationRelease.sitesCheckoutSourceCommit ===
      historicalRelease.sitesCheckoutCommit &&
    checkpoint.verifiedReconciliationRelease.sitesVersion === historicalRelease.sitesVersion &&
    checkpoint.verifiedReconciliationRelease.sourceFileCount === historicalRelease.sourceFileCount &&
    checkpoint.verifiedReconciliationRelease.sourceTreeSha256 ===
      historicalRelease.sourceTreeSha256 &&
    checkpoint.verifiedReconciliationRelease.productionMigrations ===
      historicalRelease.productionMigrationCount &&
    checkpoint.verifiedReconciliationRelease.latestProductionMigration ===
      historicalRelease.latestProductionMigration &&
    checkpoint.verifiedReconciliationRelease.latestProductionMigrationSha256 ===
      historicalRelease.latestProductionMigrationSha256 &&
    checkpoint.verifiedReconciliationRelease.databaseVerified ===
      historicalRelease.databaseVerified &&
    checkpoint.verifiedReconciliationRelease.sitesProductionVerified ===
      historicalRelease.sitesVerified &&
    checkpoint.verifiedReconciliationRelease.customDomainsVerified ===
      historicalRelease.customDomainsVerified &&
    checkpoint.verifiedReconciliationRelease.sitesSourceParityVerified ===
      historicalRelease.sitesSourceParityVerified &&
    checkpoint.verifiedReconciliationRelease.migrationContentParityVerified ===
      historicalRelease.migrationContentParityVerified &&
    checkpoint.verifiedReconciliationRelease.migrationFilenameParityVerified ===
      historicalRelease.migrationFilenameParityVerified &&
    checkpoint.currentVerifiedRelease.pullRequest === currentRelease.pullRequest &&
    checkpoint.currentVerifiedRelease.reviewedHead === currentRelease.reviewedHead &&
    checkpoint.currentVerifiedRelease.mergedOperationalCommit ===
      currentRelease.githubMainCommit &&
    checkpoint.currentVerifiedRelease.sitesCheckoutSourceCommit ===
      currentRelease.sitesCheckoutCommit &&
    checkpoint.currentVerifiedRelease.sitesVersion === currentRelease.sitesVersion &&
    checkpoint.currentVerifiedRelease.sourceFileCount === currentRelease.sourceFileCount &&
    checkpoint.currentVerifiedRelease.sourceTreeSha256 ===
      currentRelease.sourceTreeSha256 &&
    checkpoint.currentVerifiedRelease.productionMigrations ===
      currentRelease.productionMigrationCount &&
    checkpoint.currentVerifiedRelease.latestProductionMigration ===
      currentRelease.latestProductionMigration &&
    checkpoint.currentVerifiedRelease.latestProductionMigrationSha256 ===
      currentRelease.latestProductionMigrationSha256 &&
    checkpoint.currentVerifiedRelease.databaseApplied === currentRelease.databaseApplied &&
    checkpoint.currentVerifiedRelease.databaseVerified === currentRelease.databaseVerified &&
    checkpoint.currentVerifiedRelease.sitesProductionVerified === currentRelease.sitesVerified &&
    checkpoint.currentVerifiedRelease.customDomainsVerified ===
      currentRelease.customDomainsVerified &&
    checkpoint.currentVerifiedRelease.sitesSourceParityVerified ===
      currentRelease.sitesSourceParityVerified &&
    checkpoint.currentVerifiedRelease.migrationContentParityVerified ===
      currentRelease.migrationContentParityVerified &&
    checkpoint.currentVerifiedRelease.migrationFilenameParityVerified ===
      currentRelease.migrationFilenameParityVerified &&
    checkpoint.observedProductionDrift.observedAt === observedProduction.observedAt &&
    checkpoint.observedProductionDrift.evidenceStatus === observedProduction.evidenceStatus &&
    checkpoint.observedProductionDrift.canonicalGitHubMainCommit ===
      observedProduction.canonicalGitHubMainCommit &&
    checkpoint.observedProductionDrift.githubSourceParityVerified ===
      observedProduction.githubSourceParityVerified &&
    checkpoint.observedProductionDrift.sitesVersion === observedProduction.sitesVersion &&
    checkpoint.observedProductionDrift.sitesCheckoutSourceCommit ===
      observedProduction.sitesCheckoutCommit &&
    checkpoint.observedProductionDrift.sourceFileCount === observedProduction.sourceFileCount &&
    checkpoint.observedProductionDrift.sourceTreeSha256 === observedProduction.sourceTreeSha256 &&
    checkpoint.observedProductionDrift.sitesSourceParityVerified ===
      observedProduction.sitesSourceParityVerified &&
    checkpoint.observedProductionDrift.productionMigrations ===
      observedProduction.productionMigrationCount &&
    checkpoint.observedProductionDrift.latestProductionMigration ===
      observedProduction.latestProductionMigration &&
    checkpoint.observedProductionDrift.latestProductionMigrationSha256 ===
      observedProduction.latestProductionMigrationSha256 &&
    checkpoint.observedProductionDrift.databaseLedgerObserved ===
      observedProduction.databaseLedgerObserved &&
    checkpoint.observedProductionDrift.databaseAppliedThroughLatestObserved ===
      observedProduction.databaseAppliedThroughLatestObserved &&
    checkpoint.observedProductionDrift.candidateParityVerified ===
      observedProduction.candidateParityVerified &&
    checkpoint.releaseCandidate.manifest ===
      "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    checkpoint.releaseCandidate.state === candidate.status &&
    checkpoint.releaseCandidate.basedOnGitHubMainCommit ===
      candidate.basedOnGitHubMainCommit &&
    checkpoint.releaseCandidate.pullRequest === candidate.pullRequest &&
    checkpoint.releaseCandidate.githubMerged === candidate.githubMerged &&
    checkpoint.releaseCandidate.futureMergedGitHubCommit === candidate.futureMergedGitHubCommit &&
    checkpoint.releaseCandidate.futureSitesVersion === candidate.futureSitesVersion &&
    checkpoint.releaseCandidate.reviewedLocally === candidate.reviewedLocally &&
    checkpoint.releaseCandidate.localReviewPassed &&
    checkpoint.releaseCandidate.allFourWorkflowsGreen === null &&
    checkpoint.releaseCandidate.zeroUnresolvedReviewThreads === null &&
    checkpoint.releaseCandidate.sourceFileCount === candidate.sourceFileCount &&
    checkpoint.releaseCandidate.sourceTreeSha256 === candidate.sourceTreeSha256 &&
    checkpoint.releaseCandidate.migrationFileCount === candidate.migrationFileCount &&
    checkpoint.releaseCandidate.migrationTreeSha256 === candidate.migrationTreeSha256 &&
    checkpoint.releaseCandidate.latestCandidateMigration ===
      candidate.latestCandidateMigration &&
    checkpoint.releaseCandidate.latestCandidateMigrationSha256 ===
      candidate.latestCandidateMigrationSha256 &&
    checkpoint.releaseCandidate.databaseChangesRequired ===
      candidate.databaseChangesRequired &&
    checkpoint.releaseCandidate.databaseMigrationApplied === candidate.databaseMigrationApplied &&
    checkpoint.releaseCandidate.sitesPublishRequired === candidate.sitesPublishRequired &&
    checkpoint.releaseCandidate.sitesCandidatePublished === candidate.sitesPublished,
  "RR checkpoint must match PR #151 / Sites v19 / 15-migration live proof and the separate reviewed, unpublished Sites v20 candidate without inventing a database apply.",
);

for (const workflow of readdirSync(resolve(root, ".github/workflows")).filter((name) =>
  /\.ya?ml$/.test(name),
)) {
  must(
    !/vercel/i.test(read(`.github/workflows/${workflow}`)),
    `GitHub workflow depends on retired Vercel behavior: ${workflow}`,
  );
}

if (failures.length) {
  console.error("Sites-only deployment guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Sites-only deployment guardrail passed; PR #151 / Sites v19 / 15 migrations is current, the Sites v20 candidate remains unpublished with no database change, and Vercel stays inert.",
);
