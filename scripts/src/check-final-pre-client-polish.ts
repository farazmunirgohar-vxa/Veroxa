import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

function requireIncludes(path: string, markers: string[]) {
  const text = read(path);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${path} missing marker: ${marker}`);
  }
  return text;
}

const activeIndex = requireIncludes("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", [
  "highest-level active contributor guide",
  "REAL_AUTH_READINESS_AUDIT.md",
  "PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md",
  "FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md",
  "Complete Online Presence — $495/month",
  "historical/deprecated/archive-only",
]);

const readmeCurrent = requireIncludes("artifacts/veroxa/docs/README_CURRENT_STATE.md", [
  "`ACTIVE_DOCS_INDEX.md` first as the highest-level current source-of-truth index",
  "Do not override `ACTIVE_DOCS_INDEX.md`",
  "Complete Online Presence — $495/month",
]);

if (!activeIndex.includes("Do not override current docs") && !activeIndex.includes("must not override current source-of-truth docs")) {
  failures.push("ACTIVE_DOCS_INDEX.md must warn older docs not to override current docs.");
}
if (readmeCurrent.includes("Active public offer") && !readmeCurrent.includes("Complete Online Presence — $495/month")) {
  failures.push("README_CURRENT_STATE.md active offer conflicts with ACTIVE_DOCS_INDEX.md.");
}

for (const path of [
  "artifacts/veroxa/docs/REAL_AUTH_READINESS_AUDIT.md",
  "artifacts/veroxa/docs/PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md",
  "artifacts/veroxa/docs/FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md",
]) {
  if (!exists(path)) failures.push(`Missing required final polish doc: ${path}`);
}

requireIncludes("artifacts/veroxa/docs/REAL_AUTH_READINESS_AUDIT.md", [
  "audit/checklist only",
  "does **not** activate real auth",
  "`AUTH_MODE` remains `\"placeholder\"`",
  "`public.user_profiles`",
  "`client` and `team`",
  "service-role key",
  "Rollback plan",
]);
requireIncludes("artifacts/veroxa/docs/PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md", [
  "Real Login V1 / Pilot Portal Access Checklist",
  "Sign in to Veroxa",
  "Access your Veroxa portal",
  "Momo House San Antonio",
  "Team Faraz",
  "Real Login V1 uses deterministic/manual pilot access records",
  "`AUTH_MODE` remains `\"placeholder\"`",
]);
requireIncludes("artifacts/veroxa/docs/FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md", [
  "MANUAL_FIRST_CLIENT_LAUNCH_PACK.md",
  "FIRST_CLIENT_CLIENT_INSTRUCTIONS.md",
  "FIRST_CLIENT_TEAM_CHECKLIST.md",
  "FIRST_WEEK_EXECUTION_CHECKLIST.md",
  "FIRST_WEEK_WEEKLY_UPDATE_TEMPLATE.md",
  "FIRST_MONTH_MONTHLY_REPORT_TEMPLATE.md",
  "PAKISTAN_TEAM_EXECUTION_SOP.md",
  "FARAZ_ESCALATION_RULES.md",
]);

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
if (!/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode)) {
  failures.push("AUTH_MODE must remain placeholder.");
}

const clientDataHook = read("artifacts/veroxa/src/hooks/useClientPortalData.ts");
const realEmptyBlock = clientDataHook.slice(clientDataHook.indexOf("!portalDataMode.allowDemoFixtures"), clientDataHook.indexOf("const realClientId"));
for (const marker of ["Demo Grill", "Demo Taco", "Demo Cafe", "demoGoogleMetrics", "DEMO_MONTHLY_PREVIEW", "DEMO_WEEKLY_UPDATE"]) {
  if (realEmptyBlock.includes(marker)) failures.push(`Real /client/* empty state must not contain demo marker ${marker}.`);
}
if (!realEmptyBlock.includes("ZERO_GOOGLE_METRICS") || !realEmptyBlock.includes("Client Portal in review")) {
  failures.push("Real /client/* empty state must keep safe zero/review copy.");
}

const portalLayout = read("artifacts/veroxa/src/components/PortalLayout.tsx");
for (const marker of ["manual/pre-live workspace", "nothing publishes automatically", "No sample progress is shown as client work"]) {
  if (!portalLayout.includes(marker)) failures.push(`PortalLayout missing calm manual/pre-live marker: ${marker}`);
}

const combinedCurrentDocs = [
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/VEROXA_OS_SYSTEM_MAP.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/PRE_PAID_ACTIVATION_GATE.md",
].map(read).join("\n");
for (const forbidden of [
  /Active public pricing is Starter \$295\/month, Growth \$495\/month, and Premium \$995\/month/i,
  /Current pricing remains Starter \$295, Growth \$495, Premium \$995/i,
  /Current service package: Starter \$295, Growth \$495, or Premium \$995/i,
]) {
  if (forbidden.test(combinedCurrentDocs)) failures.push(`Current docs contain stale active pricing pattern: ${forbidden}`);
}

if (failures.length > 0) {
  console.error("Final pre-client polish guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Final pre-client polish guardrail passed.");
