import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, resolve, sep } from "node:path";
import {
  REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
  REFRESHED_LOCAL_CANDIDATE_STATUS,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
  assertReviewedLocalCandidateManifest,
  assertUnreleasedLocalCandidateManifest,
  deploymentManifestPath,
  hashTree,
  repoRoot,
  sha256File,
  type DeploymentManifest,
} from "./release-manifest";

const manifestRelativePath =
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json";
const rrRelativePath = "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json";
const reviewGateRelativePath = "scripts/src/record-local-release-review.ts";
const rrPath = resolve(repoRoot, rrRelativePath);
const repositoryRealPath = realpathSync(repoRoot);

type ReleaseCandidateCheckpoint = {
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

type RrCheckpoint = {
  status: string;
  releaseCandidate: ReleaseCandidateCheckpoint;
  runtimeVerification?: {
    externalProvidersConnected?: boolean;
    externalPublishingVerified?: boolean;
    activationExecuted?: boolean;
  };
  scope?: {
    ownerContactAuthorized?: boolean;
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

function failIf(condition: boolean, message: string): void {
  if (condition) throw new Error(message);
}

function validatedBoundaryPath(relativePath: string): string {
  failIf(
    !relativePath || relativePath.includes("\0") || isAbsolute(relativePath),
    `RR boundary path must be a nonempty repository-relative path: ${relativePath}`,
  );
  const absolute = resolve(repoRoot, relativePath);
  failIf(
    absolute !== repoRoot && !absolute.startsWith(`${repoRoot}${sep}`),
    `RR boundary path escapes the repository: ${relativePath}`,
  );
  const stat = lstatSync(absolute);
  failIf(
    stat.isSymbolicLink(),
    `RR boundary path cannot be a symlink: ${relativePath}`,
  );
  failIf(
    !stat.isFile(),
    `RR boundary path is not a regular file: ${relativePath}`,
  );
  const real = realpathSync(absolute);
  failIf(
    real !== repositoryRealPath &&
      !real.startsWith(`${repositoryRealPath}${sep}`),
    `RR boundary path resolves outside the repository: ${relativePath}`,
  );
  return absolute;
}

function groupHash(
  groupName: string,
  files: string[],
  contentOverrides: ReadonlyMap<string, string> = new Map(),
): string {
  failIf(files.length === 0, `RR boundary group ${groupName} cannot be empty`);
  failIf(
    new Set(files).size !== files.length,
    `RR boundary group ${groupName} contains a duplicate path`,
  );
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    const absolute = validatedBoundaryPath(file);
    hash.update(`${file}\0`);
    hash.update(contentOverrides.get(file) ?? readFileSync(absolute));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function assertCandidateActionBoundary(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const candidate = manifest.releaseCandidate;
  const checkpoint = rr.releaseCandidate;
  const unsafe =
    candidate.pullRequest !== null ||
    candidate.githubMerged ||
    candidate.futureMergedGitHubCommit !== null ||
    candidate.futureSitesVersion !== null ||
    candidate.databaseChangesRequired ||
    candidate.databaseMigrationApplied ||
    candidate.sitesPublishRequired ||
    candidate.sitesPublished ||
    candidate.githubMainMatchesCandidate ||
    candidate.fullReleaseGatePassed ||
    checkpoint.pullRequest !== null ||
    checkpoint.githubMerged ||
    checkpoint.futureMergedGitHubCommit !== null ||
    checkpoint.futureSitesVersion !== null ||
    checkpoint.databaseChangesRequired ||
    checkpoint.databaseMigrationApplied ||
    checkpoint.sitesPublishRequired ||
    checkpoint.sitesCandidatePublished ||
    checkpoint.githubMainMatchesCandidate ||
    checkpoint.fullReleaseGatePassed ||
    checkpoint.allFourWorkflowsGreen !== null ||
    checkpoint.zeroUnresolvedReviewThreads !== null ||
    manifest.deploymentFreeze.automaticDeploymentsAllowed ||
    manifest.activationState.newIncrementalSpendApproved ||
    manifest.activationState.aiWebResearchEnabled ||
    manifest.activationState.momoOwnerContactAuthorized ||
    manifest.activationState.ownerConfirmedBusinessTruthVerified ||
    manifest.activationState.permissionedMediaVerified ||
    manifest.activationState.externalProvidersConnected ||
    manifest.activationState.externalPublishingEnabled ||
    manifest.activationState.momoActivationExecuted ||
    rr.runtimeVerification?.externalProvidersConnected === true ||
    rr.runtimeVerification?.externalPublishingVerified === true ||
    rr.runtimeVerification?.activationExecuted === true ||
    rr.scope?.ownerContactAuthorized === true;
  failIf(
    unsafe,
    "Local review cannot record PR, merge, deployment, migration apply, full release gate, or external-action evidence",
  );
}

function assertCheckpointMatchesManifest(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const candidate = manifest.releaseCandidate;
  const checkpoint = rr.releaseCandidate;
  const mismatch =
    checkpoint.actionScope !== candidate.actionScope ||
    checkpoint.basedOnGitHubMainCommit !== candidate.basedOnGitHubMainCommit ||
    checkpoint.candidateSourceMatchesLiveSites !==
      candidate.candidateSourceMatchesLiveSites ||
    checkpoint.candidateMigrationsMatchLiveLedger !==
      candidate.candidateMigrationsMatchLiveLedger ||
    checkpoint.githubMainMatchesCandidate !==
      candidate.githubMainMatchesCandidate ||
    checkpoint.fullReleaseGatePassed !== candidate.fullReleaseGatePassed ||
    checkpoint.sourceFileCount !== candidate.sourceFileCount ||
    checkpoint.sourceTreeSha256 !== candidate.sourceTreeSha256 ||
    checkpoint.migrationFileCount !== candidate.migrationFileCount ||
    checkpoint.migrationTreeSha256 !== candidate.migrationTreeSha256 ||
    checkpoint.latestCandidateMigration !==
      candidate.latestCandidateMigration ||
    checkpoint.latestCandidateMigrationSha256 !==
      candidate.latestCandidateMigrationSha256 ||
    checkpoint.databaseChangesRequired !== candidate.databaseChangesRequired ||
    checkpoint.databaseMigrationApplied !==
      candidate.databaseMigrationApplied ||
    checkpoint.sitesPublishRequired !== candidate.sitesPublishRequired ||
    checkpoint.sitesCandidatePublished !== candidate.sitesPublished;
  failIf(
    mismatch,
    "RR candidate evidence does not match the deployment manifest",
  );
}

function assertOnlyReviewFieldsChanged(
  originalManifest: DeploymentManifest,
  reviewedManifest: DeploymentManifest,
  originalRr: RrCheckpoint,
  reviewedRr: RrCheckpoint,
): void {
  const normalizedOriginalManifest = structuredClone(originalManifest);
  const normalizedReviewedManifest = structuredClone(reviewedManifest);
  for (const value of [
    normalizedOriginalManifest,
    normalizedReviewedManifest,
  ]) {
    value.releaseState = "<review-state>";
    value.releaseCandidate.status = "<review-status>";
    value.releaseCandidate.reviewedLocally = false;
  }
  failIf(
    serializedJson(normalizedOriginalManifest) !==
      serializedJson(normalizedReviewedManifest),
    "Local review attempted to change a non-review manifest field",
  );

  const normalizedOriginalRr = structuredClone(originalRr);
  const normalizedReviewedRr = structuredClone(reviewedRr);
  for (const value of [normalizedOriginalRr, normalizedReviewedRr]) {
    value.status = "<review-state>";
    value.releaseCandidate.state = "<review-status>";
    value.releaseCandidate.reviewedLocally = false;
    value.releaseCandidate.localReviewPassed = false;
    for (const group of Object.values(value.boundaryGroups)) {
      group.sha256 = "<reviewed-boundary-hash>";
    }
  }
  failIf(
    serializedJson(normalizedOriginalRr) !==
      serializedJson(normalizedReviewedRr),
    "Local review attempted to change a non-review RR field",
  );
}

function stageFile(target: string, content: string): string {
  const temporary = resolve(
    dirname(target),
    `.${basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, content, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  return temporary;
}

function removeIfPresent(path: string | null): void {
  if (!path) return;
  try {
    unlinkSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function replaceEvidencePair(
  expectedManifestContent: string,
  expectedRrContent: string,
  manifestContent: string,
  rrContent: string,
): void {
  failIf(
    readFileSync(deploymentManifestPath, "utf8") !== expectedManifestContent ||
      readFileSync(rrPath, "utf8") !== expectedRrContent,
    "Release evidence changed concurrently before reviewed files were staged",
  );
  let manifestTemporary: string | null = null;
  let rrTemporary: string | null = null;
  let manifestReplaced = false;
  try {
    manifestTemporary = stageFile(deploymentManifestPath, manifestContent);
    rrTemporary = stageFile(rrPath, rrContent);
    failIf(
      readFileSync(deploymentManifestPath, "utf8") !==
        expectedManifestContent ||
        readFileSync(rrPath, "utf8") !== expectedRrContent,
      "Release evidence changed concurrently after review validation",
    );
    renameSync(manifestTemporary, deploymentManifestPath);
    manifestTemporary = null;
    manifestReplaced = true;
    renameSync(rrTemporary, rrPath);
    rrTemporary = null;
  } catch (error) {
    if (manifestReplaced) {
      const rollback = stageFile(
        deploymentManifestPath,
        expectedManifestContent,
      );
      renameSync(rollback, deploymentManifestPath);
    }
    // rrPath is unchanged unless its atomic rename succeeded, in which case no
    // later operation in the replacement sequence can throw.
    failIf(
      readFileSync(rrPath, "utf8") !== expectedRrContent,
      "RR evidence changed during a failed local-review replacement",
    );
    throw error;
  } finally {
    removeIfPresent(manifestTemporary);
    removeIfPresent(rrTemporary);
  }
}

const originalManifestContent = readFileSync(deploymentManifestPath, "utf8");
const originalRrContent = readFileSync(rrPath, "utf8");
const manifest = JSON.parse(originalManifestContent) as DeploymentManifest;
assertUnreleasedLocalCandidateManifest(manifest);
failIf(
  manifest.releaseState !== REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE ||
    manifest.releaseCandidate.status !== REFRESHED_LOCAL_CANDIDATE_STATUS ||
    manifest.releaseCandidate.reviewedLocally,
  "Local review can only promote the exact refreshed, unmerged, review-required candidate",
);

const rr = JSON.parse(originalRrContent) as RrCheckpoint;
failIf(
  rr.status !== REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE ||
    rr.releaseCandidate.state !== REFRESHED_LOCAL_CANDIDATE_STATUS ||
    rr.releaseCandidate.reviewedLocally ||
    rr.releaseCandidate.localReviewPassed,
  "RR must contain the same refreshed, unreviewed candidate state",
);
assertCandidateActionBoundary(manifest, rr);
assertCheckpointMatchesManifest(manifest, rr);

const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const latestMigration = migrations.files.at(-1);
failIf(!latestMigration, "Local review requires at least one migration");
const latestMigrationSha256 = sha256File(
  resolve(repoRoot, manifest.migrations.root, latestMigration!),
);
const live = manifest.currentProductionObservation;
const candidate = manifest.releaseCandidate;
failIf(
  source.fileCount !== live.sourceFileCount ||
    source.sha256 !== live.sourceTreeSha256 ||
    source.fileCount !== manifest.source.fileCount ||
    source.sha256 !== manifest.source.treeSha256 ||
    source.fileCount !== candidate.sourceFileCount ||
    source.sha256 !== candidate.sourceTreeSha256,
  "Candidate Sites source does not exactly match the observed live Sites v36 tree and stored fingerprints",
);
failIf(
  migrations.fileCount !== live.productionMigrationCount ||
    migrations.sha256 !== live.migrationTreeSha256 ||
    migrations.fileCount !== manifest.migrations.fileCount ||
    migrations.sha256 !== manifest.migrations.treeSha256 ||
    migrations.fileCount !== candidate.migrationFileCount ||
    migrations.sha256 !== candidate.migrationTreeSha256 ||
    latestMigration !== live.latestProductionMigration ||
    latestMigrationSha256 !== live.latestProductionMigrationSha256 ||
    latestMigration !== candidate.latestCandidateMigration ||
    latestMigrationSha256 !== candidate.latestCandidateMigrationSha256,
  "Candidate migrations do not exactly match the observed live 37-file ledger and stored fingerprints",
);
failIf(
  rr.databaseMigrations.length !== migrations.files.length ||
    rr.databaseMigrations.some(
      (file, index) => file !== migrations.files[index],
    ),
  "RR migration inventory does not match the deterministic candidate ledger",
);
failIf(
  !rr.boundaryGroups.delivery?.files.includes(reviewGateRelativePath),
  "RR delivery boundary must include the local-review gate itself",
);

for (const [name, group] of Object.entries(rr.boundaryGroups)) {
  const currentHash = groupHash(name, group.files);
  failIf(
    currentHash !== group.sha256,
    `RR boundary group ${name} is stale; refresh fingerprints before recording review`,
  );
}

const reviewedManifest = structuredClone(manifest);
reviewedManifest.releaseState = REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE;
reviewedManifest.releaseCandidate.status = REVIEWED_LOCAL_CANDIDATE_STATUS;
reviewedManifest.releaseCandidate.reviewedLocally = true;
assertReviewedLocalCandidateManifest(reviewedManifest);

const reviewedRr = structuredClone(rr);
reviewedRr.status = REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE;
reviewedRr.releaseCandidate.state = REVIEWED_LOCAL_CANDIDATE_STATUS;
reviewedRr.releaseCandidate.reviewedLocally = true;
reviewedRr.releaseCandidate.localReviewPassed = true;
assertCandidateActionBoundary(reviewedManifest, reviewedRr);
assertCheckpointMatchesManifest(reviewedManifest, reviewedRr);

const stagedManifestContent = serializedJson(reviewedManifest);
const stagedOverrides = new Map<string, string>([
  [manifestRelativePath, stagedManifestContent],
]);
for (const [name, group] of Object.entries(reviewedRr.boundaryGroups)) {
  const reviewedHash = groupHash(name, group.files, stagedOverrides);
  failIf(
    !/^[a-f0-9]{64}$/.test(reviewedHash),
    `RR boundary group ${name} produced an invalid reviewed hash`,
  );
  group.sha256 = reviewedHash;
}
assertOnlyReviewFieldsChanged(manifest, reviewedManifest, rr, reviewedRr);

replaceEvidencePair(
  originalManifestContent,
  originalRrContent,
  stagedManifestContent,
  serializedJson(reviewedRr),
);
console.log(
  `Recorded local release review: ${source.fileCount} Sites files, ${migrations.fileCount} migrations, ${Object.keys(reviewedRr.boundaryGroups).length} RR boundary groups.`,
);
