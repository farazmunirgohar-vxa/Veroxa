import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const app = readFileSync(join(root, "artifacts/veroxa/src/App.tsx"), "utf8");
const clientNav = readFileSync(join(root, "artifacts/veroxa/src/lib/clientPortalNav.ts"), "utf8");
const teamNav = readFileSync(join(root, "artifacts/veroxa/src/lib/teamPortalNav.ts"), "utf8");
const routeInventory = readFileSync(join(root, "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md"), "utf8");
const quarantineReview = readFileSync(join(root, "artifacts/veroxa/docs/QUARANTINED_AND_FUTURE_FILES_REVIEW.md"), "utf8");

const failures: string[] = [];

const blockedPageFiles = [
  "client-ai-agents.tsx",
  "client-ai-draft-preview.tsx",
  "team-ai-review.tsx",
  "team-adaptive-intelligence.tsx",
  "team-drafts.tsx",
  "team-prospect-scanner.tsx",
  "auth-status.tsx",
  "internal-architecture.tsx",
  "internal-db-explorer.tsx",
  "internal-demo-controls.tsx",
  "internal-integrations.tsx",
  "internal-permissions.tsx",
  "internal-supabase-readiness.tsx",
  "internal-system-status.tsx",
  "supabase-test.tsx",
  "real-client-placeholder.tsx",
  "real-route-placeholder.tsx",
  "real-team-placeholder.tsx",
];

const blockedRoutePrefixes = ["/owner", "/operator", "/super-admin", "/admin", "/execution"];
const appImportSpecifiers = new Set([...app.matchAll(/@\/pages\/([a-z0-9-]+)/gi)].map((match) => `${match[1]}.tsx`));
const navText = `${clientNav}\n${teamNav}`;
const routePaths = [...app.matchAll(/<Route\s+path=["']([^"']+)["']/g)].map((match) => match[1]);

for (const file of blockedPageFiles) {
  const importName = file.replace(/\.tsx$/, "");
  if (appImportSpecifiers.has(file)) {
    failures.push(`${file} is hard-quarantined/internal-debug/legacy shell and must not be imported by App.tsx.`);
  }
  if (new RegExp(importName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(navText)) {
    failures.push(`${file} is hard-quarantined/internal-debug/legacy shell and must not be referenced in client/team nav.`);
  }
}

for (const prefix of blockedRoutePrefixes) {
  if (routePaths.some((route) => route === prefix || route.startsWith(`${prefix}/`))) {
    failures.push(`${prefix} routes are blocked and must not exist in App.tsx.`);
  }
  if (new RegExp(`href:\\s*["']${prefix}(?:/|["'])`, "i").test(navText)) {
    failures.push(`${prefix} routes are blocked and must not appear in portal nav.`);
  }
}

if (!quarantineReview.includes("Delete now: none confirmed")) {
  failures.push('QUARANTINED_AND_FUTURE_FILES_REVIEW.md must include the marker "Delete now: none confirmed".');
}

if (!routeInventory.includes("active_routed + demo_alias")) {
  failures.push("ROUTE_PAGE_INVENTORY.md must include the dual-use classification `active_routed + demo_alias`.");
}

const requiredDualUseRows = [
  ["client-dashboard.tsx", "/client/dashboard", "/demo/client/dashboard"],
  ["client-onboarding.tsx", "/client/onboarding", "/demo/client/onboarding"],
  ["client-media.tsx", "/client/media", "/demo/client/media"],
  ["client-updates.tsx", "/client/updates", "/demo/client/updates"],
  ["client-requests.tsx", "/client/requests", "/demo/client/requests"],
  ["client-reports.tsx", "/client/reports", "/demo/client/reports"],
] as const;

for (const [file, guardedRoute, demoRoute] of requiredDualUseRows) {
  const row = routeInventory.split("\n").find((line) => line.includes(`\`${file}\``)) ?? "";
  if (!row.includes("active_routed + demo_alias") || !row.includes(guardedRoute) || !row.includes(demoRoute)) {
    failures.push(`${file} must be documented as active_routed + demo_alias with guarded route ${guardedRoute} and demo alias ${demoRoute}.`);
  }
}


const ownerApprovalRule = /owner approval[\s\S]*route inventory update[\s\S]*route surface map update[\s\S]*guardrail update[\s\S]*RR/i;
if (!ownerApprovalRule.test(routeInventory)) {
  failures.push("ROUTE_PAGE_INVENTORY.md must state parked pages require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.");
}
if (!ownerApprovalRule.test(quarantineReview)) {
  failures.push("QUARANTINED_AND_FUTURE_FILES_REVIEW.md must state parked pages require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.");
}

if (failures.length > 0) {
  console.error("Quarantined page safety guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Quarantined page safety guardrail passed: parked/future/debug/legacy pages remain unrouted and documented.");
