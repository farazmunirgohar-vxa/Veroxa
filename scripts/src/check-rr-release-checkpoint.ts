import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  LIVE46_MIGRATION_EVIDENCE,
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

type JsonRecord = Record<string, any>;
const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const canonical = (value: unknown): string => JSON.stringify(value);
const rrPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const raw = readFileSync(rrPath, "utf8");
must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(raw), "RR checkpoint contains merge markers.");
const rr = JSON.parse(raw) as JsonRecord;
const manifest = readDeploymentManifest();

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

must(rr.schemaVersion === 14, "RR schema must be 14.");
must(
  rr.recordKind === "veroxa_live46_held_private_media_repair_checkpoint",
  "RR record kind is not the schema-14 held-repair checkpoint.",
);
must(rr.status === manifest.releaseState, "RR and manifest release states differ.");
must(rr.reviewedAt === manifest.reviewedAt, "RR reviewed date diverges from manifest.");
must(
  rr.candidateRevision === manifest.candidateRevision,
  "RR candidate revision diverges from manifest.",
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
  "RR candidate does not exactly mirror the reviewed manifest candidate.",
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
    LIVE46_MIGRATION_EVIDENCE.fileCount &&
    rr.databaseEvidence.liveBaseline.exactRemoteLedgerTreeSha256 ===
      LIVE46_MIGRATION_EVIDENCE.treeSha256 &&
    rr.databaseEvidence.liveBaseline.latestMigration ===
      LIVE46_MIGRATION_EVIDENCE.filename &&
    rr.databaseEvidence.liveBaseline.latestMigrationByteLength ===
      LIVE46_MIGRATION_EVIDENCE.byteLength &&
    rr.databaseEvidence.liveBaseline.latestMigrationSha256 ===
      LIVE46_MIGRATION_EVIDENCE.sha256,
  "RR exact live46 database baseline drifted.",
);
must(
  rr.databaseEvidence.integratedBaseline.migrationFileCount ===
    REPAIR_MIGRATION_EVIDENCE.candidateFileCount &&
    rr.databaseEvidence.integratedBaseline.migrationTreeSha256 ===
      REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256 &&
    rr.databaseEvidence.integratedBaseline.evidenceScope ===
      LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE &&
    canonical(rr.databaseEvidence.integratedBaseline.pendingMigrations) ===
      canonical(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    canonical(rr.databaseEvidence.integratedBaseline.appliedMigrations) ===
      canonical(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) &&
    rr.databaseEvidence.integratedBaseline.candidateMigrationsMatchLiveLedger === false,
  "RR candidate47/live46 split drifted.",
);
must(
  canonical(rr.databaseEvidence.forwardRepair) ===
    canonical(manifest.databaseContractReview),
  "RR forward-repair block does not mirror the manifest database review.",
);
must(
  rr.applicationQualityEvidence.hostedCleanChainApplyPassed === true &&
    rr.applicationQualityEvidence.hostedFullPgTapPassed === false &&
    rr.applicationQualityEvidence.hostedFullPgTapRerunPending === true &&
    rr.applicationQualityEvidence.hostedDatabaseExecutionPassed === false &&
    rr.databaseContractReview.hostedCleanChainApplyPassed === true &&
    rr.databaseContractReview.hostedFullPgTapPassed === false &&
    rr.databaseContractReview.hostedFullPgTapRerunPending === true &&
    rr.databaseContractReview.functionalVerificationPassed === false,
  "RR must preserve the hosted clean-chain/full-pgTAP evidence boundary.",
);
must(
  rr.runtimeVerification.registeredMutableRpcIngressHoldVerified === true &&
    rr.runtimeVerification.fullMutableIngressHoldVerified === undefined &&
    rr.runtimeVerification.candidateEdgeV2Deployed === false &&
    rr.runtimeVerification.activationGateReady === false &&
    rr.runtimeVerification.activationExecuted === false,
  "RR runtime verification overclaims raw ingress, Edge deployment, or activation.",
);
must(
  rr.activationGates.some((entry: string) =>
    entry.includes("unregistered orphan object"),
  ),
  "RR activation gates omit the limited Client orphan-storage residual.",
);

const liveMigration = resolve(
  repoRoot,
  "supabase/migrations",
  LIVE46_MIGRATION_EVIDENCE.filename,
);
must(
  statSync(liveMigration).size === LIVE46_MIGRATION_EVIDENCE.byteLength &&
    sha256File(liveMigration) === LIVE46_MIGRATION_EVIDENCE.sha256,
  "Local immutable live46 migration bytes drifted.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: schema-14 RR checkpoint canonically mirrors schema-10 live46 held-repair evidence.",
  );
}
