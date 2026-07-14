import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const workflows = {
  CI: ".github/workflows/ci.yml",
  "Sites Verify": ".github/workflows/sites-verify.yml",
  "Supabase Verify": ".github/workflows/supabase-verify.yml",
  "Veroxa Verify": ".github/workflows/veroxa-verify.yml",
} as const;
const failures: string[] = [];

for (const [expectedName, path] of Object.entries(workflows)) {
  const source = readFileSync(resolve(root, path), "utf8");
  if (!source.includes(`name: ${expectedName}`)) {
    failures.push(`${path} must retain required check name ${expectedName}.`);
  }
  if (!/^\s*pull_request:\s*$/m.test(source)) {
    failures.push(`${path} must run for pull requests.`);
  }
  const pullRequestBlock = source.match(
    /^\s*pull_request:\s*$([\s\S]*?)(?=^\S|^\s{0,2}push:|^\s{0,2}permissions:)/m,
  )?.[1] ?? "";
  if (!/branches:\s*(?:\[\s*main\s*\]|\n\s*-\s*main)/m.test(pullRequestBlock)) {
    failures.push(`${path} must target pull requests into main.`);
  }
  if (/\n\s+paths(?:-ignore)?:/m.test(pullRequestBlock)) {
    failures.push(`${path} must not skip the required check through a pull-request path filter.`);
  }
  if (!/permissions:\s*\n\s+contents:\s*read/m.test(source)) {
    failures.push(`${path} must use read-only repository permissions.`);
  }
  if (/VEROXA_AI_AUDIT_ENABLED:\s*["']?true/i.test(source)) {
    failures.push(`${path} must not activate paid AI from CI.`);
  }
  if (/sites_(?:save|deploy)|deploy_site|vercel\s+(?:deploy|--prod)/i.test(source)) {
    failures.push(`${path} must not bypass the temporary deployment freeze.`);
  }
}

const ci = readFileSync(resolve(root, workflows.CI), "utf8");
for (const marker of [
  "check-deployment-manifest",
  "check-release-workflow-policy",
  "generate-deployment-attestation",
  "actions/upload-artifact@v4",
]) {
  if (!ci.includes(marker)) failures.push(`CI must enforce release marker: ${marker}`);
}

if (failures.length) {
  console.error("Four-workflow release policy guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Four-workflow release policy passed: CI, Sites, Supabase, and Veroxa checks are configured on main pull requests and cannot deploy or activate AI.",
);
