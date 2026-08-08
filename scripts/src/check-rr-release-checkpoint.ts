const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LIVE_PRODUCTION_EVIDENCE_STATUS,
  LOCAL_CANDIDATE_REVISION,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  POLICY_EVALUATION_EVIDENCE_PATH,
  POLICY_EVALUATION_EVIDENCE_SHA256,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  V36_LIVE_PARITY_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";
const failures: string[] = [];
const must = __name((condition: boolean, message: string) => {
  if (!condition) failures.push(message);
}, "must");
const canonicalJson = __name((value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}, "canonicalJson");
const readJson = __name(
  (relativePath: string): any =>
    JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")),
  "readJson",
);
const manifest = readDeploymentManifest();
const checkpoint = readJson("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const historicalCloseoutPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
);
const historicalCloseout = readJson(
  "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
);
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
must(
  checkpoint.schemaVersion === 10 &&
    checkpoint.recordKind === "veroxa_local_predeployment_release_checkpoint" &&
    checkpoint.checkpoint ===
      "pre-momo-local-candidate-policy-eval-2026-08-08" &&
    checkpoint.status === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    checkpoint.candidateRevision === LOCAL_CANDIDATE_REVISION &&
    checkpoint.reviewedAt === "2026-08-08",
  "RR checkpoint identity must describe the policy-eval-closed local predeployment candidate.",
);
must(
  checkpoint.status === manifest.releaseState &&
    checkpoint.releaseCandidate.state === manifest.releaseCandidate.status &&
    checkpoint.releaseCandidate.manifest ===
      "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    checkpoint.releaseCandidate.localReviewPassed &&
    checkpoint.releaseCandidate.reviewedLocally,
  "Manifest and RR local-review states disagree.",
);
must(
  canonicalJson(checkpoint.knownResiduals) ===
    canonicalJson(manifest.knownResiduals) &&
    checkpoint.knownResiduals?.length === 1 &&
    /postgres is not a member of supabase_admin[\s\S]*02609[\s\S]*skips supabase_admin[\s\S]*not comprehensive default-ACL closure/iu.test(
      checkpoint.knownResiduals[0],
    ),
  "RR must retain the known supabase_admin default-ACL residual.",
);
must(
  canonicalJson(checkpoint.policyEvaluationEvidence) ===
    canonicalJson(manifest.policyEvaluationEvidence) &&
    checkpoint.policyEvaluationEvidence.path ===
      POLICY_EVALUATION_EVIDENCE_PATH &&
    checkpoint.policyEvaluationEvidence.sha256 ===
      POLICY_EVALUATION_EVIDENCE_SHA256 &&
    existsSync(resolve(repoRoot, POLICY_EVALUATION_EVIDENCE_PATH)) &&
    sha256File(resolve(repoRoot, POLICY_EVALUATION_EVIDENCE_PATH)) ===
      POLICY_EVALUATION_EVIDENCE_SHA256 &&
    checkpoint.policyEvaluationEvidence.finalLiveCasesPassed === 10 &&
    checkpoint.policyEvaluationEvidence.finalCombinedChecksPassed === 27 &&
    checkpoint.policyEvaluationEvidence.cumulativeCostUpperBoundUsd <
      checkpoint.policyEvaluationEvidence.authorizedCeilingUsd &&
    checkpoint.policyEvaluationEvidence.responseStorage === false &&
    checkpoint.policyEvaluationEvidence.toolsEnabled === false &&
    checkpoint.policyEvaluationEvidence.externalWritesAllowed === false &&
    checkpoint.policyEvaluationEvidence
      .allAttemptSettingsIndependentlyHashBound === false &&
    checkpoint.policyEvaluationEvidence.crossProcessCostLedgerEnforced ===
      false &&
    checkpoint.policyEvaluationEvidence
      .completedAggregateBelowAuthorizedCeiling === true,
  "RR private policy-evaluation evidence differs from the manifest or fails its safety gate.",
);
const live = checkpoint.currentProductionObservation;
must(
  JSON.stringify(live) ===
    JSON.stringify(manifest.currentProductionObservation) &&
    live.evidenceStatus === LIVE_PRODUCTION_EVIDENCE_STATUS &&
    live.productionMigrationCount === 37 &&
    live.migrationTreeSha256 === V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 &&
    live.migrationTreeEvidenceScope === LIVE_MIGRATION_EVIDENCE_SCOPE &&
    live.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    live.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  "RR must preserve the exact remote live-37 baseline separately from the historical repository fingerprint.",
);
must(
  JSON.stringify(checkpoint.historicalV36GitHubReconciliationEvidence) ===
    JSON.stringify(manifest.historicalV36GitHubReconciliationEvidence),
  "RR historical PR #157 evidence differs from the manifest.",
);
must(
  JSON.stringify(checkpoint.lastGitHubParityRelease) ===
    JSON.stringify(manifest.lastGitHubParityRelease) &&
    JSON.stringify(checkpoint.historicalProductionObservations) ===
      JSON.stringify(manifest.historicalProductionObservations),
  "RR historical release observations differ from the manifest.",
);
const checkpointCandidate = { ...checkpoint.releaseCandidate };
delete checkpointCandidate.manifest;
delete checkpointCandidate.state;
delete checkpointCandidate.localReviewPassed;
must(
  canonicalJson(checkpointCandidate) ===
    canonicalJson(manifest.releaseCandidate),
  "RR candidate fields or fingerprints differ from the deployment manifest.",
);
must(
  checkpoint.releaseCandidate.pullRequest === null &&
    !checkpoint.releaseCandidate.githubMerged &&
    checkpoint.releaseCandidate.allFourWorkflowsGreen === null &&
    checkpoint.releaseCandidate.zeroUnresolvedReviewThreads === null &&
    !checkpoint.releaseCandidate.databaseMigrationApplied &&
    checkpoint.releaseCandidate.databaseMigrationsApplied.length === 0 &&
    !checkpoint.releaseCandidate.databaseApplyAuthorized &&
    !checkpoint.releaseCandidate.sitesPublished &&
    !checkpoint.releaseCandidate.sitesPublishAuthorized &&
    !checkpoint.releaseCandidate.deploymentAuthorized &&
    !checkpoint.releaseCandidate.activationExecuted &&
    !checkpoint.releaseCandidate.fullReleaseGatePassed,
  "RR candidate overclaims PR, workflow, database, Sites, deployment, or activation evidence.",
);
must(
  JSON.stringify(checkpoint.rolloutSequence) ===
    JSON.stringify(manifest.rolloutSequence) &&
    checkpoint.rolloutSequence.status === "blocked_not_started" &&
    checkpoint.rolloutSequence.steps.every(
      (step: { completed: boolean }) => !step.completed,
    ) &&
    checkpoint.rolloutSequence.steps[0]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[0] &&
    checkpoint.rolloutSequence.steps[1]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[1] &&
    checkpoint.rolloutSequence.steps[3]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[2] &&
    checkpoint.rolloutSequence.steps[2]?.id ===
      "publish_and_verify_audit_v2_and_client_v3_routes" &&
    checkpoint.rolloutSequence.steps[4]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[3] &&
    checkpoint.rolloutSequence.steps[5]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[4] &&
    checkpoint.rolloutSequence.steps[5]?.explicitReviewRequired,
  "RR rollout must remain stage 1 (01210 + 01430) -> publish/verify Audit v2 + Client v3 -> stage 2 (01842 + 01853 + explicitly reviewed 02609).",
);
const databaseEvidence = checkpoint.databaseEvidence;
must(
  databaseEvidence.liveBaseline.migrationFileCount === 37 &&
    databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256 &&
    databaseEvidence.liveBaseline.evidenceScope ===
      LIVE_MIGRATION_EVIDENCE_SCOPE &&
    databaseEvidence.liveBaseline.latestMigration ===
      V36_LIVE_PARITY_EVIDENCE.latestMigration &&
    databaseEvidence.liveBaseline.latestMigrationSha256 ===
      V36_LIVE_PARITY_EVIDENCE.latestMigrationSha256 &&
    databaseEvidence.liveBaseline.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    databaseEvidence.liveBaseline.historicalRepositoryEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    databaseEvidence.candidate.migrationFileCount === 42 &&
    databaseEvidence.candidate.migrationTreeSha256 ===
      manifest.releaseCandidate.migrationTreeSha256 &&
    JSON.stringify(databaseEvidence.candidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    databaseEvidence.candidate.appliedMigrations.length === 0,
  "RR database evidence does not preserve live/candidate separation.",
);
const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const mirrorTree = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot!), {
  suffix: ".sql",
});
must(
  sourceTree.fileCount === manifest.releaseCandidate.sourceFileCount &&
    sourceTree.sha256 === manifest.releaseCandidate.sourceTreeSha256,
  `RR candidate Sites fingerprint drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  migrationTree.fileCount === 42 &&
    migrationTree.sha256 === manifest.releaseCandidate.migrationTreeSha256 &&
    mirrorTree.fileCount === migrationTree.fileCount &&
    mirrorTree.sha256 === migrationTree.sha256 &&
    JSON.stringify(mirrorTree.files) === JSON.stringify(migrationTree.files),
  `RR candidate migration fingerprint drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
must(
  sha256File(historicalCloseoutPath) ===
    "aa173de20b552f1bc0a706658e9daf380591f8040dbe19441e6638e9eaecf812",
  "Immutable v36 closeout JSON changed.",
);
must(
  historicalCloseout.database.migrationTreeSha256 ===
    V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    historicalCloseout.database.latestAppliedMigration ===
      "20260802020000_momo_pipeline_query_indexes_v2.sql" &&
    historicalCloseout.database.latestAppliedMigrationSha256 ===
      V36_LIVE_PARITY_EVIDENCE.latestMigrationSha256 &&
    historicalCloseout.productionSafetyState.allExternalWriteControlsLocked &&
    !historicalCloseout.productionSafetyState.momoActivationExecuted,
  "Historical v36 closeout no longer preserves its original repository-mirror evidence and frozen actions.",
);
must(
  checkpoint.activationGates.some((gate: string) =>
    /local|unpublished|unapplied/i.test(gate),
  ) &&
    checkpoint.activationGates.some((gate: string) =>
      /01210[\s\S]*01430[\s\S]*publish[\s\S]*01842[\s\S]*01853[\s\S]*02609/iu.test(
        gate,
      ),
    ),
  "Activation gates must describe the local-only candidate and staged rollout.",
);
must(
  checkpoint.reusableEvidence.some((entry: string) =>
    /MOMO_PRIVATE_POLICY_EVAL_2026-08-08\.json[\s\S]*10\/10[\s\S]*final-v3 request controls are source-hash-proven[\s\S]*earlier settings are report-recorded only[\s\S]*does not claim an atomic cross-process lifetime cost ledger/iu.test(
      entry,
    ),
  ),
  "RR reusable evidence must scope the private policy eval to local synthetic controls.",
);
must(
  checkpoint.reusableEvidence.some((entry: string) =>
    /02609[\s\S]*not comprehensive default-ACL closure[\s\S]*postgres is not a supabase_admin member[\s\S]*role is skipped/iu.test(
      entry,
    ),
  ),
  "RR reusable evidence must not overclaim comprehensive default-ACL closure.",
);
for (const [key, value] of Object.entries(checkpoint.runtimeVerification)) {
  if (
    /external.*(?:connected|enabled|verified)|activationExecuted/iu.test(key)
  ) {
    must(value === false, `Runtime checkpoint overclaims ${key}.`);
  }
}
must(
  checkpoint.cleanupGate.branchDeletionAllowed === false &&
    checkpoint.cleanupGate.vercelShutdownSentinelRequired === true &&
    checkpoint.cleanupGate.externalVercelGitDisconnectionVerified === false,
  "Cleanup gate must remain fail-closed.",
);
for (const document of [
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
]) {
  must(
    existsSync(resolve(repoRoot, document)),
    `Current document is missing: ${document}`,
  );
  const text = readFileSync(resolve(repoRoot, document), "utf8");
  must(
    text.includes(V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256) &&
      text.includes(
        V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256,
      ) &&
      /historical[\s\S]{0,240}(?:repository|Sites mirror)/iu.test(text) &&
      /local[\s\S]{0,200}(?:unpublished|unapplied)/iu.test(text),
    `Current document does not distinguish live remote evidence from the local candidate: ${document}`,
  );
}
if (failures.length) {
  console.error("RR release checkpoint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `RR checkpoint passed: immutable v36 history remains separate from the exact remote 37-ledger; the policy-eval-closed local candidate fingerprints ${sourceTree.fileCount} Sites files / ${migrationTree.fileCount} migrations are reviewed but unpublished, unapplied, and blocked behind the six-step rollout.`,
);
