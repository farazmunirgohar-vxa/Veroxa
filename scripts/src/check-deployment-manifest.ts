import { readFileSync } from "node:fs";
import {
  INTERNAL_AI_RELEASE_EVIDENCE,
  MEDIA_UPLOAD_HANDOFF_EVIDENCE,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  deploymentManifestPath,
  readDeploymentManifest,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const raw = readFileSync(deploymentManifestPath, "utf8");
must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(raw), "Manifest contains merge markers.");

const manifest = readDeploymentManifest();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (manifest.schemaVersion === 12) {
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    "PASS: schema-12 durable media-ingestion recovery candidate is locally reviewed, mirrored, externally locked, and pending remote release evidence.",
  );
  process.exit(0);
}

if (manifest.schemaVersion === 11) {
  if (failures.length > 0) { for (const failure of failures) console.error("FAIL:", failure); process.exit(1); }
  console.log("PASS: schema-11 live56 purge, high-resolution acceptance, Sites v53, migration, and external-action locks are verified.");
  process.exit(0);
}
const repairCloseout = manifest.generatedVersionCloseouts?.repair as
  | Record<string, unknown>
  | undefined;
const activationCloseout = manifest.generatedVersionCloseouts?.activation as
  | Record<string, unknown>
  | undefined;
const firstHeld = manifest.deploymentParity?.firstHeld as
  | Record<string, unknown>
  | undefined;
const secondHeld = manifest.deploymentParity?.secondHeld as
  | Record<string, unknown>
  | undefined;
const activationCloseoutGitHubRelease = manifest.rolloutEvidence
  ?.activationCloseoutGitHubRelease as Record<string, unknown> | undefined;
const secondRuntimeParity = manifest.rolloutEvidence?.secondRuntimeParity as
  | Record<string, unknown>
  | undefined;
const activationPostflightVerification = manifest.rolloutEvidence
  ?.activationPostflightVerification as Record<string, unknown> | undefined;
const mediaUploadHandoff = manifest.mediaUploadHandoff as
  | Record<string, any>
  | undefined;
must(
  manifest.schemaVersion === 10 &&
    manifest.recordKind === "veroxa_guarded_internal_ai_rollout_manifest",
  "Manifest is not the guarded internal-AI rollout authority.",
);
must(
  manifest.currentProductionObservation.productionMigrationCount ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.migrationFileCount &&
    manifest.currentProductionObservation.canonicalGitHubMainCommit ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedMainCommit &&
    manifest.currentProductionObservation.canonicalGitHubMainMergePullRequest ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedPullRequest &&
    manifest.currentProductionObservation.canonicalGitHubMainCommitScope ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.operationalSourceCommitScope &&
    manifest.currentProductionObservation.sitesVersion ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersion &&
    manifest.currentProductionObservation.sitesVersionId ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesVersionId &&
    manifest.currentProductionObservation.sitesCheckoutCommit ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesSourceCommit &&
    manifest.currentProductionObservation.sourceTreeSha256 ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.liveSitesSourceTreeSha256 &&
    manifest.currentProductionObservation.sitesArchiveFileCount ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesArchiveFileCount &&
    manifest.currentProductionObservation.sitesArchiveByteLength ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesArchiveByteLength &&
    manifest.currentProductionObservation.sitesArchiveSha256 ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.sitesArchiveSha256 &&
    manifest.currentProductionObservation.latestProductionMigration ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration &&
    manifest.currentProductionObservation.latestProductionMigrationByteLength ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigrationByteLength &&
    manifest.currentProductionObservation.latestProductionMigrationSha256 ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigrationSha256 &&
    manifest.currentProductionObservation.githubParityVerifiedAtObservation ===
      true &&
    manifest.currentProductionObservation.githubMainMatchesCandidate === true &&
    manifest.currentProductionObservation.candidateSourceMatchesLiveSites ===
      true &&
    manifest.currentProductionObservation.candidateMigrationsMatchLiveLedger === true &&
    manifest.currentProductionObservation.fullReleaseGateScope ===
      "media_upload_one_step_handoff_github_sites_parity_verified_external_actions_held",
  "Observed production is not the exact live52 media-handoff checkpoint.",
);
must(
  mediaUploadHandoff?.status === MEDIA_UPLOAD_HANDOFF_EVIDENCE.status &&
    mediaUploadHandoff.reviewedHead === MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedHead &&
    mediaUploadHandoff.reviewedTree === MEDIA_UPLOAD_HANDOFF_EVIDENCE.reviewedTree &&
    mediaUploadHandoff.mergedPullRequest ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedPullRequest &&
    mediaUploadHandoff.mergedMainCommit ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.mergedMainCommit &&
    mediaUploadHandoff.allFourExactHeadWorkflowsGreen === true &&
    mediaUploadHandoff.zeroUnresolvedReviewThreads === true &&
    mediaUploadHandoff.closeoutPullRequest ===
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.closeoutPullRequest &&
    mediaUploadHandoff.closeoutEvidenceOnly === true &&
    mediaUploadHandoff.clientActionAfterUpload === "none" &&
    mediaUploadHandoff.processingOwner === "veroxa_team" &&
    mediaUploadHandoff.legacyV2AuthenticatedExecute === false &&
    mediaUploadHandoff.v3AuthenticatedExecute === true &&
    mediaUploadHandoff.teamProcessorAvailable === true &&
    mediaUploadHandoff.existingUploadRequiresClientRetry === false &&
    mediaUploadHandoff.preFixInstructionRecoverable === false &&
    mediaUploadHandoff.savedInstructionCount === 0 &&
    mediaUploadHandoff.instructionApplicationCount === 0 &&
    mediaUploadHandoff.unverifiedSavedUploadCount === 3 &&
    mediaUploadHandoff.openMediaIntakeExceptionCount === 3 &&
    mediaUploadHandoff.allMediaIntakeExceptionsExternalLocked === true &&
    mediaUploadHandoff.bridgeKeyRotated === true &&
    mediaUploadHandoff.candidateSourceFileCount === manifest.source.fileCount &&
    mediaUploadHandoff.candidateSourceTreeSha256 ===
      manifest.source.treeSha256 &&
    mediaUploadHandoff.migrationFileCount === manifest.migrations.fileCount &&
    mediaUploadHandoff.migrationTreeSha256 ===
      manifest.migrations.treeSha256 &&
    JSON.stringify(mediaUploadHandoff.edgeFunctions) ===
      JSON.stringify(MEDIA_UPLOAD_HANDOFF_EVIDENCE.edgeFunctions),
  "Momo upload handoff or repaired Edge evidence is incomplete.",
);
must(
  repairCloseout?.actualLedgerVersion === "20260809035302" &&
    repairCloseout.actualLedgerFilename === REPAIR_MIGRATION_EVIDENCE.filename &&
    repairCloseout.sourceByteLength === REPAIR_MIGRATION_EVIDENCE.byteLength &&
    repairCloseout.submittedQueryTransportByteLength === 59_053 &&
    repairCloseout.transportTrailingNewlineDeltaBytes === 1 &&
    repairCloseout.databaseLedgerStoresSqlBytes === false &&
    repairCloseout.unchangedBytesVerified === true &&
    repairCloseout.completed === true &&
    repairCloseout.pullRequest === 167 &&
    repairCloseout.mergedCommit ===
      "a1c6796b50a1072a96a40db283503d9e2c81bbae",
  "Live48 generated-version closeout is not recorded exactly.",
);
must(
    manifest.releaseCandidate.pullRequest ===
      INTERNAL_AI_RELEASE_EVIDENCE.pullRequest &&
    manifest.releaseCandidate.githubMerged === true &&
    manifest.releaseCandidate.databaseMigrationApplied === true &&
    manifest.releaseCandidate.pendingMigrations?.length === 0 &&
    manifest.releaseCandidate.allFourWorkflowsGreen === true &&
    manifest.releaseCandidate.zeroUnresolvedReviewThreads === true &&
    manifest.releaseCandidate.futureMergedGitHubCommit ===
      INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
    manifest.releaseCandidate.futureSitesVersion ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesVersion &&
    manifest.releaseCandidate.sitesPublishRequired === false &&
    manifest.releaseCandidate.sitesPublished === true &&
    manifest.releaseCandidate.activationGateReady === false &&
    manifest.releaseCandidate.activationAuthorizationConsumed === true &&
    manifest.releaseCandidate.fullReleaseGateScope ===
      INTERNAL_AI_RELEASE_EVIDENCE.fullReleaseGateScope &&
    manifest.databaseContractReview?.localStaticReviewPassed === true &&
    manifest.databaseContractReview.hostedCleanChainApplyPassed === true &&
    manifest.databaseContractReview.hostedFullPgTapPassed === true &&
    manifest.databaseContractReview.hostedDatabaseExecutionPassed === true,
  "Live49 hosted verification or source-closeout state is incomplete.",
);
must(
  manifest.activationRoutine?.migrationFilename ===
      "20260809051616_guarded_internal_ai_activation_v1.sql" &&
    manifest.activationRoutine.migrationSha256 ===
      "22d5e82f683c3dd9d4b3d9c5b4e5003cf3a769f67dde340e98deee3ba3afb8ba" &&
    manifest.activationRoutine.generatedProductionVersion === "20260809051616" &&
    manifest.activationRoutine.sourceReviewPullRequest === 168 &&
    manifest.activationRoutine.sourceReviewExactHead ===
      "d08114104f4030e31abe2514caf95c681e2b19ea" &&
    manifest.activationRoutine.sourceReviewAllFourWorkflowsGreen === true &&
    manifest.activationRoutine.sourceReviewZeroUnresolvedThreads === true &&
    manifest.activationRoutine.installed === true &&
    manifest.activationRoutine.invoked === true &&
    manifest.activationRoutine.gateReady === false &&
    manifest.activationRoutine.invocationGateConsumed === true &&
    manifest.activationRoutine.postgresOnly === true &&
    manifest.activationRoutine.executeGrantedToPublic === false &&
    manifest.activationRoutine.executeGrantedToAnon === false &&
    manifest.activationRoutine.executeGrantedToAuthenticated === false &&
    manifest.activationRoutine.executeGrantedToServiceRole === false &&
    activationCloseout?.completed === true &&
    activationCloseout.unchangedBytesVerified === true &&
    activationCloseout.actualLedgerVersion === "20260809051616" &&
    activationCloseout.actualLedgerFilename ===
      "20260809051616_guarded_internal_ai_activation_v1.sql" &&
    activationCloseout.exactHead === INTERNAL_AI_RELEASE_EVIDENCE.exactHead &&
    activationCloseout.exactTree === INTERNAL_AI_RELEASE_EVIDENCE.exactTree &&
    activationCloseout.mergedCommit === INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
    activationCloseout.allFourExactHeadWorkflowsGreen === true &&
    activationCloseout.zeroUnresolvedReviewThreads === true &&
    JSON.stringify(activationCloseout.workflows) ===
      JSON.stringify(INTERNAL_AI_RELEASE_EVIDENCE.workflows) &&
    activationCloseoutGitHubRelease?.pullRequest ===
      INTERNAL_AI_RELEASE_EVIDENCE.pullRequest &&
    activationCloseoutGitHubRelease.exactHead ===
      INTERNAL_AI_RELEASE_EVIDENCE.exactHead &&
    activationCloseoutGitHubRelease.exactTree ===
      INTERNAL_AI_RELEASE_EVIDENCE.exactTree &&
    activationCloseoutGitHubRelease.mergedCommit ===
      INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
    JSON.stringify(activationCloseoutGitHubRelease.workflows) ===
      JSON.stringify(INTERNAL_AI_RELEASE_EVIDENCE.workflows),
  "Activation install, invocation, or generated-version evidence is incomplete.",
);
must(
  firstHeld?.verified === true &&
    firstHeld.holdReverified === true &&
    firstHeld.aiLiveCalls === false &&
    firstHeld.externalFlagsFalse === true &&
    firstHeld.mergedGitHubCommit ===
      "a1c6796b50a1072a96a40db283503d9e2c81bbae" &&
    firstHeld.sitesVersion === 40 &&
    firstHeld.edgeFunctionVersion === 7,
  "First GitHub/Sites/Edge parity is not verified under hold.",
);
must(
  secondHeld?.verified === true &&
    secondHeld.holdReverified === true &&
    secondHeld.aiLiveCalls === false &&
    secondHeld.externalFlagsFalse === true &&
    secondHeld.mergedGitHubCommit === INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
    secondHeld.sitesVersion === INTERNAL_AI_RELEASE_EVIDENCE.sitesVersion &&
    secondHeld.sitesVersionId === INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId &&
    secondHeld.sitesSourceCommit ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit &&
    secondHeld.sitesSourceSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceSha256 &&
    secondHeld.sitesArchiveSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256 &&
    secondHeld.edgeFunctionVersion ===
      INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionVersion &&
    secondHeld.edgeFunctionId === INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionId &&
    secondHeld.edgeBundleSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256 &&
    secondRuntimeParity?.sitesArchiveFileCount ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveFileCount &&
    secondRuntimeParity.sitesArchiveByteLength ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveByteLength &&
    secondRuntimeParity.preActivationRegisteredRpcCount === 59 &&
    secondRuntimeParity.preActivationLeakedRpcCount === 0 &&
    secondRuntimeParity.preActivationRelevantWorkRowCount === 0 &&
    secondRuntimeParity.preActivationOutboundHttpRowCount === 0,
  "Second GitHub/Sites/Edge parity is not verified under hold.",
);
must(
  manifest.operationalHold?.aiLiveCalls === true &&
    manifest.operationalHold.providerWrites === false &&
    manifest.operationalHold.reviewReplies === false &&
    manifest.operationalHold.websiteWrites === false &&
    manifest.operationalHold.externalScheduling === false &&
    manifest.operationalHold.postActivationGrantMismatchCount === 0 &&
    manifest.operationalHold.postActivationAuthenticatedGrantCount === 13 &&
    manifest.operationalHold.postActivationServiceRoleGrantCount === 32 &&
    manifest.operationalHold.postActivationRemainingHeldCount === 14 &&
    manifest.operationalHold.preActivationRegisteredMutableRpcSetCount === 59 &&
    manifest.operationalHold.registeredMutableRpcAclHoldVerified === false &&
    manifest.releaseCandidate.sitesPublished === true &&
    manifest.releaseCandidate.edgeDeployed === true &&
    manifest.releaseCandidate.activationExecuted === true &&
    manifest.activationExecution?.invokedAt ===
      INTERNAL_AI_RELEASE_EVIDENCE.invokedAt &&
    manifest.activationExecution?.activationAuditEventId ===
      INTERNAL_AI_RELEASE_EVIDENCE.activationAuditEventId &&
    manifest.activationExecution?.boundMergedGitHubCommit ===
      INTERNAL_AI_RELEASE_EVIDENCE.mergedCommit &&
    manifest.activationExecution?.boundSitesVersionId ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesVersionId &&
    manifest.activationExecution?.boundSitesSourceCommit ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceCommit &&
    manifest.activationExecution?.boundSitesSourceSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesSourceSha256 &&
    manifest.activationExecution?.boundSitesArchiveSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.sitesArchiveSha256 &&
    manifest.activationExecution?.boundEdgeFunctionId ===
      INTERNAL_AI_RELEASE_EVIDENCE.edgeFunctionId &&
    manifest.activationExecution?.boundEdgeBundleSha256 ===
      INTERNAL_AI_RELEASE_EVIDENCE.edgeBundleSha256 &&
    manifest.activationExecution?.missingRpcCount === 0 &&
    manifest.activationExecution?.anonGrantCount === 0 &&
    manifest.activationExecution?.authenticatedGrantCount === 13 &&
    manifest.activationExecution?.serviceRoleGrantCount === 32 &&
    manifest.activationExecution?.remainingHeldCount === 14 &&
    manifest.activationExecution?.activationRoutineAppRoleGrantCount === 0 &&
    manifest.activationExecution?.relevantWorkBeforeActivation === 0 &&
    manifest.activationExecution?.relevantWorkAfterActivation === 0 &&
    manifest.activationExecution?.outboundHttpRowsAfterActivation === 0 &&
    manifest.activationExecution?.activationAuditEventCount === 1 &&
    manifest.activationExecution?.authenticatedSmokeActiveTeamProfileCount === 1 &&
    manifest.activationExecution?.authenticatedSmokeActiveMomoMembershipCount === 1 &&
    manifest.activationExecution?.authenticatedSmokeReadOnlyRpcExecuteCount === 3 &&
    manifest.activationExecution?.authenticatedSmokeActivationExecute === false &&
    manifest.activationExecution?.authenticatedSmokeDirectCandidateInsertPrivilege ===
      false &&
    manifest.activationExecution?.authenticatedSmokeReadyRowCount === 0 &&
    manifest.activationExecution?.authenticatedSmokeReadyRowsExternalLocked === true &&
    manifest.activationExecution?.authenticatedSmokeUploadStatusRowCount === 2 &&
    manifest.activationExecution?.authenticatedSmokeUploadRowsExternalLocked === true &&
    manifest.activationExecution?.authenticatedSmokeMediaWindowRowCount === 0 &&
    manifest.activationExecution?.costLedgerRowCount === 0 &&
    manifest.activationExecution?.costLedgerProviderCalledRowCount === 0 &&
    manifest.activationExecution?.costLedgerAccountedMicrousd === 0 &&
    manifest.activationExecution?.postActivationEdgeInvocationCount === 0 &&
    manifest.activationExecution?.providerCallsObserved === 0 &&
    manifest.activationExecution?.incrementalSpendUsd === 0 &&
    activationPostflightVerification?.exactActivationEventPayloadVerified === true &&
    activationPostflightVerification.costLedgerRowCount === 0 &&
    activationPostflightVerification.postActivationEdgeInvocationCount === 0 &&
    manifest.rolloutSequence?.steps.length === 17 &&
    manifest.rolloutSequence.steps.every((step) => step.completed) &&
    manifest.fullReleaseGatePassed === true &&
    manifest.fullReleaseGateScope ===
      INTERNAL_AI_RELEASE_EVIDENCE.fullReleaseGateScope &&
    manifest.activationState.momoActivationExecuted === false &&
    manifest.activationState.scopedInternalAiActivationAuthorizationConsumed === true &&
    manifest.releaseCandidate.sitesPublishAuthorized === false &&
    manifest.releaseCandidate.edgeDeployAuthorized === false &&
    manifest.releaseCandidate.deploymentAuthorized === false &&
    manifest.releaseCandidate.activationAuthorized === false &&
    manifest.edgeCandidate?.deployAuthorized === false &&
    manifest.activationState.newIncrementalSpendApproved === false &&
    manifest.activationState.scopedInternalAiActivationAuthorized === false &&
    manifest.deploymentFreeze.activationGateReady === false &&
    manifest.deploymentFreeze.rolloutAuthorizationConsumed === true &&
    manifest.deploymentFreeze.deploymentAuthorized === false &&
    manifest.deploymentFreeze.activationAuthorized === false &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Post-activation grants, external locks, or zero-cost evidence is incomplete.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: live52 media handoff is one-step for Momo, Team-processed on exception, and externally locked.",
  );
}
