import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const filesToScan = [
  "AGENTS.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/src/data/pricing/veroxaPricing.ts",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/lib/audit/auditPackageRecommendation.ts",
  "artifacts/veroxa/src/lib/leads/internalLeadScoring.ts",
  "artifacts/veroxa/src/data/demo/demoFinancials.ts",
  "artifacts/veroxa/src/data/demo/demoClients.ts",
  "artifacts/veroxa/src/lib/data/veroxaDataContracts.ts",
  "artifacts/veroxa/src/domain/clientHealth/engine.ts",
  "artifacts/veroxa/src/lib/database/enums.ts",
];

const staleActivePatterns = [
  /\$977\b/,
  /\$488\b/,
  /\+\$477\b/,
  /\$965\b/,
  /\$1,454\b/,
  /\b1454\b/,
  /founding[- ]client pricing/i,
  /founding first[- ]year/i,
  /founding first year/i,
  /50% off Complete Online Presence/i,
];

function isDeprecatedContext(line: string): boolean {
  return /deprecated|historical|history|not current|must not|must NOT|do not use/i.test(
    line,
  );
}

const failures: string[] = [];

for (const file of filesToScan) {
  const fullPath = join(root, file);
  const text = readFileSync(fullPath, "utf8");
  let inDeprecatedSection = false;
  text.split(/\r?\n/).forEach((line, index) => {
    if (/^#{1,6}\s/.test(line)) {
      inDeprecatedSection = isDeprecatedContext(line);
    }
    const allowedHistoricalLine =
      inDeprecatedSection || isDeprecatedContext(line);
    if (allowedHistoricalLine) return;
    for (const pattern of staleActivePatterns) {
      if (pattern.test(line)) {
        failures.push(
          `${file}:${index + 1} contains stale active pricing text: ${line.trim()}`,
        );
      }
    }
  });
}

const pricingPage = readFileSync(
  join(root, "artifacts/veroxa/src/pages/pricing.tsx"),
  "utf8",
);
for (const required of [
  "Essential",
  "$497",
  "Growth",
  "$697",
  "Premium",
  "$997",
]) {
  if (!pricingPage.includes(required)) {
    failures.push(
      `pricing.tsx is missing current public pricing marker: ${required}`,
    );
  }
}

const pricingSource = readFileSync(
  join(root, "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"),
  "utf8",
);
for (const required of [
  'id: "essential"',
  'id: "growth"',
  'id: "premium"',
  "priceMonthly: 497",
  "priceMonthly: 697",
  "priceMonthly: 997",
  "publicVisible: true",
  'status: "active"',
  "internalOnly: true",
  'status: "retired"',
]) {
  if (!pricingSource.includes(required)) {
    failures.push(
      `veroxaPricing.ts is missing expected pricing/config marker: ${required}`,
    );
  }
}

if (failures.length > 0) {
  console.error("Pricing drift check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Pricing drift check passed: active pricing surfaces align to Essential/Growth/Premium.",
);
