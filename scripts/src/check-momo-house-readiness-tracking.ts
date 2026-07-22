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
    authorizedOneTimeCeilingUsd: number;
    incurredUsd: number;
    recurringSpendAuthorized: boolean;
    providerActivationAuthorized: boolean;
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

must(tracker.schemaVersion === 8, "Momo readiness tracker schema must be 8.");
must(
  tracker.recordKind === "momo_preconnection_readiness",
  "Momo readiness tracker must retain the schema-8 preconnection record kind.",
);
must(
  tracker.restaurant === "Momo's House San Antonio" &&
    /before requesting owner or provider access/i.test(tracker.milestone),
  "Momo readiness tracker restaurant or preconnection milestone drifted.",
);
must(
  /^\d{4}-\d{2}-\d{2}$/.test(tracker.lastReviewedAt),
  "Momo readiness review date is invalid.",
);
must(
  tracker.overallStatus === "blocked" &&
    /fail-closed no-go/i.test(tracker.overallRule) &&
    /no result.*authorizes owner contact, provider access.*public action.*activation/i.test(tracker.overallRule),
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
  "Schema-8 readiness gate fields are incomplete or unexpected.",
);
for (const key of expectedGateKeys) {
  must(tracker.gateState[key] === false, `Momo readiness gate must remain false: ${key}`);
}

const spending = tracker.spendingBoundary;
must(
  spending.authorizedOneTimeCeilingUsd === 20 &&
    spending.incurredUsd === 0 &&
    !spending.recurringSpendAuthorized &&
    !spending.providerActivationAuthorized &&
    /authorization is not an incurred charge/i.test(spending.rule) &&
    /does not authorize recurring spend, provider activation, account connection, publishing, or activation/i.test(spending.rule),
  "Momo spending truth must distinguish the scoped $20 ceiling from $0 incurred and prohibit recurring/provider activation.",
);

must(
  exactKeys(tracker.dimensions, Object.keys(expectedDimensions)),
  "Schema-8 Momo readiness dimensions are incomplete or unexpected.",
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
    tracker.dimensions.provider_access_and_public_actions.blockers.some((item) => /no provider credential/i.test(item)) &&
    tracker.dimensions.activation.blockers.some((item) => /gates are false/i.test(item)),
  "Momo No-Go must name the rehearsal, owner, provider, and activation blockers.",
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

console.log("Momo schema-8 preconnection readiness guardrail passed.");
