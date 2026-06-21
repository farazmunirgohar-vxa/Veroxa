import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const failures: string[] = [];
const must = (condition: boolean, message: string) => { if (!condition) failures.push(message); };

const app = read("artifacts/veroxa/src/App.tsx");
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const pilotAccess = read("api/pilot-access.ts");
const roles = read("artifacts/veroxa/src/domain/users/permissions.ts") + read("artifacts/veroxa/src/lib/auth/authContract.ts");
const nav = read("artifacts/veroxa/src/components/team/MomoWorkspaceNav.tsx");
const dashboard = read("artifacts/veroxa/src/pages/team-momo-workspace.tsx");
const snapshot = read("artifacts/veroxa/src/lib/momoWorkspace/momoWorkspaceOperatingSnapshot.ts");
const docs = [
  "artifacts/veroxa/docs/MOMO_WORKSPACE_DASHBOARD_OPERATING_SNAPSHOT.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_CONSOLIDATION.md",
  "artifacts/veroxa/docs/MOMO_WORKSPACE_PRIMARY_NAVIGATION_ALIGNMENT.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
].map(read).join("\n");

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE remains placeholder.");
must(pilotAccess.includes("export default") && pilotAccess.includes("manual_pilot_auth"), "/api/pilot-access remains active.");
must(/AppRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles) || /VeroxaRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles), "Roles remain client/team only.");

const momoRouteIndex = app.indexOf('<Route path="/team/momo">');
must(momoRouteIndex >= 0, "/team/momo route still exists.");
const momoRouteBlock = momoRouteIndex >= 0 ? app.slice(momoRouteIndex, app.indexOf("</Route>", momoRouteIndex) + "</Route>".length) : "";
must(momoRouteBlock.includes('<InternalDemoGuard role="team">'), "/team/momo remains guarded by InternalDemoGuard role=team.");
must(momoRouteBlock.includes('<RealPortalDataBoundary portal="team">'), "/team/momo remains wrapped in RealPortalDataBoundary portal=team.");

for (const href of ["/team/momo", "/team/momo/work", "/team/momo/intelligence", "/team/momo/content-ai", "/team/momo/reports", "/team/momo/readiness"]) {
  must(nav.includes(href), `MomoWorkspaceNav must link ${href}.`);
}

must(dashboard.includes("momoWorkspaceOperatingSnapshot") || dashboard.includes("momoWorkspaceSnapshotCategories"), "Momo Dashboard must import/use operating snapshot model.");
for (const copy of [
  "Momo-only internal workspace.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
]) must(dashboard.includes(copy), `Dashboard missing safety copy: ${copy}`);

for (const label of [
  "Operating snapshot", "Top blockers", "Business truth", "Media/content", "Brand/AI rules", "AI generation", "AI approval", "Reports/activity", "Readiness/dry run", "Safety boundaries", "Safe next internal actions",
]) must(dashboard.includes(label), `Dashboard missing section label: ${label}`);

must(!app.includes('path="/client/momo'), "No /client/momo route exists.");
must(!/role\s*===\s*["'](owner|operator|admin|super_admin|super-admin)["']|AppRole\s*=.*owner|VeroxaRole\s*=.*operator/i.test(app + roles + dashboard + snapshot), "No owner/admin/operator/super-admin role is added.");

for (const marker of ["GitHub PR #129", "Momo Workspace Dashboard Operating Snapshot only", "PR #129 improves `/team/momo` as an internal operating snapshot/dashboard"]) {
  must(docs.includes(marker), `Docs mention PR #129 dashboard operating snapshot only: ${marker}`);
}
for (const marker of ["does not activate the pilot", "does not activate real auth", "does not create credentials", "does not contact Momo’s House", "does not publish externally", "does not connect external platforms", "does not generate AI output", "fake metrics", "fake reports", "fake activity", "fake readiness"]) {
  must(docs.includes(marker), `Docs missing safety marker: ${marker}`);
}

for (const marker of ["PR #120 remains the current operating baseline", "PR #126", "PR #128", "business truth", "media usage rights", "AI generation remains disabled by default", "No pilot activation", "No real auth activation", "No Momo contact"]) {
  must(snapshot.includes(marker), `Snapshot model missing marker: ${marker}`);
}

if (failures.length) {
  console.error("Momo workspace dashboard operating snapshot guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Momo workspace dashboard operating snapshot guardrail passed.");
