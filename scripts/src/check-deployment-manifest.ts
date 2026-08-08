const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  GENERATED_PATH_EXCLUSIONS,
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LIVE_PRODUCTION_EVIDENCE_STATUS,
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE,
  TREE_HASH_ALGORITHM,
  V36_LIVE_PARITY_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

const failures: string[] = [];
const must = __name((condition: boolean, message: string) => {
  if (!condition) failures.push(message);
}, "must");
const manifest = readDeploymentManifest();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
const live = manifest.currentProductionObservation;
must(
  live.evidenceStatus === LIVE_PRODUCTION_EVIDENCE_STATUS &&
    live.canonicalGitHubMainCommit ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.canonicalGitHubMainCommit &&
    live.githubParityVerifiedAtObservation === true &&
    live.sitesVersion === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesVersion &&
    live.sitesCheckoutCommit ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesCheckoutCommit &&
    live.sourceFileCount === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceFileCount &&
    live.sourceTreeSha256 === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceTreeSha256 &&
    live.productionMigrationCount ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationFileCount &&
    live.migrationTreeSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 &&
    live.migrationTreeEvidenceScope === LIVE_MIGRATION_EVIDENCE_SCOPE &&
    live.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    live.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    live.latestProductionMigration ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration &&
    live.latestProductionMigrationSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256,
  "Current production must remain exact GitHub main 59b / Sites v39 / live43 evidence.",
);
must(
  manifest.source.evidenceScope === LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM &&
    JSON.stringify(manifest.source.generatedPathExclusions) ===
      JSON.stringify(GENERATED_PATH_EXCLUSIONS),
  "Candidate Sites source scope or hash policy drifted.",
);
const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
must(
  sourceTree.fileCount === 203 &&
    sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256 &&
    sourceTree.fileCount === manifest.releaseCandidate.sourceFileCount &&
    sourceTree.sha256 === manifest.releaseCandidate.sourceTreeSha256 &&
    sourceTree.sha256 !== live.sourceTreeSha256,
  `Candidate Sites fingerprint drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  manifest.migrations.evidenceScope ===
      LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Candidate migration scope or hash policy drifted.",
);
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const mirrorTree = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot!), {
  suffix: ".sql",
});
must(
  migrationTree.fileCount === 44 &&
    migrationTree.sha256 ===
      "7ea30e35ee2dd88fc936521d352ef1b5794b6bfea981afd7e1b9b5c8a22af16c" &&
    mirrorTree.fileCount === migrationTree.fileCount &&
    mirrorTree.sha256 === migrationTree.sha256 &&
    JSON.stringify(mirrorTree.files) === JSON.stringify(migrationTree.files) &&
    manifest.migrations.fileCount === migrationTree.fileCount &&
    manifest.migrations.treeSha256 === migrationTree.sha256 &&
    manifest.migrations.mirrorFileCount === mirrorTree.fileCount &&
    manifest.migrations.mirrorTreeSha256 === mirrorTree.sha256,
  `Candidate migration fingerprint drifted (root ${migrationTree.fileCount}/${migrationTree.sha256}; mirror ${mirrorTree.fileCount}/${mirrorTree.sha256}).`,
);
const candidate = manifest.releaseCandidate;
must(
  candidate.pullRequest === null &&
    !candidate.githubMerged &&
    candidate.allFourWorkflowsGreen === null &&
    candidate.zeroUnresolvedReviewThreads === null &&
    !candidate.candidateSourceMatchesLiveSites &&
    !candidate.candidateMigrationsMatchLiveLedger &&
    !candidate.githubMainMatchesCandidate &&
    !candidate.fullReleaseGatePassed &&
    candidate.databaseChangesRequired &&
    !candidate.databaseMigrationApplied &&
    JSON.stringify(candidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    JSON.stringify(candidate.databaseMigrationsApplied) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) &&
    candidate.databaseApplyAuthorized === true &&
    candidate.sitesPublishRequired &&
    !candidate.sitesPublished &&
    candidate.sitesPublishAuthorized === true &&
    candidate.deploymentAuthorized === true &&
    !candidate.activationExecuted,
  "Candidate must remain authorized but wholly unapplied, unpublished, unmerged, and fail-closed.",
);
const latest = resolve(
  repoRoot,
  manifest.migrations.root,
  candidate.latestCandidateMigration,
);
must(
  existsSync(latest) &&
    candidate.latestCandidateMigration === LOCAL_CANDIDATE_PENDING_MIGRATIONS[0] &&
    sha256File(latest) === candidate.latestCandidateMigrationSha256 &&
    candidate.latestCandidateMigrationSha256 ===
      "3d6394b402247d599f80466855dc14326d48add91f359b70a5cd75a9058fd441",
  "Provisional 045812 migration identity or exact bytes drifted.",
);
const hosting = JSON.parse(
  readFileSync(
    resolve(repoRoot, "artifacts/veroxa-sites/.openai/hosting.json"),
    "utf8",
  ),
);
must(hosting.project_id === manifest.sitesProjectId, "Sites project identity drifted.");
must(
  deploymentManifestPath.endsWith("VEROXA_DEPLOYMENT_MANIFEST.json"),
  "Deployment manifest path is not canonical.",
);
if (failures.length) {
  console.error("Veroxa deployment manifest guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Veroxa predeployment evidence passed: GitHub main/Sites v39/live43 stay exact; reviewed candidate is ${sourceTree.fileCount} Sites files plus ${migrationTree.fileCount} mirrored migrations, with freeze/drain, generated-version reconciliation, and publish still pending.`,
);
