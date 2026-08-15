import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
  assertDeploymentAttestationManifest,
  deploymentManifestPath,
  ensureParentPath,
  hashTree,
  hasActiveMediaInspectionForwardCandidate,
  readDeploymentManifest,
  repoRoot,
  repositoryRelative,
  sha256File,
  writeJson,
} from "./release-manifest";

const manifest = readDeploymentManifest();
assertDeploymentAttestationManifest(manifest);
const activeForwardCandidate = hasActiveMediaInspectionForwardCandidate();
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
const latestCandidateMigration = activeForwardCandidate
  ? MEDIA_INSPECTION_PREFLIGHT_MIGRATION
  : manifest.releaseCandidate.latestCandidateMigration;
if (activeForwardCandidate
  ? (!migrationTree.files.includes(MEDIA_INSPECTION_PREFLIGHT_MIGRATION) ||
    migrationTree.files.at(-1) !== MEDIA_INSPECTION_PREFLIGHT_MIGRATION)
  : (
    sourceTree.fileCount !== manifest.source.fileCount ||
    sourceTree.sha256 !== manifest.source.treeSha256 ||
    migrationTree.fileCount !== manifest.migrations.fileCount ||
    migrationTree.sha256 !== manifest.migrations.treeSha256 ||
    sourceTree.fileCount !== manifest.releaseCandidate.sourceFileCount ||
    sourceTree.sha256 !== manifest.releaseCandidate.sourceTreeSha256 ||
    migrationTree.fileCount !== manifest.releaseCandidate.migrationFileCount ||
    migrationTree.sha256 !== manifest.releaseCandidate.migrationTreeSha256
  )
) {
  throw new Error(
    activeForwardCandidate
      ? "Refusing to attest an active forward candidate without its explicit media-inspection migration"
      : "Refusing to attest source whose deterministic hashes do not match the current manifest and release-candidate fingerprints",
  );
}
if (
  !migrationTree.files.includes(
    latestCandidateMigration,
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
    latestCandidateMigration,
  ),
);
if (
  !activeForwardCandidate && latestCandidateMigrationSha256 !==
  manifest.releaseCandidate.latestCandidateMigrationSha256
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
  attestationScope: activeForwardCandidate
    ? "exact_ci_active_private_media_forward_candidate_checkout_only_no_production_or_external_action_claim"
    : manifest.schemaVersion === 13
    ? "exact_ci_schema13_private_media_recovery_host_inspection_diagnostics_closeout_checkout_only_runtime_claims_from_canonical_evidence"
    : "exact_ci_schema11_live56_sites_v53_checkout_only_not_remote_or_runtime_parity",
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
  releaseCandidate: activeForwardCandidate
    ? {
        state: "active_media_inspection_forward_candidate",
        currentStatePath: "artifacts/veroxa/docs/CURRENT_STATE.json",
        preflightMigration: MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
        productionMigrationApplyProvenByThisAttestation: false,
        historicalManifestReleaseCandidate: manifest.releaseCandidate,
      }
    : manifest.releaseCandidate,
  mediaUploadHandoff: manifest.mediaUploadHandoff ?? null,
  legacyMediaPurgeAndHighResolutionRelease:
    (manifest as unknown as Record<string, unknown>)
      .legacyMediaPurgeAndHighResolutionRelease ?? null,
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
    evidenceScope: activeForwardCandidate
      ? "exact_ci_forward_candidate_checkout_hash_no_production_parity_claim"
      : manifest.source.evidenceScope,
    root: manifest.source.root,
    fileCount: sourceTree.fileCount,
    treeSha256: sourceTree.sha256,
    generatedPathExclusions: [...manifest.source.generatedPathExclusions],
  },
  migrations: {
    evidenceScope: activeForwardCandidate
      ? "exact_ci_forward_candidate_migration_tree_hash_no_database_apply_claim"
      : manifest.migrations.evidenceScope,
    root: manifest.migrations.root,
    fileCount: migrationTree.fileCount,
    treeSha256: migrationTree.sha256,
    latestCandidateMigration:
      latestCandidateMigration,
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
