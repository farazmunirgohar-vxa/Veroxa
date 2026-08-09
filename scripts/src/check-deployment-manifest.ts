import { readFileSync } from "node:fs";
import {
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

const repairCloseout = manifest.generatedVersionCloseouts?.repair as
  | Record<string, unknown>
  | undefined;
const activationCloseout = manifest.generatedVersionCloseouts?.activation as
  | Record<string, unknown>
  | undefined;
const firstHeld = manifest.deploymentParity?.firstHeld as
  | Record<string, unknown>
  | undefined;
must(
  manifest.schemaVersion === 10 &&
    manifest.recordKind === "veroxa_guarded_internal_ai_rollout_manifest",
  "Manifest is not the guarded internal-AI rollout authority.",
);
must(
  manifest.currentProductionObservation.productionMigrationCount === 48 &&
    manifest.currentProductionObservation.latestProductionMigration ===
      REPAIR_MIGRATION_EVIDENCE.filename &&
    manifest.currentProductionObservation.candidateMigrationsMatchLiveLedger === false,
  "Observed production is not the exact held live48 prefix.",
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
    manifest.releaseCandidate.githubMerged === false &&
    manifest.releaseCandidate.databaseMigrationApplied === false &&
    manifest.releaseCandidate.pendingMigrations?.length === 1 &&
    manifest.releaseCandidate.pendingMigrations[0] ===
      "20260809044000_guarded_internal_ai_activation_v1.sql" &&
    manifest.releaseCandidate.allFourWorkflowsGreen === null &&
    manifest.databaseContractReview?.localStaticReviewPassed === true &&
    manifest.databaseContractReview.hostedCleanChainApplyPassed === false &&
    manifest.databaseContractReview.hostedFullPgTapPassed === false,
  "Dormant activation candidate review state is overclaimed or incomplete.",
);
must(
  manifest.activationRoutine?.migrationFilename ===
      "20260809044000_guarded_internal_ai_activation_v1.sql" &&
    manifest.activationRoutine.migrationSha256 ===
      "22d5e82f683c3dd9d4b3d9c5b4e5003cf3a769f67dde340e98deee3ba3afb8ba" &&
    manifest.activationRoutine.installed === false &&
    manifest.activationRoutine.invoked === false &&
    manifest.activationRoutine.postgresOnly === true &&
    manifest.activationRoutine.executeGrantedToPublic === false &&
    manifest.activationRoutine.executeGrantedToAnon === false &&
    manifest.activationRoutine.executeGrantedToAuthenticated === false &&
    manifest.activationRoutine.executeGrantedToServiceRole === false &&
    activationCloseout?.completed === false &&
    activationCloseout.unchangedBytesVerified === false,
  "Dormant activation routine source evidence is incomplete.",
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
  manifest.operationalHold?.aiLiveCalls === false &&
    manifest.operationalHold.providerWrites === false &&
    manifest.operationalHold.reviewReplies === false &&
    manifest.operationalHold.websiteWrites === false &&
    manifest.operationalHold.externalScheduling === false &&
    manifest.operationalHold.postCorrectionLeakedRpcCount === 0 &&
    manifest.releaseCandidate.sitesPublished === false &&
    manifest.releaseCandidate.edgeDeployed === true &&
    manifest.releaseCandidate.activationExecuted === false &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Hold, publication, or activation state was overclaimed.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: first live48 GitHub/Sites/Edge parity is verified and the dormant activation migration remains under hold.",
  );
}
