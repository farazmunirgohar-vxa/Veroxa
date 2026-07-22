import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const deploymentManifestPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);

export const TREE_HASH_ALGORITHM = "veroxa-path-null-content-null-sha256-v1";
export const REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE =
  "local_candidate_reviewed_unmerged_unpublished_unapplied";
export const REVIEWED_LOCAL_CANDIDATE_STATUS =
  "reviewed_locally_unmerged_unpublished_unapplied";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "local_candidate_fingerprints_refreshed_review_required_unmerged_unpublished_unapplied";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "fingerprints_refreshed_review_required_unmerged_unpublished_unapplied";
export const PUBLISHED_SITES_RELEASE_STATE =
  "published_sites_v20_no_database_change";
export const PUBLISHED_SITES_FOLLOWUP_STATUS =
  "published_sites_followup_no_database_change";

type Nullable<T> = T | null;

export type DeploymentManifest = {
  schemaVersion: 3;
  recordKind: "veroxa_production_reconciliation_manifest";
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  observedProductionBaseline: {
    reviewedAt: string;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    sourceParityVerified: boolean;
  };
  verifiedReconciliationRelease: {
    pullRequest: number;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    sitesPublished: boolean;
    sitesVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  observedProductionDrift: {
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    githubSourceParityVerified: boolean;
    sitesVersion: number;
    sitesCheckoutCommit: Nullable<string>;
    sourceFileCount: Nullable<number>;
    sourceTreeSha256: Nullable<string>;
    sitesSourceParityVerified: boolean;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  currentVerifiedRelease: {
    pullRequest: number;
    reviewedHead: string;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    sitesPublished: boolean;
    sitesVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  releaseCandidate: {
    status: string;
    basedOnGitHubMainCommit: string;
    pullRequest: Nullable<number>;
    githubMerged: boolean;
    futureMergedGitHubCommit: Nullable<string>;
    futureSitesVersion: Nullable<number>;
    reviewedLocally: boolean;
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
  source: {
    evidenceScope: string;
    root: string;
    mappingTarget: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
    generatedPathExclusions: string[];
  };
  migrations: {
    evidenceScope: string;
    root: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    allowedDeployment: string;
    releaseCondition: string;
  };
  activationState: {
    newIncrementalSpendApproved: boolean;
    aiWebResearchEnabled: boolean;
    openAiCredentialProvisioned: boolean;
    momoClientIdentityProvisioned: boolean;
    momoOwnerContactAuthorized: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingEnabled: boolean;
    momoActivationExecuted: boolean;
  };
  activationStateScope: string;
  currentRuntimeIdentityObservation: {
    observedAt: string;
    teamIdentityProvisioned: boolean;
    momoDevelopmentProxyClientIdentityProvisioned: boolean;
    momoRealOwnerClientIdentityProvisioned: boolean;
    developmentClientEvidenceClass: string;
    scope: string;
  };
  cleanupState: {
    inventoryReviewed: boolean;
    branchDeletionCapabilityAvailable: boolean;
    branchDeletionAllowed: boolean;
    legacyViteArchived: boolean;
    legacyViteRemovalAllowed: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
    blocker: string;
  };
};

export function assertUnreleasedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  if (manifest.schemaVersion !== 3) failures.push("schemaVersion must be 3");
  if (manifest.recordKind !== "veroxa_production_reconciliation_manifest") {
    failures.push("recordKind must identify the production reconciliation manifest");
  }
  if (![REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE, REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE].includes(manifest.releaseState)) {
    failures.push("releaseState must remain an unreleased local-candidate state");
  }
  if (![REVIEWED_LOCAL_CANDIDATE_STATUS, REFRESHED_LOCAL_CANDIDATE_STATUS].includes(manifest.releaseCandidate.status)) {
    failures.push("releaseCandidate.status must remain an unreleased local-candidate state");
  }
  if (
    manifest.releaseCandidate.pullRequest !== null &&
    (!Number.isInteger(manifest.releaseCandidate.pullRequest) ||
      manifest.releaseCandidate.pullRequest < 1)
  ) {
    failures.push("pullRequest must be null before PR creation or a positive known PR number");
  }
  if (manifest.releaseCandidate.githubMerged) failures.push("githubMerged must remain false");
  if (manifest.releaseCandidate.futureMergedGitHubCommit !== null) failures.push("futureMergedGitHubCommit must remain null");
  if (manifest.releaseCandidate.futureSitesVersion !== null) failures.push("futureSitesVersion must remain null");
  if (manifest.releaseCandidate.databaseMigrationApplied) {
    failures.push(
      "databaseMigrationApplied must remain false for every unreleased candidate, including a no-database-change candidate",
    );
  }
  if (manifest.releaseCandidate.sitesPublished) failures.push("sitesPublished must remain false");
  if (manifest.observedProductionDrift.candidateParityVerified) failures.push("candidateParityVerified must remain false");
  if (manifest.source.evidenceScope !== "local_release_candidate" || manifest.source.root !== "artifacts/veroxa-sites") {
    failures.push("source must remain scoped to the local Sites release candidate");
  }
  if (manifest.migrations.evidenceScope !== "local_release_candidate" || manifest.migrations.root !== "supabase/migrations") {
    failures.push("migrations must remain scoped to the local migration candidate");
  }
  if (manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM || manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM) {
    failures.push("candidate trees must use the canonical deterministic hash algorithm");
  }
  if (failures.length) {
    throw new Error(`Unsafe deployment manifest state: ${failures.join("; ")}`);
  }
}

export function assertReviewedLocalCandidateManifest(
  manifest: DeploymentManifest,
): void {
  assertUnreleasedLocalCandidateManifest(manifest);
  if (
    manifest.releaseState !== REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE ||
    manifest.releaseCandidate.status !== REVIEWED_LOCAL_CANDIDATE_STATUS ||
    !manifest.releaseCandidate.reviewedLocally
  ) {
    throw new Error("Deployment attestation requires the explicitly reviewed local candidate state");
  }
}

export function assertPublishedSitesFollowupManifest(
  manifest: DeploymentManifest,
): void {
  const failures: string[] = [];
  const candidate = manifest.releaseCandidate;
  const current = manifest.currentVerifiedRelease;
  if (manifest.schemaVersion !== 3) failures.push("schemaVersion must be 3");
  if (manifest.recordKind !== "veroxa_production_reconciliation_manifest") {
    failures.push("recordKind must identify the production reconciliation manifest");
  }
  if (manifest.releaseState !== PUBLISHED_SITES_RELEASE_STATE) {
    failures.push("releaseState must identify the verified Sites v20 publication");
  }
  if (candidate.status !== PUBLISHED_SITES_FOLLOWUP_STATUS) {
    failures.push("releaseCandidate.status must identify the published Sites-only follow-up");
  }
  if (!Number.isInteger(candidate.pullRequest) || (candidate.pullRequest ?? 0) < 1) {
    failures.push("published follow-up must retain its pull request number");
  }
  if (!candidate.githubMerged || !candidate.sitesPublished || !candidate.reviewedLocally) {
    failures.push("published follow-up must be reviewed, merged, and published");
  }
  if (
    !candidate.futureMergedGitHubCommit ||
    !/^[a-f0-9]{40}$/.test(candidate.futureMergedGitHubCommit) ||
    candidate.futureMergedGitHubCommit !== current.githubMainCommit
  ) {
    failures.push("published merge evidence must equal the current verified GitHub commit");
  }
  if (
    candidate.futureSitesVersion !== current.sitesVersion ||
    !Number.isInteger(candidate.futureSitesVersion)
  ) {
    failures.push("published Sites evidence must equal the current verified Sites version");
  }
  if (
    candidate.databaseChangesRequired ||
    candidate.databaseMigrationApplied ||
    !candidate.sitesPublishRequired
  ) {
    failures.push("published v20 follow-up must remain Sites-only with no database change");
  }
  if (
    manifest.source.evidenceScope !== "published_sites_v20" ||
    manifest.source.root !== "artifacts/veroxa-sites" ||
    manifest.migrations.evidenceScope !== "current_verified_release" ||
    manifest.migrations.root !== "supabase/migrations"
  ) {
    failures.push("published source and migration evidence scopes must remain exact");
  }
  if (
    manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM
  ) {
    failures.push("published trees must use the canonical deterministic hash algorithm");
  }
  if (
    candidate.sourceFileCount !== manifest.source.fileCount ||
    candidate.sourceTreeSha256 !== manifest.source.treeSha256 ||
    candidate.migrationFileCount !== manifest.migrations.fileCount ||
    candidate.migrationTreeSha256 !== manifest.migrations.treeSha256 ||
    current.sourceFileCount !== manifest.source.fileCount ||
    current.sourceTreeSha256 !== manifest.source.treeSha256 ||
    current.productionMigrationCount !== manifest.migrations.fileCount ||
    candidate.latestCandidateMigration !== current.latestProductionMigration ||
    candidate.latestCandidateMigrationSha256 !==
      current.latestProductionMigrationSha256
  ) {
    failures.push("published candidate, current release, source, and migration fingerprints must agree");
  }
  if (
    !current.databaseApplied ||
    !current.databaseVerified ||
    !current.sitesPublished ||
    !current.sitesVerified ||
    !current.customDomainsVerified ||
    !current.sitesSourceParityVerified ||
    !current.migrationContentParityVerified ||
    !current.migrationFilenameParityVerified
  ) {
    failures.push("current published release must retain every verified production evidence flag");
  }
  if (failures.length) {
    throw new Error(`Unsafe published deployment manifest state: ${failures.join("; ")}`);
  }
}

export function assertDeploymentAttestationManifest(
  manifest: DeploymentManifest,
): void {
  if (
    manifest.releaseState === PUBLISHED_SITES_RELEASE_STATE ||
    manifest.releaseCandidate.status === PUBLISHED_SITES_FOLLOWUP_STATUS
  ) {
    assertPublishedSitesFollowupManifest(manifest);
    return;
  }
  assertReviewedLocalCandidateManifest(manifest);
}

function normalized(relativePath: string): string {
  return relativePath.split(sep).join("/");
}

function isExcluded(relativePath: string, exclusions: string[]): boolean {
  return exclusions.some(
    (entry) => relativePath === entry || relativePath.startsWith(`${entry}/`),
  );
}

function collectFiles(
  directory: string,
  exclusions: string[],
  current = "",
): string[] {
  const absolute = resolve(directory, current);
  const entries = readdirSync(absolute, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = normalized(join(current, entry.name));
    if (isExcluded(relativePath, exclusions)) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`Release tree cannot contain a symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...collectFiles(directory, exclusions, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unsupported release-tree entry: ${relativePath}`);
    }
  }
  return files;
}

export function hashTree(
  directory: string,
  options: { exclusions?: string[]; suffix?: string } = {},
): { fileCount: number; files: string[]; sha256: string } {
  const exclusions = options.exclusions ?? [];
  const files = collectFiles(directory, exclusions)
    .filter((file) => !options.suffix || file.endsWith(options.suffix))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file, "utf8");
    hash.update("\0");
    hash.update(readFileSync(resolve(directory, file)));
    hash.update("\0");
  }
  return { fileCount: files.length, files, sha256: hash.digest("hex") };
}

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function readDeploymentManifest(): DeploymentManifest {
  return JSON.parse(readFileSync(deploymentManifestPath, "utf8")) as DeploymentManifest;
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function repositoryRelative(path: string): string {
  return normalized(relative(repoRoot, path));
}

export function ensureParentPath(path: string): string {
  return dirname(path);
}
