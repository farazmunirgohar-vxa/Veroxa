import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_UPLOAD_HANDOFF_EVIDENCE,
  assertDeploymentAttestationManifest,
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
assertDeploymentAttestationManifest(manifest);
const githubSha = (process.env.GITHUB_SHA || "").trim().toLowerCase();
if (!/^[a-f0-9]{40}$/.test(githubSha)) {
  throw new Error(
    "GITHUB_SHA must be the exact 40-character commit under attestation",
  );
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
  sourceTree.fileCount !==
    MEDIA_UPLOAD_HANDOFF_EVIDENCE.candidateSourceFileCount ||
  sourceTree.sha256 !==
    MEDIA_UPLOAD_HANDOFF_EVIDENCE.candidateSourceTreeSha256 ||
  migrationTree.fileCount !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.migrationFileCount ||
  migrationTree.sha256 !== MEDIA_UPLOAD_HANDOFF_EVIDENCE.migrationTreeSha256
) {
  throw new Error(
    "Refusing to attest source whose deterministic hashes do not match the current schema-10 media-handoff candidate fingerprint",
  );
}
if (
  !migrationTree.files.includes(
    MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration,
  )
) {
  throw new Error(
    "Refusing to attest a candidate whose latest migration is absent from the deterministic migration tree",
  );
}
const latestCandidateMigrationSha256 = sha256File(
  resolve(
    repoRoot,
    manifest.migrations.root,
    MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration,
  ),
);
if (
  latestCandidateMigrationSha256 !==
  MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigrationSha256
) {
  throw new Error(
    "Refusing to attest a candidate whose latest migration fingerprint is stale",
  );
}

const output = resolve(
  repoRoot,
  process.env.VEROXA_ATTESTATION_OUTPUT ||
    "tmp/veroxa-deployment-attestation.json",
);
mkdirSync(ensureParentPath(output), { recursive: true });
writeJson(output, {
  schemaVersion: 4,
  recordKind: "veroxa_ci_deployment_attestation",
  attestationScope:
    "exact_ci_schema10_held_repair_checkout_only_not_remote_or_runtime_parity",
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
    provesEdgeDeployment: false,
    provesDatabaseMigrationApply: false,
    provesOperationalHold: false,
    provesActivationRoutineInstallOrInvocation: false,
    provesProductionParity: false,
  },
  releaseCandidate: manifest.releaseCandidate,
  mediaUploadHandoff: manifest.mediaUploadHandoff ?? null,
  referencedGitHubReconciliation: manifest.githubReconciliationEvidence
    ? {
        ...manifest.githubReconciliationEvidence,
        reverifiedByThisAttestation: false,
      }
    : null,
  lastGitHubParityRelease: manifest.lastGitHubParityRelease,
  historicalProductionObservations: manifest.historicalProductionObservations,
  referencedProductionObservation: {
    ...manifest.currentProductionObservation,
    reverifiedByThisAttestation: false,
  },
  productionEvidenceBoundary: {
    provesLiveSitesVersion: false,
    provesLiveDatabaseLedger: false,
    provesGitHubMainParity: false,
    provesOperationalHold: false,
    provesLiveEdgeIdentity: false,
    provesProductionParity: false,
  },
  source: {
    evidenceScope: manifest.source.evidenceScope,
    root: manifest.source.root,
    fileCount: sourceTree.fileCount,
    treeSha256: sourceTree.sha256,
    generatedPathExclusions: [...manifest.source.generatedPathExclusions],
  },
  migrations: {
    evidenceScope: manifest.migrations.evidenceScope,
    root: manifest.migrations.root,
    fileCount: migrationTree.fileCount,
    treeSha256: migrationTree.sha256,
    latestCandidateMigration:
      MEDIA_UPLOAD_HANDOFF_EVIDENCE.latestMigration,
    latestCandidateMigrationSha256,
  },
  applicationQualityEvidence: manifest.applicationQualityEvidence,
  databaseContractReview: manifest.databaseContractReview,
  referencedLiveEdgeObservation: manifest.edgeDeployment
    ? { ...manifest.edgeDeployment, reverifiedByThisAttestation: false }
    : null,
  edgeCandidate: manifest.edgeCandidate,
  referencedOperationalHold: manifest.operationalHold
    ? { ...manifest.operationalHold, reverifiedByThisAttestation: false }
    : null,
  activationRoutine: manifest.activationRoutine,
  generatedVersionCloseouts: manifest.generatedVersionCloseouts,
  deploymentParity: manifest.deploymentParity,
  rolloutSequence: manifest.rolloutSequence,
  deploymentFreeze: manifest.deploymentFreeze,
  activationState: manifest.activationState,
  activationStateScope: manifest.activationStateScope,
  currentRuntimeIdentityObservation: manifest.currentRuntimeIdentityObservation,
});

console.log(`Generated exact-SHA Veroxa deployment attestation at ${output}`);
