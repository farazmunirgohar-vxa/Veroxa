import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const docsRoot = "artifacts/veroxa/docs";

const requiredDocs = [
  "CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md",
  "SAAS_ROUTE_DATA_BOUNDARY_PLAN.md",
  "SAAS_RLS_SECURITY_MODEL.md",
  "SAAS_MEDIA_STORAGE_LIFECYCLE.md",
  "SAAS_PERSISTENCE_MODEL.md",
  "SAAS_ACTIVITY_LOG_MODEL.md",
  "SAAS_BILLING_READY_ACCOUNT_STATE.md",
] as const;

const foundationAreaPatterns = [
  { label: "account model", pattern: /account model/i },
  { label: "client/team user model", pattern: /client\/team user model/i },
  {
    label: "route/data boundary model",
    pattern: /route\/data boundary model/i,
  },
  { label: "RLS/security model", pattern: /RLS\/security model/i },
  {
    label: "storage/media lifecycle model",
    pattern: /storage\/media lifecycle model/i,
  },
  { label: "persistence model", pattern: /persistence model/i },
  { label: "activity log model", pattern: /activity log model/i },
  {
    label: "billing-ready account-state model",
    pattern: /billing-ready account-state model/i,
  },
  { label: "SaaS-era guardrails", pattern: /SaaS-era guardrails/i },
] as const;

const restrictionPatterns = [
  {
    label: "no production auth enabled yet",
    pattern: /no production auth (?:is )?enabled yet/i,
  },
  {
    label: "no storage uploads enabled yet",
    pattern: /no storage uploads (?:are )?enabled yet/i,
  },
  {
    label: "no migrations created yet",
    pattern: /no migrations (?:are )?created (?:in this task|yet)/i,
  },
  {
    label: "no live AI enabled yet",
    pattern: /no live AI (?:is )?enabled yet/i,
  },
  {
    label: "no payments enabled yet",
    pattern: /no payments (?:are )?enabled yet/i,
  },
] as const;

const guaranteePatterns = [
  { label: "3–5 customers", pattern: /3\s*[–-]\s*5\s+customers/i },
  { label: "guaranteed orders", pattern: /guaranteed\s+orders/i },
  { label: "guaranteed profit", pattern: /guaranteed\s+profit/i },
  { label: "guaranteed ROI", pattern: /guaranteed\s+ROI/i },
  { label: "guaranteed customers", pattern: /guaranteed\s+customers/i },
  { label: "guaranteed walk-ins", pattern: /guaranteed\s+walk-ins/i },
  { label: "guaranteed revenue", pattern: /guaranteed\s+revenue/i },
  { label: "guarantee rankings", pattern: /guarantee\s+rankings/i },
  { label: "exact order target", pattern: /(?:10|15|20|50)\s+orders\/day/i },
  { label: "profit promise", pattern: /we make restaurants profitable/i },
] as const;

const publicClientFilesToScan = [
  "artifacts/veroxa/src/App.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/lib/clientPortalNav.ts",
  "artifacts/veroxa/src/lib/clientPortalRoutes.ts",
  "artifacts/veroxa/src/hooks/useClientPortalData.ts",
  "artifacts/veroxa/src/data/pricing/veroxaPricing.ts",
] as const;

const failures: string[] = [];

function readRequired(relativePath: string): string {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

const docTexts = requiredDocs.map((doc) => {
  const relativePath = join(docsRoot, doc);
  return { doc, relativePath, text: readRequired(relativePath) };
});

const mainDoc = docTexts.find(
  ({ doc }) => doc === "CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md",
)?.text;

if (mainDoc) {
  for (const area of foundationAreaPatterns) {
    if (!area.pattern.test(mainDoc)) {
      failures.push(
        `CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md is missing foundation area: ${area.label}`,
      );
    }
  }
}

const combinedDocs = docTexts.map(({ text }) => text).join("\n");

for (const restriction of restrictionPatterns) {
  if (!restriction.pattern.test(combinedDocs)) {
    failures.push(
      `SaaS foundation docs are missing restriction marker: ${restriction.label}`,
    );
  }
}

if (
  !/\/client\/\*[^\n]{0,120}\/team\/\*[^\n]{0,160}cannot use demo\/sample fixtures once authenticated real mode is enabled/i.test(
    combinedDocs,
  )
) {
  failures.push(
    "SaaS foundation docs must warn that /client/* and /team/* cannot use demo/sample fixtures once authenticated real mode is enabled.",
  );
}

if (
  !/No future write should ship without activity logging/i.test(combinedDocs)
) {
  failures.push(
    "SaaS foundation docs must state that no future write should ship without activity logging.",
  );
}

for (const file of publicClientFilesToScan) {
  const text = readRequired(file);
  for (const phrase of guaranteePatterns) {
    if (phrase.pattern.test(text)) {
      failures.push(
        `${file} contains blocked public/client guarantee language: ${phrase.label}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("SaaS foundation readiness check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "SaaS foundation readiness check passed: docs exist, foundation areas are documented, restrictions are preserved, fixture leakage warning exists, activity logging is required, and targeted public/client guarantee language remains blocked.",
);
