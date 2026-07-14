import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
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
  migrationTree.sha256 !== manifest.migrations.treeSha256
) {
  throw new Error("Refusing to attest source whose deterministic hashes do not match the deployment manifest");
}

const output = resolve(
  repoRoot,
  process.env.VEROXA_ATTESTATION_OUTPUT ||
    "tmp/veroxa-deployment-attestation.json",
);
mkdirSync(ensureParentPath(output), { recursive: true });
writeJson(output, {
  schemaVersion: 1,
  recordKind: "veroxa_ci_deployment_attestation",
  generatedAt: new Date().toISOString(),
  repository: manifest.canonicalRepository,
  ref: process.env.GITHUB_REF || null,
  githubSha,
  manifestPath: repositoryRelative(deploymentManifestPath),
  manifestSha256: sha256File(deploymentManifestPath),
  sitesProjectId: manifest.sitesProjectId,
  source: {
    root: manifest.source.root,
    fileCount: sourceTree.fileCount,
    treeSha256: sourceTree.sha256,
  },
  migrations: {
    root: manifest.migrations.root,
    fileCount: migrationTree.fileCount,
    treeSha256: migrationTree.sha256,
  },
  deploymentFreeze: manifest.deploymentFreeze,
  activationState: manifest.activationState,
});

console.log(`Generated exact-SHA Veroxa deployment attestation at ${output}`);
