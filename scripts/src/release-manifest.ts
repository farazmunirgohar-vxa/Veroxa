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
  "live_sites_v36_github_reconciliation_reviewed_unmerged";
export const REVIEWED_LOCAL_CANDIDATE_STATUS = "reviewed_locally_unmerged";
export const REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE =
  "live_sites_v36_github_reconciliation_fingerprints_refreshed_review_required";
export const REFRESHED_LOCAL_CANDIDATE_STATUS =
  "fingerprints_refreshed_review_required_unmerged";
export const RECONCILIATION_CANDIDATE_ACTION_SCOPE =
  "github_reconciliation_candidate";
export const RECONCILIATION_SOURCE_EVIDENCE_SCOPE =
  "github_reconciliation_candidate_matching_live_sites_v36";
export const RECONCILIATION_MIGRATION_EVIDENCE_SCOPE =
  "github_reconciliation_candidate_matching_live_ledger_v36";
export const GENERATED_PATH_EXCLUSIONS = [
  ".git",
  ".next",
  ".sites-runtime",
  ".vinext",
  ".wrangler",
  "dist",
  "node_modules",
  "outputs",
  "tsconfig.tsbuildinfo",
  "work",
] as const;

// Kept temporarily as exports while downstream validators move to schema 4.
// Schema 4 deliberately has no state that treats this GitHub candidate as the
// actor that published the already-live Sites source or applied its migrations.
export const PUBLISHED_SITES_RELEASE_STATE =
  "published_sites_v22_no_database_change";
export const PUBLISHED_SITES_FOLLOWUP_STATUS =
  "published_sites_followup_no_database_change";

type Nullable<T> = T | null;

type GitHubParityRelease = {
  evidenceScope: "last_github_sites_parity_release";
  supersededAsLiveBaseline: true;
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

type HistoricalProductionObservation = {
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
};

type CurrentProductionObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  githubMainMatchesCandidate: false;
  sitesVersion: number;
  sitesCheckoutCommit: string;
  sourceFileCount: number;
  sourceTreeSha256: string;
  candidateSourceMatchesLiveSites: true;
  productionMigrationCount: number;
  migrationTreeSha256: string;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseLedgerObserved: boolean;
  databaseAppliedThroughLatestObserved: boolean;
  candidateMigrationsMatchLiveLedger: true;
  fullReleaseGatePassed: false;
};

export type DeploymentManifest = {
  schemaVersion: 4;
  recordKind: "veroxa_production_reconciliation_manifest";
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  lastGitHubParityRelease: GitHubParityRelease;
  historicalProductionObservations: HistoricalProductionObservation[];
  currentProductionObservation: CurrentProductionObservation;
  releaseCandidate: {
    status: string;
    actionScope: typeof RECONCILIATION_CANDIDATE_ACTION_SCOPE;
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
    candidateSourceMatchesLiveSites: boolean;
    candidateMigrationsMatchLiveLedger: boolean;
    githubMainMatchesCandidate: boolean;
    fullReleaseGatePassed: boolean;
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
  const candidate = manifest.releaseCandidate;
  const live = manifest.currentProductionObservation;
  const lastParity = manifest.lastGitHubParityRelease;
  if (manifest.schemaVersion !== 4) failures.push("schemaVersion must be 4");
  if (manifest.recordKind !== "veroxa_production_reconciliation_manifest") {
    failures.push(
      "recordKind must identify the production reconciliation manifest",
    );
  }
  if (
    ![
      REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
      REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE,
    ].includes(manifest.releaseState)
  ) {
    failures.push(
      "releaseState must remain an unreleased local-candidate state",
    );
  }
  if (
    ![
      REVIEWED_LOCAL_CANDIDATE_STATUS,
      REFRESHED_LOCAL_CANDIDATE_STATUS,
    ].includes(candidate.status)
  ) {
    failures.push(
      "releaseCandidate.status must remain an unreleased local-candidate state",
    );
  }
  if (
    (manifest.releaseState === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE) !==
    (candidate.status === REVIEWED_LOCAL_CANDIDATE_STATUS)
  ) {
    failures.push("release and candidate review states must agree");
  }
  if (
    candidate.pullRequest !== null &&
    (!Number.isInteger(candidate.pullRequest) || candidate.pullRequest < 1)
  ) {
    failures.push(
      "pullRequest must be null before PR creation or a positive known PR number",
    );
  }
  if (candidate.githubMerged) failures.push("githubMerged must remain false");
  if (candidate.futureMergedGitHubCommit !== null) {
    failures.push("futureMergedGitHubCommit must remain null");
  }
  if (candidate.futureSitesVersion !== null) {
    failures.push("futureSitesVersion must remain null");
  }
  if (candidate.actionScope !== RECONCILIATION_CANDIDATE_ACTION_SCOPE) {
    failures.push(
      "candidate action evidence must be scoped to this reconciliation candidate",
    );
  }
  if (candidate.databaseChangesRequired) {
    failures.push(
      "databaseChangesRequired must remain false for source reconciliation",
    );
  }
  if (candidate.databaseMigrationApplied) {
    failures.push(
      "databaseMigrationApplied must remain false because this candidate did not apply the live migrations",
    );
  }
  if (candidate.sitesPublishRequired) {
    failures.push(
      "sitesPublishRequired must remain false for the live-source reconciliation candidate",
    );
  }
  if (candidate.sitesPublished) {
    failures.push(
      "sitesPublished must remain false because this candidate did not publish Sites v36",
    );
  }
  if (!candidate.candidateSourceMatchesLiveSites) {
    failures.push(
      "candidateSourceMatchesLiveSites must retain verified live-source equality",
    );
  }
  if (!candidate.candidateMigrationsMatchLiveLedger) {
    failures.push(
      "candidateMigrationsMatchLiveLedger must retain verified ledger equality",
    );
  }
  if (candidate.githubMainMatchesCandidate) {
    failures.push("githubMainMatchesCandidate must remain false before merge");
  }
  if (candidate.fullReleaseGatePassed) {
    failures.push(
      "fullReleaseGatePassed must remain false before merge and all workflow evidence",
    );
  }
  if (
    manifest.source.evidenceScope !== RECONCILIATION_SOURCE_EVIDENCE_SCOPE ||
    manifest.source.root !== "artifacts/veroxa-sites"
  ) {
    failures.push(
      "source must remain scoped to the live Sites v36 reconciliation candidate",
    );
  }
  if (
    manifest.migrations.evidenceScope !==
      RECONCILIATION_MIGRATION_EVIDENCE_SCOPE ||
    manifest.migrations.root !== "supabase/migrations"
  ) {
    failures.push(
      "migrations must remain scoped to the live-ledger reconciliation candidate",
    );
  }
  if (
    manifest.source.hashAlgorithm !== TREE_HASH_ALGORITHM ||
    manifest.migrations.hashAlgorithm !== TREE_HASH_ALGORITHM
  ) {
    failures.push(
      "candidate trees must use the canonical deterministic hash algorithm",
    );
  }
  if (
    JSON.stringify(manifest.source.generatedPathExclusions) !==
    JSON.stringify(GENERATED_PATH_EXCLUSIONS)
  ) {
    failures.push(
      "generatedPathExclusions must remain the reviewed generated-output allowlist",
    );
  }
  if (
    !lastParity.supersededAsLiveBaseline ||
    lastParity.sitesVersion !== 22 ||
    !lastParity.sitesSourceParityVerified ||
    !lastParity.migrationContentParityVerified ||
    !lastParity.migrationFilenameParityVerified
  ) {
    failures.push(
      "lastGitHubParityRelease must preserve the superseded verified Sites v22 baseline",
    );
  }
  if (
    !manifest.historicalProductionObservations.some(
      (entry) => entry.sitesVersion === 18,
    )
  ) {
    failures.push(
      "historicalProductionObservations must preserve the Sites v18 observation",
    );
  }
  if (
    live.sitesVersion !== 36 ||
    live.productionMigrationCount !== 37 ||
    live.githubMainMatchesCandidate ||
    !live.candidateSourceMatchesLiveSites ||
    !live.databaseLedgerObserved ||
    !live.databaseAppliedThroughLatestObserved ||
    !live.candidateMigrationsMatchLiveLedger ||
    live.fullReleaseGatePassed
  ) {
    failures.push(
      "currentProductionObservation must preserve verified Sites v36 and 37-migration live evidence",
    );
  }
  if (
    live.sourceFileCount !== manifest.source.fileCount ||
    live.sourceTreeSha256 !== manifest.source.treeSha256 ||
    live.productionMigrationCount !== manifest.migrations.fileCount ||
    live.migrationTreeSha256 !== manifest.migrations.treeSha256 ||
    live.latestProductionMigration !== candidate.latestCandidateMigration ||
    live.latestProductionMigrationSha256 !==
      candidate.latestCandidateMigrationSha256 ||
    candidate.sourceFileCount !== manifest.source.fileCount ||
    candidate.sourceTreeSha256 !== manifest.source.treeSha256 ||
    candidate.migrationFileCount !== manifest.migrations.fileCount ||
    candidate.migrationTreeSha256 !== manifest.migrations.treeSha256
  ) {
    failures.push(
      "candidate fingerprints must equal the separately observed live source and migration evidence",
    );
  }
  if (
    manifest.releaseState === REFRESHED_LOCAL_CANDIDATE_RELEASE_STATE &&
    candidate.reviewedLocally
  ) {
    failures.push("fingerprint refresh state cannot claim local review");
  }
  if (
    manifest.releaseState === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    !candidate.reviewedLocally
  ) {
    failures.push(
      "reviewed reconciliation state requires explicit local review evidence",
    );
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
    throw new Error(
      "Deployment attestation requires the explicitly reviewed local candidate state",
    );
  }
}

export function assertPublishedSitesFollowupManifest(
  _manifest: DeploymentManifest,
): void {
  throw new Error(
    "Schema 4 does not permit a published-candidate assertion: Sites v36 and its migrations predate this unmerged GitHub reconciliation candidate",
  );
}

export function assertDeploymentAttestationManifest(
  manifest: DeploymentManifest,
): void {
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
  const entries = readdirSync(absolute, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = normalized(join(current, entry.name));
    if (isExcluded(relativePath, exclusions)) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Release tree cannot contain a symbolic link: ${relativePath}`,
      );
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
  return JSON.parse(
    readFileSync(deploymentManifestPath, "utf8"),
  ) as DeploymentManifest;
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
