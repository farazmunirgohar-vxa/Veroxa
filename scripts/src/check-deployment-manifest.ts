import { readFileSync } from "node:fs";
import {
  APPLICATION_QUALITY_EVIDENCE,
  LIVE46_MIGRATION_EVIDENCE,
  LOCAL_CANDIDATE_BASE_COMMIT,
  LOCAL_CANDIDATE_SOURCE_EVIDENCE,
  PRIVATE_MEDIA_EDGE_CANDIDATE,
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

must(manifest.schemaVersion === 10, "Manifest schema must be 10.");
must(
  manifest.recordKind === "veroxa_live46_held_private_media_repair_manifest",
  "Manifest record kind is not the schema-10 held-repair authority.",
);
must(
  manifest.currentProductionObservation.canonicalGitHubMainCommit ===
    LOCAL_CANDIDATE_BASE_COMMIT &&
    manifest.currentProductionObservation.productionMigrationCount ===
      LIVE46_MIGRATION_EVIDENCE.fileCount &&
    manifest.currentProductionObservation.migrationTreeSha256 ===
      LIVE46_MIGRATION_EVIDENCE.treeSha256,
  "Canonical main or exact live46 evidence drifted.",
);
must(
  manifest.releaseCandidate.sourceFileCount ===
    LOCAL_CANDIDATE_SOURCE_EVIDENCE.fileCount &&
    manifest.releaseCandidate.sourceTreeSha256 ===
      LOCAL_CANDIDATE_SOURCE_EVIDENCE.treeSha256 &&
    manifest.releaseCandidate.latestCandidateMigration ===
      REPAIR_MIGRATION_EVIDENCE.filename &&
    manifest.releaseCandidate.latestCandidateMigrationSha256 ===
      REPAIR_MIGRATION_EVIDENCE.sha256 &&
    JSON.stringify(manifest.applicationQualityEvidence) ===
      JSON.stringify(APPLICATION_QUALITY_EVIDENCE),
  "Reviewed local candidate fingerprints or quality evidence drifted.",
);
must(
  manifest.edgeDeployment?.currentRepositorySourceParity === false &&
    manifest.edgeCandidate?.contractSha256 ===
      PRIVATE_MEDIA_EDGE_CANDIDATE.contractSha256 &&
    manifest.edgeCandidate.deployed === false,
  "Live Edge v6 and pending prompt-v2 Edge candidate were conflated.",
);
must(
  manifest.operationalHold?.activeClientStorageUploadPolicyRemains === true &&
    manifest.operationalHold.rawOrphanStorageObjectWritePossible === true &&
    manifest.operationalHold.rawStorageCannotRegisterOrTriggerProviderWhileRpcsHeld === true,
  "Registered mutable-RPC hold must disclose the limited orphan-storage residual.",
);
must(
  manifest.releaseCandidate.pullRequest === null &&
    manifest.releaseCandidate.githubMerged === false &&
    manifest.releaseCandidate.databaseMigrationApplied === false &&
    manifest.releaseCandidate.sitesPublished === false &&
    manifest.releaseCandidate.edgeDeployed === false &&
    manifest.releaseCandidate.activationGateReady === false &&
    manifest.releaseCandidate.activationExecuted === false &&
    manifest.releaseCandidate.fullReleaseGatePassed === false &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Remote, apply, publication, activation, or full-release evidence was overclaimed.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: schema-10 live46 held-repair manifest is exact, reviewed locally, and fail-closed for remote/runtime gates.",
  );
}
