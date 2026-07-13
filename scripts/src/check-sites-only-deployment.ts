import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const failures: string[] = [];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

for (const retiredPath of ["api/audit-requests.ts", "api/pilot-access.ts"]) {
  if (existsSync(resolve(root, retiredPath))) failures.push(`Retired Vercel artifact still exists: ${retiredPath}`);
}

const vercelShutdownPath = resolve(root, "vercel.json");
if (!existsSync(vercelShutdownPath)) {
  failures.push("The temporary Vercel automatic-deployment shutdown sentinel is missing.");
} else {
  try {
    const sentinel = JSON.parse(readFileSync(vercelShutdownPath, "utf8")) as Record<string, unknown>;
    const git = sentinel.git as Record<string, unknown> | undefined;
    const topLevelKeys = Object.keys(sentinel).sort();
    const gitKeys = git ? Object.keys(git).sort() : [];
    if (
      JSON.stringify(topLevelKeys) !== JSON.stringify(["$schema", "git"]) ||
      sentinel.$schema !== "https://openapi.vercel.sh/vercel.json" ||
      JSON.stringify(gitKeys) !== JSON.stringify(["deploymentEnabled"]) ||
      git?.deploymentEnabled !== false
    ) {
      failures.push("vercel.json must remain the exact inert automatic-deployment shutdown sentinel.");
    }
  } catch {
    failures.push("vercel.json is not valid JSON.");
  }
}

const protocol = read("artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md");
const sourceTruth = read("artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md");
const activeIndex = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const agents = read("AGENTS.md");
const milestone = read("artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md");
const status = read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md");
const currentState = read("artifacts/veroxa/docs/README_CURRENT_STATE.md");
const preBuild = read("artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md");
const rrCheckpoint = read("artifacts/veroxa/docs/RR_CHECKPOINT.md");
const before = (source: string, marker: string) => source.split(marker)[0];
const currentGuidance = [
  protocol,
  sourceTruth,
  before(activeIndex, "## 2026-06-21"),
  before(agents, "## 2026-06-21"),
  milestone,
  before(status, "## 2026-07-13 — Momo Seven-System"),
  currentState,
  before(preBuild, "## 2026-06-04"),
  rrCheckpoint,
];
const combined = currentGuidance.join("\n");

if (!combined.includes("Vercel is retired")) failures.push("Current source truth must explicitly record that Vercel is retired.");
for (const activePhrase of [
  "Vercel remains temporary",
  "Vercel remains a temporary",
  "Vercel remains available temporarily",
  "Vercel deployment remains a temporary",
  "Vercel remains rollback",
  "Vercel is temporary rollback",
  "with Vercel retained temporarily",
  "keep its existing compatibility configuration",
  "Root `vercel.json` keeps",
  "The Vite/Vercel rollback keeps",
  "The live domain remains on the prior shell",
  "current unmerged candidate",
  "unmerged, undeployed candidate",
]) {
  if (combined.includes(activePhrase)) failures.push(`Current source truth restored retired deployment language: ${activePhrase}`);
}
if (!existsSync(resolve(root, "artifacts/veroxa-sites/.openai/hosting.json"))) {
  failures.push("Sites hosting identity is missing.");
}
if (!currentState.includes("PR #142") || !currentState.includes("Sites version 8")) {
  failures.push("Current-state index must name the verified PR #142 / Sites version 8 baseline.");
}
if (!preBuild.includes("GitHub `main` plus verified Sites checkpoints are the recovery path")) {
  failures.push("Pre-build checklist must use GitHub main plus verified Sites checkpoints for recovery.");
}
for (const workflow of readdirSync(resolve(root, ".github/workflows")).filter((name) => /\.ya?ml$/.test(name))) {
  if (/vercel/i.test(read(`.github/workflows/${workflow}`))) {
    failures.push(`GitHub workflow still depends on retired Vercel behavior: ${workflow}`);
  }
}

if (failures.length) {
  console.error("Sites-only deployment guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sites-only deployment guardrail passed; Vercel is retired and automatic deployments are disabled.");
