import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(process.cwd(), "..");
const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-onboarding.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
];
const failures: string[] = [];
for (const file of publicClientFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const forbidden of ["$9,900", "requiredDailyOrders", "net margin", "generated sales", "break-even", "profit math"]) {
    if (text.includes(forbidden)) failures.push(`${file} contains client/public proof math marker: ${forbidden}`);
  }
}
const internal = [
  "artifacts/veroxa/docs/VALUE_PROOF_AND_RESTAURANT_REACH_LAYER.md",
  "artifacts/veroxa/src/domain/valueProof/internalCostJustification.ts",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
for (const marker of ["$9,900", "not extra new sales"]) if (!internal.includes(marker)) failures.push(`Internal proof source missing ${marker}`);
if (/generated \$9,900/i.test(internal)) failures.push("Internal proof source must not say generated $9,900.");
if (failures.length) { console.error("Client-safe proof math guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Client-safe proof math guardrail passed.");
