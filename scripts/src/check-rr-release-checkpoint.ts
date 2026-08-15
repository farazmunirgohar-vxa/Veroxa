import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_UPLOAD_HANDOFF_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  hasActiveMediaInspectionForwardCandidate,
  readDeploymentManifest,
  repoRoot,
} from "./release-manifest";

type JsonRecord = Record<string, any>;
const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const canonical = (value: unknown): string => JSON.stringify(value);
const rrPath = resolve(repoRoot, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const raw = readFileSync(rrPath, "utf8");
must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(raw), "RR checkpoint contains merge markers.");
const rr = JSON.parse(raw) as JsonRecord;
const manifest = readDeploymentManifest();
const activeForwardCandidate = hasActiveMediaInspectionForwardCandidate();

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (activeForwardCandidate) {
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: RR schema-13 remains immutable historical evidence while CURRENT_STATE governs the active forward candidate.",
  );
  process.exit(0);
}

if (manifest.schemaVersion === 13) {
  must(
    rr.schemaVersion === 19 &&
      rr.recordKind ===
        "veroxa_momo_media_recovery_host_inspection_diagnostics_closeout_checkpoint" &&
      rr.status === manifest.releaseState &&
      rr.reviewedAt === manifest.reviewedAt &&
      rr.candidateRevision === manifest.candidateRevision,
    "RR is not the schema-13 private media-recovery host-inspection closeout checkpoint.",
  );
  must(
    rr.releaseCandidate?.manifest ===
        "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
      rr.releaseCandidate?.state === manifest.releaseCandidate.status &&
      rr.releaseCandidate?.localReviewPassed === true &&
      canonical(rr.releaseCandidate?.evidence) ===
        canonical(manifest.releaseCandidate),
    "RR schema-13 release candidate diverges from the manifest.",
  );
  for (const field of [
    "currentProductionObservation",
    "applicationQualityEvidence",
    "databaseContractReview",
    "operationalHold",
    "durableMediaIngestionRecovery",
    "currentRuntimeIdentityObservation",
    "deploymentFreeze",
  ]) {
    must(
      canonical(rr[field]) === canonical((manifest as JsonRecord)[field]),
      "RR schema-13 field does not mirror manifest: " + field,
    );
  }
  must(
    rr.fullReleaseGatePassed === false &&
      rr.fullReleaseGateScope === manifest.fullReleaseGateScope &&
    rr.runtimeVerification?.providerCallObserved === false &&
      rr.runtimeVerification?.realRecoveryObserved === false &&
      rr.runtimeVerification?.signedRecoveryAttemptObserved === true &&
      rr.runtimeVerification?.privateVerificationObserved === false &&
      rr.runtimeVerification?.readyDispositionObserved === false &&
      rr.runtimeVerification?.externalProvidersConnected === false &&
      rr.runtimeVerification?.externalPublishingEnabled === false,
    "RR schema-13 diverges from the observed third failed signed attempt or overclaims recovery/external action.",
  );
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: RR schema-13 checkpoint mirrors the Sites v56 diagnostic release, consumed third attempt, and Images-binding blocker.",
  );
  process.exit(0);
}

if (manifest.schemaVersion === 11) {
  const rrCandidate = { ...rr.releaseCandidate };
  delete rrCandidate.manifest;
  delete rrCandidate.state;
  delete rrCandidate.localReviewPassed;
  must(
    rr.schemaVersion === 16 &&
      rr.recordKind === "veroxa_momo_live56_high_resolution_media_checkpoint",
    "RR is not the schema-11 live56 high-resolution checkpoint.",
  );
  must(
    rr.status === manifest.releaseState &&
      rr.reviewedAt === manifest.reviewedAt &&
      rr.candidateRevision === manifest.candidateRevision,
    "RR schema-11 top-level identity diverges from the manifest.",
  );
  must(
    rr.releaseCandidate.manifest ===
        "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
      rr.releaseCandidate.state === manifest.releaseCandidate.status &&
      rr.releaseCandidate.localReviewPassed === true &&
      canonical(rrCandidate) === canonical(manifest.releaseCandidate),
    "RR schema-11 candidate does not exactly mirror the manifest.",
  );
  for (const field of [
    "currentProductionObservation",
    "mediaUploadHandoff",
    "applicationQualityEvidence",
    "databaseContractReview",
    "edgeDeployment",
    "edgeCandidate",
    "operationalHold",
    "activationRoutine",
    "generatedVersionCloseouts",
    "deploymentParity",
    "rolloutSequence",
    "rolloutEvidence",
    "activationExecution",
    "legacyMediaPurgeAndHighResolutionRelease",
  ]) {
    must(
      canonical(rr[field]) === canonical((manifest as JsonRecord)[field]),
      "RR schema-11 field does not mirror manifest: " + field,
    );
  }
  must(
    rr.activationStateScope === manifest.activationStateScope &&
      rr.fullReleaseGatePassed === manifest.fullReleaseGatePassed &&
      rr.fullReleaseGateScope === manifest.fullReleaseGateScope,
    "RR schema-11 activation scope diverges from the manifest.",
  );
  must(
    rr.databaseEvidence.liveBaseline.migrationFileCount ===
        manifest.currentProductionObservation.productionMigrationCount &&
      rr.databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
        manifest.currentProductionObservation.migrationTreeSha256 &&
      rr.databaseEvidence.liveBaseline.latestMigration ===
        manifest.currentProductionObservation.latestProductionMigration &&
      rr.databaseEvidence.integratedBaseline.migrationFileCount ===
        manifest.migrations.fileCount &&
      rr.databaseEvidence.integratedBaseline.migrationTreeSha256 ===
        manifest.migrations.treeSha256 &&
      canonical(rr.databaseEvidence.integratedBaseline.pendingMigrations) ===
        canonical(manifest.releaseCandidate.pendingMigrations) &&
      canonical(rr.databaseEvidence.integratedBaseline.appliedMigrations) ===
        canonical(manifest.releaseCandidate.databaseMigrationsApplied) &&
      rr.databaseEvidence.integratedBaseline
        .candidateMigrationsMatchLiveLedger ===
        manifest.releaseCandidate.candidateMigrationsMatchLiveLedger &&
      canonical(rr.databaseEvidence.forwardRepair) ===
        canonical(manifest.databaseContractReview),
    "RR schema-11 database evidence diverges from the manifest.",
  );
  must(
    rr.runtimeVerification.providerCallObserved === false &&
      rr.runtimeVerification.realUploadObserved === false &&
      rr.runtimeVerification.readyDispositionObserved === false &&
      rr.runtimeVerification.externalProvidersConnected === false &&
      rr.runtimeVerification.externalPublishingEnabled === false &&
      rr.runtimeVerification.legacyMediaRemainingCount === 0 &&
      rr.runtimeVerification.storageObjectsRemainingCount === 0 &&
      rr.runtimeVerification.totalPixelCeilingRemoved === true &&
      rr.operationalHold.providerWrites === false &&
      rr.operationalHold.reviewReplies === false &&
      rr.operationalHold.websiteWrites === false &&
      rr.operationalHold.externalScheduling === false,
    "RR schema-11 overclaims runtime or external-action execution.",
  );
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: RR schema-11 checkpoint mirrors the live56 Sites v53 release.",
  );
  process.exit(0);
}

must(
  rr.schemaVersion === 14 &&
    rr.recordKind === "veroxa_guarded_internal_ai_rollout_checkpoint",
  "RR is not the guarded rollout checkpoint.",
);
must(
  rr.status === manifest.releaseState &&
    rr.reviewedAt === manifest.reviewedAt &&
    rr.candidateRevision === manifest.candidateRevision,
  "RR top-level release identity diverges from the manifest.",
);
const rrCandidate = { ...rr.releaseCandidate };
delete rrCandidate.manifest;
delete rrCandidate.state;
delete rrCandidate.localReviewPassed;
must(
  rr.releaseCandidate.manifest ===
      "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    rr.releaseCandidate.state === manifest.releaseCandidate.status &&
    rr.releaseCandidate.localReviewPassed === true &&
    canonical(rrCandidate) === canonical(manifest.releaseCandidate),
  "RR release candidate does not exactly mirror the manifest.",
);
for (const field of [
  "knownResiduals",
  "currentProductionObservation",
  "mediaUploadHandoff",
  "applicationQualityEvidence",
  "databaseContractReview",
  "edgeDeployment",
  "edgeCandidate",
  "operationalHold",
  "activationRoutine",
  "generatedVersionCloseouts",
  "deploymentParity",
  "rolloutSequence",
  "rolloutEvidence",
  "activationExecution",
]) {
  must(
    canonical(rr[field]) === canonical((manifest as JsonRecord)[field]),
    `RR field does not canonically mirror manifest: ${field}`,
  );
}
must(
  rr.activationStateScope === manifest.activationStateScope &&
    rr.fullReleaseGatePassed === manifest.fullReleaseGatePassed &&
    rr.fullReleaseGateScope === manifest.fullReleaseGateScope,
  "RR activation scope or scoped full-release gate diverges from the manifest.",
);
must(
  rr.databaseEvidence.liveBaseline.migrationFileCount ===
      manifest.currentProductionObservation.productionMigrationCount &&
    rr.databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
      manifest.currentProductionObservation.migrationTreeSha256 &&
    rr.databaseEvidence.liveBaseline.latestMigration ===
      manifest.currentProductionObservation.latestProductionMigration &&
    rr.databaseEvidence.integratedBaseline.migrationFileCount ===
      manifest.migrations.fileCount &&
    rr.databaseEvidence.integratedBaseline.migrationTreeSha256 ===
      manifest.migrations.treeSha256 &&
    canonical(rr.databaseEvidence.integratedBaseline.pendingMigrations) ===
      canonical(manifest.releaseCandidate.pendingMigrations) &&
    canonical(rr.databaseEvidence.integratedBaseline.appliedMigrations) ===
      canonical(manifest.releaseCandidate.databaseMigrationsApplied) &&
    rr.databaseEvidence.integratedBaseline.candidateMigrationsMatchLiveLedger ===
      manifest.releaseCandidate.candidateMigrationsMatchLiveLedger &&
    canonical(rr.databaseEvidence.forwardRepair) ===
      canonical(manifest.databaseContractReview),
  "RR database evidence diverges from the manifest.",
);
must(
  rr.runtimeVerification.providerCallObserved === false &&
    rr.runtimeVerification.aiLiveCalls === true &&
    rr.runtimeVerification.registeredMutableRpcIngressHoldVerified === false &&
    rr.runtimeVerification.preActivationRegisteredMutableRpcIngressHoldVerified ===
      true &&
    rr.runtimeVerification.activationGateReady === false &&
    rr.runtimeVerification.activationExecuted === true &&
    rr.runtimeVerification.externalProvidersConnected === false &&
    rr.runtimeVerification.externalPublishingEnabled === false &&
    rr.operationalHold.providerWrites === false &&
    rr.operationalHold.reviewReplies === false &&
    rr.operationalHold.websiteWrites === false &&
    rr.operationalHold.externalScheduling === false,
  "RR overclaims provider or external-action execution.",
);
must(
  rr.checkpoint ===
      "live52-media-upload-one-step-team-processor-parity-verified-external-actions-held-2026-08-09" &&
    Array.isArray(rr.activationGates) &&
    rr.activationGates.length === 4 &&
    rr.activationGates.some((gate: unknown) =>
      typeof gate === "string" && gate.includes("invoked exactly once"),
    ) &&
    rr.activationGates.some((gate: unknown) =>
      typeof gate === "string" && gate.includes("ai_live_calls=true"),
    ) &&
    rr.activationGates.every(
      (gate: unknown) =>
        typeof gate === "string" &&
        !/uninvoked|not gate-ready|Draft PR #169|no activation execution/i.test(
          gate,
        ),
    ),
  "RR activation-gate narrative is stale or contradicts the invoked state.",
);
must(
  rr.mediaUploadHandoff?.clientActionAfterUpload === "none" &&
    rr.mediaUploadHandoff?.processingOwner === "veroxa_team" &&
    rr.mediaUploadHandoff?.reviewedHead ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedHead &&
    rr.mediaUploadHandoff?.reviewedTree ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedTree &&
    rr.mediaUploadHandoff?.mergedPullRequest ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedPullRequest &&
    rr.mediaUploadHandoff?.mergedMainCommit ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedMainCommit &&
    rr.mediaUploadHandoff?.allFourExactHeadWorkflowsGreen === true &&
    rr.mediaUploadHandoff?.zeroUnresolvedReviewThreads === true &&
    rr.mediaUploadHandoff?.closeoutPullRequest ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.closeoutPullRequest &&
    rr.mediaUploadHandoff?.closeoutEvidenceOnly === true &&
    rr.mediaUploadHandoff?.legacyV2AuthenticatedExecute === false &&
    rr.mediaUploadHandoff?.teamProcessorAvailable === true &&
    rr.mediaUploadHandoff?.instructionApplicationCount === 0 &&
    rr.mediaUploadHandoff?.existingUploadRequiresClientRetry === false &&
    rr.mediaUploadHandoff?.openMediaIntakeExceptionCount === 3 &&
    rr.mediaUploadHandoff?.allMediaIntakeExceptionsExternalLocked === true,
  "RR does not preserve the one-step Client upload and Team-owned exception boundary.",
);
must(
  rr.activationExecution.invoked === true &&
    rr.activationExecution.authenticatedSmokeActiveTeamProfileCount === 1 &&
    rr.activationExecution.authenticatedSmokeActiveMomoMembershipCount === 1 &&
    rr.activationExecution.authenticatedSmokeReadOnlyRpcExecuteCount === 3 &&
    rr.activationExecution.authenticatedSmokeActivationExecute === false &&
    rr.activationExecution.authenticatedSmokeDirectCandidateInsertPrivilege ===
      false &&
    rr.activationExecution.authenticatedSmokeReadyRowCount === 0 &&
    rr.activationExecution.authenticatedSmokeUploadStatusRowCount === 2 &&
    rr.activationExecution.authenticatedSmokeUploadRowsExternalLocked === true &&
    rr.activationExecution.authenticatedSmokeMediaWindowRowCount === 0 &&
    rr.activationExecution.costLedgerRowCount === 0 &&
    rr.activationExecution.costLedgerProviderCalledRowCount === 0 &&
    rr.activationExecution.costLedgerAccountedMicrousd === 0 &&
    rr.activationExecution.postActivationEdgeInvocationCount === 0 &&
    rr.activationExecution.incrementalSpendUsd === 0,
  "RR post-activation smoke, cost, or bounded Edge-log evidence is incomplete.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("PASS: RR canonically mirrors the guarded rollout manifest.");
}
