import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function requireIncludes(file: string, marker: string, label = marker) {
  assert(read(file).includes(marker), `${file} missing marker: ${label}`);
}

function walk(path: string): string[] {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return [];
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];
  return readdirSync(absolute).flatMap((entry) => {
    if (["node_modules", "dist", "build", ".git"].includes(entry)) return [];
    const child = join(absolute, entry);
    const childStat = statSync(child);
    if (childStat.isDirectory()) return walk(relative(root, child));
    return /\.(ts|tsx|md)$/.test(entry) ? [child] : [];
  });
}

const domain = "artifacts/veroxa/src/domain/firstClientOperatingSuite";
const page = "artifacts/veroxa/src/pages/team-first-client-ops.tsx";
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");

for (const file of [
  "types.ts",
  "lifecycleStageEngine.ts",
  "onboardingReadinessEngine.ts",
  "mediaRhythmEngine.ts",
  "weeklyUpdateBuilder.ts",
  "monthlyReportDraftBuilder.ts",
  "clientHandoffEngine.ts",
  "serviceHealthEngine.ts",
  "firstClientOperatingSuite.ts",
  "index.ts",
]) {
  assert(existsSync(join(root, domain, file)), `First-client operating domain file missing: ${file}`);
}

assert(existsSync(join(root, page)), "/team/first-client-ops page missing");
requireIncludes("artifacts/veroxa/src/App.tsx", 'path="/team/first-client-ops"', "first-client ops route");
assert(
  app.includes('path="/team/first-client-ops"') &&
    app.includes('<InternalDemoGuard role="team">') &&
    app.includes('<RealPortalDataBoundary portal="team">') &&
    app.includes("<TeamFirstClientOps />"),
  "/team/first-client-ops must be guarded by InternalDemoGuard and RealPortalDataBoundary",
);
assert(nav.includes("First-Client Ops") && nav.includes('/team/first-client-ops'), "Team nav must include First-Client Ops");

for (const marker of [
  "buildTeamWeeklyUpdateDraft",
  "buildClientSafeWeeklyUpdate",
  "getWeeklyUpdateReadiness",
  "getWeeklyUpdateNextAction",
]) requireIncludes(`${domain}/weeklyUpdateBuilder.ts`, marker, marker);
for (const marker of [
  "buildTeamMonthlyReportDraft",
  "buildClientSafeMonthlyReportDraft",
  "getMonthlyReportReadiness",
  "getMonthlyReportBlockers",
]) requireIncludes(`${domain}/monthlyReportDraftBuilder.ts`, marker, marker);
requireIncludes(`${domain}/clientHandoffEngine.ts`, "clientSafeWelcomeNoteDraft", "client handoff welcome draft");
requireIncludes(`${domain}/serviceHealthEngine.ts`, "healthy", "service health model");
requireIncludes(`${domain}/lifecycleStageEngine.ts`, "ready_for_manual_execution", "lifecycle stage model");

const suiteSource = read(`${domain}/firstClientOperatingSuite.ts`);
for (const benchmark of [
  "Starter healthy benchmark",
  "Starter low-media benchmark",
  "Growth media-ready benchmark",
  "Growth inconsistent-upload benchmark",
  "Premium readiness benchmark",
]) {
  assert(suiteSource.includes(benchmark), `Missing deterministic benchmark: ${benchmark}`);
}
assert(/starter-low-media-benchmark[\s\S]*usableMediaCount:\s*2/.test(suiteSource), "Low-media benchmark should produce media-needed next action inputs");
assert(/growth-inconsistent-upload-benchmark[\s\S]*clientConfirmationStatus:\s*"needed"/.test(suiteSource), "Confirmation benchmark should require client confirmation");
assert(/starter-healthy-benchmark[\s\S]*manualExecutionStatus:\s*"ready_for_manual_execution"/.test(suiteSource), "Ready benchmark should be ready for manual execution");
assert(/growth-media-ready-benchmark[\s\S]*monthlyReportDue:\s*true/.test(suiteSource), "Report-due benchmark should produce monthly report draft inputs");

for (const marker of [
  "Client lifecycle board",
  "Selected client detail",
  "Weekly update draft",
  "Monthly report draft",
  "Client handoff",
  "Copy manually if approved",
]) requireIncludes(page, marker, marker);
requireIncludes(`${domain}/weeklyUpdateBuilder.ts`, "Draft only — not sent", "weekly update draft-only label");
requireIncludes(`${domain}/monthlyReportDraftBuilder.ts`, "Draft only — not published", "monthly report draft-only label");

for (const [file, marker] of [
  ["artifacts/veroxa/src/pages/team-dashboard.tsx", "First-Client Ops"],
  ["artifacts/veroxa/src/pages/team-work-queue.tsx", "first-client-ops-next-actions"],
  ["artifacts/veroxa/src/pages/team-report-queue.tsx", "first-client-report-readiness-preview"],
  ["artifacts/veroxa/src/pages/team-first-client-readiness.tsx", "first-client-operating-suite-readiness"],
  ["artifacts/veroxa/src/pages/team-manual-execution.tsx", "related-first-client-ops-snapshot"],
  ["artifacts/veroxa/src/pages/client-dashboard.tsx", "needs-your-attention"],
]) requireIncludes(file, marker, marker);

const forbiddenDomainImports = [
  /from\s+["'][^"']*supabase/i,
  /from\s+["'][^"']*openai/i,
  /from\s+["'][^"']*(googleapis|@google|facebook|instagram|tiktok|stripe|youtube)/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /webhook/i,
  /cron/i,
];
for (const absolute of walk(domain)) {
  const rel = relative(root, absolute);
  const text = readFileSync(absolute, "utf8");
  for (const pattern of forbiddenDomainImports) {
    assert(!pattern.test(text), `${rel} contains forbidden production integration pattern ${pattern}`);
  }
}

const clientSafeFiles = [
  `${domain}/weeklyUpdateBuilder.ts`,
  `${domain}/monthlyReportDraftBuilder.ts`,
  `${domain}/clientHandoffEngine.ts`,
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
];
const clientUnsafeTerms = [/backend/i, /fixture/i, /raw score/i, /\bAPI\b/i, /OpenAI/i, /Supabase/i, /\bRLS\b/i, /connector/i, /internal risk/i, /profit math/i];
for (const file of clientSafeFiles) {
  const text = read(file);
  for (const pattern of clientUnsafeTerms) {
    assert(!pattern.test(text), `${file} contains client-unsafe term ${pattern}`);
  }
}
const clientWeeklySource = read(`${domain}/weeklyUpdateBuilder.ts`);
for (const pattern of clientUnsafeTerms) {
  assert(!pattern.test(clientWeeklySource), `Client-safe weekly update contains internal term ${pattern}`);
}

const guaranteePatterns = [/guarantee/i, /guaranteed/i, /ROI/i, /revenue/i, /rank(?:ing|ings)? claim/i, /profit\s+math/i, /walk-ins/i, /customers?\s+will/i, /orders?\s+will/i];
for (const file of [page, `${domain}/weeklyUpdateBuilder.ts`, `${domain}/monthlyReportDraftBuilder.ts`, `${domain}/clientHandoffEngine.ts`, "artifacts/veroxa/src/pages/client-dashboard.tsx"]) {
  const text = read(file);
  for (const pattern of guaranteePatterns) {
    assert(!pattern.test(text), `${file} contains forbidden guarantee or fake performance language ${pattern}`);
  }
}

assert(/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode), 'AUTH_MODE must remain "placeholder"');
assert(pricing.includes('COMPLETE_ONLINE_PRESENCE_DISPLAY_PRICE = "$495"'), "Active $495 launch price marker is missing");
assert(!pricing.includes('displayPrice: "$295"') && !pricing.includes('displayPrice: "$995"'), "Retired $295/$995 package prices must not return as active display prices");
assert(!app.includes("/owner/") && !app.includes("/operator/"), "Owner/Operator routes must remain parked");
requireIncludes("artifacts/veroxa/src/pages/team-manual-execution.tsx", "No auto-posting", "Manual execution remains pre-live/manual");
requireIncludes("artifacts/veroxa/docs/MANUAL_EXECUTION_CENTER.md", "manual", "Manual execution documentation remains manual");

if (failures.length > 0) {
  console.error("First-client operating suite guardrail failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("First-client operating suite guardrail passed: guarded route, deterministic lifecycle builders, client-safe copy, manual execution boundaries, pricing, auth mode, and parked roles are intact.");
