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
  auditAndTeamRelease: {
    releaseState: string;
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    sitesVersion: number;
    productionMigrations: number;
    databaseVerified: boolean;
    customDomainsVerified: boolean;
    auditV2MigrationVersion: string;
    auditV2MigrationSha256: string;
    auditScoreAndPlanLive: boolean;
    simplifiedMomoTeamIALive: boolean;
    pendingProfileRequiresExplicitConsent: boolean;
    createsOperationalClient: boolean;
    newIncrementalSpendApproved: boolean;
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

if (tracker.schemaVersion !== 3) throw new Error("Momo readiness tracker schema version is invalid");
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
  operational.pullRequest !== 145 ||
  operational.reviewedHead !== "b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d" ||
  operational.mergedOperationalCommit !== "9aa74631e393bc0303c820cc7671f818d617778c" ||
  operational.sitesCheckoutSourceCommit !== "4bef697e230791403211cb9c60f769ebcb4f39c7" ||
  operational.sitesVersion !== 11 ||
  operational.productionMigrations !== 10 ||
  !operational.databaseVerified ||
  !operational.customDomainsVerified
) {
  throw new Error("Momo readiness tracker must preserve the verified PR #145 / Sites version 11 / ten-migration operational release");
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
const release = tracker.auditAndTeamRelease;
if (
  release.releaseState !== "merged_applied_published_verified" ||
  release.pullRequest !== 145 ||
  release.reviewedHead !== "b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d" ||
  release.mergedOperationalCommit !== "9aa74631e393bc0303c820cc7671f818d617778c" ||
  release.sitesCheckoutSourceCommit !== "4bef697e230791403211cb9c60f769ebcb4f39c7" ||
  release.sitesVersion !== 11 ||
  release.productionMigrations !== 10 ||
  !release.databaseVerified ||
  !release.customDomainsVerified ||
  release.auditV2MigrationVersion !== "20260713212046" ||
  release.auditV2MigrationSha256 !== "f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693" ||
  !release.auditScoreAndPlanLive ||
  !release.simplifiedMomoTeamIALive ||
  !release.pendingProfileRequiresExplicitConsent ||
  release.createsOperationalClient ||
  release.newIncrementalSpendApproved
) {
  throw new Error("Momo readiness release evidence must match verified PR #145, migration 10, and Sites version 11 without creating another operational client or approving spend");
}
if (trackerText.includes('"continuityRelease"')) {
  throw new Error("Momo readiness tracker retains the superseded PR #144 continuity target");
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
  !tracker.dimensions.production_foundation.evidence.some((item) => item.includes("Ten production migrations are applied")) ||
  !tracker.dimensions.production_foundation.evidence.some((item) => item.includes("Sites version 11")) ||
  tracker.dimensions.team_identity_and_access.status !== "verified" ||
  tracker.dimensions.activation_and_recovery.status !== "blocked"
) {
  throw new Error("Momo readiness dimensions must preserve the verified production/access foundation and blocked activation boundary");
}

const allRequiredVerified = requiredDimensions.every((key) => tracker.dimensions[key].status === "verified");
if (allRequiredVerified) throw new Error("Momo readiness cannot have every required dimension verified while the locked blockers remain");

if (
  tracker.otherRestaurants.allowedCapability !== "Restaurant Audit Center + explicit-consent non-operational pending profile only" ||
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
