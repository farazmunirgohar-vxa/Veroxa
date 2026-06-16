import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd().endsWith("/scripts") ? join(process.cwd(), "..") : process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const config = read("artifacts/veroxa/src/lib/messages/messageConfig.ts");
const service = read("artifacts/veroxa/src/lib/messages/messageService.ts");
const clientPage = read("artifacts/veroxa/src/pages/client-messages.tsx");
const teamPage = read("artifacts/veroxa/src/pages/team-messages.tsx");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const migration = read("supabase/migrations/20260616010500_real_messages_foundation.sql");
const rootPackage = read("package.json");
const docs = ["artifacts/veroxa/docs/LIVE_AUTOMATION_V1_REAL_MESSAGES.md", "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md", "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md"].map(read).join("\n");
const allFrontend = [config, service, clientPage, teamPage, app, nav].join("\n");

if (!/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");
for (const marker of ["AUTH_MODE === \"real\"", "VITE_VEROXA_MESSAGES_ENABLED", "role === \"client\"", "Boolean(auth.session.clientId)", "role === \"team\""]) if (!config.includes(marker)) failures.push(`Message gate missing ${marker}.`);
for (const marker of ["sender_role: \"client\"", "sender_role: \"team\"", "status: \"unread\"", "body.trim()", "restaurant_id"]) if (!service.includes(marker)) failures.push(`Message service missing ${marker}.`);
if (!clientPage.includes("canUseClientMessages") || !clientPage.includes("Placeholder mode does not show fake sent messages")) failures.push("Client messages page must use the gate and reject fake placeholder sending.");
if (/delivered/i.test(clientPage)) failures.push("Client page must not show delivered-state messaging.");
if (!app.includes('path="/team/messages"') || !app.includes('<InternalDemoGuard role="team">') || !app.includes("<TeamMessages />")) failures.push("Team message route must be guarded.");
if (!nav.includes('/team/messages') || !teamPage.includes("canUseTeamMessages")) failures.push("Team message page/nav must be present and gated.");
if (!migration.includes("messages_active_client_insert") || !migration.includes("messages_active_team_insert") || !migration.includes("messages_active_team_status_update") || !migration.includes("enforce_message_status_only_update")) failures.push("Message RLS write policies are missing.");
for (const marker of ["sender_user_id = auth.uid()", "sender_role = 'client'", "sender_role = 'team'", "status = 'unread'", "length(btrim(body)) > 0", "current_user_has_active_restaurant", "current_user_is_active_team"]) if (!migration.includes(marker)) failures.push(`Message migration missing ${marker}.`);
if (/VITE_SUPABASE_SERVICE_ROLE_KEY|service_role|service-role/i.test(allFrontend)) failures.push("Frontend must not expose or use service-role behavior.");
if (/openai|chat\.completions|responses\.create|ai_drafts\.insert|from\(["']activity_log["']\)\.insert/i.test(allFrontend)) failures.push("No AI runtime calls or activity_log writes allowed in Real Messages PR.");
if (/stripe|checkout|webhook|cron|background job|google business profile api|meta api|tiktok api|yelp api/i.test(allFrontend)) failures.push("No payments, webhooks, cron/background jobs, or connector activation allowed.");
if (/SMS|email automation|push notification|external chat/i.test(clientPage)) failures.push("Client page must not present external messaging channels as active capability.");
if (!teamPage.includes("not SMS, email, DMs, comments") || !teamPage.includes("customer-service inbox handling")) failures.push("Team page must clarify portal-only messaging boundaries.");
for (const marker of ["GitHub PR #104", "Real Messages", "Profile Corrections already merged as GitHub PR #103", "AUTH_MODE", "placeholder", "portal-only", "Activity Log remains PR #105", "AI Drafting remains PR #106", "Momo owner walkthrough remains blocked"]) if (!docs.includes(marker)) failures.push(`Docs missing ${marker}.`);
if (!rootPackage.includes("check-live-automation-real-messages")) failures.push("Root verify:veroxa must include check-live-automation-real-messages.");
if (/owner|operator|admin|super admin|execution/.test(read("artifacts/veroxa/src/lib/auth/authContract.ts").replace(/Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked\/blocked\./g, ""))) failures.push("Roles must remain client/team only in auth contract.");

if (failures.length) {
  console.error("Real Messages guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("Real Messages guardrail passed.");
