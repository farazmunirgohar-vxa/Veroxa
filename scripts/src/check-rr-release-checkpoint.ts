import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const checkpointPath = resolve(root, "artifacts/veroxa/docs/RR_RELEASE_CHECKPOINT.json");
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8")) as {
  schemaVersion: number;
  checkpoint: string;
  status: string;
  deployedOperationalRelease: {
    pullRequest: number;
    reviewedHead: string;
    mergedOperationalCommit: string;
    sitesCheckoutSourceCommit: string;
    databaseApplied: boolean;
    databaseVerified: boolean;
    productionMigrations: number;
    sitesProductionVerified: boolean;
    sitesVersion: number;
    customDomainsVerified: boolean;
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
  runtimeVerification: {
    teamIdentityProvisioned: boolean;
    authenticatedProtectedRouteVerified: boolean;
    passwordSignInVerifiedByUser: boolean;
    hostedReauthenticationVerified: boolean;
    oldSessionRevocationVerified: boolean;
    momoClientIdentityProvisioned: boolean;
    ownerConfirmedBusinessTruthVerified: boolean;
    permissionedMediaVerified: boolean;
    externalProvidersConnected: boolean;
    externalPublishingVerified: boolean;
    activationExecuted: boolean;
  };
  scope: { operationalRestaurant: string; otherRestaurantCapability: string; automaticProspectConversion: boolean };
  databaseMigrations: string[];
  reusableEvidence: string[];
  fullReviewTriggers: string[];
  activationGates: string[];
  boundaryGroups: Record<string, { review: string; files: string[]; sha256: string }>;
};

const expectedRelease = {
  pullRequest: 145,
  reviewedHead: "b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d",
  mergedOperationalCommit: "9aa74631e393bc0303c820cc7671f818d617778c",
  sitesCheckoutSourceCommit: "4bef697e230791403211cb9c60f769ebcb4f39c7",
  sitesVersion: 11,
  productionMigrations: 10,
  auditV2MigrationVersion: "20260713212046",
  auditV2MigrationSha256: "f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693",
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

if (checkpoint.schemaVersion !== 3 || checkpoint.status !== "production_verified") {
  throw new Error("RR checkpoint schema/status is invalid");
}
if (checkpoint.checkpoint !== "momo-team-audit-v2-pr145-production-verified") {
  throw new Error("RR checkpoint must record the verified PR #145 / Supabase 10 / Sites version 11 release");
}
const release = checkpoint.deployedOperationalRelease;
if (
  release.pullRequest !== expectedRelease.pullRequest ||
  release.reviewedHead !== expectedRelease.reviewedHead ||
  release.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  release.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  !release.databaseApplied ||
  !release.databaseVerified ||
  release.productionMigrations !== expectedRelease.productionMigrations ||
  release.sitesVersion !== expectedRelease.sitesVersion ||
  !release.sitesProductionVerified ||
  !release.customDomainsVerified
) {
  throw new Error("RR checkpoint source does not match the verified PR #145 / Sites version 11 / ten-migration release");
}
const auditAndTeam = checkpoint.auditAndTeamRelease;
if (
  auditAndTeam.releaseState !== "merged_applied_published_verified" ||
  auditAndTeam.pullRequest !== expectedRelease.pullRequest ||
  auditAndTeam.reviewedHead !== expectedRelease.reviewedHead ||
  auditAndTeam.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  auditAndTeam.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  auditAndTeam.sitesVersion !== expectedRelease.sitesVersion ||
  auditAndTeam.productionMigrations !== expectedRelease.productionMigrations ||
  !auditAndTeam.databaseVerified ||
  !auditAndTeam.customDomainsVerified ||
  auditAndTeam.auditV2MigrationVersion !== expectedRelease.auditV2MigrationVersion ||
  auditAndTeam.auditV2MigrationSha256 !== expectedRelease.auditV2MigrationSha256 ||
  !auditAndTeam.auditScoreAndPlanLive ||
  !auditAndTeam.simplifiedMomoTeamIALive ||
  !auditAndTeam.pendingProfileRequiresExplicitConsent ||
  auditAndTeam.createsOperationalClient ||
  auditAndTeam.newIncrementalSpendApproved
) {
  throw new Error("RR checkpoint Audit V2/Team release evidence is incomplete or overstates activation/spend authority");
}
if (
  !checkpoint.runtimeVerification.teamIdentityProvisioned ||
  !checkpoint.runtimeVerification.authenticatedProtectedRouteVerified ||
  !checkpoint.runtimeVerification.passwordSignInVerifiedByUser ||
  checkpoint.runtimeVerification.hostedReauthenticationVerified ||
  checkpoint.runtimeVerification.oldSessionRevocationVerified ||
  checkpoint.runtimeVerification.momoClientIdentityProvisioned ||
  checkpoint.runtimeVerification.ownerConfirmedBusinessTruthVerified ||
  checkpoint.runtimeVerification.permissionedMediaVerified ||
  checkpoint.runtimeVerification.externalProvidersConnected ||
  checkpoint.runtimeVerification.externalPublishingVerified ||
  checkpoint.runtimeVerification.activationExecuted
) {
  throw new Error("RR checkpoint runtime verification overstates or understates the approved Team/password and blocked Momo boundary");
}
if (
  checkpoint.scope.operationalRestaurant !== "Momo's House San Antonio" ||
  checkpoint.scope.otherRestaurantCapability !==
    "Restaurant Audit Center + explicit-consent non-operational pending profile only" ||
  checkpoint.scope.automaticProspectConversion !== false
) {
  throw new Error("RR checkpoint drifted from the locked Momo-only operating scope");
}
if (checkpoint.fullReviewTriggers.length < 4) throw new Error("RR checkpoint review triggers are incomplete");
if (checkpoint.reusableEvidence.some((item) => /unmerged|undeployed|candidate/i.test(item))) {
  throw new Error("Verified RR evidence retains stale candidate language");
}
for (const marker of [
  "authenticated Team/Momo protected route",
  "No Momo owner truth or media rights may be invented",
  "inactive pending authorized access",
]) {
  if (!checkpoint.activationGates.some((gate) => gate.includes(marker))) {
    throw new Error(`RR checkpoint activation truth missing: ${marker}`);
  }
}
if (!checkpoint.activationGates.some((gate) => /Hosted reauthentication and old-session revocation remain unverified/i.test(gate))) {
  throw new Error("RR checkpoint must preserve the unverified reauthentication/session-revocation boundary");
}

const activeMigrations = readdirSync(resolve(root, "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
if (JSON.stringify(activeMigrations) !== JSON.stringify([...checkpoint.databaseMigrations].sort())) {
  throw new Error("RR checkpoint migration inventory does not match the active migration chain");
}

const auth = readFileSync(resolve(root, "artifacts/veroxa-sites/app/veroxa-supabase.ts"), "utf8");
const password = readFileSync(resolve(root, "artifacts/veroxa-sites/app/veroxa-password.mjs"), "utf8");
const route = readFileSync(resolve(root, "artifacts/veroxa-sites/app/[...slug]/page.tsx"), "utf8");
const milestone = readFileSync(resolve(root, "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md"), "utf8");
const releaseDocuments = [
  "AGENTS.md",
  "artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md",
  "artifacts/veroxa/docs/CURRENT_BUILD_STATUS.md",
  "artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md",
  "artifacts/veroxa/docs/RR_CHECKPOINT.md",
  "artifacts/veroxa/docs/README_CURRENT_STATE.md",
  "artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md",
].map((file) => {
  const text = readFileSync(resolve(root, file), "utf8");
  const historicalBoundary = text.search(/\n## (?:Historical|2026-06-)/);
  return {
    file,
    text,
    currentText: historicalBoundary > 0 ? text.slice(0, historicalBoundary) : text.slice(0, 20_000),
  };
});
const readinessBaseline = JSON.parse(
  readFileSync(resolve(root, "artifacts/veroxa-sites/app/momo-readiness-tracker.json"), "utf8"),
) as {
  schemaVersion: number;
  recordKind: string;
  operationalAuthority: string;
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
  otherRestaurants: {
    allowedCapability: string;
    automaticOperationalConversion: boolean;
    readinessTrackingAllowed: boolean;
  };
  costPolicy: { newIncrementalSpendApproved: boolean };
};

for (const { file, currentText } of releaseDocuments) {
  for (const marker of [
    "PR #145",
    expectedRelease.reviewedHead,
    expectedRelease.mergedOperationalCommit,
    expectedRelease.sitesCheckoutSourceCommit,
    "Sites version 11",
    expectedRelease.auditV2MigrationVersion,
    expectedRelease.auditV2MigrationSha256,
  ]) {
    if (!currentText.includes(marker)) throw new Error(`${file} is missing current verified release marker: ${marker}`);
  }
  const finalRelease = currentText.indexOf("PR #145");
  const staleRelease = [currentText.indexOf("PR #143"), currentText.indexOf("PR #144")]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (finalRelease < 0 || (staleRelease !== undefined && finalRelease > staleRelease)) {
    throw new Error(`${file} must lead with PR #145 / Supabase 10 / Sites version 11 before superseded release text`);
  }
}
const milestoneCurrent = releaseDocuments.find(({ file }) => file.endsWith("VEROXA_CURRENT_MILESTONE.md"))?.currentText ?? "";
for (const marker of [
  "1. **Source and delivery reconciliation:**",
  "2. **Client identity and onboarding:**",
  "3. **Media and rights:**",
  "4. **Manual content:**",
  "5. **Operations, reports, and recovery:**",
  "6. **Meta and Google preflight:**",
  "7. **Atomic final rehearsal:**",
]) {
    if (!milestoneCurrent.includes(marker)) throw new Error(`Exact deployed no-new-spend seven-step sequence is missing: ${marker}`);
}
const currentReleaseText = releaseDocuments.map(({ currentText }) => currentText).join("\n");
for (const stale of [
  "Real Team provisioning is blocked external authority",
  "Authenticated Team and Momo browser smoke remain unverified",
  "no corresponding V1 Auth profile/membership",
]) {
  if (currentReleaseText.includes(stale)) throw new Error(`Current release docs retain superseded Team-access truth: ${stale}`);
}
const readinessOperational = readinessBaseline.lastVerifiedOperationalRelease;
const readinessDeployed = readinessBaseline.deployedNoCostFoundation;
const readinessAuditAndTeam = readinessBaseline.auditAndTeamRelease;
if (
  readinessBaseline.schemaVersion !== 3 ||
  readinessBaseline.recordKind !== "production_readiness_checkpoint" ||
  !readinessBaseline.operationalAuthority.includes("Supabase") ||
  readinessOperational.pullRequest !== expectedRelease.pullRequest ||
  readinessOperational.reviewedHead !== expectedRelease.reviewedHead ||
  readinessOperational.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  readinessOperational.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  readinessOperational.sitesVersion !== expectedRelease.sitesVersion ||
  readinessOperational.productionMigrations !== expectedRelease.productionMigrations ||
  !readinessOperational.databaseVerified ||
  !readinessOperational.customDomainsVerified ||
  readinessDeployed.releaseState !== "merged_applied_published_verified" ||
  !readinessDeployed.forwardMigrationApplied ||
  !readinessDeployed.forwardMigrationVerified ||
  readinessDeployed.momoClientIdentityProvisioned ||
  readinessDeployed.ownerConfirmedBusinessTruthVerified ||
  readinessDeployed.permissionedMediaVerified ||
  readinessDeployed.externalProvidersConnected ||
  readinessDeployed.externalPublishingVerified ||
  readinessDeployed.activationExecuted ||
  readinessAuditAndTeam.releaseState !== "merged_applied_published_verified" ||
  readinessAuditAndTeam.pullRequest !== expectedRelease.pullRequest ||
  readinessAuditAndTeam.reviewedHead !== expectedRelease.reviewedHead ||
  readinessAuditAndTeam.mergedOperationalCommit !== expectedRelease.mergedOperationalCommit ||
  readinessAuditAndTeam.sitesCheckoutSourceCommit !== expectedRelease.sitesCheckoutSourceCommit ||
  readinessAuditAndTeam.sitesVersion !== expectedRelease.sitesVersion ||
  readinessAuditAndTeam.productionMigrations !== expectedRelease.productionMigrations ||
  !readinessAuditAndTeam.databaseVerified ||
  !readinessAuditAndTeam.customDomainsVerified ||
  readinessAuditAndTeam.auditV2MigrationVersion !== expectedRelease.auditV2MigrationVersion ||
  readinessAuditAndTeam.auditV2MigrationSha256 !== expectedRelease.auditV2MigrationSha256 ||
  !readinessAuditAndTeam.auditScoreAndPlanLive ||
  !readinessAuditAndTeam.simplifiedMomoTeamIALive ||
  !readinessAuditAndTeam.pendingProfileRequiresExplicitConsent ||
  readinessAuditAndTeam.createsOperationalClient ||
  readinessAuditAndTeam.newIncrementalSpendApproved ||
  readinessBaseline.otherRestaurants.allowedCapability !==
    "Restaurant Audit Center + explicit-consent non-operational pending profile only" ||
  readinessBaseline.otherRestaurants.automaticOperationalConversion ||
  readinessBaseline.otherRestaurants.readinessTrackingAllowed ||
  readinessBaseline.costPolicy.newIncrementalSpendApproved
) {
  throw new Error("Momo readiness evidence is not reconciled to the verified PR #145 Audit V2/Team release and explicit-consent/no-spend boundary");
}
if (
  !auth.includes("shouldCreateUser: false") ||
  !auth.includes("signInWithPassword") ||
  !auth.includes("updateUser({ password })") ||
  /resetPasswordForEmail|\.auth\.signUp/.test(auth) ||
  !auth.includes('await client.auth.signOut({ scope: "local" }).catch')
) {
  throw new Error("RR checkpoint approved-user password/email-link boundary is incomplete or public signup/recovery drifted");
}
if (
  !password.includes("api.pwnedpasswords.com/range/${prefix}") ||
  !password.includes('"Add-Padding": "true"') ||
  !password.includes("fullHash.slice(0, 5)")
) {
  throw new Error("RR checkpoint Free-plan leaked-password defense-in-depth boundary is incomplete");
}
if (
  !route.includes('const protectedAccount = initialPath === "/account/security"') ||
  !route.includes("getServerVeroxaAccess()")
) {
  throw new Error("RR checkpoint account-security route is not server protected");
}
for (const marker of [
  "Momo's House San Antonio is Veroxa's only operational client",
  "Restaurant Audit Center",
  "does not become an operational client",
]) {
  if (!milestone.includes(marker)) throw new Error(`RR checkpoint scope marker missing: ${marker}`);
}

for (const [name, group] of Object.entries(checkpoint.boundaryGroups)) {
  if (!group.files.length || !group.review) throw new Error(`RR checkpoint group is incomplete: ${name}`);
  if (group.sha256 === "pending") {
    throw new Error(`RR checkpoint fingerprint is pending: ${name}`);
  }
  const actual = groupHash(group.files);
  if (actual !== group.sha256) {
    throw new Error(`RR checkpoint boundary changed; route an exact delta review for: ${name}`);
  }
}

console.log("RR release checkpoint guardrail passed.");
