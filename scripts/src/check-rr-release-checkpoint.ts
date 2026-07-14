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
  releaseCandidate: {
    manifest: string;
    state: string;
    futureMergedGitHubCommit: null;
    futureSitesVersion: null;
    allFourWorkflowsGreen: boolean;
    zeroUnresolvedReviewThreads: boolean;
    databaseChangesRequired: boolean;
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
  operationalAuthority: string;
  milestone: string;
  overallStatus: string;
  foundingPilotOnboardingGate: {
    manualOperationAllowed: boolean;
    runtimeAiRequired: boolean;
    ownerContactAuthorized: boolean;
    clientProvisioningAuthorized: boolean;
    readinessDecision: string;
  };
  releaseEvidenceBoundary: {
    authority: string;
    bundlesCurrentDeploymentIdentity: boolean;
    reviewedManualDeploymentsOnly: boolean;
    databaseChangesRequiredForThisReadinessRecord: boolean;
    rule: string;
  };
  activationState: Record<string, boolean>;
  auditAndTeamRelease: {
    releaseState: string;
    auditV3PartialScoreAndPlanLive: boolean;
    canonicalSourceParityClaimed: boolean;
    createsOperationalClient: boolean;
    newIncrementalSpendApproved: boolean;
  };
  dimensions: { production_foundation: { status: string; blockers: string[] } };
  otherRestaurants: {
    allowedCapability: string;
    automaticOperationalConversion: boolean;
    readinessTrackingAllowed: boolean;
  };
  costPolicy: { newIncrementalSpendApproved: boolean };
};

type DeploymentManifest = {
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
  releaseCandidate: {
    futureMergedGitHubCommit: null;
    futureSitesVersion: null;
    databaseChangesRequired: boolean;
    sitesPublishRequired: boolean;
    sitesPublished: boolean;
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
must(checkpoint.schemaVersion === 5, "RR checkpoint schema must be 5.");
must(
  checkpoint.checkpoint === "post-release-cleanup-deployed-2026-07-14" &&
    checkpoint.status === "verified_reconciliation_cleanup_deployed",
  "RR checkpoint must identify the deployed PR #149 reconciliation cleanup.",
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
must(
  checkpoint.deployedOperationalRelease.supersededAsLiveBaseline &&
    checkpoint.deployedOperationalRelease.pullRequest === 145 &&
    checkpoint.deployedOperationalRelease.sitesVersion === 11 &&
    checkpoint.deployedOperationalRelease.productionMigrations === 10,
  "The historical PR #145 checkpoint must remain explicit but superseded as live truth.",
);

const candidate = checkpoint.releaseCandidate;
must(
  candidate.manifest === "artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json" &&
    candidate.state === "post_release_cleanup_deployed" &&
    candidate.futureMergedGitHubCommit === null &&
    candidate.futureSitesVersion === null &&
    candidate.allFourWorkflowsGreen &&
    candidate.zeroUnresolvedReviewThreads &&
    !candidate.databaseChangesRequired &&
    candidate.sitesPublishRequired &&
    candidate.sitesCandidatePublished,
  "RR cleanup lifecycle must remain unpredicted, database-neutral, green, reviewed, and deployed.",
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
  "RR Audit V3 evidence must preserve final release parity without overstating conversion or spend.",
);

for (const inactive of [
  "hostedReauthenticationVerified",
  "oldSessionRevocationVerified",
  "auditV3ProductionSaveTransactionVerified",
  "momoClientIdentityProvisioned",
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
  readiness.schemaVersion === 6 &&
    readiness.recordKind === "production_readiness_checkpoint" &&
    readiness.operationalAuthority.includes("Supabase") &&
    readiness.overallStatus === "blocked" &&
    /founding-pilot onboarding gate/i.test(readiness.milestone),
  "Momo readiness record is not the blocked founding-pilot checkpoint.",
);
must(
  readiness.foundingPilotOnboardingGate.manualOperationAllowed &&
    !readiness.foundingPilotOnboardingGate.runtimeAiRequired &&
    !readiness.foundingPilotOnboardingGate.ownerContactAuthorized &&
    !readiness.foundingPilotOnboardingGate.clientProvisioningAuthorized &&
    readiness.foundingPilotOnboardingGate.readinessDecision === "no_go",
  "Momo founding-pilot gate overstates authorization or requires paid AI.",
);
const readinessEvidence = readiness.releaseEvidenceBoundary;
must(
  readinessEvidence.authority.includes("VEROXA_DEPLOYMENT_MANIFEST.json") &&
    !readinessEvidence.bundlesCurrentDeploymentIdentity &&
    readinessEvidence.reviewedManualDeploymentsOnly &&
    !readinessEvidence.databaseChangesRequiredForThisReadinessRecord &&
    /never asserts its own current Sites version/i.test(readinessEvidence.rule),
  "Readiness record must externalize exact deployment evidence and remain stable across checkpoints.",
);
for (const [name, value] of Object.entries(readiness.activationState)) {
  must(value === false, `Readiness activation state must remain false: ${name}`);
}
must(
  readiness.auditAndTeamRelease.releaseState ===
    "audit_v3_foundation_external_release_evidence" &&
    readiness.auditAndTeamRelease.auditV3PartialScoreAndPlanLive &&
    !readiness.auditAndTeamRelease.canonicalSourceParityClaimed &&
    !readiness.auditAndTeamRelease.createsOperationalClient &&
    !readiness.auditAndTeamRelease.newIncrementalSpendApproved &&
    readiness.dimensions.production_foundation.status === "verified" &&
    readiness.dimensions.production_foundation.blockers.length === 0 &&
    !readiness.otherRestaurants.automaticOperationalConversion &&
    !readiness.otherRestaurants.readinessTrackingAllowed &&
    !readiness.costPolicy.newIncrementalSpendApproved,
  "Readiness evidence must keep deployment identity external and client conversion/spend inactive.",
);

const manifest = readJson<DeploymentManifest>(candidate.manifest);
must(
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
    manifest.releaseCandidate.futureMergedGitHubCommit === null &&
    manifest.releaseCandidate.futureSitesVersion === null &&
    !manifest.releaseCandidate.databaseChangesRequired &&
    manifest.releaseCandidate.sitesPublishRequired &&
    manifest.releaseCandidate.sitesPublished,
  "Deployment manifest disagrees with the RR deployed reconciliation state.",
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
const route = readFileSync(
  resolve(root, "artifacts/veroxa-sites/app/[...slug]/page.tsx"),
  "utf8",
);
must(
  auth.includes("shouldCreateUser: false") &&
    auth.includes("signInWithPassword") &&
    auth.includes("updateUser({ password })") &&
    !/resetPasswordForEmail|\.auth\.signUp/.test(auth) &&
    auth.includes('await client.auth.signOut({ scope: "local" }).catch'),
  "Approved-user password/email-link boundary is incomplete or public signup drifted.",
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

console.log("RR production-reconciliation checkpoint guardrail passed.");
