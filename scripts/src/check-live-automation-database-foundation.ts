import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const failures: string[] = [];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => { try { statSync(join(root, path)); return true; } catch { return false; } };

const migrationPath = "supabase/migrations/20260615010100_live_automation_v1_database_foundation.sql";
if (!exists(migrationPath)) failures.push(`${migrationPath} is missing.`);
const migration = exists(migrationPath) ? read(migrationPath) : "";

const requiredTables = ["user_profiles", "restaurants", "restaurant_members", "restaurant_profile_fields", "media_assets", "messages", "profile_corrections", "activity_log", "ai_drafts", "approvals", "reports"];
for (const table of requiredTables) {
  if (!migration.includes(`create table if not exists public.${table}`)) failures.push(`${migrationPath} missing table ${table}.`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) failures.push(`${migrationPath} must enable RLS for ${table}.`);
}

for (const role of ["'client'", "'team'"]) {
  if (!migration.includes(role)) failures.push(`${migrationPath} missing active role ${role}.`);
}
for (const parkedRole of ["'owner'", "'operator'", "'admin'", "'super_admin'", "'execution'", "'staff'", "'manager'"]) {
  if (migration.includes(parkedRole)) failures.push(`${migrationPath} introduces parked role ${parkedRole}.`);
}
if (/to\s+anon\b/i.test(migration)) failures.push(`${migrationPath} must not create anon portal-data policies.`);
if (/using\s*\(\s*true\s*\)|with\s+check\s*\(\s*true\s*\)/i.test(migration)) failures.push(`${migrationPath} must not use broad using(true) or with check(true) policies.`);
for (const verb of ["for insert", "for update", "for delete", "for all"]) {
  if (migration.toLowerCase().includes(verb)) failures.push(`${migrationPath} must keep PR #101 writes deny-by-default; found ${verb}.`);
}

const dbTypesPath = "artifacts/veroxa/src/domain/liveAutomation/databaseTypes.ts";
const reposPath = "artifacts/veroxa/src/domain/liveAutomation/repositories.ts";
for (const path of [dbTypesPath, reposPath, "artifacts/veroxa/docs/LIVE_AUTOMATION_V1_DATABASE_FOUNDATION.md"]) {
  if (!exists(path)) failures.push(`${path} is missing.`);
}
const dbTypes = exists(dbTypesPath) ? read(dbTypesPath) : "";
for (const typeName of ["VeroxaRole", "AccountStatus", "RestaurantStatus", "RestaurantMembershipStatus", "ProfileFieldStatus", "MediaAssetStatus", "MessageStatus", "ProfileCorrectionStatus", "ActivityVisibility", "AiDraftStatus", "ApprovalStatus", "ReportStatus", "UserProfileRecord", "RestaurantRecord", "RestaurantMemberRecord", "RestaurantProfileFieldRecord", "MediaAssetRecord", "MessageRecord", "ProfileCorrectionRecord", "ActivityLogRecord", "AiDraftRecord", "ApprovalRecord", "ReportRecord"]) {
  if (!dbTypes.includes(typeName)) failures.push(`${dbTypesPath} missing ${typeName}.`);
}
if (/"owner"|"operator"|"admin"|"super_admin"|"execution"|"staff"|"manager"/.test(dbTypes)) failures.push(`${dbTypesPath} introduces parked role literals.`);

const authMode = read("artifacts/veroxa/src/lib/auth/authMode.ts");
if (!/AUTH_MODE(?:\s*:\s*AuthMode)?\s*=\s*["']placeholder["']/.test(authMode)) failures.push("AUTH_MODE must remain placeholder.");
const appSource = read("artifacts/veroxa/src/App.tsx");
if (!appSource.includes('/api/pilot-access')) {
  const pilot = read("artifacts/veroxa/src/lib/auth/pilotAccessAccounts.ts");
  if (!pilot.includes("/api/pilot-access") && !pilot.includes("VITE_VEROXA_PILOT_ACCESS_ENDPOINT")) failures.push("/api/pilot-access path must remain intact.");
}

const allRelevant = [migration, dbTypes, exists(reposPath) ? read(reposPath) : "", read("artifacts/veroxa/src/lib/supabase/env.ts")].join("\n");
if (/VITE_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(allRelevant)) failures.push("Service-role keys must not be exposed or referenced in frontend/domain foundation.");

const docs = read("artifacts/veroxa/docs/LIVE_AUTOMATION_V1_DATABASE_FOUNDATION.md");
for (const marker of ["`AUTH_MODE` remains `placeholder`", "`/api/pilot-access` remains", "No portal page is live DB-powered yet", "No media upload is live yet", "No messages are live yet", "No profile corrections are live yet", "No activity log runtime is live yet", "No AI or reporting runtime is live yet", "Momo owner walkthrough remains blocked"]) {
  if (!docs.includes(marker)) failures.push(`Database foundation doc missing marker: ${marker}`);
}

const clientPortalData = read("artifacts/veroxa/src/hooks/useClientPortalData.ts");
if (/from\(["'](?:restaurants|media_assets|messages|profile_corrections|activity_log|ai_drafts|approvals|reports)["']\)/.test(clientPortalData)) failures.push("Client portal data hook must not read Live Automation V1 tables yet.");

if (failures.length > 0) {
  console.error("Live Automation V1 database foundation guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Live Automation V1 database foundation guardrail passed.");
