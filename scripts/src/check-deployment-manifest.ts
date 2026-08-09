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
must(
  manifest.schemaVersion === 10 &&
    manifest.recordKind === "veroxa_guarded_internal_ai_rollout_manifest",
  "Manifest is not the guarded internal-AI rollout authority.",
);
must(
  manifest.currentProductionObservation.productionMigrationCount === 48 &&
    manifest.currentProductionObservation.latestProductionMigration ===
      REPAIR_MIGRATION_EVIDENCE.filename &&
    manifest.currentProductionObservation.candidateMigrationsMatchLiveLedger === true,
  "Observed production is not the exact reconciled live48 ledger.",
);
must(
  repairCloseout?.actualLedgerVersion === "20260809035302" &&
    repairCloseout.actualLedgerFilename === REPAIR_MIGRATION_EVIDENCE.filename &&
    repairCloseout.sourceByteLength === REPAIR_MIGRATION_EVIDENCE.byteLength &&
    repairCloseout.submittedQueryTransportByteLength === 59_053 &&
    repairCloseout.transportTrailingNewlineDeltaBytes === 1 &&
    repairCloseout.databaseLedgerStoresSqlBytes === false &&
    repairCloseout.unchangedBytesVerified === true &&
    repairCloseout.completed === false,
  "Candidate48 generated-version reconciliation candidate is not staged exactly.",
);
must(
    manifest.releaseCandidate.githubMerged === false &&
    manifest.releaseCandidate.databaseMigrationApplied === true &&
    (manifest.releaseCandidate.pendingMigrations ?? []).length === 0 &&
    manifest.releaseCandidate.allFourWorkflowsGreen === null &&
    manifest.databaseContractReview?.hostedCleanChainApplyPassed === true &&
    manifest.databaseContractReview.hostedFullPgTapPassed === true,
  "Merged/apply/hosted verification evidence is incomplete.",
);
must(
  manifest.operationalHold?.aiLiveCalls === false &&
    manifest.operationalHold.providerWrites === false &&
    manifest.operationalHold.reviewReplies === false &&
    manifest.operationalHold.websiteWrites === false &&
    manifest.operationalHold.externalScheduling === false &&
    manifest.operationalHold.postCorrectionLeakedRpcCount === 0 &&
    manifest.releaseCandidate.sitesPublished === false &&
    manifest.releaseCandidate.edgeDeployed === false &&
    manifest.releaseCandidate.activationExecuted === false &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Hold, publication, or activation state was overclaimed.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: live48 is source-reconciled and hosted-verified under the unchanged runtime hold.",
  );
}
