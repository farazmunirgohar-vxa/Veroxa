import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

const helperFiles = [
  "artifacts/veroxa/src/domain/onlineInfluencedActions.ts",
  "artifacts/veroxa/src/domain/breakEvenProgress.ts",
  "artifacts/veroxa/src/domain/profitValidation.ts",
] as const;

const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
] as const;

const publicGuaranteeBlocks: Array<[RegExp, string]> = [
  [/(?:10|15|20|50)\s+orders\/day/i, "exact order/day promise"],
  [/guaranteed\s+orders/i, "order guarantee"],
  [/guaranteed\s+profit/i, "profit guarantee"],
  [/guaranteed\s+ROI/i, "ROI guarantee"],
  [/guaranteed\s+customers/i, "customer guarantee"],
  [/guaranteed\s+revenue/i, "revenue guarantee"],
  [/guaranteed\s+walk-ins/i, "walk-in guarantee"],
  [/we make restaurants profitable/i, "profit promise"],
];

function readRequired(relativePath: string): string {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required profit validation file: ${relativePath}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

const helperText = helperFiles.map(readRequired).join("\n");

for (const required of [
  "STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY",
  "STARTER_PROOF_WINDOW_DAYS",
  "STARTER_COST_JUSTIFICATION_WINDOW_DAYS",
  "PROFIT_PROGRESS_WINDOW_DAYS_MIN",
  "PROFIT_PROGRESS_WINDOW_DAYS_MAX",
  "online-influenced orders/actions",
  "break-even progress",
  "attribution confidence",
  "Internal only",
  "not public/client-facing guarantee",
  "evaluateOnlineInfluencedActionProgress",
  "evaluateBreakEvenProgress",
  "evaluateVeroxaProfitValidation",
  "getVeroxaMetricHierarchy",
]) {
  if (!helperText.includes(required)) {
    failures.push(`Profit validation helpers missing marker: ${required}`);
  }
}

if (!/STARTER_INTERNAL_MINIMUM_ACTIONS_PER_DAY\s*=\s*20\b/.test(helperText)) {
  failures.push("Starter internal minimum must remain exactly 20/day.");
}

const starterBreakEven = 295 / 0.05 / 15 / 30;
if (Math.abs(starterBreakEven - 13.1111111111) > 0.01) {
  failures.push("Break-even formula regression for $295, $15 ticket, 5% margin.");
}
if (20 < starterBreakEven) {
  failures.push("20/day should remain above Starter break-even under default assumptions.");
}

if (!/current\s*===\s*undefined[^\n]+confidence\s*===\s*"unknown"[\s\S]{0,140}return\s+"not_enough_data"/.test(helperText)) {
  failures.push("Profit validation helper must treat missing/unknown action data as not_enough_data.");
}
if (!/daysSinceStart\s*<=\s*30[\s\S]{0,80}return\s+"foundation"/.test(helperText)) {
  failures.push("Profit validation helper must keep 0–30 days in foundation phase.");
}
if (!/daysSinceStart\s*<=\s*60[\s\S]{0,80}return\s+"break_even_validation"/.test(helperText)) {
  failures.push("Profit validation helper must keep 31–60 days in break-even validation phase.");
}
if (!/return\s+"profit_progress"/.test(helperText)) {
  failures.push("Profit validation helper must include 6–9 month profit progress phase.");
}

for (const file of publicClientFiles) {
  const text = readRequired(file);
  for (const [pattern, label] of publicGuaranteeBlocks) {
    if (pattern.test(text)) {
      failures.push(`${file} contains blocked public/client guarantee language: ${label}`);
    }
  }
}

const rootPackage = readRequired("package.json");
const scriptsPackage = readRequired("scripts/package.json");
if (!rootPackage.includes("check-profit-validation-model")) {
  failures.push("Root verify:veroxa must run check-profit-validation-model.");
}
const profitSnapshotFile = readRequired("artifacts/veroxa/src/domain/saas/profitValidationPersistence.ts");
for (const marker of ["ProfitValidationSnapshotRecord", "buildProfitValidationSnapshot", "formatProfitValidationSnapshot"]) {
  if (!profitSnapshotFile.includes(marker)) failures.push(`Profit validation persistence hook missing marker: ${marker}`);
}

if (!scriptsPackage.includes("check-profit-validation-model")) {
  failures.push("scripts/package.json must expose check-profit-validation-model.");
}

if (failures.length > 0) {
  console.error("Profit validation model guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Profit validation model guardrail passed: internal proof model, tracking hierarchy, break-even progress, profit validation phases, and public/client boundary checks are locked.",
);
