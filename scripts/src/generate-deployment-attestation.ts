import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertReviewedLocalCandidateManifest,
  deploymentManifestPath,
  ensureParentPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  repositoryRelative,
  sha256File,
  writeJson,
} from "./release-manifest";

const manifest = readDeploymentManifest();
assertReviewedLocalCandidateManifest(manifest);
const githubSha = (process.env.GITHUB_SHA || "").trim().toLowerCase();
if (!/^[a-f0-9]{40}$/.test(githubSha)) {
  throw new Error("GITHUB_SHA must be the exact 40-character commit under attestation");
}

const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
if (
  sourceTree.fileCount !== manifest.source.fileCount ||
  sourceTree.sha256 !== manifest.source.treeSha256 ||
  migrationTree.fileCount !== manifest.migrations.fileCount ||
  migrationTree.sha256 !== manifest.migrations.treeSha256 ||
  sourceTree.fileCount !== manifest.releaseCandidate.sourceFileCount ||
  sourceTree.sha256 !== manifest.releaseCandidate.sourceTreeSha256 ||
  migrationTree.fileCount !== manifest.releaseCandidate.migrationFileCount ||
  migrationTree.sha256 !== manifest.releaseCandidate.migrationTreeSha256
) {
  throw new Error("Refusing to attest source whose deterministic hashes do not match every schema-3 candidate fingerprint");
}
if (!migrationTree.files.includes(manifest.releaseCandidate.latestCandidateMigration)) {
  throw new Error("Refusing to attest a candidate whose latest migration is absent from the deterministic migration tree");
}
const latestCandidateMigrationSha256 = sha256File(
  resolve(
    repoRoot,
    manifest.migrations.root,
    manifest.releaseCandidate.latestCandidateMigration,
  ),
);
if (
  latestCandidateMigrationSha256 !==
  manifest.releaseCandidate.latestCandidateMigrationSha256
) {
  throw new Error("Refusing to attest a candidate whose latest migration fingerprint is stale");
}

const output = resolve(
  repoRoot,
  process.env.VEROXA_ATTESTATION_OUTPUT ||
    "tmp/veroxa-deployment-attestation.json",
);
mkdirSync(ensureParentPath(output), { recursive: true });
writeJson(output, {
  schemaVersion: 2,
  recordKind: "veroxa_ci_deployment_attestation",
  generatedAt: new Date().toISOString(),
  repository: manifest.canonicalRepository,
  ref: process.env.GITHUB_REF || null,
  githubSha,
  manifestPath: repositoryRelative(deploymentManifestPath),
  manifestSha256: sha256File(deploymentManifestPath),
  manifestSchemaVersion: manifest.schemaVersion,
  releaseState: manifest.releaseState,
  sitesProjectId: manifest.sitesProjectId,
  commitBinding: {
    scope: "exact_ci_checkout_only",
    githubSha,
    provesGitHubMerge: false,
    provesSitesPublication: false,
    provesDatabaseMigrationApply: false,
    provesProductionParity: false,
  },
  releaseCandidate: manifest.releaseCandidate,
  observedProductionDrift: manifest.observedProductionDrift,
  source: {
    evidenceScope: manifest.source.evidenceScope,
    root: manifest.source.root,
    fileCount: sourceTree.fileCount,
    treeSha256: sourceTree.sha256,
  },
  migrations: {
    evidenceScope: manifest.migrations.evidenceScope,
    root: manifest.migrations.root,
    fileCount: migrationTree.fileCount,
    treeSha256: migrationTree.sha256,
    latestCandidateMigration: manifest.releaseCandidate.latestCandidateMigration,
    latestCandidateMigrationSha256,
  },
  deploymentFreeze: manifest.deploymentFreeze,
  activationState: manifest.activationState,
  activationStateScope: manifest.activationStateScope,
  currentRuntimeIdentityObservation: manifest.currentRuntimeIdentityObservation,
});

console.log(`Generated exact-SHA Veroxa deployment attestation at ${output}`);
