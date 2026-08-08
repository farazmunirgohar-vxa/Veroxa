import { randomUUID } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
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

const rrRelativePath = "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json";
const rrPath = resolve(repoRoot, rrRelativePath);

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
  sitesPublished: boolean;
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
};

function serializedJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function failIf(condition: boolean, message: string): void {
  if (condition) throw new Error(message);
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
    candidate.databaseMigrationApplied ||
    candidate.sitesPublished ||
    candidate.githubMainMatchesCandidate ||
    candidate.fullReleaseGatePassed ||
    checkpoint.pullRequest !== null ||
    checkpoint.githubMerged ||
    checkpoint.futureMergedGitHubCommit !== null ||
    checkpoint.futureSitesVersion !== null ||
    checkpoint.databaseMigrationApplied ||
    checkpoint.sitesPublished ||
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
    checkpoint.sitesPublished !== candidate.sitesPublished;
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
const candidate = manifest.releaseCandidate;
failIf(
  source.fileCount !== manifest.source.fileCount ||
    source.sha256 !== manifest.source.treeSha256 ||
    source.fileCount !== candidate.sourceFileCount ||
    source.sha256 !== candidate.sourceTreeSha256,
  "Candidate Sites source does not match the stored pre-apply fingerprints",
);
failIf(
  migrations.fileCount !== manifest.migrations.fileCount ||
    migrations.sha256 !== manifest.migrations.treeSha256 ||
    migrations.fileCount !== candidate.migrationFileCount ||
    migrations.sha256 !== candidate.migrationTreeSha256 ||
    latestMigration !== candidate.latestCandidateMigration ||
    latestMigrationSha256 !== candidate.latestCandidateMigrationSha256,
  "Candidate migrations do not match the stored pre-apply fingerprints",
);
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
assertOnlyReviewFieldsChanged(manifest, reviewedManifest, rr, reviewedRr);

replaceEvidencePair(
  originalManifestContent,
  originalRrContent,
  stagedManifestContent,
  serializedJson(reviewedRr),
);
console.log(
  `Recorded local release review: ${source.fileCount} Sites files and ${migrations.fileCount} mirrored migrations.`,
);
