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
  releaseCandidate: {
    manifest: string;
    state: string;
    futureMergedGitHubCommit: null;
    futureSitesVersion: null;
    allFourWorkflowsGreen: boolean;
    zeroUnresolvedReviewThreads: boolean;
    databaseCandidateApplied: boolean;
    sitesCandidatePublished: boolean;
  };
  auditAndTeamRelease: {
    releaseState: string;
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
    vercelShutdownSentinelRequired: boolean;
    externalVercelGitDisconnectionVerified: boolean;
    branchDeletionAllowed: boolean;
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
  observedProductionState: {
    canonicalGitHubMainCommit: string;
    liveSitesVersion: number;
    liveSitesCheckoutSourceCommit: string;
    productionMigrations: number;
    latestMigration: string;
    latestMigrationSha256: string;
    sourceParityVerified: boolean;
  };
  reconciliationCandidate: {
    state: string;
    mergeCommit: null;
    futureSitesVersion: null;
    databaseCandidateApplied: boolean;
    sitesCandidatePublished: boolean;
    deploymentFrozen: boolean;
  };
  activationState: Record<string, boolean>;
  auditAndTeamRelease: {
    releaseState: string;
    auditV3MigrationVersion: string;
    auditV3MigrationSha256: string;
    canonicalSourceParityVerified: boolean;
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
  releaseCandidate: {
    futureMergedGitHubCommit: null;
    futureSitesVersion: null;
    databaseApplied: boolean;
    sitesPublished: boolean;
  };
  activationState: Record<string, boolean>;
  cleanupState: {
    branchDeletionAllowed: boolean;
    legacyViteRemovalAllowed: boolean;
    vercelSentinelRemovalAllowed: boolean;
  };
};

const expected = {
  githubMain: "674e1a7c0d140c9b281029277baeb2e68962dac2",
  sitesCommit: "dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805",
  sitesVersion: 13,
  productionMigrations: 11,
  migration: "20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql",
  migrationVersion: "20260713222721",
  migrationSha: "304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2",
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
must(checkpoint.schemaVersion === 4, "RR checkpoint schema must be 4.");
must(
  checkpoint.checkpoint === "production-reconciliation-candidate-2026-07-14" &&
    checkpoint.status === "candidate_not_merged_not_deployed",
  "RR checkpoint must remain an honest unmerged/undeployed reconciliation candidate.",
);

const observed = checkpoint.observedProductionBaseline;
must(
  observed.canonicalGitHubMainCommit === expected.githubMain &&
    observed.sitesCheckoutSourceCommit === expected.sitesCommit &&
    observed.sitesVersion === expected.sitesVersion &&
    observed.productionMigrations === expected.productionMigrations &&
    observed.latestProductionMigration === expected.migration &&
    observed.latestProductionMigrationSha256 === expected.migrationSha &&
    observed.databaseVerified &&
    observed.customDomainsVerified &&
    !observed.sourceParityVerified,
  "RR checkpoint observed production baseline drifted or falsely claims source parity.",
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
    candidate.state === "candidate_not_merged_not_deployed" &&
    candidate.futureMergedGitHubCommit === null &&
    candidate.futureSitesVersion === null &&
    !candidate.allFourWorkflowsGreen &&
    !candidate.zeroUnresolvedReviewThreads &&
    !candidate.databaseCandidateApplied &&
    !candidate.sitesCandidatePublished,
  "RR candidate must not predict or overstate merge, review, workflow, database, or Sites state.",
);

const audit = checkpoint.auditAndTeamRelease;
must(
  audit.releaseState === "live_ahead_of_canonical_source_reconciliation_required" &&
    audit.sitesCheckoutSourceCommit === expected.sitesCommit &&
    audit.sitesVersion === expected.sitesVersion &&
    audit.productionMigrations === expected.productionMigrations &&
    audit.auditV3MigrationVersion === expected.migrationVersion &&
    audit.auditV3MigrationSha256 === expected.migrationSha &&
    audit.auditV3PartialScoreAndPlanLive &&
    !audit.canonicalSourceParityVerified &&
    audit.pendingProfileRequiresExplicitConsent &&
    !audit.createsOperationalClient &&
    !audit.newIncrementalSpendApproved,
  "RR Audit V3 evidence is incomplete or overstates conversion, parity, or spend authority.",
);

for (const inactive of [
  "hostedReauthenticationVerified",
  "oldSessionRevocationVerified",
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
  checkpoint.cleanupGate.vercelShutdownSentinelRequired &&
    !checkpoint.cleanupGate.externalVercelGitDisconnectionVerified &&
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
  readiness.schemaVersion === 4 &&
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
const readinessObserved = readiness.observedProductionState;
must(
  readinessObserved.canonicalGitHubMainCommit === expected.githubMain &&
    readinessObserved.liveSitesCheckoutSourceCommit === expected.sitesCommit &&
    readinessObserved.liveSitesVersion === expected.sitesVersion &&
    readinessObserved.productionMigrations === expected.productionMigrations &&
    readinessObserved.latestMigration === expected.migration &&
    readinessObserved.latestMigrationSha256 === expected.migrationSha &&
    !readinessObserved.sourceParityVerified,
  "Readiness production observation disagrees with the RR checkpoint.",
);
must(
  readiness.reconciliationCandidate.state === "candidate_not_merged_not_deployed" &&
    readiness.reconciliationCandidate.mergeCommit === null &&
    readiness.reconciliationCandidate.futureSitesVersion === null &&
    !readiness.reconciliationCandidate.databaseCandidateApplied &&
    !readiness.reconciliationCandidate.sitesCandidatePublished &&
    readiness.reconciliationCandidate.deploymentFrozen,
  "Readiness reconciliation candidate overstates release state.",
);
for (const [name, value] of Object.entries(readiness.activationState)) {
  must(value === false, `Readiness activation state must remain false: ${name}`);
}
must(
  readiness.auditAndTeamRelease.releaseState ===
    "live_ahead_of_canonical_source_reconciliation_required" &&
    readiness.auditAndTeamRelease.auditV3MigrationVersion === expected.migrationVersion &&
    readiness.auditAndTeamRelease.auditV3MigrationSha256 === expected.migrationSha &&
    !readiness.auditAndTeamRelease.canonicalSourceParityVerified &&
    !readiness.auditAndTeamRelease.createsOperationalClient &&
    !readiness.auditAndTeamRelease.newIncrementalSpendApproved &&
    readiness.dimensions.production_foundation.status !== "verified" &&
    readiness.dimensions.production_foundation.blockers.length > 0 &&
    !readiness.otherRestaurants.automaticOperationalConversion &&
    !readiness.otherRestaurants.readinessTrackingAllowed &&
    !readiness.costPolicy.newIncrementalSpendApproved,
  "Readiness evidence overstates production parity, client conversion, or spend authority.",
);

const manifest = readJson<DeploymentManifest>(candidate.manifest);
must(
  manifest.releaseState === candidate.state &&
    manifest.observedProductionBaseline.githubMainCommit === expected.githubMain &&
    manifest.observedProductionBaseline.sitesCheckoutCommit === expected.sitesCommit &&
    manifest.observedProductionBaseline.sitesVersion === expected.sitesVersion &&
    manifest.observedProductionBaseline.productionMigrationCount ===
      expected.productionMigrations &&
    manifest.observedProductionBaseline.latestProductionMigration === expected.migration &&
    manifest.observedProductionBaseline.latestProductionMigrationSha256 ===
      expected.migrationSha &&
    !manifest.observedProductionBaseline.sourceParityVerified &&
    manifest.releaseCandidate.futureMergedGitHubCommit === null &&
    manifest.releaseCandidate.futureSitesVersion === null &&
    !manifest.releaseCandidate.databaseApplied &&
    !manifest.releaseCandidate.sitesPublished,
  "Deployment manifest disagrees with the RR production/candidate state.",
);
for (const [name, value] of Object.entries(manifest.activationState)) {
  must(value === false, `Manifest activation state must remain false: ${name}`);
}
must(
  !manifest.cleanupState.branchDeletionAllowed &&
    !manifest.cleanupState.legacyViteRemovalAllowed &&
    !manifest.cleanupState.vercelSentinelRemovalAllowed,
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
  for (const marker of [expected.githubMain, expected.sitesCommit, "Sites version 13"]) {
    must(current.includes(marker), `${file} is missing current reconciliation marker: ${marker}`);
  }
  must(
    /not merged|unmerged/i.test(current) && /not deployed|undeployed|not published/i.test(current),
    `${file} must describe the reconciliation candidate as unmerged and undeployed.`,
  );
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
