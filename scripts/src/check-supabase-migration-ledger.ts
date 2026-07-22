import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as T;

const manifest = readJson<{
  schemaVersion: number;
  releaseState: string;
  verifiedReconciliationRelease: {
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
  };
  observedProductionDrift: {
    evidenceStatus: string;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    status: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublished: boolean;
  };
  migrations: { fileCount: number; treeSha256: string };
}>("artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json");
const checkpoint = readJson<{
  schemaVersion: number;
  status: string;
  observedProductionDrift: {
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    state: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesCandidatePublished: boolean;
  };
  databaseMigrations: string[];
}>("artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");

const immutableHistoricalMigrations = [
  "20260712213930_momo_production_foundation_v1.sql",
  "20260712213939_restaurant_audit_center_v1.sql",
  "20260712214343_production_foundation_advisor_hardening.sql",
  "20260712220501_production_release_blocker_hardening.sql",
  "20260712220656_audit_trigger_type_safety.sql",
  "20260712230242_audit_center_release_hardening.sql",
  "20260713010710_momo_full_operating_system_v1.sql",
  "20260713010916_momo_full_operating_system_advisor_hardening.sql",
  "20260713191147_momo_zero_cost_operating_rehearsal_v1.sql",
  "20260713212046_restaurant_audit_generation_v2.sql",
  "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
];
const immutableHistoricalChecksums: Record<string, string> = {
  "20260712213930_momo_production_foundation_v1.sql": "8fd646bdcbbef6b004f1fafc0fbb0b66cdc298e98cb890bbec6643788d0e2db9",
  "20260712213939_restaurant_audit_center_v1.sql": "41cf54514c5faf3682cb30b8c473a3278a9422cea37cce4feed1eb75296b08ff",
  "20260712214343_production_foundation_advisor_hardening.sql": "5063898526e9dbf901ca2d67299820d6368dd6eae0a03359b821e78a4e36e504",
  "20260712220501_production_release_blocker_hardening.sql": "547b7e5c248b8fa8efcbb0fbdfe3b2a1c4ab6a1280007d2e8f319aae458ffe93",
  "20260712220656_audit_trigger_type_safety.sql": "528d20b8154ed79e751a50f3463c4f6858f57c308d7ef111240a185d75f03b72",
  "20260712230242_audit_center_release_hardening.sql": "e79e47a3e4b4857a2899b1a2e361254d68d52ce87d9f2273f73f92e42f9e2e8e",
  "20260713010710_momo_full_operating_system_v1.sql": "d74faa7b4b87a315321f30cb31097016565e32a80a72be29e10c2406cba751ef",
  "20260713010916_momo_full_operating_system_advisor_hardening.sql": "237561bc8bac94062211ac7a8744b1de36df9574c4ad46050889637ad883217c",
  "20260713191147_momo_zero_cost_operating_rehearsal_v1.sql": "07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a",
  "20260713212046_restaurant_audit_generation_v2.sql": "f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693",
  "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql": "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
  "20260714022859_reconcile_audit_v3_and_function_search_paths.sql": "192505ca4631e55f35b28f0c849a7d380bc1a709e5ae89adca742d7d349da45e",
  "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql": "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
};
const historicalRelease = manifest.verifiedReconciliationRelease;
const observedProduction = manifest.observedProductionDrift;
const candidate = manifest.releaseCandidate;
const expectedCandidateLedger = [
  ...immutableHistoricalMigrations,
  observedProduction.latestProductionMigration,
  candidate.latestCandidateMigration,
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

const candidateLedger = sqlFiles("supabase/migrations");
const sitesMigrationSnapshots = sqlFiles("artifacts/veroxa-sites/supabase/migrations");
const archived = sqlFiles("supabase/archive/legacy_unapplied_migrations");
if (
  manifest.schemaVersion !== 3 ||
  manifest.releaseState !== "local_candidate_reviewed_unmerged_unpublished_unapplied" ||
  historicalRelease.productionMigrationCount !== immutableHistoricalMigrations.length ||
  historicalRelease.latestProductionMigration !== immutableHistoricalMigrations.at(-1) ||
  historicalRelease.latestProductionMigrationSha256 !==
    immutableHistoricalChecksums[immutableHistoricalMigrations.at(-1) ?? ""]
) {
  throw new Error("Schema-3 manifest drifted from the immutable PR #149 / 13-migration proof.");
}
if (
  observedProduction.evidenceStatus !== "observed_live_not_source_reconciled" ||
  observedProduction.productionMigrationCount !== immutableHistoricalMigrations.length + 1 ||
  !observedProduction.databaseLedgerObserved ||
  !observedProduction.databaseAppliedThroughLatestObserved ||
  observedProduction.candidateParityVerified
) {
  throw new Error("Observed production must remain distinct at 14 applied migrations.");
}
if (
  candidate.status !== "reviewed_locally_unmerged_unpublished_unapplied" ||
  candidate.pullRequest !== null ||
  candidate.githubMerged ||
  candidate.futureMergedGitHubCommit !== null ||
  candidate.futureSitesVersion !== null ||
  candidate.migrationFileCount !== observedProduction.productionMigrationCount + 1 ||
  !candidate.databaseChangesRequired ||
  candidate.databaseMigrationApplied ||
  candidate.sitesPublished ||
  manifest.migrations.fileCount !== candidate.migrationFileCount ||
  manifest.migrations.treeSha256 !== candidate.migrationTreeSha256
) {
  throw new Error("Migration 15 must remain a reviewed source-only candidate, not a production apply.");
}
if (
  checkpoint.schemaVersion !== 6 ||
  checkpoint.status !== manifest.releaseState ||
  checkpoint.observedProductionDrift.productionMigrations !==
    observedProduction.productionMigrationCount ||
  checkpoint.observedProductionDrift.latestProductionMigration !==
    observedProduction.latestProductionMigration ||
  checkpoint.observedProductionDrift.latestProductionMigrationSha256 !==
    observedProduction.latestProductionMigrationSha256 ||
  checkpoint.observedProductionDrift.databaseLedgerObserved !==
    observedProduction.databaseLedgerObserved ||
  checkpoint.observedProductionDrift.databaseAppliedThroughLatestObserved !==
    observedProduction.databaseAppliedThroughLatestObserved ||
  checkpoint.observedProductionDrift.candidateParityVerified !==
    observedProduction.candidateParityVerified ||
  checkpoint.releaseCandidate.state !== candidate.status ||
  checkpoint.releaseCandidate.pullRequest !== candidate.pullRequest ||
  checkpoint.releaseCandidate.githubMerged !== candidate.githubMerged ||
  checkpoint.releaseCandidate.futureMergedGitHubCommit !== candidate.futureMergedGitHubCommit ||
  checkpoint.releaseCandidate.futureSitesVersion !== candidate.futureSitesVersion ||
  checkpoint.releaseCandidate.migrationFileCount !== candidate.migrationFileCount ||
  checkpoint.releaseCandidate.migrationTreeSha256 !== candidate.migrationTreeSha256 ||
  checkpoint.releaseCandidate.latestCandidateMigration !== candidate.latestCandidateMigration ||
  checkpoint.releaseCandidate.latestCandidateMigrationSha256 !==
    candidate.latestCandidateMigrationSha256 ||
  checkpoint.releaseCandidate.databaseChangesRequired !== candidate.databaseChangesRequired ||
  checkpoint.releaseCandidate.databaseMigrationApplied !== candidate.databaseMigrationApplied ||
  checkpoint.releaseCandidate.sitesCandidatePublished !== candidate.sitesPublished ||
  JSON.stringify(checkpoint.databaseMigrations) !== JSON.stringify(expectedCandidateLedger)
) {
  throw new Error("RR checkpoint and deployment manifest migration evidence disagree.");
}
if (JSON.stringify(candidateLedger) !== JSON.stringify(expectedCandidateLedger)) {
  throw new Error(`Candidate Supabase migration source ledger drifted: ${candidateLedger.join(", ")}`);
}
const expectedSitesMigrationSnapshots = [
  observedProduction.latestProductionMigration,
  candidate.latestCandidateMigration,
];
if (
  JSON.stringify(sitesMigrationSnapshots) !==
  JSON.stringify(expectedSitesMigrationSnapshots)
) {
  throw new Error(
    `Sites migration snapshots must use canonical ledger identities: ${sitesMigrationSnapshots.join(", ")}`,
  );
}
if (JSON.stringify(archived) !== JSON.stringify(expectedArchived)) {
  throw new Error(`Archived legacy migration set drifted: ${archived.join(", ")}`);
}
for (const filename of expectedCandidateLedger) {
  const version = filename.slice(0, 14);
  const source = readFileSync(join(root, "supabase/migrations", filename), "utf8");
  if (!/^\d{14}$/.test(version) || source.trim().length < 50) {
    throw new Error(`Invalid canonical migration: ${filename}`);
  }
  const expectedChecksum =
    immutableHistoricalChecksums[filename] ??
    (filename === observedProduction.latestProductionMigration
      ? observedProduction.latestProductionMigrationSha256
      : filename === candidate.latestCandidateMigration
        ? candidate.latestCandidateMigrationSha256
        : undefined);
  if (expectedChecksum) {
    const actualChecksum = createHash("sha256").update(source).digest("hex");
    if (actualChecksum !== expectedChecksum) {
      throw new Error(`Supabase migration source content drifted: ${filename}`);
    }
  }
}
for (const filename of expectedSitesMigrationSnapshots) {
  const canonical = readFileSync(join(root, "supabase/migrations", filename));
  const snapshot = readFileSync(
    join(root, "artifacts/veroxa-sites/supabase/migrations", filename),
  );
  if (!canonical.equals(snapshot)) {
    throw new Error(`Sites migration snapshot content drifted: ${filename}`);
  }
}

console.log(
  "Supabase migration ledger guardrail passed; production is observed through migration 14 and source-only migration 15 remains unapplied.",
);
