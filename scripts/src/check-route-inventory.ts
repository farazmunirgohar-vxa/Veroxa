import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pagesDir = join(root, "artifacts/veroxa/src/pages");
const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
const clientNav = readFileSync(join(root, "artifacts/veroxa/src/lib/clientPortalNav.ts"), "utf8");
const teamNav = readFileSync(join(root, "artifacts/veroxa/src/lib/teamPortalNav.ts"), "utf8");
const routeInventory = readFileSync(join(root, "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md"), "utf8");
const routeSurfaceMap = readFileSync(join(root, "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md"), "utf8");
const documentedRoutesText = `${routeInventory}\n${routeSurfaceMap}`;

const failures: string[] = [];
const publicDemoPages = new Set(["client-dashboard.tsx", "demo-hub.tsx", "guided-demo.tsx", "restaurant-upload-access.tsx"]);
const futurePlanned = new Set([
  "client-account.tsx",
  "client-activity-log.tsx",
  "client-ai-draft-preview.tsx",
  "client-calendar.tsx",
  "client-content-pipeline.tsx",
  "client-direction-center.tsx",
  "client-google.tsx",
  "client-health-command.tsx",
  "client-monthly-report.tsx",
  "client-onboarding-center.tsx",
    "client-portal.tsx",
  "client-weekly-report.tsx",
  "client-workspace.tsx",
  "team-activity-feed.tsx",
  "team-adaptive-intelligence.tsx",
  "team-alert-center.tsx",
  "team-ai-review.tsx",
  "team-content-review.tsx",
  "team-drafts.tsx",
  "team-lead-source-lab.tsx",
  "team-media-review.tsx",
  "team-performance.tsx",
  "team-portal.tsx",
  "team-prospect-scanner.tsx",
  "team-scheduling.tsx",
]);
const internalDebug = new Set([
  "auth-status.tsx",
  "internal-architecture.tsx",
  "internal-db-explorer.tsx",
  "internal-demo-controls.tsx",
  "internal-integrations.tsx",
  "internal-permissions.tsx",
  "internal-supabase-readiness.tsx",
  "internal-system-status.tsx",
  "supabase-test.tsx",
]);
const legacyQuarantined = new Set([
  "client-ai-agents.tsx",
  "real-client-placeholder.tsx",
  "real-route-placeholder.tsx",
  "real-team-placeholder.tsx",
]);

const activeRouted = new Set<string>();
for (const match of app.matchAll(/@\/pages\/([a-z0-9-]+)/gi)) {
  activeRouted.add(`${match[1]}.tsx`);
}

function classification(file: string): string {
  if (activeRouted.has(file)) return publicDemoPages.has(file) ? "public_demo" : "active_routed";
  if (internalDebug.has(file)) return "internal_debug";
  if (legacyQuarantined.has(file)) return "legacy_quarantined";
  if (futurePlanned.has(file)) return "future_planned";
  return "delete_candidate";
}

const pages = readdirSync(pagesDir)
  .filter((file) => file.endsWith(".tsx"))
  .sort()
  .map((file) => ({ file, routed: activeRouted.has(file), classification: classification(file) }));

const routePatterns = [
  [/path=["']\/owner(?:\/|["'])/i, "owner routes must not be exposed"],
  [/path=["']\/operator(?:\/|["'])/i, "operator routes must not be exposed"],
  [/path=["']\/super-admin(?:\/|["'])/i, "super admin routes must not be exposed"],
  [/path=["']\/admin(?:\/|["'])/i, "generic admin routes must not be exposed"],
  [/path=["']\/execution(?:\/|["'])/i, "execution routes must not be exposed"],
  [/path=["']\/demo\/team(?:\/|["'])/i, "demo team routes must not be exposed"],
  [/path=["'][^"']*(debug|supabase-test|internal-db|demo-controls)[^"']*["']/i, "debug/internal test pages must not be public routes"],
] as const;
for (const [pattern, message] of routePatterns) {
  if (pattern.test(app)) failures.push(message);
}


const routePaths = [...app.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map((match) => match[1]);
for (const route of routePaths) {
  if (!documentedRoutesText.includes(route)) {
    failures.push(`App.tsx route ${route} must be documented in ROUTE_PAGE_INVENTORY.md or VEROXA_ROUTE_SURFACE_MAP.md.`);
  }
  if (/^\/client\//.test(route) && !/guarded client routes[\s\S]*`\/client\//i.test(documentedRoutesText)) {
    failures.push(`Client route ${route} must be documented as a guarded client route.`);
  }
  if (/^\/team\//.test(route) && !/guarded Team\/manual routes[\s\S]*`\/team\//i.test(documentedRoutesText)) {
    failures.push(`Team route ${route} must be documented as a guarded Team/manual route.`);
  }
  if ((/^\/demo(?:\/|$)/.test(route) || route === "/guided-demo" || route === "/upload") && !/demo\/QA-only routes[\s\S]*`\/demo|demo\/QA-only routes[\s\S]*`\/guided-demo|demo\/QA-only routes[\s\S]*`\/upload/i.test(documentedRoutesText)) {
    failures.push(`Demo/QA route ${route} must be documented as demo/QA-only.`);
  }
}
for (const blockedRoute of ["/owner", "/operator", "/super-admin", "/admin", "/execution"]) {
  if (routePaths.some((route) => route === blockedRoute || route.startsWith(`${blockedRoute}/`))) {
    failures.push(`${blockedRoute} routes are not allowed.`);
  }
}
if (!routeInventory.includes("QUARANTINED_AND_FUTURE_FILES_REVIEW.md") || !routeSurfaceMap.includes("QUARANTINED_AND_FUTURE_FILES_REVIEW.md")) {
  failures.push("Route docs must link QUARANTINED_AND_FUTURE_FILES_REVIEW.md.");
}

const expectedClientLabels = ["Dashboard", "Onboarding", "Media", "Updates", "Requests", "Reports"];
const actualClientLabels = [...clientNav.matchAll(/label:\s*["']([^"']+)["']/g)].map((match) => match[1]);
if (actualClientLabels.join("|") !== expectedClientLabels.join("|")) {
  failures.push(`client nav labels changed: expected ${expectedClientLabels.join(", ")}; found ${actualClientLabels.join(", ")}.`);
}
if (/\/owner|\/operator|\/demo\/team/i.test(clientNav + teamNav)) {
  failures.push("portal nav must not expose owner, operator, or demo team routes.");
}

const activeTeamRoutes = [...teamNav.matchAll(/href:\s*["']([^"']+)["']/g)].map((match) => match[1]);
for (const route of activeTeamRoutes) {
  if (!app.includes(`path="${route}"`)) failures.push(`team nav route ${route} is not routed in App.tsx.`);
}

console.log("Route/page inventory report:");
for (const page of pages) {
  console.log(`- ${page.file} | routed=${page.routed ? "yes" : "no"} | ${page.classification}`);
}

if (failures.length > 0) {
  console.error("Route inventory guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Route inventory guardrail passed: active routes/nav remain contained and unrouted pages are inventoried only.");
