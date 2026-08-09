import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  PRIVATE_MEDIA_EDGE_CANDIDATE,
  assertReviewedLocalCandidateManifest,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const manifest = readDeploymentManifest();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(!existsSync(resolve(repoRoot, retiredPath)), `Retired Vercel artifact exists: ${retiredPath}`);
}
const sentinelPath = resolve(repoRoot, "vercel.json");
must(existsSync(sentinelPath), "Vercel shutdown sentinel is missing.");
if (existsSync(sentinelPath)) {
  const sentinel = JSON.parse(readFileSync(sentinelPath, "utf8")) as {
    $schema?: string;
    git?: { deploymentEnabled?: boolean };
  };
  must(
    sentinel.$schema === "https://openapi.vercel.sh/vercel.json" &&
      sentinel.git?.deploymentEnabled === false &&
      JSON.stringify(Object.keys(sentinel).sort()) === JSON.stringify(["$schema", "git"]),
    "vercel.json is not the exact inert shutdown sentinel.",
  );
}

must(
  manifest.currentProductionObservation.sitesVersion === 39 &&
    manifest.currentProductionObservation.sitesVersionId ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesVersionId &&
    manifest.currentProductionObservation.sitesCheckoutCommit ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesCheckoutCommit &&
    manifest.currentProductionObservation.sitesArchiveSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesArchiveSha256 &&
    manifest.currentProductionObservation.canonicalGitHubMainCommitScope ===
      "github_main_pr166_lineage_only_not_sites_v39_source_association",
  "Sites v39 must remain an independent observed baseline.",
);
must(
  manifest.releaseCandidate.sitesPublishRequired === true &&
    manifest.releaseCandidate.sitesPublished === false &&
    manifest.releaseCandidate.sitesPublishAuthorized === true &&
    manifest.releaseCandidate.edgeDeployRequired === true &&
    manifest.releaseCandidate.edgeDeployed === false &&
    manifest.releaseCandidate.edgeDeployAuthorized === true &&
    manifest.releaseCandidate.deploymentAuthorized === true &&
    manifest.releaseCandidate.fullReleaseGatePassed === false &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Manual scoped authorization must not be confused with publication or automatic deployment.",
);
must(
  manifest.edgeDeployment?.functionVersion === 6 &&
    manifest.edgeDeployment.currentRepositorySourceParity === false &&
    manifest.edgeCandidate?.promptContractVersion ===
      PRIVATE_MEDIA_EDGE_CANDIDATE.promptContractVersion &&
    manifest.edgeCandidate.deployed === false,
  "Live prompt-v1 Edge v6 and pending prompt-v2 Edge source were conflated.",
);

const closure = [
  [
    "supabase/functions/momo-content-ai-lifecycle/index.ts",
    "artifacts/veroxa-sites/supabase/functions/momo-content-ai-lifecycle/index.ts",
    PRIVATE_MEDIA_EDGE_CANDIDATE.indexSha256,
  ],
  [
    "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
    "artifacts/veroxa-sites/supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
    PRIVATE_MEDIA_EDGE_CANDIDATE.contractSha256,
  ],
  [
    "supabase/config.toml",
    "artifacts/veroxa-sites/supabase/config.toml",
    PRIVATE_MEDIA_EDGE_CANDIDATE.configSha256,
  ],
] as const;
for (const [rootPath, sitesPath, expectedSha] of closure) {
  const rootFile = resolve(repoRoot, rootPath);
  const sitesFile = resolve(repoRoot, sitesPath);
  must(
    existsSync(rootFile) && existsSync(sitesFile) &&
      sha256File(rootFile) === expectedSha && sha256File(sitesFile) === expectedSha,
    `Pending Edge prompt-v2 root/Sites closure drifted: ${rootPath}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: Sites is the sole web target; Sites and Edge deployments remain manual, ordered, authorized, and pending.",
  );
}
