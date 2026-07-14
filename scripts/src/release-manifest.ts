import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const deploymentManifestPath = resolve(
  repoRoot,
  "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json",
);

export const TREE_HASH_ALGORITHM = "veroxa-path-null-content-null-sha256-v1";

export type DeploymentManifest = {
  schemaVersion: number;
  recordKind: string;
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
  releaseCandidate: {
    status: string;
    futureMergedGitHubCommit: null;
    futureSitesVersion: null;
    databaseApplied: boolean;
    sitesPublished: boolean;
  };
  source: {
    root: string;
    mappingTarget: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
    generatedPathExclusions: string[];
  };
  migrations: {
    root: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    allowedDeployment: string;
    liftCondition: string;
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
  cleanupState: {
    branchDeletionAllowed: boolean;
    legacyViteRemovalAllowed: boolean;
    vercelSentinelRemovalAllowed: boolean;
    blocker: string;
  };
};

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
