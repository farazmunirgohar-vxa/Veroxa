import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
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
  manifest.currentProductionObservation.sitesVersion >= 39 &&
    manifest.currentProductionObservation.sitesLiveUrl === "https://veroxasystems.com" &&
    manifest.currentProductionObservation.sitesCustomDomainsVerified === true &&
    manifest.releaseCandidate.sitesPublishAuthorized === true &&
    manifest.releaseCandidate.edgeDeployAuthorized === true &&
    manifest.releaseCandidate.deploymentAuthorized === true &&
    manifest.deploymentFreeze.automaticDeploymentsAllowed === false,
  "Sites/Edge authorization or sole-hosting evidence drifted.",
);
must(
  manifest.operationalHold?.providerWrites === false &&
    manifest.operationalHold.reviewReplies === false &&
    manifest.operationalHold.websiteWrites === false &&
    manifest.operationalHold.externalScheduling === false &&
    manifest.edgeDeployment?.providerCallObserved === false &&
    manifest.edgeCandidate?.providerCallObserved === false,
  "Sites/Edge evidence overclaims an external action or provider call.",
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
  must(
    existsSync(resolve(repoRoot, rootPath)) &&
      existsSync(resolve(repoRoot, sitesPath)) &&
      sha256File(resolve(repoRoot, rootPath)) === expectedSha &&
      sha256File(resolve(repoRoot, sitesPath)) === expectedSha,
    `Edge root/Sites closure drifted: ${rootPath}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("PASS: Sites is the sole web target and Edge remains JWT-guarded.");
}
