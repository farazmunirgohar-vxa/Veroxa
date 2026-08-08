import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
  REFRESHED_LOCAL_CANDIDATE_STATUS,
  RECONCILIATION_CANDIDATE_ACTION_SCOPE,
  assertUnreleasedLocalCandidateManifest,
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
  writeJson,
  type DeploymentManifest,
} from "./release-manifest";

type RrCheckpoint = {
  status: string;
  releaseCandidate: DeploymentManifest["releaseCandidate"] & {
    manifest: string;
    state: string;
    localReviewPassed: boolean;
  };
  databaseEvidence: {
    candidate: {
      migrationFileCount: number;
      migrationTreeSha256: string;
      pendingMigrations: string[];
      appliedMigrations: string[];
    };
  };
};

const manifest = readDeploymentManifest();
assertUnreleasedLocalCandidateManifest(manifest);
if (process.env.VEROXA_REVIEWED_FINGERPRINT_REFRESH === "true") {
  throw new Error(
    "Fingerprint refresh cannot promote release evidence; run refresh first, then record local review through the separate review gate",
  );
}

const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const mirror = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot!), {
  suffix: ".sql",
});
if (
  migrations.fileCount !== mirror.fileCount ||
  migrations.sha256 !== mirror.sha256 ||
  JSON.stringify(migrations.files) !== JSON.stringify(mirror.files)
) {
  throw new Error("Root and Sites migration mirrors differ");
}
const latestCandidateMigration = migrations.files.at(-1);
if (!latestCandidateMigration) {
  throw new Error("Cannot refresh release evidence without a candidate migration");
}
if (
  latestCandidateMigration !== LOCAL_CANDIDATE_PENDING_MIGRATIONS[0] ||
  migrations.fileCount !==
    manifest.currentProductionObservation.productionMigrationCount +
      LOCAL_CANDIDATE_PENDING_MIGRATIONS.length ||
  LOCAL_CANDIDATE_PENDING_MIGRATIONS.some(
    (migration) => !migrations.files.includes(migration),
  )
) {
  throw new Error(
    "Pre-apply candidate must extend the exact live ledger by only the reviewed provisional migration",
  );
}
const latestCandidateMigrationSha256 = sha256File(
  resolve(repoRoot, manifest.migrations.root, latestCandidateMigration),
);
const fingerprintsChanged =
  manifest.source.fileCount !== source.fileCount ||
  manifest.source.treeSha256 !== source.sha256 ||
  manifest.migrations.fileCount !== migrations.fileCount ||
  manifest.migrations.treeSha256 !== migrations.sha256 ||
  manifest.releaseCandidate.latestCandidateMigrationSha256 !==
    latestCandidateMigrationSha256;

manifest.source.fileCount = source.fileCount;
manifest.source.treeSha256 = source.sha256;
manifest.migrations.fileCount = migrations.fileCount;
manifest.migrations.treeSha256 = migrations.sha256;
manifest.migrations.mirrorFileCount = mirror.fileCount;
manifest.migrations.mirrorTreeSha256 = mirror.sha256;
Object.assign(manifest.releaseCandidate, {
  status: REFRESHED_LOCAL_CANDIDATE_STATUS,
  actionScope: RECONCILIATION_CANDIDATE_ACTION_SCOPE,
  reviewedLocally: false,
  allFourWorkflowsGreen: null,
  zeroUnresolvedReviewThreads: null,
  candidateSourceMatchesLiveSites: false,
  candidateMigrationsMatchLiveLedger: false,
  githubMainMatchesCandidate: false,
  fullReleaseGatePassed: false,
  sourceFileCount: source.fileCount,
  sourceTreeSha256: source.sha256,
  migrationFileCount: migrations.fileCount,
  migrationTreeSha256: migrations.sha256,
  latestCandidateMigration,
  latestCandidateMigrationSha256,
  pendingMigrations: [...LOCAL_CANDIDATE_PENDING_MIGRATIONS],
  databaseMigrationsApplied: [...LOCAL_CANDIDATE_APPLIED_MIGRATIONS],
  databaseChangesRequired: true,
  databaseMigrationApplied: false,
  sitesPublishRequired: true,
  sitesPublished: false,
});
manifest.releaseState = REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE;
assertUnreleasedLocalCandidateManifest(manifest);

const rrPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const rr = JSON.parse(readFileSync(rrPath, "utf8")) as RrCheckpoint;
rr.status = manifest.releaseState;
rr.releaseCandidate = {
  ...manifest.releaseCandidate,
  manifest: "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
  state: manifest.releaseCandidate.status,
  localReviewPassed: false,
};
rr.databaseEvidence.candidate = {
  migrationFileCount: migrations.fileCount,
  migrationTreeSha256: migrations.sha256,
  pendingMigrations: [...LOCAL_CANDIDATE_PENDING_MIGRATIONS],
  appliedMigrations: [...LOCAL_CANDIDATE_APPLIED_MIGRATIONS],
};

writeJson(deploymentManifestPath, manifest);
writeJson(rrPath, rr);
console.log(
  `Refreshed pre-apply release fingerprints: ${source.fileCount} Sites files, ${migrations.fileCount} mirrored migrations. Review, merge, database apply, generated-version reconciliation, Sites publish, and activation remain unclaimed.${fingerprintsChanged ? " Fingerprints changed." : " Fingerprints were unchanged."}`,
);
