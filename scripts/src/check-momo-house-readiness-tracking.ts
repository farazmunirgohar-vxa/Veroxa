import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const trackerPath = resolve(root, "artifacts/veroxa-sites/app/momo-readiness-tracker.json");
const trackerText = readFileSync(trackerPath, "utf8");
const tracker = JSON.parse(trackerText) as {
  schemaVersion: number;
  restaurant: string;
  milestone: string;
  overallStatus: string;
  overallRule: string;
  lastReviewedAt: string;
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

if (tracker.schemaVersion !== 1) throw new Error("Momo readiness tracker schema version is invalid");
if (tracker.restaurant !== "Momo's House San Antonio") throw new Error("Momo readiness tracker restaurant scope drifted");
if (tracker.milestone !== "Momo's House San Antonio 100% readiness") throw new Error("Momo readiness tracker milestone drifted");
if (!/^\d{4}-\d{2}-\d{2}$/.test(tracker.lastReviewedAt)) throw new Error("Momo readiness tracker review date is invalid");
if (!allowedStatuses.has(tracker.overallStatus)) throw new Error("Momo readiness tracker overall status is invalid");
if (!tracker.overallRule.includes("Do not calculate or publish a readiness percentage")) {
  throw new Error("Momo readiness tracker must prohibit unsupported readiness percentages");
}
if (/readinessPercentage|readinessPercent|completionPercentage|completionPercent/i.test(trackerText)) {
  throw new Error("Momo readiness tracker must not contain a synthetic percentage field");
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

const allRequiredVerified = requiredDimensions.every((key) => tracker.dimensions[key].status === "verified");
if (tracker.overallStatus === "verified" && !allRequiredVerified) {
  throw new Error("Overall Momo readiness cannot be verified before every required dimension is verified");
}
if (allRequiredVerified && tracker.overallStatus !== "verified") {
  throw new Error("Overall Momo readiness must become verified when every required dimension is verified");
}

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
