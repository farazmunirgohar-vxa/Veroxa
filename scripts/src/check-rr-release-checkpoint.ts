import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertReviewedLocalCandidateManifest,
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

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
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
  "applicationQualityEvidence",
  "databaseContractReview",
  "edgeDeployment",
  "edgeCandidate",
  "operationalHold",
  "activationRoutine",
  "generatedVersionCloseouts",
  "deploymentParity",
  "rolloutSequence",
]) {
  must(
    canonical(rr[field]) === canonical((manifest as JsonRecord)[field]),
    `RR field does not canonically mirror manifest: ${field}`,
  );
}
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
    rr.runtimeVerification.externalProvidersConnected === false &&
    rr.runtimeVerification.externalPublishingEnabled === false &&
    rr.operationalHold.providerWrites === false &&
    rr.operationalHold.reviewReplies === false &&
    rr.operationalHold.websiteWrites === false &&
    rr.operationalHold.externalScheduling === false,
  "RR overclaims provider or external-action execution.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("PASS: RR canonically mirrors the guarded rollout manifest.");
}
