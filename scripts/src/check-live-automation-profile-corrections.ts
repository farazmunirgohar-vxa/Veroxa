import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd().endsWith("/scripts") ? join(process.cwd(), "..") : process.cwd();
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");

function walk(dir: string): string[] {
  const abs = join(root, dir);
  return readdirSync(abs).flatMap((entry) => {
    const p = join(abs, entry);
    const rel = join(dir, entry);
    if (entry === "node_modules" || entry === "dist" || entry === ".git") return [];
    return statSync(p).isDirectory() ? walk(rel) : [rel];
  });
}

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
if (!/AUTH_MODE\s*:\s*AuthMode\s*=\s*["']placeholder["']/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");

const config = read("artifacts/veroxa/src/lib/profileCorrections/profileCorrectionConfig.ts");
for (const marker of ["AUTH_MODE === \"real\"", "VITE_VEROXA_PROFILE_CORRECTIONS_ENABLED", "role === \"client\"", "Boolean(auth.session.clientId)", "role === \"team\""]) {
  if (!config.includes(marker)) failures.push(`Profile correction gate missing marker: ${marker}`);
}

const clientProfile = read("artifacts/veroxa/src/pages/client-profile.tsx");
for (const copy of ["Request correction", "Pending Veroxa review", "Veroxa will review before anything changes", "Nothing is published automatically"]) {
  if (!clientProfile.includes(copy)) failures.push(`Client profile missing safe copy: ${copy}`);
}
if (!clientProfile.includes("canUseProfileCorrections")) failures.push("Client profile must use the profile corrections gate.");

const teamPage = read("artifacts/veroxa/src/pages/team-profile-corrections.tsx");
for (const copy of ["internal Veroxa profile records only", "No public/platform updates", "Needs owner input"]) {
  if (!teamPage.includes(copy)) failures.push(`Team profile corrections page missing safe copy: ${copy}`);
}

const migration = read("supabase/migrations/20260616010400_profile_corrections_foundation.sql");
for (const sql of ["profile_corrections_client_insert_requested", "status = 'requested'", "requested_by = auth.uid()", "reviewed_by is null", "review_note is null", "current_user_is_active_team()", "restaurant_profile_fields_team_update_internal_value"]) {
  if (!migration.includes(sql)) failures.push(`Profile corrections migration missing: ${sql}`);
}
if (/to\s+anon/i.test(migration)) failures.push("Profile corrections migration must not add anonymous policies.");

const sourceFiles = [
  "artifacts/veroxa/src/pages/client-profile.tsx",
  "artifacts/veroxa/src/pages/team-profile-corrections.tsx",
  "artifacts/veroxa/src/lib/profileCorrections/profileCorrectionConfig.ts",
  "artifacts/veroxa/src/lib/profileCorrections/profileCorrectionService.ts",
];
const source = sourceFiles.map((file) => read(file)).join("\n");
if (/SERVICE_ROLE|VITE_SUPABASE_SERVICE_ROLE|service_role/i.test(source)) failures.push("Frontend source must not expose service-role credentials.");
if (/openai\.chat|responses\.create|chat\.completions|generateObject|generateText/i.test(source)) failures.push("No AI runtime calls may be added.");
if (/stripe|checkout|subscription|webhook|cron|background job/i.test(source)) failures.push("No payments/webhooks/cron/background jobs may be added.");
if (/google business profile api|meta graph|yelp api|tiktok api/i.test(source)) failures.push("No Google/Meta/Yelp/TikTok connector activation may be added.");
if (/posted automatically|live on google|live on instagram/i.test(source)) failures.push("No public/platform publishing language is allowed.");
if (/owner|operator|admin|super admin|execution/.test(read("artifacts/veroxa/src/lib/auth/authContract.ts").replace(/Owner\/Operator/g, ""))) failures.push("Roles must remain client/team only in auth contract.");

const docs = ["artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PROFILE_CORRECTIONS.md", "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md", "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md", "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md", "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md"].map(read).join("\n");
for (const marker of ["PR #104", "Profile Corrections foundation only", "Momo owner walkthrough remains blocked", "not public/platform updates", "Activity Log", "AI Drafting", "Reports", "integrations", "publishing", "payments", "cron jobs", "webhooks"]) {
  if (!docs.includes(marker)) failures.push(`Docs missing PR #104 marker: ${marker}`);
}

if (failures.length) {
  console.error("Profile corrections guardrail failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("Profile corrections guardrail passed.");
