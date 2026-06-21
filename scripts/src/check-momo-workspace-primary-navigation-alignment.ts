import { readFileSync } from "node:fs";

function read(path: string) { return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"); }
function assert(condition: unknown, message: string) { if (!condition) throw new Error(message); }
function includes(haystack: string, needle: string, label = needle) { assert(haystack.includes(needle), `Missing ${label}`); }

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pilotAccess = read("api/pilot-access.ts");
const demoRoutes = read("artifacts/veroxa/src/lib/demoRoutes.ts");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const workspaceNav = read("artifacts/veroxa/src/components/team/MomoWorkspaceNav.tsx");
const docs = [
  "artifacts/veroxa/docs/MOMO_WORKSPACE_PRIMARY_NAVIGATION_ALIGNMENT.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_CONSOLIDATION.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
].map(read).join("\n");

includes(authMode, 'export const AUTH_MODE: AuthMode = "placeholder";', "AUTH_MODE placeholder");
includes(pilotAccess, "momo", "/api/pilot-access Momo access");
includes(demoRoutes, 'export type DemoPortal = "client" | "team";', "client/team roles only route registry");

const groupedRoutes = ["/team/momo", "/team/momo/work", "/team/momo/intelligence", "/team/momo/content-ai", "/team/momo/reports", "/team/momo/readiness"];
for (const route of groupedRoutes) {
  includes(nav, `href: "${route}"`, `Team nav ${route}`);
  includes(workspaceNav, `href: "${route}"`, `MomoWorkspaceNav ${route}`);
  includes(app, `path="${route}"`, `App grouped route ${route}`);
}

const standaloneRoutes = ["/team/momo-live-readiness", "/team/momo-activation-gate", "/team/momo-pilot-prep", "/team/momo-business-truth", "/team/momo-media-content", "/team/momo-brand-ai-rules", "/team/momo-ai-generation", "/team/momo-ai-approval", "/team/momo-dry-run-go-no-go"];
for (const route of standaloneRoutes) {
  includes(nav, `href: "${route}"`, `Team nav standalone detail ${route}`);
  includes(app, `path="${route}"`, `App standalone detail route ${route}`);
}

assert(!app.includes('path="/client/momo'), "Unexpected /client/momo route exists");
for (const role of ["owner", "admin", "operator", "super-admin"]) {
  assert(!app.includes(`role="${role}"`), `Unexpected active App role ${role}`);
}

for (const phrase of [
  "GitHub PR #128 adds Momo Workspace Primary Navigation Alignment only",
  "PR #120 remains the current operating baseline",
  "PR #123 locked the Momo-focused Team Portal direction",
  "PR #126 added grouped Momo workspace routes",
  "PR #127 elevated the Momo workspace docs into the current source-of-truth list",
  "primary navigation path while preserving standalone routes as compatibility/detail routes",
  "does not activate the pilot",
  "does not activate real auth",
  "does not create credentials",
  "does not contact Momo’s House",
  "does not publish externally",
  "does not connect external platforms",
  "does not generate AI output",
  "AUTH_MODE remains placeholder",
  "/api/pilot-access remains active",
  "Roles remain client/team only",
  "Momo owner walkthrough remains blocked",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
]) includes(docs, phrase, `docs phrase: ${phrase}`);

console.log("Momo Workspace primary navigation alignment guardrail passed.");
