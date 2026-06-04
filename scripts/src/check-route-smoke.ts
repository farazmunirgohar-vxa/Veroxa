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
  "/team/upload-inbox",
  "/team/work-queue",
  "/team/direction-queue",
  "/team/report-queue",
  "/team/audit-leads",
  "/team/approval-queue",
  "/team/visibility-audit",
  "/team/first-client-readiness",
  "/team/first-client-ops",
  "/team/manual-execution",
];

const teamRoutes = [
  "dashboard",
  "upload-inbox",
  "work-queue",
  "direction-queue",
  "report-queue",
  "audit-leads",
  "approval-queue",
  "visibility-audit",
  "first-client-readiness",
  "first-client-ops",
  "manual-execution",
];

const failures: string[] = [];

const registeredRoutes = new Set(
  [...app.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map((match) => match[1]),
);

const activePageFiles = new Set(
  [...app.matchAll(/@\/pages\/([a-z0-9-]+)/gi)].map(
    (match) => `${match[1]}.tsx`,
  ),
);

for (const file of activePageFiles) {
  if (!file.startsWith("team-")) continue;
  const pagePath = join(root, `artifacts/veroxa/src/pages/${file}`);
  const pageText = readFileSync(pagePath, "utf8");
  for (const match of pageText.matchAll(
    /["'`]((?:\/team\/)[a-z0-9-]+)["'`]/gi,
  )) {
    const linkedRoute = match[1];
    if (!registeredRoutes.has(linkedRoute)) {
      failures.push(
        `${file} links to unregistered team route ${linkedRoute}; register it in App.tsx or remove/change the link.`,
      );
    }
  }
}
for (const route of requiredRoutes) {
  const pattern = new RegExp(
    `<Route\\s+path=["']${route.replaceAll("/", "\\/")}["']`,
  );
  if (!pattern.test(app))
    failures.push(`Missing route smoke coverage target in App.tsx: ${route}`);
}

for (const route of teamRoutes) {
  const block =
    app.match(
      new RegExp(`<Route path="\/team\/${route}">[\\s\\S]*?<\/Route>`),
    )?.[0] ?? "";
  if (!block.includes("InternalDemoGuard") || !block.includes('role="team"')) {
    failures.push(
      `/team/${route} must remain wrapped by InternalDemoGuard role=team.`,
    );
  }
  if (!block.includes("RealPortalDataBoundary")) {
    failures.push(
      `/team/${route} must remain wrapped by RealPortalDataBoundary.`,
    );
  }
}

const clientRoutes = ["dashboard", "media", "updates", "requests", "reports"];
for (const route of clientRoutes) {
  const block =
    app.match(
      new RegExp(`<Route path="\\/client\\/${route}">[\\s\\S]*?<\\/Route>`),
    )?.[0] ?? "";
  if (
    !block.includes("ClientPortalGuard") ||
    !block.includes("RealPortalDataBoundary")
  ) {
    failures.push(
      `/client/${route} must remain wrapped by client guard and real portal data boundary.`,
    );
  }
}

for (const route of clientRoutes) {
  const demoBlock =
    app.match(
      new RegExp(
        String.raw`<Route path="\/demo\/client\/${route}"[\s\S]*?\/>|<Route path="\/demo\/client\/${route}">[\s\S]*?<\/Route>`,
      ),
    )?.[0] ?? "";
  if (!demoBlock) {
    failures.push(
      `/demo/client/${route} must remain present as a public demo route.`,
    );
  }
  if (
    demoBlock.includes("ClientPortalGuard") ||
    demoBlock.includes("InternalDemoGuard")
  ) {
    failures.push(
      `/demo/client/${route} must remain public and not be wrapped by login guards.`,
    );
  }
}

for (const file of [
  "client-dashboard.tsx",
  "client-media.tsx",
  "client-updates.tsx",
  "client-requests.tsx",
  "client-reports.tsx",
]) {
  const text = readFileSync(
    join(root, `artifacts/veroxa/src/pages/${file}`),
    "utf8",
  );
  if (
    /href=\{?`?["']?\/client\//.test(text) &&
    !text.includes("getClientPortalHref")
  ) {
    failures.push(
      `${file} contains an in-page /client/* link without demo-aware route mapping.`,
    );
  }
}

if (
  !app.includes('const LandingPage = lazy(() => import("@/pages/landing"))')
) {
  failures.push("Public routes should remain lazy-loaded from App.tsx.");
}

if (failures.length > 0) {
  console.error(
    "Route smoke guardrail failed:\n" +
      failures.map((f) => `- ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  "Route smoke guardrail passed: public, client, demo, and guarded team routes are present.",
);
