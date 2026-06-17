import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd().endsWith("/scripts") ? join(process.cwd(), "..") : process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const failures: string[] = [];
const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
const config = read("artifacts/veroxa/src/lib/aiDrafts/aiDraftConfig.ts");
const service = read("artifacts/veroxa/src/lib/aiDrafts/aiDraftService.ts");
const teamPage = read("artifacts/veroxa/src/pages/team-ai-drafts.tsx");
const app = read("artifacts/veroxa/src/App.tsx");
const nav = read("artifacts/veroxa/src/lib/teamPortalNav.ts");
const migration = read("supabase/migrations/20260616010700_ai_draft_preparation_foundation.sql");
const rootPackage = read("package.json");
const docs = ["artifacts/veroxa/docs/LIVE_AUTOMATION_V1_AI_DRAFT_PREPARATION.md", "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md", "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md"].map(read).join("\n");
const allFrontend = [config, service, teamPage, app, nav].join("\n");

if (!/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");
for (const marker of ["AUTH_MODE === \"real\"", "VITE_VEROXA_AI_DRAFTS_ENABLED", "role === \"team\""]) if (!config.includes(marker)) failures.push(`AI Draft gate missing ${marker}.`);
for (const marker of ["from(\"ai_drafts\")", "restaurant_id = cleanRequired", "draft_text = cleanRequired", "cleanDraftType", "cleanSafetyFlags", "status: \"ready_for_faraz_review\"", "markAiDraftReviewedInternally", "holdAiDraft", "rejectAiDraft"]) if (!service.includes(marker)) failures.push(`AI draft service missing ${marker}.`);
if (!app.includes('path="/team/ai-drafts"') || !app.includes('<InternalDemoGuard role="team">') || !app.includes("<TeamAiDrafts />")) failures.push("Team AI Draft route must be guarded.");
if (!nav.includes("/team/ai-drafts") || !teamPage.includes("canUseTeamAiDrafts") || !teamPage.includes("Internal draft only. Nothing is published automatically.")) failures.push("Team AI Draft page/nav must be present and safely copied.");
if (/path="\/client\/ai-drafts|ClientAiDraft|listAiDraftsForClient/i.test(app + nav)) failures.push("No client AI draft route is allowed.");
for (const marker of ["ai_drafts_active_team_select", "ai_drafts_active_team_insert", "ai_drafts_active_team_safe_update", "current_user_is_active_team()", "length(btrim(draft_text)) > 0", "jsonb_array_length(safety_flags) >= 1", "safety_flags <@", "ready_for_faraz_review'::public.ai_draft_status", "approved'::public.ai_draft_status", "held'::public.ai_draft_status", "rejected'::public.ai_draft_status", "media_summary", "caption_draft", "google_update_draft", "social_caption_draft", "message_reply_draft", "profile_correction_summary", "report_draft_placeholder", "next_step_recommendation"]) if (!migration.includes(marker)) failures.push(`AI draft migration missing ${marker}.`);
if (/needs_review|approved_internal_only|array_length\(safety_flags/i.test(migration + service)) failures.push("AI drafts must use existing DB enum values and jsonb safety flag checks.");
if (/create policy .*client|to anon|for select to anon/i.test(migration)) failures.push("Clients/anon must not receive ai_drafts policies.");
if (/VITE_SUPABASE_SERVICE_ROLE_KEY|service_role|service-role/i.test(allFrontend)) failures.push("Frontend must not expose service-role behavior.");
if (/openai|chat\.completions|responses\.create|generateReport|published_to_client/i.test(allFrontend)) failures.push("No client-side OpenAI calls or report generation allowed.");
if (/stripe|checkout|webhook|cron|background job|google business profile api|meta api|tiktok api|yelp api/i.test(allFrontend)) failures.push("No payments, webhooks, cron/background jobs, or connector activation allowed.");
for (const marker of ["PR #106", "AI Draft Preparation", "internal only", "No raw AI output is client-visible", "No publishing", "No auto-approval", "PR #107", "PR #108", "Momo owner walkthrough remains blocked"]) if (!docs.includes(marker)) failures.push(`Docs missing ${marker}.`);
if (!rootPackage.includes("check-live-automation-ai-drafts")) failures.push("Root verify:veroxa must include check-live-automation-ai-drafts.");

if (failures.length) {
  console.error("AI Draft Preparation guardrail failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log("AI Draft Preparation guardrail passed.");
