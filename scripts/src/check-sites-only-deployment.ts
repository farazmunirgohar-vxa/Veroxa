import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  VERIFIED_DEPLOYMENT_FREEZE_STATE,
  VERIFIED_GITHUB_PARITY_RELEASE_STATE,
  VERIFIED_GITHUB_PARITY_STATUS,
  VERIFIED_MIGRATION_EVIDENCE_SCOPE,
  VERIFIED_PRODUCTION_EVIDENCE_STATUS,
  VERIFIED_SOURCE_EVIDENCE_SCOPE,
  V36_GITHUB_RECONCILIATION,
  V36_OPERATIONAL_COMMIT_SCOPE,
  type GitHubReconciliationEvidence,
} from "./release-manifest";

const root = resolve(import.meta.dirname, "../..");
const failures: string[] = [];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

type ManifestRelease = {
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

type ManifestObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  canonicalGitHubMainCommitScope: string;
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

type Candidate = {
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

const manifest = JSON.parse(
  read("artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json"),
) as {
  schemaVersion: number;
  sitesProjectId: string;
  releaseState: string;
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    allowedDeployment: string;
    releaseCondition: string;
  };
  verifiedReconciliationRelease: ManifestRelease;
  previousVerifiedRelease: ManifestRelease & { reviewedHead: string };
  lastGitHubParityRelease: ManifestRelease & {
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
  currentProductionObservation: ManifestObservation;
  githubReconciliationEvidence: GitHubReconciliationEvidence;
  releaseCandidate: Candidate;
  source: {
    evidenceScope: string;
    root: string;
    fileCount: number;
    treeSha256: string;
    generatedPathExclusions: string[];
  };
  migrations: {
    evidenceScope: string;
    root: string;
    fileCount: number;
    treeSha256: string;
  };
  cleanupState: {
    branchDeletionCapabilityAvailable: boolean;
    branchDeletionAllowed: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
  };
};

type CheckpointRelease = {
  pullRequest: number;
  reviewedHead?: string;
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

const checkpoint = JSON.parse(
  read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"),
) as {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  reviewedAt: string;
  verifiedReconciliationRelease: Omit<
    CheckpointRelease,
    "databaseApplied" | "reviewedHead"
  > & {
    githubMainCommit: string;
  };
  previousVerifiedRelease: CheckpointRelease & { reviewedHead: string };
  lastGitHubParityRelease: CheckpointRelease & {
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
    sitesCheckoutSourceCommit: string | null;
    sourceFileCount: number | null;
    sourceTreeSha256: string | null;
    sitesSourceParityVerified: boolean;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
  }>;
  currentProductionObservation: {
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    canonicalGitHubMainCommitScope: string;
    githubMainMatchesCandidate: boolean;
    sitesVersion: number;
    sitesCheckoutSourceCommit: string;
    sourceFileCount: number;
    sourceTreeSha256: string;
    candidateSourceMatchesLiveSites: boolean;
    productionMigrations: number;
    migrationTreeSha256: string;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateMigrationsMatchLiveLedger: boolean;
    fullReleaseGatePassed: boolean;
  };
  githubReconciliationEvidence: GitHubReconciliationEvidence;
  releaseCandidate: {
    manifest: string;
    state: string;
    actionScope: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    localReviewPassed: boolean;
    allFourWorkflowsGreen: boolean | null;
    zeroUnresolvedReviewThreads: boolean | null;
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
    sitesCandidatePublished: boolean;
  };
};

const v36 = {
  githubBase: "302621bf6b9ab78320abe4175b45b56e9e64ae2a",
  githubMain: V36_GITHUB_RECONCILIATION.mergedCommit,
  sitesCheckout: "b8122642b72e5d4e6e74c379469f2a157781ab3d",
  sourceFileCount: 185,
  sourceSha256:
    "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7",
  migrationFileCount: 37,
  migrationSha256:
    "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  latestMigration: "20260802020000_momo_pipeline_query_indexes_v2.sql",
  latestMigrationSha256:
    "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd",
};

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(
    !existsSync(resolve(root, retiredPath)),
    `Retired Vercel artifact exists: ${retiredPath}`,
  );
}

const vercelShutdownPath = resolve(root, "vercel.json");
must(
  existsSync(vercelShutdownPath),
  "The Vercel automatic-deployment shutdown sentinel is missing.",
);
if (existsSync(vercelShutdownPath)) {
  try {
    const sentinel = JSON.parse(readFileSync(vercelShutdownPath, "utf8")) as {
      $schema?: unknown;
      git?: Record<string, unknown>;
    };
    must(
      JSON.stringify(Object.keys(sentinel).sort()) ===
        JSON.stringify(["$schema", "git"]) &&
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
  "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
  "artifacts/veroxa/docs/MOMO_MEDIA_V22_LIVE_CLOSEOUT.json",
].map((path) => ({ path, source: read(path).slice(0, 18_000) }));
const combined = documents.map(({ source }) => source).join("\n");
for (const marker of [
  "Vercel is retired",
  "PR #149",
  "PR #154",
  "PR #155",
  "PR #157",
  "Sites v22",
  "Sites v36",
  "37 migrations",
  v36.githubMain,
  v36.sitesCheckout,
  v36.sourceSha256,
  v36.migrationSha256,
]) {
  must(
    combined.includes(marker),
    `Current source truth is missing delivery marker: ${marker}`,
  );
}
for (const banned of [
  "Vercel is the new primary deployment target",
  "Vercel remains rollback",
  "Vercel is temporary rollback",
  "GitHub + Codex + Vercel",
  "Use Vercel as the deployment target",
]) {
  must(
    !combined.includes(banned),
    `Current source truth restores retired Vercel behavior: ${banned}`,
  );
}
must(
  /shutdown sentinel[\s\S]{0,500}(?:external|dashboard)[\s\S]{0,300}disconnect/i.test(
    combined,
  ),
  "Current source truth must retain the sentinel until external Vercel Git disconnection is verified.",
);

const hostingPath = "artifacts/veroxa-sites/.openai/hosting.json";
must(
  existsSync(resolve(root, hostingPath)),
  "Sites hosting identity is missing.",
);
if (existsSync(resolve(root, hostingPath))) {
  const hosting = JSON.parse(read(hostingPath)) as { project_id?: unknown };
  must(
    hosting.project_id === "appgprj_6a53d07c7c28819182801cf35dfd30de" &&
      hosting.project_id === manifest.sitesProjectId,
    "Sites project identity drifted.",
  );
}

const readinessPath = "artifacts/veroxa-sites/app/momo-readiness-tracker.json";
const readiness = JSON.parse(read(readinessPath)) as {
  schemaVersion: number;
  overallStatus: string;
  overallRule: string;
};
const readinessText = read(readinessPath);
const releaseIdentityMarkers = [
  manifest.verifiedReconciliationRelease.githubMainCommit,
  manifest.verifiedReconciliationRelease.sitesCheckoutCommit,
  manifest.verifiedReconciliationRelease.sourceTreeSha256,
  manifest.previousVerifiedRelease.reviewedHead,
  manifest.previousVerifiedRelease.githubMainCommit,
  manifest.previousVerifiedRelease.sitesCheckoutCommit,
  manifest.previousVerifiedRelease.sourceTreeSha256,
  manifest.lastGitHubParityRelease.reviewedHead,
  manifest.lastGitHubParityRelease.githubMainCommit,
  manifest.lastGitHubParityRelease.sitesCheckoutCommit,
  manifest.lastGitHubParityRelease.sourceTreeSha256,
  v36.githubBase,
  v36.githubMain,
  V36_GITHUB_RECONCILIATION.reviewedHead,
  v36.sitesCheckout,
  v36.sourceSha256,
  v36.migrationSha256,
  "Sites version 36",
  "fullReleaseGatePassed",
  "futureSitesVersion",
];
must(
  readiness.schemaVersion === 9 &&
    readiness.overallStatus === "blocked" &&
    /No-Go/i.test(readiness.overallRule) &&
    !releaseIdentityMarkers.some((marker) => readinessText.includes(marker)),
  "Sites-bundled readiness evidence must externalize exact deployment identity and remain stable across publications.",
);

const pr149 = manifest.verifiedReconciliationRelease;
const pr154 = manifest.previousVerifiedRelease;
const pr155 = manifest.lastGitHubParityRelease;
must(
  manifest.schemaVersion === 4 &&
    manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de" &&
    pr149.pullRequest === 149 &&
    pr149.githubMainCommit === "9749b68ce2cfc383deeae6aa63c413019ef61385" &&
    pr149.sitesCheckoutCommit === "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0" &&
    pr149.sitesVersion === 15 &&
    pr149.sourceFileCount === 55 &&
    pr149.sourceTreeSha256 ===
      "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f" &&
    pr149.productionMigrationCount === 13 &&
    !pr149.databaseApplied &&
    pr149.databaseVerified &&
    pr149.sitesPublished &&
    pr149.sitesVerified &&
    pr149.customDomainsVerified &&
    pr149.sitesSourceParityVerified &&
    pr149.migrationContentParityVerified &&
    pr149.migrationFilenameParityVerified &&
    pr154.pullRequest === 154 &&
    pr154.reviewedHead === "4a7a2122bb71defc0f1db0c795b4c4c8fdb930a5" &&
    pr154.githubMainCommit === "72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695" &&
    pr154.sitesCheckoutCommit === "8c50dd6726629e77d22f07eb6aac9f6982001902" &&
    pr154.sitesVersion === 21 &&
    pr154.sourceFileCount === 88 &&
    pr154.sourceTreeSha256 ===
      "60c2e069d6a5f54480c8ee3151e28ccc7d920e52fd5e3b978f47f41dec4013bb" &&
    pr154.productionMigrationCount === 16 &&
    pr154.databaseApplied &&
    pr154.databaseVerified &&
    pr154.sitesPublished &&
    pr154.sitesVerified &&
    pr154.customDomainsVerified &&
    pr154.sitesSourceParityVerified &&
    pr154.migrationContentParityVerified &&
    pr154.migrationFilenameParityVerified &&
    pr155.evidenceScope === "last_github_sites_parity_release" &&
    pr155.supersededAsLiveBaseline &&
    pr155.pullRequest === 155 &&
    pr155.reviewedHead === "96a6c00857b438b37c2e8d99329c0f556de850a2" &&
    pr155.githubMainCommit === "d1f6a9a78ac54cd5447689d5f8b3d42466daf479" &&
    pr155.sitesCheckoutCommit === "83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e" &&
    pr155.sitesVersion === 22 &&
    pr155.sourceFileCount === 93 &&
    pr155.sourceTreeSha256 ===
      "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490" &&
    pr155.productionMigrationCount === 16 &&
    pr155.databaseApplied &&
    pr155.databaseVerified &&
    pr155.sitesPublished &&
    pr155.sitesVerified &&
    pr155.customDomainsVerified &&
    pr155.sitesSourceParityVerified &&
    pr155.migrationContentParityVerified &&
    pr155.migrationFilenameParityVerified,
  "Schema-4 deployment manifest must preserve immutable PR #149 / v15, PR #154 / v21, and last GitHub-parity PR #155 / v22 release proof.",
);

const historical = manifest.historicalProductionObservations;
const live = manifest.currentProductionObservation;
const candidate = manifest.releaseCandidate;
must(
  historical.length === 1 &&
    historical[0]?.observedAt === "2026-07-22" &&
    historical[0].evidenceStatus === "historical_live_not_source_reconciled" &&
    historical[0].sitesVersion === 18 &&
    historical[0].sitesCheckoutCommit === null &&
    historical[0].sourceFileCount === null &&
    historical[0].sourceTreeSha256 === null &&
    !historical[0].githubSourceParityVerified &&
    !historical[0].sitesSourceParityVerified &&
    historical[0].productionMigrationCount === 14 &&
    historical[0].databaseLedgerObserved &&
    historical[0].databaseAppliedThroughLatestObserved &&
    live.observedAt === "2026-08-02" &&
    live.evidenceStatus === VERIFIED_PRODUCTION_EVIDENCE_STATUS &&
    live.canonicalGitHubMainCommit === v36.githubMain &&
    live.canonicalGitHubMainCommitScope === V36_OPERATIONAL_COMMIT_SCOPE &&
    live.githubMainMatchesCandidate &&
    live.sitesVersion === 36 &&
    live.sitesCheckoutCommit === v36.sitesCheckout &&
    live.sourceFileCount === v36.sourceFileCount &&
    live.sourceTreeSha256 === v36.sourceSha256 &&
    live.candidateSourceMatchesLiveSites &&
    live.productionMigrationCount === v36.migrationFileCount &&
    live.migrationTreeSha256 === v36.migrationSha256 &&
    live.latestProductionMigration === v36.latestMigration &&
    live.latestProductionMigrationSha256 === v36.latestMigrationSha256 &&
    live.databaseLedgerObserved &&
    live.databaseAppliedThroughLatestObserved &&
    live.candidateMigrationsMatchLiveLedger &&
    live.fullReleaseGatePassed &&
    manifest.releaseState === VERIFIED_GITHUB_PARITY_RELEASE_STATE &&
    candidate.status === VERIFIED_GITHUB_PARITY_STATUS &&
    candidate.actionScope === "github_reconciliation_candidate" &&
    candidate.basedOnGitHubMainCommit === v36.githubBase &&
    candidate.pullRequest === V36_GITHUB_RECONCILIATION.pullRequest &&
    candidate.githubMerged &&
    candidate.futureMergedGitHubCommit === v36.githubMain &&
    candidate.futureSitesVersion === null &&
    candidate.reviewedLocally &&
    candidate.candidateSourceMatchesLiveSites &&
    candidate.candidateMigrationsMatchLiveLedger &&
    candidate.githubMainMatchesCandidate &&
    candidate.fullReleaseGatePassed &&
    candidate.sourceFileCount === v36.sourceFileCount &&
    candidate.sourceTreeSha256 === v36.sourceSha256 &&
    candidate.migrationFileCount === v36.migrationFileCount &&
    candidate.migrationTreeSha256 === v36.migrationSha256 &&
    candidate.latestCandidateMigration === v36.latestMigration &&
    candidate.latestCandidateMigrationSha256 === v36.latestMigrationSha256 &&
    !candidate.databaseChangesRequired &&
    !candidate.databaseMigrationApplied &&
    !candidate.sitesPublishRequired &&
    !candidate.sitesPublished &&
    manifest.source.evidenceScope === VERIFIED_SOURCE_EVIDENCE_SCOPE &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.fileCount === v36.sourceFileCount &&
    manifest.source.treeSha256 === v36.sourceSha256 &&
    manifest.migrations.evidenceScope === VERIFIED_MIGRATION_EVIDENCE_SCOPE &&
    manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.fileCount === v36.migrationFileCount &&
    manifest.migrations.treeSha256 === v36.migrationSha256 &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.deploymentFreeze.state === VERIFIED_DEPLOYMENT_FREEZE_STATE &&
    manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.branchDeletionAllowed &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired,
  "PR #157 GitHub parity must match already-live v36 source and migration evidence without claiming any Sites publish or database apply.",
);
must(
  JSON.stringify(manifest.githubReconciliationEvidence) ===
    JSON.stringify(V36_GITHUB_RECONCILIATION) &&
    JSON.stringify(checkpoint.githubReconciliationEvidence) ===
      JSON.stringify(V36_GITHUB_RECONCILIATION),
  "Manifest and RR must preserve exact PR #157 review, merge, and workflow evidence.",
);

const latestMigrationPath = resolve(
  root,
  "supabase/migrations",
  v36.latestMigration,
);
must(
  existsSync(latestMigrationPath),
  `Latest v36 migration is missing from canonical source: ${v36.latestMigration}.`,
);
if (existsSync(latestMigrationPath)) {
  const actual = createHash("sha256")
    .update(readFileSync(latestMigrationPath))
    .digest("hex");
  must(
    actual === v36.latestMigrationSha256,
    "Latest v36 migration checksum disagrees with canonical source.",
  );
}

const checkpoint149 = checkpoint.verifiedReconciliationRelease;
const checkpoint154 = checkpoint.previousVerifiedRelease;
const checkpoint155 = checkpoint.lastGitHubParityRelease;
const checkpointHistorical = checkpoint.historicalProductionObservations;
const checkpointLive = checkpoint.currentProductionObservation;
const checkpointCandidate = checkpoint.releaseCandidate;
must(
  checkpoint.schemaVersion === 8 &&
    /v36/i.test(checkpoint.checkpoint) &&
    /github-reconciliation/i.test(checkpoint.checkpoint) &&
    checkpoint.status === manifest.releaseState &&
    checkpoint.reviewedAt === "2026-08-02" &&
    checkpoint149.pullRequest === pr149.pullRequest &&
    checkpoint149.githubMainCommit === pr149.githubMainCommit &&
    checkpoint149.sitesCheckoutSourceCommit === pr149.sitesCheckoutCommit &&
    checkpoint149.sitesVersion === pr149.sitesVersion &&
    checkpoint149.sourceFileCount === pr149.sourceFileCount &&
    checkpoint149.sourceTreeSha256 === pr149.sourceTreeSha256 &&
    checkpoint149.productionMigrations === pr149.productionMigrationCount &&
    checkpoint149.latestProductionMigration ===
      pr149.latestProductionMigration &&
    checkpoint149.latestProductionMigrationSha256 ===
      pr149.latestProductionMigrationSha256 &&
    checkpoint149.databaseVerified === pr149.databaseVerified &&
    checkpoint149.sitesProductionVerified === pr149.sitesVerified &&
    checkpoint149.customDomainsVerified === pr149.customDomainsVerified &&
    checkpoint149.sitesSourceParityVerified ===
      pr149.sitesSourceParityVerified &&
    checkpoint149.migrationContentParityVerified ===
      pr149.migrationContentParityVerified &&
    checkpoint149.migrationFilenameParityVerified ===
      pr149.migrationFilenameParityVerified &&
    checkpoint154.pullRequest === pr154.pullRequest &&
    checkpoint154.reviewedHead === pr154.reviewedHead &&
    checkpoint154.mergedOperationalCommit === pr154.githubMainCommit &&
    checkpoint154.sitesCheckoutSourceCommit === pr154.sitesCheckoutCommit &&
    checkpoint154.sitesVersion === pr154.sitesVersion &&
    checkpoint154.sourceFileCount === pr154.sourceFileCount &&
    checkpoint154.sourceTreeSha256 === pr154.sourceTreeSha256 &&
    checkpoint154.productionMigrations === pr154.productionMigrationCount &&
    checkpoint154.latestProductionMigration ===
      pr154.latestProductionMigration &&
    checkpoint154.latestProductionMigrationSha256 ===
      pr154.latestProductionMigrationSha256 &&
    checkpoint154.databaseApplied === pr154.databaseApplied &&
    checkpoint154.databaseVerified === pr154.databaseVerified &&
    checkpoint154.sitesProductionVerified === pr154.sitesVerified &&
    checkpoint154.customDomainsVerified === pr154.customDomainsVerified &&
    checkpoint154.sitesSourceParityVerified ===
      pr154.sitesSourceParityVerified &&
    checkpoint154.migrationContentParityVerified ===
      pr154.migrationContentParityVerified &&
    checkpoint154.migrationFilenameParityVerified ===
      pr154.migrationFilenameParityVerified &&
    checkpoint155.evidenceScope === pr155.evidenceScope &&
    checkpoint155.supersededAsLiveBaseline === pr155.supersededAsLiveBaseline &&
    checkpoint155.pullRequest === pr155.pullRequest &&
    checkpoint155.reviewedHead === pr155.reviewedHead &&
    checkpoint155.mergedOperationalCommit === pr155.githubMainCommit &&
    checkpoint155.sitesCheckoutSourceCommit === pr155.sitesCheckoutCommit &&
    checkpoint155.sitesVersion === pr155.sitesVersion &&
    checkpoint155.sourceFileCount === pr155.sourceFileCount &&
    checkpoint155.sourceTreeSha256 === pr155.sourceTreeSha256 &&
    checkpoint155.productionMigrations === pr155.productionMigrationCount &&
    checkpoint155.latestProductionMigration ===
      pr155.latestProductionMigration &&
    checkpoint155.latestProductionMigrationSha256 ===
      pr155.latestProductionMigrationSha256 &&
    checkpoint155.databaseApplied === pr155.databaseApplied &&
    checkpoint155.databaseVerified === pr155.databaseVerified &&
    checkpoint155.sitesProductionVerified === pr155.sitesVerified &&
    checkpoint155.customDomainsVerified === pr155.customDomainsVerified &&
    checkpoint155.sitesSourceParityVerified ===
      pr155.sitesSourceParityVerified &&
    checkpoint155.migrationContentParityVerified ===
      pr155.migrationContentParityVerified &&
    checkpoint155.migrationFilenameParityVerified ===
      pr155.migrationFilenameParityVerified &&
    checkpointHistorical.length === 1 &&
    checkpointHistorical[0]?.observedAt === historical[0]?.observedAt &&
    checkpointHistorical[0].evidenceStatus === historical[0].evidenceStatus &&
    checkpointHistorical[0].canonicalGitHubMainCommit ===
      historical[0].canonicalGitHubMainCommit &&
    checkpointHistorical[0].githubSourceParityVerified ===
      historical[0].githubSourceParityVerified &&
    checkpointHistorical[0].sitesVersion === historical[0].sitesVersion &&
    checkpointHistorical[0].sitesCheckoutSourceCommit ===
      historical[0].sitesCheckoutCommit &&
    checkpointHistorical[0].sourceFileCount === historical[0].sourceFileCount &&
    checkpointHistorical[0].sourceTreeSha256 ===
      historical[0].sourceTreeSha256 &&
    checkpointHistorical[0].sitesSourceParityVerified ===
      historical[0].sitesSourceParityVerified &&
    checkpointHistorical[0].productionMigrations ===
      historical[0].productionMigrationCount &&
    checkpointHistorical[0].latestProductionMigration ===
      historical[0].latestProductionMigration &&
    checkpointHistorical[0].latestProductionMigrationSha256 ===
      historical[0].latestProductionMigrationSha256 &&
    checkpointHistorical[0].databaseLedgerObserved ===
      historical[0].databaseLedgerObserved &&
    checkpointHistorical[0].databaseAppliedThroughLatestObserved ===
      historical[0].databaseAppliedThroughLatestObserved &&
    checkpointLive.observedAt === live.observedAt &&
    checkpointLive.evidenceStatus === live.evidenceStatus &&
    checkpointLive.canonicalGitHubMainCommit ===
      live.canonicalGitHubMainCommit &&
    checkpointLive.canonicalGitHubMainCommitScope ===
      live.canonicalGitHubMainCommitScope &&
    checkpointLive.githubMainMatchesCandidate ===
      live.githubMainMatchesCandidate &&
    checkpointLive.sitesVersion === live.sitesVersion &&
    checkpointLive.sitesCheckoutSourceCommit === live.sitesCheckoutCommit &&
    checkpointLive.sourceFileCount === live.sourceFileCount &&
    checkpointLive.sourceTreeSha256 === live.sourceTreeSha256 &&
    checkpointLive.candidateSourceMatchesLiveSites ===
      live.candidateSourceMatchesLiveSites &&
    checkpointLive.productionMigrations === live.productionMigrationCount &&
    checkpointLive.migrationTreeSha256 === live.migrationTreeSha256 &&
    checkpointLive.latestProductionMigration ===
      live.latestProductionMigration &&
    checkpointLive.latestProductionMigrationSha256 ===
      live.latestProductionMigrationSha256 &&
    checkpointLive.databaseLedgerObserved === live.databaseLedgerObserved &&
    checkpointLive.databaseAppliedThroughLatestObserved ===
      live.databaseAppliedThroughLatestObserved &&
    checkpointLive.candidateMigrationsMatchLiveLedger ===
      live.candidateMigrationsMatchLiveLedger &&
    checkpointLive.fullReleaseGatePassed === live.fullReleaseGatePassed &&
    checkpointCandidate.manifest ===
      "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    checkpointCandidate.state === candidate.status &&
    checkpointCandidate.actionScope === candidate.actionScope &&
    checkpointCandidate.basedOnGitHubMainCommit ===
      candidate.basedOnGitHubMainCommit &&
    checkpointCandidate.pullRequest === candidate.pullRequest &&
    checkpointCandidate.githubMerged === candidate.githubMerged &&
    checkpointCandidate.futureMergedGitHubCommit ===
      candidate.futureMergedGitHubCommit &&
    checkpointCandidate.futureSitesVersion === candidate.futureSitesVersion &&
    checkpointCandidate.reviewedLocally === candidate.reviewedLocally &&
    checkpointCandidate.localReviewPassed === candidate.reviewedLocally &&
    checkpointCandidate.allFourWorkflowsGreen === true &&
    checkpointCandidate.zeroUnresolvedReviewThreads === true &&
    checkpointCandidate.candidateSourceMatchesLiveSites ===
      candidate.candidateSourceMatchesLiveSites &&
    checkpointCandidate.candidateMigrationsMatchLiveLedger ===
      candidate.candidateMigrationsMatchLiveLedger &&
    checkpointCandidate.githubMainMatchesCandidate ===
      candidate.githubMainMatchesCandidate &&
    checkpointCandidate.fullReleaseGatePassed ===
      candidate.fullReleaseGatePassed &&
    checkpointCandidate.sourceFileCount === candidate.sourceFileCount &&
    checkpointCandidate.sourceTreeSha256 === candidate.sourceTreeSha256 &&
    checkpointCandidate.migrationFileCount === candidate.migrationFileCount &&
    checkpointCandidate.migrationTreeSha256 === candidate.migrationTreeSha256 &&
    checkpointCandidate.latestCandidateMigration ===
      candidate.latestCandidateMigration &&
    checkpointCandidate.latestCandidateMigrationSha256 ===
      candidate.latestCandidateMigrationSha256 &&
    checkpointCandidate.databaseChangesRequired ===
      candidate.databaseChangesRequired &&
    checkpointCandidate.databaseMigrationApplied ===
      candidate.databaseMigrationApplied &&
    checkpointCandidate.sitesPublishRequired ===
      candidate.sitesPublishRequired &&
    checkpointCandidate.sitesCandidatePublished === candidate.sitesPublished,
  "RR checkpoint must preserve historical release evidence and match verified PR #157 GitHub parity without inventing a Sites publication or database apply.",
);

for (const workflow of readdirSync(resolve(root, ".github/workflows")).filter(
  (name) => /\.ya?ml$/.test(name),
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
  "Sites-only deployment guardrail passed: immutable PR #149 / v15, PR #154 / v21, and historical parity PR #155 / v22 evidence is preserved; PR #157 merged GitHub main matches live Sites v36 and the 37-migration ledger without a Sites publish or database apply; Vercel stays inert.",
);
