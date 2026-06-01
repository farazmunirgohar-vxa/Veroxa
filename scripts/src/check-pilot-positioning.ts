import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const docPath = "artifacts/veroxa/docs/FIRST_CLIENT_PILOT_MODE.md";
const text = readFileSync(join(root, docPath), "utf8");
const failures: string[] = [];

for (const required of [
  "sample/demo only",
  "No production auth",
  "No storage upload",
  "No real publishing integration",
  "Faraz reviews",
  "Pilot demo checklist",
  "Blockers before a real client account",
]) {
  if (!text.includes(required)) {
    failures.push(`${docPath} missing required pilot-mode phrase: ${required}`);
  }
}

for (const forbidden of [
  /production-ready/i,
  /automatic publishing is ready/i,
  /real publishing is connected/i,
]) {
  if (forbidden.test(text)) {
    failures.push(`${docPath} contains unsafe pilot positioning: ${forbidden}`);
  }
}

if (failures.length > 0) {
  console.error("Pilot positioning guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Pilot positioning guardrail passed: pilot docs stay truthful about demo/sample boundaries.",
);
