const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GENERATED_PATH_EXCLUSIONS,
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LIVE_PRODUCTION_EVIDENCE_STATUS,
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_APPLIED_MIGRATIONS,
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
const manifest = readDeploymentManifest();
const failures: string[] = [];
const must = __name((condition: boolean, message: string) => {
  if (!condition) failures.push(message);
}, "must");
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
const live = manifest.currentProductionObservation;
must(
  live.evidenceStatus === LIVE_PRODUCTION_EVIDENCE_STATUS &&
    live.sourceTreeSha256 === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceTreeSha256 &&
    live.migrationTreeSha256 === CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256 &&
    live.migrationTreeEvidenceScope === LIVE_MIGRATION_EVIDENCE_SCOPE &&
    live.historicalRepositoryMigrationTreeSha256 ===
      V36_LIVE_PARITY_EVIDENCE.historicalRepositoryMigrationTreeSha256 &&
    live.historicalRepositoryMigrationTreeEvidenceScope ===
      HISTORICAL_REPOSITORY_MIGRATION_EVIDENCE_SCOPE &&
    live.latestProductionMigration ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigration &&
    live.latestProductionMigrationSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.latestMigrationSha256,
  "Current production must distinguish Sites v37 / exact remote 40-ledger from the historical v36 baseline.",
);
const historicalParity = manifest.historicalV36GitHubReconciliationEvidence;
must(
  historicalParity?.pullRequest === 157 &&
    historicalParity?.mergedCommit ===
      "aafebf93a6bc40f9578c29f4a25371f8203d0387" &&
    historicalParity?.zeroUnresolvedReviewThreads === true,
  "Historical PR #157 GitHub parity evidence changed.",
);
must(
  manifest.lastGitHubParityRelease.pullRequest === 155 &&
    manifest.lastGitHubParityRelease.supersededAsLiveBaseline &&
    manifest.lastGitHubParityRelease.sitesVersion === 22 &&
    manifest.lastGitHubParityRelease.sourceTreeSha256 ===
      "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490",
  "Historical PR #155 / Sites v22 parity evidence changed.",
);
must(
  manifest.historicalProductionObservations.some(
    (entry) =>
      entry.observedAt === "2026-07-22" &&
      entry.sitesVersion === 18 &&
      entry.sourceTreeSha256 === null &&
      entry.databaseLedgerObserved,
  ),
  "Historical unreconciled Sites v18 observation is missing.",
);
must(
  manifest.source.evidenceScope === LOCAL_CANDIDATE_SOURCE_EVIDENCE_SCOPE &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Candidate Sites source scope or hash algorithm drifted.",
);
must(
  JSON.stringify(manifest.source.generatedPathExclusions) ===
    JSON.stringify(GENERATED_PATH_EXCLUSIONS),
  "Generated-path exclusions drifted; local secret env files must never enter fingerprints.",
);
for (const secretPath of [
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
]) {
  must(
    manifest.source.generatedPathExclusions.includes(secretPath),
    `Candidate source exclusions are missing secret path ${secretPath}.`,
  );
}
const sourceRoot = resolve(repoRoot, manifest.source.root);
must(existsSync(sourceRoot), "Candidate Sites source root is missing.");
const sourceTree = hashTree(sourceRoot, {
  exclusions: manifest.source.generatedPathExclusions,
});
must(
  sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256 &&
    sourceTree.fileCount === manifest.releaseCandidate.sourceFileCount &&
    sourceTree.sha256 === manifest.releaseCandidate.sourceTreeSha256,
  `Candidate Sites fingerprint drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  sourceTree.sha256 !== live.sourceTreeSha256 ||
    sourceTree.fileCount !== live.sourceFileCount,
  "Changed corrective Sites source must not be represented as the live v37 tree.",
);
must(
  sourceTree.files.includes(".env.example"),
  "Tracked .env.example must remain inside candidate source evidence.",
);
must(
  manifest.migrations.evidenceScope ===
    LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE &&
    manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.mirrorRoot ===
      "artifacts/veroxa-sites/supabase/migrations" &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Candidate migration roots or evidence scope drifted.",
);
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const mirrorTree = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot!), {
  suffix: ".sql",
});
must(
  migrationTree.fileCount === 43 &&
    migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256 &&
    mirrorTree.fileCount === manifest.migrations.mirrorFileCount &&
    mirrorTree.sha256 === manifest.migrations.mirrorTreeSha256 &&
    mirrorTree.fileCount === migrationTree.fileCount &&
    mirrorTree.sha256 === migrationTree.sha256 &&
    JSON.stringify(mirrorTree.files) === JSON.stringify(migrationTree.files),
  `Candidate migration/mirror fingerprint drifted (root ${migrationTree.fileCount}/${migrationTree.sha256}; mirror ${mirrorTree.fileCount}/${mirrorTree.sha256}).`,
);
must(
    JSON.stringify(manifest.releaseCandidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    JSON.stringify(manifest.releaseCandidate.databaseMigrationsApplied) ===
      JSON.stringify(LOCAL_CANDIDATE_APPLIED_MIGRATIONS) &&
    LOCAL_CANDIDATE_PENDING_MIGRATIONS.every((migration) =>
      migrationTree.files.includes(migration),
    ) &&
    migrationTree.files.at(-1) === LOCAL_CANDIDATE_PENDING_MIGRATIONS[0],
  "Candidate pending-migration inventory or ordering drifted.",
);
const latestCandidatePath = resolve(
  repoRoot,
  manifest.migrations.root,
  manifest.releaseCandidate.latestCandidateMigration,
);
must(existsSync(latestCandidatePath), "Latest candidate migration is missing.");
if (existsSync(latestCandidatePath)) {
  must(
    sha256File(latestCandidatePath) ===
      manifest.releaseCandidate.latestCandidateMigrationSha256,
    "Latest candidate migration fingerprint drifted.",
  );
}
const hosting = JSON.parse(
  readFileSync(resolve(sourceRoot, ".openai/hosting.json"), "utf8"),
);
must(
  hosting.project_id === manifest.sitesProjectId,
  "Sites hosting identity and candidate manifest disagree.",
);
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
  `Veroxa forward-repair evidence passed: Sites v37 / exact remote 42-ledger ${live.migrationTreeSha256} is paused at Client v3 repair; the reviewed corrective candidate is ${sourceTree.fileCount} Sites files / ${migrationTree.fileCount} migrations.`,
);
