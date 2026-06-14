import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const sourceRoots = ["artifacts/veroxa/src"];
const activeFiles = [
  "artifacts/veroxa/src/App.tsx",
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/components/PortalLayout.tsx",
  "artifacts/veroxa/src/lib/auth/devCredentials.ts",
  "artifacts/veroxa/src/lib/auth/authContract.ts",
  "artifacts/veroxa/src/lib/auth/placeholderSession.ts",
  "artifacts/veroxa/src/components/auth/InternalDemoGuard.tsx",
  "artifacts/veroxa/src/lib/clientPortalNav.ts",
  "artifacts/veroxa/src/lib/teamPortalNav.ts",
];
const docFiles = [
  "AGENTS.md",
  "artifacts/veroxa/docs/PRICING_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/PUBLIC_PRICING_AND_SERVICES.md",
  "artifacts/veroxa/docs/VEROXA_OS_LOCKED_MODEL.md",
  "artifacts/veroxa/docs/FIRST_CLIENT_READINESS_CHECKLIST.md",
  "artifacts/veroxa/docs/AUTH_ARCHITECTURE_PLAN.md",
  "artifacts/veroxa/docs/AUTH_ROLLBACK_PLAN.md",
  "artifacts/veroxa/docs/ROUTE_VISIBILITY_STRATEGY.md",
  "artifacts/veroxa/src/lib/supabase/README.md",
].filter((file) => {
  try { statSync(join(root, file)); return true; } catch { return false; }
});

const sourceExtensions = new Set([".ts", ".tsx", ".md"]);
const failures: string[] = [];
const realPortalPages = [
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-messages.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-connections.tsx",
  "artifacts/veroxa/src/pages/client-profile.tsx",
  "artifacts/veroxa/src/pages/team-dashboard.tsx",
  "artifacts/veroxa/src/pages/team-upload-inbox.tsx",
  "artifacts/veroxa/src/pages/team-work-queue.tsx",
  "artifacts/veroxa/src/pages/team-direction-queue.tsx",
  "artifacts/veroxa/src/pages/team-report-queue.tsx",
  "artifacts/veroxa/src/pages/team-audit-leads.tsx",
  "artifacts/veroxa/src/pages/team-approval-queue.tsx",
  "artifacts/veroxa/src/pages/team-visibility-audit.tsx",
] as const;

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (sourceExtensions.has(extname(entry.name))) files.push(full);
  }
  return files;
}

function rel(fullPath: string): string {
  return fullPath.startsWith(root) ? fullPath.slice(root.length + 1) : fullPath;
}

function isHistoricalContext(line: string): boolean {
  return /historical|deprecated|legacy|removed|not active|no longer active|retired/i.test(line);
}

function report(file: string, line: number, message: string, text: string) {
  failures.push(`${file}:${line} ${message}: ${text.trim()}`);
}

// Active route/auth/nav files must never reintroduce team demo or login-to-demo drift.
for (const file of activeFiles) {
  const text = readFileSync(join(root, file), "utf8");
  text.split(/\r?\n/).forEach((line, idx) => {
    if (/\/demo\/team/.test(line)) report(file, idx + 1, "contains inactive /demo/team route", line);
    if (/Team Demo|Demo Team/.test(line)) report(file, idx + 1, "contains Team Demo wording", line);
    if (/getDevRouteForRole|ROLE_HOME_PATH|DEMO_ROLE_HOME_PATH/.test(text)) {
      if (/client:\s*["']\/demo\/client\/dashboard["']/.test(line)) {
        report(file, idx + 1, "routes placeholder client login/fallback to public demo", line);
      }
      if (/team:\s*["']\/demo\/team/.test(line)) {
        report(file, idx + 1, "routes placeholder team login/fallback to team demo", line);
      }
    }
    if (/(\/client\/|\/team\/).{0,80}public demo|public demo.{0,80}(\/client\/|\/team\/)/i.test(line)) {
      report(file, idx + 1, "labels real portal paths as public demo", line);
    }
  });
}

// Only PortalLayout may contain the exact back-link copy among active portal shell files.
for (const file of activeFiles) {
  const text = readFileSync(join(root, file), "utf8");
  text.split(/\r?\n/).forEach((line, idx) => {
    if (line.includes("Back to Client Demo") && file !== "artifacts/veroxa/src/components/PortalLayout.tsx") {
      report(file, idx + 1, "uses demo-hub back link outside the route-aware layout", line);
    }
  });
}

const portalLayout = readFileSync(join(root, "artifacts/veroxa/src/components/PortalLayout.tsx"), "utf8");
if (!portalLayout.includes("Team Portal in review — manual/pre-live workspace.")) {
  failures.push("PortalLayout is missing the team pre-live banner copy.");
}
for (const removedClientCopy of [
  "Client Portal in review — Veroxa is preparing the restaurant workspace.",
  "No sample progress is shown as client work.",
]) {
  if (portalLayout.includes(removedClientCopy)) failures.push(`PortalLayout still includes removed client review banner copy: ${removedClientCopy}`);
}

const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
for (const blockedDemoRoute of ["/demo", "/guided-demo", "/upload", "/demo/client/dashboard", "/demo/client/media", "/demo/client/updates", "/demo/client/requests", "/demo/client/reports", "/demo/client/onboarding", "/demo/team"]) {
  if (app.includes(`path="${blockedDemoRoute}`) || app.includes(`path='${blockedDemoRoute}`)) {
    failures.push(`App.tsx must not expose retired public demo/preview route ${blockedDemoRoute}.`);
  }
}

function routeBlock(route: string): string {
  const escaped = route.replaceAll("/", "\\/");
  return app.match(new RegExp(`<Route path=["']${escaped}["']>[\\s\\S]*?<\\/Route>`))?.[0] ?? "";
}

for (const route of ["dashboard", "media", "messages", "updates", "requests", "reports", "connections", "profile"]) {
  const block = routeBlock(`/client/${route}`);
  if (!block.includes("ClientPortalGuard")) {
    failures.push(`/client/${route} must remain wrapped by ClientPortalGuard.`);
  }
}

for (const route of [
  "dashboard",
  "upload-inbox",
  "work-queue",
  "direction-queue",
  "report-queue",
  "audit-leads",
  "approval-queue",
  "visibility-audit",
  "first-client-readiness",
]) {
  const block = routeBlock(`/team/${route}`);
  if (!block.includes("InternalDemoGuard") || !block.includes('role="team"')) {
    failures.push(`/team/${route} must remain wrapped by InternalDemoGuard role=team.`);
  }
}

// Public demo/preview portal routes are retired; no demo hub or demo nav is required in real-pilot mode.

const loginAndAuth = [
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/lib/auth/devCredentials.ts",
  "artifacts/veroxa/src/lib/auth/authContract.ts",
  "artifacts/veroxa/src/lib/auth/placeholderSession.ts",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
if (/setLocation\([^)]+\/demo\/client\/dashboard/.test(loginAndAuth) || /client:\s*["']\/demo\/client\/dashboard/.test(loginAndAuth)) {
  failures.push("Placeholder/login contract must not route client login to /demo/client/dashboard.");
}
if (/\/demo\/team/.test(loginAndAuth)) failures.push("Placeholder/login contract must not route to /demo/team/*.");

const internalGuardSource = readFileSync(join(root, "artifacts/veroxa/src/components/auth/InternalDemoGuard.tsx"), "utf8");
if (!internalGuardSource.includes("useAuth()")) {
  failures.push("InternalDemoGuard must read auth state for team route containment.");
}
if (/AUTH_MODE === ["']placeholder["'][\s\S]{0,400}return <>{children}<\/>/.test(internalGuardSource)) {
  failures.push("InternalDemoGuard must not render team children from AUTH_MODE === placeholder alone.");
}
if (!loginAndAuth.includes("createPlaceholderSession") || !internalGuardSource.includes('auth.status === "unauthenticated"')) {
  failures.push("Placeholder team access must require a session marker created after successful login.");
}

const clientGuardSource = readFileSync(
  join(root, "artifacts/veroxa/src/components/auth/ClientPortalGuard.tsx"),
  "utf8",
);
if (!clientGuardSource.includes("useAuth()")) {
  failures.push("ClientPortalGuard must read auth state for client route containment.");
}
if (/AUTH_MODE === ["']placeholder["'][\s\S]{0,120}return <>\{children\}<\/>/.test(clientGuardSource)) {
  failures.push("ClientPortalGuard must not render client children from AUTH_MODE === placeholder alone.");
}
if (!clientGuardSource.includes('auth.status === "unauthenticated"')) {
  failures.push("ClientPortalGuard must show a login-required state for unauthenticated client access.");
}

for (const clientFile of [
  "artifacts/veroxa/src/pages/client-dashboard.tsx",
  "artifacts/veroxa/src/pages/client-media.tsx",
  "artifacts/veroxa/src/pages/client-messages.tsx",
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
  "artifacts/veroxa/src/pages/client-connections.tsx",
  "artifacts/veroxa/src/pages/client-profile.tsx",
]) {
  const text = readFileSync(join(root, clientFile), "utf8");
  if (/const\s+DEMO_CLIENT_ID\s*=\s*["']demo-a["']/.test(text)) {
    failures.push(`${clientFile} must not hardcode demo-a as a page-level client id; use active client context/demo boundary.`);
  }
  if (/href=\{?`?["']?\/client\//.test(text) && !text.includes("getClientPortalHref")) {
    failures.push(`${clientFile} hardcodes an in-page /client/* link without demo-aware getClientPortalHref mapping.`);
  }
}

const authModeSource = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/authMode.ts"), "utf8");
const loginSource = readFileSync(join(root, "artifacts/veroxa/src/pages/login.tsx"), "utf8");
const devCredentialsSource = readFileSync(join(root, "artifacts/veroxa/src/lib/auth/devCredentials.ts"), "utf8");
if (/export\s+const\s+AUTH_MODE(?:\s*:\s*AuthMode)?\s*=\s*["']real["']/.test(authModeSource)) {
  if (/DEV_ROLE_CREDENTIALS|validateDevCredentials|getDevRouteForRole/.test(devCredentialsSource)) {
    failures.push(
      "AUTH_MODE is real while placeholder dev credential helpers still exist in devCredentials.ts. Remove the placeholder file/stub before real auth.",
    );
  }
  if (/validateDevCredentials|getDevRouteForRole|AUTH_MODE\s*===\s*["']placeholder["']/.test(loginSource)) {
    failures.push(
      "AUTH_MODE is real while login.tsx still contains the placeholder credential branch. Remove the branch before real auth.",
    );
  }
}

const realPortalBoundarySource = readFileSync(
  join(root, "artifacts/veroxa/src/components/auth/RealPortalDataBoundary.tsx"),
  "utf8",
);
if (/isPublicDemoRoute[\s\S]*allowDemoFixtures:\s*true/.test(realPortalBoundarySource) && app.includes("/demo/client/")) {
  failures.push("Public demo fixture mode must not be active now that demo portal routes are retired.");
}
if (!/isLiveDataConnected:\s*false,\s*\n\s*allowDemoFixtures:\s*false/.test(realPortalBoundarySource)) {
  failures.push("RealPortalDataBoundary must default real /client/* and /team/* routes to no live data and no demo fixtures.");
}

for (const file of realPortalPages) {
  const pageSource = readFileSync(join(root, file), "utf8");
  const referencesDemoFixtureData =
    /from ["']@\/data\/(demo|uploadKeys|workflows|direction)/.test(pageSource) ||
    /\bdemo-[a-e]\b|demoClient|demoUpload|demoWeekly|demoMonthly|DEMO_SEED|fixtureItems|sample fallback/i.test(pageSource);
  if (!referencesDemoFixtureData) continue;

  if (!pageSource.includes("useRealPortalDataMode")) {
    failures.push(`${file} references demo/fixture data without reading RealPortalDataBoundary mode.`);
  }
  if (!pageSource.includes("allowDemoFixtures") || !pageSource.includes("canUseFixtureData")) {
    failures.push(`${file} references demo/fixture data without an explicit allowDemoFixtures/canUseFixtureData gate.`);
  }
  if (!/!canUseFixtureData|canUseFixtureData\s*\?|canUseFixtureData\s*&&/.test(pageSource)) {
    failures.push(`${file} references demo/fixture data without an explicit non-fixture empty/review state.`);
  }
}

// Docs may mention historical team demo only when explicitly marked.
for (const file of docFiles) {
  const text = readFileSync(join(root, file), "utf8");
  let historicalSection = false;
  text.split(/\r?\n/).forEach((line, idx) => {
    if (/^#{1,6}\s/.test(line)) historicalSection = isHistoricalContext(line);
    if ((/\/demo\/team|Team Demo|Demo Team/.test(line)) && !historicalSection && !isHistoricalContext(line)) {
      report(file, idx + 1, "mentions inactive Team Demo without historical/deprecated/legacy context", line);
    }
  });
}

if (failures.length) {
  console.error("Portal separation check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal separation check passed: real-pilot public surface, client portal, and Team Faraz portal remain separated; demo/preview portals are retired.");
