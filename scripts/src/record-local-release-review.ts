import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import {
  REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
  REFRESHED_LOCAL_CANDIDATE_STATUS,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  REVIEWED_LOCAL_CANDIDATE_STATUS,
  assertReviewedLocalCandidateManifest,
  assertUnreleasedLocalCandidateManifest,
  deploymentManifestPath,
  repoRoot,
  type DeploymentManifest,
} from "./release-manifest";

const rrRelativePath = "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json";
const rrPath = resolve(repoRoot, rrRelativePath);

type RrCandidate = DeploymentManifest["releaseCandidate"] & {
  manifest: string;
  state: string;
  localReviewPassed: boolean;
};

type RrCheckpoint = {
  schemaVersion: number;
  status: string;
  releaseCandidate: RrCandidate;
  databaseContractReview?: DeploymentManifest["databaseContractReview"];
  currentProductionObservation?: DeploymentManifest["currentProductionObservation"];
  applicationQualityEvidence?: DeploymentManifest["applicationQualityEvidence"];
  runtimeVerification?: {
    externalProvidersConnected?: boolean;
    externalPublishingVerified?: boolean;
    activationExecuted?: boolean;
  };
  scope?: {
    ownerContactAuthorized?: boolean;
  };
  [key: string]: unknown;
};

type TreeHash = {
  fileCount: number;
  files: string[];
  sha256: string;
};

const historicalKeys = new Set([
  "lastGitHubParityRelease",
  "observedProductionBaseline",
  "previousVerifiedRelease",
  "verifiedReconciliationRelease",
  "policyEvaluationEvidence",
  "edgeDeployment",
]);

function serializedJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") {
    return (
      "{" +
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => JSON.stringify(key) + ":" + canonicalJson(entry))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}

function failIf(condition: boolean, message: string): void {
  if (condition) throw new Error(message);
}

function historicalSnapshot(value: object): string {
  const record = value as Record<string, unknown>;
  return canonicalJson(
    Object.fromEntries(
      Object.entries(record).filter(
        ([key]) => key.startsWith("historical") || historicalKeys.has(key),
      ),
    ),
  );
}

function normalized(relativePath: string): string {
  return relativePath.split(sep).join("/");
}

function excluded(relativePath: string, exclusions: string[]): boolean {
  return exclusions.some(
    (entry) => relativePath === entry || relativePath.startsWith(entry + "/"),
  );
}

function collectSafeFiles(
  directory: string,
  exclusions: string[],
  current = "",
): string[] {
  const absolute = resolve(directory, current);
  const entries = readdirSync(absolute, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = normalized(join(current, entry.name));
    if (excluded(relativePath, exclusions)) continue;
    failIf(
      /^TEMP(?:_|-|\.|$)/iu.test(entry.name),
      "Local review refuses TEMP source: " + relativePath,
    );
    const entryPath = resolve(directory, relativePath);
    failIf(
      lstatSync(entryPath).isSymbolicLink(),
      "Local review refuses symbolic links: " + relativePath,
    );
    if (entry.isDirectory()) {
      files.push(...collectSafeFiles(directory, exclusions, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error("Unsupported release-tree entry: " + relativePath);
    }
  }
  return files;
}

function safeHashTree(
  directory: string,
  options: { exclusions?: string[]; suffix?: string } = {},
): TreeHash {
  const exclusions = options.exclusions ?? [];
  const files = collectSafeFiles(directory, exclusions)
    .filter((file) => !options.suffix || file.endsWith(options.suffix))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const content = readFileSync(resolve(directory, file));
    failIf(
      /^(<<<<<<<|=======|>>>>>>>)(?: |$)/mu.test(content.toString("utf8")),
      "Local review refuses conflict-marked source: " + file,
    );
    hash.update(file, "utf8");
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return { fileCount: files.length, files, sha256: hash.digest("hex") };
}

function assertFullyAppliedDatabase(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const review = manifest.databaseContractReview;
  const live = manifest.currentProductionObservation;
  const candidate = manifest.releaseCandidate;
  if (!review) {
    throw new Error("Local review requires database contract review evidence");
  }
  failIf(
    review.status !== "verified" ||
      review.forwardRepairRequired ||
      !review.functionalVerificationPassed ||
      review.additionalDatabaseChangesRequired ||
      review.databaseApplyAuthorized ||
      typeof review.repairMigrationFilename !== "string" ||
      review.repairMigrationFilename.length === 0 ||
      typeof review.repairMigrationSha256 !== "string" ||
      !/^[a-f0-9]{64}$/u.test(review.repairMigrationSha256) ||
      typeof review.repairMigrationByteLength !== "number" ||
      review.repairMigrationByteLength < 1 ||
      typeof review.futureProductionMigrationCount !== "number" ||
      !Number.isInteger(review.futureProductionMigrationCount) ||
      review.futureProductionMigrationCount < 1 ||
      typeof review.futureProductionMigrationTreeSha256 !== "string" ||
      !/^[a-f0-9]{64}$/u.test(review.futureProductionMigrationTreeSha256),
    "Local review requires a fully verified, applied database repair",
  );
  failIf(
    live.productionMigrationCount !== review.futureProductionMigrationCount ||
      live.migrationTreeSha256 !== review.futureProductionMigrationTreeSha256 ||
      live.latestProductionMigration !== review.repairMigrationFilename ||
      live.latestProductionMigrationSha256 !== review.repairMigrationSha256 ||
      live.latestProductionMigrationByteLength !==
        review.repairMigrationByteLength ||
      !live.databaseLedgerObserved ||
      !live.databaseAppliedThroughLatestObserved,
    "Live production evidence does not match the verified applied repair",
  );
  failIf(
    candidate.pendingMigrations?.length !== 0 ||
      candidate.databaseChangesRequired ||
      candidate.additionalDatabaseChangesRequired ||
      !candidate.databaseMigrationApplied ||
      candidate.databaseApplyAuthorized !== false ||
      !candidate.candidateMigrationsMatchLiveLedger ||
      candidate.migrationFileCount !== live.productionMigrationCount ||
      candidate.migrationTreeSha256 !== live.migrationTreeSha256 ||
      candidate.latestCandidateMigration !== live.latestProductionMigration ||
      candidate.latestCandidateMigrationSha256 !==
        live.latestProductionMigrationSha256 ||
      !candidate.databaseMigrationsApplied?.includes(
        live.latestProductionMigration,
      ),
    "Local review requires pending=[] and exact fully applied candidate/live-ledger parity",
  );
  failIf(
    rr.schemaVersion !== 13 ||
      canonicalJson(rr.databaseContractReview) !== canonicalJson(review) ||
      canonicalJson(rr.currentProductionObservation) !== canonicalJson(live),
    "RR13 does not mirror the verified applied database evidence",
  );
}

function assertCompleteQualityEvidence(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const quality = manifest.applicationQualityEvidence;
  failIf(
    !quality ||
      quality.observedAt.trim().length === 0 ||
      quality.evidenceScope.trim().length === 0 ||
      quality.cleanInstallExitCode !== 0 ||
      quality.buildExitCode !== 0 ||
      quality.testsTotal < 1 ||
      quality.testsPassed !== quality.testsTotal ||
      quality.testsFailed !== 0 ||
      quality.typecheckExitCode !== 0 ||
      quality.productionAuditExitCode !== 0 ||
      quality.productionAuditVulnerabilityCount !== 0 ||
      quality.lintExitCode !== 0 ||
      quality.lintErrorCount !== 0 ||
      typeof quality.lintWarningCount !== "number" ||
      quality.lintWarningCount < 0 ||
      quality.warningFree !== (quality.lintWarningCount === 0),
    "Local review requires complete current-candidate install, build, test, typecheck, production-audit, and truthful lint evidence",
  );
  failIf(
    canonicalJson(rr.applicationQualityEvidence) !== canonicalJson(quality),
    "RR13 quality evidence does not match the deployment manifest",
  );
}

function assertCandidateActionBoundary(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const candidate = manifest.releaseCandidate;
  const checkpoint = rr.releaseCandidate;
  const unsafe =
    candidate.pullRequest !== null ||
    candidate.pullRequestDraft !== false ||
    candidate.observedDraftPullRequestHead !== null ||
    candidate.observedDraftPullRequestTree !== null ||
    candidate.draftHeadEvidenceScope !== null ||
    candidate.githubMerged ||
    candidate.futureMergedGitHubCommit !== null ||
    candidate.futureSitesVersion !== null ||
    candidate.allFourWorkflowsGreen !== null ||
    candidate.zeroUnresolvedReviewThreads !== null ||
    !candidate.databaseMigrationApplied ||
    candidate.databaseChangesRequired ||
    candidate.additionalDatabaseChangesRequired ||
    candidate.databaseApplyAuthorized !== false ||
    !candidate.candidateMigrationsMatchLiveLedger ||
    candidate.sitesPublished ||
    candidate.sitesPublishAuthorized !== false ||
    candidate.deploymentAuthorized !== false ||
    candidate.githubMainMatchesCandidate ||
    candidate.fullReleaseGatePassed ||
    checkpoint.pullRequest !== null ||
    checkpoint.githubMerged ||
    checkpoint.futureMergedGitHubCommit !== null ||
    checkpoint.futureSitesVersion !== null ||
    checkpoint.allFourWorkflowsGreen !== null ||
    checkpoint.zeroUnresolvedReviewThreads !== null ||
    checkpoint.databaseApplyAuthorized !== false ||
    checkpoint.sitesPublished ||
    checkpoint.sitesPublishAuthorized !== false ||
    checkpoint.deploymentAuthorized !== false ||
    checkpoint.githubMainMatchesCandidate ||
    checkpoint.fullReleaseGatePassed ||
    manifest.deploymentFreeze.automaticDeploymentsAllowed ||
    manifest.deploymentFreeze.databaseApplyAuthorized !== false ||
    manifest.deploymentFreeze.sitesPublishAuthorized !== false ||
    Object.values(manifest.activationState).some((value) => value) ||
    rr.runtimeVerification?.externalProvidersConnected === true ||
    rr.runtimeVerification?.externalPublishingVerified === true ||
    rr.runtimeVerification?.activationExecuted === true ||
    rr.scope?.ownerContactAuthorized === true;
  failIf(
    unsafe,
    "Local review cannot record PR, merge, apply authorization, deployment, publication, full-release, or external-action evidence",
  );
}

function assertCheckpointMatchesManifest(
  manifest: DeploymentManifest,
  rr: RrCheckpoint,
): void {
  const checkpoint = structuredClone(rr.releaseCandidate) as Record<
    string,
    unknown
  >;
  delete checkpoint.manifest;
  delete checkpoint.state;
  delete checkpoint.localReviewPassed;
  failIf(
    canonicalJson(checkpoint) !== canonicalJson(manifest.releaseCandidate),
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
    value.releaseCandidate.sourceReviewPassed = false;
    value.releaseCandidate.qualityReviewPassed = false;
  }
  failIf(
    canonicalJson(normalizedOriginalManifest) !==
      canonicalJson(normalizedReviewedManifest),
    "Local review attempted to change a non-review manifest field",
  );

  const normalizedOriginalRr = structuredClone(originalRr);
  const normalizedReviewedRr = structuredClone(reviewedRr);
  for (const value of [normalizedOriginalRr, normalizedReviewedRr]) {
    value.status = "<review-state>";
    value.releaseCandidate.status = "<review-status>";
    value.releaseCandidate.state = "<review-status>";
    value.releaseCandidate.reviewedLocally = false;
    value.releaseCandidate.sourceReviewPassed = false;
    value.releaseCandidate.qualityReviewPassed = false;
    value.releaseCandidate.localReviewPassed = false;
  }
  failIf(
    canonicalJson(normalizedOriginalRr) !== canonicalJson(normalizedReviewedRr),
    "Local review attempted to change a non-review RR field",
  );
}

function stageFile(target: string, content: string): string {
  const temporary = resolve(
    dirname(target),
    "." + basename(target) + "." + process.pid + "." + randomUUID() + ".tmp",
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
  manifestTarget: string,
  rrTarget: string,
  expectedManifestContent: string,
  expectedRrContent: string,
  manifestContent: string,
  rrContent: string,
  injectFailureAfterManifestRename = false,
): boolean {
  failIf(
    readFileSync(manifestTarget, "utf8") !== expectedManifestContent ||
      readFileSync(rrTarget, "utf8") !== expectedRrContent,
    "Release evidence changed concurrently before reviewed files were staged",
  );
  if (
    manifestContent === expectedManifestContent &&
    rrContent === expectedRrContent
  ) {
    return false;
  }
  let manifestTemporary: string | null = null;
  let rrTemporary: string | null = null;
  let manifestReplaced = false;
  let rrReplaced = false;
  try {
    manifestTemporary = stageFile(manifestTarget, manifestContent);
    rrTemporary = stageFile(rrTarget, rrContent);
    failIf(
      readFileSync(manifestTarget, "utf8") !== expectedManifestContent ||
        readFileSync(rrTarget, "utf8") !== expectedRrContent,
      "Release evidence changed concurrently after review validation",
    );
    renameSync(manifestTemporary, manifestTarget);
    manifestTemporary = null;
    manifestReplaced = true;
    failIf(
      injectFailureAfterManifestRename,
      "Injected local-review replacement failure",
    );
    renameSync(rrTemporary, rrTarget);
    rrTemporary = null;
    rrReplaced = true;
  } catch (error) {
    if (rrReplaced) {
      const rollbackRr = stageFile(rrTarget, expectedRrContent);
      renameSync(rollbackRr, rrTarget);
    }
    if (manifestReplaced) {
      const rollbackManifest = stageFile(
        manifestTarget,
        expectedManifestContent,
      );
      renameSync(rollbackManifest, manifestTarget);
    }
    failIf(
      readFileSync(manifestTarget, "utf8") !== expectedManifestContent ||
        readFileSync(rrTarget, "utf8") !== expectedRrContent,
      "Atomic local-review rollback failed",
    );
    throw error;
  } finally {
    removeIfPresent(manifestTemporary);
    removeIfPresent(rrTemporary);
  }
  return true;
}

function runAtomicSelfTest(): void {
  const directory = mkdtempSync(join(tmpdir(), "veroxa-review-self-test-"));
  const manifestPath = resolve(directory, "manifest.json");
  const checkpointPath = resolve(directory, "rr.json");
  const originalManifest = '{"reviewed":false}\n';
  const originalRr = '{"reviewed":false}\n';
  const nextManifest = '{"reviewed":true}\n';
  const nextRr = '{"reviewed":true}\n';
  writeFileSync(manifestPath, originalManifest, {
    encoding: "utf8",
    mode: 0o600,
  });
  writeFileSync(checkpointPath, originalRr, { encoding: "utf8", mode: 0o600 });
  try {
    let injectedFailureObserved = false;
    try {
      replaceEvidencePair(
        manifestPath,
        checkpointPath,
        originalManifest,
        originalRr,
        nextManifest,
        nextRr,
        true,
      );
    } catch {
      injectedFailureObserved = true;
    }
    failIf(
      !injectedFailureObserved,
      "Local-review rollback self-test did not fail",
    );
    failIf(
      readFileSync(manifestPath, "utf8") !== originalManifest ||
        readFileSync(checkpointPath, "utf8") !== originalRr,
      "Local-review rollback self-test changed one side of the evidence pair",
    );
    failIf(
      !replaceEvidencePair(
        manifestPath,
        checkpointPath,
        originalManifest,
        originalRr,
        nextManifest,
        nextRr,
      ),
      "Local-review atomic replacement self-test did not write",
    );
    failIf(
      replaceEvidencePair(
        manifestPath,
        checkpointPath,
        nextManifest,
        nextRr,
        nextManifest,
        nextRr,
      ),
      "Local-review idempotence self-test rewrote unchanged evidence",
    );
  } finally {
    failIf(
      !directory.startsWith(tmpdir() + sep),
      "Refusing unsafe self-test cleanup path",
    );
    rmSync(directory, { recursive: true });
  }
  console.log(
    "PASS: local-review recorder atomic rollback and idempotence self-test.",
  );
}

function main(): void {
  const originalManifestContent = readFileSync(deploymentManifestPath, "utf8");
  const originalRrContent = readFileSync(rrPath, "utf8");
  const manifest = JSON.parse(originalManifestContent) as DeploymentManifest;
  const rr = JSON.parse(originalRrContent) as RrCheckpoint;
  if (manifest.schemaVersion === 10) {
    throw new Error(
      "Schema-10 held-repair evidence is already locally reviewed and stage-bound. The legacy recorder is disabled because it cannot safely rewrite hold, Edge, generated-version closeout, or activation-routine state.",
    );
  }
  assertUnreleasedLocalCandidateManifest(manifest);
  failIf(
    manifest.releaseState !== REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE ||
      manifest.releaseCandidate.status !== REFRESHED_LOCAL_CANDIDATE_STATUS ||
      manifest.releaseCandidate.reviewedLocally ||
      manifest.releaseCandidate.sourceReviewPassed !== false ||
      manifest.releaseCandidate.qualityReviewPassed !== false,
    "Local review can only promote the exact refreshed, unmerged, review-required schema-9 candidate",
  );
  failIf(
    rr.schemaVersion !== 13 ||
      rr.status !== REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE ||
      rr.releaseCandidate.state !== REFRESHED_LOCAL_CANDIDATE_STATUS ||
      rr.releaseCandidate.status !== REFRESHED_LOCAL_CANDIDATE_STATUS ||
      rr.releaseCandidate.reviewedLocally ||
      rr.releaseCandidate.sourceReviewPassed !== false ||
      rr.releaseCandidate.qualityReviewPassed !== false ||
      rr.releaseCandidate.localReviewPassed,
    "RR13 must contain the same refreshed, unreviewed candidate state",
  );

  assertFullyAppliedDatabase(manifest, rr);
  assertCompleteQualityEvidence(manifest, rr);
  assertCandidateActionBoundary(manifest, rr);
  assertCheckpointMatchesManifest(manifest, rr);
  const manifestHistory = historicalSnapshot(manifest);
  const rrHistory = historicalSnapshot(rr);

  const source = safeHashTree(resolve(repoRoot, manifest.source.root), {
    exclusions: manifest.source.generatedPathExclusions,
  });
  const migrations = safeHashTree(resolve(repoRoot, manifest.migrations.root), {
    suffix: ".sql",
  });
  const mirror = safeHashTree(
    resolve(repoRoot, manifest.migrations.mirrorRoot ?? ""),
    { suffix: ".sql" },
  );
  const latestMigration = migrations.files.at(-1);
  failIf(
    !latestMigration,
    "Local review requires at least one applied migration",
  );
  failIf(
    source.fileCount !== manifest.source.fileCount ||
      source.sha256 !== manifest.source.treeSha256 ||
      source.fileCount !== manifest.releaseCandidate.sourceFileCount ||
      source.sha256 !== manifest.releaseCandidate.sourceTreeSha256,
    "Candidate Sites source does not match the refreshed fingerprints",
  );
  failIf(
    migrations.fileCount !== mirror.fileCount ||
      migrations.sha256 !== mirror.sha256 ||
      canonicalJson(migrations.files) !== canonicalJson(mirror.files) ||
      migrations.fileCount !== manifest.migrations.fileCount ||
      migrations.sha256 !== manifest.migrations.treeSha256 ||
      mirror.fileCount !== manifest.migrations.mirrorFileCount ||
      mirror.sha256 !== manifest.migrations.mirrorTreeSha256 ||
      migrations.fileCount !== manifest.releaseCandidate.migrationFileCount ||
      migrations.sha256 !== manifest.releaseCandidate.migrationTreeSha256 ||
      latestMigration !== manifest.releaseCandidate.latestCandidateMigration,
    "Candidate migrations do not match the refreshed fully applied mirrors",
  );
  const latestMigrationSha256 = createHash("sha256")
    .update(
      readFileSync(
        resolve(repoRoot, manifest.migrations.root, latestMigration as string),
      ),
    )
    .digest("hex");
  failIf(
    latestMigrationSha256 !==
      manifest.releaseCandidate.latestCandidateMigrationSha256,
    "Latest applied migration SHA-256 does not match the refreshed candidate",
  );

  const reviewedManifest = structuredClone(manifest);
  reviewedManifest.releaseState = REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE;
  reviewedManifest.releaseCandidate.status = REVIEWED_LOCAL_CANDIDATE_STATUS;
  reviewedManifest.releaseCandidate.reviewedLocally = true;
  reviewedManifest.releaseCandidate.sourceReviewPassed = true;
  reviewedManifest.releaseCandidate.qualityReviewPassed = true;
  assertCandidateActionBoundary(reviewedManifest, rr);
  failIf(
    historicalSnapshot(reviewedManifest) !== manifestHistory,
    "Local review changed historical manifest evidence",
  );
  assertReviewedLocalCandidateManifest(reviewedManifest);

  const reviewedRr = structuredClone(rr);
  reviewedRr.status = REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE;
  reviewedRr.releaseCandidate.status = REVIEWED_LOCAL_CANDIDATE_STATUS;
  reviewedRr.releaseCandidate.state = REVIEWED_LOCAL_CANDIDATE_STATUS;
  reviewedRr.releaseCandidate.reviewedLocally = true;
  reviewedRr.releaseCandidate.sourceReviewPassed = true;
  reviewedRr.releaseCandidate.qualityReviewPassed = true;
  reviewedRr.releaseCandidate.localReviewPassed = true;
  assertCandidateActionBoundary(reviewedManifest, reviewedRr);
  assertCheckpointMatchesManifest(reviewedManifest, reviewedRr);
  failIf(
    historicalSnapshot(reviewedRr) !== rrHistory,
    "Local review changed historical RR evidence",
  );
  assertOnlyReviewFieldsChanged(manifest, reviewedManifest, rr, reviewedRr);

  const changed = replaceEvidencePair(
    deploymentManifestPath,
    rrPath,
    originalManifestContent,
    originalRrContent,
    serializedJson(reviewedManifest),
    serializedJson(reviewedRr),
  );
  console.log(
    "Recorded local schema-9 release review for " +
      source.fileCount +
      " Sites files and " +
      migrations.fileCount +
      " fully applied mirrored migrations. Database apply, GitHub, Sites, deployment, external actions, and activation remain unauthorized." +
      (changed
        ? " Evidence pair updated atomically."
        : " Evidence pair already current."),
  );
}

if (process.env.VEROXA_RELEASE_RECORDER_SELF_TEST === "review") {
  runAtomicSelfTest();
} else {
  main();
}
