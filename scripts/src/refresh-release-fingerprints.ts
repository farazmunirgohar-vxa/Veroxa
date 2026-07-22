import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
  REFRESHED_LOCAL_CANDIDATE_STATUS,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
  assertUnreleasedLocalCandidateManifest,
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
  writeJson,
} from "./release-manifest";

type RrCheckpoint = {
  status: string;
  releaseCandidate: {
    state: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    localReviewPassed: boolean;
    allFourWorkflowsGreen: boolean | null;
    zeroUnresolvedReviewThreads: boolean | null;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesCandidatePublished: boolean;
  };
  databaseMigrations: string[];
  boundaryGroups: Record<
    string,
    { review: string; files: string[]; sha256: string }
  >;
};

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(repoRoot, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const manifest = readDeploymentManifest();
assertUnreleasedLocalCandidateManifest(manifest);
const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const latestCandidateMigration = migrations.files.at(-1);
if (!latestCandidateMigration) {
  throw new Error("Cannot refresh release evidence without a candidate migration");
}
const latestCandidateMigrationSha256 = sha256File(
  resolve(repoRoot, manifest.migrations.root, latestCandidateMigration),
);
const fingerprintsChanged =
  manifest.source.fileCount !== source.fileCount ||
  manifest.source.treeSha256 !== source.sha256 ||
  manifest.migrations.fileCount !== migrations.fileCount ||
  manifest.migrations.treeSha256 !== migrations.sha256 ||
  manifest.releaseCandidate.sourceFileCount !== source.fileCount ||
  manifest.releaseCandidate.sourceTreeSha256 !== source.sha256 ||
  manifest.releaseCandidate.migrationFileCount !== migrations.fileCount ||
  manifest.releaseCandidate.migrationTreeSha256 !== migrations.sha256 ||
  manifest.releaseCandidate.latestCandidateMigration !== latestCandidateMigration ||
  manifest.releaseCandidate.latestCandidateMigrationSha256 !== latestCandidateMigrationSha256;

manifest.source.fileCount = source.fileCount;
manifest.source.treeSha256 = source.sha256;
manifest.migrations.fileCount = migrations.fileCount;
manifest.migrations.treeSha256 = migrations.sha256;
manifest.releaseCandidate.sourceFileCount = source.fileCount;
manifest.releaseCandidate.sourceTreeSha256 = source.sha256;
manifest.releaseCandidate.migrationFileCount = migrations.fileCount;
manifest.releaseCandidate.migrationTreeSha256 = migrations.sha256;
manifest.releaseCandidate.latestCandidateMigration = latestCandidateMigration;
manifest.releaseCandidate.latestCandidateMigrationSha256 = latestCandidateMigrationSha256;

if (fingerprintsChanged) {
  const reviewedRefreshConfirmed =
    process.env.VEROXA_REVIEWED_FINGERPRINT_REFRESH === "true";
  manifest.releaseState = reviewedRefreshConfirmed
    ? REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE
    : REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE;
  manifest.releaseCandidate.status = reviewedRefreshConfirmed
    ? REVIEWED_LOCAL_CANDIDATE_STATUS
    : REFRESHED_LOCAL_CANDIDATE_STATUS;
  manifest.releaseCandidate.reviewedLocally = reviewedRefreshConfirmed;
}

const rrPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const rr = JSON.parse(readFileSync(rrPath, "utf8")) as RrCheckpoint;
rr.status = manifest.releaseState;
rr.releaseCandidate.state = manifest.releaseCandidate.status;
rr.releaseCandidate.basedOnGitHubMainCommit =
  manifest.releaseCandidate.basedOnGitHubMainCommit;
rr.releaseCandidate.pullRequest = manifest.releaseCandidate.pullRequest;
rr.releaseCandidate.githubMerged = manifest.releaseCandidate.githubMerged;
rr.releaseCandidate.futureMergedGitHubCommit =
  manifest.releaseCandidate.futureMergedGitHubCommit;
rr.releaseCandidate.futureSitesVersion =
  manifest.releaseCandidate.futureSitesVersion;
rr.releaseCandidate.reviewedLocally = manifest.releaseCandidate.reviewedLocally;
rr.releaseCandidate.localReviewPassed =
  manifest.releaseCandidate.reviewedLocally;
rr.releaseCandidate.allFourWorkflowsGreen = null;
rr.releaseCandidate.zeroUnresolvedReviewThreads = null;
rr.releaseCandidate.sourceFileCount = manifest.releaseCandidate.sourceFileCount;
rr.releaseCandidate.sourceTreeSha256 = manifest.releaseCandidate.sourceTreeSha256;
rr.releaseCandidate.migrationFileCount =
  manifest.releaseCandidate.migrationFileCount;
rr.releaseCandidate.migrationTreeSha256 =
  manifest.releaseCandidate.migrationTreeSha256;
rr.releaseCandidate.latestCandidateMigration =
  manifest.releaseCandidate.latestCandidateMigration;
rr.releaseCandidate.latestCandidateMigrationSha256 =
  manifest.releaseCandidate.latestCandidateMigrationSha256;
rr.releaseCandidate.databaseChangesRequired =
  manifest.releaseCandidate.databaseChangesRequired;
rr.releaseCandidate.databaseMigrationApplied =
  manifest.releaseCandidate.databaseMigrationApplied;
rr.releaseCandidate.sitesPublishRequired =
  manifest.releaseCandidate.sitesPublishRequired;
rr.releaseCandidate.sitesCandidatePublished =
  manifest.releaseCandidate.sitesPublished;
rr.databaseMigrations = migrations.files;
// Boundary hashes must observe the refreshed manifest, because the delivery
// boundary includes that file. Writing it afterward would immediately make
// the freshly generated RR checkpoint stale.
writeJson(deploymentManifestPath, manifest);
for (const group of Object.values(rr.boundaryGroups)) {
  group.sha256 = groupHash(group.files);
}
writeJson(rrPath, rr);

console.log(
  `Refreshed release fingerprints: ${source.fileCount} Sites files, ${migrations.fileCount} migrations, and ${Object.keys(rr.boundaryGroups).length} RR boundary groups.${fingerprintsChanged && !manifest.releaseCandidate.reviewedLocally ? " Candidate review was invalidated and must pass again before attestation." : ""}`,
);
