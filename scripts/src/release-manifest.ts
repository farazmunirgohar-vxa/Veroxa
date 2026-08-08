import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const deploymentManifestPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);

export const TREE_HASH_ALGORITHM = "veroxa-path-null-content-null-sha256-v1";
export const REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE =
  "staged_rollout_database_repair_verified_sites_v38_pending";
export const REVIEWED_LOCAL_CANDIDATE_STATUS =
  "staged_rollout_paused_for_corrective_sites_publish";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "local_predeployment_fingerprints_refreshed_review_required";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "local_predeployment_review_required";
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
  "momo_client_v3_corrective_sites_v38_candidate";
export const LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE =
  "exact_local_corrective_sites_v38_source";
export const LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE =
  "exact_local_live43_repair_migration_tree";
// Compatibility aliases for historical recorder code; schema 6 validates the
// local-candidate names above.
export const RECONCILIATION_SOURCE_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE;
export const RECONCILIATION_MIGRATION_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE;
export const LOCAL_CANDIDATE_DEPLOYMENT_FREEZE_STATE =
  "staged_rollout_corrective_sites_publish_required";
export const LOCAL_CANDIDATE_REVISION =
  "client_v3_corrected_sites_v38_2026_08_08";
export const POLICY_EVALUATION_EVIDENCE_PATH =
  "artifacts/veroxa/docs/MOMO_PRIVATE_POLICY_EVAL_2026-08-08.json";
export const POLICY_EVALUATION_EVIDENCE_SHA256 =
  "f3b254d6822bbe65c2149e4fbb7e4ee68601ab4ead34fae242590e9c560ed549";
export const LIVE_PRODUCTION_EVIDENCE_STATUS =
  "sites_v37_live_database43_repair_verified";
export const LIVE_MIGRATION_EVIDENCE_SCOPE =
  "observed_remote_ledger_exact_names_and_bytes";
export const HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE =
  "historical_v36_repository_and_sites_mirror_not_remote_ledger";
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
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
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
  sitesObservedAt: "2026-08-02",
  migrationLedgerObservedAt: "2026-08-08",
  observedAt: "2026-08-08",
  sitesVersion: 36,
  sitesCheckoutCommit: "b8122642b72e5d4e6e74c379469f2a157781ab3d",
  sourceFileCount: 185,
  sourceTreeSha256:
    "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7",
  migrationFileCount: 37,
  migrationTreeSha256:
    "d306d26cb633ef943afdb7efd01a3cde70249a096ef783d1b0d51eb5d4a1a429",
  historicalRepositoryMigrationTreeSha256:
    "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  latestMigration: "20260802063829_momo_pipeline_query_indexes_v2.sql",
  latestMigrationSha256:
    "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd",
} as const;

export const CURRENT_PARTIAL_ROLLOUT_EVIDENCE = {
  observedAt: "2026-08-08",
  sitesObservedAt: "2026-08-08",
  migrationLedgerObservedAt: "2026-08-08",
  canonicalGitHubMainCommit:
    "ca47aeff7ab44a69b6ce039608ae27fea6c3c326",
  canonicalGitHubMainMergePullRequest: 162,
  canonicalGitHubMainCommitScope:
    "pr162_merged_main_lineage_sites_v37_database_repair_verified",
  sitesVersion: 37,
  sitesCheckoutCommit: "61e9ace7723ef56f42111f320327187596406944",
  sourceFileCount: 200,
  sourceTreeSha256:
    "929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18",
  sourceEvidenceScope: "observed_live_sites_v37_exact_source",
  migrationFileCount: 43,
  migrationTreeSha256:
    "8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c",
  latestMigration: "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql",
  latestMigrationSha256:
    "6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba",
} as const;

export const LOCAL_CANDIDATE_BASE_COMMIT =
  "ca47aeff7ab44a69b6ce039608ae27fea6c3c326";
export const LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS = [
  "20260808001210_audit_intake_envelope_v2.sql",
  "20260808001430_momo_client_pipeline_readback_v3.sql",
  "20260808001842_retire_audit_intake_v1.sql",
  "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
  "20260808002609_future_object_default_acl_hardening.sql",
  "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql",
] as const;
export const LOCAL_CANDIDATE_APPLIED_MIGRATIONS = [
  "20260808001210_audit_intake_envelope_v2.sql",
  "20260808001430_momo_client_pipeline_readback_v3.sql",
  "20260808001842_retire_audit_intake_v1.sql",
  "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
  "20260808002609_future_object_default_acl_hardening.sql",
  "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql",
] as const;
export const LOCAL_CANDIDATE_PENDING_MIGRATIONS = [] as const;

export const VERIFIED_DEPLOYMENT_ALLOWED_ACTION =
  "Historical only: PR #157 reconciled GitHub main to the already-live Sites v36 baseline without publishing Sites or applying a database migration.";
export const VERIFIED_RELEASE_CONDITION =
  "Historical v36 parity does not authorize the current candidate. Any candidate deployment requires a new reviewed release and the encoded rollout sequence.";

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
  "historical_published_state_not_valid_for_schema_6";
export const PUBLISHED_SITES_FOLLOWUP_STATUS =
  "historical_published_status_not_valid_for_schema_6";

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
  sitesBaselineObservedAt?: string;
  migrationLedgerObservedAt?: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  canonicalGitHubMainMergePullRequest?: number;
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
  githubParityVerifiedAtObservation?: boolean;
  sourceEvidenceScope?: string;
  migrationTreeEvidenceScope?: string;
  historicalRepositoryMigrationTreeSha256?: string;
  historicalRepositoryMigrationTreeEvidenceScope?: string;
};

export type DeploymentManifest = {
  schemaVersion: number;
  recordKind: string;
  releaseState: string;
  reviewedAt?: string;
  candidateRevision?: string;
  knownResiduals?: string[];
  canonicalRepository: string;
  canonicalBranch: string;
  candidateBranch?: string;
  sitesProjectId: string;
  lastGitHubParityRelease: GitHubParityRelease;
  historicalProductionObservations: HistoricalProductionObservation[];
  currentProductionObservation: CurrentProductionObservation;
  githubReconciliationEvidence?: GitHubReconciliationEvidence;
  historicalV36GitHubReconciliationEvidence?: GitHubReconciliationEvidence;
  policyEvaluationEvidence?: {
    path: string;
    sha256: string;
    model: string;
    logicalCases: number;
    totalModelRequests: number;
    finalLiveCasesPassed: number;
    finalLiveCasesTotal: number;
    finalCombinedChecksPassed: number;
    finalCombinedChecksTotal: number;
    cumulativeCostUpperBoundUsd: number;
    authorizedCeilingUsd: number;
    privateOnly: boolean;
    responseStorage: boolean;
    toolsEnabled: boolean;
    externalWritesAllowed: boolean;
    allAttemptSettingsIndependentlyHashBound: boolean;
    crossProcessCostLedgerEnforced: boolean;
    completedAggregateBelowAuthorizedCeiling: boolean;
  };
  releaseCandidate: {
    status: string;
    actionScope: typeof RECONCILIATION_CANDIDATE_ACTION_SCOPE;
    basedOnGitHubMainCommit: string;
    pullRequest: Nullable<number>;
    githubMerged: boolean;
    futureMergedGitHubCommit: Nullable<string>;
    futureSitesVersion: Nullable<number>;
    reviewedLocally: boolean;
    allFourWorkflowsGreen?: boolean | null;
    zeroUnresolvedReviewThreads?: boolean | null;
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
    pendingMigrations?: string[];
    databaseMigrationsApplied?: string[];
    databaseApplyAuthorized?: boolean;
    sitesPublishAuthorized?: boolean;
    deploymentAuthorized?: boolean;
    activationExecuted?: boolean;
    rolloutStatus?: string;
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
    mirrorRoot?: string;
    mirrorFileCount?: number;
    mirrorTreeSha256?: string;
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    databaseApplyAuthorized?: boolean;
    sitesPublishAuthorized?: boolean;
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
  rolloutSequence?: {
    status: string;
    steps: Array<{
      order: number;
      stage: string;
      id: string;
      action: string;
      migration: string | null;
      requiresCompletedStep: string | null;
      explicitReviewRequired: boolean;
      completed: boolean;
      verification: string;
    }>;
  };
};

function rolloutIsFailClosed(
  steps: NonNullable<DeploymentManifest["rolloutSequence"]>["steps"],
): boolean {
  const expected = [
    [1, "stage_1_pre_publish", "apply_audit_intake_v2", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[0], null, true],
    [2, "stage_1_pre_publish", "apply_client_pipeline_readback_v3", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[1], "apply_audit_intake_v2", true],
    [3, "sites_v37_publish_verify", "publish_and_verify_audit_v2_and_client_v3_routes", "sites_publish_and_verify", null, "apply_client_pipeline_readback_v3", true],
    [4, "stage_2_partial_post_publish", "retire_audit_intake_v1", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[2], "publish_and_verify_audit_v2_and_client_v3_routes", true],
    [5, "stage_2_post_publish", "retire_client_pipeline_readback_v2", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[3], "retire_audit_intake_v1", true],
    [6, "stage_2_post_publish", "review_and_apply_future_default_acl_hardening", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[4], "retire_client_pipeline_readback_v2", true],
    [7, "corrective_database_repair", "repair_client_pipeline_displayed_rights_scope", "database_migration", LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[5], "review_and_apply_future_default_acl_hardening", true],
    [8, "corrective_sites_v38_publish_verify", "republish_and_verify_repaired_client_v3", "sites_publish_and_verify", null, "repair_client_pipeline_displayed_rights_scope", false],
  ] as const;
  return steps.length === expected.length && steps.every((step, index) => {
    const wanted = expected[index];
    return step.order === wanted[0] && step.stage === wanted[1] &&
      step.id === wanted[2] && step.action === wanted[3] &&
      step.migration === wanted[4] && step.requiresCompletedStep === wanted[5] &&
      step.explicitReviewRequired && step.completed === wanted[6] &&
      step.verification.trim().length >= 20;
  });
}

function assertSchema7ForwardRepairCandidate(manifest: DeploymentManifest): void {
  const failures: string[] = [];
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const policy = manifest.policyEvaluationEvidence;
  const policyPath = resolve(repoRoot, POLICY_EVALUATION_EVIDENCE_PATH);

  if (manifest.recordKind !== "veroxa_staged_rollout_forward_repair_manifest") {
    failures.push("recordKind must identify the staged forward-repair candidate");
  }
  if (manifest.releaseState !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
    candidate.status !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
    !candidate.reviewedLocally || manifest.reviewedAt !== "2026-08-08") {
    failures.push("release and candidate must identify the reviewed live-database/corrective-Sites state");
  }
  if (manifest.candidateRevision !== LOCAL_CANDIDATE_REVISION) {
    failures.push("candidate revision must identify the corrected Client v3 Sites v38 candidate");
  }
  if (manifest.knownResiduals?.length !== 1 ||
    !/postgres is not a member of supabase_admin[\s\S]*02609[\s\S]*skips supabase_admin[\s\S]*not comprehensive default-ACL closure/iu.test(
      manifest.knownResiduals[0] ?? "",
    )) {
    failures.push("known default-ACL residual is missing or overclaimed");
  }
  if (manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.candidateBranch !== "agent/momo-client-v3-forward-scope-repair" ||
    manifest.sitesProjectId !== "appgprj_6a53d07c7c28819182801cf35dfd30de") {
    failures.push("repository, branch, or Sites project identity drifted");
  }
  if (manifest.githubReconciliationEvidence !== undefined) {
    failures.push("current candidate cannot claim GitHub reconciliation evidence");
  }
  if (!policy || policy.path !== POLICY_EVALUATION_EVIDENCE_PATH ||
    policy.sha256 !== POLICY_EVALUATION_EVIDENCE_SHA256 ||
    policy.model !== "gpt-5.6-luna" || policy.logicalCases !== 10 ||
    policy.totalModelRequests !== 30 || policy.finalLiveCasesPassed !== 10 ||
    policy.finalLiveCasesTotal !== 10 || policy.finalCombinedChecksPassed !== 27 ||
    policy.finalCombinedChecksTotal !== 27 ||
    policy.cumulativeCostUpperBoundUsd !== 0.0080502 ||
    policy.authorizedCeilingUsd !== 2 || !policy.privateOnly ||
    policy.responseStorage || policy.toolsEnabled || policy.externalWritesAllowed ||
    policy.allAttemptSettingsIndependentlyHashBound ||
    policy.crossProcessCostLedgerEnforced ||
    !policy.completedAggregateBelowAuthorizedCeiling ||
    !existsSync(policyPath) || sha256File(policyPath) !== POLICY_EVALUATION_EVIDENCE_SHA256) {
    failures.push("private policy-evaluation evidence is missing, stale, or unsafe");
  }
  if (JSON.stringify(manifest.historicalV36GitHubReconciliationEvidence) !==
    JSON.stringify(V36_GITHUB_RECONCILIATION)) {
    failures.push("historical PR #157 evidence changed");
  }
  if (live.evidenceStatus !== LIVE_PRODUCTION_EVIDENCE_STATUS ||
    live.observedAt !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.observedAt ||
    live.sitesBaselineObservedAt !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesObservedAt ||
    live.migrationLedgerObservedAt !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationLedgerObservedAt ||
    live.canonicalGitHubMainCommit !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.canonicalGitHubMainCommit ||
    live.canonicalGitHubMainMergePullRequest !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.canonicalGitHubMainMergePullRequest ||
    live.canonicalGitHubMainCommitScope !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.canonicalGitHubMainCommitScope ||
    live.githubParityVerifiedAtObservation ||
    live.sitesVersion !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesVersion ||
    live.sitesCheckoutCommit !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesCheckoutCommit ||
    live.sourceFileCount !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceFileCount ||
    live.sourceTreeSha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceTreeSha256 ||
    live.sourceEvidenceScope !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceEvidenceScope ||
    live.productionMigrationCount !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount ||
    live.migrationTreeSha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 ||
    live.migrationTreeEvidenceScope !== LIVE_MIGRATION_EVIDENCE_SCOPE ||
    live.historicalRepositoryMigrationTreeSha256 !== V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 ||
    live.historicalRepositoryMigrationTreeEvidenceScope !== HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE ||
    live.latestProductionMigration !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration ||
    live.latestProductionMigrationSha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256 ||
    !live.databaseLedgerObserved || !live.databaseAppliedThroughLatestObserved ||
    live.githubMainMatchesCandidate || live.candidateSourceMatchesLiveSites ||
    !live.candidateMigrationsMatchLiveLedger || live.fullReleaseGatePassed) {
    failures.push("current Sites v37 / exact remote 43-migration repair-verified rollout drifted");
  }
  if (candidate.actionScope !== RECONCILIATION_CANDIDATE_ACTION_SCOPE ||
    candidate.basedOnGitHubMainCommit !== LOCAL_CANDIDATE_BASE_COMMIT ||
    candidate.pullRequest !== 163 || candidate.githubMerged ||
    candidate.futureMergedGitHubCommit !== null || candidate.futureSitesVersion !== null ||
    candidate.allFourWorkflowsGreen !== null || candidate.zeroUnresolvedReviewThreads !== null ||
    candidate.githubMainMatchesCandidate || candidate.candidateSourceMatchesLiveSites ||
    !candidate.candidateMigrationsMatchLiveLedger || candidate.fullReleaseGatePassed ||
    candidate.databaseChangesRequired || !candidate.databaseMigrationApplied ||
    JSON.stringify(candidate.databaseMigrationsApplied) !==
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) ||
    !candidate.databaseApplyAuthorized || !candidate.sitesPublishRequired ||
    candidate.sitesPublished || !candidate.sitesPublishAuthorized ||
    !candidate.deploymentAuthorized || candidate.activationExecuted ||
    candidate.rolloutStatus !== "staged_rollout_paused_for_corrective_sites_publish" ||
    candidate.migrationFileCount !== 43 ||
    JSON.stringify(candidate.pendingMigrations) !== JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS)) {
    failures.push("candidate state does not match the verified database repair and pending corrective Sites publish");
  }
  if (manifest.source.evidenceScope !== LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE ||
    manifest.source.root !== "artifacts/veroxa-sites" ||
    manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    JSON.stringify(manifest.source.generatedPathExclusions) !== JSON.stringify(GENERATED_PATH_EXCLUSIONS) ||
    manifest.source.fileCount !== candidate.sourceFileCount ||
    manifest.source.treeSha256 !== candidate.sourceTreeSha256) {
    failures.push("candidate source fingerprint evidence is incoherent");
  }
  if (manifest.migrations.evidenceScope !== LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE ||
    manifest.migrations.root !== "supabase/migrations" ||
    manifest.migrations.mirrorRoot !== "artifacts/veroxa-sites/supabase/migrations" ||
    manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    manifest.migrations.fileCount !== candidate.migrationFileCount ||
    manifest.migrations.treeSha256 !== candidate.migrationTreeSha256 ||
    manifest.migrations.mirrorFileCount !== candidate.migrationFileCount ||
    manifest.migrations.mirrorTreeSha256 !== candidate.migrationTreeSha256) {
    failures.push("candidate migration root and Sites mirror evidence is incoherent");
  }
  const rollout = manifest.rolloutSequence;
  if (!rollout || rollout.status !== "staged_rollout_paused_for_corrective_sites_publish" ||
    !rolloutIsFailClosed(rollout.steps)) {
    failures.push("candidate rollout sequence is incomplete, reordered, or overclaimed");
  }
  if (manifest.deploymentFreeze.state !== LOCAL_CANDIDATE_DEPLOYMENT_FREEZE_STATE ||
    manifest.deploymentFreeze.automaticDeploymentsAllowed ||
    !manifest.deploymentFreeze.databaseApplyAuthorized ||
    !manifest.deploymentFreeze.sitesPublishAuthorized ||
    !/(?:verified[\s\S]*041629|041629[\s\S]*(?:complete|applied|verified))[\s\S]*(?:Sites|publish)/iu.test(
      manifest.deploymentFreeze.releaseCondition,
    )) {
    failures.push("deployment freeze does not preserve the required staged rollout");
  }
  if (JSON.stringify(Object.keys(manifest.activationState).sort()) !==
    JSON.stringify([...ACTIVATION_STATE_KEYS].sort()) ||
    ACTIVATION_STATE_KEYS.some((key) => manifest.activationState[key] !== false)) {
    failures.push("activation and external-action state must remain exactly all-false");
  }
  if (!/production|hosted/iu.test(manifest.activationStateScope) ||
    !/local eval-only credential/iu.test(manifest.activationStateScope)) {
    failures.push("activation scope must distinguish hosted production credentials from local eval-only credentials");
  }
  if (failures.length) {
    throw new Error(`Unsafe local candidate manifest: ${failures.join("; ")}`);
  }
}

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  if (manifest.schemaVersion === 7) {
    assertSchema7ForwardRepairCandidate(manifest);
    return;
  }
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
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Schema 7 records a staged forward-repair candidate; terminal parity requires fresh PR, workflow, database, and Sites evidence",
  );
}

export function assertPublishedSitesFollowupManifest(
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Schema 7 records only the partial Sites v37 rollout; the Client v3 repair and corrected Sites publication remain unobserved",
  );
}

export function assertDeploymentAttestationManifest(
  manifest: DeploymentManifest,
): void {
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
