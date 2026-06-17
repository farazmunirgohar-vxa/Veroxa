import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd().endsWith("/scripts") ? join(process.cwd(), "..") : process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const config = read("artifacts/veroxa/src/lib/activityLog/activityLogConfig.ts");
const service = read("artifacts/veroxa/src/lib/activityLog/activityLogService.ts");
const clientPage = read("artifacts/veroxa/src/pages/client-dashboard.tsx");
const clientActivityCard = read("artifacts/veroxa/src/components/client/RecentVeroxaActivityCard.tsx");
const teamPage = read("artifacts/veroxa/src/pages/team-activity-log.tsx");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const migration = read("supabase/migrations/20260616010600_activity_log_foundation.sql");
const rootPackage = read("package.json");
const docs = ["artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ACTIVITY_LOG.md", "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md", "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md"].map(read).join("\n");
const allFrontend = [config, service, clientPage, clientActivityCard, teamPage, app, nav].join("\n");

if (!/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");
for (const marker of ["AUTH_MODE === \"real\"", "VITE_VEROXA_ACTIVITY_LOG_ENABLED", "role === \"client\"", "Boolean(auth.session.clientId)", "role === \"team\""]) if (!config.includes(marker)) failures.push(`Activity Log gate missing ${marker}.`);
for (const marker of ["restaurant_id = cleanRequired", "assertActivityLogEventType", "title = cleanRequired", "visibility", "typeof input.reportEligible !== \"boolean\"", ".eq(\"visibility\", \"client_visible\")"]) if (!service.includes(marker)) failures.push(`Activity service missing ${marker}.`);
if (/sendClient|recordActivityEvent\(/.test(clientActivityCard.replace(/listClientVisibleActivity\([^)]*\)/g, ""))) failures.push("Client activity surface must not create activity events.");
if (!clientActivityCard.includes("Recent Veroxa Activity") || !clientActivityCard.includes("Only activity Veroxa has marked visible appears here") || !clientActivityCard.includes("Reports are prepared separately after review")) failures.push("Client activity copy missing required safe language.");
if (!app.includes('path="/team/activity-log"') || !app.includes('<InternalDemoGuard role="team">') || !app.includes("<TeamActivityLog />")) failures.push("Team activity route must be guarded.");
if (!nav.includes('/team/activity-log') || !teamPage.includes("canUseTeamActivityLog") || !teamPage.includes("Add activity note")) failures.push("Team activity page/nav must be present and gated.");
for (const marker of ["activity_log_active_team_insert", "activity_log_active_team_select", "activity_log_active_client_visible_select", "current_user_is_active_team()", "current_user_has_active_restaurant", "length(btrim(title)) > 0", "visibility in", "report_eligible in (true, false)"]) if (!migration.includes(marker)) failures.push(`Activity migration missing ${marker}.`);
if (/VITE_SUPABASE_SERVICE_ROLE_KEY|service_role|service-role/i.test(allFrontend)) failures.push("Frontend must not expose or use service-role behavior.");
if (/openai|chat\.completions|responses\.create|from\(["']ai_drafts["']\)\.insert|generateReport|published_to_client/i.test(allFrontend)) failures.push("No AI runtime calls, ai_drafts insert runtime, or report generation allowed.");
if (/stripe|checkout|webhook|cron|background job|google business profile api|meta api|tiktok api|yelp api/i.test(allFrontend)) failures.push("No payments, webhooks, cron/background jobs, or connector activation allowed.");
if (/automatically published|went live|live on google|live on instagram|fake metrics|guaranteed/i.test(clientActivityCard)) failures.push("No public publishing language or fake metrics/report copy allowed.");
for (const marker of ["GitHub PR #105", "Activity Log", "PR #103 Profile Corrections", "PR #104 Real Messages", "AUTH_MODE", "placeholder", "event memory", "not reports", "Client-visible activity is explicit", "report_eligible", "PR #106", "PR #108", "Momo owner walkthrough remains blocked"]) if (!docs.includes(marker)) failures.push(`Docs missing ${marker}.`);
if (!rootPackage.includes("check-live-automation-activity-log")) failures.push("Root verify:veroxa must include check-live-automation-activity-log.");
if (/owner|operator|admin|super admin|execution/.test(read("artifacts/veroxa/src/lib/auth/authContract.ts").replace(/Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked\/blocked\./g, ""))) failures.push("Roles must remain client/team only in auth contract.");

if (failures.length) {
  console.error("Activity Log guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Activity Log guardrail passed.");
