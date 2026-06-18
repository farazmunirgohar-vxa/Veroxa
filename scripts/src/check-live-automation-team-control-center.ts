import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd().endsWith("scripts") ? join(process.cwd(), "..") : process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");
const failures: string[] = [];
const must = (ok: boolean, msg: string) => { if (!ok) failures.push(msg); };

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const config = read("artifacts/veroxa/src/lib/teamControlCenter/teamControlCenterConfig.ts");
const service = read("artifacts/veroxa/src/lib/teamControlCenter/teamControlCenterService.ts");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const page = read("artifacts/veroxa/src/pages/team-control-center.tsx");
const docs = ["artifacts/veroxa/docs/LIVE_AUTOMATION_V1_TEAM_CONTROL_CENTER.md", "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md", "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md"].map(read).join("\n");
const rootPackage = read("package.json");

must(/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode), "AUTH_MODE remains placeholder.");
for (const marker of ["AUTH_MODE === \"real\"", "VITE_VEROXA_TEAM_CONTROL_CENTER_ENABLED", "role === \"team\"", "auth.status === \"authenticated\""]) must(config.includes(marker), `Feature gate missing ${marker}.`);
must(service.includes("media_assets") && service.includes("messages") && service.includes("profile_corrections") && service.includes("activity_log") && service.includes("ai_drafts"), "Service must summarize existing queue tables.");
must(app.includes('path="/team/control-center"'), "/team/control-center route exists.");
const routeBlock = app.slice(app.indexOf('path="/team/control-center"'), app.indexOf('path="/team/approval-queue"'));
must(routeBlock.includes('<InternalDemoGuard role="team">'), "Route must be guarded by InternalDemoGuard role=team.");
must(routeBlock.includes('<RealPortalDataBoundary portal="team">'), "Route must be wrapped in RealPortalDataBoundary portal=team.");
must(nav.includes('/team/control-center') && nav.includes('Control Center'), "Team nav includes /team/control-center.");
must(!app.includes('/client/control-center') && !nav.includes('/client/control-center'), "No /client/control-center route.");
must(!existsSync(join(root, "artifacts/veroxa/src/pages/client-control-center.tsx")), "No client Control Center page.");
must(!/operator|super admin|generic admin|execution/i.test(config + service + page), "No new roles beyond client/team.");
must(!/generate report|generated report|publish now|post now|send to client|go live|sync google|sync meta|stripe|checkout|webhook|cron|background job|service_role|fake work|fake metrics|fake reports/i.test(config + service + page), "No forbidden live execution/report/payment/fake-work language.");
for (const marker of ["GitHub PR #107", "Team Automation Control Center", "PR #108", "AUTH_MODE", "placeholder", "Momo owner walkthrough remains blocked", "does not publish", "does not generate reports", "does not activate integrations", "does not contact clients"]) must(docs.includes(marker), `Docs missing ${marker}.`);
must(rootPackage.includes("check-live-automation-team-control-center"), "Root verify:veroxa must include check-live-automation-team-control-center.");

if (failures.length) { console.error(failures.map((f) => `- ${f}`).join("\n")); process.exit(1); }
console.log("Live Automation Team Control Center guardrail passed.");
