const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LIVE_PRODUCTION_EVIDENCE_STATUS,
  LOCAL_CANDIDATE_REVISION,
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS,
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
  checkpoint.schemaVersion === 11 &&
    checkpoint.recordKind === "veroxa_staged_rollout_forward_repair_checkpoint" &&
    checkpoint.checkpoint ===
      "momo-staged-rollout-forward-repair-2026-08-08" &&
    checkpoint.status === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    checkpoint.candidateRevision === LOCAL_CANDIDATE_REVISION &&
    checkpoint.reviewedAt === "2026-08-08",
  "RR checkpoint identity must preserve schema-11 identity while describing the repair-verified, corrective-Sites candidate.",
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
  "RR must retain the one known default-ACL residual without treating the verified repair as residual risk.",
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
    live.productionMigrationCount === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount &&
    live.migrationTreeSha256 === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 &&
    live.migrationTreeEvidenceScope === LIVE_MIGRATION_EVIDENCE_SCOPE &&
    live.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    live.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  "RR must preserve exact Sites v37 / live43 repair-verified evidence separately from historical v36 evidence.",
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
  checkpoint.releaseCandidate.pullRequest === 163 &&
    !checkpoint.releaseCandidate.githubMerged &&
    checkpoint.releaseCandidate.allFourWorkflowsGreen === null &&
    checkpoint.releaseCandidate.zeroUnresolvedReviewThreads === null &&
    checkpoint.releaseCandidate.databaseMigrationApplied &&
    checkpoint.releaseCandidate.databaseChangesRequired === false &&
    checkpoint.releaseCandidate.candidateMigrationsMatchLiveLedger &&
    JSON.stringify(checkpoint.releaseCandidate.databaseMigrationsApplied) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) &&
    checkpoint.releaseCandidate.databaseApplyAuthorized &&
    !checkpoint.releaseCandidate.sitesPublished &&
    checkpoint.releaseCandidate.sitesPublishAuthorized &&
    checkpoint.releaseCandidate.deploymentAuthorized &&
    !checkpoint.releaseCandidate.activationExecuted &&
    !checkpoint.releaseCandidate.fullReleaseGatePassed,
  "RR candidate must preserve open PR #163 and the verified database repair without claiming merge, final-head workflow/review evidence, Sites v38 republish, full gate, or activation.",
);
must(
  JSON.stringify(checkpoint.rolloutSequence) ===
    JSON.stringify(manifest.rolloutSequence) &&
    checkpoint.rolloutSequence.status ===
      "staged_rollout_paused_for_corrective_sites_publish" &&
    checkpoint.rolloutSequence.steps.length === 8 &&
    checkpoint.rolloutSequence.steps[0]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[0] &&
    checkpoint.rolloutSequence.steps[0]?.completed === true &&
    checkpoint.rolloutSequence.steps[1]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[1] &&
    checkpoint.rolloutSequence.steps[1]?.completed === true &&
    checkpoint.rolloutSequence.steps[2]?.id ===
      "publish_and_verify_audit_v2_and_client_v3_routes" &&
    checkpoint.rolloutSequence.steps[2]?.completed === true &&
    checkpoint.rolloutSequence.steps[3]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[2] &&
    checkpoint.rolloutSequence.steps[3]?.completed === true &&
    checkpoint.rolloutSequence.steps[4]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[3] &&
    checkpoint.rolloutSequence.steps[4]?.completed === true &&
    checkpoint.rolloutSequence.steps[5]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[4] &&
    checkpoint.rolloutSequence.steps[5]?.completed === true &&
    checkpoint.rolloutSequence.steps[6]?.migration ===
      LOCAL_CANDIDATE_ROLLOUT_MIGRATIONS[5] &&
    checkpoint.rolloutSequence.steps[6]?.completed === true &&
    checkpoint.rolloutSequence.steps[7]?.id ===
      "republish_and_verify_repaired_client_v3" &&
    checkpoint.rolloutSequence.steps[7]?.completed === false &&
    checkpoint.rolloutSequence.steps[7]?.explicitReviewRequired,
  "RR rollout must preserve completed 01210 -> 01430 -> Sites v37 -> 01842 -> 01853 -> 02609 -> verified 041629, then gate only the corrected Sites republish.",
);
const databaseEvidence = checkpoint.databaseEvidence;
must(
  databaseEvidence.liveBaseline.migrationFileCount ===
    CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount &&
    databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 &&
    databaseEvidence.liveBaseline.evidenceScope ===
      LIVE_MIGRATION_EVIDENCE_SCOPE &&
    databaseEvidence.liveBaseline.latestMigration ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration &&
    databaseEvidence.liveBaseline.latestMigrationSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256 &&
    databaseEvidence.liveBaseline.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    databaseEvidence.liveBaseline.historicalRepositoryEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    databaseEvidence.candidate.migrationFileCount === 43 &&
    databaseEvidence.candidate.migrationTreeSha256 ===
      manifest.releaseCandidate.migrationTreeSha256 &&
    JSON.stringify(databaseEvidence.candidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    JSON.stringify(databaseEvidence.candidate.appliedMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS),
  "RR database evidence must show exact live/candidate parity at the verified 43-migration ledger.",
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
  migrationTree.fileCount === 43 &&
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
    /041629/iu.test(gate) && /live|verified/iu.test(gate),
  ) &&
    checkpoint.activationGates.some((gate: string) =>
      /Sites v38/iu.test(gate) && /publish|publication/iu.test(gate) &&
        /no database change remains pending|all six rollout migrations/iu.test(gate),
    ),
  "Activation gates must distinguish the verified live database repair from the pending Sites v38 publish.",
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
    text.includes(CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256) &&
      text.includes(
        V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256,
      ) &&
      /historical[\s\S]{0,240}(?:repository|Sites mirror)/iu.test(text) &&
      /041629/iu.test(text) && /applied|verified/iu.test(text) &&
      /Sites v38/iu.test(text) && /pending|next/iu.test(text),
    `Current document does not distinguish the verified live43 database state from the pending corrective Sites candidate: ${document}`,
  );
}
if (failures.length) {
  console.error("RR release checkpoint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `RR checkpoint passed: immutable v36 history remains separate from Sites v37 / exact remote live43; the ${sourceTree.fileCount}-file corrected Sites candidate is reviewed, all ${migrationTree.fileCount} migrations are verified live, and only Sites v38 publish/verify remains pending.`,
);
