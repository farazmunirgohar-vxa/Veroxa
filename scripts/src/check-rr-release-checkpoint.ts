const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  LOCAL_CANDIDATE_REVISION,
  POLICY_EVALUATION_EVIDENCE_PATH,
  POLICY_EVALUATION_EVIDENCE_SHA256,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
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
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}, "canonicalJson");
const manifest = readDeploymentManifest();
const checkpoint = JSON.parse(
  readFileSync(
    resolve(repoRoot, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"),
    "utf8",
  ),
);
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
must(
  checkpoint.schemaVersion === 11 &&
    checkpoint.recordKind === "veroxa_momo_ready_team_decisions_feature_checkpoint" &&
    checkpoint.checkpoint === "momo-ready-team-decisions-food-tags-v2-2026-08-08" &&
    checkpoint.status === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    checkpoint.candidateRevision === LOCAL_CANDIDATE_REVISION &&
    checkpoint.reviewedAt === "2026-08-08",
  "RR checkpoint identity drifted.",
);
must(
  checkpoint.status === manifest.releaseState &&
    checkpoint.releaseCandidate.state === REVIEWED_LOCAL_CANDIDATE_STATUS &&
    checkpoint.releaseCandidate.status === manifest.releaseCandidate.status &&
    checkpoint.releaseCandidate.localReviewPassed === true &&
    checkpoint.releaseCandidate.reviewedLocally === true,
  "Manifest and RR local-review states disagree.",
);
must(
  canonicalJson(checkpoint.knownResiduals) === canonicalJson(manifest.knownResiduals) &&
    checkpoint.knownResiduals?.length === 1 &&
    /postgres is not a member of supabase_admin[\s\S]*02609[\s\S]*skips supabase_admin[\s\S]*not comprehensive default-ACL closure/iu.test(
      checkpoint.knownResiduals[0],
    ),
  "RR must retain the exact known default-ACL residual.",
);
must(
  canonicalJson(checkpoint.policyEvaluationEvidence) ===
      canonicalJson(manifest.policyEvaluationEvidence) &&
    checkpoint.policyEvaluationEvidence.path === POLICY_EVALUATION_EVIDENCE_PATH &&
    checkpoint.policyEvaluationEvidence.sha256 === POLICY_EVALUATION_EVIDENCE_SHA256 &&
    existsSync(resolve(repoRoot, POLICY_EVALUATION_EVIDENCE_PATH)) &&
    sha256File(resolve(repoRoot, POLICY_EVALUATION_EVIDENCE_PATH)) ===
      POLICY_EVALUATION_EVIDENCE_SHA256 &&
    checkpoint.policyEvaluationEvidence.externalWritesAllowed === false,
  "RR private policy-evaluation evidence is stale or unsafe.",
);
must(
  JSON.stringify(checkpoint.currentProductionObservation) ===
      JSON.stringify(manifest.currentProductionObservation) &&
    checkpoint.currentProductionObservation.canonicalGitHubMainCommit ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.canonicalGitHubMainCommit &&
    checkpoint.currentProductionObservation.sitesVersion === 39 &&
    checkpoint.currentProductionObservation.productionMigrationCount === 43 &&
    checkpoint.currentProductionObservation.githubParityVerifiedAtObservation === true,
  "RR current-production evidence must equal manifest main59b/Sites v39/live43 evidence.",
);
const candidate = { ...checkpoint.releaseCandidate };
delete candidate.manifest;
delete candidate.state;
delete candidate.localReviewPassed;
must(
  canonicalJson(candidate) === canonicalJson(manifest.releaseCandidate),
  "RR candidate fields or fingerprints differ from the manifest.",
);
must(
  checkpoint.releaseCandidate.pullRequest === 164 &&
    checkpoint.releaseCandidate.pullRequestDraft === true &&
    checkpoint.releaseCandidate.observedDraftPullRequestHead ===
      "b659ec307da9455c389059b29f2d6f3ab51f095e" &&
    checkpoint.releaseCandidate.observedDraftPullRequestTree ===
      "9931d63dcb16a2e2e1cb7c592d2da63b4054cb60" &&
    checkpoint.releaseCandidate.draftHeadEvidenceScope ===
      "draft_pr_opening_head_before_evidence_refresh_not_final_reviewed_head" &&
    checkpoint.releaseCandidate.githubMerged === false &&
    checkpoint.releaseCandidate.allFourWorkflowsGreen === null &&
    checkpoint.releaseCandidate.zeroUnresolvedReviewThreads === null &&
    checkpoint.releaseCandidate.databaseChangesRequired === true &&
    checkpoint.releaseCandidate.databaseMigrationApplied === false &&
    checkpoint.releaseCandidate.candidateMigrationsMatchLiveLedger === false &&
    JSON.stringify(checkpoint.releaseCandidate.databaseMigrationsApplied) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) &&
    JSON.stringify(checkpoint.releaseCandidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    checkpoint.releaseCandidate.databaseApplyAuthorized === true &&
    checkpoint.releaseCandidate.sitesPublished === false &&
    checkpoint.releaseCandidate.sitesPublishAuthorized === true &&
    checkpoint.releaseCandidate.deploymentAuthorized === true &&
    checkpoint.releaseCandidate.activationExecuted === false &&
    checkpoint.releaseCandidate.fullReleaseGatePassed === false,
  "RR draft PR #164 evidence is stale or overclaims final-head gates, merge, database apply, Sites publish, or activation.",
);
must(
  JSON.stringify(checkpoint.rolloutSequence) ===
      JSON.stringify(manifest.rolloutSequence) &&
    checkpoint.rolloutSequence.status ===
      "predeployment_v5_cutover_freeze_required" &&
    checkpoint.rolloutSequence.steps.length === 9 &&
    checkpoint.rolloutSequence.steps.every(
      (step: { completed: boolean; explicitReviewRequired: boolean }) =>
        step.completed === false && step.explicitReviewRequired === true,
    ) &&
    checkpoint.rolloutSequence.steps[1]?.id === "freeze_content_v4_ingress" &&
    checkpoint.rolloutSequence.steps[2]?.id === "drain_v4_content_work" &&
    checkpoint.rolloutSequence.steps[3]?.migration ===
      LOCAL_CANDIDATE_PENDING_MIGRATIONS[0] &&
    checkpoint.rolloutSequence.steps[5]?.id ===
      "reconcile_generated_migration_version" &&
    checkpoint.rolloutSequence.steps[6]?.id === "publish_v5_sites_candidate" &&
    checkpoint.rolloutSequence.steps[8]?.id ===
      "restore_bounded_internal_ingress",
  "RR rollout must preserve the fail-closed merge/freeze/drain/apply/generated-version-reconcile/publish/restore order.",
);
const databaseEvidence = checkpoint.databaseEvidence;
must(
  databaseEvidence.liveBaseline.migrationFileCount === 43 &&
    databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 &&
    databaseEvidence.candidate.migrationFileCount === 44 &&
    databaseEvidence.candidate.migrationTreeSha256 ===
      manifest.releaseCandidate.migrationTreeSha256 &&
    JSON.stringify(databaseEvidence.candidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    JSON.stringify(databaseEvidence.candidate.appliedMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS),
  "RR database evidence must distinguish live43 from the provisional DB44 candidate.",
);
const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
must(
  sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256 &&
    migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256,
  "RR candidate fingerprints are stale.",
);
must(
  checkpoint.activationGates.some((gate: string) =>
    /Draft PR #164[\s\S]*b659ec307da9455c389059b29f2d6f3ab51f095e[\s\S]*not final-head/iu.test(
      gate,
    ),
  ) &&
    checkpoint.activationGates.some((gate: string) =>
    /freeze[\s\S]*drain/iu.test(gate),
  ) &&
    checkpoint.activationGates.some((gate: string) =>
      /Supabase MCP[\s\S]*generated ledger version/iu.test(gate),
    ) &&
    checkpoint.activationGates.some((gate: string) =>
      /follow-up PR[\s\S]*renam(?:e|es) both migration mirrors/iu.test(gate),
    ) &&
    checkpoint.activationGates.some((gate: string) =>
      /Publish[\s\S]*Sites[\s\S]*external providers/iu.test(gate),
    ),
  "Activation gates omit a required fail-closed cutover boundary.",
);
const pgtapFixturePath = resolve(
  repoRoot,
  "supabase/tests/momo_preconnection_integration.sql",
);
must(
  sha256File(pgtapFixturePath) ===
      "11740e1a55be4eef8a4fa25464959e7d28831841777974ca9e21fdd99a7e85c0" &&
    checkpoint.reusableEvidence.some((entry: string) =>
      /46 statements\/19[\s\S]*354\/88[\s\S]*11740e1a[\s\S]*89\/89/iu.test(
        entry,
      ),
    ),
  "RR executable SQL/parser evidence is stale.",
);
for (const value of Object.values(checkpoint.runtimeVerification)) {
  must(value === false, "Runtime checkpoint must not claim external action or activation.");
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
  const text = readFileSync(resolve(repoRoot, document), "utf8");
  must(
    text.includes(CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256) &&
      text.includes(manifest.releaseCandidate.migrationTreeSha256) &&
      text.includes(manifest.releaseCandidate.sourceTreeSha256) &&
      /Sites v39/iu.test(text) &&
      /045812/iu.test(text) &&
      /pending|unapplied/iu.test(text) &&
      /generated(?:[\s-]+migration)?[\s-]+version|generated ledger version/iu.test(text) &&
      /draft PR #164/iu.test(text) &&
      text.includes("b659ec307da9455c389059b29f2d6f3ab51f095e") &&
      text.includes("9931d63dcb16a2e2e1cb7c592d2da63b4054cb60") &&
      /final-head/iu.test(text),
    `Current document does not distinguish live production, provisional DB44, and the generated-version reconciliation gate: ${document}`,
  );
}
if (failures.length) {
  console.error("RR release checkpoint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `RR checkpoint passed: main59b/Sites v39/live43 remain exact; ${sourceTree.fileCount}-file Sites and ${migrationTree.fileCount}-migration candidates are reviewed locally but unmerged, unapplied, unpublished, and activation-frozen.`,
);
