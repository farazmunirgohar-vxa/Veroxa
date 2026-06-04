import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures: string[] = [];

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
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
    return [".ts", ".tsx", ".js", ".jsx"].includes(extname(entry)) ? [child] : [];
  });
}

const devCredentials = read("artifacts/veroxa/src/lib/auth/devCredentials.ts");
const loginPage = read("artifacts/veroxa/src/pages/login.tsx");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const servicesPage = read("artifacts/veroxa/src/pages/services.tsx");
const pricingPage = read("artifacts/veroxa/src/pages/pricing.tsx");
const clientDashboard = read("artifacts/veroxa/src/pages/client-dashboard.tsx");
const clientPortalState = read("artifacts/veroxa/src/domain/saas/clientPortalState.ts");
const realPortalBoundary = read("artifacts/veroxa/src/components/auth/RealPortalDataBoundary.tsx");
const publicNav = read("artifacts/veroxa/src/components/public/PublicNav.tsx");
const app = read("artifacts/veroxa/src/App.tsx");

// Preview login
for (const marker of ["client@veroxa.com", "team@veroxa.com", "farazclient", "farazteam"]) {
  assert(devCredentials.includes(marker), `devCredentials.ts missing preview login marker: ${marker}`);
}
assert(loginPage.includes("getPlaceholderCredentialStatus"), "login page must continue to show placeholder credential status.");
assert(devCredentials.includes("Preview access is enabled for review. Use client@veroxa.com / farazclient or team@veroxa.com / farazteam."), "preview helper text must show the corrected main credentials.");
assert(!loginPage.includes("veroxa-client") && !loginPage.includes("veroxa-team"), "login page must not show incorrect veroxa-client/veroxa-team passwords.");
assert(!devCredentials.includes('"veroxa-client"') && !devCredentials.includes('"veroxa-team"'), "dev credentials must not use incorrect veroxa-client/veroxa-team passwords.");
assert(/AUTH_MODE(?:\s*:\s*AuthMode)?\s*=\s*["']placeholder["']/.test(authMode), 'AUTH_MODE must remain "placeholder".');

// Services / Pricing separation
for (const forbidden of ["$295", "$495", "$995", "/mo", "/month", "pricing-card-"]) {
  assert(!servicesPage.includes(forbidden), `services.tsx must not contain pricing presentation marker: ${forbidden}`);
}
for (const required of [
  "What Veroxa does for restaurants",
  "Core service layers",
  "Google Business Profile and Maps readiness",
  "Social content consistency from client-provided media",
  "Media guidance and reminders",
  "Content preparation and Veroxa team review",
  "Weekly updates",
  "Monthly reporting",
  "Client Portal workflow",
  "Premium ads readiness and support layer",
  "What Veroxa does not handle at launch",
]) {
  assert(servicesPage.includes(required), `services.tsx missing service-layer wording: ${required}`);
}
assert(!servicesPage.includes("services-plan-grid"), "services.tsx must not render the old plan grid.");
assert(servicesPage.includes("Restaurant Services — Veroxa"), "Services page title must be distinct and service-focused.");

for (const required of ["$295", "$495", "$995", "Starter", "Growth", "Premium", "pricing-card-starter", "pricing-card-growth", "pricing-card-premium"]) {
  assert(pricingPage.includes(required), `pricing.tsx missing pricing/plan marker: ${required}`);
}
for (const required of [
  "Google Business Profile support",
  "Facebook support",
  "Instagram support",
  "Up to 3 posts/week depending on usable client-provided media",
  "Everything in Starter",
  "Reels support",
  "TikTok support",
  "Better support / stronger communication",
  "Everything in Growth",
  "Ad management",
  "Up to 1 post/day depending on usable client-provided media",
  "Ad spend separate",
  "Posting depends on usable client-provided media",
  "Premium requires readiness assessment, client approval, and agreed ad budget.",
]) {
  assert(pricingPage.includes(required), `pricing.tsx missing plan inclusion/boundary: ${required}`);
}
assert(pricingPage.includes("Pricing Plans — Veroxa"), "Pricing page title must be distinct and plan-focused.");

// Public nav
for (const navMarker of ["/services", "/pricing", "/login"]) {
  assert(publicNav.includes(navMarker), `Public nav missing link: ${navMarker}`);
}
for (const removedNavMarker of ["/free-audit", "/demo/client/dashboard"]) {
  assert(!publicNav.includes(removedNavMarker), `Public nav must not include removed link: ${removedNavMarker}`);
}

// Client Demo and protected routes
assert(app.includes('path="/demo/client/dashboard" component={ClientDashboard}'), "/demo/client/dashboard must remain public.");
assert(app.includes('path="/client/dashboard"') && app.includes("<ClientPortalGuard>") && app.includes('<RealPortalDataBoundary portal="client">'), "/client/dashboard must remain guarded.");
assert(app.includes('path="/team/dashboard"') && app.includes('<InternalDemoGuard role="team">') && app.includes('<RealPortalDataBoundary portal="team">'), "/team/dashboard must remain guarded.");
assert(app.includes('path="/team/manual-execution"') && app.includes("<TeamManualExecution />"), "/team/manual-execution must remain present.");
assert(app.includes('path="/team/first-client-readiness"') && app.includes("<TeamFirstClientReadiness />"), "/team/first-client-readiness must remain present.");

for (const required of [
  "Demo Preview — example restaurant workspace",
  "This preview shows how Veroxa organizes media, requests, updates, and reports.",
  "Real client data is not connected in this preview.",
  "Nothing goes live without Veroxa team review.",
  "What Veroxa is doing",
  "What Veroxa needs from you",
  "Media supply",
  "Requests needing input",
  "Reports and updates",
]) {
  assert(clientDashboard.includes(required) || clientPortalState.includes(required), `Client demo missing preview marker: ${required}`);
}
for (const [label, text] of [
  ["client-dashboard.tsx", clientDashboard],
  ["clientPortalState.ts", clientPortalState],
  ["RealPortalDataBoundary.tsx", realPortalBoundary],
] as const) {
  const textForClientCopy = text
    .replace(/allowDemoFixtures/g, "")
    .replace(/fixtures/g, "")
    .replace(/fixture/g, "");
  for (const forbidden of ["fixture", "backend", "raw score", "RLS", "Supabase", "connector", "API", "internal risk", "profit math"]) {
    assert(!new RegExp(forbidden, "i").test(textForClientCopy), `${label} contains forbidden client-demo technical term: ${forbidden}`);
  }
  assert(!/real client data is connected/i.test(text), `${label} must not claim real client data is connected.`);
}

// Optional first-client ops route: if it exists, it must be guarded and linked.
const firstClientOpsPage = "artifacts/veroxa/src/pages/team-first-client-ops.tsx";
if (existsSync(join(root, firstClientOpsPage))) {
  assert(app.includes('path="/team/first-client-ops"'), "/team/first-client-ops page exists but route is missing.");
  const routeSlice = app.slice(app.indexOf('path="/team/first-client-ops"'), app.indexOf('path="/team/first-client-ops"') + 700);
  assert(routeSlice.includes('<InternalDemoGuard role="team">') && routeSlice.includes('<RealPortalDataBoundary portal="team">'), "/team/first-client-ops must be guarded with InternalDemoGuard and RealPortalDataBoundary.");
  assert(read("artifacts/veroxa/src/lib/teamPortalNav.ts").includes("First-Client Ops"), "Team nav must include First-Client Ops when route exists.");
}

// Safety: no new live systems or parked role surfacing.
const sourceFiles = walk("artifacts/veroxa/src");
const integrationPatterns = [
  /from\s+["'][^"']*(openai|googleapis|@google|stripe|@stripe)[^"']*["']/i,
  /from\s+["'][^"']*(facebook-nodejs-business-sdk|tiktok|youtube)[^"']*["']/i,
  /createCheckoutSession|checkout\.sessions|webhook|cron\.schedule/i,
  /uploadBytes|createSignedUploadUrl|storage\.from\([^)]*\)\.upload/i,
];
for (const file of sourceFiles) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  for (const pattern of integrationPatterns) {
    assert(!pattern.test(text), `${rel} contains forbidden production/live integration marker: ${pattern}`);
  }
}
for (const price of ["$295", "$495", "$995"]) {
  assert(read("artifacts/veroxa/src/data/pricing/veroxaPricing.ts").includes(price), `Locked pricing source missing ${price}.`);
}
assert(!/Owner|Operator|Super Admin|Generic Admin/.test(publicNav), "Public nav must not introduce parked roles.");

if (failures.length > 0) {
  console.error("Public preview polish guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Public preview polish guardrail passed.");
