import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const failures: string[] = [];
const read = (p: string) => readFileSync(join(root, p), "utf8");

const landing = read("artifacts/veroxa/src/pages/landing.tsx");
const pricing = read("artifacts/veroxa/src/pages/pricing.tsx");
const nav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
const app = read("artifacts/veroxa/src/App.tsx");
const aiBoundary = read("artifacts/veroxa/docs/AI_AUTOMATION_READINESS_BOUNDARY.md");

if (landing.includes("text-5xl md:text-7xl")) failures.push("Landing hero headline must not use the oversized text-5xl md:text-7xl scale.");
if (!landing.includes("text-4xl md:text-5xl lg:text-6xl")) failures.push("Landing hero headline must use the final-trim premium scale.");
if (landing.includes("Home → Audit → Login")) failures.push("Landing hero must not show the route-like Home → Audit → Login phrase.");
if (!landing.includes("Restaurant online presence review")) failures.push("Landing hero pill must use cleaner restaurant online presence review language.");

if (!nav.includes("Veroxa")) failures.push("PublicNav must render the centered Veroxa brand.");
for (const forbidden of ['label: "Home"', 'label: "Audit"', 'label: "Login"', 'href: "/free-audit"', 'href: "/login"', "nav-link-home", "nav-link-audit", "nav-link-login"]) {
  if (nav.includes(forbidden)) failures.push(`PublicNav must not restore public header navigation: ${forbidden}`);
}

for (const [file, text] of [["landing", landing], ["pricing", pricing]] as const) {
  const srOnlyLines = text.split(/\r?\n/).filter((line) => line.includes("sr-only"));
  for (const line of srOnlyLines) {
    if (/\$495|\+\$95|\+\$45|Complete Online Presence|Add-ons/i.test(line)) {
      failures.push(`${file} contains hidden pricing/add-on marker stuffing: ${line.trim()}`);
    }
  }
}

const publicClientFiles = [
  "artifacts/veroxa/src/pages/landing.tsx",
  "artifacts/veroxa/src/pages/services.tsx",
  "artifacts/veroxa/src/pages/pricing.tsx",
  "artifacts/veroxa/src/pages/free-audit.tsx",
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-onboarding.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
];
const forbiddenClientTerms = [
  "database write",
  "storage uploads",
  "API",
  "OpenAI",
  "Supabase",
  "RLS",
  "fixture",
  "raw score",
  "internal risk",
  "$9,900",
  "requiredDailyOrders",
  "net margin",
  "break-even",
  "generated sales",
  "profit math",
];
for (const file of publicClientFiles) {
  const text = read(file);
  for (const term of forbiddenClientTerms) {
    const pattern = term === "API" ? /\bAPI\b/ : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (pattern.test(text)) failures.push(`${file} contains final-trim client-unsafe term: ${term}`);
  }
}

for (const marker of ["/demo", "/guided-demo", "/upload", "/demo/client/dashboard", "/services", "/pricing", "/client/onboarding", "/team/manual-execution"]) {
  if (!app.includes(`path=\"${marker}\"`)) failures.push(`App route inventory missing expected route marker ${marker}`);
}

for (const marker of [
  "preview/manual/pre-live",
  "media review suggestions",
  "caption drafts",
  "weekly update drafts",
  "monthly report drafts",
  "request classification",
  "client-safe summaries",
  "internal QA checks",
  "Publish automatically",
  "No cron or background jobs yet",
  "No webhooks yet",
  "No customer-visible automated execution yet",
  "No platform connectors yet",
  "production auth",
  "Database and storage architecture",
  "Activity logs and audit trails",
  "Rollback plan",
  "Prompt QA",
  "RR approval",
  "Live AI/automation is not active yet",
]) {
  if (!aiBoundary.toLowerCase().includes(marker.toLowerCase())) failures.push(`AI automation boundary doc missing marker: ${marker}`);
}

const sourceSurface = [
  read("artifacts/veroxa/src/App.tsx"),
  read("artifacts/veroxa/src/pages/landing.tsx"),
  read("artifacts/veroxa/src/pages/free-audit.tsx"),
  read("artifacts/veroxa/src/pages/login.tsx"),
  read("artifacts/veroxa/src/pages/client-dashboard.tsx"),
  read("artifacts/veroxa/src/pages/client-media.tsx"),
  read("artifacts/veroxa/src/pages/client-requests.tsx"),
  read("artifacts/veroxa/src/pages/client-updates.tsx"),
  read("artifacts/veroxa/src/pages/client-reports.tsx"),
].join("\n");
for (const risky of [/from\s+["']openai["']/i, /createCheckout|Stripe\(/i, /publishAutomatically|automatedPublishing/i, /setInterval\(|setTimeout\([^,]+,\s*(?:60|300|600|900|1800|3600)\s*000/i]) {
  if (risky.test(sourceSurface)) failures.push(`Final-trim source surface suggests blocked live AI/payment/automation behavior: ${risky}`);
}

const docs = [
  read("AGENTS.md"),
  read("artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md"),
  read("artifacts/veroxa/docs/VEROXA_90_PERCENT_PREPAID_OS_READINESS_MAP.md"),
].join("\n");
for (const marker of ["Team Portal complexity", "deferred", "supporting/action-focused", "no AI command-center automation", "Owner/Operator/Super Admin/generic Admin/Execution dashboards"]) {
  if (!docs.includes(marker)) failures.push(`Team deferral docs missing final-trim marker: ${marker}`);
}

if (failures.length > 0) {
  console.error("Final trim AI readiness guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Final trim AI readiness guardrail passed.");
