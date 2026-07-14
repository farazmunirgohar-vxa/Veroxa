import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TREE_HASH_ALGORITHM,
  deploymentManifestPath,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

const manifest = readDeploymentManifest();
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

must(manifest.schemaVersion === 1, "Deployment manifest schema version must be 1.");
must(
  manifest.recordKind === "veroxa_production_reconciliation_manifest",
  "Deployment manifest record kind is invalid.",
);
must(
  manifest.releaseState === "candidate_not_merged_not_deployed",
  "The committed reconciliation candidate must not claim a merge or deployment.",
);
must(
  manifest.canonicalRepository === "farazmunirgohar-vxa/Veroxa" &&
    manifest.canonicalBranch === "main",
  "GitHub main must remain the canonical release source.",
);
must(
  manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de",
  "Sites project identity drifted.",
);

const observed = manifest.observedProductionBaseline;
must(
  observed.githubMainCommit === "674e1a7c0d140c9b281029277baeb2e68962dac2",
  "Observed pre-reconciliation GitHub main commit drifted.",
);
must(
  observed.sitesCheckoutCommit === "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805" &&
    observed.sitesVersion === 13,
  "Observed live Sites V13 source identity drifted.",
);
must(
  observed.productionMigrationCount === 11 &&
    observed.latestProductionMigration ===
      "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql" &&
    observed.latestProductionMigrationSha256 ===
      "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
  "Observed production migration-11 identity drifted.",
);
must(
  observed.sourceParityVerified === false,
  "The pre-reconciliation production baseline must preserve the observed GitHub/Sites drift.",
);
must(
  manifest.releaseCandidate.status === "built_for_review" &&
    manifest.releaseCandidate.futureMergedGitHubCommit === null &&
    manifest.releaseCandidate.futureSitesVersion === null &&
    !manifest.releaseCandidate.databaseApplied &&
    !manifest.releaseCandidate.sitesPublished,
  "The candidate must not predict or overstate its future merge, database, or Sites release.",
);

must(
  manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.mappingTarget === "Sites repository root" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Deployment source mapping or hash algorithm drifted.",
);
const sourceRoot = resolve(repoRoot, manifest.source.root);
must(existsSync(sourceRoot), "Canonical Sites source root is missing.");
const sourceTree = hashTree(sourceRoot, {
  exclusions: manifest.source.generatedPathExclusions,
});
must(
  sourceTree.fileCount === manifest.source.fileCount &&
    sourceTree.sha256 === manifest.source.treeSha256,
  `Canonical Sites source tree drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  sourceTree.files.includes(".npmrc"),
  "Canonical Sites source must include the tracked Sites .npmrc.",
);
for (const excluded of [
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
]) {
  must(
    manifest.source.generatedPathExclusions.includes(excluded),
    `Sites sync exclusions must name generated path: ${excluded}`,
  );
}

must(
  manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM,
  "Migration-tree mapping or hash algorithm drifted.",
);
const migrationRoot = resolve(repoRoot, manifest.migrations.root);
const migrationTree = hashTree(migrationRoot, { suffix: ".sql" });
must(
  migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256,
  `Candidate migration tree drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
const productionMigration = resolve(migrationRoot, observed.latestProductionMigration);
must(existsSync(productionMigration), "Exact production migration 11 is absent from GitHub.");
if (existsSync(productionMigration)) {
  must(
    sha256File(productionMigration) === observed.latestProductionMigrationSha256,
    "Exact production migration 11 content does not match its verified production hash.",
  );
}

const hosting = JSON.parse(
  readFileSync(resolve(sourceRoot, ".openai/hosting.json"), "utf8"),
) as { project_id?: unknown };
must(
  hosting.project_id === manifest.sitesProjectId,
  "Canonical Sites hosting manifest and deployment manifest disagree.",
);

must(
  manifest.deploymentFreeze.state === "frozen_except_authorized_reconciliation" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.deploymentFreeze.allowedDeployment.includes("reviewed and merged") &&
    manifest.deploymentFreeze.liftCondition.includes("production parity"),
  "Temporary deployment freeze is not fail-closed.",
);
for (const [name, value] of Object.entries(manifest.activationState)) {
  must(value === false, `Activation state must remain false before reconciliation: ${name}`);
}
must(
  !manifest.cleanupState.branchDeletionAllowed &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.vercelSentinelRemovalAllowed &&
    manifest.cleanupState.blocker.includes("post-release"),
  "Cleanup must stay deferred until exact post-release verification.",
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
  `Veroxa deployment manifest passed: ${sourceTree.fileCount} Sites files and ${migrationTree.fileCount} candidate migrations are deterministically bound.`,
);
