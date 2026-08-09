import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const deploymentManifestPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);

export const TREE_HASH_ALGORITHM = "veroxa-path-null-content-null-sha256-v1";
export const REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE =
  "live47_registered_mutable_rpc_hold_active_candidate48_review_pending";
export const REVIEWED_LOCAL_CANDIDATE_STATUS =
  "held_team_private_food_reconciliation_locally_reviewed_remote_gates_pending";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "integrated_candidate_fingerprints_refreshed_review_required";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "integrated_candidate_review_required";
export const RECONCILIATION_CANDIDATE_ACTION_SCOPE =
  "team_private_assessment_only_and_strict_food_contract_preserving_live47_ready_authority";
export const LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE =
  "exact_local_live47_plus_held_candidate48_source_pre_generated_version";
export const LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE =
  "exact_local_candidate48_with_exact_live47_prefix_and_one_provisional_migration";
export const RECONCILIATION_SOURCE_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE;
export const RECONCILIATION_MIGRATION_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE;
export const LOCAL_CANDIDATE_DEPLOYMENT_FREEZE_STATE =
  "registered_mutable_rpc_ingress_and_decision_hold_active_verified";
export const LOCAL_CANDIDATE_REVISION =
  "live47_held_team_private_food_candidate_2026_08_09";
export const LOCAL_CANDIDATE_BASE_COMMIT =
  "39bf713705685636f0d20a2ca068c738d4f414b4";
export const LIVE_PRODUCTION_EVIDENCE_STATUS =
  "sites_v39_live_database47_edge_v6_candidate48_pending_under_hold";
export const LIVE_MIGRATION_EVIDENCE_SCOPE =
  "observed_remote_ledger_exact_names_and_bytes";
export const HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE =
  "historical_v36_repository_and_sites_mirror_not_remote_ledger";
export const POLICY_EVALUATION_EVIDENCE_PATH =
  "artifacts/veroxa/docs/MOMO_PRIVATE_POLICY_EVAL_2026-08-08.json";
export const POLICY_EVALUATION_EVIDENCE_SHA256 =
  "f3b254d6822bbe65c2149e4fbb7e4ee68601ab4ead34fae242590e9c560ed549";

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

export const HISTORICAL_V37_LIVE43_EVIDENCE = {
  observedAt: "2026-08-08",
  sitesObservedAt: "2026-08-08",
  migrationLedgerObservedAt: "2026-08-08",
  canonicalGitHubMainCommit: "ca47aeff7ab44a69b6ce039608ae27fea6c3c326",
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
  latestMigration:
    "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql",
  latestMigrationSha256:
    "6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba",
} as const;

export const CURRENT_PARTIAL_ROLLOUT_EVIDENCE = {
  observedAt: "2026-08-09",
  sitesObservedAt: "2026-08-08",
  migrationLedgerObservedAt: "2026-08-09",
  canonicalGitHubMainCommit: LOCAL_CANDIDATE_BASE_COMMIT,
  canonicalGitHubMainMergePullRequest: 166,
  canonicalGitHubMainCommitScope:
    "github_main_lineage_only_not_sites_v39_source_association",
  sitesVersion: 39,
  sitesVersionId:
    "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8",
  sitesCheckoutCommit: "8749a7d442d3bb068ce626a9d297b8b227493446",
  sitesArchiveFileCount: 54,
  sitesArchiveSha256:
    "c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5",
  sitesDeploymentEnvironmentRevision: 10,
  sitesEnvironmentRevision: 11,
  sitesLiveUrl: "https://veroxasystems.com",
  sitesCustomDomainsVerified: true,
  sitesRecentErrorsObserved: 0,
  sourceFileCount: 54,
  sourceTreeSha256:
    "c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5",
  sourceEvidenceScope: "observed_live_sites_v39_exact_archive",
  migrationFileCount: 47,
  migrationTreeSha256:
    "87c0ecd4272949d89e7512940f91f9d9e3c6e92154616377c78ef9e3d06bfc5e",
  latestMigration:
    "20260808083842_post_20260808070840_private_media_authority_repair_v1.sql",
  latestMigrationByteLength: 110_797,
  latestMigrationSha256:
    "3d2ba3a86024edef024a12ff9556c4e236baa57cbf2d4d478f9514321d69abee",
} as const;

export const LIVE47_MIGRATION_EVIDENCE = {
  filename: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration,
  byteLength: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationByteLength,
  sha256: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256,
  fileCount: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount,
  treeSha256: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256,
} as const;

export const LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS = [
  "20260809024500_team_private_food_assessment_reconciliation_v1.sql",
] as const;
export const LOCAL_CANDIDATE_APPLIED_MIGRATIONS = [
  "20260808001210_audit_intake_envelope_v2.sql",
  "20260808001430_momo_client_pipeline_readback_v3.sql",
  "20260808001842_retire_audit_intake_v1.sql",
  "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
  "20260808002609_future_object_default_acl_hardening.sql",
  "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql",
  "20260808064300_owner_truth_and_ready_disposition_v1.sql",
  "20260808064335_private_media_assessment_and_association_v1.sql",
  "20260808070840_momo_ready_team_decisions_and_food_tags_v2.sql",
  "20260808083842_post_20260808070840_private_media_authority_repair_v1.sql",
] as const;
export const LOCAL_CANDIDATE_PENDING_MIGRATIONS = [
  "20260809024500_team_private_food_assessment_reconciliation_v1.sql",
] as const;
export const LOCAL_CANDIDATE_SOURCE_EVIDENCE = {
  fileCount: 214,
  treeSha256:
    "fd3b8a61c0eb5781ffd80d58f6e69925fc4996474d891d3fc2915e317e17d799",
  reviewPassed: true,
} as const;

export const REPAIR_MIGRATION_EVIDENCE = {
  filename: "20260809024500_team_private_food_assessment_reconciliation_v1.sql",
  byteLength: 59_052,
  sha256: "56c64c795ad12f1dfbe05894fd3e56a87f1d0e3376ff10edfd97760b8d2fbd5c",
  candidateFileCount: 48,
  candidateTreeSha256:
    "1e6b179940063af767550e56f2df71a81bc445d8a6f4558585282a490790958c",
} as const;

export const PRIVATE_MEDIA_MIGRATION_EVIDENCE = {
  ownerTruth: {
    filename: "20260808064300_owner_truth_and_ready_disposition_v1.sql",
    byteLength: 38_818,
    sha256: "bd22855b54cfc9e1aa1713c66dae1f3fc674c43e0040dd128be40e4c354896d2",
  },
  privateAssessment: {
    filename: "20260808064335_private_media_assessment_and_association_v1.sql",
    byteLength: 148_570,
    sha256: "27ae63ccb334c7dbdf25d247c7f27ebc13ff9ea3e5391f590e93f90dcc4225c7",
  },
} as const;

export const PHASE1_APPLICATION_QUALITY_EVIDENCE = {
  observedAt: "2026-08-08",
  evidenceScope: "exact_local_private_media_candidate_quality_gate",
  cleanInstallExitCode: 0,
  buildExitCode: 0,
  testsPassed: 422,
  testsTotal: 422,
  testsFailed: 0,
  typecheckExitCode: 0,
  productionAuditExitCode: 0,
  productionAuditVulnerabilityCount: 0,
  lintExitCode: 0,
  lintErrorCount: 0,
  lintWarningCount: 7,
  warningFree: false,
} as const;
export const APPLICATION_QUALITY_EVIDENCE = {
  observedAt: "2026-08-09",
  evidenceScope: "exact_local_live47_preserving_team_private_food_candidate",
  cleanInstallExitCode: 0,
  buildExitCode: 0,
  testsPassed: 431,
  testsTotal: 431,
  testsFailed: 0,
  typecheckExitCode: 0,
  lintExitCode: 0,
  lintErrorCount: 0,
  diffCheckExitCode: 0,
  repairMigrationParserPassed: false,
  sqlFixtureParserPassed: false,
  hostedCleanChainApplyPassed: false,
  hostedFullPgTapPassed: false,
  hostedFullPgTapRerunPending: true,
  hostedDatabaseExecutionPassed: false,
  repairMigrationSha256: REPAIR_MIGRATION_EVIDENCE.sha256,
  preconnectionFixtureSha256:
    "d6d870788c1211d8209048921232e9e8b1cffa16aae1ef9a4a9516b150434b5d",
  ownerFixtureSha256:
    "60db739eeeaba5be8d70e62b6ec60cf9b6db758d1509940068ef164c7fe650b5",
  fullOperatingSystemFixtureSha256:
    "f20ac4e5927543277e520fbfd7104ded39fd11fa14995bf227fb64384dba5480",
  zeroCostFixtureSha256:
    "13e246455692d5005d688fcc68aea4805a7d64bc87c2604edf8db26599b06cbe",
} as const;

export const PRIVATE_MEDIA_EDGE_EVIDENCE = {
  observedAt: "2026-08-08",
  functionName: "momo-content-ai-lifecycle",
  functionVersion: 6,
  functionId: "859c73c3-2102-41b4-9da1-20582acb7212",
  status: "ACTIVE",
  verifyJwt: true,
  ezbrSha256:
    "acf46f086b3ab07c914d71b5ae79dca011abab84016d4c9c58ff1c9b30eb58ce",
  indexSha256:
    "867d85fe555a5f7d9d48d62698f4b1fb95d4e0769fc299020953cf5054d8720d",
  contractSha256:
    "c26af8d5aa76adf42de79538a72e3c1a3794a68cf6442fdfb5f0e45bad289a10",
  configSha256:
    "f87f1d3fcf4cdba7865bf397ebd3a57bb3ce0e0a56270729963381db623dfaef",
  unauthenticatedPostHttpStatus: 401,
  logEventCount: 1,
  logEventTimestamp: 1_786_171_783_219_000,
  recent5xxObserved: false,
  exceptionObserved: false,
  authenticatedBridgeVerified: false,
  providerCallObserved: false,
  realUploadObserved: false,
  readyDispositionObserved: false,
} as const;

export const PRIVATE_MEDIA_EDGE_CANDIDATE = {
  functionName: "momo-content-ai-lifecycle",
  promptContractVersion: "veroxa-private-media-assessment-2026-08-08-v2",
  indexSha256:
    "867d85fe555a5f7d9d48d62698f4b1fb95d4e0769fc299020953cf5054d8720d",
  contractSha256:
    "38ab001ea71f5d6299f6dea99291342a37bb5cee7ce53a392581fce2941f5a72",
  configSha256:
    "f87f1d3fcf4cdba7865bf397ebd3a57bb3ce0e0a56270729963381db623dfaef",
} as const;

export const PR164_INTEGRATION_EVIDENCE = {
  pullRequest: 164,
  baseMainCommit: "59b1604d887547e2804bdd6d63c97292385dcebb",
  openingDraftHead: "b659ec307da9455c389059b29f2d6f3ab51f095e",
  openingDraftTree: "9931d63dcb16a2e2e1cb7c592d2da63b4054cb60",
  finalHead: "0c82ea1a7e8b9d1873eb79509ccbbb722fdf595d",
  finalTree: "6a0ab3a27622834d5c7d7d19137004e982cd0682",
  mergedMainCommit: "f57a6f5a04d482353f32ccebb43ff5f225e3b8a9",
  sourceFileCount: 203,
  sourceTreeSha256:
    "357f6b336993d2c306c102d5be2699d7145a3144041eeb9753a2a43c48fe869e",
  workflows: {
    veroxaVerify: { runId: 31245308148, status: "success" },
    ci: { runId: 31245308163, status: "success" },
    sitesVerify: { runId: 31245308167, status: "success" },
    supabaseVerify: { runId: 31245308186, status: "success" },
  },
  unresolvedReviewThreadId: "PRRT_kwDOSldANc6Xc7kI",
  zeroUnresolvedReviewThreads: false,
} as const;

export const PR165_DRAFT_CHECKPOINT = {
  pullRequest: 165,
  baseMainCommit: "f57a6f5a04d482353f32ccebb43ff5f225e3b8a9",
  openingDraftHead: "9176e50436db7328401a91d64b536948ed4ef915",
  openingDraftTree: "01a79b952c6356b2cb1c54dc262541f1ad4fd198",
  evidenceScope:
    "observed_remote_pr165_opening_draft_checkpoint_not_exact_final_head",
} as const;

export const DATABASE_CONTRACT_REVIEW = {
  status: "local_repair_review_passed_hosted_execution_pending",
  forwardRepairRequired: true,
  functionalVerificationPassed: false,
  additionalDatabaseChangesRequired: true,
  hostedCleanChainApplyPassed: false,
  hostedFullPgTapPassed: false,
  hostedFullPgTapRerunPending: true,
  databaseApplyAuthorized: true,
} as const;

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
export const VERIFIED_DEPLOYMENT_ALLOWED_ACTION =
  "Historical only: PR #157 reconciled GitHub main to the already-live Sites v36 baseline without publishing Sites or applying a database migration.";
export const VERIFIED_RELEASE_CONDITION =
  "Historical v36 parity does not authorize the current candidate.";
export const PUBLISHED_SITES_RELEASE_STATE =
  "historical_published_state_not_valid_for_schema_9";
export const PUBLISHED_SITES_FOLLOWUP_STATUS =
  "historical_published_status_not_valid_for_schema_9";

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

type ApplicationQualityEvidence = {
  observedAt: string;
  evidenceScope: string;
  cleanInstallExitCode: number;
  buildExitCode: number;
  testsPassed: number;
  testsTotal: number;
  testsFailed: number;
  typecheckExitCode: number;
  productionAuditExitCode?: number;
  productionAuditVulnerabilityCount?: number;
  lintExitCode: number;
  lintErrorCount: number;
  lintWarningCount?: number;
  warningFree?: boolean;
  diffCheckExitCode?: number;
  repairMigrationParserPassed?: boolean;
  sqlFixtureParserPassed?: boolean;
  hostedCleanChainApplyPassed?: boolean;
  hostedFullPgTapPassed?: boolean;
  hostedFullPgTapRerunPending?: boolean;
  hostedDatabaseExecutionPassed?: boolean;
  repairMigrationSha256?: string;
  preconnectionFixtureSha256?: string;
  ownerFixtureSha256?: string;
  fullOperatingSystemFixtureSha256?: string;
  zeroCostFixtureSha256?: string;
};

type RolloutStep = {
  order: number;
  stage: string;
  id: string;
  action: string;
  migration: Nullable<string>;
  requiresCompletedStep: Nullable<string>;
  explicitReviewRequired: boolean;
  completed: boolean;
  verification: string;
};

type CurrentProductionObservation = {
  observedAt: string;
  sitesBaselineObservedAt?: string;
  migrationLedgerObservedAt?: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  canonicalGitHubMainMergePullRequest?: number;
  canonicalGitHubMainCommitScope?: string;
  githubParityVerifiedAtObservation?: boolean;
  sitesVersion: number;
  sitesVersionId?: string;
  sitesCheckoutCommit: string;
  sitesDeploymentEnvironmentRevision?: number;
  sitesEnvironmentRevision?: number;
  sitesRuntimeEnvironmentRevisionObservedAt?: string;
  sitesRuntimeFlags?: Record<string, boolean>;
  sitesSecretValueEvidenceScope?: string;
  sitesLiveUrl?: string;
  sitesCustomDomainsVerified?: boolean;
  sitesRecentErrorsObserved?: number;
  sitesArchiveFileCount?: number;
  sitesArchiveSha256?: string;
  sourceFileCount: number;
  sourceTreeSha256: string;
  sourceEvidenceScope?: string;
  productionMigrationCount: number;
  migrationTreeSha256: string;
  migrationTreeEvidenceScope?: string;
  historicalRepositoryMigrationTreeSha256?: string;
  historicalRepositoryMigrationTreeEvidenceScope?: string;
  latestProductionMigration: string;
  latestProductionMigrationByteLength?: number;
  latestProductionMigrationSha256: string;
  databaseLedgerObserved: boolean;
  databaseAppliedThroughLatestObserved: boolean;
  githubMainMatchesCandidate: boolean;
  candidateSourceMatchesLiveSites: boolean;
  candidateMigrationsMatchLiveLedger: boolean;
  fullReleaseGatePassed: boolean;
};

type CandidateEvidence = {
  status: string;
  actionScope: string;
  basedOnGitHubMainCommit: string;
  pullRequest: Nullable<number>;
  pullRequestDraft?: boolean;
  observedDraftPullRequestHead?: Nullable<string>;
  observedDraftPullRequestTree?: Nullable<string>;
  draftHeadEvidenceScope?: Nullable<string>;
  githubMerged: boolean;
  futureMergedGitHubCommit: Nullable<string>;
  futureSitesVersion: Nullable<number>;
  reviewedLocally: boolean;
  sourceReviewPassed?: boolean;
  qualityReviewPassed?: boolean;
  allFourWorkflowsGreen?: Nullable<boolean>;
  zeroUnresolvedReviewThreads?: Nullable<boolean>;
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
  pendingMigrations?: string[];
  databaseChangesRequired: boolean;
  additionalDatabaseChangesRequired?: boolean;
  databaseMigrationApplied: boolean;
  databaseMigrationsApplied?: string[];
  databaseApplyAuthorized?: boolean;
  sitesPublishRequired: boolean;
  sitesPublished: boolean;
  sitesPublishAuthorized?: boolean;
  deploymentAuthorized?: boolean;
  edgeDeployRequired?: boolean;
  edgeDeployed?: boolean;
  edgeDeployAuthorized?: boolean;
  activationRoutineMigrationRequired?: boolean;
  activationRoutineMigrationApplied?: boolean;
  activationAuthorized?: boolean;
  activationGateReady?: boolean;
  activationExecuted?: boolean;
  rolloutStatus?: string;
};

export type DeploymentManifest = {
  schemaVersion: number;
  recordKind: string;
  releaseState: string;
  reviewedAt?: Nullable<string>;
  candidateRevision?: string;
  knownResiduals?: string[];
  canonicalRepository: string;
  canonicalBranch: string;
  candidateBranch?: string;
  sitesProjectId: string;
  lastGitHubParityRelease: Record<string, unknown> & {
    supersededAsLiveBaseline: boolean;
    sitesVersion: number;
  };
  historicalProductionObservations: Array<Record<string, unknown>>;
  currentProductionObservation: CurrentProductionObservation;
  historicalV36GitHubReconciliationEvidence?: GitHubReconciliationEvidence;
  githubReconciliationEvidence?: GitHubReconciliationEvidence;
  historicalForwardRepairCandidate?: Record<string, unknown>;
  historicalPhase1BackendEvidence?: Record<string, unknown>;
  historicalPr164IntegrationEvidence?: Record<string, unknown>;
  databaseContractReview?: {
    status: string;
    forwardRepairRequired: boolean;
    functionalVerificationPassed: boolean;
    additionalDatabaseChangesRequired: boolean;
    hostedCleanChainApplyPassed?: boolean;
    hostedFullPgTapPassed?: boolean;
    hostedFullPgTapRerunPending?: boolean;
    databaseApplyAuthorized: boolean;
    evidenceScope?: string;
    repairMigrationFilename?: Nullable<string>;
    repairMigrationSha256?: Nullable<string>;
    repairMigrationByteLength?: Nullable<number>;
    futureProductionMigrationCount?: Nullable<number>;
    futureProductionMigrationTreeSha256?: Nullable<string>;
  };
  policyEvaluationEvidence?: Record<string, unknown>;
  applicationQualityEvidence?: Nullable<ApplicationQualityEvidence>;
  releaseCandidate: CandidateEvidence;
  edgeDeployment?: {
    observedAt: string;
    evidenceStatus: string;
    functionName: string;
    functionVersion: number;
    functionId: string;
    status: string;
    verifyJwt: boolean;
    ezbrSha256: string;
    indexPath: string;
    indexSha256: string;
    contractPath: string;
    contractSha256: string;
    configPath: string;
    configMirrorPath: string;
    configSha256: string;
    rootSitesTargetClosureParity: boolean;
    currentRepositorySourceParity?: boolean;
    sourceEvidenceScope?: string;
    unauthenticatedPostHttpStatus: number;
    logEventCount: number;
    logEventMethod: string;
    logEventHttpStatus: number;
    logEventTimestamp: number;
    recent5xxObserved: boolean;
    exceptionObserved: boolean;
    authenticatedBridgeVerified: boolean;
    providerCallObserved: boolean;
    realUploadObserved: boolean;
    readyDispositionObserved: boolean;
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
    nonReleaseDraftExclusions?: string[];
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    databaseApplyAuthorized?: boolean;
    sitesPublishAuthorized?: boolean;
    edgeDeployAuthorized?: boolean;
    deploymentAuthorized?: boolean;
    activationAuthorized?: boolean;
    activationGateReady?: boolean;
    allowedDeployment: string;
    releaseCondition: string;
  };
  activationState: Record<string, boolean>;
  activationStateScope: string;
  edgeCandidate?: Record<string, unknown>;
  operationalHold?: Record<string, unknown>;
  activationRoutine?: Record<string, unknown>;
  generatedVersionCloseouts?: Record<string, unknown>;
  deploymentParity?: Record<string, unknown>;
  currentRuntimeIdentityObservation: Record<string, unknown>;
  cleanupState: Record<string, unknown>;
  rolloutSequence?: {
    status: string;
    steps: RolloutStep[];
  };
};

const ACTIVATION_STATE_EXPECTED = {
  newIncrementalSpendApproved: true,
  aiWebResearchEnabled: false,
  openAiCredentialProvisioned: false,
  momoClientIdentityProvisioned: false,
  momoOwnerContactAuthorized: false,
  ownerConfirmedBusinessTruthVerified: false,
  permissionedMediaVerified: false,
  externalProvidersConnected: false,
  externalPublishingEnabled: false,
  scopedInternalAiActivationAuthorized: true,
  activationRoutineInstalled: false,
  activationRoutineInvoked: false,
  momoActivationExecuted: false,
} as const;

const EXPECTED_ROLLOUT_STEP_IDS = [
  "observe_main_live47_sites39_edge6",
  "verify_registered_mutable_rpc_hold_and_zero_work",
  "review_merge_team_private_food_candidate",
  "apply_exact_candidate48_bytes_under_hold",
  "verify_live48_candidate_under_hold",
  "reconcile_candidate48_generated_version",
  "publish_first_repaired_sites_under_hold",
  "deploy_first_edge_v2_under_hold",
  "verify_first_sites_edge_identity_under_hold",
  "author_review_identity_bound_activation_migration",
  "apply_dormant_activation_routine_migration",
  "reconcile_activation_generated_version",
  "publish_second_sites_parity_under_hold",
  "deploy_verify_second_edge_parity_under_hold",
  "invoke_guarded_activation_routine",
  "verify_post_activation_auth_budget_and_denials",
  "record_final_release_evidence",
] as const;

const LIVE_PRIVATE_INGRESS_SIGNATURES = [
  "veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)",
  "veroxa_finalize_private_media_assessment_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)",
  "veroxa_reserve_private_media_assessment_v1(uuid,uuid,text,text,text,text,text,bigint,uuid)",
  "veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)",
  "veroxa_complete_private_media_assessment_v1(uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid)",
  "veroxa_fail_private_media_assessment_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)",
  "veroxa_record_media_restaurant_association_v1(uuid,uuid,uuid,text,text,text)",
] as const;

const CANDIDATE_PRIVATE_INGRESS_SIGNATURES = [
  LIVE_PRIVATE_INGRESS_SIGNATURES[0],
  "veroxa_register_team_private_media_v1(uuid,text,text,bigint,text,text,jsonb,date)",
  ...LIVE_PRIVATE_INGRESS_SIGNATURES.slice(1),
] as const;

const AUTHENTICATED_READ_SIGNATURES = [
  "veroxa_momo_ready_review_status_v2(uuid,uuid)",
  "veroxa_momo_client_upload_status_v4(uuid)",
  "veroxa_momo_media_ai_operational_window_v1(uuid)",
] as const;

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertSchema10HeldRepair(manifest: DeploymentManifest): void {
  const failures: string[] = [];
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const review = manifest.databaseContractReview;
  const edge = manifest.edgeDeployment;
  const edgeCandidate = manifest.edgeCandidate;
  const hold = manifest.operationalHold;
  const routine = manifest.activationRoutine;
  const closeouts = manifest.generatedVersionCloseouts as
    | Record<string, Record<string, unknown>>
    | undefined;
  const parity = manifest.deploymentParity as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (
    manifest.schemaVersion !== 10 ||
    manifest.recordKind !== "veroxa_live47_held_candidate48_manifest" ||
    manifest.releaseState !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
    manifest.reviewedAt !== "2026-08-09" ||
    manifest.candidateRevision !== LOCAL_CANDIDATE_REVISION ||
    manifest.candidateBranch !== "agent/momo-private-assessment-ready-unified"
  ) failures.push("schema-10 held-repair identity drifted");

  if (
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.sitesProjectId !== "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) failures.push("canonical repository or Sites project identity drifted");

  if (
    live.evidenceStatus !== LIVE_PRODUCTION_EVIDENCE_STATUS ||
    live.canonicalGitHubMainCommit !== LOCAL_CANDIDATE_BASE_COMMIT ||
    live.canonicalGitHubMainMergePullRequest !== 166 ||
    live.githubParityVerifiedAtObservation !== false ||
    live.sitesVersion !== 39 ||
    live.sitesVersionId !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesVersionId ||
    live.sitesCheckoutCommit !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesCheckoutCommit ||
    live.sitesArchiveFileCount !== 54 ||
    live.sitesArchiveSha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesArchiveSha256 ||
    live.sitesDeploymentEnvironmentRevision !== 10 ||
    live.sitesEnvironmentRevision !== 11 ||
    !sameJson(live.sitesRuntimeFlags, {
      VEROXA_MEDIA_AI_ENABLED: false,
      VEROXA_MOMO_CONTENT_AI_ENABLED: false,
    }) ||
    live.productionMigrationCount !== LIVE47_MIGRATION_EVIDENCE.fileCount ||
    live.migrationTreeSha256 !== LIVE47_MIGRATION_EVIDENCE.treeSha256 ||
    live.latestProductionMigration !== LIVE47_MIGRATION_EVIDENCE.filename ||
    live.latestProductionMigrationByteLength !== LIVE47_MIGRATION_EVIDENCE.byteLength ||
    live.latestProductionMigrationSha256 !== LIVE47_MIGRATION_EVIDENCE.sha256 ||
    !live.databaseLedgerObserved || !live.databaseAppliedThroughLatestObserved ||
    live.githubMainMatchesCandidate || live.candidateSourceMatchesLiveSites ||
    live.candidateMigrationsMatchLiveLedger || live.fullReleaseGatePassed
  ) failures.push("current Sites v39 / live47 production observation drifted");

  if (
    candidate.status !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
    candidate.actionScope !== RECONCILIATION_CANDIDATE_ACTION_SCOPE ||
    candidate.basedOnGitHubMainCommit !== LOCAL_CANDIDATE_BASE_COMMIT ||
    candidate.pullRequest !== PR165_DRAFT_CHECKPOINT.pullRequest ||
    candidate.pullRequestDraft !== true ||
    candidate.observedDraftPullRequestHead !== PR165_DRAFT_CHECKPOINT.openingDraftHead ||
    candidate.observedDraftPullRequestTree !== PR165_DRAFT_CHECKPOINT.openingDraftTree ||
    candidate.draftHeadEvidenceScope !== PR165_DRAFT_CHECKPOINT.evidenceScope ||
    candidate.githubMerged || candidate.futureMergedGitHubCommit !== null ||
    candidate.futureSitesVersion !== null || !candidate.reviewedLocally ||
    candidate.sourceReviewPassed !== true || candidate.qualityReviewPassed !== true ||
    candidate.allFourWorkflowsGreen !== null ||
    candidate.zeroUnresolvedReviewThreads !== null ||
    candidate.candidateSourceMatchesLiveSites ||
    candidate.candidateMigrationsMatchLiveLedger ||
    candidate.githubMainMatchesCandidate || candidate.fullReleaseGatePassed ||
    candidate.sourceFileCount !== LOCAL_CANDIDATE_SOURCE_EVIDENCE.fileCount ||
    candidate.sourceTreeSha256 !== LOCAL_CANDIDATE_SOURCE_EVIDENCE.treeSha256 ||
    candidate.migrationFileCount !== REPAIR_MIGRATION_EVIDENCE.candidateFileCount ||
    candidate.latestCandidateMigration !== REPAIR_MIGRATION_EVIDENCE.filename ||
    candidate.latestCandidateMigrationSha256 !== REPAIR_MIGRATION_EVIDENCE.sha256 ||
    !sameJson(candidate.pendingMigrations, LOCAL_CANDIDATE_PENDING_MIGRATIONS) ||
    !sameJson(candidate.databaseMigrationsApplied, LOCAL_CANDIDATE_APPLIED_MIGRATIONS) ||
    !candidate.databaseChangesRequired || !candidate.additionalDatabaseChangesRequired ||
    candidate.databaseMigrationApplied || candidate.databaseApplyAuthorized !== true ||
    !candidate.sitesPublishRequired || candidate.sitesPublished ||
    candidate.sitesPublishAuthorized !== true || candidate.edgeDeployRequired !== true ||
    candidate.edgeDeployed || candidate.edgeDeployAuthorized !== true ||
    candidate.deploymentAuthorized !== true ||
    candidate.activationRoutineMigrationRequired !== true ||
    candidate.activationRoutineMigrationApplied || candidate.activationAuthorized !== true ||
    candidate.activationGateReady || candidate.activationExecuted ||
    candidate.rolloutStatus !==
      "registered_mutable_rpc_hold_active_candidate48_remote_gates_pending"
  ) failures.push("reviewed local candidate gates drifted or overclaim completion");

  const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
    exclusions: [...GENERATED_PATH_EXCLUSIONS],
  });
  if (
    manifest.source.evidenceScope !== LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE ||
    manifest.source.fileCount !== sourceTree.fileCount ||
    manifest.source.treeSha256 !== sourceTree.sha256 ||
    sourceTree.fileCount !== LOCAL_CANDIDATE_SOURCE_EVIDENCE.fileCount ||
    sourceTree.sha256 !== LOCAL_CANDIDATE_SOURCE_EVIDENCE.treeSha256 ||
    !sameJson(manifest.applicationQualityEvidence, APPLICATION_QUALITY_EVIDENCE)
  ) failures.push("candidate source fingerprint or local quality evidence drifted");

  const rootMigrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {suffix: ".sql"});
  const mirrorMigrationTree = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot ?? ""), {suffix: ".sql"});
  if (
    manifest.migrations.evidenceScope !== LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE ||
    rootMigrationTree.fileCount !== REPAIR_MIGRATION_EVIDENCE.candidateFileCount ||
    mirrorMigrationTree.fileCount !== REPAIR_MIGRATION_EVIDENCE.candidateFileCount ||
    rootMigrationTree.sha256 !== REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256 ||
    mirrorMigrationTree.sha256 !== REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256 ||
    !sameJson(rootMigrationTree.files, mirrorMigrationTree.files) ||
    manifest.migrations.fileCount !== rootMigrationTree.fileCount ||
    manifest.migrations.treeSha256 !== rootMigrationTree.sha256 ||
    manifest.migrations.mirrorFileCount !== mirrorMigrationTree.fileCount ||
    manifest.migrations.mirrorTreeSha256 !== mirrorMigrationTree.sha256
  ) failures.push("candidate48 root/Sites migration mirror drifted");

  for (const root of ["supabase/migrations", "artifacts/veroxa-sites/supabase/migrations"]) {
    const repairPath = resolve(repoRoot, root, REPAIR_MIGRATION_EVIDENCE.filename);
    if (!existsSync(repairPath) || statSync(repairPath).size !== REPAIR_MIGRATION_EVIDENCE.byteLength ||
        sha256File(repairPath) !== REPAIR_MIGRATION_EVIDENCE.sha256) {
      failures.push("repair migration bytes drifted: " + root);
    }
  }

  if (
    !review || review.status !== DATABASE_CONTRACT_REVIEW.status ||
    review.forwardRepairRequired !== true || review.functionalVerificationPassed !== false ||
    review.additionalDatabaseChangesRequired !== true || review.databaseApplyAuthorized !== true ||
    review.hostedCleanChainApplyPassed !== false ||
    review.hostedFullPgTapPassed !== false ||
    review.hostedFullPgTapRerunPending !== true ||
    review.repairMigrationFilename !== REPAIR_MIGRATION_EVIDENCE.filename ||
    review.repairMigrationSha256 !== REPAIR_MIGRATION_EVIDENCE.sha256 ||
    review.repairMigrationByteLength !== REPAIR_MIGRATION_EVIDENCE.byteLength ||
    review.futureProductionMigrationCount !== null ||
    review.futureProductionMigrationTreeSha256 !== null
  ) failures.push("database review must remain locally reviewed and hosted-pending");

  if (
    !edge || edge.functionName !== PRIVATE_MEDIA_EDGE_EVIDENCE.functionName ||
    edge.functionVersion !== 6 || edge.functionId !== PRIVATE_MEDIA_EDGE_EVIDENCE.functionId ||
    edge.status !== "ACTIVE" || !edge.verifyJwt ||
    edge.ezbrSha256 !== PRIVATE_MEDIA_EDGE_EVIDENCE.ezbrSha256 ||
    edge.contractSha256 !== PRIVATE_MEDIA_EDGE_EVIDENCE.contractSha256 ||
    edge.rootSitesTargetClosureParity !== false || edge.currentRepositorySourceParity !== false ||
    edge.unauthenticatedPostHttpStatus !== 401 || edge.recent5xxObserved ||
    edge.exceptionObserved || edge.authenticatedBridgeVerified || edge.providerCallObserved ||
    edge.realUploadObserved || edge.readyDispositionObserved
  ) failures.push("live Edge v6 evidence drifted or claims current-source parity");

  if (
    !edgeCandidate || edgeCandidate.functionName !== PRIVATE_MEDIA_EDGE_CANDIDATE.functionName ||
    edgeCandidate.promptContractVersion !== PRIVATE_MEDIA_EDGE_CANDIDATE.promptContractVersion ||
    edgeCandidate.indexSha256 !== PRIVATE_MEDIA_EDGE_CANDIDATE.indexSha256 ||
    edgeCandidate.contractSha256 !== PRIVATE_MEDIA_EDGE_CANDIDATE.contractSha256 ||
    edgeCandidate.configSha256 !== PRIVATE_MEDIA_EDGE_CANDIDATE.configSha256 ||
    edgeCandidate.deployRequired !== true || edgeCandidate.deployAuthorized !== true ||
    edgeCandidate.deployed !== false || edgeCandidate.futureFunctionVersion !== null ||
    edgeCandidate.rootSitesSourceParity !== true || edgeCandidate.providerCallObserved !== false ||
    edgeCandidate.realUploadObserved !== false
  ) failures.push("candidate Edge prompt-v2 evidence drifted");

  const edgePairs = [
    ["supabase/functions/momo-content-ai-lifecycle/index.ts", "artifacts/veroxa-sites/supabase/functions/momo-content-ai-lifecycle/index.ts", PRIVATE_MEDIA_EDGE_CANDIDATE.indexSha256],
    ["supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts", "artifacts/veroxa-sites/supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts", PRIVATE_MEDIA_EDGE_CANDIDATE.contractSha256],
    ["supabase/config.toml", "artifacts/veroxa-sites/supabase/config.toml", PRIVATE_MEDIA_EDGE_CANDIDATE.configSha256],
  ] as const;
  for (const [rootPath, mirrorPath, expectedSha] of edgePairs) {
    const rootFile = resolve(repoRoot, rootPath); const mirrorFile = resolve(repoRoot, mirrorPath);
    if (!existsSync(rootFile) || !existsSync(mirrorFile) ||
        sha256File(rootFile) !== expectedSha || sha256File(mirrorFile) !== expectedSha) {
      failures.push("candidate Edge target-closure parity drifted: " + rootPath);
    }
  }

  if (
    manifest.deploymentFreeze.state !== LOCAL_CANDIDATE_DEPLOYMENT_FREEZE_STATE ||
    manifest.deploymentFreeze.automaticDeploymentsAllowed ||
    manifest.deploymentFreeze.databaseApplyAuthorized !== true ||
    manifest.deploymentFreeze.sitesPublishAuthorized !== true ||
    manifest.deploymentFreeze.edgeDeployAuthorized !== true ||
    manifest.deploymentFreeze.deploymentAuthorized !== true ||
    manifest.deploymentFreeze.activationAuthorized !== true ||
    manifest.deploymentFreeze.activationGateReady !== false
  ) failures.push("manual authorization / automatic-deployment freeze drifted");

  if (
    !hold || hold.status !== "active_verified_after_live47_ledger_reconciliation" ||
    hold.restaurantId !== "6386d7e3-7966-4498-a13e-8736590bd505" ||
    hold.scopeKey !== "momo_house_san_antonio" || hold.relevantWorkTablesZeroVerified !== true ||
    hold.aiLiveCalls !== false || hold.providerWrites !== false || hold.reviewReplies !== false ||
    hold.websiteWrites !== false || hold.externalScheduling !== false ||
    hold.mutableIngressAndDecisionAclsRevoked !== true ||
    hold.privateMediaIngressAclsRevoked !== true || hold.contentAndMediaAiAclsRevoked !== true ||
    hold.registeredMutableRpcAclHoldVerified !== true || hold.preCorrectionAclLeakDetected !== true ||
    hold.correctedByGuardedOperationalTransaction !== true || hold.postCorrectionLeakedRpcCount !== 0 ||
    hold.heldPublicFunctionSetCount !== 49 ||
    hold.livePrivateAssessmentIngressRpcCount !== 7 ||
    !sameJson(hold.livePrivateAssessmentIngressRpcSignatures, LIVE_PRIVATE_INGRESS_SIGNATURES) ||
    hold.candidatePrivateAssessmentIngressRpcCount !== 8 ||
    !sameJson(hold.candidatePrivateAssessmentIngressRpcSignatures, CANDIDATE_PRIVATE_INGRESS_SIGNATURES) ||
    !sameJson(hold.authenticatedReadRpcSignatures, AUTHENTICATED_READ_SIGNATURES) ||
    hold.teamPrivateStorageInsertPolicyActive !== false ||
    hold.teamPrivateStorageOrphanDeletePolicyActive !== false ||
    hold.activeClientStorageUploadPolicyRemains !== true ||
    hold.rawOrphanStorageObjectWritePossible !== true ||
    hold.rawStorageCannotRegisterOrTriggerProviderWhileRpcsHeld !== true ||
    hold.repairPreservesRegisteredMutableRpcHold !== true ||
    hold.activationMigrationMustPreserveRegisteredMutableRpcHold !== true
  ) failures.push("registered mutable-RPC hold evidence drifted");

  if (
    !routine || routine.status !== "future_source_tracked_migration_not_authored" ||
    routine.migrationFilename !== null || routine.migrationSha256 !== null ||
    routine.generatedProductionVersion !== null || routine.boundMergedGitHubCommit !== null ||
    routine.boundSitesVersion !== null || routine.boundEdgeFunctionVersion !== null ||
    routine.postgresOnly !== true || routine.executeGrantedToPublic !== false ||
    routine.executeGrantedToAnon !== false || routine.executeGrantedToAuthenticated !== false ||
    routine.executeGrantedToServiceRole !== false ||
    routine.installMustPreserveRegisteredMutableRpcHold !== true || routine.gateReady !== false ||
    routine.installed !== false || routine.invoked !== false ||
    routine.invocationRestoresOnlySourceDefinedGrants !== true ||
    routine.invocationSetsOnlyAiLiveCallsTrue !== true ||
    routine.invocationReassertsEveryExternalFlagFalse !== true
  ) failures.push("future dormant activation routine is not fail-closed");

  for (const closeout of [closeouts?.repair, closeouts?.activation]) {
    if (!closeout || closeout.actualLedgerFilename !== null || closeout.actualLedgerVersion !== null ||
        closeout.pullRequest !== null || closeout.mergedCommit !== null ||
        closeout.unchangedBytesVerified !== false || closeout.completed !== false) {
      failures.push("generated-version closeout overclaims completion");
    }
  }
  for (const deployment of [parity?.firstHeld, parity?.secondHeld]) {
    if (!deployment || deployment.mergedGitHubCommit !== null || deployment.sitesVersion !== null ||
        deployment.edgeFunctionVersion !== null || deployment.holdReverified !== false ||
        deployment.verified !== false) failures.push("deployment parity overclaims completion");
  }

  if (!sameJson(manifest.activationState, ACTIVATION_STATE_EXPECTED)) {
    failures.push("authorization and activation execution state diverged");
  }

  const steps = manifest.rolloutSequence?.steps ?? [];
  if (
    manifest.rolloutSequence?.status !==
      "registered_mutable_rpc_hold_active_candidate48_remote_gates_pending" ||
    steps.length !== EXPECTED_ROLLOUT_STEP_IDS.length ||
    steps.some((step, index) =>
      step.order !== index + 1 || step.id !== EXPECTED_ROLLOUT_STEP_IDS[index] ||
      !step.explicitReviewRequired || step.completed !== index < 2 ||
      step.requiresCompletedStep !== (index === 0 ? null : EXPECTED_ROLLOUT_STEP_IDS[index - 1]))
  ) failures.push("schema-10 rollout is not the exact contiguous two-step completion prefix");

  const residuals = manifest.knownResiduals ?? [];
  if (
    residuals.length !== 1 || !residuals[0].includes("postgres is not a member of supabase_admin") ||
    !residuals[0].includes("20260808002609") || !residuals[0].includes("skips supabase_admin") ||
    !residuals[0].includes("not comprehensive")
  ) failures.push("known ACL residual drifted");

  if (failures.length > 0) throw new Error("Unsafe schema-10 held-repair manifest: " + failures.join("; "));
}

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  if (manifest.schemaVersion === 10) {
    assertSchema10HeldRepair(manifest);
    return;
  }
  throw new Error(
    "Current release tooling accepts only the schema-10 live47/candidate48 held release",
  );
}

export function assertReviewedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  assertUnreleasedLocalCandidateManifest(manifest);
  const candidate = manifest.releaseCandidate;
  const review = manifest.databaseContractReview;
  if (
    review?.status !== DATABASE_CONTRACT_REVIEW.status ||
    review.forwardRepairRequired !== true ||
    review.functionalVerificationPassed !== false ||
    review.additionalDatabaseChangesRequired !== true ||
    !candidate.reviewedLocally ||
    candidate.sourceReviewPassed !== true ||
    candidate.qualityReviewPassed !== true ||
    manifest.applicationQualityEvidence === null
  ) {
    throw new Error(
      "Held-repair candidate lacks its required local source, quality, or database static-review evidence",
    );
  }
}

export function assertVerifiedGitHubParityManifest(
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Schema 10 has no current repair PR, exact-head workflow closure, merge, database apply, or runtime publication evidence",
  );
}

export function assertPublishedSitesFollowupManifest(
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Sites v39 and Edge v6 are independent live baselines; neither held candidate parity publication has occurred",
  );
}

export function assertDeploymentAttestationManifest(
  manifest: DeploymentManifest,
): void {
  assertUnreleasedLocalCandidateManifest(manifest);
}

function normalized(relativePath: string): string {
  return relativePath.split(sep).join("/");
}

function isExcluded(relativePath: string, exclusions: string[]): boolean {
  return exclusions.some(
    (entry) => relativePath === entry || relativePath.startsWith(entry + "/"),
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
        "Release tree cannot contain a symbolic link: " + relativePath,
      );
    }
    if (entry.isDirectory()) {
      files.push(...collectFiles(directory, exclusions, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error("Unsupported release-tree entry: " + relativePath);
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
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {
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
