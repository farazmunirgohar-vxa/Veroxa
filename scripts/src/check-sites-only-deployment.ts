import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const failures: string[] = [];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

for (const retiredPath of ["vercel.json", "api/audit-requests.ts", "api/pilot-access.ts"]) {
  if (existsSync(resolve(root, retiredPath))) failures.push(`Retired Vercel artifact still exists: ${retiredPath}`);
}

const protocol = read("artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md");
const sourceTruth = read("artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md");
const activeIndex = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const combined = `${protocol}\n${sourceTruth}\n${activeIndex}`;

if (!combined.includes("Vercel is retired")) failures.push("Current source truth must explicitly record that Vercel is retired.");
for (const activePhrase of [
  "Vercel remains temporary",
  "Vercel remains a temporary",
  "Vercel remains available temporarily",
  "Vercel deployment remains a temporary",
]) {
  if (combined.includes(activePhrase)) failures.push(`Current source truth restored retired deployment language: ${activePhrase}`);
}
if (!existsSync(resolve(root, "artifacts/veroxa-sites/.openai/hosting.json"))) {
  failures.push("Sites hosting identity is missing.");
}

if (failures.length) {
  console.error("Sites-only deployment guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Sites-only deployment guardrail passed; Vercel is retired.");
