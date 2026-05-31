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
  /\$477\b/,
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
  return /deprecated|historical|history|not current|retired|must not|must NOT|do not use/i.test(
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
  "TikTok + Reels posting support using the photos and videos you provide",
  "Premium requires at least 1 month on Essential or Growth",
  "Posting depends on usable media provided by the restaurant",
  "First clients receive 20% off for the first 12 months",
  "loyalty discount",
  "continuously active",
]) {
  if (!pricingPage.includes(required)) {
    failures.push(
      `pricing.tsx is missing current public pricing marker: ${required}`,
    );
  }
}

const growthCardMatch = pricingPage.match(/name: "Growth",[\s\S]*?cta:/);
if (growthCardMatch?.[0].includes("Most Popular")) {
  failures.push("Growth pricing card must not be labeled Most Popular.");
}

if (/Most Popular/.test(pricingPage) && /name: "Growth",[\s\S]*?Most Popular/.test(pricingPage)) {
  failures.push("Growth pricing card must not be labeled Most Popular.");
}
if (/comments|DMs|inboxes|customer-service conversations/i.test(pricingPage) && /included|managed|handled/i.test(pricingPage)) {
  const boundaryOk = /does not handle|not handle|restaurant remains responsible/i.test(pricingPage);
  if (!boundaryOk) {
    failures.push("pricing.tsx must keep comments/DMs/customer-service outside included services.");
  }
}

if (/complete social media management/i.test(pricingPage)) {
  failures.push(
    "pricing.tsx contains risky complete social media management wording.",
  );
}
if (/maximum 1 post per day/i.test(pricingPage)) {
  failures.push(
    "pricing.tsx contains global maximum 1 post per day wording without Premium's max 2 posts/day total rule.",
  );
}
if (/(comments|DMs|inboxes|customer-service).*included/i.test(pricingPage)) {
  failures.push(
    "pricing.tsx appears to say customer replies/comments/DMs/inboxes are included.",
  );
}
if (
  /Complete Online Presence[\s\S]{0,120}(only public plan|current public plan)/i.test(
    pricingPage,
  )
) {
  failures.push(
    "pricing.tsx appears to present Complete Online Presence as the active/only public plan.",
  );
}

const pricingDocs = [
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
].map((file) => [file, readFileSync(join(root, file), "utf8")] as const);

for (const [file, text] of pricingDocs) {
  for (const required of [
    "Premium requires",
    "1 month on Essential or Growth",
    "readiness assessment",
    "Posting depends on usable client-provided media",
    "may slow when usable media is unavailable",
    "First clients receive 20% off",
    "loyalty discount",
    "continuously active",
  ]) {
    if (!text.includes(required)) {
      failures.push(`${file} is missing locked-model rule: ${required}`);
    }
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
  '"essential"',
  '"growth"',
  '"premium"',
  "TikTok + Reels posting support using the photos and videos you provide",
  "Premium requires 1+ month on Essential/Growth",
  "SERVICE_BOUNDARY_DISCLAIMER",
  "FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY",
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
  "Pricing drift check passed: active pricing surfaces align to Essential/Growth/Premium locked model.",
);
