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
const workPage = read("artifacts/veroxa/src/pages/team-momo-work.tsx");
const workModel = read("artifacts/veroxa/src/lib/momoWorkspace/momoWorkQueueBoard.ts");
const docs = [
  "artifacts/veroxa/docs/MOMO_WORK_QUEUE_DAILY_OPERATING_BOARD.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/MOMO_FOCUSED_TEAM_PORTAL_DIRECTION.md",
  "artifacts/veroxa/docs/MOMO_WORKSPACE_PRIMARY_NAVIGATION_ALIGNMENT.md",
  "artifacts/veroxa/docs/MOMO_WORKSPACE_DASHBOARD_OPERATING_SNAPSHOT.md",
  "artifacts/veroxa/docs/ROUTE_PAGE_INVENTORY.md",
  "artifacts/veroxa/docs/VEROXA_ROUTE_SURFACE_MAP.md",
].map(read).join("\n");

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE remains placeholder.");
must(pilotAccess.includes("export default") && pilotAccess.includes("manual_pilot_auth"), "/api/pilot-access remains active.");
must(/AppRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles) && /VeroxaRole\s*=\s*["']client["']\s*\|\s*["']team["']/.test(roles), "Roles remain client/team only.");

const routeIndex = app.indexOf('<Route path="/team/momo/work">');
must(routeIndex >= 0, "/team/momo/work route still exists.");
const routeBlock = routeIndex >= 0 ? app.slice(routeIndex, app.indexOf("</Route>", routeIndex) + "</Route>".length) : "";
must(routeBlock.includes('<InternalDemoGuard role="team">'), "/team/momo/work remains guarded by InternalDemoGuard role=team.");
must(routeBlock.includes('<RealPortalDataBoundary portal="team">'), "/team/momo/work remains wrapped in RealPortalDataBoundary portal=team.");

for (const href of ["/team/momo", "/team/momo/work", "/team/momo/intelligence", "/team/momo/content-ai", "/team/momo/reports", "/team/momo/readiness"]) {
  must(nav.includes(href), `MomoWorkspaceNav must link ${href}.`);
}

must(workPage.includes("momoWorkQueueBoard") && workPage.includes("momoWorkQueueLanes"), "Momo Work page must import/use the work queue model.");
for (const copy of [
  "Momo-only internal work board.",
  "This does not activate the pilot.",
  "This does not turn on real auth.",
  "This does not contact Momo’s House.",
  "This does not publish externally.",
  "This does not generate AI output.",
  "This does not create fake work items or queue counts.",
  "Momo owner walkthrough remains blocked.",
  "No next activation PR is approved by default.",
  "Future real-world activation requires separate explicit Faraz approval.",
]) must(workPage.includes(copy), `Momo Work page missing safety copy: ${copy}`);

for (const label of [
  "Work Queue Overview", "Messages", "Upload Inbox", "Profile Corrections", "AI Drafts", "Momo AI Approval", "Activity Log", "Reports Follow Through", "Blocked Work", "Safe Next Actions", "Safety Boundaries",
]) {
  must(workPage.includes(label) || workModel.includes(label), `Momo Work page/model missing lane label: ${label}`);
}

must(!app.includes('path="/client/momo'), "No /client/momo route exists.");
must(!/role\s*===\s*["'](owner|operator|admin|super_admin|super-admin)["']|AppRole\s*=.*owner|VeroxaRole\s*=.*operator/i.test(app + roles + workPage + workModel), "No owner/admin/operator/super-admin role is added.");

for (const marker of ["GitHub PR #130", "Momo Work Queue Daily Operating Board only", "PR #130 improves `/team/momo/work` as an internal daily work board"]) {
  must(docs.includes(marker), `Docs mention PR #130 work queue daily operating board only: ${marker}`);
}
for (const marker of ["does not activate the pilot", "does not activate real auth", "does not create credentials", "does not contact Momo’s House", "does not publish externally", "does not connect external platforms", "does not generate AI output", "fake work items", "fake queue counts", "fake messages", "fake media", "fake approvals", "fake activity", "fake reports", "fake readiness"]) {
  must(docs.includes(marker), `Docs missing PR #130 safety marker: ${marker}`);
}

const activeDocs = read("artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md");
const currentSectionStart = activeDocs.indexOf("## Current source-of-truth docs");
const currentSectionEnd = currentSectionStart >= 0 ? activeDocs.indexOf("\n\nThese files reflect", currentSectionStart) : -1;
const currentSection = currentSectionStart >= 0 && currentSectionEnd > currentSectionStart ? activeDocs.slice(currentSectionStart, currentSectionEnd) : "";
must(currentSection.includes("MOMO_WORK_QUEUE_DAILY_OPERATING_BOARD.md"), "ACTIVE_DOCS_INDEX current source-of-truth section should include the PR #130 work queue doc.");

if (failures.length) {
  console.error("Momo work queue daily operating board guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Momo work queue daily operating board guardrail passed.");
