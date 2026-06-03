import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

const saasFiles = [
  "artifacts/veroxa/src/domain/saas/saasTypes.ts",
  "artifacts/veroxa/src/domain/saas/repositoryContracts.ts",
  "artifacts/veroxa/src/domain/saas/repositoryAdapters.ts",
  "artifacts/veroxa/src/domain/saas/dataMode.ts",
  "artifacts/veroxa/src/domain/saas/repositoryProvider.ts",
  "artifacts/veroxa/src/domain/saas/activityLogScaffold.ts",
  "artifacts/veroxa/src/domain/saas/profitValidationPersistence.ts",
  "artifacts/veroxa/src/domain/saas/accountActivation.ts",
  "artifacts/veroxa/src/domain/saas/clientPortalState.ts",
  "artifacts/veroxa/src/domain/saas/teamPortalState.ts",
] as const;

function readRequired(file: string): string {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required SaaS data boundary file: ${file}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

const texts = new Map(saasFiles.map((file) => [file, readRequired(file)]));
const combined = [...texts.values()].join("\n");
const adapters = texts.get("artifacts/veroxa/src/domain/saas/repositoryAdapters.ts") ?? "";
const dataMode = texts.get("artifacts/veroxa/src/domain/saas/dataMode.ts") ?? "";
const publicClientFiles = [
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];

for (const marker of [
  "createPlaceholderClientPortalRepository",
  "createPlaceholderTeamPortalRepository",
  "createNoopActivityLogRepository",
  "getClientPortalPageState",
  "getTeamPortalRepositoryState",
  "buildNonPersistedActivityPreview",
]) {
  if (!adapters.includes(marker)) failures.push(`Repository adapters missing placeholder marker: ${marker}`);
}

for (const marker of [
  "createDemoClientPortalRepository",
  "createDemoTeamPortalRepository",
  "createDemoActivityLogRepository",
]) {
  if (!adapters.includes(marker)) failures.push(`Repository adapters missing demo marker: ${marker}`);
}

for (const [file, text] of texts) {
  if (/from\s+["'][^"']*supabase|@supabase|\bsupabase\b/i.test(text)) {
    failures.push(`${file} must not import or reference supabase in SaaS scaffolding.`);
  }
}

if (/\bfetch\s*\(/.test(adapters)) failures.push("repositoryAdapters.ts must not call fetch().");
if (/supabase/i.test(adapters)) failures.push("repositoryAdapters.ts must not reference supabase.");
if (/dataMode === \"authenticated_client\"[\s\S]{0,400}demo_fixture|dataMode === \"authenticated_team\"[\s\S]{0,400}demo_fixture/.test(adapters)) failures.push("repositoryAdapters.ts appears to use demo fixtures in authenticated modes.");
if (/localStorage/.test(adapters) && !/demo-only|demo only|safe/i.test(adapters)) {
  failures.push("repositoryAdapters.ts must not use localStorage persistence unless explicitly demo-only and safe.");
}
if (!dataMode.includes("assertNoDemoFixturesInAuthenticatedMode")) {
  failures.push("dataMode.ts missing assertNoDemoFixturesInAuthenticatedMode.");
}

const blockedPublicPhrases = [
  /20\s+orders\/day/i,
  /20\s+online-influenced\s+actions/i,
  /Starter internal proof floor/i,
  /requiredDailyOrders/i,
  /we make restaurants profitable/i,
];
for (const file of publicClientFiles) {
  const text = readRequired(file);
  for (const pattern of blockedPublicPhrases) {
    if (pattern.test(text)) failures.push(`${file} exposes internal proof target language: ${pattern}`);
  }
}

for (const marker of [
  "SaasDataMode",
  "RestaurantAccount",
  "ActivityLogRecord",
  "ProfitValidationSnapshotRecord",
  "evaluateAccountActivation",
  "buildClientPortalPageState",
  "buildTeamPortalRepositoryState",
  "buildProfitValidationSnapshot",
  "future production adapter requires RR approval",
]) {
  if (!combined.includes(marker)) failures.push(`SaaS scaffolding missing required marker: ${marker}`);
}

if (failures.length > 0) {
  console.error("SaaS data boundary check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SaaS data boundary check passed: scaffolding files exist, placeholder/demo adapters are present, demo fixtures are blocked from authenticated modes, and public client proof-target leakage remains guarded.");
