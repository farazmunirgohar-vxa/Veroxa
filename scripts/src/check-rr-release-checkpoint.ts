import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as T;
const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

type BoundaryGroup = { review: string; files: string[]; sha256: string };
type Checkpoint = {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  deployedOperationalRelease: {
    supersededAsLiveBaseline: boolean;
    pullRequest: number;
    sitesVersion: number;
    productionMigrations: number;
  };
  observedProductionBaseline: {
    canonicalGitHubMainCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseVerified: boolean;
    customDomainsVerified: boolean;
    sourceParityVerified: boolean;
  };
  verifiedReconciliationRelease: {
    pullRequest: number;
    githubMainCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseVerified: boolean;
    sitesProductionVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  currentVerifiedRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    sitesProductionVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  observedProductionDrift: {
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    githubSourceParityVerified: boolean;
    sitesVersion: number;
    sitesCheckoutSourceCommit: null;
    sourceFileCount: null;
    sourceTreeSha256: null;
    sitesSourceParityVerified: boolean;
    productionMigrations: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    manifest: string;
    state: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    localReviewPassed: boolean;
    allFourWorkflowsGreen: boolean | null;
    zeroUnresolvedReviewThreads: boolean | null;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesCandidatePublished: boolean;
  };
  auditAndTeamRelease: {
    releaseState: string;
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    productionMigrations: number;
    auditV3MigrationVersion: string;
    auditV3MigrationSha256: string;
    auditV3PartialScoreAndPlanLive: boolean;
    canonicalSourceParityVerified: boolean;
    pendingProfileRequiresExplicitConsent: boolean;
    createsOperationalClient: boolean;
    newIncrementalSpendApproved: boolean;
  };
  runtimeVerification: Record<string, boolean>;
  scope: {
    operationalRestaurant: string;
    relationship: string;
    onboardingAuthority: string;
    manualPilotAllowedWhenGatePasses: boolean;
    ownerContactAuthorized: boolean;
    otherRestaurantCapability: string;
    automaticProspectConversion: boolean;
  };
  databaseMigrations: string[];
  fullReviewTriggers: string[];
  activationGates: string[];
  cleanupGate: {
    inventoryReviewed: boolean;
    vercelShutdownSentinelRequired: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    branchDeletionCapabilityAvailable: boolean;
    branchDeletionAllowed: boolean;
    legacyViteArchived: boolean;
    legacyViteRemovalAllowed: boolean;
    requiredBeforeCleanup: string;
  };
  boundaryGroups: Record<string, BoundaryGroup>;
};

type Readiness = {
  schemaVersion: number;
  recordKind: string;
  restaurant: string;
  milestone: string;
  overallStatus: string;
  overallRule: string;
  lastReviewedAt: string;
  identityBoundary: {
    teamAccountRole: string;
    developmentClientAccountRole: string;
    developmentClientAuthority: string;
    developmentClientIsOwner: boolean;
    rule: string;
  };
  spendingBoundary: {
    authorizedOneTimeCeilingUsd: number;
    incurredUsd: number;
    recurringSpendAuthorized: boolean;
    providerActivationAuthorized: boolean;
    rule: string;
  };
  gateState: Record<string, boolean>;
  dimensions: Record<
    string,
    { required: boolean; status: string; evidence: string[]; blockers: string[] }
  >;
};

type DeploymentManifest = {
  schemaVersion: number;
  releaseState: string;
  observedProductionBaseline: {
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    sourceParityVerified: boolean;
  };
  verifiedReconciliationRelease: {
    pullRequest: number;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  currentVerifiedRelease: {
    pullRequest: number;
    reviewedHead: string;
    githubMainCommit: string;
    sitesCheckoutCommit: string;
    sitesVersion: number;
    sourceFileCount: number;
    sourceTreeSha256: string;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    sitesPublished: boolean;
    sitesVerified: boolean;
    customDomainsVerified: boolean;
    sitesSourceParityVerified: boolean;
    migrationContentParityVerified: boolean;
    migrationFilenameParityVerified: boolean;
  };
  observedProductionDrift: {
    observedAt: string;
    evidenceStatus: string;
    canonicalGitHubMainCommit: string;
    githubSourceParityVerified: boolean;
    sitesVersion: number;
    sitesCheckoutCommit: null;
    sourceFileCount: null;
    sourceTreeSha256: null;
    sitesSourceParityVerified: boolean;
    productionMigrationCount: number;
    latestProductionMigration: string;
    latestProductionMigrationSha256: string;
    databaseLedgerObserved: boolean;
    databaseAppliedThroughLatestObserved: boolean;
    candidateParityVerified: boolean;
  };
  releaseCandidate: {
    status: string;
    basedOnGitHubMainCommit: string;
    pullRequest: number | null;
    githubMerged: boolean;
    futureMergedGitHubCommit: string | null;
    futureSitesVersion: number | null;
    reviewedLocally: boolean;
    sourceFileCount: number;
    sourceTreeSha256: string;
    migrationFileCount: number;
    migrationTreeSha256: string;
    latestCandidateMigration: string;
    latestCandidateMigrationSha256: string;
    databaseChangesRequired: boolean;
    databaseMigrationApplied: boolean;
    sitesPublishRequired: boolean;
    sitesPublished: boolean;
  };
  source: {
    evidenceScope: string;
    fileCount: number;
    treeSha256: string;
  };
  migrations: {
    evidenceScope: string;
    fileCount: number;
    treeSha256: string;
  };
  activationState: Record<string, boolean>;
  cleanupState: {
    inventoryReviewed: boolean;
    branchDeletionCapabilityAvailable: boolean;
    branchDeletionAllowed: boolean;
    legacyViteArchived: boolean;
    legacyViteRemovalAllowed: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    vercelShutdownSentinelRequired: boolean;
  };
};

const expected = {
  historical: {
    githubMain: "674e1a7c0d140c9b281029277baeb2e68962dac2",
    sitesCommit: "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
    sitesVersion: 13,
    productionMigrations: 11,
    migration: "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
    migrationVersion: "20260713222721",
    migrationSha: "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
  },
  verified: {
    pullRequest: 149,
    reviewedHead: "0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a",
    githubMain: "9749b68ce2cfc383deeae6aa63c413019ef61385",
    sitesCommit: "e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0",
    sitesVersion: 15,
    sourceFileCount: 55,
    sourceTreeSha256: "ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f",
    productionMigrations: 13,
    migration: "20260714022911_ai_budget_and_momo_manual_pilot_contract.sql",
    migrationSha: "ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d",
  },
  live: {
    githubMain: "4f95b30413632b4d30a289c7f4b9011f37a37b80",
    sitesVersion: 18,
    productionMigrations: 14,
    migration: "20260716035027_momo_preconnection_foundation.sql",
    migrationSha: "9e748a46e050b9b8884a5df46eba6617cac061d075272ab4e233d2c1609fb367",
  },
  current: {
    pullRequest: 152,
    reviewedHead: "b170c4339ae43755f17a19d74107cb75c6b198d3",
    githubMain: "29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7",
    sitesCommit: "aceb17bb446854d48a71e54ba814591cf2c19d33",
    sitesVersion: 20,
    sourceFileCount: 79,
    sourceTreeSha256: "5ae5da11de0ae202d33f31dea08ddd337b0b5323aa857d543f3c259f8662a4c2",
    productionMigrations: 15,
    migration: "20260722000100_momo_client_media_status_v1.sql",
    migrationSha: "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7",
  },
  candidate: {
    sourceFileCount: 79,
    sourceTreeSha256: "5ae5da11de0ae202d33f31dea08ddd337b0b5323aa857d543f3c259f8662a4c2",
    migrationFileCount: 15,
    migrationTreeSha256: "9eb4e5e16e2abea40143dad453bfcc2fcca27de6a7907d1f997af998b5c7dc0a",
    migration: "20260722000100_momo_client_media_status_v1.sql",
    migrationSha: "5cd7444906e5f5184e30cc7594542c71995a372b8143e5097f975d354f0925c7",
  },
};

function groupHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(resolve(root, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const checkpoint = readJson<Checkpoint>(
  "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json",
);
must(checkpoint.schemaVersion === 6, "RR checkpoint schema must be 6.");
must(
  checkpoint.checkpoint === "momo-readiness-copy-sites-v20-published-2026-07-22" &&
    checkpoint.status === "published_sites_v20_no_database_change",
  "RR checkpoint must identify the published Sites v20 no-database-change follow-up.",
);

const observed = checkpoint.observedProductionBaseline;
must(
  observed.canonicalGitHubMainCommit === expected.historical.githubMain &&
    observed.sitesCheckoutSourceCommit === expected.historical.sitesCommit &&
    observed.sitesVersion === expected.historical.sitesVersion &&
    observed.productionMigrations === expected.historical.productionMigrations &&
    observed.latestProductionMigration === expected.historical.migration &&
    observed.latestProductionMigrationSha256 === expected.historical.migrationSha &&
    observed.databaseVerified &&
    observed.customDomainsVerified &&
    !observed.sourceParityVerified,
  "RR checkpoint must preserve the exact pre-PR #148 drift baseline.",
);
const verifiedRelease = checkpoint.verifiedReconciliationRelease;
must(
  verifiedRelease.pullRequest === expected.verified.pullRequest &&
    verifiedRelease.githubMainCommit === expected.verified.githubMain &&
    verifiedRelease.sitesCheckoutSourceCommit === expected.verified.sitesCommit &&
    verifiedRelease.sitesVersion === expected.verified.sitesVersion &&
    verifiedRelease.sourceFileCount === expected.verified.sourceFileCount &&
    verifiedRelease.sourceTreeSha256 === expected.verified.sourceTreeSha256 &&
    verifiedRelease.productionMigrations === expected.verified.productionMigrations &&
    verifiedRelease.latestProductionMigration === expected.verified.migration &&
    verifiedRelease.latestProductionMigrationSha256 === expected.verified.migrationSha &&
    verifiedRelease.databaseVerified &&
    verifiedRelease.sitesProductionVerified &&
    verifiedRelease.customDomainsVerified &&
    verifiedRelease.sitesSourceParityVerified &&
    verifiedRelease.migrationContentParityVerified &&
    verifiedRelease.migrationFilenameParityVerified,
  "RR checkpoint must preserve PR #149 Sites and migration content/filename parity.",
);
const currentRelease = checkpoint.currentVerifiedRelease;
must(
  currentRelease.pullRequest === expected.current.pullRequest &&
    currentRelease.reviewedHead === expected.current.reviewedHead &&
    currentRelease.mergedOperationalCommit === expected.current.githubMain &&
    currentRelease.sitesCheckoutSourceCommit === expected.current.sitesCommit &&
    currentRelease.sitesVersion === expected.current.sitesVersion &&
    currentRelease.sourceFileCount === expected.current.sourceFileCount &&
    currentRelease.sourceTreeSha256 === expected.current.sourceTreeSha256 &&
    currentRelease.productionMigrations === expected.current.productionMigrations &&
    currentRelease.latestProductionMigration === expected.current.migration &&
    currentRelease.latestProductionMigrationSha256 === expected.current.migrationSha &&
    currentRelease.databaseApplied &&
    currentRelease.databaseVerified &&
    currentRelease.sitesProductionVerified &&
    currentRelease.customDomainsVerified &&
    currentRelease.sitesSourceParityVerified &&
    currentRelease.migrationContentParityVerified &&
    currentRelease.migrationFilenameParityVerified,
  "RR checkpoint must preserve the exact PR #152 / Sites v20 / migration-15 live baseline.",
);
must(
  checkpoint.deployedOperationalRelease.supersededAsLiveBaseline &&
    checkpoint.deployedOperationalRelease.pullRequest === 145 &&
    checkpoint.deployedOperationalRelease.sitesVersion === 11 &&
    checkpoint.deployedOperationalRelease.productionMigrations === 10,
  "The historical PR #145 checkpoint must remain explicit but superseded as live truth.",
);

const live = checkpoint.observedProductionDrift;
must(
  live.observedAt === "2026-07-22" &&
    live.evidenceStatus === "observed_live_not_source_reconciled" &&
    live.canonicalGitHubMainCommit === expected.live.githubMain &&
    !live.githubSourceParityVerified &&
    live.sitesVersion === expected.live.sitesVersion &&
    live.sitesCheckoutSourceCommit === null &&
    live.sourceFileCount === null &&
    live.sourceTreeSha256 === null &&
    !live.sitesSourceParityVerified &&
    live.productionMigrations === expected.live.productionMigrations &&
    live.latestProductionMigration === expected.live.migration &&
    live.latestProductionMigrationSha256 === expected.live.migrationSha &&
    live.databaseLedgerObserved &&
    live.databaseAppliedThroughLatestObserved &&
    !live.candidateParityVerified,
  "RR checkpoint must record observed Sites v18 / 14-migration drift without inventing a checkout or live source hash.",
);

const candidate = checkpoint.releaseCandidate;
must(
  candidate.manifest === "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    candidate.state === "published_sites_followup_no_database_change" &&
    candidate.basedOnGitHubMainCommit === "bcd9b9da1796e72c0b9b546e9944a4e7e419c1b4" &&
    candidate.pullRequest === 152 &&
    candidate.githubMerged &&
    candidate.futureMergedGitHubCommit === expected.current.githubMain &&
    candidate.futureSitesVersion === expected.current.sitesVersion &&
    candidate.reviewedLocally &&
    candidate.localReviewPassed &&
    candidate.allFourWorkflowsGreen === true &&
    candidate.zeroUnresolvedReviewThreads === true &&
    candidate.sourceFileCount === expected.candidate.sourceFileCount &&
    candidate.sourceTreeSha256 === expected.candidate.sourceTreeSha256 &&
    candidate.migrationFileCount === expected.candidate.migrationFileCount &&
    candidate.migrationTreeSha256 === expected.candidate.migrationTreeSha256 &&
    candidate.latestCandidateMigration === expected.candidate.migration &&
    candidate.latestCandidateMigrationSha256 === expected.candidate.migrationSha &&
    !candidate.databaseChangesRequired &&
    !candidate.databaseMigrationApplied &&
    candidate.sitesPublishRequired &&
    candidate.sitesCandidatePublished,
  "RR v20 follow-up must remain exact, locally reviewed, merged, published, and no-database-change.",
);

const audit = checkpoint.auditAndTeamRelease;
must(
  audit.releaseState === "verified_reconciliation_cleanup_deployed" &&
    audit.pullRequest === expected.verified.pullRequest &&
    audit.reviewedHead === expected.verified.reviewedHead &&
    audit.mergedOperationalCommit === expected.verified.githubMain &&
    audit.sitesCheckoutSourceCommit === expected.verified.sitesCommit &&
    audit.sitesVersion === expected.verified.sitesVersion &&
    audit.productionMigrations === expected.verified.productionMigrations &&
    audit.auditV3MigrationVersion === expected.historical.migrationVersion &&
    audit.auditV3MigrationSha256 === expected.historical.migrationSha &&
    audit.auditV3PartialScoreAndPlanLive &&
    audit.canonicalSourceParityVerified &&
    audit.pendingProfileRequiresExplicitConsent &&
    !audit.createsOperationalClient &&
    !audit.newIncrementalSpendApproved,
  "Historical PR #149 Audit V3 evidence must remain immutable without overstating conversion or spend.",
);

for (const inactive of [
  "hostedReauthenticationVerified",
  "oldSessionRevocationVerified",
  "auditV3ProductionSaveTransactionVerified",
  "momoRealOwnerClientIdentityProvisioned",
  "ownerConfirmedBusinessTruthVerified",
  "permissionedMediaVerified",
  "aiWebResearchEnabled",
  "openAiCredentialProvisioned",
  "externalProvidersConnected",
  "externalPublishingVerified",
  "activationExecuted",
]) {
  must(checkpoint.runtimeVerification[inactive] === false, `Runtime state must remain false: ${inactive}`);
}
for (const active of [
  "teamIdentityProvisioned",
  "momoDevelopmentProxyClientIdentityProvisioned",
  "authenticatedProtectedRouteVerified",
  "passwordSignInVerifiedByUser",
  "auditV3SaveContractVerified",
]) {
  must(checkpoint.runtimeVerification[active] === true, `Verified runtime state regressed: ${active}`);
}

must(
  checkpoint.scope.operationalRestaurant === "Momo's House San Antonio" &&
    checkpoint.scope.relationship === "agreed_free_founding_pilot" &&
    checkpoint.scope.onboardingAuthority ===
      "MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md" &&
    checkpoint.scope.manualPilotAllowedWhenGatePasses &&
    !checkpoint.scope.ownerContactAuthorized &&
    checkpoint.scope.otherRestaurantCapability ===
      "Restaurant Audit Center + explicit-consent non-operational pending profile only" &&
    !checkpoint.scope.automaticProspectConversion,
  "RR checkpoint drifted from founding-pilot or non-client conversion boundaries.",
);
must(checkpoint.fullReviewTriggers.length >= 4, "RR full-review triggers are incomplete.");
for (const marker of [
  "No Momo owner truth or media rights may be invented",
  "all four workflows",
  "inactive pending exact authorization",
]) {
  must(
    checkpoint.activationGates.some((gate) => gate.includes(marker)),
    `RR activation gate is missing: ${marker}`,
  );
}
must(
  checkpoint.cleanupGate.inventoryReviewed &&
    checkpoint.cleanupGate.legacyViteArchived &&
    checkpoint.cleanupGate.vercelShutdownSentinelRequired &&
    !checkpoint.cleanupGate.externalVercelGitDisconnectionVerified &&
    !checkpoint.cleanupGate.branchDeletionCapabilityAvailable &&
    !checkpoint.cleanupGate.branchDeletionAllowed &&
    !checkpoint.cleanupGate.legacyViteRemovalAllowed &&
    /parity/i.test(checkpoint.cleanupGate.requiredBeforeCleanup) &&
    /rollback/i.test(checkpoint.cleanupGate.requiredBeforeCleanup),
  "RR checkpoint must keep Vercel, branch, and legacy cleanup deferred.",
);

const activeMigrations = readdirSync(resolve(root, "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
must(
  JSON.stringify(activeMigrations) ===
    JSON.stringify([...checkpoint.databaseMigrations].sort()),
  "RR checkpoint migration inventory does not match the candidate migration chain.",
);

const readiness = readJson<Readiness>(
  "artifacts/veroxa-sites/app/momo-readiness-tracker.json",
);
must(
  readiness.schemaVersion === 8 &&
    readiness.recordKind === "momo_preconnection_readiness" &&
    readiness.restaurant === "Momo's House San Antonio" &&
    readiness.overallStatus === "blocked" &&
    readiness.lastReviewedAt === "2026-07-22" &&
    /before requesting owner or provider access/i.test(readiness.milestone) &&
    /fail-closed No-Go/i.test(readiness.overallRule),
  "Momo readiness record is not the current fail-closed preconnection checkpoint.",
);
must(
  readiness.identityBoundary.teamAccountRole === "team" &&
    readiness.identityBoundary.developmentClientAccountRole === "client" &&
    readiness.identityBoundary.developmentClientAuthority === "development_proxy" &&
    !readiness.identityBoundary.developmentClientIsOwner &&
    /temporary development evidence only/i.test(readiness.identityBoundary.rule),
  "Momo readiness must preserve the iCloud development-proxy boundary.",
);
must(
  readiness.spendingBoundary.authorizedOneTimeCeilingUsd === 20 &&
    readiness.spendingBoundary.incurredUsd === 0 &&
    !readiness.spendingBoundary.recurringSpendAuthorized &&
    !readiness.spendingBoundary.providerActivationAuthorized &&
    /Authorization is not an incurred charge/.test(readiness.spendingBoundary.rule),
  "Readiness must distinguish the $20 one-time ceiling from $0 incurred and no provider activation.",
);
for (const [name, value] of Object.entries(readiness.gateState)) {
  must(value === false, `Readiness gate must remain fail-closed: ${name}`);
}
must(
  Object.keys(readiness.dimensions).length >= 10 &&
    Object.values(readiness.dimensions).every(
      (dimension) => dimension.status === "blocked" && dimension.blockers.length > 0,
    ) &&
    readiness.dimensions.authenticated_team_rehearsal?.required === true &&
    readiness.dimensions.owner_authority_and_consent?.required === false,
  "Every readiness dimension must remain blocked with evidence boundaries and required gates distinguished.",
);

const manifest = readJson<DeploymentManifest>(candidate.manifest);
must(
  manifest.schemaVersion === 3 &&
    manifest.releaseState === checkpoint.status &&
    manifest.observedProductionBaseline.githubMainCommit === expected.historical.githubMain &&
    manifest.observedProductionBaseline.sitesCheckoutCommit === expected.historical.sitesCommit &&
    manifest.observedProductionBaseline.sitesVersion === expected.historical.sitesVersion &&
    manifest.observedProductionBaseline.productionMigrationCount ===
      expected.historical.productionMigrations &&
    manifest.observedProductionBaseline.latestProductionMigration ===
      expected.historical.migration &&
    manifest.observedProductionBaseline.latestProductionMigrationSha256 ===
      expected.historical.migrationSha &&
    !manifest.observedProductionBaseline.sourceParityVerified &&
    manifest.verifiedReconciliationRelease.pullRequest === expected.verified.pullRequest &&
    manifest.verifiedReconciliationRelease.githubMainCommit === expected.verified.githubMain &&
    manifest.verifiedReconciliationRelease.sitesCheckoutCommit ===
      expected.verified.sitesCommit &&
    manifest.verifiedReconciliationRelease.sitesVersion === expected.verified.sitesVersion &&
    manifest.verifiedReconciliationRelease.sourceFileCount ===
      expected.verified.sourceFileCount &&
    manifest.verifiedReconciliationRelease.sourceTreeSha256 ===
      expected.verified.sourceTreeSha256 &&
    manifest.verifiedReconciliationRelease.productionMigrationCount ===
      expected.verified.productionMigrations &&
    manifest.verifiedReconciliationRelease.latestProductionMigration ===
      expected.verified.migration &&
    manifest.verifiedReconciliationRelease.latestProductionMigrationSha256 ===
      expected.verified.migrationSha &&
    manifest.verifiedReconciliationRelease.sitesSourceParityVerified &&
    manifest.verifiedReconciliationRelease.migrationContentParityVerified &&
    manifest.verifiedReconciliationRelease.migrationFilenameParityVerified &&
    manifest.currentVerifiedRelease.pullRequest === expected.current.pullRequest &&
    manifest.currentVerifiedRelease.reviewedHead === expected.current.reviewedHead &&
    manifest.currentVerifiedRelease.githubMainCommit === expected.current.githubMain &&
    manifest.currentVerifiedRelease.sitesCheckoutCommit === expected.current.sitesCommit &&
    manifest.currentVerifiedRelease.sitesVersion === expected.current.sitesVersion &&
    manifest.currentVerifiedRelease.sourceFileCount === expected.current.sourceFileCount &&
    manifest.currentVerifiedRelease.sourceTreeSha256 === expected.current.sourceTreeSha256 &&
    manifest.currentVerifiedRelease.productionMigrationCount ===
      expected.current.productionMigrations &&
    manifest.currentVerifiedRelease.latestProductionMigration ===
      expected.current.migration &&
    manifest.currentVerifiedRelease.latestProductionMigrationSha256 ===
      expected.current.migrationSha &&
    manifest.currentVerifiedRelease.databaseApplied &&
    manifest.currentVerifiedRelease.databaseVerified &&
    manifest.currentVerifiedRelease.sitesPublished &&
    manifest.currentVerifiedRelease.sitesVerified &&
    manifest.currentVerifiedRelease.customDomainsVerified &&
    manifest.currentVerifiedRelease.sitesSourceParityVerified &&
    manifest.currentVerifiedRelease.migrationContentParityVerified &&
    manifest.currentVerifiedRelease.migrationFilenameParityVerified &&
    manifest.observedProductionDrift.observedAt === "2026-07-22" &&
    manifest.observedProductionDrift.evidenceStatus ===
      "observed_live_not_source_reconciled" &&
    manifest.observedProductionDrift.canonicalGitHubMainCommit ===
      expected.live.githubMain &&
    !manifest.observedProductionDrift.githubSourceParityVerified &&
    manifest.observedProductionDrift.sitesVersion === expected.live.sitesVersion &&
    manifest.observedProductionDrift.sitesCheckoutCommit === null &&
    manifest.observedProductionDrift.sourceFileCount === null &&
    manifest.observedProductionDrift.sourceTreeSha256 === null &&
    !manifest.observedProductionDrift.sitesSourceParityVerified &&
    manifest.observedProductionDrift.productionMigrationCount ===
      expected.live.productionMigrations &&
    manifest.observedProductionDrift.latestProductionMigration ===
      expected.live.migration &&
    manifest.observedProductionDrift.latestProductionMigrationSha256 ===
      expected.live.migrationSha &&
    manifest.observedProductionDrift.databaseLedgerObserved &&
    manifest.observedProductionDrift.databaseAppliedThroughLatestObserved &&
    !manifest.observedProductionDrift.candidateParityVerified &&
    manifest.releaseCandidate.status ===
      "published_sites_followup_no_database_change" &&
    manifest.releaseCandidate.basedOnGitHubMainCommit === "bcd9b9da1796e72c0b9b546e9944a4e7e419c1b4" &&
    manifest.releaseCandidate.pullRequest === 152 &&
    manifest.releaseCandidate.githubMerged &&
    manifest.releaseCandidate.futureMergedGitHubCommit === expected.current.githubMain &&
    manifest.releaseCandidate.futureSitesVersion === expected.current.sitesVersion &&
    manifest.releaseCandidate.reviewedLocally &&
    manifest.releaseCandidate.sourceFileCount === expected.candidate.sourceFileCount &&
    manifest.releaseCandidate.sourceTreeSha256 === expected.candidate.sourceTreeSha256 &&
    manifest.releaseCandidate.migrationFileCount ===
      expected.candidate.migrationFileCount &&
    manifest.releaseCandidate.migrationTreeSha256 ===
      expected.candidate.migrationTreeSha256 &&
    manifest.releaseCandidate.latestCandidateMigration ===
      expected.candidate.migration &&
    manifest.releaseCandidate.latestCandidateMigrationSha256 ===
      expected.candidate.migrationSha &&
    !manifest.releaseCandidate.databaseChangesRequired &&
    !manifest.releaseCandidate.databaseMigrationApplied &&
    manifest.releaseCandidate.sitesPublishRequired &&
    manifest.releaseCandidate.sitesPublished &&
    manifest.source.evidenceScope === "published_sites_v20" &&
    manifest.source.fileCount === expected.candidate.sourceFileCount &&
    manifest.source.treeSha256 === expected.candidate.sourceTreeSha256 &&
    manifest.migrations.evidenceScope === "current_verified_release" &&
    manifest.migrations.fileCount === expected.candidate.migrationFileCount &&
    manifest.migrations.treeSha256 === expected.candidate.migrationTreeSha256,
  "Deployment manifest disagrees with the historical release, observed drift, or published v20 checkpoint.",
);
for (const [name, value] of Object.entries(manifest.activationState)) {
  must(value === false, `Manifest activation state must remain false: ${name}`);
}
must(
  manifest.cleanupState.inventoryReviewed &&
    !manifest.cleanupState.branchDeletionCapabilityAvailable &&
    !manifest.cleanupState.branchDeletionAllowed &&
    manifest.cleanupState.legacyViteArchived &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.externalVercelGitDisconnectionVerified &&
    manifest.cleanupState.vercelShutdownSentinelRequired,
  "Deployment manifest must keep cleanup deferred.",
);

const currentDocuments = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
];
for (const file of currentDocuments) {
  const current = readFileSync(resolve(root, file), "utf8").slice(0, 14_000);
  for (const marker of [
    expected.verified.githubMain,
    expected.verified.sitesCommit,
    "Sites version 15",
    expected.verified.sourceTreeSha256,
  ]) {
    must(current.includes(marker), `${file} is missing current reconciliation marker: ${marker}`);
  }
  must(/deployed|published/i.test(current), `${file} must describe PR #149 / Sites v15 as deployed.`);
}

const milestone = readFileSync(
  resolve(root, "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md"),
  "utf8",
);
for (const marker of [
  "founding pilot",
  "secure, persistent, human-controlled Momo operating loop",
  "Runtime AI, Meta, Google, and automated publishing are modular later activations",
  "Momo's House San Antonio is the only operational restaurant scope",
]) {
  must(milestone.includes(marker), `Current milestone marker missing: ${marker}`);
}

const auth = readFileSync(
  resolve(root, "artifacts/veroxa-sites/app/veroxa-supabase.ts"),
  "utf8",
);
const password = readFileSync(
  resolve(root, "artifacts/veroxa-sites/app/veroxa-password.mjs"),
  "utf8",
);
const passwordUpdate = readFileSync(
  resolve(root, "artifacts/veroxa-sites/app/veroxa-password-update.ts"),
  "utf8",
);
const route = readFileSync(
  resolve(root, "artifacts/veroxa-sites/app/[...slug]/page.tsx"),
  "utf8",
);
must(
  auth.includes("shouldCreateUser: false") &&
    auth.includes("signInWithPassword") &&
    !/resetPasswordForEmail|\.auth\.signUp/.test(auth) &&
    auth.includes('await client.auth.signOut({ scope: "local" }).catch'),
  "Approved-user password/email-link boundary is incomplete or public signup drifted.",
);
must(
  passwordUpdate.includes("getUser()") &&
    passwordUpdate.includes("last_sign_in_at") &&
    passwordUpdate.includes("isVeroxaPasswordCompromised") &&
    passwordUpdate.includes("updateUser({ password })") &&
    passwordUpdate.includes('signOut({ scope: "others" })') &&
    passwordUpdate.includes("otherRefreshSessionsRevoked: !revocationError") &&
    passwordUpdate.includes("otherRefreshSessionsRevoked: false"),
  "Shared hardened password-update boundary is incomplete or overclaims refresh-session revocation.",
);
must(
  password.includes("api.pwnedpasswords.com/range/${prefix}") &&
    password.includes('"Add-Padding": "true"') &&
    password.includes("fullHash.slice(0, 5)"),
  "Free-plan leaked-password defense-in-depth boundary is incomplete.",
);
must(
  route.includes('const protectedAccount = initialPath === "/account/security"') &&
    route.includes("getServerVeroxaAccess()"),
  "Account-security route is not server protected.",
);

for (const [name, group] of Object.entries(checkpoint.boundaryGroups)) {
  must(group.files.length > 0 && Boolean(group.review), `RR boundary group is incomplete: ${name}`);
  must(group.sha256 !== "pending", `RR boundary fingerprint is pending: ${name}`);
  try {
    must(groupHash(group.files) === group.sha256, `RR boundary changed; review exact delta: ${name}`);
  } catch (error) {
    failures.push(`RR boundary cannot be read (${name}): ${String(error)}`);
  }
}

if (failures.length) {
  console.error("RR release checkpoint guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "RR release-evidence checkpoint passed: historical PR #149 and observed v18 drift are preserved, PR #152 / Sites v20 is current, and the Sites-only follow-up is published with no database change.",
);
