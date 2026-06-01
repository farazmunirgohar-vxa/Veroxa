import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

const sourceScanRoots = [
  "artifacts/veroxa/src/App.tsx",
  "artifacts/veroxa/src/pages",
  "artifacts/veroxa/src/components",
  "artifacts/veroxa/src/lib/clientPortalNav.ts",
  "artifacts/veroxa/src/lib/teamPortalNav.ts",
  "artifacts/veroxa/src/lib/demoRoutes.ts",
  "artifacts/veroxa/src/lib/realRoutes.ts",
  "artifacts/veroxa/src/domain/firstClientReadiness",
];

const selectedDocs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/CURRENT_REAL_VEROXA_MODEL.md",
  "artifacts/veroxa/docs/FIRST_CLIENT_READINESS_FOUNDATION.md",
  "artifacts/veroxa/docs/README.md",
];

const activeClientPortalFiles = [
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];

const dangerousFirstClientLanguage: readonly [RegExp, string][] = [
  [/\b2 posts per day\b/i, "forbidden posting volume"],
  [/\btwo posts per day\b/i, "forbidden posting volume"],
  [/\bup to 2 posts\b/i, "forbidden posting volume"],
  [/\b2 content posts\b/i, "forbidden posting volume"],
  [/\bmax 2 content posts\b/i, "forbidden posting volume"],
  [/automatic publishing/i, "forbidden automation claim"],
  [/automatically posts/i, "forbidden automation claim"],
  [/auto-publish/i, "forbidden automation claim"],
  [/auto reply/i, "forbidden customer-service claim"],
  [/handles DMs/i, "forbidden customer-service claim"],
  [/replies to comments/i, "forbidden customer-service claim"],
  [/handles refunds/i, "forbidden customer-service claim"],
  [/handles complaints/i, "forbidden customer-service claim"],
  [/handles order questions/i, "forbidden customer-service claim"],
  [/Super Admin/i, "inactive role language"],
  [/active Owner dashboard/i, "inactive role language"],
  [/active Operator dashboard/i, "inactive role language"],
  [/\/demo\/team/i, "inactive demo route"],
  [/\/demo\/operator/i, "inactive demo route"],
  [/\/demo\/owner/i, "inactive demo route"],
  [/\/owner\//i, "inactive role route"],
  [/\/operator\//i, "inactive role route"],
];

const clientUnsafeLanguage: readonly [RegExp, string][] = [
  [/OpenAI/i, "client-unsafe implementation term"],
  [/Supabase/i, "client-unsafe implementation term"],
  [/\bRLS\b/i, "client-unsafe implementation term"],
  [/backend/i, "client-unsafe implementation term"],
  [/connector/i, "client-unsafe implementation term"],
  [/\bAPI\b/i, "client-unsafe implementation term"],
  [/fixture/i, "client-unsafe implementation term"],
  [/approval queue/i, "client-unsafe internal workflow term"],
  [/risk level/i, "client-unsafe internal workflow term"],
  [/internal ID/i, "client-unsafe internal workflow term"],
  [/model output/i, "client-unsafe implementation term"],
  [/AI agent/i, "client-unsafe implementation term"],
];

function walk(path: string): string[] {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return [];
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];

  return readdirSync(absolute).flatMap((entry) => {
    if (["node_modules", "dist", "build", ".git"].includes(entry)) return [];
    const childAbsolute = join(absolute, entry);
    const childRelative = relative(root, childAbsolute);
    const childStat = statSync(childAbsolute);
    if (childStat.isDirectory()) return walk(childRelative);
    if (/\.(ts|tsx|md)$/.test(entry)) return [childAbsolute];
    return [];
  });
}

function isHistoricalOrDeprecatedContext(file: string, line: string): boolean {
  const context = `${file} ${line}`;
  if (/no[- ]|not |without |must not|do not|does not|avoid|forbidden|denylist/i.test(context)) return true;
  return /deprecated|legacy|historical|not active|removed|blocked|parked|future|draft|inactive/i.test(
    context,
  );
}

function isLikelyClientVisibleLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return false;
  if (/canUseFixtureData|allowDemoFixtures|isLiveDataConnected|fixture[A-Z]|demo[A-Z]|SHOWCASE_ID|workflowClientId/.test(trimmed)) return false;
  if (/^(const|let|var|type|interface|import|export|function|return|if|else)\b/.test(trimmed) && !/["'`][^"'`]+["'`]/.test(trimmed)) return false;
  return true;
}

function isGuardrailDefinition(file: string): boolean {
  return /check-first-client-readiness\.ts$|check-business-guardrails\.ts$|check-demo-routes\.ts$|check-portal-separation\.ts$|clientPortalCopyAudit\.ts$/.test(
    file,
  );
}

function report(file: string, lineNumber: number, label: string, line: string) {
  failures.push(`${file}:${lineNumber} ${label}: ${line.trim()}`);
}

const firstClientScanFiles = new Set([
  ...sourceScanRoots.flatMap(walk),
  ...selectedDocs.flatMap(walk),
]);

for (const absolute of firstClientScanFiles) {
  const file = relative(root, absolute);
  const text = readFileSync(absolute, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (isGuardrailDefinition(file) || isHistoricalOrDeprecatedContext(file, line)) return;
    for (const [pattern, label] of dangerousFirstClientLanguage) {
      if (pattern.test(line)) report(file, index + 1, label, line);
    }
  });
}

for (const activeClientFile of activeClientPortalFiles) {
  const absolute = join(root, activeClientFile);
  if (!existsSync(absolute)) continue;
  const text = readFileSync(absolute, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (isHistoricalOrDeprecatedContext(activeClientFile, line) || !isLikelyClientVisibleLine(line)) return;
    for (const [pattern, label] of clientUnsafeLanguage) {
      if (pattern.test(line)) report(activeClientFile, index + 1, label, line);
    }
  });
}


const readinessChecklistSource = readFileSync(
  join(root, "artifacts/veroxa/src/domain/firstClientReadiness/checklist.ts"),
  "utf8",
);
if (!/real-client-data-pending[\s\S]*status:\s*["']warning["']/.test(readinessChecklistSource)) {
  failures.push("First-client readiness must keep live client data pending as a warning, not fake-passing launch truth.");
}
if (!/storage-upload-pending[\s\S]*status:\s*["']warning["']/.test(readinessChecklistSource)) {
  failures.push("First-client readiness must keep storage upload pending as a warning, not fake-passing launch truth.");
}
if (!/production-auth-pending[\s\S]*status:\s*["']warning["']/.test(readinessChecklistSource)) {
  failures.push("First-client readiness must keep production auth pending as a warning, not fake-passing launch truth.");
}

if (failures.length > 0) {
  console.error("First-client readiness guardrail failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("First-client readiness guardrail passed: active first-client surfaces preserve manual execution, role separation, client-safe language, and launch boundaries.");
