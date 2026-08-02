import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import {
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
} from "./release-manifest";

type RrCheckpoint = {
  status: string;
  releaseCandidate: {
    state: string;
    actionScope: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    localReviewPassed: boolean;
    allFourWorkflowsGreen: boolean | null;
    zeroUnresolvedReviewThreads: boolean | null;
    candidateSourceMatchesLiveSites: boolean;
    candidateMigrationsMatchLiveLedger: boolean;
    githubMainMatchesCandidate: boolean;
    fullReleaseGatePassed: boolean;
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

function serializedJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function groupHash(
  files: string[],
  contentOverrides: ReadonlyMap<string, string> = new Map(),
): string {
  if (new Set(files).size !== files.length) {
    throw new Error("RR boundary group cannot contain duplicate paths");
  }
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    const absolute = resolve(repoRoot, file);
    if (absolute !== repoRoot && !absolute.startsWith(`${repoRoot}${sep}`)) {
      throw new Error(`RR boundary path escapes the repository: ${file}`);
    }
    hash.update(`${file}\0`);
    hash.update(contentOverrides.get(file) ?? readFileSync(absolute));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const manifest = readDeploymentManifest();
assertUnreleasedLocalCandidateManifest(manifest);
if (process.env.VEROXA_REVIEWED_FINGERPRINT_REFRESH === "true") {
  throw new Error(
    "VEROXA_REVIEWED_FINGERPRINT_REFRESH can no longer promote release evidence; run fingerprint refresh first, then record local review through the separate review gate",
  );
}

const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const latestCandidateMigration = migrations.files.at(-1);
if (!latestCandidateMigration) {
  throw new Error(
    "Cannot refresh release evidence without a candidate migration",
  );
}
const latestCandidateMigrationSha256 = sha256File(
  resolve(repoRoot, manifest.migrations.root, latestCandidateMigration),
);

const live = manifest.currentProductionObservation;
if (
  source.fileCount !== live.sourceFileCount ||
  source.sha256 !== live.sourceTreeSha256
) {
  throw new Error(
    "Candidate source no longer matches the separately observed live Sites v36 tree; refresh the production observation through a new reconciliation before writing fingerprints",
  );
}
if (
  migrations.fileCount !== live.productionMigrationCount ||
  migrations.sha256 !== live.migrationTreeSha256 ||
  latestCandidateMigration !== live.latestProductionMigration ||
  latestCandidateMigrationSha256 !== live.latestProductionMigrationSha256
) {
  throw new Error(
    "Candidate migrations no longer match the separately observed 37-migration live ledger; refresh the production observation through a new reconciliation before writing fingerprints",
  );
}

const fingerprintsChanged =
  manifest.source.fileCount !== source.fileCount ||
  manifest.source.treeSha256 !== source.sha256 ||
  manifest.migrations.fileCount !== migrations.fileCount ||
  manifest.migrations.treeSha256 !== migrations.sha256 ||
  manifest.releaseCandidate.sourceFileCount !== source.fileCount ||
  manifest.releaseCandidate.sourceTreeSha256 !== source.sha256 ||
  manifest.releaseCandidate.migrationFileCount !== migrations.fileCount ||
  manifest.releaseCandidate.migrationTreeSha256 !== migrations.sha256 ||
  manifest.releaseCandidate.latestCandidateMigration !==
    latestCandidateMigration ||
  manifest.releaseCandidate.latestCandidateMigrationSha256 !==
    latestCandidateMigrationSha256;

manifest.source.fileCount = source.fileCount;
manifest.source.treeSha256 = source.sha256;
manifest.migrations.fileCount = migrations.fileCount;
manifest.migrations.treeSha256 = migrations.sha256;
manifest.releaseCandidate.sourceFileCount = source.fileCount;
manifest.releaseCandidate.sourceTreeSha256 = source.sha256;
manifest.releaseCandidate.migrationFileCount = migrations.fileCount;
manifest.releaseCandidate.migrationTreeSha256 = migrations.sha256;
manifest.releaseCandidate.latestCandidateMigration = latestCandidateMigration;
manifest.releaseCandidate.latestCandidateMigrationSha256 =
  latestCandidateMigrationSha256;

// Fingerprint generation is not a review. Every invocation returns the
// candidate to the explicit review-required state, even when the bytes were
// unchanged. A separate, deliberate gate may record reviewedLocally later.
manifest.releaseState = REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE;
manifest.releaseCandidate.status = REFRESHED_LOCAL_CANDIDATE_STATUS;
manifest.releaseCandidate.actionScope = RECONCILIATION_CANDIDATE_ACTION_SCOPE;
manifest.releaseCandidate.reviewedLocally = false;
manifest.releaseCandidate.candidateSourceMatchesLiveSites = true;
manifest.releaseCandidate.candidateMigrationsMatchLiveLedger = true;
manifest.releaseCandidate.githubMainMatchesCandidate = false;
manifest.releaseCandidate.fullReleaseGatePassed = false;
manifest.releaseCandidate.databaseMigrationApplied = false;
manifest.releaseCandidate.sitesPublished = false;
assertUnreleasedLocalCandidateManifest(manifest);

const rrPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const rr = JSON.parse(readFileSync(rrPath, "utf8")) as RrCheckpoint;
rr.status = manifest.releaseState;
rr.releaseCandidate.state = manifest.releaseCandidate.status;
rr.releaseCandidate.actionScope = manifest.releaseCandidate.actionScope;
rr.releaseCandidate.basedOnGitHubMainCommit =
  manifest.releaseCandidate.basedOnGitHubMainCommit;
rr.releaseCandidate.pullRequest = manifest.releaseCandidate.pullRequest;
rr.releaseCandidate.githubMerged = manifest.releaseCandidate.githubMerged;
rr.releaseCandidate.futureMergedGitHubCommit =
  manifest.releaseCandidate.futureMergedGitHubCommit;
rr.releaseCandidate.futureSitesVersion =
  manifest.releaseCandidate.futureSitesVersion;
rr.releaseCandidate.reviewedLocally = false;
rr.releaseCandidate.localReviewPassed = false;
rr.releaseCandidate.allFourWorkflowsGreen = null;
rr.releaseCandidate.zeroUnresolvedReviewThreads = null;
rr.releaseCandidate.candidateSourceMatchesLiveSites = true;
rr.releaseCandidate.candidateMigrationsMatchLiveLedger = true;
rr.releaseCandidate.githubMainMatchesCandidate = false;
rr.releaseCandidate.fullReleaseGatePassed = false;
rr.releaseCandidate.sourceFileCount = manifest.releaseCandidate.sourceFileCount;
rr.releaseCandidate.sourceTreeSha256 =
  manifest.releaseCandidate.sourceTreeSha256;
rr.releaseCandidate.migrationFileCount =
  manifest.releaseCandidate.migrationFileCount;
rr.releaseCandidate.migrationTreeSha256 =
  manifest.releaseCandidate.migrationTreeSha256;
rr.releaseCandidate.latestCandidateMigration =
  manifest.releaseCandidate.latestCandidateMigration;
rr.releaseCandidate.latestCandidateMigrationSha256 =
  manifest.releaseCandidate.latestCandidateMigrationSha256;
rr.releaseCandidate.databaseChangesRequired = false;
rr.releaseCandidate.databaseMigrationApplied = false;
rr.releaseCandidate.sitesPublishRequired = false;
rr.releaseCandidate.sitesCandidatePublished = false;
rr.databaseMigrations = migrations.files;

// Precompute every boundary hash against the exact manifest bytes that will be
// written. This validates every referenced path before either evidence file is
// mutated and avoids a partially refreshed manifest/checkpoint pair.
const stagedManifest = serializedJson(manifest);
const overrides = new Map<string, string>([
  ["artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json", stagedManifest],
]);
const stagedBoundaryHashes = new Map<string, string>();
for (const [name, group] of Object.entries(rr.boundaryGroups)) {
  const sha256 = groupHash(group.files, overrides);
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error(`Invalid precomputed RR boundary hash for ${name}`);
  }
  stagedBoundaryHashes.set(name, sha256);
}
for (const [name, sha256] of stagedBoundaryHashes) {
  rr.boundaryGroups[name].sha256 = sha256;
}

writeJson(deploymentManifestPath, manifest);
writeJson(rrPath, rr);

console.log(
  `Refreshed release fingerprints: ${source.fileCount} Sites files, ${migrations.fileCount} migrations, and ${Object.keys(rr.boundaryGroups).length} RR boundary groups. Candidate review and the full release gate remain explicitly false.${fingerprintsChanged ? " Fingerprints changed." : " Fingerprints were unchanged."}`,
);
