import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const trackerPath = resolve(root, "artifacts/veroxa-sites/app/momo-readiness-tracker.json");
const trackerText = readFileSync(trackerPath, "utf8");
const tracker = JSON.parse(trackerText) as {
  schemaVersion: number;
  recordKind: string;
  operationalAuthority: string;
  restaurant: string;
  milestone: string;
  overallStatus: string;
  overallRule: string;
  lastReviewedAt: string;
  lastVerifiedOperationalRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    productionMigrations: number;
    databaseVerified: boolean;
    customDomainsVerified: boolean;
  };
  deployedNoCostFoundation: {
    releaseState: string;
    forwardMigrationApplied: boolean;
    forwardMigrationVerified: boolean;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  continuityRelease: {
    pullRequest: number;
    requiredFinalSitesVersion: number;
    deployableSitesSourceChanged: boolean;
    operationalBehaviorChanged: boolean;
    databaseSourceChanged: boolean;
    databaseSchemaChanged: boolean;
    migrationContentChanged: boolean;
    migrationCountChanged: boolean;
    migrationLedgerReconciled: boolean;
    databaseSourceChangeReason: string;
    reconciledMigrationVersion: string;
    reconciledMigrationSha256: string;
    selfCommitEmbedded: boolean;
    sourceIdentityAuthority: string;
    deploymentIdentityAuthority: string;
  };
  statusDefinitions: Record<string, string>;
  dimensions: Record<string, {
    label: string;
    required: boolean;
    status: string;
    evidence: string[];
    blockers: string[];
    nextAction: string;
  }>;
  otherRestaurants: {
    allowedCapability: string;
    automaticOperationalConversion: boolean;
    readinessTrackingAllowed: boolean;
  };
  costPolicy: { newIncrementalSpendApproved: boolean; rule: string };
};

const allowedStatuses = new Set([
  "not_started",
  "foundation_ready",
  "in_progress",
  "blocked",
  "ready_for_review",
  "verified",
]);
const requiredDimensions = [
  "production_foundation",
  "team_identity_and_access",
  "business_truth_and_onboarding",
  "media_and_rights",
  "ai_and_automation",
  "meta_social",
  "google_seo_and_reviews",
  "website_menu_and_ordering",
  "operations_reporting_and_monitoring",
  "activation_and_recovery",
];

if (tracker.schemaVersion !== 2) throw new Error("Momo readiness tracker schema version is invalid");
if (
  tracker.recordKind !== "production_readiness_checkpoint" ||
  !tracker.operationalAuthority.includes("Supabase")
) {
  throw new Error("Momo readiness tracker must preserve Supabase operational authority and release-checkpoint scope");
}
if (tracker.restaurant !== "Momo's House San Antonio") throw new Error("Momo readiness tracker restaurant scope drifted");
if (tracker.milestone !== "Momo's House San Antonio 100% readiness") throw new Error("Momo readiness tracker milestone drifted");
if (!/^\d{4}-\d{2}-\d{2}$/.test(tracker.lastReviewedAt)) throw new Error("Momo readiness tracker review date is invalid");
if (!allowedStatuses.has(tracker.overallStatus)) throw new Error("Momo readiness tracker overall status is invalid");
if (tracker.overallStatus !== "blocked") throw new Error("Momo readiness must remain blocked until every required operating gate is verified");
if (!tracker.overallRule.includes("Do not calculate or publish a readiness percentage")) {
  throw new Error("Momo readiness tracker must prohibit unsupported readiness percentages");
}
if (/readinessPercentage|readinessPercent|completionPercentage|completionPercent/i.test(trackerText)) {
  throw new Error("Momo readiness tracker must not contain a synthetic percentage field");
}
const operational = tracker.lastVerifiedOperationalRelease;
if (
  operational.pullRequest !== 143 ||
  operational.reviewedHead !== "009276dbbf2639dc1eb5296bf62906f9f8ac45f1" ||
  operational.mergedOperationalCommit !== "49a5250d6ce7bd8d78f19e415641563e2260ace8" ||
  operational.sitesCheckoutSourceCommit !== "69871c51f8e80d1802539a6bca52e3ce5b4ff71c" ||
  operational.sitesVersion !== 9 ||
  operational.productionMigrations !== 9 ||
  !operational.databaseVerified ||
  !operational.customDomainsVerified
) {
  throw new Error("Momo readiness tracker must preserve the verified PR #143 / Sites version 9 / nine-migration operational foundation");
}
const deployed = tracker.deployedNoCostFoundation;
if (
  deployed.releaseState !== "merged_applied_published_verified" ||
  !deployed.forwardMigrationApplied ||
  !deployed.forwardMigrationVerified ||
  deployed.momoClientIdentityProvisioned ||
  deployed.ownerConfirmedBusinessTruthVerified ||
  deployed.permissionedMediaVerified ||
  deployed.externalProvidersConnected ||
  deployed.externalPublishingVerified ||
  deployed.activationExecuted
) {
  throw new Error("Momo readiness foundation overstates identity, owner data, providers, publishing, or activation");
}
const continuity = tracker.continuityRelease;
if (
  continuity.pullRequest !== 144 ||
  continuity.requiredFinalSitesVersion !== 10 ||
  !continuity.deployableSitesSourceChanged ||
  continuity.operationalBehaviorChanged ||
  !continuity.databaseSourceChanged ||
  continuity.databaseSchemaChanged ||
  continuity.migrationContentChanged ||
  continuity.migrationCountChanged ||
  !continuity.migrationLedgerReconciled ||
  continuity.databaseSourceChangeReason !== "remote_migration_version_filename_reconciliation_only" ||
  continuity.reconciledMigrationVersion !== "20260713191147" ||
  continuity.reconciledMigrationSha256 !== "07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a" ||
  continuity.selfCommitEmbedded ||
  !continuity.sourceIdentityAuthority.includes("GitHub PR #144 metadata") ||
  !continuity.deploymentIdentityAuthority.includes("Sites version 10 checkpoint metadata") ||
  /\b[0-9a-f]{40}\b/i.test(JSON.stringify(continuity))
) {
  throw new Error("Momo readiness continuity must require external PR #144 / Sites version 10 identity without embedding a future commit");
}
for (const stale of [
  /current branch candidate/i,
  /unapplied ninth/i,
  /pending forward migration/i,
  /not production-applied or published/i,
]) {
  if (stale.test(trackerText)) throw new Error(`Momo readiness tracker retains stale candidate truth: ${stale}`);
}

if (JSON.stringify(Object.keys(tracker.dimensions).sort()) !== JSON.stringify([...requiredDimensions].sort())) {
  throw new Error("Momo readiness tracker dimensions are incomplete or unexpected");
}
for (const key of requiredDimensions) {
  const dimension = tracker.dimensions[key];
  if (!dimension.required) throw new Error(`Momo readiness dimension must remain required: ${key}`);
  if (!dimension.label || !dimension.nextAction) throw new Error(`Momo readiness dimension is incomplete: ${key}`);
  if (!allowedStatuses.has(dimension.status)) throw new Error(`Momo readiness dimension status is invalid: ${key}`);
  if (!dimension.evidence.length) throw new Error(`Momo readiness dimension must cite evidence: ${key}`);
  if (dimension.status === "verified" && dimension.blockers.length) {
    throw new Error(`Verified Momo readiness dimension cannot retain blockers: ${key}`);
  }
  if (dimension.status === "blocked" && !dimension.blockers.length) {
    throw new Error(`Blocked Momo readiness dimension must name blockers: ${key}`);
  }
}
if (
  tracker.dimensions.production_foundation.status !== "verified" ||
  !tracker.dimensions.production_foundation.evidence.some((item) => item.includes("37 of 37 current public veroxa_* base tables force RLS")) ||
  tracker.dimensions.team_identity_and_access.status !== "verified" ||
  tracker.dimensions.activation_and_recovery.status !== "blocked"
) {
  throw new Error("Momo readiness dimensions must preserve the verified production/access foundation and blocked activation boundary");
}

const allRequiredVerified = requiredDimensions.every((key) => tracker.dimensions[key].status === "verified");
if (allRequiredVerified) throw new Error("Momo readiness cannot have every required dimension verified while the locked blockers remain");

if (
  tracker.otherRestaurants.allowedCapability !== "Restaurant Audit Center only" ||
  tracker.otherRestaurants.automaticOperationalConversion !== false ||
  tracker.otherRestaurants.readinessTrackingAllowed !== false
) {
  throw new Error("Momo readiness tracker drifted into multi-restaurant operations");
}
if (tracker.costPolicy.newIncrementalSpendApproved !== false || !tracker.costPolicy.rule.includes("no-new-spend")) {
  throw new Error("Momo readiness tracker must preserve the free-first cost boundary");
}

for (const file of [
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
]) {
  const source = readFileSync(resolve(root, file), "utf8");
  if (!source.includes("momo-readiness-tracker.json")) {
    throw new Error(`${file} must reference the Momo readiness tracker`);
  }
}

console.log("Momo House readiness tracking guardrail passed.");
