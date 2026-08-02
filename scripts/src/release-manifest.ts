import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const deploymentManifestPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);

export const TREE_HASH_ALGORITHM = "veroxa-path-null-content-null-sha256-v1";
export const REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE =
  "live_sites_v36_github_reconciliation_reviewed_unmerged";
export const REVIEWED_LOCAL_CANDIDATE_STATUS = "reviewed_locally_unmerged";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "live_sites_v36_github_reconciliation_fingerprints_refreshed_review_required";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "fingerprints_refreshed_review_required_unmerged";
export const VERIFIED_GITHUB_PARITY_RELEASE_STATE =
  "live_sites_v36_github_parity_verified";
export const VERIFIED_GITHUB_PARITY_STATUS =
  "github_reconciliation_merged_parity_verified";
export const VERIFIED_PRODUCTION_EVIDENCE_STATUS =
  "sites_v36_live_github_parity_verified";
export const VERIFIED_DEPLOYMENT_FREEZE_STATE =
  "production_frozen_github_parity_verified";
export const VERIFIED_SOURCE_EVIDENCE_SCOPE =
  "github_main_matching_live_sites_v36";
export const VERIFIED_MIGRATION_EVIDENCE_SCOPE =
  "github_main_matching_live_ledger_v36";
export const V36_OPERATIONAL_COMMIT_SCOPE =
  "v36_operational_parity_commit_not_closeout_pr_head";
export const RECONCILIATION_CANDIDATE_ACTION_SCOPE =
  "github_reconciliation_candidate";
export const RECONCILIATION_SOURCE_EVIDENCE_SCOPE =
  "github_reconciliation_candidate_matching_live_sites_v36";
export const RECONCILIATION_MIGRATION_EVIDENCE_SCOPE =
  "github_reconciliation_candidate_matching_live_ledger_v36";
export const GENERATED_PATH_EXCLUSIONS = [
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
] as const;

export const V36_GITHUB_RECONCILIATION = {
  pullRequest: 157,
  reviewedHead: "d3a63d25644fc699d1f521f8f803e5bd95daae49",
  mergedCommit: "aafebf93a6bc40f9578c29f4a25371f8203d0387",
  zeroUnresolvedReviewThreads: true,
  preMergeWorkflows: {
    ci: { runId: 30764961514, status: "success" },
    sitesVerify: { runId: 30764961531, status: "success" },
    supabaseVerify: { runId: 30764961516, status: "success" },
    veroxaVerify: { runId: 30764961539, status: "success" },
  },
  postMergePushWorkflows: {
    ci: { runId: 30767748950, status: "success" },
    sitesVerify: { runId: 30767748969, status: "success" },
    supabaseVerify: { runId: 30767748993, status: "success" },
    veroxaVerify: { runId: 30767748953, status: "success" },
  },
} as const;

export const V36_LIVE_PARITY_EVIDENCE = {
  observedAt: "2026-08-02",
  sitesVersion: 36,
  sitesCheckoutCommit: "b8122642b72e5d4e6e74c379469f2a157781ab3d",
  sourceFileCount: 185,
  sourceTreeSha256:
    "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7",
  migrationFileCount: 37,
  migrationTreeSha256:
    "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  latestMigration: "20260802020000_momo_pipeline_query_indexes_v2.sql",
  latestMigrationSha256:
    "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd",
} as const;

export const VERIFIED_DEPLOYMENT_ALLOWED_ACTION =
  "No Sites deployment or database apply is required: PR #157 reconciled GitHub main to the already-live Sites v36 and 37-migration production ledger.";
export const VERIFIED_RELEASE_CONDITION =
  "GitHub parity is verified and production remains frozen. Any future production change requires a new reviewed release with exact source and migration evidence plus explicit deployment authority.";

const WORKFLOW_EVIDENCE_KEYS = [
  "ci",
  "sitesVerify",
  "supabaseVerify",
  "veroxaVerify",
] as const;
const ACTIVATION_STATE_KEYS = [
  "newIncrementalSpendApproved",
  "aiWebResearchEnabled",
  "openAiCredentialProvisioned",
  "momoClientIdentityProvisioned",
  "momoOwnerContactAuthorized",
  "ownerConfirmedBusinessTruthVerified",
  "permissionedMediaVerified",
  "externalProvidersConnected",
  "externalPublishingEnabled",
  "momoActivationExecuted",
] as const;

// Kept temporarily as exports while downstream validators move to schema 4.
// Schema 4 deliberately has no state that treats this GitHub candidate as the
// actor that published the already-live Sites source or applied its migrations.
export const PUBLISHED_SITES_RELEASE_STATE =
  "published_sites_v22_no_database_change";
export const PUBLISHED_SITES_FOLLOWUP_STATUS =
  "published_sites_followup_no_database_change";

type Nullable<T> = T | null;

export type WorkflowEvidence = {
  runId: number;
  status: "success";
};

export type GitHubReconciliationEvidence = {
  pullRequest: number;
  reviewedHead: string;
  mergedCommit: string;
  zeroUnresolvedReviewThreads: boolean;
  preMergeWorkflows: Record<
    "ci" | "sitesVerify" | "supabaseVerify" | "veroxaVerify",
    WorkflowEvidence
  >;
  postMergePushWorkflows: Record<
    "ci" | "sitesVerify" | "supabaseVerify" | "veroxaVerify",
    WorkflowEvidence
  >;
};

type GitHubParityRelease = {
  evidenceScope: "last_github_sites_parity_release";
  supersededAsLiveBaseline: true;
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

type HistoricalProductionObservation = {
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
};

type CurrentProductionObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  canonicalGitHubMainCommitScope?: string;
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

export type DeploymentManifest = {
  schemaVersion: 4;
  recordKind: "veroxa_production_reconciliation_manifest";
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  lastGitHubParityRelease: GitHubParityRelease;
  historicalProductionObservations: HistoricalProductionObservation[];
  currentProductionObservation: CurrentProductionObservation;
  githubReconciliationEvidence?: GitHubReconciliationEvidence;
  releaseCandidate: {
    status: string;
    actionScope: typeof RECONCILIATION_CANDIDATE_ACTION_SCOPE;
    basedOnGitHubMainCommit: string;
    pullRequest: Nullable<number>;
    githubMerged: boolean;
    futureMergedGitHubCommit: Nullable<string>;
    futureSitesVersion: Nullable<number>;
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
    candidateSourceMatchesLiveSites: boolean;
    candidateMigrationsMatchLiveLedger: boolean;
    githubMainMatchesCandidate: boolean;
    fullReleaseGatePassed: boolean;
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
  activationState: {
    newIncrementalSpendApproved: boolean;
    aiWebResearchEnabled: boolean;
    openAiCredentialProvisioned: boolean;
    momoClientIdentityProvisioned: boolean;
    momoOwnerContactAuthorized: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingEnabled: boolean;
    momoActivationExecuted: boolean;
  };
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

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const lastParity = manifest.lastGitHubParityRelease;
  if (manifest.schemaVersion !== 4) failures.push("schemaVersion must be 4");
  if (manifest.recordKind !== "veroxa_production_reconciliation_manifest") {
    failures.push(
      "recordKind must identify the production reconciliation manifest",
    );
  }
  if (
    ![
      REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
      REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
    ].includes(manifest.releaseState)
  ) {
    failures.push(
      "releaseState must remain an unreleased local-candidate state",
    );
  }
  if (manifest.githubReconciliationEvidence !== undefined) {
    failures.push(
      "unreleased candidate cannot contain terminal GitHub reconciliation evidence",
    );
  }
  if (
    ![
      REVIEWED_LOCAL_CANDIDATE_STATUS,
      REFRESHED_LOCAL_CANDIDATE_STATUS,
    ].includes(candidate.status)
  ) {
    failures.push(
      "releaseCandidate.status must remain an unreleased local-candidate state",
    );
  }
  if (
    (manifest.releaseState === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE) !==
    (candidate.status === REVIEWED_LOCAL_CANDIDATE_STATUS)
  ) {
    failures.push("release and candidate review states must agree");
  }
  if (
    candidate.pullRequest !== null &&
    (!Number.isInteger(candidate.pullRequest) || candidate.pullRequest < 1)
  ) {
    failures.push(
      "pullRequest must be null before PR creation or a positive known PR number",
    );
  }
  if (candidate.githubMerged) failures.push("githubMerged must remain false");
  if (candidate.futureMergedGitHubCommit !== null) {
    failures.push("futureMergedGitHubCommit must remain null");
  }
  if (candidate.futureSitesVersion !== null) {
    failures.push("futureSitesVersion must remain null");
  }
  if (candidate.actionScope !== RECONCILIATION_CANDIDATE_ACTION_SCOPE) {
    failures.push(
      "candidate action evidence must be scoped to this reconciliation candidate",
    );
  }
  if (candidate.databaseChangesRequired) {
    failures.push(
      "databaseChangesRequired must remain false for source reconciliation",
    );
  }
  if (candidate.databaseMigrationApplied) {
    failures.push(
      "databaseMigrationApplied must remain false because this candidate did not apply the live migrations",
    );
  }
  if (candidate.sitesPublishRequired) {
    failures.push(
      "sitesPublishRequired must remain false for the live-source reconciliation candidate",
    );
  }
  if (candidate.sitesPublished) {
    failures.push(
      "sitesPublished must remain false because this candidate did not publish Sites v36",
    );
  }
  if (!candidate.candidateSourceMatchesLiveSites) {
    failures.push(
      "candidateSourceMatchesLiveSites must retain verified live-source equality",
    );
  }
  if (!candidate.candidateMigrationsMatchLiveLedger) {
    failures.push(
      "candidateMigrationsMatchLiveLedger must retain verified ledger equality",
    );
  }
  if (candidate.githubMainMatchesCandidate) {
    failures.push("githubMainMatchesCandidate must remain false before merge");
  }
  if (candidate.fullReleaseGatePassed) {
    failures.push(
      "fullReleaseGatePassed must remain false before merge and all workflow evidence",
    );
  }
  if (
    manifest.source.evidenceScope !== RECONCILIATION_SOURCE_EVIDENCE_SCOPE ||
    manifest.source.root !== "artifacts/veroxa-sites"
  ) {
    failures.push(
      "source must remain scoped to the live Sites v36 reconciliation candidate",
    );
  }
  if (
    manifest.migrations.evidenceScope !==
      RECONCILIATION_MIGRATION_EVIDENCE_SCOPE ||
    manifest.migrations.root !== "supabase/migrations"
  ) {
    failures.push(
      "migrations must remain scoped to the live-ledger reconciliation candidate",
    );
  }
  if (
    manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM
  ) {
    failures.push(
      "candidate trees must use the canonical deterministic hash algorithm",
    );
  }
  if (
    JSON.stringify(manifest.source.generatedPathExclusions) !==
    JSON.stringify(GENERATED_PATH_EXCLUSIONS)
  ) {
    failures.push(
      "generatedPathExclusions must remain the reviewed generated-output allowlist",
    );
  }
  if (
    !lastParity.supersededAsLiveBaseline ||
    lastParity.sitesVersion !== 22 ||
    !lastParity.sitesSourceParityVerified ||
    !lastParity.migrationContentParityVerified ||
    !lastParity.migrationFilenameParityVerified
  ) {
    failures.push(
      "lastGitHubParityRelease must preserve the superseded verified Sites v22 baseline",
    );
  }
  if (
    !manifest.historicalProductionObservations.some(
      (entry) => entry.sitesVersion === 18,
    )
  ) {
    failures.push(
      "historicalProductionObservations must preserve the Sites v18 observation",
    );
  }
  if (
    live.sitesVersion !== 36 ||
    live.productionMigrationCount !== 37 ||
    live.githubMainMatchesCandidate ||
    !live.candidateSourceMatchesLiveSites ||
    !live.databaseLedgerObserved ||
    !live.databaseAppliedThroughLatestObserved ||
    !live.candidateMigrationsMatchLiveLedger ||
    live.fullReleaseGatePassed
  ) {
    failures.push(
      "currentProductionObservation must preserve verified Sites v36 and 37-migration live evidence",
    );
  }
  if (
    live.sourceFileCount !== manifest.source.fileCount ||
    live.sourceTreeSha256 !== manifest.source.treeSha256 ||
    live.productionMigrationCount !== manifest.migrations.fileCount ||
    live.migrationTreeSha256 !== manifest.migrations.treeSha256 ||
    live.latestProductionMigration !== candidate.latestCandidateMigration ||
    live.latestProductionMigrationSha256 !==
      candidate.latestCandidateMigrationSha256 ||
    candidate.sourceFileCount !== manifest.source.fileCount ||
    candidate.sourceTreeSha256 !== manifest.source.treeSha256 ||
    candidate.migrationFileCount !== manifest.migrations.fileCount ||
    candidate.migrationTreeSha256 !== manifest.migrations.treeSha256
  ) {
    failures.push(
      "candidate fingerprints must equal the separately observed live source and migration evidence",
    );
  }
  if (
    manifest.releaseState === REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE &&
    candidate.reviewedLocally
  ) {
    failures.push("fingerprint refresh state cannot claim local review");
  }
  if (
    manifest.releaseState === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    !candidate.reviewedLocally
  ) {
    failures.push(
      "reviewed reconciliation state requires explicit local review evidence",
    );
  }
  if (failures.length) {
    throw new Error(`Unsafe deployment manifest state: ${failures.join("; ")}`);
  }
}

export function assertReviewedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  assertUnreleasedLocalCandidateManifest(manifest);
  if (
    manifest.releaseState !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
    manifest.releaseCandidate.status !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
    !manifest.releaseCandidate.reviewedLocally
  ) {
    throw new Error(
      "Deployment attestation requires the explicitly reviewed local candidate state",
    );
  }
}

function sameWorkflowEvidence(
  actual: GitHubReconciliationEvidence["preMergeWorkflows"],
  expected: GitHubReconciliationEvidence["preMergeWorkflows"],
): boolean {
  const actualRecord = actual as Partial<
    Record<(typeof WORKFLOW_EVIDENCE_KEYS)[number], WorkflowEvidence>
  >;
  if (
    JSON.stringify(Object.keys(actual).sort()) !==
    JSON.stringify([...WORKFLOW_EVIDENCE_KEYS].sort())
  ) {
    return false;
  }
  return WORKFLOW_EVIDENCE_KEYS.every(
    (key) =>
      actualRecord[key]?.runId === expected[key].runId &&
      actualRecord[key]?.status === expected[key].status,
  );
}

export function assertVerifiedGitHubParityManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const evidence = manifest.githubReconciliationEvidence;
  const lastParity = manifest.lastGitHubParityRelease;
  if (manifest.schemaVersion !== 4) failures.push("schemaVersion must be 4");
  if (manifest.recordKind !== "veroxa_production_reconciliation_manifest") {
    failures.push(
      "recordKind must identify the production reconciliation manifest",
    );
  }
  if (
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.sitesProjectId !== "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) {
    failures.push(
      "terminal parity evidence must retain the canonical repository, branch, and Sites project",
    );
  }
  if (manifest.releaseState !== VERIFIED_GITHUB_PARITY_RELEASE_STATE) {
    failures.push("releaseState must identify verified v36 GitHub parity");
  }
  if (candidate.status !== VERIFIED_GITHUB_PARITY_STATUS) {
    failures.push(
      "releaseCandidate.status must identify the merged parity reconciliation",
    );
  }
  if (
    candidate.actionScope !== RECONCILIATION_CANDIDATE_ACTION_SCOPE ||
    candidate.basedOnGitHubMainCommit !==
      "302621bf6b9ab78320abe4175b45b56e9e64ae2a" ||
    candidate.pullRequest !== V36_GITHUB_RECONCILIATION.pullRequest ||
    !candidate.githubMerged ||
    candidate.futureMergedGitHubCommit !==
      V36_GITHUB_RECONCILIATION.mergedCommit ||
    candidate.futureSitesVersion !== null ||
    !candidate.reviewedLocally ||
    !candidate.candidateSourceMatchesLiveSites ||
    !candidate.candidateMigrationsMatchLiveLedger ||
    !candidate.githubMainMatchesCandidate ||
    !candidate.fullReleaseGatePassed
  ) {
    failures.push(
      "releaseCandidate must preserve the exact reviewed PR #157 merge and verified parity evidence",
    );
  }
  if (
    candidate.databaseChangesRequired ||
    candidate.databaseMigrationApplied ||
    candidate.sitesPublishRequired ||
    candidate.sitesPublished
  ) {
    failures.push(
      "PR #157 reconciliation must not claim a Sites publication or database apply",
    );
  }
  if (
    live.evidenceStatus !== VERIFIED_PRODUCTION_EVIDENCE_STATUS ||
    live.observedAt !== V36_LIVE_PARITY_EVIDENCE.observedAt ||
    live.canonicalGitHubMainCommit !== V36_GITHUB_RECONCILIATION.mergedCommit ||
    live.canonicalGitHubMainCommitScope !== V36_OPERATIONAL_COMMIT_SCOPE ||
    !live.githubMainMatchesCandidate ||
    live.sitesVersion !== V36_LIVE_PARITY_EVIDENCE.sitesVersion ||
    live.sitesCheckoutCommit !== V36_LIVE_PARITY_EVIDENCE.sitesCheckoutCommit ||
    !live.candidateSourceMatchesLiveSites ||
    live.productionMigrationCount !==
      V36_LIVE_PARITY_EVIDENCE.migrationFileCount ||
    !live.databaseLedgerObserved ||
    !live.databaseAppliedThroughLatestObserved ||
    !live.candidateMigrationsMatchLiveLedger ||
    !live.fullReleaseGatePassed
  ) {
    failures.push(
      "currentProductionObservation must preserve live v36 while proving GitHub main parity",
    );
  }
  if (
    !evidence ||
    evidence.pullRequest !== V36_GITHUB_RECONCILIATION.pullRequest ||
    evidence.reviewedHead !== V36_GITHUB_RECONCILIATION.reviewedHead ||
    evidence.mergedCommit !== V36_GITHUB_RECONCILIATION.mergedCommit ||
    !evidence.zeroUnresolvedReviewThreads ||
    !sameWorkflowEvidence(
      evidence.preMergeWorkflows,
      V36_GITHUB_RECONCILIATION.preMergeWorkflows,
    ) ||
    !sameWorkflowEvidence(
      evidence.postMergePushWorkflows,
      V36_GITHUB_RECONCILIATION.postMergePushWorkflows,
    )
  ) {
    failures.push(
      "GitHub reconciliation evidence must retain the exact reviewed head, merge, workflows, and zero-thread result",
    );
  }
  if (
    manifest.source.evidenceScope !== VERIFIED_SOURCE_EVIDENCE_SCOPE ||
    manifest.source.root !== "artifacts/veroxa-sites" ||
    manifest.source.mappingTarget !== "Sites repository root" ||
    manifest.migrations.evidenceScope !== VERIFIED_MIGRATION_EVIDENCE_SCOPE ||
    manifest.migrations.root !== "supabase/migrations" ||
    manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM
  ) {
    failures.push(
      "terminal parity evidence must retain the canonical source and migration roots and hash algorithm",
    );
  }
  if (
    manifest.source.fileCount !== V36_LIVE_PARITY_EVIDENCE.sourceFileCount ||
    manifest.source.treeSha256 !== V36_LIVE_PARITY_EVIDENCE.sourceTreeSha256 ||
    manifest.migrations.fileCount !==
      V36_LIVE_PARITY_EVIDENCE.migrationFileCount ||
    manifest.migrations.treeSha256 !==
      V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 ||
    candidate.latestCandidateMigration !==
      V36_LIVE_PARITY_EVIDENCE.latestMigration ||
    candidate.latestCandidateMigrationSha256 !==
      V36_LIVE_PARITY_EVIDENCE.latestMigrationSha256 ||
    JSON.stringify(manifest.source.generatedPathExclusions) !==
      JSON.stringify(GENERATED_PATH_EXCLUSIONS)
  ) {
    failures.push(
      "terminal parity evidence must retain the exact live v36 trees, latest migration, and generated-path exclusions",
    );
  }
  if (
    live.sourceFileCount !== manifest.source.fileCount ||
    live.sourceTreeSha256 !== manifest.source.treeSha256 ||
    live.productionMigrationCount !== manifest.migrations.fileCount ||
    live.migrationTreeSha256 !== manifest.migrations.treeSha256 ||
    candidate.sourceFileCount !== manifest.source.fileCount ||
    candidate.sourceTreeSha256 !== manifest.source.treeSha256 ||
    candidate.migrationFileCount !== manifest.migrations.fileCount ||
    candidate.migrationTreeSha256 !== manifest.migrations.treeSha256 ||
    live.latestProductionMigration !== candidate.latestCandidateMigration ||
    live.latestProductionMigrationSha256 !==
      candidate.latestCandidateMigrationSha256
  ) {
    failures.push(
      "terminal candidate, GitHub main, and live production fingerprints must remain identical",
    );
  }
  if (
    manifest.deploymentFreeze.state !== VERIFIED_DEPLOYMENT_FREEZE_STATE ||
    manifest.deploymentFreeze.automaticDeploymentsAllowed ||
    manifest.deploymentFreeze.allowedDeployment !==
      VERIFIED_DEPLOYMENT_ALLOWED_ACTION ||
    manifest.deploymentFreeze.releaseCondition !== VERIFIED_RELEASE_CONDITION
  ) {
    failures.push(
      "verified GitHub parity must preserve the production deployment freeze",
    );
  }
  if (
    JSON.stringify(Object.keys(manifest.activationState).sort()) !==
      JSON.stringify([...ACTIVATION_STATE_KEYS].sort()) ||
    ACTIVATION_STATE_KEYS.some((key) => manifest.activationState[key] !== false)
  ) {
    failures.push(
      "verified GitHub parity must retain the exact all-false activation and external-action state",
    );
  }
  if (
    !lastParity.supersededAsLiveBaseline ||
    lastParity.pullRequest !== 155 ||
    lastParity.sitesVersion !== 22 ||
    !lastParity.sitesSourceParityVerified ||
    !lastParity.migrationContentParityVerified ||
    !lastParity.migrationFilenameParityVerified
  ) {
    failures.push(
      "lastGitHubParityRelease must preserve PR #155 / Sites v22 as historical parity evidence",
    );
  }
  if (failures.length) {
    throw new Error(
      `Unsafe verified GitHub parity manifest state: ${failures.join("; ")}`,
    );
  }
}

export function assertPublishedSitesFollowupManifest(
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Schema 4 does not permit a published-candidate assertion: Sites v36 and its migrations predate this unmerged GitHub reconciliation candidate",
  );
}

export function assertDeploymentAttestationManifest(
  manifest: DeploymentManifest,
): void {
  if (manifest.releaseState === VERIFIED_GITHUB_PARITY_RELEASE_STATE) {
    assertVerifiedGitHubParityManifest(manifest);
    return;
  }
  assertReviewedLocalCandidateManifest(manifest);
}

function normalized(relativePath: string): string {
  return relativePath.split(sep).join("/");
}

function isExcluded(relativePath: string, exclusions: string[]): boolean {
  return exclusions.some(
    (entry) => relativePath === entry || relativePath.startsWith(`${entry}/`),
  );
}

function collectFiles(
  directory: string,
  exclusions: string[],
  current = "",
): string[] {
  const absolute = resolve(directory, current);
  const entries = readdirSync(absolute, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = normalized(join(current, entry.name));
    if (isExcluded(relativePath, exclusions)) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Release tree cannot contain a symbolic link: ${relativePath}`,
      );
    }
    if (entry.isDirectory()) {
      files.push(...collectFiles(directory, exclusions, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unsupported release-tree entry: ${relativePath}`);
    }
  }
  return files;
}

export function hashTree(
  directory: string,
  options: { exclusions?: string[]; suffix?: string } = {},
): { fileCount: number; files: string[]; sha256: string } {
  const exclusions = options.exclusions ?? [];
  const files = collectFiles(directory, exclusions)
    .filter((file) => !options.suffix || file.endsWith(options.suffix))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file, "utf8");
    hash.update("\0");
    hash.update(readFileSync(resolve(directory, file)));
    hash.update("\0");
  }
  return { fileCount: files.length, files, sha256: hash.digest("hex") };
}

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function readDeploymentManifest(): DeploymentManifest {
  return JSON.parse(
    readFileSync(deploymentManifestPath, "utf8"),
  ) as DeploymentManifest;
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function repositoryRelative(path: string): string {
  return normalized(relative(repoRoot, path));
}

export function ensureParentPath(path: string): string {
  return dirname(path);
}
