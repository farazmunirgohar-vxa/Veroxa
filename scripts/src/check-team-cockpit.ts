import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const files = [
  "artifacts/veroxa/src/pages/team-dashboard.tsx",
  "artifacts/veroxa/docs/TEAM_COCKPIT_RULE.md",
];
const failures: string[] = [];
const dashboard = readFileSync(join(root, files[0]), "utf8");

for (const label of ["Needs review", "Ready to schedule", "Client requests", "Blocked / needs input", "Reports due"]) {
  if (!dashboard.includes(label)) failures.push(`team-dashboard.tsx missing cockpit label ${label}.`);
}

const activeLanguage = [/Owner dashboard/i, /Operator dashboard/i, /Super Admin/i, /command center/i, /analytics wall/i, /backend console/i];
for (const file of files) {
  const text = readFileSync(join(root, file), "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of activeLanguage) {
      if (pattern.test(line) && !/Avoid adding|against reintroducing/i.test(line)) {
        failures.push(`${file}:${index + 1} should avoid cockpit drift language ${pattern}: ${line.trim()}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error("Team cockpit guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Team cockpit guardrail passed: dashboard keeps the five-question cockpit model.");
