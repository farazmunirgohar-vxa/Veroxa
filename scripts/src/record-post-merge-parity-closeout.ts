import { execFileSync } from "node:child_process";
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
  RECONCILIATION_CANDIDATE_ACTION_SCOPE,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
  VERIFIED_DEPLOYMENT_ALLOWED_ACTION,
  VERIFIED_DEPLOYMENT_FREEZE_STATE,
  VERIFIED_GITHUB_PARITY_RELEASE_STATE,
  VERIFIED_GITHUB_PARITY_STATUS,
  VERIFIED_MIGRATION_EVIDENCE_SCOPE,
  VERIFIED_PRODUCTION_EVIDENCE_STATUS,
  VERIFIED_RELEASE_CONDITION,
  VERIFIED_SOURCE_EVIDENCE_SCOPE,
  V36_GITHUB_RECONCILIATION,
  V36_LIVE_PARITY_EVIDENCE,
  V36_OPERATIONAL_COMMIT_SCOPE,
  assertReviewedLocalCandidateManifest,
  assertVerifiedGitHubParityManifest,
  deploymentManifestPath,
  hashTree,
  repoRoot,
  sha256File,
  type DeploymentManifest,
  type GitHubReconciliationEvidence,
} from "./release-manifest";

const manifestRelativePath =
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json";
const rrRelativePath = "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json";
const closeoutRelativePath =
  "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json";
const recorderRelativePath = "scripts/src/record-post-merge-parity-closeout.ts";
const refreshRelativePath = "scripts/src/refresh-release-fingerprints.ts";
const localReviewRelativePath = "scripts/src/record-local-release-review.ts";
const scriptsPackageRelativePath = "scripts/package.json";
const rrPath = resolve(repoRoot, rrRelativePath);
const closeoutPath = resolve(repoRoot, closeoutRelativePath);
const repositoryRealPath = realpathSync(repoRoot);
const expectedBaseMain = "302621bf6b9ab78320abe4175b45b56e9e64ae2a";
const expectedSource = {
  fileCount: V36_LIVE_PARITY_EVIDENCE.sourceFileCount,
  sha256: V36_LIVE_PARITY_EVIDENCE.sourceTreeSha256,
};
const expectedMigrations = {
  fileCount: V36_LIVE_PARITY_EVIDENCE.migrationFileCount,
  sha256: V36_LIVE_PARITY_EVIDENCE.migrationTreeSha256,
  latest: V36_LIVE_PARITY_EVIDENCE.latestMigration,
  latestSha256: V36_LIVE_PARITY_EVIDENCE.latestMigrationSha256,
};
const requiredReleaseToolCommands = {
  "refresh-release-fingerprints":
    "node --import tsx ./src/refresh-release-fingerprints.ts",
  "record-local-release-review":
    "node --import tsx ./src/record-local-release-review.ts",
  "record-post-merge-parity-closeout":
    "node --import tsx ./src/record-post-merge-parity-closeout.ts",
} as const;

type RrCheckpoint = {
  schemaVersion: number;
  status: string;
  currentProductionObservation: {
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    canonicalGitHubMainCommitScope?: string;
    githubMainMatchesCandidate: boolean;
    candidateSourceMatchesLiveSites: boolean;
    candidateMigrationsMatchLiveLedger: boolean;
    fullReleaseGatePassed: boolean;
  };
  githubReconciliationEvidence?: GitHubReconciliationEvidence;
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
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesCandidatePublished: boolean;
  };
  runtimeVerification: {
    contentAiRunsObserved: number;
    contentAiQueueEmpty: boolean;
    contentAiWebhookAndRecoveryBacklogEmpty: boolean;
    veroxaReadyPackagesObserved: number;
    externalScheduleQueueEmpty: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  reusableEvidence: string[];
  activationGates: string[];
  boundaryGroups: Record<
    string,
    { review: string; files: string[]; sha256: string }
  >;
};

type Closeout = {
  schemaVersion: number;
  recordKind: string;
  status: string;
  sites: {
    versionNumber: number;
    checkoutCommit: string;
    productionLive: boolean;
    canonicalSourceFileCount: number;
    sourceTreeSha256: string;
  };
  github: {
    repository: string;
    currentMainRelease: string;
    currentMainCommit: string;
    currentMainCommitScope?: string;
    v36ParityStatus: string;
    v36ParityPullRequest: number | null;
    v36ParityReviewedHead: string | null;
    v36ParityMergedCommit: string | null;
    v36ParitySourceTreeSha256: string;
    candidateSourceMatchesLiveSites: boolean;
    githubMainMatchesCandidate: boolean;
    fullReleaseGatePassed: boolean;
    zeroUnresolvedReviewThreads?: boolean;
    preMergeWorkflows?: GitHubReconciliationEvidence["preMergeWorkflows"];
    postMergePushWorkflows?: GitHubReconciliationEvidence["postMergePushWorkflows"];
    databaseChangesRequired?: boolean;
    databaseMigrationAppliedByParityRelease?: boolean;
    sitesPublishRequired?: boolean;
    sitesPublishedByParityRelease?: boolean;
  };
  database: {
    productionMigrationCount: number;
    migrationTreeSha256: string;
    candidateMigrationsMatchLiveLedger: boolean;
  };
  productionSafetyState: {
    publishQueue: string;
    externalScheduleQueue: string;
    externalProviderConnections: string;
    webhookAndRecoveryBacklog: string;
    externalPublishingEnabled: boolean;
    externalSchedulingEnabled: boolean;
    providerWritesEnabled: boolean;
    reviewRepliesEnabled: boolean;
    websiteWritesEnabled: boolean;
    allExternalWriteControlsLocked: boolean;
    momoActivationExecuted: boolean;
  };
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
    stat.isSymbolicLink() || !stat.isFile(),
    `RR boundary path must be a regular non-symlink file: ${relativePath}`,
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
  contentOverrides: ReadonlyMap<string, string>,
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

function replaceEvidenceFiles(
  originals: ReadonlyMap<string, string>,
  replacements: ReadonlyMap<string, string>,
): void {
  for (const [path, content] of originals) {
    failIf(
      readFileSync(path, "utf8") !== content,
      `Release evidence changed concurrently before staging: ${path}`,
    );
  }
  const temporaries = new Map<string, string>();
  const replaced: string[] = [];
  try {
    for (const [path, content] of replacements) {
      temporaries.set(path, stageFile(path, content));
    }
    for (const [path, content] of originals) {
      failIf(
        readFileSync(path, "utf8") !== content,
        `Release evidence changed concurrently after validation: ${path}`,
      );
    }
    for (const path of [deploymentManifestPath, closeoutPath, rrPath]) {
      const temporary = temporaries.get(path);
      failIf(!temporary, `Missing staged closeout file: ${path}`);
      renameSync(temporary!, path);
      temporaries.delete(path);
      replaced.push(path);
    }
  } catch (error) {
    for (const path of [...replaced].reverse()) {
      const original = originals.get(path);
      if (original === undefined) continue;
      const rollback = stageFile(path, original);
      renameSync(rollback, path);
    }
    throw error;
  } finally {
    for (const temporary of temporaries.values()) removeIfPresent(temporary);
  }
}

function assertFrozenRuntime(rr: RrCheckpoint, closeout: Closeout): void {
  const runtime = rr.runtimeVerification;
  const safety = closeout.productionSafetyState;
  failIf(
    runtime.contentAiRunsObserved !== 0 ||
      !runtime.contentAiQueueEmpty ||
      !runtime.contentAiWebhookAndRecoveryBacklogEmpty ||
      runtime.veroxaReadyPackagesObserved !== 0 ||
      !runtime.externalScheduleQueueEmpty ||
      runtime.externalProvidersConnected ||
      runtime.externalPublishingVerified ||
      runtime.activationExecuted ||
      safety.publishQueue !== "empty" ||
      safety.externalScheduleQueue !== "empty" ||
      safety.externalProviderConnections !== "empty" ||
      safety.webhookAndRecoveryBacklog !== "empty" ||
      safety.externalPublishingEnabled ||
      safety.externalSchedulingEnabled ||
      safety.providerWritesEnabled ||
      safety.reviewRepliesEnabled ||
      safety.websiteWritesEnabled ||
      !safety.allExternalWriteControlsLocked ||
      safety.momoActivationExecuted,
    "Post-merge closeout requires the unchanged external-action and runtime freeze",
  );
}

const originalManifestContent = readFileSync(deploymentManifestPath, "utf8");
const originalRrContent = readFileSync(rrPath, "utf8");
const originalCloseoutContent = readFileSync(closeoutPath, "utf8");
const manifest = JSON.parse(originalManifestContent) as DeploymentManifest;
const rr = JSON.parse(originalRrContent) as RrCheckpoint;
const closeout = JSON.parse(originalCloseoutContent) as Closeout;
const scriptsPackage = JSON.parse(
  readFileSync(resolve(repoRoot, scriptsPackageRelativePath), "utf8"),
) as { scripts?: Record<string, unknown> };
for (const [command, expected] of Object.entries(requiredReleaseToolCommands)) {
  failIf(
    scriptsPackage.scripts?.[command] !== expected,
    `Release-state command ${command} must remain registered exactly as ${expected}`,
  );
}

const alreadyRecorded =
  manifest.releaseState === VERIFIED_GITHUB_PARITY_RELEASE_STATE;
if (alreadyRecorded) {
  failIf(
    manifest.currentProductionObservation.canonicalGitHubMainCommitScope !==
      undefined &&
      manifest.currentProductionObservation.canonicalGitHubMainCommitScope !==
        V36_OPERATIONAL_COMMIT_SCOPE,
    "Manifest operational commit scope is invalid",
  );
  const existingManifest = structuredClone(manifest);
  existingManifest.currentProductionObservation.canonicalGitHubMainCommitScope =
    V36_OPERATIONAL_COMMIT_SCOPE;
  assertVerifiedGitHubParityManifest(existingManifest);
  failIf(
    rr.schemaVersion !== 8 ||
      rr.status !== VERIFIED_GITHUB_PARITY_RELEASE_STATE ||
      (rr.currentProductionObservation.canonicalGitHubMainCommitScope !==
        undefined &&
        rr.currentProductionObservation.canonicalGitHubMainCommitScope !==
          V36_OPERATIONAL_COMMIT_SCOPE) ||
      rr.releaseCandidate.state !== VERIFIED_GITHUB_PARITY_STATUS ||
      rr.releaseCandidate.pullRequest !==
        V36_GITHUB_RECONCILIATION.pullRequest ||
      !rr.releaseCandidate.githubMerged ||
      rr.releaseCandidate.futureMergedGitHubCommit !==
        V36_GITHUB_RECONCILIATION.mergedCommit ||
      rr.releaseCandidate.futureSitesVersion !== null ||
      rr.releaseCandidate.allFourWorkflowsGreen !== true ||
      rr.releaseCandidate.zeroUnresolvedReviewThreads !== true ||
      !rr.releaseCandidate.candidateSourceMatchesLiveSites ||
      !rr.releaseCandidate.candidateMigrationsMatchLiveLedger ||
      !rr.releaseCandidate.githubMainMatchesCandidate ||
      !rr.releaseCandidate.fullReleaseGatePassed ||
      rr.releaseCandidate.databaseChangesRequired ||
      rr.releaseCandidate.databaseMigrationApplied ||
      rr.releaseCandidate.sitesPublishRequired ||
      rr.releaseCandidate.sitesCandidatePublished ||
      JSON.stringify(rr.githubReconciliationEvidence) !==
        JSON.stringify(V36_GITHUB_RECONCILIATION),
    "RR checkpoint is not the exact completed PR #157 parity state",
  );
  failIf(
    closeout.status !==
      "sites_v36_live_external_actions_frozen_github_parity_verified" ||
      closeout.github.currentMainRelease !== "v36" ||
      closeout.github.currentMainCommit !==
        V36_GITHUB_RECONCILIATION.mergedCommit ||
      (closeout.github.currentMainCommitScope !== undefined &&
        closeout.github.currentMainCommitScope !==
          V36_OPERATIONAL_COMMIT_SCOPE) ||
      closeout.github.v36ParityStatus !== VERIFIED_GITHUB_PARITY_STATUS ||
      closeout.github.v36ParityPullRequest !==
        V36_GITHUB_RECONCILIATION.pullRequest ||
      closeout.github.v36ParityReviewedHead !==
        V36_GITHUB_RECONCILIATION.reviewedHead ||
      closeout.github.v36ParityMergedCommit !==
        V36_GITHUB_RECONCILIATION.mergedCommit ||
      !closeout.github.candidateSourceMatchesLiveSites ||
      !closeout.github.githubMainMatchesCandidate ||
      !closeout.github.fullReleaseGatePassed ||
      closeout.github.zeroUnresolvedReviewThreads !== true ||
      JSON.stringify(closeout.github.preMergeWorkflows) !==
        JSON.stringify(V36_GITHUB_RECONCILIATION.preMergeWorkflows) ||
      JSON.stringify(closeout.github.postMergePushWorkflows) !==
        JSON.stringify(V36_GITHUB_RECONCILIATION.postMergePushWorkflows) ||
      closeout.github.databaseChangesRequired !== false ||
      closeout.github.databaseMigrationAppliedByParityRelease !== false ||
      closeout.github.sitesPublishRequired !== false ||
      closeout.github.sitesPublishedByParityRelease !== false,
    "Momo v36 closeout is not the exact completed PR #157 parity state",
  );
} else {
  assertReviewedLocalCandidateManifest(manifest);
  failIf(
    manifest.releaseState !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
      manifest.releaseCandidate.status !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
      manifest.releaseCandidate.pullRequest !== null ||
      manifest.releaseCandidate.githubMerged ||
      manifest.releaseCandidate.futureMergedGitHubCommit !== null ||
      manifest.releaseCandidate.futureSitesVersion !== null ||
      manifest.releaseCandidate.githubMainMatchesCandidate ||
      manifest.releaseCandidate.fullReleaseGatePassed,
    "Post-merge recorder can only close the exact reviewed, unmerged v36 candidate state",
  );
  failIf(
    rr.schemaVersion !== 8 ||
      rr.status !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
      rr.releaseCandidate.state !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
      !rr.releaseCandidate.reviewedLocally ||
      !rr.releaseCandidate.localReviewPassed ||
      rr.releaseCandidate.pullRequest !== null ||
      rr.releaseCandidate.githubMerged ||
      rr.releaseCandidate.allFourWorkflowsGreen !== null ||
      rr.releaseCandidate.zeroUnresolvedReviewThreads !== null,
    "RR checkpoint is not the exact reviewed pre-merge state",
  );
  failIf(
    closeout.schemaVersion !== 1 ||
      closeout.recordKind !== "momo_upload_v36_live_closeout" ||
      closeout.status !==
        "sites_v36_live_external_actions_frozen_github_parity_pending" ||
      closeout.github.v36ParityStatus !== "pending_pr_creation" ||
      closeout.github.v36ParityPullRequest !== null ||
      closeout.github.v36ParityReviewedHead !== null ||
      closeout.github.v36ParityMergedCommit !== null ||
      closeout.github.githubMainMatchesCandidate ||
      closeout.github.fullReleaseGatePassed,
    "Momo v36 closeout is not the exact pending GitHub-parity state",
  );
}
assertFrozenRuntime(rr, closeout);

const currentHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const mergeSecondParent = execFileSync("git", ["rev-parse", "HEAD^2"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
failIf(
  currentHead !== V36_GITHUB_RECONCILIATION.mergedCommit ||
    mergeSecondParent !== V36_GITHUB_RECONCILIATION.reviewedHead,
  "Recorder must run from the observed PR #157 merge whose second parent is the exact reviewed head",
);

const source = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrations = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const latestMigration = migrations.files.at(-1);
failIf(
  source.fileCount !== expectedSource.fileCount ||
    source.sha256 !== expectedSource.sha256 ||
    migrations.fileCount !== expectedMigrations.fileCount ||
    migrations.sha256 !== expectedMigrations.sha256 ||
    latestMigration !== expectedMigrations.latest ||
    sha256File(
      resolve(repoRoot, manifest.migrations.root, latestMigration!),
    ) !== expectedMigrations.latestSha256,
  "Canonical source or migration bytes no longer match the observed live v36 evidence",
);

const terminalManifest = structuredClone(manifest);
terminalManifest.releaseState = VERIFIED_GITHUB_PARITY_RELEASE_STATE;
terminalManifest.currentProductionObservation.evidenceStatus =
  VERIFIED_PRODUCTION_EVIDENCE_STATUS;
terminalManifest.currentProductionObservation.canonicalGitHubMainCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalManifest.currentProductionObservation.canonicalGitHubMainCommitScope =
  V36_OPERATIONAL_COMMIT_SCOPE;
terminalManifest.currentProductionObservation.githubMainMatchesCandidate = true;
terminalManifest.currentProductionObservation.fullReleaseGatePassed = true;
terminalManifest.githubReconciliationEvidence = structuredClone(
  V36_GITHUB_RECONCILIATION,
);
terminalManifest.releaseCandidate.status = VERIFIED_GITHUB_PARITY_STATUS;
terminalManifest.releaseCandidate.actionScope =
  RECONCILIATION_CANDIDATE_ACTION_SCOPE;
terminalManifest.releaseCandidate.basedOnGitHubMainCommit = expectedBaseMain;
terminalManifest.releaseCandidate.pullRequest =
  V36_GITHUB_RECONCILIATION.pullRequest;
terminalManifest.releaseCandidate.githubMerged = true;
terminalManifest.releaseCandidate.futureMergedGitHubCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalManifest.releaseCandidate.futureSitesVersion = null;
terminalManifest.releaseCandidate.githubMainMatchesCandidate = true;
terminalManifest.releaseCandidate.fullReleaseGatePassed = true;
terminalManifest.releaseCandidate.databaseChangesRequired = false;
terminalManifest.releaseCandidate.databaseMigrationApplied = false;
terminalManifest.releaseCandidate.sitesPublishRequired = false;
terminalManifest.releaseCandidate.sitesPublished = false;
terminalManifest.source.evidenceScope = VERIFIED_SOURCE_EVIDENCE_SCOPE;
terminalManifest.migrations.evidenceScope = VERIFIED_MIGRATION_EVIDENCE_SCOPE;
terminalManifest.deploymentFreeze.state = VERIFIED_DEPLOYMENT_FREEZE_STATE;
terminalManifest.deploymentFreeze.automaticDeploymentsAllowed = false;
terminalManifest.deploymentFreeze.allowedDeployment =
  VERIFIED_DEPLOYMENT_ALLOWED_ACTION;
terminalManifest.deploymentFreeze.releaseCondition = VERIFIED_RELEASE_CONDITION;
assertVerifiedGitHubParityManifest(terminalManifest);

const terminalRr = structuredClone(rr);
terminalRr.status = VERIFIED_GITHUB_PARITY_RELEASE_STATE;
terminalRr.currentProductionObservation.evidenceStatus =
  VERIFIED_PRODUCTION_EVIDENCE_STATUS;
terminalRr.currentProductionObservation.canonicalGitHubMainCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalRr.currentProductionObservation.canonicalGitHubMainCommitScope =
  V36_OPERATIONAL_COMMIT_SCOPE;
terminalRr.currentProductionObservation.githubMainMatchesCandidate = true;
terminalRr.currentProductionObservation.fullReleaseGatePassed = true;
terminalRr.githubReconciliationEvidence = structuredClone(
  V36_GITHUB_RECONCILIATION,
);
terminalRr.releaseCandidate.state = VERIFIED_GITHUB_PARITY_STATUS;
terminalRr.releaseCandidate.actionScope = RECONCILIATION_CANDIDATE_ACTION_SCOPE;
terminalRr.releaseCandidate.basedOnGitHubMainCommit = expectedBaseMain;
terminalRr.releaseCandidate.pullRequest = V36_GITHUB_RECONCILIATION.pullRequest;
terminalRr.releaseCandidate.githubMerged = true;
terminalRr.releaseCandidate.futureMergedGitHubCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalRr.releaseCandidate.futureSitesVersion = null;
terminalRr.releaseCandidate.reviewedLocally = true;
terminalRr.releaseCandidate.localReviewPassed = true;
terminalRr.releaseCandidate.allFourWorkflowsGreen = true;
terminalRr.releaseCandidate.zeroUnresolvedReviewThreads = true;
terminalRr.releaseCandidate.candidateSourceMatchesLiveSites = true;
terminalRr.releaseCandidate.candidateMigrationsMatchLiveLedger = true;
terminalRr.releaseCandidate.githubMainMatchesCandidate = true;
terminalRr.releaseCandidate.fullReleaseGatePassed = true;
terminalRr.releaseCandidate.databaseChangesRequired = false;
terminalRr.releaseCandidate.databaseMigrationApplied = false;
terminalRr.releaseCandidate.sitesPublishRequired = false;
terminalRr.releaseCandidate.sitesCandidatePublished = false;
const driftEvidenceIndex = terminalRr.reusableEvidence.findIndex((entry) =>
  entry.includes("The v36 source is live ahead of canonical GitHub"),
);
const terminalEvidence = `PR #157 reviewed head ${V36_GITHUB_RECONCILIATION.reviewedHead} merged at ${V36_GITHUB_RECONCILIATION.mergedCommit}; all four pre-merge and post-merge-push workflows succeeded with zero unresolved review threads, and GitHub main matches the already-live Sites v36 / 37-migration evidence without a Sites publish or database apply by PR #157`;
if (driftEvidenceIndex >= 0) {
  terminalRr.reusableEvidence[driftEvidenceIndex] = terminalEvidence;
} else {
  failIf(
    !terminalRr.reusableEvidence.includes(terminalEvidence),
    "RR reusable evidence is missing the exact terminal PR #157 statement",
  );
}
const releaseGateIndex = terminalRr.activationGates.findIndex((entry) =>
  entry.includes("Allow only exact reviewed and merged GitHub source"),
);
const terminalReleaseGate =
  "PR #157 reconciled exact reviewed GitHub source to already-live v36 without a Sites deployment or database apply; every future production change requires a new reviewed release and explicit deployment authority";
if (releaseGateIndex >= 0) {
  terminalRr.activationGates[releaseGateIndex] = terminalReleaseGate;
} else {
  failIf(
    !terminalRr.activationGates.includes(terminalReleaseGate),
    "RR activation gates are missing the exact terminal PR #157 release gate",
  );
}
const delivery = terminalRr.boundaryGroups.delivery;
failIf(!delivery, "RR checkpoint is missing the delivery boundary");
for (const required of [refreshRelativePath, localReviewRelativePath]) {
  failIf(
    !delivery.files.includes(required),
    `RR delivery boundary is missing required release-state tool ${required}`,
  );
}
if (!delivery.files.includes(recorderRelativePath)) {
  delivery.files.push(recorderRelativePath);
}
if (!delivery.files.includes(scriptsPackageRelativePath)) {
  delivery.files.push(scriptsPackageRelativePath);
}
for (const required of [
  refreshRelativePath,
  localReviewRelativePath,
  recorderRelativePath,
  scriptsPackageRelativePath,
]) {
  failIf(
    delivery.files.filter((file) => file === required).length !== 1,
    `RR delivery boundary must contain ${required} exactly once`,
  );
}

const terminalCloseout = structuredClone(closeout);
terminalCloseout.status =
  "sites_v36_live_external_actions_frozen_github_parity_verified";
terminalCloseout.github.currentMainRelease = "v36";
terminalCloseout.github.currentMainCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalCloseout.github.currentMainCommitScope = V36_OPERATIONAL_COMMIT_SCOPE;
terminalCloseout.github.v36ParityStatus = VERIFIED_GITHUB_PARITY_STATUS;
terminalCloseout.github.v36ParityPullRequest =
  V36_GITHUB_RECONCILIATION.pullRequest;
terminalCloseout.github.v36ParityReviewedHead =
  V36_GITHUB_RECONCILIATION.reviewedHead;
terminalCloseout.github.v36ParityMergedCommit =
  V36_GITHUB_RECONCILIATION.mergedCommit;
terminalCloseout.github.candidateSourceMatchesLiveSites = true;
terminalCloseout.github.githubMainMatchesCandidate = true;
terminalCloseout.github.fullReleaseGatePassed = true;
terminalCloseout.github.zeroUnresolvedReviewThreads = true;
terminalCloseout.github.preMergeWorkflows = structuredClone(
  V36_GITHUB_RECONCILIATION.preMergeWorkflows,
);
terminalCloseout.github.postMergePushWorkflows = structuredClone(
  V36_GITHUB_RECONCILIATION.postMergePushWorkflows,
);
terminalCloseout.github.databaseChangesRequired = false;
terminalCloseout.github.databaseMigrationAppliedByParityRelease = false;
terminalCloseout.github.sitesPublishRequired = false;
terminalCloseout.github.sitesPublishedByParityRelease = false;
assertFrozenRuntime(terminalRr, terminalCloseout);

failIf(
  terminalManifest.releaseCandidate.sitesPublished !==
    terminalRr.releaseCandidate.sitesCandidatePublished ||
    terminalManifest.releaseCandidate.databaseMigrationApplied !==
      terminalRr.releaseCandidate.databaseMigrationApplied ||
    terminalManifest.currentProductionObservation.canonicalGitHubMainCommit !==
      terminalRr.currentProductionObservation.canonicalGitHubMainCommit ||
    JSON.stringify(terminalManifest.githubReconciliationEvidence) !==
      JSON.stringify(terminalRr.githubReconciliationEvidence) ||
    JSON.stringify(terminalManifest.githubReconciliationEvidence) !==
      JSON.stringify(V36_GITHUB_RECONCILIATION),
  "Terminal manifest and RR GitHub parity evidence disagree",
);

const stagedManifestContent = serializedJson(terminalManifest);
const stagedCloseoutContent = serializedJson(terminalCloseout);
const overrides = new Map<string, string>([
  [manifestRelativePath, stagedManifestContent],
  [closeoutRelativePath, stagedCloseoutContent],
]);
for (const [name, group] of Object.entries(terminalRr.boundaryGroups)) {
  group.sha256 = groupHash(name, group.files, overrides);
  failIf(
    !/^[a-f0-9]{64}$/.test(group.sha256),
    `RR boundary group ${name} produced an invalid closeout hash`,
  );
}

replaceEvidenceFiles(
  new Map([
    [deploymentManifestPath, originalManifestContent],
    [closeoutPath, originalCloseoutContent],
    [rrPath, originalRrContent],
  ]),
  new Map([
    [deploymentManifestPath, stagedManifestContent],
    [closeoutPath, stagedCloseoutContent],
    [rrPath, serializedJson(terminalRr)],
  ]),
);

console.log(
  `Recorded post-merge PR #157 parity closeout: GitHub main ${V36_GITHUB_RECONCILIATION.mergedCommit}, ${source.fileCount} Sites files, ${migrations.fileCount} migrations, ${Object.keys(terminalRr.boundaryGroups).length} RR boundary groups, no Sites publish, no database apply, external actions frozen.`,
);
