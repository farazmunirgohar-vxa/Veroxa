import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function requireIncludes(file: string, marker: string, label = marker) {
  if (!read(file).includes(marker)) failures.push(`${file} missing marker: ${label}`);
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
    return /\.(ts|tsx)$/.test(entry) ? [child] : [];
  });
}

const manualDomain = "artifacts/veroxa/src/domain/manualExecution";
const manualPage = "artifacts/veroxa/src/pages/team-manual-execution.tsx";
const app = read("artifacts/veroxa/src/App.tsx");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pricing = read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts");

for (const file of ["types.ts", "executionPackBuilder.ts", "manualPublishingTracker.ts", "clientConfirmationWorkflow.ts", "launchGateSignals.ts", "index.ts"]) {
  if (!existsSync(join(root, manualDomain, file))) failures.push(`Manual execution domain file missing: ${file}`);
}

if (!existsSync(join(root, manualPage))) failures.push("Manual Execution Center page missing");

requireIncludes("artifacts/veroxa/src/App.tsx", 'path="/team/manual-execution"', "guarded team manual execution route");
if (!app.includes('path="/team/manual-execution"') || !app.includes('<InternalDemoGuard role="team">') || !app.includes('<RealPortalDataBoundary portal="team">') || !app.includes("<TeamManualExecution />")) {
  failures.push("/team/manual-execution route must remain inside InternalDemoGuard and RealPortalDataBoundary");
}
requireIncludes("artifacts/veroxa/src/lib/teamPortalNav.ts", "Manual Execution", "team nav Manual Execution link");
requireIncludes(manualPage, "Copy/paste execution pack", "copy/paste execution pack panel");
requireIncludes(manualPage, "No auto-posting", "no auto-posting safety language");
requireIncludes(`${manualDomain}/clientConfirmationWorkflow.ts`, "requiresClientConfirmation", "client confirmation workflow");
requireIncludes(`${manualDomain}/manualPublishingTracker.ts`, "Manual", "manual tracker language");
requireIncludes(`${manualDomain}/executionPackBuilder.ts`, "This does not publish anything automatically", "manual non-publishing copy block");

if (!/AUTH_MODE:\s*AuthMode\s*=\s*"placeholder"/.test(authMode)) failures.push('AUTH_MODE must remain "placeholder"');
for (const price of ["$295", "$495", "$995"]) {
  if (!pricing.includes(price)) failures.push(`Locked pricing marker missing: ${price}`);
}

const domainFiles = walk(manualDomain);
const forbiddenDomainImports = [/from\s+["'][^"']*supabase/i, /from\s+["'][^"']*openai/i, /from\s+["'][^"']*(googleapis|@google|facebook|instagram|tiktok|stripe)/i];
const forbiddenLiveLanguage = [/publish(?:es|ed|ing)?\s+(?:to\s+)?(?:Google|Instagram|Facebook|TikTok)/i, /connected to (?:Instagram|Google Business Profile|Facebook|TikTok)/i, /platform API/i, /webhook/i, /cron/i];
for (const file of domainFiles) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenDomainImports) {
    if (pattern.test(text)) failures.push(`${rel} contains forbidden live integration import/reference: ${pattern}`);
  }
  for (const pattern of forbiddenLiveLanguage) {
    if (pattern.test(text) && !/not |No |without |blocked|manual|does not/i.test(text)) {
      failures.push(`${rel} contains unsafe live connector wording: ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Manual execution guardrails failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Manual execution guardrails passed.");
