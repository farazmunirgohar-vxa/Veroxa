import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  MEDIA_INSPECTION_PREFLIGHT_MIGRATION,
  REPAIR_MIGRATION_EVIDENCE,
  activeMediaInspectionPreflightMigrationIsApplied,
  assertReviewedLocalCandidateManifest,
  hasActiveMediaInspectionForwardCandidate,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const rootDir = resolve(repoRoot, "supabase/migrations");
const mirrorDir = resolve(repoRoot, "artifacts/veroxa-sites/supabase/migrations");
const releaseNames = (directory: string): string[] =>
  readdirSync(directory)
    .filter((name) => name.endsWith(".sql") && !name.startsWith("TEMP_"))
    .sort();
const rootNames = releaseNames(rootDir);
const mirrorNames = releaseNames(mirrorDir);
const rootTree = hashTree(rootDir, { suffix: ".sql" });
const mirrorTree = hashTree(mirrorDir, { suffix: ".sql" });
const manifest = readDeploymentManifest();
const activeForwardCandidate = hasActiveMediaInspectionForwardCandidate();
const preflightMigrationApplied =
  activeMediaInspectionPreflightMigrationIsApplied();
const pending = activeForwardCandidate && !preflightMigrationApplied
  ? [MEDIA_INSPECTION_PREFLIGHT_MIGRATION]
  : manifest.releaseCandidate.pendingMigrations ?? [];
const liveTree = hashTree(rootDir, { exclusions: pending, suffix: ".sql" });

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
must(
  rootTree.fileCount === mirrorTree.fileCount &&
    rootTree.sha256 === mirrorTree.sha256 &&
    JSON.stringify(rootNames) === JSON.stringify(mirrorNames) &&
    JSON.stringify(rootTree.files) === JSON.stringify(mirrorTree.files),
  "Root/Sites migration trees are not exact mirrors.",
);
must(
  (activeForwardCandidate || (
    rootTree.fileCount === manifest.migrations.fileCount &&
    rootTree.sha256 === manifest.migrations.treeSha256 &&
    manifest.releaseCandidate.candidateMigrationsMatchLiveLedger ===
      (pending.length === 0)
  )) &&
    (activeForwardCandidate && preflightMigrationApplied ||
      manifest.currentProductionObservation.productionMigrationCount ===
      liveTree.fileCount &&
    manifest.currentProductionObservation.migrationTreeSha256 ===
      liveTree.sha256 &&
    manifest.currentProductionObservation.latestProductionMigration ===
      liveTree.files.at(-1)),
  "Source and pending-migration split do not match the observed production ledger.",
);
for (const filename of rootNames) {
  must(
    sha256File(resolve(rootDir, filename)) ===
      sha256File(resolve(mirrorDir, filename)),
    `Root/Sites migration bytes differ: ${filename}`,
  );
}
const repairPath = resolve(rootDir, REPAIR_MIGRATION_EVIDENCE.filename);
must(
  rootNames.includes(REPAIR_MIGRATION_EVIDENCE.filename) &&
    statSync(repairPath).size === REPAIR_MIGRATION_EVIDENCE.byteLength &&
    sha256File(repairPath) === REPAIR_MIGRATION_EVIDENCE.sha256,
  "Generated live48 repair identity or bytes drifted.",
);
const versions = rootNames.map((filename) => filename.split("_", 1)[0]);
must(new Set(versions).size === versions.length, "Migration versions contain duplicates.");

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    activeForwardCandidate
      ? preflightMigrationApplied
        ? `PASS: exact mirrored ${rootTree.fileCount}-migration candidate records the applied preflight migration while the fixture-integrity repair remains pending.`
        : `PASS: exact mirrored ${rootTree.fileCount}-migration candidate preserves the observed ${liveTree.fileCount}-migration production ledger.`
      : `PASS: exact mirrored source matches the reconciled ${rootTree.fileCount}-migration ledger.`,
  );
}
