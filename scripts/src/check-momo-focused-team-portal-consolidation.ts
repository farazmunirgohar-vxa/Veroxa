import { readFileSync } from "node:fs";

function read(path: string) { return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"); }
function assert(condition: unknown, message: string) { if (!condition) throw new Error(message); }
function includes(haystack: string, needle: string, label = needle) { assert(haystack.includes(needle), `Missing ${label}`); }

const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const control = read("artifacts/veroxa/src/pages/team-control-center.tsx");
const activeIndex = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const docs = [
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_CONSOLIDATION.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
].map(read).join("\n");

const groupedRoutes = ["/team/momo", "/team/momo/work", "/team/momo/intelligence", "/team/momo/content-ai", "/team/momo/reports", "/team/momo/readiness"];
for (const route of groupedRoutes) {
  const routeIndex = app.indexOf(`path=\"${route}\"`);
  assert(routeIndex >= 0, `Missing grouped route ${route}`);
  const routeBlock = app.slice(routeIndex, app.indexOf("</Route>", routeIndex));
  includes(routeBlock, '<InternalDemoGuard role="team">', `${route} team guard`);
  includes(routeBlock, '<RealPortalDataBoundary portal="team">', `${route} data boundary`);
}

includes(nav, 'href: "/team/momo"', "Team nav /team/momo");
includes(nav, 'label: "Momo Workspace"', "Team nav Momo Workspace label");
includes(control, 'href="/team/momo"', "Team Control Center /team/momo link");

assert(!app.includes('path="/client/momo'), "Unexpected /client/momo route");
for (const role of ["owner", "admin", "operator", "super-admin"]) {
  assert(!app.includes(`role=\"${role}\"`), `Unexpected role ${role}`);
}

for (const route of ["/team/momo-live-readiness", "/team/momo-activation-gate", "/team/momo-pilot-prep", "/team/momo-business-truth", "/team/momo-media-content", "/team/momo-brand-ai-rules", "/team/momo-ai-generation", "/team/momo-ai-approval", "/team/momo-dry-run-go-no-go"]) {
  includes(app, `path=\"${route}\"`, `standalone route ${route}`);
}

const currentSourceListIndex = activeIndex.indexOf("## Current source-of-truth docs");
const activeOverrideListIndex = activeIndex.indexOf("These files reflect", currentSourceListIndex);
assert(currentSourceListIndex >= 0, "ACTIVE_DOCS_INDEX.md missing Current source-of-truth docs section.");
assert(activeOverrideListIndex > currentSourceListIndex, "ACTIVE_DOCS_INDEX.md missing active override list after current source docs section.");
const currentSourceList = activeIndex.slice(currentSourceListIndex, activeOverrideListIndex);

for (const sourceDoc of [
  "`MOMO_FOCUSED_TEAM_PORTAL_CONSOLIDATION.md`",
  "`MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md`",
]) {
  includes(currentSourceList, sourceDoc, `${sourceDoc} in Current source-of-truth docs section`);
}

for (const phrase of [
  "PR #126",
  "Momo-Focused Team Portal Consolidation",
  "AUTH_MODE remains placeholder",
  "/api/pilot-access remains active",
  "Momo owner walkthrough remains blocked",
  "No next activation PR is approved by default",
  "Future real-world activation requires separate explicit Faraz approval",
]) includes(docs, phrase, `docs phrase ${phrase}`);

console.log("Momo-focused Team Portal consolidation guardrail passed.");
