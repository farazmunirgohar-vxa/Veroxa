import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  APPLICATION_QUALITY_EVIDENCE,
  CURRENT_PARTIAL_ROLLOUT_EVIDENCE,
  LIVE46_MIGRATION_EVIDENCE,
  LOCAL_CANDIDATE_BASE_COMMIT,
  LOCAL_CANDIDATE_SOURCE_EVIDENCE,
  PR165_DRAFT_CHECKPOINT,
  REPAIR_MIGRATION_EVIDENCE,
  assertReviewedLocalCandidateManifest,
  readDeploymentManifest,
  repoRoot,
} from "./release-manifest";

const failures: string[] = [];
const must = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};
const read = (relativePath: string): string =>
  readFileSync(resolve(repoRoot, relativePath), "utf8");
const manifest = readDeploymentManifest();

try {
  assertReviewedLocalCandidateManifest(manifest);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

must(
  manifest.currentProductionObservation.canonicalGitHubMainCommit ===
    LOCAL_CANDIDATE_BASE_COMMIT &&
    manifest.currentProductionObservation.canonicalGitHubMainMergePullRequest === 164,
  "Current GitHub main source truth must be the merged PR #164 lineage.",
);
must(
  manifest.currentProductionObservation.canonicalGitHubMainCommitScope ===
    "github_main_lineage_only_not_sites_v39_source_association" &&
    manifest.currentProductionObservation.sitesVersion ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesVersion &&
    manifest.currentProductionObservation.sitesArchiveSha256 ===
      CURRENT_PARTIAL_ROLLOUT_EVIDENCE.sitesArchiveSha256 &&
    manifest.currentProductionObservation.githubParityVerifiedAtObservation === false &&
    manifest.currentProductionObservation.candidateSourceMatchesLiveSites === false,
  "Independent Sites v39 observation was incorrectly attributed to GitHub main or the candidate.",
);
must(
  manifest.currentProductionObservation.productionMigrationCount ===
    LIVE46_MIGRATION_EVIDENCE.fileCount &&
    manifest.currentProductionObservation.migrationTreeSha256 ===
      LIVE46_MIGRATION_EVIDENCE.treeSha256 &&
    manifest.releaseCandidate.latestCandidateMigration ===
      REPAIR_MIGRATION_EVIDENCE.filename &&
    manifest.releaseCandidate.databaseMigrationApplied === false,
  "Source truth must split exact live46 from the sole pending provisional repair.",
);
must(
  manifest.edgeDeployment?.functionVersion === 6 &&
    manifest.edgeDeployment.currentRepositorySourceParity === false &&
    manifest.edgeCandidate?.deployed === false,
  "Source truth must split live prompt-v1 Edge v6 from pending prompt-v2 source.",
);

const authorityDocs = [
  "AGENTS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
];
for (const path of authorityDocs) {
  const text = read(path);
  must(!/^(<<<<<<<|=======|>>>>>>>)/mu.test(text), `${path} contains merge markers.`);
  must(
    (text.match(/^## .*\(current authority\)$/gmu) ?? []).length === 1,
    `${path} must contain exactly one current-authority heading.`,
  );
  for (const marker of [
    "LIVE46_HELD_REPAIR_AUTHORITY",
    LOCAL_CANDIDATE_BASE_COMMIT,
    "Sites v39",
    "live46",
    REPAIR_MIGRATION_EVIDENCE.filename,
    "PR #165",
    PR165_DRAFT_CHECKPOINT.openingDraftHead,
    PR165_DRAFT_CHECKPOINT.openingDraftTree,
    LOCAL_CANDIDATE_SOURCE_EVIDENCE.treeSha256,
    REPAIR_MIGRATION_EVIDENCE.candidateTreeSha256,
    REPAIR_MIGRATION_EVIDENCE.sha256,
    APPLICATION_QUALITY_EVIDENCE.ownerFixtureSha256,
    "non-final",
    "clean-chain migration apply",
    "full hosted pgTAP",
    "registered mutable-RPC hold",
    "unregistered orphan object",
    "Edge v6",
    "prompt-v2",
  ]) {
    must(text.includes(marker), `${path} is missing current authority marker: ${marker}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log(
    "PASS: current docs split GitHub main, independent Sites v39, live46, held candidate47, partial hosted verification, and live/candidate Edge truth.",
  );
}
