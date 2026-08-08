import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  LIVE46_MIGRATION_EVIDENCE,
  LIVE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  LOCAL_CANDIDATE_PENDING_MIGRATIONS,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
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
const liveRootPrefix = hashTree(rootDir, {
  exclusions: [REPAIR_MIGRATION_EVIDENCE.filename],
  suffix: ".sql",
});
const liveMirrorPrefix = hashTree(mirrorDir, {
  exclusions: [REPAIR_MIGRATION_EVIDENCE.filename],
  suffix: ".sql",
});
const manifest = readDeploymentManifest();

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

must(
  manifest.currentProductionObservation.migrationTreeEvidenceScope ===
    LIVE_MIGRATION_EVIDENCE_SCOPE &&
    manifest.migrations.evidenceScope ===
      LOCAL_CANDIDATE_MIGRATION_EVIDENCE_SCOPE,
  "Live-ledger and local-candidate evidence scopes drifted.",
);
must(
  rootTree.fileCount === REPAIR_MIGRATION_EVIDENCE.candidateFileCount &&
    mirrorTree.fileCount === REPAIR_MIGRATION_EVIDENCE.candidateFileCount &&
    rootTree.sha256 === REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256 &&
    mirrorTree.sha256 === REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256 &&
    JSON.stringify(rootNames) === JSON.stringify(mirrorNames) &&
    JSON.stringify(rootTree.files) === JSON.stringify(mirrorTree.files),
  "Root/Sites candidate47 migration trees are not exact mirrors.",
);
must(
  liveRootPrefix.fileCount === LIVE46_MIGRATION_EVIDENCE.fileCount &&
    liveMirrorPrefix.fileCount === LIVE46_MIGRATION_EVIDENCE.fileCount &&
    liveRootPrefix.sha256 === LIVE46_MIGRATION_EVIDENCE.treeSha256 &&
    liveMirrorPrefix.sha256 === LIVE46_MIGRATION_EVIDENCE.treeSha256,
  "Candidate does not preserve the exact immutable live46 prefix.",
);
must(
  JSON.stringify(manifest.releaseCandidate.pendingMigrations) ===
    JSON.stringify(LOCAL_CANDIDATE_PENDING_MIGRATIONS) &&
    manifest.releaseCandidate.databaseMigrationApplied === false &&
    manifest.releaseCandidate.candidateMigrationsMatchLiveLedger === false,
  "The provisional repair must remain the sole unapplied candidate migration.",
);
must(
  rootNames.includes(REPAIR_MIGRATION_EVIDENCE.filename) &&
    mirrorNames.includes(REPAIR_MIGRATION_EVIDENCE.filename) &&
    !rootNames.includes("20260808045812_momo_ready_team_decisions_and_food_tags_v2.sql") &&
    !mirrorNames.includes("20260808045812_momo_ready_team_decisions_and_food_tags_v2.sql"),
  "Provisional repair or generated-version source truth drifted.",
);
for (const filename of rootNames) {
  must(
    sha256File(resolve(rootDir, filename)) ===
      sha256File(resolve(mirrorDir, filename)),
    `Root/Sites migration bytes differ: ${filename}`,
  );
}
for (const directory of [rootDir, mirrorDir]) {
  const livePath = resolve(directory, LIVE46_MIGRATION_EVIDENCE.filename);
  const repairPath = resolve(directory, REPAIR_MIGRATION_EVIDENCE.filename);
  must(
    statSync(livePath).size === LIVE46_MIGRATION_EVIDENCE.byteLength &&
      sha256File(livePath) === LIVE46_MIGRATION_EVIDENCE.sha256,
    `Immutable live46 migration bytes drifted in ${directory}`,
  );
  must(
    statSync(repairPath).size === REPAIR_MIGRATION_EVIDENCE.byteLength &&
      sha256File(repairPath) === REPAIR_MIGRATION_EVIDENCE.sha256,
    `Pending repair bytes drifted in ${directory}`,
  );
}
const versionCounts = new Map<string, number>();
for (const filename of rootNames) {
  const version = filename.split("_", 1)[0] ?? "";
  versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
}
must(
  [...versionCounts.values()].every((count) => count === 1),
  "Candidate migration versions contain duplicates.",
);

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: exact immutable live46 prefix plus one mirrored provisional repair yields candidate47.",
  );
}
