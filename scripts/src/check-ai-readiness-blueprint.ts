import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

function collectFiles(dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    const relative = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collectFiles(relative));
    else files.push(relative);
  }
  return files;
}

function requireFile(path: string): string {
  if (!exists(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return read(path);
}

const blueprint = requireFile("artifacts/veroxa/docs/AI_AUTOMATION_READINESS_BLUEPRINT.md");
const inventory = requireFile("artifacts/veroxa/docs/AI_SERVER_CODE_INVENTORY.md");
const boundary = requireFile("artifacts/veroxa/docs/AI_AUTOMATION_READINESS_BOUNDARY.md");
const activationPrerequisites = requireFile("artifacts/veroxa/docs/AI_ACTIVATION_PREREQUISITES.md");


for (const marker of [
  "production auth",
  "Database/storage architecture",
  "Activity logs",
  "Approval states",
  "Rollback plan",
  "Prompt QA checklist",
  "Cost/rate-limit controls",
  "Data minimization/privacy rules",
  "Failure fallback behavior",
  "Activation requires RR approval",
  "No automatic publishing",
  "No customer messaging",
  "No offer invention",
  "No platform changes",
  "No bypassing Veroxa/Faraz review",
  "requireAiRoutesEnabled",
]) {
  if (!activationPrerequisites.toLowerCase().includes(marker.toLowerCase())) {
    failures.push(`AI activation prerequisites missing marker: ${marker}`);
  }
}

const requiredDomainFiles = [
  "types.ts",
  "aiReadinessContracts.ts",
  "aiPromptBlueprints.ts",
  "aiSuggestionReview.ts",
  "aiReadinessSeedData.ts",
  "aiReadinessSummary.ts",
  "index.ts",
];

if (!exists("artifacts/veroxa/src/domain/aiReadiness")) failures.push("Missing aiReadiness domain folder.");
for (const file of requiredDomainFiles) requireFile(`artifacts/veroxa/src/domain/aiReadiness/${file}`);

const domainFiles = collectFiles("artifacts/veroxa/src/domain/aiReadiness").filter((file) => /\.ts$/.test(file));
const domainText = domainFiles.map((file) => `\n--- ${file}\n${read(file)}`).join("\n");

for (const assistantType of [
  "media_review",
  "caption_draft",
  "weekly_update_draft",
  "monthly_report_draft",
  "request_classification",
  "internal_qa",
]) {
  if (!domainText.includes(assistantType) || !blueprint.includes(assistantType)) {
    failures.push(`Missing required assistant type marker: ${assistantType}`);
  }
}

for (const behavior of [
  "No automatic publishing or customer-visible execution.",
  "No invented offers, discounts, prices, menu items, hours, or claims.",
  "No guaranteed outcomes for orders, rankings, revenue, customers, walk-ins, ROI, profit, or growth.",
  "No public/client exposure of internal proof math",
  "No live platform API actions",
  "No bypass of Veroxa team review",
]) {
  if (!domainText.includes(behavior)) failures.push(`Missing blocked behavior marker: ${behavior}`);
}

for (const review of [
  "veroxa_team_review",
  "faraz_review",
  "business_truth_confirmation",
  "client_confirmation",
  "blocked",
]) {
  if (!domainText.includes(review)) failures.push(`Missing human review gate marker: ${review}`);
}

const forbiddenDomainPatterns: [RegExp, string][] = [
  [/from\s+["']openai["']/i, "OpenAI package import"],
  [/from\s+["']@?anthropic/i, "AI SDK import"],
  [/from\s+["']@google\/generative-ai["']/i, "AI SDK import"],
  [/from\s+["']ai["']/i, "AI SDK import"],
  [/\bfetch\s*\(/i, "fetch/network call"],
  [/\baxios\s*\./i, "axios/network call"],
  [/https?:\/\//i, "network URL"],
  [/\bpublish(?:To|Now|Live|Automatically)\b/i, "live publishing function"],
  [/setInterval\s*\(|schedule\s*\(|createCron|registerWebhook|processBackgroundJob/i, "cron/webhook/background behavior"],
];
for (const [pattern, label] of forbiddenDomainPatterns) {
  if (pattern.test(domainText)) failures.push(`aiReadiness domain contains forbidden ${label}: ${pattern}`);
}

const aiDrafts = requireFile("artifacts/api-server/src/routes/aiDrafts.ts");
const routesIndex = requireFile("artifacts/api-server/src/routes/index.ts");
const openAiDrafts = requireFile("artifacts/api-server/src/lib/openAiDrafts.ts");
const apiSecurity = requireFile("artifacts/api-server/src/middlewares/apiSecurity.ts");

if (!routesIndex.includes("router.use(requireAiRoutesEnabled, aiDraftsRouter)")) {
  failures.push("aiDraftsRouter must remain behind requireAiRoutesEnabled.");
}
const protectedIndex = routesIndex.indexOf("router.use(requireProtectedApiAccess)");
const aiDraftIndex = routesIndex.indexOf("router.use(requireAiRoutesEnabled, aiDraftsRouter)");
if (protectedIndex < 0 || aiDraftIndex < 0 || protectedIndex > aiDraftIndex) {
  failures.push("routes/index.ts must keep requireProtectedApiAccess before AI routes.");
}
if (!routesIndex.includes("router.use(protectedApiRateLimit)")) failures.push("Protected API rate limit must remain before protected routes.");
if (!apiSecurity.includes("requireAiRoutesEnabled") || !apiSecurity.includes("VEROXA_ENABLE_AI_ROUTES")) {
  failures.push("API security middleware must keep AI route enablement guard.");
}
if (!openAiDrafts.includes("OPENAI_API_KEY") || !openAiDrafts.includes('mode: "not_configured"') || !openAiDrafts.includes("rule-based fallback")) {
  failures.push("openAiDrafts.ts must keep missing-key rule-based fallback behavior.");
}
if (!aiDrafts.includes("humanReviewRequired")) failures.push("AI draft route responses must keep human review required markers.");

for (const marker of [
  "server-side only",
  "protected by internal API key",
  "disabled unless `VEROXA_ENABLE_AI_ROUTES=true`",
  "OpenAI draft generation only occurs if `OPENAI_API_KEY` is present",
  "rule-based fallback",
  "This PR does not enable the AI routes",
  "Future activation requires RR approval",
  "Do not connect this to public/client UI or Team automation until a future approved activation build.",
]) {
  if (!inventory.includes(marker)) failures.push(`AI server inventory missing marker: ${marker}`);
}

for (const marker of [
  "No live AI is activated.",
  "No existing AI route is enabled.",
  "No Team Portal complexity is expanded.",
  "Veroxa team review remains the operating gate.",
  "Business-truth confirmation remains mandatory",
]) {
  if (!blueprint.includes(marker)) failures.push(`AI readiness blueprint missing marker: ${marker}`);
}
if (!boundary.includes("Live AI/automation is not active yet")) failures.push("AI boundary doc must remain present and explicit.");

const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-onboarding.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];
const publicClientText = publicClientFiles.filter(exists).map((file) => `\n--- ${file}\n${read(file)}`).join("\n");
for (const pattern of [/AI-powered/i, /OpenAI/i, /autonomous/i, /automatic(?:ally)?\s+publish/i, /customer-visible automated execution/i]) {
  if (pattern.test(publicClientText)) failures.push(`Public/client surface contains forbidden AI or automation wording: ${pattern}`);
}
for (const pattern of [/\$9,?900/i, /requiredDailyOrders/i, /profit math/i, /generated[- ]sales/i, /extra new sales/i]) {
  if (pattern.test(publicClientText)) failures.push(`Public/client surface contains proof math or generated-sales leakage: ${pattern}`);
}
for (const pattern of [/bypass(?:es|ing)?\s+Veroxa team review/i]) {
  if (pattern.test(publicClientText)) failures.push(`Found bypass of Veroxa team review wording: ${pattern}`);
}

const scriptsPackage = requireFile("scripts/package.json");
const rootPackage = requireFile("package.json");
if (!scriptsPackage.includes("check-ai-readiness-blueprint")) failures.push("scripts/package.json must wire check-ai-readiness-blueprint.");
if (!rootPackage.includes("check-ai-readiness-blueprint")) failures.push("root verify:veroxa must wire check-ai-readiness-blueprint.");

if (failures.length > 0) {
  console.error("AI readiness blueprint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AI readiness blueprint guardrail passed.");
