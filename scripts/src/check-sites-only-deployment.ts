import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const failures: string[] = [];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(!existsSync(resolve(root, retiredPath)), `Retired Vercel artifact exists: ${retiredPath}`);
}

const vercelShutdownPath = resolve(root, "vercel.json");
must(existsSync(vercelShutdownPath), "The Vercel automatic-deployment shutdown sentinel is missing.");
if (existsSync(vercelShutdownPath)) {
  try {
    const sentinel = JSON.parse(readFileSync(vercelShutdownPath, "utf8")) as {
      $schema?: unknown;
      git?: Record<string, unknown>;
    };
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

const documents = [
  "AGENTS.md",
  "artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
].map((path) => ({ path, source: read(path).slice(0, 14_000) }));
const combined = documents.map(({ source }) => source).join("\n");
for (const marker of [
  "Vercel is retired",
  "9749b68ce2cfc383deeae6aa63c413019ef61385",
  "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
  "Sites version 15",
  "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
  "post_release_cleanup_deployed",
  // Historical pre-PR #148 drift evidence remains recorded below the current override.
  "674e1a7c0d140c9b281029277baeb2e68962dac2",
  "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  "Sites version 13",
]) {
  must(combined.includes(marker), `Current source truth is missing delivery marker: ${marker}`);
}
for (const banned of [
  "Vercel is the new primary deployment target",
  "Vercel remains rollback",
  "Vercel is temporary rollback",
  "GitHub + Codex + Vercel",
  "Use Vercel as the deployment target",
]) {
  must(!combined.includes(banned), `Current source truth restores retired Vercel behavior: ${banned}`);
}
must(
  /shutdown sentinel[\s\S]{0,500}(?:external|dashboard)[\s\S]{0,300}disconnect/i.test(combined),
  "Current source truth must retain the sentinel until external Vercel Git disconnection is verified.",
);

const hostingPath = "artifacts/veroxa-sites/.openai/hosting.json";
must(existsSync(resolve(root, hostingPath)), "Sites hosting identity is missing.");
if (existsSync(resolve(root, hostingPath))) {
  const hosting = JSON.parse(read(hostingPath)) as { project_id?: unknown };
  must(
    hosting.project_id === "appgprj_6a53d07c7c28819182801cf35dfd30de",
    "Sites project identity drifted.",
  );
}

const readiness = JSON.parse(
  read("artifacts/veroxa-sites/app/momo-readiness-tracker.json"),
) as {
  schemaVersion: number;
  releaseEvidenceBoundary: {
    authority: string;
    bundlesCurrentDeploymentIdentity: boolean;
    reviewedManualDeploymentsOnly: boolean;
    databaseChangesRequiredForThisReadinessRecord: boolean;
    rule: string;
  };
};
const readinessText = read("artifacts/veroxa-sites/app/momo-readiness-tracker.json");
must(
  readiness.schemaVersion === 6 &&
    readiness.releaseEvidenceBoundary.authority.includes("VEROXA_DEPLOYMENT_MANIFEST.json") &&
    !readiness.releaseEvidenceBoundary.bundlesCurrentDeploymentIdentity &&
    readiness.releaseEvidenceBoundary.reviewedManualDeploymentsOnly &&
    !readiness.releaseEvidenceBoundary.databaseChangesRequiredForThisReadinessRecord &&
    /never asserts its own current Sites version/i.test(
      readiness.releaseEvidenceBoundary.rule,
    ) &&
    !/165ff82ab46b0a0985605ffcfb6efa687982eca5|57ccb8d1cce596baf782b03525c80161c11af8f3|9749b68ce2cfc383deeae6aa63c413019ef61385|e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0|ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f|Sites version 15|sitesCandidatePublished|futureSitesVersion/.test(
      readinessText,
    ),
  "Sites-bundled readiness evidence must externalize exact deployment identity and remain stable across publications.",
);

const manifest = JSON.parse(
  read("artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json"),
) as {
  sitesProjectId: string;
  releaseState: string;
  deploymentFreeze: { automaticDeploymentsAllowed: boolean };
  verifiedReconciliationRelease: {
    sitesVersion: number;
    sourceTreeSha256: string;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  releaseCandidate: { sitesPublishRequired: boolean; sitesPublished: boolean };
  cleanupState: {
    branchDeletionCapabilityAvailable: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
  };
};
must(
  manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de" &&
    manifest.releaseState === "verified_reconciliation_cleanup_deployed" &&
    manifest.verifiedReconciliationRelease.sitesVersion === 15 &&
    manifest.verifiedReconciliationRelease.sourceTreeSha256 ===
      "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f" &&
    manifest.verifiedReconciliationRelease.sitesSourceParityVerified &&
    manifest.verifiedReconciliationRelease.migrationContentParityVerified &&
    manifest.verifiedReconciliationRelease.migrationFilenameParityVerified &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    manifest.releaseCandidate.sitesPublishRequired &&
    manifest.releaseCandidate.sitesPublished &&
    !manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired,
  "Deployment manifest must bind v15, record cleanup deployment, and preserve the Vercel sentinel.",
);

for (const workflow of readdirSync(resolve(root, ".github/workflows")).filter((name) =>
  /\.ya?ml$/.test(name),
)) {
  must(
    !/vercel/i.test(read(`.github/workflows/${workflow}`)),
    `GitHub workflow depends on retired Vercel behavior: ${workflow}`,
  );
}

if (failures.length) {
  console.error("Sites-only deployment guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sites-only deployment guardrail passed; Sites is sole delivery and Vercel stays inert.");
