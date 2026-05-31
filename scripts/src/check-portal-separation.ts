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
    if (line.includes("Back to Demo Hub") && file !== "artifacts/veroxa/src/components/PortalLayout.tsx") {
      report(file, idx + 1, "uses demo-hub back link outside the route-aware layout", line);
    }
  });
}

const portalLayout = readFileSync(join(root, "artifacts/veroxa/src/components/PortalLayout.tsx"), "utf8");
for (const required of [
  "Public Demo Preview — sample data only.",
  "Client Portal Review — Veroxa OS is being built with setup data while live client accounts are prepared.",
  "Team Portal Review — internal Veroxa OS workspace under active build.",
]) {
  if (!portalLayout.includes(required)) failures.push(`PortalLayout is missing banner copy: ${required}`);
}
if (!/getPortalReviewContext\(location\)\.isPublicDemo/.test(portalLayout)) {
  failures.push("PortalLayout must gate 'Back to Demo Hub' behind demo-route context.");
}

const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
if (!app.includes('path="/demo/client/dashboard"')) failures.push("App.tsx must expose /demo/client/dashboard.");
if (/path=["']\/demo\/team/.test(app)) failures.push("App.tsx must not expose /demo/team/*.");

const demoHub = readFileSync(join(root, "artifacts/veroxa/src/pages/demo-hub.tsx"), "utf8");
if (!demoHub.includes("/demo/client/dashboard")) failures.push("Demo hub must link to /demo/client/dashboard.");
if (/Team Demo|Demo Team|\/demo\/team/i.test(demoHub)) failures.push("Demo hub must not promote Team Demo.");

const loginAndAuth = [
  "artifacts/veroxa/src/pages/login.tsx",
  "artifacts/veroxa/src/lib/auth/devCredentials.ts",
  "artifacts/veroxa/src/lib/auth/authContract.ts",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
if (/setLocation\([^)]+\/demo\/client\/dashboard/.test(loginAndAuth) || /client:\s*["']\/demo\/client\/dashboard/.test(loginAndAuth)) {
  failures.push("Placeholder/login contract must not route client login to /demo/client/dashboard.");
}
if (/\/demo\/team/.test(loginAndAuth)) failures.push("Placeholder/login contract must not route to /demo/team/*.");

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
