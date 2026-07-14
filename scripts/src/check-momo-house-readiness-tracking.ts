import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const trackerPath = resolve(
  root,
  "artifacts/veroxa-sites/app/momo-readiness-tracker.json",
);
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
  foundingPilotOnboardingGate: {
    authority: string;
    manualOperationAllowed: boolean;
    runtimeAiRequired: boolean;
    metaConnectionRequired: boolean;
    googleConnectionRequired: boolean;
    automatedPublishingRequired: boolean;
    ownerContactAuthorized: boolean;
    clientProvisioningAuthorized: boolean;
    readinessDecision: string;
    reason: string;
  };
  releaseEvidenceBoundary: {
    authority: string;
    bundlesCurrentDeploymentIdentity: boolean;
    reviewedManualDeploymentsOnly: boolean;
    databaseChangesRequiredForThisReadinessRecord: boolean;
    rule: string;
  };
  activationState: Record<string, boolean>;
  deployedNoCostFoundation: {
    releaseState: string;
    forwardMigrationApplied: boolean;
    forwardMigrationVerified: boolean;
    sourceParityAuthority: string;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  auditAndTeamRelease: {
    releaseState: string;
    auditV3PartialScoreAndPlanLive: boolean;
    canonicalSourceParityClaimed: boolean;
    simplifiedMomoTeamIALive: boolean;
    pendingProfileRequiresExplicitConsent: boolean;
    createsOperationalClient: boolean;
    newIncrementalSpendApproved: boolean;
  };
  statusDefinitions: Record<string, string>;
  dimensions: Record<
    string,
    {
      label: string;
      required: boolean;
      status: string;
      evidence: string[];
      blockers: string[];
      nextAction: string;
    }
  >;
  otherRestaurants: {
    allowedCapability: string;
    automaticOperationalConversion: boolean;
    readinessTrackingAllowed: boolean;
  };
  costPolicy: { newIncrementalSpendApproved: boolean; rule: string };
};

const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
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

must(tracker.schemaVersion === 6, "Momo readiness tracker schema must be 6.");
must(
  tracker.recordKind === "production_readiness_checkpoint" &&
    tracker.operationalAuthority.includes("Supabase"),
  "Momo readiness tracker must preserve Supabase operational authority.",
);
must(
  tracker.restaurant === "Momo's House San Antonio" &&
    /founding-pilot onboarding gate/i.test(tracker.milestone),
  "Momo readiness tracker restaurant or milestone drifted.",
);
must(
  /^\d{4}-\d{2}-\d{2}$/.test(tracker.lastReviewedAt),
  "Momo readiness review date is invalid.",
);
must(
  tracker.overallStatus === "blocked" &&
    tracker.overallRule.includes("Do not calculate or publish a readiness percentage"),
  "Momo readiness must remain blocked and prohibit synthetic percentages.",
);
must(
  !/readinessPercentage|readinessPercent|completionPercentage|completionPercent/i.test(
    trackerText,
  ),
  "Momo readiness tracker must not contain a synthetic percentage field.",
);

const founding = tracker.foundingPilotOnboardingGate;
must(
  founding.authority === "MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md" &&
    founding.manualOperationAllowed &&
    !founding.runtimeAiRequired &&
    !founding.metaConnectionRequired &&
    !founding.googleConnectionRequired &&
    !founding.automatedPublishingRequired &&
    !founding.ownerContactAuthorized &&
    !founding.clientProvisioningAuthorized &&
    founding.readinessDecision === "no_go" &&
    founding.reason.length > 0,
  "Founding-pilot gate overstates authorization or treats paid automation as required.",
);

const releaseEvidence = tracker.releaseEvidenceBoundary;
must(
  releaseEvidence.authority.includes("VEROXA_DEPLOYMENT_MANIFEST.json") &&
    releaseEvidence.authority.includes("external GitHub, Sites, and Supabase") &&
    !releaseEvidence.bundlesCurrentDeploymentIdentity &&
    releaseEvidence.reviewedManualDeploymentsOnly &&
    !releaseEvidence.databaseChangesRequiredForThisReadinessRecord &&
    /never asserts its own current Sites version/i.test(releaseEvidence.rule) &&
    !/165ff82ab46b0a0985605ffcfb6efa687982eca5|57ccb8d1cce596baf782b03525c80161c11af8f3|sitesCandidatePublished|futureSitesVersion/.test(trackerText),
  "Deployable readiness evidence must remain stable and externalize exact deployment identity.",
);
for (const [name, value] of Object.entries(tracker.activationState)) {
  must(value === false, `Momo activation state must remain false: ${name}`);
}

const deployed = tracker.deployedNoCostFoundation;
must(
  deployed.releaseState === "deployed_foundation_external_release_evidence" &&
    deployed.forwardMigrationApplied &&
    deployed.forwardMigrationVerified &&
    deployed.sourceParityAuthority === "external_release_records" &&
    !deployed.momoClientIdentityProvisioned &&
    !deployed.ownerConfirmedBusinessTruthVerified &&
    !deployed.permissionedMediaVerified &&
    !deployed.externalProvidersConnected &&
    !deployed.externalPublishingVerified &&
    !deployed.activationExecuted,
  "Momo foundation overstates source parity, identity, data, providers, or activation.",
);
const release = tracker.auditAndTeamRelease;
must(
  release.releaseState === "audit_v3_foundation_external_release_evidence" &&
    release.auditV3PartialScoreAndPlanLive &&
    !release.canonicalSourceParityClaimed &&
    release.simplifiedMomoTeamIALive &&
    release.pendingProfileRequiresExplicitConsent &&
    !release.createsOperationalClient &&
    !release.newIncrementalSpendApproved,
  "Audit V3 tracker evidence is incomplete or overstates conversion, parity, or spend.",
);

must(
  JSON.stringify(Object.keys(tracker.dimensions).sort()) ===
    JSON.stringify([...requiredDimensions].sort()),
  "Momo readiness dimensions are incomplete or unexpected.",
);
for (const key of requiredDimensions) {
  const dimension = tracker.dimensions[key];
  must(dimension.required, `Momo readiness dimension must remain required: ${key}`);
  must(
    Boolean(dimension.label) && Boolean(dimension.nextAction),
    `Momo readiness dimension is incomplete: ${key}`,
  );
  must(allowedStatuses.has(dimension.status), `Invalid dimension status: ${key}`);
  must(dimension.evidence.length > 0, `Dimension must cite evidence: ${key}`);
  must(
    dimension.status !== "verified" || dimension.blockers.length === 0,
    `Verified dimension cannot retain blockers: ${key}`,
  );
  must(
    dimension.status !== "blocked" || dimension.blockers.length > 0,
    `Blocked dimension must name blockers: ${key}`,
  );
}
must(
  tracker.dimensions.production_foundation.status === "verified" &&
    tracker.dimensions.production_foundation.blockers.length === 0 &&
    tracker.dimensions.team_identity_and_access.status === "verified" &&
    tracker.dimensions.activation_and_recovery.status === "blocked",
  "Readiness dimensions must separate the verified platform foundation from blocked Momo activation.",
);
must(
  !requiredDimensions.every(
    (key) => tracker.dimensions[key].status === "verified",
  ),
  "Momo readiness cannot be fully verified while locked blockers remain.",
);

must(
  tracker.otherRestaurants.allowedCapability ===
    "Restaurant Audit Center + explicit-consent non-operational pending profile only" &&
    !tracker.otherRestaurants.automaticOperationalConversion &&
    !tracker.otherRestaurants.readinessTrackingAllowed,
  "Momo readiness tracker drifted into multi-restaurant operations.",
);
must(
  !tracker.costPolicy.newIncrementalSpendApproved &&
    tracker.costPolicy.rule.includes("no-new-spend"),
  "Momo readiness tracker must preserve the free-first boundary.",
);

for (const file of [
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
]) {
  const source = readFileSync(resolve(root, file), "utf8");
  must(source.includes("momo-readiness-tracker.json"), `${file} must reference the readiness tracker.`);
}

if (failures.length) {
  console.error("Momo House readiness tracking guardrail failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Momo founding-pilot readiness tracking guardrail passed.");
