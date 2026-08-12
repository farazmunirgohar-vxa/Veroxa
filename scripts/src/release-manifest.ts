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
  "live48_first_parity_verified_activation_migration_review_pending_under_hold";
export const REVIEWED_LOCAL_CANDIDATE_STATUS =
  "dormant_identity_bound_activation_migration_review_pending";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "integrated_candidate_fingerprints_refreshed_review_required";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "integrated_candidate_review_required";
export const RECONCILIATION_CANDIDATE_ACTION_SCOPE =
  "postgres_only_dormant_internal_ai_activation_preserving_external_action_locks";
export const LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE =
  "exact_first_parity_source_plus_dormant_activation_candidate_under_hold";
export const LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE =
  "exact_live48_ledger_plus_one_mirrored_provisional_activation_migration";
export const RECONCILIATION_SOURCE_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE;
export const RECONCILIATION_MIGRATION_EVIDENCE_SCOPE =
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE;
export const LOCAL_CANDIDATE_DEPLOYMENT_FREEZE_STATE =
  "registered_mutable_rpc_ingress_and_decision_hold_active_verified";
export const LOCAL_CANDIDATE_REVISION =
  "live48_first_parity_identity_bound_activation_candidate_2026_08_09";
export const LOCAL_CANDIDATE_BASE_COMMIT =
  "a1c6796b50a1072a96a40db283503d9e2c81bbae";
export const LIVE_PRODUCTION_EVIDENCE_STATUS =
  "github_a1c6796b_sites_v40_database48_edge_v7_first_parity_verified_under_hold";
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

export const DEPLOYABLE_SITES_SOURCE_ROOT = "artifacts/veroxa-sites";
export const DEPLOYABLE_SITES_MAPPING_TARGET =
  "Sites repository root candidate";
export const ROOT_MIGRATION_SOURCE_ROOT = "supabase/migrations";
export const SITES_MIGRATION_MIRROR_ROOT =
  "artifacts/veroxa-sites/supabase/migrations";
export const REVIEWED_APPLICATION_TEST_TOTAL = 437;
export const GUARDED_ROLLOUT_RELEASE_STATE =
  "live49_internal_ai_active_external_actions_held";
export const GUARDED_ROLLOUT_CANDIDATE_REVISION =
  "live49_internal_ai_activation_closeout_2026_08_09";
export const GUARDED_ROLLOUT_CANDIDATE_BRANCH =
  "agent/internal-ai-activation-closeout";
export const GUARDED_ROLLOUT_PRODUCTION_MAIN_COMMIT =
  "2721545d5823dbd4cbc233e7473d25393f4ff0ec";
export const GUARDED_ROLLOUT_PRODUCTION_MAIN_PULL_REQUEST = 169;
export const GUARDED_ROLLOUT_CANDIDATE_BASE_COMMIT =
  "60dbfd047ff2f7ed21d630e785746aa4e6f228b4";
export const GUARDED_ROLLOUT_PULL_REQUEST = 169;
export const GUARDED_ROLLOUT_OPENING_DRAFT_HEAD =
  "96e13e155b8203192181afae26fe391cb6d36191";
export const GUARDED_ROLLOUT_OPENING_DRAFT_TREE =
  "59c7c9006f5cc006ccdac88a7034592234116c2d";
export const GUARDED_ROLLOUT_DRAFT_EVIDENCE_SCOPE =
  "observed_remote_pr169_opening_draft_checkpoint_not_exact_final_head";
export const REPAIR_GITHUB_MERGED_MAIN_COMMIT =
  "e01e8e00d94ce9eb5243038bf41c202897a17460";
export const REPAIR_CLOSEOUT_PULL_REQUEST = 167;
export const ACTIVATION_SOURCE_PULL_REQUEST = 168;
export const ACTIVATION_SOURCE_REVIEWED_HEAD =
  "d08114104f4030e31abe2514caf95c681e2b19ea";
export const ACTIVATION_SOURCE_MERGED_MAIN_COMMIT =
  "60dbfd047ff2f7ed21d630e785746aa4e6f228b4";
export const INTERNAL_AI_RELEASE_EVIDENCE = {
  fullReleaseGateScope:
    "scoped_internal_ai_release_complete_external_actions_held_no_owner_truth_or_real_upload",
  pullRequest: 169,
  exactHead: "78c1f90d1412375b136aa18adcf9c4c1addc781e",
  exactTree: "37cbc6d7815dde6984b2691006ac3977df1a7226",
  mergedCommit: "2721545d5823dbd4cbc233e7473d25393f4ff0ec",
  workflows: {
    ci: 31296663350,
    sites: 31296663318,
    supabase: 31296663330,
    veroxa: 31296663326,
  },
  sitesVersion: 41,
  sitesVersionId:
    "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_36b5c80ee2a48191acf5bcf809fd8ad7",
  sitesSourceCommit: "766ba3bc2a7ebd68c1d72ae7f53d159d2edca593",
  sitesSourceSha256:
    "96ab0a58d24c59ce176e3362730897764d039fdc2c3f8bd14d65317d1992532b",
  sitesArchiveSha256:
    "74c287e655495edde605f0fc38ebc06f1ed0f19275d550c4369e491430f7cea7",
  sitesArchiveFileCount: 52,
  sitesArchiveByteLength: 6_000_640,
  edgeFunctionVersion: 7,
  edgeFunctionId: "859c73c3-2102-41b4-9da1-20582acb7212",
  edgeBundleSha256:
    "a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d",
  invokedAt: "2026-08-09T05:35:42.103503Z",
  activationAuditEventId: "d31dc513-f953-4aca-9746-3f69447a6ae8",
  registeredRpcCount: 59,
  authenticatedGrantCount: 13,
  serviceRoleGrantCount: 32,
  remainingHeldCount: 14,
} as const;

export const MEDIA_UPLOAD_HANDOFF_EVIDENCE = {
  "observedAt": "2026-08-12",
  "status": "live55_sites_v52_high_resolution_reconciled_external_actions_held",
  "baseMainCommit": "fb6d8b13bf548fd144cec4ce241bd44c1cecc99f",
  "baseMainPullRequest": 179,
  "candidateBranch": "agent/v51-production-reconciliation",
  "reviewedHead": "b59ba5f1ef013aab2d36a3fd108a896b64e5bfd8",
  "reviewedTree": "6246edeea1d1ec8dc8fd5880c4fc7867001fefb5",
  "mergedPullRequest": null,
  "mergedMainCommit": null,
  "allFourExactHeadWorkflowsGreen": true,
  "zeroUnresolvedReviewThreads": true,
  "closeoutPullRequest": null,
  "closeoutEvidenceOnly": false,
  "sitesVersion": 52,
  "sitesVersionId": "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_84a25fdf11c8819189afc4ffa78691b8",
  "sitesSourceCommit": "f0d88e3246d3c23c5d7610ca07f94640c856e722",
  "sitesArchiveFileCount": 52,
  "sitesArchiveByteLength": 6041600,
  "sitesArchiveSha256": "60c9e2b83d7b6ce0dd84bd16fc8fbf11b98f814d86932342c11388aac3b7d62b",
  "sitesEnvironmentRevision": 14,
  "liveSitesSourceFileCount": 225,
  "liveSitesSourceTreeSha256": "7f7a16864d3424581b1f04ee07501909850c9e7a7f682657208e40ba801d8adf",
  "candidateSourceFileCount": 225,
  "candidateSourceTreeSha256": "7f7a16864d3424581b1f04ee07501909850c9e7a7f682657208e40ba801d8adf",
  "migrationFileCount": 55,
  "migrationTreeSha256": "8010eaf8a8936b6d450b0d6161308ed705560dc338705f335202243bfc26fc56",
  "latestMigration": "20260812214257_high_resolution_private_media_v1.sql",
  "latestMigrationByteLength": 11103,
  "latestMigrationSha256": "3e8471bc4216a67fd591b5b611388be2873e44eb87c957934b280681d7bfe065",
  "clientActionAfterUpload": "none",
  "processingOwner": "veroxa_team",
  "legacyV2AuthenticatedExecute": false,
  "v3AuthenticatedExecute": true,
  "teamProcessorAvailable": true,
  "savedInstructionCount": 0,
  "instructionApplicationCount": 0,
  "unverifiedSavedUploadCount": 0,
  "openMediaIntakeExceptionCount": 0,
  "allMediaIntakeExceptionsExternalLocked": true,
  "existingUploadRequiresClientRetry": false,
  "preFixInstructionRecoverable": false,
  "bridgeKeyRotated": true,
  "retiredRealUploadCount": 3,
  "syntheticFixtureDeletedCount": 4,
  "storageObjectCount": 0,
  "mediaAssetCount": 0,
  "mediaRenditionCount": 0,
  "mediaRightsCount": 0,
  "contentPlacementCount": 0,
  "mediaCandidateCount": 0,
  "readyPackageCount": 0,
  "nonterminalWorkCount": 0,
  "cleanupAuditEventCount": 1,
  "highResolutionUploadContract": {
    "totalPixelCeiling": null,
    "maximumFileBytes": 10485760,
    "maximumAxisPixels": 12000,
    "minimumAspectRatio": 0.4,
    "maximumAspectRatio": 2.5,
    "boundedDecodePreserved": true
  },
  "purgeEndpoint": {
    "id": "0dd3967b-343c-45b4-b7a8-14e6c962a7d3",
    "version": 11,
    "status": "ACTIVE",
    "verifyJwt": true,
    "ezbrSha256": "f18a7abb118f36d6bdf76777a68efb3a33ed5dbcc89b49aab56796af268b0696",
    "indexSha256": "6d928ef8c06d1c97441080637467837ed309ac37f4f1285c1630c987a957bab5",
    "response": "410_legacy_media_purge_closed"
  },
  "applicationTestsPassed": 437,
  "applicationTestsTotal": 437,
  "edgeFunctions": {
    "contentLifecycle": {
      "id": "859c73c3-2102-41b4-9da1-20582acb7212",
      "version": 11,
      "verifyJwt": true,
      "ezbrSha256": "1d03c3be5d2e38126adfa49d9dc02de345dcee8c25bd724b66f7642efa183c04",
      "indexSha256": "78f25afb125b1e51a54bc27ddf0bc43875307f4cb799eef577b8c7bf4cb9cac9"
    },
    "contentDispatch": {
      "id": "e6d63920-a6cc-4ffe-9770-f7133fd742c2",
      "version": 3,
      "verifyJwt": false,
      "ezbrSha256": "d5f464240e6bfffac35e9ce1b1c6484eb049b380dfb87b64ab0fd22a7d62a76a",
      "indexSha256": "6452a44ad7474d0c6fbd0434e1bd1fd3e7ddaaaee0ba29135a22e847eadc90c9"
    },
    "contentWebhook": {
      "id": "0bec02a3-4d77-46b2-b067-d57e7970961e",
      "version": 4,
      "verifyJwt": false,
      "ezbrSha256": "f974687864d2c9eb610a509d7b5427a8c89ae77fb748fa4efb69812aa80cbdc8",
      "indexSha256": "78aeb84a399aa57b8f7c5bab41022acf6768f4e086cec406d925e52a606e3125"
    },
    "mediaLifecycle": {
      "id": "601bc0cc-c95f-4192-a6ab-edb6e9947963",
      "version": 3,
      "verifyJwt": true,
      "ezbrSha256": "712643244ffe1495262db422258b7322a58b55f30f518241b0bb57e40b91462a",
      "indexSha256": "a3d568eb532d0bb8ff9c840a7d2a26cbad300df2b71c350aaecfaf377173a5f1"
    },
    "legacyMediaPurge": {
      "id": "0dd3967b-343c-45b4-b7a8-14e6c962a7d3",
      "version": 11,
      "status": "ACTIVE",
      "verifyJwt": true,
      "ezbrSha256": "f18a7abb118f36d6bdf76777a68efb3a33ed5dbcc89b49aab56796af268b0696",
      "indexSha256": "6d928ef8c06d1c97441080637467837ed309ac37f4f1285c1630c987a957bab5",
      "response": "410_legacy_media_purge_closed"
    }
  },
  "allFourExactHeadWorkflows": {
    "ci": {
      "runId": 31647260918,
      "status": "success"
    },
    "sitesVerify": {
      "runId": 31647260962,
      "status": "success"
    },
    "supabaseVerify": {
      "runId": 31647260942,
      "status": "success"
    },
    "veroxaVerify": {
      "runId": 31647260978,
      "status": "success"
    }
  },
  "clientRightsAttestationRequired": true,
  "clientRightsAttestationScopes": [
    "instagram",
    "facebook",
    "google_business"
  ],
  "clientRightsAttestationGuard": "media_rights_attestation_required_before_storage",
  "operationalSourceCommitScope": "PR #181 exact operational reconciliation head; all four exact-head workflows green with zero review threads; merge pending"
} as const;

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
  sitesObservedAt: "2026-08-09",
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
  canonicalGitHubMainMergePullRequest: 167,
  canonicalGitHubMainCommitScope:
    "pr167_generated_version_closeout_merged_and_exact_first_sites_edge_parity_verified",
  sitesVersion: 40,
  sitesVersionId:
    "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_3e8ce417e544819196aa757cc304b789",
  sitesCheckoutCommit: "4ee8895f68505e8ea79bf3e0f3ea3b2871ca2b2c",
  sitesArchiveFileCount: 52,
  sitesArchiveSha256:
    "4bc875ee7b6fd6735569df02d3c611dde095d8c85a7ff09e1ebf465a1128ab15",
  sitesDeploymentEnvironmentRevision: 11,
  sitesEnvironmentRevision: 11,
  sitesLiveUrl: "https://veroxasystems.com",
  sitesCustomDomainsVerified: true,
  sitesRecentErrorsObserved: 0,
  sourceFileCount: 214,
  sourceTreeSha256:
    "cec2f313e3850141117c7f69dbc1d5ad707b72ee7a7ad5f1f2efa0d6c5a34297",
  sourceEvidenceScope: "exact_sites_v40_source_commit_and_reviewed_tree",
  migrationFileCount: 48,
  migrationTreeSha256:
    "1b3a575cbfbad53e811703c38681c30adf7c4b7bd716b1b193e322233d8d6ba6",
  latestMigration:
    "20260809035302_team_private_food_assessment_reconciliation_v1.sql",
  latestMigrationByteLength: 59_052,
  latestMigrationSha256:
    "56c64c795ad12f1dfbe05894fd3e56a87f1d0e3376ff10edfd97760b8d2fbd5c",
} as const;

export const LIVE47_MIGRATION_EVIDENCE = {
  filename: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration,
  byteLength: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationByteLength,
  sha256: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256,
  fileCount: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount,
  treeSha256: CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256,
} as const;

export const LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS = [
  "20260809035302_team_private_food_assessment_reconciliation_v1.sql",
  "20260809051616_guarded_internal_ai_activation_v1.sql",
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
  "20260809035302_team_private_food_assessment_reconciliation_v1.sql",
  "20260809051616_guarded_internal_ai_activation_v1.sql",
] as const;
export const LOCAL_CANDIDATE_PENDING_MIGRATIONS: readonly string[] = [];
export const LOCAL_CANDIDATE_SOURCE_EVIDENCE = {
  fileCount: 216,
  treeSha256:
    "96ab0a58d24c59ce176e3362730897764d039fdc2c3f8bd14d65317d1992532b",
  reviewPassed: true,
} as const;

export const REPAIR_MIGRATION_EVIDENCE = {
  filename: "20260809035302_team_private_food_assessment_reconciliation_v1.sql",
  byteLength: 59_052,
  sha256: "56c64c795ad12f1dfbe05894fd3e56a87f1d0e3376ff10edfd97760b8d2fbd5c",
  candidateFileCount: 48,
  candidateTreeSha256:
    "1b3a575cbfbad53e811703c38681c30adf7c4b7bd716b1b193e322233d8d6ba6",
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
  evidenceScope: "first_parity_verified_dormant_activation_candidate_local_review",
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
  hostedCleanChainApplyPassed: true,
  hostedFullPgTapPassed: true,
  hostedFullPgTapRerunPending: false,
  hostedDatabaseExecutionPassed: true,
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
  observedAt: "2026-08-09",
  functionName: "momo-content-ai-lifecycle",
  functionVersion: 7,
  functionId: "859c73c3-2102-41b4-9da1-20582acb7212",
  status: "ACTIVE",
  verifyJwt: true,
  ezbrSha256:
    "a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d",
  indexSha256:
    "867d85fe555a5f7d9d48d62698f4b1fb95d4e0769fc299020953cf5054d8720d",
  contractSha256:
    "38ab001ea71f5d6299f6dea99291342a37bb5cee7ce53a392581fce2941f5a72",
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
    MEDIA_UPLOAD_HANDOFF_EVIDENCE.edgeFunctions.contentLifecycle.indexSha256,
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
  sitesArchiveByteLength?: number;
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
  fullReleaseGateScope?: string;
  mediaCleanup?: {
    storageObjectCount: number;
    mediaAssetCount: number;
    mediaRenditionCount: number;
    nonterminalWorkCount: number;
    completedCleanupAuditEventCount: number;
  };
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
  fullReleaseGateScope?: string;
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
  activationAuthorizationConsumed?: boolean;
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
  mediaUploadHandoff?: Record<string, unknown>;
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
    localStaticReviewPassed?: boolean;
    localParserPassed?: boolean;
    hostedCleanChainApplyPassed?: boolean;
    hostedFullPgTapPassed?: boolean;
    hostedFullPgTapRerunPending?: boolean;
    hostedDatabaseExecutionPassed?: boolean;
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
    logEventTimestamp: Nullable<number>;
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
    rolloutAuthorizationConsumed?: boolean;
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
  rolloutEvidence?: Record<string, Record<string, unknown>>;
  currentRuntimeIdentityObservation: Record<string, unknown>;
  activationExecution?: Nullable<Record<string, unknown>>;
  fullReleaseGatePassed?: Nullable<boolean>;
  fullReleaseGateScope?: string;
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

const ROLLOUT_STAGE_EVIDENCE_FAILURES = [
  "step 1 observed-production identity evidence is incomplete or drifted",
  "step 2 zero-work registered mutable-RPC hold evidence is missing",
  "step 3 exact PR165 review, workflow, thread, or merge evidence is missing",
  "step 4 reviewed repair bytes are not proven in the generated live48 ledger",
  "step 5 live48 functional/security verification under hold is missing",
  "step 6 generated-version closeout lacks exact reviewed PR167 evidence",
  "step 7 first Sites publication identity is incomplete",
  "step 8 first Edge publication identity or fail-closed proof is incomplete",
  "step 9 first cross-runtime parity under hold is not proven",
  "step 10 dormant activation source lacks exact review, binding, or no-grant evidence",
  "step 11 dormant routine installation or retained hold is not proven",
  "step 12 activation generated-version closeout evidence is incomplete",
  "step 13 second Sites parity identity is incomplete",
  "step 14 second GitHub/Sites/Edge parity under hold is not proven",
  "step 15 guarded postgres-only activation evidence is incomplete or overbroad",
  "step 16 post-activation authority, budget, or denial verification is incomplete",
  "step 17 final release evidence is incomplete or claims unsupported external action",
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function completedRolloutStageHasEvidence(
  manifest: DeploymentManifest,
  index: number,
): boolean {
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const review = manifest.databaseContractReview;
  const edgeCandidate = manifest.edgeCandidate;
  const hold = manifest.operationalHold;
  const routine = manifest.activationRoutine;
  const closeouts = manifest.generatedVersionCloseouts as
    | Record<string, Record<string, unknown>>
    | undefined;
  const parity = manifest.deploymentParity as
    | Record<string, Record<string, unknown>>
    | undefined;
  const handoff = manifest.mediaUploadHandoff as
    | Record<string, unknown>
    | undefined;
  const repairCloseout = closeouts?.repair;
  const activationCloseout = closeouts?.activation;
  const initialObservation = manifest.rolloutEvidence?.initialObservation;
  const repairGitHubRelease = manifest.rolloutEvidence?.repairGitHubRelease;
  const repairCloseoutGitHubRelease =
    manifest.rolloutEvidence?.repairCloseoutGitHubRelease;
  const repairDatabaseVerification =
    manifest.rolloutEvidence?.repairDatabaseVerification;
  const activationDatabaseVerification =
    manifest.rolloutEvidence?.activationDatabaseVerification;
  const activationCloseoutGitHubRelease =
    manifest.rolloutEvidence?.activationCloseoutGitHubRelease;
  const secondRuntimeParity = manifest.rolloutEvidence?.secondRuntimeParity;
  const activationPostflightVerification =
    manifest.rolloutEvidence?.activationPostflightVerification;
  const firstHeld = parity?.firstHeld;
  const secondHeld = parity?.secondHeld;
  const execution = manifest.activationExecution;
  const externalFlagsFalse =
    hold?.providerWrites === false &&
    hold?.reviewReplies === false &&
    hold?.websiteWrites === false &&
    hold?.externalScheduling === false;

  switch (index) {
    case 0:
      return (
        initialObservation?.canonicalGitHubMainCommit ===
          "39bf713705685636f0d20a2ca068c738d4f414b4" &&
        initialObservation?.canonicalGitHubMainMergePullRequest === 166 &&
        initialObservation?.sitesVersion === 39 &&
        initialObservation?.productionMigrationCount === 47 &&
        initialObservation?.edgeFunctionVersion === 6
      );
    case 1:
      return (
        initialObservation?.registeredMutableRpcCount === 49 &&
        initialObservation?.leakedMutableRpcCount === 0 &&
        initialObservation?.runtimeRowCount === 1 &&
        initialObservation?.relevantWorkRowCount === 0 &&
        initialObservation?.aiLiveCalls === false &&
        initialObservation?.providerWrites === false &&
        initialObservation?.reviewReplies === false &&
        initialObservation?.websiteWrites === false &&
        initialObservation?.externalScheduling === false
      );
    case 2:
      return (
        repairGitHubRelease?.pullRequest === 165 &&
        repairGitHubRelease?.baseCommit ===
          "39bf713705685636f0d20a2ca068c738d4f414b4" &&
        repairGitHubRelease?.exactHead ===
          "8623370f235cb574ea90580b146acec0acce2c49" &&
        repairGitHubRelease?.mergedCommit ===
          REPAIR_GITHUB_MERGED_MAIN_COMMIT &&
        repairGitHubRelease?.allFourExactHeadWorkflowsGreen === true &&
        repairGitHubRelease?.postMergeFollowupRequired === true &&
        repairGitHubRelease?.followupPullRequest ===
          REPAIR_CLOSEOUT_PULL_REQUEST
      );
    case 3:
      return (
        candidate.databaseMigrationsApplied?.includes(
          REPAIR_MIGRATION_EVIDENCE.filename,
        ) === true &&
        repairCloseout?.actualLedgerVersion === "20260809035302" &&
        repairCloseout?.actualLedgerFilename === REPAIR_MIGRATION_EVIDENCE.filename &&
        repairCloseout?.sourceSha256 === REPAIR_MIGRATION_EVIDENCE.sha256 &&
        repairCloseout?.unchangedBytesVerified === true
      );
    case 4:
      return (
        repairDatabaseVerification?.productionMigrationCount === 48 &&
        repairDatabaseVerification?.heldPublicFunctionCount === 59 &&
        repairDatabaseVerification?.leakedMutableRpcCount === 0 &&
        repairDatabaseVerification?.runtimeRowCount === 1 &&
        repairDatabaseVerification?.relevantWorkRowCount === 0 &&
        repairDatabaseVerification?.hostedCleanChainApplyPassed === true &&
        repairDatabaseVerification?.hostedFullPgTapPassed === true &&
        repairDatabaseVerification?.hostedDatabaseExecutionPassed === true
      );
    case 5:
      return (
        repairCloseout?.completed === true &&
        repairCloseout.pullRequest === REPAIR_CLOSEOUT_PULL_REQUEST &&
        isNonEmptyString(repairCloseout.mergedCommit) &&
        repairCloseoutGitHubRelease?.pullRequest ===
          REPAIR_CLOSEOUT_PULL_REQUEST &&
        repairCloseoutGitHubRelease?.exactHead ===
          "ec7a312f59a7909203f309fa9bd5cf6c2512b125" &&
        repairCloseoutGitHubRelease?.mergedCommit ===
          "a1c6796b50a1072a96a40db283503d9e2c81bbae" &&
        repairCloseoutGitHubRelease?.allFourExactHeadWorkflowsGreen === true &&
        repairCloseoutGitHubRelease?.releaseGateCorrected === true &&
        repairCloseoutGitHubRelease?.unresolvedActionableFindingCount === 0 &&
        repairCloseoutGitHubRelease?.correctivePullRequest ===
          REPAIR_CLOSEOUT_PULL_REQUEST &&
        repairCloseoutGitHubRelease?.correctiveMergedCommit ===
          "a1c6796b50a1072a96a40db283503d9e2c81bbae"
      );
    case 6:
      return (
        isPositiveInteger(firstHeld?.sitesVersion) &&
        isNonEmptyString(firstHeld?.sitesVersionId) &&
        isNonEmptyString(firstHeld?.sitesSourceSha256)
      );
    case 7:
      return (
        candidate.edgeDeployed === true &&
        edgeCandidate?.deployed === true &&
        isPositiveInteger(edgeCandidate?.futureFunctionVersion) &&
        isPositiveInteger(firstHeld?.edgeFunctionVersion) &&
        isNonEmptyString(firstHeld?.edgeFunctionId) &&
        isNonEmptyString(firstHeld?.edgeBundleSha256)
      );
    case 8:
      return (
        firstHeld?.verified === true &&
        firstHeld.holdReverified === true &&
        isNonEmptyString(firstHeld.mergedGitHubCommit) &&
        isPositiveInteger(firstHeld.sitesVersion) &&
        isNonEmptyString(firstHeld.sitesVersionId) &&
        isNonEmptyString(firstHeld.sitesSourceSha256) &&
        isPositiveInteger(firstHeld.edgeFunctionVersion) &&
        isNonEmptyString(firstHeld.edgeFunctionId) &&
        isNonEmptyString(firstHeld.edgeBundleSha256) &&
        firstHeld.aiLiveCalls === false &&
        firstHeld.externalFlagsFalse === true
      );
    case 9:
      return (
        isNonEmptyString(routine?.migrationFilename) &&
        isNonEmptyString(routine?.migrationSha256) &&
        routine?.boundMergedGitHubCommit === firstHeld?.mergedGitHubCommit &&
        routine?.boundSitesVersion === firstHeld?.sitesVersion &&
        routine?.boundSitesSourceSha256 === firstHeld?.sitesSourceSha256 &&
        routine?.boundEdgeFunctionVersion === firstHeld?.edgeFunctionVersion &&
        routine?.boundEdgeBundleSha256 === firstHeld?.edgeBundleSha256 &&
        routine?.sourceReviewPassed === true &&
        routine?.sourceReviewPullRequest === ACTIVATION_SOURCE_PULL_REQUEST &&
        routine?.sourceReviewExactHead === ACTIVATION_SOURCE_REVIEWED_HEAD &&
        routine?.sourceReviewMergedCommit ===
          ACTIVATION_SOURCE_MERGED_MAIN_COMMIT &&
        routine?.sourceReviewAllFourWorkflowsGreen === true &&
        routine?.sourceReviewZeroUnresolvedThreads === true &&
        routine?.installStateAtSourceReview === false &&
        routine?.postgresOnly === true &&
        routine?.executeGrantedToPublic === false &&
        routine?.executeGrantedToAnon === false &&
        routine?.executeGrantedToAuthenticated === false &&
        routine?.executeGrantedToServiceRole === false
      );
    case 10:
      return (
        routine?.installed === true &&
        isNonEmptyString(routine?.generatedProductionVersion) &&
        candidate.activationRoutineMigrationApplied === true &&
        routine?.executeGrantedToPublic === false &&
        routine?.executeGrantedToAnon === false &&
        routine?.executeGrantedToAuthenticated === false &&
        routine?.executeGrantedToServiceRole === false &&
        activationDatabaseVerification?.registeredMutableRpcCount === 59 &&
        activationDatabaseVerification?.leakedMutableRpcCount === 0 &&
        activationDatabaseVerification?.aiLiveCalls === false &&
        activationDatabaseVerification?.externalFlagsFalse === true &&
        activationDatabaseVerification?.relevantWorkRowCount === 0 &&
        activationDatabaseVerification?.outboundHttpRowCount === 0 &&
        activationDatabaseVerification?.activationAuditEventCount === 0
      );
    case 11:
      return (
        activationCloseout?.completed === true &&
        activationCloseout?.unchangedBytesVerified === true &&
        activationCloseout?.actualLedgerVersion === "20260809051616" &&
        activationCloseout?.actualLedgerFilename ===
          "20260809051616_guarded_internal_ai_activation_v1.sql" &&
        activationCloseout?.pullRequest ===
          INTERNAL_AI_RELEASE_EVIDENCE.pullRequest &&
        activationCloseout?.exactHead === INTERNAL_AI_RELEASE_EVIDENCE.exactHead &&
        activationCloseout?.exactTree === INTERNAL_AI_RELEASE_EVIDENCE.exactTree &&
        activationCloseout?.mergedCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
        activationCloseout?.allFourExactHeadWorkflowsGreen === true &&
        activationCloseout?.zeroUnresolvedReviewThreads === true &&
        sameJson(
          activationCloseout?.workflows,
          INTERNAL_AI_RELEASE_EVIDENCE.workflows,
        ) &&
        activationCloseoutGitHubRelease?.pullRequest ===
          INTERNAL_AI_RELEASE_EVIDENCE.pullRequest &&
        activationCloseoutGitHubRelease?.openingHead ===
          GUARDED_ROLLOUT_OPENING_DRAFT_HEAD &&
        activationCloseoutGitHubRelease?.exactHead ===
          INTERNAL_AI_RELEASE_EVIDENCE.exactHead &&
        activationCloseoutGitHubRelease?.exactTree ===
          INTERNAL_AI_RELEASE_EVIDENCE.exactTree &&
        activationCloseoutGitHubRelease?.mergedCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
        activationCloseoutGitHubRelease?.allFourExactHeadWorkflowsGreen ===
          true &&
        activationCloseoutGitHubRelease?.zeroUnresolvedReviewThreads === true &&
        sameJson(
          activationCloseoutGitHubRelease?.workflows,
          INTERNAL_AI_RELEASE_EVIDENCE.workflows,
        )
      );
    case 12:
      return (
        secondHeld?.mergedGitHubCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
        secondHeld?.sitesVersion === INTERNAL_AI_RELEASE_EVIDENCE.sitesVersion &&
        secondHeld?.sitesVersionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId &&
        secondHeld?.sitesSourceCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit &&
        secondHeld?.sitesSourceSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceSha256 &&
        secondHeld?.sitesArchiveSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256 &&
        secondHeld?.holdReverified === true &&
        secondHeld?.aiLiveCalls === false &&
        secondHeld?.externalFlagsFalse === true &&
        secondRuntimeParity?.mergedGitHubCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
        secondRuntimeParity?.sitesVersion ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesVersion &&
        secondRuntimeParity?.sitesVersionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId &&
        secondRuntimeParity?.sitesSourceCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit &&
        secondRuntimeParity?.sitesSourceSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceSha256 &&
        secondRuntimeParity?.sitesArchiveSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256 &&
        secondRuntimeParity?.sitesArchiveFileCount ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveFileCount &&
        secondRuntimeParity?.sitesArchiveByteLength ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveByteLength &&
        secondRuntimeParity?.holdReverifiedBeforeActivation === true &&
        secondRuntimeParity?.preActivationRegisteredRpcCount === 59 &&
        secondRuntimeParity?.preActivationLeakedRpcCount === 0 &&
        secondRuntimeParity?.preActivationRelevantWorkRowCount === 0 &&
        secondRuntimeParity?.preActivationOutboundHttpRowCount === 0
      );
    case 13:
      return (
        secondHeld?.edgeFunctionVersion ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionVersion &&
        secondHeld?.edgeFunctionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionId &&
        secondHeld?.edgeBundleSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256 &&
        secondHeld?.verified === true &&
        secondHeld?.holdReverified === true &&
        secondHeld?.aiLiveCalls === false &&
        secondHeld?.externalFlagsFalse === true &&
        secondRuntimeParity?.edgeFunctionVersion ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionVersion &&
        secondRuntimeParity?.edgeFunctionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionId &&
        secondRuntimeParity?.edgeBundleSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256
      );
    case 14:
      return (
        routine?.installed === true &&
        routine?.invoked === true &&
        routine?.gateReady === false &&
        routine?.invocationGateConsumed === true &&
        candidate.activationExecuted === true &&
        candidate.activationGateReady === false &&
        candidate.activationAuthorizationConsumed === true &&
        manifest.activationState.activationRoutineInstalled === true &&
        manifest.activationState.activationRoutineInvoked === true &&
        manifest.activationState.scopedInternalAiActivationAuthorizationConsumed ===
          true &&
        manifest.activationState.momoActivationExecuted === false &&
        execution?.invoked === true &&
        execution?.invokedAt === INTERNAL_AI_RELEASE_EVIDENCE.invokedAt &&
        execution?.activationAuditEventId ===
          INTERNAL_AI_RELEASE_EVIDENCE.activationAuditEventId &&
        execution?.aiLiveCallsAfter === true &&
        execution?.externalFlagsFalseAfter === true &&
        execution?.boundMergedGitHubCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
        execution?.boundSitesVersion ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesVersion &&
        execution?.boundSitesVersionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId &&
        execution?.boundSitesSourceCommit ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit &&
        execution?.boundSitesSourceSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceSha256 &&
        execution?.boundSitesArchiveSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256 &&
        execution?.boundEdgeFunctionVersion ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionVersion &&
        execution?.boundEdgeFunctionId ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionId &&
        execution?.boundEdgeBundleSha256 ===
          INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256 &&
        execution?.registeredRpcCount === 59 &&
        execution?.missingRpcCount === 0 &&
        execution?.grantMismatchCount === 0 &&
        execution?.anonGrantCount === 0 &&
        execution?.authenticatedGrantCount === 13 &&
        execution?.serviceRoleGrantCount === 32 &&
        execution?.remainingHeldCount === 14 &&
        execution?.activationRoutineAppRoleGrantCount === 0 &&
        execution?.relevantWorkBeforeActivation === 0 &&
        execution?.relevantWorkAfterActivation === 0 &&
        execution?.outboundHttpRowsAfterActivation === 0 &&
        execution?.activationAuditEventCount === 1
      );
    case 15:
      return (
        execution?.authenticatedSmokePassed === true &&
        execution?.authenticatedSmokeActiveTeamProfileCount === 1 &&
        execution?.authenticatedSmokeActiveMomoMembershipCount === 1 &&
        execution?.authenticatedSmokeReadOnlyRpcExecuteCount === 3 &&
        execution?.authenticatedSmokeActivationExecute === false &&
        execution?.authenticatedSmokeDirectCandidateInsertPrivilege === false &&
        execution?.authenticatedSmokeReadyRowCount === 0 &&
        execution?.authenticatedSmokeReadyRowsExternalLocked === true &&
        execution?.authenticatedSmokeUploadStatusRowCount === 2 &&
        execution?.authenticatedSmokeUploadRowsExternalLocked === true &&
        execution?.authenticatedSmokeMediaWindowRowCount === 0 &&
        execution?.directTableDenialVerified === true &&
        execution?.crossTenantDenialVerified === true &&
        execution?.budgetGuardVerified === true &&
        execution?.externalActionsRemainDisabled === true &&
        execution?.providerCallsObserved === 0 &&
        execution?.costLedgerRowCount === 0 &&
        execution?.costLedgerProviderCalledRowCount === 0 &&
        execution?.costLedgerAccountedMicrousd === 0 &&
        execution?.postActivationEdgeInvocationCount === 0 &&
        execution?.incrementalSpendUsd === 0 &&
        activationPostflightVerification?.registeredRpcCount === 59 &&
        activationPostflightVerification?.missingRpcCount === 0 &&
        activationPostflightVerification?.grantMismatchCount === 0 &&
        activationPostflightVerification?.anonGrantCount === 0 &&
        activationPostflightVerification?.authenticatedGrantCount === 13 &&
        activationPostflightVerification?.serviceRoleGrantCount === 32 &&
        activationPostflightVerification?.remainingHeldCount === 14 &&
        activationPostflightVerification?.activationRoutineAppRoleGrantCount ===
          0 &&
        activationPostflightVerification?.exactActivationEventPayloadVerified ===
          true &&
        activationPostflightVerification?.costLedgerRowCount === 0 &&
        activationPostflightVerification?.postActivationEdgeInvocationCount ===
          0 &&
        externalFlagsFalse
      );
    case 16:
      return (
        execution?.finalReleaseEvidenceRecorded === true &&
        candidate.fullReleaseGatePassed === true &&
        candidate.fullReleaseGateScope ===
          INTERNAL_AI_RELEASE_EVIDENCE.fullReleaseGateScope &&
        manifest.fullReleaseGatePassed === true &&
        manifest.fullReleaseGateScope ===
          INTERNAL_AI_RELEASE_EVIDENCE.fullReleaseGateScope &&
        candidate.sitesPublishRequired === false &&
        candidate.sitesPublishAuthorized === false &&
        candidate.edgeDeployAuthorized === false &&
        candidate.deploymentAuthorized === false &&
        candidate.activationAuthorized === false &&
        candidate.activationGateReady === false &&
        manifest.edgeCandidate?.deployAuthorized === false &&
        manifest.activationState.newIncrementalSpendApproved === false &&
        manifest.activationState.scopedInternalAiActivationAuthorized === false &&
        manifest.activationState.scopedInternalAiActivationAuthorizationConsumed ===
          true &&
        manifest.deploymentFreeze.activationGateReady === false &&
        manifest.deploymentFreeze.rolloutAuthorizationConsumed === true &&
        manifest.deploymentFreeze.deploymentAuthorized === false &&
        manifest.deploymentFreeze.activationAuthorized === false &&
        manifest.activationState.momoActivationExecuted === false &&
        externalFlagsFalse
      );
    default:
      return false;
  }
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
  const handoff = manifest.mediaUploadHandoff as
    | Record<string, unknown>
    | undefined;

  if (
    manifest.schemaVersion === 10 &&
    manifest.recordKind === "veroxa_guarded_internal_ai_rollout_manifest"
  ) {
    if (
      manifest.source.root !== DEPLOYABLE_SITES_SOURCE_ROOT ||
      manifest.source.mappingTarget !== DEPLOYABLE_SITES_MAPPING_TARGET ||
      manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
      !sameJson(
        manifest.source.generatedPathExclusions,
        GENERATED_PATH_EXCLUSIONS,
      )
    )
      failures.push(
        "deployable Sites source root, mapping target, hash algorithm, or exclusion policy drifted",
      );
    if (
      manifest.migrations.root !== ROOT_MIGRATION_SOURCE_ROOT ||
      manifest.migrations.mirrorRoot !== SITES_MIGRATION_MIRROR_ROOT ||
      manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM
    ) failures.push("canonical migration root or Sites mirror root drifted");

    const sourceTree = hashTree(resolve(repoRoot, DEPLOYABLE_SITES_SOURCE_ROOT), {
      exclusions: [...GENERATED_PATH_EXCLUSIONS],
    });
    const rootMigrationTree = hashTree(
      resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT),
      { suffix: ".sql" },
    );
    const mirrorMigrationTree = hashTree(
      resolve(repoRoot, SITES_MIGRATION_MIRROR_ROOT),
      { suffix: ".sql" },
    );
    const pending = candidate.pendingMigrations ?? [];
    const liveMigrationTree = hashTree(
      resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT),
      { exclusions: pending, suffix: ".sql" },
    );
    const latestSourceMigration = rootMigrationTree.files.at(-1);
    const latestLiveMigration = liveMigrationTree.files.at(-1);
    const steps = manifest.rolloutSequence?.steps ?? [];
    const completedPrefix = steps.findIndex((step) => !step.completed);
    const completedCount = completedPrefix < 0 ? steps.length : completedPrefix;
    const repairCloseout = closeouts?.repair;
    const activationCloseout = closeouts?.activation;
    const externalFlagsFalse =
      hold?.providerWrites === false &&
      hold?.reviewReplies === false &&
      hold?.websiteWrites === false &&
      hold?.externalScheduling === false;

    if (
      manifest.reviewedAt !== "2026-08-09" ||
      manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
      manifest.canonicalBranch !== "main" ||
      manifest.sitesProjectId !==
        "appgprj_6a53d07c7c28819182801cf35dfd30de"
    ) failures.push("guarded rollout identity drifted");
    if (
      manifest.releaseState !== GUARDED_ROLLOUT_RELEASE_STATE ||
      manifest.candidateRevision !== GUARDED_ROLLOUT_CANDIDATE_REVISION ||
      manifest.candidateBranch !== GUARDED_ROLLOUT_CANDIDATE_BRANCH ||
      live.canonicalGitHubMainCommit !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedMainCommit ||
      live.canonicalGitHubMainMergePullRequest !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedPullRequest ||
      live.canonicalGitHubMainCommitScope !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.operationalSourceCommitScope ||
      candidate.basedOnGitHubMainCommit !==
        GUARDED_ROLLOUT_CANDIDATE_BASE_COMMIT ||
      candidate.pullRequest !== GUARDED_ROLLOUT_PULL_REQUEST ||
      candidate.observedDraftPullRequestHead !==
        GUARDED_ROLLOUT_OPENING_DRAFT_HEAD ||
      candidate.observedDraftPullRequestTree !==
        GUARDED_ROLLOUT_OPENING_DRAFT_TREE ||
      candidate.draftHeadEvidenceScope !==
        GUARDED_ROLLOUT_DRAFT_EVIDENCE_SCOPE ||
      repairCloseout?.pullRequest !== REPAIR_CLOSEOUT_PULL_REQUEST
    ) failures.push("guarded rollout release lineage drifted from reviewed constants");
    if (
      sourceTree.fileCount !== manifest.source.fileCount ||
      sourceTree.sha256 !== manifest.source.treeSha256
    ) failures.push("Sites source fingerprint drifted");
    if (
      rootMigrationTree.fileCount !== mirrorMigrationTree.fileCount ||
      rootMigrationTree.sha256 !== mirrorMigrationTree.sha256 ||
      !sameJson(rootMigrationTree.files, mirrorMigrationTree.files) ||
      manifest.migrations.fileCount !== rootMigrationTree.fileCount ||
      manifest.migrations.treeSha256 !== rootMigrationTree.sha256 ||
      manifest.migrations.mirrorFileCount !== mirrorMigrationTree.fileCount ||
      manifest.migrations.mirrorTreeSha256 !== mirrorMigrationTree.sha256 ||
      !latestSourceMigration
    ) failures.push("root/Sites migration source truth drifted");
    if (
      live.productionMigrationCount !== liveMigrationTree.fileCount ||
      live.migrationTreeSha256 !== liveMigrationTree.sha256 ||
      live.latestProductionMigration !== latestLiveMigration ||
      !latestLiveMigration ||
      live.latestProductionMigrationByteLength !== statSync(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        latestLiveMigration,
      )).size ||
      live.latestProductionMigrationSha256 !== sha256File(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        latestLiveMigration,
      )) ||
      live.candidateMigrationsMatchLiveLedger !== (pending.length === 0)
    ) failures.push("observed production migration evidence drifted");
    if (
      !handoff ||
      !latestSourceMigration ||
      handoff.status !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.status ||
      handoff.baseMainCommit !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.baseMainCommit ||
      handoff.baseMainPullRequest !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.baseMainPullRequest ||
      handoff.candidateBranch !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.candidateBranch ||
      handoff.reviewedHead !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedHead ||
      handoff.reviewedTree !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedTree ||
      handoff.mergedPullRequest !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedPullRequest ||
      handoff.mergedMainCommit !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedMainCommit ||
      handoff.allFourExactHeadWorkflowsGreen !== true ||
      handoff.zeroUnresolvedReviewThreads !== true ||
      handoff.closeoutPullRequest !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.closeoutPullRequest ||
      handoff.closeoutEvidenceOnly !== true ||
      handoff.sitesVersion !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersion ||
      handoff.sitesVersionId !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersionId ||
      handoff.sitesSourceCommit !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesSourceCommit ||
      handoff.sitesArchiveSha256 !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesArchiveSha256 ||
      handoff.sitesEnvironmentRevision !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesEnvironmentRevision ||
      handoff.liveSitesSourceTreeSha256 !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.liveSitesSourceTreeSha256 ||
      handoff.candidateSourceFileCount !== sourceTree.fileCount ||
      handoff.candidateSourceTreeSha256 !== sourceTree.sha256 ||
      handoff.migrationFileCount !== rootMigrationTree.fileCount ||
      handoff.migrationTreeSha256 !== rootMigrationTree.sha256 ||
      !latestSourceMigration ||
      handoff.latestMigration !== latestSourceMigration ||
      handoff.latestMigrationByteLength !== statSync(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        latestSourceMigration,
      )).size ||
      handoff.latestMigrationSha256 !== sha256File(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        latestSourceMigration,
      )) ||
      handoff.clientActionAfterUpload !== "none" ||
      handoff.processingOwner !== "veroxa_team" ||
      handoff.legacyV2AuthenticatedExecute !== false ||
      handoff.v3AuthenticatedExecute !== true ||
      handoff.teamProcessorAvailable !== true ||
      handoff.savedInstructionCount !== 0 ||
      handoff.instructionApplicationCount !== 0 ||
      handoff.unverifiedSavedUploadCount !== 3 ||
      handoff.openMediaIntakeExceptionCount !== 3 ||
      handoff.allMediaIntakeExceptionsExternalLocked !== true ||
      handoff.existingUploadRequiresClientRetry !== false ||
      handoff.preFixInstructionRecoverable !== false ||
      handoff.bridgeKeyRotated !== true ||
      handoff.applicationTestsPassed !== 431 ||
      handoff.applicationTestsTotal !== 431 ||
      live.sitesVersion !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersion ||
      live.sitesVersionId !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersionId ||
      live.sitesCheckoutCommit !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesSourceCommit ||
      live.sourceFileCount !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.liveSitesSourceFileCount ||
      live.sourceTreeSha256 !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.liveSitesSourceTreeSha256 ||
      live.productionMigrationCount !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.migrationFileCount ||
      live.migrationTreeSha256 !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.migrationTreeSha256 ||
      live.latestProductionMigration !==
        MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration ||
      live.githubParityVerifiedAtObservation !== true ||
      live.githubMainMatchesCandidate !== true ||
      live.candidateSourceMatchesLiveSites !== true ||
      live.candidateMigrationsMatchLiveLedger !== true ||
      live.fullReleaseGatePassed !== true
    ) failures.push("Momo media one-step handoff evidence drifted");
    if (
      pending.some((filename) => !rootMigrationTree.files.includes(filename)) ||
      candidate.databaseMigrationApplied !== (pending.length === 0) ||
      candidate.databaseChangesRequired !== (pending.length > 0) ||
      candidate.additionalDatabaseChangesRequired !== (pending.length > 0)
    ) failures.push("pending/applied migration state drifted");
    if (
      !repairCloseout ||
      repairCloseout.sourceSha256 !== REPAIR_MIGRATION_EVIDENCE.sha256 ||
      repairCloseout.actualLedgerFilename !== REPAIR_MIGRATION_EVIDENCE.filename ||
      repairCloseout.actualLedgerVersion !== "20260809035302" ||
      repairCloseout.sourceByteLength !== REPAIR_MIGRATION_EVIDENCE.byteLength ||
      repairCloseout.submittedQueryTransportByteLength !== 59_053 ||
      repairCloseout.transportTrailingNewlineDeltaBytes !== 1 ||
      repairCloseout.databaseLedgerStoresSqlBytes !== false ||
      repairCloseout.unchangedBytesVerified !== true ||
      (repairCloseout.completed === true
        ? typeof repairCloseout.mergedCommit !== "string"
        : repairCloseout.mergedCommit !== null) ||
      !existsSync(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        REPAIR_MIGRATION_EVIDENCE.filename,
      )) ||
      sha256File(resolve(
        repoRoot,
        ROOT_MIGRATION_SOURCE_ROOT,
        REPAIR_MIGRATION_EVIDENCE.filename,
      )) !== REPAIR_MIGRATION_EVIDENCE.sha256
    ) failures.push("repair generated-version closeout drifted");
    if (
      !externalFlagsFalse ||
      manifest.deploymentFreeze.automaticDeploymentsAllowed ||
      edge?.providerCallObserved !== false ||
      edge?.realUploadObserved !== false ||
      edgeCandidate?.providerCallObserved !== false ||
      edgeCandidate?.realUploadObserved !== false
    ) failures.push("external-action freeze drifted");
    if (
      !routine ||
      routine.postgresOnly !== true ||
      routine.executeGrantedToPublic !== false ||
      routine.executeGrantedToAnon !== false ||
      routine.executeGrantedToAuthenticated !== false ||
      routine.executeGrantedToServiceRole !== false ||
      routine.invocationRestoresOnlySourceDefinedGrants !== true ||
      routine.invocationSetsOnlyAiLiveCallsTrue !== true ||
      routine.invocationReassertsEveryExternalFlagFalse !== true
    ) failures.push("postgres-only activation boundary drifted");
    if (
      candidate.activationExecuted
        ? hold?.aiLiveCalls !== true || routine?.invoked !== true
        : hold?.aiLiveCalls !== false ||
          hold?.registeredMutableRpcAclHoldVerified !== true ||
          hold?.postCorrectionLeakedRpcCount !== 0
    ) failures.push("runtime activation/hold state drifted");
    if (
      steps.length !== EXPECTED_ROLLOUT_STEP_IDS.length ||
      steps.some((step, index) =>
        step.order !== index + 1 ||
        step.id !== EXPECTED_ROLLOUT_STEP_IDS[index] ||
        !step.explicitReviewRequired ||
        step.requiresCompletedStep !==
          (index === 0 ? null : EXPECTED_ROLLOUT_STEP_IDS[index - 1]) ||
        (index < completedCount ? !step.completed : step.completed)
      )
    ) failures.push("rollout completion is not one contiguous reviewed prefix");
    for (const [index, step] of steps.entries()) {
      if (step.completed && !completedRolloutStageHasEvidence(manifest, index)) {
        failures.push(
          ROLLOUT_STAGE_EVIDENCE_FAILURES[index] ??
            `step ${index + 1} completed without mapped evidence`,
        );
      }
    }
    if (
      !activationCloseout ||
      (activationCloseout.completed === true &&
        (activationCloseout.unchangedBytesVerified !== true ||
          typeof activationCloseout.actualLedgerVersion !== "string" ||
          typeof activationCloseout.actualLedgerFilename !== "string"))
    ) failures.push("activation generated-version closeout drifted");
    if (failures.length > 0) {
      throw new Error(
        "Unsafe schema-10 guarded rollout manifest: " + failures.join("; "),
      );
    }
    return;
  }

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


export function assertCurrentReconciliationManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  const live = manifest.currentProductionObservation;
  const candidate = manifest.releaseCandidate;
  const candidateRecord = candidate as unknown as Record<string, unknown>;
  const handoff = manifest.mediaUploadHandoff as
    | Record<string, unknown>
    | undefined;
  const hold = manifest.operationalHold;
  const sourceTree = hashTree(resolve(repoRoot, DEPLOYABLE_SITES_SOURCE_ROOT), {
    exclusions: [...GENERATED_PATH_EXCLUSIONS],
  });
  const rootMigrationTree = hashTree(resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT), {
    suffix: ".sql",
  });
  const mirrorMigrationTree = hashTree(resolve(repoRoot, SITES_MIGRATION_MIRROR_ROOT), {
    suffix: ".sql",
  });
  const latestMigration = rootMigrationTree.files.at(-1);
  const purgeSource = resolve(
    repoRoot,
    ROOT_MIGRATION_SOURCE_ROOT,
    "../functions/veroxa-legacy-media-purge-20260812/index.ts",
  );
  const externalLocks =
    hold?.providerWrites === false &&
    hold?.reviewReplies === false &&
    hold?.websiteWrites === false &&
    hold?.externalScheduling === false;

  if (
    manifest.schemaVersion !== 11 ||
    manifest.recordKind !== "veroxa_momo_live55_v52_reconciliation_manifest" ||
    manifest.releaseState !==
      "live55_sites_v52_high_resolution_reconciled_external_actions_held" ||
    manifest.reviewedAt !== "2026-08-12" ||
    manifest.candidateRevision !==
      "momo_live55_sites_v52_high_resolution_reconciliation_2026-08-12" ||
    manifest.candidateBranch !== "agent/v51-production-reconciliation" ||
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.sitesProjectId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) failures.push("schema-11 v52/live55 reconciliation identity drifted");

  if (
    sourceTree.fileCount !== 225 ||
    sourceTree.sha256 !==
      "7f7a16864d3424581b1f04ee07501909850c9e7a7f682657208e40ba801d8adf" ||
    manifest.source.fileCount !== sourceTree.fileCount ||
    manifest.source.treeSha256 !== sourceTree.sha256 ||
    rootMigrationTree.fileCount !== 55 ||
    rootMigrationTree.sha256 !==
      "8010eaf8a8936b6d450b0d6161308ed705560dc338705f335202243bfc26fc56" ||
    mirrorMigrationTree.fileCount !== rootMigrationTree.fileCount ||
    mirrorMigrationTree.sha256 !== rootMigrationTree.sha256 ||
    JSON.stringify(rootMigrationTree.files) !==
      JSON.stringify(mirrorMigrationTree.files) ||
    manifest.migrations.fileCount !== rootMigrationTree.fileCount ||
    manifest.migrations.treeSha256 !== rootMigrationTree.sha256 ||
    manifest.migrations.mirrorFileCount !== mirrorMigrationTree.fileCount ||
    manifest.migrations.mirrorTreeSha256 !== mirrorMigrationTree.sha256 ||
    sha256File(purgeSource) !==
      "6d928ef8c06d1c97441080637467837ed309ac37f4f1285c1630c987a957bab5"
  ) failures.push("schema-11 source, migration, or purge-tombstone fingerprint drifted");

  if (
    live.evidenceStatus !==
      "sites_v52_database55_high_resolution_media_reconciled_storage_clean_external_actions_held" ||
    live.canonicalGitHubMainCommit !==
      "fb6d8b13bf548fd144cec4ce241bd44c1cecc99f" ||
    live.canonicalGitHubMainMergePullRequest !== 179 ||
    live.sitesVersion !== 52 ||
    live.sitesVersionId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_84a25fdf11c8819189afc4ffa78691b8" ||
    live.sitesCheckoutCommit !==
      "f0d88e3246d3c23c5d7610ca07f94640c856e722" ||
    live.sitesEnvironmentRevision !== 14 ||
    live.sitesArchiveFileCount !== 52 ||
    live.sitesArchiveByteLength !== 6041600 ||
    live.sitesArchiveSha256 !==
      "60c9e2b83d7b6ce0dd84bd16fc8fbf11b98f814d86932342c11388aac3b7d62b" ||
    live.sourceFileCount !== sourceTree.fileCount ||
    live.sourceTreeSha256 !== sourceTree.sha256 ||
    live.productionMigrationCount !== 55 ||
    live.migrationTreeSha256 !== rootMigrationTree.sha256 ||
    live.latestProductionMigration !==
      "20260812214257_high_resolution_private_media_v1.sql" ||
    live.latestProductionMigrationByteLength !== 11103 ||
    live.latestProductionMigrationSha256 !==
      "3e8471bc4216a67fd591b5b611388be2873e44eb87c957934b280681d7bfe065" ||
    live.githubMainMatchesCandidate !== false ||
    live.candidateSourceMatchesLiveSites !== true ||
    live.candidateMigrationsMatchLiveLedger !== true ||
    live.fullReleaseGatePassed !== true ||
    live.mediaCleanup?.storageObjectCount !== 0 ||
    live.mediaCleanup?.mediaAssetCount !== 0 ||
    live.mediaCleanup?.mediaRenditionCount !== 0 ||
    live.mediaCleanup?.nonterminalWorkCount !== 0 ||
    live.mediaCleanup?.completedCleanupAuditEventCount !== 1
  ) failures.push("schema-11 live v52/live55 or cleanup observation drifted");

  if (
    candidate.status !== manifest.releaseState ||
    candidate.actionScope !==
      "bounded_high_resolution_media_and_storage_cleanup_reconciliation_preserving_external_action_locks" ||
    candidate.basedOnGitHubMainCommit !==
      "fb6d8b13bf548fd144cec4ce241bd44c1cecc99f" ||
    candidate.pullRequest !== 181 ||
    candidate.pullRequestDraft !== false ||
    candidate.githubMerged !== false ||
    candidate.futureMergedGitHubCommit !== null ||
    candidate.futureSitesVersion !== 52 ||
    candidate.reviewedLocally !== true ||
    candidate.sourceReviewPassed !== true ||
    candidate.qualityReviewPassed !== true ||
    candidateRecord.observedDraftPullRequestHead !==
      "b59ba5f1ef013aab2d36a3fd108a896b64e5bfd8" ||
    candidateRecord.observedDraftPullRequestTree !==
      "6246edeea1d1ec8dc8fd5880c4fc7867001fefb5" ||
    candidate.allFourWorkflowsGreen !== true ||
    candidate.zeroUnresolvedReviewThreads !== true ||
    JSON.stringify(candidateRecord.allFourExactHeadWorkflows) !==
      JSON.stringify(MEDIA_UPLOAD_HANDOFF_EVIDENCE.allFourExactHeadWorkflows) ||
    candidate.candidateSourceMatchesLiveSites !== true ||
    candidate.candidateMigrationsMatchLiveLedger !== true ||
    candidate.githubMainMatchesCandidate !== false ||
    candidate.fullReleaseGatePassed !== false ||
    (candidate.pendingMigrations ?? []).length !== 0 ||
    candidate.sourceFileCount !== sourceTree.fileCount ||
    candidate.sourceTreeSha256 !== sourceTree.sha256 ||
    candidate.migrationFileCount !== rootMigrationTree.fileCount ||
    candidate.migrationTreeSha256 !== rootMigrationTree.sha256 ||
    candidate.latestCandidateMigration !== latestMigration ||
    candidate.latestCandidateMigrationSha256 !==
      sha256File(resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT, latestMigration!)) ||
    candidate.databaseChangesRequired !== false ||
    candidate.databaseMigrationApplied !== true ||
    candidate.sitesPublishRequired !== false ||
    candidate.sitesPublished !== true ||
    candidate.deploymentAuthorized !== false
  ) failures.push("schema-11 PR #181 candidate or hold boundary drifted");

  if (
    !handoff ||
    JSON.stringify(handoff) !==
      JSON.stringify(MEDIA_UPLOAD_HANDOFF_EVIDENCE) ||
    handoff.applicationTestsPassed !== 437 ||
    handoff.applicationTestsTotal !== 437 ||
    handoff.unverifiedSavedUploadCount !== 0 ||
    handoff.openMediaIntakeExceptionCount !== 0 ||
    handoff.storageObjectCount !== 0 ||
    handoff.mediaRenditionCount !== 0 ||
    handoff.cleanupAuditEventCount !== 1 ||
    (handoff.purgeEndpoint as Record<string, unknown> | undefined)
      ?.verifyJwt !== true ||
    (handoff.purgeEndpoint as Record<string, unknown> | undefined)
      ?.version !== 11 ||
    (handoff.highResolutionUploadContract as
      | Record<string, unknown>
      | undefined)?.totalPixelCeiling !== null ||
    (handoff.highResolutionUploadContract as
      | Record<string, unknown>
      | undefined)?.boundedDecodePreserved !== true
  ) failures.push("schema-11 handoff, cleanup, or high-resolution contract drifted");

  const quality = manifest.applicationQualityEvidence;
  if (
    !quality ||
    quality.testsTotal !== 437 ||
    quality.testsPassed !== 437 ||
    quality.testsFailed !== 0 ||
    quality.buildExitCode !== 0 ||
    quality.typecheckExitCode !== 0 ||
    quality.lintExitCode !== 0 ||
    quality.lintErrorCount !== 0 ||
    !externalLocks
  ) failures.push("schema-11 quality evidence or external-action lock drifted");

  if (failures.length > 0) {
    throw new Error(
      "Unsafe schema-11 live55/Sites-v52 reconciliation manifest: " +
        failures.join("; "),
    );
  }
}

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  if (manifest.schemaVersion === 11) {
    assertCurrentReconciliationManifest(manifest);
    return;
  }
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
  if (manifest.schemaVersion === 11) {
    assertCurrentReconciliationManifest(manifest);
    const quality = manifest.applicationQualityEvidence;
    if (!quality || quality.testsTotal !== 437 || quality.testsPassed !== 437 || quality.testsFailed !== 0 || !manifest.releaseCandidate.reviewedLocally || manifest.releaseCandidate.sourceReviewPassed !== true || manifest.releaseCandidate.qualityReviewPassed !== true) throw new Error("Schema-11 reconciliation lacks reviewed source or 437-test evidence");
    return;
  }
  assertUnreleasedLocalCandidateManifest(manifest);
  if (manifest.recordKind === "veroxa_guarded_internal_ai_rollout_manifest") {
    const quality = manifest.applicationQualityEvidence;
    const pending = manifest.releaseCandidate.pendingMigrations ?? [];
    const dormantActivationReviewPending =
      pending.length === 1 &&
      manifest.activationRoutine?.installed === false &&
      manifest.activationRoutine?.migrationFilename === pending[0];
    const hostedDatabaseReviewComplete =
      manifest.databaseContractReview?.hostedCleanChainApplyPassed === true &&
      manifest.databaseContractReview?.hostedFullPgTapPassed === true &&
      manifest.databaseContractReview?.hostedDatabaseExecutionPassed === true;
    if (
      !quality ||
      !Number.isSafeInteger(quality.testsTotal) ||
      !Number.isSafeInteger(quality.testsPassed) ||
      !Number.isSafeInteger(quality.testsFailed) ||
      quality.testsTotal !== REVIEWED_APPLICATION_TEST_TOTAL ||
      quality.testsTotal <= 0 ||
      quality.testsPassed !== REVIEWED_APPLICATION_TEST_TOTAL ||
      quality.testsFailed !== 0
    ) {
      throw new Error(
        `Reviewed application evidence must contain exactly ${REVIEWED_APPLICATION_TEST_TOTAL} passing tests; 0/0 is not evidence`,
      );
    }
    if (
      !manifest.releaseCandidate.reviewedLocally ||
      manifest.releaseCandidate.sourceReviewPassed !== true ||
      manifest.releaseCandidate.qualityReviewPassed !== true ||
      quality.buildExitCode !== 0 ||
      quality.typecheckExitCode !== 0 ||
      quality.lintExitCode !== 0 ||
      (dormantActivationReviewPending
        ? manifest.databaseContractReview?.localStaticReviewPassed !== true
        : !hostedDatabaseReviewComplete)
    ) {
      throw new Error(
        "Guarded rollout lacks reviewed source, application, or hosted database evidence",
      );
    }
    return;
  }
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
