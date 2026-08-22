import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
  activeMediaInspectionForwardCandidateMigration,
  assertDeploymentAttestationManifest,
  currentLiveStatusReconciliationEvidence,
  currentStatePath,
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
const currentLiveStatus = currentLiveStatusReconciliationEvidence();
const currentState = currentLiveStatus
  ? JSON.parse(readFileSync(currentStatePath, "utf8")) as Record<string, any>
  : null;
const currentProduction = currentState?.production as
  | Record<string, any>
  | undefined;
const currentCandidate = currentState?.activeCandidate as
  | Record<string, any>
  | undefined;
const activeForwardMigration = activeMediaInspectionForwardCandidateMigration();
const activeForwardCandidate = activeForwardMigration !== null;
if (currentLiveStatus && activeForwardCandidate) {
  throw new Error(
    "Current live reconciliation cannot also be an active forward candidate",
  );
}
if (currentLiveStatus && (
  currentState?.phase !== currentLiveStatus.phase ||
  currentCandidate?.state !== "release_converged_authenticated_proof_pending" ||
  currentCandidate?.kind !== "ver43_hosted_signature_envelope_release"
)) {
  throw new Error(
    "Current live reconciliation is missing its exact CURRENT_STATE release identity",
  );
}
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
const latestCandidateMigration = activeForwardMigration ??
  currentLiveStatus?.migrations.latestMigration ??
  manifest.releaseCandidate.latestCandidateMigration;
if (activeForwardCandidate
  ? (!migrationTree.files.includes(latestCandidateMigration) ||
    migrationTree.files.at(-1) !== latestCandidateMigration)
  : currentLiveStatus
  ? (
    sourceTree.fileCount !== currentLiveStatus.source.fileCount ||
    sourceTree.sha256 !== currentLiveStatus.source.treeSha256 ||
    migrationTree.fileCount !== currentLiveStatus.migrations.fileCount ||
    migrationTree.sha256 !== currentLiveStatus.migrations.treeSha256 ||
    migrationTree.files.at(-1) !== currentLiveStatus.migrations.latestMigration
  )
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
      ? "Refusing to attest an active forward candidate without its explicit latest migration"
      : currentLiveStatus
      ? "Refusing to attest source whose deterministic hashes do not match the current live-status reconciliation"
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
const expectedLatestMigrationSha256 = currentLiveStatus
  ?.migrations.latestMigrationSha256 ??
  manifest.releaseCandidate.latestCandidateMigrationSha256;
if (!activeForwardCandidate && latestCandidateMigrationSha256 !==
  expectedLatestMigrationSha256) {
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
    : currentLiveStatus
    ? "exact_ci_current_live_status_reconciliation_checkout_only_no_new_production_or_external_action_claim"
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
  releaseState: currentLiveStatus ? currentLiveStatus.phase : manifest.releaseState,
  historicalManifestReleaseState: currentLiveStatus ? manifest.releaseState : null,
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
        candidateMigration: latestCandidateMigration,
        preflightPrerequisite: MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
        productionMigrationApplyProvenByThisAttestation: false,
        historicalManifestReleaseCandidate: manifest.releaseCandidate,
      }
    : currentLiveStatus
    ? {
        kind: currentCandidate?.kind ?? null,
        state: currentCandidate?.state ?? null,
        status: currentLiveStatus.phase,
        currentStatePath: repositoryRelative(currentStatePath),
        pullRequest: currentCandidate?.pullRequest ?? null,
        mergeCommit: currentCandidate?.mergeCommit ?? null,
        githubMainCommit:
          currentProduction?.github?.observedMainCommit ?? null,
        sitesVersion: currentProduction?.sites?.version ?? null,
        sitesVersionId: currentProduction?.sites?.versionId ?? null,
        sitesDeploymentId: currentProduction?.sites?.deploymentId ?? null,
        sitesInternalSourceCommit:
          currentProduction?.sites?.internalSourceCommit ?? null,
        sourceFileCount: currentLiveStatus.source.fileCount,
        sourceTreeSha256: currentLiveStatus.source.treeSha256,
        migrationFileCount: currentLiveStatus.migrations.fileCount,
        migrationTreeSha256: currentLiveStatus.migrations.treeSha256,
        latestCandidateMigration: currentLiveStatus.migrations.latestMigration,
        latestCandidateMigrationSha256:
          currentLiveStatus.migrations.latestMigrationSha256,
        pendingMigrations: currentCandidate?.pendingMigrations ?? [],
        candidateMigrationsMatchLiveLedger: true,
        externalActionLockRequired:
          currentCandidate?.externalActionLockRequired ?? null,
        requiredGates: currentCandidate?.requiredGates ?? null,
        historicalManifestReleaseCandidate: manifest.releaseCandidate,
      }
    : manifest.releaseCandidate,
  mediaUploadHandoff: currentLiveStatus ? null : manifest.mediaUploadHandoff ?? null,
  historicalManifestMediaUploadHandoff:
    currentLiveStatus ? manifest.mediaUploadHandoff ?? null : null,
  legacyMediaPurgeAndHighResolutionRelease: currentLiveStatus
    ? null
    : (manifest as unknown as Record<string, unknown>)
      .legacyMediaPurgeAndHighResolutionRelease ?? null,
  historicalManifestLegacyMediaPurgeAndHighResolutionRelease:
    currentLiveStatus
      ? (manifest as unknown as Record<string, unknown>)
        .legacyMediaPurgeAndHighResolutionRelease ?? null
      : null,
  referencedGitHubReconciliation: currentLiveStatus
    ? null
    : manifest.githubReconciliationEvidence
    ? {
        ...manifest.githubReconciliationEvidence,
        reverifiedByThisAttestation: false,
      }
    : null,
  historicalManifestGitHubReconciliation:
    currentLiveStatus ? manifest.githubReconciliationEvidence ?? null : null,
  lastGitHubParityRelease: currentLiveStatus ? null : manifest.lastGitHubParityRelease,
  historicalManifestLastGitHubParityRelease:
    currentLiveStatus ? manifest.lastGitHubParityRelease : null,
  historicalProductionObservations: manifest.historicalProductionObservations,
  referencedProductionObservation: currentLiveStatus
    ? {
        evidenceScope: "CURRENT_STATE.json current production reconciliation",
        github: currentProduction?.github ?? null,
        sites: currentProduction?.sites ?? null,
        supabase: currentProduction?.supabase ?? null,
        edge: currentProduction?.edge ?? null,
        reverifiedByThisAttestation: false,
      }
    : {
        ...manifest.currentProductionObservation,
        reverifiedByThisAttestation: false,
      },
  historicalManifestCurrentProductionObservation:
    currentLiveStatus ? manifest.currentProductionObservation : null,
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
      : currentLiveStatus
      ? "exact_ci_current_live_status_checkout_hash_no_new_production_parity_claim"
      : manifest.source.evidenceScope,
    root: manifest.source.root,
    fileCount: sourceTree.fileCount,
    treeSha256: sourceTree.sha256,
    generatedPathExclusions: [...manifest.source.generatedPathExclusions],
  },
  migrations: {
    evidenceScope: activeForwardCandidate
      ? "exact_ci_forward_candidate_migration_tree_hash_no_database_apply_claim"
      : currentLiveStatus
      ? "exact_ci_current_live_status_migration_tree_hash_no_new_database_apply_claim"
      : manifest.migrations.evidenceScope,
    root: manifest.migrations.root,
    fileCount: migrationTree.fileCount,
    treeSha256: migrationTree.sha256,
    latestCandidateMigration:
      latestCandidateMigration,
    latestCandidateMigrationSha256,
  },
  applicationQualityEvidence:
    currentLiveStatus ? null : manifest.applicationQualityEvidence,
  historicalManifestApplicationQualityEvidence:
    currentLiveStatus ? manifest.applicationQualityEvidence : null,
  databaseContractReview:
    currentLiveStatus ? null : manifest.databaseContractReview,
  historicalManifestDatabaseContractReview:
    currentLiveStatus ? manifest.databaseContractReview : null,
  referencedLiveEdgeObservation: currentLiveStatus
    ? {
        ...(currentProduction?.edge ?? {}),
        evidenceScope: "CURRENT_STATE.json current Edge reconciliation",
        reverifiedByThisAttestation: false,
      }
    : manifest.edgeDeployment
    ? { ...manifest.edgeDeployment, reverifiedByThisAttestation: false }
    : null,
  historicalManifestEdgeDeployment:
    currentLiveStatus ? manifest.edgeDeployment ?? null : null,
  edgeCandidate: currentLiveStatus ? null : manifest.edgeCandidate,
  historicalManifestEdgeCandidate:
    currentLiveStatus ? manifest.edgeCandidate ?? null : null,
  referencedOperationalHold: currentLiveStatus
    ? {
        evidenceScope: "CURRENT_STATE.json current external-action locks",
        ...(currentState?.externalActionLock ?? {}),
        reverifiedByThisAttestation: false,
      }
    : manifest.operationalHold
    ? { ...manifest.operationalHold, reverifiedByThisAttestation: false }
    : null,
  historicalManifestOperationalHold:
    currentLiveStatus ? manifest.operationalHold ?? null : null,
  activationRoutine: currentLiveStatus ? null : manifest.activationRoutine,
  historicalManifestActivationRoutine:
    currentLiveStatus ? manifest.activationRoutine ?? null : null,
  generatedVersionCloseouts:
    currentLiveStatus ? null : manifest.generatedVersionCloseouts,
  historicalManifestGeneratedVersionCloseouts:
    currentLiveStatus ? manifest.generatedVersionCloseouts ?? null : null,
  deploymentParity: currentLiveStatus ? null : manifest.deploymentParity,
  historicalManifestDeploymentParity:
    currentLiveStatus ? manifest.deploymentParity ?? null : null,
  rolloutSequence: currentLiveStatus ? null : manifest.rolloutSequence,
  historicalManifestRolloutSequence:
    currentLiveStatus ? manifest.rolloutSequence ?? null : null,
  deploymentFreeze: currentLiveStatus ? null : manifest.deploymentFreeze,
  historicalManifestDeploymentFreeze:
    currentLiveStatus ? manifest.deploymentFreeze : null,
  activationState: currentLiveStatus ? null : manifest.activationState,
  historicalManifestActivationState:
    currentLiveStatus ? manifest.activationState : null,
  activationStateScope:
    currentLiveStatus ? null : manifest.activationStateScope,
  historicalManifestActivationStateScope:
    currentLiveStatus ? manifest.activationStateScope : null,
  currentRuntimeIdentityObservation: currentLiveStatus
    ? {
        evidenceScope: "CURRENT_STATE.json current release identity",
        phase: currentState?.phase ?? null,
        currentVerdict: currentState?.currentVerdict ?? null,
        github: currentProduction?.github ?? null,
        sites: currentProduction?.sites ?? null,
        supabase: currentProduction?.supabase ?? null,
        edge: currentProduction?.edge ?? null,
      }
    : manifest.currentRuntimeIdentityObservation,
  historicalManifestRuntimeIdentityObservation:
    currentLiveStatus ? manifest.currentRuntimeIdentityObservation : null,
});

console.log(`Generated exact-SHA Veroxa deployment attestation at ${output}`);
