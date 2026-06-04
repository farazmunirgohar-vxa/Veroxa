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
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  ".agents/memory/veroxa-two-role-model.md",
  "artifacts/veroxa/src/lib/permissions/README.md",
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
  "CURRENT_PUBLIC_PLANS",
  "GLOBAL_PRICING_RULES",
  "MEDIA_DEPENDENCY_DISCLAIMER",
  "FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY",
  "Premium requires a Veroxa readiness assessment",
  "Starter is capped at up to 3 posts/week",
  "Premium is capped at up to 1 post/day",
]) {
  if (!pricingPage.includes(required)) {
    failures.push(
      `pricing.tsx is missing current public pricing marker: ${required}`,
    );
  }
}

for (const forbidden of [/Most recommended/i, /Most popular/i]) {
  if (forbidden.test(pricingPage)) {
    failures.push(
      `pricing.tsx must not render public pricing badge/positioning text: ${forbidden}`,
    );
  }
}
if (
  /comments|DMs|inboxes|customer-service conversations/i.test(pricingPage) &&
  /included|managed|handled/i.test(pricingPage)
) {
  const boundaryOk =
    /does not handle|not handle|restaurant remains responsible/i.test(
      pricingPage,
    );
  if (!boundaryOk) {
    failures.push(
      "pricing.tsx must keep comments/DMs/customer-service outside included services.",
    );
  }
}

if (/complete social media management/i.test(pricingPage)) {
  failures.push(
    "pricing.tsx contains risky complete social media management wording.",
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

const m024Migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql",
  ),
  "utf8",
);
for (const required of [
  "service_plan text not null default 'essential'",
  "'essential'",
  "'growth'",
  "'premium'",
  "Retired/internal compatibility aliases",
  "Production RLS must be",
]) {
  if (!m024Migration.includes(required)) {
    failures.push(
      `M024A migration is missing current plan/dev-stage marker: ${required}`,
    );
  }
}
if (
  /check \(service_plan in \([\s\S]*complete_online_presence/.test(
    m024Migration,
  )
) {
  failures.push(
    "M024A migration service_plan constraint must not accept retired Complete Online Presence as a current slug.",
  );
}
if (
  /check \(service_plan in \([\s\S]*google_optimization/.test(m024Migration)
) {
  failures.push(
    "M024A migration service_plan constraint must not accept retired Google Optimization as a current slug.",
  );
}
if (
  /check \(service_plan in \([\s\S]*ads_management_only/.test(m024Migration)
) {
  failures.push(
    "M024A migration service_plan constraint must not accept retired Ads Management Only as a current slug.",
  );
}
if (/check \(service_plan in \([\s\S]*complete_plus_ads/.test(m024Migration)) {
  failures.push(
    "M024A migration service_plan constraint must not accept retired Complete Plus Ads as a current slug.",
  );
}

const m024Doc = readFileSync(
  join(root, "artifacts/veroxa/docs/M024A_SUPABASE_METADATA_SCHEMA_AND_RLS.md"),
  "utf8",
);
for (const required of [
  "clients.service_plan ∈ {essential, growth, premium}",
  "Service-plan slug policy",
  "dev-stage, not production-ready",
  "retired/internal compatibility",
]) {
  if (!m024Doc.includes(required)) {
    failures.push(
      `M024A docs are missing current plan/dev-stage marker: ${required}`,
    );
  }
}

const pricingSource = readFileSync(
  join(root, "artifacts/veroxa/src/data/pricing/veroxaPricing.ts"),
  "utf8",
);
for (const required of [
  'id: "starter"',
  'id: "growth"',
  'id: "premium"',
  "priceMonthly: 295",
  "priceMonthly: 495",
  "priceMonthly: 995",
  "publicVisible: true",
  'status: "active"',
  "internalOnly: true",
  'status: "retired"',
  '"essential"',
  '"growth"',
  '"premium"',
  "TikTok",
  "Premium includes ad management",
  "Premium requires readiness assessment",
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
  "Pricing drift check passed: active pricing surfaces align to Starter/Growth/Premium locked model.",
);
