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
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  observedProductionDrift: {
    evidenceStatus: string;
    sitesVersion: number;
    sitesCheckoutCommit: string | null;
    sourceFileCount: number | null;
    sourceTreeSha256: string | null;
    sitesSourceParityVerified: boolean;
    productionMigrationCount: number;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    status: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
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
  status: string;
  verifiedReconciliationRelease: {
    pullRequest: number;
    githubMainCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrations: number;
  };
  observedProductionDrift: {
    evidenceStatus: string;
    sitesVersion: number;
    sitesCheckoutSourceCommit: string | null;
    sourceFileCount: number | null;
    sourceTreeSha256: string | null;
    sitesSourceParityVerified: boolean;
    productionMigrations: number;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    state: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesCandidatePublished: boolean;
  };
};

const historicalRelease = manifest.verifiedReconciliationRelease;
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
].map((path) => ({ path, source: read(path).slice(0, 14_000) }));
const combined = documents.map(({ source }) => source).join("\n");
for (const marker of [
  "Vercel is retired",
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
  candidate.sourceTreeSha256,
  candidate.migrationTreeSha256,
  `Sites version ${historicalRelease.sitesVersion}`,
  `Sites version ${observedProduction.sitesVersion}`,
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
    manifest.releaseState === "local_candidate_reviewed_unmerged_unpublished_unapplied" &&
    historicalRelease.pullRequest === 149 &&
    historicalRelease.githubMainCommit === "9749b68ce2cfc383deeae6aa63c413019ef61385" &&
    historicalRelease.sitesCheckoutCommit === "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0" &&
    historicalRelease.sitesVersion === 15 &&
    historicalRelease.sourceFileCount === 55 &&
    historicalRelease.sourceTreeSha256 ===
      "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f" &&
    historicalRelease.productionMigrationCount === 13 &&
    historicalRelease.sitesSourceParityVerified &&
    historicalRelease.migrationContentParityVerified &&
    historicalRelease.migrationFilenameParityVerified &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    observedProduction.evidenceStatus === "observed_live_not_source_reconciled" &&
    observedProduction.sitesVersion === 18 &&
    observedProduction.sitesCheckoutCommit === null &&
    observedProduction.sourceFileCount === null &&
    observedProduction.sourceTreeSha256 === null &&
    !observedProduction.sitesSourceParityVerified &&
    observedProduction.productionMigrationCount === 14 &&
    observedProduction.databaseLedgerObserved &&
    observedProduction.databaseAppliedThroughLatestObserved &&
    !observedProduction.candidateParityVerified &&
    candidate.status === "reviewed_locally_unmerged_unpublished_unapplied" &&
    candidate.pullRequest === null &&
    !candidate.githubMerged &&
    candidate.futureMergedGitHubCommit === null &&
    candidate.futureSitesVersion === null &&
    candidate.reviewedLocally &&
    candidate.sourceFileCount === 79 &&
    candidate.migrationFileCount === 15 &&
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
  "Schema-3 deployment manifest must preserve v15 history, distinguish observed v18, and keep the 78-file/15-migration candidate unpublished and unapplied.",
);

must(
  checkpoint.schemaVersion === 6 &&
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
    checkpoint.observedProductionDrift.evidenceStatus === observedProduction.evidenceStatus &&
    checkpoint.observedProductionDrift.sitesVersion === observedProduction.sitesVersion &&
    checkpoint.observedProductionDrift.sitesCheckoutSourceCommit ===
      observedProduction.sitesCheckoutCommit &&
    checkpoint.observedProductionDrift.sourceFileCount === observedProduction.sourceFileCount &&
    checkpoint.observedProductionDrift.sourceTreeSha256 === observedProduction.sourceTreeSha256 &&
    checkpoint.observedProductionDrift.sitesSourceParityVerified ===
      observedProduction.sitesSourceParityVerified &&
    checkpoint.observedProductionDrift.productionMigrations ===
      observedProduction.productionMigrationCount &&
    checkpoint.observedProductionDrift.databaseLedgerObserved ===
      observedProduction.databaseLedgerObserved &&
    checkpoint.observedProductionDrift.databaseAppliedThroughLatestObserved ===
      observedProduction.databaseAppliedThroughLatestObserved &&
    checkpoint.observedProductionDrift.candidateParityVerified ===
      observedProduction.candidateParityVerified &&
    checkpoint.releaseCandidate.state === candidate.status &&
    checkpoint.releaseCandidate.pullRequest === candidate.pullRequest &&
    checkpoint.releaseCandidate.githubMerged === candidate.githubMerged &&
    checkpoint.releaseCandidate.futureMergedGitHubCommit === candidate.futureMergedGitHubCommit &&
    checkpoint.releaseCandidate.futureSitesVersion === candidate.futureSitesVersion &&
    checkpoint.releaseCandidate.reviewedLocally === candidate.reviewedLocally &&
    checkpoint.releaseCandidate.sourceFileCount === candidate.sourceFileCount &&
    checkpoint.releaseCandidate.sourceTreeSha256 === candidate.sourceTreeSha256 &&
    checkpoint.releaseCandidate.migrationFileCount === candidate.migrationFileCount &&
    checkpoint.releaseCandidate.migrationTreeSha256 === candidate.migrationTreeSha256 &&
    checkpoint.releaseCandidate.databaseMigrationApplied === candidate.databaseMigrationApplied &&
    checkpoint.releaseCandidate.sitesPublishRequired === candidate.sitesPublishRequired &&
    checkpoint.releaseCandidate.sitesCandidatePublished === candidate.sitesPublished,
  "RR checkpoint must match the schema-3 deployment manifest without promoting the local candidate to production.",
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

console.log("Sites-only deployment guardrail passed; Sites is sole delivery and Vercel stays inert.");
