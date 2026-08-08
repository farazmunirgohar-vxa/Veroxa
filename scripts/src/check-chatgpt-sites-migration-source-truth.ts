const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LIVE_PRODUCTION_EVIDENCE_STATUS,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
  VERIFIED_GITHUB_PARITY_STATUS,
  V36_GITHUB_RECONCILIATION,
  V36_LIVE_PARITY_EVIDENCE,
  V36_OPERATIONAL_COMMIT_SCOPE,
  assertReviewedLocalCandidateManifest,
} from "./release-manifest";
const repoRoot = resolve(import.meta.dirname, "../..");
const read = __name(
  (path: string) => readFileSync(resolve(repoRoot, path), "utf8"),
  "read",
);
const failures: string[] = [];
const must = __name((condition: boolean, message: string) => {
  if (!condition) failures.push(message);
}, "must");
const HISTORICAL_LIVE_MIGRATION_TREE_SHA256 =
  "d306d26cb633ef943afdb7efd01a3cde70249a096ef783d1b0d51eb5d4a1a429";
const CURRENT_LIVE_MIGRATION_TREE_SHA256 =
  "8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c";
const CANDIDATE_MIGRATION_TREE_SHA256 =
  "9cc0bba007b6a0c06edf33563fb1bc3f4650811f8f8ea1639cc58c7028ac7324";
const CURRENT_LIVE_SITES_TREE_SHA256 =
  "4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292";
const CANDIDATE_SITES_TREE_SHA256 =
  "357f6b336993d2c306c102d5be2699d7145a3144041eeb9753a2a43c48fe869e";
const HISTORICAL_LIVE_LATEST_MIGRATION =
  "20260802063829_momo_pipeline_query_indexes_v2.sql";
const CURRENT_LIVE_LATEST_MIGRATION =
  "20260808041629_repair_momo_client_v3_displayed_asset_scope.sql";
const CURRENT_LIVE_LATEST_MIGRATION_SHA256 =
  "6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba";
const appliedForwardMigrations = [
  "20260808001210_audit_intake_envelope_v2.sql",
  "20260808001430_momo_client_pipeline_readback_v3.sql",
  "20260808001842_retire_audit_intake_v1.sql",
  "20260808001853_retire_momo_client_pipeline_readback_v2.sql",
  "20260808002609_future_object_default_acl_hardening.sql",
  CURRENT_LIVE_LATEST_MIGRATION,
];
const pendingForwardMigrations = [
  "20260808045812_momo_ready_team_decisions_and_food_tags_v2.sql",
] as const;
function rolloutMatchesPartialProduction(record: any): boolean {
  const rollout = record?.rolloutSequence;
  const steps = rollout?.steps;
  if (
    !Array.isArray(steps) ||
    steps.length !== 9 ||
    rollout?.status !== "predeployment_v5_cutover_freeze_required"
  ) {
    return false;
  }
  return (
    steps.every(
      (step: any) =>
        step?.completed === false && step?.explicitReviewRequired === true,
    ) &&
    steps[1]?.id === "freeze_content_v4_ingress" &&
    steps[2]?.id === "drain_v4_content_work" &&
    steps[3]?.id === "apply_momo_ready_v5_exact_bytes" &&
    steps[3]?.migration === pendingForwardMigrations[0] &&
    steps[5]?.id === "reconcile_generated_migration_version" &&
    steps[6]?.id === "publish_v5_sites_candidate" &&
    steps[8]?.id === "restore_bounded_internal_ingress"
  );
}
function sqlFiles(directory: string): string[] {
  return readdirSync(resolve(repoRoot, directory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
}
__name(sqlFiles, "sqlFiles");
function migrationTreeHash(directory: string, files: string[]): string {
  const hash = createHash("sha256");
  for (const filename of files) {
    hash.update(filename, "utf8");
    hash.update("\0");
    hash.update(readFileSync(join(repoRoot, directory, filename)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
__name(migrationTreeHash, "migrationTreeHash");
const agents = read("AGENTS.md");
const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const currentMilestone = read(
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
);
const protocol = read(
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
);
const memory = read("artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const foundingPilot = read(
  "artifacts/veroxa/docs/MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md",
);
const deploymentManifest = read(
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);
const deploymentManifestRecord = JSON.parse(deploymentManifest);
const localCandidateManifest = JSON.parse(deploymentManifest);
const v36CloseoutRecord = JSON.parse(
  read("artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json"),
);
const v22CloseoutRecord = JSON.parse(
  read("artifacts/veroxa/docs/MOMO_MEDIA_V22_LIVE_CLOSEOUT.json"),
);
const v20CloseoutRecord = JSON.parse(
  read("artifacts/veroxa/docs/MOMO_MEDIA_V20_LIVE_CLOSEOUT.json"),
);
const rrReleaseCheckpointRecord = JSON.parse(
  read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"),
);
const rrLocalCandidateRecord = JSON.parse(
  read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"),
);
const migration = read(
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
);
const lockedModel = read("artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md");
const currentStateReadme = read(
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
);
const preBuild = read("artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md");
const currentMaster = read("artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md");
const aiStrategy = read(
  "artifacts/veroxa/docs/AI_READY_BUT_NOT_CONNECTED_STRATEGY.md",
);
const integrationStrategy = read(
  "artifacts/veroxa/docs/INTEGRATION_READY_BUT_NOT_CONNECTED_STRATEGY.md",
);
const onboardingStrategy = read(
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_GAP_AND_BUILD_PLAN.md",
);
const preliveMap = read(
  "artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md",
);
const prePaidGate = read("artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md");
const pricingTruth = read("artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md");
const currentRealModel = read(
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
);
const alignedCurrentDocs = [
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/PACKAGE_BOUNDARY_AND_REQUEST_ENFORCEMENT.md",
  "artifacts/veroxa/docs/PORTAL_REQUEST_SLA_24_HOUR_MODEL.md",
  "artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md",
  "artifacts/veroxa/docs/MEDIA_INTELLIGENCE_LAYER.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_V1.md",
].map(read);
const sitesRouter = read("artifacts/veroxa-sites/app/page.tsx");
const sitesReadme = read("artifacts/veroxa-sites/README.md");
const sitesHosting = read("artifacts/veroxa-sites/.openai/hosting.json");
const retiredSourceRemoval = read(
  "artifacts/veroxa/docs/RETIRED_SOURCE_REMOVAL.md",
);
const workspace = read("pnpm-workspace.yaml");
const sourceTruth = [
  agents,
  activeDocs,
  currentMilestone,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
  foundingPilot,
  deploymentManifest,
].join("\n");
const governedDocs = [
  agents,
  activeDocs,
  currentMilestone,
  protocol,
  memory,
  status,
  migration,
  lockedModel,
  currentStateReadme,
  foundingPilot,
  deploymentManifest,
  preBuild,
  currentMaster,
  aiStrategy,
  integrationStrategy,
  onboardingStrategy,
  preliveMap,
  prePaidGate,
  pricingTruth,
  currentRealModel,
  ...alignedCurrentDocs,
  sitesReadme,
].join("\n");
const rootMigrationLedger = sqlFiles("supabase/migrations");
const sitesMigrationLedger = sqlFiles(
  "artifacts/veroxa-sites/supabase/migrations",
);
const pendingSet = new Set<string>(pendingForwardMigrations);
const currentLiveMigrationLedger = rootMigrationLedger.filter(
  (filename) => !pendingSet.has(filename),
);
const sitesCurrentLiveMigrationLedger = sitesMigrationLedger.filter(
  (filename) => !pendingSet.has(filename),
);
const historicalLiveMigrationLedger = rootMigrationLedger.slice(0, 37);
const sitesHistoricalLiveMigrationLedger = sitesMigrationLedger.slice(0, 37);
must(
  JSON.stringify(rootMigrationLedger) === JSON.stringify(sitesMigrationLedger),
  "Root and Sites candidate migration inventories must remain identical.",
);
must(
  JSON.stringify(pendingForwardMigrations) ===
    JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS),
  "Release-manifest pending migrations must contain only provisional 045812.",
);
must(
  rootMigrationLedger.at(-1) === pendingForwardMigrations[0] &&
    sitesMigrationLedger.at(-1) === pendingForwardMigrations[0] &&
    currentLiveMigrationLedger.at(-1) === CURRENT_LIVE_LATEST_MIGRATION &&
    sitesCurrentLiveMigrationLedger.at(-1) === CURRENT_LIVE_LATEST_MIGRATION,
  "The candidate must append only provisional 045812 to exact live43.",
);
must(
  currentLiveMigrationLedger.length === 43 &&
    JSON.stringify(currentLiveMigrationLedger) ===
      JSON.stringify(sitesCurrentLiveMigrationLedger) &&
    currentLiveMigrationLedger.at(-1) === CURRENT_LIVE_LATEST_MIGRATION &&
    migrationTreeHash("supabase/migrations", currentLiveMigrationLedger) ===
      CURRENT_LIVE_MIGRATION_TREE_SHA256 &&
    migrationTreeHash(
      "artifacts/veroxa-sites/supabase/migrations",
      sitesCurrentLiveMigrationLedger,
    ) === CURRENT_LIVE_MIGRATION_TREE_SHA256,
  "Active migration source must preserve the exact live43 production ledger through 20260808041629.",
);
must(
  JSON.stringify(currentLiveMigrationLedger.slice(-6)) ===
    JSON.stringify(appliedForwardMigrations),
  "Live43 must extend historical37 by exactly applied 01210, 01430, 01842, 01853, 02609, and 041629.",
);
must(
  historicalLiveMigrationLedger.length === 37 &&
    JSON.stringify(historicalLiveMigrationLedger) ===
      JSON.stringify(sitesHistoricalLiveMigrationLedger) &&
    historicalLiveMigrationLedger.at(-1) === HISTORICAL_LIVE_LATEST_MIGRATION &&
    migrationTreeHash("supabase/migrations", historicalLiveMigrationLedger) ===
      HISTORICAL_LIVE_MIGRATION_TREE_SHA256 &&
    migrationTreeHash(
      "artifacts/veroxa-sites/supabase/migrations",
      sitesHistoricalLiveMigrationLedger,
    ) === HISTORICAL_LIVE_MIGRATION_TREE_SHA256,
  "The historical37 d306d26c production prefix must remain immutable inside live43.",
);
must(
  rootMigrationLedger.length === 44 &&
    migrationTreeHash("supabase/migrations", rootMigrationLedger) ===
      CANDIDATE_MIGRATION_TREE_SHA256 &&
    migrationTreeHash(
      "artifacts/veroxa-sites/supabase/migrations",
      sitesMigrationLedger,
    ) === CANDIDATE_MIGRATION_TREE_SHA256,
  "Local DB44 candidate migration inventory or mirror fingerprint drifted.",
);
for (const retiredNormalizedFilename of [
  "20260802010000_momo_upload_veroxa_ready_v2.sql",
  "20260802013000_momo_client_pipeline_readback_v2.sql",
  "20260802020000_momo_pipeline_query_indexes_v2.sql",
]) {
  must(
    !rootMigrationLedger.includes(retiredNormalizedFilename) &&
      !sitesMigrationLedger.includes(retiredNormalizedFilename),
    `Normalized non-ledger migration timestamp remains active: ${retiredNormalizedFilename}`,
  );
}
for (const marker of [
  "Momo's House San Antonio",
  "founding pilot",
  "secure, persistent, human-controlled Momo operating loop",
  "Restaurant Audit Center",
  "does not become an operational client",
  "Other restaurants",
  "VEROXA_DEPLOYMENT_MANIFEST.json",
  "Sites version 15",
  "all four required workflows",
  "Mandatory post-build continuity update",
  "After every build",
]) {
  must(
    currentMilestone.includes(marker),
    `Current milestone missing locked scope marker: ${marker}`,
  );
}
for (const document of [agents, activeDocs, protocol, memory, status]) {
  for (const marker of [
    "VEROXA_CURRENT_MILESTONE.md",
    "Momo's House San Antonio",
    "Restaurant Audit Center",
    "operational client",
  ]) {
    must(
      document.includes(marker),
      `Durable operating document missing current milestone marker: ${marker}`,
    );
  }
}
for (const marker of [
  "Mandatory post-build continuity update",
  "After every build",
  "CURRENT_BUILD_STATUS.md",
  "plain-language handoff",
  "what remains inactive",
]) {
  must(
    protocol.includes(marker),
    `Build protocol missing continuity marker: ${marker}`,
  );
}
for (const path of [
  "/",
  "/free-audit",
  "/login",
  "/client/dashboard",
  "/client/onboarding",
  "/client/media",
  "/client/reports",
  "/team/momo",
  "/team/momo/work",
  "/team/momo/intelligence",
  "/team/momo/content-ai",
  "/team/momo/reports",
  "/team/momo/readiness",
]) {
  must(
    migration.includes(`\`${path}\``) ||
      [
        "/",
        "/free-audit",
        "/login",
        "/client/dashboard",
        "/client/onboarding",
        "/client/media",
        "/client/reports",
      ].includes(path),
    `Migration document missing grouped route: ${path}`,
  );
}
for (const path of [
  "/",
  "/free-audit",
  "/login",
  "/client/dashboard",
  "/client/onboarding",
  "/client/media",
  "/client/reports",
  "/team/momo",
  "/team/momo/work",
  "/team/momo/intelligence",
  "/team/momo/content-ai",
  "/team/momo/reports",
  "/team/momo/readiness",
  "/team/audits",
]) {
  must(
    sitesRouter.includes(`"${path}"`),
    `Sites delivery layer missing migration-critical route: ${path}`,
  );
}
for (const marker of [
  "GitHub `main` remains the canonical source of truth",
  "ChatGPT is Faraz's primary",
  "ChatGPT Sites",
  "not a new demo",
  "Vercel is retired",
  "veroxasystems.com",
  "RR",
]) {
  must(
    sourceTruth.includes(marker),
    `Active migration source-of-truth missing marker: ${marker}`,
  );
}
for (const marker of [
  "9749b68ce2cfc383deeae6aa63c413019ef61385",
  "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
  "Sites version 15",
  "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql",
  "192505ca4631e55f35b28f0c849a7d380bc1a709e5ae89adca742d7d349da45e",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
  "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
  "verified_reconciliation_cleanup_deployed",
  "post_release_cleanup_deployed",
  "Sites v36",
  "MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
  "20260802063829_momo_pipeline_query_indexes_v2.sql",
  "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  "674e1a7c0d140c9b281029277baeb2e68962dac2",
  "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  "Sites version 13",
  "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
]) {
  must(
    sourceTruth.includes(marker),
    `Active source truth missing production-reconciliation marker: ${marker}`,
  );
}
const releaseCandidate = localCandidateManifest.releaseCandidate;
const historicalV20Github = v20CloseoutRecord.github;
const historicalV20Sites = v20CloseoutRecord.sites;
const historicalV20Database = v20CloseoutRecord.database;
must(
  historicalV20Github !== void 0 &&
    historicalV20Sites !== void 0 &&
    historicalV20Database !== void 0 &&
    v20CloseoutRecord.recordKind === "momo_media_v20_live_closeout" &&
    v20CloseoutRecord.status === "deployed_foundation_momo_no_go" &&
    historicalV20Github.pullRequest === 152 &&
    historicalV20Github.reviewedHead ===
      "b170c4339ae43755f17a19d74107cb75c6b198d3" &&
    historicalV20Github.mergedCommit ===
      "29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7" &&
    historicalV20Github.zeroUnresolvedReviewThreads === true &&
    Object.values(historicalV20Github.workflows ?? {}).length === 4 &&
    Object.values(historicalV20Github.workflows ?? {}).every(
      (workflow: any) => workflow.status === "success",
    ) &&
    historicalV20Sites.versionNumber === 20 &&
    historicalV20Sites.checkoutCommit ===
      "aceb17bb446854d48a71e54ba814591cf2c19d33" &&
    historicalV20Sites.deploymentStatus === "succeeded" &&
    historicalV20Database.productionMigrationCount === 15 &&
    historicalV20Database.latestAppliedMigration ===
      "20260722000100_momo_client_media_status_v1.sql",
  "Immutable Sites v20 closeout evidence must remain exact and independently historical.",
);
const closeoutGithub = v22CloseoutRecord.github;
const closeoutSites = v22CloseoutRecord.sites;
const closeoutSource = v22CloseoutRecord.sourceParity;
const closeoutDatabase = v22CloseoutRecord.database;
const closeoutBridge = v22CloseoutRecord.lifecycleBridge;
const closeoutPostDeploy = v22CloseoutRecord.postDeployVerification;
const closeoutMomo = v22CloseoutRecord.momoOperationalEvidence;
const closeoutBoundaries = v22CloseoutRecord.boundaries;
const lastGitHubParityRelease =
  deploymentManifestRecord.lastGitHubParityRelease;
const rrLastGitHubParityRelease =
  rrReleaseCheckpointRecord.lastGitHubParityRelease;
const historicalV22CloseoutIsExact =
  closeoutGithub !== void 0 &&
  closeoutSites !== void 0 &&
  closeoutSource !== void 0 &&
  closeoutDatabase !== void 0 &&
  closeoutBridge !== void 0 &&
  closeoutPostDeploy !== void 0 &&
  closeoutMomo !== void 0 &&
  closeoutBoundaries !== void 0 &&
  v22CloseoutRecord.recordKind === "momo_media_v22_live_closeout" &&
  v22CloseoutRecord.status === "deployed_lifecycle_bridge_momo_no_go" &&
  closeoutGithub.pullRequest === 155 &&
  closeoutGithub.reviewedHead === "96a6c00857b438b37c2e8d99329c0f556de850a2" &&
  closeoutGithub.mergedCommit === "d1f6a9a78ac54cd5447689d5f8b3d42466daf479" &&
  closeoutGithub.zeroUnresolvedReviewThreads === true &&
  JSON.stringify(Object.keys(closeoutGithub.workflows ?? {}).sort()) ===
    JSON.stringify(["ci", "sitesVerify", "supabaseVerify", "veroxaVerify"]) &&
  Object.values(closeoutGithub.workflows ?? {}).every(
    (workflow: any) => workflow.status === "success",
  ) &&
  closeoutGithub.workflows?.ci?.runId === 30591061627 &&
  closeoutGithub.workflows?.sitesVerify?.runId === 30591061604 &&
  closeoutGithub.workflows?.supabaseVerify?.runId === 30591061598 &&
  closeoutGithub.workflows?.supabaseVerify?.fullMigrationResetPassed === true &&
  closeoutGithub.workflows?.supabaseVerify?.databaseTestsPassed === true &&
  closeoutGithub.workflows?.supabaseVerify?.functionFormatLintAndCheckPassed ===
    true &&
  closeoutGithub.workflows?.veroxaVerify?.runId === 30591061628 &&
  closeoutSites.versionNumber === 22 &&
  closeoutSites.checkoutCommit === "83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e" &&
  closeoutSites.deploymentStatus === "succeeded" &&
  closeoutSites.liveUrl === "https://veroxasystems.com" &&
  closeoutSites.environmentRevision === 5 &&
  JSON.stringify(closeoutSites.customDomains) ===
    JSON.stringify([
      {
        hostname: "veroxasystems.com",
        httpStatus: 200,
        status: "active",
        sslStatus: "active",
        providerStatus: "active",
      },
      {
        hostname: "www.veroxasystems.com",
        httpStatus: 200,
        status: "active",
        sslStatus: "active",
        providerStatus: "active",
      },
    ]) &&
  closeoutSource.sitesFileCount === 93 &&
  closeoutSource.sitesTreeSha256 ===
    "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490" &&
  closeoutSource.migrationFileCount === 16 &&
  closeoutSource.migrationTreeSha256 ===
    "09aab45cda17810b52a07429700a4557308405d40a3983635d6bb7848dd4c729" &&
  closeoutDatabase.databaseChangeRequiredForV22 === false &&
  closeoutDatabase.databaseMigrationAppliedByV22 === false &&
  closeoutDatabase.productionMigrationCount === 16 &&
  closeoutDatabase.latestAppliedMigration ===
    "20260728044916_momo_media_ai_pilot_v1.sql" &&
  closeoutDatabase.latestAppliedMigrationSha256 ===
    "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1" &&
  closeoutBridge.deployed === true &&
  closeoutBridge.edgeFunction === "momo-media-ai-lifecycle" &&
  closeoutBridge.edgeFunctionVersion === 1 &&
  closeoutBridge.edgeFunctionStatus === "ACTIVE" &&
  closeoutBridge.verifyJwt === true &&
  closeoutBridge.matchingSitesSigningKeyConfigured === true &&
  closeoutBridge.openAiCredentialConfiguredServerSide === true &&
  closeoutBridge.missingJwtEdgeRequestHttpStatus === 401 &&
  closeoutBridge.unauthenticatedTeamStatusHttpStatus === 403 &&
  closeoutBridge.unauthenticatedStatusResponseFailClosed === true &&
  closeoutBridge.authenticatedSignatureMatrixPassed === false &&
  closeoutBridge.authenticatedTeamPreflightPassed === false &&
  closeoutBridge.effectiveAuthenticatedWorkflowVerified === false &&
  closeoutBridge.providerCanaryPassed === false &&
  closeoutBridge.realEditPassed === false &&
  closeoutPostDeploy.workerExceptionObserved === false &&
  closeoutPostDeploy.edge5xxObserved === false &&
  closeoutMomo.uploadedAssets === 1 &&
  closeoutMomo.currentUploadRightsStatus === "expired" &&
  closeoutMomo.aiCandidates === 0 &&
  closeoutMomo.providerCalls === 0 &&
  closeoutMomo.accountedSpendUsd === 0 &&
  closeoutMomo.authenticatedClientTeamRehearsalPerformed === false &&
  closeoutMomo.readiness === "no_go" &&
  closeoutBoundaries.momoOnly === true &&
  closeoutBoundaries.highQualityModel === "gpt-image-2" &&
  closeoutBoundaries.privateCandidateUntilTeamApproval === true &&
  closeoutBoundaries.misleadingFoodEditsProhibited === true &&
  closeoutBoundaries.automaticAuthorizationThresholdUsdPerJob === 20 &&
  closeoutBoundaries.authorizationRequiredAboveThreshold === true &&
  closeoutBoundaries.automaticBatchRunnerEnabled === false &&
  closeoutBoundaries.subscriptionOrUnboundedSpendAuthorized === false &&
  closeoutBoundaries.googleConnected === false &&
  closeoutBoundaries.socialConnected === false &&
  closeoutBoundaries.ownerControlledProvidersConnected === false &&
  closeoutBoundaries.externalPublishingEnabled === false &&
  closeoutBoundaries.recurringProviderActivation === false &&
  closeoutBoundaries.allExternalWriteSwitchesLocked === true &&
  closeoutBoundaries.momoActivationExecuted === false;
must(
  historicalV22CloseoutIsExact,
  "MOMO_MEDIA_V22_LIVE_CLOSEOUT.json must remain immutable historical evidence for the last GitHub-to-Sites parity release only.",
);
must(
  lastGitHubParityRelease?.evidenceScope ===
    "last_github_sites_parity_release" &&
    lastGitHubParityRelease.supersededAsLiveBaseline === true &&
    lastGitHubParityRelease.pullRequest === 155 &&
    lastGitHubParityRelease.reviewedHead ===
      "96a6c00857b438b37c2e8d99329c0f556de850a2" &&
    lastGitHubParityRelease.githubMainCommit ===
      "d1f6a9a78ac54cd5447689d5f8b3d42466daf479" &&
    lastGitHubParityRelease.sitesCheckoutCommit ===
      "83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e" &&
    lastGitHubParityRelease.sitesVersion === 22 &&
    lastGitHubParityRelease.sourceFileCount === 93 &&
    lastGitHubParityRelease.sourceTreeSha256 ===
      "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490" &&
    lastGitHubParityRelease.productionMigrationCount === 16 &&
    lastGitHubParityRelease.latestProductionMigration ===
      "20260728044916_momo_media_ai_pilot_v1.sql" &&
    lastGitHubParityRelease.latestProductionMigrationSha256 ===
      "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1",
  "Schema-7 manifest must classify PR #155 / Sites v22 as superseded historical GitHub parity, not current production.",
);
must(
  rrLastGitHubParityRelease?.evidenceScope ===
    "last_github_sites_parity_release" &&
    rrLastGitHubParityRelease.supersededAsLiveBaseline === true &&
    rrLastGitHubParityRelease.pullRequest === 155 &&
    rrLastGitHubParityRelease.githubMainCommit ===
      "d1f6a9a78ac54cd5447689d5f8b3d42466daf479" &&
    rrLastGitHubParityRelease.sitesVersion === 22 &&
    rrLastGitHubParityRelease.productionMigrationCount === 16 &&
    rrLastGitHubParityRelease.latestProductionMigration ===
      "20260728044916_momo_media_ai_pilot_v1.sql" &&
    rrLastGitHubParityRelease.latestProductionMigrationSha256 ===
      "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1",
  "Schema-11 RR checkpoint must preserve the same historical Sites v22 parity evidence.",
);
try {
  assertReviewedLocalCandidateManifest(localCandidateManifest);
} catch (error) {
  must(
    false,
    `Schema-7 partial-rollout manifest is invalid: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}
const currentProduction = localCandidateManifest.currentProductionObservation;
must(
  localCandidateManifest.schemaVersion === 7 &&
    localCandidateManifest.releaseState ===
      REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    currentProduction.evidenceStatus === LIVE_PRODUCTION_EVIDENCE_STATUS &&
    currentProduction.sitesVersion === 39 &&
    typeof currentProduction.sitesCheckoutCommit === "string" &&
    currentProduction.sitesCheckoutCommit.startsWith("8749a7d") &&
    currentProduction.sourceFileCount === 201 &&
    currentProduction.sourceTreeSha256 === CURRENT_LIVE_SITES_TREE_SHA256 &&
    currentProduction.productionMigrationCount === 43 &&
    currentProduction.migrationTreeSha256 ===
      CURRENT_LIVE_MIGRATION_TREE_SHA256 &&
    currentProduction.migrationTreeEvidenceScope ===
      LIVE_MIGRATION_EVIDENCE_SCOPE &&
    currentProduction.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    currentProduction.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    currentProduction.latestProductionMigration ===
      CURRENT_LIVE_LATEST_MIGRATION &&
    currentProduction.latestProductionMigrationSha256 ===
      CURRENT_LIVE_LATEST_MIGRATION_SHA256 &&
    currentProduction.databaseLedgerObserved === true &&
    currentProduction.databaseAppliedThroughLatestObserved === true &&
    !currentProduction.candidateSourceMatchesLiveSites &&
    currentProduction.candidateMigrationsMatchLiveLedger === false &&
    !currentProduction.githubMainMatchesCandidate &&
    !currentProduction.fullReleaseGatePassed &&
    JSON.stringify(
      localCandidateManifest.historicalV36GitHubReconciliationEvidence,
    ) === JSON.stringify(V36_GITHUB_RECONCILIATION),
  "Schema-7 manifest must record exact main59b/Sites v39/live43 while preserving historical37 and PR #157 evidence.",
);
must(
  releaseCandidate.status === REVIEWED_LOCAL_CANDIDATE_STATUS &&
    releaseCandidate.pullRequest === 164 &&
    releaseCandidate.pullRequestDraft === true &&
    releaseCandidate.observedDraftPullRequestHead ===
      "b659ec307da9455c389059b29f2d6f3ab51f095e" &&
    releaseCandidate.observedDraftPullRequestTree ===
      "9931d63dcb16a2e2e1cb7c592d2da63b4054cb60" &&
    releaseCandidate.githubMerged === false &&
    releaseCandidate.allFourWorkflowsGreen === null &&
    releaseCandidate.zeroUnresolvedReviewThreads === null &&
    releaseCandidate.futureSitesVersion === null &&
    releaseCandidate.sourceFileCount === 203 &&
    releaseCandidate.sourceTreeSha256 === CANDIDATE_SITES_TREE_SHA256 &&
    releaseCandidate.migrationFileCount === 44 &&
    releaseCandidate.migrationTreeSha256 === CANDIDATE_MIGRATION_TREE_SHA256 &&
    JSON.stringify(releaseCandidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    releaseCandidate.databaseMigrationApplied === false &&
    releaseCandidate.databaseChangesRequired === true &&
    releaseCandidate.candidateMigrationsMatchLiveLedger === false &&
    JSON.stringify(releaseCandidate.databaseMigrationsApplied) ===
      JSON.stringify(appliedForwardMigrations) &&
    releaseCandidate.databaseApplyAuthorized === true &&
    !releaseCandidate.sitesPublished &&
    releaseCandidate.sitesPublishAuthorized === true &&
    releaseCandidate.deploymentAuthorized === true &&
    !releaseCandidate.activationExecuted &&
    !releaseCandidate.fullReleaseGatePassed &&
    rolloutMatchesPartialProduction(localCandidateManifest),
  "Schema-7 manifest must record exact live43 separately from the unapplied provisional DB44 and unpublished v5 Sites candidate.",
);
const rrCurrentProduction = rrLocalCandidateRecord.currentProductionObservation;
const rrCandidate = rrLocalCandidateRecord.releaseCandidate;
must(
  rrLocalCandidateRecord.schemaVersion === 11 &&
    rrLocalCandidateRecord.recordKind ===
      "veroxa_momo_ready_team_decisions_feature_checkpoint" &&
    rrLocalCandidateRecord.status === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    rrCurrentProduction?.evidenceStatus === LIVE_PRODUCTION_EVIDENCE_STATUS &&
    rrCurrentProduction.sitesVersion === 39 &&
    typeof rrCurrentProduction.sitesCheckoutCommit === "string" &&
    rrCurrentProduction.sitesCheckoutCommit.startsWith("8749a7d") &&
    rrCurrentProduction.sourceFileCount === 201 &&
    rrCurrentProduction.sourceTreeSha256 === CURRENT_LIVE_SITES_TREE_SHA256 &&
    rrCurrentProduction.productionMigrationCount === 43 &&
    rrCurrentProduction.migrationTreeSha256 ===
      CURRENT_LIVE_MIGRATION_TREE_SHA256 &&
    rrCurrentProduction.migrationTreeEvidenceScope ===
      LIVE_MIGRATION_EVIDENCE_SCOPE &&
    rrCurrentProduction.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    rrCurrentProduction.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    rrCurrentProduction.latestProductionMigration ===
      CURRENT_LIVE_LATEST_MIGRATION &&
    rrCurrentProduction.latestProductionMigrationSha256 ===
      CURRENT_LIVE_LATEST_MIGRATION_SHA256 &&
    rrCurrentProduction.databaseLedgerObserved === true &&
    rrCurrentProduction.databaseAppliedThroughLatestObserved === true &&
    !rrCurrentProduction.candidateSourceMatchesLiveSites &&
    rrCurrentProduction.candidateMigrationsMatchLiveLedger === false &&
    !rrCurrentProduction.githubMainMatchesCandidate &&
    !rrCurrentProduction.fullReleaseGatePassed &&
    JSON.stringify(
      rrLocalCandidateRecord.historicalV36GitHubReconciliationEvidence,
    ) === JSON.stringify(V36_GITHUB_RECONCILIATION),
  "Schema-11 RR checkpoint must record exact main59b/Sites v39/live43 separately from the DB44/Sites candidate.",
);
must(
  rrCandidate?.state === REVIEWED_LOCAL_CANDIDATE_STATUS &&
    rrCandidate.pullRequest === 164 &&
    rrCandidate.pullRequestDraft === true &&
    rrCandidate.observedDraftPullRequestHead ===
      "b659ec307da9455c389059b29f2d6f3ab51f095e" &&
    rrCandidate.observedDraftPullRequestTree ===
      "9931d63dcb16a2e2e1cb7c592d2da63b4054cb60" &&
    rrCandidate.githubMerged === false &&
    rrCandidate.allFourWorkflowsGreen === null &&
    rrCandidate.zeroUnresolvedReviewThreads === null &&
    rrCandidate.futureSitesVersion === null &&
    rrCandidate.sourceFileCount === 203 &&
    rrCandidate.sourceTreeSha256 === CANDIDATE_SITES_TREE_SHA256 &&
    rrCandidate.migrationFileCount === 44 &&
    rrCandidate.migrationTreeSha256 === CANDIDATE_MIGRATION_TREE_SHA256 &&
    JSON.stringify(rrCandidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    rrCandidate.databaseMigrationApplied === false &&
    rrCandidate.databaseChangesRequired === true &&
    rrCandidate.candidateMigrationsMatchLiveLedger === false &&
    JSON.stringify(rrCandidate.databaseMigrationsApplied) ===
      JSON.stringify(appliedForwardMigrations) &&
    rrCandidate.databaseApplyAuthorized === true &&
    rrCandidate.sitesPublished === false &&
    rrCandidate.sitesPublishAuthorized === true &&
    rrCandidate.deploymentAuthorized === true &&
    rrCandidate.activationExecuted === false &&
    rrCandidate.fullReleaseGatePassed === false &&
    rolloutMatchesPartialProduction(rrLocalCandidateRecord),
  "Schema-11 RR checkpoint must preserve live43 separately from the provisional DB44 and all-pending cutover.",
);
const v36Scope = v36CloseoutRecord.scope;
const v36Sites = v36CloseoutRecord.sites;
const v36Github = v36CloseoutRecord.github;
const v36Database = v36CloseoutRecord.database;
const v36Verification = v36CloseoutRecord.verification;
const v36Pipeline = v36CloseoutRecord.pipelineBehavior;
const v36Safety = v36CloseoutRecord.productionSafetyState;
must(
  v36CloseoutRecord.schemaVersion === 1 &&
    v36CloseoutRecord.recordKind === "momo_upload_v36_live_closeout" &&
    v36CloseoutRecord.status ===
      "sites_v36_live_external_actions_frozen_github_parity_verified" &&
    v36CloseoutRecord.supersedesForCurrentLiveStatus ===
      "MOMO_MEDIA_V22_LIVE_CLOSEOUT.json" &&
    v36Scope?.restaurant === "Momo's House San Antonio" &&
    v36Scope.workflow === "private_media_upload_to_unscheduled_veroxa_ready" &&
    v36Scope.externalSchedulingIncluded === false &&
    v36Scope.externalPublishingIncluded === false &&
    v36Scope.externalProviderConnectionIncluded === false &&
    v36Sites?.versionNumber === 36 &&
    v36Sites.checkoutCommit === "b8122642b72e5d4e6e74c379469f2a157781ab3d" &&
    v36Sites.deploymentStatus === "succeeded" &&
    v36Sites.productionLive === true &&
    v36Sites.sourceTreeSha256 ===
      "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7" &&
    v36Github?.repository === "farazmunirgohar-vxa/Veroxa" &&
    v36Github.currentMainRelease === "v36" &&
    v36Github.currentMainCommit === V36_GITHUB_RECONCILIATION.mergedCommit &&
    v36Github.currentMainCommitScope === V36_OPERATIONAL_COMMIT_SCOPE &&
    v36Github.v36ParityStatus === VERIFIED_GITHUB_PARITY_STATUS &&
    v36Github.v36ParityPullRequest === V36_GITHUB_RECONCILIATION.pullRequest &&
    v36Github.v36ParityReviewedHead ===
      V36_GITHUB_RECONCILIATION.reviewedHead &&
    v36Github.v36ParityMergedCommit ===
      V36_GITHUB_RECONCILIATION.mergedCommit &&
    v36Github.v36ParitySourceTreeSha256 ===
      "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7" &&
    v36Github.candidateSourceMatchesLiveSites === true &&
    v36Github.githubMainMatchesCandidate === true &&
    v36Github.fullReleaseGatePassed === true &&
    v36Github.zeroUnresolvedReviewThreads === true &&
    JSON.stringify(v36Github.preMergeWorkflows) ===
      JSON.stringify(V36_GITHUB_RECONCILIATION.preMergeWorkflows) &&
    JSON.stringify(v36Github.postMergePushWorkflows) ===
      JSON.stringify(V36_GITHUB_RECONCILIATION.postMergePushWorkflows) &&
    v36Github.databaseChangesRequired === false &&
    v36Github.databaseMigrationAppliedByParityRelease === false &&
    v36Github.sitesPublishRequired === false &&
    v36Github.sitesPublishedByParityRelease === false &&
    v36Database?.productionMigrationCount === 37 &&
    v36Database.latestAppliedMigration ===
      "20260802020000_momo_pipeline_query_indexes_v2.sql" &&
    v36Database.latestAppliedMigrationSha256 ===
      "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd" &&
    v36Database.v36MigrationsLive === true &&
    v36Database.rollbackCompilationPreviouslyPassed === true &&
    v36Verification?.status === "green_before_live_release" &&
    v36Verification.testsPassed === 371 &&
    v36Verification.testsTotal === 371 &&
    v36Verification.productionBuildPassed === true &&
    v36Verification.lintPassed === true &&
    v36Verification.typecheckPassed === true &&
    v36Verification.rollbackMigrationCompilationPassed === true &&
    v36CloseoutRecord.internalWorkers?.length === 2 &&
    v36CloseoutRecord.internalWorkers.every(
      (worker: { updatedForV36: boolean; status: string }) =>
        worker.updatedForV36 === true && worker.status === "active",
    ),
  "MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json must preserve verified live v36 separately from PR #157's no-publish, no-apply GitHub reconciliation.",
);
must(
  v36Pipeline?.exactDuplicateHandling ===
    "reuse_one_canonical_exact_byte_identity_while_preserving_each_upload_rights_record_and_audit_lineage" &&
    v36Pipeline.legacyDuplicateJobsConsolidated === 5 &&
    v36Pipeline.legacyDuplicateJobsDeleted === 0 &&
    v36Pipeline.nearDuplicateMerge === "advisory_only" &&
    v36Pipeline.badMediaOutcome ===
      "one_consolidated_exception_with_recorded_evidence" &&
    v36Pipeline.badMediaAutomaticEditOrResize === false &&
    v36Pipeline.badMediaOriginalPreserved === true &&
    v36Pipeline.readyState === "veroxa_ready" &&
    v36Pipeline.readyStateScheduled === false &&
    v36Pipeline.readyStatePublished === false &&
    v36Pipeline.teamDefaultWork === "exception_only" &&
    v36Pipeline.immutableLineageRequired === true,
  "v36 policy must consolidate exact-byte duplicates, keep near-duplicates advisory, preserve originals, and never auto-edit or resize failed media.",
);
must(
  v36Safety?.publishQueue === "empty" &&
    v36Safety.externalScheduleQueue === "empty" &&
    v36Safety.externalProviderConnections === "empty" &&
    v36Safety.webhookAndRecoveryBacklog === "empty" &&
    v36Safety.externalPublishingEnabled === false &&
    v36Safety.externalSchedulingEnabled === false &&
    v36Safety.providerWritesEnabled === false &&
    v36Safety.reviewRepliesEnabled === false &&
    v36Safety.websiteWritesEnabled === false &&
    v36Safety.allExternalWriteControlsLocked === true &&
    v36Safety.momoActivationExecuted === false &&
    /unscheduled internal evidence/.test(
      v36CloseoutRecord.releaseBoundary ?? "",
    ) &&
    /not approval to connect, schedule, publish, post, reply, or write/.test(
      v36CloseoutRecord.releaseBoundary ?? "",
    ),
  "v36 closeout must keep every external schedule, publish, provider-write, reply, website-write, and activation boundary frozen.",
);
for (const marker of [
  "secure-email-link Supabase authentication",
  "approved-user password authentication",
  "Public signup remains disabled",
  "root `/api/pilot-access` deployment adapter is retired",
  "Roles remain `client` and `team` only",
  "Momo owner walkthrough",
]) {
  must(
    migration.includes(marker),
    `Migration authority missing safety marker: ${marker}`,
  );
}
for (const document of [agents, migration, memory]) {
  for (const command of [
    "`Build it`",
    "`Build it, but hold for review`",
    "`Build and deploy it`",
    "`RR`",
  ]) {
    must(
      document.includes(command),
      `ChatGPT-managed operating authority missing command: ${command}`,
    );
  }
}
for (const marker of [
  "Faraz uses ChatGPT as the primary Veroxa command center",
  "GitHub `main`",
  "Green merge gate",
  "exact head commit",
  "required GitHub checks",
  "unresolved actionable review thread",
  "critical/high-severity",
  "GitHub merge and Sites deployment are separate actions",
]) {
  must(
    protocol.includes(marker),
    `ChatGPT-managed operating protocol missing marker: ${marker}`,
  );
}
for (const marker of [
  "production authentication",
  "real customer/client data",
  "destructive data",
  "billing, payments",
  "external integrations",
  "public publishing",
  "business truth",
  "DNS/domain-record changes",
  "Momo owner walkthrough",
]) {
  must(
    protocol.includes(marker),
    `ChatGPT-managed operating protocol missing pause boundary: ${marker}`,
  );
}
must(
  /`Build it` does not independently authorize a ChatGPT Sites production deployment/.test(
    protocol,
  ),
  "Build it must not silently authorize Sites deployment.",
);
must(
  /hold for review[\s\S]*must not merge or deploy/.test(protocol),
  "Hold command must stop before merge and deployment.",
);
must(
  /Build and deploy it[\s\S]*exact merged GitHub source state[\s\S]*checkpoint/.test(
    protocol,
  ),
  "Deploy command must sync the exact merged GitHub state before a Sites checkpoint.",
);
must(
  /`RR` by itself does not authorize merge, deployment/.test(protocol),
  "RR must not independently authorize merge or deployment.",
);
must(
  /Faraz approved public Sites access/.test(migration),
  "Migration authority must record approved public Sites access.",
);
must(
  /active provider and SSL status/.test(migration),
  "Migration authority must record active custom-domain and SSL state.",
);
must(
  /rollback path/.test(migration),
  "Domain stabilization gate must retain a rollback path.",
);
must(
  sitesReadme.includes("Sites access is public"),
  "Sites README must record current public access.",
);
must(
  sitesReadme.includes(
    "Client and Team routes require a verified Supabase session",
  ),
  "Sites README must record the protected Client/Team route boundary.",
);
for (const bannedSitesCopy of [
  "owner-restricted",
  "public pre-live shells",
  "no production accounts or real client data",
]) {
  must(
    !sitesRouter.includes(bannedSitesCopy),
    `Public Sites source contains stale access claim: ${bannedSitesCopy}`,
  );
}
for (const requiredSitesCopy of [
  "SECURE PORTAL ACCESS",
  "Signed sessions and password verification are handled by Supabase Auth",
  "Secure Team route",
  "Momo-only production boundary",
]) {
  must(
    sitesRouter.includes(requiredSitesCopy),
    `Sites source missing production access marker: ${requiredSitesCopy}`,
  );
}
must(
  !/Owner-restricted Sites access remains in place/i.test(sitesReadme),
  "Sites README must not claim public routes are owner-restricted.",
);
must(
  !/ChatGPT Sites is the canonical source of truth/i.test(sourceTruth),
  "Sites must not replace GitHub as canonical source of truth.",
);
must(
  !/Vercel is the new primary deployment target/i.test(sourceTruth),
  "Active migration docs must not restore Vercel as the new primary target.",
);
must(
  !/GitHub \+ Codex \+ Vercel/i.test(governedDocs),
  "Governed current docs must not restore the old GitHub + Codex + Vercel stack.",
);
must(
  !/Use Vercel as the deployment target/i.test(governedDocs),
  "Governed current docs must not restore Vercel as the primary deployment target.",
);
must(
  !/Do not point `veroxasystems\.com`|Do not attach or redirect `veroxasystems\.com`|`veroxasystems\.com` has not been moved/i.test(
    governedDocs,
  ),
  "Governed current docs must not restore stale pre-cutover domain instructions.",
);
must(
  !/farazclient|farazteam/i.test(governedDocs),
  "Governed current docs must not carry retired preview password strings.",
);
must(
  sitesHosting.includes("project_id"),
  "GitHub-synchronized Sites source must preserve its hosting identity manifest.",
);
must(
  workspace.includes("!artifacts/veroxa-sites") &&
    !workspace.includes("!artifacts/veroxa\n") &&
    retiredSourceRemoval.includes("authorized permanent repository cleanup") &&
    retiredSourceRemoval.includes("sole deployable Veroxa application source"),
  "Root workspace must isolate Sites and record permanent retired-source removal.",
);
for (const retiredPath of [
  "artifacts/veroxa/src",
  "artifacts/veroxa/public",
  "artifacts/veroxa/e2e",
  "artifacts/veroxa/.replit-artifact",
  "artifacts/veroxa/.env.example",
  "artifacts/veroxa/components.json",
  "artifacts/veroxa/index.html",
  "artifacts/veroxa/package.json",
  "artifacts/veroxa/tsconfig.json",
  "artifacts/veroxa/vite.config.ts",
  "artifacts/veroxa/ARCHIVED.md",
]) {
  must(
    !existsSync(resolve(repoRoot, retiredPath)),
    `Retired Vite/Replit source returned: ${retiredPath}`,
  );
}
if (failures.length) {
  console.error("ChatGPT Sites migration source-of-truth guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("ChatGPT Sites migration source-of-truth guardrail passed.");
import "./check-momo-house-readiness-tracking";
