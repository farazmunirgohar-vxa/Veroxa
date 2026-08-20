import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
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
export const currentStatePath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/CURRENT_STATE.json",
);
export const MEDIA_INSPECTION_PREFLIGHT_MIGRATION =
  "20260815090000_media_inspection_preflight_canary_v1.sql";
const ACTIVE_MEDIA_INSPECTION_CANDIDATE_BASE_COMMIT =
  "a28c4735b668775dbc54e3c920b409325ef8201d";
const ACTIVE_MEDIA_INSPECTION_CANDIDATE_ALLOWED_PATHS = new Set([
  ".github/workflows/ci.yml",
  ".github/workflows/supabase-verify.yml",
  ".github/workflows/veroxa-verify.yml",
  "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  "artifacts/veroxa-sites/app/api/internal/momo/media/recover/route.ts",
  "artifacts/veroxa-sites/app/api/internal/veroxa/media/inspection-preflight/core.ts",
  "artifacts/veroxa-sites/app/api/internal/veroxa/media/inspection-preflight/route.ts",
  "artifacts/veroxa-sites/app/api/media/assessment/core.ts",
  "artifacts/veroxa-sites/app/api/media/assessment/route.ts",
  "artifacts/veroxa-sites/app/api/media/finalize/core.ts",
  "artifacts/veroxa-sites/app/api/media/finalize/route.ts",
  "artifacts/veroxa-sites/app/momo-image-bytes.ts",
  "artifacts/veroxa-sites/app/veroxa-private-media-image-decode.ts",
  "artifacts/veroxa-sites/app/veroxa-private-media-supabase-image-decode.ts",
  "artifacts/veroxa-sites/supabase/migrations/20260815090000_media_inspection_preflight_canary_v1.sql",
  "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  "artifacts/veroxa-sites/tests/veroxa-media-inspection-preflight.test.mjs",
  "artifacts/veroxa-sites/worker/index.ts",
  "artifacts/veroxa/docs/CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_STATE.json",
  "artifacts/veroxa/docs/FINDINGS_LEDGER.json",
  "artifacts/veroxa/docs/PRODUCT_CONSTITUTION.md",
  "artifacts/veroxa/docs/history/2026-08-15-phase-0-baseline.json",
  "artifacts/veroxa/docs/history/2026-08-15-phase-1-preflight-fixture-failure.json",
  "artifacts/veroxa/docs/history/2026-08-15-phase-1-storage-transform-request-rejected.json",
  "scripts/src/check-chatgpt-sites-migration-source-truth.ts",
  "scripts/src/check-deployment-manifest.ts",
  "scripts/src/check-release-workflow-policy.ts",
  "scripts/src/check-rr-release-checkpoint.ts",
  "scripts/src/check-sites-only-deployment.ts",
  "scripts/src/check-supabase-migration-ledger.ts",
  "scripts/src/generate-deployment-attestation.ts",
  "scripts/src/release-manifest.ts",
  "supabase/migrations/20260815090000_media_inspection_preflight_canary_v1.sql",
]);
const ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_COMMIT =
  "921e197ee27d1d2cc673e7c75c79ae1770fa6d33";
const ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_TREE =
  "6445d25718fee4fc4321b9336302d604ad623fc3";
const ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_ALLOWED_PATHS = new Set([
  "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  "artifacts/veroxa/docs/CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_STATE.json",
  "artifacts/veroxa/docs/FINDINGS_LEDGER.json",
  "artifacts/veroxa/docs/history/2026-08-15-phase-2-img4257-controlled-retry.json",
  "scripts/src/check-chatgpt-sites-migration-source-truth.ts",
  "scripts/src/check-deployment-manifest.ts",
  "scripts/src/check-sites-only-deployment.ts",
  "scripts/src/check-supabase-migration-ledger.ts",
  "scripts/src/generate-deployment-attestation.ts",
  "scripts/src/release-manifest.ts",
]);
const ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_COMMIT =
  "a05e7a79b2c527ff93a4c3810afc6ada193fce6c";
const ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_TREE =
  "a0c26f7df224ec00d366edc8e7f38f8e829999d2";
const PREINTERVENTION_ACCEPTANCE_MIGRATION =
  "20260815191500_veroxa_preintervention_acceptance_v1.sql";
const PREINTERVENTION_ACCEPTANCE_PGTAP =
  "veroxa_preintervention_acceptance_v1.sql";
const ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_ALLOWED_PATHS = new Set([
  ".github/workflows/supabase-verify.yml",
  "AGENTS.md",
  "artifacts/veroxa-sites/app/account-security.tsx",
  "artifacts/veroxa-sites/app/account/security/page.tsx",
  "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  "artifacts/veroxa-sites/app/api/internal/momo/media/recover/route.ts",
  "artifacts/veroxa-sites/app/api/internal/veroxa/media/inspection-preflight/core.ts",
  "artifacts/veroxa-sites/app/api/media/finalize/core.ts",
  "artifacts/veroxa-sites/app/api/media/finalize/route.ts",
  "artifacts/veroxa-sites/app/client/[[...slug]]/page.tsx",
  "artifacts/veroxa-sites/app/momo-client-data.ts",
  "artifacts/veroxa-sites/app/momo-client-portal.tsx",
  "artifacts/veroxa-sites/app/momo-media-finalize-client.ts",
  "artifacts/veroxa-sites/app/momo-operating-center.tsx",
  "artifacts/veroxa-sites/app/page.tsx",
  "artifacts/veroxa-sites/app/veroxa-supabase-server.ts",
  "artifacts/veroxa-sites/app/veroxa-supabase.ts",
  "artifacts/veroxa-sites/supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  "artifacts/veroxa-sites/supabase/functions/momo-content-ai-lifecycle/index.ts",
  `artifacts/veroxa-sites/supabase/migrations/${PREINTERVENTION_ACCEPTANCE_MIGRATION}`,
  `artifacts/veroxa-sites/supabase/tests/${PREINTERVENTION_ACCEPTANCE_PGTAP}`,
  "artifacts/veroxa-sites/tests/momo-client-media-portal.test.mjs",
  "artifacts/veroxa-sites/tests/momo-client-media-upload.test.mjs",
  "artifacts/veroxa-sites/tests/momo-client-requests-contract.test.mjs",
  "artifacts/veroxa-sites/tests/momo-content-lifecycle-contract.test.mjs",
  "artifacts/veroxa-sites/tests/momo-media-guidance.test.mjs",
  "artifacts/veroxa-sites/tests/momo-media-finalize-client.test.mjs",
  "artifacts/veroxa-sites/tests/momo-media-finalize-route.test.mjs",
  "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  "artifacts/veroxa-sites/tests/momo-operating-ux.test.mjs",
  "artifacts/veroxa-sites/tests/momo-upload-veroxa-ready-v2-contract.test.mjs",
  "artifacts/veroxa-sites/tests/momo-v2-team-surface.test.mjs",
  "artifacts/veroxa-sites/tests/rendered-html.test.mjs",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_STATE.json",
  "artifacts/veroxa/docs/FINDINGS_LEDGER.json",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/history/2026-08-15-preintervention-phase-1-source-of-truth.json",
  "scripts/src/check-chatgpt-sites-migration-source-truth.ts",
  "scripts/src/generate-deployment-attestation.ts",
  "scripts/src/check-sites-momo-operating-contract.ts",
  "scripts/src/release-manifest.ts",
  "scripts/src/check-supabase-migration-ledger.ts",
  "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  "supabase/functions/momo-content-ai-lifecycle/index.ts",
  `supabase/migrations/${PREINTERVENTION_ACCEPTANCE_MIGRATION}`,
  `supabase/tests/${PREINTERVENTION_ACCEPTANCE_PGTAP}`,
]);

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
export const REVIEWED_APPLICATION_TEST_TOTAL = 433;
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
  "status": "live54_bridge_repaired_sites_v50_rights_attestation_repaired_external_actions_held",
  "baseMainCommit": "18d7030de8b0c2fe4fdab84e2679e643dfe8d3f1",
  "baseMainPullRequest": null,
  "candidateBranch": "agent/momo-live54-reconciliation",
  "reviewedHead": "8262ab6824dddbc9fb058b1500a2f8d0f2369851",
  "reviewedTree": "1afd667a936b5cd12df930b2341d9e9feeb4e6d2",
  "mergedPullRequest": null,
  "mergedMainCommit": null,
  "allFourExactHeadWorkflowsGreen": true,
  "zeroUnresolvedReviewThreads": true,
  "closeoutPullRequest": null,
  "closeoutEvidenceOnly": false,
  "sitesVersion": 50,
  "sitesVersionId": "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_435b68bbe9c08191bd9579825218fa5a",
  "sitesSourceCommit": "5dc88c25a9eab02a33ce8b357cc09d5b43d0af9e",
  "sitesArchiveFileCount": 52,
  "sitesArchiveByteLength": 6041600,
  "sitesArchiveSha256": "9aada7a54f6da92893b0ce551d3f03b2a970ad4e28de8beb8d17540e6edce1e2",
  "sitesEnvironmentRevision": 14,
  "liveSitesSourceFileCount": 222,
  "liveSitesSourceTreeSha256": "053cecab6ac5164f9f80d57f2d4f470f12cf2d4c92c7cd113a9ed7fc936bd8ec",
  "candidateSourceFileCount": 222,
  "candidateSourceTreeSha256": "053cecab6ac5164f9f80d57f2d4f470f12cf2d4c92c7cd113a9ed7fc936bd8ec",
  "migrationFileCount": 54,
  "migrationTreeSha256": "0d4566c0fddc5311a24a3ea44688e30bf05c347360a5ac36bbc336a038ca14ab",
  "latestMigration": "20260812042031_momo_team_content_ai_read_grants_v1.sql",
  "latestMigrationByteLength": 393,
  "latestMigrationSha256": "78d43d24a8249523a8866331598491e478950c7a7a8a35451b29839ccc777b96",
  "teamProcessorMigration": "20260809231409_momo_media_instruction_team_processing_v1.sql",
  "teamProcessorMigrationByteLength": 11720,
  "teamProcessorMigrationSha256": "3c4594c56a5260ce6b29eb85be46100c792512c6a47f35590ca8434dd68e02f2",
  "provisionalSitesMigration": "20260809223000_media_upload_instruction_handoff_v1.sql",
  "clientActionAfterUpload": "none",
  "processingOwner": "veroxa_team",
  "legacyV2AuthenticatedExecute": false,
  "v3AuthenticatedExecute": true,
  "teamProcessorAvailable": true,
  "savedInstructionCount": 0,
  "instructionApplicationCount": 0,
  "unverifiedSavedUploadCount": 3,
  "openMediaIntakeExceptionCount": 3,
  "allMediaIntakeExceptionsExternalLocked": true,
  "existingUploadRequiresClientRetry": false,
  "preFixInstructionRecoverable": false,
  "bridgeKeyRotated": true,
  "applicationTestsPassed": 433,
  "applicationTestsTotal": 433,
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
    }
  },
  "allFourExactHeadWorkflows": {
    "ci": {
      "runId": 31633030085,
      "status": "success"
    },
    "sitesVerify": {
      "runId": 31633030045,
      "status": "success"
    },
    "supabaseVerify": {
      "runId": 31633030057,
      "status": "success"
    },
    "veroxaVerify": {
      "runId": 31633030054,
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
  "operationalSourceCommitScope": "pre-reconciliation GitHub main; PR #179 carries the reviewed live54 candidate"
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
    "3da5191f7324e85e6441c9eb151a84b50f859d09d8e50d2fe3d709ac522326cc",
  ownerFixtureSha256:
    "b4dfd1f1f283b44ec2d20f2368af445569168a1c76991ba418824c0ffe0b1ad6",
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

type ActiveMediaInspectionCandidateState = {
  phase: string;
  production: {
    github?: {
      latestApplicationSourceCommit?: unknown;
      mainCommit?: unknown;
      mainTree?: unknown;
      latestMergedPullRequest?: unknown;
      pullRequest191?: Record<string, any>;
      mainProtected?: unknown;
    };
    sites?: {
      version?: unknown;
      versionId?: unknown;
      sourceCommit?: unknown;
      lastProvenVersion?: unknown;
      lastProvenDeploymentId?: unknown;
      lastProvenRepositoryTree?: unknown;
      lastProvenApplicationTree?: unknown;
      savedVersion?: unknown;
      savedVersionApplicationTree?: unknown;
      savedVersionLiveDeploymentProven?: unknown;
      pullRequest191LiveParityProven?: unknown;
    };
    supabase?: {
      migrationCount?: unknown;
      latestMigration?: unknown;
      appliedMigrationVersion?: unknown;
    };
  };
  asset?: { authorizedRetriesRemaining?: unknown };
  img4257?: Record<string, any>;
  currentVerdict?: unknown;
  syntheticAcceptance?: Record<string, unknown>;
  pr187?: Record<string, unknown>;
  externalActionCounts?: Record<string, unknown>;
  externalActionLock?: Record<string, unknown>;
  activeCandidate?: {
    kind?: unknown;
    branch?: unknown;
    state?: unknown;
    pendingMigrations?: unknown;
    migration?: {
      filename?: unknown;
      sha256?: unknown;
      candidateMigrationCount?: unknown;
      candidateMigrationTreeSha256?: unknown;
      productionBaselineMigrationCount?: unknown;
      productionBaselineMigrationTreeSha256?: unknown;
      byteLength?: unknown;
      applied?: unknown;
    };
    preflightMigrationStatus?: unknown;
    externalActionLockRequired?: unknown;
    img4257RetryConsumed?: unknown;
    basedOnGitHubMainCommit?: unknown;
    basedOnGitHubMainTree?: unknown;
    pullRequest?: unknown;
    reviewedHead?: unknown;
    mergeCommit?: unknown;
    sourceTree?: unknown;
    productionDeploymentId?: unknown;
    pgTap?: Record<string, any>;
    requiredGates?: Record<string, unknown>;
    img4257RetriesRemaining?: unknown;
  };
};

function readActiveMediaInspectionCandidateState():
  | ActiveMediaInspectionCandidateState
  | null {
  if (!existsSync(currentStatePath)) return null;
  try {
    const value = JSON.parse(readFileSync(currentStatePath, "utf8")) as
      | Record<string, unknown>
      | null;
    if (!value || value.schemaVersion !== 1 ||
      value.recordKind !== "veroxa_current_state" ||
      value.stateAuthority !==
        "current_deployed_state_and_explicit_forward_candidate" ||
      typeof value.phase !== "string" ||
      typeof value.activeCandidate !== "object" ||
      value.activeCandidate === null) return null;
    const candidate = value.activeCandidate as Record<string, unknown>;
    const isPreflightCandidate = value.phase.startsWith("phase_1_") &&
      candidate.kind === "media_inspection_runtime_repair" && [
        "local_verified_pending_pr_review_and_production_preflight",
        "remote_ci_green_pending_independent_review_and_production_preflight",
      ].includes(String(candidate.state));
    const isVerifierContractCandidate = value.phase ===
        "phase_2_img4257_retry_recorded_verifier_contract_repair_pending_pr_review" &&
      candidate.kind === "private_media_verifier_contract_repair" &&
      candidate.state ===
        "local_focused_test_passed_pending_pr_review_and_synthetic_production_proof";
    const isPreinterventionCandidate = value.phase ===
        "preintervention_acceptance_candidate_pending_exact_head_gates_and_live_proof" &&
      candidate.kind === "veroxa_preintervention_acceptance" &&
      candidate.state ===
        "local_candidate_pending_exact_head_ci_review_merge_migration_apply_deploy_and_production_proof";
    if (!isPreflightCandidate && !isVerifierContractCandidate &&
      !isPreinterventionCandidate) {
      return null;
    }
    return value as unknown as ActiveMediaInspectionCandidateState;
  } catch {
    return null;
  }
}

export function hasActiveMediaInspectionForwardCandidate(): boolean {
  return readActiveMediaInspectionCandidateState() !== null;
}

export function activeMediaInspectionForwardCandidateMigration(): string | null {
  const filename = readActiveMediaInspectionCandidateState()
    ?.activeCandidate?.migration?.filename;
  return typeof filename === "string" && /^[0-9]{14}_[a-z0-9_]+[.]sql$/u.test(filename)
    ? filename
    : null;
}

export function activeMediaInspectionPreflightMigrationIsApplied(): boolean {
  const candidate = readActiveMediaInspectionCandidateState()?.activeCandidate;
  return candidate?.preflightMigrationStatus === "applied";
}

function gitPathList(args: string[]): string[] {
  const output = execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output.split("\n").map((path) => path.trim()).filter(Boolean);
}

/**
 * The immutable schema-13 manifest can only be relaxed for this one exact
 * candidate.  Require its complete diff scope rather than letting a state
 * record accidentally turn off the normal source-tree identity check.
 */
function assertActiveMediaInspectionCandidateDiffScope(): void {
  let paths: string[];
  try {
    paths = Array.from(new Set([
      ...gitPathList([
        "diff",
        "--name-only",
        "--diff-filter=ACMRT",
        `${ACTIVE_MEDIA_INSPECTION_CANDIDATE_BASE_COMMIT}...HEAD`,
        "--",
      ]),
      ...gitPathList(["diff", "--name-only", "--diff-filter=ACMRT", "--"]),
      ...gitPathList(["ls-files", "--others", "--exclude-standard"]),
    ])).sort();
  } catch (error) {
    throw new Error(
      "active media-inspection candidate cannot verify its exact Git diff scope: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  let deletedPaths: string[];
  try {
    deletedPaths = Array.from(new Set([
      ...gitPathList([
        "diff",
        "--name-only",
        "--diff-filter=D",
        `${ACTIVE_MEDIA_INSPECTION_CANDIDATE_BASE_COMMIT}...HEAD`,
        "--",
      ]),
      ...gitPathList(["diff", "--name-only", "--diff-filter=D", "--"]),
    ])).sort();
  } catch (error) {
    throw new Error(
      "active media-inspection candidate cannot verify deleted paths: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  const unexpected = paths.filter(
    (path) => !ACTIVE_MEDIA_INSPECTION_CANDIDATE_ALLOWED_PATHS.has(path),
  );
  const missing = Array.from(ACTIVE_MEDIA_INSPECTION_CANDIDATE_ALLOWED_PATHS)
    .filter((path) => !paths.includes(path))
    .sort();
  if (unexpected.length > 0 || missing.length > 0 || deletedPaths.length > 0) {
    throw new Error(
      "active media-inspection candidate Git scope drifted: " +
        [
          unexpected.length > 0 ? `unexpected=${unexpected.join(",")}` : null,
          missing.length > 0 ? `missing=${missing.join(",")}` : null,
          deletedPaths.length > 0 ? `deleted=${deletedPaths.join(",")}` : null,
        ].filter(Boolean).join("; "),
    );
  }
}

function gitTreeSha(ref: string): string | null {
  try {
    return execFileSync("git", ["rev-parse", `${ref}^{tree}`], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim().toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The local reconstruction may have an equivalent source tree without the
 * remote merge ancestry. In that case, permit only its exact equivalent base
 * tree and its working/one-commit delta; CI still requires the canonical main
 * commit as an ancestor.
 */
function assertActivePrivateMediaVerifierContractCandidateDiffScope(): void {
  let comparisonRange: string | null = null;
  try {
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_COMMIT,
      "HEAD",
    ], { cwd: repoRoot, stdio: "ignore" });
    comparisonRange =
      `${ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_COMMIT}...HEAD`;
  } catch {
    const equivalentBase = ["HEAD", "HEAD^"].find((ref) =>
      gitTreeSha(ref) === ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_TREE
    );
    if (!equivalentBase) {
      throw new Error(
        "active private-media verifier candidate lacks canonical main ancestry or its exact equivalent source tree",
      );
    }
    if (equivalentBase === "HEAD^") comparisonRange = "HEAD^...HEAD";
  }

  let paths: string[];
  let deletedPaths: string[];
  try {
    const committedPaths = comparisonRange
      ? gitPathList(["diff", "--name-only", "--diff-filter=ACMRT", comparisonRange, "--"])
      : [];
    const committedDeletes = comparisonRange
      ? gitPathList(["diff", "--name-only", "--diff-filter=D", comparisonRange, "--"])
      : [];
    paths = Array.from(new Set([
      ...committedPaths,
      ...gitPathList(["diff", "--name-only", "--diff-filter=ACMRT", "--"]),
      ...gitPathList(["ls-files", "--others", "--exclude-standard"]),
    ])).sort();
    deletedPaths = Array.from(new Set([
      ...committedDeletes,
      ...gitPathList(["diff", "--name-only", "--diff-filter=D", "--"]),
    ])).sort();
  } catch (error) {
    throw new Error(
      "active private-media verifier candidate cannot verify its exact Git diff scope: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  const unexpected = paths.filter(
    (path) => !ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_ALLOWED_PATHS.has(path),
  );
  const missing = Array.from(
    ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_ALLOWED_PATHS,
  ).filter((path) => !paths.includes(path)).sort();
  if (unexpected.length > 0 || missing.length > 0 || deletedPaths.length > 0) {
    throw new Error(
      "active private-media verifier candidate Git scope drifted: " +
        [
          unexpected.length > 0 ? `unexpected=${unexpected.join(",")}` : null,
          missing.length > 0 ? `missing=${missing.join(",")}` : null,
          deletedPaths.length > 0 ? `deleted=${deletedPaths.join(",")}` : null,
        ].filter(Boolean).join("; "),
    );
  }
}

/**
 * Bind the pre-intervention acceptance candidate to PR #191's exact merged
 * tree and to one complete, auditable path set. Include committed, staged,
 * unstaged, and untracked paths so a local staging operation cannot weaken the
 * scope check. Deletions, renames, type changes, and unmerged entries fail.
 */
function assertActivePreinterventionAcceptanceCandidateDiffScope(): void {
  let comparisonRange: string | null = null;
  try {
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_COMMIT,
      "HEAD",
    ], { cwd: repoRoot, stdio: "ignore" });
    comparisonRange =
      `${ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_COMMIT}...HEAD`;
  } catch {
    const equivalentBase = ["HEAD", "HEAD^"].find((ref) =>
      gitTreeSha(ref) === ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_TREE
    );
    if (!equivalentBase) {
      throw new Error(
        "pre-intervention candidate lacks PR #191 merge ancestry or its exact equivalent tree",
      );
    }
    if (equivalentBase === "HEAD^") comparisonRange = "HEAD^...HEAD";
  }

  try {
    const committed = comparisonRange
      ? gitPathList([
        "diff", "--name-only", "--diff-filter=ACM", comparisonRange, "--",
      ])
      : [];
    const forbiddenCommitted = comparisonRange
      ? gitPathList([
        "diff", "--name-only", "--diff-filter=DRTUXB", comparisonRange, "--",
      ])
      : [];
    const paths = Array.from(new Set([
      ...committed,
      ...gitPathList(["diff", "--name-only", "--diff-filter=ACM", "--"]),
      ...gitPathList([
        "diff", "--cached", "--name-only", "--diff-filter=ACM", "--",
      ]),
      ...gitPathList(["ls-files", "--others", "--exclude-standard"]),
    ])).sort();
    const forbidden = Array.from(new Set([
      ...forbiddenCommitted,
      ...gitPathList([
        "diff", "--name-only", "--diff-filter=DRTUXB", "--",
      ]),
      ...gitPathList([
        "diff", "--cached", "--name-only", "--diff-filter=DRTUXB", "--",
      ]),
      ...gitPathList(["ls-files", "--unmerged"]),
    ])).sort();
    const unexpected = paths.filter((path) =>
      !ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_ALLOWED_PATHS.has(path)
    );
    const missing = Array.from(
      ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_ALLOWED_PATHS,
    ).filter((path) => !paths.includes(path)).sort();
    if (unexpected.length > 0 || missing.length > 0 || forbidden.length > 0) {
      throw new Error(
        "pre-intervention candidate Git scope drifted: " + [
          unexpected.length > 0 ? `unexpected=${unexpected.join(",")}` : null,
          missing.length > 0 ? `missing=${missing.join(",")}` : null,
          forbidden.length > 0 ? `forbidden=${forbidden.join(",")}` : null,
        ].filter(Boolean).join("; "),
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(
      "pre-intervention candidate Git scope drifted:",
    )) throw error;
    throw new Error(
      "pre-intervention candidate cannot verify its exact Git diff scope: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

/**
 * The versioned deployment manifest is immutable evidence for the last live
 * release. A narrowly described forward candidate must not rewrite it before
 * production evidence exists. This guard makes that one pending migration
 * explicit and rejects any broadened migration or external-action scope.
 */
function assertActiveMediaInspectionForwardCandidate(
  manifest: DeploymentManifest,
  state: ActiveMediaInspectionCandidateState,
): void {
  const failures: string[] = [];
  const must = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
  };
  const candidate = state.activeCandidate;
  const migration = candidate?.migration;
  const pending = candidate?.pendingMigrations;
  const rootMigrationTree = hashTree(
    resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT),
    { suffix: ".sql" },
  );
  const mirrorMigrationTree = hashTree(
    resolve(repoRoot, SITES_MIGRATION_MIRROR_ROOT),
    { suffix: ".sql" },
  );
  const liveMigrationTree = hashTree(
    resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT),
    { exclusions: [MEDIA_INSPECTION_PREFLIGHT_MIGRATION], suffix: ".sql" },
  );
  const migrationPath = resolve(
    repoRoot,
    ROOT_MIGRATION_SOURCE_ROOT,
    MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
  );
  const locks = state.externalActionLock ?? {};
  const production = manifest.currentProductionObservation;

  try {
    assertActiveMediaInspectionCandidateDiffScope();
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  must(
    manifest.schemaVersion === 13 &&
      manifest.recordKind ===
        "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout",
    "forward candidate requires the immutable schema-13 live baseline",
  );
  must(
    candidate?.branch === "agent/fix-storage-transform-redirect-20260815" &&
      candidate?.state ===
        "local_verified_pending_pr_review_and_production_preflight" &&
      sameJson(pending, []) &&
      migration?.filename === MEDIA_INSPECTION_PREFLIGHT_MIGRATION &&
      candidate?.preflightMigrationStatus === "applied" &&
      candidate?.externalActionLockRequired === true &&
      candidate.img4257RetryConsumed === false,
    "storage-transform follow-up candidate scope, migration state, or IMG_4257 retry authority drifted",
  );
  must(
    migration?.sha256 === sha256File(migrationPath) &&
      migration?.candidateMigrationCount === rootMigrationTree.fileCount &&
      migration?.candidateMigrationTreeSha256 === rootMigrationTree.sha256 &&
      rootMigrationTree.fileCount === mirrorMigrationTree.fileCount &&
      rootMigrationTree.sha256 === mirrorMigrationTree.sha256 &&
      sameJson(rootMigrationTree.files, mirrorMigrationTree.files) &&
      rootMigrationTree.files.at(-1) === MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
    "forward candidate migration fingerprint or root/Sites mirror drifted",
  );
  must(
    migration?.productionBaselineMigrationCount === liveMigrationTree.fileCount &&
      migration?.productionBaselineMigrationTreeSha256 === liveMigrationTree.sha256 &&
      production.productionMigrationCount === liveMigrationTree.fileCount &&
      production.migrationTreeSha256 === liveMigrationTree.sha256 &&
      production.latestProductionMigration === liveMigrationTree.files.at(-1) &&
      production.latestProductionMigrationSha256 ===
        sha256File(resolve(
          repoRoot,
          ROOT_MIGRATION_SOURCE_ROOT,
          liveMigrationTree.files.at(-1) ?? "",
        )),
    "forward candidate does not preserve the immutable pre-migration ledger baseline",
  );
  must(
    state.production.github?.mainCommit ===
        "1c5db2ca1e03d1f8e09e63f171550cf6cd35df45" &&
      state.production.github?.latestApplicationSourceCommit ===
        "1c5db2ca1e03d1f8e09e63f171550cf6cd35df45" &&
      state.production.sites?.version === 58 &&
      state.production.sites?.versionId ===
        "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_b072808982dc81918be26cc59ae675ac" &&
      state.production.sites?.sourceCommit ===
        "12213194b7aae365c35c1524c715e3092454ce1e" &&
      state.production.supabase?.migrationCount === rootMigrationTree.fileCount &&
      state.production.supabase?.latestMigration ===
        MEDIA_INSPECTION_PREFLIGHT_MIGRATION &&
      state.production.supabase?.appliedMigrationVersion === "20260815062451",
    "current-state production checkpoint does not match the applied Phase 1 repair evidence",
  );
  must(
    state.asset?.authorizedRetriesRemaining === 1 &&
      locks.publishing === false &&
      locks.externalScheduling === false &&
      locks.accountConnection === false &&
      locks.customerMessaging === false &&
      locks.outreach === false &&
      locks.pricingChange === false &&
      locks.repositoryVisibilityChange === false,
    "forward candidate current-state baseline or external-action lock drifted",
  );
  const hold = manifest.operationalHold as Record<string, unknown> | undefined;
  must(
    hold?.providerWrites === false && hold.reviewReplies === false &&
      hold.websiteWrites === false && hold.externalScheduling === false &&
      hold.externalPublishing === false,
    "forward candidate weakens a historical external-action lock",
  );

  if (failures.length > 0) {
    throw new Error(
      "Unsafe active media-inspection forward candidate: " +
        failures.join("; "),
    );
  }
}

function assertActivePrivateMediaVerifierContractCandidate(
  manifest: DeploymentManifest,
  state: ActiveMediaInspectionCandidateState,
): void {
  const failures: string[] = [];
  const must = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
  };
  const candidate = state.activeCandidate;
  const migration = candidate?.migration;
  const locks = state.externalActionLock ?? {};
  const hold = manifest.operationalHold as Record<string, unknown> | undefined;
  const rootMigrationTree = hashTree(
    resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT),
    { suffix: ".sql" },
  );
  const mirrorMigrationTree = hashTree(
    resolve(repoRoot, SITES_MIGRATION_MIRROR_ROOT),
    { suffix: ".sql" },
  );
  const migrationPath = resolve(
    repoRoot,
    ROOT_MIGRATION_SOURCE_ROOT,
    MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
  );
  const core = readFileSync(resolve(
    repoRoot,
    "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  ), "utf8");
  const recoveryTests = readFileSync(resolve(
    repoRoot,
    "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  ), "utf8");

  try {
    assertActivePrivateMediaVerifierContractCandidateDiffScope();
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  must(
    manifest.schemaVersion === 13 &&
      manifest.recordKind ===
        "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout",
    "verifier-contract candidate requires the immutable schema-13 live baseline",
  );
  must(
    state.phase ===
        "phase_2_img4257_retry_recorded_verifier_contract_repair_pending_pr_review" &&
      candidate?.kind === "private_media_verifier_contract_repair" &&
      candidate?.branch === "agent/fix-media-verifier-contract-20260815" &&
      candidate?.state ===
        "local_focused_test_passed_pending_pr_review_and_synthetic_production_proof" &&
      sameJson(candidate?.pendingMigrations, []) &&
      candidate?.preflightMigrationStatus === "applied" &&
      candidate?.externalActionLockRequired === true &&
      candidate?.img4257RetryConsumed === true,
    "verifier-contract candidate scope, migration state, or IMG_4257 retry authority drifted",
  );
  must(
    migration?.filename === MEDIA_INSPECTION_PREFLIGHT_MIGRATION &&
      migration?.sha256 === sha256File(migrationPath) &&
      migration?.candidateMigrationCount === rootMigrationTree.fileCount &&
      migration?.candidateMigrationTreeSha256 === rootMigrationTree.sha256 &&
      rootMigrationTree.fileCount === mirrorMigrationTree.fileCount &&
      rootMigrationTree.sha256 === mirrorMigrationTree.sha256 &&
      sameJson(rootMigrationTree.files, mirrorMigrationTree.files) &&
      rootMigrationTree.files.at(-1) === MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
    "verifier-contract candidate migration fingerprint or root/Sites mirror drifted",
  );
  must(
    state.production.github?.mainCommit ===
        ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_COMMIT &&
      state.production.github?.latestApplicationSourceCommit ===
        ACTIVE_PRIVATE_MEDIA_VERIFIER_CONTRACT_CANDIDATE_BASE_COMMIT &&
      state.production.sites?.version === 59 &&
      state.production.sites?.versionId ===
        "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_1341aa54d7448191b891b42d275d13d5" &&
      state.production.sites?.sourceCommit ===
        "02f536710d5493b4670684294210e76bcb05eb9d" &&
      state.production.supabase?.migrationCount === rootMigrationTree.fileCount &&
      state.production.supabase?.latestMigration ===
        MEDIA_INSPECTION_PREFLIGHT_MIGRATION &&
      state.production.supabase?.appliedMigrationVersion === "20260815062451",
    "current-state production checkpoint does not match the deployed preflight repair evidence",
  );
  must(
    state.asset?.authorizedRetriesRemaining === 0 &&
      locks.publishing === false &&
      locks.externalScheduling === false &&
      locks.accountConnection === false &&
      locks.customerMessaging === false &&
      locks.outreach === false &&
      locks.pricingChange === false &&
      locks.repositoryVisibilityChange === false,
    "verifier-contract candidate weakens retry or external-action controls",
  );
  must(
    hold?.providerWrites === false && hold.reviewReplies === false &&
      hold.websiteWrites === false && hold.externalScheduling === false &&
      hold.externalPublishing === false,
    "verifier-contract candidate weakens a historical external-action lock",
  );
  must(
    core.includes("const VERIFIED_INTAKE_VERIFIER_VERSION") &&
      core.includes("veroxa-private-image-byte-verifier-2026-08-08-v1") &&
      core.includes("const RECOVERY_EVIDENCE_VERIFIER_VERSION") &&
      core.includes("veroxa-private-image-byte-verifier-2026-08-15-v2") &&
      core.includes("verifierVersion: VERIFIED_INTAKE_VERIFIER_VERSION") &&
      core.includes("verifierVersion: RECOVERY_EVIDENCE_VERIFIER_VERSION") &&
      !core.includes("const VERIFIER_VERSION ="),
    "recovery success and diagnostic verifier contracts are not explicitly separated",
  );
  must(
    recoveryTests.includes(
      "the recovery success record must remain compatible with the persisted intake contract",
    ) && recoveryTests.includes(
      "diagnostic evidence may evolve without changing the immutable success contract",
    ),
    "verifier-contract regression coverage is missing",
  );

  if (failures.length > 0) {
    throw new Error(
      "Unsafe active private-media verifier contract candidate: " +
        failures.join("; "),
    );
  }
}

function assertActivePreinterventionAcceptanceCandidate(
  manifest: DeploymentManifest,
  state: ActiveMediaInspectionCandidateState,
): void {
  const failures: string[] = [];
  const must = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
  };
  const candidate = state.activeCandidate;
  const migrationEvidence = candidate?.migration;
  const pgTapEvidence = candidate?.pgTap;
  const github = state.production.github as Record<string, any> | undefined;
  const sites = state.production.sites as Record<string, any> | undefined;
  const supabase = state.production.supabase as Record<string, any> | undefined;
  const img4257 = state.img4257 ?? {};
  const synthetic = state.syntheticAcceptance ?? {};
  const pr187 = state.pr187 ?? {};
  const locks = state.externalActionLock ?? {};
  const counts = state.externalActionCounts ?? {};
  const gates = candidate?.requiredGates ?? {};
  const rootMigrationDir = resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT);
  const mirrorMigrationDir = resolve(repoRoot, SITES_MIGRATION_MIRROR_ROOT);
  const rootMigrationPath = resolve(
    rootMigrationDir,
    PREINTERVENTION_ACCEPTANCE_MIGRATION,
  );
  const mirrorMigrationPath = resolve(
    mirrorMigrationDir,
    PREINTERVENTION_ACCEPTANCE_MIGRATION,
  );
  const rootPgTapPath = resolve(
    repoRoot,
    "supabase/tests",
    PREINTERVENTION_ACCEPTANCE_PGTAP,
  );
  const mirrorPgTapPath = resolve(
    repoRoot,
    "artifacts/veroxa-sites/supabase/tests",
    PREINTERVENTION_ACCEPTANCE_PGTAP,
  );
  const rootMigrationTree = hashTree(rootMigrationDir, { suffix: ".sql" });
  const mirrorMigrationTree = hashTree(mirrorMigrationDir, { suffix: ".sql" });
  const productionBaselineTree = hashTree(rootMigrationDir, {
    exclusions: [PREINTERVENTION_ACCEPTANCE_MIGRATION],
    suffix: ".sql",
  });
  const read = (path: string): string =>
    readFileSync(resolve(repoRoot, path), "utf8");
  const migration = read(
    `supabase/migrations/${PREINTERVENTION_ACCEPTANCE_MIGRATION}`,
  );
  const pgTap = read(`supabase/tests/${PREINTERVENTION_ACCEPTANCE_PGTAP}`);
  const uploadAdapter = read("artifacts/veroxa-sites/app/momo-client-data.ts");
  const finalizeCore = read(
    "artifacts/veroxa-sites/app/api/media/finalize/core.ts",
  );
  const lifecycleContract = read(
    "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  );
  const lifecycleEdge = read(
    "supabase/functions/momo-content-ai-lifecycle/index.ts",
  );
  const clientPortal = read("artifacts/veroxa-sites/app/momo-client-portal.tsx");
  const teamPortal = read("artifacts/veroxa-sites/app/momo-operating-center.tsx");
  const recovery = read(
    "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  );
  const recoveryTests = read(
    "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  );
  const uploadTests = read(
    "artifacts/veroxa-sites/tests/momo-client-media-upload.test.mjs",
  );
  const workflow = read(".github/workflows/supabase-verify.yml");
  const phaseOne = JSON.parse(read(
    "artifacts/veroxa/docs/history/2026-08-15-preintervention-phase-1-source-of-truth.json",
  )) as Record<string, any>;

  try {
    assertActivePreinterventionAcceptanceCandidateDiffScope();
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  must(
    manifest.schemaVersion === 13 &&
      manifest.recordKind ===
        "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout",
    "pre-intervention candidate must preserve the immutable schema-13 deployment manifest",
  );
  must(
    state.phase ===
        "preintervention_acceptance_candidate_pending_exact_head_gates_and_live_proof" &&
      state.currentVerdict === "NOT READY — AUTONOMOUS WORK REMAINS" &&
      candidate?.kind === "veroxa_preintervention_acceptance" &&
      candidate.branch === "agent/veroxa-pre-intervention-proof-20260815" &&
      candidate.state ===
        "local_candidate_pending_exact_head_ci_review_merge_migration_apply_deploy_and_production_proof" &&
      candidate.basedOnGitHubMainCommit ===
        ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_COMMIT &&
      candidate.basedOnGitHubMainTree ===
        ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_TREE,
    "pre-intervention candidate identity or not-ready boundary drifted",
  );
  must(
    candidate?.pullRequest === 193 &&
      candidate.reviewedHead === null &&
      candidate.mergeCommit === null &&
      candidate.sourceTree === null &&
      candidate.productionDeploymentId === null &&
      sameJson(candidate.pendingMigrations, [PREINTERVENTION_ACCEPTANCE_MIGRATION]) &&
      candidate.externalActionLockRequired === true &&
      candidate.img4257RetriesRemaining === 0 &&
      sameJson(gates, {
        exactHeadCiGreen: false,
        independentCodeSecurityReviewPassed: false,
        zeroUnresolvedReviewThreads: false,
        merged: false,
        migrationAppliedAndReadBack: false,
        exactSourceDeployed: false,
        syntheticSuccessPassed: false,
        duplicateReplayIdempotent: false,
        controlledFailureFailedClosed: false,
        restaurantPortalVerified: false,
        teamPortalVerified: false,
        mobileVerified: false,
        tenantAndRoleIsolationPassed: false,
        externalActionAuditPassed: false,
      }),
    "candidate preclaims a PR, review, merge, deployment, migration, or production acceptance gate",
  );
  must(
    github?.mainCommit ===
        ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_COMMIT &&
      github.mainTree === ACTIVE_PREINTERVENTION_ACCEPTANCE_CANDIDATE_BASE_TREE &&
      github.latestApplicationSourceCommit ===
        "7cb6173ce76cff840017b2b4ecfa37c31cb07a09" &&
      github.latestMergedPullRequest === 195 &&
      github.pullRequest191?.head ===
        "aabb1efc72cfcc1ee649572dd033c7806a28dbb0" &&
      github.pullRequest191?.mergeCommit ===
        "7cb6173ce76cff840017b2b4ecfa37c31cb07a09" &&
      github.pullRequest191?.sourceTreeMatchesMain === true &&
      github.pullRequest191?.allFourExactHeadWorkflowsGreen === true &&
      sameJson(github.pullRequest191?.workflowRuns, {
        ci: 31873987160,
        sitesVerify: 31873987170,
        supabaseVerify: 31873987150,
        veroxaVerify: 31873987157,
      }) &&
      github.pullRequest191?.unresolvedNonOutdatedP1Threads === 1 &&
      github.pullRequest191?.approvedReviews === 0 &&
      github.mainProtected === false,
    "GitHub PR #191 baseline or unresolved governance evidence drifted",
  );
  must(
    sites?.lastProvenVersion === 59 &&
      sites.lastProvenDeploymentId ===
        "appgdep_6a8016eee874819184f031daa896048c" &&
      sites.lastProvenRepositoryTree ===
        "6445d25718fee4fc4321b9336302d604ad623fc3" &&
      sites.lastProvenApplicationTree ===
        "602b6c339c285b62667064ba5094f95359002ddd" &&
      sites.savedVersion === 60 &&
      sites.savedVersionApplicationTree ===
        "35a8ea7d8efc4723c65622675c177e77ee575138" &&
      sites.savedVersionLiveDeploymentProven === false &&
      sites.pullRequest191LiveParityProven === false,
    "Sites baseline overclaims PR #191 or candidate deployment parity",
  );
  must(
    supabase?.migrationCount === 59 &&
      supabase.latestMigration === MEDIA_INSPECTION_PREFLIGHT_MIGRATION &&
      supabase.appliedMigrationVersion === "20260815062451" &&
      supabase.completedIntakeCount === 0 &&
      supabase.canonicalIdentityCount === 0 &&
      supabase.privateAssessmentCount === 0 &&
      supabase.contentAiRunCount === 0 &&
      supabase.readyPackageCount === 0,
    "Supabase live baseline or zero-work evidence drifted",
  );
  must(
    existsSync(rootMigrationPath) && existsSync(mirrorMigrationPath) &&
      sha256File(rootMigrationPath) === sha256File(mirrorMigrationPath) &&
      statSync(rootMigrationPath).size === statSync(mirrorMigrationPath).size &&
      migrationEvidence?.filename === PREINTERVENTION_ACCEPTANCE_MIGRATION &&
      migrationEvidence.sha256 === sha256File(rootMigrationPath) &&
      migrationEvidence.byteLength === statSync(rootMigrationPath).size &&
      migrationEvidence.candidateMigrationCount === rootMigrationTree.fileCount &&
      migrationEvidence.candidateMigrationTreeSha256 === rootMigrationTree.sha256 &&
      migrationEvidence.productionBaselineMigrationCount ===
        productionBaselineTree.fileCount &&
      migrationEvidence.productionBaselineMigrationTreeSha256 ===
        productionBaselineTree.sha256 &&
      migrationEvidence.applied === false &&
      rootMigrationTree.fileCount === mirrorMigrationTree.fileCount &&
      rootMigrationTree.sha256 === mirrorMigrationTree.sha256 &&
      sameJson(rootMigrationTree.files, mirrorMigrationTree.files) &&
      rootMigrationTree.files.at(-1) === PREINTERVENTION_ACCEPTANCE_MIGRATION &&
      productionBaselineTree.fileCount === 59 &&
      productionBaselineTree.sha256 ===
        "5c2cb401005a3828117b4a67da82be9557e5f7bdc1fe2fdd60332c9b6b07c61c",
    "pre-intervention migration identity, pending split, or root/Sites mirror drifted",
  );
  must(
    existsSync(rootPgTapPath) && existsSync(mirrorPgTapPath) &&
      sha256File(rootPgTapPath) === sha256File(mirrorPgTapPath) &&
      statSync(rootPgTapPath).size === statSync(mirrorPgTapPath).size &&
      pgTapEvidence?.filename === PREINTERVENTION_ACCEPTANCE_PGTAP &&
      pgTapEvidence.sha256 === sha256File(rootPgTapPath) &&
      pgTapEvidence.byteLength === statSync(rootPgTapPath).size &&
      pgTapEvidence.plannedAssertions === 61 &&
      pgTapEvidence.mirrored === true &&
      pgTapEvidence.hostedExecutionPassed === false,
    "pre-intervention pgTAP identity, mirror, or unproven hosted-execution boundary drifted",
  );
  const authenticatedV3Revoke =
    /revoke execute on function public[.]veroxa_register_momo_media_v3[(][\s\S]*?[)] from authenticated;/u;
  const authenticatedV3Grant =
    /grant execute on function public[.]veroxa_register_momo_media_v3[(][\s\S]*?[)] to authenticated;/u;
  must(
    migration.includes("create or replace function public.veroxa_begin_media_upload_v1(") &&
      migration.includes("create or replace function public.veroxa_commit_media_upload_v1(") &&
      migration.includes("create or replace function public.veroxa_commit_media_upload_v2(") &&
      migration.includes("media_upload_sessions_live_sha_v1") &&
      migration.includes("initiation_expires_at timestamptz not null") &&
      migration.includes("message = 'media_upload_session_expired'") &&
      migration.includes("upload_session_expires_at > pg_catalog.clock_timestamp()") &&
      migration.includes("upload session before deciding so cleanup") &&
      migration.includes("message = 'media_upload_alias_limit_reached'") &&
      migration.includes("message = 'media_upload_session_rate_or_active_limit_reached'") &&
      migration.includes("unique (singleton_slot)") &&
      migration.includes("create table veroxa_private.media_upload_session_aliases_v1") &&
      migration.includes("primary key (restaurant_id, actor_id, client_idempotency_key)") &&
      migration.includes("request_snapshot jsonb not null") &&
      migration.includes("message = 'media_upload_session_alias_is_immutable'") &&
      migration.includes("message = 'media_upload_owner_attestation_invalid'") &&
      migration.includes("message = 'internal_acceptance_scope_singleton_conflict'") &&
      authenticatedV3Revoke.test(migration) &&
      !authenticatedV3Grant.test(migration) &&
      migration.includes("message = 'media_upload_registration_rpc_acl_invalid'") &&
      migration.includes("public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)") &&
      migration.includes("public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)") &&
      migration.includes("public.veroxa_register_momo_media_v3(uuid,text,text,bigint,text,jsonb,date,text,text)") &&
      migration.includes("public.veroxa_begin_media_upload_v1(uuid,uuid,text,text,bigint,text,jsonb,jsonb,date,text,text)") &&
      migration.includes("public.veroxa_commit_media_upload_v1(uuid,uuid)") &&
      migration.includes("public.veroxa_commit_media_upload_v2(uuid,uuid,uuid,text,uuid,text,uuid)") &&
      pgTap.includes("authenticated Clients can only begin; service_role alone can commit v2") &&
      pgTap.includes("mismatch creates no durable row or committed session evidence") &&
      pgTap.includes("an expired idempotency alias cannot be replayed or rebound") &&
      pgTap.includes("orphan cleanup locks the upload session before its expiry decision") &&
      pgTap.includes("a timed-out initiated path is deletable without a later begin sweep") &&
      pgTap.includes("immutable registered evidence keeps its Storage object protected") &&
      pgTap.includes("a ninth actor/session alias fails closed") &&
      pgTap.includes("a second restaurant Client reuses the canonical restaurant/SHA session") &&
      uploadAdapter.includes('"veroxa_begin_media_upload_v1"') &&
      !uploadAdapter.includes('"veroxa_commit_media_upload_v1"') &&
      !uploadAdapter.includes('"veroxa_commit_media_upload_v2"') &&
      uploadAdapter.includes("finalizeMomoMediaUploadSession") &&
      uploadAdapter.includes("p_owner_attestation") &&
      uploadAdapter.includes("p_client_idempotency_key: clientIdempotencyKey.toLowerCase()") &&
      finalizeCore.includes("observedSha256: contentSha256") &&
      lifecycleContract.includes('operation: "commit_upload"') &&
      lifecycleEdge.includes('admin.rpc("veroxa_commit_media_upload_v2"') &&
      migration.includes("grant execute on function public.veroxa_commit_media_upload_v2(") &&
      migration.includes(") to service_role;") &&
      uploadTests.includes("an already registered replay skips object creation and reuses the same IDs") &&
      uploadTests.includes("an initiated replay can commit an already-present reserved object") &&
      uploadAdapter.includes("isMomoReservedStorageObjectConflict") &&
      uploadTests.includes("non-conflict Storage failures stop before server registration and finalization") &&
      uploadTests.includes("unproven object durability must block server finalization"),
    "bounded begin/server-commit replay, content uniqueness, immutable alias, or RPC ACL contract drifted",
  );
  const offeringAttestation =
    "Authenticated restaurant uploader attested that this image depicts a current restaurant offering.";
  must(
    clientPortal.includes('restaurantAssociation: "represents_current_restaurant_offering"') &&
      clientPortal.includes(`associationNote: "${offeringAttestation}"`) &&
      teamPortal.includes('restaurantAssociation: "represents_current_restaurant_offering"') &&
      teamPortal.includes(`associationNote: "${offeringAttestation}"`) &&
      migration.includes("'represents_current_restaurant_offering'") &&
      migration.includes("'veroxa-media-owner-attestation-v1'") &&
      migration.includes("'currentOfferingAccepted'") &&
      pgTap.includes("'represents_current_restaurant_offering'"),
    "truthful current-offering attestation contract drifted",
  );
  must(
    migration.includes("message = 'media_upload_expected_sha256_mismatch'") &&
      pgTap.includes("'media_upload_expected_sha256_mismatch'") &&
      recovery.includes('error.message === "media_upload_expected_sha256_mismatch"') &&
      recovery.includes('"media_upload_expected_sha256_mismatch",\n            false') &&
      recoveryTests.includes("an expected original SHA mismatch is stable, terminal, and fail-closed") &&
      !migration.includes("05ab2303-f7ea-4056-8f75-9cd7e523a4f4") &&
      !pgTap.includes("05ab2303-f7ea-4056-8f75-9cd7e523a4f4"),
    "stable fail-closed expected-SHA contract drifted or references terminal IMG_4257",
  );
  must(
    migration.includes("create table veroxa_private.internal_acceptance_scope_v1") &&
      migration.includes("customer_visible boolean not null default false") &&
      migration.includes("excluded_from_reports boolean not null default true") &&
      migration.includes("and scope.excluded_from_reports") &&
      migration.includes("check (not external_write_allowed)") &&
      migration.includes("message = 'internal_acceptance_surface_not_allowed'") &&
      migration.includes("message = 'internal_acceptance_report_evidence_forbidden'") &&
      migration.includes("provider_writes = false") &&
      migration.includes("external_scheduling = false") &&
      pgTap.includes("scope.excluded_from_reports") &&
      pgTap.includes("session, runtime, and budget all keep external actions false") &&
      pgTap.includes("the test tenant cannot create a restaurant-platform connection") &&
      pgTap.includes("test-tenant activity cannot enter operational reports") &&
      workflow.includes(`acceptance_migration="${PREINTERVENTION_ACCEPTANCE_MIGRATION}"`) &&
      workflow.includes("ci_external_write_or_runtime_secret_fixture_forbidden"),
    "test-tenant isolation, external locks, or clean-chain workflow contract drifted",
  );
  must(
    img4257.assetId === "05ab2303-f7ea-4056-8f75-9cd7e523a4f4" &&
      img4257.attemptCount === 4 &&
      img4257.lastOutcome === "media_recovery_completion_unavailable" &&
      img4257.outboxState === "dead_letter" &&
      img4257.verificationPersisted === false &&
      img4257.ready === false &&
      img4257.authorizedRetriesRemaining === 0 &&
      img4257.permittedAccess ===
        "read_only_immutable_evidence_reconciliation" &&
      phaseOne.img4257?.authorizedRetriesRemaining === 0 &&
      phaseOne.img4257?.ready === false,
    "IMG_4257 terminal evidence or zero-retry authority drifted",
  );
  must(
    sameJson(synthetic, {
      testRestaurantCreated: false,
      successAssetUploaded: false,
      successAssetReady: false,
      duplicateReplayed: false,
      invalidFixtureSubmitted: false,
      portalProofCompleted: false,
      productionProofStarted: false,
      customerMediaUsed: false,
    }),
    "candidate preclaims synthetic, portal, Ready, or customer-media proof",
  );
  must(
    pr187.number === 187 && pr187.draft === true && pr187.merged === false &&
      pr187.deployed === false &&
      pr187.disposition ===
        "deferred_follow_up_not_part_of_preintervention_acceptance",
    "PR #187 draft/unmerged/undeployed deferral drifted",
  );
  must(
    locks.publishing === false && locks.externalScheduling === false &&
      locks.accountConnection === false && locks.customerMessaging === false &&
      locks.outreach === false && locks.reviewReplies === false &&
      locks.websiteProviderWritesAllowed === false &&
      locks.orderingProviderWritesAllowed === false &&
      locks.advertisingProviderWritesAllowed === false &&
      locks.pricingChange === false && locks.repositoryVisibilityChange === false &&
      counts.publishedPosts === 0 && counts.scheduledExternalPosts === 0 &&
      counts.publishAttempts === 0 && counts.externalMessages === 0 &&
      counts.publishedReviewReplies === 0 &&
      counts.restaurantAccountConnections === 0 &&
      counts.websiteProviderWrites === 0 &&
      counts.orderingProviderWrites === 0 &&
      counts.advertisingProviderWrites === 0,
    "candidate weakens an external-action lock or its observed zero-count audit",
  );
  const hold = manifest.operationalHold as Record<string, unknown> | undefined;
  must(
    hold?.providerWrites === false && hold.reviewReplies === false &&
      hold.websiteWrites === false && hold.externalScheduling === false &&
      hold.externalPublishing === false,
    "pre-intervention candidate weakens immutable historical external locks",
  );

  if (failures.length > 0) {
    throw new Error(
      "Unsafe active pre-intervention acceptance candidate: " +
        failures.join("; "),
    );
  }
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


function assertMediaRecoveryByteInspectionCandidateManifest(
  manifest: DeploymentManifest,
): void {
  const activeForwardCandidate = readActiveMediaInspectionCandidateState();
  if (activeForwardCandidate) {
    if (activeForwardCandidate.activeCandidate?.kind ===
      "media_inspection_runtime_repair") {
      assertActiveMediaInspectionForwardCandidate(
        manifest,
        activeForwardCandidate,
      );
    } else if (activeForwardCandidate.activeCandidate?.kind ===
      "private_media_verifier_contract_repair") {
      assertActivePrivateMediaVerifierContractCandidate(
        manifest,
        activeForwardCandidate,
      );
    } else if (activeForwardCandidate.activeCandidate?.kind ===
      "veroxa_preintervention_acceptance") {
      assertActivePreinterventionAcceptanceCandidate(
        manifest,
        activeForwardCandidate,
      );
    } else {
      throw new Error("unknown active media forward candidate kind");
    }
    return;
  }
  const failures: string[] = [];
  const record = manifest as unknown as Record<string, any>;
  const candidate = manifest.releaseCandidate;
  const production = manifest.currentProductionObservation as Record<string, any>;
  const quality = manifest.applicationQualityEvidence;
  const review = manifest.databaseContractReview as Record<string, any> | undefined;
  const hold = manifest.operationalHold as Record<string, unknown> | undefined;
  const recovery = record.durableMediaIngestionRecovery as
    | Record<string, any>
    | undefined;
  const runtime = record.currentRuntimeIdentityObservation as
    | Record<string, any>
    | undefined;
  const freeze = manifest.deploymentFreeze as Record<string, any>;
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
  const repairMigration =
    "20260813175640_durable_media_ingestion_path_regex_repair_v1.sql";
  const foundationMigration =
    "20260813163534_durable_media_ingestion_recovery.sql";
  const latestMigration = rootMigrationTree.files.at(-1);
  const latestMigrationSha256 = latestMigration
    ? sha256File(resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT, latestMigration))
    : null;
  const read = (path: string): string =>
    readFileSync(resolve(repoRoot, path), "utf8");

  if (
    manifest.schemaVersion !== 13 ||
    manifest.recordKind !==
      "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout" ||
    manifest.releaseState !==
      "media_recovery_host_inspection_diagnostics_deployed_retry_failed_images_binding_unavailable" ||
    manifest.reviewedAt !== "2026-08-15" ||
    manifest.candidateRevision !==
      "momo_media_recovery_host_inspection_diagnostics_closeout_2026-08-15" ||
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.candidateBranch !==
      "agent/momo-media-inspection-diagnostics-20260815" ||
    manifest.sitesProjectId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) failures.push("schema-13 media-recovery candidate identity drifted");

  if (
    sourceTree.fileCount !== 236 ||
    sourceTree.sha256 !==
      "e8a2c1b8c0308b98a03b8cf34a7400f92e3100a9c8c006dff9fa8a4f0fdfa871" ||
    sourceTree.fileCount !== manifest.source.fileCount ||
    sourceTree.sha256 !== manifest.source.treeSha256 ||
    sourceTree.fileCount !== candidate.sourceFileCount ||
    sourceTree.sha256 !== candidate.sourceTreeSha256 ||
    rootMigrationTree.fileCount !== 58 ||
    rootMigrationTree.sha256 !==
      "1bdc5997489c860f5c6098b5c1f0af340db39f35cc69c0dfb52b5fa33faf5f6a" ||
    rootMigrationTree.fileCount !== mirrorMigrationTree.fileCount ||
    rootMigrationTree.sha256 !== mirrorMigrationTree.sha256 ||
    JSON.stringify(rootMigrationTree.files) !==
      JSON.stringify(mirrorMigrationTree.files) ||
    rootMigrationTree.fileCount !== manifest.migrations.fileCount ||
    rootMigrationTree.sha256 !== manifest.migrations.treeSha256 ||
    mirrorMigrationTree.fileCount !== manifest.migrations.mirrorFileCount ||
    mirrorMigrationTree.sha256 !== manifest.migrations.mirrorTreeSha256 ||
    rootMigrationTree.fileCount !== candidate.migrationFileCount ||
    rootMigrationTree.sha256 !== candidate.migrationTreeSha256 ||
    latestMigration !== repairMigration ||
    candidate.latestCandidateMigration !== repairMigration ||
    latestMigrationSha256 !==
      "6bb6b50ec7e1980f65088062e4d6df95cdf5920c75528684fc86b71fbc998ed9" ||
    candidate.latestCandidateMigrationSha256 !== latestMigrationSha256
  ) failures.push("schema-13 source or mirrored migration fingerprint drifted");

  if (
    candidate.basedOnGitHubMainCommit !==
      "4a098ea98690ee9be6b86cc8fe783ef0cfc265ed" ||
    candidate.pullRequest !== 185 ||
    candidate.githubMerged !== true ||
    candidate.futureMergedGitHubCommit !==
      "77dadd67505642353b431db3802d2ec365966869" ||
    candidate.futureSitesVersion !== 56 ||
    candidate.reviewedLocally !== true ||
    candidate.sourceReviewPassed !== true ||
    candidate.qualityReviewPassed !== true ||
    candidate.allFourWorkflowsGreen !== true ||
    candidate.zeroUnresolvedReviewThreads !== true ||
    candidate.candidateSourceMatchesLiveSites !== true ||
    candidate.candidateMigrationsMatchLiveLedger !== true ||
    candidate.githubMainMatchesCandidate !== true ||
    candidate.fullReleaseGatePassed !== false ||
    JSON.stringify(candidate.pendingMigrations) !== "[]" ||
    candidate.databaseChangesRequired !== false ||
    candidate.additionalDatabaseChangesRequired !== false ||
    candidate.databaseMigrationApplied !== true ||
    JSON.stringify(candidate.databaseMigrationsApplied) !==
      JSON.stringify([foundationMigration, repairMigration]) ||
    candidate.databaseApplyAuthorized !== false ||
    candidate.sitesPublishRequired !== true ||
    candidate.sitesPublished !== true ||
    candidate.sitesPublishAuthorized !== false ||
    candidate.deploymentAuthorized !== false ||
    candidate.edgeDeployRequired !== false ||
    candidate.edgeDeployed !== false ||
    candidate.edgeDeployAuthorized !== false
  ) failures.push("schema-13 candidate release boundary drifted");

  if (
    production.observedAt !== "2026-08-15" ||
    production.evidenceStatus !==
      "sites_v56_database58_host_inspection_diagnostics_live_attempt3_dead_lettered_images_binding_unavailable" ||
    production.canonicalGitHubMainCommit !==
      "77dadd67505642353b431db3802d2ec365966869" ||
    production.canonicalGitHubMainMergePullRequest !== 185 ||
    production.githubParityVerifiedAtObservation !== true ||
    production.sitesVersion !== 56 ||
    production.sitesVersionId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_0a84d383bba4819180548d99950817fd" ||
    production.sitesCheckoutCommit !==
      "5306f279a70c7a7d4ecb1328fa17cbeb2f03af7f" ||
    production.sitesDeploymentId !==
      "appgdep_6a7fcbb9276881918534df6883805dc9" ||
    production.sitesDeploymentStatus !== "succeeded" ||
    production.sitesEnvironmentRevision !== 22 ||
    production.sitesArchiveSha256 !==
      "9435cfba1e32e6c762f2da18da11ebf472b158dc4d728032e7ecbf944804d187" ||
    production.sitesArchiveFileCount !== 52 ||
    production.sitesArchiveByteLength !== 6_082_560 ||
    production.sourceFileCount !== 236 ||
    production.sourceTreeSha256 !==
      "e8a2c1b8c0308b98a03b8cf34a7400f92e3100a9c8c006dff9fa8a4f0fdfa871" ||
    production.productionMigrationCount !== 58 ||
    production.migrationTreeSha256 !== rootMigrationTree.sha256 ||
    production.latestProductionMigration !== repairMigration ||
    production.generatedProductionMigrationVersion !== "20260814152601" ||
    production.generatedProductionMigrationName !==
      "durable_media_ingestion_path_regex_repair_v1" ||
    production.latestProductionMigrationByteLength !== 4_530 ||
    production.latestProductionMigrationSha256 !== latestMigrationSha256 ||
    production.databaseLedgerObserved !== true ||
    production.databaseAppliedThroughLatestObserved !== true ||
    production.githubMainMatchesCandidate !== true ||
    production.candidateSourceMatchesLiveSites !== true ||
    production.candidateMigrationsMatchLiveLedger !== true ||
    production.fullReleaseGatePassed !== false
  ) failures.push("schema-13 verified v56/database58 closeout drifted");

  if (
    !quality ||
    quality.testsPassed !== 479 ||
    quality.testsTotal !== 479 ||
    quality.testsFailed !== 0 ||
    quality.buildExitCode !== 0 ||
    quality.typecheckExitCode !== 0 ||
    quality.lintExitCode !== 0 ||
    quality.cleanInstallExitCode !== 0 ||
    quality.lintErrorCount !== 0 ||
    quality.lintWarningCount !== 0 ||
    quality.warningFree !== true ||
    quality.diffCheckExitCode !== 0
  ) failures.push("schema-13 local 479-test quality evidence drifted");

  if (
    review?.status !==
      "live58_path_repair_verified_no_database_change_for_deployed_host_inspection_diagnostics" ||
    review?.forwardRepairRequired !== false ||
    review?.functionalVerificationPassed !== true ||
    review?.additionalDatabaseChangesRequired !== false ||
    review?.localStaticReviewPassed !== true ||
    review?.localParserPassed !== true ||
    review?.hostedCleanChainApplyPassed !== true ||
    review?.hostedFullPgTapPassed !== true ||
    review?.hostedDatabaseExecutionPassed !== true ||
    review?.databaseApplyAuthorized !== false ||
    review?.foundationMigrationFilename !== foundationMigration ||
    review?.foundationMigrationSha256 !==
      "9c8178118ccea7b7bc51c39b4493b6e9dfa0fcf5c4f8bc1c5ebf25842c4a55f9" ||
    review?.foundationGeneratedProductionVersion !== "20260813175512" ||
    review?.repairMigrationFilename !== repairMigration ||
    review?.repairMigrationSha256 !== latestMigrationSha256 ||
    review?.repairMigrationByteLength !== 4_530 ||
    review?.futureProductionMigrationCount !== 58 ||
    review?.futureProductionMigrationTreeSha256 !== rootMigrationTree.sha256
  ) failures.push("schema-13 no-database-change review drifted");

  if (
    hold?.providerWrites !== false ||
    hold?.reviewReplies !== false ||
    hold?.websiteWrites !== false ||
    hold?.externalScheduling !== false ||
    hold?.externalPublishing !== false ||
    hold?.externalProvidersConnected !== false ||
    hold?.incrementalSpendUsd !== 0 ||
    record.fullReleaseGatePassed !== false
  ) failures.push("schema-13 external-action hold or gate drifted");

  if (
    recovery?.status !==
      "diagnostics_live_retry_failed_images_binding_unavailable" ||
    recovery?.strandedAssetId !==
      "05ab2303-f7ea-4056-8f75-9cd7e523a4f4" ||
    recovery?.storageObjectId !==
      "3df8b899-f438-41be-9e21-f15e6e7cb6c7" ||
    recovery?.storageObjectVersion !==
      "a6a293a9-4364-4867-878c-64bfc662dff9" ||
    recovery?.existingAssetMutated !== false ||
    recovery?.durableOutboxAtRegistrationImplemented !== true ||
    recovery?.durableOutboxAtRegistrationEffectiveInProduction !== true ||
    recovery?.pathBoundaryRepairApplied !== true ||
    recovery?.strandedAssetOutboxReceiptPresent !== true ||
    recovery?.outboxId !== "4f1259cf-8e8c-430c-a03d-2fa50c9117b9" ||
    recovery?.outboxState !== "dead_letter" ||
    recovery?.attemptCount !== 3 ||
    recovery?.lastFailureCode !== "media_not_assessable" ||
    recovery?.lastFailureStage !== "host_image_inspection" ||
    recovery?.lastHostInspectionFailureCode !==
      "images_binding_unavailable" ||
    recovery?.hostImagesBindingAvailable !== false ||
    recovery?.lastAttemptId !==
      "592be2cf-2263-4e17-92e5-5f1b271fffb3" ||
    recovery?.lastEvidenceSha256 !==
      "2e5ec41749a0cb24d72e5fa63bce1deb9f90218825c06964ee2e7c76cbc9ac9b" ||
    recovery?.firstSignedWakeRequestId !== 295 ||
    recovery?.firstSignedWakeHttpStatus !== 200 ||
    recovery?.secondSignedWakeRequestId !== 296 ||
    recovery?.secondSignedWakeHttpStatus !== 200 ||
    recovery?.thirdSignedWakeRequestId !== 297 ||
    recovery?.thirdSignedWakeHttpStatus !== 200 ||
    recovery?.thirdWorkerRequestId !== "a2b4b4caecc01709" ||
    recovery?.downloadedSize !== 3_969_765 ||
    recovery?.verificationCount !== 0 ||
    recovery?.singleRetryAuthorized !== true ||
    recovery?.singleRetryPerformed !== true ||
    recovery?.oneAdditionalRetryAuthorized !== true ||
    recovery?.oneAdditionalRetryPerformed !== true ||
    recovery?.furtherRetryAuthorized !== false ||
    recovery?.foundationApplied !== true ||
    recovery?.skipLockedLeaseWorker !== true ||
    recovery?.boundedAttempts !== 5 ||
    recovery?.independentFailureReceipt !== true ||
    recovery?.trustedByteDecodeAndHash !== true ||
    recovery?.endsAtPrivateVerification !== true ||
    recovery?.canMakeAssetReady !== false ||
    recovery?.providerCallAllowed !== false ||
    recovery?.externalWriteAllowed !== false ||
    recovery?.keyTransition?.phase !==
      "dual_public_key_cutover_source_deployed_v56"
  ) failures.push("schema-13 durable recovery incident contract drifted");

  if (
    runtime?.evidenceScope !==
      "production_observation_after_database58_sites_v56_and_third_signed_recovery_attempt" ||
    runtime?.assetCount !== 1 ||
    runtime?.storageObjectCount !== 1 ||
    runtime?.exactAssetVerificationCount !== 0 ||
    runtime?.exactAssetIntakeAttemptCount !== 3 ||
    runtime?.exactAssetTeamIncidentCount !== 1 ||
    runtime?.strandedAssetOutboxReceiptCount !== 1 ||
    runtime?.eligibleCanonicalPathAssetCount !== 1 ||
    runtime?.acceptedWakeNonceCount !== 1 ||
    runtime?.receiptState !== "dead_letter" ||
    runtime?.receiptAttemptCount !== 3 ||
    runtime?.lastFailureCode !== "media_not_assessable" ||
    runtime?.lastFailureStage !== "host_image_inspection" ||
    runtime?.lastHostInspectionFailureCode !==
      "images_binding_unavailable" ||
    runtime?.hostImagesBindingAvailable !== false
  ) failures.push("schema-13 runtime incident observation drifted");

  if (
    freeze?.automaticDeploymentsAllowed !== false ||
    freeze?.databaseApplyAuthorized !== false ||
    freeze?.sitesPublishAuthorized !== false ||
    freeze?.edgeDeployAuthorized !== false ||
    freeze?.deploymentAuthorized !== false ||
    freeze?.releaseCondition !==
      "a separate reviewed Images binding configuration or wiring repair and fresh retry authorization are required" ||
    typeof freeze?.allowedDeployment !== "string" ||
    !freeze.allowedDeployment.includes("none") ||
    !freeze.allowedDeployment.includes("retry was consumed")
  ) failures.push("schema-13 post-release authorization boundary drifted");

  const core = read(
    "artifacts/veroxa-sites/app/api/internal/momo/media/recover/core.ts",
  );
  const host = read(
    "artifacts/veroxa-sites/app/veroxa-private-media-host-image-decode.ts",
  );
  const recoveryTests = read(
    "artifacts/veroxa-sites/tests/momo-media-ingestion-recovery.test.mjs",
  );
  const assessmentTests = read(
    "artifacts/veroxa-sites/tests/veroxa-private-media-assessment.test.mjs",
  );
  if (
    !core.includes("const magicMime = detectMomoImageMimeType(bytes)") ||
    !core.includes("let inspection = await inspectMomoImageBytesFully(bytes)") ||
    !core.includes('(magicMime === "image/jpeg" || magicMime === "image/png")') ||
    !core.includes("dependencies.inspectImageWithHost") ||
    !core.includes("observed.hostInspectionDiagnostics = hostResult.diagnostics") ||
    !core.includes('stage: observed.hostInspectionDiagnostics?.status === "failed"') ||
    !core.includes('"host_image_inspection"') ||
    !core.includes("const contentSha256 = await momoBytesSha256(bytes)") ||
    !host.includes("rawInfo = await images.info") ||
    !host.includes('"images_info_failed"') ||
    !host.includes('status: "failed"') ||
    !host.includes('transform({ width: 1, height: 1, fit: "fill" })') ||
    !host.includes("info.fileSize !== input.bytes.byteLength") ||
    !recoveryTests.includes(
      "recovers a declared JPEG through the trusted host when strict structural inspection rejects compatible trailing bytes",
    ) ||
    !recoveryTests.includes("expectedHostCalls: 0") ||
    !recoveryTests.includes("hash the preserved original bytes") ||
    !assessmentTests.includes(
      "the host decoder binds native dimensions and consumes only a bounded one-pixel result",
    ) ||
    !assessmentTests.includes(
      "host inspection reports bounded stage diagnostics without raw errors",
    )
  ) failures.push("schema-13 fail-closed host-inspection diagnostics drifted");

  if (failures.length > 0) {
    throw new Error(
      "Unsafe schema-13 media-recovery host-inspection closeout: " +
        failures.join("; "),
    );
  }
}

export function assertDurableMediaIngestionCandidateManifest(
  manifest: DeploymentManifest,
): void {
  if (
    manifest.recordKind ===
    "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout"
  ) {
    assertMediaRecoveryByteInspectionCandidateManifest(manifest);
    return;
  }
  const failures: string[] = [];
  const record = manifest as unknown as Record<string, any>;
  const candidate = manifest.releaseCandidate;
  const quality = manifest.applicationQualityEvidence;
  const hold = manifest.operationalHold as Record<string, unknown> | undefined;
  const recovery = record.durableMediaIngestionRecovery as
    | Record<string, any>
    | undefined;
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
  const latestMigration = rootMigrationTree.files.at(-1);
  const expectedMigration =
    "20260813175640_durable_media_ingestion_path_regex_repair_v1.sql";
  const foundationMigration =
    "20260813163534_durable_media_ingestion_recovery.sql";
  const latestMigrationSha256 = latestMigration
    ? sha256File(resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT, latestMigration))
    : null;
  const read = (path: string): string =>
    readFileSync(resolve(repoRoot, path), "utf8");
  const migration = read(`${ROOT_MIGRATION_SOURCE_ROOT}/${foundationMigration}`);
  const repairMigration = read(
    `${ROOT_MIGRATION_SOURCE_ROOT}/${expectedMigration}`,
  );

  if (
    manifest.schemaVersion !== 13 ||
    manifest.recordKind !==
      "veroxa_momo_durable_media_ingestion_path_repair_candidate" ||
    manifest.releaseState !==
      "path_repair_candidate_pending_exact_head_gates_and_release" ||
    manifest.reviewedAt !== "2026-08-13" ||
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.candidateBranch !==
      "agent/momo-media-path-regex-repair-20260813" ||
    manifest.sitesProjectId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) failures.push("schema-12 candidate identity drifted");

  if (
    sourceTree.fileCount !== manifest.source.fileCount ||
    sourceTree.sha256 !== manifest.source.treeSha256 ||
    sourceTree.fileCount !== 236 ||
    sourceTree.sha256 !==
      "946f6de95e5cf1971db6464cc7f4e69817c58f7bade2f9b85f89bc1e43e59124" ||
    sourceTree.fileCount !== candidate.sourceFileCount ||
    sourceTree.sha256 !== candidate.sourceTreeSha256 ||
    rootMigrationTree.fileCount !== 58 ||
    rootMigrationTree.sha256 !==
      "1bdc5997489c860f5c6098b5c1f0af340db39f35cc69c0dfb52b5fa33faf5f6a" ||
    rootMigrationTree.fileCount !== mirrorMigrationTree.fileCount ||
    rootMigrationTree.sha256 !== mirrorMigrationTree.sha256 ||
    JSON.stringify(rootMigrationTree.files) !==
      JSON.stringify(mirrorMigrationTree.files) ||
    rootMigrationTree.fileCount !== manifest.migrations.fileCount ||
    rootMigrationTree.sha256 !== manifest.migrations.treeSha256 ||
    mirrorMigrationTree.fileCount !== manifest.migrations.mirrorFileCount ||
    mirrorMigrationTree.sha256 !== manifest.migrations.mirrorTreeSha256 ||
    rootMigrationTree.fileCount !== candidate.migrationFileCount ||
    rootMigrationTree.sha256 !== candidate.migrationTreeSha256 ||
    latestMigration !== expectedMigration ||
    candidate.latestCandidateMigration !== expectedMigration ||
    candidate.latestCandidateMigrationSha256 !== latestMigrationSha256
  ) failures.push("schema-12 source or mirrored migration fingerprint drifted");

  if (
    candidate.basedOnGitHubMainCommit !==
      "c41e6f71c7ffccf11d399d415046e3659e3bffd9" ||
    candidate.pullRequest !== null ||
    candidate.githubMerged !== false ||
    candidate.futureMergedGitHubCommit !== null ||
    candidate.reviewedLocally !== true ||
    candidate.sourceReviewPassed !== true ||
    candidate.qualityReviewPassed !== true ||
    candidate.fullReleaseGatePassed !== false ||
    JSON.stringify(candidate.pendingMigrations) !==
      JSON.stringify([expectedMigration]) ||
    candidate.databaseMigrationApplied !== false ||
    JSON.stringify(candidate.databaseMigrationsApplied) !==
      JSON.stringify([foundationMigration]) ||
    candidate.additionalDatabaseChangesRequired !== true ||
    candidate.databaseApplyAuthorized !== false ||
    candidate.sitesPublished !== false ||
    candidate.sitesPublishAuthorized !== false ||
    candidate.edgeDeployed !== false ||
    candidate.edgeDeployAuthorized !== false ||
    candidate.deploymentAuthorized !== false
  ) failures.push("schema-12 candidate overclaims remote release completion");

  const production = manifest.currentProductionObservation as
    Record<string, any>;
  const review = manifest.databaseContractReview as
    Record<string, any> | undefined;
  const runtime = record.currentRuntimeIdentityObservation as
    Record<string, any> | undefined;
  if (
    production.evidenceStatus !==
      "sites_v53_database57_foundation_applied_path_boundary_ineffective_one_stranded_asset" ||
    production.canonicalGitHubMainCommit !==
      "c41e6f71c7ffccf11d399d415046e3659e3bffd9" ||
    production.canonicalGitHubMainMergePullRequest !== 182 ||
    production.sitesVersion !== 53 ||
    production.sourceFileCount !== 227 ||
    production.sourceTreeSha256 !==
      "f36746fd569ee0b26c961c71e98dfc31308be4b5938a5902b145ecfbbd0c4348" ||
    production.productionMigrationCount !== 57 ||
    production.migrationTreeSha256 !==
      "070e95261d26e9dd88b3fcfc69f98c55c5fe95185118566530f538d14475645f" ||
    production.latestProductionMigration !== foundationMigration ||
    production.generatedProductionMigrationVersion !== "20260813175512" ||
    production.generatedProductionMigrationName !==
      "durable_media_ingestion_recovery" ||
    production.latestProductionMigrationByteLength !== 49_967 ||
    production.latestProductionMigrationSha256 !==
      "9c8178118ccea7b7bc51c39b4493b6e9dfa0fcf5c4f8bc1c5ebf25842c4a55f9" ||
    production.fullReleaseGatePassed !== false
  ) failures.push("schema-13 production foundation observation drifted");

  if (
    review?.forwardRepairRequired !== true ||
    review?.functionalVerificationPassed !== false ||
    review?.additionalDatabaseChangesRequired !== true ||
    review?.localStaticReviewPassed !== true ||
    review?.localParserPassed !== true ||
    review?.hostedCleanChainApplyPassed !== false ||
    review?.hostedFullPgTapPassed !== false ||
    review?.hostedDatabaseExecutionPassed !== false ||
    review?.databaseApplyAuthorized !== false ||
    review?.foundationMigrationFilename !== foundationMigration ||
    review?.foundationMigrationSha256 !==
      "9c8178118ccea7b7bc51c39b4493b6e9dfa0fcf5c4f8bc1c5ebf25842c4a55f9" ||
    review?.foundationGeneratedProductionVersion !== "20260813175512" ||
    review?.repairMigrationFilename !== expectedMigration ||
    review?.repairMigrationSha256 !== latestMigrationSha256 ||
    review?.repairMigrationSha256 !==
      "6bb6b50ec7e1980f65088062e4d6df95cdf5920c75528684fc86b71fbc998ed9" ||
    review?.repairMigrationByteLength !== 4_530 ||
    review?.futureProductionMigrationCount !== 58 ||
    review?.futureProductionMigrationTreeSha256 !== rootMigrationTree.sha256
  ) failures.push("schema-13 database repair review drifted");

  if (
    runtime?.evidenceScope !==
      "read_only_production_observation_after_database57_before_path_repair" ||
    runtime?.assetCount !== 1 ||
    runtime?.storageObjectCount !== 1 ||
    runtime?.exactAssetVerificationCount !== 0 ||
    runtime?.exactAssetIntakeAttemptCount !== 0 ||
    runtime?.exactAssetTeamIncidentCount !== 0 ||
    runtime?.contentLifecycleInvocationCountLast24h !== 0 ||
    runtime?.staleOrphanAiJobCount !== 0 ||
    runtime?.strandedAssetOutboxReceiptCount !== 0 ||
    runtime?.eligibleCanonicalPathAssetCount !== 1
  ) failures.push("schema-13 runtime incident observation drifted");

  if (
    !quality ||
    quality.testsPassed !== 476 ||
    quality.testsTotal !== 476 ||
    quality.testsFailed !== 0 ||
    quality.buildExitCode !== 0 ||
    quality.typecheckExitCode !== 0 ||
    quality.lintExitCode !== 0
  ) failures.push("schema-12 local 476-test quality evidence drifted");

  if (
    hold?.providerWrites !== false ||
    hold?.reviewReplies !== false ||
    hold?.websiteWrites !== false ||
    hold?.externalScheduling !== false ||
    hold?.externalPublishing !== false ||
    record.fullReleaseGatePassed !== false
  ) failures.push("schema-12 external-action hold or gate drifted");

  if (
    recovery?.status !== "foundation_applied_path_repair_pending" ||
    recovery?.strandedAssetId !==
      "05ab2303-f7ea-4056-8f75-9cd7e523a4f4" ||
    recovery?.storageObjectId !==
      "3df8b899-f438-41be-9e21-f15e6e7cb6c7" ||
    recovery?.storageObjectVersion !==
      "a6a293a9-4364-4867-878c-64bfc662dff9" ||
    recovery?.existingAssetMutated !== false ||
    recovery?.durableOutboxAtRegistrationImplemented !== true ||
    recovery?.durableOutboxAtRegistrationEffectiveInProduction !== false ||
    recovery?.pathBoundaryRepairApplied !== false ||
    recovery?.strandedAssetOutboxReceiptPresent !== false ||
    recovery?.foundationApplied !== true ||
    recovery?.skipLockedLeaseWorker !== true ||
    recovery?.boundedAttempts !== 5 ||
    recovery?.independentFailureReceipt !== true ||
    recovery?.trustedByteDecodeAndHash !== true ||
    recovery?.endsAtPrivateVerification !== true ||
    recovery?.canMakeAssetReady !== false ||
    recovery?.providerCallAllowed !== false ||
    recovery?.externalWriteAllowed !== false ||
    recovery?.totalPixelCeilingRemovedAcrossEdge !== true ||
    recovery?.keyTransition?.phase !==
      "dual_public_key_cutover_source_merged_not_deployed" ||
    recovery?.keyTransition?.deployed !== false ||
    recovery?.keyTransition?.dedicatedPrivateKeys !== 4 ||
    recovery?.keyTransition?.legacyPrivateKeyFallback !== false ||
    recovery?.keyTransition?.acceptedEdgePublicKeysPerFunction !== 2
  ) failures.push("schema-12 durable recovery contract drifted");

  if (
    !migration.includes("momo_media_ingestion_outbox_v1") ||
    !migration.includes("for update skip locked") ||
    !migration.includes("limit 100") ||
    !migration.includes("max_attempts integer not null default 5") ||
    !migration.includes("veroxa_record_momo_media_intake_failure_v1") ||
    !migration.includes("veroxa_complete_momo_media_ingestion_v1") ||
    migration.includes("'advance_verified_asset'") ||
    migration.includes("provider_writes = true") ||
    migration.includes("external_write_allowed = true")
  ) failures.push("schema-12 migration safety invariants drifted");

  const repairLockIndex = repairMigration.indexOf(
    "lock table public.veroxa_media_assets in share row exclusive mode",
  );
  const repairAlterIndex = repairMigration.indexOf(
    "alter table veroxa_private.momo_media_ingestion_outbox_v1",
  );
  const repairFunctionIndex = repairMigration.indexOf(
    "create or replace function",
  );
  const repairBackfillIndex = repairMigration.indexOf("do $$");
  if (
    repairLockIndex < 0 ||
    repairAlterIndex < 0 ||
    repairAlterIndex >= repairLockIndex ||
    repairLockIndex >= repairFunctionIndex ||
    repairFunctionIndex >= repairBackfillIndex ||
    !repairMigration.includes(
      "momo_media_ingestion_outbox_storage_path_v2_check",
    ) ||
    !repairMigration.includes("[.](jpg|jpeg|png)$") ||
    !repairMigration.includes(
      "momo_media_ingestion_path_repair_backfill_incomplete_v1",
    ) ||
    /\\+\.\(jpg\|jpeg\|png\)/u.test(repairMigration) ||
    repairMigration.includes("provider_writes = true") ||
    repairMigration.includes("external_write_allowed = true")
  ) failures.push("schema-12 forward path-repair invariants drifted");

  const rootRepairTest = read(
    "supabase/tests/momo_media_ingestion_path_regex_repair_v1.sql",
  );
  const sitesRepairTest = read(
    "artifacts/veroxa-sites/supabase/tests/momo_media_ingestion_path_regex_repair_v1.sql",
  );
  if (
    rootRepairTest !== sitesRepairTest ||
    !rootRepairTest.includes("select plan(7)") ||
    !rootRepairTest.includes("request.jwt.claim.sub") ||
    !rootRepairTest.includes("external_write_allowed")
  ) failures.push("schema-12 forward path-repair pgTAP mirror drifted");

  const mirroredPaths = [
    "functions/_shared/momo-content-ai-lifecycle-contract.ts",
    "functions/momo-content-ai-dispatch-lifecycle/index.ts",
    "functions/momo-content-ai-lifecycle/index.ts",
    "functions/momo-content-ai-webhook-lifecycle/index.ts",
    "functions/momo-media-ai-lifecycle/index.ts",
  ];
  for (const path of mirroredPaths) {
    if (read(`supabase/${path}`) !== read(`artifacts/veroxa-sites/supabase/${path}`)) {
      failures.push(`schema-12 root/Sites Edge mirror drifted: ${path}`);
    }
  }
  const lifecycleContract = read(
    "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  );
  if (
    lifecycleContract.includes("16_777_216") ||
    lifecycleContract.includes("16777216") ||
    !lifecycleContract.includes(
      "Number.isSafeInteger(Number(body.width) * Number(body.height))",
    )
  ) failures.push("schema-12 Edge high-resolution contract drifted");

  const bridgePaths = [
    "app/momo-content-ai-dispatch-bridge.ts",
    "app/momo-content-ai-lifecycle-bridge.ts",
    "app/momo-content-ai-webhook-bridge.ts",
    "app/momo-media-ai-lifecycle-bridge.ts",
  ];
  const bridgeSource = bridgePaths
    .map((path) => read(`artifacts/veroxa-sites/${path}`))
    .join("\n");
  for (const key of [
    "VEROXA_MOMO_CONTENT_AI_DISPATCH_BRIDGE_PRIVATE_KEY",
    "VEROXA_MOMO_CONTENT_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY",
    "VEROXA_MOMO_CONTENT_AI_WEBHOOK_BRIDGE_PRIVATE_KEY",
    "VEROXA_MOMO_MEDIA_AI_LIFECYCLE_BRIDGE_PRIVATE_KEY",
  ]) if (!bridgeSource.includes(key)) failures.push(`missing dedicated bridge key: ${key}`);
  if (bridgeSource.includes("VEROXA_MEDIA_AI_BRIDGE_PRIVATE_KEY")) {
    failures.push("legacy shared bridge private-key fallback remains in runtime source");
  }

  if (failures.length > 0) {
    throw new Error(
      "Unsafe schema-12 durable media-ingestion candidate: " +
        failures.join("; "),
    );
  }
}

export function assertCurrentReconciliationManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  const live = manifest.currentProductionObservation;
  const candidate = manifest.releaseCandidate;
  const hold = manifest.operationalHold;
  const edge = manifest.edgeDeployment;
  const highResolutionRelease = (
    manifest as unknown as Record<string, unknown>
  ).legacyMediaPurgeAndHighResolutionRelease as
    | Record<string, any>
    | undefined;
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
  const latestMigration = rootMigrationTree.files.at(-1);
  const latestMigrationSha256 = latestMigration
    ? sha256File(
        resolve(repoRoot, ROOT_MIGRATION_SOURCE_ROOT, latestMigration),
      )
    : null;
  const externalLocks =
    hold?.providerWrites === false &&
    hold?.reviewReplies === false &&
    hold?.websiteWrites === false &&
    hold?.externalScheduling === false;

  if (
    manifest.schemaVersion !== 11 ||
    manifest.recordKind !==
      "veroxa_momo_live56_high_resolution_media_manifest" ||
    manifest.releaseState !==
      "live56_sites_v53_legacy_media_purged_total_pixel_ceiling_removed_external_actions_held" ||
    manifest.reviewedAt !== "2026-08-12" ||
    manifest.canonicalRepository !== "farazmunirgohar-vxa/Veroxa" ||
    manifest.canonicalBranch !== "main" ||
    manifest.sitesProjectId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de"
  ) {
    failures.push("schema-11 high-resolution release identity drifted");
  }

  if (
    sourceTree.fileCount !== 227 ||
    sourceTree.sha256 !==
      "f36746fd569ee0b26c961c71e98dfc31308be4b5938a5902b145ecfbbd0c4348" ||
    manifest.source.fileCount !== sourceTree.fileCount ||
    manifest.source.treeSha256 !== sourceTree.sha256 ||
    rootMigrationTree.fileCount !== 56 ||
    rootMigrationTree.sha256 !==
      "8d6f2b940bee42462c50349101af36f5efedb4f7d4309a18167261fbd342c8fe" ||
    mirrorMigrationTree.fileCount !== rootMigrationTree.fileCount ||
    mirrorMigrationTree.sha256 !== rootMigrationTree.sha256 ||
    JSON.stringify(rootMigrationTree.files) !==
      JSON.stringify(mirrorMigrationTree.files) ||
    manifest.migrations.fileCount !== rootMigrationTree.fileCount ||
    manifest.migrations.treeSha256 !== rootMigrationTree.sha256 ||
    manifest.migrations.mirrorFileCount !== mirrorMigrationTree.fileCount ||
    manifest.migrations.mirrorTreeSha256 !== mirrorMigrationTree.sha256 ||
    latestMigration !==
      "20260812221509_restore_high_resolution_media_finalize_service_role_v1.sql" ||
    latestMigrationSha256 !==
      "8a740ea365a462e9c9dea55f795f2025bfff7f9fe4db3bb25d2bfaab535988b3"
  ) {
    failures.push("schema-11 source or migration fingerprint drifted");
  }

  if (
    live.sitesVersion !== 53 ||
    live.sitesVersionId !==
      "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_6e36025a6f248191a047d9bbdd04d90a" ||
    live.sitesCheckoutCommit !==
      "f21cd4e9b99d601d8e3df9b221e14b513a8ac2d6" ||
    live.sitesEnvironmentRevision !== 14 ||
    live.sourceFileCount !== sourceTree.fileCount ||
    live.sourceTreeSha256 !== sourceTree.sha256 ||
    live.productionMigrationCount !== 56 ||
    live.migrationTreeSha256 !== rootMigrationTree.sha256 ||
    live.latestProductionMigration !== latestMigration ||
    live.latestProductionMigrationByteLength !== 652 ||
    live.latestProductionMigrationSha256 !== latestMigrationSha256 ||
    live.githubMainMatchesCandidate !== false ||
    live.candidateSourceMatchesLiveSites !== true ||
    live.candidateMigrationsMatchLiveLedger !== true ||
    live.fullReleaseGatePassed !== true
  ) {
    failures.push("schema-11 live Sites/database observation drifted");
  }

  if (
    candidate.status !== manifest.releaseState ||
    candidate.basedOnGitHubMainCommit !==
      "fb6d8b13bf548fd144cec4ce241bd44c1cecc99f" ||
    candidate.pullRequest !== 180 ||
    candidate.githubMerged !== false ||
    candidate.futureMergedGitHubCommit !== null ||
    candidate.futureSitesVersion !== 53 ||
    candidate.reviewedLocally !== true ||
    candidate.sourceReviewPassed !== true ||
    candidate.qualityReviewPassed !== true ||
    candidate.candidateSourceMatchesLiveSites !== true ||
    candidate.candidateMigrationsMatchLiveLedger !== true ||
    candidate.githubMainMatchesCandidate !== false ||
    candidate.fullReleaseGatePassed !== true ||
    (candidate.pendingMigrations ?? []).length !== 0 ||
    candidate.sourceFileCount !== sourceTree.fileCount ||
    candidate.sourceTreeSha256 !== sourceTree.sha256 ||
    candidate.migrationFileCount !== rootMigrationTree.fileCount ||
    candidate.migrationTreeSha256 !== rootMigrationTree.sha256 ||
    candidate.latestCandidateMigration !== latestMigration ||
    candidate.latestCandidateMigrationSha256 !== latestMigrationSha256 ||
    candidate.databaseMigrationApplied !== true ||
    candidate.sitesPublished !== true
  ) {
    failures.push("schema-11 candidate release evidence drifted");
  }

  const quality = manifest.applicationQualityEvidence;
  if (
    !quality ||
    quality.testsPassed !== 443 ||
    quality.testsTotal !== 443 ||
    quality.testsFailed !== 0 ||
    quality.buildExitCode !== 0 ||
    quality.typecheckExitCode !== 0 ||
    quality.lintExitCode !== 0
  ) {
    failures.push("schema-11 443-test application quality evidence drifted");
  }

  if (
    !highResolutionRelease ||
    highResolutionRelease.status !== "completed_verified" ||
    highResolutionRelease.exactLegacyAssetCount !== 3 ||
    highResolutionRelease.exactLegacyBackingObjectCount !== 3 ||
    highResolutionRelease.relatedRowsPurged !== true ||
    highResolutionRelease.databaseAssetsRemaining !== 0 ||
    highResolutionRelease.storageObjectsRemaining !== 0 ||
    highResolutionRelease.permanent !== true ||
    highResolutionRelease.recoverable !== false ||
    highResolutionRelease.broadDeletionPerformed !== false ||
    highResolutionRelease.automaticDeletionPolicyCreated !== false ||
    highResolutionRelease.reusablePurgeEndpointAvailable !== false ||
    highResolutionRelease.temporaryPurgeFunctionState !==
      "inert_v2_verify_jwt_true_http_410" ||
    highResolutionRelease.formerTotalPixelCeiling !== 16_777_216 ||
    highResolutionRelease.totalPixelCeilingRemoved !== true ||
    highResolutionRelease.highResolutionContractWidth !== 8064 ||
    highResolutionRelease.highResolutionContractHeight !== 6048 ||
    highResolutionRelease.migration?.filename !==
      "20260812214257_high_resolution_private_media_v1.sql" ||
    highResolutionRelease.migration?.sha256 !==
      "3e8476bc4216a67fd591b5b611388be2873e44eb87c957934b280681d7bfe065" ||
    highResolutionRelease.migration?.totalPixelConstraintRemoved !== true ||
    highResolutionRelease.migration?.finalizeRpcPixelCeilingRemoved !== true ||
    highResolutionRelease.privilegeRepair?.filename !== latestMigration ||
    highResolutionRelease.privilegeRepair?.sha256 !== latestMigrationSha256 ||
    highResolutionRelease.privilegeRepair?.serviceRoleExecuteRestored !== true ||
    highResolutionRelease.privilegeRepair?.anonExecute !== false ||
    highResolutionRelease.privilegeRepair?.authenticatedExecute !== false ||
    highResolutionRelease.trustedHostDecodeRequired !== true ||
    highResolutionRelease.pngDecodedStreamCeilingRemoved !== true ||
    highResolutionRelease.sites?.version !== 53 ||
    highResolutionRelease.sites?.versionId !== live.sitesVersionId ||
    highResolutionRelease.sites?.sourceCommit !== live.sitesCheckoutCommit ||
    highResolutionRelease.sites?.deployed !== true
  ) {
    failures.push(
      "schema-11 purge or high-resolution acceptance evidence drifted",
    );
  }

  if (
    edge?.functionVersion !== 11 ||
    edge.verifyJwt !== true ||
    edge.providerCallObserved !== false ||
    edge.realUploadObserved !== false ||
    !externalLocks
  ) {
    failures.push("schema-11 Edge or external-action locks drifted");
  }

  if (failures.length > 0) {
    throw new Error(
      "Unsafe schema-11 live56 high-resolution media release: " +
        failures.join("; "),
    );
  }
}

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  if (manifest.schemaVersion === 13) {
    assertDurableMediaIngestionCandidateManifest(manifest);
    return;
  }
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
  if (manifest.schemaVersion === 13) {
    assertDurableMediaIngestionCandidateManifest(manifest);
    return;
  }
  if (manifest.schemaVersion === 11) {
    assertCurrentReconciliationManifest(manifest);
    const quality = manifest.applicationQualityEvidence;
    if (!quality || quality.testsTotal !== 443 || quality.testsPassed !== 443 || quality.testsFailed !== 0 || !manifest.releaseCandidate.reviewedLocally || manifest.releaseCandidate.sourceReviewPassed !== true || manifest.releaseCandidate.qualityReviewPassed !== true) throw new Error("Schema-11 release lacks reviewed source or 443-test evidence");
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
