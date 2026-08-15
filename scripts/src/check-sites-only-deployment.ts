import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertReviewedLocalCandidateManifest,
  hasActiveMediaInspectionForwardCandidate,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const manifest = readDeploymentManifest();
const activeForwardCandidate = hasActiveMediaInspectionForwardCandidate();
try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  must(
    !existsSync(resolve(repoRoot, retiredPath)),
    `Retired Vercel artifact exists: ${retiredPath}`,
  );
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
      JSON.stringify(Object.keys(sentinel).sort()) ===
        JSON.stringify(["$schema", "git"]),
    "vercel.json is not the exact inert shutdown sentinel.",
  );
}

if (manifest.schemaVersion === 13) {
  const recovery = (
    manifest as unknown as Record<string, any>
  ).durableMediaIngestionRecovery as Record<string, any> | undefined;
  must(
    manifest.currentProductionObservation.sitesVersion === 56 &&
      manifest.releaseCandidate.sitesPublished === true &&
      manifest.releaseCandidate.edgeDeployRequired === false &&
      manifest.releaseCandidate.edgeDeployed === false &&
      manifest.releaseCandidate.sitesPublishAuthorized === false &&
      manifest.releaseCandidate.edgeDeployAuthorized === false &&
      manifest.releaseCandidate.deploymentAuthorized === false &&
      manifest.deploymentFreeze.automaticDeploymentsAllowed === false &&
      manifest.fullReleaseGatePassed === false,
    "Schema-13 recovery diagnostics diverge from the completed v56 production release or the post-retry hold.",
  );
  must(
    manifest.operationalHold?.providerWrites === false &&
      manifest.operationalHold.reviewReplies === false &&
      manifest.operationalHold.websiteWrites === false &&
      manifest.operationalHold.externalScheduling === false &&
      manifest.operationalHold.externalPublishing === false &&
      recovery?.providerCallAllowed === false &&
      recovery?.externalWriteAllowed === false,
    "Schema-13 Sites closeout overclaims an external action or provider call.",
  );
  const mirroredClosure = [
    "supabase/functions/_shared/bridge-public-key-transition.ts",
    "supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts",
    "supabase/functions/momo-content-ai-dispatch-lifecycle/index.ts",
    "supabase/functions/momo-content-ai-lifecycle/index.ts",
    "supabase/functions/momo-content-ai-webhook-lifecycle/index.ts",
    "supabase/functions/momo-media-ai-lifecycle/index.ts",
    "supabase/config.toml",
  ];
  for (const rootPath of mirroredClosure) {
    const sitesPath = `artifacts/veroxa-sites/${rootPath}`;
    must(
      existsSync(resolve(repoRoot, rootPath)) &&
        existsSync(resolve(repoRoot, sitesPath)) &&
        sha256File(resolve(repoRoot, rootPath)) ===
          sha256File(resolve(repoRoot, sitesPath)),
      `Schema-13 Edge root/Sites closure drifted: ${rootPath}`,
    );
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error("FAIL:", failure);
    process.exit(1);
  }
  console.log(
    activeForwardCandidate
      ? "PASS: Sites remains the sole web target; the active fixture-integrity repair has no deployment or IMG_4257 retry claim."
      : "PASS: Sites remains the sole web target; exact diagnostic source is live as v56 and all further deployment and retry activity is held.",
  );
  process.exit(0);
}

// Schema-11 and older releases retain their historical exact-hash closure
// guard in the commit that recorded those production observations. This
// forward source is intentionally schema-13-only so new Edge bytes cannot be
// certified against superseded deployed hashes.
failures.push(
  "Current Sites-only deployment guard accepts only schema-13 closeout evidence.",
);
for (const failure of failures) console.error("FAIL:", failure);
process.exitCode = 1;
