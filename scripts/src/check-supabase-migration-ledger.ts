import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

const expectedActive = [
  "20260712213930_momo_production_foundation_v1.sql",
  "20260712213939_restaurant_audit_center_v1.sql",
  "20260712214343_production_foundation_advisor_hardening.sql",
  "20260712220501_production_release_blocker_hardening.sql",
  "20260712220656_audit_trigger_type_safety.sql",
];
const expectedArchived = [
  "20260601000000_m024a_first_client_metadata_schema.sql",
  "20260615010100_live_automation_v1_database_foundation.sql",
  "20260615010200_media_upload_storage_foundation.sql",
  "20260616010400_profile_corrections_foundation.sql",
  "20260616010500_real_messages_foundation.sql",
  "20260616010600_activity_log_foundation.sql",
  "20260616010700_ai_draft_preparation_foundation.sql",
  "20260616010800_reports_from_activity_foundation.sql",
];

function sqlFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory)).filter((name) => name.endsWith(".sql")).sort();
}

const active = sqlFiles("supabase/migrations");
const archived = sqlFiles("supabase/archive/legacy_unapplied_migrations");
if (JSON.stringify(active) !== JSON.stringify(expectedActive)) {
  throw new Error(`Active Supabase migration ledger drifted: ${active.join(", ")}`);
}
if (JSON.stringify(archived) !== JSON.stringify(expectedArchived)) {
  throw new Error(`Archived legacy migration set drifted: ${archived.join(", ")}`);
}
for (const filename of expectedActive) {
  const version = filename.slice(0, 14);
  const source = readFileSync(join(root, "supabase/migrations", filename), "utf8");
  if (!/^20260712\d{6}$/.test(version) || source.trim().length < 100) {
    throw new Error(`Invalid canonical migration: ${filename}`);
  }
}

console.log("Supabase migration ledger guardrail passed.");
