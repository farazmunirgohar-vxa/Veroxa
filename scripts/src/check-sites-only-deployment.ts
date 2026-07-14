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
  "674e1a7c0d140c9b281029277baeb2e68962dac2",
  "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  "Sites version 13",
  "candidate",
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
  observedProductionState: {
    canonicalGitHubMainCommit: string;
    liveSitesVersion: number;
    liveSitesCheckoutSourceCommit: string;
    productionMigrations: number;
    sourceParityVerified: boolean;
  };
  reconciliationCandidate: {
    state: string;
    deploymentFrozen: boolean;
    sitesCandidatePublished: boolean;
  };
};
must(
  readiness.schemaVersion === 4 &&
    readiness.observedProductionState.canonicalGitHubMainCommit ===
      "674e1a7c0d140c9b281029277baeb2e68962dac2" &&
    readiness.observedProductionState.liveSitesVersion === 13 &&
    readiness.observedProductionState.liveSitesCheckoutSourceCommit ===
      "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805" &&
    readiness.observedProductionState.productionMigrations === 11 &&
    !readiness.observedProductionState.sourceParityVerified &&
    readiness.reconciliationCandidate.state === "candidate_not_merged_not_deployed" &&
    readiness.reconciliationCandidate.deploymentFrozen &&
    !readiness.reconciliationCandidate.sitesCandidatePublished,
  "Sites-bundled readiness evidence must preserve production drift and the undeployed freeze.",
);

const manifest = JSON.parse(
  read("artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json"),
) as {
  sitesProjectId: string;
  releaseState: string;
  deploymentFreeze: { automaticDeploymentsAllowed: boolean };
  cleanupState: { vercelSentinelRemovalAllowed: boolean };
};
must(
  manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de" &&
    manifest.releaseState === "candidate_not_merged_not_deployed" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    !manifest.cleanupState.vercelSentinelRemovalAllowed,
  "Deployment manifest must bind Sites identity and keep deployment/Vercel cleanup frozen.",
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
