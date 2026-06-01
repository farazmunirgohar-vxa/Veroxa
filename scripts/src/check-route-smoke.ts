import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
const failures: string[] = [];

const expectedRoutes = [
  "/",
  "/services",
  "/pricing",
  "/free-audit",
  "/demo",
  "/demo/client/dashboard",
  "/login",
  "/client/dashboard",
  "/client/media",
  "/client/updates",
  "/client/requests",
  "/client/reports",
  "/team/dashboard",
];

for (const route of expectedRoutes) {
  if (!app.includes(`path="${route}"`)) failures.push(`App.tsx is missing smoke route ${route}.`);
}

for (const component of ["LandingPage", "ServicesPage", "PricingPage", "FreeAudit", "ClientMedia", "ClientRequests", "ClientReports", "ClientUpdates", "TeamDashboard"]) {
  if (!new RegExp(`const\\s+${component}\\s*=\\s*lazy\\(`).test(app)) {
    failures.push(`${component} should remain lazy-loaded for route-level confidence.`);
  }
}

const teamRouteStart = app.indexOf('path="/team/dashboard"');
const teamRouteEnd = app.indexOf('path="/team/upload-inbox"');
const teamBlock = teamRouteStart >= 0 && teamRouteEnd > teamRouteStart ? app.slice(teamRouteStart, teamRouteEnd) : "";
if (!teamBlock.includes("InternalDemoGuard") || !teamBlock.includes("RealPortalDataBoundary")) {
  failures.push("/team/dashboard must stay guarded and must not render internal content directly from the public router.");
}

if (!app.includes("<RouteBoundary>")) failures.push("Router must stay wrapped in RouteBoundary.");

if (failures.length > 0) {
  console.error("Route smoke guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Route smoke guardrail passed: core public, client, and team routes are present and guarded.");
