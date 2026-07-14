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

const historical = {
  githubMainCommit: "674e1a7c0d140c9b281029277baeb2e68962dac2",
  sitesCheckoutCommit: "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  sitesVersion: 13,
  productionMigrationCount: 11,
  latestProductionMigration:
    "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  latestProductionMigrationSha256:
    "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
};
const verified = {
  pullRequest: 149,
  githubMainCommit: "9749b68ce2cfc383deeae6aa63c413019ef61385",
  sitesCheckoutCommit: "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
  sitesVersion: 15,
  sourceFileCount: 55,
  sourceTreeSha256:
    "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
  productionMigrationCount: 13,
  latestProductionMigration:
    "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
  latestProductionMigrationSha256:
    "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
};
const appliedMigrationChecksums: Record<string, string> = {
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql":
    "192505ca4631e55f35b28f0c849a7d380bc1a709e5ae89adca742d7d349da45e",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql":
    "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
};

must(manifest.schemaVersion === 2, "Deployment manifest schema version must be 2.");
must(
  manifest.recordKind === "veroxa_production_reconciliation_manifest",
  "Deployment manifest record kind is invalid.",
);
must(
  manifest.releaseState === "verified_reconciliation_cleanup_deployed",
  "The manifest must identify the deployed PR #149 reconciliation cleanup.",
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
  observed.githubMainCommit === historical.githubMainCommit &&
    observed.sitesCheckoutCommit === historical.sitesCheckoutCommit &&
    observed.sitesVersion === historical.sitesVersion &&
    observed.productionMigrationCount === historical.productionMigrationCount &&
    observed.latestProductionMigration === historical.latestProductionMigration &&
    observed.latestProductionMigrationSha256 ===
      historical.latestProductionMigrationSha256 &&
    !observed.sourceParityVerified,
  "The pre-PR #148 drift baseline must remain exact historical evidence.",
);

const release = manifest.verifiedReconciliationRelease;
must(
  release.pullRequest === verified.pullRequest &&
    release.githubMainCommit === verified.githubMainCommit &&
    release.sitesCheckoutCommit === verified.sitesCheckoutCommit &&
    release.sitesVersion === verified.sitesVersion &&
    release.sourceFileCount === verified.sourceFileCount &&
    release.sourceTreeSha256 === verified.sourceTreeSha256 &&
    release.productionMigrationCount === verified.productionMigrationCount &&
    release.latestProductionMigration === verified.latestProductionMigration &&
    release.latestProductionMigrationSha256 ===
      verified.latestProductionMigrationSha256 &&
    !release.databaseApplied &&
    release.databaseVerified &&
    release.sitesPublished &&
    release.sitesVerified &&
    release.customDomainsVerified &&
    release.sitesSourceParityVerified &&
    release.migrationContentParityVerified &&
    release.migrationFilenameParityVerified,
  "PR #149 must preserve exact Sites and migration content/filename parity without claiming a database apply.",
);

must(
  manifest.releaseCandidate.status === "post_release_cleanup_deployed" &&
    manifest.releaseCandidate.futureMergedGitHubCommit === null &&
    manifest.releaseCandidate.futureSitesVersion === null &&
    !manifest.releaseCandidate.databaseChangesRequired &&
    manifest.releaseCandidate.sitesPublishRequired &&
    manifest.releaseCandidate.sitesPublished,
  "The cleanup lifecycle must remain unpredicted, database-neutral, and recorded as deployed.",
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
  `Deployed Sites tree drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  sourceTree.fileCount === verified.sourceFileCount &&
    sourceTree.sha256 === verified.sourceTreeSha256,
  "GitHub must retain the exact 55-file Sites v15 source tree deployed from PR #149.",
);
must(sourceTree.files.includes(".npmrc"), "Canonical Sites source must include .npmrc.");
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
  migrationTree.fileCount === 13 &&
    migrationTree.sha256 ===
      "fae322010f6c2ffbad1dbf695024ef7cfaf2cdb08f172fe6d113909c09fec093" &&
    migrationTree.fileCount === manifest.migrations.fileCount &&
    migrationTree.sha256 === manifest.migrations.treeSha256,
  `Production-aligned migration tree drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
for (const [filename, sha256] of Object.entries(appliedMigrationChecksums)) {
  const path = resolve(migrationRoot, filename);
  must(existsSync(path), `Production-applied migration is absent from GitHub: ${filename}`);
  if (existsSync(path)) {
    must(sha256File(path) === sha256, `Production-applied migration content drifted: ${filename}`);
  }
}
for (const provisional of [
  "20260714120000_reconcile_audit_v3_and_function_search_paths.sql",
  "20260714121000_ai_budget_and_momo_manual_pilot_contract.sql",
]) {
  must(!existsSync(resolve(migrationRoot, provisional)), `Provisional migration filename remains: ${provisional}`);
}

const hosting = JSON.parse(
  readFileSync(resolve(sourceRoot, ".openai/hosting.json"), "utf8"),
) as { project_id?: unknown };
must(
  hosting.project_id === manifest.sitesProjectId,
  "Canonical Sites hosting manifest and deployment manifest disagree.",
);

must(
  manifest.deploymentFreeze.state === "reviewed_manual_deployment_only" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.deploymentFreeze.allowedDeployment.includes("reviewed and merged") &&
    manifest.deploymentFreeze.releaseCondition.includes("production parity"),
  "Post-reconciliation delivery must remain reviewed, manual, and fail-closed.",
);
for (const [name, value] of Object.entries(manifest.activationState)) {
  must(value === false, `Activation state must remain false: ${name}`);
}
must(
  manifest.cleanupState.inventoryReviewed &&
    !manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.branchDeletionAllowed &&
    manifest.cleanupState.legacyViteArchived &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired &&
    /external Vercel Git disconnection/i.test(manifest.cleanupState.blocker),
  "Cleanup must preserve branch, legacy-removal, and Vercel safety gates.",
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
  `Veroxa deployment manifest passed: PR #149 / Sites v15 is verified at ${sourceTree.fileCount} files with migration filename parity.`,
);
