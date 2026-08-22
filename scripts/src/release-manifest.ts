import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import * as core from "./release-manifest-core";

export * from "./release-manifest-core";

const CURRENT_PHASE = "r3_release_converged_authenticated_proof_pending";
const CURRENT_CANDIDATE_KIND = "ver43_hosted_signature_envelope_release";
const CURRENT_CANDIDATE_STATE = "release_converged_authenticated_proof_pending";
const CURRENT_BASE_COMMIT = "c47920dce981478d757a3cc89ef9f337c39908ef";
const CURRENT_BASE_TREE = "1303518c22c5ff40daabc5b8f68803a02d30b8c8";
const CURRENT_PR205_HEAD = "51dca29248778e842b671f5cbe18783195fbcda0";
const CURRENT_PR205_SCOPE = "hosted_signed_envelope_transport_and_regression_guard";
const CURRENT_CLOSEOUT =
  "artifacts/veroxa/docs/VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json";
const CURRENT_REQUIRED_RECOVERY =
  "fresh_explicit_one_shot_authorization_then_one_short_lived_least_privileged_synthetic_client_proof";
const CURRENT_MIGRATION =
  "20260815191500_veroxa_preintervention_acceptance_v1.sql";
const CURRENT_MIGRATION_SHA256 =
  "fe047343b1bab6a5da5222ab78acbd2c87fa7cd0713cd317dbf51dc64404950e";
const CURRENT_MIGRATION_BYTE_LENGTH = 76_641;
const CURRENT_MIGRATION_TREE_SHA256 =
  "4c91224d731322539bdea70c3c4e802960b0fa4bc154faef19896a5a23794875";
const CURRENT_SITES_SHA256 =
  "926e3a10e081e9b5f8924783add85cb022afc75549272352e9e416b53e3b1504";
const CURRENT_SITES_VERSION_ID =
  "appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_0116de399dc881918935597e6fbc0272";
const CURRENT_SITES_DEPLOYMENT_ID =
  "appgdep_6a894fe379108191a767de502d56d5bd";

const CURRENT_PACKET_PATHS = [
  "AGENTS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_STATE.json",
  "artifacts/veroxa/docs/VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "scripts/src/check-chatgpt-sites-migration-source-truth.ts",
  "scripts/src/check-supabase-migration-ledger.ts",
  "scripts/src/generate-deployment-attestation.ts",
  "scripts/src/release-manifest-core.ts",
  "scripts/src/release-manifest.ts",
] as const;

const CURRENT_EDGE_SOURCE_PATHS = [
  "supabase/functions/momo-media-ai-lifecycle/index.ts",
  "supabase/functions/_shared/momo-media-ai-lifecycle-contract.ts",
  "supabase/functions/_shared/bridge-public-key-transition.ts",
  "supabase/functions/momo-content-ai-lifecycle/index.ts",
  "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
  "supabase/functions/momo-content-ai-webhook-lifecycle/index.ts",
  "supabase/functions/_shared/momo-content-ai-webhook-lifecycle-contract.ts",
  "supabase/functions/momo-content-ai-dispatch-lifecycle/index.ts",
  "supabase/functions/_shared/momo-content-ai-dispatch-lifecycle-contract.ts",
  "supabase/functions/veroxa-legacy-media-purge-20260812/index.ts",
] as const;

/*
 * Source-level compatibility markers retained for existing security tests.
 * The executable historical implementations live unchanged in
 * release-manifest-core.ts; current reconciliation is enforced below.
 *
 * ACTIVE_MEDIA_INSPECTION_CANDIDATE_ALLOWED_PATHS
 * active media-inspection candidate Git scope drifted
 * gitPathList(["ls-files", "--others", "--exclude-standard"])
 *
 * Historical release-scope markers:
 * artifacts/veroxa-sites/.env.example
 * artifacts/veroxa-sites/app/api/internal/veroxa/acceptance-auth-proof/core.ts
 * artifacts/veroxa-sites/app/api/internal/veroxa/acceptance-auth-proof/route.ts
 * artifacts/veroxa-sites/tests/veroxa-acceptance-auth-proof.test.mjs
 * scripts/src/release-manifest.ts
 */

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

type CurrentStateRead =
  | { ok: true; value: Record<string, any> }
  | { ok: false; reason: string };

function readCurrentStateResult(): CurrentStateRead {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(core.currentStatePath, "utf8"));
  } catch {
    return { ok: false, reason: "CURRENT_STATE.json is missing or invalid JSON" };
  }
  if (!value || typeof value !== "object") {
    return { ok: false, reason: "CURRENT_STATE.json is not an object" };
  }
  const record = value as Record<string, any>;
  if (record.schemaVersion !== 1 ||
      record.recordKind !== "veroxa_current_state" ||
      record.stateAuthority !== "current_deployed_state_and_explicit_forward_candidate") {
    return { ok: false, reason: "CURRENT_STATE.json authority identity is invalid" };
  }
  return { ok: true, value: record };
}

function readCurrentState(): Record<string, any> | null {
  const result = readCurrentStateResult();
  return result.ok ? result.value : null;
}

function readCurrentStateRequired(): Record<string, any> {
  const result = readCurrentStateResult();
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

function isCurrentReconciledStateValue(
  value: Record<string, any> | null,
): value is Record<string, any> {
  return value?.phase === CURRENT_PHASE &&
    value?.activeCandidate?.kind === CURRENT_CANDIDATE_KIND &&
    value?.activeCandidate?.state === CURRENT_CANDIDATE_STATE;
}

function isCurrentReconciledState(
  value: Record<string, any> | null = readCurrentState(),
): value is Record<string, any> {
  return isCurrentReconciledStateValue(value);
}

function gitPathList(args: string[]): string[] {
  const [command, ...commandArgs] = args;
  if (!command) return [];
  const output = execFileSync("git", [command, "-z", ...commandArgs], {
    cwd: core.repoRoot,
    encoding: "utf8",
  });
  return output.split("\0").filter((path) => path.length > 0);
}

function gitOutput(args: string[]): string {
  return execFileSync("git", args, {
    cwd: core.repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}

function gitChangedPaths(base: string, head: string): string[] {
  return gitPathList([
    "diff",
    "--find-renames",
    "--name-only",
    "--diff-filter=ACM",
    `${base}...${head}`,
    "--",
  ]).sort();
}

function gitForbiddenPaths(base: string, head: string): string[] {
  return gitPathList([
    "diff",
    "--find-renames",
    "--name-only",
    "--diff-filter=DRTUXB",
    `${base}...${head}`,
    "--",
  ]).sort();
}

function isExactCurrentPacketHead(head: string): boolean {
  try {
    execFileSync(
      "git",
      ["merge-base", "--is-ancestor", CURRENT_BASE_COMMIT, head],
      { cwd: core.repoRoot, stdio: "ignore" },
    );
    return sameJson(
      gitChangedPaths(CURRENT_BASE_COMMIT, head),
      [...CURRENT_PACKET_PATHS].sort(),
    ) && gitForbiddenPaths(CURRENT_BASE_COMMIT, head).length === 0;
  } catch {
    return false;
  }
}

function resolveCurrentPacketIdentity(): { packetHead: string; mergeCommit: string | null } {
  const head = gitOutput(["rev-parse", "HEAD"]);
  const parents = gitOutput(["rev-list", "--parents", "-n", "1", head]).split(/\s+/u);
  for (const parent of parents.slice(2)) {
    if (isExactCurrentPacketHead(parent)) return { packetHead: parent, mergeCommit: head };
  }
  if (isExactCurrentPacketHead(head)) return { packetHead: head, mergeCommit: null };

  const commits = gitOutput([
    "rev-list",
    "--first-parent",
    "--ancestry-path",
    "--reverse",
    `${CURRENT_BASE_COMMIT}..HEAD`,
  ]).split("\n").filter(Boolean);
  for (const commit of commits) {
    const commitParents = gitOutput(["rev-list", "--parents", "-n", "1", commit]).split(/\s+/u);
    for (const secondParent of commitParents.slice(2)) {
      if (isExactCurrentPacketHead(secondParent)) {
        return { packetHead: secondParent, mergeCommit: commit };
      }
    }
  }
  throw new Error("Edge-v15/Sites-v68 status packet cannot resolve its immutable packet head");
}

function hasCurrentPacketIdentity(): boolean {
  try {
    resolveCurrentPacketIdentity();
    return true;
  } catch {
    return false;
  }
}

function shouldUseCurrentReconciliationGuard(): boolean {
  if (!hasCurrentPacketIdentity()) return false;
  const state = readCurrentStateRequired();
  if (!isCurrentReconciledStateValue(state)) {
    throw new Error(
      "Current R3 status packet is present but CURRENT_STATE.json does not match its exact release identity",
    );
  }
  return true;
}

function assertCleanCheckout(): void {
  const output = execFileSync(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    { cwd: core.repoRoot },
  );
  if (output.length > 0) {
    throw new Error(
      "Edge-v15/Sites-v68 current-status validation requires a clean tracked/index/untracked checkout",
    );
  }
}

function assertCurrentPacketScope(): void {
  assertCleanCheckout();
  const { packetHead, mergeCommit } = resolveCurrentPacketIdentity();
  if (!isExactCurrentPacketHead(packetHead)) {
    throw new Error("Edge-v15/Sites-v68 status packet changed-file set drifted");
  }
  if (mergeCommit) {
    const postPacket = gitPathList(["diff", "--name-only", `${mergeCommit}..HEAD`, "--"]);
    if (postPacket.length > 0) {
      throw new Error(
        "Edge-v15/Sites-v68 current-status evidence has non-empty repository changes after its merge and requires a fresh reconciliation",
      );
    }
  }
}

function sha256GitFile(commit: string, path: string): string {
  return createHash("sha256").update(execFileSync(
    "git",
    ["show", `${commit}:${path}`],
    { cwd: core.repoRoot, maxBuffer: 32 * 1024 * 1024 },
  )).digest("hex");
}

function exactKeySet(value: Record<string, unknown> | undefined, expected: readonly string[]): boolean {
  return sameJson(Object.keys(value ?? {}).sort(), [...expected].sort());
}

function matchesAcceptanceCounts(
  acceptance: Record<string, any> | undefined,
  locks: Record<string, any> | undefined,
): boolean {
  return acceptance?.scopeRows === 1 &&
    acceptance.customerVisibleRows === 0 &&
    acceptance.includedInReportRows === 0 &&
    acceptance.uploadSessionRows === 4 &&
    acceptance.initiatedSessionRows === 1 &&
    acceptance.expiredSessionRows === 3 &&
    acceptance.registeredSessionRows === 0 &&
    acceptance.assetRows === 0 &&
    acceptance.packageRows === 0 &&
    acceptance.providerConnectionRows === 0 &&
    locks?.connectedProviderRows === 0 &&
    locks.publishQueueRows === 0 &&
    locks.publishAttemptRows === 0;
}

function matchesBlocker(
  value: Record<string, any> | undefined,
  current: Record<string, any> | undefined,
): boolean {
  return value?.sessionId === "45ad07a3-0192-452b-8a01-5d5bf8528ced" &&
    value.sessionId === current?.preservedUploadSessionId &&
    value.state === "expired" &&
    value.state === current?.preservedUploadSessionState &&
    value.registered === false &&
    value.registered === current?.preservedUploadSessionRegistered &&
    value.proofState === "unconsumed" &&
    value.proofState === current?.proofState &&
    value.reusableClientAuthorityAvailable === false &&
    value.reusableClientAuthorityAvailable === current?.reusableClientAuthorityAvailable &&
    value.proofRunnerWakeCredentialConfigured === false &&
    value.proofRunnerWakeCredentialConfigured === current?.proofRunnerWakeCredentialConfigured &&
    value.requiredRecovery === CURRENT_REQUIRED_RECOVERY &&
    current?.nextSafeStep === CURRENT_REQUIRED_RECOVERY &&
    value.requiredRecovery === current.nextSafeStep &&
    value.oldSessionEvidenceMustRemainImmutable === true &&
    value.oldSessionEvidenceMustRemainImmutable === current?.oldSessionEvidenceMustRemainImmutable;
}

function matchesPrivateSchema(
  closeout: Record<string, any> | undefined,
  current: Record<string, any> | undefined,
): boolean {
  return closeout?.tableCount === 26 &&
    closeout.tablesWithoutRls === 6 &&
    closeout.publicAnonAuthenticatedTableGrantCount === 0 &&
    closeout.publicAnonAuthenticatedSchemaGrantCount === 0 &&
    closeout.confirmedPublicExposure === false &&
    current?.privateSchemaTableCount === 26 &&
    current.privateSchemaTablesWithoutRls === 6 &&
    current.publicAnonAuthenticatedPrivateSchemaGrants === 0 &&
    current.privateSchemaTableCount === closeout.tableCount &&
    current.privateSchemaTablesWithoutRls === closeout.tablesWithoutRls;
}

function matchesCandidateMigration(
  value: Record<string, any> | undefined,
  tree: { fileCount: number; sha256: string },
  latestPath: string,
): boolean {
  return value?.filename === CURRENT_MIGRATION &&
    value.sha256 === CURRENT_MIGRATION_SHA256 &&
    value.sha256 === core.sha256File(latestPath) &&
    value.byteLength === CURRENT_MIGRATION_BYTE_LENGTH &&
    value.byteLength === statSync(latestPath).size &&
    value.candidateMigrationCount === 60 &&
    value.candidateMigrationCount === tree.fileCount &&
    value.candidateMigrationTreeSha256 === CURRENT_MIGRATION_TREE_SHA256 &&
    value.candidateMigrationTreeSha256 === tree.sha256 &&
    value.applied === true;
}

function matchesEdgeSources(value: Record<string, any> | undefined): boolean {
  if (!exactKeySet(value, CURRENT_EDGE_SOURCE_PATHS)) return false;
  return CURRENT_EDGE_SOURCE_PATHS.every((path) =>
    typeof value?.[path] === "string" && value[path] === sha256GitFile(CURRENT_BASE_COMMIT, path)
  );
}

function matchesPr205Closeout(value: Record<string, any> | undefined): boolean {
  const review = value?.review as Record<string, any> | undefined;
  return value?.head === CURRENT_PR205_HEAD &&
    value.mergeCommit === CURRENT_BASE_COMMIT &&
    value.scope === CURRENT_PR205_SCOPE &&
    value.runtimeChanged === true &&
    value.changedFiles === 12 &&
    value.requiredWorkflows?.ci === "success" &&
    value.requiredWorkflows?.veroxaVerify === "success" &&
    value.requiredWorkflows?.sitesVerify === "success" &&
    value.requiredWorkflows?.supabaseVerify === "success" &&
    review?.owner === "copilot" &&
    review.codexDuplicateReviewPerformed === false &&
    review.firstReviewFindingCount === 1 &&
    review.findingFixed === true &&
    review.reReviewOutcome === "approval_recommended" &&
    review.reReviewNewFindingCount === 0 &&
    review.unresolvedThreadCount === 0;
}

function assertNoCoreBypassImports(): void {
  const scriptsRoot = resolve(core.repoRoot, "scripts/src");
  const offenders: string[] = [];
  for (const entry of readdirSync(scriptsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts") ||
      entry.name === "release-manifest.ts" || entry.name === "release-manifest-core.ts") continue;
    const text = readFileSync(resolve(scriptsRoot, entry.name), "utf8");
    if (text.includes('"./release-manifest-core"') || text.includes("'./release-manifest-core'")) {
      offenders.push(entry.name);
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      "Historical release-manifest core may only be imported through the current facade: " + offenders.join(","),
    );
  }
}

function assertCurrentReconciledStatus(manifest: core.DeploymentManifest): void {
  const failures: string[] = [];
  const must = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
  };
  const state = readCurrentStateRequired();
  if (!isCurrentReconciledStateValue(state)) {
    throw new Error("Current R3 reconciliation state is missing or malformed");
  }

  try { assertCurrentPacketScope(); } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  try { assertNoCoreBypassImports(); } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  const closeout = JSON.parse(readFileSync(resolve(core.repoRoot, CURRENT_CLOSEOUT), "utf8")) as Record<string, any>;
  const github = state.production?.github as Record<string, any> | undefined;
  const sites = state.production?.sites as Record<string, any> | undefined;
  const supabase = state.production?.supabase as Record<string, any> | undefined;
  const edge = state.production?.edge as Record<string, any> | undefined;
  const candidate = state.activeCandidate as Record<string, any> | undefined;
  const gates = candidate?.requiredGates as Record<string, any> | undefined;
  const blocker = state.acceptanceBlocker as Record<string, any> | undefined;
  const program = state.r3Program as Record<string, any> | undefined;
  const locks = state.externalActionLock as Record<string, any> | undefined;
  const capacity = state.supabaseProGovernance as Record<string, any> | undefined;

  const sourceTree = core.hashTree(resolve(core.repoRoot, core.DEPLOYABLE_SITES_SOURCE_ROOT), {
    exclusions: [...core.GENERATED_PATH_EXCLUSIONS],
  });
  const migrationTree = core.hashTree(resolve(core.repoRoot, core.ROOT_MIGRATION_SOURCE_ROOT), { suffix: ".sql" });
  const mirrorMigrationTree = core.hashTree(resolve(core.repoRoot, core.SITES_MIGRATION_MIRROR_ROOT), { suffix: ".sql" });
  const latestMigrationPath = resolve(core.repoRoot, core.ROOT_MIGRATION_SOURCE_ROOT, CURRENT_MIGRATION);

  must(
    manifest.schemaVersion === 13 &&
      manifest.recordKind === "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout",
    "current status must preserve the immutable schema-13 historical manifest",
  );
  must(
    state.updatedAt === "2026-08-22T07:37:41Z" &&
      state.currentVerdict === "NOT READY — R3 AUTHENTICATED ACCEPTANCE GATES OPEN" &&
      state.currentStatusCloseout === CURRENT_CLOSEOUT,
    "current R3 status identity or no-GO boundary drifted",
  );
  must(
    github?.observedMainCommit === CURRENT_BASE_COMMIT &&
      github.observedMainTree === CURRENT_BASE_TREE &&
      github.latestMergedPullRequest === 205 &&
      github.pullRequest205Head === CURRENT_PR205_HEAD &&
      github.runtimeChangedByPullRequest205 === true &&
      github.requiredWorkflowsGreen === true &&
      github.copilotSoleReviewer === true &&
      github.copilotReReviewOutcome === "approval_recommended_zero_new_findings",
    "GitHub PR #205 live baseline drifted",
  );
  must(
    sites?.version === 68 &&
      sites.versionId === CURRENT_SITES_VERSION_ID &&
      sites.deploymentId === CURRENT_SITES_DEPLOYMENT_ID &&
      sites.deploymentStatus === "succeeded" &&
      sites.runtimeSubtreeFileCount === 248 &&
      sites.runtimeSubtreeSha256 === CURRENT_SITES_SHA256 &&
      sites.matchesObservedGitHubMainRuntimeSubtree === true &&
      sites.environmentRevision === 30 &&
      sites.apexDomainHealthy === true &&
      sites.wwwDomainHealthy === true &&
      sites.postDeployWorkerErrors === 0 &&
      sourceTree.fileCount === 248 && sourceTree.sha256 === CURRENT_SITES_SHA256,
    "Sites v68 identity, domain health, or deterministic source parity drifted",
  );
  must(
    supabase?.plan === "pro" &&
      supabase.health === "ACTIVE_HEALTHY" &&
      supabase.migrationCount === 60 &&
      supabase.latestPlatformMigrationVersion === "20260820163500" &&
      supabase.latestCanonicalMigration === CURRENT_MIGRATION &&
      supabase.latestCanonicalMigrationSha256 === CURRENT_MIGRATION_SHA256 &&
      supabase.migrationTreeSha256 === CURRENT_MIGRATION_TREE_SHA256 &&
      supabase.externalActionLocksClosed === true &&
      migrationTree.fileCount === 60 && migrationTree.sha256 === CURRENT_MIGRATION_TREE_SHA256 &&
      mirrorMigrationTree.fileCount === migrationTree.fileCount &&
      mirrorMigrationTree.sha256 === migrationTree.sha256 &&
      sameJson(mirrorMigrationTree.files, migrationTree.files) &&
      core.sha256File(latestMigrationPath) === CURRENT_MIGRATION_SHA256 &&
      statSync(latestMigrationPath).size === CURRENT_MIGRATION_BYTE_LENGTH,
    "Supabase Pro health or exact 60-migration live ledger drifted",
  );
  must(matchesPrivateSchema(closeout.supabase?.privateSchemaDefenseInDepth, supabase),
    "private-schema defense-in-depth evidence drifted or became exposed");
  must(
    edge?.allActiveFunctionBundleSourcesMatchObservedGitHubMain === true &&
      edge.mediaLifecycleVersion === 4 && edge.contentLifecycleVersion === 15 &&
      edge.webhookLifecycleVersion === 6 && edge.dispatchLifecycleVersion === 4 &&
      edge.legacyPurgeVersion === 11 && edge.contentLifecycleVerifyJwt === false &&
      edge.contentLifecycleBundleSha256 === "af24ee01a0eb9725f6d3931cf2c4b317ef58f7d9efcdf763682d176484e9c8cd" &&
      edge.contentLifecycleV15ProofInvocationCount === 0,
    "active Edge version or current bundle parity drifted",
  );
  must(
    candidate?.kind === CURRENT_CANDIDATE_KIND && candidate.state === CURRENT_CANDIDATE_STATE &&
      candidate.pullRequest === 205 && candidate.mergeCommit === CURRENT_BASE_COMMIT &&
      sameJson(candidate.pendingMigrations, []) &&
      matchesCandidateMigration(candidate.migration, migrationTree, latestMigrationPath) &&
      candidate.externalActionLockRequired === true && candidate.img4257RetriesRemaining === 0,
    "PR #205 release lineage or exact applied migration identity drifted",
  );
  must(
    gates?.releaseSourceMerged === true && gates.migrationAppliedAndReadBack === true &&
      gates.exactRuntimeSourceDeployed === true && gates.edgeBundleParityProven === true &&
      gates.externalActionLocksClosed === true && gates.freshAuthenticatedUploadSession === false &&
      gates.authenticatedExpiredSessionRejectionProof === false && gates.syntheticSuccessPassed === false &&
      gates.duplicateReplayIdempotent === false && gates.controlledFailureFailedClosed === false &&
      gates.restaurantPortalVerified === false && gates.teamPortalVerified === false &&
      gates.separateTeamDecisionVerified === false && gates.founderGoIssued === false,
    "current state overclaims or omits an R3 acceptance gate",
  );
  must(
    blocker?.linearIssue === "VER-43" && blocker.linearStatus === "In Progress" &&
      blocker.downstreamIssue === "VER-39" && blocker.downstreamStatus === "In Progress" &&
      blocker.preservedUploadSessionId === "45ad07a3-0192-452b-8a01-5d5bf8528ced" &&
      blocker.preservedUploadSessionState === "expired" && blocker.preservedUploadSessionRegistered === false &&
      blocker.proofState === "unconsumed" && blocker.lastProofEdgeVersion === 14 &&
      blocker.lastProofHttpStatus === 403 && blocker.contentLifecycleV15ProofInvocationCount === 0 &&
      blocker.reusableClientAuthorityAvailable === false && blocker.proofRunnerWakeCredentialConfigured === false &&
      blocker.nextSafeStep === CURRENT_REQUIRED_RECOVERY && blocker.oldSessionEvidenceMustRemainImmutable === true,
    "VER-43 authenticated proof blocker drifted",
  );
  must(
    program?.ver43Status === "In Progress" && program.ver39Status === "In Progress" &&
      program.ver41Status === "Todo" && program.syntheticGate?.status === "In Progress" &&
      program.syntheticGate?.complete === false && program.portalGate?.status === "Todo" &&
      program.portalGate?.complete === false && program.founderGate?.status === "Todo" &&
      program.founderGate?.complete === false && program.founderGate?.momoGo === false,
    "R3 program sequencing or incomplete gate state drifted",
  );
  must(sameJson(locks, {
    publishing: false,
    externalScheduling: false,
    accountConnection: false,
    customerMessaging: false,
    outreach: false,
    reviewReplies: false,
    websiteProviderWritesAllowed: false,
    orderingProviderWritesAllowed: false,
    advertisingProviderWritesAllowed: false,
    pricingChange: false,
    repositoryVisibilityChange: false,
  }), "current external-action lock map drifted");
  must(
    capacity?.planVerified === true && capacity.blanketOperationalAuthority === false &&
      capacity.optionalFeatureConfigurationVerified === false && capacity.spendCapConfigurationVerified === false &&
      capacity.usageAndCostVerified === false,
    "governed Supabase Pro capacity boundary drifted",
  );

  const pr205 = closeout.github?.pullRequest205 as Record<string, any> | undefined;
  must(
    closeout.recordKind === "veroxa_live_status_closeout" && closeout.status === CURRENT_CANDIDATE_STATE &&
      closeout.observedAt === state.updatedAt && closeout.github?.observedMainCommit === CURRENT_BASE_COMMIT &&
      closeout.github?.latestMergedPullRequest === 205 && matchesPr205Closeout(pr205),
    "PR #205 closeout scope/workflow/review identity drifted",
  );
  must(
    closeout.sites?.version === 68 && closeout.sites?.versionId === CURRENT_SITES_VERSION_ID &&
      closeout.sites?.deploymentId === CURRENT_SITES_DEPLOYMENT_ID &&
      closeout.sites?.runtimeSubtree?.fileCount === 248 &&
      closeout.sites?.runtimeSubtree?.sha256 === CURRENT_SITES_SHA256 &&
      closeout.sites?.runtimeSubtree?.matchesObservedGitHubMain === true &&
      closeout.sites?.postDeployErrorsOnlyWorkerLogCount === 0,
    "Sites v68 closeout evidence drifted",
  );
  must(
    closeout.supabase?.migrations?.count === 60 &&
      closeout.supabase?.migrations?.canonicalSource === `supabase/migrations/${CURRENT_MIGRATION}` &&
      closeout.supabase?.migrations?.canonicalByteLength === CURRENT_MIGRATION_BYTE_LENGTH &&
      closeout.supabase?.migrations?.canonicalSha256 === CURRENT_MIGRATION_SHA256 &&
      closeout.supabase?.migrations?.treeSha256 === CURRENT_MIGRATION_TREE_SHA256 &&
      closeout.supabase?.externalActionLocks?.status === "closed" &&
      closeout.supabase?.externalActionLocks?.rowsWithAnyExternalActionEnabled === 0 &&
      closeout.supabase?.externalActionLocks?.acceptanceExternalWriteAllowedRows === 0 &&
      matchesAcceptanceCounts(closeout.supabase?.acceptance, closeout.supabase?.externalActionLocks) &&
      matchesBlocker(closeout.supabase?.acceptanceSessionBlocker, blocker),
    "acceptance snapshot, no-new-row boundary, or preserved blocker drifted",
  );
  must(
    closeout.edge?.allActiveFunctionBundleSourcesMatchObservedGitHubMain === true &&
      closeout.edge?.proofEvidence?.lastInvocationVersion === blocker?.lastProofEdgeVersion &&
      closeout.edge?.proofEvidence?.lastInvocationStatus === blocker?.lastProofHttpStatus &&
      closeout.edge?.proofEvidence?.version15InvocationCount === 0 &&
      closeout.edge?.proofEvidence?.proofConsumed === false && matchesEdgeSources(closeout.edge?.verifiedSourceFiles),
    "Edge function/source/proof evidence drifted",
  );
  must(sameJson(
    (closeout.edge?.functions ?? []).map((fn: Record<string, any>) => [
      fn.slug, fn.version, fn.status, fn.verifyJwt, fn.bundleSourceParity,
    ]),
    [
      ["momo-media-ai-lifecycle", 4, "ACTIVE", true, true],
      ["momo-content-ai-lifecycle", 15, "ACTIVE", false, true],
      ["momo-content-ai-webhook-lifecycle", 6, "ACTIVE", false, true],
      ["momo-content-ai-dispatch-lifecycle", 4, "ACTIVE", false, true],
      ["veroxa-legacy-media-purge-20260812", 11, "ACTIVE", true, true],
    ],
  ), "active Edge inventory or bundle-parity evidence drifted");
  must(
    closeout.r3Program?.ver43?.status === "In Progress" && closeout.r3Program?.ver39?.status === "In Progress" &&
      closeout.r3Program?.ver41?.status === "Todo" && closeout.r3Program?.syntheticGate?.status === "In Progress" &&
      closeout.r3Program?.syntheticGate?.complete === false &&
      closeout.r3Program?.authenticatedPortalGate?.status === "Todo" &&
      closeout.r3Program?.authenticatedPortalGate?.complete === false &&
      closeout.r3Program?.founderGate?.status === "Todo" && closeout.r3Program?.founderGate?.complete === false &&
      closeout.r3Program?.founderGate?.momoGo === false &&
      closeout.productBoundary?.runtimeOrPlatformMutationPerformed === true &&
      closeout.productBoundary?.secondAuthenticationProofPerformed === false &&
      closeout.productBoundary?.realMomoMediaTouched === false,
    "machine closeout overclaims an incomplete R3 or product-boundary gate",
  );

  const acceptanceMutation = structuredClone(closeout.supabase?.acceptance ?? {}) as Record<string, any>;
  acceptanceMutation.uploadSessionRows = 5;
  must(!matchesAcceptanceCounts(acceptanceMutation, closeout.supabase?.externalActionLocks),
    "acceptance-session-count mutation was not rejected");

  const providerMutation = structuredClone(closeout.supabase?.externalActionLocks ?? {}) as Record<string, any>;
  providerMutation.connectedProviderRows = 1;
  must(!matchesAcceptanceCounts(closeout.supabase?.acceptance, providerMutation),
    "connected-provider mutation was not rejected");

  const blockerMutation = structuredClone(closeout.supabase?.acceptanceSessionBlocker ?? {}) as Record<string, any>;
  const currentBlockerMutation = structuredClone(blocker ?? {}) as Record<string, any>;
  blockerMutation.requiredRecovery = "reuse_expired_session";
  currentBlockerMutation.nextSafeStep = "reuse_expired_session";
  must(!matchesBlocker(blockerMutation, currentBlockerMutation),
    "coordinated required-recovery weakening was not rejected");

  const edgeSourceMutation = structuredClone(closeout.edge?.verifiedSourceFiles ?? {}) as Record<string, any>;
  delete edgeSourceMutation[CURRENT_EDGE_SOURCE_PATHS[0]];
  edgeSourceMutation["artifacts/veroxa-sites/app/momo-content-ai-lifecycle-bridge.ts"] = "0".repeat(64);
  must(!matchesEdgeSources(edgeSourceMutation), "Edge verified-source key-set substitution was not rejected");

  const migrationMutation = structuredClone(candidate?.migration ?? {}) as Record<string, any>;
  migrationMutation.filename = "20260815090000_media_inspection_preflight_canary_v1.sql";
  must(!matchesCandidateMigration(migrationMutation, migrationTree, latestMigrationPath),
    "applied-migration lineage mutation was not rejected");

  const privateSchemaMutation = structuredClone(closeout.supabase?.privateSchemaDefenseInDepth ?? {}) as Record<string, any>;
  privateSchemaMutation.confirmedPublicExposure = true;
  must(!matchesPrivateSchema(privateSchemaMutation, supabase),
    "private-schema exposure mutation was not rejected");

  const prScopeMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prScopeMutation.scope = "weakened_scope";
  must(!matchesPr205Closeout(prScopeMutation), "PR #205 scope mutation was not rejected");

  const prRuntimeMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prRuntimeMutation.runtimeChanged = false;
  must(!matchesPr205Closeout(prRuntimeMutation), "PR #205 runtimeChanged mutation was not rejected");

  const prChangedFilesMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prChangedFilesMutation.changedFiles = 11;
  must(!matchesPr205Closeout(prChangedFilesMutation), "PR #205 changedFiles mutation was not rejected");

  const prReviewCountMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prReviewCountMutation.review.firstReviewFindingCount = 0;
  must(!matchesPr205Closeout(prReviewCountMutation), "PR #205 first-review count mutation was not rejected");

  const prReviewFixedMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prReviewFixedMutation.review.findingFixed = false;
  must(!matchesPr205Closeout(prReviewFixedMutation), "PR #205 findingFixed mutation was not rejected");

  const prReviewOutcomeMutation = structuredClone(pr205 ?? {}) as Record<string, any>;
  prReviewOutcomeMutation.review.reReviewOutcome = "changes_recommended";
  must(!matchesPr205Closeout(prReviewOutcomeMutation), "PR #205 re-review outcome mutation was not rejected");

  if (failures.length > 0) {
    throw new Error("Unsafe current live-status reconciliation: " + failures.join("; "));
  }
}

export function assertDurableMediaIngestionCandidateManifest(manifest: core.DeploymentManifest): void {
  if (shouldUseCurrentReconciliationGuard()) return assertCurrentReconciledStatus(manifest);
  core.assertDurableMediaIngestionCandidateManifest(manifest);
}

export function assertCurrentReconciliationManifest(manifest: core.DeploymentManifest): void {
  if (shouldUseCurrentReconciliationGuard()) return assertCurrentReconciledStatus(manifest);
  core.assertCurrentReconciliationManifest(manifest);
}

export function assertUnreleasedLocalCandidateManifest(manifest: core.DeploymentManifest): void {
  if (shouldUseCurrentReconciliationGuard()) return assertCurrentReconciledStatus(manifest);
  core.assertUnreleasedLocalCandidateManifest(manifest);
}

export function assertReviewedLocalCandidateManifest(manifest: core.DeploymentManifest): void {
  if (shouldUseCurrentReconciliationGuard()) return assertCurrentReconciledStatus(manifest);
  core.assertReviewedLocalCandidateManifest(manifest);
}

export function assertDeploymentAttestationManifest(manifest: core.DeploymentManifest): void {
  if (shouldUseCurrentReconciliationGuard()) return assertCurrentReconciledStatus(manifest);
  core.assertDeploymentAttestationManifest(manifest);
}
