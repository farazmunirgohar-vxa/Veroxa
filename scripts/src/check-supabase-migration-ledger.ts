import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

const expectedActive = [
  "20260712213930_momo_production_foundation_v1.sql",
  "20260712213939_restaurant_audit_center_v1.sql",
  "20260712214343_production_foundation_advisor_hardening.sql",
  "20260712220501_production_release_blocker_hardening.sql",
  "20260712220656_audit_trigger_type_safety.sql",
  "20260712230242_audit_center_release_hardening.sql",
  "20260713010710_momo_full_operating_system_v1.sql",
  "20260713010916_momo_full_operating_system_advisor_hardening.sql",
];
const appliedChecksums: Record<string, string> = {
  "20260712213930_momo_production_foundation_v1.sql": "8fd646bdcbbef6b004f1fafc0fbb0b66cdc298e98cb890bbec6643788d0e2db9",
  "20260712213939_restaurant_audit_center_v1.sql": "41cf54514c5faf3682cb30b8c473a3278a9422cea37cce4feed1eb75296b08ff",
  "20260712214343_production_foundation_advisor_hardening.sql": "5063898526e9dbf901ca2d67299820d6368dd6eae0a03359b821e78a4e36e504",
  "20260712220501_production_release_blocker_hardening.sql": "547b7e5c248b8fa8efcbb0fbdfe3b2a1c4ab6a1280007d2e8f319aae458ffe93",
  "20260712220656_audit_trigger_type_safety.sql": "528d20b8154ed79e751a50f3463c4f6858f57c308d7ef111240a185d75f03b72",
  "20260712230242_audit_center_release_hardening.sql": "e79e47a3e4b4857a2899b1a2e361254d68d52ce87d9f2273f73f92e42f9e2e8e",
  "20260713010710_momo_full_operating_system_v1.sql": "d74faa7b4b87a315321f30cb31097016565e32a80a72be29e10c2406cba751ef",
  "20260713010916_momo_full_operating_system_advisor_hardening.sql": "237561bc8bac94062211ac7a8744b1de36df9574c4ad46050889637ad883217c",
};
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
  if (!/^2026071[23]\d{6}$/.test(version) || source.trim().length < 50) {
    throw new Error(`Invalid canonical migration: ${filename}`);
  }
  const expectedChecksum = appliedChecksums[filename];
  if (expectedChecksum) {
    const actualChecksum = createHash("sha256").update(source).digest("hex");
    if (actualChecksum !== expectedChecksum) {
      throw new Error(`Applied Supabase migration content drifted: ${filename}`);
    }
  }
}

console.log("Supabase migration ledger guardrail passed.");
