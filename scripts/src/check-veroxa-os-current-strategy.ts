import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function requireFile(path: string) {
  assert(existsSync(join(root, path)), `Missing required current-strategy file: ${path}`);
}

function requireMarker(file: string, marker: string) {
  const text = read(file);
  assert(text.includes(marker), `${file} missing current-strategy marker: ${marker}`);
}

const requiredDocs = [
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/AI_READY_BUT_NOT_CONNECTED_STRATEGY.md",
  "artifacts/veroxa/docs/INTEGRATION_READY_BUT_NOT_CONNECTED_STRATEGY.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_GAP_AND_BUILD_PLAN.md",
];

for (const file of requiredDocs) requireFile(file);

const requiredMarkers = [
  "GitHub + Codex + Vercel",
  "Replit is historical only",
  "Client and Team",
  "Owner/Operator parked",
  "theoretically complete in preview/manual/pre-live mode",
  "paid infrastructure",
  "AI-ready but not connected",
  "integration-ready but not connected",
  "Restaurant Onboarding",
  "AUTH_MODE",
  "placeholder",
  "$295",
  "$495",
  "$995",
  "[faraz@client.com](mailto:faraz@client.com)",
  "farazclient",
  "[faraz@team.com](mailto:faraz@team.com)",
  "farazteam",
];

for (const marker of requiredMarkers) {
  assert(
    requiredDocs.some((file) => read(file).includes(marker)),
    `Current strategy docs missing global marker: ${marker}`,
  );
}

for (const file of requiredDocs) {
  for (const marker of [
    "GitHub + Codex + Vercel",
    "Replit is historical only",
    "Client and Team",
    "Owner/Operator parked",
    "AUTH_MODE",
    "placeholder",
  ]) {
    requireMarker(file, marker);
  }
}

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
assert(/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode), "AUTH_MODE must remain placeholder.");

const pricingSource = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");
for (const marker of ["$295", "$495", "$995"]) {
  assert(pricingSource.includes(marker), `Pricing source missing ${marker}.`);
}

const servicesPage = read("artifacts/veroxa/src/pages/services.tsx");
for (const marker of ["$295", "$495", "$995", "295/month", "495/month", "995/month"]) {
  assert(!servicesPage.includes(marker), `Services page must not contain price marker: ${marker}`);
}

const pricingPage = read("artifacts/veroxa/src/pages/pricing.tsx");
for (const marker of ["$295", "$495", "$995"]) {
  assert(pricingPage.includes(marker), `Pricing page missing price marker: ${marker}`);
}
assert(!servicesPage.includes("Plan prices"), "Services page must not say Plan prices.");

const currentDocsForPricing = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md",
];
for (const file of currentDocsForPricing) {
  const lines = read(file).split(/\r?\n/);
  for (const line of lines) {
    assert(
      !/Growth[^.;\n]*(?:gets|has|with|capped|cap|allows|includes)[^.;\n]*up to 1 post\/day/i.test(line) &&
        !/Growth and Premium[^\n]*(?:up to 1 post\/day|capped)/i.test(line),
      `${file} must not say Growth gets up to 1 post/day: ${line.trim()}`,
    );
  }
}

const docsToScan = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_OS_CURRENT_MASTER.md",
  "artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md",
  "artifacts/veroxa/docs/AI_READY_BUT_NOT_CONNECTED_STRATEGY.md",
  "artifacts/veroxa/docs/INTEGRATION_READY_BUT_NOT_CONNECTED_STRATEGY.md",
  "artifacts/veroxa/docs/RESTAURANT_ONBOARDING_OS_GAP_AND_BUILD_PLAN.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  "artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md",
  "artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md",
  "artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md",
];

const activePaidPatterns: Array<[RegExp, string]> = [
  [/production auth[^\n]*(?:is|now|currently)\s+(?:active|enabled|live|connected|complete|implemented)/i, "production auth marked active"],
  [/(?:storage uploads?|real storage)[^\n]*(?:is|are|now|currently)\s+(?:active|enabled|live|connected|complete|implemented)/i, "storage marked active"],
  [/live AI[^\n]*(?:is|now|currently)\s+(?:active|enabled|live|connected|complete|implemented)/i, "live AI marked active"],
  [/(?:connectors?|Google APIs?|Meta APIs?|TikTok APIs?)[^\n]*(?:is|are|now|currently)\s+(?:active|enabled|live|connected|complete|implemented)/i, "connectors/APIs marked active"],
  [/(?:payments?|checkout|billing)[^\n]*(?:is|are|now|currently)\s+(?:active|enabled|live|connected|complete|implemented)/i, "payments marked active"],
];

function isNegatedOrGated(line: string): boolean {
  return /not |no |blocked|future|before activation|before live|must exist before|requires|until|gate|rollback|allowed now|blocked now|parked|inactive|removed|hidden|do not|must not|historical|before paid|no-paid|not connected/i.test(
    line,
  );
}

for (const file of docsToScan) {
  const lines = read(file).split(/\r?\n/);
  for (const line of lines) {
    for (const [pattern, label] of activePaidPatterns) {
      assert(!pattern.test(line) || isNegatedOrGated(line), `${file} appears to mark ${label}: ${line.trim()}`);
    }
    assert(
      !/\b(?:Owner|Operator|Super Admin|generic Admin)\b[^\n]*(?:active|enabled|current runtime|real runtime|active product role)/i.test(line) ||
        isNegatedOrGated(line),
      `${file} appears to revive a parked role as active: ${line.trim()}`,
    );
    assert(
      !/Replit[^\n]*(?:active stack|active workflow|source of truth|primary)/i.test(line) || isNegatedOrGated(line),
      `${file} appears to revive Replit as active: ${line.trim()}`,
    );
    assert(
      !/paid (?:systems|infrastructure)[^\n]*(?:allowed|approved|can be activated|may be activated)[^\n]*(?:before|without)[^\n]*(?:gate|Pre-Paid)/i.test(line),
      `${file} appears to allow paid activation before the pre-paid gate: ${line.trim()}`,
    );
  }
}

const clientPublicFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];
const forbiddenClientTerms = [
  /fixture (?:data|label|mode|terminology)/i,
  /\bbackend\b/i,
  /\bRLS\b/,
  /\bSupabase\b/i,
  /\bOpenAI\b/i,
  /\bconnector\b/i,
  /\bAPI\b/,
  /internal risk/i,
  /raw score/i,
];
function visibleStringText(source: string): string {
  return Array.from(source.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g))
    .map((match) => match[2])
    .filter((value) => /[a-zA-Z]/.test(value))
    .join("\n");
}

for (const file of clientPublicFiles) {
  const text = visibleStringText(read(file).replace(/\/\/.*$/gm, ""));
  for (const pattern of forbiddenClientTerms) {
    assert(!pattern.test(text), `${file} contains client/public visible internal term: ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error("Veroxa current strategy guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Veroxa current strategy guardrail passed.");
