import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const sourceRoots = ["artifacts/veroxa/src"];
const activeFiles = [
  "artifacts/veroxa/src/App.tsx",
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/pages/demo-hub.tsx",
  "artifacts/veroxa/src/components/PortalLayout.tsx",
  "artifacts/veroxa/src/lib/auth/devCredentials.ts",
  "artifacts/veroxa/src/lib/auth/authContract.ts",
  "artifacts/veroxa/src/lib/auth/placeholderSession.ts",
  "artifacts/veroxa/src/components/auth/InternalDemoGuard.tsx",
  "artifacts/veroxa/src/lib/demoRoutes.ts",
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
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
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
for (const required of [
  "Client Demo — sample data only.",
  "Client Portal in review — live account details are being prepared.",
  "Team Portal in review — internal workspace under active build.",
]) {
  if (!portalLayout.includes(required)) failures.push(`PortalLayout is missing banner copy: ${required}`);
}
if (!/getPortalReviewContext\(location\)\.isPublicDemo/.test(portalLayout)) {
  failures.push("PortalLayout must gate 'Back to Client Demo' behind demo-route context.");
}

const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
if (!app.includes('path="/demo/client/dashboard"')) failures.push("App.tsx must expose /demo/client/dashboard.");
for (const publicDemoRoute of [
  "/demo/client/media",
  "/demo/client/updates",
  "/demo/client/requests",
  "/demo/client/reports",
]) {
  if (!app.includes(`path="${publicDemoRoute}"`)) {
    failures.push(`App.tsx must expose ${publicDemoRoute} as a public client demo route.`);
  }
}
if (/path=["']\/demo\/team/.test(app)) failures.push("App.tsx must not expose /demo/team/*.");

// Client Demo nav must stay inside /demo/client/* (no crossover to real /client/*).
if (!/location\.startsWith\(["']\/demo\/client["']\)[\s\S]{0,200}\/demo\/client\//.test(portalLayout)) {
  failures.push("PortalLayout must keep Client Demo nav inside /demo/client/* (no crossover to login-gated /client/*).");
}

const demoHub = readFileSync(join(root, "artifacts/veroxa/src/pages/demo-hub.tsx"), "utf8");
if (!demoHub.includes("/demo/client/dashboard")) failures.push("Demo hub must link to /demo/client/dashboard.");
if (/Team Demo|Demo Team|\/demo\/team/i.test(demoHub)) failures.push("Demo hub must not promote Team Demo.");

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
  "artifacts/veroxa/src/pages/client-requests.tsx",
  "artifacts/veroxa/src/pages/client-updates.tsx",
  "artifacts/veroxa/src/pages/client-reports.tsx",
]) {
  const text = readFileSync(join(root, clientFile), "utf8");
  if (/const\s+DEMO_CLIENT_ID\s*=\s*["']demo-a["']/.test(text)) {
    failures.push(`${clientFile} must not hardcode demo-a as a page-level client id; use active client context/demo boundary.`);
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
if (!/isPublicDemoRoute[\s\S]*allowDemoFixtures:\s*true/.test(realPortalBoundarySource)) {
  failures.push("RealPortalDataBoundary must allow demo fixtures only for public demo route context.");
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

console.log("Portal separation check passed: public demo, client portal, and team portal remain separated.");
