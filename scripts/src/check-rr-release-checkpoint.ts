import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TREE_HASH_ALGORITHM,
  hashTree,
  readDeploymentManifest,
  repoRoot,
  sha256File,
} from "./release-manifest";

type ReleaseProof = {
  evidenceScope?: string;
  supersededAsLiveBaseline?: boolean;
  pullRequest: number;
  reviewedHead?: string;
  githubMainCommit?: string;
  mergedOperationalCommit?: string;
  sitesCheckoutCommit?: string;
  sitesCheckoutSourceCommit?: string;
  sitesVersion: number;
  sourceFileCount: number;
  sourceTreeSha256: string;
  productionMigrationCount?: number;
  productionMigrations?: number;
  migrationTreeSha256: string;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseApplied: boolean;
  databaseVerified: boolean;
  sitesPublished?: boolean;
  sitesVerified?: boolean;
  sitesProductionVerified?: boolean;
  customDomainsVerified: boolean;
  sitesSourceParityVerified: boolean;
  migrationContentParityVerified: boolean;
  migrationFilenameParityVerified: boolean;
};

type HistoricalObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  githubSourceParityVerified: boolean;
  sitesVersion: number;
  sitesCheckoutCommit?: string | null;
  sitesCheckoutSourceCommit?: string | null;
  sourceFileCount: number | null;
  sourceTreeSha256: string | null;
  sitesSourceParityVerified: boolean;
  productionMigrationCount?: number;
  productionMigrations?: number;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseLedgerObserved: boolean;
  databaseAppliedThroughLatestObserved: boolean;
};

type ProductionObservation = {
  observedAt: string;
  evidenceStatus: string;
  canonicalGitHubMainCommit: string;
  githubMainMatchesCandidate: boolean;
  sitesVersion: number;
  sitesCheckoutCommit?: string;
  sitesCheckoutSourceCommit?: string;
  sourceFileCount: number;
  sourceTreeSha256: string;
  candidateSourceMatchesLiveSites: boolean;
  productionMigrationCount?: number;
  productionMigrations?: number;
  migrationTreeSha256: string;
  latestProductionMigration: string;
  latestProductionMigrationSha256: string;
  databaseLedgerObserved: boolean;
  databaseAppliedThroughLatestObserved: boolean;
  candidateMigrationsMatchLiveLedger: boolean;
  fullReleaseGatePassed: boolean;
};

type Candidate = {
  manifest?: string;
  status?: string;
  state?: string;
  actionScope: string;
  basedOnGitHubMainCommit: string;
  pullRequest: number | null;
  githubMerged: boolean;
  futureMergedGitHubCommit: string | null;
  futureSitesVersion: number | null;
  reviewedLocally: boolean;
  localReviewPassed?: boolean;
  allFourWorkflowsGreen?: boolean | null;
  zeroUnresolvedReviewThreads?: boolean | null;
  candidateSourceMatchesLiveSites: boolean;
  candidateMigrationsMatchLiveLedger: boolean;
  githubMainMatchesCandidate: boolean;
  fullReleaseGatePassed: boolean;
  sourceFileCount: number;
  sourceTreeSha256: string;
  migrationFileCount: number;
  migrationTreeSha256: string;
  latestCandidateMigration: string;
  latestCandidateMigrationSha256: string;
  databaseChangesRequired: boolean;
  databaseMigrationApplied: boolean;
  sitesPublishRequired: boolean;
  sitesPublished?: boolean;
  sitesCandidatePublished?: boolean;
};

type BoundaryGroup = {
  review: string;
  files: string[];
  sha256: string;
};

type Checkpoint = {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  reviewedAt: string;
  previousVerifiedRelease: ReleaseProof;
  lastGitHubParityRelease: ReleaseProof;
  historicalProductionObservations: HistoricalObservation[];
  currentProductionObservation: ProductionObservation;
  releaseCandidate: Candidate;
  databaseMigrations: string[];
  reusableEvidence: string[];
  activationGates: string[];
  runtimeVerification: Record<string, unknown>;
  cleanupGate: Record<string, unknown>;
  boundaryGroups: Record<string, BoundaryGroup>;
};

type Manifest = {
  schemaVersion: number;
  recordKind: string;
  releaseState: string;
  canonicalRepository: string;
  canonicalBranch: string;
  sitesProjectId: string;
  previousVerifiedRelease: ReleaseProof;
  lastGitHubParityRelease: ReleaseProof;
  historicalProductionObservations: HistoricalObservation[];
  currentProductionObservation: ProductionObservation;
  releaseCandidate: Candidate;
  source: {
    evidenceScope: string;
    root: string;
    mappingTarget: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
    generatedPathExclusions: string[];
  };
  migrations: {
    evidenceScope: string;
    root: string;
    hashAlgorithm: string;
    fileCount: number;
    treeSha256: string;
  };
  deploymentFreeze: {
    state: string;
    automaticDeploymentsAllowed: boolean;
    allowedDeployment: string;
    releaseCondition: string;
  };
  cleanupState: Record<string, unknown>;
};

const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as T;
}

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(repoRoot, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const expected = {
  githubMain: "302621bf6b9ab78320abe4175b45b56e9e64ae2a",
  sitesCheckout: "b8122642b72e5d4e6e74c379469f2a157781ab3d",
  sitesVersion: 36,
  sourceFileCount: 185,
  sourceTreeSha256:
    "caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7",
  migrationFileCount: 37,
  migrationTreeSha256:
    "9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90",
  latestMigration: "20260802020000_momo_pipeline_query_indexes_v2.sql",
  latestMigrationSha256:
    "106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd",
};

const v22 = {
  pullRequest: 155,
  reviewedHead: "96a6c00857b438b37c2e8d99329c0f556de850a2",
  githubMainCommit: "d1f6a9a78ac54cd5447689d5f8b3d42466daf479",
  sitesCheckout: "83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e",
  sitesVersion: 22,
  sourceFileCount: 93,
  sourceTreeSha256:
    "8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490",
  productionMigrations: 16,
  latestMigration: "20260728044916_momo_media_ai_pilot_v1.sql",
  latestMigrationSha256:
    "efae63b4344570934d1d66b47ef1fce4fcd16343a2fe9dd8352607e0784d09a1",
};

const checkpoint = readJson<Checkpoint>(
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
const manifest = readDeploymentManifest() as unknown as Manifest;
const closeout = readJson<Record<string, unknown>>(
  "artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json",
);

const refreshedManifestState =
  "live_sites_v36_github_reconciliation_fingerprints_refreshed_review_required";
const reviewedManifestState =
  "live_sites_v36_github_reconciliation_reviewed_unmerged";
const refreshedCandidateState =
  "fingerprints_refreshed_review_required_unmerged";
const reviewedCandidateState = "reviewed_locally_unmerged";
const refreshed = checkpoint.status === refreshedManifestState;
const reviewed = checkpoint.status === reviewedManifestState;

must(checkpoint.schemaVersion === 8, "RR checkpoint schema must be 8.");
must(manifest.schemaVersion === 4, "Deployment manifest schema must be 4.");
must(
  checkpoint.checkpoint ===
    "momo-upload-veroxa-ready-v36-github-reconciliation-2026-08-02" &&
    checkpoint.reviewedAt === "2026-08-02",
  "RR checkpoint identity or review date drifted.",
);
must(refreshed || reviewed, "RR checkpoint has an unsafe reconciliation state.");
must(
  manifest.releaseState === checkpoint.status,
  "Manifest and RR reconciliation states disagree.",
);
must(
  manifest.recordKind === "veroxa_production_reconciliation_manifest" &&
    manifest.canonicalRepository === "farazmunirgohar-vxa/Veroxa" &&
    manifest.canonicalBranch === "main" &&
    manifest.sitesProjectId === "appgprj_6a53d07c7c28819182801cf35dfd30de",
  "Canonical repository, branch, Sites project, or manifest kind drifted.",
);

for (const proof of [checkpoint.lastGitHubParityRelease, manifest.lastGitHubParityRelease]) {
  must(
    proof.evidenceScope === "last_github_sites_parity_release" &&
      proof.supersededAsLiveBaseline === true &&
      proof.pullRequest === v22.pullRequest &&
      proof.reviewedHead === v22.reviewedHead &&
      (proof.githubMainCommit ?? proof.mergedOperationalCommit) ===
        v22.githubMainCommit &&
      (proof.sitesCheckoutCommit ?? proof.sitesCheckoutSourceCommit) ===
        v22.sitesCheckout &&
      proof.sitesVersion === v22.sitesVersion &&
      proof.sourceFileCount === v22.sourceFileCount &&
      proof.sourceTreeSha256 === v22.sourceTreeSha256 &&
      (proof.productionMigrationCount ?? proof.productionMigrations) ===
        v22.productionMigrations &&
      proof.latestProductionMigration === v22.latestMigration &&
      proof.latestProductionMigrationSha256 === v22.latestMigrationSha256 &&
      proof.databaseApplied &&
      proof.databaseVerified &&
      (proof.sitesPublished ?? proof.sitesProductionVerified) === true &&
      (proof.sitesVerified ?? proof.sitesProductionVerified) === true &&
      proof.customDomainsVerified &&
      proof.sitesSourceParityVerified &&
      proof.migrationContentParityVerified &&
      proof.migrationFilenameParityVerified,
    "PR #155 / Sites v22 must remain immutable last GitHub/Sites parity evidence.",
  );
}

for (const observations of [
  checkpoint.historicalProductionObservations,
  manifest.historicalProductionObservations,
]) {
  const v18 = observations[0];
  const v18Checkout =
    v18?.sitesCheckoutCommit !== undefined
      ? v18.sitesCheckoutCommit
      : v18?.sitesCheckoutSourceCommit;
  must(
    observations.length === 1 &&
      v18?.observedAt === "2026-07-22" &&
      v18.evidenceStatus === "historical_live_not_source_reconciled" &&
      v18.canonicalGitHubMainCommit ===
        "4f95b30413632b4d30a289c7f4b9011f37a37b80" &&
      !v18.githubSourceParityVerified &&
      v18.sitesVersion === 18 &&
      v18Checkout === null &&
      v18.sourceFileCount === null &&
      v18.sourceTreeSha256 === null &&
      !v18.sitesSourceParityVerified &&
      (v18.productionMigrationCount ?? v18.productionMigrations) === 14 &&
      v18.latestProductionMigration ===
        "20260716035027_momo_preconnection_foundation.sql" &&
      v18.latestProductionMigrationSha256 ===
        "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367" &&
      v18.databaseLedgerObserved &&
      v18.databaseAppliedThroughLatestObserved,
    "Historical Sites v18 drift evidence changed or was erased.",
  );
}

for (const observation of [
  checkpoint.currentProductionObservation,
  manifest.currentProductionObservation,
]) {
  must(
    observation.observedAt === "2026-08-02" &&
      observation.evidenceStatus ===
        "sites_v36_live_github_reconciliation_in_progress" &&
      observation.canonicalGitHubMainCommit === expected.githubMain &&
      !observation.githubMainMatchesCandidate &&
      observation.sitesVersion === expected.sitesVersion &&
      (observation.sitesCheckoutCommit ??
        observation.sitesCheckoutSourceCommit) === expected.sitesCheckout &&
      observation.sourceFileCount === expected.sourceFileCount &&
      observation.sourceTreeSha256 === expected.sourceTreeSha256 &&
      observation.candidateSourceMatchesLiveSites &&
      (observation.productionMigrationCount ??
        observation.productionMigrations) === expected.migrationFileCount &&
      observation.migrationTreeSha256 === expected.migrationTreeSha256 &&
      observation.latestProductionMigration === expected.latestMigration &&
      observation.latestProductionMigrationSha256 ===
        expected.latestMigrationSha256 &&
      observation.databaseLedgerObserved &&
      observation.databaseAppliedThroughLatestObserved &&
      observation.candidateMigrationsMatchLiveLedger &&
      !observation.fullReleaseGatePassed,
    "Sites v36 / 37-migration current production observation drifted.",
  );
}

const candidates = [checkpoint.releaseCandidate, manifest.releaseCandidate];
for (const candidate of candidates) {
  const state = candidate.state ?? candidate.status;
  must(
    state === (reviewed ? reviewedCandidateState : refreshedCandidateState) &&
      candidate.actionScope === "github_reconciliation_candidate" &&
      candidate.basedOnGitHubMainCommit === expected.githubMain &&
      (candidate.pullRequest === null ||
        (Number.isInteger(candidate.pullRequest) && (candidate.pullRequest ?? 0) > 0)) &&
      !candidate.githubMerged &&
      candidate.futureMergedGitHubCommit === null &&
      candidate.futureSitesVersion === null &&
      candidate.reviewedLocally === reviewed &&
      candidate.candidateSourceMatchesLiveSites &&
      candidate.candidateMigrationsMatchLiveLedger &&
      !candidate.githubMainMatchesCandidate &&
      !candidate.fullReleaseGatePassed &&
      candidate.sourceFileCount === expected.sourceFileCount &&
      candidate.sourceTreeSha256 === expected.sourceTreeSha256 &&
      candidate.migrationFileCount === expected.migrationFileCount &&
      candidate.migrationTreeSha256 === expected.migrationTreeSha256 &&
      candidate.latestCandidateMigration === expected.latestMigration &&
      candidate.latestCandidateMigrationSha256 ===
        expected.latestMigrationSha256 &&
      !candidate.databaseChangesRequired &&
      !candidate.databaseMigrationApplied &&
      !candidate.sitesPublishRequired &&
      !(candidate.sitesPublished ?? candidate.sitesCandidatePublished),
    "The GitHub reconciliation candidate state is incoherent or overclaims release actions.",
  );
}
must(
  checkpoint.releaseCandidate.localReviewPassed === reviewed &&
    checkpoint.releaseCandidate.allFourWorkflowsGreen === null &&
    checkpoint.releaseCandidate.zeroUnresolvedReviewThreads === null,
  "Local and hosted review evidence must remain separately scoped.",
);

const sourceTree = hashTree(resolve(repoRoot, manifest.source.root), {
  exclusions: manifest.source.generatedPathExclusions,
});
const migrationTree = hashTree(resolve(repoRoot, manifest.migrations.root), {
  suffix: ".sql",
});
must(
  manifest.source.evidenceScope ===
    "github_reconciliation_candidate_matching_live_sites_v36" &&
    manifest.source.root === "artifacts/veroxa-sites" &&
    manifest.source.mappingTarget === "Sites repository root" &&
    manifest.source.hashAlgorithm === TREE_HASH_ALGORITHM &&
    manifest.source.fileCount === expected.sourceFileCount &&
    manifest.source.treeSha256 === expected.sourceTreeSha256 &&
    sourceTree.fileCount === expected.sourceFileCount &&
    sourceTree.sha256 === expected.sourceTreeSha256,
  `Canonical Sites tree drifted (actual ${sourceTree.fileCount}/${sourceTree.sha256}).`,
);
must(
  manifest.migrations.evidenceScope ===
    "github_reconciliation_candidate_matching_live_ledger_v36" &&
    manifest.migrations.root === "supabase/migrations" &&
    manifest.migrations.hashAlgorithm === TREE_HASH_ALGORITHM &&
    manifest.migrations.fileCount === expected.migrationFileCount &&
    manifest.migrations.treeSha256 === expected.migrationTreeSha256 &&
    migrationTree.fileCount === expected.migrationFileCount &&
    migrationTree.sha256 === expected.migrationTreeSha256 &&
    migrationTree.files.at(-1) === expected.latestMigration &&
    sha256File(resolve(repoRoot, manifest.migrations.root, expected.latestMigration)) ===
      expected.latestMigrationSha256,
  `Canonical migration tree drifted (actual ${migrationTree.fileCount}/${migrationTree.sha256}).`,
);
must(
  JSON.stringify(checkpoint.databaseMigrations) ===
    JSON.stringify(migrationTree.files),
  "RR migration inventory must equal the exact 37-file canonical ledger.",
);
for (const excluded of [
  ".git",
  ".next",
  ".sites-runtime",
  ".vinext",
  ".wrangler",
  "dist",
  "node_modules",
  "outputs",
  "tsconfig.tsbuildinfo",
  "work",
]) {
  must(
    manifest.source.generatedPathExclusions.includes(excluded),
    `Canonical generated-path exclusions are missing ${excluded}.`,
  );
}

const requiredGroups = [
  "database_policy",
  "media_ai_runtime",
  "auth_access",
  "audit_runtime",
  "delivery",
  "product_scope",
  "momo_readiness_tracking",
  "presentation_surfaces",
  "momo_operations_contract",
  "momo_upload_to_ready_runtime",
];
for (const name of requiredGroups) {
  must(Boolean(checkpoint.boundaryGroups[name]), `RR boundary group is missing: ${name}`);
}
for (const [name, group] of Object.entries(checkpoint.boundaryGroups)) {
  must(
    group.review === "full-on-change" ||
      group.review === "evidence-delta-on-change" ||
      group.review === "delta-unless-boundary-crossed",
    `RR boundary group ${name} has an unknown review policy.`,
  );
  must(
    group.files.length === new Set(group.files).size,
    `RR boundary group ${name} contains duplicate files.`,
  );
  for (const file of group.files) {
    must(existsSync(resolve(repoRoot, file)), `RR boundary file is missing: ${file}`);
  }
  if (group.files.every((file) => existsSync(resolve(repoRoot, file)))) {
    must(
      /^[a-f0-9]{64}$/.test(group.sha256) &&
        group.sha256 === groupHash(group.files),
      `RR boundary fingerprint drifted: ${name}`,
    );
  }
}
const databasePolicy = checkpoint.boundaryGroups.database_policy?.files ?? [];
const uploadReady =
  checkpoint.boundaryGroups.momo_upload_to_ready_runtime?.files ?? [];
for (const migration of migrationTree.files) {
  must(
    databasePolicy.includes(`supabase/migrations/${migration}`),
    `database_policy omits active migration ${migration}.`,
  );
}
for (const file of sourceTree.files) {
  must(
    uploadReady.includes(`artifacts/veroxa-sites/${file}`),
    `momo_upload_to_ready_runtime omits Sites source ${file}.`,
  );
}
for (const file of databasePolicy) {
  must(
    uploadReady.includes(file),
    `momo_upload_to_ready_runtime omits database boundary ${file}.`,
  );
}

const runtime = checkpoint.runtimeVerification;
must(
  runtime.openAiCredentialProvisioned === true &&
    runtime.contentAiLifecycleWorkerActive === true &&
    runtime.contentAiWebhookWorkerActive === true &&
    runtime.contentAiRunsObserved === 0 &&
    runtime.contentAiQueueEmpty === true &&
    runtime.contentAiWebhookAndRecoveryBacklogEmpty === true &&
    runtime.veroxaReadyPackagesObserved === 0 &&
    runtime.externalScheduleQueueEmpty === true &&
    runtime.legacyDuplicateJobsConsolidated === 5 &&
    runtime.legacyDuplicateJobsDeleted === 0 &&
    runtime.badMediaAutomaticEditOrResize === false &&
    runtime.externalProvidersConnected === false &&
    runtime.externalPublishingVerified === false &&
    runtime.activationExecuted === false,
  "Runtime verification must preserve the frozen v36 queue, duplicate, and bad-media boundaries.",
);
must(
  checkpoint.activationGates.some((gate) => /unscheduled Veroxa Ready/i.test(gate)) &&
    checkpoint.activationGates.some((gate) => /publishing, scheduling/i.test(gate)),
  "Activation gates must describe internal unscheduled Ready and frozen external actions.",
);
must(
  checkpoint.cleanupGate.branchDeletionCapabilityAvailable === true &&
    checkpoint.cleanupGate.branchDeletionAllowed === false &&
    checkpoint.cleanupGate.vercelShutdownSentinelRequired === true &&
    checkpoint.cleanupGate.externalVercelGitDisconnectionVerified === false,
  "Cleanup capability must not be confused with cleanup authorization.",
);

const closeoutSites = closeout.sites as Record<string, unknown>;
const closeoutGithub = closeout.github as Record<string, unknown>;
const closeoutDatabase = closeout.database as Record<string, unknown>;
const closeoutVerification = closeout.verification as Record<string, unknown>;
const closeoutPipeline = closeout.pipelineBehavior as Record<string, unknown>;
const closeoutSafety = closeout.productionSafetyState as Record<string, unknown>;
must(
  closeout.schemaVersion === 1 &&
    closeout.recordKind === "momo_upload_v36_live_closeout" &&
    closeout.status ===
      "sites_v36_live_external_actions_frozen_github_parity_pending" &&
    closeoutSites.versionNumber === expected.sitesVersion &&
    closeoutSites.checkoutCommit === expected.sitesCheckout &&
    closeoutSites.canonicalSourceFileCount === expected.sourceFileCount &&
    closeoutSites.sourceTreeSha256 === expected.sourceTreeSha256 &&
    closeoutGithub.currentMainCommit === expected.githubMain &&
    closeoutGithub.v36ParitySourceTreeSha256 === expected.sourceTreeSha256 &&
    closeoutGithub.candidateSourceMatchesLiveSites === true &&
    closeoutGithub.githubMainMatchesCandidate === false &&
    closeoutGithub.fullReleaseGatePassed === false &&
    (closeoutGithub.v36ParityPullRequest === null ||
      (typeof closeoutGithub.v36ParityPullRequest === "number" &&
        closeoutGithub.v36ParityPullRequest > 0)) &&
    closeoutGithub.v36ParityMergedCommit === null &&
    closeoutDatabase.productionMigrationCount === expected.migrationFileCount &&
    closeoutDatabase.migrationTreeSha256 === expected.migrationTreeSha256 &&
    closeoutDatabase.candidateMigrationsMatchLiveLedger === true &&
    closeoutDatabase.latestAppliedMigration === expected.latestMigration &&
    closeoutDatabase.latestAppliedMigrationSha256 ===
      expected.latestMigrationSha256 &&
    closeoutVerification.testsPassed === 371 &&
    closeoutVerification.testsTotal === 371 &&
    closeoutPipeline.exactDuplicateHandling ===
      "reuse_one_canonical_exact_byte_identity_while_preserving_each_upload_rights_record_and_audit_lineage" &&
    closeoutPipeline.nearDuplicateMerge === "advisory_only" &&
    closeoutPipeline.badMediaAutomaticEditOrResize === false &&
    closeoutPipeline.readyStateScheduled === false &&
    closeoutPipeline.readyStatePublished === false &&
    closeoutPipeline.teamDefaultWork === "exception_only" &&
    closeoutSafety.allExternalWriteControlsLocked === true &&
    closeoutSafety.momoActivationExecuted === false,
  "The v36 live closeout is incomplete or overclaims GitHub parity, media preparation, or external action.",
);

for (const document of [
  "AGENTS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
]) {
  const text = readFileSync(resolve(repoRoot, document), "utf8");
  must(/Sites v36/i.test(text), `Current governing document lacks Sites v36: ${document}`);
  must(
    /bad media|bad-media|bad image|failing media/i.test(text) &&
      /auto-edit|automatically (?:edit|resize)|does not automatically/i.test(text),
    `Current governing document omits the no-auto-edit bad-media boundary: ${document}`,
  );
}

must(
  manifest.deploymentFreeze.state ===
    "production_frozen_github_reconciliation_review_required" &&
    !manifest.deploymentFreeze.automaticDeploymentsAllowed &&
    /No Sites deployment or database apply is required/.test(
      manifest.deploymentFreeze.allowedDeployment,
    ) &&
    /all four workflows/.test(manifest.deploymentFreeze.releaseCondition) &&
    /stop if any hash differs/.test(manifest.deploymentFreeze.releaseCondition),
  "Deployment freeze must keep reconciliation manual, hash-bound, and fail-closed.",
);

if (failures.length) {
  console.error("RR release checkpoint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `RR checkpoint passed: v22 remains historical GitHub/Sites parity; Sites v36 matches the ${sourceTree.fileCount}-file reconciliation candidate; all ${migrationTree.fileCount} migrations and ${Object.keys(checkpoint.boundaryGroups).length} review boundaries are fingerprinted; external actions remain frozen.`,
);
