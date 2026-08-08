const __name = <T>(target: T, value: string): T =>
  Object.defineProperty(target as object, "name", {
    value,
    configurable: true,
  }) as T;
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE,
  assertReviewedLocalCandidateManifest,
  hashTree,
  readDeploymentManifest,
  repoRoot,
} from "./release-manifest";

const failures: string[] = [];
const must = __name((condition: boolean, message: string) => {
  if (!condition) failures.push(message);
}, "must");
const read = __name(
  (relativePath: string) => readFileSync(resolve(repoRoot, relativePath), "utf8"),
  "read",
);
for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(!existsSync(resolve(repoRoot, retiredPath)), `Retired Vercel artifact exists: ${retiredPath}`);
}
const vercelShutdownPath = resolve(repoRoot, "vercel.json");
must(existsSync(vercelShutdownPath), "The Vercel shutdown sentinel is missing.");
if (existsSync(vercelShutdownPath)) {
  try {
    const sentinel = JSON.parse(readFileSync(vercelShutdownPath, "utf8"));
    must(
      JSON.stringify(Object.keys(sentinel).sort()) === JSON.stringify(["$schema", "git"]) &&
        sentinel.$schema === "https://openapi.vercel.sh/vercel.json" &&
        JSON.stringify(Object.keys(sentinel.git ?? {}).sort()) ===
          JSON.stringify(["deploymentEnabled"]) &&
        sentinel.git?.deploymentEnabled === false,
      "vercel.json must remain the exact inert shutdown sentinel.",
    );
  } catch {
    failures.push("vercel.json is not valid JSON.");
  }
}
for (const workflow of [
  ".github/workflows/ci.yml",
  ".github/workflows/sites-verify.yml",
  ".github/workflows/supabase-verify.yml",
  ".github/workflows/veroxa-verify.yml",
]) {
  const source = read(workflow);
  must(
    !/sites_(?:save|deploy)|deploy_site|vercel\s+(?:deploy|--prod)/iu.test(source),
    `${workflow} must not publish Sites or bypass the Vercel shutdown sentinel.`,
  );
}
const manifest = readDeploymentManifest();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
const checkpoint = JSON.parse(read("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json"));
must(
  checkpoint.schemaVersion === 11 &&
    checkpoint.recordKind === "veroxa_momo_ready_team_decisions_feature_checkpoint" &&
    checkpoint.status === REVIEWED_LOCAL_CANDIDATE_RELEASE_STATE &&
    checkpoint.releaseCandidate?.pullRequest === null &&
    checkpoint.releaseCandidate.githubMerged === false &&
    checkpoint.releaseCandidate.databaseChangesRequired === true &&
    checkpoint.releaseCandidate.databaseMigrationApplied === false &&
    checkpoint.releaseCandidate.candidateMigrationsMatchLiveLedger === false &&
    checkpoint.releaseCandidate.sitesPublished === false &&
    checkpoint.releaseCandidate.deploymentAuthorized === true &&
    checkpoint.releaseCandidate.activationExecuted === false &&
    checkpoint.releaseCandidate.fullReleaseGatePassed === false,
  "RR checkpoint must preserve the authorized but wholly unexecuted feature release.",
);
const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
const migrationMirrorTree = hashTree(resolve(repoRoot, manifest.migrations.mirrorRoot!), {
  suffix: ".sql",
});
must(
  sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256 &&
    sourceTree.sha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceTreeSha256,
  `Local Sites candidate fingerprint drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  migrationTree.fileCount === 44 &&
    migrationTree.sha256 === manifest.migrations.treeSha256 &&
    migrationMirrorTree.fileCount === migrationTree.fileCount &&
    migrationMirrorTree.sha256 === migrationTree.sha256 &&
    JSON.stringify(migrationMirrorTree.files) === JSON.stringify(migrationTree.files) &&
    JSON.stringify(manifest.releaseCandidate.pendingMigrations) ===
      JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    migrationTree.sha256 !== CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256,
  `Local migration candidate fingerprint drifted (root ${migrationTree.fileCount}/${migrationTree.sha256}; mirror ${migrationMirrorTree.fileCount}/${migrationMirrorTree.sha256}).`,
);
const readinessText = read("artifacts/veroxa-sites/app/momo-readiness-tracker.json");
const readiness = JSON.parse(readinessText);
for (const exactReleaseIdentity of [
  manifest.releaseCandidate.sourceTreeSha256,
  manifest.releaseCandidate.migrationTreeSha256,
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sourceTreeSha256,
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE.migrationTreeSha256,
]) {
  must(!readinessText.includes(exactReleaseIdentity), "Sites-bundled readiness evidence must externalize exact release identity.");
}
must(
  readiness.schemaVersion === 9 &&
    readiness.overallStatus === "blocked" &&
    /No-Go/iu.test(readiness.overallRule),
  "Sites-bundled readiness evidence must remain fail-closed No-Go.",
);
const candidate = manifest.releaseCandidate;
must(
  !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.deploymentFreeze.databaseApplyAuthorized === true &&
    manifest.deploymentFreeze.sitesPublishAuthorized === true &&
    candidate.databaseApplyAuthorized === true &&
    candidate.databaseChangesRequired === true &&
    candidate.databaseMigrationApplied === false &&
    candidate.candidateMigrationsMatchLiveLedger === false &&
    candidate.sitesPublishAuthorized === true &&
    candidate.sitesPublished === false &&
    candidate.deploymentAuthorized === true &&
    candidate.activationExecuted === false &&
    candidate.fullReleaseGatePassed === false &&
    Object.values(manifest.activationState).every((value) => value === false),
  "Deployment authorization must not be confused with apply, publish, automatic deployment, external action, or activation evidence.",
);
if (failures.length) {
  console.error("Sites-only deployment guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Sites-only deployment guardrail passed: production remains Sites v39/live43; ${sourceTree.fileCount}-file Sites and ${migrationTree.fileCount}-migration candidates remain unpublished/unapplied behind the frozen cutover sequence.`,
);
