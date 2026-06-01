import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..");
const appPath = join(root, "artifacts/veroxa/src/App.tsx");
const app = readFileSync(appPath, "utf8");

const requiredRoutes = [
  "/",
  "/services",
  "/pricing",
  "/free-audit",
  "/demo",
  "/demo/client/dashboard",
  "/demo/client/media",
  "/demo/client/updates",
  "/demo/client/requests",
  "/demo/client/reports",
  "/login",
  "/client/dashboard",
  "/client/media",
  "/client/updates",
  "/client/requests",
  "/client/reports",
  "/team/dashboard",
];

const failures: string[] = [];
for (const route of requiredRoutes) {
  const pattern = new RegExp(`<Route\\s+path=["']${route.replaceAll("/", "\\/")}["']`);
  if (!pattern.test(app)) failures.push(`Missing route smoke coverage target in App.tsx: ${route}`);
}

const teamDashboardBlock = app.match(/<Route path="\/team\/dashboard">[\s\S]*?<\/Route>/)?.[0] ?? "";
if (!teamDashboardBlock.includes("InternalDemoGuard") || !teamDashboardBlock.includes('role="team"')) {
  failures.push("/team/dashboard must remain wrapped by InternalDemoGuard role=team.");
}
if (!teamDashboardBlock.includes("RealPortalDataBoundary")) {
  failures.push("/team/dashboard must remain wrapped by RealPortalDataBoundary.");
}

const clientRoutes = ["dashboard", "media", "updates", "requests", "reports"];
for (const route of clientRoutes) {
  const block = app.match(new RegExp(`<Route path="\\/client\\/${route}">[\\s\\S]*?<\\/Route>`))?.[0] ?? "";
  if (!block.includes("ClientPortalGuard") || !block.includes("RealPortalDataBoundary")) {
    failures.push(`/client/${route} must remain wrapped by client guard and real portal data boundary.`);
  }
}


for (const route of clientRoutes) {
  const demoBlock = app.match(
    new RegExp(String.raw`<Route path="\/demo\/client\/${route}"[\s\S]*?\/>|<Route path="\/demo\/client\/${route}">[\s\S]*?<\/Route>`),
  )?.[0] ?? "";
  if (!demoBlock) {
    failures.push(`/demo/client/${route} must remain present as a public demo route.`);
  }
  if (demoBlock.includes("ClientPortalGuard") || demoBlock.includes("InternalDemoGuard")) {
    failures.push(`/demo/client/${route} must remain public and not be wrapped by login guards.`);
  }
}

for (const file of [
  "client-dashboard.tsx",
  "client-media.tsx",
  "client-updates.tsx",
  "client-requests.tsx",
  "client-reports.tsx",
]) {
  const text = readFileSync(join(root, `artifacts/veroxa/src/pages/${file}`), "utf8");
  if (/href=\{?`?["']?\/client\//.test(text) && !text.includes("getClientPortalHref")) {
    failures.push(`${file} contains an in-page /client/* link without demo-aware route mapping.`);
  }
}

if (!app.includes('const LandingPage = lazy(() => import("@/pages/landing"))')) {
  failures.push("Public routes should remain lazy-loaded from App.tsx.");
}

if (failures.length > 0) {
  console.error("Route smoke guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}

console.log("Route smoke guardrail passed: public, client, demo, and guarded team routes are present.");
