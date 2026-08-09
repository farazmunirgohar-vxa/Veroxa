import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const trackerPath = resolve(
  root,
  "artifacts/veroxa-sites/app/momo-readiness-tracker.json",
);
const trackerText = readFileSync(trackerPath, "utf8");

type ReadinessDimension = {
  label: string;
  required: boolean;
  status: string;
  evidence: string[];
  blockers: string[];
  nextAction: string;
};

const tracker = JSON.parse(trackerText) as {
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
  gateState: Record<string, boolean>;
  spendingBoundary: {
    automaticAuthorizationThresholdUsd: number;
    incurredUsd: number;
    standingPerJobSpendAuthorized: boolean;
    subscriptionOrUnboundedSpendAuthorized: boolean;
    providerActivationAuthorized: boolean;
    rule: string;
  };
  mediaAiPilot: {
    scope: string;
    userAuthorizedScopedActivation: boolean;
    openAiCredentialProvisionedServerSide: boolean;
    liveRuntimeEnabled: boolean;
    providerCanaryPassed: boolean;
    realEditPassed: boolean;
    automaticAuthorizationThresholdUsd: number;
    incurredUsd: number;
    standingPerJobSpendAuthorized: boolean;
    subscriptionOrUnboundedSpendAuthorized: boolean;
    currentMomoUploadRightsStatus: string;
    firstRealUseRequiresCurrentRights: boolean;
    firstRealUseRequiresTeamReview: boolean;
    rule: string;
  };
  dimensions: Record<string, ReadinessDimension>;
};

const failures: string[] = [];
const must = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};
const exactKeys = (value: Record<string, unknown>, expected: readonly string[]) =>
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());

const expectedGateKeys = [
  "authenticatedTeamOneClickRehearsalPassed",
  "ownerAuthorityVerified",
  "ownerContactAuthorized",
  "providerAccessAuthorized",
  "providerConnectionsActive",
  "runtimeModelEnabled",
  "publicActionsEnabled",
  "activationAllowed",
] as const;
const expectedDimensions = {
  development_identity_and_data: true,
  database_security_and_controls: true,
  media_editing_and_lineage: true,
  ai_and_automation: true,
  publication_tracking_and_metrics: true,
  seo_workspace: true,
  authenticated_team_rehearsal: true,
  owner_authority_and_consent: false,
  provider_access_and_public_actions: false,
  activation: false,
} as const;
const expectedMediaAiPilotKeys = [
  "scope",
  "userAuthorizedScopedActivation",
  "openAiCredentialProvisionedServerSide",
  "liveRuntimeEnabled",
  "providerCanaryPassed",
  "realEditPassed",
  "automaticAuthorizationThresholdUsd",
  "incurredUsd",
  "standingPerJobSpendAuthorized",
  "subscriptionOrUnboundedSpendAuthorized",
  "currentMomoUploadRightsStatus",
  "firstRealUseRequiresCurrentRights",
  "firstRealUseRequiresTeamReview",
  "rule",
] as const;
const expectedSpendingBoundaryKeys = [
  "automaticAuthorizationThresholdUsd",
  "incurredUsd",
  "standingPerJobSpendAuthorized",
  "subscriptionOrUnboundedSpendAuthorized",
  "providerActivationAuthorized",
  "rule",
] as const;

must(tracker.schemaVersion === 9, "Momo readiness tracker schema must be 9.");
must(
  tracker.recordKind === "momo_preconnection_readiness",
  "Momo readiness tracker must retain the schema-9 preconnection record kind.",
);
must(
  tracker.restaurant === "Momo's House San Antonio" &&
    /before requesting owner or provider access/i.test(tracker.milestone),
  "Momo readiness tracker restaurant or preconnection milestone drifted.",
);
must(
  tracker.lastReviewedAt === "2026-08-09",
  "Momo readiness review date must match the verified media-handoff evidence review.",
);
must(
  tracker.overallStatus === "blocked" &&
    /fail-closed no-go/i.test(tracker.overallRule) &&
    /high-fidelity Media AI automation/i.test(tracker.overallRule) &&
    /does not authorize owner contact, owner-controlled provider access, social or Google connections, a public action, publishing, or Momo activation/i.test(
      tracker.overallRule,
    ),
  "Momo readiness must remain fail-closed No-Go without owner, provider, public-action, or activation authority.",
);
must(
  !/readinessPercentage|readinessPercent|completionPercentage|completionPercent/i.test(trackerText),
  "Momo readiness tracker must not contain a synthetic percentage field.",
);

const identity = tracker.identityBoundary;
must(
  identity.teamAccountRole === "team" &&
    identity.developmentClientAccountRole === "client" &&
    identity.developmentClientAuthority === "development_proxy" &&
    !identity.developmentClientIsOwner &&
    /never approve owner actions, provider access, public content, or activation/i.test(identity.rule),
  "The iCloud Client identity must remain a non-owner development proxy with no consequential authority.",
);

must(
  exactKeys(tracker.gateState, expectedGateKeys),
  "Schema-9 readiness gate fields are incomplete or unexpected.",
);
for (const key of expectedGateKeys) {
  must(tracker.gateState[key] === false, `Momo readiness gate must remain false: ${key}`);
}

const spending = tracker.spendingBoundary;
must(
  exactKeys(
    spending as unknown as Record<string, unknown>,
    expectedSpendingBoundaryKeys,
  ),
  "The Momo spending-boundary fields are incomplete or unexpected.",
);
must(
  spending.automaticAuthorizationThresholdUsd === 20 &&
    spending.incurredUsd === 0 &&
    spending.standingPerJobSpendAuthorized &&
    !spending.subscriptionOrUnboundedSpendAuthorized &&
    !spending.providerActivationAuthorized &&
    /standing per-job spend/i.test(spending.rule) &&
    /no batch runner, subscription, or unbounded spend authority/i.test(
      spending.rule,
    ) &&
    /authorization is not an incurred charge/i.test(spending.rule) &&
    /does not authorize owner-controlled provider accounts, social or Google connections, publishing, or Momo activation/i.test(
      spending.rule,
    ),
  "Momo spending truth must distinguish the per-job $20 authorization threshold from $0 incurred and keep broad provider activation false.",
);

const mediaAiPilot = tracker.mediaAiPilot;
must(
  exactKeys(
    mediaAiPilot as unknown as Record<string, unknown>,
    expectedMediaAiPilotKeys,
  ),
  "The Media AI pilot evidence fields are incomplete or unexpected.",
);
must(
  mediaAiPilot.scope === "image_enhancement_only" &&
    mediaAiPilot.userAuthorizedScopedActivation &&
    mediaAiPilot.openAiCredentialProvisionedServerSide &&
    !mediaAiPilot.liveRuntimeEnabled &&
    !mediaAiPilot.providerCanaryPassed &&
    !mediaAiPilot.realEditPassed,
  "Media AI must remain a user-authorized, server-credentialed Image Enhancement pilot that is not live or provider-proven pre-release.",
);
must(
  mediaAiPilot.automaticAuthorizationThresholdUsd ===
      spending.automaticAuthorizationThresholdUsd &&
    mediaAiPilot.automaticAuthorizationThresholdUsd === 20 &&
    mediaAiPilot.incurredUsd === spending.incurredUsd &&
    mediaAiPilot.incurredUsd === 0 &&
    mediaAiPilot.standingPerJobSpendAuthorized &&
    spending.standingPerJobSpendAuthorized &&
    !mediaAiPilot.subscriptionOrUnboundedSpendAuthorized &&
    !spending.subscriptionOrUnboundedSpendAuthorized,
  "Media AI cost evidence must preserve standing per-job authorization, the $20 threshold, $0 incurred, and no subscription or unbounded spend.",
);
must(
  mediaAiPilot.currentMomoUploadRightsStatus === "expired" &&
    mediaAiPilot.firstRealUseRequiresCurrentRights &&
    mediaAiPilot.firstRealUseRequiresTeamReview &&
    /first real use requires current rights and an approved Team review/i.test(
      mediaAiPilot.rule,
    ),
  "Media AI first use must remain blocked by expired rights until current rights and Team review exist.",
);

must(
  exactKeys(tracker.dimensions, Object.keys(expectedDimensions)),
  "Schema-9 Momo readiness dimensions are incomplete or unexpected.",
);
for (const [key, required] of Object.entries(expectedDimensions)) {
  const dimension = tracker.dimensions[key];
  must(dimension?.required === required, `Momo readiness required flag drifted: ${key}`);
  must(Boolean(dimension?.label) && Boolean(dimension?.nextAction), `Momo readiness dimension is incomplete: ${key}`);
  must(dimension?.status === "blocked", `Fail-closed Momo readiness dimension must remain blocked: ${key}`);
  must((dimension?.evidence.length ?? 0) > 0, `Momo readiness dimension must cite evidence: ${key}`);
  must((dimension?.blockers.length ?? 0) > 0, `Blocked Momo readiness dimension must name blockers: ${key}`);
}

must(
  tracker.dimensions.authenticated_team_rehearsal.blockers.some((item) => /has not completed successfully/i.test(item)) &&
    tracker.dimensions.owner_authority_and_consent.blockers.some((item) => /not been contacted or verified/i.test(item)) &&
    tracker.dimensions.provider_access_and_public_actions.blockers.some((item) => /no owner-controlled provider account, social connection, or Google connection/i.test(item)) &&
    tracker.dimensions.activation.blockers.some((item) => /gates are false/i.test(item)),
  "Momo No-Go must name the rehearsal, owner, provider, and activation blockers.",
);

const aiDimension = tracker.dimensions.ai_and_automation;
must(
  aiDimension.evidence.some((item) => /Momo-only high-fidelity server-side OpenAI Image Enhancement/i.test(item)) &&
    aiDimension.evidence.some((item) => /automatic authorization threshold is \$20 per job.*returned provider usage.*Incurred spend is \$0.*exceed \$20/i.test(item)) &&
    aiDimension.blockers.some((item) => /effective Media AI runtime remains fail-closed.*lifecycle bridge.*authenticated Team preflight/i.test(item)) &&
    aiDimension.blockers.some((item) => /provider canary nor a real image edit has passed/i.test(item)) &&
    aiDimension.blockers.some((item) => /current Momo upload rights are expired.*current rights and an approved Team review/i.test(item)),
  "The AI readiness dimension must preserve the authorized scope, cost truth, fail-closed bridge/preflight boundary, unpassed provider proof, and expired-rights blocker.",
);

for (const obsoleteSchema6Key of [
  "operationalAuthority",
  "foundingPilotOnboardingGate",
  "releaseEvidenceBoundary",
  "activationState",
  "deployedNoCostFoundation",
  "auditAndTeamRelease",
  "statusDefinitions",
  "otherRestaurants",
  "costPolicy",
]) {
  must(
    !Object.prototype.hasOwnProperty.call(tracker, obsoleteSchema6Key),
    `Schema-8 readiness tracker must not restore obsolete schema-6 field: ${obsoleteSchema6Key}`,
  );
}

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

console.log("Momo schema-9 preconnection readiness guardrail passed.");
